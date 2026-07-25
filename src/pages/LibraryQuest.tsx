import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Trophy, Lightbulb, ChevronRight, ArrowLeft, CheckCircle2, XCircle, Star, MapPin, Lock } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';
import { MOCK_BOOKS } from '../data/mockData';

const BOOK_MAP = Object.fromEntries(MOCK_BOOKS.map(b => [b.id, b]));
const XP_PER_STAGE = 50;

const QUESTS = [
  {
    id: 'stars',
    emoji: '🌌',
    titleAr: 'رحلة إلى النجوم',
    titleEn: 'Journey to the Stars',
    sectionAr: 'القسم أ — الفيزياء',
    sectionEn: 'Section A — Physics',
    colorClass: 'text-indigo-500',
    borderClass: 'border-indigo-500/20',
    bgClass: 'bg-indigo-500/10',
    glowClass: 'shadow-indigo-500/20',
    storyAr: 'عالِم فلكي غامض ترك ثلاثة أدلة مخفية في قسم الفيزياء (A). تتبّع خيوطه واكتشف الكتب الثلاثة لفك شيفرة رسالته السرية.',
    storyEn: 'A mysterious astronomer left three hidden clues in the Physics section (A). Follow the trail and identify all three books to decode their secret message.',
    stages: [
      {
        riddleAr: 'أصابه المرض وحبسه في كرسيّه، لكنّ عقله حلّق إلى حواف الكون. كتابه يبدأ من نقطة الانفجار الكبير ولا ينتهي.',
        riddleEn: 'Illness confined him to a chair, yet his mind reached the edges of the universe. His book begins at the Big Bang and never truly ends.',
        locationAr: '📍 الرف A-1',
        locationEn: '📍 Shelf A-1',
        hintAr: 'هو الفيزيائي الأشهر في القرن العشرين — وعنوان كتابه يحمل كلمة "الزمن".',
        hintEn: 'The most famous physicist of the 20th century — his book\'s title contains the word "time".',
        correctId: '1',
        options: ['1', '3', '4'],
      },
      {
        riddleAr: 'إيطالي رسم عظمة الكون في سبع لوحات فقط. كتابه أشبه بقصيدة علمية يُقرأ على الشاطئ.',
        riddleEn: 'An Italian painted the grandeur of the cosmos in just seven strokes. His book reads like a scientific poem you\'d enjoy at the beach.',
        locationAr: '📍 الرف A-1',
        locationEn: '📍 Shelf A-1',
        hintAr: 'الكتاب يحمل رقماً في عنوانه — اعدد الدروس.',
        hintEn: 'The book has a number in its title — count the lessons.',
        correctId: '3',
        options: ['3', '2', '5'],
      },
      {
        riddleAr: 'فيزيائي فاز بالنوبل وعُرف بموهبة تبسيط المعقد. محاضراته في كاليفورنيا أصبحت أسطورة علمية.',
        riddleEn: 'A Nobel prize-winning physicist famous for making the complex simple. His California lectures became scientific legend.',
        locationAr: '📍 الرف A-1',
        locationEn: '📍 Shelf A-1',
        hintAr: 'اسمه "فاينمان" — فيزيائي أمريكي أحبّ الطبول والألغاز.',
        hintEn: 'His name is Feynman — an American physicist who loved drums and mysteries.',
        correctId: '4',
        options: ['4', '1', '2'],
      },
    ],
  },
  {
    id: 'machine',
    emoji: '🤖',
    titleAr: 'عقل الآلة',
    titleEn: 'Mind of the Machine',
    sectionAr: 'القسم ب — الهندسة',
    sectionEn: 'Section B — Engineering',
    colorClass: 'text-violet-500',
    borderClass: 'border-violet-500/20',
    bgClass: 'bg-violet-500/10',
    glowClass: 'shadow-violet-500/20',
    storyAr: 'مهندس ذكاء اصطناعي ترك رسائل مشفّرة في قسم الهندسة (B). فكّ شيفرة الكتب الثلاثة لتصبح خبيراً في عالم التكنولوجيا.',
    storyEn: 'An AI engineer left encrypted messages in the Engineering section (B). Decode the three books to become a technology master.',
    stages: [
      {
        riddleAr: 'مرجع عالمي كتبه عقلان لا عقل واحد. يغطي كل شيء — من الخوارزميات إلى الشبكات العصبية.',
        riddleEn: 'A global reference written by two minds, not one. It covers everything from algorithms to neural networks.',
        locationAr: '📍 الرف B-1',
        locationEn: '📍 Shelf B-1',
        hintAr: 'عنوانه يبدأ بـ"الذكاء الاصطناعي" وهو الكتاب الأكثر تدريساً في كليات الحاسوب.',
        hintEn: 'Its title begins with "Artificial Intelligence" and it\'s the most widely taught CS textbook.',
        correctId: '6',
        options: ['6', '7', '9'],
      },
      {
        riddleAr: 'لقّبوه بـ"العم بوب". نصيحته للمبرمجين: النظافة أهم من الذكاء.',
        riddleEn: 'They called him "Uncle Bob". His advice to programmers: cleanliness beats cleverness.',
        locationAr: '📍 الرف B-2',
        locationEn: '📍 Shelf B-2',
        hintAr: 'فكّر في "كود" + "نظيف" — الكلمتان معاً هما عنوان الكتاب.',
        hintEn: 'Think "clean" + "code" — both words together are the book\'s title.',
        correctId: '7',
        options: ['7', '8', '9'],
      },
      {
        riddleAr: 'المبرمج الذي يفكّر مثل فيلسوف. كتابه يعلّم حِرفة البرمجة لا مجرد أوامرها.',
        riddleEn: 'The programmer who thinks like a philosopher. This book teaches the craft of coding, not just the commands.',
        locationAr: '📍 الرف B-2',
        locationEn: '📍 Shelf B-2',
        hintAr: '"البراغماتي" وصفٌ لمؤلّفه — وكلمة براغماتي موجودة في العنوان.',
        hintEn: '"Pragmatic" describes the author — and the word appears in the title.',
        correctId: '8',
        options: ['8', '7', '6'],
      },
    ],
  },
  {
    id: 'mind',
    emoji: '🧠',
    titleAr: 'أسرار العقل',
    titleEn: 'Secrets of the Mind',
    sectionAr: 'القسم ج — الإنسانيات',
    sectionEn: 'Section C — Humanities',
    colorClass: 'text-amber-500',
    borderClass: 'border-amber-500/20',
    bgClass: 'bg-amber-500/10',
    glowClass: 'shadow-amber-500/20',
    storyAr: 'عالِم نفس ترك ثلاثة أدلة في قسم الإنسانيات (C). اكتشف الكتب التي تشكّل فهمه لأسرار العقل البشري.',
    storyEn: 'A psychologist left three clues in the Humanities section (C). Discover the books that form their understanding of the human mind.',
    stages: [
      {
        riddleAr: 'حائز على نوبل أثبت أننا نُخطئ حتى حين نظنّ أننا محقّون. عقلنا نظامان — أحدهما سريع والآخر بطيء.',
        riddleEn: 'A Nobel laureate proved we are wrong even when we think we are right. Our mind runs two systems — one fast, one slow.',
        locationAr: '📍 الرف C-1',
        locationEn: '📍 Shelf C-1',
        hintAr: '"سريع" و"بطيء" — الكلمتان كلتاهما في عنوان الكتاب.',
        hintEn: '"Fast" and "Slow" — both words appear in the book\'s title.',
        correctId: '11',
        options: ['11', '12', '28'],
      },
      {
        riddleAr: 'ناجٍ من المحرقة النازية حوّل مأساته إلى فلسفة. أثبت أن الإنسان يتحمّل أيّ معاناة إذا وجد لها معنى.',
        riddleEn: 'A Holocaust survivor turned his tragedy into philosophy. He proved that humans endure any suffering when they find meaning in it.',
        locationAr: '📍 الرف C-2',
        locationEn: '📍 Shelf C-2',
        hintAr: 'الكتاب يبحث عن "معنى" — وعنوانه يبدأ بـ"الإنسان".',
        hintEn: 'The book searches for "meaning" — and its title starts with "Man\'s Search".',
        correctId: '14',
        options: ['14', '13', '15'],
      },
      {
        riddleAr: 'درس سلوك المستهلكين والمفاوضين والسياسيين. وجد ستة مفاتيح تفتح عقل أيّ إنسان.',
        riddleEn: 'He studied consumers, negotiators, and politicians. He found six keys that unlock any human mind.',
        locationAr: '📍 الرف C-2',
        locationEn: '📍 Shelf C-2',
        hintAr: 'كتابه عن فن "التأثير" وعلم "الإقناع".',
        hintEn: 'His book is titled "Influence" — and its subtitle mentions "Persuasion".',
        correctId: '15',
        options: ['15', '13', '29'],
      },
    ],
  },
];

type Phase = 'list' | 'story' | 'playing' | 'complete';

function loadCompleted(): Set<string> {
  try {
    const raw = localStorage.getItem('library_quest_completed');
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

export function LibraryQuest() {
  const { language, dir } = useLanguage();
  const ar = language === 'ar';

  const [phase, setPhase] = useState<Phase>('list');
  const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
  const [stageIndex, setStageIndex] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [completedQuests, setCompletedQuests] = useState<Set<string>>(loadCompleted);

  const activeQuest = QUESTS.find(q => q.id === activeQuestId)!;
  const currentStage = activeQuest?.stages[stageIndex];
  const isCorrect = chosen === currentStage?.correctId;

  const startQuest = (id: string) => {
    setActiveQuestId(id);
    setStageIndex(0);
    setXpEarned(0);
    setChosen(null);
    setShowResult(false);
    setShowHint(false);
    setPhase('story');
  };

  const handleAnswer = (bookId: string) => {
    if (showResult) return;
    setChosen(bookId);
    setShowResult(true);
    if (bookId === currentStage?.correctId) {
      setXpEarned(prev => prev + XP_PER_STAGE);
    }
  };

  const handleNext = () => {
    if (!activeQuest) return;
    if (stageIndex < activeQuest.stages.length - 1) {
      setStageIndex(i => i + 1);
      setChosen(null);
      setShowResult(false);
      setShowHint(false);
    } else {
      const updated = new Set(completedQuests);
      updated.add(activeQuestId!);
      setCompletedQuests(updated);
      localStorage.setItem('library_quest_completed', JSON.stringify([...updated]));
      setPhase('complete');
    }
  };

  return (
    <div className={cn('max-w-2xl mx-auto px-4 py-8 space-y-6', dir === 'rtl' ? 'text-right' : 'text-left')} dir={dir}>

      {/* ── LIST ── */}
      <AnimatePresence mode="wait">
        {phase === 'list' && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">

            {/* Header */}
            <div className="space-y-1">
              <div className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Gamepad2 className="w-4 h-4 text-emerald-500" />
                </div>
                <h1 className="text-xl font-black text-primary dark:text-white">
                  {ar ? 'مغامرة المكتبة' : 'Library Adventure'}
                </h1>
              </div>
              <p className="text-[12px] text-slate-400 font-bold">
                {ar
                  ? 'حلّ الألغاز، اكتشف الكتب، اكسب نقاط XP — ثلاث مغامرات تنتظرك في أقسام المكتبة'
                  : 'Solve riddles, discover books, earn XP — three adventures await across the library sections'}
              </p>
            </div>

            {/* Quest cards */}
            <div className="space-y-3">
              {QUESTS.map((quest, i) => {
                const done = completedQuests.has(quest.id);
                return (
                  <motion.button
                    key={quest.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 24 }}
                    onClick={() => startQuest(quest.id)}
                    className={cn(
                      'w-full p-5 rounded-2xl border bg-white dark:bg-slate-900 transition-all shadow-sm',
                      'hover:shadow-md active:scale-[0.98]',
                      done ? 'border-emerald-500/20 dark:border-emerald-500/10' : 'border-slate-100 dark:border-white/8',
                      dir === 'rtl' ? 'text-right' : 'text-left'
                    )}
                  >
                    <div className={cn('flex items-start gap-4', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                      <div className={cn('w-12 h-12 rounded-2xl border flex items-center justify-center text-xl shrink-0', quest.bgClass, quest.borderClass)}>
                        {quest.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                          <p className="text-sm font-black text-primary dark:text-white">
                            {ar ? quest.titleAr : quest.titleEn}
                          </p>
                          {done && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                        </div>
                        <p className={cn('text-[10px] font-bold mt-0.5 flex items-center gap-1', quest.colorClass)}>
                          <MapPin className="w-3 h-3" />
                          {ar ? quest.sectionAr : quest.sectionEn}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1.5 leading-snug line-clamp-2">
                          {ar ? quest.storyAr : quest.storyEn}
                        </p>
                        <div className={cn('flex items-center gap-3 mt-2.5', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                          <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-0.5 rounded-lg">
                            3 {ar ? 'مراحل' : 'stages'}
                          </span>
                          <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-0.5 rounded-lg">
                            +{XP_PER_STAGE * 3} XP
                          </span>
                          {done && (
                            <span className="text-[9px] font-black bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                              {ar ? '✓ مكتمل' : '✓ done'}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={cn('w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mt-1', dir === 'rtl' ? 'rotate-180' : '')} />
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* XP summary */}
            {completedQuests.size > 0 && (
              <div className={cn('flex items-center gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                <Trophy className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-300">
                  {ar
                    ? `أتممت ${completedQuests.size} من 3 مغامرات — ${completedQuests.size * XP_PER_STAGE * 3} XP مكتسبة`
                    : `${completedQuests.size} of 3 adventures complete — ${completedQuests.size * XP_PER_STAGE * 3} XP earned`}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── STORY ── */}
        {phase === 'story' && activeQuest && (
          <motion.div key="story" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">
            <button
              onClick={() => setPhase('list')}
              className={cn('flex items-center gap-1.5 text-[11px] font-black text-slate-400 hover:text-primary dark:hover:text-white transition-colors', dir === 'rtl' ? 'flex-row-reverse' : '')}
            >
              <ArrowLeft className={cn('w-3.5 h-3.5', dir === 'rtl' ? 'rotate-180' : '')} />
              {ar ? 'العودة' : 'Back'}
            </button>

            <div className={cn('p-6 rounded-2xl border bg-white dark:bg-slate-900 space-y-5 shadow-sm', activeQuest.borderClass)}>
              <div className="text-4xl text-center">{activeQuest.emoji}</div>
              <div className="text-center space-y-1">
                <h2 className="text-lg font-black text-primary dark:text-white">
                  {ar ? activeQuest.titleAr : activeQuest.titleEn}
                </h2>
                <p className={cn('text-[10px] font-bold flex items-center justify-center gap-1', activeQuest.colorClass)}>
                  <MapPin className="w-3 h-3" />
                  {ar ? activeQuest.sectionAr : activeQuest.sectionEn}
                </p>
              </div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed text-center">
                {ar ? activeQuest.storyAr : activeQuest.storyEn}
              </p>
              <div className={cn('flex items-center justify-center gap-4 text-[9px] font-black text-slate-400')}>
                {activeQuest.stages.map((_, i) => (
                  <div key={i} className={cn('flex items-center gap-1', activeQuest.colorClass)}>
                    <div className={cn('w-5 h-5 rounded-full border flex items-center justify-center text-[8px] font-black', activeQuest.bgClass, activeQuest.borderClass)}>
                      {i + 1}
                    </div>
                    {ar ? `الدليل ${i + 1}` : `Clue ${i + 1}`}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setPhase('playing')}
                className={cn(
                  'w-full py-3.5 rounded-xl text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-95',
                  activeQuest.id === 'stars' ? 'bg-indigo-600' : activeQuest.id === 'machine' ? 'bg-violet-600' : 'bg-amber-600'
                )}
              >
                {ar ? 'ابدأ المغامرة' : 'Begin Adventure'}
                <ChevronRight className={cn('w-4 h-4', dir === 'rtl' ? 'rotate-180' : '')} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── PLAYING ── */}
        {phase === 'playing' && activeQuest && currentStage && (
          <motion.div key={`playing-${stageIndex}`} initial={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-5">

            {/* Top bar */}
            <div className={cn('flex items-center justify-between', dir === 'rtl' ? 'flex-row-reverse' : '')}>
              <button
                onClick={() => setPhase('list')}
                className={cn('flex items-center gap-1.5 text-[11px] font-black text-slate-400 hover:text-primary dark:hover:text-white transition-colors', dir === 'rtl' ? 'flex-row-reverse' : '')}
              >
                <ArrowLeft className={cn('w-3.5 h-3.5', dir === 'rtl' ? 'rotate-180' : '')} />
                {ar ? 'الخروج' : 'Exit'}
              </button>
              <div className={cn('flex items-center gap-1.5', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                {activeQuest.stages.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all',
                      i < stageIndex ? 'bg-emerald-500' : i === stageIndex ? (activeQuest.id === 'stars' ? 'bg-indigo-500' : activeQuest.id === 'machine' ? 'bg-violet-500' : 'bg-amber-500') : 'bg-slate-200 dark:bg-slate-700'
                    )}
                  />
                ))}
              </div>
              <span className="text-[11px] font-black text-slate-400">
                {xpEarned} XP
              </span>
            </div>

            {/* Riddle card */}
            <div className="relative p-5 rounded-2xl bg-slate-900 dark:bg-slate-950 border border-white/5 overflow-hidden">
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0%, transparent 60%)' }} />
              <p className={cn('text-[9px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5', activeQuest.colorClass, dir === 'rtl' ? 'flex-row-reverse' : '')}>
                <Lock className="w-3 h-3" />
                {ar ? `الدليل ${stageIndex + 1}` : `Clue ${stageIndex + 1}`}
              </p>
              <p className="text-sm font-bold text-white leading-relaxed">
                {ar ? currentStage.riddleAr : currentStage.riddleEn}
              </p>
              <p className={cn('text-[10px] font-black mt-2.5', activeQuest.colorClass)}>
                {ar ? currentStage.locationAr : currentStage.locationEn}
              </p>
            </div>

            {/* Hint */}
            {!showResult && (
              <button
                onClick={() => setShowHint(true)}
                className={cn(
                  'flex items-center gap-1.5 text-[11px] font-black transition-all px-3 py-1.5 rounded-xl',
                  showHint ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' : 'text-slate-400 hover:text-amber-500',
                  dir === 'rtl' ? 'flex-row-reverse' : ''
                )}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                {showHint
                  ? (ar ? currentStage.hintAr : currentStage.hintEn)
                  : (ar ? 'اظهر تلميحاً' : 'Show a hint')}
              </button>
            )}

            {/* Book options */}
            <div className="space-y-2.5">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                {ar ? 'أيّ هذه الكتب يقصد اللغز؟' : 'Which book does the riddle describe?'}
              </p>
              {currentStage.options.map(bookId => {
                const book = BOOK_MAP[bookId];
                if (!book) return null;
                const isChosen = chosen === bookId;
                const isCorrectBook = bookId === currentStage.correctId;
                let cardClass = 'border-slate-100 dark:border-white/8 bg-white dark:bg-slate-900';
                if (showResult && isChosen && isCorrectBook) cardClass = 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20';
                if (showResult && isChosen && !isCorrectBook) cardClass = 'border-rose-500/40 bg-rose-50 dark:bg-rose-950/20';
                if (showResult && !isChosen && isCorrectBook) cardClass = 'border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/10';

                return (
                  <motion.button
                    key={bookId}
                    onClick={() => handleAnswer(bookId)}
                    disabled={showResult}
                    whileTap={!showResult ? { scale: 0.98 } : {}}
                    className={cn(
                      'w-full p-4 rounded-xl border transition-all',
                      cardClass,
                      !showResult && 'hover:border-slate-200 dark:hover:border-white/15 cursor-pointer',
                      showResult && 'cursor-default',
                      dir === 'rtl' ? 'text-right' : 'text-left'
                    )}
                  >
                    <div className={cn('flex items-center gap-3', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-primary dark:text-white leading-tight">
                          {ar ? book.title : (book.titleEn ?? book.title)}
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 mt-0.5">{ar ? book.author : (book.authorEn ?? book.author)} — {book.shelf}</p>
                      </div>
                      {showResult && isChosen && isCorrectBook && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                      {showResult && isChosen && !isCorrectBook && <XCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                      {showResult && !isChosen && isCorrectBook && <Star className="w-5 h-5 text-emerald-400 shrink-0" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Result + next */}
            <AnimatePresence>
              {showResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div className={cn('p-4 rounded-xl border', isCorrect ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30' : 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30')}>
                    <p className={cn('text-xs font-black', isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300')}>
                      {isCorrect
                        ? (ar ? `✓ ممتاز! +${XP_PER_STAGE} XP` : `✓ Correct! +${XP_PER_STAGE} XP`)
                        : (ar ? `✗ ليس هذا الكتاب — الإجابة الصحيحة موضّحة أعلاه` : `✗ Not quite — the correct book is highlighted above`)}
                    </p>
                  </div>
                  <button
                    onClick={handleNext}
                    className={cn(
                      'w-full py-3.5 rounded-xl text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-95',
                      activeQuest.id === 'stars' ? 'bg-indigo-600' : activeQuest.id === 'machine' ? 'bg-violet-600' : 'bg-amber-600'
                    )}
                  >
                    {stageIndex < activeQuest.stages.length - 1
                      ? (ar ? 'الدليل التالي' : 'Next Clue')
                      : (ar ? 'إنهاء المغامرة' : 'Finish Adventure')}
                    <ChevronRight className={cn('w-4 h-4', dir === 'rtl' ? 'rotate-180' : '')} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── COMPLETE ── */}
        {phase === 'complete' && activeQuest && (
          <motion.div key="complete" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-5">
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/8 shadow-sm text-center space-y-4">
              <motion.div
                animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.15, 1.1, 1.12, 1.08, 1] }}
                transition={{ duration: 0.8, ease: 'easeInOut' }}
                className="text-5xl"
              >
                🏆
              </motion.div>
              <div>
                <p className={cn('text-[10px] font-black uppercase tracking-widest mb-1', activeQuest.colorClass)}>
                  {ar ? 'مغامرة مكتملة!' : 'Adventure Complete!'}
                </p>
                <h2 className="text-lg font-black text-primary dark:text-white">
                  {ar ? activeQuest.titleAr : activeQuest.titleEn}
                </h2>
              </div>
              <div className={cn('inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-black', activeQuest.bgClass, activeQuest.borderClass, activeQuest.colorClass)}>
                <Star className="w-4 h-4 fill-current" />
                +{xpEarned} XP {ar ? 'مكتسبة' : 'earned'}
              </div>
              <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                {ar
                  ? `اكتشفت ${activeQuest.stages.length} كتباً في ${ar ? activeQuest.sectionAr : activeQuest.sectionEn}. استعرها مرة أخرى في المكتبة وأضفها لقائمة قراءتك.`
                  : `You discovered ${activeQuest.stages.length} books in ${activeQuest.sectionEn}. Visit them in the library and add them to your reading list.`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPhase('list')}
                className="py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-black text-primary dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
              >
                {ar ? 'مغامرة أخرى' : 'Another Quest'}
              </button>
              <button
                onClick={() => { setPhase('story'); setStageIndex(0); setXpEarned(0); setChosen(null); setShowResult(false); setShowHint(false); }}
                className={cn(
                  'py-3 rounded-xl text-white text-xs font-black transition-all hover:brightness-110',
                  activeQuest.id === 'stars' ? 'bg-indigo-600' : activeQuest.id === 'machine' ? 'bg-violet-600' : 'bg-amber-600'
                )}
              >
                {ar ? 'أعِد المغامرة' : 'Replay Quest'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
