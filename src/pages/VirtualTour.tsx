import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, ArrowRight, ArrowLeft, Search, Map as MapIcon, Camera,
  Sparkles, Award, BookOpen, Crown, Zap, CheckCircle2,
  MessageCircle, Brain, MapPin, Navigation,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';

// ── Visual Mockups ──────────────────────────────────────────────────────────

function SearchMockup({ isAr }: { isAr: boolean }) {
  const [typed, setTyped] = useState('');
  const query = isAr ? 'فيزياء كوانتية' : 'Quantum Physics';
  const books = isAr
    ? [
        { title: 'ميكانيكا الكم', author: 'د. علي حسين', shelf: 'B-2' },
        { title: 'الفيزياء الحديثة', author: 'د. نورة السيد', shelf: 'A-1' },
        { title: 'نظرية النسبية', author: 'أينشتاين', shelf: 'C-3' },
      ]
    : [
        { title: 'Quantum Mechanics', author: 'Dr. Ali Hussein', shelf: 'B-2' },
        { title: 'Modern Physics', author: 'Dr. Nora Al-Sayed', shelf: 'A-1' },
        { title: 'Theory of Relativity', author: 'Einstein', shelf: 'C-3' },
      ];

  useEffect(() => {
    setTyped('');
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setTyped(query.slice(0, i));
      if (i >= query.length) clearInterval(iv);
    }, 80);
    return () => clearInterval(iv);
  }, [isAr]);

  return (
    <div className="space-y-3 w-full">
      {/* Search bar */}
      <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/20">
        <Search className="w-4 h-4 text-accent shrink-0" />
        <span className="text-sm font-bold text-white flex-1 min-h-[20px]">
          {typed}<span className="animate-pulse">|</span>
        </span>
      </div>
      {/* Results */}
      <div className="space-y-2">
        {books.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 + i * 0.18, duration: 0.35 }}
            className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-xl px-3 py-2.5 border border-white/10"
          >
            <div className="w-9 h-9 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black text-white truncate">{b.title}</div>
              <div className="text-[10px] text-white/50 font-bold">{b.author}</div>
            </div>
            <span className="text-[9px] font-black text-accent bg-accent/15 px-2 py-1 rounded-lg border border-accent/25 shrink-0">{b.shelf}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MapMockup({ isAr }: { isAr: boolean }) {
  const [dotPos, setDotPos] = useState(0);
  const shelves = ['A-1', 'A-2', 'B-1', 'B-2', 'C-1', 'C-2', 'D-1', 'D-2'];
  const pathSteps = [0, 1, 3, 7]; // indices of shelves the path passes through

  useEffect(() => {
    setDotPos(0);
    let i = 0;
    const iv = setInterval(() => {
      i = (i + 1) % pathSteps.length;
      setDotPos(i);
    }, 900);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {shelves.map((shelf, i) => {
          const isOnPath = pathSteps.includes(i);
          const isActive = pathSteps[dotPos] === i;
          return (
            <motion.div
              key={shelf}
              animate={isActive ? { scale: [1, 1.12, 1], borderColor: ['rgba(215,200,38,0.3)', 'rgba(215,200,38,0.9)', 'rgba(215,200,38,0.3)'] } : {}}
              transition={{ duration: 0.6 }}
              className={cn(
                'rounded-xl p-2.5 flex flex-col items-center justify-center gap-1 border transition-all',
                isActive
                  ? 'bg-accent/25 border-accent shadow-lg shadow-accent/30'
                  : isOnPath
                  ? 'bg-white/15 border-white/30'
                  : 'bg-white/5 border-white/10'
              )}
            >
              {isActive && <Navigation className="w-3 h-3 text-accent animate-pulse" />}
              <span className={cn('text-[9px] font-black', isActive ? 'text-accent' : isOnPath ? 'text-white/80' : 'text-white/30')}>{shelf}</span>
            </motion.div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 bg-accent/15 border border-accent/30 rounded-xl px-3 py-2">
        <MapPin className="w-3.5 h-3.5 text-accent" />
        <span className="text-[10px] font-black text-white">
          {isAr ? `الوجهة: رف ${shelves[pathSteps[dotPos]]} — على بُعد ٢ متر` : `Destination: Shelf ${shelves[pathSteps[dotPos]]} — 2m away`}
        </span>
      </div>
    </div>
  );
}

function ARMockup({ isAr }: { isAr: boolean }) {
  const [scanPhase, setScanPhase] = useState<'scan' | 'found' | 'nav'>('scan');

  useEffect(() => {
    setScanPhase('scan');
    const t1 = setTimeout(() => setScanPhase('found'), 1600);
    const t2 = setTimeout(() => setScanPhase('nav'), 2800);
    const t3 = setTimeout(() => setScanPhase('scan'), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [isAr]);

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* Phone frame */}
      <div className="relative w-36 h-52 bg-slate-900 rounded-[2rem] border-4 border-white/20 overflow-hidden shadow-2xl shadow-black/50 mx-auto">
        {/* Camera viewfinder */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900 flex items-center justify-center">
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

          {scanPhase === 'scan' && (
            <motion.div
              animate={{ y: [-40, 40, -40] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-3 right-3 h-0.5 bg-accent shadow-lg shadow-accent/60"
            />
          )}

          {scanPhase === 'found' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-14 h-14 rounded-xl bg-accent/20 border-2 border-accent flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-accent" />
              </div>
              <div className="bg-accent/90 rounded-lg px-2 py-1">
                <span className="text-[8px] font-black text-primary">{isAr ? 'تم التعرف!' : 'Recognized!'}</span>
              </div>
            </motion.div>
          )}

          {scanPhase === 'nav' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-end justify-center pb-4"
            >
              {/* Glowing path */}
              <motion.div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 bg-gradient-to-t from-accent to-transparent"
                initial={{ height: 0 }}
                animate={{ height: 120 }}
                transition={{ duration: 0.7 }}
              />
              <div className="bg-primary/80 rounded-xl px-2 py-1.5 z-10">
                <span className="text-[8px] font-black text-accent">{isAr ? 'رف B-2 ← ٣م' : 'Shelf B-2 ← 3m'}</span>
              </div>
            </motion.div>
          )}

          {/* Corner markers */}
          {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos, i) => (
            <div key={i} className={cn('absolute w-3 h-3 border-white/40', pos,
              i < 2 ? 'border-t-2' : 'border-b-2',
              i % 2 === 0 ? 'border-l-2' : 'border-r-2'
            )} />
          ))}
        </div>
        {/* Notch */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-black rounded-full" />
      </div>

      <div className="text-[10px] font-black text-white/60 uppercase tracking-widest text-center">
        {scanPhase === 'scan' ? (isAr ? 'امسح الغلاف...' : 'Scanning cover...')
         : scanPhase === 'found' ? (isAr ? 'تم التعرف على الكتاب' : 'Book identified')
         : (isAr ? 'الملاحة الحية نشطة' : 'Live navigation active')}
      </div>
    </div>
  );
}

function BadgesMockup({ isAr }: { isAr: boolean }) {
  const [xp, setXp] = useState(0);

  useEffect(() => {
    setXp(0);
    let v = 0;
    const iv = setInterval(() => {
      v = Math.min(v + 4, 87);
      setXp(v);
      if (v >= 87) clearInterval(iv);
    }, 25);
    return () => clearInterval(iv);
  }, [isAr]);

  const badges = isAr
    ? [{ icon: MapPin, label: 'مستكشف', earned: true, color: 'text-blue-400' },
       { icon: Search, label: 'باحث', earned: xp >= 45, color: 'text-emerald-400' },
       { icon: Crown, label: 'متميز', earned: xp >= 80, color: 'text-amber-400' }]
    : [{ icon: MapPin, label: 'Explorer', earned: true, color: 'text-blue-400' },
       { icon: Search, label: 'Researcher', earned: xp >= 45, color: 'text-emerald-400' },
       { icon: Crown, label: 'Distinguished', earned: xp >= 80, color: 'text-amber-400' }];

  return (
    <div className="w-full space-y-4">
      {/* XP bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-black text-white/60 uppercase tracking-widest">
            <Zap className="w-2.5 h-2.5 inline mr-1 text-accent" />{isAr ? 'نقاط الخبرة' : 'Experience Points'}
          </span>
          <span className="text-sm font-black text-accent">{xp} XP</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-accent/70 to-accent"
            style={{ width: `${xp}%` }}
          />
        </div>
      </div>
      {/* Badge cards */}
      <div className="grid grid-cols-3 gap-2">
        {badges.map((badge, i) => (
          <motion.div
            key={badge.label}
            animate={badge.earned ? { scale: [1, 1.08, 1] } : {}}
            transition={{ delay: i * 0.3, duration: 0.5 }}
            className={cn(
              'rounded-2xl border p-3 flex flex-col items-center gap-2 transition-all',
              badge.earned
                ? 'bg-white/15 border-white/30 shadow-lg'
                : 'bg-white/5 border-white/10 opacity-40'
            )}
          >
            <badge.icon className={cn('w-5 h-5', badge.earned ? badge.color : 'text-white/20')} />
            <span className={cn('text-[8px] font-black text-center leading-tight', badge.earned ? 'text-white' : 'text-white/30')}>
              {badge.label}
            </span>
            {badge.earned && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ChatMockup({ isAr }: { isAr: boolean }) {
  const [visibleMessages, setVisibleMessages] = useState(0);
  const messages = isAr ? [
    { role: 'user', text: 'أبحث عن كتب في موضوع الذكاء الاصطناعي' },
    { role: 'ai', text: 'وجدت ٥ كتب تناسبك في رف A-2. أبرزها: "تعلم الآلة للمبتدئين" — متوفر الآن ✓' },
    { role: 'user', text: 'كيف أصل إلى رف A-2؟' },
    { role: 'ai', text: 'ادخل من الباب الرئيسي، اتجه يساراً مباشرة. الرف بجانب النافذة الكبيرة 📍' },
  ] : [
    { role: 'user', text: 'Looking for books on Artificial Intelligence' },
    { role: 'ai', text: 'Found 5 books for you in shelf A-2. Top pick: "Machine Learning for Beginners" — available now ✓' },
    { role: 'user', text: 'How do I get to shelf A-2?' },
    { role: 'ai', text: 'Enter through the main door, turn left immediately. Shelf is by the large window 📍' },
  ];

  useEffect(() => {
    setVisibleMessages(0);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setVisibleMessages(i);
      if (i >= messages.length) clearInterval(iv);
    }, 900);
    return () => clearInterval(iv);
  }, [isAr]);

  return (
    <div className="w-full space-y-2">
      {/* Chat header */}
      <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-2xl px-3 py-2">
        <div className="w-7 h-7 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
          <Brain className="w-3.5 h-3.5 text-accent" />
        </div>
        <div>
          <div className="text-[9px] font-black text-white">{isAr ? 'رفيق — مساعد المكتبة' : 'Rafeeq — Library AI'}</div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[8px] text-emerald-400 font-bold">{isAr ? 'متصل' : 'online'}</span>
          </div>
        </div>
      </div>
      {/* Messages */}
      <div className="space-y-2 max-h-48 overflow-hidden">
        {messages.slice(0, visibleMessages).map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn('flex', msg.role === 'user' ? (isAr ? 'justify-start' : 'justify-end') : (isAr ? 'justify-end' : 'justify-start'))}
          >
            <div className={cn(
              'max-w-[80%] rounded-2xl px-3 py-2 text-[10px] font-semibold leading-relaxed',
              msg.role === 'user'
                ? 'bg-white/15 text-white border border-white/15'
                : 'bg-accent/20 text-white border border-accent/30'
            )}>
              {msg.text}
            </div>
          </motion.div>
        ))}
        {visibleMessages < messages.length && (
          <div className={cn('flex', isAr ? 'justify-end' : 'justify-start')}>
            <div className="flex items-center gap-1 bg-accent/10 border border-accent/20 rounded-2xl px-3 py-2">
              {[0, 1, 2].map(i => (
                <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ delay: i * 0.15, repeat: Infinity, duration: 0.8 }}
                  className="w-1.5 h-1.5 rounded-full bg-accent/60" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Step definitions ────────────────────────────────────────────────────────

type StepId = 'search' | 'map' | 'ar' | 'badges' | 'chat';

interface Step {
  id: StepId;
  icon: React.ComponentType<{ className?: string }>;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  path: string;
  accentClass: string;
  Mockup: React.ComponentType<{ isAr: boolean }>;
}

const STEPS: Step[] = [
  {
    id: 'search',
    icon: Search,
    titleAr: 'البحث في المصادر',
    titleEn: 'Smart Resource Search',
    descAr: 'ابحث عن أي كتاب بالاسم أو المؤلف أو التصنيف. النتائج فورية مع اقتراحات ذكية وتحديد الرف مباشرة.',
    descEn: 'Search any book by title, author, or category. Instant results with smart suggestions and direct shelf location.',
    path: '/search',
    accentClass: 'from-blue-600 to-blue-800',
    Mockup: SearchMockup,
  },
  {
    id: 'map',
    icon: MapIcon,
    titleAr: 'خريطة المكتبة والملاحة',
    titleEn: 'Library Map & Wayfinding',
    descAr: 'استعرض أرفف المكتبة بالخريطة التفاعلية، وشاهد مسارك خطوة بخطوة مع المسافة الدقيقة لأي رف.',
    descEn: 'Browse library shelves on the interactive map with a real-time step-by-step path and exact distance to any shelf.',
    path: '/map',
    accentClass: 'from-emerald-600 to-emerald-800',
    Mockup: MapMockup,
  },
  {
    id: 'ar',
    icon: Camera,
    titleAr: 'الواقع المعزز بالكاميرا',
    titleEn: 'Augmented Reality Camera',
    descAr: 'امسح غلاف أي كتاب لتعرّف عليه فوراً، ثم تابع الكاميرا نحو علامة الرف لملاحة حية بالمسافة الحقيقية.',
    descEn: 'Scan any book cover to identify it instantly, then follow the camera toward the shelf AR marker for live navigation with real distance.',
    path: '/smart-lens',
    accentClass: 'from-violet-600 to-violet-800',
    Mockup: ARMockup,
  },
  {
    id: 'badges',
    icon: Award,
    titleAr: 'نقاط الخبرة والأوسمة',
    titleEn: 'XP Points & Badges',
    descAr: 'كل بحث وزيارة رف تمنحك XP يفتح أوسمة تحفيزية. تابع تقدمك في صفحة ملفك الشخصي.',
    descEn: 'Every search and shelf visit earns XP that unlocks achievement badges. Track progress in your personal profile.',
    path: '/profile',
    accentClass: 'from-amber-500 to-amber-700',
    Mockup: BadgesMockup,
  },
  {
    id: 'chat',
    icon: MessageCircle,
    titleAr: 'رفيق — مساعد المكتبة الذكي',
    titleEn: 'Rafeeq — AI Library Assistant',
    descAr: 'اسأل رفيق عن أي كتاب أو موضوع في أي وقت. يجيبك بدقة ويرشدك مباشرة للرف المناسب.',
    descEn: 'Ask Rafeeq about any book or topic anytime. Precise answers with direct shelf guidance.',
    path: '/',
    accentClass: 'from-rose-500 to-rose-700',
    Mockup: ChatMockup,
  },
];

// ── Main Page ───────────────────────────────────────────────────────────────

export function VirtualTour() {
  const { language, dir } = useLanguage();
  const isAr = language === 'ar';
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  const go = useCallback((next: number) => {
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  }, [index]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(Math.min(index + 1, STEPS.length - 1));
    if (e.key === 'ArrowLeft') go(Math.max(index - 1, 0));
    if (e.key === 'Escape') navigate(-1);
  }, [go, index, navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const xVariants = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? (isAr ? -60 : 60) : (isAr ? 60 : -60) }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? (isAr ? 60 : -60) : (isAr ? -60 : 60) }),
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#020e1a] overflow-hidden" dir={dir}>

      {/* Background gradient (changes per step) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className={cn('absolute inset-0 bg-gradient-to-br opacity-30', step.accentClass)}
        />
      </AnimatePresence>

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6 pb-2">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-accent" />
          </div>
          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest hidden sm:block">
            {isAr ? 'المكتبة المعززة' : 'AR Library'}
          </span>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => go(i)}
              className={cn(
                'rounded-full transition-all duration-300',
                i === index ? 'w-7 h-2 bg-accent' : 'w-2 h-2 bg-white/25 hover:bg-white/50'
              )}
            />
          ))}
        </div>

        {/* Close */}
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step counter */}
      <div className="relative z-10 flex justify-center">
        <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">
          {isAr ? `${index + 1} / ${STEPS.length}` : `${index + 1} / ${STEPS.length}`}
        </span>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 px-6 lg:px-16 py-6 h-[calc(100%-130px)]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step.id}
            custom={direction}
            variants={xVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 w-full max-w-5xl"
          >
            {/* Description side */}
            <div className={cn('flex-1 space-y-6 text-center lg:text-start', isAr ? 'lg:text-right' : 'lg:text-left')}>
              {/* Step icon */}
              <div className={cn('inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br border border-white/20 shadow-2xl', step.accentClass)}>
                <step.icon className="w-8 h-8 text-white" />
              </div>

              {/* Title & description */}
              <div className="space-y-3">
                <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
                  {isAr ? `الخطوة ${index + 1} من ${STEPS.length}` : `Step ${index + 1} of ${STEPS.length}`}
                </div>
                <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
                  {isAr ? step.titleAr : step.titleEn}
                </h2>
                <p className="text-base text-white/60 font-semibold leading-relaxed max-w-sm">
                  {isAr ? step.descAr : step.descEn}
                </p>
              </div>

              {/* Try now */}
              <button
                onClick={() => navigate(step.path)}
                className={cn(
                  'inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm text-primary bg-accent hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-accent/30',
                )}
              >
                <Sparkles className="w-4 h-4" />
                {isAr ? 'جرّب الآن' : 'Try It Now'}
                {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>

            {/* Visual mockup side */}
            <div className="w-full lg:w-[340px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl shadow-black/40 shrink-0">
              <step.Mockup key={step.id} isAr={isAr} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom navigation */}
      <div className="relative z-10 flex items-center justify-between px-6 pb-6 pt-2">
        <button
          onClick={() => navigate(-1)}
          className="text-[10px] font-black text-white/30 hover:text-white/60 uppercase tracking-widest transition-colors"
        >
          {isAr ? 'تخطي الجولة' : 'Skip Tour'}
        </button>

        <div className="flex items-center gap-3">
          {index > 0 && (
            <button
              onClick={() => go(index - 1)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-white/15 text-white/60 hover:text-white hover:border-white/30 font-black text-xs uppercase tracking-widest transition-all"
            >
              {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              {isAr ? 'السابق' : 'Previous'}
            </button>
          )}
          <button
            onClick={() => isLast ? navigate(-1) : go(index + 1)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 border border-white/20 text-white hover:bg-white/20 font-black text-xs uppercase tracking-widest transition-all"
          >
            {isLast
              ? (isAr ? 'إنهاء الجولة ✓' : 'Finish Tour ✓')
              : (isAr ? 'التالي' : 'Next')}
            {!isLast && (isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />)}
          </button>
        </div>
      </div>
    </div>
  );
}
