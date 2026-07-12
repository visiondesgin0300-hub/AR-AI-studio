import React from 'react';
import { Search, Star, Zap, Trophy, Lightbulb, Compass } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';
import { cn } from '../lib/utils';
import { getEarnedBadges } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';

interface BadgesCabinetProps {
  user: User;
  variant?: 'default' | 'neu';
}

const badgeIcons = [
  { id: 'باحث', icon: Search, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  { id: 'متميز', icon: Star, color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' },
  { id: 'قارئ نشط', icon: Zap, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  { id: 'قارئ الشهر', icon: Trophy, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  { id: 'ملهم', icon: Lightbulb, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
  { id: 'مستكشف', icon: Compass, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' },
];

export function BadgesCabinet({ user, variant = 'default' }: BadgesCabinetProps) {
  const { t } = useLanguage();
  const earnedBadges = getEarnedBadges(user);
  const isNeu = variant === 'neu';

  const badgeTranslationMap: Record<string, { title: string; desc: string }> = {
    'باحث': { title: t('badgeResearcher'), desc: t('badgeResearcherDesc') },
    'متميز': { title: t('badgeDistinguished'), desc: t('badgeDistinguishedDesc') },
    'قارئ نشط': { title: t('badgeActiveReader'), desc: t('badgeActiveReaderDesc') },
    'قارئ الشهر': { title: t('badgeReaderOfMonth'), desc: t('badgeReaderOfMonthDesc') },
    'ملهم': { title: t('badgeInspirational'), desc: t('badgeInspirationalDesc') },
    'مستكشف': { title: t('badgeExplorer'), desc: t('badgeExplorerDesc') },
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 relative z-10">
      {badgeIcons.map((badge) => {
        const isEarned = earnedBadges.includes(badge.id);
        const translation = badgeTranslationMap[badge.id];
        const IconComponent = badge.icon;

        return (
          <motion.div
            key={badge.id}
            whileHover={isEarned ? { scale: 1.05, y: -4 } : {}}
            className={cn(
              'p-5 flex flex-col items-center text-center justify-center gap-4 transition-all relative overflow-hidden',
              isNeu
                ? cn('rounded-[1.75rem]', isEarned ? 'neu-raised' : 'neu-pressed opacity-50')
                : cn(
                    'rounded-2xl border',
                    isEarned
                      ? 'bg-white dark:bg-slate-900 border-accent/20 shadow-md shadow-accent/5'
                      : 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-100 dark:border-white/5 opacity-40 grayscale'
                  )
            )}
          >
            <div
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center transition-all',
                isNeu
                  ? cn(isEarned ? 'neu-raised text-slate-500' : 'neu-pressed text-slate-400')
                  : cn(
                      'border',
                      isEarned
                        ? 'text-accent bg-accent/10 border-accent/20 shadow-inner group-hover:scale-110'
                        : 'text-slate-300 dark:text-slate-700 bg-slate-100/50 dark:bg-slate-800/50 border-slate-100 dark:border-white/5'
                    )
              )}
            >
              <IconComponent className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div
                className={cn(
                  'text-xs font-black uppercase',
                  isNeu
                    ? isEarned ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'
                    : isEarned ? 'text-primary dark:text-white' : 'text-slate-400 dark:text-slate-600'
                )}
              >
                {translation?.title}
              </div>
              <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 leading-tight line-clamp-1 max-w-[120px]">
                {translation?.desc}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
