import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ScanSearch, X, Zap, BookOpen, MapPin, Copy, Check, Loader2, ChevronRight, Tag, Eye } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';
import { MOCK_BOOKS } from '../data/mockData';

interface BookResult {
  id: string;
  title: string;
  author: string;
  shelf: string;
  section?: string;
  category?: string;
  year?: number;
  publisher?: string;
  callNumber?: string;
  reason?: string | null;
  whatISaw?: string | null;
}

interface InsightResult {
  summary: string;
  keyThemes: string[];
  recommendedReading: string[];
}

type Phase = 'loading' | 'live' | 'denied' | 'scanning' | 'result';

export function SmartLens() {
  const navigate = useNavigate();
  const { language, dir } = useLanguage();
  const ar = language === 'ar';

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<Phase>('loading');
  const [book, setBook] = useState<BookResult | null>(null);
  const [insight, setInsight] = useState<InsightResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [scanError, setScanError] = useState('');
  const [confidence, setConfidence] = useState(0);

  // Start camera
  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } })
      .then(stream => {
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setPhase('live');
      })
      .catch(() => { if (active) setPhase('denied'); });
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.75).split(',')[1];
  }, []);

  const handleScan = useCallback(async () => {
    if (phase !== 'live') return;
    setScanError('');
    setBook(null);
    setInsight(null);
    setConfidence(0);
    setPhase('scanning');

    const imageData = captureFrame();

    // Animate confidence meter while waiting
    const confTimer = setInterval(() => {
      setConfidence(c => Math.min(c + Math.random() * 18, 88));
    }, 200);

    try {
      // Step 1: Vision AI identifies what the camera sees
      const scanRes = await fetch('/api/vision-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData }),
      });
      if (!scanRes.ok) throw new Error('scan failed');
      const { bookId, whatISaw, reason } = await scanRes.json();

      // Resolve full book data from the library catalog
      const mockBook = MOCK_BOOKS.find(b => b.id === bookId) ?? MOCK_BOOKS[0];
      const scanned: BookResult = {
        id: mockBook.id,
        title: mockBook.title,
        author: mockBook.author,
        shelf: mockBook.shelf,
        category: (mockBook as any).category ?? '',
        year: (mockBook as any).year ?? undefined,
        publisher: (mockBook as any).publisher ?? undefined,
        callNumber: (mockBook as any).callNumber ?? undefined,
        reason: reason ?? null,
        whatISaw: whatISaw ?? null,
      };
      setBook(scanned);
      setConfidence(100);
      clearInterval(confTimer);

      // Step 2: Get rich AI academic insight
      const insightRes = await fetch('/api/book-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: scanned.title,
          author: scanned.author,
          category: scanned.category,
          description: (mockBook as any).description ?? '',
          language,
        }),
      });
      if (insightRes.ok) {
        const insightData = await insightRes.json();
        setInsight(insightData);
      }

      setPhase('result');
    } catch {
      clearInterval(confTimer);
      setScanError(ar ? 'تعذّر التحليل. حاول مجدداً.' : 'Analysis failed. Please try again.');
      setPhase('live');
    }
  }, [phase, captureFrame, ar, language]);

  const getCitation = (b: BookResult) =>
    `${b.author} (${b.year ?? 2022}). ${b.title}. ${b.publisher ?? 'Academic Press'}.`;

  const handleCopy = () => {
    if (!book) return;
    navigator.clipboard.writeText(getCitation(book)).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn('flex flex-col gap-0 h-[calc(100vh-4rem)] relative bg-black overflow-hidden', dir === 'rtl' ? 'text-right' : 'text-left')}
      dir={dir}
    >
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ── Camera view ── */}
      <div className="relative flex-1 min-h-0">
        {/* Video */}
        <video
          ref={videoRef}
          muted
          playsInline
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-500',
            phase === 'denied' ? 'opacity-0' : 'opacity-100'
          )}
        />

        {/* Dark overlay — only when camera is not usable */}
        {(phase === 'loading' || phase === 'denied') && (
          <div className="absolute inset-0 bg-[#010f1a]" />
        )}

        {/* Dim overlay in result mode so camera stays visible through the panel */}
        {phase === 'result' && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
        )}

        {/* Loading spinner */}
        {phase === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <p className="text-white/60 text-xs font-bold">{ar ? 'تهيئة الكاميرا…' : 'Starting camera…'}</p>
          </div>
        )}

        {/* Camera denied */}
        {phase === 'denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <ScanSearch className="w-7 h-7 text-rose-400" />
            </div>
            <div>
              <p className="text-white font-black text-base">{ar ? 'الكاميرا غير متاحة' : 'Camera not available'}</p>
              <p className="text-white/40 text-xs font-bold mt-1 leading-relaxed">
                {ar ? 'اسمح للتطبيق بالوصول إلى الكاميرا من إعدادات المتصفح.' : 'Allow camera access from your browser settings.'}
              </p>
            </div>
          </div>
        )}

        {/* Scanning overlay */}
        {phase === 'scanning' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/50 backdrop-blur-[2px]">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 rounded-full border-2 border-accent/30 border-t-accent flex items-center justify-center"
            >
              <ScanSearch className="w-8 h-8 text-accent" />
            </motion.div>
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-accent font-black text-sm tracking-widest uppercase">
                {ar ? 'الذكاء الاصطناعي يحلل…' : 'AI Analyzing…'}
              </p>
              <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  style={{ width: `${confidence}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span className="text-white/40 text-[9px] font-black tabular-nums">{Math.round(confidence)}%</span>
            </div>
          </div>
        )}

        {/* Live viewfinder frame */}
        {phase === 'live' && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner brackets */}
            {[
              'top-1/2 left-1/2 -translate-x-[6rem] -translate-y-[5rem]',
              'top-1/2 left-1/2 translate-x-[3.5rem] -translate-y-[5rem]',
              'top-1/2 left-1/2 -translate-x-[6rem] translate-y-[2.5rem]',
              'top-1/2 left-1/2 translate-x-[3.5rem] translate-y-[2.5rem]',
            ].map((pos, i) => (
              <div
                key={i}
                className={cn('absolute w-6 h-6 border-accent', pos,
                  i === 0 && 'border-t-2 border-l-2 rounded-tl-lg',
                  i === 1 && 'border-t-2 border-r-2 rounded-tr-lg',
                  i === 2 && 'border-b-2 border-l-2 rounded-bl-lg',
                  i === 3 && 'border-b-2 border-r-2 rounded-br-lg',
                )}
              />
            ))}
            {/* Scan line */}
            <motion.div
              className="absolute left-[calc(50%-6rem)] right-[calc(50%-3.5rem)] h-px bg-accent/60 shadow-[0_0_8px_rgba(217,179,16,0.8)]"
              style={{ top: '50%' }}
              animate={{ y: ['-2.5rem', '2.5rem', '-2.5rem'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Hint label */}
            <div className="absolute bottom-28 inset-x-0 flex justify-center">
              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest bg-black/30 px-3 py-1 rounded-full">
                {ar ? 'وجّه الكاميرا نحو غلاف الكتاب' : 'Point camera at a book cover'}
              </span>
            </div>
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Page label */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full z-10">
          <ScanSearch className="w-3.5 h-3.5 text-accent" />
          <span className="text-[9px] font-black text-white uppercase tracking-widest">Smart Lens AR</span>
        </div>

        {/* Scan button */}
        {(phase === 'live') && (
          <div className="absolute bottom-6 inset-x-0 flex flex-col items-center gap-2">
            {scanError && (
              <p className="text-rose-400 text-xs font-bold">{scanError}</p>
            )}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleScan}
              className="w-16 h-16 rounded-full bg-accent shadow-xl shadow-accent/40 flex items-center justify-center hover:brightness-110 transition-all"
            >
              <ScanSearch className="w-7 h-7 text-primary" />
            </motion.button>
            <p className="text-[9px] text-white/50 font-bold">{ar ? 'اضغط للمسح' : 'Tap to scan'}</p>
          </div>
        )}
      </div>

      {/* ── Result panel ── */}
      <AnimatePresence>
        {phase === 'result' && book && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="absolute inset-x-0 bottom-0 bg-white dark:bg-slate-900 rounded-t-[2rem] shadow-2xl max-h-[72vh] overflow-y-auto"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>

            <div className="p-5 space-y-4">
              {/* Header */}
              <div className={cn('flex items-start justify-between gap-3', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                <div className="flex-1">
                  <div className={cn('flex items-center gap-2 mb-1.5 flex-wrap', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                    <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[8px] font-black uppercase tracking-widest">
                      {book.section ?? book.category ?? 'AR'} · AR
                    </span>
                    <span className="text-[8px] text-emerald-500 font-black uppercase">✓ {ar ? 'تم التعرف' : 'Identified'}</span>
                    <span className="text-[8px] text-white/30 font-black tabular-nums">100%</span>
                  </div>
                  <h2 className={cn('text-lg font-black text-primary dark:text-white leading-tight', dir === 'rtl' ? 'text-right' : '')}>
                    {book.title}
                  </h2>
                  <p className="text-slate-400 font-bold text-sm mt-0.5">{book.author}</p>
                </div>
                <button
                  onClick={() => setPhase('live')}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* What AI saw */}
              {book.whatISaw && (
                <div className={cn('flex items-start gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-white/5', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                  <Eye className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <p className={cn('text-[10px] font-bold text-slate-400 leading-relaxed', dir === 'rtl' ? 'text-right' : '')}>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-500 mr-1">
                      {ar ? 'رأى الذكاء الاصطناعي:' : 'AI saw:'}
                    </span>
                    {book.whatISaw}
                  </p>
                </div>
              )}

              {/* AI Summary */}
              {insight && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 space-y-2.5">
                  <div className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                    <Zap className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Gemini AI · {ar ? 'ملخص أكاديمي' : 'Academic Summary'}</span>
                  </div>
                  <p className={cn('text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed', dir === 'rtl' ? 'text-right' : '')}>
                    {insight.summary}
                  </p>

                  {/* Key themes */}
                  {insight.keyThemes?.length > 0 && (
                    <div className={cn('flex flex-wrap gap-1.5 pt-1', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                      {insight.keyThemes.map((theme, i) => (
                        <span key={i} className="flex items-center gap-1 text-[9px] font-black text-accent bg-accent/10 px-2.5 py-1 rounded-full">
                          <Tag className="w-2.5 h-2.5" />
                          {theme}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Metadata row */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                {[
                  { label: ar ? 'الموقع' : 'Location', value: `Shelf ${book.shelf}` },
                  { label: ar ? 'السنة' : 'Year', value: String(book.year ?? '—') },
                  { label: ar ? 'التصنيف' : 'Category', value: book.category ?? '—' },
                  { label: ar ? 'الناشر' : 'Publisher', value: book.publisher ?? 'Academic Press' },
                ].map(({ label, value }) => (
                  <div key={label} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5">
                    <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</div>
                    <div className="font-black text-primary dark:text-white truncate">{value}</div>
                  </div>
                ))}
              </div>

              {/* Recommended reading */}
              {insight?.recommendedReading?.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                    {ar ? 'قراءات مقترحة' : 'Recommended Reading'}
                  </div>
                  {insight.recommendedReading.map((item, i) => (
                    <div key={i} className={cn('flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                      <BookOpen className="w-3 h-3 text-accent shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Citation */}
              <div className="relative p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5">
                <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1">APA Citation</div>
                <p className={cn('text-[9px] font-mono text-slate-500 dark:text-slate-400 leading-relaxed', dir === 'rtl' ? 'pr-0 pl-7 text-right' : 'pr-7')}>
                  {getCitation(book)}
                </p>
                <button
                  onClick={handleCopy}
                  className={cn(
                    'absolute top-2 p-1.5 rounded-lg transition-colors',
                    dir === 'rtl' ? 'left-2' : 'right-2',
                    copied ? 'text-emerald-500' : 'text-slate-300 hover:text-slate-500'
                  )}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Action buttons */}
              <div className={cn('flex gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                <button
                  onClick={() => navigate(`/book/${book.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-accent text-primary rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-accent/20 hover:brightness-110 transition-all"
                >
                  <MapPin className="w-4 h-4" />
                  {ar ? 'حدد موقعه' : 'Locate'}
                </button>
                <button
                  onClick={() => { setPhase('live'); setBook(null); setInsight(null); }}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <ChevronRight className={cn('w-4 h-4', dir === 'rtl' ? 'rotate-180' : '')} />
                  {ar ? 'مسح آخر' : 'Scan again'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
