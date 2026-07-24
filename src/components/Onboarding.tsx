import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, QrCode, Map, ChevronRight, ChevronLeft, X, FlaskConical } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';

interface OnboardingProps {
  onDone: () => void;
}

const slides = [
  {
    icon: Search,
    color: 'bg-primary',
    titleAr: 'البحث الذكي',
    titleEn: 'Smart Search',
    descAr: 'ابحث عن أي كتاب بالعنوان أو المؤلف أو الرقم التصنيفي — وجد المكان الدقيق له على الفور.',
    descEn: 'Find any book by title, author, or call number — and locate it instantly on the shelf.',
  },
  {
    icon: QrCode,
    color: 'bg-accent',
    titleAr: 'مسح رمز QR',
    titleEn: 'Scan a Shelf QR',
    descAr: 'وجّه كاميرتك نحو رمز QR على أي رف أو مرفق لتحصل على معلومات AR فورية.',
    descEn: 'Point your camera at any shelf or facility QR code to get instant AR details.',
  },
  {
    icon: Map,
    color: 'bg-emerald-600',
    titleAr: 'خريطة المكتبة',
    titleEn: 'Library Map',
    descAr: 'تصفح الطابق التفاعلي وتتبع الكتب المستعارة وانتقل مباشرة إلى أي قسم.',
    descEn: 'Browse the interactive floor plan, track borrowed books, and navigate to any section.',
  },
  {
    icon: FlaskConical,
    color: 'bg-[#0d2b1e]',
    titleAr: 'ماسح الفجوات البحثية',
    titleEn: 'Research Gap Scanner',
    descAr: 'وجّه الكاميرا نحو رف المكتبة — يرصد الذكاء الاصطناعي الفجوات البحثية وتظهر فوق الأرفف الحقيقية بتقنية الواقع المعزز.',
    descEn: 'Point at a library shelf — AI reveals research gaps anchored directly onto the real physical shelf using augmented reality.',
    accent: true,
  },
];

export function Onboarding({ onDone }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const { language, dir } = useLanguage();
  const isAr = language === 'ar';
  const slide = slides[step];
  const Icon = slide.icon;
  const isLast = step === slides.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden relative"
        dir={dir}
      >
        {/* Skip */}
        <button
          onClick={onDone}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Slide illustration */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: isAr ? -30 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isAr ? 30 : -30 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="px-8 pt-12 pb-8 flex flex-col items-center gap-6 text-center"
          >
            <div className={cn('w-24 h-24 rounded-[2rem] flex items-center justify-center shadow-xl relative overflow-hidden', slide.color)}>
              {(slide as any).accent && <div className="absolute inset-0 bg-[#34D399]/10 animate-pulse" />}
              <Icon className={cn('w-12 h-12 relative z-10', slide.color === 'bg-accent' ? 'text-primary' : (slide as any).accent ? 'text-[#34D399]' : 'text-white')} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-primary dark:text-white tracking-tight">
                {isAr ? slide.titleAr : slide.titleEn}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[260px] mx-auto">
                {isAr ? slide.descAr : slide.descEn}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Step dots */}
        <div className="flex justify-center gap-2 pb-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={cn(
                'rounded-full transition-all duration-300',
                i === step
                  ? 'w-6 h-2 bg-primary dark:bg-accent'
                  : 'w-2 h-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
              )}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-black flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {isAr ? 'السابق' : 'Back'}
            </button>
          )}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => isLast ? onDone() : setStep(step + 1)}
            className="flex-1 py-3.5 rounded-2xl bg-primary dark:bg-accent text-white dark:text-primary text-sm font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
          >
            {isLast
              ? (isAr ? 'ابدأ الآن' : 'Get Started')
              : (isAr ? 'التالي' : 'Next')}
            {!isLast && (isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
