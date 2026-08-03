import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Star, Compass, Lock, Zap, Trophy, Gamepad2, CheckCircle2, Sparkles,
  Circle, Map as MapIcon, BookOpen, ArrowLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { cn } from '../lib/utils';
import { getBadgeStatuses, BadgeStatus } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';

interface BadgesCabinetProps {
  user: User;
}

/**
 * Presentation for each badge. The rules and XP live in lib/utils
 * (getBadgeStatuses) — this map only says how a badge looks and where its
 * "earn it" button goes, so the requirements can't drift from the display.
 */
const BADGE_STYLE: Record<string, {
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  iconBg: string;
  glow: string;
  pill: string;
  titleAr: string; titleEn: string;
  taglineAr: string; taglineEn: string;
  /** Where the badge is actually earned. Omitted when it is derived. */
  to?: string;
  ctaAr?: string; ctaEn?: string;
}> = {
  'مستكشف': {
    icon: Compass,
    color: 'text-blue-600', bg: 'from-blue-50 to-blue-50/30 dark:from-blue-950/40 dark:to-blue-950/10',
    border: 'border-blue-200/80 dark:border-blue-500/25',
    iconBg: 'bg-blue-500/12 border-blue-300/40 dark:bg-blue-500/20 dark:border-blue-500/30',
    glow: 'shadow-blue-200 dark:shadow-blue-900/40',
    pill: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    titleAr: 'مستكشف', titleEn: 'Explorer',
    taglineAr: 'اقرأ خريطة المكتبة', taglineEn: 'Read the library map',
    to: '/map', ctaAr: 'افتح الخريطة', ctaEn: 'Open the map',
  },
  'باحث': {
    icon: Search,
    color: 'text-emerald-600', bg: 'from-emerald-50 to-emerald-50/30 dark:from-emerald-950/40 dark:to-emerald-950/10',
    border: 'border-emerald-200/80 dark:border-emerald-500/25',
    iconBg: 'bg-emerald-500/12 border-emerald-300/40 dark:bg-emerald-500/20 dark:border-emerald-500/30',
    glow: 'shadow-emerald-200 dark:shadow-emerald-900/40',
    pill: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    titleAr: 'باحث', titleEn: 'Researcher',
    taglineAr: 'ابحث في مصادر المكتبة', taglineEn: 'Search the library resources',
    to: '/search', ctaAr: 'ابدأ البحث', ctaEn: 'Start searching',
  },
  'دليل المرافق': {
    icon: MapIcon,
    color: 'text-sky-600', bg: 'from-sky-50 to-sky-50/30 dark:from-sky-950/40 dark:to-sky-950/10',
    border: 'border-sky-200/80 dark:border-sky-500/25',
    iconBg: 'bg-sky-500/12 border-sky-300/40 dark:bg-sky-500/20 dark:border-sky-500/30',
    glow: 'shadow-sky-200 dark:shadow-sky-900/40',
    pill: 'bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400',
    titleAr: 'دليل المرافق', titleEn: 'Facility Guide',
    taglineAr: 'اعرف طريقك إلى المرافق', taglineEn: 'Find your way to the facilities',
    to: '/facilities', ctaAr: 'افتح المرافق', ctaEn: 'Open facilities',
  },
  'قارئ': {
    icon: BookOpen,
    color: 'text-violet-600', bg: 'from-violet-50 to-violet-50/30 dark:from-violet-950/40 dark:to-violet-950/10',
    border: 'border-violet-200/80 dark:border-violet-500/25',
    iconBg: 'bg-violet-500/12 border-violet-300/40 dark:bg-violet-500/20 dark:border-violet-500/30',
    glow: 'shadow-violet-200 dark:shadow-violet-900/40',
    pill: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
    titleAr: 'قارئ', titleEn: 'Reader',
    taglineAr: 'استعر واحفظ ما يهمّك', taglineEn: 'Borrow and save what matters',
    to: '/search', ctaAr: 'اختر كتاباً', ctaEn: 'Pick a book',
  },
  'بطل التحدي': {
    icon: Gamepad2,
    color: 'text-rose-600', bg: 'from-rose-50 to-rose-50/30 dark:from-rose-950/40 dark:to-rose-950/10',
    border: 'border-rose-200/80 dark:border-rose-500/25',
    iconBg: 'bg-rose-500/12 border-rose-300/40 dark:bg-rose-500/20 dark:border-rose-500/30',
    glow: 'shadow-rose-200 dark:shadow-rose-900/40',
    pill: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
    titleAr: 'بطل التحدي', titleEn: 'Challenge Champion',
    taglineAr: 'أتقن مستويات اللعبة الثلاثة', taglineEn: 'Master all three game levels',
    to: '/cognitive-ar', ctaAr: 'العب الآن', ctaEn: 'Play now',
  },
  'متميز': {
    icon: Star,
    color: 'text-amber-600', bg: 'from-amber-50 to-amber-50/30 dark:from-amber-950/40 dark:to-amber-950/10',
    border: 'border-amber-200/80 dark:border-amber-500/25',
    iconBg: 'bg-amber-500/12 border-amber-300/40 dark:bg-amber-500/20 dark:border-amber-500/30',
    glow: 'shadow-amber-200 dark:shadow-amber-900/40',
    pill: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    titleAr: 'متميز', titleEn: 'Distinguished',
    taglineAr: 'الوسام الختامي — بعد الأوسمة الخمسة', taglineEn: 'The final badge — after the other five',
  },
};

function Particle({ angle, color }: { angle: number; color: string }) {
  return (
    <motion.div
      className={cn('absolute w-2 h-2 rounded-full pointer-events-none', color)}
      style={{ top: '50%', left: '50%', marginTop: -4, marginLeft: -4 }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ x: Math.cos(angle) * 70, y: Math.sin(angle) * 70, opacity: 0, scale: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
    />
  );
}

export function BadgesCabinet({ user }: BadgesCabinetProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const badges       = getBadgeStatuses(user);
  const earnedCount  = badges.filter(b => b.earned).length;
  const totalCount   = badges.length;
  const allEarned    = earnedCount === totalCount;

  const [showCelebration, setShowCelebration] = useState(false);
  const [particles, setParticles]             = useState(false);

  useEffect(() => {
    if (allEarned) {
      const seen = sessionStorage.getItem('badges_celebration_shown');
      if (!seen) {
        sessionStorage.setItem('badges_celebration_shown', '1');
        setTimeout(() => { setShowCelebration(true); setParticles(true); }, 300);
        setTimeout(() => setShowCelebration(false), 4500);
        setTimeout(() => setParticles(false), 1200);
      }
    }
  }, [allEarned]);

  // Earned first, then whichever badge is furthest along its own checklist.
  // XP can no longer order this list — XP comes *from* these badges, so
  // sorting by it would just rank each card by the reward it pays.
  const sorted: BadgeStatus[] = [...badges].sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1;
    return (b.current / b.target) - (a.current / a.target);
  });

  return (
    <div className="space-y-4 relative">

      {/* ── Celebration overlay ── */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -8 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/80 dark:to-yellow-950/60 border-2 border-amber-400/40 shadow-2xl shadow-amber-500/20 text-center px-6 py-8 gap-4"
          >
            {particles && [...Array(10)].map((_, i) => (
              <Particle key={i} angle={(i / 10) * Math.PI * 2} color={['bg-amber-400','bg-yellow-500','bg-orange-400','bg-emerald-400','bg-blue-400'][i % 5]} />
            ))}
            <motion.div
              animate={{ rotate: [0, -8, 8, -4, 0], y: [0, -6, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1 }}
              className="w-20 h-20 rounded-3xl bg-amber-400/20 border-2 border-amber-400/50 flex items-center justify-center shadow-xl shadow-amber-400/30"
            >
              <Trophy className="w-10 h-10 text-amber-500" />
            </motion.div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-500 mb-1">
                {isAr ? '🏆 تهانينا!' : '🏆 Congratulations!'}
              </div>
              <div className="text-lg font-black text-primary dark:text-white leading-snug">
                {isAr ? 'اكتسبت جميع الأوسمة المعرفية!' : 'You earned all cognitive badges!'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                {isAr ? 'أنت مستخدم متميز للمكتبة الذكية 🌟' : 'You are a distinguished smart library user 🌟'}
              </div>
            </div>
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-[10px] text-amber-400/70 font-bold"
            >
              {isAr ? 'انقر للإغلاق' : 'Tap to close'}
            </motion.div>
            <button onClick={() => setShowCelebration(false)} className="absolute inset-0 rounded-3xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header strip */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" />
          <span className="text-xs font-black text-primary dark:text-white uppercase tracking-widest">
            {isAr ? 'خزانة الأوسمة' : 'Badge Cabinet'}
          </span>
        </div>
        <span className={cn(
          'text-[10px] font-black px-3 py-1 rounded-xl',
          allEarned ? 'bg-amber-400/15 text-amber-600 dark:text-amber-400' : 'bg-accent/10 text-accent'
        )}>
          {allEarned && '🏆 '}<span dir="ltr">{earnedCount}/{totalCount}</span> {isAr ? 'مكتسب' : 'earned'}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map((badge, i) => {
          const style      = BADGE_STYLE[badge.id];
          const isEarned   = badge.earned;
          const isStarted  = !isEarned && badge.current > 0;
          const Icon       = style.icon;
          const pct        = Math.min((badge.current / badge.target) * 100, 100);

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 280, damping: 22 }}
              whileHover={isEarned || isStarted ? { y: -4 } : {}}
              className={cn(
                'relative rounded-2xl border p-5 flex flex-col items-center text-center gap-3 transition-all',
                isEarned
                  ? cn('bg-gradient-to-b shadow-lg', style.bg, style.border, style.glow)
                  : isStarted
                    ? 'bg-white dark:bg-slate-900 border-accent shadow-lg shadow-accent/20'
                    : 'bg-slate-50 dark:bg-slate-900/30 border-slate-100 dark:border-white/5'
              )}
            >
              {/* Corner indicator */}
              {isEarned ? (
                <span className="absolute top-3 end-3 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-sm" />
              ) : isStarted ? (
                <motion.span
                  className="absolute top-2.5 end-2.5"
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                </motion.span>
              ) : (
                <span className="absolute top-3 end-3">
                  <Lock className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                </span>
              )}

              {/* Icon */}
              <div className={cn(
                'w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all',
                isEarned || isStarted
                  ? cn(style.iconBg, style.color)
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-300 dark:text-slate-600'
              )}>
                <Icon className="w-7 h-7" />
              </div>

              {/* Title + tagline */}
              <div className="space-y-1">
                <p className={cn(
                  'text-sm font-black leading-tight',
                  isEarned || isStarted ? style.color : 'text-slate-400 dark:text-slate-600'
                )}>
                  {isAr ? style.titleAr : style.titleEn}
                </p>
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 leading-snug">
                  {isAr ? style.taglineAr : style.taglineEn}
                </p>
              </div>

              {/* XP reward pill — dir=ltr: the leading "+" is bidi-neutral and
                  would render as "XP 50+" under RTL. */}
              <span dir="ltr" className={cn(
                'text-[9px] font-black px-2.5 py-1 rounded-xl',
                isEarned || isStarted ? style.pill : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              )}>
                +{badge.xp} XP
              </span>

              {isEarned ? (
                <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  {isAr ? 'مكتسب' : 'Earned'}
                </span>
              ) : (
                <div className="w-full space-y-2.5">
                  {/* What is left, spelled out */}
                  <ul className="w-full space-y-1 text-start">
                    {badge.steps.map((s, si) => (
                      <li key={si} className="flex items-start gap-1.5">
                        {s.done
                          ? <CheckCircle2 className="w-3 h-3 mt-px shrink-0 text-emerald-500" />
                          : <Circle className="w-3 h-3 mt-px shrink-0 text-slate-300 dark:text-slate-600" />}
                        <span className={cn(
                          'text-[9px] font-bold leading-snug',
                          s.done ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-500 dark:text-slate-400'
                        )}>
                          {isAr ? s.labelAr : s.labelEn}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Checklist progress */}
                  <div className="space-y-1.5">
                    <div className="relative h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 start-0 rounded-full bg-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.9, ease: 'easeOut', delay: i * 0.1 }}
                      />
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500">
                      <span dir="ltr">{badge.current} / {badge.target}</span>{' '}
                      {isAr ? 'خطوات' : 'steps'}
                    </p>
                  </div>

                  {/* Where to go and earn it */}
                  {style.to && (
                    <Link
                      to={style.to}
                      className={cn(
                        'w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black transition-all active:scale-95',
                        isStarted
                          ? 'bg-accent text-white shadow-md shadow-accent/40 hover:brightness-110'
                          : 'bg-primary/8 dark:bg-white/5 text-primary dark:text-accent hover:bg-primary/15'
                      )}
                    >
                      {isAr ? style.ctaAr : style.ctaEn}
                      <ArrowLeft className={cn('w-3 h-3', isAr ? '' : 'rotate-180')} />
                    </Link>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
