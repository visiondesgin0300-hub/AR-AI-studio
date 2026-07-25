import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Target, BookOpen, AlertTriangle, Loader2, ChevronRight, ArrowRight } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';

interface CriticalBook { id: string; title: string; author: string; reason: string; priority: number; }
interface Discipline { name: string; nameEn: string; coverage: 'high' | 'medium' | 'low'; }
interface MirrorResult {
  coverageScore: number;
  criticalBooks: CriticalBook[];
  missingTopics: string[];
  disciplines: Discipline[];
  summary: string;
}

const COVERAGE_COLOR: Record<string, string> = {
  high:   'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  medium: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  low:    'bg-rose-500/15 text-rose-500',
};
const COVERAGE_BAR: Record<string, string> = {
  high: 'bg-emerald-500', medium: 'bg-amber-500', low: 'bg-rose-500',
};
const COVERAGE_WIDTH: Record<string, string> = {
  high: 'w-4/5', medium: 'w-2/5', low: 'w-1/5',
};
const COVERAGE_AR: Record<string, string> = {
  high: 'تغطية جيدة', medium: 'تغطية جزئية', low: 'فجوة حرجة',
};

function ScoreRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144" viewBox="0 0 144 144">
        <circle cx="72" cy="72" r={r} fill="none" stroke="currentColor" strokeWidth="10"
          className="text-slate-100 dark:text-slate-800" />
        <motion.circle
          cx="72" cy="72" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="text-center z-10">
        <motion.p
          className="text-3xl font-black"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {score}%
        </motion.p>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">تغطية</p>
      </div>
    </div>
  );
}

export function ResearchMirror() {
  const navigate = useNavigate();
  const { language, dir } = useLanguage();
  const ar = language === 'ar';

  const [topic, setTopic] = useState('');
  const [abstract, setAbstract] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MirrorResult | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/research-mirror', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), abstract: abstract.trim() }),
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
          <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-white/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-primary dark:text-white" />
          </div>
          <h1 className="text-xl font-black text-primary dark:text-white">
            {ar ? 'مرآة الباحث' : 'Research Mirror'}
          </h1>
        </div>
        <p className="text-[12px] text-slate-400 font-bold">
          {ar
            ? 'أدخل موضوع رسالتك — الذكاء الاصطناعي يحلل مدى تغطية مكتبتنا لأدبياتك ويحدد الكتب الحرجة والفجوات'
            : 'Enter your dissertation topic — AI analyses how well this library covers your literature needs'}
        </p>
      </div>

      {/* Input form */}
      <div className="space-y-3 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/8 shadow-sm">
        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
            {ar ? 'موضوع الرسالة *' : 'Dissertation Topic *'}
          </label>
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
            placeholder={ar ? 'مثال: تطبيقات الواقع المعزز في المكتبات الجامعية العربية' : 'e.g. Augmented Reality in academic libraries'}
            className={cn(
              'w-full text-sm font-bold px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800',
              'text-primary dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-white/10 transition-all',
              dir === 'rtl' ? 'text-right' : 'text-left'
            )}
          />
        </div>
        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
            {ar ? 'ملخص الرسالة (اختياري)' : 'Abstract (optional)'}
          </label>
          <textarea
            value={abstract}
            onChange={e => setAbstract(e.target.value)}
            rows={3}
            placeholder={ar ? 'أضف ملخصاً مختصراً لرسالتك لتحليل أدق…' : 'Add a brief abstract for deeper analysis…'}
            className={cn(
              'w-full text-sm font-bold px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 resize-none',
              'text-primary dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600',
              'focus:outline-none focus:ring-2 focus:ring-primary/20 dark:focus:ring-white/10 transition-all',
              dir === 'rtl' ? 'text-right' : 'text-left'
            )}
          />
        </div>
        <button
          onClick={handleAnalyze}
          disabled={!topic.trim() || loading}
          className="w-full py-3.5 bg-primary dark:bg-accent text-white dark:text-primary rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40 hover:brightness-110 active:scale-95 transition-all shadow-md"
        >
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" />{ar ? 'يحلل…' : 'Analysing…'}</>
            : <><Target className="w-4 h-4" />{ar ? 'حلّل تغطية مكتبتي' : 'Analyse My Coverage'}</>}
        </button>
        {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Score + summary */}
            <div className={cn(
              'p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/8 shadow-sm',
              'flex items-center gap-6',
              dir === 'rtl' ? 'flex-row-reverse' : ''
            )}>
              <ScoreRing score={result.coverageScore} />
              <div className="flex-1 space-y-1.5">
                <p className="text-xs font-black text-primary dark:text-white leading-relaxed">{result.summary}</p>
              </div>
            </div>

            {/* Disciplines */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/8 shadow-sm space-y-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {ar ? 'التغطية حسب التخصص' : 'Coverage by Discipline'}
              </p>
              <div className="space-y-2.5">
                {result.disciplines.map((d, i) => (
                  <div key={i} className="space-y-1">
                    <div className={cn('flex items-center justify-between gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                      <span className="text-xs font-bold text-primary dark:text-white">{ar ? d.name : (d.nameEn || d.name)}</span>
                      <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-full', COVERAGE_COLOR[d.coverage])}>
                        {ar ? COVERAGE_AR[d.coverage] : d.coverage}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <motion.div
                        className={cn('h-full rounded-full', COVERAGE_BAR[d.coverage], COVERAGE_WIDTH[d.coverage])}
                        initial={{ width: 0 }}
                        animate={{ width: undefined }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical books */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/8 shadow-sm space-y-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {ar ? 'الكتب الحرجة — أقرأها أولاً' : 'Critical Books — Read These First'}
              </p>
              <div className="space-y-2">
                {result.criticalBooks.map((b, i) => (
                  <motion.button
                    key={b.id}
                    initial={{ opacity: 0, x: dir === 'rtl' ? 10 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    onClick={() => navigate(`/book/${b.id}`)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-start',
                      dir === 'rtl' ? 'flex-row-reverse' : ''
                    )}
                  >
                    <span className="w-6 h-6 rounded-lg bg-primary/10 dark:bg-white/10 flex items-center justify-center text-[10px] font-black text-primary dark:text-white shrink-0">
                      {b.priority}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-primary dark:text-white truncate">{b.title}</p>
                      <p className="text-[10px] text-slate-400 font-bold truncate">{b.reason}</p>
                    </div>
                    <ChevronRight className={cn('w-3.5 h-3.5 text-slate-300 shrink-0', dir === 'rtl' ? 'rotate-180' : '')} />
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Missing topics */}
            <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 shadow-sm space-y-3">
              <div className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">
                  {ar ? 'مواضيع غير مغطاة — يلزم البحث خارجياً' : 'Missing Topics — Look Outside This Library'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.missingTopics.map((t, i) => (
                  <span key={i} className="text-[11px] font-bold px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Action */}
            <button
              onClick={() => navigate('/gap-scanner')}
              className={cn(
                'w-full flex items-center justify-between gap-3 p-4 rounded-2xl border border-primary/10 dark:border-white/10 bg-primary/5 dark:bg-white/5 hover:bg-primary/10 dark:hover:bg-white/10 transition-colors',
                dir === 'rtl' ? 'flex-row-reverse' : ''
              )}
            >
              <div className={dir === 'rtl' ? 'text-right' : ''}>
                <p className="text-xs font-black text-primary dark:text-white">{ar ? 'اذهب لماسح الفجوات البحثية' : 'Go to Gap Scanner'}</p>
                <p className="text-[10px] text-slate-400 font-bold">{ar ? 'تحليل أعمق بالأوراق البحثية المنشورة' : 'Deeper analysis with published papers'}</p>
              </div>
              <ArrowRight className={cn('w-4 h-4 text-slate-400 shrink-0', dir === 'rtl' ? 'rotate-180' : '')} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!result && !loading && (
        <div className="flex flex-col items-center gap-3 py-14 text-slate-300 dark:text-slate-700">
          <BookOpen className="w-10 h-10" />
          <p className="text-xs font-bold">{ar ? 'أدخل موضوعك لبدء التحليل' : 'Enter your topic to start'}</p>
        </div>
      )}
    </div>
  );
}
