import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book } from '../types';
import { MOCK_BOOKS } from '../data/mockData';
import { BookCover } from '../components/BookCover';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../hooks/useLanguage';
import { Cpu, MapPin, Sparkles, RotateCcw, BookOpen, Navigation, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { cn } from '../lib/utils';

type SimPhase = 'idle' | 'scanning' | 'thinking' | 'revealed' | 'navigating' | 'arrived';

// 4-row × 2-col grid. [row, col] where row 0 = top (A), row 3 = bottom (D)
const SHELF_GRID: Record<string, [number, number]> = {
  'A-1': [0, 0], 'A-2': [0, 1],
  'B-1': [1, 0], 'B-2': [1, 1],
  'C-1': [2, 0], 'C-2': [2, 1],
  'D-1': [3, 0], 'D-2': [3, 1],
};

const PHASE_LABELS: Record<SimPhase, { ar: string; en: string }> = {
  idle:       { ar: 'محاكاة الواقع المعزز بالذكاء الاصطناعي', en: 'AI-Powered AR Simulation' },
  scanning:   { ar: 'جاري مسح البيئة...', en: 'Scanning environment...' },
  thinking:   { ar: 'يختار الذكاء الاصطناعي الكتاب...', en: 'AI is selecting a book...' },
  revealed:   { ar: 'تم التعرف على الكتاب!', en: 'Book identified!' },
  navigating: { ar: 'حساب مسار الملاحة...', en: 'Calculating navigation path...' },
  arrived:    { ar: 'وصلت إلى الرف!', en: 'Arrived at the shelf!' },
};

export function ARSimulation() {
  const navigate = useNavigate();
  const { language, dir } = useLanguage();
  const ar = language === 'ar';

  const [phase, setPhase] = useState<SimPhase>('idle');
  const [book, setBook] = useState<Book | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [lastBookId, setLastBookId] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  // walker: [row, col] within the 4×2 grid; 4.5 = below the grid (entrance)
  const [walkerRow, setWalkerRow] = useState(4.5);
  const [walkerCol, setWalkerCol] = useState(0.5);
  const abortRef = useRef(false);

  useEffect(() => { return () => { abortRef.current = true; }; }, []);

  function safeDelay(ms: number) {
    return new Promise<void>(resolve => {
      const id = setTimeout(() => { if (!abortRef.current) resolve(); }, ms);
      // resolve immediately on abort so the chain doesn't hang
      const check = setInterval(() => { if (abortRef.current) { clearTimeout(id); clearInterval(check); resolve(); } }, 50);
    });
  }

  // Animate scan progress bar during scanning phase
  useEffect(() => {
    if (phase !== 'scanning') { setScanProgress(0); return; }
    setScanProgress(0);
    const start = Date.now();
    const total = 2000;
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      setScanProgress(Math.min(100, (elapsed / total) * 100));
      if (elapsed >= total) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [phase]);

  const startSimulation = useCallback(async () => {
    abortRef.current = false;
    setPhase('scanning');
    setBook(null);
    setReason(null);
    setError(null);
    setWalkerRow(4.5);
    setWalkerCol(0.5);

    await safeDelay(2200);
    if (abortRef.current) return;

    setPhase('thinking');

    let picked: Book;
    let pickedReason: string | null = null;

    try {
      const res = await fetch('/api/simulate-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excludeId: lastBookId }),
      });
      const data = await res.json();
      const found = MOCK_BOOKS.find(b => b.id === data.bookId);
      picked = found ?? MOCK_BOOKS[Math.floor(Math.random() * MOCK_BOOKS.length)];
      pickedReason = data.reason ?? null;
    } catch {
      // Fallback: pick locally
      const pool = MOCK_BOOKS.filter(b => b.id !== lastBookId);
      picked = pool[Math.floor(Math.random() * pool.length)] ?? MOCK_BOOKS[0];
    }

    if (abortRef.current) return;

    await safeDelay(1200);
    if (abortRef.current) return;

    setBook(picked);
    setReason(pickedReason);
    setLastBookId(picked.id);
    setPhase('revealed');

    await safeDelay(2500);
    if (abortRef.current) return;

    setPhase('navigating');

    // Animate walker from entrance (row 4.5) → target row → target col
    const pos = SHELF_GRID[picked.shelf ?? 'A-1'] ?? [0, 0];
    const [tRow, tCol] = pos;

    // Step 1: move up the center aisle to target row level
    await safeDelay(300);
    if (abortRef.current) return;
    setWalkerRow(tRow + 0.5);
    setWalkerCol(0.5);

    await safeDelay(900);
    if (abortRef.current) return;

    // Step 2: move horizontally to target column
    setWalkerRow(tRow);
    setWalkerCol(tCol);

    await safeDelay(1400);
    if (abortRef.current) return;
    setPhase('arrived');
  }, [lastBookId]);

  const shelfPos = book ? (SHELF_GRID[book.shelf ?? 'A-1'] ?? [0, 0]) : [0, 0];

  return (
    <div className={cn('max-w-lg mx-auto space-y-6 pb-12 animate-in duration-500', dir === 'rtl' ? 'slide-in-from-left-4' : 'slide-in-from-right-4')} dir={dir}>

      {/* Header */}
      <div className={cn('flex items-center gap-3', dir === 'rtl' ? 'flex-row-reverse' : '')}>
        <div className="w-10 h-10 rounded-2xl bg-primary dark:bg-accent/20 flex items-center justify-center shadow-lg shadow-primary/20">
          <Cpu className="w-5 h-5 text-accent dark:text-accent" />
        </div>
        <div>
          <h1 className="text-lg font-black text-primary dark:text-white tracking-tight">
            {ar ? 'محاكاة AR بالذكاء الاصطناعي' : 'AI AR Simulation'}
          </h1>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {ar ? 'بدون كاميرا · بدون كتاب حقيقي' : 'No camera · No real book'}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── IDLE ── */}
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5">
            <div className="official-card p-8 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5 space-y-5 text-center">
              {/* Viewfinder illustration */}
              <div className="relative w-40 h-40 mx-auto">
                <div className="absolute inset-0 rounded-[2.5rem] border-4 border-primary/10 dark:border-white/5" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-3xl bg-primary/5 dark:bg-white/5 flex items-center justify-center">
                    <span className="text-5xl opacity-40">📚</span>
                  </div>
                </div>
                {/* Corner brackets */}
                {['-top-1 -left-1', '-top-1 -right-1', '-bottom-1 -left-1', '-bottom-1 -right-1'].map((pos, i) => (
                  <div key={i} className={cn('absolute w-5 h-5 border-accent', pos,
                    i === 0 ? 'border-t-2 border-l-2 rounded-tl-lg' :
                    i === 1 ? 'border-t-2 border-r-2 rounded-tr-lg' :
                    i === 2 ? 'border-b-2 border-l-2 rounded-bl-lg' :
                    'border-b-2 border-r-2 rounded-br-lg'
                  )} />
                ))}
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-primary dark:text-white tracking-tight">
                  {ar ? 'جرّب تجربة AR كاملة' : 'Experience full AR'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                  {ar
                    ? 'يختار الذكاء الاصطناعي كتاباً متنوعاً من فهرس المكتبة ويعرض رحلة الملاحة كاملة — من المسح حتى الوصول للرف — دون الحاجة لكاميرا أو كتاب حقيقي.'
                    : 'AI picks a varied book from the library catalog and walks you through the full navigation journey — from scanning to shelf arrival — no camera or real book needed.'}
                </p>
              </div>

              <div className="flex gap-2 justify-center flex-wrap">
                {[
                  { icon: '📷', label: ar ? 'مسح ذكي' : 'Smart scan' },
                  { icon: '🤖', label: ar ? 'اختيار Gemini' : 'Gemini pick' },
                  { icon: '🗺️', label: ar ? 'ملاحة حية' : 'Live nav' },
                ].map(({ icon, label }, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10">
                    <span className="text-sm">{icon}</span>
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</span>
                  </div>
                ))}
              </div>

              {error && <p className="text-xs font-bold text-red-500">{error}</p>}

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={startSimulation}
                className="w-full py-4 bg-primary dark:bg-accent text-white dark:text-primary rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary/25 hover:brightness-110 transition-all"
              >
                <Sparkles className="w-5 h-5" />
                {ar ? 'ابدأ المحاكاة' : 'Start Simulation'}
              </motion.button>

              {/* Upgrade to real camera */}
              <div className="pt-1">
                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ar ? 'أو' : 'or'}</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
                </div>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate('/ar-camera')}
                  className="w-full py-3.5 bg-slate-100 dark:bg-white/10 text-primary dark:text-white rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 hover:bg-slate-200 dark:hover:bg-white/15 transition-all border border-slate-200 dark:border-white/10"
                >
                  <Camera className="w-4 h-4 text-accent" />
                  {ar ? 'جرّب بالكاميرا الحقيقية' : 'Try with Real Camera'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── SCANNING ── */}
        {phase === 'scanning' && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="relative overflow-hidden rounded-[2rem] bg-black aspect-[4/3] flex items-center justify-center shadow-2xl">
              {/* Dark camera feed simulation */}
              <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-900 to-black" />

              {/* Animated scan line */}
              <motion.div
                className="absolute left-0 right-0 h-0.5 bg-accent/70"
                animate={{ top: ['10%', '90%', '10%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />

              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
              }} />

              {/* Viewfinder corners */}
              <div className="relative w-40 h-40">
                {['-top-0 -left-0', '-top-0 -right-0', '-bottom-0 -left-0', '-bottom-0 -right-0'].map((_, i) => (
                  <motion.div key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={cn('absolute w-8 h-8 border-accent/80',
                      i === 0 ? 'top-0 left-0 border-t-2 border-l-2 rounded-tl-xl' :
                      i === 1 ? 'top-0 right-0 border-t-2 border-r-2 rounded-tr-xl' :
                      i === 2 ? 'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl' :
                      'bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl'
                    )}
                  />
                ))}
                {/* Pulsing center target */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="w-4 h-4 rounded-full border-2 border-accent"
                  />
                </div>
              </div>

              {/* Status badges */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
                  <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">REC</span>
                </div>
                <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1">
                  <span className="text-[9px] font-black text-accent uppercase tracking-widest">AR·CAM</span>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="absolute bottom-4 left-4 right-4 space-y-2">
                <div className="flex justify-between text-[9px] font-black text-white/60 uppercase tracking-widest">
                  <span>{ar ? 'جاري المسح' : 'Scanning'}</span>
                  <span>{Math.round(scanProgress)}%</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div className="h-full bg-accent rounded-full" style={{ width: `${scanProgress}%` }} />
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {ar ? 'جاري مسح البيئة بحثاً عن الكتب...' : 'Scanning environment for books...'}
              </p>
            </div>
          </motion.div>
        )}

        {/* ── THINKING ── */}
        {phase === 'thinking' && (
          <motion.div key="thinking" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="official-card p-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5 flex flex-col items-center gap-6 text-center">
            {/* Gemini spinner */}
            <div className="relative w-20 h-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent border-r-primary/30"
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-2 rounded-full border-4 border-transparent border-t-primary/40 border-l-accent/60"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-primary dark:text-white tracking-tight">
                {ar ? 'Gemini يختار الكتاب...' : 'Gemini is picking a book...'}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold max-w-xs">
                {ar
                  ? 'يحلل الذكاء الاصطناعي الفهرس ليختار كتاباً متنوعاً ومناسباً لك'
                  : 'AI is analyzing the catalog to pick a varied, interesting book for you'}
              </p>
            </div>
            <div className="flex gap-1.5">
              {[0, 0.2, 0.4].map(delay => (
                <motion.div key={delay} animate={{ y: [-4, 4, -4] }} transition={{ duration: 0.8, repeat: Infinity, delay }}
                  className="w-2 h-2 rounded-full bg-accent" />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── REVEALED ── */}
        {(phase === 'revealed' || phase === 'navigating' || phase === 'arrived') && book && (
          <motion.div key="revealed-block" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-5">

            {/* Book card */}
            <div className={cn('official-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5 flex gap-5', dir === 'rtl' ? 'flex-row-reverse' : '')}>
              <motion.div
                initial={{ scale: 0.7, opacity: 0, rotateY: -30 }}
                animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="shrink-0"
              >
                <BookCover book={book} className="w-16 h-24 rounded-xl shadow-xl overflow-hidden" />
              </motion.div>
              <div className={cn('flex-1 min-w-0 space-y-2', dir === 'rtl' ? 'text-right' : 'text-left')}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                    ✓ {ar ? 'تم التعرف' : 'Identified'}
                  </span>
                  <span className="text-[9px] font-black text-accent bg-accent/10 px-2.5 py-1 rounded-lg uppercase tracking-widest font-mono">
                    {book.shelf}
                  </span>
                </div>
                <div className="text-sm font-black text-primary dark:text-white leading-tight">{book.title}</div>
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{book.author}</div>
                {reason && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex gap-2 pt-1"
                  >
                    <Sparkles className="w-3 h-3 text-accent shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium italic leading-relaxed">{reason}</p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Navigation map */}
            <AnimatePresence>
              {(phase === 'navigating' || phase === 'arrived') && (
                <motion.div key="map" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="official-card p-5 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-xl shadow-black/5 space-y-4">
                  <div className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                    <Navigation className="w-4 h-4 text-accent" />
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {ar ? 'مسار الملاحة' : 'Navigation Path'}
                    </span>
                    {phase === 'arrived' && (
                      <span className="ms-auto text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md uppercase tracking-widest">
                        {ar ? 'وصلت!' : 'Arrived!'}
                      </span>
                    )}
                  </div>

                  {/* 2D Library Grid */}
                  <div className="relative">
                    {/* Aisle labels */}
                    <div className={cn('grid gap-1.5 mb-1.5', dir === 'rtl' ? 'direction-rtl' : '')}
                      style={{ gridTemplateColumns: '1fr 1fr' }}>
                      {['A', 'B', 'C', 'D'].flatMap(row => ['1', '2'].map(col => {
                        const shelfId = `${row}-${col}`;
                        const [r, c] = SHELF_GRID[shelfId];
                        const isTarget = book.shelf === shelfId;
                        const walkerHere = Math.round(walkerRow) === r && Math.round(walkerCol) === c;
                        return (
                          <div key={shelfId} className={cn(
                            'relative h-10 rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest transition-all duration-300',
                            isTarget
                              ? 'bg-accent text-primary shadow-lg shadow-accent/30 scale-105'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/10',
                          )}>
                            {shelfId}
                            {walkerHere && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary dark:bg-accent rounded-full border-2 border-white dark:border-slate-900 shadow-lg flex items-center justify-center"
                              >
                                <span className="text-[6px]">👤</span>
                              </motion.div>
                            )}
                          </div>
                        );
                      }))}
                    </div>

                    {/* Entrance */}
                    <div className="flex gap-1.5">
                      <div className="flex-1 h-8 rounded-xl bg-primary/5 dark:bg-accent/10 border border-primary/20 dark:border-accent/20 flex items-center justify-center gap-2">
                        {Math.round(walkerRow) === 5 && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-sm">👤</motion.span>
                        )}
                        <span className="text-[9px] font-black text-primary/60 dark:text-accent/60 uppercase tracking-widest">
                          {ar ? 'المدخل' : 'Entrance'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Step indicator */}
                  <div className={cn('flex items-center gap-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                    <MapPin className="w-3 h-3 text-accent" />
                    <span>
                      {ar
                        ? `توجّه إلى الرف ${book.shelf} — ${book.section === 'A' ? 'القسم الأول' : book.section === 'B' ? 'القسم الثاني' : book.section === 'C' ? 'القسم الثالث' : 'القسم الرابع'}`
                        : `Head to shelf ${book.shelf} — Section ${book.section ?? book.shelf?.split('-')[0]}`}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Final arrived actions */}
            <AnimatePresence>
              {phase === 'arrived' && (
                <motion.div key="actions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className="official-card p-5 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 shadow-lg text-center space-y-2">
                    <div className="text-3xl">🎉</div>
                    <div className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                      {ar ? `وصلت إلى الرف ${book.shelf}!` : `Arrived at shelf ${book.shelf}!`}
                    </div>
                    <div className="text-[11px] text-emerald-600/70 dark:text-emerald-500/70 font-bold">
                      {ar ? 'هذه هي تجربة AR الكاملة بدون كاميرا حقيقية' : 'This is the full AR experience without a real camera'}
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/book/${book.id}`)}
                    className="w-full py-4 bg-primary dark:bg-accent text-white dark:text-primary rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all"
                  >
                    <BookOpen className="w-4 h-4" />
                    {ar ? 'عرض تفاصيل الكتاب' : 'View Book Details'}
                  </button>

                  <button
                    onClick={startSimulation}
                    className="w-full py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-primary dark:text-white rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:border-accent/50 active:scale-95 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {ar ? 'جرّب كتاباً آخر' : 'Try another book'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
