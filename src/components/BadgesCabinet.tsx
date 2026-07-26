import React from 'react';
import { Search, Star, Compass, Lock, Zap } from 'lucide-react';
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
    unlockAr: 'استعر أول كتاب من المكتبة',
    unlockEn: 'Borrow your first book',
    xp: 50,
  },
  {
    id: 'باحث',
    icon: Search,
    colorEarned: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
    titleAr: 'باحث',
    titleEn: 'Researcher',
    unlockAr: 'اجمع 100 نقطة من استخدام النظام',
    unlockEn: 'Earn 100 XP using the system',
    xp: 75,
  },
  {
    id: 'متميز',
    icon: Star,
    colorEarned: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20',
    titleAr: 'متميز',
    titleEn: 'Distinguished',
    unlockAr: 'اجمع 250 نقطة — مستخدم متميز',
    unlockEn: 'Earn 250 XP — dedicated user',
    xp: 100,
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

    </div>
  );
}
