import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, ArrowLeft, Search, Map as MapIcon, Camera, Sparkles, Award, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';
import { User } from '../types';

interface TourStep {
  icon: React.ComponentType<{ className?: string }>;
  titleKey: string;
  descKey: string;
  path: string;
  navState?: unknown;
  adminOnly?: boolean;
  studentOnly?: boolean;
}

const TOUR_STEPS: TourStep[] = [
  { icon: Search, titleKey: 'tourStepSearchTitle', descKey: 'tourStepSearchDesc', path: '/search' },
  { icon: MapIcon, titleKey: 'tourStepMapTitle', descKey: 'tourStepMapDesc', path: '/map' },
  { icon: Camera, titleKey: 'tourStepArTitle', descKey: 'tourStepArDesc', path: '/ar' },
  { icon: Sparkles, titleKey: 'tourStepSimulationTitle', descKey: 'tourStepSimulationDesc', path: '/ar' },
  // Gamification is a student surface (hidden from admins in the nav/header),
  // so the tour only advertises it to students.
  { icon: Award, titleKey: 'tourStepGamificationTitle', descKey: 'tourStepGamificationDesc', path: '/my-books', navState: { tab: 'badges' }, studentOnly: true },
  { icon: ShieldCheck, titleKey: 'tourStepAdminTitle', descKey: 'tourStepAdminDesc', path: '/admin', adminOnly: true },
];

interface GuidedTourProps {
  user: User;
  onClose: () => void;
}

export function GuidedTour({ user, onClose }: GuidedTourProps) {
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const steps = TOUR_STEPS.filter((s) =>
    (!s.adminOnly || user.role === 'admin') && (!s.studentOnly || user.role !== 'admin')
  );
  const [index, setIndex] = useState(0);

  const step = steps[index];
  const isLast = index === steps.length - 1;

  const handleTryNow = () => {
    navigate(step.path, step.navState ? { state: step.navState } : undefined);
    onClose();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-6"
      >
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-lg w-full p-8 md:p-10 relative" dir={dir}>
          <button
            onClick={onClose}
            className={cn('absolute top-6 w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors', dir === 'rtl' ? 'left-6' : 'right-6')}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-8 bg-accent' : 'w-1.5 bg-slate-150 dark:bg-slate-700')}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, x: dir === 'rtl' ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir === 'rtl' ? 12 : -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 dark:bg-accent/10 flex items-center justify-center text-primary dark:text-accent">
                <step.icon className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {t('guidedTourStepOf', { current: index + 1, total: steps.length })}
                </span>
                <h3 className="text-2xl font-black text-primary dark:text-white tracking-tight leading-tight">{t(step.titleKey)}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">{t(step.descKey)}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center gap-3 mt-10">
            {index > 0 && (
              <button
                onClick={() => setIndex((i) => i - 1)}
                className="px-5 py-4 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300 font-black text-xs uppercase tracking-widest hover:border-accent hover:text-accent transition-all flex items-center gap-2"
              >
                {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                {t('guidedTourPrevious')}
              </button>
            )}
            <button
              onClick={handleTryNow}
              className="flex-1 py-4 bg-primary/5 dark:bg-white/5 text-primary dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary/10 dark:hover:bg-white/10 transition-all"
            >
              {t('guidedTourTryNow')}
            </button>
            <button
              onClick={() => (isLast ? onClose() : setIndex((i) => i + 1))}
              className="flex-1 py-4 bg-accent text-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2"
            >
              {isLast ? t('guidedTourFinish') : t('guidedTourNext')}
              {!isLast && (dir === 'rtl' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />)}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
