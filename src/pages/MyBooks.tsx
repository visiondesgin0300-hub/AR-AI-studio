import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { MOCK_BOOKS } from '../data/mockData';
import {
  Award, BookOpen, Clock,
  User as UserIcon,
  Navigation, Flame, Target, BookMarked, Timer,
  Trophy, ArrowDown, ArrowUp, ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getEarnedBadges, displayName, bookTitle, bookAuthor } from '../lib/utils';
import { useXP } from '../hooks/useXP';
import { useLanguage } from '../hooks/useLanguage';
import { BookCover } from '../components/BookCover';
import { BadgesCabinet } from '../components/BadgesCabinet';

interface MyBooksProps { user: User }

export function MyBooks({ user }: MyBooksProps) {
  const navigate = useNavigate();
  const { t, language, dir } = useLanguage();
  const ar = language === 'ar';

  const [activeTab, setActiveTab]         = useState<'books' | 'achievements'>('books');
  const [sortOrder, setSortOrder]         = useState<'newest' | 'oldest'>('newest');
  const earnedBadges = getEarnedBadges(user);
  const xp           = useXP();
  const xpInLevel    = xp % 100;
  const xpToNext     = 100 - xpInLevel;

  const catLabel: Record<string, string> = {
    'فيزياء': t('physics'), 'هندسة': t('engineering'),
    'علم نفس': t('psychology'), 'عام': t('general'),
  };

  // ─── borrowed books ───────────────────────────────────────────────────────────
  const borrowedBooks = useMemo(() => {
    return MOCK_BOOKS.filter(b => user.borrowedBooks.includes(b.id))
      .map(book => {
        const borrow  = new Date(2024, 3, parseInt(book.id) * 5);
        const ret     = new Date(borrow.getTime() + 14 * 86400000);
        const now     = new Date(2024, 3, 22);
        const daysLeft = Math.ceil((ret.getTime() - now.getTime()) / 86400000);
        const locale  = ar ? 'ar-EG' : 'en-US';
        const fmt: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        return {
          ...book,
          returnDate: ret.toLocaleDateString(locale, fmt),
          borrowTs:   borrow.getTime(),
          daysLeft,
          progress:   ((parseInt(book.id) * 13) % 61) + 20,
        };
      })
      .sort((a, b) => sortOrder === 'newest' ? b.borrowTs - a.borrowTs : a.borrowTs - b.borrowTs);
  }, [user.borrowedBooks, sortOrder, language]);

  const stats = {
    books:    user.borrowedBooks.length,
    hours:    borrowedBooks.reduce((s, b) => s + Math.round((b.progress / 100) * 6), 0),
    streak:   7 + Math.floor(xp / 200),
    badges:   earnedBadges.length,
  };

  return (
    <div dir={dir} className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-20">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2rem] bg-primary p-5 sm:p-8 md:p-10">
        {/* decorations */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-end gap-8">
          {/* avatar + name */}
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <span className="text-2xl font-black text-white uppercase">{displayName(user, language).charAt(0)}</span>
            </div>
            <div>
              <div className={cn('flex items-center gap-2 flex-wrap', ar ? 'flex-row-reverse' : '')}>
                <h1 className="text-2xl font-black text-white">{displayName(user, language)}</h1>
              </div>
              {/* The joining date used to be printed here as a fixed string. No
                  account in the application carries one, so it was the same
                  sentence for every reader whatever their account. */}
              <p className="text-white/50 text-xs font-bold mt-1">{user.email}</p>
            </div>
          </div>

          {/* Stats: two across on a phone. As a wrapping row each pill took a
              line of its own, so four numbers filled the screen and pushed the
              points bar out of sight. */}
          <div className="w-full grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:gap-3 md:ms-auto md:w-auto">
            {[
              { icon: BookMarked, label: t('journeyTotalBooks'),        value: stats.books   },
              { icon: Timer,      label: t('journeyHours'),             value: stats.hours   },
              { icon: Flame,      label: t('journeyStreak'),            value: stats.streak  },
              { icon: Trophy,     label: t('journeyAchievementsCount'), value: stats.badges  },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/8 border border-white/10 rounded-2xl px-3.5 sm:px-5 py-3 flex items-center gap-2.5 sm:gap-3 min-w-0 sm:shrink-0">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white/70" />
                </div>
                <div className="min-w-0">
                  {/* Wraps rather than truncates: at two across, "Books in
                      journey" was cut to "Books in the…". */}
                  <div className="text-[9px] font-black text-white/50 uppercase tracking-widest leading-tight">{label}</div>
                  <div className="text-lg font-black text-white leading-none mt-0.5">{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* XP progress bar */}
        <div className="relative mt-8 space-y-2">
          <div className={cn('flex items-center justify-between text-[10px] font-black text-white/50 uppercase tracking-widest', ar ? 'flex-row-reverse' : '')}>
            <span>{xp} XP</span>
            <span>{xpToNext} XP {ar ? 'للنقطة التالية' : 'to go'}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 border border-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpInLevel}%` }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              className="h-full bg-accent rounded-full shadow-[0_0_12px_rgba(217,179,16,0.5)]"
            />
          </div>
        </div>
      </div>

      {/* ── Semester goal ─────────────────────────────────────────────────────── */}
      <div className="official-card p-5 sm:p-6 bg-white dark:bg-slate-900 space-y-4">
        <div className={cn('flex items-center justify-between gap-4 flex-wrap', ar ? 'flex-row-reverse' : '')}>
          <div className={cn('flex items-center gap-3', ar ? 'flex-row-reverse' : '')}>
            <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
              <Target className="w-4.5 h-4.5 text-accent" />
            </div>
            <div>
              <div className="text-sm font-black text-primary dark:text-white">{t('readingGoalLabel')}</div>
              <div className="text-[11px] text-slate-400 font-bold">{t('readingGoalProgress', { goal: 10 })}</div>
            </div>
          </div>
          <span className="text-xl font-black text-primary dark:text-white">
            {stats.books}<span className="text-slate-300 dark:text-slate-600 text-sm font-bold">/10</span>
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-100 dark:border-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (stats.books / 10) * 100)}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-primary to-accent dark:from-accent dark:to-accent/70 rounded-full"
          />
        </div>
      </div>

      {/* ── Tab switcher ──────────────────────────────────────────────────────── */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
        {(['books', 'achievements'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2',
              activeTab === tab
                ? 'bg-white dark:bg-slate-900 text-primary dark:text-white shadow-sm'
                : 'text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-accent'
            )}
          >
            {tab === 'books' ? <BookOpen className="w-3.5 h-3.5" /> : <Award className="w-3.5 h-3.5" />}
            {tab === 'books' ? t('booksTab') : t('achievementsTab')}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ══ BOOKS TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'books' && (
          <motion.div key="books" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">

            {/* The points card that used to open this tab repeated the hero:
                the same number, the same bar, the same caption, one screen
                below it — and under them three fixed chips ("7 days ago",
                "Physics", "Active") that were the same for every account. */}

            {/* ── Borrowed books ─────────────────────────────────────────────── */}
            <section className="official-card p-5 sm:p-8 bg-white dark:bg-slate-900 space-y-6">
              <div className={cn('flex items-center justify-between gap-4 flex-wrap', ar ? 'flex-row-reverse' : '')}>
                <div className={ar ? 'text-right' : ''}>
                  <h4 className="text-xl font-black text-primary dark:text-white">{t('currentlyBorrowedSection')}</h4>
                  <div className="w-10 h-[3px] bg-accent rounded-full mt-2 mb-1" />
                  <p className="text-[11px] text-slate-400 font-bold">{t('myBooksSubtitle')}</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
                  <button onClick={() => setSortOrder('newest')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all', sortOrder === 'newest' ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm' : 'text-slate-400')}>
                    <ArrowDown className="w-3 h-3" />{t('newestFirst')}
                  </button>
                  <button onClick={() => setSortOrder('oldest')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all', sortOrder === 'oldest' ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm' : 'text-slate-400')}>
                    <ArrowUp className="w-3 h-3" />{t('oldestFirst')}
                  </button>
                </div>
              </div>

              {borrowedBooks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left rtl:text-right">
                  {borrowedBooks.map((book, i) => (
                    <motion.div
                      key={book.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="official-card p-5 bg-white dark:bg-slate-900 hover:border-accent dark:hover:border-accent transition-all space-y-4"
                    >
                      {/* Book header */}
                      <div className={cn('flex gap-4', ar ? 'flex-row-reverse' : '')}>
                        <BookCover book={book} className="w-14 h-[4.5rem] rounded-xl shrink-0 shadow-sm" imgClassName="object-cover" />
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-black text-accent uppercase tracking-widest">
                            {catLabel[book.category] || book.category}
                          </span>
                          <h5 className="text-sm font-black text-primary dark:text-white leading-tight line-clamp-2 mt-0.5">{bookTitle(book, language)}</h5>
                          <p className={cn('text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-1', ar ? 'flex-row-reverse' : '')}>
                            <UserIcon className="w-3 h-3" />{bookAuthor(book, language)}
                          </p>
                        </div>
                        <div className={cn('bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 px-3 py-2 rounded-xl text-center shrink-0', book.daysLeft <= 3 ? 'border-rose-200 dark:border-rose-500/20' : '')}>
                          <div className="text-[8px] font-black text-slate-400 uppercase">{t('daysShort')}</div>
                          <div className={cn('text-lg font-black', book.daysLeft <= 3 ? 'text-rose-500' : 'text-primary dark:text-white')}>{book.daysLeft}</div>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="space-y-1.5">
                        <div className={cn('flex items-center justify-between text-[9px] font-black', ar ? 'flex-row-reverse' : '')}>
                          <span className="text-slate-400 uppercase tracking-widest">{t('bookAchievement')}</span>
                          <span className="text-primary dark:text-white">{book.progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${book.progress}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.05 }}
                            className="h-full bg-primary dark:bg-accent rounded-full"
                          />
                        </div>
                      </div>

                      {/* Footer */}
                      <div className={cn('flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5', ar ? 'flex-row-reverse' : '')}>
                        <span className={cn('flex items-center gap-1.5 text-[10px] text-slate-400 font-bold', ar ? 'flex-row-reverse' : '')}>
                          <Clock className="w-3.5 h-3.5" />{book.returnDate}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/book/${book.id}`)}
                            className={cn('flex items-center gap-1 text-[10px] font-black text-primary dark:text-accent uppercase tracking-widest hover:opacity-70 transition-opacity', ar ? 'flex-row-reverse' : '')}
                          >
                            {t('openDigitalReference')}
                            <ChevronRight className={cn('w-3.5 h-3.5', ar ? 'rotate-180' : '')} />
                          </button>
                          <button
                            onClick={() => navigate('/map', { state: { bookId: book.id } })}
                            className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/8 flex items-center justify-center text-slate-400 hover:border-accent hover:text-primary dark:hover:text-accent transition-colors"
                          >
                            <Navigation className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 dark:border-white/8 rounded-2xl p-12 text-center space-y-4">
                  <BookOpen className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto" />
                  <div className="space-y-1">
                    <div className="text-sm font-black text-primary dark:text-white">{t('newBeginningAwaits')}</div>
                    <div className="text-xs text-slate-400 font-bold">{t('noBooksBorrowedMessage')}</div>
                  </div>
                  <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-primary dark:bg-accent text-white dark:text-primary rounded-xl text-xs font-black shadow-sm hover:opacity-90 transition-opacity">
                    {t('discoverSmartLibrary')}
                  </button>
                </div>
              )}
            </section>
          </motion.div>
        )}

        {/* ══ ACHIEVEMENTS TAB ═══════════════════════════════════════════════ */}
        {activeTab === 'achievements' && (
          <motion.div key="ach" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">

            {/* Badges cabinet — same component as Dashboard */}
            <section className="official-card p-5 sm:p-8 bg-white dark:bg-slate-900 space-y-6">
              <div className="text-center space-y-2">
                <h4 className="text-xl font-black text-primary dark:text-white">{t('badgesEarnedLabel')}</h4>
                <div className="w-10 h-[3px] bg-accent rounded-full mx-auto" />
              </div>
              <BadgesCabinet user={user} />
            </section>

            {/* How to earn XP */}
            <section className="official-card p-5 sm:p-8 bg-white dark:bg-slate-900 space-y-6">
              <div className="text-center space-y-2">
                <h4 className="text-xl font-black text-primary dark:text-white">
                  {ar ? 'كيف تكسب نقاط XP؟' : 'How to Earn XP'}
                </h4>
                <div className="w-10 h-[3px] bg-accent rounded-full mx-auto" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: '🗺️', ar: 'فتح خريطة المكتبة',  en: 'Open library map',    pts: 20,  note: ar ? 'مرة واحدة'         : 'once'          },
                  { icon: '📍', ar: 'زيارة رف أو قسم', en: 'Visit a shelf/section', pts: 15,  note: ar ? 'لكل رف'            : 'per shelf'     },
                  { icon: '🔑', ar: 'تسجيل الدخول',    en: 'Login session',          pts: 10,  note: ar ? 'بحد أقصى ٥ مرات'  : 'max 5 times'   },
                  { icon: '🔍', ar: 'بحث ذكي',          en: 'Smart search',           pts: 10,  note: ar ? 'بحد أقصى ٥ بحثات' : 'max 5 searches' },
                  { icon: '🎮', ar: 'تحدي الواقع المعزز', en: 'AR challenge', pts: '50 / 75 / 100', note: ar ? 'لكل مستوى تجتازه' : 'per level passed' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn('official-card p-4 bg-white dark:bg-slate-900 flex items-center gap-3', ar ? 'flex-row-reverse' : '')}
                  >
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <div className={cn('flex-1 min-w-0', ar ? 'text-right' : '')}>
                      <div className="text-[11px] font-black text-primary dark:text-white">{ar ? item.ar : item.en}</div>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span dir="ltr" className="text-[10px] font-black text-accent">+{item.pts} XP</span>
                        {'note' in item && <span className="text-[9px] font-bold text-slate-400">{(item as { note: string }).note}</span>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
