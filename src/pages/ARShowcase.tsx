import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode, MapPin, Copy, Check, Zap, Layers, Compass,
  FlaskConical, Star, GitBranch, ChevronRight, ScanSearch,
  Camera, BookOpen, Navigation,
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

  const shelfBooks = MOCK_BOOKS.filter(b => b.shelf === activeShelf);

  useEffect(() => {
    setSelectedBook(shelfBooks[0] ?? null);
  }, [activeShelf]); // eslint-disable-line react-hooks/exhaustive-deps

  // Real Gemini AI summary
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

  return (
    <div className={cn('flex flex-col gap-10 animate-in duration-500', dir === 'rtl' ? 'text-right' : 'text-left')}>

      {/* ── 1. PAGE HEADER ── */}
      <div>
        <div className={cn('flex items-center gap-3 mb-3', dir === 'rtl' ? 'flex-row-reverse' : '')}>
          <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center text-accent">
            <Layers className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">AR BOOK DISCOVERY</span>
        </div>
        <h1 className="text-3xl font-black text-primary dark:text-white tracking-tight">
          {ar ? 'كيف يعمل الواقع المعزز في المكتبة؟' : 'How AR Works in the Library'}
        </h1>
        <p className="text-slate-400 font-bold mt-1.5 text-sm leading-relaxed max-w-xl">
          {ar
            ? 'ثلاث خطوات فعلية يمر بها المستخدم داخل المكتبة — معاينة تفاعلية أدناه تُظهر ما يراه على شاشته.'
            : 'Three real steps a user takes inside the library — the interactive preview below shows exactly what appears on screen.'}
        </p>
      </div>

      {/* ── 2. HOW IT WORKS (3 real steps) ── */}
      <div className="space-y-3">
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {ar ? 'مسار الاستخدام الفعلي' : 'Real Usage Flow'}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: '01',
              icon: Camera,
              color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20',
              titleAr: 'افتح الكاميرا في المكتبة',
              titleEn: 'Open camera in the library',
              descAr: 'استخدم العدسة الذكية أو امسح رمز QR المثبّت على الرف — لا تطبيق إضافي مطلوب.',
              descEn: 'Use Smart Lens or scan the QR code on any shelf — no extra app needed.',
              techAr: 'WebRTC · MediaDevices API',
              techEn: 'WebRTC · MediaDevices API',
            },
            {
              step: '02',
              icon: ScanSearch,
              color: 'text-violet-500 bg-violet-500/10 border-violet-500/20',
              titleAr: 'الذكاء الاصطناعي يتعرف فوراً',
              titleEn: 'AI identifies instantly',
              descAr: 'Gemini Vision يحلل إطار الكاميرا ويطابقه مع فهرس المكتبة ليعيد الكتاب الصحيح.',
              descEn: 'Gemini Vision analyzes the camera frame and matches it against the library catalog.',
              techAr: 'Gemini 2.0 Flash · Vision API',
              techEn: 'Gemini 2.0 Flash · Vision API',
            },
            {
              step: '03',
              icon: BookOpen,
              color: 'text-accent bg-accent/10 border-accent/20',
              titleAr: 'طبقة AR تظهر على الشاشة',
              titleEn: 'AR overlay appears on screen',
              descAr: 'ملخص أكاديمي، موقع الكتاب، اقتباس جاهز — كل شيء فوري بدون بحث يدوي.',
              descEn: 'Academic summary, shelf location, ready citation — everything instant, no manual search.',
              techAr: 'Book Insight API · AR Overlay',
              techEn: 'Book Insight API · AR Overlay',
            },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 280, damping: 22 }}
                className="official-card p-5 bg-white dark:bg-slate-900 space-y-3 relative overflow-hidden"
              >
                {/* Step number watermark */}
                <span className="absolute top-3 right-4 text-5xl font-black text-slate-50 dark:text-white/[0.03] select-none pointer-events-none leading-none">
                  {s.step}
                </span>
                <div className={cn('w-11 h-11 rounded-2xl border flex items-center justify-center', s.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={cn('text-sm font-black text-primary dark:text-white leading-snug', dir === 'rtl' ? 'text-right' : '')}>
                    {ar ? s.titleAr : s.titleEn}
                  </h3>
                  <p className={cn('text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed', dir === 'rtl' ? 'text-right' : '')}>
                    {ar ? s.descAr : s.descEn}
                  </p>
                </div>
                <span className="inline-block text-[8px] font-black text-slate-300 dark:text-slate-600 font-mono">
                  {ar ? s.techAr : s.techEn}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Connector arrows on desktop */}
        <div className="hidden sm:flex items-center justify-center gap-0 -mt-1 pointer-events-none select-none">
          <div className="flex-1" />
          <ChevronRight className="w-4 h-4 text-slate-200 dark:text-slate-700 -mx-1" />
          <div className="flex-1" />
          <ChevronRight className="w-4 h-4 text-slate-200 dark:text-slate-700 -mx-1" />
          <div className="flex-1" />
        </div>
      </div>

      {/* ── 3. AR OVERLAY PREVIEW (the interactive demo) ── */}
      <div className="space-y-3">
        <div className={cn('flex items-center justify-between', dir === 'rtl' ? 'flex-row-reverse' : '')}>
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {ar ? 'معاينة الطبقة AR — محاكاة سطح المكتب' : 'AR Overlay Preview — Desktop Simulation'}
          </span>
          <span className="text-[8px] font-black px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-widest">
            {ar ? 'وضع المحاكاة' : 'Simulation Mode'}
          </span>
        </div>

        {/* Shelf selector */}
        <div className={cn('flex gap-1.5 flex-wrap', dir === 'rtl' ? 'flex-row-reverse' : '')}>
          {ALL_SHELVES.map(sid => (
            <button
              key={sid}
              onClick={() => setActiveShelf(sid)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all',
                activeShelf === sid
                  ? 'bg-primary text-white dark:bg-accent dark:text-primary'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              )}
            >
              {ar ? 'رف' : 'Shelf'} {sid}
            </button>
          ))}
        </div>

        <div className={cn('flex flex-col xl:flex-row gap-4', dir === 'rtl' ? 'xl:flex-row-reverse' : '')}>

          {/* ── Camera view simulation ── */}
          <div className="xl:w-[52%] official-card overflow-hidden p-0 bg-[#01354C] dark:bg-[#010f1a]">
            <div className="px-5 py-2.5 border-b border-white/5 flex items-center justify-between">
              <div className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[9px] text-white/40 uppercase tracking-[0.2em]">
                  {ar ? 'منظور الكاميرا — رف' : 'CAMERA VIEW — SHELF'} {activeShelf}
                </span>
              </div>
              <span className="font-mono text-[9px] text-white/20 uppercase tracking-[0.2em]">
                {ar ? 'محاكاة' : 'SIM'}
              </span>
            </div>

            {/* Book spines */}
            <div className={cn('px-5 pt-6 pb-0 flex gap-2 items-end overflow-x-auto min-h-[210px]', dir === 'rtl' ? 'flex-row-reverse' : '')}>
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
                      onClick={() => setSelectedBook(book)}
                      whileHover={{ y: -8, transition: { duration: 0.2 } }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        'relative flex-shrink-0 w-[52px] rounded-t-[3px] cursor-pointer overflow-hidden flex items-center justify-center transition-all duration-300',
                        isSelected ? 'ring-2 ring-accent ring-offset-1 ring-offset-[#01354C] brightness-110' : 'opacity-70 hover:opacity-100'
                      )}
                      style={{ height: spineH, background: `linear-gradient(175deg, ${color}ee, ${color}99)` }}
                    >
                      {isSelected && (
                        <motion.div
                          className="absolute inset-x-0 h-px bg-accent shadow-[0_0_10px_rgba(217,179,16,1)]"
                          animate={{ top: ['0%', '100%', '0%'] }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                        />
                      )}
                      <span
                        className="text-[8px] font-black text-white/75 leading-tight px-1 select-none"
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

            {/* Wooden shelf plank */}
            <div className="mx-4 h-2 rounded-sm bg-[#6b4423]" />

            {/* Context note */}
            <div className="px-5 py-4 border-t border-white/5 space-y-1">
              <p className="text-[9px] text-white/40 font-bold text-center tracking-wider">
                {ar ? '↑ انقر على أي كتاب — هذا ما يظهر عبر كاميرا الهاتف في المكتبة الحقيقية' : '↑ Click a book — this is what appears through the phone camera in the real library'}
              </p>
            </div>
          </div>

          {/* ── AR Overlay panel (what appears on the phone) ── */}
          <div className="xl:flex-1 official-card overflow-hidden p-0 bg-white dark:bg-slate-900 flex flex-col">
            <div className="px-5 py-2.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                {ar ? 'طبقة AR — ما يراه المستخدم' : 'AR OVERLAY — USER SEES THIS'}
              </span>
              <span className="px-2 py-0.5 rounded bg-accent text-primary text-[8px] font-black uppercase tracking-widest">AR</span>
            </div>

            <div className="overflow-y-auto flex-1">
              <AnimatePresence mode="wait">
                {selectedBook ? (
                  <motion.div
                    key={selectedBook.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="p-5 space-y-4"
                  >
                    {/* Section badge */}
                    <div className={cn('flex items-center gap-2 flex-wrap', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                        {ar ? 'القسم المكتشف' : 'DISCOVERED SECTION'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-primary/8 dark:bg-accent/10 text-primary dark:text-accent text-[9px] font-black uppercase">
                        {selectedBook.section ?? 'QC'} · {selectedBook.category ?? '—'}
                      </span>
                    </div>

                    {/* Title & author */}
                    <div>
                      <h2 className={cn('text-xl font-black text-primary dark:text-white leading-tight', dir === 'rtl' ? 'text-right' : '')}>
                        {selectedBook.title}
                      </h2>
                      <p className="text-slate-400 font-bold text-sm mt-1">{selectedBook.author}</p>
                    </div>

                    {/* Metadata */}
                    <div className="divide-y divide-slate-50 dark:divide-white/5 border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden text-[10px]">
                      {[
                        { label: 'LC CALL NUMBER', value: selectedBook.callNumber ?? `${selectedBook.section ?? 'QC'}6 .C37 ${selectedBook.year ?? 2022}` },
                        { label: ar ? 'التصنيف الموضوعي' : 'SUBJECT CLASSIFICATION', value: selectedBook.category ?? '—' },
                        { label: ar ? 'السنة والناشر' : 'YEAR & PUBLISHER', value: `${selectedBook.year ?? 2022} · ${selectedBook.publisher ?? 'Academic Press'}` },
                        { label: ar ? 'الموقع المادي' : 'PHYSICAL LOCATION', value: `Shelf ${selectedBook.shelf}` },
                      ].map(({ label, value }) => (
                        <div key={label} className={cn('flex items-center justify-between px-4 py-2.5', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                          <span className="font-black text-slate-400 uppercase tracking-wider shrink-0">{label}</span>
                          <span className="font-black text-primary dark:text-white max-w-[55%] truncate text-right">{value}</span>
                        </div>
                      ))}
                    </div>

                    {/* AI Summary */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 space-y-2">
                      <div className={cn('flex items-center justify-between gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                        <div className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                          <Zap className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Gemini AI · {ar ? 'ملخص أكاديمي' : 'Academic Summary'}</span>
                        </div>
                        {aiLoading && (
                          <span className="text-[7px] font-black text-accent uppercase tracking-widest animate-pulse">
                            {ar ? 'جاري التحليل…' : 'Analyzing…'}
                          </span>
                        )}
                      </div>
                      <p className={cn('text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed min-h-[3rem]', dir === 'rtl' ? 'text-right' : '')}>
                        {aiLoading
                          ? <span className="text-slate-300 dark:text-slate-600">{ar ? 'يُحلّل الذكاء الاصطناعي الكتاب…' : 'AI is analyzing this book…'}</span>
                          : aiSummary
                        }
                      </p>
                    </div>

                    {/* Citation */}
                    <div className="space-y-2.5">
                      <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        {ar ? 'اقتبس هذا الكتاب' : 'CITE THIS BOOK'}
                      </div>
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

                    {/* Locate */}
                    <button
                      onClick={() => navigate(`/book/${selectedBook.id}`)}
                      className="w-full py-4 bg-accent text-primary rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-accent/25 hover:brightness-110 active:scale-95 transition-all"
                    >
                      <Navigation className="w-4 h-4" />
                      {ar ? 'انتقل إلى موقعه الفعلي' : 'Navigate to physical location'}
                    </button>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-4 text-slate-300 dark:text-slate-600">
                    <Compass className="w-10 h-10" />
                    <p className="text-xs font-bold">{ar ? 'اختر كتاباً من الرف' : 'Select a book from the shelf'}</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. FEATURED AR EXPERIENCES ── */}
      <div className="space-y-4">
        <div className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
          <Zap className="w-4 h-4 text-accent" />
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            {ar ? 'تجارب AR المتاحة الآن' : 'AR Experiences — Available Now'}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: ScanSearch,
              route: '/smart-lens',
              gradient: 'from-cyan-500/20 to-sky-500/10',
              iconBg: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
              accentColor: 'text-cyan-500',
              badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
              titleAr: 'العدسة الذكية',
              titleEn: 'Smart Lens',
              descAr: 'وجّه الكاميرا نحو أي كتاب — Gemini يتعرف عليه فوراً ويعرض ملخصاً أكاديمياً.',
              descEn: 'Point at any book — Gemini identifies it instantly and shows an academic summary.',
              badgeAr: 'كاميرا حقيقية',
              badgeEn: 'Real Camera',
            },
            {
              icon: FlaskConical,
              route: '/gap-scanner',
              gradient: 'from-violet-500/20 to-indigo-500/10',
              iconBg: 'bg-violet-500/10 text-violet-500 border-violet-500/20',
              accentColor: 'text-violet-500',
              badgeColor: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
              titleAr: 'ماسح الفجوات',
              titleEn: 'Gap Scanner',
              descAr: 'خريطة تفاعلية تكشف الفجوات البحثية في أدبيات مجالك.',
              descEn: 'Interactive map revealing research gaps in your field\'s literature.',
              badgeAr: 'ابتكار أكاديمي',
              badgeEn: 'Academic Research',
            },
            {
              icon: Star,
              route: '/knowledge-stars',
              gradient: 'from-amber-500/20 to-yellow-500/10',
              iconBg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
              accentColor: 'text-amber-500',
              badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
              titleAr: 'نجوم المعرفة',
              titleEn: 'Knowledge Stars',
              descAr: 'رسم بياني للمفاهيم المرتبطة بأي كتاب — استكشف شبكة المعرفة.',
              descEn: 'Concept graph for any book — explore the full knowledge network.',
              badgeAr: 'رسم تفاعلي',
              badgeEn: 'Interactive Graph',
            },
            {
              icon: GitBranch,
              route: '/hidden-bridges',
              gradient: 'from-emerald-500/20 to-teal-500/10',
              iconBg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
              accentColor: 'text-emerald-500',
              badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
              titleAr: 'الجسور الخفية',
              titleEn: 'Hidden Bridges',
              descAr: 'اكتشف الروابط بين تخصصات مختلفة — الفيزياء والخوارزميات والفلسفة.',
              descEn: 'Discover links across disciplines — physics, algorithms, philosophy.',
              badgeAr: 'متعدد التخصصات',
              badgeEn: 'Cross-Disciplinary',
            },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.button
                key={feature.route}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 280, damping: 22 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(feature.route)}
                className={cn(
                  'official-card p-5 bg-white dark:bg-slate-900 overflow-hidden relative group cursor-pointer w-full',
                  dir === 'rtl' ? 'text-right' : 'text-left'
                )}
              >
                <div className={cn('absolute inset-0 bg-gradient-to-br opacity-60 dark:opacity-40 pointer-events-none', feature.gradient)} />
                <div className="relative space-y-3.5">
                  <div className={cn('flex items-start justify-between', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                    <div className={cn('w-11 h-11 rounded-2xl border flex items-center justify-center', feature.iconBg)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={cn('text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full', feature.badgeColor)}>
                      {ar ? feature.badgeAr : feature.badgeEn}
                    </span>
                  </div>
                  <div>
                    <h3 className={cn('text-base font-black text-primary dark:text-white tracking-tight leading-tight', dir === 'rtl' ? 'text-right' : '')}>
                      {ar ? feature.titleAr : feature.titleEn}
                    </h3>
                    <p className={cn('text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed', dir === 'rtl' ? 'text-right' : '')}>
                      {ar ? feature.descAr : feature.descEn}
                    </p>
                  </div>
                  <div className={cn('flex items-center gap-1.5 pt-1', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                    <span className={cn('text-[10px] font-black uppercase tracking-wider', feature.accentColor)}>
                      {ar ? 'جرّبها الآن' : 'Try it now'}
                    </span>
                    <ChevronRight className={cn('w-3.5 h-3.5 transition-transform group-hover:translate-x-1', feature.accentColor, dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1 group-hover:translate-x-0' : '')} />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── 5. FINAL CTA — real camera ── */}
      <div className="official-card p-8 bg-primary dark:bg-slate-900 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent pointer-events-none" />
        <div className={cn('relative flex flex-col md:flex-row items-center justify-between gap-6', dir === 'rtl' ? 'md:flex-row-reverse' : '')}>
          <div className={cn('space-y-2', dir === 'rtl' ? 'text-right' : '')}>
            <div className={cn('flex items-center gap-2 mb-1', dir === 'rtl' ? 'flex-row-reverse' : '')}>
              <MapPin className="w-4 h-4 text-accent" />
              <span className="text-[9px] font-black text-accent uppercase tracking-widest">
                {ar ? 'الخطوة التالية' : 'Next Step'}
              </span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">
              {ar ? 'أنت في المكتبة؟ جرّب الكاميرا الحقيقية' : 'Inside the library? Try the real camera'}
            </h3>
            <p className="text-sm text-white/50 font-bold leading-relaxed max-w-sm">
              {ar
                ? 'العدسة الذكية تستخدم Gemini Vision الحقيقي — امسح أي كتاب واحصل على تحليل فوري.'
                : 'Smart Lens uses real Gemini Vision — scan any book for instant analysis.'}
            </p>
          </div>
          <div className={cn('flex flex-col sm:flex-row gap-3 shrink-0', dir === 'rtl' ? 'sm:flex-row-reverse' : '')}>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/smart-lens')}
              className="flex items-center justify-center gap-2.5 px-7 py-4 bg-accent text-primary rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-accent/30 hover:brightness-110 active:scale-95 transition-all"
            >
              <ScanSearch className="w-5 h-5" />
              {ar ? 'العدسة الذكية' : 'Smart Lens'}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/scan')}
              className="flex items-center justify-center gap-2.5 px-7 py-4 bg-white/10 text-white border border-white/20 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-white/20 active:scale-95 transition-all"
            >
              <QrCode className="w-5 h-5" />
              {ar ? 'مسح QR الرف' : 'Scan Shelf QR'}
            </motion.button>
          </div>
        </div>
      </div>

    </div>
  );
}
