import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, Loader2, Circle, CheckCircle2, ChevronRight, Clock, BookOpen, Sparkles } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';

interface RoadmapBook {
  id?: string;
  title: string;
  author?: string;
  reason: string;
  estimatedHours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface RoadmapStage {
  label: string;
  icon: string;
  books: RoadmapBook[];
}

interface RoadmapResult {
  stages: RoadmapStage[];
  totalHours: number;
  overview: string;
}

const STAGE_CONFIG = [
  {
    colorClass: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30',
    barClass: 'bg-emerald-500',
    dotClass: 'bg-emerald-500 border-emerald-200 dark:border-emerald-900',
    lineClass: 'bg-emerald-200 dark:bg-emerald-900/60',
    labelClass: 'text-emerald-600 dark:text-emerald-400',
    pillClass: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40',
  },
  {
    colorClass: 'text-amber-600 bg-amber-500/10 border-amber-500/30',
    barClass: 'bg-amber-500',
    dotClass: 'bg-amber-500 border-amber-200 dark:border-amber-900',
    lineClass: 'bg-amber-200 dark:bg-amber-900/60',
    labelClass: 'text-amber-600 dark:text-amber-400',
    pillClass: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40',
  },
  {
    colorClass: 'text-violet-600 bg-violet-500/10 border-violet-500/30',
    barClass: 'bg-violet-500',
    dotClass: 'bg-violet-500 border-violet-200 dark:border-violet-900',
    lineClass: 'bg-violet-200 dark:bg-violet-900/60',
    labelClass: 'text-violet-600 dark:text-violet-400',
    pillClass: 'bg-violet-50 dark:bg-violet-950/30 border-violet-100 dark:border-violet-900/40',
  },
];

export function ReadingRoadmap() {
  const { language, dir } = useLanguage();
  const ar = language === 'ar';

  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RoadmapResult | null>(null);
  const [error, setError] = useState('');
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const totalBooks = result?.stages.reduce((acc, s) => acc + s.books.length, 0) ?? 0;
  const doneCount = checked.size;
  const allDone = totalBooks > 0 && doneCount >= totalBooks;

  const toggleBook = (key: string) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const handleGenerate = async () => {
    const trimmed = topic.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setResult(null);
    setChecked(new Set());
    try {
      const res = await fetch('/api/reading-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: trimmed }),
      });
      if (!res.ok) throw new Error('failed');
      setResult(await res.json());
    } catch {
      setError(ar ? 'تعذّر إنشاء المسار. حاول مجدداً.' : 'Could not build roadmap. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('max-w-2xl mx-auto px-4 py-8 space-y-6', dir === 'rtl' ? 'text-right' : 'text-left')} dir={dir}>

      {/* Header */}
      <div className="space-y-1">
        <div className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
          <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <Map className="w-4 h-4 text-sky-500" />
          </div>
          <h1 className="text-xl font-black text-primary dark:text-white">
            {ar ? 'مسار القراءة الذكي' : 'Reading Roadmap'}
          </h1>
        </div>
        <p className="text-[12px] text-slate-400 font-bold">
          {ar
            ? 'أدخل موضوعاً — الذكاء الاصطناعي يبني لك خطة قراءة متدرجة من كتب المكتبة'
            : 'Enter a topic — AI builds a 3-stage reading plan from the library catalog'}
        </p>
      </div>

      {/* Input */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/8 shadow-sm space-y-4">
        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
            {ar ? 'الموضوع أو المجال' : 'Topic or Field'}
          </label>
          <input
            type="text"
            value={topic}
            onChange={e => { setTopic(e.target.value); setResult(null); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
            placeholder={ar ? 'مثال: الذكاء الاصطناعي، التاريخ الإسلامي، علم النفس…' : 'e.g. Artificial Intelligence, Islamic History, Psychology…'}
            className={cn(
              'w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10',
              'bg-slate-50 dark:bg-slate-800 text-primary dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600',
              'focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-all',
              dir === 'rtl' ? 'text-right' : ''
            )}
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={!topic.trim() || loading}
          className="w-full py-3.5 bg-sky-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40 hover:brightness-110 active:scale-95 transition-all shadow-md"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" />{ar ? 'يبني المسار…' : 'Building Roadmap…'}</>
            : <><Sparkles className="w-4 h-4" />{ar ? 'ابنِ مسار القراءة' : 'Build Reading Roadmap'}</>}
        </button>
        {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

            {/* Overview */}
            <div className={cn('p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 flex items-start gap-3', dir === 'rtl' ? 'flex-row-reverse text-right' : '')}>
              <BookOpen className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-sky-700 dark:text-sky-300 leading-relaxed">{result.overview}</p>
                <p className="text-[10px] font-black text-sky-500 mt-1.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {ar ? `إجمالي الوقت: ~${result.totalHours} ساعة` : `Total time: ~${result.totalHours} hours`}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            {totalBooks > 0 && (
              <div className="space-y-1.5">
                <div className={cn('flex items-center justify-between text-[10px] font-black', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                  <span className="text-slate-400">{ar ? 'التقدم' : 'Progress'}</span>
                  <span className="text-sky-500" dir="ltr">{doneCount}/{totalBooks}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-sky-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(doneCount / totalBooks) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}

            {/* Stages */}
            <div className="relative space-y-6">
              {result.stages.map((stage, si) => {
                const cfg = STAGE_CONFIG[si] ?? STAGE_CONFIG[2];
                return (
                  <div key={si} className={cn('flex gap-4', dir === 'rtl' ? 'flex-row-reverse' : '')}>

                    {/* Timeline column */}
                    <div className="flex flex-col items-center">
                      <div className={cn('w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm shrink-0 z-10', cfg.dotClass)}>
                        {stage.icon}
                      </div>
                      {si < result.stages.length - 1 && (
                        <div className={cn('w-0.5 flex-1 mt-1 min-h-[2rem]', cfg.lineClass)} />
                      )}
                    </div>

                    {/* Stage content */}
                    <div className="flex-1 min-w-0 pb-2">
                      <div className={cn('flex items-center gap-2 mb-3', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                        <span className={cn('text-[11px] font-black uppercase tracking-widest', cfg.labelClass)}>
                          {stage.label}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {stage.books.map((book, bi) => {
                          const key = `${si}-${bi}`;
                          const done = checked.has(key);
                          return (
                            <motion.button
                              key={key}
                              onClick={() => toggleBook(key)}
                              initial={{ opacity: 0, x: dir === 'rtl' ? 10 : -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: si * 0.1 + bi * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
                              className={cn(
                                'w-full p-3.5 rounded-xl border transition-all text-left',
                                done
                                  ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-white/5 opacity-60'
                                  : `${cfg.pillClass}`,
                                dir === 'rtl' ? 'text-right' : ''
                              )}
                            >
                              <div className={cn('flex items-start gap-2.5', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                                {done
                                  ? <CheckCircle2 className={cn('w-4 h-4 shrink-0 mt-0.5', cfg.labelClass)} />
                                  : <Circle className="w-4 h-4 shrink-0 mt-0.5 text-slate-300 dark:text-slate-600" />}
                                <div className="flex-1 min-w-0">
                                  <p className={cn('text-[11px] font-black leading-tight', done ? 'line-through text-slate-400 dark:text-slate-600' : 'text-primary dark:text-white')}>
                                    {book.title}
                                  </p>
                                  {book.author && (
                                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">{book.author}</p>
                                  )}
                                  <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-1 leading-snug">{book.reason}</p>
                                  <div className={cn('flex items-center gap-2 mt-1.5', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                                    <span className="text-[8px] font-black bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md">
                                      ~{book.estimatedHours}h
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight className={cn('w-3 h-3 text-slate-300 dark:text-slate-600 shrink-0 mt-1', dir === 'rtl' ? 'rotate-180' : '')} />
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Completion banner */}
            <AnimatePresence>
              {allDone && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-center space-y-2"
                >
                  <div className="text-2xl">🏆</div>
                  <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                    {ar ? 'أتممت المسار بالكامل!' : 'Roadmap Complete!'}
                  </p>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {ar
                      ? `أنهيت ${totalBooks} كتاباً في موضوع "${topic}" — خبرتك أصبحت متكاملة`
                      : `You finished ${totalBooks} books on "${topic}" — your knowledge is now comprehensive`}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!result && !loading && (
        <div className="flex flex-col items-center gap-3 py-14 text-slate-300 dark:text-slate-700">
          <Map className="w-10 h-10" />
          <p className="text-xs font-bold">{ar ? 'أدخل موضوعاً لبناء مسار القراءة' : 'Enter a topic to build your reading roadmap'}</p>
        </div>
      )}
    </div>
  );
}
