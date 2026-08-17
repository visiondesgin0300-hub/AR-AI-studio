/**
 * The moment a task lands.
 *
 * Two shapes from one component: an ordinary completion, and the badge. The
 * badge version runs the longer sequence — the medal arrives small, bounces
 * up, gathers a ring of stars, and settles — because the difference in
 * ceremony is what tells a student the two are not the same size of event.
 *
 * Reduced motion collapses all of it to a fade. The information is identical
 * either way; only the theatre is optional.
 */

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Share2, ArrowLeft, ArrowRight, Sparkles, Star, Trophy, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';
import { Achievement } from '../lib/achievements';
import { prefersReducedMotion, isMuted, setMuted } from '../lib/celebrate';
import { Confetti } from './Confetti';

interface AchievementPopupProps {
  achievement: Achievement | null;
  onClose: () => void;
  onShare: (achievement: Achievement) => void;
  /** Called by "Next" — sends the student on to the obvious next thing. */
  onNext?: (achievement: Achievement) => void;
  nextLabel?: string;
}

/** Counts from 0 to `to`, so XP visibly accrues rather than appearing. */
function useCountUp(to: number, run: boolean, ms = 900): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) { setN(to); return; }
    if (prefersReducedMotion() || to <= 0) { setN(to); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      // Ease-out: fast at first, settling on the final number, which reads as
      // a tally landing rather than a linear slider.
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, run, ms]);
  return n;
}

export function AchievementPopup({ achievement, onClose, onShare, onNext, nextLabel }: AchievementPopupProps) {
  const { t, language } = useLanguage();
  const ar = language === 'ar';
  const open = !!achievement;
  const isBadge = achievement?.kind === 'badge';
  const reduced = prefersReducedMotion();

  const [muted, setMutedState] = useState(isMuted);
  const [stage, setStage] = useState(0);
  const fireKey = useRef(0);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) { setStage(0); return; }
    fireKey.current += 1;
    if (reduced) { setStage(3); return; }
    // The sequence: medal in, stars, settle. Kept in state rather than pure
    // CSS so the stars can be mounted only for the beat they belong to.
    const timers = [
      setTimeout(() => setStage(1), 380),
      setTimeout(() => setStage(2), 900),
      setTimeout(() => setStage(3), 1600),
    ];
    return () => timers.forEach(clearTimeout);
  }, [open, reduced]);

  // Escape closes; focus moves into the dialog so a keyboard user is not left
  // behind on the page underneath.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const focus = setTimeout(() => closeRef.current?.focus(), 120);
    return () => { document.removeEventListener('keydown', onKey); clearTimeout(focus); };
  }, [open, onClose]);

  const xp = useCountUp(achievement?.xp ?? 0, open);
  const pct = Math.round((achievement?.progress ?? 0) * 100);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && achievement && (
        <>
          <Confetti fireKey={fireKey.current} count={isBadge ? 200 : 120} duration={isBadge ? 3400 : 2400} />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={achievement.headline}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[190] flex items-center justify-center p-4 sm:p-6 bg-primary/40 backdrop-blur-sm"
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={reduced ? { opacity: 0 } : { scale: 0.8, opacity: 0, y: 30 }}
              animate={reduced ? { opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
              exit={reduced ? { opacity: 0 } : { scale: 0.9, opacity: 0, y: 20 }}
              transition={reduced ? { duration: 0.15 } : { type: 'spring', stiffness: 300, damping: 22 }}
              className={cn(
                'relative w-full max-w-sm max-h-[calc(100dvh-2rem)] flex flex-col gap-4 rounded-3xl p-5 sm:p-6 shadow-2xl border',
                isBadge
                  ? 'bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/50 dark:to-slate-900 border-amber-300/60 dark:border-amber-500/30'
                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/10'
              )}
            >
              {/* Sound toggle and close. A celebration that cannot be silenced
                  is one a student will mute at the OS level, and then they lose
                  every other cue too. */}
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => { const next = !muted; setMuted(next); setMutedState(next); }}
                  title={muted ? t('soundOn') : t('soundOff')}
                  aria-label={muted ? t('soundOn') : t('soundOff')}
                  className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white active:scale-90 transition-all"
                >
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button
                  ref={closeRef}
                  onClick={onClose}
                  title={t('close')}
                  aria-label={t('close')}
                  className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white active:scale-90 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="min-h-0 overflow-y-auto flex flex-col gap-4 text-center">
                {/* The medal, and its sequence */}
                <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                  <motion.div
                    initial={reduced ? false : { scale: 0.3, rotate: -20 }}
                    animate={reduced ? {} : {
                      scale: stage >= 1 ? 1 : 0.3,
                      rotate: stage >= 3 ? 0 : stage >= 1 ? [0, -8, 8, 0] : -20,
                    }}
                    /*
                      Per-property transitions, not one shared spring. A spring
                      solves between exactly two values, so handing it the
                      four-keyframe wobble threw "Only two keyframes currently
                      supported with spring animations" — and an exception
                      thrown while rendering this dialog means no celebration
                      appears at all.
                    */
                    transition={{
                      scale: { type: 'spring', stiffness: 320, damping: 12 },
                      rotate: { duration: 0.5, ease: 'easeInOut' },
                    }}
                    className={cn(
                      'w-24 h-24 rounded-[1.75rem] flex items-center justify-center border-2 shadow-xl',
                      isBadge
                        ? 'bg-amber-400/20 border-amber-400/60 shadow-amber-400/30 text-amber-500'
                        : 'bg-accent/15 border-accent/50 shadow-accent/25 text-accent'
                    )}
                  >
                    {isBadge ? <Trophy className="w-12 h-12" /> : <Sparkles className="w-11 h-11" />}
                  </motion.div>

                  {/* Stars, only for the badge and only for their beat */}
                  {isBadge && !reduced && stage >= 2 && [...Array(6)].map((_, i) => {
                    const angle = (i / 6) * Math.PI * 2;
                    return (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
                        animate={{
                          opacity: stage >= 3 ? 0 : 1,
                          x: Math.cos(angle) * 58,
                          y: Math.sin(angle) * 58,
                          scale: 1,
                        }}
                        transition={{ duration: 0.7, delay: i * 0.05 }}
                        className="absolute text-amber-400"
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </motion.span>
                    );
                  })}
                </div>

                <div className="space-y-1.5">
                  <h2 className={cn('text-xl font-black leading-tight',
                    isBadge ? 'text-amber-600 dark:text-amber-400' : 'text-primary dark:text-white')}>
                    {isBadge ? '🎊 ' : '🎉 '}{achievement.headline}
                  </h2>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                    {achievement.praise}
                  </p>
                </div>

                {/* The task's own facts */}
                {achievement.details.length > 0 && (
                  <ul className="rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 p-3.5 space-y-1.5 text-start">
                    {achievement.details.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] font-bold text-slate-600 dark:text-slate-300">
                        <span aria-hidden="true" className="shrink-0">{d.icon}</span>
                        <span className="min-w-0 break-words">{d.text}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* XP. dir=ltr because a leading + is a neutral character and
                    Arabic would otherwise render "XP 25+". */}
                {achievement.xp > 0 && (
                  <div className="flex items-center justify-center gap-2">
                    <motion.span
                      initial={reduced ? false : { scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.25, type: 'spring', stiffness: 400, damping: 14 }}
                      dir="ltr"
                      className="text-2xl font-black text-accent tabular-nums"
                    >
                      +{xp} XP
                    </motion.span>
                    <span className="text-[11px] font-bold text-slate-400" dir="ltr">
                      ({achievement.totalXp} {ar ? 'الإجمالي' : 'total'})
                    </span>
                  </div>
                )}

                {/* Progress toward the next badge */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-black">
                    <span className="text-slate-500 dark:text-slate-400">{achievement.progressLabel}</span>
                    <span className="text-slate-400 tabular-nums" dir="ltr">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <motion.div
                      className={cn('h-full rounded-full', isBadge ? 'bg-amber-400' : 'bg-accent')}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: reduced ? 0 : 1, ease: 'easeOut', delay: reduced ? 0 : 0.35 }}
                    />
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-snug">
                    {achievement.nextUp}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 shrink-0">
                <button
                  onClick={() => onShare(achievement)}
                  className="min-h-12 flex items-center justify-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-primary dark:text-white text-xs font-black hover:bg-secondary/10 hover:text-secondary active:scale-95 transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  {t('shareTitle')}
                </button>
                <button
                  onClick={() => (onNext ? onNext(achievement) : onClose())}
                  className={cn(
                    'min-h-12 flex items-center justify-center gap-2 rounded-2xl text-xs font-black active:scale-95 transition-all shadow-lg',
                    isBadge
                      ? 'bg-amber-400 text-primary shadow-amber-400/30 hover:brightness-105'
                      : 'bg-primary dark:bg-accent text-white dark:text-primary shadow-primary/25 hover:brightness-110'
                  )}
                >
                  {nextLabel ?? t('continueLabel')}
                  {ar ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
