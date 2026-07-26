import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Compass, Lock, Zap, Trophy, Gamepad2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { cn } from '../lib/utils';
import { getEarnedBadges, calcXP } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';

interface BadgesCabinetProps {
  user: User;
}

const ALL_BADGES = [
  {
    id: 'مستكشف',
    gameLevel: 'explorer',
    icon: Compass,
    colorEarned: 'text-blue-600',
    bgEarned: 'from-blue-50 to-blue-50/30 dark:from-blue-950/40 dark:to-blue-950/10',
    borderEarned: 'border-blue-200/80 dark:border-blue-500/25',
    iconBg: 'bg-blue-500/12 border-blue-300/40 dark:bg-blue-500/20 dark:border-blue-500/30',
    dot: 'bg-blue-500',
    glowClass: 'shadow-blue-200 dark:shadow-blue-900/40',
    pillClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    titleAr: 'مستكشف',
    titleEn: 'Explorer',
    descAr: 'افتح خريطة المكتبة',
    descEn: 'Open the library map',
    xp: 50,
    xpRequired: 20,
  },
  {
    id: 'باحث',
    gameLevel: 'researcher',
    icon: Search,
    colorEarned: 'text-emerald-600',
    bgEarned: 'from-emerald-50 to-emerald-50/30 dark:from-emerald-950/40 dark:to-emerald-950/10',
    borderEarned: 'border-emerald-200/80 dark:border-emerald-500/25',
    iconBg: 'bg-emerald-500/12 border-emerald-300/40 dark:bg-emerald-500/20 dark:border-emerald-500/30',
    dot: 'bg-emerald-500',
    glowClass: 'shadow-emerald-200 dark:shadow-emerald-900/40',
    pillClass: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    titleAr: 'باحث',
    titleEn: 'Researcher',
    descAr: 'تنقّل بين 3 رفوف',
    descEn: 'Visit 3 shelves',
    xp: 75,
    xpRequired: 45,
  },
  {
    id: 'متميز',
    gameLevel: 'distinguished',
    icon: Star,
    colorEarned: 'text-amber-600',
    bgEarned: 'from-amber-50 to-amber-50/30 dark:from-amber-950/40 dark:to-amber-950/10',
    borderEarned: 'border-amber-200/80 dark:border-amber-500/25',
    iconBg: 'bg-amber-500/12 border-amber-300/40 dark:bg-amber-500/20 dark:border-amber-500/30',
    dot: 'bg-amber-500',
    glowClass: 'shadow-amber-200 dark:shadow-amber-900/40',
    pillClass: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    titleAr: 'متميز',
    titleEn: 'Distinguished',
    descAr: 'رحلة عبر جميع أقسام المكتبة',
    descEn: 'Journey all library sections',
    xp: 100,
    xpRequired: 80,
  },
];

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
  const earnedBadges = getEarnedBadges(user);
  const earnedCount  = earnedBadges.length;
  const totalCount   = ALL_BADGES.length;
  const allEarned    = earnedCount === totalCount;
  const currentXP    = calcXP();

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

  // Sort: earned first, then unlockable (XP met), then locked
  const sorted = [...ALL_BADGES].sort((a, b) => {
    const aE = earnedBadges.includes(a.id);
    const bE = earnedBadges.includes(b.id);
    if (aE !== bE) return aE ? -1 : 1;
    const aU = currentXP >= a.xpRequired;
    const bU = currentXP >= b.xpRequired;
    if (aU !== bU) return aU ? -1 : 1;
    return a.xpRequired - b.xpRequired;
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
          {allEarned && '🏆 '}{earnedCount}/{totalCount} {isAr ? 'مكتسب' : 'earned'}
        </span>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-3 gap-4">
        {sorted.map((badge, i) => {
          const isEarned   = earnedBadges.includes(badge.id);
          const isUnlocked = currentXP >= badge.xpRequired;
          const Icon       = badge.icon;
          const pct        = Math.min((currentXP / badge.xpRequired) * 100, 100);

          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 280, damping: 22 }}
              whileHover={isEarned || isUnlocked ? { y: -4 } : {}}
              className={cn(
                'relative rounded-2xl border p-5 flex flex-col items-center text-center gap-3 transition-all',
                isEarned
                  ? cn('bg-gradient-to-b shadow-lg', badge.bgEarned, badge.borderEarned, badge.glowClass)
                  : isUnlocked
                    ? 'bg-white dark:bg-slate-900 border-accent/30 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900/30 border-slate-100 dark:border-white/5'
              )}
            >
              {/* Earned green dot OR lock icon */}
              {isEarned ? (
                <span className="absolute top-3 end-3 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-sm" />
              ) : !isUnlocked ? (
                <span className="absolute top-3 end-3">
                  <Lock className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                </span>
              ) : null}

              {/* Icon */}
              <div className={cn(
                'w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all',
                isEarned || isUnlocked
                  ? cn(badge.iconBg, badge.colorEarned)
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-300 dark:text-slate-600'
              )}>
                <Icon className="w-7 h-7" />
              </div>

              {/* Title */}
              <p className={cn(
                'text-sm font-black leading-tight',
                isEarned || isUnlocked ? cn(badge.colorEarned) : 'text-slate-400 dark:text-slate-600'
              )}>
                {isAr ? badge.titleAr : badge.titleEn}
              </p>

              {/* Status line */}
              {isEarned ? (
                <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  {isAr ? 'مكتسب' : 'Earned'}
                </span>
              ) : (
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 leading-snug">
                  {isAr ? badge.descAr : badge.descEn}
                </p>
              )}

              {/* XP reward pill */}
              <span className={cn(
                'text-[9px] font-black px-2.5 py-1 rounded-xl',
                isEarned || isUnlocked ? badge.pillClass : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              )}>
                +{badge.xp} XP
              </span>

              {/* XP progress bar — locked only */}
              {!isEarned && !isUnlocked && (
                <div className="w-full space-y-1.5 mt-0.5">
                  <div className="relative h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent/50 to-accent"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut', delay: i * 0.1 }}
                    />
                  </div>
                  <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500">
                    {currentXP} / {badge.xpRequired} XP
                  </p>
                </div>
              )}

              {/* Play button — unlocked but not yet earned */}
              {!isEarned && isUnlocked && (
                <Link
                  to="/cognitive-ar"
                  className={cn(
                    'mt-0.5 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-white text-[9px] font-black shadow-sm transition-all hover:brightness-110 active:scale-95',
                    'bg-accent'
                  )}
                  onClick={e => e.stopPropagation()}
                >
                  <Gamepad2 className="w-3 h-3" />
                  {isAr ? 'العب لاكتسابه' : 'Play to earn'}
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
