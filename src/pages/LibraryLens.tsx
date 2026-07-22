import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Scan, MapPin, Sparkles, Navigation, BookOpen, Zap } from 'lucide-react';
import { MOCK_BOOKS } from '../data/mockData';
import { Book } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';

interface ARCard {
  id: string;
  x: number;
  y: number;
  book: Book;
  reason: string;
  whatISaw: string;
}

interface ScanRipple {
  id: string;
  x: number;
  y: number;
}

export function LibraryLens() {
  const navigate = useNavigate();
  const { language, dir } = useLanguage();
  const ar = language === 'ar';

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const autoScanRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gyroLayerRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<'loading' | 'live' | 'denied'>('loading');
  const [cards, setCards] = useState<ARCard[]>([]);
  const [ripples, setRipples] = useState<ScanRipple[]>([]);
  const [scanning, setScanning] = useState(false);
  const [sweepY, setSweepY] = useState(0);

  // Sweep animation
  useEffect(() => {
    let dir = 1;
    let y = 0;
    const t = setInterval(() => {
      y += dir * 1.2;
      if (y >= 100) dir = -1;
      if (y <= 0) dir = 1;
      setSweepY(y);
    }, 16);
    return () => clearInterval(t);
  }, []);

  // Gyroscope parallax
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      const layer = gyroLayerRef.current;
      if (!layer) return;
      const b = Math.max(-20, Math.min(20, (e.beta ?? 0) - 45));
      const g = Math.max(-20, Math.min(20, e.gamma ?? 0));
      layer.style.transform = `perspective(800px) rotateX(${-b * 0.15}deg) rotateY(${g * 0.15}deg)`;
    };
    window.addEventListener('deviceorientation', handler);
    return () => window.removeEventListener('deviceorientation', handler);
  }, []);

  // Start camera
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setPhase('live');
      })
      .catch(() => setPhase('denied'));
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (autoScanRef.current) clearInterval(autoScanRef.current);
    };
  }, []);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.75).split(',')[1] ?? null;
  }, []);

  const triggerScan = useCallback(async (tapX: number, tapY: number, auto = false) => {
    if (scanning) return;
    setScanning(true);

    const rippleId = Date.now().toString();
    setRipples(p => [...p, { id: rippleId, x: tapX, y: tapY }]);
    setTimeout(() => setRipples(p => p.filter(r => r.id !== rippleId)), 1200);

    const imageData = captureFrame();
    if (!imageData) { setScanning(false); return; }

    try {
      const res = await fetch('/api/vision-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData }),
      });
      const data = await res.json();
      const book = MOCK_BOOKS.find(b => b.id === data.bookId);
      if (book) {
        const cx = auto ? window.innerWidth / 2 : tapX;
        const cy = auto ? window.innerHeight * 0.38 : tapY;
        const card: ARCard = {
          id: Date.now().toString(),
          x: Math.min(Math.max(cx - 110, 12), window.innerWidth - 232),
          y: Math.min(Math.max(cy - 80, 80), window.innerHeight - 260),
          book,
          reason: data.reason ?? '',
          whatISaw: data.whatISaw ?? '',
        };
        setCards(p => [...p.slice(-3), card]);
      }
    } catch {
      // silent
    }
    setScanning(false);
  }, [scanning, captureFrame]);

  // Auto-scan every 5 seconds when live
  useEffect(() => {
    if (phase !== 'live') return;
    const t = setTimeout(() => {
      triggerScan(window.innerWidth / 2, window.innerHeight / 2, true);
    }, 2000);
    autoScanRef.current = setInterval(() => {
      triggerScan(window.innerWidth / 2, window.innerHeight / 2, true);
    }, 5000);
    return () => { clearTimeout(t); if (autoScanRef.current) clearInterval(autoScanRef.current); };
  }, [phase, triggerScan]);

  const handleTap = (e: React.TouchEvent | React.MouseEvent) => {
    if (phase !== 'live' || scanning) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? e.currentTarget.getBoundingClientRect().left : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? e.currentTarget.getBoundingClientRect().top : (e as React.MouseEvent).clientY;
    triggerScan(clientX - rect.left, clientY - rect.top);
  };

  // ─── Denied ───────────────────────────────────────────────────────────────
  if (phase === 'denied') {
    return (
      <div className="fixed inset-0 bg-primary flex flex-col items-center justify-center p-8 text-center gap-6" dir={dir}>
        <div className="w-20 h-20 rounded-[2rem] bg-red-500/20 flex items-center justify-center">
          <Scan className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-xl font-black text-white">{ar ? 'لا يمكن الوصول للكاميرا' : 'Camera access denied'}</h2>
        <p className="text-white/50 text-sm font-bold max-w-xs">{ar ? 'يرجى السماح للتطبيق باستخدام الكاميرا من إعدادات المتصفح' : 'Allow camera access in browser settings and try again'}</p>
        <button onClick={() => navigate(-1)} className="px-8 py-4 bg-accent text-primary rounded-2xl font-black">{ar ? 'رجوع' : 'Back'}</button>
      </div>
    );
  }

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center" dir={dir}>
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.4, repeat: Infinity }} className="flex flex-col items-center gap-4">
          <Scan className="w-12 h-12 text-accent" />
          <p className="text-white/60 text-sm font-black uppercase tracking-widest">{ar ? 'تشغيل الكاميرا...' : 'Starting camera...'}</p>
        </motion.div>
      </div>
    );
  }

  // ─── Live ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden select-none"
      dir={dir}
      onTouchStart={handleTap}
      onClick={handleTap}
    >
      {/* Camera */}
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />

      {/* Capture canvas (hidden) */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Grid overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: 'linear-gradient(rgba(0,210,200,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,210,200,0.4) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Sweep line */}
      <div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{
          top: `${sweepY}%`,
          background: 'linear-gradient(90deg, transparent, rgba(0,210,200,0.9) 30%, rgba(217,179,16,0.8) 50%, rgba(0,210,200,0.9) 70%, transparent)',
          boxShadow: '0 0 10px rgba(0,210,200,0.6)',
        }}
      />

      {/* Corner brackets */}
      {(['tl', 'tr', 'bl', 'br'] as const).map(c => (
        <div key={c} className={cn('absolute w-8 h-8 pointer-events-none', c.includes('t') ? 'top-20' : 'bottom-28', c.includes('l') ? 'left-6' : 'right-6')}>
          <div className={cn('absolute w-8 h-px bg-accent', c.includes('t') ? 'top-0' : 'bottom-0')} />
          <div className={cn('absolute h-8 w-px bg-accent', c.includes('l') ? 'left-0' : 'right-0')} />
        </div>
      ))}

      {/* Gyro parallax layer for AR cards */}
      <div ref={gyroLayerRef} className="absolute inset-0 pointer-events-none" style={{ transformStyle: 'preserve-3d', transition: 'transform 0.1s ease-out' }}>
        {/* AR Cards */}
        <AnimatePresence>
          {cards.map(card => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, scale: 0.7, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute pointer-events-auto"
              style={{ left: card.x, top: card.y, width: 220 }}
            >
              {/* Connector dot */}
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 flex flex-col items-center gap-0">
                <div className="w-px h-3 bg-accent/60" />
                <motion.div animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 1.2, repeat: Infinity }} className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_10px_rgba(217,179,16,0.9)]" />
              </div>

              <div className="bg-black/80 backdrop-blur-2xl rounded-2xl border border-accent/40 overflow-hidden shadow-2xl shadow-accent/10">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-accent" />
                    <span className="text-[9px] font-black text-accent uppercase tracking-widest">{ar ? 'مسح ذكي' : 'AI Scan'}</span>
                  </div>
                  <button
                    className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center"
                    onClick={e => { e.stopPropagation(); setCards(p => p.filter(c => c.id !== card.id)); }}
                  >
                    <X className="w-3 h-3 text-white/60" />
                  </button>
                </div>

                {/* What AI saw */}
                {card.whatISaw ? (
                  <div className="px-3 pt-2 pb-0">
                    <p className="text-white/40 text-[9px] font-bold leading-relaxed line-clamp-1">{card.whatISaw}</p>
                  </div>
                ) : null}

                {/* Book info */}
                <div className="px-3 py-2.5 flex items-start gap-2.5">
                  <div className="w-9 h-12 rounded-lg bg-accent/20 flex items-center justify-center shrink-0 border border-accent/20">
                    <BookOpen className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-[11px] leading-tight line-clamp-2">{card.book.title}</p>
                    <p className="text-white/50 text-[9px] font-bold mt-0.5">{card.book.author}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-2.5 h-2.5 text-accent" />
                      <span className="text-accent text-[9px] font-black">{ar ? 'رف' : 'Shelf'} {card.book.shelf}</span>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                {card.reason ? (
                  <div className="px-3 pb-2">
                    <p className="text-white/40 text-[9px] leading-relaxed line-clamp-2">{card.reason}</p>
                  </div>
                ) : null}

                {/* Navigate button */}
                <div className="px-3 pb-3">
                  <button
                    onClick={e => { e.stopPropagation(); navigate('/map', { state: { bookId: card.book.id } }); }}
                    className="w-full py-2 bg-accent rounded-xl text-primary font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5"
                  >
                    <Navigation className="w-3 h-3" />
                    {ar ? 'اذهب للرف' : 'Navigate to shelf'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Ripples */}
      <AnimatePresence>
        {ripples.map(r => (
          <motion.div
            key={r.id}
            className="absolute pointer-events-none border-2 border-accent rounded-full"
            style={{ left: r.x - 25, top: r.y - 25, width: 50, height: 50 }}
            initial={{ scale: 0.3, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Top status bar */}
      <div className="absolute top-0 left-0 right-0 flex flex-col items-center pt-10 gap-2 pointer-events-none">
        <motion.div
          animate={{ opacity: scanning ? 1 : 0.85 }}
          className={cn(
            'px-4 py-2 rounded-full backdrop-blur-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2',
            scanning
              ? 'bg-accent/20 border-accent/40 text-accent'
              : 'bg-black/40 border-white/10 text-white/70'
          )}
        >
          <motion.div
            animate={scanning ? { scale: [1, 1.5, 1] } : { opacity: [1, 0.4, 1] }}
            transition={{ duration: scanning ? 0.5 : 1.5, repeat: Infinity }}
            className={cn('w-2 h-2 rounded-full', scanning ? 'bg-accent' : 'bg-emerald-400')}
          />
          {scanning ? (ar ? 'جاري المسح...' : 'Scanning...') : (ar ? 'عدسة المكتبة الذكية' : 'Smart Library Lens')}
        </motion.div>

        {scanning && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1.5 text-accent text-[9px] font-black uppercase tracking-widest">
            <Zap className="w-3 h-3" />
            {ar ? 'الذكاء الاصطناعي يحلل المشهد...' : 'AI analyzing scene...'}
          </motion.div>
        )}
      </div>

      {/* Bottom hint */}
      <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-10 gap-2 pointer-events-none">
        <AnimatePresence>
          {!scanning && cards.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="px-5 py-2.5 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 text-white/70 text-xs font-bold"
            >
              {ar ? '👆 اضغط على أي مكان لمسح الكتب' : '👆 Tap anywhere to scan books'}
            </motion.div>
          )}
        </AnimatePresence>
        {cards.length > 0 && (
          <button
            onClick={e => { e.stopPropagation(); setCards([]); }}
            className="pointer-events-auto px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/10 text-white/50 text-[10px] font-bold"
          >
            {ar ? 'مسح البطاقات' : 'Clear cards'}
          </button>
        )}
      </div>

      {/* Close */}
      <button
        onClick={e => { e.stopPropagation(); navigate(-1); }}
        className="absolute top-8 left-6 w-11 h-11 bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-xl border border-white/10 pointer-events-auto z-10"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
