import React, { useState, useEffect, useRef } from 'react';
import { Navigation, X, MoveUp, ShieldCheck, User as UserIcon, ScanLine, Compass, Radar } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { useLanguage } from '../hooks/useLanguage';
import * as THREE from 'three';
import { ArToolkitSource, ArToolkitContext, ArMarkerControls } from '@ar-js-org/ar.js/three.js/build/ar-threex.mjs';
import { getMarkerForShelf, MARKER_PHYSICAL_SIZE_METERS } from '../lib/arMarkers';
import { Book } from '../types';

interface ArViewProps {
  book: Book;
  onClose: () => void;
  key?: string | number;
}

export function ArView({ book, onClose }: ArViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [markerFound, setMarkerFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t, dir } = useLanguage();
  const markerId = getMarkerForShelf(book.shelf);

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

      {/* Technical telemetry readout - real tracking data styled as an AR
          engine HUD, reinforcing that this is a live computer-vision system
          rather than a static map screenshot. */}
      {!error && (
        <div className={cn("absolute top-40 z-20 hidden sm:flex flex-col gap-3 pointer-events-none font-mono", dir === 'rtl' ? 'right-8 items-end text-right' : 'left-8 items-start text-left')}>
          <div className="flex items-center gap-2 text-accent/80">
            <Radar className="w-3.5 h-3.5 animate-spin [animation-duration:3s]" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{t('hudEngineLabel')}</span>
          </div>
          <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{t('hudEngineStatus')}</span>

          <div className="w-8 h-px bg-white/20 my-1" />

          <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">{t('hudTargetMarkerLabel')}</span>
          <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">#{markerId ?? '--'} · {book.shelf}</span>

          <div className="w-8 h-px bg-white/20 my-1" />

          <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">{t('hudTrackingLabel')}</span>
          <span className={cn("text-[10px] font-bold uppercase tracking-widest", markerFound ? "text-emerald-400" : "text-white/70")}>
            {markerFound ? t('hudTrackingLocked') : t('hudTrackingSearching')}
          </span>
        </div>
      )}

      {!error && (
        <div className={cn("absolute top-40 z-20 hidden sm:flex flex-col gap-3 pointer-events-none font-mono", dir === 'rtl' ? 'left-8 items-start text-left' : 'right-8 items-end text-right')}>
          <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">{t('hudDistanceVectorLabel')}</span>
          <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{distance !== null ? `${distance.toFixed(2)}m` : '--'}</span>

          <div className="w-8 h-px bg-white/20 my-1" />

          <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">{t('hudMarkerSizeLabel')}</span>
          <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{Math.round(MARKER_PHYSICAL_SIZE_METERS * 100)}cm</span>

          {!markerFound && (
            <>
              <div className="w-8 h-px bg-white/20 my-1" />
              <span className="text-[9px] font-bold text-white/50 normal-case tracking-normal max-w-[160px] leading-relaxed">{t('hudAlignCameraHint')}</span>
            </>
          )}
        </div>
      )}

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

    </motion.div>
  );
}
