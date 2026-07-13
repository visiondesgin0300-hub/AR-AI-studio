import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Map as MapIcon, ChevronRight, Compass, Camera, X, Box, MoveUp, ShieldCheck, User as UserIcon, ScanLine, Search as SearchIcon, BookOpen, Trophy, Clock, Sparkles } from 'lucide-react';
import { MOCK_BOOKS } from '../data/mockData';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../hooks/useLanguage';
import * as THREE from 'three';
import { ArToolkitSource, ArToolkitContext, ArMarkerControls } from '@ar-js-org/ar.js/three.js/build/ar-threex.mjs';
import { getMarkerForShelf, MARKER_PHYSICAL_SIZE_METERS } from '../lib/arMarkers';
import { BadgesCabinet } from '../components/BadgesCabinet';

import { Book, User } from '../types';

interface ArViewProps {
  book: Book;
  onClose: () => void;
  key?: string | number;
}

function ArView({ book, onClose }: ArViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [markerFound, setMarkerFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t, dir } = useLanguage();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const markerValue = getMarkerForShelf(book.shelf);
    if (markerValue === undefined) {
      setError(t('markerNotConfigured'));
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(t('cameraUnsupported'));
      return;
    }

    let disposed = false;
    let rafId = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    let arToolkitContext: InstanceType<typeof ArToolkitContext> | null = null;
    let arToolkitSource: InstanceType<typeof ArToolkitSource> | null = null;
    let resize = () => {};

    // Last-resort safety net: catches errors AR.js throws inside its own async
    // callbacks (camera-ready, context-ready), which run after this effect's
    // synchronous try/catch has already exited and would otherwise go uncaught.
    const onUnexpectedError = (event: ErrorEvent | PromiseRejectionEvent) => {
      if (disposed) return;
      const reason = 'reason' in event ? event.reason : event.error;
      const message = reason instanceof Error ? reason.message : String(reason ?? 'unknown error');
      setError(t('arSetupFailed', { error: message }));
    };
    window.addEventListener('error', onUnexpectedError);
    window.addEventListener('unhandledrejection', onUnexpectedError);

    async function setup() {
      // AR.js only ever requests facingMode:"environment" as a soft hint, which
      // some Android tablets ignore and default to the front camera anyway.
      // Probe for the real rear camera's deviceId first and pin to it explicitly.
      let rearCameraId: string | undefined;
      try {
        const probeStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: 'environment' } },
        });
        probeStream.getTracks().forEach((track) => track.stop());
        const devices = await navigator.mediaDevices.enumerateDevices();
        rearCameraId = devices.find(
          (d) => d.kind === 'videoinput' && /back|rear|environment/i.test(d.label)
        )?.deviceId;
      } catch {
        // No distinguishable rear camera via exact match; fall back to AR.js's
        // own default (non-exact) "environment" request below.
      }
      if (disposed) return;

      let webglRenderer: THREE.WebGLRenderer;
      try {
        webglRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        setError(t('webglUnsupported'));
        return;
      }
      renderer = webglRenderer;

      try {
        webglRenderer.setClearColor(0x000000, 0);
        webglRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        webglRenderer.setSize(window.innerWidth, window.innerHeight);
        Object.assign(webglRenderer.domElement.style, {
          position: 'absolute',
          inset: '0',
          width: '100%',
          height: '100%',
          zIndex: '5',
        });
        container.appendChild(webglRenderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.Camera();
        scene.add(camera);

        // AR.js toggles markerRoot.visible off on any single frame it fails to
        // redetect the marker, which happens routinely (lighting, hand shake,
        // camera noise) even while genuinely "locked on". Track it separately
        // in a display group so the ring doesn't flicker on every dropped frame.
        const markerRoot = new THREE.Group();
        scene.add(markerRoot);

        const displayGroup = new THREE.Group();
        displayGroup.visible = false;
        scene.add(displayGroup);

        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.5, 0.04, 16, 48),
          new THREE.MeshBasicMaterial({ color: 0xd9b310, transparent: true, opacity: 0.85 })
        );
        ring.rotation.x = Math.PI / 2;
        displayGroup.add(ring);

        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(0.15, 0.4, 24),
          new THREE.MeshBasicMaterial({ color: 0xd9b310 })
        );
        cone.position.y = 0.4;
        displayGroup.add(cone);

        const source = new ArToolkitSource({
          sourceType: 'webcam',
          sourceWidth: 640,
          sourceHeight: 480,
          deviceId: rearCameraId ?? null,
        });
        arToolkitSource = source;

        const context = new ArToolkitContext({
          cameraParametersUrl: '/ar/camera_para.dat',
          detectionMode: 'mono_and_matrix',
          matrixCodeType: '3x3',
          canvasWidth: 640,
          canvasHeight: 480,
        });
        arToolkitContext = context;

        resize = () => {
          source.onResizeElement();
          source.copyElementSizeTo(webglRenderer.domElement);
          if (context.arController !== null) {
            source.copyElementSizeTo(context.arController.canvas);
          }
        };

        source.init(
          () => {
            if (disposed) return;
            try {
              window.setTimeout(resize, 300);
              const videoEl = document.getElementById('arjs-video');
              if (videoEl && container) {
                Object.assign(videoEl.style, {
                  position: 'absolute',
                  inset: '0',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  zIndex: '0',
                  marginLeft: '0',
                  marginTop: '0',
                });
                container.insertBefore(videoEl, container.firstChild);
              }
            } catch (err) {
              setError(t('arSetupFailed', { error: err instanceof Error ? err.message : String(err) }));
            }
          },
          (err: { name: string; message: string }) => {
            if (!disposed) setError(t('cameraAccessError', { error: err.message || err.name || '' }));
          }
        );

        window.addEventListener('resize', resize);

        context.init(() => {
          if (disposed) return;
          try {
            camera.projectionMatrix.copy(context.getProjectionMatrix());
          } catch (err) {
            setError(t('arSetupFailed', { error: err instanceof Error ? err.message : String(err) }));
          }
        });

        new ArMarkerControls(context, markerRoot, {
          type: 'barcode',
          barcodeValue: markerValue,
          changeMatrixMode: 'modelViewMatrix',
          size: MARKER_PHYSICAL_SIZE_METERS,
        });

        // How many consecutive dropped frames to tolerate before actually
        // treating the marker as lost (roughly half a second at 60fps).
        const LOST_GRACE_FRAMES = 30;
        let lostFrames = LOST_GRACE_FRAMES + 1;

        const animate = () => {
          if (disposed) return;
          try {
            if (source.ready) {
              context.update(source.domElement);
            }
            if (markerRoot.visible) {
              lostFrames = 0;
              displayGroup.position.copy(markerRoot.position);
              displayGroup.quaternion.copy(markerRoot.quaternion);
              displayGroup.visible = true;
              setDistance(markerRoot.position.length());
              setMarkerFound(true);
            } else if (lostFrames <= LOST_GRACE_FRAMES) {
              lostFrames += 1;
            } else {
              displayGroup.visible = false;
              setMarkerFound(false);
            }
            webglRenderer.render(scene, camera);
            rafId = requestAnimationFrame(animate);
          } catch (err) {
            setError(t('arSetupFailed', { error: err instanceof Error ? err.message : String(err) }));
          }
        };
        animate();
      } catch (err) {
        setError(t('arSetupFailed', { error: err instanceof Error ? err.message : String(err) }));
      }
    }
    setup();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('error', onUnexpectedError);
      window.removeEventListener('unhandledrejection', onUnexpectedError);
      arToolkitContext?.dispose();
      arToolkitSource?.dispose();
      renderer?.dispose();
      if (renderer?.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, [book.shelf, t]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative w-full h-full bg-black overflow-hidden font-sans"
    >
      {/* Futuristic HUD Scanning Grid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[6]">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(217,179,16,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(217,179,16,0.1) 1px, transparent 1px)', backgroundSize: '100px 100px' }}></div>

        {/* Scanning Line - only while the real marker hasn't been detected yet */}
        {!markerFound && !error && (
          <motion.div
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent/50 to-transparent shadow-[0_0_15px_rgba(217,179,16,0.5)] z-20"
          />
        )}
      </div>

      {/* Searching prompt - shown until the physical shelf marker is actually recognized */}
      {!markerFound && !error && (
        <div className="absolute inset-0 z-[6] flex flex-col items-center justify-center pointer-events-none gap-6 text-center px-10">
          <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ScanLine className="w-16 h-16 text-accent" />
          </motion.div>
          <p className="text-white font-black text-sm uppercase tracking-widest">{t('scanningForMarker')}</p>
          <p className="text-white/60 font-bold text-xs">{t('pointCameraAtShelfLabel', { shelf: book.shelf ?? '' })}</p>
        </div>
      )}

      {/* Camera / marker access error */}
      {error && (
        <div className="absolute inset-0 z-[6] flex items-center justify-center pointer-events-none px-10">
          <p className="text-white font-black text-sm text-center">{error}</p>
        </div>
      )}

      {/* AR HUD Elements - Top Bar */}
      <div className={cn("absolute top-10 left-8 right-8 z-20 flex justify-between items-start pointer-events-none", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
         <div className={cn("flex gap-4", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
            <div className={cn("glass-panel p-5 bg-white/5 border-white/20 backdrop-blur-xl flex items-center gap-5 shadow-[0_0_30px_rgba(0,0,0,0.5)]", dir === 'rtl' ? 'flex-row-reverse text-right' : 'flex-row text-left')}>
               <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-primary shadow-[0_0_20px_rgba(217,179,16,0.3)]">
                  <Navigation className={cn("w-6 h-6 animate-pulse", dir === 'rtl' ? 'rotate-180' : '')} />
               </div>
               <div>
                  <div className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-1">{t('effectiveGuidance')}</div>
                  <div className="text-lg font-black text-white">{t('headTowardsShelf', { shelf: book.shelf })}</div>
               </div>
            </div>
            
            <div className={cn("glass-panel px-6 py-4 bg-white/5 border-white/20 backdrop-blur-xl flex flex-col justify-center gap-1 shadow-[0_0_30px_rgba(0,0,0,0.5)]", dir === 'rtl' ? 'text-right' : 'text-left')}>
               <div className="text-[9px] font-black text-white/40 uppercase tracking-widest">{t('accuracy')}</div>
               <div className={cn("text-sm font-black flex items-center gap-2", markerFound ? "text-emerald-400" : "text-white/40")}>
                 <ShieldCheck className="w-4 h-4" />
                 {markerFound ? t('markerLocked') : t('scanningForMarker')}
               </div>
            </div>
         </div>

         <button 
           onClick={onClose}
           className="p-5 bg-primary/20 hover:bg-primary border-white/20 backdrop-blur-xl rounded-[1.5rem] text-white pointer-events-auto transition-all shadow-2xl active:scale-90"
         >
            <X className="w-7 h-7" />
         </button>
      </div>

      {/* AR HUD - Bottom Floating Card */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-2xl pointer-events-none">
         <motion.div 
           initial={{ y: 50, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className={cn("glass-panel p-8 bg-black/40 border-white/30 backdrop-blur-3xl flex items-center gap-10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] rounded-[3rem]", dir === 'rtl' ? 'flex-row-reverse text-right font-sans' : 'flex-row text-left font-sans')}
         >
            <div className="relative shrink-0">
               <img src={book.coverUrl} className="w-20 h-32 object-cover rounded-2xl shadow-2xl border-2 border-white/30" alt="" referrerPolicy="no-referrer" />
               <div className={cn("absolute -top-3 bg-accent text-primary w-10 h-10 rounded-full flex items-center justify-center border-4 border-black/40 font-black text-xs shadow-xl font-mono", dir === 'rtl' ? '-left-3' : '-right-3')}>
                 AR
               </div>
            </div>

            <div className="flex-1 space-y-4">
               <div>
                  <div className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-2">{t('targetBook')}</div>
                  <h4 className="text-white font-black text-2xl leading-tight tracking-tight">{book.title}</h4>
                  <div className="text-xs font-bold text-white/50 uppercase mt-1 tracking-widest leading-relaxed flex items-center gap-2">
                    <UserIcon className="w-3.5 h-3.5" />
                    {book.author}
                  </div>
               </div>
               
               <div className={cn("flex items-center gap-4", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                  <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                    <div className={cn("w-2 h-2 rounded-full", markerFound ? "bg-emerald-500 animate-ping" : "bg-white/30")}></div>
                    <span className="text-xs font-black text-white">{t('distanceMeters', { distance: distance !== null ? distance.toFixed(1) : '--' })}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                    <Compass className="w-4 h-4 text-accent" />
                    <span className="text-xs font-black text-white">{t('bookHall', { section: book.section })}</span>
                  </div>
               </div>
            </div>

            <div className={cn("flex flex-col items-center justify-center gap-3 py-6 px-10 border-white/10", dir === 'rtl' ? 'border-l' : 'border-r')}>
               <motion.div
                 animate={{ y: [0, -15, 0], scale: [1, 1.2, 1] }}
                 transition={{ duration: 1.5, repeat: Infinity }}
               >
                 <div className="w-16 h-16 bg-accent rounded-[2rem] flex items-center justify-center text-primary shadow-[0_0_40px_rgba(217,179,16,0.3)]">
                    <MoveUp className="w-8 h-8" />
                 </div>
               </motion.div>
               <span className="text-[9px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">{distance !== null && distance < 1 ? t('reachedDestination') : t('advanceForward')}</span>
            </div>
         </motion.div>
      </div>

      {/* Floating HUD Telemetry Particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
           key={i}
           className="absolute pointer-events-none"
           initial={{ 
             x: Math.random() * window.innerWidth, 
             y: Math.random() * window.innerHeight,
             opacity: 0,
             scale: 0.5
           }}
           animate={{ 
             y: [null, -200],
             opacity: [0, 0.4, 0],
             scale: [0.5, 1, 0.5]
           }}
           transition={{ 
             duration: 3 + Math.random() * 5, 
             repeat: Infinity,
             delay: Math.random() * 5
           }}
        >
           <div className="w-1 h-1 bg-accent/40 rounded-full shadow-[0_0_5px_#D9B310]"></div>
        </motion.div>
      ))}

      {/* Corners UI Decor */}
      <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-accent/20"></div>
      <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-accent/20"></div>
      <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-accent/20"></div>
      <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-accent/20"></div>
    </motion.div>
  );
}

interface LibraryMapProps {
  user: User;
}

export function LibraryMap({ user }: LibraryMapProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language, dir } = useLanguage();
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [showPath, setShowPath] = useState(false);
  const [isArMode, setIsArMode] = useState(false);

  const [activeTab, setActiveTab] = useState<'map' | 'sections'>('map');
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const [resourceTab, setResourceTab] = useState<'shelves' | 'facilities'>('shelves');
  const [mapSearchQuery, setMapSearchQuery] = useState('');

  // Simulated real-time occupancy data
  const occupancyData = useMemo(() => {
    return {
      'A-1': Math.floor(Math.random() * 100),
      'A-2': Math.floor(Math.random() * 100),
      'B-1': Math.floor(Math.random() * 100),
      'B-2': Math.floor(Math.random() * 100),
      'C-1': Math.floor(Math.random() * 100),
      'C-2': Math.floor(Math.random() * 100),
      'D-1': Math.floor(Math.random() * 100),
      'D-2': Math.floor(Math.random() * 100),
    };
  }, []);

  useEffect(() => {
    if (location.state?.bookId) {
      setSelectedBook(location.state.bookId);
      setShowPath(true);
    }
  }, [location.state]);

  const bookData = MOCK_BOOKS.find(b => b.id === selectedBook);

  const recommendationCategories = useMemo(() => Array.from(new Set(
    MOCK_BOOKS.filter(b => user.borrowedBooks.includes(b.id)).map(b => b.category)
  )), [user.borrowedBooks]);

  const mapRecommendations = useMemo(() => {
    if (mapSearchQuery.trim()) {
      const q = mapSearchQuery.toLowerCase();
      return MOCK_BOOKS.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.category ?? '').toLowerCase().includes(q)
      ).slice(0, 3);
    }
    return MOCK_BOOKS
      .filter(b => !user.borrowedBooks.includes(b.id))
      .filter(b => recommendationCategories.length > 0 ? recommendationCategories.includes(b.category) : true)
      .slice(0, 3);
  }, [mapSearchQuery, recommendationCategories, user.borrowedBooks]);

  const MATCH_PERCENTS = [98, 94, 91];

  const sections = [
    { id: 'A', name: t('naturalSciences'), icon: '🧪', subjects: [t('physics'), t('chemistry'), t('biology')], color: 'bg-blue-500', occupancy: t('quiet') },
    { id: 'B', name: t('engineeringAndTech'), icon: '⚙️', subjects: [t('mechEngineering'), t('ai'), t('software')], color: 'bg-orange-500', occupancy: t('activeOccupancy') },
    { id: 'C', name: t('artsAndCrafts'), icon: '🎨', subjects: [t('arabicLit'), t('graphicDesign'), t('philosophy')], color: 'bg-purple-500', occupancy: t('mediumOccupancy') },
    { id: 'D', name: t('humanities'), icon: '📚', subjects: [t('history'), t('sociology'), t('geography')], color: 'bg-green-500', occupancy: t('quiet') }
  ];

  const cells = [
    { id: 'A-1', section: 'A' }, { id: 'A-2', section: 'A' }, { id: 'B-1', section: 'B' }, { id: 'B-2', section: 'B' },
    { id: 'C-1', section: 'C' }, { id: 'C-2', section: 'C' }, { id: 'D-1', section: 'D' }, { id: 'D-2', section: 'D' }
  ];

  const getPathData = () => {
    if (!bookData) return "";
    const shelf = bookData.shelf;
    const paths: Record<string, string> = {
      'A-1': "M 300,450 L 300,350 L 100,350 L 100,100",
      'A-2': "M 300,450 L 300,350 L 250,350 L 250,100",
      'B-1': "M 300,450 L 300,350 L 400,350 L 400,100",
      'B-2': "M 300,450 L 300,350 L 550,350 L 550,100",
      'C-1': "M 300,450 L 300,350 L 100,350 L 100,250",
      'D-1': "M 300,450 L 300,350 L 550,350 L 550,250",
    };
    return paths[shelf] || "M 300,450 L 300,200";
  };

  return (
    <div className={cn("h-full flex flex-col gap-8 animate-in duration-500 font-sans", dir === 'rtl' ? 'slide-in-from-left-4 text-right' : 'slide-in-from-right-4 text-left')}>
      {/* Pre-selection landing: search + recommended sources + XP/badges guide.
          Hidden once a book is picked so navigation mode stays uncluttered. */}
      {!bookData && (
        <div className="space-y-10 pb-10 border-b border-slate-200 dark:border-white/10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h1 className="text-4xl font-black text-primary dark:text-white tracking-tight">{t('augmentedLibraryMap')}</h1>
            <p className="text-slate-400 dark:text-slate-500 font-bold leading-relaxed">{t('augmentedLibraryMapDesc')}</p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setResourceTab('shelves')}
                className={cn(
                  "px-6 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2",
                  resourceTab === 'shelves' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-100 dark:bg-slate-900 text-slate-400 hover:text-primary dark:hover:text-slate-200"
                )}
              >
                <BookOpen className="w-4 h-4" />
                {t('libraryResourcesShelves')}
              </button>
              <button
                onClick={() => setResourceTab('facilities')}
                className={cn(
                  "px-6 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2",
                  resourceTab === 'facilities' ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-100 dark:bg-slate-900 text-slate-400 hover:text-primary dark:hover:text-slate-200"
                )}
              >
                <Compass className="w-4 h-4" />
                {t('libraryFacilities')}
              </button>
            </div>
          </div>

          {resourceTab === 'facilities' ? (
            <div className="official-card p-16 text-center text-slate-400 dark:text-slate-500 font-bold bg-white dark:bg-slate-900 border-dashed border-slate-200 dark:border-white/10">
              {t('facilitiesComingSoon')}
            </div>
          ) : (
            <>
              <div className="official-card p-10 flex flex-col items-center text-center gap-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20">
                <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div className="space-y-2 max-w-lg">
                  <h3 className="text-xl font-black text-primary dark:text-white tracking-tight">{t('searchForBookFirst')}</h3>
                  <p className="text-slate-400 dark:text-slate-500 font-bold text-sm leading-relaxed">{t('searchForBookFirstDesc')}</p>
                </div>
                <div className="relative w-full max-w-xl">
                  <SearchIcon className={cn("absolute top-1/2 -translate-y-1/2 text-primary w-5 h-5", dir === 'rtl' ? 'right-5' : 'left-5')} />
                  <input
                    type="text"
                    value={mapSearchQuery}
                    onChange={(e) => setMapSearchQuery(e.target.value)}
                    placeholder={t('searchByBookPlaceholder')}
                    className={cn(
                      "w-full py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-primary dark:text-white rounded-2xl text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-accent",
                      dir === 'rtl' ? 'pr-14 pl-5 text-right' : 'pl-14 pr-5 text-left'
                    )}
                  />
                </div>
              </div>

              {mapRecommendations.length > 0 && (
                <div className="space-y-6">
                  <div className="text-center space-y-2 max-w-xl mx-auto">
                    <h4 className="text-lg font-black text-primary dark:text-white tracking-tight flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4 text-accent" />
                      {t('recommendedFeaturedSources')}
                    </h4>
                    <p className="text-slate-400 dark:text-slate-500 font-bold text-xs leading-relaxed">{t('recommendedFeaturedSourcesDesc')}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {mapRecommendations.map((book, idx) => (
                      <div
                        key={book.id}
                        onClick={() => { setSelectedBook(book.id); setShowPath(true); }}
                        className="official-card p-5 space-y-4 cursor-pointer bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 hover:border-accent dark:hover:border-accent shadow-sm hover:shadow-xl transition-all"
                      >
                        <div className={cn("flex items-center justify-between", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-1 rounded-lg uppercase tracking-widest">
                            {MATCH_PERCENTS[idx] ?? 90}% {t('matchLabel')}
                          </span>
                        </div>
                        <div className={cn("flex gap-4", dir === 'rtl' ? 'flex-row-reverse text-right' : 'flex-row text-left')}>
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            className="w-16 h-20 object-cover rounded-xl shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0 space-y-1">
                            <h5 className="text-sm font-black text-primary dark:text-white leading-tight line-clamp-2">{book.title}</h5>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase truncate">{book.author}</p>
                          </div>
                        </div>
                        <div className={cn("flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                          <span className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                            <MapPin className="w-3.5 h-3.5 text-primary/60 dark:text-accent" />
                            {t('shelfItem')} {book.shelf}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] font-black text-primary dark:text-accent uppercase tracking-widest">
                            {t('instantNav')}
                            <ChevronRight className={cn("w-3.5 h-3.5", dir === 'rtl' ? 'rotate-180' : '')} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="rounded-[2rem] p-10 bg-primary dark:bg-slate-950 text-white shadow-2xl shadow-primary/20 dark:shadow-black/40 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className={cn("space-y-2 max-w-md", dir === 'rtl' ? 'text-right' : 'text-left')}>
              <h4 className="text-xl font-black tracking-tight">{t('knowledgeXpBadgesGuide')}</h4>
              <p className="text-white/60 font-bold text-xs leading-relaxed">{t('knowledgeXpBadgesGuideDesc')}</p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="bg-white/10 border border-white/10 rounded-2xl p-4 text-center min-w-[130px]">
                <Trophy className="w-5 h-5 text-accent mx-auto mb-2" />
                <div className="text-xl font-black">{user.points} <span className="text-[10px] text-white/50">KXP</span></div>
                <div className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-1 leading-relaxed">{t('totalExperiencePoints')}</div>
              </div>
              <div className="bg-white/10 border border-white/10 rounded-2xl p-4 text-center min-w-[130px]">
                <Clock className="w-5 h-5 text-secondary mx-auto mb-2" />
                <div className="text-xl font-black">45 <span className="text-[10px] text-white/50">{t('minutesShort')}</span></div>
                <div className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-1 leading-relaxed">{t('knowledgeLearningTimeToday')}</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/my-books?tab=badges')}
            className="w-full py-4 bg-slate-900 dark:bg-accent text-white dark:text-primary rounded-2xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {t('viewInteractiveXpBadgesGuide')}
          </button>

          <div className="space-y-6">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <h4 className="text-lg font-black text-primary dark:text-white tracking-tight">{t('informationCognitiveBadgesChest')}</h4>
              <p className="text-slate-400 dark:text-slate-500 font-bold text-xs leading-relaxed">{t('informationCognitiveBadgesChestDesc')}</p>
            </div>
            <BadgesCabinet user={user} badgeIds={['مستكشف', 'باحث', 'متميز']} />
          </div>
        </div>
      )}

      {/* Dynamic Header */}
      <div className={cn("flex flex-col md:flex-row items-center justify-between gap-8 pb-8 border-b border-slate-200 dark:border-white/10", dir === 'rtl' ? 'md:flex-row-reverse' : 'md:flex-row')}>
        <div className={cn(dir === 'rtl' ? 'text-right' : 'text-left')}>
          <div className={cn("flex items-center gap-3 mb-4", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
            <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center text-accent">
              <MapIcon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">{t('smartNavSystem')}</span>
          </div>
          <h1 className="text-4xl font-black text-primary dark:text-white tracking-tight">{t('knowledgeCampusMap')}</h1>
          <p className="text-slate-400 dark:text-slate-500 font-bold mt-2 leading-relaxed">{t('navAccuratelyDesc')}</p>
        </div>

        <div className={cn("flex flex-col sm:flex-row items-center gap-4", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5">
             <button 
               onClick={() => { setActiveTab('map'); setIsArMode(false); }}
               className={cn(
                 "px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-3", 
                 activeTab === 'map' && !isArMode ? "bg-white dark:bg-slate-800 text-primary dark:text-accent shadow-lg shadow-black/5" : "text-slate-400 hover:text-primary dark:hover:text-slate-200"
               )}
             >
               <MapPin className="w-4 h-4" />
               {t('digitalView')}
             </button>
             <button 
               onClick={() => { setActiveTab('sections'); setIsArMode(false); }}
               className={cn(
                 "px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-3", 
                 activeTab === 'sections' ? "bg-white dark:bg-slate-800 text-primary dark:text-accent shadow-lg shadow-black/5" : "text-slate-400 hover:text-primary dark:hover:text-slate-200"
               )}
             >
               <Box className="w-4 h-4" />
               {t('mainSections')}
             </button>
          </div>

          {bookData && (
            <button 
              onClick={() => setIsArMode(true)}
              className="px-8 py-4 bg-primary text-white rounded-2xl text-xs font-black flex items-center gap-3 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all group"
            >
               <Camera className="w-5 h-5 group-hover:animate-pulse" />
               <span>{t('enterArMode')}</span>
               <div className="flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                 <span className="text-[9px] text-emerald-400 opacity-80 uppercase">{t('activeStatus')}</span>
               </div>
            </button>
          )}
        </div>
      </div>

      <div className={cn("flex flex-col xl:flex-row gap-10 flex-1 min-h-0", dir === 'rtl' ? 'xl:flex-row-reverse' : 'xl:flex-row')}>
        {/* Map Visualization Zone */}
        <div className={cn(
          "flex-1 official-card relative overflow-hidden min-h-[650px] p-0 transition-all duration-500",
          isArMode ? "bg-black border-0" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20"
        )}>
          {/* Blueprint Grid Overlay */}
          {!isArMode && ( activeTab === 'map' && (
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#004C6D 1px, transparent 1px), linear-gradient(90deg, #004C6D 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              <div className="absolute inset-0 opacity-[0.01] dark:opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#004C6D 1px, transparent 1px), linear-gradient(90deg, #004C6D 1px, transparent 1px)', backgroundSize: '200px 200px' }} />
              
              {/* Compass Rose Decoration */}
              <div className={cn("absolute bottom-12 opacity-5 scale-150 text-primary dark:text-white", dir === 'rtl' ? 'left-12' : 'right-12')}>
                 <Compass className="w-48 h-48" />
              </div>
            </div>
          ))}

          <AnimatePresence mode="wait">
            {isArMode ? (
              <ArView key="ar" book={bookData!} onClose={() => setIsArMode(false)} />
            ) : activeTab === 'map' ? (
              <motion.div 
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative z-10 w-full h-full p-12 flex flex-col"
              >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1">
                    {cells.map((cell) => {
                      const section = sections.find(s => s.id === cell.section);
                      const isDestination = bookData?.shelf === cell.id;
                      const occupancy = occupancyData[cell.id as keyof typeof occupancyData];
                      const isHovered = hoveredCell === cell.id;

                      return (
                        <motion.div 
                          key={cell.id}
                          onHoverStart={() => setHoveredCell(cell.id)}
                          onHoverEnd={() => setHoveredCell(null)}
                          className={cn(
                            "relative flex flex-col items-center justify-center rounded-[3rem] border-2 transition-all duration-500 cursor-pointer group",
                            isDestination 
                              ? "bg-accent/5 dark:bg-accent/10 border-accent shadow-[0_30px_70px_rgba(217,179,16,0.2)] z-20 scale-105" 
                              : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 hover:border-primary/20 dark:hover:border-accent/20",
                            isHovered && !isDestination && "shadow-2xl shadow-black/5 dark:shadow-black/20 scale-[1.02]"
                          )}
                        >
                          {/* Live Occupancy Badge */}
                          <div className={cn("absolute top-6 flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-sm border border-slate-100 dark:border-white/5", dir === 'rtl' ? 'left-8' : 'right-8')}>
                             <div className={cn("w-1.5 h-1.5 rounded-full", occupancy > 70 ? "bg-red-500" : occupancy > 40 ? "bg-amber-500" : "bg-emerald-500")}></div>
                             <span className="text-[9px] font-black text-slate-500 dark:text-slate-400">{occupancy}%</span>
                          </div>

                          <div className="relative z-10 flex flex-col items-center gap-6 p-8 text-center">
                            <div className={cn(
                              "w-16 h-16 rounded-[2rem] flex items-center justify-center text-2xl transition-all duration-500 shadow-lg",
                              isDestination ? "bg-accent text-primary scale-110" : "bg-white dark:bg-slate-700 text-slate-300 dark:text-slate-400"
                            )}>
                               {section?.icon}
                            </div>
                            
                            <div className="space-y-1">
                               <div className="text-[10px] font-black text-primary/40 dark:text-white/30 uppercase tracking-[0.2em]">{section?.name}</div>
                               <div className="text-xl font-black text-primary dark:text-white">{t('shelfId', { id: cell.id })}</div>
                            </div>

                            {isDestination && (
                              <motion.div 
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className={cn("bg-primary text-accent px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}
                              >
                                <Navigation className={cn("w-3 h-3", dir === 'rtl' ? 'rotate-180' : '')} />
                                {t('currentDestination')}
                              </motion.div>
                            )}
                          </div>

                          {/* Decorative Section Color Tab */}
                          <div className={cn("absolute bottom-0 inset-x-12 h-1.5 rounded-t-full transition-all group-hover:h-3", section?.color, isDestination && "opacity-100", !isDestination && "opacity-20")} />
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Enhanced Entrance Visual */}
                  <div className="mt-16 relative flex justify-center">
                     <div className="absolute bottom-full mb-8 h-20 w-px bg-gradient-to-t from-slate-200 dark:from-white/10 to-transparent" />
                     <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-12 py-4 rounded-full text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] shadow-inner text-center">
                        {t('mainGatePhaseOne')}
                     </div>
                  </div>

                  {/* Path Visualization SVG */}
                  {showPath && bookData && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" viewBox="0 0 600 500">
                      <defs>
                        <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#004C6D" stopOpacity="0" />
                          <stop offset="50%" stopColor="#D9B310" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#D9B310" stopOpacity="1" />
                        </linearGradient>
                         <filter id="glow">
                          <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      <motion.path 
                        d={getPathData()}
                        stroke="url(#pathGradient)"
                        strokeWidth="12"
                        strokeDasharray="20 15"
                        fill="none"
                        strokeLinecap="round"
                        filter="url(#glow)"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                      />
                      <motion.circle r="12" fill="#D9B310" stroke="white" strokeWidth="4">
                        <animateMotion dur="4s" repeatCount="indefinite" path={getPathData()} />
                      </motion.circle>
                    </svg>
                  )}
              </motion.div>
            ) : (
              <motion.div 
                key="sections"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-10 p-12"
              >
                 {sections.map(section => (
                   <div key={section.id} className={cn("official-card p-10 flex flex-col justify-between group hover:border-primary/20 dark:hover:border-accent/20 transition-all cursor-pointer bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20", dir === 'rtl' ? 'text-right' : 'text-left')}>
                      <div className={cn("flex items-start justify-between", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                         <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-500">
                            {section.icon}
                         </div>
                         <div className={cn(dir === 'rtl' ? 'text-left' : 'text-right')}>
                            <span className="text-[10px] font-black text-primary dark:text-accent uppercase tracking-widest block mb-1">{t('shelfShort')} {section.id}</span>
                            <h3 className="text-2xl font-black text-primary dark:text-white tracking-tight">{section.name}</h3>
                         </div>
                      </div>

                      <div className="mt-8 space-y-6">
                         <div className={cn("flex flex-wrap gap-2", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                            {section.subjects.map(s => (
                              <span key={s} className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 rounded-xl border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-slate-700 hover:text-primary dark:hover:text-white transition-all">
                                {s}
                              </span>
                            ))}
                         </div>
                         
                         <div className={cn("flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                            <div className={cn("flex items-center gap-3", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                               <div className={cn("w-3 h-3 rounded-full", section.occupancy === t('quiet') ? "bg-emerald-500" : section.occupancy === t('activeOccupancy') ? "bg-amber-500" : "bg-blue-500")} />
                               <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{section.occupancy} {language === 'ar' ? 'الآن' : 'Now'}</span>
                            </div>
                            <button className={cn("text-[10px] font-black text-primary dark:text-accent uppercase tracking-widest flex items-center gap-2 group-hover:text-accent dark:group-hover:text-white transition-colors", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                                {t('previewShelves')}
                                <ChevronRight className={cn("w-4 h-4", dir === 'rtl' ? 'rotate-180' : '')} />
                            </button>
                         </div>
                      </div>
                   </div>
                 ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Intelligence */}
        <div className="w-full xl:w-[450px] flex flex-col gap-8">
          {bookData ? (
            <motion.div 
              initial={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-[2rem] p-12 bg-primary dark:bg-slate-950 text-white shadow-[0_50px_100px_rgba(11,60,93,0.3)] dark:shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden relative"
            >
              <div className={cn("absolute top-0 w-64 h-64 bg-accent/10 rounded-full blur-[100px] -mt-32", dir === 'rtl' ? 'left-0 -ml-32' : 'right-0 -mr-32')} />

              <div className="relative z-10 space-y-12 bg-white/10 dark:bg-slate-900/60 p-8 rounded-[2rem] text-white backdrop-blur-md border border-white/5 dark:border-white/10">
                 <div className="flex justify-center">
                    <div className="relative group">
                       <img
                          src={bookData.coverUrl}
                          className="w-48 h-72 object-cover rounded-[1.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] border-4 border-white/10 dark:border-white/5"
                          alt=""
                          referrerPolicy="no-referrer"
                        />
                       <div className={cn("absolute -bottom-6 w-16 h-16 bg-accent rounded-3xl flex items-center justify-center text-primary shadow-2xl border-4 border-primary dark:border-slate-950", dir === 'rtl' ? '-left-6' : '-right-6')}>
                          <Navigation className={cn("w-7 h-7", dir === 'rtl' ? 'rotate-180' : '')} />
                       </div>
                    </div>
                 </div>

                 <div className="text-center space-y-4">
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">{t('navigationOn')}</div>
                    <h2 className="text-3xl font-black leading-tight tracking-tight text-white drop-shadow-sm">{bookData.title}</h2>
                    <p className="text-white/60 font-bold uppercase text-[12px] tracking-widest flex items-center justify-center gap-2">
                       <UserIcon className="w-4 h-4" />
                       {bookData.author}
                    </p>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 border border-white/10 p-6 rounded-3xl text-center backdrop-blur-md">
                       <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 opacity-70 leading-relaxed">{t('digitalView')} ({t('shelfShort')})</div>
                       <div className="text-3xl font-black text-white">{bookData.shelf}</div>
                    </div>
                    <div className="bg-white/10 border border-white/10 p-6 rounded-3xl text-center backdrop-blur-md">
                       <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 opacity-70 leading-relaxed">{t('bookHall', { section: '' })}</div>
                       <div className="text-3xl font-black text-white">{bookData.section}</div>
                    </div>
                 </div>

                 <div className="space-y-4 pt-4">
                    <button
                      onClick={() => navigate(`/book/${bookData.id}`)}
                      className="w-full py-5 bg-accent text-primary rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:brightness-110 shadow-lg shadow-accent/20 transition-all active:scale-95"
                    >
                       <span>{t('viewReferenceData')}</span>
                    </button>
                    <button
                      onClick={() => { setSelectedBook(null); setShowPath(false); }}
                      className="w-full py-4 text-white/60 hover:text-red-400 font-black text-[11px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                       <X className="w-4 h-4" />
                       {t('cancelActiveNavigation')}
                    </button>
                 </div>
              </div>
            </motion.div>
          ) : (
            <div className="official-card p-16 flex flex-col items-center justify-center text-center gap-10 min-h-[500px] border-dashed border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl shadow-black/5 dark:shadow-black/20">
               <div className="relative">
                  <div className="w-32 h-32 bg-slate-50 dark:bg-slate-800 rounded-[3.5rem] flex items-center justify-center text-slate-200 dark:text-slate-700">
                     <Compass className="w-16 h-16" />
                  </div>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-4 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[4rem]"
                  />
               </div>
               
               <div className="space-y-4">
                  <h3 className="text-2xl font-black text-primary dark:text-white tracking-tight">{t('searchReferenceFirst')}</h3>
                  <p className="text-slate-400 dark:text-slate-500 font-bold leading-relaxed px-4">
                    {t('unifiedSearchDesc')}
                  </p>
               </div>

               <button 
                onClick={() => navigate('/')}
                className="w-full py-6 rounded-[2.5rem] border-2 border-primary dark:border-accent text-primary dark:text-accent font-black text-xs uppercase tracking-[0.3em] hover:bg-primary dark:hover:bg-accent hover:text-white dark:hover:text-primary transition-all active:scale-95 shadow-lg shadow-black/5"
               >
                 {t('searchInIndex')}
               </button>

               <div className={cn("flex items-center gap-8 pt-8 border-t border-slate-100 dark:border-white/5 w-full justify-center", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                  <div className="text-center">
                    <div className="text-lg font-black text-primary dark:text-white tracking-tighter">١٥٠ألف+</div>
                    <div className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase leading-relaxed">{t('indexedBooks')}</div>
                  </div>
                  <div className="w-px h-10 bg-slate-100 dark:bg-white/5" />
                  <div className="text-center">
                    <div className="text-lg font-black text-emerald-500 tracking-tighter">{language === 'ar' ? 'مباشر' : 'Live'}</div>
                    <div className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase leading-relaxed">{t('shelfUpdates')}</div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
