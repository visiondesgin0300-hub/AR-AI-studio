import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, Search, Star, CheckCircle2, XCircle, Lock, X, Zap, Trophy, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';

const STORAGE_KEY = 'cognitive_ar_game_v1';

// ── Data ─────────────────────────────────────────────────────────────

interface Zone { labelAr: string; labelEn: string; emoji: string; factAr: string; factEn: string; }
interface Question {
  qAr: string; qEn: string;
  options: { ar: string; en: string }[];
  correct: number;
  expAr: string; expEn: string;
}
interface SortItem { ar: string; en: string; reliable: boolean; }

interface Badge {
  id: string;
  Icon: React.ElementType;
  nameAr: string; nameEn: string;
  descAr: string; descEn: string;
  xp: number;
  colorText: string; colorBg: string; colorBorder: string; colorShadow: string;
  type: 'explore' | 'quiz' | 'sort';
  titleAr: string; titleEn: string;
  instructionAr: string; instructionEn: string;
  zones?: Zone[];
  questions?: Question[];
  items?: SortItem[];
}

const BADGES: Badge[] = [
  {
    id: 'explorer',
    Icon: Compass,
    nameAr: 'المستكشف', nameEn: 'Explorer',
    descAr: 'استكشف أقسام المكتبة بالواقع المعزز', descEn: 'Explore library sections in AR',
    xp: 50,
    colorText: 'text-teal-500', colorBg: 'bg-teal-500/10', colorBorder: 'border-teal-500/30', colorShadow: 'shadow-teal-500/20',
    type: 'explore',
    titleAr: 'مهمة الاستكشاف', titleEn: 'Exploration Mission',
    instructionAr: 'امسح ثلاثة أقسام في المكتبة الرقمية لاكتساب المعرفة', instructionEn: 'Scan three digital library sections to gain knowledge',
    zones: [
      { labelAr: 'قسم العلوم والتقنية', labelEn: 'Science & Technology', emoji: '🔬',
        factAr: 'تحتوي المكتبة على أكثر من 50,000 مرجع علمي ومجلة محكّمة في مجالات العلوم والتقنية، متاحة للباحثين رقمياً.',
        factEn: 'The library holds over 50,000 scientific references and peer-reviewed journals in science and technology, digitally accessible.' },
      { labelAr: 'قسم الدوريات الأكاديمية', labelEn: 'Academic Journals', emoji: '📰',
        factAr: 'يمكنك الوصول إلى آلاف المجلات المحكّمة دولياً وتحميل الأبحاث مباشرةً دون الحاجة إلى زيارة المكتبة.',
        factEn: 'Access thousands of internationally peer-reviewed journals and download research directly without visiting the library.' },
      { labelAr: 'نظام تصنيف ديوي', labelEn: 'Dewey Classification', emoji: '🗂️',
        factAr: 'يُنظّم نظام ديوي العشري الكتب في 10 فئات رئيسية (000–900)، مما يسهّل تحديد مكان أي مرجع بدقة متناهية.',
        factEn: 'The Dewey Decimal System organizes books into 10 main categories (000–900), making any reference precisely locatable.' },
    ],
  },
  {
    id: 'researcher',
    Icon: Search,
    nameAr: 'الباحث', nameEn: 'Researcher',
    descAr: 'أثبت إتقانك لمهارات البحث العلمي', descEn: 'Prove your research skills mastery',
    xp: 75,
    colorText: 'text-emerald-500', colorBg: 'bg-emerald-500/10', colorBorder: 'border-emerald-500/30', colorShadow: 'shadow-emerald-500/20',
    type: 'quiz',
    titleAr: 'اختبار الوعي المعلوماتي', titleEn: 'Information Literacy Quiz',
    instructionAr: 'أجب على 3 أسئلة بحثية بدقة لإثبات كفاءتك', instructionEn: 'Answer 3 research questions correctly to prove your competency',
    questions: [
      {
        qAr: 'ما أفضل طريقة للتحقق من مصداقية مصدر علمي؟',
        qEn: 'What is the best way to verify a scientific source\'s credibility?',
        options: [
          { ar: 'عدد الإعجابات على وسائل التواصل', en: 'Number of social media likes' },
          { ar: 'التحكيم العلمي والاستشهادات الأكاديمية', en: 'Peer review and academic citations' },
          { ar: 'تاريخ النشر فقط', en: 'Publication date only' },
          { ar: 'شهرة الكاتب فقط', en: 'Author fame only' },
        ],
        correct: 1,
        expAr: 'التحكيم العلمي يضمن مراجعة الأقران للبحث، والاستشهادات تعكس تأثيره في المجتمع العلمي.',
        expEn: 'Peer review ensures research quality, and citations reflect its impact in the scientific community.',
      },
      {
        qAr: 'ما الفرق بين المصادر الأولية والثانوية؟',
        qEn: 'What is the difference between primary and secondary sources?',
        options: [
          { ar: 'المصادر الأولية أقدم تاريخياً دائماً', en: 'Primary sources are always historically older' },
          { ar: 'لا فرق بينهما في البحث العلمي', en: 'There is no difference in scientific research' },
          { ar: 'المصادر الأولية هي البيانات الأصلية، والثانوية تحللها', en: 'Primary sources are original data; secondary sources analyze them' },
          { ar: 'المصادر الثانوية دائماً أكثر موثوقية', en: 'Secondary sources are always more reliable' },
        ],
        correct: 2,
        expAr: 'المصادر الأولية (كالأبحاث الأصلية) توفر البيانات الخام، بينما تقدم الثانوية تحليلاً ومراجعة لتلك البيانات.',
        expEn: 'Primary sources (like original research) provide raw data, while secondary sources offer analysis and review of that data.',
      },
      {
        qAr: 'ما هو مؤشر h-index للباحثين؟',
        qEn: 'What is the h-index citation metric for researchers?',
        options: [
          { ar: 'عدد الكتب المنشورة فقط', en: 'Number of books published only' },
          { ar: 'مقياس يعكس الإنتاجية والتأثير العلمي معاً', en: 'A measure reflecting scientific productivity and impact together' },
          { ar: 'ترتيب جامعة الباحث دولياً', en: 'Researcher\'s university international ranking' },
          { ar: 'عدد مؤلفي البحث الواحد', en: 'Number of co-authors per paper' },
        ],
        correct: 1,
        expAr: 'مؤشر h-index يعني أن الباحث نشر (h) ورقة حظيت كل منها بـ(h) اقتباس على الأقل، موازناً الكمية بالتأثير.',
        expEn: 'The h-index means a researcher published (h) papers each cited at least (h) times, balancing quantity and impact.',
      },
    ],
  },
  {
    id: 'distinguished',
    Icon: Star,
    nameAr: 'المتميز', nameEn: 'Distinguished',
    descAr: 'ميّز المصادر الموثوقة من غير الموثوقة', descEn: 'Identify reliable from unreliable sources',
    xp: 100,
    colorText: 'text-amber-500', colorBg: 'bg-amber-500/10', colorBorder: 'border-amber-500/30', colorShadow: 'shadow-amber-500/20',
    type: 'sort',
    titleAr: 'تحدي تمييز المصادر', titleEn: 'Source Credibility Challenge',
    instructionAr: 'صنّف 6 مصادر: موثوق أم غير موثوق؟ (5/6 للنجاح)', instructionEn: 'Classify 6 sources: reliable or unreliable? (5/6 to pass)',
    items: [
      { ar: 'مقال محكّم في مجلة Nature', en: 'Peer-reviewed article in Nature journal', reliable: true },
      { ar: 'منشور على تويتر بدون مراجع', en: 'Twitter post without references', reliable: false },
      { ar: 'كتاب أكاديمي من جامعة أكسفورد', en: 'Academic book from Oxford University', reliable: true },
      { ar: 'مدونة شخصية بدون مصادر', en: 'Personal blog without sources', reliable: false },
      { ar: 'تقرير من منظمة الصحة العالمية', en: 'World Health Organization report', reliable: true },
      { ar: 'فيديو يوتيوب بدون استشهادات', en: 'YouTube video without citations', reliable: false },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────

function loadCompleted(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveCompleted(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

// ── Component ─────────────────────────────────────────────────────────

export function CognitiveARGame() {
  const { language } = useLanguage();
  const ar = language === 'ar';

  const [completed, setCompleted] = useState<string[]>(loadCompleted);
  const [activeBadge, setActiveBadge] = useState<Badge | null>(null);
  const [phase, setPhase] = useState<'hub' | 'challenge' | 'reward'>('hub');

  // Explore state
  const [scanning, setScanning] = useState<number | null>(null);
  const [scanned, setScanned] = useState<number[]>([]);

  // Quiz state
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExp, setShowExp] = useState(false);
  const [score, setScore] = useState(0);

  // Sort state
  const [sortIndex, setSortIndex] = useState(0);
  const [sortFeedback, setSortFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [sortScore, setSortScore] = useState(0);
  const [sortDone, setSortDone] = useState(false);

  const totalXP = completed.reduce((sum, id) => sum + (BADGES.find(b => b.id === id)?.xp ?? 0), 0);

  function startChallenge(badge: Badge) {
    if (completed.includes(badge.id)) return;
    setActiveBadge(badge);
    setPhase('challenge');
    setScanning(null); setScanned([]);
    setQIndex(0); setSelected(null); setShowExp(false); setScore(0);
    setSortIndex(0); setSortFeedback(null); setSortScore(0); setSortDone(false);
  }

  function earnBadge() {
    if (!activeBadge) return;
    const next = [...completed, activeBadge.id];
    setCompleted(next);
    saveCompleted(next);
    setPhase('reward');
  }

  function closeChallenge() { setPhase('hub'); setActiveBadge(null); }

  // ── Explore handlers ──
  function handleScan(idx: number) {
    if (scanning !== null || scanned.includes(idx)) return;
    setScanning(idx);
    setTimeout(() => { setScanning(null); setScanned(prev => [...prev, idx]); }, 1600);
  }

  // ── Quiz handlers ──
  function handleAnswer(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    setShowExp(true);
    if (idx === activeBadge!.questions![qIndex].correct) setScore(s => s + 1);
  }
  function nextQuestion() {
    const total = activeBadge!.questions!.length;
    if (qIndex + 1 >= total) { earnBadge(); }
    else { setQIndex(i => i + 1); setSelected(null); setShowExp(false); }
  }

  // ── Sort handlers ──
  function handleSort(guess: boolean) {
    if (sortFeedback !== null) return;
    const items = activeBadge!.items!;
    const isCorrect = guess === items[sortIndex].reliable;
    const fb: 'correct' | 'wrong' = isCorrect ? 'correct' : 'wrong';
    setSortFeedback(fb);
    if (isCorrect) setSortScore(s => s + 1);
    setTimeout(() => {
      setSortFeedback(null);
      const next = sortIndex + 1;
      if (next >= items.length) { setSortDone(true); }
      else { setSortIndex(next); }
    }, 900);
  }

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-10">

      {/* ── Page Header ── */}
      <div className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight">
            {ar ? 'الوعي المعلوماتي AR' : 'Information Literacy AR'}
          </h1>
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[10px] font-black uppercase tracking-widest">
            {ar ? 'لعبة تعليمية' : 'Educational Game'}
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          {ar
            ? 'أكمل تحديات الواقع المعزز لكسب الأوسمة المعرفية ورفع وعيك المعلوماتي'
            : 'Complete AR challenges to earn cognitive badges and raise your information awareness'}
        </p>
      </div>

      {/* ── XP & Progress Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="official-card p-6 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 dark:from-primary/10 dark:to-primary/10 border border-primary/10 dark:border-white/5"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {ar ? 'نقاط الخبرة المكتسبة' : 'Earned Experience Points'}
              </div>
              <div className="text-2xl font-black text-primary dark:text-white">
                {totalXP} <span className="text-sm font-bold text-slate-400">XP</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {BADGES.map(b => (
              <div
                key={b.id}
                className={cn(
                  'w-9 h-9 rounded-xl border flex items-center justify-center transition-all',
                  completed.includes(b.id) ? cn(b.colorBg, b.colorBorder) : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                )}
              >
                <b.Icon className={cn('w-4 h-4', completed.includes(b.id) ? b.colorText : 'text-slate-300 dark:text-slate-600')} />
              </div>
            ))}
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ms-1">
              {completed.length}/3
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(completed.length / 3) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* ── Badge Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {BADGES.map((badge, i) => {
          const isEarned = completed.includes(badge.id);
          const Icon = badge.Icon;
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: 'spring', stiffness: 280, damping: 24 }}
              className={cn(
                'official-card p-6 bg-white dark:bg-slate-900 flex flex-col gap-5 relative overflow-hidden',
                isEarned && 'ring-2 ring-offset-2 ring-offset-bg-light dark:ring-offset-bg-dark',
                isEarned && badge.colorBorder.replace('border-', 'ring-')
              )}
            >
              {/* Earned glow */}
              {isEarned && (
                <div className={cn('absolute inset-0 opacity-5 pointer-events-none', badge.colorBg.replace('/10', ''))} />
              )}

              {/* Lock / earned badge */}
              <div className="absolute top-4 end-4">
                {isEarned
                  ? <CheckCircle2 className={cn('w-5 h-5', badge.colorText)} />
                  : <Lock className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                }
              </div>

              {/* Icon */}
              <div className={cn(
                'w-16 h-16 rounded-2xl border flex items-center justify-center shadow-lg',
                isEarned ? cn(badge.colorBg, badge.colorBorder, badge.colorShadow) : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              )}>
                <Icon className={cn('w-8 h-8', isEarned ? badge.colorText : 'text-slate-300 dark:text-slate-500')} />
              </div>

              {/* Info */}
              <div>
                <div className={cn('text-xs font-black uppercase tracking-widest mb-1', isEarned ? badge.colorText : 'text-slate-400')}>
                  {ar ? badge.nameAr : badge.nameEn}
                </div>
                <p className="text-sm font-bold text-primary dark:text-white leading-snug">
                  {ar ? badge.descAr : badge.descEn}
                </p>
              </div>

              {/* XP chip */}
              <div className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black self-start',
                isEarned ? cn(badge.colorBg, badge.colorText) : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
              )}>
                <Zap className="w-3 h-3" />
                +{badge.xp} XP
              </div>

              {/* CTA */}
              <motion.button
                whileHover={isEarned ? {} : { scale: 1.02 }}
                whileTap={isEarned ? {} : { scale: 0.97 }}
                onClick={() => startChallenge(badge)}
                disabled={isEarned}
                className={cn(
                  'mt-auto w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all',
                  isEarned
                    ? cn('border-2', badge.colorBorder, badge.colorText, badge.colorBg)
                    : 'bg-primary dark:bg-accent text-white dark:text-primary shadow-lg shadow-primary/20 dark:shadow-accent/20 hover:brightness-110'
                )}
              >
                {isEarned
                  ? (ar ? '✓ مكتسب' : '✓ Earned')
                  : (ar ? 'ابدأ التحدي' : 'Start Challenge')}
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* ── How it works ── */}
      <div className="official-card p-6 bg-white dark:bg-slate-900">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
          {ar ? 'كيف تعمل اللعبة؟' : 'How does it work?'}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { emoji: '🔍', titleAr: 'المستكشف', titleEn: 'Explorer', descAr: 'امسح 3 أقسام بالواقع المعزز واكتشف معلومات المكتبة', descEn: 'Scan 3 sections in AR and discover library information' },
            { emoji: '📚', titleAr: 'الباحث', titleEn: 'Researcher', descAr: 'أجب على 3 أسئلة عن الوعي المعلوماتي والبحث العلمي', descEn: 'Answer 3 questions about information literacy and research' },
            { emoji: '⭐', titleAr: 'المتميز', titleEn: 'Distinguished', descAr: 'صنّف 6 مصادر وميّز الموثوق من غير الموثوق', descEn: 'Classify 6 sources and identify reliable vs unreliable' },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0">{step.emoji}</div>
              <div>
                <div className="text-xs font-black text-primary dark:text-white">{ar ? step.titleAr : step.titleEn}</div>
                <div className="text-[11px] text-slate-400 leading-snug mt-0.5">{ar ? step.descAr : step.descEn}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════ CHALLENGE OVERLAY ═══════════════ */}
      <AnimatePresence>
        {phase === 'challenge' && activeBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col"
          >
            {/* Decorative AR grid */}
            <div className="absolute inset-0 pointer-events-none opacity-5"
              style={{ backgroundImage: 'linear-gradient(rgba(0,200,180,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,180,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }}
            />

            {/* Top bar */}
            <div className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className={cn('w-8 h-8 rounded-xl border flex items-center justify-center', activeBadge.colorBg, activeBadge.colorBorder)}>
                  <activeBadge.Icon className={cn('w-4 h-4', activeBadge.colorText)} />
                </div>
                <div>
                  <div className={cn('text-[10px] font-black uppercase tracking-widest', activeBadge.colorText)}>
                    {ar ? activeBadge.titleAr : activeBadge.titleEn}
                  </div>
                  <div className="text-white/50 text-[10px] font-medium">
                    {ar ? activeBadge.instructionAr : activeBadge.instructionEn}
                  </div>
                </div>
              </div>
              <button onClick={closeChallenge} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Challenge body */}
            <div className="flex-1 overflow-y-auto p-6 relative z-10">

              {/* ── EXPLORE ── */}
              {activeBadge.type === 'explore' && (
                <div className="max-w-lg mx-auto space-y-4">
                  {activeBadge.zones!.map((zone, idx) => {
                    const isScanning = scanning === idx;
                    const isScanned = scanned.includes(idx);
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: ar ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={cn(
                          'rounded-2xl border p-5 transition-all duration-300',
                          isScanned
                            ? cn('bg-teal-500/10 border-teal-500/30')
                            : 'bg-white/5 border-white/10'
                        )}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 flex items-center justify-center text-2xl">
                              {zone.emoji}
                              {isScanning && (
                                <motion.div
                                  className="absolute inset-0 rounded-full border-2 border-teal-400"
                                  animate={{ scale: [1, 1.8], opacity: [1, 0] }}
                                  transition={{ repeat: Infinity, duration: 0.8 }}
                                />
                              )}
                            </div>
                            <div className={cn('text-sm font-black', isScanned ? 'text-teal-300' : 'text-white/80')}>
                              {ar ? zone.labelAr : zone.labelEn}
                            </div>
                          </div>
                          {!isScanned ? (
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleScan(idx)}
                              disabled={isScanning || scanning !== null}
                              className={cn(
                                'px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0',
                                isScanning
                                  ? 'bg-teal-500/20 text-teal-300 cursor-wait'
                                  : scanning !== null
                                  ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                  : 'bg-teal-500 text-white hover:bg-teal-400 active:scale-95'
                              )}
                            >
                              {isScanning ? (ar ? 'يمسح...' : 'Scanning...') : (ar ? 'امسح' : 'Scan')}
                            </motion.button>
                          ) : (
                            <div className="flex items-center gap-1.5 text-teal-400 text-[11px] font-black shrink-0">
                              <CheckCircle2 className="w-4 h-4" /> {ar ? 'مكتشف' : 'Scanned'}
                            </div>
                          )}
                        </div>

                        {/* Revealed fact */}
                        <AnimatePresence>
                          {isScanned && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-4 pt-4 border-t border-teal-500/20"
                            >
                              <p className="text-sm text-teal-200/80 font-medium leading-relaxed">
                                💡 {ar ? zone.factAr : zone.factEn}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}

                  {/* Complete button */}
                  <AnimatePresence>
                    {scanned.length === activeBadge.zones!.length && (
                      <motion.button
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={earnBadge}
                        className="w-full py-4 rounded-2xl bg-teal-500 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-teal-500/30 hover:bg-teal-400 transition-all"
                      >
                        {ar ? '🏅 احصل على الوسام' : '🏅 Claim Your Badge'}
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* ── QUIZ ── */}
              {activeBadge.type === 'quiz' && (
                <div className="max-w-lg mx-auto space-y-5">
                  {/* Progress dots */}
                  <div className="flex items-center justify-center gap-2">
                    {activeBadge.questions!.map((_, i) => (
                      <div key={i} className={cn(
                        'h-1.5 rounded-full transition-all duration-300',
                        i < qIndex ? 'w-6 bg-emerald-500' : i === qIndex ? 'w-10 bg-emerald-400' : 'w-6 bg-white/10'
                      )} />
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={qIndex}
                      initial={{ opacity: 0, x: ar ? -30 : 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: ar ? 30 : -30 }}
                      className="space-y-4"
                    >
                      {/* Question */}
                      <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
                        <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">
                          {ar ? `سؤال ${qIndex + 1} من ${activeBadge.questions!.length}` : `Question ${qIndex + 1} of ${activeBadge.questions!.length}`}
                        </div>
                        <p className="text-white font-bold text-base leading-relaxed">
                          {ar ? activeBadge.questions![qIndex].qAr : activeBadge.questions![qIndex].qEn}
                        </p>
                      </div>

                      {/* Options */}
                      <div className="space-y-2">
                        {activeBadge.questions![qIndex].options.map((opt, oi) => {
                          const isCorrect = oi === activeBadge.questions![qIndex].correct;
                          const isSelected = selected === oi;
                          return (
                            <motion.button
                              key={oi}
                              whileTap={selected === null ? { scale: 0.98 } : {}}
                              onClick={() => handleAnswer(oi)}
                              disabled={selected !== null}
                              className={cn(
                                'w-full text-start px-5 py-4 rounded-2xl border text-sm font-bold transition-all',
                                !showExp
                                  ? 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
                                  : isCorrect
                                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                  : isSelected
                                  ? 'bg-red-500/20 border-red-500/50 text-red-300'
                                  : 'bg-white/3 border-white/5 text-white/30'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  'w-6 h-6 rounded-lg border text-[10px] font-black flex items-center justify-center shrink-0',
                                  !showExp ? 'border-white/20 text-white/40' :
                                  isCorrect ? 'border-emerald-400 text-emerald-400' :
                                  isSelected ? 'border-red-400 text-red-400' : 'border-white/10 text-white/20'
                                )}>
                                  {['A','B','C','D'][oi]}
                                </div>
                                {ar ? opt.ar : opt.en}
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      <AnimatePresence>
                        {showExp && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                              'rounded-2xl p-4 text-sm font-medium leading-relaxed',
                              selected === activeBadge.questions![qIndex].correct
                                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-200'
                                : 'bg-red-500/10 border border-red-500/30 text-red-200'
                            )}
                          >
                            <div className="flex items-start gap-2">
                              {selected === activeBadge.questions![qIndex].correct
                                ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
                                : <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />}
                              {ar ? activeBadge.questions![qIndex].expAr : activeBadge.questions![qIndex].expEn}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Next */}
                      {showExp && (
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={nextQuestion}
                          className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-sm uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/20"
                        >
                          {qIndex + 1 >= activeBadge.questions!.length
                            ? (ar ? '🏅 احصل على الوسام' : '🏅 Claim Your Badge')
                            : (ar ? 'السؤال التالي →' : 'Next Question →')}
                        </motion.button>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}

              {/* ── SORT ── */}
              {activeBadge.type === 'sort' && !sortDone && (
                <div className="max-w-sm mx-auto space-y-5">
                  {/* Counter */}
                  <div className="text-center">
                    <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                      {ar ? `مصدر ${sortIndex + 1} من ${activeBadge.items!.length}` : `Source ${sortIndex + 1} of ${activeBadge.items!.length}`}
                    </div>
                    <div className="mt-2 flex gap-1.5 justify-center">
                      {activeBadge.items!.map((_, i) => (
                        <div key={i} className={cn('h-1 rounded-full transition-all', i < sortIndex ? 'w-5 bg-amber-400' : i === sortIndex ? 'w-8 bg-amber-300' : 'w-5 bg-white/10')} />
                      ))}
                    </div>
                  </div>

                  {/* Source card */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={sortIndex}
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      className={cn(
                        'rounded-3xl border p-8 text-center transition-all duration-200',
                        sortFeedback === 'correct' ? 'bg-emerald-500/20 border-emerald-500/40' :
                        sortFeedback === 'wrong' ? 'bg-red-500/20 border-red-500/40' :
                        'bg-white/5 border-white/10'
                      )}
                    >
                      <div className="text-4xl mb-4">
                        {activeBadge.items![sortIndex].reliable ? '📄' : '⚠️'}
                      </div>
                      <p className="text-white font-bold text-lg leading-snug">
                        {ar ? activeBadge.items![sortIndex].ar : activeBadge.items![sortIndex].en}
                      </p>
                      {sortFeedback && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn('mt-4 text-sm font-black', sortFeedback === 'correct' ? 'text-emerald-400' : 'text-red-400')}
                        >
                          {sortFeedback === 'correct' ? (ar ? '✓ إجابة صحيحة!' : '✓ Correct!') : (ar ? '✗ إجابة خاطئة' : '✗ Incorrect')}
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSort(true)}
                      disabled={sortFeedback !== null}
                      className="py-5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-black text-sm uppercase tracking-wider hover:bg-emerald-500/30 transition-all disabled:opacity-40"
                    >
                      ✅ {ar ? 'موثوق' : 'Reliable'}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSort(false)}
                      disabled={sortFeedback !== null}
                      className="py-5 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-300 font-black text-sm uppercase tracking-wider hover:bg-red-500/30 transition-all disabled:opacity-40"
                    >
                      ❌ {ar ? 'غير موثوق' : 'Unreliable'}
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Sort result */}
              {activeBadge.type === 'sort' && sortDone && (
                <div className="max-w-sm mx-auto text-center space-y-6 pt-4">
                  <div className="text-6xl">{sortScore >= 5 ? '🏆' : '📖'}</div>
                  <div>
                    <div className="text-3xl font-black text-white">{sortScore}/{activeBadge.items!.length}</div>
                    <div className={cn('text-sm font-bold mt-1', sortScore >= 5 ? 'text-emerald-400' : 'text-amber-400')}>
                      {sortScore >= 5
                        ? (ar ? 'ممتاز! لديك قدرة على تمييز المصادر' : 'Excellent! You can identify reliable sources')
                        : (ar ? 'جيد، استمر في التعلم!' : 'Good, keep learning!')}
                    </div>
                  </div>
                  {sortScore >= 5 ? (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={earnBadge}
                      className="w-full py-4 rounded-2xl bg-amber-500 text-primary font-black text-sm uppercase tracking-widest shadow-xl shadow-amber-500/30 hover:bg-amber-400 transition-all"
                    >
                      {ar ? '🏅 احصل على وسام المتميز' : '🏅 Claim Distinguished Badge'}
                    </motion.button>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => { setSortIndex(0); setSortFeedback(null); setSortScore(0); setSortDone(false); }}
                      className="w-full py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-black text-sm uppercase tracking-widest hover:bg-white/15 transition-all flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" /> {ar ? 'حاول مجدداً' : 'Try Again'}
                    </motion.button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════ REWARD MODAL ═══════════════ */}
      <AnimatePresence>
        {phase === 'reward' && activeBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-10 max-w-sm w-full text-center space-y-6 relative overflow-hidden"
            >
              {/* Glow bg */}
              <div className={cn('absolute inset-0 opacity-10 pointer-events-none', activeBadge.colorBg)} />

              {/* Animated badge */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className={cn(
                  'w-24 h-24 rounded-3xl border-2 flex items-center justify-center mx-auto shadow-2xl',
                  activeBadge.colorBg, activeBadge.colorBorder, activeBadge.colorShadow
                )}
              >
                <activeBadge.Icon className={cn('w-12 h-12', activeBadge.colorText)} />
              </motion.div>

              {/* Sparkle dots */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className={cn('absolute w-2 h-2 rounded-full', activeBadge.colorBg.replace('/10', ''))}
                  style={{ top: `${20 + Math.sin(i * 60 * Math.PI / 180) * 40}%`, left: `${50 + Math.cos(i * 60 * Math.PI / 180) * 35}%` }}
                  animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.25 }}
                />
              ))}

              <div className="relative z-10">
                <div className={cn('text-[11px] font-black uppercase tracking-widest mb-1', activeBadge.colorText)}>
                  {ar ? 'تهانيك! حصلت على وسام' : 'Congratulations! You earned the badge'}
                </div>
                <div className="text-2xl font-black text-white">
                  {ar ? activeBadge.nameAr : activeBadge.nameEn}
                </div>
                <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-black">
                  <Zap className="w-4 h-4" />
                  +{activeBadge.xp} XP {ar ? 'مكتسبة' : 'earned'}
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
                <Trophy className="w-4 h-4 text-amber-500" />
                {completed.length}/3 {ar ? 'أوسمة مكتملة' : 'badges completed'}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={closeChallenge}
                className="w-full py-4 rounded-2xl bg-white text-primary font-black text-sm uppercase tracking-widest hover:bg-white/90 transition-all"
              >
                {completed.length === 3
                  ? (ar ? '🎉 أكملت جميع التحديات!' : '🎉 All challenges complete!')
                  : (ar ? 'العودة للتحديات' : 'Back to Challenges')}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
