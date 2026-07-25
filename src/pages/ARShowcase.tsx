import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode, MapPin, Copy, Check, Zap, Layers, Compass,
  FlaskConical, Star, GitBranch, ChevronRight, ScanSearch, Navigation,
  Target, Dna, Swords, Map, Gamepad2,
} from 'lucide-react';
import { Book } from '../types';
import { MOCK_BOOKS } from '../data/mockData';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../hooks/useLanguage';

const SPINE_COLORS = [
  '#7B2D8B', '#2D5A27', '#8B4513', '#1B3A6B',
  '#8B6914', '#2B5F75', '#6B2D2D', '#4B2D8B',
  '#1B6B4A', '#5F3527',
];

const ALL_SHELVES = ['A-1', 'A-2', 'B-1', 'B-2', 'C-1', 'C-2', 'D-1', 'D-2'];

function getCitation(book: Book, fmt: 'apa' | 'mla' | 'chicago' | 'bibtex'): string {
  const y = book.year ?? 2022;
  const pub = book.publisher ?? 'Academic Press';
  const a = book.author;
  const t = book.title;
  switch (fmt) {
    case 'apa':      return `${a} (${y}). ${t}. ${pub}.`;
    case 'mla':      return `${a}. "${t}." ${pub}, ${y}.`;
    case 'chicago':  return `${a}. ${t}. ${pub}, ${y}.`;
    case 'bibtex':   return `@book{${(book.shelf ?? 'ref').replace('-', '')},\n  author    = {${a}},\n  title     = {${t}},\n  publisher = {${pub}},\n  year      = {${y}}\n}`;
  }
}

export function ARShowcase() {
  const navigate = useNavigate();
  const { language, dir } = useLanguage();
  const ar = language === 'ar';

  const [activeShelf, setActiveShelf] = useState('A-1');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [citeFmt, setCiteFmt] = useState<'apa' | 'mla' | 'chicago' | 'bibtex'>('apa');
  const [copied, setCopied] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const shelfBooks = MOCK_BOOKS.filter(b => b.shelf === activeShelf);

  useEffect(() => {
    setSelectedBook(shelfBooks[0] ?? null);
  }, [activeShelf]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedBook) return;
    let cancelled = false;
    setAiSummary('');
    setAiLoading(true);
    fetch('/api/book-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: selectedBook.title,
        author: selectedBook.author,
        category: selectedBook.category,
        description: (selectedBook as any).description,
        language,
      }),
    })
      .then(r => r.json())
      .then(data => { if (!cancelled) setAiSummary(data.summary || ''); })
      .catch(() => { if (!cancelled) setAiSummary(ar ? 'تعذّر تحميل الملخص.' : 'Could not load summary.'); })
      .finally(() => { if (!cancelled) setAiLoading(false); });
    return () => { cancelled = true; };
  }, [selectedBook, language]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = () => {
    if (!selectedBook) return;
    navigator.clipboard.writeText(getCitation(selectedBook, citeFmt)).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBookClick = (book: Book) => {
    setSelectedBook(book);
    setHasInteracted(true);
  };

  return (
    <div className={cn('flex flex-col gap-8 animate-in duration-500', dir === 'rtl' ? 'text-right' : 'text-left')}>

      {/* ── 1. HEADER — short, action-oriented ── */}
      <div className={cn('flex items-center gap-4', dir === 'rtl' ? 'flex-row-reverse' : '')}>
        <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center text-accent shrink-0">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight">
            {ar ? 'اكتشاف الكتب بالواقع المعزز' : 'AR Book Discovery'}
          </h1>
          <p className="text-sm text-slate-400 font-bold mt-0.5">
            {ar ? 'انقر على أي كتاب في الرف أدناه' : 'Tap any book on the shelf below'}
          </p>
        </div>
      </div>

      {/* ── 2. THE DEMO — the hero, immediately ── */}
      <div className={cn('flex flex-col xl:flex-row gap-0 rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5 shadow-lg', dir === 'rtl' ? 'xl:flex-row-reverse' : '')}>

        {/* Left: Camera / Bookshelf */}
        <div className="xl:w-[52%] bg-[#01354C] dark:bg-[#010f1a] flex flex-col">

          {/* Shelf selector in-panel */}
          <div className="px-4 pt-3 pb-2 border-b border-white/5 flex items-center justify-between gap-2">
            <div className={cn('flex gap-1 flex-wrap', dir === 'rtl' ? 'flex-row-reverse' : '')}>
              {ALL_SHELVES.map(sid => (
                <button
                  key={sid}
                  onClick={() => setActiveShelf(sid)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all',
                    activeShelf === sid
                      ? 'bg-accent text-primary'
                      : 'text-white/30 hover:text-white/60'
                  )}
                >
                  {sid}
                </button>
              ))}
            </div>
            <span className="font-mono text-[8px] text-white/20 shrink-0 uppercase">
              {ar ? 'رف' : 'SHELF'} {activeShelf}
            </span>
          </div>

          {/* Book spines */}
          <div className={cn('px-5 pt-6 pb-0 flex gap-2 items-end overflow-x-auto min-h-[200px]', dir === 'rtl' ? 'flex-row-reverse' : '')}>
            {shelfBooks.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-white/20 text-xs font-bold pb-8">
                {ar ? 'لا توجد كتب على هذا الرف' : 'No books on this shelf'}
              </div>
            ) : (
              shelfBooks.map((book, i) => {
                const isSelected = selectedBook?.id === book.id;
                const spineH = 140 + (i % 4) * 20;
                const color = SPINE_COLORS[i % SPINE_COLORS.length];
                return (
                  <motion.div
                    key={book.id}
                    onClick={() => handleBookClick(book)}
                    whileHover={{ y: -10, transition: { duration: 0.18 } }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'relative flex-shrink-0 w-[52px] rounded-t-[3px] cursor-pointer overflow-hidden flex items-center justify-center transition-all duration-300',
                      isSelected
                        ? 'ring-2 ring-accent ring-offset-1 ring-offset-[#01354C] brightness-110'
                        : 'opacity-60 hover:opacity-90'
                    )}
                    style={{ height: spineH, background: `linear-gradient(175deg, ${color}ee, ${color}88)` }}
                  >
                    {isSelected && (
                      <motion.div
                        className="absolute inset-x-0 h-px bg-accent shadow-[0_0_10px_rgba(217,179,16,1)]"
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                    <span
                      className="text-[8px] font-black text-white/70 leading-tight px-1 select-none"
                      style={{
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed',
                        transform: 'rotate(180deg)',
                        maxHeight: spineH - 10,
                        overflow: 'hidden',
                      }}
                    >
                      {book.title}
                    </span>
                    {isSelected && (
                      <div className="absolute bottom-2 inset-x-0 flex justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Wooden plank */}
          <div className="mx-4 h-2 rounded-sm bg-[#6b4423]" />

          {/* Hint — only show before first interaction */}
          <AnimatePresence>
            {!hasInteracted && (
              <motion.p
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[9px] text-white/30 font-bold text-center py-3 tracking-wider"
              >
                {ar ? '↑ انقر على أي كتاب' : '↑ Click any book'}
              </motion.p>
            )}
          </AnimatePresence>
          {hasInteracted && <div className="py-3" />}
        </div>

        {/* Right: AR Overlay */}
        <div className="xl:flex-1 bg-white dark:bg-slate-900 flex flex-col border-t xl:border-t-0 xl:border-l border-slate-100 dark:border-white/5">
          <div className="px-5 py-2.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
            <div className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {ar ? 'طبقة المعلومات' : 'AR Info Layer'}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded bg-accent/10 text-accent text-[8px] font-black uppercase">AR</span>
          </div>

          <div className="overflow-y-auto flex-1">
            <AnimatePresence mode="wait">
              {selectedBook ? (
                <motion.div
                  key={selectedBook.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="p-5 space-y-4"
                >
                  {/* Section tag */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/5 dark:bg-accent/10 text-primary dark:text-accent text-[9px] font-black uppercase tracking-wider">
                    {selectedBook.section ?? 'QC'} · {selectedBook.category ?? '—'}
                  </span>

                  {/* Title */}
                  <div>
                    <h2 className={cn('text-xl font-black text-primary dark:text-white leading-tight', dir === 'rtl' ? 'text-right' : '')}>
                      {selectedBook.title}
                    </h2>
                    <p className="text-slate-400 font-bold text-sm mt-0.5">{selectedBook.author}</p>
                  </div>

                  {/* Key metadata — compact */}
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    {[
                      { label: ar ? 'الموقع' : 'Location', value: `Shelf ${selectedBook.shelf}` },
                      { label: ar ? 'رقم الاستدعاء' : 'Call No.', value: selectedBook.callNumber?.split(' ')[0] ?? `${selectedBook.section ?? 'QC'}6` },
                      { label: ar ? 'السنة' : 'Year', value: String(selectedBook.year ?? '—') },
                      { label: ar ? 'الناشر' : 'Publisher', value: selectedBook.publisher ?? 'Academic Press' },
                    ].map(({ label, value }) => (
                      <div key={label} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5">
                        <div className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</div>
                        <div className="font-black text-primary dark:text-white truncate text-[10px]">{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* AI Summary */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 space-y-2">
                    <div className={cn('flex items-center justify-between gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                      <div className={cn('flex items-center gap-1.5', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                        <Zap className="w-3 h-3 text-accent shrink-0" />
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Gemini AI</span>
                      </div>
                      {aiLoading && (
                        <span className="text-[7px] font-black text-accent uppercase animate-pulse">
                          {ar ? 'جاري التحليل…' : 'analyzing…'}
                        </span>
                      )}
                    </div>
                    <p className={cn('text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed min-h-[2.5rem]', dir === 'rtl' ? 'text-right' : '')}>
                      {aiLoading
                        ? <span className="text-slate-300 dark:text-slate-600 italic">{ar ? 'يُحلّل الكتاب…' : 'analyzing book…'}</span>
                        : aiSummary
                      }
                    </p>
                  </div>

                  {/* Citation */}
                  <div className="space-y-2">
                    <div className={cn('flex gap-1.5 flex-wrap', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                      {(['apa', 'mla', 'chicago', 'bibtex'] as const).map(fmt => (
                        <button
                          key={fmt}
                          onClick={() => setCiteFmt(fmt)}
                          className={cn(
                            'px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all',
                            citeFmt === fmt
                              ? 'bg-primary text-white dark:bg-accent dark:text-primary'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600'
                          )}
                        >
                          {fmt.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div className="relative p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5">
                      <p className={cn('text-[9px] font-mono text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-wrap', dir === 'rtl' ? 'text-right pr-0 pl-7' : 'pr-7')}>
                        {getCitation(selectedBook, citeFmt)}
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
                  </div>

                  {/* Primary action */}
                  <button
                    onClick={() => navigate(`/book/${selectedBook.id}`)}
                    className="w-full py-3.5 bg-accent text-primary rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md shadow-accent/20 hover:brightness-110 active:scale-95 transition-all"
                  >
                    <Navigation className="w-4 h-4" />
                    {ar ? 'انتقل إلى موقعه الفعلي' : 'Navigate to physical location'}
                  </button>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-300 dark:text-slate-600">
                  <Compass className="w-9 h-9" />
                  <p className="text-xs font-bold">{ar ? 'اختر كتاباً' : 'Select a book'}</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── 3. AFTER DEMO — "now try the real thing" ── */}
      <AnimatePresence>
        {hasInteracted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-primary/5 dark:bg-white/5 border border-primary/10 dark:border-white/10', dir === 'rtl' ? 'sm:flex-row-reverse' : '')}
          >
            <div className={dir === 'rtl' ? 'text-right' : ''}>
              <p className="text-sm font-black text-primary dark:text-white">
                {ar ? 'جاهز للمكتبة الحقيقية؟' : 'Ready for the real library?'}
              </p>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                {ar ? 'وجّه كاميرتك نحو أي رف أو غلاف كتاب' : 'Point your camera at any shelf or book cover'}
              </p>
            </div>
            <div className={cn('flex gap-2 shrink-0', dir === 'rtl' ? 'flex-row-reverse' : '')}>
              <button
                onClick={() => navigate('/smart-lens')}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary dark:bg-accent text-white dark:text-primary rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-md"
              >
                <ScanSearch className="w-4 h-4" />
                {ar ? 'العدسة الذكية' : 'Smart Lens'}
              </button>
              <button
                onClick={() => navigate('/scan')}
                className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                <QrCode className="w-4 h-4" />
                {ar ? 'مسح QR' : 'Scan QR'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 4. STUDENT RESEARCH TOOLS ── */}
      <div className="space-y-3">
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {ar ? 'أدوات الباحث الذكية' : 'Student Research Tools'}
        </span>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: Target,
              route: '/research-mirror',
              colorClass: 'text-primary bg-primary/10 border-primary/20 dark:text-white dark:bg-white/10 dark:border-white/20',
              titleAr: 'مرآة الباحث',
              titleEn: 'Research Mirror',
              descAr: 'تغطية الأدبيات',
              descEn: 'Literature Coverage',
            },
            {
              icon: Dna,
              route: '/research-dna',
              colorClass: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
              titleAr: 'الحمض النووي',
              titleEn: 'Research DNA',
              descAr: 'خارطة معرفتك',
              descEn: 'Knowledge Profile',
            },
            {
              icon: Swords,
              route: '/book-duel',
              colorClass: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
              titleAr: 'مبارزة الكتب',
              titleEn: 'Book Duel',
              descAr: 'قارن بين كتابين',
              descEn: 'Compare Two Books',
            },
            {
              icon: Map,
              route: '/reading-roadmap',
              colorClass: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
              titleAr: 'مسار القراءة',
              titleEn: 'Reading Roadmap',
              descAr: 'خطة متدرجة بالذكاء',
              descEn: 'AI-Staged Reading Plan',
            },
            {
              icon: Gamepad2,
              route: '/library-quest',
              colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
              titleAr: 'مغامرة المكتبة',
              titleEn: 'Library Adventure',
              descAr: 'ألغاز واكتشاف الكتب',
              descEn: 'Riddles & Book Discovery',
            },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.button
                key={f.route}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 24 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(f.route)}
                className={cn(
                  'official-card p-4 bg-white dark:bg-slate-900 flex flex-col items-start gap-3 group cursor-pointer w-full',
                  dir === 'rtl' ? 'items-end text-right' : ''
                )}
              >
                <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center', f.colorClass)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-primary dark:text-white">{ar ? f.titleAr : f.titleEn}</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">{ar ? f.descAr : f.descEn}</p>
                </div>
                <ChevronRight className={cn('w-3.5 h-3.5 text-slate-300 dark:text-slate-600 transition-transform group-hover:translate-x-1', dir === 'rtl' ? 'rotate-180 self-start group-hover:-translate-x-1 group-hover:translate-x-0' : 'self-end')} />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── 5. EXPLORE MORE — only after the demo ── */}
      <div className="space-y-3">
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {ar ? 'استكشف تجارب AR أخرى' : 'Explore More AR Experiences'}
        </span>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              icon: ScanSearch,
              route: '/smart-lens',
              colorClass: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
              titleAr: 'العدسة الذكية',
              titleEn: 'Smart Lens',
              tagAr: 'كاميرا حقيقية',
              tagEn: 'Real Camera',
            },
            {
              icon: FlaskConical,
              route: '/gap-scanner',
              colorClass: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
              titleAr: 'ماسح الفجوات',
              titleEn: 'Gap Scanner',
              tagAr: 'بحث أكاديمي',
              tagEn: 'Research',
            },
            {
              icon: Star,
              route: '/knowledge-stars',
              colorClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
              titleAr: 'نجوم المعرفة',
              titleEn: 'Knowledge Stars',
              tagAr: 'رسم بياني',
              tagEn: 'Graph',
            },
            {
              icon: GitBranch,
              route: '/hidden-bridges',
              colorClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
              titleAr: 'الجسور الخفية',
              titleEn: 'Hidden Bridges',
              tagAr: 'متعدد التخصصات',
              tagEn: 'Cross-Field',
            },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.button
                key={f.route}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 24 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(f.route)}
                className={cn(
                  'official-card p-4 bg-white dark:bg-slate-900 flex flex-col items-start gap-3 group cursor-pointer w-full',
                  dir === 'rtl' ? 'items-end text-right' : ''
                )}
              >
                <div className={cn('w-9 h-9 rounded-xl border flex items-center justify-center', f.colorClass)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black text-primary dark:text-white">{ar ? f.titleAr : f.titleEn}</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">{ar ? f.tagAr : f.tagEn}</p>
                </div>
                <ChevronRight className={cn('w-3.5 h-3.5 text-slate-300 dark:text-slate-600 transition-transform group-hover:translate-x-1', dir === 'rtl' ? 'rotate-180 self-start group-hover:-translate-x-1 group-hover:translate-x-0' : 'self-end')} />
              </motion.button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
