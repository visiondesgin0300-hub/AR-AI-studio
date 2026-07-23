import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Sparkles, Navigation, BookOpen, Zap, Star, Clock, FileText, ChevronRight, Languages, Loader2 } from 'lucide-react';
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

interface TranslationResult {
  titleTranslated: string;
  descriptionTranslated: string;
  readingLevel: string;
  tags: string[];
}

export function LibraryLens() {
  const navigate = useNavigate();
  const { language, dir } = useLanguage();
  const ar = language === 'ar';

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const gyroLayerRef = useRef<HTMLDivElement>(null);

  // Use refs for scanning flag to avoid stale-closure & re-render issues
  const scanningRef = useRef(false);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [phase, setPhase] = useState<'loading' | 'live' | 'denied'>('loading');
  const [deniedReason, setDeniedReason] = useState<'permission' | 'notfound' | 'inuse' | 'other'>('permission');
  const [cards, setCards] = useState<ARCard[]>([]);
  const [scanning, setScanning] = useState(false);
  const [ripplePos, setRipplePos] = useState<{ x: number; y: number } | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [translations, setTranslations] = useState<Record<string, TranslationResult>>({});
  const [translating, setTranslating] = useState<Record<string, boolean>>({});

  // Gyroscope parallax — iOS 13+ needs explicit permission
  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      const layer = gyroLayerRef.current;
      if (!layer) return;
      const b = Math.max(-20, Math.min(20, (e.beta ?? 0) - 45));
      const g = Math.max(-20, Math.min(20, e.gamma ?? 0));
      layer.style.transform = `perspective(800px) rotateX(${-b * 0.12}deg) rotateY(${g * 0.12}deg)`;
    };

    // On iOS 13+, DeviceOrientationEvent.requestPermission() must be called
    // from a user gesture — we trigger it once on mount right after camera start.
    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof DOE.requestPermission === 'function') {
      DOE.requestPermission()
        .then(state => { if (state === 'granted') window.addEventListener('deviceorientation', handler, { passive: true }); })
        .catch(() => {});
    } else {
      window.addEventListener('deviceorientation', handler, { passive: true });
    }
    return () => window.removeEventListener('deviceorientation', handler);
  }, []);

  // Start camera — two-stage: prefer back camera, fall back to any camera
  useEffect(() => {
    let cancelled = false;

    const attachStream = (stream: MediaStream) => {
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      const v = videoRef.current;
      if (!v) { if (!cancelled) { setDeniedReason('other'); setPhase('denied'); } return; }
      v.srcObject = stream;
      v.addEventListener('playing', () => { if (!cancelled) setPhase('live'); }, { once: true });
      v.play().catch(() => { if (!cancelled) { setDeniedReason('other'); setPhase('denied'); } });
    };

    const classifyError = (e: unknown): 'permission' | 'notfound' | 'inuse' | 'other' => {
      const name = (e as DOMException)?.name ?? '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') return 'permission';
      if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'notfound';
      if (name === 'NotReadableError' || name === 'TrackStartError') return 'inuse';
      return 'other';
    };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then(attachStream)
      .catch(err1 => {
        const reason = classifyError(err1);
        if (reason === 'permission') {
          if (!cancelled) { setDeniedReason('permission'); setPhase('denied'); }
          return;
        }
        navigator.mediaDevices
          .getUserMedia({ video: true, audio: false })
          .then(attachStream)
          .catch(err2 => {
            if (!cancelled) { setDeniedReason(classifyError(err2)); setPhase('denied'); }
          });
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, []);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    // Wait until video has at least one frame
    if (video.readyState < 2 || video.videoWidth === 0) return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const b64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
    return b64 ?? null;
  }, []);

  const runScan = useCallback(async (tapX: number, tapY: number) => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setScanning(true);

    // Show ripple
    setRipplePos({ x: tapX, y: tapY });
    setTimeout(() => setRipplePos(null), 900);

    const imageData = captureFrame();
    if (!imageData) {
      scanningRef.current = false;
      setScanning(false);
      return;
    }

    try {
      const res = await fetch('/api/vision-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data.fallbackReason === 'quota') setQuotaExceeded(true);
      const book = MOCK_BOOKS.find(b => b.id === data.bookId);
      if (book) {
        const cx = Math.min(Math.max(tapX - 110, 12), window.innerWidth - 232);
        const cy = Math.min(Math.max(tapY - 80, 80), window.innerHeight - 260);
        const card: ARCard = {
          id: Date.now().toString(),
          x: cx,
          y: cy,
          book,
          reason: data.reason ?? (ar ? 'وضع عرض توضيحي — تجاوز حصة الذكاء الاصطناعي' : 'Demo mode — AI quota exceeded'),
          whatISaw: data.whatISaw ?? '',
        };
        setCards(prev => [...prev.slice(-3), card]);
      }
    } catch {
      // silent — next auto-scan will retry
    }

    scanningRef.current = false;
    setScanning(false);
  }, [captureFrame]);

  const translateCard = useCallback(async (cardId: string, book: Book) => {
    if (translations[cardId] || translating[cardId]) return;
    setTranslating(prev => ({ ...prev, [cardId]: true }));
    try {
      const res = await fetch('/api/translate-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: book.titleEn || book.title, description: book.description, targetLang: 'ar' }),
      });
      const data = await res.json();
      setTranslations(prev => ({ ...prev, [cardId]: data }));
    } catch { /* silent */ }
    setTranslating(prev => ({ ...prev, [cardId]: false }));
  }, [translations, translating]);

  // Scan on tap only — no auto-scan

  // Single tap handler — no onTouchStart to avoid double-fire on mobile
  const handleTap = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== 'live') return;
    const rect = e.currentTarget.getBoundingClientRect();
    runScan(e.clientX - rect.left, e.clientY - rect.top);
  }, [phase, runScan]);

  const deniedMsgs = {
    permission: {
      title: ar ? 'تم حظر الكاميرا' : 'Camera blocked',
      body: ar
        ? 'اضغط على أيقونة القفل 🔒 في شريط العنوان ← الكاميرا ← سماح، ثم أعد التحميل'
        : 'Tap the lock 🔒 in the address bar → Camera → Allow, then reload',
    },
    notfound: {
      title: ar ? 'لا توجد كاميرا' : 'No camera found',
      body: ar ? 'لم يتم اكتشاف أي كاميرا على هذا الجهاز' : 'No camera device detected on this device',
    },
    inuse: {
      title: ar ? 'الكاميرا مشغولة' : 'Camera in use',
      body: ar
        ? 'الكاميرا مفتوحة في تطبيق آخر — أغلقه ثم أعد التحميل'
        : 'Camera is open in another app — close it then reload',
    },
    other: {
      title: ar ? 'خطأ في الكاميرا' : 'Camera error',
      body: ar ? 'تعذّر فتح الكاميرا، يرجى إعادة المحاولة' : 'Could not open camera, please try again',
    },
  };
  const dMsg = deniedMsgs[deniedReason];

  // Single root — video is ALWAYS in DOM so videoRef is available during camera init.
  // Loading and denied panels overlay it instead of replacing it.
  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden select-none"
      dir={dir}
      onClick={phase === 'live' ? handleTap : undefined}
      style={{ cursor: phase === 'live' ? 'crosshair' : 'default' }}
    >
      {/* Camera — always mounted so ref is available from the first render */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ visibility: phase === 'live' ? 'visible' : 'hidden' }}
      />

      {/* Hidden capture canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ─── Loading overlay ─── */}
      {phase === 'loading' && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-20">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.4, repeat: Infinity }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <p className="text-white/60 text-sm font-black uppercase tracking-widest">
              {ar ? 'تشغيل الكاميرا...' : 'Starting camera...'}
            </p>
          </motion.div>
        </div>
      )}

      {/* ─── Denied overlay ─── */}
      {phase === 'denied' && (
        <div className="absolute inset-0 bg-primary flex flex-col items-center justify-center p-8 text-center gap-6 z-20">
          <div className="w-20 h-20 rounded-[2rem] bg-red-500/20 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-xl font-black text-white">{dMsg.title}</h2>
          <p className="text-white/50 text-sm font-bold max-w-xs leading-relaxed">{dMsg.body}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-accent text-primary rounded-2xl font-black"
          >
            {ar ? 'إعادة تحميل' : 'Reload'}
          </button>
          <button onClick={() => navigate(-1)} className="text-white/30 text-sm font-bold">{ar ? 'رجوع' : 'Back'}</button>
        </div>
      )}

      {/* ─── Live UI ─── */}
      {phase === 'live' && (
        <>
          {/* Quota exceeded banner */}
          {quotaExceeded && (
            <motion.div
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute top-0 left-0 right-0 z-40 bg-amber-500/90 backdrop-blur-sm px-4 py-2.5 flex items-center justify-between gap-2"
            >
              <p className="text-black text-[11px] font-black leading-tight">
                {ar
                  ? '⚠️ حصة Gemini AI المجانية منتهية — العرض في وضع تجريبي. فعّل الفوترة على Google AI Studio للمسح الحقيقي.'
                  : '⚠️ Gemini free quota exceeded — running in demo mode. Enable billing on Google AI Studio for real scanning.'}
              </p>
              <button onClick={() => setQuotaExceeded(false)} className="shrink-0 text-black/60 text-lg leading-none">×</button>
            </motion.div>
          )}

          {/* Subtle scan grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-15"
            style={{
              backgroundImage:
                'linear-gradient(rgba(0,210,180,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,210,180,0.5) 1px, transparent 1px)',
              backgroundSize: '72px 72px',
            }}
          />

          {/* Sweep line — pure CSS animation, no JS re-renders */}
          <div className="absolute left-0 right-0 pointer-events-none" style={{ animation: 'lensSwep 3s linear infinite' }}>
            <div
              className="h-px"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(0,210,180,0.9) 30%, rgba(217,179,16,0.8) 50%, rgba(0,210,180,0.9) 70%, transparent)',
                boxShadow: '0 0 8px rgba(0,210,180,0.5)',
              }}
            />
          </div>
          <style>{`@keyframes lensSwep { 0%{top:5%} 50%{top:92%} 100%{top:5%} }`}</style>

          {/* Corner brackets */}
          {(['tl','tr','bl','br'] as const).map(c => (
            <div key={c} className={cn('absolute w-10 h-10 pointer-events-none', c.includes('t') ? 'top-16' : 'bottom-32', c.includes('l') ? 'left-6' : 'right-6')}>
              <div className={cn('absolute w-10 h-0.5 bg-accent/70', c.includes('t') ? 'top-0' : 'bottom-0')} />
              <div className={cn('absolute h-10 w-0.5 bg-accent/70', c.includes('l') ? 'left-0' : 'right-0')} />
            </div>
          ))}

          {/* Tap hint — shown when no cards and not scanning */}
          {!scanning && cards.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-36 left-0 right-0 flex flex-col items-center gap-2 pointer-events-none"
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="w-16 h-16 rounded-full border-2 border-accent/60 flex items-center justify-center"
              >
                <Zap className="w-7 h-7 text-accent" />
              </motion.div>
              <p className="text-white/70 text-xs font-black tracking-widest uppercase">
                {ar ? 'اضغط على الشاشة للمسح' : 'Tap to scan'}
              </p>
            </motion.div>
          )}

          {/* Gyro parallax layer for AR cards */}
          <div
            ref={gyroLayerRef}
            className="absolute inset-0 pointer-events-none"
            style={{ transformStyle: 'preserve-3d', transition: 'transform 0.08s ease-out' }}
          >
            <AnimatePresence>
              {cards.map(card => {
                const b = card.book;
                const isAvailable = b.status !== 'borrowed';
                const loc = b.location
                  ? `${ar ? 'طابق' : 'Floor'} ${b.location.floor} · ${ar ? 'ممر' : 'Aisle'} ${b.location.aisle} · ${ar ? 'رف' : 'Shelf'} ${b.location.shelf}`
                  : b.shelf ? `${ar ? 'رف' : 'Shelf'} ${b.shelf}` : '';
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, scale: 0.8, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                    className="absolute pointer-events-auto"
                    style={{ left: card.x, top: card.y, width: 270 }}
                  >
                    {/* AR connector dot */}
                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-5 flex flex-col items-center">
                      <div className="w-px h-4 bg-accent/40" />
                      <motion.div animate={{ scale: [1, 1.6, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_rgba(217,179,16,0.8)]" />
                    </div>

                    <div className="bg-black/88 backdrop-blur-2xl rounded-2xl border border-accent/30 overflow-hidden shadow-2xl">

                      {/* ── Header ── */}
                      <div className="flex items-center justify-between px-3 pt-2.5 pb-2 border-b border-white/8">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-accent" />
                          <span className="text-[9px] font-black text-accent uppercase tracking-widest">
                            {ar ? 'كتاب مُعرَّف بالذكاء الاصطناعي' : 'AI Identified Book'}
                          </span>
                        </div>
                        <button className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center"
                          onClick={e => { e.stopPropagation(); setCards(p => p.filter(c => c.id !== card.id)); }}>
                          <X className="w-3 h-3 text-white/50" />
                        </button>
                      </div>

                      {/* ── What AI saw ── */}
                      {card.whatISaw ? (
                        <div className="px-3 pt-2">
                          <p className="text-white/35 text-[8px] italic line-clamp-1">
                            {ar ? '👁 ' : '👁 '}{card.whatISaw}
                          </p>
                        </div>
                      ) : null}

                      {/* ── Title + Author ── */}
                      <div className="px-3 pt-2 pb-1.5">
                        <p className="text-white font-black text-[12px] leading-tight mb-0.5 line-clamp-2">{b.titleEn || b.title}</p>
                        {(b.titleArabic || (b.titleEn && b.title !== b.titleEn)) && (
                          <p className="text-white/55 text-[10px] font-bold mb-0.5 line-clamp-1 text-right" dir="rtl">{b.titleArabic || b.title}</p>
                        )}
                        <p className="text-white/55 text-[9px]">{b.author}{b.year ? ` · ${b.year}` : ''}{b.pages ? ` · ${b.pages} ${ar ? 'ص' : 'pp'}` : ''}</p>
                      </div>

                      {/* ── Status + Category badges ── */}
                      <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-[8px] font-black',
                          isAvailable ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        )}>
                          {isAvailable ? (ar ? '✓ متاح' : '✓ Available') : (ar ? '✗ مستعار' : '✗ Borrowed')}
                        </span>
                        {b.category && (
                          <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[8px] font-bold border border-accent/25">
                            {b.category}
                          </span>
                        )}
                        {b.genre && (
                          <span className="px-2 py-0.5 rounded-full bg-white/8 text-white/50 text-[8px] font-bold">
                            {b.genre}
                          </span>
                        )}
                      </div>

                      {/* ── Location ── */}
                      {loc && (
                        <div className="px-3 pb-2 flex items-center gap-1.5">
                          <MapPin className="w-2.5 h-2.5 text-accent shrink-0" />
                          <span className="text-accent text-[9px] font-black">{loc}</span>
                        </div>
                      )}

                      {/* ── Call number ── */}
                      {b.callNumber && (
                        <div className="px-3 pb-2 flex items-center gap-1.5">
                          <FileText className="w-2.5 h-2.5 text-white/30 shrink-0" />
                          <span className="text-white/30 text-[8px] font-mono">{b.callNumber}</span>
                        </div>
                      )}

                      {/* ── Description ── */}
                      {b.description && (
                        <div className="px-3 pb-2">
                          <p className="text-white/40 text-[8.5px] leading-relaxed line-clamp-2">{b.description}</p>
                        </div>
                      )}

                      {/* ── AI reason ── */}
                      {card.reason && (
                        <div className="px-3 pb-2">
                          <p className="text-accent/55 text-[8px] italic line-clamp-1">✦ {card.reason}</p>
                        </div>
                      )}

                      {/* ── AR Translation panel ── */}
                      <AnimatePresence>
                        {translations[card.id] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mx-3 mb-2 p-2.5 rounded-xl bg-accent/10 border border-accent/25 space-y-1"
                            dir="rtl"
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <Languages className="w-3 h-3 text-accent" />
                              <span className="text-[9px] font-black text-accent uppercase tracking-widest">ترجمة AR فورية</span>
                            </div>
                            <p className="text-white font-black text-[11px] leading-tight">{translations[card.id].titleTranslated}</p>
                            <p className="text-white/55 text-[9px] leading-relaxed line-clamp-3">{translations[card.id].descriptionTranslated}</p>
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              <span className="px-1.5 py-0.5 rounded bg-primary/50 text-white/60 text-[8px] font-bold">{translations[card.id].readingLevel}</span>
                              {translations[card.id].tags?.slice(0, 3).map(tag => (
                                <span key={tag} className="px-1.5 py-0.5 rounded bg-white/10 text-white/50 text-[8px]">{tag}</span>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* ── Action buttons ── */}
                      <div className="px-3 pb-3 flex flex-col gap-1.5">
                        <button
                          onClick={e => { e.stopPropagation(); navigate(`/book/${b.id}`); }}
                          className="w-full py-2 bg-accent rounded-xl text-primary font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5"
                        >
                          <BookOpen className="w-3 h-3" />
                          {ar ? 'تفاصيل الكتاب الكاملة' : 'Full Book Details'}
                          <ChevronRight className="w-3 h-3" />
                        </button>
                        <div className="flex gap-1.5">
                          <button
                            onClick={e => { e.stopPropagation(); navigate('/map', { state: { bookId: b.id } }); }}
                            className="flex-1 py-1.5 bg-white/8 border border-white/12 rounded-xl text-white/70 font-bold text-[10px] flex items-center justify-center gap-1.5"
                          >
                            <Navigation className="w-3 h-3" />
                            {ar ? 'الملاحة للرف' : 'Navigate'}
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); translateCard(card.id, b); }}
                            disabled={!!translations[card.id] || translating[card.id]}
                            className="flex-1 py-1.5 bg-accent/15 border border-accent/25 rounded-xl text-accent font-bold text-[10px] flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            {translating[card.id]
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Languages className="w-3 h-3" />}
                            {ar ? 'ترجمة AR' : 'Translate'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Tap ripple */}
          <AnimatePresence>
            {ripplePos && (
              <motion.div
                key={`${ripplePos.x}-${ripplePos.y}`}
                className="absolute pointer-events-none border-2 border-accent rounded-full"
                style={{ left: ripplePos.x - 24, top: ripplePos.y - 24, width: 48, height: 48 }}
                initial={{ scale: 0.3, opacity: 1 }}
                animate={{ scale: 3.5, opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            )}
          </AnimatePresence>

          {/* Top status */}
          <div className="absolute top-0 left-0 right-0 flex flex-col items-center pt-10 gap-2 pointer-events-none">
            <div className={cn('px-4 py-2 rounded-full backdrop-blur-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors', scanning ? 'bg-accent/20 border-accent/40 text-accent' : 'bg-black/40 border-white/10 text-white/70')}>
              <motion.div animate={scanning ? { scale: [1, 1.5, 1] } : { opacity: [1, 0.4, 1] }} transition={{ duration: scanning ? 0.5 : 1.8, repeat: Infinity }} className={cn('w-2 h-2 rounded-full', scanning ? 'bg-accent' : 'bg-emerald-400')} />
              {scanning ? (ar ? 'جاري التحليل...' : 'Analyzing...') : (ar ? 'عدسة المكتبة الذكية' : 'Smart Library Lens')}
            </div>
            <AnimatePresence>
              {scanning && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 text-accent text-[9px] font-black uppercase tracking-widest">
                  <Zap className="w-3 h-3" />
                  {ar ? 'Gemini AI يحلل المشهد...' : 'Gemini AI analyzing scene...'}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom hint */}
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-10 gap-2 pointer-events-none">
            <AnimatePresence>
              {!scanning && cards.length === 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="px-5 py-2.5 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 text-white/70 text-xs font-bold">
                  {ar ? '👆 اضغط في أي مكان لمسح الكتب' : '👆 Tap anywhere to scan books'}
                </motion.div>
              )}
            </AnimatePresence>
            {cards.length > 0 && (
              <button onClick={e => { e.stopPropagation(); setCards([]); }} className="pointer-events-auto px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/10 text-white/50 text-[10px] font-bold">
                {ar ? 'مسح البطاقات' : 'Clear cards'}
              </button>
            )}
          </div>
        </>
      )}

      {/* Close — always visible */}
      <button
        onClick={e => { e.stopPropagation(); navigate(-1); }}
        className="absolute top-8 left-6 w-11 h-11 bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-xl border border-white/10 pointer-events-auto z-30"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
