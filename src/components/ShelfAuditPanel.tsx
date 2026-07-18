import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, AlertTriangle, Play, ScanLine, CheckCircle2, RotateCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';
import { MOCK_BOOKS } from '../data/mockData';
import { getArBookMeta } from '../lib/arCatalog';

// The shelf being audited is a Physics aisle (LC class QC). We deliberately
// seed it with a couple of books whose real class isn't QC to simulate
// mis-shelving, then detect them by comparing each book's derived LC class to
// the shelf's expected class - a fully local, deterministic audit.
const AUDIT_SHELF_IDS = ['1', '4', '3', '9', '12'];
const EXPECTED_CLASS = 'QC';

export function ShelfAuditPanel() {
  const { t, dir } = useLanguage();
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'done'>('idle');

  const audited = useMemo(() => {
    return AUDIT_SHELF_IDS
      .map((id) => MOCK_BOOKS.find((b) => b.id === id))
      .filter((b): b is NonNullable<typeof b> => !!b)
      .map((book) => {
        const meta = getArBookMeta(book);
        const misplaced = meta.lcClass !== EXPECTED_CLASS;
        return { book, meta, misplaced };
      });
  }, []);

  const misplacedCount = audited.filter((a) => a.misplaced).length;

  const runAudit = () => {
    setPhase('scanning');
    setTimeout(() => setPhase('done'), 1800);
  };

  return (
    <div className="official-card p-6 bg-white dark:bg-slate-900 space-y-5">
      <div className={cn('flex items-start justify-between gap-4', dir === 'rtl' ? 'flex-row-reverse text-right' : '')}>
        <div className="space-y-1">
          <div className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
            <ShieldCheck className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-black text-primary dark:text-white tracking-tight">{t('auditTitle')}</h3>
          </div>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed">{t('auditSubtitle')}</p>
          <div className="text-[10px] font-black text-primary/60 dark:text-accent uppercase tracking-widest pt-1 font-mono">
            {t('auditExpectedSection')}: {t('naturalSciences')} · {EXPECTED_CLASS}
          </div>
        </div>
        {phase === 'done' && (
          <button
            onClick={() => setPhase('idle')}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-primary dark:hover:text-accent transition-all"
          >
            <RotateCw className="w-3.5 h-3.5" />
            {t('auditRerunLabel')}
          </button>
        )}
      </div>

      {/* Shelf strip */}
      <div className="relative flex items-end justify-center gap-2 h-32 bg-slate-950 rounded-2xl p-4 overflow-hidden" dir="ltr">
        {audited.map(({ book, meta, misplaced }, i) => {
          const flagged = phase === 'done' && misplaced;
          return (
            <div
              key={book.id}
              className={cn(
                'relative shrink-0 w-8 sm:w-10 rounded-t-sm rounded-b transition-all duration-500',
                flagged && 'ring-2 ring-rose-500 ring-offset-2 ring-offset-slate-950'
              )}
              style={{ height: 78 + ((i * 31) % 26), background: `linear-gradient(180deg, ${meta.spineColor}, ${meta.spineColor}cc)` }}
              title={book.title}
            >
              <span className="text-white/90 text-[7px] sm:text-[8px] font-bold [writing-mode:vertical-rl] rotate-180 max-h-full overflow-hidden py-1.5 flex items-center justify-center w-full">{book.title}</span>
              {flagged && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center">
                  <AlertTriangle className="w-2.5 h-2.5 text-white" />
                </motion.span>
              )}
            </div>
          );
        })}
        {phase === 'scanning' && (
          <motion.div
            initial={{ left: '0%' }} animate={{ left: '100%' }} transition={{ duration: 1.8, ease: 'linear' }}
            className="absolute top-0 bottom-0 w-0.5 bg-accent shadow-[0_0_18px_rgba(217,179,16,0.9)]"
          />
        )}
      </div>

      {phase === 'idle' && (
        <button
          onClick={runAudit}
          className={cn('w-full py-3.5 bg-accent text-primary rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95', dir === 'rtl' ? 'flex-row-reverse' : '')}
        >
          <Play className="w-4 h-4" />
          {t('runAuditLabel')}
        </button>
      )}

      {phase === 'scanning' && (
        <div className={cn('w-full py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
          <ScanLine className="w-4 h-4 animate-pulse text-accent" />
          {t('auditingLabel')}
        </div>
      )}

      {phase === 'done' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 p-3 text-center">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{audited.length - misplacedCount}</div>
              <div className="text-[9px] font-black text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest">{t('auditCorrectLabel')}</div>
            </div>
            <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 p-3 text-center">
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{misplacedCount}</div>
              <div className="text-[9px] font-black text-rose-600/70 dark:text-rose-400/70 uppercase tracking-widest">{t('auditMisplacedLabel')}</div>
            </div>
          </div>

          <AnimatePresence>
            {audited.filter((a) => a.misplaced).map(({ book, meta }, i) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, x: dir === 'rtl' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.12 }}
                className={cn('rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-3 flex items-start gap-3', dir === 'rtl' ? 'flex-row-reverse text-right' : '')}
              >
                <div className="w-8 h-8 shrink-0 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-black text-primary dark:text-white truncate">{book.title}</div>
                  <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 leading-relaxed">
                    {t('auditRepositionAction', { section: meta.subjectAr, code: meta.lcClass })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {misplacedCount === 0 && (
            <div className={cn('rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-4 flex items-center gap-3', dir === 'rtl' ? 'flex-row-reverse text-right' : '')}>
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span className="text-[12px] font-bold text-emerald-700 dark:text-emerald-300">{t('auditAllCorrect')}</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
