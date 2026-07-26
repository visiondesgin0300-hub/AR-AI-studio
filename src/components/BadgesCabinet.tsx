import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Compass, Lock, Zap, Trophy, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { cn } from '../lib/utils';
import { getEarnedBadges } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';
import { calcXP } from '../lib/utils';

interface BadgesCabinetProps {
  user: User;
}

const ALL_BADGES = [
  {
    id: 'مستكشف',
    gameLevel: 'explorer',
    icon: Compass,
    colorEarned: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
    glowClass: 'shadow-blue-500/30',
    titleAr: 'مستكشف',
    titleEn: 'Explorer',
    unlockAr: 'افتح خريطة المكتبة أو العب مستوى المستكشف',
    unlockEn: 'Open the library map or play Explorer level',
    xp: 50,
    xpRequired: 20,
  },
  {
    id: 'باحث',
    gameLevel: 'researcher',
    icon: Search,
    colorEarned: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
    glowClass: 'shadow-emerald-500/30',
    titleAr: 'باحث',
    titleEn: 'Researcher',
    unlockAr: 'تنقّل بين 3 رفوف أو العب مستوى الباحث',
    unlockEn: 'Visit 3 shelves or play Researcher level',
    xp: 75,
    xpRequired: 45,
  },
  {
    id: 'متميز',
    gameLevel: 'distinguished',
    icon: Star,
    colorEarned: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20',
    glowClass: 'shadow-yellow-500/30',
    titleAr: 'متميز',
    titleEn: 'Distinguished',
    unlockAr: 'رحلة عبر جميع أقسام المكتبة أو العب مستوى المتميز',
    unlockEn: 'Journey all library sections or play Distinguished level',
    xp: 100,
    xpRequired: 80,
  },
];

// Particle dot for the celebration burst
function Particle({ angle, color }: { angle: number; color: string }) {
  return (
    <motion.div
      className={cn('absolute w-2 h-2 rounded-full pointer-events-none', color)}
      style={{ top: '50%', left: '50%', marginTop: -4, marginLeft: -4 }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{
        x: Math.cos(angle) * 70,
        y: Math.sin(angle) * 70,
        opacity: 0,
        scale: 0,
      }}
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

  // Show celebration once when all badges are first earned this session
  const [showCelebration, setShowCelebration] = useState(false);
  const [particles, setParticles] = useState(false);

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
            {/* Burst particles */}
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

            {/* Tap to close */}
            <button
              onClick={() => setShowCelebration(false)}
              className="absolute inset-0 rounded-3xl"
            />
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
          'text-[10px] font-black px-3 py-1 rounded-xl transition-colors',
          allEarned
            ? 'bg-amber-400/15 text-amber-600 dark:text-amber-400'
            : 'bg-accent/10 text-accent'
        )}>
          {allEarned && '🏆 '}{earnedCount}/{totalCount} {isAr ? 'مكتسب' : 'earned'}
        </span>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-3 gap-3">
        {ALL_BADGES.map((badge, i) => {
          const isEarned = earnedBadges.includes(badge.id);
          const Icon = badge.icon;
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 22 }}
              whileHover={isEarned ? { y: -4, scale: 1.03 } : {}}
              className={cn(
                'relative p-4 rounded-2xl border flex flex-col items-center text-center gap-3 transition-all',
                isEarned
                  ? cn('bg-white dark:bg-slate-900 border-accent/20 shadow-md', badge.glowClass)
                  : currentXP >= badge.xpRequired
                    ? 'bg-white dark:bg-slate-900 border-accent/30 opacity-100'
                    : 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-100 dark:border-white/5 opacity-50 grayscale'
              )}
            >
              {!isEarned && currentXP < badge.xpRequired && (
                <div className="absolute top-2.5 right-2.5">
                  <Lock className="w-3 h-3 text-slate-300 dark:text-slate-700" />
                </div>
              )}

              <div className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center border',
                isEarned
                  ? badge.colorEarned
                  : currentXP >= badge.xpRequired
                    ? badge.colorEarned
                    : 'text-slate-300 dark:text-slate-700 bg-slate-100/50 dark:bg-slate-800/50 border-slate-100 dark:border-white/5'
              )}>
                <Icon className="w-6 h-6" />
              </div>

              {isEarned && (
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-sm" />
              )}

              <div className={cn(
                'text-[11px] font-black uppercase tracking-wide leading-tight',
                isEarned || currentXP >= badge.xpRequired ? 'text-primary dark:text-white' : 'text-slate-400 dark:text-slate-600'
              )}>
                {isAr ? badge.titleAr : badge.titleEn}
              </div>

              <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 leading-snug">
                {isEarned
                  ? <span className="text-emerald-500">✓ {isAr ? 'مكتسب' : 'Earned'}</span>
                  : (isAr ? badge.unlockAr : badge.unlockEn)
                }
              </div>

              <div className={cn('text-[9px] font-black px-2 py-0.5 rounded-lg', isEarned ? 'bg-accent/10 text-accent' : 'bg-slate-100 dark:bg-slate-800 text-slate-400')}>
                +{badge.xp} XP
              </div>

              {/* XP progress — shown only when not earned and below threshold */}
              {!isEarned && currentXP < badge.xpRequired && (
                <div className="w-full space-y-1.5">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[8px] font-bold text-slate-400">{currentXP} XP</span>
                    <span className="text-[8px] font-bold text-slate-400">{badge.xpRequired} XP</span>
                  </div>
                  <div className="relative w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent/40 to-accent/70"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((currentXP / badge.xpRequired) * 100, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.1 }}
                    />
                  </div>
                  <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500">
                    {isAr
                      ? `${badge.xpRequired - currentXP} XP للفتح`
                      : `${badge.xpRequired - currentXP} XP to unlock`}
                  </p>
                </div>
              )}

              {/* Play button — appears only once XP threshold is met */}
              {!isEarned && currentXP >= badge.xpRequired && (
                <Link
                  to="/cognitive-ar"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent text-white hover:bg-accent/90 transition-colors shadow-sm shadow-accent/30"
                  onClick={e => e.stopPropagation()}
                >
                  <Gamepad2 className="w-3 h-3" />
                  <span className="text-[9px] font-black">{isAr ? 'العب لاكتسابه' : 'Play to earn'}</span>
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
