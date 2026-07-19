import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';

interface FeedbackWidgetProps {
  onClose: () => void;
}

const MOODS = [
  { emoji: '😍', labelAr: 'رائع',    labelEn: 'Amazing',   color: 'bg-rose-500',    ring: 'ring-rose-400' },
  { emoji: '🤩', labelAr: 'ممتاز',   labelEn: 'Excellent', color: 'bg-orange-500',  ring: 'ring-orange-400' },
  { emoji: '😊', labelAr: 'جيد',     labelEn: 'Good',      color: 'bg-emerald-500', ring: 'ring-emerald-400' },
  { emoji: '😐', labelAr: 'مقبول',   labelEn: 'Okay',      color: 'bg-slate-500',   ring: 'ring-slate-400' },
  { emoji: '😕', labelAr: 'يحتاج تحسين', labelEn: 'Needs work', color: 'bg-primary', ring: 'ring-primary/50' },
];

const CATEGORIES_AR = ['تجربة AR', 'البحث', 'الواجهة', 'الخريطة', 'اقتراح'];
const CATEGORIES_EN = ['AR Experience', 'Search', 'UI/Design', 'Map', 'Suggestion'];

const PARTICLES = ['⭐', '✨', '🎉', '💡', '📚', '🚀', '💫', '🌟'];

export function FeedbackWidget({ onClose }: FeedbackWidgetProps) {
  const { language, dir } = useLanguage();
  const isAr = language === 'ar';

  const [mood, setMood] = useState<number | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [particles, setParticles] = useState<{ id: number; emoji: string; x: number }[]>([]);

  const toggleCategory = (i: number) => {
    setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const handleSubmit = () => {
    if (mood === null) return;
    const burst = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      emoji: PARTICLES[Math.floor(Math.random() * PARTICLES.length)],
      x: (Math.random() - 0.5) * 220,
    }));
    setParticles(burst);
    setTimeout(() => {
      setSubmitted(true);
      setParticles([]);
    }, 900);
  };

  const canSubmit = mood !== null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 sm:p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden"
        dir={dir}
      >
        {/* Header gradient stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-emerald-400" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div key="form" exit={{ opacity: 0, y: -20 }} className="p-8 space-y-7">
              {/* Title */}
              <div className="space-y-1 pr-8">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-black text-primary dark:text-white tracking-tight">
                    {isAr ? 'شاركنا رأيك' : 'Share your feedback'}
                  </h2>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
                  {isAr
                    ? 'ملاحظتك تساعدنا على تحسين التجربة لك وللجميع.'
                    : 'Your input helps us make ARLibrary better for everyone.'}
                </p>
              </div>

              {/* Mood selector */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {isAr ? 'كيف تجد التجربة؟' : 'How do you feel about the experience?'}
                </p>
                <div className="flex justify-between gap-2">
                  {MOODS.map((m, i) => (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.85 }}
                      animate={mood === i ? { scale: [1, 1.3, 1.15] } : { scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      onClick={() => setMood(i)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 flex-1 py-3 rounded-2xl border-2 transition-all',
                        mood === i
                          ? `border-transparent ring-2 ${m.ring} ${m.color} shadow-lg`
                          : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                      )}
                    >
                      <span className="text-2xl leading-none">{m.emoji}</span>
                      <span className={cn(
                        'text-[8px] font-black uppercase tracking-wide leading-none',
                        mood === i ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                      )}>
                        {isAr ? m.labelAr : m.labelEn}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Category chips */}
              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {isAr ? 'ما الذي تتحدث عنه؟' : 'What is this about?'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(isAr ? CATEGORIES_AR : CATEGORIES_EN).map((cat, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.06, type: 'spring', stiffness: 400 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => toggleCategory(i)}
                      className={cn(
                        'px-4 py-2 rounded-full text-[11px] font-black tracking-wide transition-all border-2',
                        selected.includes(i)
                          ? 'bg-primary dark:bg-accent text-white dark:text-primary border-transparent shadow-md'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-primary/40 dark:hover:border-accent/40'
                      )}
                    >
                      {cat}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Text area */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {isAr ? 'أضف تفاصيل (اختياري)' : 'Add details (optional)'}
                </p>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value.slice(0, 280))}
                  rows={3}
                  placeholder={isAr ? 'اكتب ملاحظتك هنا…' : 'Write your thoughts here…'}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-sm text-primary dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 font-medium resize-none focus:outline-none focus:border-accent dark:focus:border-accent transition-colors"
                />
                <p className="text-[10px] text-slate-300 dark:text-slate-600 font-bold text-right">{text.length}/280</p>
              </div>

              {/* Submit */}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={cn(
                  'w-full py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2.5 transition-all shadow-lg',
                  canSubmit
                    ? 'bg-primary dark:bg-accent text-white dark:text-primary shadow-primary/20 dark:shadow-accent/20 hover:brightness-110'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed shadow-none'
                )}
              >
                <Send className="w-4 h-4" />
                {isAr ? 'أرسل ملاحظتك' : 'Send Feedback'}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 22 }}
              className="p-12 flex flex-col items-center gap-5 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                className="w-20 h-20 rounded-[2rem] bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/30"
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-primary dark:text-white">
                  {isAr ? 'شكراً جزيلاً! 🎉' : 'Thank you! 🎉'}
                </h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 font-medium leading-relaxed max-w-[240px]">
                  {isAr
                    ? 'ملاحظتك وصلت وستساهم في تطوير ARLibrary.'
                    : 'Your feedback has been received and will help shape ARLibrary.'}
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onClose}
                className="mt-2 px-8 py-3 rounded-2xl bg-primary dark:bg-accent text-white dark:text-primary text-sm font-black shadow-lg hover:brightness-110 transition-all"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Burst particles */}
        <AnimatePresence>
          {particles.map(p => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
              animate={{ opacity: 0, y: -140, x: p.x, scale: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
              className="absolute bottom-16 left-1/2 text-2xl pointer-events-none select-none"
              style={{ marginLeft: '-12px' }}
            >
              {p.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
