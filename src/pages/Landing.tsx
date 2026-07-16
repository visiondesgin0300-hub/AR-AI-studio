import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Globe, HelpCircle, ArrowRight, ArrowLeft, X, Search, BookOpen, Map as MapIcon, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';

export function Landing() {
  const { dir, language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [showGuide, setShowGuide] = useState(false);

  const guideSteps = [
    { icon: Search, ar: 'ابحث عن كتابك في الفهرس الذكي', en: 'Search for your book in the smart index' },
    { icon: BookOpen, ar: 'افتح تفاصيل الكتاب واضغط "تحديد الموقع"', en: 'Open the book details and tap "Locate"' },
    { icon: MapIcon, ar: 'في خريطة المكتبة، اضغط "الدخول في وضع AR"', en: 'On the library map, tap "Enter AR Mode"' },
    { icon: Camera, ar: 'وجّه الكاميرا نحو ملصق الرف لرؤية المسار', en: 'Point the camera at the shelf marker to see the path' },
  ];

  return (
    <div className={cn(
      "relative min-h-screen bg-[#F5F7FA] dark:bg-slate-950 font-sans overflow-hidden",
      dir === 'rtl' ? 'text-right' : 'text-left'
    )}>
      {/* Faint blueprint grid, consistent with the rest of the app */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#004C6D 1px, transparent 1px), linear-gradient(90deg, #004C6D 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      </div>

      <header className="relative z-10 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className={cn("flex items-center gap-3", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
              <Brain className="text-accent w-5 h-5" />
            </div>
            <div className="font-display text-lg font-bold text-primary dark:text-white tracking-tight leading-tight">
              {language === 'ar' ? 'المكتبة المعززة' : 'ARLibrary'}
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-accent/15 text-accent text-[9px] font-black uppercase tracking-widest">
              {t('demoVersionBadge')}
            </span>
          </div>

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/10 rounded-2xl text-xs font-black text-slate-500 dark:text-slate-300 shadow-sm hover:border-accent/40 hover:text-accent transition-all"
          >
            <Globe className="w-3.5 h-3.5" />
            {language === 'ar' ? 'English' : 'عربي'}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-24 min-h-[calc(100vh-96px)]">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="font-display max-w-4xl text-4xl md:text-6xl font-bold text-primary dark:text-white tracking-tight leading-[1.15] mb-6"
        >
          {language === 'ar'
            ? 'تصفح المعرفة الأكاديمية مع المكتبة المعززة'
            : 'Navigate Academic Knowledge with ARLibrary'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-2xl text-base md:text-lg text-slate-500 dark:text-slate-400 font-bold leading-relaxed mb-12"
        >
          {language === 'ar' ? 'مرحباً بك في المكتبة المعززة' : 'Welcome to the AR Library'}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={cn("flex flex-wrap items-center justify-center gap-4", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}
        >
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2.5 bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            {language === 'ar' ? 'تسجيل الدخول' : 'Login'}
            {dir === 'rtl' ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          </button>

          <button
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-2.5 bg-accent text-primary px-8 py-4 rounded-2xl font-black text-sm shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all"
          >
            <HelpCircle className="w-5 h-5" />
            {language === 'ar' ? 'دليل الاستخدام' : 'User Guide'}
          </button>
        </motion.div>

        {/* Feature highlights: fills the otherwise empty space below the fold
            with the app's three core capabilities instead of blank grid
            background, and gives first-time visitors a preview of what's
            behind the login wall. */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-3 gap-4 md:gap-6 max-w-xl w-full mt-20"
        >
          {[
            { icon: Search, label: t('searchTitle'), desc: language === 'ar' ? 'فهرس ذكي لكل الكتب' : 'Smart catalog search' },
            { icon: MapIcon, label: t('mapTitle'), desc: language === 'ar' ? 'ملاحة دقيقة للأرفف' : 'Precise shelf wayfinding' },
            { icon: Camera, label: t('arHubFabLabel'), desc: language === 'ar' ? 'كاميرا تدلك على الطريق' : 'Camera-guided navigation' },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-150/60 dark:border-white/5 rounded-2xl p-4 md:p-5 flex flex-col items-center text-center gap-2 shadow-sm shadow-black/[0.03]"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/5 dark:bg-accent/10 text-primary dark:text-accent flex items-center justify-center">
                <feature.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-primary dark:text-white">{feature.label}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-relaxed hidden sm:block">{feature.desc}</span>
            </div>
          ))}
        </motion.div>
      </main>

      <footer className="relative z-10 px-8 pb-8">
        <p className={cn("text-[9px] text-slate-350 dark:text-slate-600 font-bold uppercase tracking-widest max-w-7xl mx-auto", dir === 'rtl' ? 'text-right' : 'text-left')}>
          {t('copyright')}
        </p>
      </footer>

      <AnimatePresence>
        {showGuide && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setShowGuide(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6"
            >
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl max-w-lg w-full p-10 relative">
                <button
                  onClick={() => setShowGuide(false)}
                  className="absolute top-6 end-6 w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <h3 className="text-2xl font-black text-primary dark:text-white mb-8 pe-12">
                  {language === 'ar' ? 'كيف تستخدم الملاحة بالواقع المعزز' : 'How to use AR navigation'}
                </h3>
                <ol className="space-y-6">
                  {guideSteps.map((step, i) => (
                    <li key={i} className={cn("flex items-start gap-4", dir === 'rtl' ? 'flex-row-reverse text-right' : 'flex-row text-left')}>
                      <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center font-black text-sm shrink-0">
                        {i + 1}
                      </div>
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed pt-2">
                        {language === 'ar' ? step.ar : step.en}
                      </p>
                    </li>
                  ))}
                </ol>
                <button
                  onClick={() => { setShowGuide(false); navigate('/login'); }}
                  className="w-full mt-10 bg-primary text-white py-4 rounded-2xl font-black text-sm hover:brightness-110 transition-all"
                >
                  {language === 'ar' ? 'ابدأ الآن' : 'Get Started'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
