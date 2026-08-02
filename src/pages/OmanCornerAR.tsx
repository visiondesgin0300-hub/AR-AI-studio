import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Landmark, Scroll, Mountain, Music2,
  ChevronRight, Star, BookOpen, X, Sparkles, Trophy, Shield,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';

interface Station {
  id: string;
  emoji: string;
  Icon: React.ElementType;
  titleAr: string;
  titleEn: string;
  tagAr: string;
  tagEn: string;
  color: string;
  border: string;
  bg: string;
  ring: string;
  items: string[];
  bookHintAr: string;
  bookHintEn: string;
  factsAr: string[];
  factsEn: string[];
  xp: number;
}

const STATIONS: Station[] = [
  {
    id: 'architecture',
    emoji: '🏰',
    Icon: Shield,
    titleAr: 'العمارة العُمانية',
    titleEn: 'Omani Architecture',
    tagAr: 'قلاع · أفلاج · أبراج',
    tagEn: 'Forts · Aflaj · Towers',
    color: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-300/70 dark:border-amber-500/30',
    bg: 'bg-amber-50 dark:bg-amber-950/25',
    ring: 'ring-amber-400/40',
    items: ['قلعة نزوى', 'حصن بهلاء (يونسكو)', 'أفلاج الري', 'الأبراج الطينية', 'مدينة بهلاء المسوّرة'],
    bookHintAr: 'محاضرات فاينمان تُذكّرنا: المبادئ الفيزيائية البسيطة تحل أصعب المشاكل الهندسية.',
    bookHintEn: 'Feynman Lectures remind us: simple physics principles solve the hardest engineering problems.',
    factsAr: [
      'برج قلعة نزوى قطره 44 متراً — أُنجز عام 1650 م',
      'أفلاج الري نظام ري عمره 3000 عام مدرج في قائمة يونسكو',
      'الأبراج الطينية مصمّمة لتبريد الداخل طبيعياً بلا كهرباء',
      'بهلاء: المدينة الإسلامية المسوّرة الوحيدة المدرجة في يونسكو',
    ],
    factsEn: [
      "Nizwa Fort's main tower is 44m in diameter — completed in 1650 AD",
      'Aflaj irrigation is a 3,000-year-old system on UNESCO World Heritage list',
      'Mud towers were engineered to cool interiors naturally without electricity',
      'Bahla: the only Islamic walled city fully on the UNESCO Heritage list',
    ],
    xp: 50,
  },
  {
    id: 'literature',
    emoji: '📜',
    Icon: Scroll,
    titleAr: 'الأدب العُماني',
    titleEn: 'Omani Literature',
    tagAr: 'شعر · مخطوطات · حكايات',
    tagEn: 'Poetry · Manuscripts · Tales',
    color: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-300/70 dark:border-emerald-500/30',
    bg: 'bg-emerald-50 dark:bg-emerald-950/25',
    ring: 'ring-emerald-400/40',
    items: ['مخطوطات الجامع الكبير', 'الشعر النبطي', 'ابن النضر الأزدي', 'الحكايات البحرية', 'ديوان الشعر العُماني'],
    bookHintAr: 'الإنسان يبحث عن معنى (فرانكل): الحكاية الشعبية أداة البشر الأولى لفهم الوجود.',
    bookHintEn: "Man's Search for Meaning (Frankl): storytelling is humanity's oldest tool for understanding existence.",
    factsAr: [
      'تمتلك عُمان أكثر من 50,000 مخطوطة نادرة في مكتبات ومجموعات خاصة',
      'الشعر النبطي الشفهي ما زال حياً — مهرجاناته تجذب عشرات الآلاف',
      'ابن النضر الأزدي العُماني كتب في الجغرافيا العاشر الميلادي',
      'الحكايات البحرية العُمانية أثّرت في روايات السندباد التاريخية',
    ],
    factsEn: [
      'Oman holds over 50,000 rare manuscripts in libraries and private collections',
      'Nabati oral poetry is still alive — festivals draw tens of thousands',
      'Ibn al-Nadhr al-Azdi from Oman wrote on geography in the 10th century',
      'Omani maritime tales influenced the historical Sinbad narratives',
    ],
    xp: 50,
  },
  {
    id: 'geography',
    emoji: '🗺️',
    Icon: Mountain,
    titleAr: 'جغرافية عُمان',
    titleEn: 'Geography of Oman',
    tagAr: 'صحراء · جبال · خريف',
    tagEn: 'Desert · Mountains · Khareef',
    color: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-300/70 dark:border-cyan-500/30',
    bg: 'bg-cyan-50 dark:bg-cyan-950/25',
    ring: 'ring-cyan-400/40',
    items: ['رمال وهيبة', 'جبال الحجر', 'شبه جزيرة مسندم', 'خريف صلالة', 'وادي شاب'],
    bookHintAr: 'موجز تاريخ الزمن (هوكينج): الجغرافيا العُمانية جزء من نفس القصة الجيولوجية الكونية.',
    bookHintEn: "A Brief History of Time (Hawking): Oman's geology is part of the same cosmic story.",
    factsAr: [
      'رمال وهيبة: 12,500 كيلومتر مربع تأوي ربع مليون نوع من الكائنات',
      'خريف صلالة: المطر الموسمي الوحيد في شبه الجزيرة العربية',
      'مسندم تُسمى "نرويج عُمان" لفيوردات تشبه الاسكندنافية',
      'يمكنك السباحة في البحر والتجوّل في ثلوج الجبال في عُمان في يوم واحد',
    ],
    factsEn: [
      'Wahiba Sands: 12,500 km² home to a quarter million species',
      'Salalah Khareef: the only monsoon rain in the Arabian Peninsula',
      "Musandam is called 'Norway of Oman' for its Scandinavia-like fjords",
      'In Oman you can swim in the sea and walk in mountain snow on the same day',
    ],
    xp: 50,
  },
  {
    id: 'arts',
    emoji: '🎭',
    Icon: Music2,
    titleAr: 'الفنون التقليدية',
    titleEn: 'Traditional Arts',
    tagAr: 'رزحة · خنجر · حِرف',
    tagEn: 'Razha · Khanjar · Crafts',
    color: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-300/70 dark:border-violet-500/30',
    bg: 'bg-violet-50 dark:bg-violet-950/25',
    ring: 'ring-violet-400/40',
    items: ['رقصة الرزحة (يونسكو)', 'الخنجر الرمز الوطني', 'فخار ظفار', 'اللواء (السفن الخشبية)', 'النسيج التقليدي'],
    bookHintAr: 'التأثير (سيالديني): يشرح لماذا تبقى بعض الرموز الثقافية — كالخنجر — حيّة لآلاف السنين.',
    bookHintEn: 'Influence (Cialdini): explains why cultural symbols like the khanjar survive for thousands of years.',
    factsAr: [
      'الرزحة مدرجة في قائمة يونسكو للتراث غير المادي منذ 2010',
      'الخنجر العُماني رمز وطني يظهر على الوثائق الرسمية والعملة',
      'فخار ظفار عمره 4000 عام — وُجدت نظائره في بلاد ما بين النهرين',
      'صناعة اللواء (الداو) تمثّل ذاكرة بحرية عُمان الخمسة آلاف سنة',
    ],
    factsEn: [
      'Razha dance has been on UNESCO Intangible Heritage list since 2010',
      'The Omani khanjar appears on official documents and national currency',
      'Dhofari pottery is 4,000 years old — similar pieces found in Mesopotamia',
      'Dhow-building represents 5,000 years of Omani maritime memory',
    ],
    xp: 50,
  },
];

const GUIDE_LINES: Record<string, { ar: string; en: string }> = {
  architecture: {
    ar: 'العمارة العُمانية لم تكن مجرد بناء — كانت علماً في خدمة الحياة. أفلاج الري وحدها أروت آلاف القرى لثلاثة آلاف عام بدون مضخة واحدة!',
    en: "Omani architecture wasn't just construction — it was science in service of life. The aflaj alone irrigated thousands of villages for 3,000 years without a single pump!",
  },
  literature: {
    ar: 'الأدب العُماني بحر لا قاع له. الشعر النبطي هو ذكاء اصطناعي قديم: شفرة حفظت ثقافة كاملة في صدور البشر قبل أي خوارزمية بألفي سنة.',
    en: 'Omani literature is a bottomless sea. Nabati poetry is ancient AI: a code that preserved an entire culture in human memory 2,000 years before any algorithm.',
  },
  geography: {
    ar: 'في بقعة واحدة: صحراء تحير الخيال، جبال تخبئ الثلج، بحر نقل حضارات، وخريف يجعل الصحراء تبكي بالمطر. هذا التنوع سر تكيف العُمانيين الفريد.',
    en: 'In one place: a desert that defies imagination, mountains hiding snow, a sea that carried civilizations, and a monsoon that makes the desert weep. This diversity is the Omani secret.',
  },
  arts: {
    ar: 'الرزحة ليست رقصة للمتفرجين — هي ذاكرة المجتمع تُعاد كتابتها جسداً بجسد عبر الأجيال. والخنجر؟ ليس سلاحاً بل لغة يقرأها كل عُماني في لحظة واحدة.',
    en: "Razha isn't danced for spectators — it's the community's memory rewritten body by body across generations. The khanjar? Not a weapon, but a language every Omani reads instantly.",
  },
};

const COMPLETED_KEY = 'oman_corner_completed';

function loadCompleted(): Set<string> {
  try {
    const raw = localStorage.getItem(COMPLETED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveCompleted(set: Set<string>) {
  localStorage.setItem(COMPLETED_KEY, JSON.stringify([...set]));
}

export function OmanCornerAR() {
  const navigate = useNavigate();
  const { language, dir } = useLanguage();
  const ar = language === 'ar';

  const [active, setActive] = useState<Station | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(loadCompleted);
  const [guideText, setGuideText] = useState('');
  const [guideLoading, setGuideLoading] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [scanAnim, setScanAnim] = useState(false);

  const totalXP = completed.size * 50;
  const allDone = completed.size === STATIONS.length;

  useEffect(() => {
    if (allDone && completed.size > 0) {
      setTimeout(() => setShowComplete(true), 400);
    }
  }, [allDone, completed.size]);

  const openStation = async (station: Station) => {
    setActive(station);
    setScanAnim(true);
    setTimeout(() => setScanAnim(false), 1200);

    if (completed.has(station.id)) {
      setGuideText(ar ? GUIDE_LINES[station.id].ar : GUIDE_LINES[station.id].en);
      return;
    }

    setGuideText('');
    setGuideLoading(true);
    try {
      const res = await fetch('/api/oman-corner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId: station.id, contextAr: station.tagAr }),
      });
      const data = await res.json();
      setGuideText(data.guideNarrative || (ar ? GUIDE_LINES[station.id].ar : GUIDE_LINES[station.id].en));
    } catch {
      setGuideText(ar ? GUIDE_LINES[station.id].ar : GUIDE_LINES[station.id].en);
    } finally {
      setGuideLoading(false);
    }
  };

  const markComplete = (station: Station) => {
    if (completed.has(station.id)) return;
    const next = new Set(completed);
    next.add(station.id);
    setCompleted(next);
    saveCompleted(next);
  };

  const resetProgress = () => {
    const empty = new Set<string>();
    setCompleted(empty);
    saveCompleted(empty);
    setShowComplete(false);
  };

  return (
    <div className={cn('flex flex-col gap-6', dir === 'rtl' ? 'text-right' : 'text-left')}>

      {/* Header */}
      <div className={cn('flex items-center gap-4', dir === 'rtl' ? 'flex-row-reverse' : '')}>
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-primary dark:hover:text-white hover:border-primary/30 transition-colors shrink-0"
        >
          <ArrowLeft className={cn('w-4 h-4', dir === 'rtl' ? 'rotate-180' : '')} />
        </button>
        <div className="flex-1">
          <div className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
            <h1 className="text-xl font-black text-primary dark:text-white tracking-tight">
              {ar ? 'ركن عُمان الحي' : 'Living Oman Corner'}
            </h1>
            <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[8px] font-black uppercase tracking-widest">AR</span>
          </div>
          <p className="text-[11px] text-slate-400 font-bold mt-0.5">
            {ar ? 'اكتشف التراث العُماني عبر 4 محطات تفاعلية' : 'Discover Omani heritage through 4 interactive stations'}
          </p>
        </div>
        <div className={cn('flex flex-col items-end gap-1 shrink-0', dir === 'rtl' ? 'items-start' : '')}>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            {ar ? 'محطات مكتملة' : 'Completed'}
          </span>
          <span className="text-lg font-black text-primary dark:text-accent">
            {completed.size}<span className="text-slate-300 dark:text-slate-600 font-bold text-sm">/{STATIONS.length}</span>
          </span>
        </div>
      </div>

      {/* XP Progress bar */}
      <div className="rounded-2xl border border-amber-200/60 dark:border-amber-500/20 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 px-5 py-4">
        <div className={cn('flex items-center justify-between mb-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
          <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest">
            {ar ? 'نقاط XP المكتسبة' : 'XP Earned'}
          </span>
          <span className="text-sm font-black text-amber-700 dark:text-amber-400" dir="ltr">
            {totalXP} / {STATIONS.length * 50} XP
          </span>
        </div>
        <div className="h-2 rounded-full bg-amber-200/60 dark:bg-amber-900/30 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
            initial={{ width: 0 }}
            animate={{ width: `${(completed.size / STATIONS.length) * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Station grid */}
      <div className="grid grid-cols-2 gap-4">
        {STATIONS.map((station, i) => {
          const done = completed.has(station.id);
          return (
            <motion.button
              key={station.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 24 }}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => openStation(station)}
              className={cn(
                'relative overflow-hidden rounded-2xl border p-5 flex flex-col gap-3 cursor-pointer transition-all shadow-sm hover:shadow-lg',
                station.bg, station.border,
                done ? 'ring-2 ' + station.ring : '',
                dir === 'rtl' ? 'items-end text-right' : 'items-start text-left'
              )}
            >
              {/* Decorative circle */}
              <div className="absolute top-0 end-0 w-20 h-20 rounded-full opacity-20" style={{ background: 'currentColor', transform: 'translate(30%, -30%)' }} />

              {/* Done badge */}
              {done && (
                <div className="absolute top-2.5 start-2.5 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border border-current flex items-center justify-center">
                  <span className="text-[8px]">✓</span>
                </div>
              )}

              <span className="text-3xl">{station.emoji}</span>
              <div>
                <p className={cn('text-xs font-black text-primary dark:text-white leading-tight', station.color.split(' ')[0])}>
                  {ar ? station.titleAr : station.titleEn}
                </p>
                <p className={cn('text-[9px] font-bold mt-0.5 opacity-70', station.color)}>
                  {ar ? station.tagAr : station.tagEn}
                </p>
              </div>
              <span className={cn('text-[8px] font-black uppercase tracking-widest flex items-center gap-1', station.color)}>
                {done ? (ar ? 'مكتملة ✓' : 'Done ✓') : (ar ? 'اكتشف' : 'Discover')}
                {!done && <ChevronRight className={cn('w-2.5 h-2.5', dir === 'rtl' ? 'rotate-180' : '')} />}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* All-done celebration */}
      <AnimatePresence>
        {showComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="rounded-2xl border border-amber-300 dark:border-amber-500/30 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 p-6 text-center space-y-3"
          >
            <div className="text-4xl">🏆</div>
            <p className="font-black text-base text-primary dark:text-white">
              {ar ? 'أتممت رحلة ركن عُمان!' : 'You completed the Oman Corner journey!'}
            </p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">
              {ar ? `جمعت ${totalXP} نقطة XP · شارة "سفير التراث" مكتسبة 🎖️` : `Earned ${totalXP} XP · "Heritage Ambassador" badge unlocked 🎖️`}
            </p>
            <button
              onClick={resetProgress}
              className="text-[9px] text-slate-400 underline underline-offset-2 hover:text-slate-600 transition-colors"
            >
              {ar ? 'إعادة البداية' : 'Reset progress'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Station detail modal */}
      <AnimatePresence>
        {active && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setActive(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              className={cn(
                'fixed inset-x-4 bottom-4 top-auto md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:max-w-lg md:w-full z-50 rounded-3xl overflow-hidden shadow-2xl',
                active.bg, 'border', active.border
              )}
            >
              {/* Scan animation overlay */}
              <AnimatePresence>
                {scanAnim && (
                  <motion.div
                    initial={{ top: '0%' }}
                    animate={{ top: '100%' }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, ease: 'linear' }}
                    className="absolute inset-x-0 h-0.5 z-10 pointer-events-none"
                    style={{ background: 'currentColor', boxShadow: '0 0 16px 4px currentColor' }}
                  />
                )}
              </AnimatePresence>

              <div className="max-h-[85vh] overflow-y-auto">
                {/* Header */}
                <div className={cn('flex items-start justify-between gap-3 p-5 pb-3', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                  <div className={cn('flex items-center gap-3', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                    <span className="text-3xl">{active.emoji}</span>
                    <div className={dir === 'rtl' ? 'text-right' : ''}>
                      <h2 className="font-black text-primary dark:text-white text-base">{ar ? active.titleAr : active.titleEn}</h2>
                      <p className={cn('text-[9px] font-bold mt-0.5', active.color)}>{ar ? active.tagAr : active.tagEn}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActive(null)}
                    className="w-8 h-8 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="px-5 pb-5 space-y-4">
                  {/* AR Guide "عارف" */}
                  <div className={cn('rounded-2xl bg-primary dark:bg-slate-800 p-4 space-y-2', dir === 'rtl' ? 'text-right' : '')}>
                    <div className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shrink-0">
                        <Sparkles className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">
                        {ar ? 'عارف — المرشد الذكي' : 'Arif — AI Guide'}
                      </span>
                    </div>
                    {guideLoading ? (
                      <div className="flex gap-1 pt-1">
                        {[0, 1, 2].map(j => (
                          <motion.div
                            key={j}
                            className="w-1.5 h-1.5 rounded-full bg-accent"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: j * 0.15 }}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-[12px] text-white/85 font-bold leading-relaxed">{guideText}</p>
                    )}
                  </div>

                  {/* Heritage items */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {ar ? 'المحتويات' : 'Contents'}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {active.items.map(item => (
                        <span key={item} className={cn('px-2.5 py-1 rounded-xl text-[9px] font-black border', active.bg, active.border, active.color)}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Facts */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {ar ? 'حقائق مدهشة' : 'Fascinating Facts'}
                    </span>
                    <ul className="space-y-2">
                      {(ar ? active.factsAr : active.factsEn).map((fact, j) => (
                        <li key={j} className={cn('flex gap-2 text-[11px] text-slate-600 dark:text-slate-300 font-bold leading-relaxed', dir === 'rtl' ? 'flex-row-reverse text-right' : '')}>
                          <Star className={cn('w-3 h-3 shrink-0 mt-0.5', active.color)} />
                          {fact}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Book connection */}
                  <div className={cn('rounded-xl border p-3 flex gap-3 bg-white/60 dark:bg-slate-800/60', active.border, dir === 'rtl' ? 'flex-row-reverse text-right' : '')}>
                    <BookOpen className={cn('w-4 h-4 shrink-0 mt-0.5', active.color)} />
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                        {ar ? 'اقتراح من المكتبة' : 'Library Connection'}
                      </p>
                      <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                        {ar ? active.bookHintAr : active.bookHintEn}
                      </p>
                    </div>
                  </div>

                  {/* Complete button */}
                  {!completed.has(active.id) ? (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { markComplete(active); setActive(null); }}
                      className="w-full py-3.5 rounded-2xl bg-primary dark:bg-accent text-white dark:text-primary text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-md hover:brightness-110 transition-all"
                    >
                      <Trophy className="w-4 h-4" />
                      {ar ? `أنجزت المحطة (+${active.xp} XP)` : `Complete Station (+${active.xp} XP)`}
                    </motion.button>
                  ) : (
                    <div className={cn('flex items-center gap-2 justify-center text-[11px] font-black text-slate-400', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                      <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      {ar ? 'محطة مكتملة ✓' : 'Station completed ✓'}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
