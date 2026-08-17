import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Swords, Loader2, Star, GitMerge, BookOpen } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';
import { MOCK_BOOKS } from '../data/mockData';

interface DuelResult {
  readFirst: 'A' | 'B';
  readFirstReason: string;
  similarities: string[];
  differences: string[];
  complementary: string;
  synergy: number;
}

export function BookDuel() {
  const { language, dir } = useLanguage();
  const ar = language === 'ar';

  const [bookA, setBookA] = useState('');
  const [bookB, setBookB] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DuelResult | null>(null);
  const [error, setError] = useState('');

  const bookAObj = MOCK_BOOKS.find(b => b.id === bookA);
  const bookBObj = MOCK_BOOKS.find(b => b.id === bookB);
  const winnerTitle = result
    ? (result.readFirst === 'A' ? bookAObj?.title : bookBObj?.title) ?? ''
    : '';

  const handleDuel = async () => {
    if (!bookAObj || !bookBObj) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/book-duel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookA: { title: bookAObj.title, author: bookAObj.author, category: bookAObj.category, description: (bookAObj as any).description },
          bookB: { title: bookBObj.title, author: bookBObj.author, category: bookBObj.category, description: (bookBObj as any).description },
        }),
      });
      if (!res.ok) throw new Error('failed');
      setResult(await res.json());
    } catch {
      setError(ar ? 'تعذّر المقارنة. حاول مجدداً.' : 'Comparison failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn('max-w-2xl mx-auto px-4 py-8 space-y-6', dir === 'rtl' ? 'text-right' : 'text-left')} dir={dir}>

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <Swords className="w-4 h-4 text-rose-500" />
          </div>
          <h1 className="text-xl font-black text-primary dark:text-white">
            {ar ? 'مبارزة الكتب' : 'Book Duel'}
          </h1>
        </div>
        <p className="text-[12px] text-slate-400 font-bold">
          {ar
            ? 'اختر كتابين — الذكاء الاصطناعي يقارن بينهما ويخبرك أيهما تقرأ أولاً ولماذا'
            : 'Pick two books — AI compares them head-to-head and tells you which to read first and why'}
        </p>
      </div>

      {/* Selectors */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/8 shadow-sm space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              {ar ? 'الكتاب الأول' : 'Book A'}
            </label>
            <select
              value={bookA}
              onChange={e => { setBookA(e.target.value); setResult(null); }}
              className={cn(
                'w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800',
                'text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all',
                dir === 'rtl' ? 'text-right' : ''
              )}
            >
              <option value="">{ar ? '-- اختر --' : '-- Select --'}</option>
              {MOCK_BOOKS.filter(b => b.id !== bookB).map(b => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              {ar ? 'الكتاب الثاني' : 'Book B'}
            </label>
            <select
              value={bookB}
              onChange={e => { setBookB(e.target.value); setResult(null); }}
              className={cn(
                'w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800',
                'text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 transition-all',
                dir === 'rtl' ? 'text-right' : ''
              )}
            >
              <option value="">{ar ? '-- اختر --' : '-- Select --'}</option>
              {MOCK_BOOKS.filter(b => b.id !== bookA).map(b => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* VS strip when both chosen */}
        <AnimatePresence>
          {bookAObj && bookBObj && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className={cn('flex items-center gap-3 py-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                <div className={cn('flex-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-white/8', dir === 'rtl' ? 'text-right' : '')}>
                  <p className="text-[10px] font-black text-primary dark:text-white line-clamp-2">{bookAObj.title}</p>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">{bookAObj.author}</p>
                </div>
                <div className="shrink-0 w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center">
                  <Swords className="w-4 h-4 text-rose-500" />
                </div>
                <div className={cn('flex-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-white/8', dir === 'rtl' ? 'text-right' : '')}>
                  <p className="text-[10px] font-black text-primary dark:text-white line-clamp-2">{bookBObj.title}</p>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">{bookBObj.author}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleDuel}
          disabled={!bookA || !bookB || loading}
          className="w-full py-3.5 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40 hover:brightness-110 active:scale-95 transition-all shadow-md"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" />{ar ? 'يتابع المبارزة…' : 'Analysing Duel…'}</>
            : <><Swords className="w-4 h-4" />{ar ? 'ابدأ المبارزة' : 'Start Duel'}</>}
        </button>
        {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && bookAObj && bookBObj && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* Winner banner */}
            <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 shadow-sm">
              <div className={cn('flex items-center gap-2 mb-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                <Star className="w-4 h-4 text-rose-500 fill-rose-500" />
                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">
                  {ar ? 'اقرأه أولاً' : 'Read This First'}
                </p>
              </div>
              <p className="text-sm font-black text-primary dark:text-white">
                {winnerTitle}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1.5 leading-relaxed">{result.readFirstReason}</p>
            </div>

            {/* Similarities & Differences */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/8 shadow-sm space-y-2.5">
                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                  {ar ? 'أوجه التشابه' : 'Similarities'}
                </p>
                <ul className="space-y-2">
                  {result.similarities.map((s, i) => (
                    <li key={i} className={cn('text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-start gap-1.5', dir === 'rtl' ? 'flex-row-reverse text-right' : '')}>
                      <span className="text-emerald-500 shrink-0 mt-0.5">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/8 shadow-sm space-y-2.5">
                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">
                  {ar ? 'أوجه الاختلاف' : 'Differences'}
                </p>
                <ul className="space-y-2">
                  {result.differences.map((d, i) => (
                    <li key={i} className={cn('text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-start gap-1.5', dir === 'rtl' ? 'flex-row-reverse text-right' : '')}>
                      <span className="text-rose-500 shrink-0 mt-0.5">•</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Synergy */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/8 shadow-sm space-y-3">
              <div className={cn('flex items-center justify-between gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                <div className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                  <GitMerge className="w-4 h-4 text-violet-500" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {ar ? 'التآزر المعرفي' : 'Knowledge Synergy'}
                  </p>
                </div>
                <span className="text-sm font-black text-violet-500">{result.synergy}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-violet-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${result.synergy}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              {result.complementary && (
                <div className={cn('flex items-start gap-1.5 text-[10px] font-bold text-violet-600 dark:text-violet-400', dir === 'rtl' ? 'flex-row-reverse text-right' : '')}>
                  <GitMerge className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>{result.complementary}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!result && !loading && (
        <div className="flex flex-col items-center gap-3 py-14 text-slate-300 dark:text-slate-700">
          <BookOpen className="w-10 h-10" />
          <p className="text-xs font-bold">{ar ? 'اختر كتابين لبدء المبارزة' : 'Pick two books to begin the duel'}</p>
        </div>
      )}
    </div>
  );
}
