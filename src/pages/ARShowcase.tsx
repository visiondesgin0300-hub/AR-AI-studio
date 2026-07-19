import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, MapPin, Copy, Check, Zap, Layers, Compass } from 'lucide-react';
import { Book } from '../types';
import { MOCK_BOOKS } from '../data/mockData';
import { BookCover } from '../components/BookCover';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../hooks/useLanguage';

const SPINE_COLORS = [
  '#7B2D8B', '#2D5A27', '#8B4513', '#1B3A6B',
  '#8B6914', '#2B5F75', '#6B2D2D', '#4B2D8B',
  '#1B6B4A', '#5F3527',
];

const ALL_SHELVES = ['A-1', 'A-2', 'B-1', 'B-2', 'C-1', 'C-2', 'D-1', 'D-2'];

const AI_SUMMARIES: Record<string, { ar: string; en: string }> = {
  default: {
    ar: 'يُعدّ هذا الكتاب من أبرز المراجع الأكاديمية في مجاله، إذ يجمع بين العمق الفكري والوضوح المنهجي. يُوصى به للباحثين والطلاب على حدٍّ سواء لاستيعاب المفاهيم الجوهرية في التخصص.',
    en: 'This title ranks among the most prominent academic references in its field, combining intellectual depth with methodological clarity. Recommended for researchers and students seeking foundational and advanced coverage.',
  },
};

function getCitation(book: Book, fmt: 'apa' | 'mla' | 'chicago' | 'bibtex'): string {
  const y = book.year ?? 2022;
  const pub = book.publisher ?? 'Academic Press';
  const a = book.author;
  const t = book.title;
  switch (fmt) {
    case 'apa':      return `${a} (${y}). ${t}. ${pub}.`;
    case 'mla':      return `${a}. "${t}." ${pub}, ${y}.`;
    case 'chicago':  return `${a}. ${t}. ${pub}, ${y}.`;
    case 'bibtex':   return `@book{${(book.shelf ?? 'ref').replace('-','')},\n  author    = {${a}},\n  title     = {${t}},\n  publisher = {${pub}},\n  year      = {${y}}\n}`;
  }
}

export function ARShowcase() {
  const navigate = useNavigate();
  const { language, dir } = useLanguage();

  const [activeShelf, setActiveShelf] = useState('A-1');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [citeFmt, setCiteFmt] = useState<'apa' | 'mla' | 'chicago' | 'bibtex'>('apa');
  const [copied, setCopied] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [summaryDone, setSummaryDone] = useState(false);

  // Live telemetry oscillation — simulates real AR camera sensors
  const [pitch, setPitch] = useState(-5.6);
  const [roll, setRoll] = useState(7.6);
  const [fps, setFps] = useState(60);

  const shelfBooks = MOCK_BOOKS.filter(b => b.shelf === activeShelf);

  // Auto-select first book when shelf changes
  useEffect(() => {
    setSelectedBook(shelfBooks[0] ?? null);
  }, [activeShelf]); // eslint-disable-line react-hooks/exhaustive-deps

  // Telemetry oscillation
  useEffect(() => {
    const id = setInterval(() => {
      setPitch(p => parseFloat((p + (Math.random() - 0.5) * 0.4).toFixed(1)));
      setRoll(r => parseFloat((r + (Math.random() - 0.5) * 0.4).toFixed(1)));
      setFps(Math.floor(57 + Math.random() * 5));
    }, 700);
    return () => clearInterval(id);
  }, []);

  // Typewriter AI summary
  useEffect(() => {
    if (!selectedBook) return;
    const full = language === 'ar'
      ? AI_SUMMARIES.default.ar
      : AI_SUMMARIES.default.en;
    setSummaryText('');
    setSummaryDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setSummaryText(full.slice(0, i));
      if (i >= full.length) { clearInterval(id); setSummaryDone(true); }
    }, 16);
    return () => clearInterval(id);
  }, [selectedBook, language]);

  const handleCopy = () => {
    if (!selectedBook) return;
    navigator.clipboard.writeText(getCitation(selectedBook, citeFmt)).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('flex flex-col gap-8 animate-in duration-500', dir === 'rtl' ? 'text-right' : 'text-left')}>

      {/* Page header */}
      <div className={cn('flex flex-col md:flex-row items-start md:items-center justify-between gap-4', dir === 'rtl' ? 'md:flex-row-reverse' : '')}>
        <div>
          <div className={cn('flex items-center gap-3 mb-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
            <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center text-accent">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">AR BOOK DISCOVERY</span>
          </div>
          <h1 className="text-3xl font-black text-primary dark:text-white tracking-tight">
            {language === 'ar' ? 'اكتشاف الكتب AR' : 'AR Book Discovery'}
          </h1>
          <p className="text-slate-400 font-bold mt-1 text-sm leading-relaxed">
            {language === 'ar'
              ? 'محاكاة تفاعلية لتجربة مسح الكتب بالواقع المعزز — اضغط على أي كتاب'
              : 'Interactive simulation of the AR book scanning experience — tap any book'}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/scan')}
          className={cn(
            'flex items-center gap-3 px-6 py-3.5 bg-accent text-primary rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-accent/30 hover:brightness-110 transition-all shrink-0',
            dir === 'rtl' ? 'flex-row-reverse' : ''
          )}
        >
          <QrCode className="w-4 h-4" />
          {language === 'ar' ? 'مسح رمز QR' : 'Scan Shelf QR'}
        </motion.button>
      </div>

      {/* ── Top CTA ── */}
      <div className="official-card p-8 md:p-12 bg-primary dark:bg-slate-900 text-center space-y-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative space-y-2">
          <span className="inline-block px-4 py-1.5 bg-accent/20 text-accent rounded-full text-[9px] font-black uppercase tracking-widest">
            {language === 'ar' ? 'الخطوة التالية' : 'Next Step'}
          </span>
          <h3 className="text-2xl font-black text-white tracking-tight">
            {language === 'ar' ? 'جاهز للمكتبة الحقيقية؟' : 'Ready for the real library?'}
          </h3>
          <p className="text-sm text-white/60 font-bold max-w-md mx-auto leading-relaxed">
            {language === 'ar'
              ? 'امسح رفًا حقيقيًا بكاميرتك أو ابحث عن أي كتاب في الفهرس.'
              : 'Scan a real shelf with your camera or search the full catalog.'}
          </p>
        </div>
        <div className={cn('relative flex flex-col sm:flex-row gap-3 justify-center', dir === 'rtl' ? 'sm:flex-row-reverse' : '')}>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/scan')}
            className="flex items-center justify-center gap-2.5 px-8 py-4 bg-accent text-primary rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-accent/30 hover:brightness-110 active:scale-95 transition-all"
          >
            <QrCode className="w-5 h-5" />
            {language === 'ar' ? 'امسح رفًا حقيقيًا' : 'Scan a Real Shelf'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/search')}
            className="flex items-center justify-center gap-2.5 px-8 py-4 bg-white/10 text-white border border-white/20 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-white/20 active:scale-95 transition-all"
          >
            <Compass className="w-5 h-5" />
            {language === 'ar' ? 'ابحث عن كتاب' : 'Search a Book'}
          </motion.button>
        </div>
      </div>

      {/* Main AR view */}
      <div className={cn('flex flex-col xl:flex-row gap-6', dir === 'rtl' ? 'xl:flex-row-reverse' : '')}>

        {/* ── Left: Bookshelf simulation ── */}
        <div className="xl:w-[54%] official-card overflow-hidden p-0 bg-[#01354C] dark:bg-[#010f1a]">

          {/* Shelf header bar */}
          <div className="px-5 py-2.5 border-b border-white/5 flex items-center justify-between">
            <span className="font-mono text-[9px] text-white/30 uppercase tracking-[0.2em]">
              BOOK ROW SEQUENCE // REF-{activeShelf.replace('-', '')}48
            </span>
            <span className="font-mono text-[9px] text-accent/50 uppercase tracking-[0.2em]">
              SHELF {activeShelf}
            </span>
          </div>

          {/* Book spines */}
          <div className={cn('px-5 pt-5 pb-0 flex gap-2 items-end overflow-x-auto min-h-[210px]', dir === 'rtl' ? 'flex-row-reverse' : '')}>
            {shelfBooks.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-white/20 text-xs font-bold pb-8">
                {language === 'ar' ? 'لا توجد كتب على هذا الرف' : 'No books on this shelf'}
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
                      isSelected ? 'ring-2 ring-accent ring-offset-1 ring-offset-[#01354C] brightness-110' : 'opacity-75 hover:opacity-100'
                    )}
                    style={{ height: spineH, background: `linear-gradient(175deg, ${color}ee, ${color}99)` }}
                  >
                    {/* Scan line on selected */}
                    {isSelected && (
                      <motion.div
                        className="absolute inset-x-0 h-px bg-accent shadow-[0_0_10px_rgba(217,179,16,1)]"
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                    {/* Spine title */}
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
                    {/* Selected pulse dot */}
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
          <div className="mx-4 h-2 rounded-sm bg-[#6b4423] mt-0" />

          {/* Telemetry strip */}
          <div className="px-5 py-4 border-t border-white/5">
            <div className="grid grid-cols-5 gap-2 mb-3">
              {[
                { label: 'PITCH',     value: `${pitch.toFixed(1)}°` },
                { label: 'ROLL',      value: `${roll.toFixed(1)}°` },
                { label: 'COMPASS',   value: '189° N' },
                { label: 'EST.DEPTH', value: '1.05m' },
                { label: 'SYS FPS',   value: String(fps) },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <div className="text-[7px] font-black text-white/25 uppercase tracking-widest">{label}</div>
                  <div className="text-[12px] font-black text-accent/70 mt-0.5 tabular-nums">{value}</div>
                </div>
              ))}
            </div>
            <p className="text-[8px] text-white/25 font-bold uppercase tracking-wider text-center">
              {language === 'ar'
                ? 'اضغط على أي كتاب لمحاكاة مسح علامة AR الخاصة به'
                : 'Tap any book on the shelf to simulate scanning its AR marker'}
            </p>
          </div>
        </div>

        {/* ── Right: AR Info Window ── */}
        <div className="xl:flex-1 official-card overflow-hidden p-0 bg-white dark:bg-slate-900 flex flex-col">
          {/* Panel header */}
          <div className="px-5 py-2.5 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">AR INFO WINDOW</span>
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
                  {/* Discovered section badge */}
                  <div className={cn('flex items-center gap-2 flex-wrap', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest shrink-0">DISCOVERED SECTION</span>
                    <span className="px-2 py-0.5 rounded-md bg-primary/8 dark:bg-accent/10 text-primary dark:text-accent text-[9px] font-black uppercase">
                      {selectedBook.section ?? 'QC'} · {selectedBook.category ?? '—'}
                    </span>
                  </div>

                  {/* Book title & author */}
                  <div>
                    <h2 className={cn('text-xl font-black text-primary dark:text-white leading-tight', dir === 'rtl' ? 'text-right' : 'text-left')}>
                      {selectedBook.title}
                    </h2>
                    <p className="text-slate-400 font-bold text-sm mt-1">{selectedBook.author}</p>
                  </div>

                  {/* Metadata table */}
                  <div className="divide-y divide-slate-50 dark:divide-white/5 border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden text-[10px]">
                    {[
                      {
                        label: 'LC CALL NUMBER',
                        value: selectedBook.callNumber ?? `${selectedBook.section ?? 'QC'}6 .C37 ${selectedBook.year ?? 2022}`,
                      },
                      {
                        label: language === 'ar' ? 'التصنيف الموضوعي' : 'SUBJECT CLASSIFICATION',
                        value: selectedBook.category ?? '—',
                      },
                      {
                        label: language === 'ar' ? 'السنة والناشر' : 'YEAR & PUBLISHER',
                        value: `${selectedBook.year ?? 2022} · ${selectedBook.publisher ?? 'Academic Press'}`,
                      },
                      {
                        label: language === 'ar' ? 'الموقع المادي' : 'PHYSICAL LOCATION',
                        value: `Shelf ${selectedBook.shelf}`,
                      },
                    ].map(({ label, value }) => (
                      <div key={label} className={cn('flex items-center justify-between px-4 py-2.5', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                        <span className="font-black text-slate-400 uppercase tracking-wider shrink-0">{label}</span>
                        <span className={cn('font-black text-primary dark:text-white max-w-[55%] truncate', dir === 'rtl' ? 'text-right' : 'text-right')}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* AI Analysis */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 space-y-2">
                    <div className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                      <Zap className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">AI ANALYSIS (GEMINI)</span>
                    </div>
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">ACADEMIC SUMMARY</div>
                    <p className={cn('text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed min-h-[3rem]', dir === 'rtl' ? 'text-right' : 'text-left')}>
                      {summaryText}
                      {!summaryDone && (
                        <span className="inline-block w-0.5 h-3 bg-accent/70 animate-pulse align-middle ml-0.5" />
                      )}
                    </p>
                  </div>

                  {/* Cite this book */}
                  <div className="space-y-2.5">
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">CITE THIS BOOK</div>
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

                  {/* Go to shelf */}
                  <button
                    onClick={() => navigate('/map', { state: { shelfId: selectedBook.shelf, openAR: true } })}
                    className="w-full py-4 bg-accent text-primary rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-accent/25 hover:brightness-110 active:scale-95 transition-all"
                  >
                    <MapPin className="w-4 h-4" />
                    {language === 'ar' ? 'الذهاب إلى الرف' : 'Go to Shelf'}
                  </button>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-slate-300 dark:text-slate-600">
                  <Compass className="w-10 h-10" />
                  <p className="text-xs font-bold">
                    {language === 'ar' ? 'اختر كتاباً من الرف' : 'Select a book from the shelf'}
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Digital Academic Shelf */}
      <div className="official-card p-6 bg-white dark:bg-slate-900 space-y-5">
        <div className={cn('flex items-start md:items-center justify-between gap-4 flex-col md:flex-row', dir === 'rtl' ? 'md:flex-row-reverse' : '')}>
          <div>
            <div className="font-mono text-[9px] text-slate-400 uppercase tracking-[0.2em]">DIGITAL ACADEMIC SHELF</div>
            <div className="text-[8px] text-accent font-black uppercase tracking-widest mt-0.5">
              AVAILABLE FOR AR SCANNING — {shelfBooks.length} TITLES
            </div>
          </div>
          {/* Shelf tabs */}
          <div className={cn('flex gap-1.5 flex-wrap', dir === 'rtl' ? 'justify-end' : '')}>
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
                {sid}
              </button>
            ))}
          </div>
        </div>

        <div className={cn('flex gap-4 overflow-x-auto pb-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
          {shelfBooks.map((book, i) => {
            const isSelected = selectedBook?.id === book.id;
            const callPfx = book.callNumber?.split(' ')[0] ?? `${book.section ?? 'QC'}${200 + i * 5}`;
            return (
              <motion.button
                key={book.id}
                onClick={() => setSelectedBook(book)}
                whileHover={{ y: -4 }}
                className={cn(
                  'flex flex-col items-center gap-2 shrink-0 p-2.5 rounded-2xl transition-all',
                  isSelected
                    ? 'bg-accent/10 dark:bg-accent/15 ring-2 ring-accent'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                <div className="relative">
                  <span className={cn(
                    'absolute -top-1 -left-1 px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase z-10 shadow',
                    isSelected ? 'bg-accent text-primary' : 'bg-primary text-white dark:bg-slate-700 dark:text-slate-200'
                  )}>
                    {callPfx}
                  </span>
                  <BookCover book={book} className="w-16 h-[5.5rem] rounded-xl shadow-md" />
                </div>
                <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 w-16 text-center line-clamp-2 leading-tight">{book.title}</p>
                <p className="text-[8px] text-slate-300 dark:text-slate-600 w-16 text-center truncate">{book.author}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
