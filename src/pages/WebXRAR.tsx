import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Scan, MapPin, CheckCircle2, Smartphone, AlertTriangle, ChevronRight, Navigation } from 'lucide-react';
import { MOCK_BOOKS } from '../data/mockData';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';

// ------- types -------
type XRSession = any;
type XRFrame = any;
type XRHitTestSource = any;
type XRReferenceSpace = any;

type Phase = 'check' | 'ready' | 'active' | 'unsupported' | 'sim';

interface PlacedLabel {
  id: string;
  shelfId: string;
  worldPos: [number, number, number]; // x,y,z in local AR space
  screenX: number;
  screenY: number;
  visible: boolean;
}

const SHELVES = ['A-1', 'A-2', 'B-1', 'B-2', 'C-1', 'C-2', 'D-1', 'D-2'];

// Column-major 4×4 matrix multiply: mat * vec4(x,y,z,1)
function mulMat4Vec3(m: Float32Array, x: number, y: number, z: number) {
  const w = m[3] * x + m[7] * y + m[11] * z + m[15];
  return {
    x: (m[0] * x + m[4] * y + m[8]  * z + m[12]) / w,
    y: (m[1] * x + m[5] * y + m[9]  * z + m[13]) / w,
    z: (m[2] * x + m[6] * y + m[10] * z + m[14]) / w,
  };
}

function worldToScreen(
  worldPos: [number, number, number],
  viewMat: Float32Array,
  projMat: Float32Array,
  w: number,
  h: number,
): { x: number; y: number; behind: boolean } {
  const cam = mulMat4Vec3(viewMat, worldPos[0], worldPos[1], worldPos[2]);
  const clip = mulMat4Vec3(projMat, cam.x, cam.y, cam.z);
  return {
    x: ((clip.x + 1) / 2) * w,
    y: ((1 - clip.y) / 2) * h,
    behind: cam.z > 0,
  };
}

export function WebXRAR() {
  const navigate = useNavigate();
  const { language, dir } = useLanguage();
  const ar = language === 'ar';

  const [phase, setPhase] = useState<Phase>('check');
  const [hitDetected, setHitDetected] = useState(false);
  const [labels, setLabels] = useState<PlacedLabel[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pendingShelf, setPendingShelf] = useState<string | null>(null);
  const [tapHint, setTapHint] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const simStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<XRSession>(null);
  const hitSourceRef = useRef<XRHitTestSource>(null);
  const refSpaceRef = useRef<XRReferenceSpace>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const lastHitRef = useRef<[number, number, number] | null>(null);
  const labelsRef = useRef<PlacedLabel[]>([]);
  const labelElemsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const rafIdRef = useRef<number>(0);

  // Keep labelsRef in sync
  useEffect(() => { labelsRef.current = labels; }, [labels]);

  // Check WebXR support
  useEffect(() => {
    const xr = (navigator as any).xr;
    if (!xr) { setPhase('unsupported'); return; }
    xr.isSessionSupported('immersive-ar')
      .then((ok: boolean) => setPhase(ok ? 'ready' : 'unsupported'))
      .catch(() => setPhase('unsupported'));
  }, []);

  const startAR = useCallback(async () => {
    const xr = (navigator as any).xr;
    if (!xr || !canvasRef.current || !overlayRef.current) return;

    try {
      const session: XRSession = await xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test', 'dom-overlay'],
        domOverlay: { root: overlayRef.current },
      });
      sessionRef.current = session;
      setPhase('active');

      // WebGL setup (required by WebXR even if we don't draw 3D objects)
      const canvas = canvasRef.current;
      const gl = canvas.getContext('webgl', { xrCompatible: true }) as WebGLRenderingContext;
      glRef.current = gl;
      await (gl as any).makeXRCompatible();
      const xrLayer = new (window as any).XRWebGLLayer(session, gl);
      session.updateRenderState({ baseLayer: xrLayer });

      const localSpace: XRReferenceSpace = await session.requestReferenceSpace('local');
      refSpaceRef.current = localSpace;
      const viewerSpace: XRReferenceSpace = await session.requestReferenceSpace('viewer');
      const hitSrc: XRHitTestSource = await session.requestHitTestSource({ space: viewerSpace });
      hitSourceRef.current = hitSrc;

      // Tap handler
      session.addEventListener('select', () => {
        if (lastHitRef.current) {
          setShowPicker(true);
        }
      });

      // Render loop — only reads from refs, no setState except hitDetected
      let lastHitState = false;
      const onFrame = (_time: number, frame: XRFrame) => {
        if (!sessionRef.current) return;
        rafIdRef.current = session.requestAnimationFrame(onFrame);

        // Clear canvas transparent
        const layer = session.renderState.baseLayer;
        gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Hit test
        const hits = frame.getHitTestResults(hitSrc);
        const hasHit = hits.length > 0;
        if (hasHit !== lastHitState) {
          lastHitState = hasHit;
          setHitDetected(hasHit);
          if (hasHit && !tapHint) setTapHint(true);
        }
        if (hasHit) {
          const pose = hits[0].getPose(localSpace);
          if (pose) {
            const m = pose.transform.matrix;
            lastHitRef.current = [m[12], m[13], m[14]];
          }
        } else {
          lastHitRef.current = null;
        }

        // Update label screen positions via direct DOM manipulation (60fps safe)
        const viewerPose = frame.getViewerPose(localSpace);
        if (viewerPose && viewerPose.views.length > 0) {
          const view = viewerPose.views[0];
          const viewMat = new Float32Array(view.transform.inverse.matrix);
          const projMat = new Float32Array(view.projectionMatrix);
          const w = window.innerWidth;
          const h = window.innerHeight;

          labelsRef.current.forEach(label => {
            const el = labelElemsRef.current[label.id];
            if (!el) return;
            const { x, y, behind } = worldToScreen(label.worldPos, viewMat, projMat, w, h);
            if (behind || x < -200 || x > w + 200 || y < -200 || y > h + 200) {
              el.style.display = 'none';
            } else {
              el.style.display = 'flex';
              el.style.left = `${x - 60}px`;
              el.style.top = `${y - 24}px`;
            }
          });
        }
      };

      rafIdRef.current = session.requestAnimationFrame(onFrame);

      session.addEventListener('end', () => {
        sessionRef.current = null;
        setPhase('ready');
        setHitDetected(false);
        setLabels([]);
        setShowPicker(false);
      });
    } catch (err) {
      console.error('WebXR start failed', err);
      setPhase('ready');
    }
  }, [tapHint]);

  const endAR = useCallback(() => {
    cancelAnimationFrame(rafIdRef.current);
    sessionRef.current?.end();
    simStreamRef.current?.getTracks().forEach(t => t.stop());
    simStreamRef.current = null;
    navigate(-1);
  }, [navigate]);

  const startSim = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      simStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      // Auto-place 4 shelf labels at fixed screen-percentage positions
      const autoLabels: PlacedLabel[] = [
        { id: 'sim-1', shelfId: 'A-1', worldPos: [0,0,0], screenX: window.innerWidth * 0.18, screenY: window.innerHeight * 0.28, visible: true },
        { id: 'sim-2', shelfId: 'B-2', worldPos: [0,0,0], screenX: window.innerWidth * 0.60, screenY: window.innerHeight * 0.20, visible: true },
        { id: 'sim-3', shelfId: 'C-1', worldPos: [0,0,0], screenX: window.innerWidth * 0.35, screenY: window.innerHeight * 0.55, visible: true },
        { id: 'sim-4', shelfId: 'D-2', worldPos: [0,0,0], screenX: window.innerWidth * 0.72, screenY: window.innerHeight * 0.48, visible: true },
      ];
      setLabels(autoLabels);
      setPhase('sim');
    } catch {
      // Camera denied — still enter sim mode with a static background
      setPhase('sim');
    }
  }, []);

  const placeLabel = useCallback((shelfId: string) => {
    const pos = lastHitRef.current;
    if (!pos) return;
    const id = Date.now().toString();
    const newLabel: PlacedLabel = {
      id,
      shelfId,
      worldPos: [pos[0], pos[1], pos[2]],
      screenX: window.innerWidth / 2 - 60,
      screenY: window.innerHeight / 2 - 24,
      visible: true,
    };
    setLabels(prev => [...prev, newLabel]);
    setShowPicker(false);
    setPendingShelf(null);
  }, []);

  const booksForShelf = (shelfId: string) =>
    MOCK_BOOKS.filter(b => b.shelf === shelfId).slice(0, 2);

  // ─── Unsupported ──────────────────────────────────────────────────────────
  if (phase === 'unsupported') {
    return (
      <div className="fixed inset-0 bg-primary flex flex-col items-center justify-center p-8 text-center gap-6">
        <div className="w-20 h-20 rounded-[2rem] bg-red-500/20 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-black text-white">
            {ar ? 'WebXR غير مدعوم' : 'WebXR Not Supported'}
          </h2>
          <p className="text-white/60 font-bold max-w-xs mx-auto leading-relaxed text-sm">
            {ar
              ? 'يتطلب هذا الوضع: Android + Chrome + ARCore مثبت'
              : 'Requires: Android + Chrome + ARCore installed'}
          </p>
          <div className="mt-2 flex flex-col gap-2 text-xs font-bold text-white/40">
            <span>✓ iOS Safari — قريباً / Coming soon</span>
            <span>✓ Desktop — غير متاح / Not available</span>
          </div>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={startSim}
            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2"
          >
            <Scan className="w-5 h-5" />
            {ar ? 'جرّب وضع المحاكاة' : 'Try Simulation Mode'}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="py-3 text-white/40 font-bold text-sm"
          >
            {ar ? 'رجوع' : 'Back'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Ready (intro) ────────────────────────────────────────────────────────
  if (phase === 'check' || phase === 'ready') {
    return (
      <div className="fixed inset-0 bg-primary flex flex-col items-center justify-center p-8 text-center gap-8">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="w-28 h-28 rounded-[2.5rem] bg-accent/20 border border-accent/30 flex items-center justify-center"
        >
          <Scan className="w-14 h-14 text-accent" />
        </motion.div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black text-white">
            {ar ? 'AR واقعي بـ WebXR' : 'Real AR via WebXR'}
          </h1>
          <p className="text-white/60 font-bold max-w-xs mx-auto leading-relaxed text-sm">
            {ar
              ? 'وجّه كاميرتك نحو أي سطح في المكتبة. عندما يُكتشف الرف، انقر لتثبيت تسمية عليه'
              : 'Point your camera at any library surface. When a shelf is detected, tap to place a label'}
          </p>
        </div>

        <div className={cn("flex flex-col gap-3 w-full max-w-xs", ar ? 'text-right' : 'text-left')}>
          {[
            { icon: Scan, text: ar ? 'اكتشاف الأسطح الحقيقية تلقائياً' : 'Auto-detect real surfaces' },
            { icon: MapPin, text: ar ? 'ثبّت تسميات الأرفف على المكان الفعلي' : 'Pin shelf labels to real positions' },
            { icon: Navigation, text: ar ? 'التسميات تتتبع حركة الكاميرا' : 'Labels track with camera movement' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className={cn("flex items-center gap-3", ar ? 'flex-row-reverse' : '')}>
              <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-accent" />
              </div>
              <span className="text-white/80 text-sm font-bold">{text}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={startAR}
            className="w-full py-5 bg-accent text-primary rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-accent/30 flex items-center justify-center gap-3"
          >
            <Smartphone className="w-5 h-5" />
            {ar ? 'ابدأ AR الحقيقي' : 'Start Real AR'}
            <ChevronRight className={cn("w-5 h-5", ar ? 'rotate-180' : '')} />
          </motion.button>
          <button
            onClick={() => navigate(-1)}
            className="py-3 text-white/40 font-bold text-sm"
          >
            {ar ? 'رجوع' : 'Back'}
          </button>
        </div>

        <div className="absolute bottom-6 flex items-center gap-2 text-white/20 text-[10px] font-black uppercase tracking-widest">
          <Smartphone className="w-3 h-3" />
          {ar ? 'Android Chrome + ARCore' : 'Android Chrome + ARCore required'}
        </div>
      </div>
    );
  }

  // ─── Simulation mode (camera feed + CSS-overlay labels) ──────────────────
  if (phase === 'sim') {
    return (
      <div className="fixed inset-0 bg-black overflow-hidden" dir={dir}>
        {/* Live camera feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark vignette so labels are readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

        {/* Sim badge */}
        <div className="absolute top-6 left-0 right-0 flex justify-center pointer-events-none">
          <div className="px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/40 backdrop-blur-xl text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className="w-2 h-2 rounded-full bg-emerald-400" />
            {ar ? 'وضع المحاكاة — AR' : 'Simulation Mode — AR'}
          </div>
        </div>

        {/* Close */}
        <button
          onClick={endAR}
          className="absolute top-6 left-6 w-11 h-11 bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-xl border border-white/10 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Floating shelf labels */}
        {labels.map((label, i) => {
          const books = booksForShelf(label.shelfId);
          return (
            <motion.div
              key={label.id}
              className="absolute flex flex-col items-center pointer-events-none"
              style={{ left: label.screenX, top: label.screenY, width: 120 }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
            >
              <div className="bg-primary/90 backdrop-blur-xl rounded-xl px-3 py-2 border border-accent/40 shadow-2xl shadow-accent/20">
                <div className="text-[10px] font-black text-accent uppercase tracking-widest">{ar ? 'رف' : 'Shelf'}</div>
                <div className="text-white font-black text-sm">{label.shelfId}</div>
                {books[0] && (
                  <div className="text-white/60 text-[9px] font-bold mt-0.5 leading-tight line-clamp-1">{books[0].title}</div>
                )}
              </div>
              <div className="w-px h-5 bg-accent/60" />
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                className="w-3 h-3 rounded-full bg-accent shadow-[0_0_12px_rgba(217,179,16,0.9)]"
              />
            </motion.div>
          );
        })}

        {/* Scan line sweep effect */}
        <motion.div
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent pointer-events-none"
          animate={{ top: ['10%', '90%', '10%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />

        {/* Bottom hint */}
        <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none">
          <p className="text-white/60 text-xs font-bold text-center px-8">
            {ar ? 'محاكاة AR — لا يتطلب ARCore' : 'AR Simulation — no ARCore needed'}
          </p>
        </div>
      </div>
    );
  }

  // ─── Active AR session ────────────────────────────────────────────────────
  return (
    <>
      {/* WebGL canvas — transparent, required by WebXR */}
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none" />

      {/* DOM overlay — sits on top of camera feed */}
      <div ref={overlayRef} className="fixed inset-0">

        {/* Placed labels — positioned via direct DOM manipulation in RAF */}
        {labels.map(label => {
          const books = booksForShelf(label.shelfId);
          return (
            <div
              key={label.id}
              ref={el => { labelElemsRef.current[label.id] = el; }}
              className="absolute flex flex-col items-center pointer-events-none"
              style={{ left: label.screenX, top: label.screenY, width: 120 }}
            >
              <div className="bg-primary/90 backdrop-blur-xl rounded-xl px-3 py-2 border border-accent/30 shadow-2xl">
                <div className="text-[10px] font-black text-accent uppercase tracking-widest">{ar ? 'رف' : 'Shelf'}</div>
                <div className="text-white font-black text-sm">{label.shelfId}</div>
                {books[0] && (
                  <div className="text-white/60 text-[9px] font-bold mt-0.5 leading-tight line-clamp-1">{books[0].title}</div>
                )}
              </div>
              {/* Connector */}
              <div className="w-px h-4 bg-accent/50" />
              <div className="w-3 h-3 rounded-full bg-accent shadow-[0_0_8px_rgba(217,179,16,0.8)]" />
            </div>
          );
        })}

        {/* Center reticle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <motion.div
            animate={{ scale: hitDetected ? 1 : 0.85, opacity: hitDetected ? 1 : 0.5 }}
            className={cn(
              "w-16 h-16 rounded-full border-2 transition-colors duration-200",
              hitDetected ? "border-emerald-400" : "border-white/60"
            )}
          />
          {/* Corner marks */}
          {[0, 90, 180, 270].map(deg => (
            <div
              key={deg}
              className={cn(
                "absolute w-3 h-3 transition-colors duration-200",
                hitDetected ? "border-emerald-400" : "border-white/60"
              )}
              style={{
                top: deg === 90 || deg === 180 ? 'auto' : 0,
                bottom: deg === 90 || deg === 180 ? 0 : 'auto',
                left: deg === 0 || deg === 90 ? 0 : 'auto',
                right: deg === 0 || deg === 90 ? 'auto' : 0,
                borderTopWidth: deg === 0 || deg === 270 ? 2 : 0,
                borderBottomWidth: deg === 90 || deg === 180 ? 2 : 0,
                borderLeftWidth: deg === 0 || deg === 90 ? 2 : 0,
                borderRightWidth: deg === 180 || deg === 270 ? 2 : 0,
              }}
            />
          ))}
          {hitDetected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-400"
            />
          )}
        </div>

        {/* Tap hint */}
        <AnimatePresence>
          {hitDetected && !showPicker && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute bottom-48 left-0 right-0 flex justify-center pointer-events-none"
            >
              <div className="px-5 py-2.5 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-emerald-400 text-xs font-black backdrop-blur-xl">
                {ar ? '⬆ انقر للصق تسمية الرف' : '⬆ Tap to pin a shelf label'}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shelf picker */}
        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-0 left-0 right-0 bg-primary/95 backdrop-blur-2xl rounded-t-[2rem] p-6 space-y-4"
            >
              <div className={cn("flex items-center justify-between", ar ? 'flex-row-reverse' : '')}>
                <h3 className="text-white font-black text-base">
                  {ar ? 'اختر رقم الرف' : 'Select Shelf Number'}
                </h3>
                <button onClick={() => setShowPicker(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {SHELVES.map(shelf => {
                  const books = booksForShelf(shelf);
                  return (
                    <motion.button
                      key={shelf}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => placeLabel(shelf)}
                      className="flex flex-col items-center gap-1 py-3 px-2 bg-white/10 hover:bg-accent/20 border border-white/10 hover:border-accent/30 rounded-2xl transition-all"
                    >
                      <span className="text-white font-black text-sm">{shelf}</span>
                      {books[0] && (
                        <span className="text-white/40 text-[8px] font-bold leading-tight text-center line-clamp-2">{books[0].title}</span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status bar */}
        <div className="absolute top-6 left-0 right-0 flex justify-center pointer-events-none">
          <div className={cn(
            "px-4 py-2 rounded-full text-xs font-black backdrop-blur-xl border flex items-center gap-2",
            hitDetected
              ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-400"
              : "bg-white/10 border-white/10 text-white/60"
          )}>
            <motion.div
              animate={{ scale: hitDetected ? [1, 1.3, 1] : 1 }}
              transition={{ duration: 0.5, repeat: hitDetected ? Infinity : 0 }}
              className={cn("w-2 h-2 rounded-full", hitDetected ? "bg-emerald-400" : "bg-white/30")}
            />
            {hitDetected
              ? (ar ? 'سطح مكتشف — انقر للإضافة' : 'Surface detected — tap to place')
              : (ar ? 'يبحث عن الأسطح...' : 'Searching for surfaces...')}
          </div>
        </div>

        {/* Label count badge */}
        {labels.length > 0 && (
          <div className="absolute top-6 right-6 flex items-center gap-2 pointer-events-none">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <span className="text-primary text-xs font-black">{labels.length}</span>
            </div>
          </div>
        )}

        {/* Close */}
        <button
          onClick={endAR}
          className="absolute top-6 left-6 w-11 h-11 bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-xl border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </>
  );
}
