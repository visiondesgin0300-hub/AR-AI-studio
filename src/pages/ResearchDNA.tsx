import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Dna, BookMarked, Loader2, AlertTriangle, ArrowRight, Brain } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';
import { MOCK_BOOKS } from '../data/mockData';

interface Discipline { name: string; score: number; }
interface DNAResult {
  disciplines: Discipline[];
  blindSpot: string;
  nextBook: { id?: string; title: string; author?: string; reason: string; };
  readinessScore: number;
  pattern: string;
}

function RadarChart({ disciplines }: { disciplines: Discipline[] }) {
  const cx = 100, cy = 100, r = 68;
  const n = disciplines.length;
  const angles = disciplines.map((_, i) => (i * 2 * Math.PI / n) - Math.PI / 2);
  const dataPoints = disciplines.map((d, i) => ({
    x: cx + r * (d.score / 100) * Math.cos(angles[i]),
    y: cy + r * (d.score / 100) * Math.sin(angles[i]),
  }));
  const labelPoints = angles.map((a, i) => ({
    x: cx + (r + 20) * Math.cos(a),
    y: cy + (r + 20) * Math.sin(a),
    label: (disciplines[i].name || '').length > 8 ? disciplines[i].name.slice(0, 7) + '…' : disciplines[i].name,
    score: disciplines[i].score,
  }));
  const polyStr = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox="0 0 200 200" className="w-full max-w-[220px] mx-auto">
      {[0.25, 0.5, 0.75, 1.0].map(l => (
        <circle key={l} cx={cx} cy={cy} r={r * l} fill="none" stroke="currentColor"
          className="text-slate-200 dark:text-slate-700" strokeWidth="0.6" />
      ))}
      {angles.map((a, i) => (
        <line key={i} x1={cx} y1={cy}
          x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)}
          stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="0.6" />
      ))}
      <motion.polygon
        points={polyStr}
        fill="rgba(99,102,241,0.18)"
        stroke="#6366F1"
        strokeWidth="1.8"
        strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
      {dataPoints.map((p, i) => (
        <motion.circle key={i} cx={p.x} cy={p.y} r={3} fill="#6366F1"
          initial={{ r: 0 }} animate={{ r: 3 }} transition={{ delay: 0.5 + i * 0.08 }} />
      ))}
      {labelPoints.map((lp, i) => (
        <text key={i} x={lp.x} y={lp.y}
          textAnchor="middle" dominantBaseline="middle"
          className="fill-slate-500 dark:fill-slate-400"
          fontSize="6.5" fontWeight="700">
          {lp.label}
        </text>
      ))}
    </svg>
  );
}

const SELECTABLE_BOOKS = MOCK_BOOKS.slice(0, 16);

export function ResearchDNA() {
  const navigate = useNavigate();
  const { language, dir } = useLanguage();
  const ar = language === 'ar';

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DNAResult | null>(null);
  const [error, setError] = useState('');

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (selected.size === 0) return;
    const books = MOCK_BOOKS.filter(b => selected.has(b.id)).map(b => ({
      title: b.title, author: b.author, category: b.category,
    }));
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/research-dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readBooks: books }),
      });
      if (!res.ok) throw new Error('failed');
      setResult(await res.json());
    } catch {
      setError(ar ? 'تعذّر التحليل. حاول مجدداً.' : 'Analysis failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('max-w-2xl mx-auto px-4 py-8 space-y-6', dir === 'rtl' ? 'text-right' : 'text-left')} dir={dir}>

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Dna className="w-4 h-4 text-indigo-500" />
          </div>
          <h1 className="text-xl font-black text-primary dark:text-white">
            {ar ? 'الحمض النووي المعرفي' : 'Research DNA'}
          </h1>
        </div>
        <p className="text-[12px] text-slate-400 font-bold">
          {ar
            ? 'اختر الكتب التي قرأتها — الذكاء الاصطناعي يرسم خارطة تخصصاتك ويكشف نقاط العمى والكتاب التالي المثالي'
            : 'Select books you have read — AI maps your knowledge profile, finds blind spots, and recommends what to read next'}
        </p>
      </div>

      {/* Book selection grid */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/8 shadow-sm space-y-3">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <span>{ar ? 'اختر الكتب التي قرأتها' : 'Select Books You Have Read'}</span>
          {selected.size > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500">{selected.size}</span>
          )}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {SELECTABLE_BOOKS.map(book => {
            const isSelected = selected.has(book.id);
            return (
              <button
                key={book.id}
                onClick={() => toggle(book.id)}
                className={cn(
                  'p-3 rounded-xl border transition-all text-start',
                  isSelected
                    ? 'border-indigo-500/40 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-slate-100 dark:border-white/8 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800',
                  dir === 'rtl' ? 'text-right' : ''
                )}
              >
                <div className={cn('flex items-start gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                  <div className={cn(
                    'w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all',
                    isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300 dark:border-slate-600'
                  )}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-primary dark:text-white leading-tight line-clamp-2">{book.title}</p>
                    <p className="text-[9px] text-slate-400 font-bold mt-0.5 truncate">{book.author}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <button
          onClick={handleAnalyze}
          disabled={selected.size === 0 || loading}
          className="w-full py-3.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40 hover:brightness-110 active:scale-95 transition-all shadow-md"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" />{ar ? 'يحلل حمضك المعرفي…' : 'Mapping Your DNA…'}</>
            : <><Dna className="w-4 h-4" />{ar ? 'اكتشف حمضي المعرفي' : 'Reveal My Research DNA'}</>}
        </button>
        {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Pattern + readiness */}
            <div className={cn('p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/8 shadow-sm flex items-center gap-4', dir === 'rtl' ? 'flex-row-reverse' : '')}>
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Brain className="w-7 h-7 text-indigo-500" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-primary dark:text-white">{result.pattern}</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-indigo-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${result.readinessScore}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-xs font-black text-indigo-500 shrink-0">{result.readinessScore}%</span>
                </div>
                <p className="text-[9px] text-slate-400 font-bold mt-1">
                  {ar ? 'جاهزية البحث' : 'Research Readiness'}
                </p>
              </div>
            </div>

            {/* Radar chart */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/8 shadow-sm space-y-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {ar ? 'خارطة التخصصات' : 'Knowledge Map'}
              </p>
              <RadarChart disciplines={result.disciplines} />
            </div>

            {/* Blind spot */}
            <div className={cn('p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-start gap-3', dir === 'rtl' ? 'flex-row-reverse' : '')}>
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className={dir === 'rtl' ? 'text-right' : ''}>
                <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">
                  {ar ? 'نقطة العمى الخاصة بك' : 'Your Knowledge Blind Spot'}
                </p>
                <p className="text-xs font-bold text-amber-700 dark:text-amber-300">{result.blindSpot}</p>
              </div>
            </div>

            {/* Next book */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/8 shadow-sm space-y-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {ar ? 'كتابك التالي المثالي' : 'Your Perfect Next Read'}
              </p>
              <div
                onClick={() => result.nextBook.id ? navigate(`/book/${result.nextBook.id}`) : undefined}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30',
                  result.nextBook.id ? 'cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors' : ''
                )}
              >
                <BookMarked className="w-6 h-6 text-indigo-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-primary dark:text-white">{result.nextBook.title}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{result.nextBook.author}</p>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-1">{result.nextBook.reason}</p>
                </div>
                {result.nextBook.id && <ArrowRight className={cn('w-4 h-4 text-indigo-400 shrink-0', dir === 'rtl' ? 'rotate-180' : '')} />}
              </div>
            </div>

            {/* Action */}
            <button
              onClick={() => navigate('/book-duel')}
              className={cn(
                'w-full flex items-center justify-between gap-3 p-4 rounded-2xl border border-primary/10 dark:border-white/10 bg-primary/5 dark:bg-white/5 hover:bg-primary/10 dark:hover:bg-white/10 transition-colors',
                dir === 'rtl' ? 'flex-row-reverse' : ''
              )}
            >
              <div className={dir === 'rtl' ? 'text-right' : ''}>
                <p className="text-xs font-black text-primary dark:text-white">{ar ? 'قارن بين كتابين' : 'Compare Two Books'}</p>
                <p className="text-[10px] text-slate-400 font-bold">{ar ? 'جولة قتال بين الكتب مع الذكاء الاصطناعي' : 'AI-powered book battle'}</p>
              </div>
              <ArrowRight className={cn('w-4 h-4 text-slate-400 shrink-0', dir === 'rtl' ? 'rotate-180' : '')} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!result && !loading && (
        <div className="flex flex-col items-center gap-3 py-14 text-slate-300 dark:text-slate-700">
          <Dna className="w-10 h-10" />
          <p className="text-xs font-bold">{ar ? 'اختر الكتب لاكتشاف حمضك المعرفي' : 'Select books to reveal your DNA'}</p>
        </div>
      )}
    </div>
  );
}
