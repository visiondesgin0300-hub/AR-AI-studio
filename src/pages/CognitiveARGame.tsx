/**
 * Information Literacy Challenge.
 *
 * Each level is a short round of questions about doing research well: judging
 * a source, building a search, citing honestly, reading evidence. Answer, and
 * the reason behind the answer is shown — right or wrong — because the
 * explanation is the teaching, not the score.
 *
 * A wrong answer or a timeout costs a star; three stars end the round. Pass
 * two thirds of the questions to earn the level's badge and its XP.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { StarOff, Zap, Star, Crown, Compass, Search, Lock, RotateCcw, Trophy, HelpCircle, Info, X, Target, Timer, Brain, Gamepad2, CheckCircle2, XCircle, Lightbulb, ArrowRight, ArrowLeft } from 'lucide-react';
import { cn, GAME_LEVEL_XP } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';
import {
  LiteracyQuestion, LiteracyOption, LiteracyLevel,
  SKILL_LABEL, pickQuestions, shuffleOptions,
} from '../data/infoLiteracy';

/**
 * Correct answers needed to pass: two thirds of the questions, as an exact
 * fraction. Written as `ceil(total * 0.67)` this rounded the wrong way —
 * 3 × 0.67 = 2.01, whose ceiling is 3 — so a round described as 67% actually
 * required every answer to be right.
 */
function passMarkFor(total: number): number {
  return Math.ceil((total * 2) / 3);
}

function getGameStorageKey(): string {
  try {
    const stored = localStorage.getItem('library_user');
    if (!stored) return 'cognitive_ar_v4_anonymous';
    return `cognitive_ar_v4_${JSON.parse(stored)?.id || 'anonymous'}`;
  } catch { return 'cognitive_ar_v4_anonymous'; }
}

// ── Level definitions ─────────────────────────────────────────────────

interface Level {
  id: LiteracyLevel;
  nameAr: string; nameEn: string;
  descAr: string; descEn: string;
  hintAr: string; hintEn: string;
  xp: number;
  Icon: React.ElementType;
  color: string; bg: string; border: string; shadow: string;
  /** Questions in a round, and the seconds allowed for each. */
  questionCount: number;
  seconds: number;
}

const LEVELS: Level[] = [
  {
    id: 'explorer', nameAr: 'المستكشف', nameEn: 'Explorer',
    descAr: 'من أين تأتي المعرفة الموثوقة؟', descEn: 'Where does trustworthy knowledge come from?',
    hintAr: 'أساسيات: المصدر، المؤلف، التاريخ، والنسبة', hintEn: 'Basics: the source, the author, the date, and credit',
    xp: GAME_LEVEL_XP.explorer, Icon: Compass,
    color: 'text-teal-400', bg: 'bg-teal-500/15', border: 'border-teal-500/40', shadow: 'shadow-teal-500/30',
    questionCount: 5, seconds: 25,
  },
  {
    id: 'researcher', nameAr: 'الباحث', nameEn: 'Researcher',
    descAr: 'كيف تبني بحثاً وتوثّقه؟', descEn: 'How do you build a search and cite it?',
    hintAr: 'المعاملات المنطقية، المكنز، التحكيم، والتوثيق', hintEn: 'Boolean operators, thesauri, peer review, citation',
    xp: GAME_LEVEL_XP.researcher, Icon: Search,
    color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', shadow: 'shadow-emerald-500/30',
    questionCount: 5, seconds: 20,
  },
  {
    id: 'distinguished', nameAr: 'المتميز', nameEn: 'Distinguished',
    descAr: 'أحكام صعبة: التحيّز، التمويل، والمراجع الوهمية', descEn: 'Hard calls: bias, funding, and fabricated references',
    hintAr: 'المجلات المفترسة، الأدلة المنتقاة، ومراجع الذكاء الاصطناعي', hintEn: 'Predatory journals, cherry-picked evidence, AI citations',
    xp: GAME_LEVEL_XP.distinguished, Icon: Crown,
    color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/40', shadow: 'shadow-amber-500/30',
    questionCount: 5, seconds: 16,
  },
];

// ── Questions for a round ─────────────────────────────────────────────

interface RoundQuestion {
  q: LiteracyQuestion;
  /** Options in a fixed random order, so the right one is not always first. */
  options: LiteracyOption[];
}

/**
 * Ask the server for AI-written questions, and fall back to the local bank.
 *
 * The bank is the guarantee: it is complete, reviewed, and works offline, so a
 * slow or unavailable model can never leave a level unplayable. The request is
 * given a short budget and anything malformed is rejected outright.
 */
async function buildRound(level: Level, ar: boolean): Promise<RoundQuestion[]> {
  const local = pickQuestions(level.id, level.questionCount);

  const valid = (q: any): q is LiteracyQuestion =>
    typeof q?.qAr === 'string' && typeof q?.qEn === 'string' &&
    typeof q?.whyAr === 'string' && typeof q?.whyEn === 'string' &&
    q.whyAr.trim().length > 0 && q.whyEn.trim().length > 0 &&
    Array.isArray(q.options) && q.options.length >= 2 &&
    q.options.filter((o: any) => o?.correct).length === 1;

  try {
    const res = await Promise.race([
      fetch('/api/quiz-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levelId: level.id, levelNameAr: level.nameAr, levelNameEn: level.nameEn, count: level.questionCount }),
      }).then(r => r.json()),
      new Promise<null>(resolve => setTimeout(() => resolve(null), 5000)),
    ]);
    const generated: LiteracyQuestion[] = (res as any)?.questions?.filter(valid) ?? [];
    if (generated.length >= level.questionCount) {
      const merged = generated.slice(0, level.questionCount).map((q, i) => ({
        ...q,
        id: `ai-${i}`,
        level: level.id,
        skill: q.skill ?? local[i % local.length]?.skill ?? 'evaluate',
      }));
      return merged.map(q => ({ q, options: shuffleOptions(q) }));
    }
  } catch { /* fall through to the bank */ }

  return local.map(q => ({ q, options: shuffleOptions(q) }));
}

// ── Round state ───────────────────────────────────────────────────────

type Outcome = 'right' | 'wrong' | 'timeout';

interface Round {
  questions: RoundQuestion[];
  index: number;
  correct: number;
  stars: number;
  score: number;
  combo: number;
  maxCombo: number;
  selected: number;
  outcome: Outcome | null;
}

function newRound(questions: RoundQuestion[]): Round {
  return { questions, index: 0, correct: 0, stars: 3, score: 0, combo: 0, maxCombo: 0, selected: -1, outcome: null };
}

function loadCompleted(): string[] {
  try { return JSON.parse(localStorage.getItem(getGameStorageKey()) || '[]'); } catch { return []; }
}

// ── Component ─────────────────────────────────────────────────────────

export function CognitiveARGame() {
  const { language, dir } = useLanguage();
  const ar = language === 'ar';
  const navigate = useNavigate();

  const [completed, setCompleted] = useState<string[]>(loadCompleted);
  const [showInfo, setShowInfo] = useState(false);
  const [phase, setPhase] = useState<'hub' | 'countdown' | 'playing' | 'result'>('hub');
  const [activeLevel, setActiveLevel] = useState<Level | null>(null);
  const [won, setWon] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [loading, setLoading] = useState(false);

  const [round, setRound] = useState<Round | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [countdownDone, setCountdownDone] = useState(false);

  const pending = useRef<RoundQuestion[] | null>(null);

  const totalXP = completed.reduce((s, id) => s + (LEVELS.find(l => l.id === id)?.xp ?? 0), 0);
  const current = round?.questions[round.index] ?? null;
  const revealed = round?.outcome !== null && round?.outcome !== undefined;
  const passMark = activeLevel ? passMarkFor(activeLevel.questionCount) : 0;

  // ── Countdown ──
  useEffect(() => {
    if (phase !== 'countdown' || !activeLevel) return;
    setCountdown(3);
    setCountdownDone(false);
    let n = 3;
    const id = setInterval(() => {
      n -= 1;
      setCountdown(n);
      if (n <= 0) { clearInterval(id); setCountdownDone(true); }
    }, 800);
    return () => clearInterval(id);
  }, [phase, activeLevel]);

  // The round starts when the countdown has finished *and* the questions are
  // ready — the fetch can outlast the countdown, and starting without them
  // would leave the player staring at an empty screen.
  useEffect(() => {
    if (phase !== 'countdown' || !countdownDone || loading || !activeLevel) return;
    const qs = pending.current ?? [];
    if (!qs.length) { setPhase('hub'); return; }
    setRound(newRound(qs));
    setTimeLeft(activeLevel.seconds);
    setPhase('playing');
  }, [phase, countdownDone, loading, activeLevel]);

  // ── Per-question timer ──
  useEffect(() => {
    if (phase !== 'playing' || !round || revealed) return;
    if (timeLeft <= 0) { resolve(-1); return; }
    const id = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft, revealed, round?.index]);

  /** Score an answer. `choice` of -1 means the clock ran out. */
  function resolve(choice: number) {
    setRound(r => {
      if (!r || r.outcome !== null) return r;
      const opts = r.questions[r.index].options;
      const right = choice >= 0 && opts[choice]?.correct === true;
      const multiplier = Math.min(4, 1 + Math.floor(r.combo / 3));
      return {
        ...r,
        selected: choice,
        outcome: right ? 'right' : choice < 0 ? 'timeout' : 'wrong',
        correct: r.correct + (right ? 1 : 0),
        score: r.score + (right ? 10 * multiplier : 0),
        combo: right ? r.combo + 1 : 0,
        maxCombo: right ? Math.max(r.maxCombo, r.combo + 1) : r.maxCombo,
        stars: right ? r.stars : Math.max(0, r.stars - 1),
      };
    });
  }

  /** Move on, or end the round. */
  function advance() {
    if (!round || !activeLevel) return;
    const isLast = round.index >= round.questions.length - 1;
    const outOfStars = round.stars <= 0;

    if (isLast || outOfStars) {
      const passed = round.correct >= passMarkFor(round.questions.length) && !outOfStars;
      setWon(passed);
      if (passed && !completed.includes(activeLevel.id)) {
        const next = [...completed, activeLevel.id];
        setCompleted(next);
        localStorage.setItem(getGameStorageKey(), JSON.stringify(next));
      }
      setPhase('result');
      return;
    }
    setRound({ ...round, index: round.index + 1, selected: -1, outcome: null });
    setTimeLeft(activeLevel.seconds);
  }

  async function startLevel(level: Level) {
    setActiveLevel(level);
    setRound(null);
    setLoading(true);
    setPhase('countdown');
    pending.current = await buildRound(level, ar);
    setLoading(false);
  }

  function backToHub() { setPhase('hub'); setActiveLevel(null); setRound(null); }
  function retry()     { if (activeLevel) startLevel(activeLevel); }



  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-10">

      {/* ── PAGE HEADER ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight">
            {ar ? 'تحدّي الوعي المعلوماتي' : 'Information Literacy Challenge'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {ar ? 'أسئلة تبني وعيك المعلوماتي في البحث — أجب، واعرف السبب'
                : 'Questions that build your research literacy — answer, and learn why'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowInfo(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <Info className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              {ar ? 'معلومات' : 'Info'}
            </span>
          </motion.button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-black text-amber-600 dark:text-amber-400">{totalXP} XP</span>
          </div>
        </div>
      </div>

      {/* ── INFO MODAL — same design as Dashboard popup ── */}
      <AnimatePresence>
        {showInfo && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfo(false)}
              className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            >
              <div
                dir={dir}
                className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative"
              >
                {/* Dark header */}
                <div className="bg-primary rounded-t-[2rem] px-8 pt-8 pb-10 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #D7C826 0%, transparent 50%)' }} />
                  <button
                    onClick={() => setShowInfo(false)}
                    className={cn('absolute top-5 w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all', ar ? 'left-5' : 'right-5')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-accent/20 border-2 border-accent/40 flex items-center justify-center shrink-0">
                      <Gamepad2 className="w-7 h-7 text-accent" />
                    </div>
                    <div>
                      <div className="text-[9px] font-black text-accent/70 uppercase tracking-[0.3em] mb-1">
                        {ar ? 'ميزة تفاعلية' : 'Interactive Feature'}
                      </div>
                      <h3 className="text-xl font-black text-white leading-tight">
                        {ar ? 'تحدّي الوعي المعلوماتي' : 'Information Literacy Challenge'}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="px-8 py-7 space-y-7">

                  {/* Description */}
                  <p className={cn('text-sm text-slate-600 dark:text-slate-300 font-semibold leading-relaxed', ar ? 'text-right' : 'text-left')}>
                    {ar
                      ? 'ثلاث جولات من الأسئلة تبني وعيك المعلوماتي في البحث: كيف تحكم على مصدر، وكيف تبني بحثاً، وكيف تُوثّق، وكيف تقرأ الأدلة. كل إجابة يتبعها سببها.'
                      : 'Three rounds of questions that build research literacy: judging a source, building a search, citing honestly, and reading evidence. Every answer is followed by its reason.'}
                  </p>

                  {/* How it works */}
                  <div className="space-y-3">
                    <h4 className={cn('text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest', ar ? 'text-right' : 'text-left')}>
                      {ar ? 'كيف تعمل اللعبة؟' : 'How does it work?'}
                    </h4>
                    {[
                      {
                        icon: Brain,
                        color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
                        titleAr: 'أسئلة من الواقع البحثي',
                        titleEn: 'Questions from real research',
                        descAr: 'مواقف يواجهها الباحث فعلاً: عنوان مبالغ، ورقة preprint، مرجع ولّده ذكاء اصطناعي.',
                        descEn: 'Situations researchers actually meet: an inflated headline, a preprint, an AI-invented reference.',
                      },
                      {
                        icon: Timer,
                        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                        titleAr: 'وقت محدود لكل سؤال',
                        titleEn: 'A clock on each question',
                        descAr: 'لكل سؤال ثوانٍ معدودة تقصر كلما صعد المستوى. الخطأ أو التأخر يكلّف نجمة.',
                        descEn: 'Each question has seconds that shrink as levels rise. A miss or a timeout costs a star.',
                      },
                      {
                        icon: Target,
                        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                        titleAr: 'الشرح بعد كل إجابة',
                        titleEn: 'The reason, every time',
                        descAr: 'يظهر سبب صحّة الإجابة سواء أصبت أم أخطأت — الشرح هو الفائدة، لا النتيجة.',
                        descEn: 'The reason appears whether you were right or wrong — the explanation is the point, not the score.',
                      },
                    ].map((step, i) => (
                      <div key={i} className={cn('flex items-start gap-3', ar ? 'flex-row-reverse' : '')}>
                        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-current/10', step.color)}>
                          <step.icon className="w-4 h-4" />
                        </div>
                        <div className={cn('flex-1', ar ? 'text-right' : 'text-left')}>
                          <div className="text-xs font-black text-primary dark:text-white mb-0.5">
                            {ar ? step.titleAr : step.titleEn}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            {ar ? step.descAr : step.descEn}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Rewards */}
                  <div className="space-y-3">
                    <h4 className={cn('text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest', ar ? 'text-right' : 'text-left')}>
                      {ar ? 'المكافآت' : 'Rewards'}
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { icon: Compass, label: ar ? 'وسام مستكشف' : 'Explorer Badge',     xp: `+${GAME_LEVEL_XP.explorer} XP`,      color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50' },
                        { icon: Search,  label: ar ? 'وسام باحث'    : 'Researcher Badge',   xp: `+${GAME_LEVEL_XP.researcher} XP`,    color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50' },
                        { icon: Crown,   label: ar ? 'وسام متميز'   : 'Distinguished Badge', xp: `+${GAME_LEVEL_XP.distinguished} XP`, color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50' },
                      ].map((r, i) => (
                        <div key={i} className={cn('rounded-2xl border p-3 flex flex-col items-center gap-2 text-center', r.bg)}>
                          <r.icon className={cn('w-5 h-5', r.color)} />
                          <span className="text-[9px] font-black text-primary dark:text-white leading-tight">{r.label}</span>
                          <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-lg bg-white/60 dark:bg-white/5', r.color)}>{r.xp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tip */}
                  <div className={cn('flex items-start gap-2.5 p-4 rounded-2xl bg-accent/8 dark:bg-accent/10 border border-accent/20', ar ? 'flex-row-reverse text-right' : 'text-left')}>
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">
                      {ar
                        ? 'تلميح: افتح خريطة المكتبة أولاً لكسب XP يساعدك على إلغاء قفل اللعبة بشكل أسرع.'
                        : 'Tip: Open the library map first to earn XP that helps you unlock the game faster.'}
                    </p>
                  </div>

                  {/* CTA buttons */}
                  <div className={cn('flex gap-3', ar ? 'flex-row-reverse' : '')}>
                    <button
                      onClick={() => { setShowInfo(false); navigate('/cognitive-ar'); }}
                      className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary dark:bg-accent text-white dark:text-primary font-black text-xs uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-primary/15"
                    >
                      <Gamepad2 className="w-4 h-4" />
                      {ar ? 'العب الآن' : 'Play Now'}
                      {ar ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setShowInfo(false)}
                      className="px-5 py-4 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-widest hover:border-slate-300 dark:hover:border-white/20 transition-all"
                    >
                      {ar ? 'إغلاق' : 'Close'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══════════════════════════ HUB ═══════════════════════════ */}
      {phase === 'hub' && (
        <div className="space-y-5">

          {/* Instruction banner */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-emerald-500/8 to-amber-500/10 border border-teal-500/20"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-teal-400" />
            </div>
            <p className="text-sm font-black text-primary dark:text-white leading-snug">
              {ar
                ? 'أجب عن ثلثي الأسئلة لتكسب الوسام — وكل إجابة تشرح سببها'
                : 'Answer two thirds of the questions to earn the badge — every answer explains itself'}
            </p>
          </motion.div>

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
                      {ar ? '١ أسئلة' : '1 Questions'}
                    </span>
                    <span>→</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                      {ar ? '٢ الشرح' : '2 Why'}
                    </span>
                    <span>→</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                      {ar ? '٣ وسام' : '3 Badge'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span dir="ltr">⏱ {lvl.seconds}s</span>
                    <span>⭐ ×3</span>
                    <span className={lvl.color}>
                      <span dir="ltr">{passMarkFor(lvl.questionCount)} / {lvl.questionCount}</span>{' '}
                      {ar ? 'للنجاح' : 'to pass'}
                    </span>
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
                      : (ar ? '▶ ابدأ الجولة' : '▶ Start Round')}
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
                { emoji: '❓', ar: 'اقرأ السؤال واختر الإجابة قبل انتهاء وقتها', en: 'Read the question and choose before its timer runs out' },
                { emoji: '💡', ar: 'بعد كل إجابة يظهر سبب صحّتها — صحيحة كانت أم خاطئة', en: 'After every answer you see why it is right — whether you got it or not' },
                { emoji: '⭐', ar: 'الخطأ أو انتهاء الوقت يكلّفك نجمة، وثلاث نجوم تنهي الجولة', en: 'A wrong answer or a timeout costs a star; three stars end the round' },
                { emoji: '🏅', ar: 'أجب عن ثلثي الأسئلة لتكسب وسام المستوى ونقاط خبرته', en: 'Answer two thirds correctly to earn the level badge and its XP' },
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
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950"
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
                {countdownDone ? '…' : countdown}
              </motion.div>
              <div className="text-white/50 font-bold text-sm">
                {countdownDone && loading
                  ? (ar ? 'جاري تجهيز الأسئلة…' : 'Preparing the questions…')
                  : (ar ? 'استعدّ...' : 'Get ready...')}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════════════════ QUESTION ROUND ═══════════════════ */}
      <AnimatePresence>
        {phase === 'playing' && activeLevel && round && current && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            dir={dir}
            className="fixed inset-0 z-[70] bg-slate-950 flex flex-col select-none"
          >
            <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
              style={{ backgroundImage: 'linear-gradient(rgba(0,220,180,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,220,180,1) 1px,transparent 1px)', backgroundSize: '44px 44px' }} />

            {/* HUD — stars, clock, progress */}
            <div className="relative z-10 px-4 pt-4 pb-3 border-b border-white/5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} animate={i >= round.stars ? { scale: [1.3, 0.8, 1] } : {}} transition={{ duration: 0.3 }}>
                    {i < round.stars
                      ? <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      : <StarOff className="w-5 h-5 text-slate-700" />}
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col items-center">
                <div className={cn('text-2xl font-black tabular-nums', timeLeft <= 5 ? 'text-red-400' : timeLeft <= 10 ? 'text-amber-400' : 'text-white')}>
                  {Math.max(0, timeLeft)}
                </div>
                <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                  <motion.div
                    className={cn('h-full rounded-full', timeLeft <= 5 ? 'bg-red-400' : 'bg-teal-400')}
                    animate={{ width: `${(timeLeft / activeLevel.seconds) * 100}%` }}
                    transition={{ duration: 0.4, ease: 'linear' }}
                  />
                </div>
              </div>

              <div className="text-end">
                <div className="text-lg font-black text-white tabular-nums" dir="ltr">
                  {round.index + 1} / {round.questions.length}
                </div>
                <div dir="ltr" className={cn('text-[10px] font-black uppercase tracking-widest transition-colors', round.combo >= 6 ? 'text-amber-400' : round.combo >= 3 ? 'text-emerald-400' : 'text-slate-600')}>
                  {round.combo >= 3 ? `×${Math.min(4, 1 + Math.floor(round.combo / 3))} 🔥` : `${round.score} PTS`}
                </div>
              </div>
            </div>

            {/* Question card */}
            <div className="relative z-10 flex-1 min-h-0 overflow-y-auto flex items-start sm:items-center justify-center p-4 sm:p-6">
              <motion.div
                key={round.index}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl space-y-4"
              >
                {/* Skill tag */}
                <div className="flex items-center justify-center">
                  <span className={cn('text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-xl', activeLevel.bg, activeLevel.color)}>
                    {SKILL_LABEL[current.q.skill][ar ? 'ar' : 'en']}
                  </span>
                </div>

                {/* The question */}
                <p className="text-white font-black text-lg sm:text-2xl leading-snug text-center px-1">
                  {ar ? current.q.qAr : current.q.qEn}
                </p>

                {/* Options */}
                <div className="space-y-2.5 pt-1">
                  {current.options.map((opt, oi) => {
                    const isSelected = round.selected === oi;
                    let cls = 'bg-white/5 border-white/10 text-white/85 hover:bg-white/10';
                    if (revealed) {
                      if (opt.correct)      cls = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200';
                      else if (isSelected)  cls = 'bg-red-500/20 border-red-500/60 text-red-200';
                      else                  cls = 'bg-white/3 border-white/5 text-white/30';
                    }
                    return (
                      <motion.button
                        key={oi}
                        whileHover={!revealed ? { scale: 1.01 } : {}}
                        whileTap={!revealed ? { scale: 0.99 } : {}}
                        onClick={() => resolve(oi)}
                        disabled={revealed}
                        className={cn('w-full px-4 py-4 rounded-2xl border-2 text-sm sm:text-base font-bold text-start transition-all', cls)}
                      >
                        <span className={cn('flex items-center gap-3', ar ? 'flex-row-reverse text-right' : '')}>
                          <span className={cn('w-7 h-7 rounded-full border flex items-center justify-center text-[11px] font-black shrink-0',
                            revealed && opt.correct ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200'
                              : revealed && isSelected ? 'bg-red-500/30 border-red-400 text-red-200'
                              : 'border-white/20 text-white/50')}>
                            {revealed && opt.correct ? '✓' : revealed && isSelected ? '✗' : String.fromCharCode(65 + oi)}
                          </span>
                          <span className="flex-1 leading-snug">{ar ? opt.ar : opt.en}</span>
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Why — the part that teaches */}
                <AnimatePresence>
                  {revealed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="overflow-hidden"
                    >
                      <div className={cn('rounded-2xl border p-4 space-y-2',
                        round.outcome === 'right' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30')}>
                        <div className={cn('flex items-center gap-2 text-[11px] font-black uppercase tracking-widest',
                          round.outcome === 'right' ? 'text-emerald-400' : 'text-amber-400', ar ? 'flex-row-reverse' : '')}>
                          {round.outcome === 'right'
                            ? <><CheckCircle2 className="w-4 h-4" />{ar ? 'إجابة صحيحة' : 'Correct'}</>
                            : round.outcome === 'timeout'
                            ? <><Timer className="w-4 h-4" />{ar ? 'انتهى الوقت' : 'Time up'}</>
                            : <><XCircle className="w-4 h-4" />{ar ? 'إجابة خاطئة' : 'Not quite'}</>}
                        </div>
                        <div className={cn('flex items-start gap-2.5', ar ? 'flex-row-reverse text-right' : '')}>
                          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-sm text-white/80 font-medium leading-relaxed">
                            {ar ? current.q.whyAr : current.q.whyEn}
                          </p>
                        </div>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={advance}
                        className="mt-3 w-full py-3.5 rounded-2xl bg-white text-primary font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        {round.index >= round.questions.length - 1 || round.stars <= 0
                          ? (ar ? 'إنهاء الجولة' : 'Finish round')
                          : (ar ? 'السؤال التالي' : 'Next question')}
                        <ArrowLeft className={cn('w-4 h-4', ar ? '' : 'rotate-180')} />
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Bottom progress */}
            <div className="relative z-10 px-6 pb-5 flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div className="h-full rounded-full bg-teal-400"
                  animate={{ width: `${(round.correct / passMark) * 100}%` }} />
              </div>
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest whitespace-nowrap">
                <span dir="ltr">{round.correct} / {passMark}</span> {ar ? 'للنجاح' : 'to pass'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ═══════════════════ RESULT SCREEN ═══════════════════ */}
      <AnimatePresence>
        {phase === 'result' && activeLevel && round && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-6"
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
                <div className="text-3xl font-black text-white" dir="ltr">
                  {round.correct} / {round.questions.length}
                </div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  {ar ? 'إجابات صحيحة' : 'correct answers'}
                </div>
                {won && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-black">
                    <Zap className="w-4 h-4" /> +{activeLevel.xp} XP {ar ? 'مكتسبة' : 'earned'}
                  </div>
                )}
                {!won && (
                  <div className="text-sm text-slate-400 font-medium">
                    {round.stars <= 0
                      ? (ar ? 'نفدت النجوم الثلاث — أعد المحاولة' : 'All three stars gone — try again')
                      : ar
                        ? `تحتاج ${passMark} إجابات صحيحة على الأقل`
                        : `You need at least ${passMark} correct answers`}
                  </div>
                )}
              </div>

              <div className="relative z-10 grid grid-cols-3 gap-3 pt-2 border-t border-white/5">
                {[
                  { label: ar ? 'النقاط' : 'Points', val: `${round.score}` },
                  { label: ar ? 'أعلى كومبو' : 'Max Combo', val: `×${round.maxCombo}` },
                  { label: ar ? 'النجوم المتبقية' : 'Stars Left', val: `${round.stars}/3` },
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
