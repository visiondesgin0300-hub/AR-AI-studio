/**
 * Cognitive AR Badge Game — real-time reaction game.
 * Items (knowledge sources) appear in 6 portal slots.
 * GREEN items (reliable) must be clicked before they vanish → +score.
 * RED items (unreliable) must NOT be clicked → let them auto-expire.
 * Wrong action = −life. 3 lives per level. Combo multiplier rewards streaks.
 *
 * After reaching the win score, a knowledge quiz unlocks the badge.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, HeartCrack, Zap, Star, Compass, Search, Lock, RotateCcw, Trophy, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';

const STORAGE_KEY = 'cognitive_ar_v4';
const TICK = 100;
const SLOTS = 6;

// ── Knowledge source pool ─────────────────────────────────────────────

const SOURCES = [
  { ar: 'مقال محكّم في Nature', en: 'Nature peer-reviewed article', reliable: true },
  { ar: 'تقرير UNESCO الرسمي', en: 'Official UNESCO report', reliable: true },
  { ar: 'بحث أكاديمي من MIT', en: 'MIT academic research paper', reliable: true },
  { ar: 'كتاب من جامعة أكسفورد', en: 'Oxford University textbook', reliable: true },
  { ar: 'إحصائيات منظمة الصحة العالمية', en: 'WHO statistics', reliable: true },
  { ar: 'مجلة Science المحكّمة', en: 'Science peer-reviewed journal', reliable: true },
  { ar: 'تقرير البنك الدولي', en: 'World Bank report', reliable: true },
  { ar: 'ورقة بحثية معتمدة دولياً', en: 'Internationally accredited paper', reliable: true },
  { ar: 'منشور تويتر بلا مصادر', en: 'Twitter post without sources', reliable: false },
  { ar: 'مدونة شخصية مجهولة', en: 'Anonymous personal blog', reliable: false },
  { ar: 'فيديو يوتيوب غير موثق', en: 'Undocumented YouTube video', reliable: false },
  { ar: 'منتدى إنترنت عشوائي', en: 'Random internet forum', reliable: false },
  { ar: 'موقع إخباري مجهول المصدر', en: 'Unknown news site', reliable: false },
  { ar: 'رسالة واتساب غير موثقة', en: 'Unverified WhatsApp message', reliable: false },
  { ar: 'مدوّنة بلا مراجع', en: 'Blog post without references', reliable: false },
  { ar: 'إعلان تجاري يتنكّر كبحث', en: 'Commercial ad disguised as research', reliable: false },
];

// ── Level definitions ─────────────────────────────────────────────────

interface Level {
  id: string;
  nameAr: string; nameEn: string;
  descAr: string; descEn: string;
  hintAr: string; hintEn: string;
  xp: number;
  Icon: React.ElementType;
  color: string; bg: string; border: string; shadow: string;
  itemMs: number;
  scanMs: number;
  spawnMs: number;
  maxItems: number;
  winScore: number;
}

const LEVELS: Level[] = [
  {
    id: 'explorer', nameAr: 'المستكشف', nameEn: 'Explorer',
    descAr: 'انقر المصادر الخضراء قبل أن تختفي — تجنّب الحمراء!', descEn: 'Click green sources before they vanish — avoid red ones!',
    hintAr: 'الأخضر = موثوق ← انقر | الأحمر = تجنّب ← لا تنقر', hintEn: 'Green = reliable → click | Red = avoid → don\'t click',
    xp: 50, Icon: Compass,
    color: 'text-teal-400', bg: 'bg-teal-500/15', border: 'border-teal-500/40', shadow: 'shadow-teal-500/30',
    itemMs: 3200, scanMs: 500, spawnMs: 2000, maxItems: 1, winScore: 80,
  },
  {
    id: 'researcher', nameAr: 'الباحث', nameEn: 'Researcher',
    descAr: 'مصادر متعددة تظهر معاً — سرعة ودقة!', descEn: 'Multiple sources appear together — speed and precision!',
    hintAr: 'اثنان في وقت واحد — وقت المسح أطول!', hintEn: 'Two at once — scan time is longer now!',
    xp: 75, Icon: Search,
    color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', shadow: 'shadow-emerald-500/30',
    itemMs: 2600, scanMs: 700, spawnMs: 1700, maxItems: 2, winScore: 130,
  },
  {
    id: 'distinguished', nameAr: 'المتميز', nameEn: 'Distinguished',
    descAr: 'ثلاثة مصادر دفعة واحدة — ردود خاطفة!', descEn: 'Three sources at once — lightning-fast reactions!',
    hintAr: 'أصعب مستوى — التمييز في ثانية واحدة', hintEn: 'Hardest level — classify in under a second',
    xp: 100, Icon: Star,
    color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/40', shadow: 'shadow-amber-500/30',
    itemMs: 1900, scanMs: 900, spawnMs: 1400, maxItems: 3, winScore: 160,
  },
];

// ── Quiz questions ────────────────────────────────────────────────────

interface QuizQuestion {
  qAr: string; qEn: string;
  options: { ar: string; en: string; correct: boolean }[];
}

async function fetchQuizQuestions(level: Level): Promise<QuizQuestion[]> {
  try {
    const res = await fetch('/api/quiz-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        levelId: level.id,
        levelNameAr: level.nameAr,
        levelNameEn: level.nameEn,
      }),
    });
    const data = await res.json();
    if (data.questions?.length >= 2) return data.questions;
  } catch {}
  // Fallback (same as server fallback)
  return [
    {
      qAr: 'ما المصدر الأكثر موثوقية للبحث العلمي؟',
      qEn: 'Which is the most reliable source for scientific research?',
      options: [
        { ar: 'مقال محكّم في مجلة علمية', en: 'Peer-reviewed scientific article', correct: true },
        { ar: 'منشور في التواصل الاجتماعي', en: 'Social media post', correct: false },
        { ar: 'مدونة شخصية', en: 'Personal blog', correct: false },
      ],
    },
    {
      qAr: 'لماذا يجب التحقق من مصدر المعلومة؟',
      qEn: 'Why should you verify the source of information?',
      options: [
        { ar: 'لضمان دقتها وموثوقيتها', en: 'To ensure its accuracy and reliability', correct: true },
        { ar: 'لأن كل المعلومات خاطئة', en: 'Because all information is wrong', correct: false },
        { ar: 'لا داعي للتحقق أبداً', en: 'Verification is never necessary', correct: false },
      ],
    },
    {
      qAr: 'أي من هذه يُعدّ مصدراً أولياً؟',
      qEn: 'Which of these is a primary source?',
      options: [
        { ar: 'ورقة بحثية أكاديمية محكّمة', en: 'Peer-reviewed academic paper', correct: true },
        { ar: 'خبر منقول بلا مرجع', en: 'Unattributed news story', correct: false },
        { ar: 'تعليق في منتدى', en: 'Forum comment', correct: false },
      ],
    },
  ];
}

// ── Game state ────────────────────────────────────────────────────────

interface GameItem {
  id: string;
  slot: number;
  src: typeof SOURCES[0];
  elapsed: number;
  total: number;
  scanEnd: number;
}

interface GS {
  items: GameItem[];
  lives: number;
  score: number;
  combo: number;
  maxCombo: number;
  timeLeft: number;
  spawnIn: number;
  feedback: Array<{ id: string; correct: boolean; slot: number }>;
}

function newGS(): GS {
  return { items: [], lives: 3, score: 0, combo: 0, maxCombo: 0, timeLeft: 45_000, spawnIn: 600, feedback: [] };
}

let uid = 0;
function spawnItem(level: Level, occupiedSlots: number[]): GameItem | null {
  const free: number[] = [];
  for (let i = 0; i < SLOTS; i++) if (!occupiedSlots.includes(i)) free.push(i);
  if (free.length === 0) return null;
  const slot = free[Math.floor(Math.random() * free.length)];
  const src = SOURCES[Math.floor(Math.random() * SOURCES.length)];
  return { id: String(++uid), slot, src, elapsed: 0, total: level.itemMs, scanEnd: level.scanMs };
}

function loadCompleted(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

// ── Component ─────────────────────────────────────────────────────────

export function CognitiveARGame() {
  const { language } = useLanguage();
  const ar = language === 'ar';

  const [completed, setCompleted] = useState<string[]>(loadCompleted);
  const [phase, setPhase] = useState<'hub' | 'countdown' | 'playing' | 'quiz' | 'result'>('hub');
  const [activeLevel, setActiveLevel] = useState<Level | null>(null);
  const [won, setWon] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading]     = useState(false);
  const [quizIndex, setQuizIndex]         = useState(0);
  const [quizCorrect, setQuizCorrect]     = useState(0);
  const [quizSelected, setQuizSelected]   = useState(-1);
  const [quizRevealed, setQuizRevealed]   = useState(false);
  const [quizDone, setQuizDone]           = useState(false);

  const [tick, setTick] = useState(0);
  const gsRef = useRef<GS | null>(null);
  const gs = gsRef.current;

  const totalXP = completed.reduce((s, id) => s + (LEVELS.find(l => l.id === id)?.xp ?? 0), 0);

  // ── Countdown ──
  useEffect(() => {
    if (phase !== 'countdown') return;
    setCountdown(3);
    let n = 3;
    const id = setInterval(() => {
      n -= 1;
      setCountdown(n);
      if (n <= 0) { clearInterval(id); setPhase('playing'); }
    }, 800);
    return () => clearInterval(id);
  }, [phase]);

  // ── Main game loop ──
  useEffect(() => {
    if (phase !== 'playing' || !activeLevel) return;
    if (!gsRef.current) gsRef.current = newGS();

    const id = setInterval(() => {
      const g = gsRef.current!;
      let { items, lives, score, combo, maxCombo, timeLeft, spawnIn, feedback } = g;

      timeLeft -= TICK;
      spawnIn  -= TICK;

      feedback = feedback.filter(f => {
        (f as any)._age = ((f as any)._age ?? 0) + TICK;
        return (f as any)._age < 700;
      });

      const expired: GameItem[] = [];
      items = items.map(it => {
        const next = { ...it, elapsed: it.elapsed + TICK };
        if (next.elapsed >= next.total) expired.push(next);
        return next;
      });

      for (const it of expired) {
        items = items.filter(x => x.id !== it.id);
        if (it.src.reliable) {
          lives = Math.max(0, lives - 1);
          combo = 0;
          feedback = [...feedback, { id: it.id, correct: false, slot: it.slot }];
        }
      }

      const activeSlots = items.map(x => x.slot);
      if (spawnIn <= 0 && items.length < activeLevel.maxItems) {
        const newItem = spawnItem(activeLevel, activeSlots);
        if (newItem) items = [...items, newItem];
        spawnIn = activeLevel.spawnMs;
      }

      maxCombo = Math.max(maxCombo, combo);
      const over = lives <= 0 || timeLeft <= 0;

      gsRef.current = { items, lives, score, combo, maxCombo, timeLeft, spawnIn, feedback };
      setTick(t => t + 1);

      if (over) {
        clearInterval(id);
        const didWin = score >= activeLevel.winScore;
        if (didWin) {
          // Go to quiz before awarding the badge
          loadAndStartQuiz(activeLevel);
        } else {
          setWon(false);
          setPhase('result');
        }
      }
    }, TICK);

    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, activeLevel]);

  // ── Click handler ──
  function handleClick(item: GameItem) {
    const g = gsRef.current;
    if (!g || !activeLevel) return;
    if (item.elapsed < item.scanEnd) return;

    let { items, lives, score, combo, maxCombo, feedback } = g;
    items = items.filter(x => x.id !== item.id);

    if (item.src.reliable) {
      const multiplier = Math.min(4, 1 + Math.floor(combo / 3));
      score += 10 * multiplier;
      combo += 1;
      maxCombo = Math.max(maxCombo, combo);
      feedback = [...feedback, { id: item.id, correct: true, slot: item.slot }];
    } else {
      lives = Math.max(0, lives - 1);
      combo = 0;
      feedback = [...feedback, { id: item.id, correct: false, slot: item.slot }];
    }

    gsRef.current = { ...g, items, lives, score, combo, maxCombo, feedback };
    setTick(t => t + 1);
  }

  function startLevel(level: Level) {
    gsRef.current = null;
    setActiveLevel(level);
    setPhase('countdown');
  }

  function backToHub() { setPhase('hub'); setActiveLevel(null); gsRef.current = null; }
  function retry()     { gsRef.current = null; if (activeLevel) setPhase('countdown'); }

  // ── Quiz helpers ──
  function resetQuizState() {
    setQuizIndex(0);
    setQuizCorrect(0);
    setQuizSelected(-1);
    setQuizRevealed(false);
    setQuizDone(false);
  }

  async function loadAndStartQuiz(level: Level) {
    setQuizLoading(true);
    resetQuizState();
    setPhase('quiz');
    const questions = await fetchQuizQuestions(level);
    setQuizQuestions(questions);
    setQuizLoading(false);
  }

  function handleQuizSelect(optionIdx: number) {
    if (quizRevealed || !quizQuestions[quizIndex]) return;
    const q = quizQuestions[quizIndex];
    const isCorrect = q.options[optionIdx].correct;
    setQuizSelected(optionIdx);
    setQuizRevealed(true);
    if (isCorrect) setQuizCorrect(c => c + 1);
  }

  function finishQuiz() {
    if (!activeLevel) return;
    const passed = quizCorrect >= Math.ceil(quizQuestions.length * 0.67);
    setWon(passed);
    if (passed && !completed.includes(activeLevel.id)) {
      const next = [...completed, activeLevel.id];
      setCompleted(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    setPhase('result');
  }

  // ── Slot grid layout ──
  const slotPositions = [
    { col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 },
    { col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 },
  ];

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">

      {/* ── PAGE HEADER ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight">
            {ar ? 'لعبة الوعي المعلوماتي AR' : 'Info Literacy AR Game'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {ar ? 'حدّد المصادر الموثوقة — اجتز الاختبار — اكسب الوسام'
                : 'Identify reliable sources — pass the quiz — earn the badge'}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-black text-amber-600 dark:text-amber-400">{totalXP} XP</span>
        </div>
      </div>

      {/* ═══════════════════════════ HUB ═══════════════════════════ */}
      {phase === 'hub' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {LEVELS.map((lvl, i) => {
              const isEarned = completed.includes(lvl.id);
              const Icon = lvl.Icon;
              const prevEarned = i === 0 || completed.includes(LEVELS[i - 1].id);
              return (
                <motion.div
                  key={lvl.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, type: 'spring', stiffness: 280, damping: 24 }}
                  className={cn(
                    'official-card p-6 bg-white dark:bg-slate-900 flex flex-col gap-5 relative overflow-hidden',
                    isEarned && cn('ring-2 ring-offset-2', lvl.border.replace('border-', 'ring-'))
                  )}
                >
                  {isEarned && <div className={cn('absolute inset-0 opacity-[0.06] pointer-events-none', lvl.bg)} />}

                  <div className="flex items-start justify-between">
                    <div className={cn('w-14 h-14 rounded-2xl border-2 flex items-center justify-center shadow-lg', isEarned ? cn(lvl.bg, lvl.border, lvl.shadow) : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700')}>
                      {isEarned
                        ? <Icon className={cn('w-7 h-7', lvl.color)} />
                        : !prevEarned
                        ? <Lock className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                        : <Icon className={cn('w-7 h-7', lvl.color)} />}
                    </div>
                    <span className={cn('text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest', isEarned ? cn(lvl.bg, lvl.color) : 'bg-slate-100 dark:bg-slate-800 text-slate-400')}>
                      {isEarned ? (ar ? '✓ مكتسب' : '✓ Earned') : `+${lvl.xp} XP`}
                    </span>
                  </div>

                  <div>
                    <div className={cn('text-xs font-black uppercase tracking-widest mb-1', lvl.color)}>
                      {ar ? lvl.nameAr : lvl.nameEn}
                    </div>
                    <p className="text-sm font-bold text-primary dark:text-white leading-snug">
                      {ar ? lvl.descAr : lvl.descEn}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium leading-snug">
                      {ar ? lvl.hintAr : lvl.hintEn}
                    </p>
                  </div>

                  {/* Flow steps */}
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase">
                    <span className={cn('px-1.5 py-0.5 rounded-md', lvl.bg, lvl.color)}>
                      {ar ? '١ اللعبة' : '1 Game'}
                    </span>
                    <span>→</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                      {ar ? '٢ اختبار' : '2 Quiz'}
                    </span>
                    <span>→</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                      {ar ? '٣ وسام' : '3 Badge'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>⏱ 45s</span>
                    <span>❤️ ×3</span>
                    <span className={lvl.color}>{ar ? 'هدف' : 'Target'}: {lvl.winScore}pts</span>
                  </div>

                  <motion.button
                    whileHover={{ scale: prevEarned ? 1.02 : 1 }}
                    whileTap={{ scale: prevEarned ? 0.97 : 1 }}
                    disabled={!prevEarned}
                    onClick={() => startLevel(lvl)}
                    className={cn(
                      'mt-auto w-full py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all',
                      isEarned
                        ? cn('border-2', lvl.border, lvl.color, lvl.bg)
                        : prevEarned
                        ? 'bg-primary dark:bg-white text-white dark:text-primary shadow-xl shadow-primary/20 hover:brightness-110'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                    )}
                  >
                    {!prevEarned
                      ? (ar ? '🔒 أكمل المستوى السابق' : '🔒 Complete previous level')
                      : isEarned
                      ? (ar ? '🔄 العب مجدداً' : '🔄 Play Again')
                      : (ar ? '▶ ابدأ اللعبة' : '▶ Start Game')}
                  </motion.button>
                </motion.div>
              );
            })}
          </div>

          {/* How to play */}
          <div className="official-card p-5 bg-white dark:bg-slate-900">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              {ar ? 'كيف تلعب؟' : 'How to Play?'}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { emoji: '🟢', ar: 'المصدر الأخضر = موثوق، انقر عليه قبل انتهاء وقته', en: 'Green source = reliable, click it before time runs out' },
                { emoji: '🔴', ar: 'المصدر الأحمر = غير موثوق، لا تنقر عليه، دعه يختفي', en: 'Red source = unreliable, don\'t click — let it disappear' },
                { emoji: '⚡', ar: 'كومبو 3+ تضاعف نقاطك × 2 × 3 × 4', en: 'Combo 3+ multiplies your score ×2 ×3 ×4' },
                { emoji: '📝', ar: 'بعد النقاط: اجتز اختبار المعرفة لتحصل على الوسام', en: 'After scoring: pass the knowledge quiz to earn the badge' },
              ].map((h, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-xl shrink-0">{h.emoji}</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug font-medium">{ar ? h.ar : h.en}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ COUNTDOWN ═══════════════════ */}
      <AnimatePresence>
        {phase === 'countdown' && activeLevel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950"
          >
            <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
              style={{ backgroundImage: 'linear-gradient(rgba(0,220,180,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,220,180,1) 1px,transparent 1px)', backgroundSize: '44px 44px' }} />
            <div className="text-center space-y-4 relative z-10">
              <div className={cn('text-[11px] font-black uppercase tracking-[0.3em]', activeLevel.color)}>
                {ar ? activeLevel.nameAr : activeLevel.nameEn}
              </div>
              <motion.div
                key={countdown}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-[120px] font-black text-white leading-none"
              >
                {countdown}
              </motion.div>
              <div className="text-white/50 font-bold text-sm">{ar ? 'استعدّ...' : 'Get ready...'}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════ GAME SCREEN ═══════════════════ */}
      <AnimatePresence>
        {phase === 'playing' && activeLevel && gs && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950 flex flex-col select-none"
          >
            <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
              style={{ backgroundImage: 'linear-gradient(rgba(0,220,180,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,220,180,1) 1px,transparent 1px)', backgroundSize: '44px 44px' }} />

            {/* HUD */}
            <div className="relative z-10 px-4 pt-4 pb-3 border-b border-white/5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} animate={i >= gs.lives ? { scale: [1.3, 0.8, 1] } : {}} transition={{ duration: 0.3 }}>
                    {i < gs.lives
                      ? <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
                      : <HeartCrack className="w-5 h-5 text-slate-700" />}
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col items-center">
                <div className={cn('text-2xl font-black tabular-nums', gs.timeLeft <= 10000 ? 'text-red-400' : gs.timeLeft <= 20000 ? 'text-amber-400' : 'text-white')}>
                  {Math.ceil(gs.timeLeft / 1000)}
                </div>
                <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                  <motion.div
                    className={cn('h-full rounded-full', gs.timeLeft <= 10000 ? 'bg-red-400' : 'bg-teal-400')}
                    style={{ width: `${(gs.timeLeft / 45000) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-end">
                <div className="text-lg font-black text-white tabular-nums">{gs.score}</div>
                <div className={cn('text-[10px] font-black uppercase tracking-widest transition-colors', gs.combo >= 6 ? 'text-amber-400' : gs.combo >= 3 ? 'text-emerald-400' : 'text-slate-600')}>
                  {gs.combo >= 3 ? `×${Math.min(4, 1 + Math.floor(gs.combo / 3))} 🔥` : `COMBO ${gs.combo}`}
                </div>
              </div>
            </div>

            {/* PORTAL GRID */}
            <div className="relative z-10 flex-1 flex items-center justify-center p-4">
              <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                {slotPositions.map((_, slotIdx) => {
                  const item = gs.items.find(x => x.slot === slotIdx);
                  const isRevealed = item ? item.elapsed >= item.scanEnd : false;

                  return (
                    <div key={slotIdx} className="relative aspect-square">
                      <div className="absolute inset-0 rounded-2xl border border-white/5 bg-white/3" />
                      <AnimatePresence>
                        {item && (
                          <motion.button
                            key={item.id}
                            initial={{ scale: 0.4, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.4, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            onClick={() => handleClick(item)}
                            className={cn(
                              'absolute inset-0 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 p-2 overflow-hidden',
                              !isRevealed
                                ? 'bg-slate-800/80 border-slate-600/40 cursor-wait'
                                : item.src.reliable
                                ? 'bg-teal-950/60 border-teal-400/70 cursor-pointer shadow-[0_0_20px_rgba(20,184,166,0.25)]'
                                : 'bg-red-950/60 border-red-500/60 cursor-not-allowed shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                            )}
                          >
                            <div className="absolute inset-0 rounded-2xl pointer-events-none"
                              style={{ background: `conic-gradient(transparent ${(1 - item.elapsed / item.total) * 360}deg, rgba(255,255,255,0.04) 0deg)` }} />

                            {!isRevealed ? (
                              <div className="flex gap-1">
                                {[0, 1, 2].map(i => (
                                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-500"
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.2 }}
                                  />
                                ))}
                              </div>
                            ) : (
                              <>
                                <div className={cn('text-lg', item.src.reliable ? 'text-teal-300' : 'text-red-400')}>
                                  {item.src.reliable ? '✓' : '✗'}
                                </div>
                                <p className={cn('text-[9px] font-black text-center leading-tight px-1 uppercase tracking-wide', item.src.reliable ? 'text-teal-200' : 'text-red-300')}>
                                  {ar ? item.src.ar : item.src.en}
                                </p>
                              </>
                            )}

                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 rounded-b-2xl overflow-hidden">
                              <div className={cn('h-full transition-none', isRevealed ? (item.src.reliable ? 'bg-teal-400' : 'bg-red-400') : 'bg-slate-600')}
                                style={{ width: `${Math.max(0, (1 - item.elapsed / item.total) * 100)}%` }} />
                            </div>
                          </motion.button>
                        )}
                      </AnimatePresence>

                      <AnimatePresence>
                        {gs.feedback.filter(f => f.slot === slotIdx).map(f => (
                          <motion.div key={f.id}
                            initial={{ opacity: 1, scale: 0.5, y: 0 }}
                            animate={{ opacity: 0, scale: 1.5, y: -30 }}
                            transition={{ duration: 0.5 }}
                            className={cn('absolute inset-0 rounded-2xl pointer-events-none flex items-center justify-center text-2xl font-black', f.correct ? 'text-emerald-400' : 'text-red-400')}
                          >
                            {f.correct ? '+10' : '−♥'}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Score progress */}
            <div className="relative z-10 px-4 pb-4 flex items-center justify-center gap-3">
              <div className="h-2 flex-1 max-w-xs bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full', activeLevel.bg.replace('/15', ''))}
                  style={{ width: `${Math.min(100, (gs.score / activeLevel.winScore) * 100)}%` }}
                />
              </div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">
                {gs.score} / {activeLevel.winScore} {ar ? 'للفوز' : 'to win'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════ QUIZ SCREEN ═══════════════════ */}
      <AnimatePresence>
        {phase === 'quiz' && activeLevel && (() => {
          const questions = quizQuestions;
          const q = questions[quizIndex];
          const total = questions.length;
          const passThreshold = Math.ceil(total * 0.67);

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-6"
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="bg-slate-900 border border-white/10 rounded-3xl p-7 max-w-sm w-full relative overflow-hidden space-y-6"
              >
                <div className={cn('absolute inset-0 opacity-[0.06] pointer-events-none', activeLevel.bg)} />

                {/* Loading state */}
                {quizLoading && (
                  <div className="relative z-10 flex flex-col items-center justify-center gap-4 py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className={cn('w-12 h-12 rounded-full border-4 border-t-transparent', activeLevel.border.replace('border-', 'border-'))}
                    />
                    <div className={cn('text-xs font-black uppercase tracking-widest', activeLevel.color)}>
                      {ar ? 'جاري إعداد الاختبار...' : 'Preparing quiz...'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {ar ? 'تولّد الذكاء الاصطناعي الأسئلة' : 'AI is generating questions'}
                    </div>
                  </div>
                )}

                {/* Header */}
                {!quizLoading && !quizDone ? (
                  <>
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HelpCircle className={cn('w-5 h-5', activeLevel.color)} />
                        <span className={cn('text-xs font-black uppercase tracking-widest', activeLevel.color)}>
                          {ar ? 'اختبار المعرفة' : 'Knowledge Quiz'}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        {quizIndex + 1} / {total}
                      </span>
                    </div>

                    {/* Progress dots */}
                    <div className="relative z-10 flex gap-1.5 justify-center">
                      {questions.map((_, i) => (
                        <div key={i} className={cn('h-1.5 rounded-full transition-all', i < quizIndex ? activeLevel.bg.replace('/15', '/60') : i === quizIndex ? cn('w-6', activeLevel.bg.replace('/15', '')) : 'w-3 bg-white/10')} style={{ width: i === quizIndex ? 24 : 12 }} />
                      ))}
                    </div>

                    {/* Question */}
                    <motion.div
                      key={quizIndex}
                      initial={{ opacity: 0, x: ar ? -20 : 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative z-10 space-y-4"
                    >
                      <p className="text-white font-black text-base leading-snug text-center">
                        {ar ? q.qAr : q.qEn}
                      </p>

                      <div className="space-y-2.5">
                        {q.options.map((opt, oi) => {
                          const isSelected = quizSelected === oi;
                          const isCorrect  = opt.correct;
                          let btnClass = 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10';
                          if (quizRevealed) {
                            if (isCorrect)          btnClass = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300';
                            else if (isSelected)    btnClass = 'bg-red-500/20 border-red-500/50 text-red-300';
                            else                    btnClass = 'bg-white/3 border-white/5 text-white/30';
                          }

                          return (
                            <motion.button
                              key={oi}
                              whileHover={!quizRevealed ? { scale: 1.02 } : {}}
                              whileTap={!quizRevealed ? { scale: 0.98 } : {}}
                              onClick={() => handleQuizSelect(oi)}
                              disabled={quizRevealed}
                              className={cn('w-full px-4 py-3 rounded-2xl border text-sm font-bold text-start transition-all', btnClass)}
                            >
                              <span className="flex items-center gap-3">
                                <span className={cn('w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-black shrink-0',
                                  quizRevealed && isCorrect ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300'
                                  : quizRevealed && isSelected ? 'bg-red-500/30 border-red-400 text-red-300'
                                  : 'border-white/20 text-white/50')}>
                                  {quizRevealed ? (isCorrect ? '✓' : isSelected ? '✗' : String.fromCharCode(65 + oi)) : String.fromCharCode(65 + oi)}
                                </span>
                                {ar ? opt.ar : opt.en}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>

                      {quizRevealed && (
                        <motion.button
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            if (quizIndex + 1 >= total) {
                              setQuizDone(true);
                            } else {
                              setQuizIndex(qi => qi + 1);
                              setQuizSelected(-1);
                              setQuizRevealed(false);
                            }
                          }}
                          className={cn('w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all', activeLevel.bg, activeLevel.color, 'border-2', activeLevel.border)}
                        >
                          {quizIndex + 1 >= total
                            ? (ar ? 'عرض النتيجة ←' : 'See Result →')
                            : (ar ? 'السؤال التالي ←' : 'Next Question →')}
                        </motion.button>
                      )}
                    </motion.div>
                  </>
                ) : !quizLoading && (
                  /* Quiz result */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative z-10 text-center space-y-5"
                  >
                    <div className={cn('w-20 h-20 rounded-3xl border-2 mx-auto flex items-center justify-center shadow-2xl',
                      quizCorrect >= passThreshold ? cn(activeLevel.bg, activeLevel.border) : 'bg-slate-800 border-slate-700')}>
                      {quizCorrect >= passThreshold
                        ? <Trophy className={cn('w-10 h-10', activeLevel.color)} />
                        : <RotateCcw className="w-9 h-9 text-slate-500" />}
                    </div>

                    <div>
                      <div className={cn('text-[11px] font-black uppercase tracking-widest mb-1',
                        quizCorrect >= passThreshold ? activeLevel.color : 'text-slate-500')}>
                        {quizCorrect >= passThreshold
                          ? (ar ? '🎉 اجتزت الاختبار!' : '🎉 Quiz Passed!')
                          : (ar ? 'لم تجتز الاختبار' : 'Quiz Not Passed')}
                      </div>
                      <div className="text-3xl font-black text-white">{quizCorrect} / {total}</div>
                      <div className="text-slate-400 text-xs font-medium mt-1">
                        {ar ? `تحتاج ${passThreshold} إجابات صحيحة على الأقل` : `Need at least ${passThreshold} correct answers`}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <motion.button whileTap={{ scale: 0.97 }} onClick={finishQuiz}
                        className={cn('w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest',
                          quizCorrect >= passThreshold
                            ? 'bg-white text-primary hover:bg-white/90'
                            : cn('border-2', activeLevel.border, activeLevel.color, activeLevel.bg))}>
                        {quizCorrect >= passThreshold
                          ? (ar ? '🏆 احصل على الوسام' : '🏆 Claim Badge')
                          : (ar ? 'عرض النتيجة' : 'See Result')}
                      </motion.button>
                      {quizCorrect < passThreshold && (
                        <motion.button whileTap={{ scale: 0.97 }} onClick={() => loadAndStartQuiz(activeLevel)}
                          className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-bold text-sm hover:bg-white/10 transition-all">
                          {ar ? '🔄 أعد الاختبار' : '🔄 Retry Quiz'}
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ═══════════════════ RESULT SCREEN ═══════════════════ */}
      <AnimatePresence>
        {phase === 'result' && activeLevel && gs && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center space-y-5 relative overflow-hidden"
            >
              <div className={cn('absolute inset-0 opacity-[0.08] pointer-events-none', activeLevel.bg)} />

              <motion.div
                animate={won ? { y: [0, -8, 0] } : { rotate: [0, -5, 5, -3, 0] }}
                transition={{ repeat: Infinity, duration: won ? 2 : 1, ease: 'easeInOut' }}
                className={cn('w-20 h-20 rounded-3xl border-2 mx-auto flex items-center justify-center shadow-2xl relative z-10',
                  won ? cn(activeLevel.bg, activeLevel.border) : 'bg-slate-800 border-slate-700')}
              >
                {won
                  ? <activeLevel.Icon className={cn('w-10 h-10', activeLevel.color)} />
                  : <RotateCcw className="w-9 h-9 text-slate-500" />}
              </motion.div>

              {won && [...Array(8)].map((_, i) => (
                <motion.div key={i}
                  className={cn('absolute w-2 h-2 rounded-full pointer-events-none', activeLevel.bg.replace('/15', ''))}
                  style={{ top: '35%', left: '50%' }}
                  animate={{ x: Math.cos(i * 45 * Math.PI / 180) * 80, y: Math.sin(i * 45 * Math.PI / 180) * 80, opacity: [1, 0], scale: [1, 0] }}
                  transition={{ duration: 0.8, delay: i * 0.05, repeat: Infinity, repeatDelay: 1.5 }}
                />
              ))}

              <div className="relative z-10 space-y-2">
                <div className={cn('text-[11px] font-black uppercase tracking-widest', won ? activeLevel.color : 'text-slate-500')}>
                  {won ? (ar ? '🏆 وسام مكتسب!' : '🏆 Badge Earned!') : (ar ? 'حاول مجدداً' : 'Try Again')}
                </div>
                <div className="text-3xl font-black text-white">{gs.score} pts</div>
                {won && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-black">
                    <Zap className="w-4 h-4" /> +{activeLevel.xp} XP {ar ? 'مكتسبة' : 'earned'}
                  </div>
                )}
                {!won && (
                  <div className="text-sm text-slate-400 font-medium">
                    {ar ? `تحتاج ${activeLevel.winScore} نقطة للفوز — حصلت على ${gs.score}` : `Need ${activeLevel.winScore} pts — you scored ${gs.score}`}
                  </div>
                )}
              </div>

              <div className="relative z-10 grid grid-cols-3 gap-3 pt-2 border-t border-white/5">
                {[
                  { label: ar ? 'أعلى كومبو' : 'Max Combo', val: `×${gs.maxCombo}` },
                  { label: ar ? 'الأرواح المتبقية' : 'Lives Left', val: `${gs.lives}/3` },
                  { label: ar ? 'الوقت المتبقي' : 'Time Left', val: `${Math.floor(gs.timeLeft / 1000)}s` },
                ].map(stat => (
                  <div key={stat.label} className="text-center">
                    <div className="text-base font-black text-white">{stat.val}</div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="relative z-10 flex flex-col gap-2">
                <motion.button whileTap={{ scale: 0.97 }} onClick={retry}
                  className={cn('w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest border-2 flex items-center justify-center gap-2',
                    won ? cn(activeLevel.border, activeLevel.color, activeLevel.bg) : 'bg-white text-primary hover:bg-white/90')}>
                  {won
                    ? <><Trophy className="w-4 h-4" /> {ar ? 'العب مجدداً' : 'Play Again'}</>
                    : <><RotateCcw className="w-4 h-4" /> {ar ? 'أعد المحاولة' : 'Try Again'}</>}
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={backToHub}
                  className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-bold text-sm hover:bg-white/10 transition-all">
                  {ar ? 'العودة للمستويات' : 'Back to Levels'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
