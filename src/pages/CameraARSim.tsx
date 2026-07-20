import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book } from '../types';
import { MOCK_BOOKS } from '../data/mockData';
import { BookCover } from '../components/BookCover';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../hooks/useLanguage';
import { Camera, Sparkles, RotateCcw, BookOpen, FlipHorizontal2, MapPin, Eye } from 'lucide-react';
import { cn } from '../lib/utils';

type CamPhase = 'idle' | 'camera' | 'captured' | 'thinking' | 'revealed' | 'navigating' | 'arrived';

const SHELF_GRID: Record<string, [number, number]> = {
  'A-1': [0, 0], 'A-2': [0, 1],
  'B-1': [1, 0], 'B-2': [1, 1],
  'C-1': [2, 0], 'C-2': [2, 1],
  'D-1': [3, 0], 'D-2': [3, 1],
};

const ALL_SHELVES = Object.keys(SHELF_GRID) as (keyof typeof SHELF_GRID)[];

export function CameraARSim() {
  const navigate = useNavigate();
  const { language, dir } = useLanguage();
  const ar = language === 'ar';

  const [phase, setPhase] = useState<CamPhase>('idle');
  const [book, setBook] = useState<Book | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [whatISaw, setWhatISaw] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [multiCam, setMultiCam] = useState(false);
  // walker position within 4×2 grid; row 4.5 = below the map (entrance)
  const [walkerRow, setWalkerRow] = useState(4.5);
  const [walkerCol, setWalkerCol] = useState(0.5);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices().then(devs => {
      setMultiCam(devs.filter(d => d.kind === 'videoinput').length > 1);
    }).catch(() => {});
    return () => {
      abortRef.current = true;
      stopCamera();
    };
  }, []);

  function safeDelay(ms: number) {
    return new Promise<void>(resolve => {
      const id = setTimeout(() => { if (!abortRef.current) resolve(); }, ms);
      const check = setInterval(() => {
        if (abortRef.current) { clearTimeout(id); clearInterval(check); resolve(); }
      }, 50);
    });
  }

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setPhase('camera');
    } catch (e: any) {
      const denied = e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError';
      setError(denied
        ? (ar ? 'رُفض إذن الكاميرا. افتح إعدادات المتصفح وامنح الإذن.' : 'Camera permission denied. Allow it in browser settings.')
        : (ar ? 'تعذّر فتح الكاميرا.' : 'Unable to open camera.')
      );
    }
  };

  const flipCamera = async () => {
    const next: 'environment' | 'user' = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    stopCamera();
    await startCamera(next);
  };

  const captureAndAnalyze = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    // Capture frame to canvas
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    const base64 = dataUrl.split(',')[1];

    setCapturedImage(dataUrl);
    stopCamera();
    setPhase('captured');
    await safeDelay(700);
    if (abortRef.current) return;

    setPhase('thinking');
    try {
      const resp = await fetch('/api/vision-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: base64 }),
      });
      if (!resp.ok) throw new Error('api_error');
      const data: { bookId: string; whatISaw?: string; reason?: string } = await resp.json();
      if (abortRef.current) return;

      const found = MOCK_BOOKS.find(b => b.id === data.bookId) ?? MOCK_BOOKS[0];
      setBook(found);
      setReason(data.reason ?? null);
      setWhatISaw(data.whatISaw ?? null);

      setPhase('revealed');
      await safeDelay(2800);
      if (abortRef.current) return;

      const [tRow, tCol] = SHELF_GRID[found.shelf ?? 'A-1'] ?? [0, 0];
      setWalkerRow(4.5);
      setWalkerCol(0.5);
      setPhase('navigating');

      await safeDelay(600);
      if (abortRef.current) return;
      setWalkerRow(tRow);

      await safeDelay(900);
      if (abortRef.current) return;
      setWalkerCol(tCol);

      await safeDelay(900);
      if (abortRef.current) return;
      setPhase('arrived');
    } catch {
      if (abortRef.current) return;
      setError(ar ? 'فشل التحليل. حاول مجدداً.' : 'Analysis failed. Please try again.');
      setPhase('idle');
    }
  };

  const reset = (andStart = false) => {
    abortRef.current = false;
    stopCamera();
    setPhase('idle');
    setBook(null);
    setReason(null);
    setWhatISaw(null);
    setError(null);
    setCapturedImage(null);
    setWalkerRow(4.5);
    setWalkerCol(0.5);
    if (andStart) setTimeout(() => startCamera(), 50);
  };

  const targetPos = book ? (SHELF_GRID[book.shelf ?? 'A-1'] ?? [0, 0]) : [0, 0];

  // Phase progress dots
  const PHASE_SEQ: CamPhase[] = ['camera', 'captured', 'thinking', 'revealed', 'navigating', 'arrived'];
  const phaseIdx = PHASE_SEQ.indexOf(phase);

  return (
    <div className={cn('flex flex-col gap-6', dir === 'rtl' ? 'text-right' : 'text-left')}>

      {/* ── Header ── */}
      <div>
        <div className={cn('flex items-center gap-3 mb-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
          <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center text-accent">
            <Camera className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">GEMINI VISION AR</span>
        </div>
        <h1 className="text-3xl font-black text-primary dark:text-white tracking-tight">
          {ar ? 'المسح الحقيقي بـ Gemini Vision' : 'Real Scan — Gemini Vision'}
        </h1>
        <p className="text-slate-400 font-bold mt-1 text-sm leading-relaxed">
          {ar
            ? 'افتح الكاميرا، وجّهها نحو أي شيء، يحلّل Gemini Vision ما يراه ويختار الكتاب الأنسب من فهرس المكتبة.'
            : 'Open camera, point at anything. Gemini Vision analyzes what it sees and picks the best matching book.'}
        </p>
      </div>

      {/* ── Main card ── */}
      <div className="official-card overflow-hidden p-0">
        <AnimatePresence mode="wait">

          {/* ─── IDLE ─── */}
          {phase === 'idle' && (
            <motion.div key="idle"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
              className="p-8 md:p-12 flex flex-col items-center gap-8 text-center"
            >
              <div className="w-24 h-24 rounded-3xl bg-primary dark:bg-accent/10 flex items-center justify-center shadow-2xl shadow-primary/20 ring-4 ring-accent/20">
                <Camera className="w-12 h-12 text-accent" />
              </div>

              <div className="space-y-2 max-w-sm">
                <h2 className="text-2xl font-black text-primary dark:text-white">
                  {ar ? 'تجربة AR حقيقية بالذكاء الاصطناعي' : 'Real AI-Powered AR Experience'}
                </h2>
                <p className="text-sm text-slate-400 font-bold leading-relaxed">
                  {ar
                    ? 'يستخدم كاميرا جهازك الحقيقية + Gemini Vision API لتحليل ما تراه فعلاً واقتراح الكتاب الأنسب.'
                    : 'Uses your real device camera + Gemini Vision API to analyze what it actually sees and suggest the best book.'}
                </p>
              </div>

              <div className="flex gap-2 flex-wrap justify-center">
                {[
                  { icon: '📷', label: ar ? 'كاميرا حقيقية' : 'Real camera' },
                  { icon: '👁️', label: 'Gemini Vision' },
                  { icon: '🗺️', label: ar ? 'ملاحة حية' : 'Live nav' },
                ].map(({ icon, label }, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10">
                    <span className="text-sm">{icon}</span>
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</span>
                  </div>
                ))}
              </div>

              {error && (
                <p className="text-xs font-bold text-red-500 max-w-xs bg-red-50 dark:bg-red-500/10 px-4 py-3 rounded-2xl border border-red-200 dark:border-red-500/20">
                  {error}
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => startCamera()}
                className="w-full max-w-xs py-4 bg-primary dark:bg-accent text-white dark:text-primary rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary/25 hover:brightness-110 transition-all"
              >
                <Camera className="w-5 h-5" />
                {ar ? 'تشغيل الكاميرا' : 'Open Camera'}
              </motion.button>
            </motion.div>
          )}

          {/* ─── CAMERA LIVE ─── */}
          {phase === 'camera' && (
            <motion.div key="camera" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="relative bg-black select-none" style={{ minHeight: '340px' }}
            >
              <video
                ref={videoRef} autoPlay playsInline muted
                className="w-full object-cover block"
                style={{ maxHeight: '520px' }}
              />

              {/* AR overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Corner brackets */}
                <div className="absolute inset-6">
                  <div className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-accent" />
                  <div className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-accent" />
                  <div className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-accent" />
                  <div className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-accent" />
                </div>

                {/* Animated scan line */}
                <motion.div
                  className="absolute left-6 right-6 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-70"
                  animate={{ top: ['8%', '92%', '8%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />

                {/* LIVE badge */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-accent/30">
                  <motion.div className="w-1.5 h-1.5 rounded-full bg-red-500" animate={{ opacity: [1, 0.2] }} transition={{ duration: 0.9, repeat: Infinity }} />
                  <span className="text-[9px] font-black text-white/70 uppercase tracking-widest">LIVE</span>
                </div>

                {/* Instruction */}
                <div className="absolute bottom-24 inset-x-0 text-center">
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                    {ar ? 'وجّه الكاميرا ثم اضغط للالتقاط' : 'Point camera then tap to capture'}
                  </p>
                </div>
              </div>

              {/* Flip camera */}
              {multiCam && (
                <motion.button whileTap={{ scale: 0.9 }} onClick={flipCamera}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white"
                >
                  <FlipHorizontal2 className="w-4 h-4" />
                </motion.button>
              )}

              {/* Cancel */}
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => reset()}
                className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white text-xs font-black"
              >
                ✕
              </motion.button>

              {/* Capture button */}
              <div className="absolute bottom-5 inset-x-0 flex justify-center">
                <motion.button whileTap={{ scale: 0.9 }} onClick={captureAndAnalyze}
                  className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-2xl ring-4 ring-accent/60"
                >
                  <div className="w-11 h-11 rounded-full bg-accent" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ─── CAPTURED (freeze + sending) ─── */}
          {phase === 'captured' && (
            <motion.div key="captured" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="relative bg-black" style={{ minHeight: '280px' }}
            >
              {capturedImage && (
                <img src={capturedImage} className="w-full object-cover block opacity-50" style={{ maxHeight: '400px' }} />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 rounded-full border-[3px] border-accent border-t-transparent animate-spin" />
                <p className="text-sm font-black text-white">
                  {ar ? 'جاري الإرسال إلى Gemini Vision...' : 'Sending to Gemini Vision...'}
                </p>
              </div>
            </motion.div>
          )}

          {/* ─── THINKING ─── */}
          {phase === 'thinking' && (
            <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="p-16 flex flex-col items-center gap-6"
            >
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-[3px] border-accent/20 border-t-accent animate-spin" />
                <div className="absolute inset-3 rounded-full border-[3px] border-slate-200 dark:border-white/10 border-b-primary dark:border-b-white animate-spin [animation-direction:reverse]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-accent" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="font-black text-primary dark:text-white">
                  {ar ? 'Gemini Vision يحلّل الصورة...' : 'Gemini Vision analyzing...'}
                </p>
                <p className="text-xs text-slate-400 font-bold">
                  {ar ? 'يختار الكتاب الأنسب بناءً على ما رآه' : 'Selecting the best book based on what it saw'}
                </p>
              </div>
            </motion.div>
          )}

          {/* ─── REVEALED ─── */}
          {phase === 'revealed' && book && (
            <motion.div key="revealed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="p-8 flex flex-col items-center gap-6 text-center"
            >
              <div className="text-xs font-black text-accent uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {ar ? 'اقتراح Gemini Vision' : 'Gemini Vision Pick'}
              </div>

              {/* What Gemini saw */}
              {whatISaw && (
                <div className="w-full max-w-md px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  <p className={cn('text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                    <Eye className="w-3 h-3" />
                    {ar ? 'ما رآه Gemini:' : 'What Gemini saw:'}
                  </p>
                  <p className="text-sm font-bold text-primary dark:text-white">{whatISaw}</p>
                </div>
              )}

              <motion.div
                initial={{ scale: 0.75, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="relative"
              >
                <div className="w-36 shadow-2xl shadow-primary/20 rounded-xl overflow-hidden ring-4 ring-accent/30">
                  <BookCover book={book} />
                </div>
                <div className="absolute -bottom-3 -right-3 px-3 py-1 bg-accent text-primary text-[9px] font-black rounded-full uppercase tracking-wider shadow-lg">
                  {ar ? `رف ${book.shelf}` : `Shelf ${book.shelf}`}
                </div>
              </motion.div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-primary dark:text-white leading-tight">{book.title}</h3>
                <p className="text-sm text-slate-400 font-bold">{book.author}</p>
              </div>

              {reason && (
                <div className="max-w-sm px-4 py-3 rounded-2xl bg-accent/10 border border-accent/20">
                  <p className="text-xs font-bold text-primary dark:text-white leading-relaxed">{reason}</p>
                </div>
              )}

              <p className="text-xs text-slate-400 font-bold animate-pulse">
                {ar ? 'جاري حساب مسار الملاحة...' : 'Calculating navigation path...'}
              </p>
            </motion.div>
          )}

          {/* ─── NAVIGATING ─── */}
          {phase === 'navigating' && book && (
            <motion.div key="nav" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="p-8 flex flex-col items-center gap-6"
            >
              <div className="text-center space-y-1">
                <p className="text-xs font-black text-accent uppercase tracking-widest flex items-center justify-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {ar ? 'الملاحة إلى الرف' : 'Navigating to shelf'}
                </p>
                <p className="font-black text-primary dark:text-white text-sm">{book.title}</p>
              </div>

              {/* 4×2 shelf map */}
              <div className="relative select-none">
                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                  {ALL_SHELVES.map(shelfId => {
                    const isTarget = shelfId === (book.shelf ?? 'A-1');
                    return (
                      <div key={shelfId}
                        className={cn(
                          'w-24 h-14 rounded-xl flex items-center justify-center text-[10px] font-black uppercase border transition-all duration-500',
                          isTarget
                            ? 'bg-accent text-white border-accent shadow-lg shadow-accent/40 scale-105'
                            : 'bg-white dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10'
                        )}
                      >
                        <MapPin className="w-3 h-3 mr-1 opacity-60" />
                        {shelfId}
                      </div>
                    );
                  })}
                </div>

                {/* Walker dot — positioned over the grid using % of container */}
                <div className="absolute inset-4 pointer-events-none overflow-visible">
                  <motion.div
                    className="absolute w-4 h-4 rounded-full bg-primary dark:bg-white shadow-lg ring-2 ring-white dark:ring-slate-800 -translate-x-1/2 -translate-y-1/2 z-10"
                    animate={{
                      left: `${(walkerCol + 0.5) / 2 * 100}%`,
                      top:  walkerRow === 4.5 ? '115%' : `${(walkerRow + 0.5) / 4 * 100}%`,
                    }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                  />
                </div>
              </div>

              <p className="text-xs text-slate-400 font-bold animate-pulse text-center">
                {ar ? `في الطريق إلى الرف ${book.shelf}...` : `Moving to shelf ${book.shelf}...`}
              </p>
            </motion.div>
          )}

          {/* ─── ARRIVED ─── */}
          {phase === 'arrived' && book && (
            <motion.div key="arrived" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="p-8 flex flex-col items-center gap-6 text-center"
            >
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center text-4xl"
              >
                ✅
              </motion.div>

              <div className="space-y-1">
                <h2 className="text-xl font-black text-primary dark:text-white">
                  {ar ? `وصلت إلى الرف ${book.shelf}!` : `Arrived at Shelf ${book.shelf}!`}
                </h2>
                <p className="text-sm text-slate-400 font-bold">{book.title}</p>
              </div>

              <div className={cn('flex flex-col sm:flex-row gap-3 w-full max-w-sm', dir === 'rtl' ? 'sm:flex-row-reverse' : '')}>
                <motion.button whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(`/book/${book.id}`)}
                  className="flex-1 py-3.5 bg-primary dark:bg-accent text-white dark:text-primary rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
                >
                  <BookOpen className="w-4 h-4" />
                  {ar ? 'عرض تفاصيل الكتاب' : 'View Book Details'}
                </motion.button>
                <motion.button whileTap={{ scale: 0.96 }}
                  onClick={() => reset(true)}
                  className="flex-1 py-3.5 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  {ar ? 'مسح آخر' : 'Scan Again'}
                </motion.button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Phase progress dots */}
      {phase !== 'idle' && (
        <div className="flex items-center justify-center gap-2">
          {PHASE_SEQ.map((p, i) => (
            <div key={p} className={cn(
              'h-1.5 rounded-full transition-all duration-500',
              i <= phaseIdx ? 'w-4 bg-accent' : 'w-1.5 bg-slate-200 dark:bg-white/10'
            )} />
          ))}
        </div>
      )}
    </div>
  );
}
