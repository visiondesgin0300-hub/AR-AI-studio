import React from 'react';
import { Search, Star, Compass, BookOpen, Navigation, GraduationCap, Lock, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';
import { cn } from '../lib/utils';
import { getEarnedBadges, getUserLevel } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';

interface BadgesCabinetProps {
  user: User;
}

const ALL_BADGES = [
  {
    id: 'مستكشف',
    icon: Compass,
    colorEarned: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
    titleAr: 'مستكشف',
    titleEn: 'Explorer',
    unlockAr: 'استكشف خريطة المكتبة',
    unlockEn: 'Explore the library map',
    xp: 50,
  },
  {
    id: 'باحث',
    icon: Search,
    colorEarned: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
    titleAr: 'باحث',
    titleEn: 'Researcher',
    unlockAr: 'ابحث عن 5 كتب',
    unlockEn: 'Search for 5 books',
    xp: 75,
  },
  {
    id: 'متميز',
    icon: Star,
    colorEarned: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20',
    titleAr: 'متميز',
    titleEn: 'Distinguished',
    unlockAr: 'حقق 200 نقطة XP',
    unlockEn: 'Reach 200 XP points',
    xp: 100,
  },
  {
    id: 'قارئ',
    icon: BookOpen,
    colorEarned: 'text-purple-600 bg-purple-500/10 border-purple-500/20',
    titleAr: 'قارئ نهم',
    titleEn: 'Avid Reader',
    unlockAr: 'استعر 5 كتب',
    unlockEn: 'Borrow 5 books',
    xp: 120,
  },
  {
    id: 'ملاح',
    icon: Navigation,
    colorEarned: 'text-cyan-600 bg-cyan-500/10 border-cyan-500/20',
    titleAr: 'ملاح',
    titleEn: 'Navigator',
    unlockAr: 'تنقّل إلى 10 أرفف',
    unlockEn: 'Navigate to 10 shelves',
    xp: 150,
  },
  {
    id: 'أكاديمي',
    icon: GraduationCap,
    colorEarned: 'text-rose-600 bg-rose-500/10 border-rose-500/20',
    titleAr: 'أكاديمي',
    titleEn: 'Scholar',
    unlockAr: 'أكمل 3 فجوات بحثية',
    unlockEn: 'Complete 3 gap scans',
    xp: 200,
  },
];

export function BadgesCabinet({ user }: BadgesCabinetProps) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const earnedBadges = getEarnedBadges(user);
  const level = getUserLevel(user.points);

  const earnedCount = earnedBadges.length;
  const totalCount = ALL_BADGES.length;

  return (
    <div className="space-y-4">
      {/* Header strip */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" />
          <span className="text-xs font-black text-primary dark:text-white uppercase tracking-widest">
            {isAr ? 'خزانة الأوسمة' : 'Badge Cabinet'}
          </span>
        </div>
        <span className="text-[10px] font-black bg-accent/10 text-accent px-3 py-1 rounded-xl">
          {earnedCount}/{totalCount} {isAr ? 'مكتسب' : 'earned'}
        </span>
      </div>

      {/* 2×3 grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                  ? 'bg-white dark:bg-slate-900 border-accent/20 shadow-md shadow-accent/5'
                  : 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-100 dark:border-white/5 opacity-50 grayscale'
              )}
            >
              {/* Lock icon for unearned */}
              {!isEarned && (
                <div className="absolute top-2.5 right-2.5">
                  <Lock className="w-3 h-3 text-slate-300 dark:text-slate-700" />
                </div>
              )}

              {/* Badge icon */}
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center border',
                  isEarned
                    ? badge.colorEarned
                    : 'text-slate-300 dark:text-slate-700 bg-slate-100/50 dark:bg-slate-800/50 border-slate-100 dark:border-white/5'
                )}
              >
                <Icon className="w-6 h-6" />
              </div>

              {/* Earned green dot */}
              {isEarned && (
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-sm" />
              )}

              {/* Title */}
              <div className={cn('text-[11px] font-black uppercase tracking-wide leading-tight', isEarned ? 'text-primary dark:text-white' : 'text-slate-400 dark:text-slate-600')}>
                {isAr ? badge.titleAr : badge.titleEn}
              </div>

              {/* Unlock condition */}
              <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 leading-snug">
                {isEarned
                  ? <span className="text-emerald-500">✓ {isAr ? 'مكتسب' : 'Earned'}</span>
                  : (isAr ? badge.unlockAr : badge.unlockEn)
                }
              </div>

              {/* XP reward */}
              <div className={cn('text-[9px] font-black px-2 py-0.5 rounded-lg', isEarned ? 'bg-accent/10 text-accent' : 'bg-slate-100 dark:bg-slate-800 text-slate-400')}>
                +{badge.xp} XP
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Points → Level formula */}
      <div className="mt-4 p-4 rounded-2xl bg-primary/5 dark:bg-white/5 border border-primary/10 dark:border-white/10 space-y-2">
        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          {isAr ? 'كيف يُحسب المستوى؟' : 'How is level calculated?'}
        </div>
        <div className="text-xs font-black text-primary dark:text-white font-mono">
          {isAr
            ? `المستوى = floor(النقاط ÷ 100) + 1`
            : `Level = floor(XP ÷ 100) + 1`}
        </div>
        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
          {isAr
            ? `نقاطك الحالية: ${user.points} XP → المستوى ${level}`
            : `Your XP: ${user.points} → Level ${level}`}
        </div>
      </div>
    </div>
  );
}
