import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { MOCK_BOOKS } from '../data/mockData';
import {
  Award, BookOpen, Clock, MapPin, Zap,
  TrendingUp, Activity, User as UserIcon,
  Navigation, Flame, Target, BookMarked, Timer,
  Lock, CheckCircle2, Search, Star, Compass,
  GraduationCap, Trophy, ArrowDown, ArrowUp, ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getUserLevel, getEarnedBadges } from '../lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis,
  Tooltip, ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts';
import { useLanguage } from '../hooks/useLanguage';
import { BookCover } from '../components/BookCover';

interface MyBooksProps { user: User }

export function MyBooks({ user }: MyBooksProps) {
  const navigate = useNavigate();
  const { t, language, dir } = useLanguage();
  const ar = language === 'ar';

  const [activeTab, setActiveTab]         = useState<'books' | 'achievements'>('books');
  const [sortOrder, setSortOrder]         = useState<'newest' | 'oldest'>('newest');
  const [activeStatTab, setActiveStatTab] = useState<'weekly' | 'categories'>('weekly');

  const earnedBadges = getEarnedBadges(user);

  // ─── day labels ──────────────────────────────────────────────────────────────
  const dayMap: Record<string, string> = {
    'السبت': t('saturday'), 'الأحد': t('sunday'), 'الاثنين': t('monday'),
    'الثلاثاء': t('tuesday'), 'الأربعاء': t('wednesday'),
    'الخميس': t('thursday'),  'الجمعة': t('friday'),
  };

  const ACTIVITY = useMemo(() => [
    { day: dayMap['السبت'],    pages: 45 },
    { day: dayMap['الأحد'],    pages: 52 },
    { day: dayMap['الاثنين'],  pages: 38 },
    { day: dayMap['الثلاثاء'], pages: 65 },
    { day: dayMap['الأربعاء'], pages: 48 },
    { day: dayMap['الخميس'],   pages: 70 },
    { day: dayMap['الجمعة'],   pages: 95 },
  ], [language]);

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
          progress:   Math.floor(Math.random() * 60) + 20,
        };
      })
      .sort((a, b) => sortOrder === 'newest' ? b.borrowTs - a.borrowTs : a.borrowTs - b.borrowTs);
  }, [user.borrowedBooks, sortOrder, language]);

  const catStats = useMemo(() => {
    const counts: Record<string, number> = {};
    borrowedBooks.forEach(b => { const c = catLabel[b.category] || b.category; counts[c] = (counts[c] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [borrowedBooks]);

  const stats = {
    books:    user.borrowedBooks.length + 3,
    hours:    borrowedBooks.reduce((s, b) => s + Math.round((b.progress / 100) * 6), 0) + 12,
    streak:   7 + Math.floor(user.points / 200),
    badges:   earnedBadges.length,
  };

  // ─── badge definitions ────────────────────────────────────────────────────────
  const BADGE_DEF: Record<string, { title: string; desc: string; Icon: React.FC<{ className?: string }>; earned: string; dot: string }> = {
    'مستكشف': { title: t('badgeExplorer'),      desc: t('badgeExplorerDesc'),      Icon: Compass,   earned: 'text-blue-600 bg-blue-500/10 border-blue-500/20',    dot: 'bg-blue-500'    },
    'باحث':   { title: t('badgeResearcher'),   desc: t('badgeResearcherDesc'),   Icon: Search,    earned: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500' },
    'متميز':  { title: t('badgeDistinguished'), desc: t('badgeDistinguishedDesc'), Icon: Star,      earned: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20',  dot: 'bg-yellow-500'  },
  };
  const LOCKED = [
    { key: 'قارئ',    title: t('badgeAvid'),     desc: t('badgeAvidDesc'),     Icon: BookOpen      },
    { key: 'ملاح',    title: t('badgeNavigator'), desc: t('badgeNavigatorDesc'), Icon: Navigation   },
    { key: 'أكاديمي', title: t('badgeScholar'),  desc: t('badgeScholarDesc'),  Icon: GraduationCap },
  ];

  const CHART_COLORS = ['#004C6D', '#D9B310', '#0B3C5D', '#84cc16'];

  return (
    <div dir={dir} className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-20">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2rem] bg-primary p-8 md:p-10">
        {/* decorations */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-end gap-8">
          {/* avatar + name */}
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <span className="text-2xl font-black text-white uppercase">{user.name.charAt(0)}</span>
            </div>
            <div>
              <div className={cn('flex items-center gap-2 flex-wrap', ar ? 'flex-row-reverse' : '')}>
                <h1 className="text-2xl font-black text-white">{user.name}</h1>
                <span className="text-[10px] font-black bg-accent text-primary px-2.5 py-1 rounded-lg uppercase tracking-widest">
                  {t('level')} {getUserLevel(user.points)}
                </span>
              </div>
              <p className="text-white/50 text-xs font-bold mt-1">
                {ar ? 'عضو منذ سبتمبر ٢٠٢٤' : 'Member since September 2024'}
              </p>
            </div>
          </div>

          {/* stats pills */}
          <div className="flex flex-wrap gap-3 md:ms-auto">
            {[
              { icon: BookMarked, label: t('journeyTotalBooks'),        value: stats.books   },
              { icon: Timer,      label: t('journeyHours'),             value: stats.hours   },
              { icon: Flame,      label: t('journeyStreak'),            value: stats.streak  },
              { icon: Trophy,     label: t('journeyAchievementsCount'), value: stats.badges  },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/8 border border-white/10 rounded-2xl px-5 py-3 flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-white/70" />
                </div>
                <div>
                  <div className="text-[9px] font-black text-white/50 uppercase tracking-widest">{label}</div>
                  <div className="text-lg font-black text-white leading-none mt-0.5">{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* XP progress bar */}
        <div className="relative mt-8 space-y-2">
          <div className={cn('flex items-center justify-between text-[10px] font-black text-white/50 uppercase tracking-widest', ar ? 'flex-row-reverse' : '')}>
            <span>{t('currentRank')} — {t('eliteReader')}</span>
            <span>{t('pointsToNextRank', { points: 500 - (user.points % 500) })}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 border border-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(user.points % 500) / 5}%` }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              className="h-full bg-accent rounded-full shadow-[0_0_12px_rgba(217,179,16,0.5)]"
            />
          </div>
          <div className={cn('flex items-center justify-between text-[10px] font-black text-white/40', ar ? 'flex-row-reverse' : '')}>
            <span>{user.points} XP</span>
            <span>{t('level')} {getUserLevel(user.points)}</span>
          </div>
        </div>
      </div>

      {/* ── Semester goal ─────────────────────────────────────────────────────── */}
      <div className="official-card p-6 bg-white dark:bg-slate-900 space-y-4">
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

            {/* Reading analytics + XP */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Chart card */}
              <div className="official-card lg:col-span-2 p-8 bg-white dark:bg-slate-900 space-y-6">
                <div className="text-center space-y-2">
                  <h4 className="text-xl font-black text-primary dark:text-white">{t('weeklyReadingAnalysis')}</h4>
                  <div className="w-10 h-[3px] bg-accent rounded-full mx-auto" />
                  <p className="text-[11px] text-slate-400 font-bold">{t('dailyCognitiveProgress')}</p>
                </div>

                <div className="flex justify-center">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {(['weekly', 'categories'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveStatTab(tab)}
                        className={cn(
                          'px-4 py-1.5 rounded-lg text-[10px] font-black transition-all',
                          activeStatTab === tab
                            ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm'
                            : 'text-slate-400'
                        )}
                      >
                        {tab === 'weekly' ? t('weekly') : t('specialties')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    {activeStatTab === 'weekly' ? (
                      <AreaChart data={ACTIVITY} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                        <defs>
                          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#004C6D" stopOpacity={0.12} />
                            <stop offset="95%" stopColor="#004C6D" stopOpacity={0}    />
                          </linearGradient>
                        </defs>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', fontSize: 11, fontWeight: 700 }} cursor={{ stroke: '#004C6D', strokeWidth: 1, strokeDasharray: '4 2' }} />
                        <XAxis dataKey="day" hide />
                        <Area type="monotone" dataKey="pages" stroke="#004C6D" strokeWidth={2.5} fillOpacity={1} fill="url(#grad)" dot={false} animationDuration={1200} />
                      </AreaChart>
                    ) : (
                      <BarChart data={catStats} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', fontSize: 11 }} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {catStats.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* XP card */}
              <div className="official-card p-8 bg-white dark:bg-slate-900 space-y-6 flex flex-col justify-between">
                <div>
                  <div className={cn('flex items-center justify-between mb-6', ar ? 'flex-row-reverse' : '')}>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('experiencePointsTitle')}</span>
                    <TrendingUp className="w-4 h-4 text-accent" />
                  </div>
                  <div className={cn('flex items-baseline gap-1.5', ar ? 'flex-row-reverse' : '')}>
                    <span className="text-5xl font-black text-primary dark:text-white">{user.points}</span>
                    <span className="text-slate-300 dark:text-slate-600 font-black text-sm uppercase">XP</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className={cn('flex items-center justify-between', ar ? 'flex-row-reverse' : '')}>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('currentRank')}</div>
                    <div className="text-sm font-black text-primary dark:text-white">{t('eliteReader')}</div>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(user.points % 500) / 5}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="h-full bg-accent rounded-full"
                    />
                  </div>
                  <div className="text-[10px] font-black text-slate-400 text-end">
                    {t('pointsToNextRank', { points: 500 - (user.points % 500) })}
                  </div>
                </div>

                <div className={cn('flex flex-wrap gap-2 pt-4 border-t border-slate-100 dark:border-white/5', ar ? 'flex-row-reverse' : '')}>
                  {[ar ? 'منذ 7 أيام 🔥' : '7 days ago 🔥', ar ? 'فيزياء 📚' : 'Physics 📚', ar ? 'متاح 💎' : 'Active 💎'].map(b => (
                    <span key={b} className="text-[9px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 px-2.5 py-1 rounded-lg whitespace-nowrap">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Borrowed books ─────────────────────────────────────────────── */}
            <section className="official-card p-8 bg-white dark:bg-slate-900 space-y-6">
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
                          <h5 className="text-sm font-black text-primary dark:text-white leading-tight line-clamp-2 mt-0.5">{book.title}</h5>
                          <p className={cn('text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-1', ar ? 'flex-row-reverse' : '')}>
                            <UserIcon className="w-3 h-3" />{book.author}
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

            {/* Earned badges */}
            <section className="official-card p-8 bg-white dark:bg-slate-900 space-y-6">
              <div className="text-center space-y-2">
                <h4 className="text-xl font-black text-primary dark:text-white">{t('badgesEarnedLabel')}</h4>
                <div className="w-10 h-[3px] bg-accent rounded-full mx-auto" />
              </div>

              {earnedBadges.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {earnedBadges.map((badge, i) => {
                    const def = BADGE_DEF[badge];
                    if (!def) return null;
                    return (
                      <motion.div
                        key={badge}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.07 }}
                        className={cn('official-card p-5 border rounded-2xl flex items-start gap-3', def.earned)}
                      >
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', def.earned)}>
                          <def.Icon className="w-5 h-5" />
                        </div>
                        <div className={ar ? 'text-right' : ''}>
                          <div className="text-sm font-black text-primary dark:text-white">{def.title}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-snug mt-0.5">{def.desc}</div>
                          <div className={cn('flex items-center gap-1 mt-2', ar ? 'flex-row-reverse' : '')}>
                            <span className={cn('w-1.5 h-1.5 rounded-full', def.dot)} />
                            <span className="text-[9px] font-black text-emerald-500">{ar ? 'مكتسب' : 'Earned'}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 dark:border-white/8 rounded-2xl p-10 text-center space-y-3">
                  <Award className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto" />
                  <p className="text-xs font-bold text-slate-400">{t('startReadingToCompete')}</p>
                </div>
              )}
            </section>

            {/* Locked badges */}
            <section className="official-card p-8 bg-white dark:bg-slate-900 space-y-6">
              <div className="text-center space-y-2">
                <h4 className="text-xl font-black text-primary dark:text-white">{t('badgesLockedLabel')}</h4>
                <div className="w-10 h-[3px] bg-accent rounded-full mx-auto" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {LOCKED.map((badge, i) => (
                  <motion.div
                    key={badge.key}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.07 }}
                    className="official-card p-5 border-slate-100 dark:border-white/5 rounded-2xl flex items-start gap-3 opacity-50 grayscale"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                      <badge.Icon className="w-5 h-5" />
                    </div>
                    <div className={ar ? 'text-right' : ''}>
                      <div className="text-sm font-black text-slate-500 dark:text-slate-400">{badge.title}</div>
                      <div className="text-[10px] text-slate-400 font-bold leading-snug mt-0.5">{badge.desc}</div>
                    </div>
                    <Lock className="w-4 h-4 text-slate-300 dark:text-slate-700 ms-auto shrink-0" />
                  </motion.div>
                ))}
              </div>
            </section>

            {/* How to earn XP */}
            <section className="official-card p-8 bg-white dark:bg-slate-900 space-y-6">
              <div className="text-center space-y-2">
                <h4 className="text-xl font-black text-primary dark:text-white">
                  {ar ? 'كيف تكسب نقاط XP؟' : 'How to Earn XP'}
                </h4>
                <div className="w-10 h-[3px] bg-accent rounded-full mx-auto" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { icon: '📚', ar: 'استعارة كتاب',  en: 'Borrow a book',   pts: 50  },
                  { icon: '🔍', ar: 'بحث ذكي',       en: 'Smart search',    pts: 10  },
                  { icon: '📍', ar: 'الوصول للرف',   en: 'Navigate shelf',  pts: 20  },
                  { icon: '🔬', ar: 'ماسح الفجوات',  en: 'Gap scanner',     pts: 100 },
                  { icon: '🏆', ar: 'فتح وسام',      en: 'Unlock badge',    pts: 150 },
                  { icon: '📖', ar: 'قراءة فصل',     en: 'Read chapter',    pts: 30  },
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
                      <div className="text-[11px] font-black text-primary dark:text-white truncate">{ar ? item.ar : item.en}</div>
                      <div className="text-[10px] font-black text-accent">+{item.pts} XP</div>
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
