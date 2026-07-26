import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { MOCK_BOOKS } from '../data/mockData';
import {
  Award, BookOpen, Clock, MapPin, Calendar,
  Zap, TrendingUp, Activity, User as UserIcon,
  Navigation, Flame, Target, BookMarked, Timer, Lock, CheckCircle2,
  Search, Star, Compass, GraduationCap, Trophy, ArrowDown, ArrowUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getUserLevel, getEarnedBadges, calcXP } from '../lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, Tooltip,
  ResponsiveContainer, Cell, CartesianGrid,
} from 'recharts';
import { useLanguage } from '../hooks/useLanguage';
import { BookCover } from '../components/BookCover';

interface MyBooksProps {
  user: User;
}

export function MyBooks({ user }: MyBooksProps) {
  const navigate = useNavigate();
  const { t, language, dir } = useLanguage();
  const ar = language === 'ar';

  const [activeTab, setActiveTab]         = useState<'books' | 'achievements'>('books');
  const [sortOrder, setSortOrder]         = useState<'newest' | 'oldest'>('newest');
  const [activeStatTab, setActiveStatTab] = useState<'weekly' | 'categories'>('weekly');

  const earnedBadges = getEarnedBadges(user);
  const currentXP    = calcXP();

  // ─── data ───────────────────────────────────────────────────────────────────
  const dayMap: Record<string, string> = {
    'السبت': t('saturday'), 'الأحد': t('sunday'), 'الاثنين': t('monday'),
    'الثلاثاء': t('tuesday'), 'الأربعاء': t('wednesday'),
    'الخميس': t('thursday'), 'الجمعة': t('friday'),
  };

  const READING_ACTIVITY = useMemo(() => [
    { day: dayMap['السبت'],   pages: 45 },
    { day: dayMap['الأحد'],   pages: 52 },
    { day: dayMap['الاثنين'], pages: 38 },
    { day: dayMap['الثلاثاء'],pages: 65 },
    { day: dayMap['الأربعاء'],pages: 48 },
    { day: dayMap['الخميس'],  pages: 70 },
    { day: dayMap['الجمعة'],  pages: 95 },
  ], [language]);

  const catMap: Record<string, string> = {
    'فيزياء': t('physics'), 'هندسة': t('engineering'),
    'علم نفس': t('psychology'), 'عام': t('general'),
  };

  const borrowedBooks = useMemo(() => {
    const base = MOCK_BOOKS.filter(b => user.borrowedBooks.includes(b.id));
    return base.map(book => {
      const borrowDate = new Date(2024, 3, parseInt(book.id) * 5);
      const returnDate = new Date(borrowDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      const now        = new Date(2024, 3, 22);
      const daysLeft   = Math.ceil((returnDate.getTime() - now.getTime()) / 86400000);
      const locale     = ar ? 'ar-EG' : 'en-US';
      const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      return {
        ...book,
        returnDate: returnDate.toLocaleDateString(locale, opts),
        borrowTimestamp: borrowDate.getTime(),
        daysLeft,
        readingProgress: Math.floor(Math.random() * 60) + 20,
      };
    }).sort((a, b) =>
      sortOrder === 'newest' ? b.borrowTimestamp - a.borrowTimestamp : a.borrowTimestamp - b.borrowTimestamp
    );
  }, [user.borrowedBooks, sortOrder, language]);

  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    borrowedBooks.forEach(b => {
      const cat = catMap[b.category] || b.category;
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [borrowedBooks]);

  const journeyStats = {
    totalBooks:  user.borrowedBooks.length + 3,
    hours:       borrowedBooks.reduce((s, b) => s + Math.round((b.readingProgress / 100) * 6), 0) + 12,
    streak:      7 + Math.floor(user.points / 200),
    earnedCount: earnedBadges.length,
  };

  const badgeMap: Record<string, { title: string; desc: string; icon: React.FC<{ className?: string }>; color: string; colorClass: string }> = {
    'باحث':   { title: t('badgeResearcher'),   desc: t('badgeResearcherDesc'),   icon: Search,    color: 'emerald', colorClass: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' },
    'متميز':  { title: t('badgeDistinguished'), desc: t('badgeDistinguishedDesc'), icon: Star,      color: 'amber',   colorClass: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20'   },
    'مستكشف': { title: t('badgeExplorer'),      desc: t('badgeExplorerDesc'),      icon: Compass,   color: 'blue',    colorClass: 'text-blue-600 bg-blue-500/10 border-blue-500/20'         },
  };
  const lockedBadges = [
    { key: 'قارئ',    title: t('badgeAvid'),      desc: t('badgeAvidDesc'),      icon: BookOpen,      },
    { key: 'ملاح',    title: t('badgeNavigator'),  desc: t('badgeNavigatorDesc'),  icon: Navigation,    },
    { key: 'أكاديمي', title: t('badgeScholar'),   desc: t('badgeScholarDesc'),   icon: GraduationCap, },
  ];

  // ─── chart colors ────────────────────────────────────────────────────────────
  const CHART_COLORS = ['#004C6D', '#D9B310', '#0B3C5D', '#84cc16'];

  // ─── section header ──────────────────────────────────────────────────────────
  function SectionHeader({ title, sub }: { title: string; sub?: string }) {
    return (
      <div className="space-y-2 text-center">
        <h2 className="text-xl font-black text-primary dark:text-white">{title}</h2>
        <div className="w-10 h-[3px] bg-accent rounded-full mx-auto" />
        {sub && <p className="text-[11px] text-slate-400 font-bold">{sub}</p>}
      </div>
    );
  }

  return (
    <div dir={dir} className={cn('max-w-4xl mx-auto space-y-8 pb-20 px-4', ar ? 'text-right' : 'text-left')}>

      {/* ── Profile header ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 py-4">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
          <span className="text-2xl font-black text-primary dark:text-white uppercase">{user.name.charAt(0)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className={cn('flex items-center gap-2 flex-wrap', ar ? 'flex-row-reverse justify-end' : '')}>
            <h1 className="text-lg font-black text-primary dark:text-white">{user.name}</h1>
            <span className="text-[10px] font-black bg-accent/10 text-accent px-2.5 py-1 rounded-xl uppercase tracking-widest">
              {t('level')} {getUserLevel(user.points)}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-bold flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3 h-3" />
            {t('activeMemberSince', { date: ar ? 'سبتمبر ٢٠٢٤' : 'September 2024' })}
          </p>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: BookMarked, label: t('journeyTotalBooks'),        value: journeyStats.totalBooks,  color: 'bg-primary/10 text-primary dark:text-accent' },
          { icon: Timer,      label: t('journeyHours'),             value: journeyStats.hours,        color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
          { icon: Flame,      label: t('journeyStreak'),            value: journeyStats.streak,       color: 'bg-orange-500/10 text-orange-500 dark:text-orange-400' },
          { icon: Trophy,     label: t('journeyAchievementsCount'), value: journeyStats.earnedCount,  color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
        ].map(({ icon: Icon, label, value, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/8 rounded-2xl p-4 flex flex-col items-center gap-2 text-center"
          >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
              <Icon className="w-4.5 h-4.5" />
            </div>
            <div className="text-2xl font-black text-primary dark:text-white">{value}</div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Semester goal ─────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/8 rounded-2xl p-5 space-y-3">
        <div className={cn('flex items-center justify-between gap-4 flex-wrap', ar ? 'flex-row-reverse' : '')}>
          <div className={cn('flex items-center gap-3', ar ? 'flex-row-reverse' : '')}>
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-accent" />
            </div>
            <div>
              <div className="text-xs font-black text-primary dark:text-white">{t('readingGoalLabel')}</div>
              <div className="text-[10px] text-slate-400 font-bold">{t('readingGoalProgress', { goal: 10 })}</div>
            </div>
          </div>
          <span className="text-lg font-black text-primary dark:text-white">
            {journeyStats.totalBooks}<span className="text-slate-300 dark:text-slate-600 text-sm font-bold">/10</span>
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (journeyStats.totalBooks / 10) * 100)}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full bg-accent rounded-full"
          />
        </div>
      </div>

      {/* ── Tab switcher ──────────────────────────────────────────────────────── */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
        {(['books', 'achievements'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2',
              activeTab === tab
                ? 'bg-white dark:bg-slate-900 text-primary dark:text-white shadow-sm'
                : 'text-slate-400 dark:text-slate-500'
            )}
          >
            {tab === 'books' ? <BookOpen className="w-3.5 h-3.5" /> : <Award className="w-3.5 h-3.5" />}
            {tab === 'books' ? t('booksTab') : t('achievementsTab')}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ══════════════════ BOOKS TAB ══════════════════ */}
        {activeTab === 'books' && (
          <motion.div key="books" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">

            {/* Analytics + XP side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/8 rounded-2xl p-5 space-y-4">
                <div className={cn('flex items-center justify-between flex-wrap gap-3', ar ? 'flex-row-reverse' : '')}>
                  <div className={cn('flex items-center gap-3', ar ? 'flex-row-reverse' : '')}>
                    <div className="w-9 h-9 bg-primary/10 dark:bg-accent/10 rounded-xl flex items-center justify-center">
                      <Activity className="w-4 h-4 text-primary dark:text-accent" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-primary dark:text-white">{t('weeklyReadingAnalysis')}</div>
                      <div className="text-[10px] text-slate-400 font-bold">{t('dailyCognitiveProgress')}</div>
                    </div>
                  </div>
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    {(['weekly', 'categories'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveStatTab(tab)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-[10px] font-black transition-all',
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
                      <AreaChart data={READING_ACTIVITY} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                        <defs>
                          <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="#004C6D" stopOpacity={0.12} />
                            <stop offset="95%" stopColor="#004C6D" stopOpacity={0}    />
                          </linearGradient>
                        </defs>
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', fontSize: 11, fontWeight: 700 }}
                          cursor={{ stroke: '#004C6D', strokeWidth: 1, strokeDasharray: '4 2' }}
                        />
                        <XAxis dataKey="day" hide />
                        <Area type="monotone" dataKey="pages" stroke="#004C6D" strokeWidth={2.5} fillOpacity={1} fill="url(#xpGrad)" dot={false} animationDuration={1200} />
                      </AreaChart>
                    ) : (
                      <BarChart data={categoryStats} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', fontSize: 11 }} cursor={{ fill: '#f8fafc' }} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {categoryStats.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* XP card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/8 rounded-2xl p-5 flex flex-col justify-between gap-4">
                <div className={cn('flex items-center justify-between', ar ? 'flex-row-reverse' : '')}>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('experiencePointsTitle')}</span>
                  <TrendingUp className="w-4 h-4 text-accent" />
                </div>
                <div className={cn('flex items-baseline gap-1.5', ar ? 'flex-row-reverse' : '')}>
                  <span className="text-5xl font-black text-primary dark:text-white">{user.points}</span>
                  <span className="text-slate-300 dark:text-slate-600 font-black text-sm uppercase">XP</span>
                </div>
                <div className="space-y-2">
                  <div className={cn('flex items-center justify-between text-[10px] font-black', ar ? 'flex-row-reverse' : '')}>
                    <span className="text-slate-400 uppercase tracking-widest">{t('currentRank')}</span>
                    <span className="text-primary dark:text-white">{t('eliteReader')}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
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
                <div className={cn('flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-white/5', ar ? 'flex-row-reverse' : '')}>
                  {[ar ? 'منذ 7 أيام 🔥' : '7 days ago 🔥', ar ? 'فيزياء 📚' : 'Physics 📚', ar ? 'متاح 💎' : 'Active 💎'].map(b => (
                    <span key={b} className="text-[9px] font-black text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 px-2.5 py-1 rounded-lg whitespace-nowrap">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Borrowed books */}
            <div className="space-y-4">
              <div className={cn('flex items-center justify-between flex-wrap gap-3', ar ? 'flex-row-reverse' : '')}>
                <div>
                  <div className="text-base font-black text-primary dark:text-white">{t('currentlyBorrowedSection')}</div>
                  <div className="text-[11px] text-slate-400 font-bold">{t('myBooksSubtitle')}</div>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button onClick={() => setSortOrder('newest')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all', sortOrder === 'newest' ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm' : 'text-slate-400')}>
                    <ArrowDown className="w-3 h-3" />{t('newestFirst')}
                  </button>
                  <button onClick={() => setSortOrder('oldest')} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all', sortOrder === 'oldest' ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm' : 'text-slate-400')}>
                    <ArrowUp className="w-3 h-3" />{t('oldestFirst')}
                  </button>
                </div>
              </div>

              {borrowedBooks.length > 0 ? (
                <div className="space-y-3">
                  {borrowedBooks.map((book, i) => (
                    <motion.div
                      key={book.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/8 rounded-2xl p-4 flex gap-4"
                    >
                      <div className="w-16 h-20 rounded-xl overflow-hidden shrink-0 shadow-sm">
                        <BookCover book={book} className="w-full h-full" imgClassName="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                        <div>
                          <span className="text-[9px] font-black text-accent uppercase tracking-widest">
                            {catMap[book.category] || book.category}
                          </span>
                          <div className="text-sm font-black text-primary dark:text-white leading-tight mt-0.5 line-clamp-1">{book.title}</div>
                          <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                            <UserIcon className="w-3 h-3" />{book.author}
                          </div>
                        </div>
                        {/* Progress */}
                        <div className="space-y-1">
                          <div className={cn('flex items-center justify-between text-[9px] font-black', ar ? 'flex-row-reverse' : '')}>
                            <span className="text-slate-400">{t('bookAchievement')}</span>
                            <span className="text-primary dark:text-white">{book.readingProgress}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${book.readingProgress}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="h-full bg-accent rounded-full"
                            />
                          </div>
                        </div>
                        {/* Meta + actions */}
                        <div className={cn('flex items-center justify-between flex-wrap gap-2', ar ? 'flex-row-reverse' : '')}>
                          <div className={cn('flex items-center gap-3 text-[9px] font-bold text-slate-400', ar ? 'flex-row-reverse' : '')}>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{book.returnDate}</span>
                            <span className={cn('font-black', book.daysLeft <= 3 ? 'text-rose-500' : 'text-slate-500')}>
                              {book.daysLeft} {ar ? 'يوم' : 'd'}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/book/${book.id}`)}
                              className="text-[9px] font-black px-3 py-1.5 rounded-xl bg-primary/8 dark:bg-white/5 text-primary dark:text-white border border-primary/15 dark:border-white/10 hover:bg-primary/15 transition-colors"
                            >
                              {t('openDigitalReference')}
                            </button>
                            <button
                              onClick={() => navigate('/map', { state: { bookId: book.id } })}
                              className="w-7 h-7 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/8 flex items-center justify-center text-slate-400 hover:text-primary hover:border-accent/30 transition-colors"
                            >
                              <Navigation className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-white/8 rounded-2xl p-12 text-center space-y-4">
                  <BookOpen className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto" />
                  <div className="space-y-1">
                    <div className="text-sm font-black text-primary dark:text-white">{t('newBeginningAwaits')}</div>
                    <div className="text-xs text-slate-400 font-bold">{t('noBooksBorrowedMessage')}</div>
                  </div>
                  <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-accent text-primary rounded-xl text-xs font-black shadow-sm hover:opacity-90 transition-opacity">
                    {t('discoverSmartLibrary')}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══════════════════ ACHIEVEMENTS TAB ══════════════════ */}
        {activeTab === 'achievements' && (
          <motion.div key="ach" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">

            {/* Earned */}
            <div className="space-y-4">
              <div className={cn('flex items-center gap-2', ar ? 'flex-row-reverse' : '')}>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-black text-primary dark:text-white uppercase tracking-widest">{t('badgesEarnedLabel')}</span>
                <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-600 px-2.5 py-0.5 rounded-xl">{earnedBadges.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {earnedBadges.map((badge, i) => {
                  const def = badgeMap[badge];
                  if (!def) return null;
                  const Icon = def.icon;
                  return (
                    <motion.div
                      key={badge}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.07 }}
                      className={cn('bg-white dark:bg-slate-900 border rounded-2xl p-4 flex items-start gap-3', def.colorClass)}
                    >
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', def.colorClass)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className={ar ? 'text-right' : ''}>
                        <div className="text-sm font-black text-primary dark:text-white">{def.title}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-snug mt-0.5">{def.desc}</div>
                      </div>
                    </motion.div>
                  );
                })}
                {earnedBadges.length === 0 && (
                  <div className="col-span-full bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-white/8 rounded-2xl p-10 text-center space-y-3">
                    <Award className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto" />
                    <p className="text-xs font-bold text-slate-400">{t('startReadingToCompete')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Locked */}
            <div className="space-y-4">
              <div className={cn('flex items-center gap-2', ar ? 'flex-row-reverse' : '')}>
                <Lock className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-black text-primary dark:text-white uppercase tracking-widest">{t('badgesLockedLabel')}</span>
                <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-xl">{lockedBadges.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {lockedBadges.map((badge, i) => {
                  const Icon = badge.icon;
                  return (
                    <motion.div
                      key={badge.key}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + i * 0.07 }}
                      className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-2xl p-4 flex items-start gap-3 opacity-55 grayscale"
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className={ar ? 'text-right' : ''}>
                        <div className="text-sm font-black text-slate-400">{badge.title}</div>
                        <div className="text-[10px] text-slate-400 font-bold leading-snug mt-0.5">{badge.desc}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* XP summary */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/8 rounded-2xl p-5 space-y-4">
              <div className={cn('flex items-center justify-between', ar ? 'flex-row-reverse' : '')}>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('experiencePointsTitle')}</div>
                  <div className={cn('flex items-baseline gap-1.5', ar ? 'flex-row-reverse' : '')}>
                    <span className="text-3xl font-black text-primary dark:text-white">{user.points}</span>
                    <span className="text-slate-300 dark:text-slate-600 font-black text-xs uppercase">XP</span>
                  </div>
                </div>
                <div className="text-end">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('currentRank')}</div>
                  <div className="text-sm font-black text-primary dark:text-white">{t('eliteReader')}</div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className={cn('flex justify-between text-[10px] font-black text-slate-400', ar ? 'flex-row-reverse' : '')}>
                  <span>{t('level')} {getUserLevel(user.points)}</span>
                  <span>{t('pointsToNextRank', { points: 500 - (user.points % 500) })}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(user.points % 500) / 5}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full bg-accent rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* How to earn XP */}
            <div className="space-y-4">
              <div className={cn('flex items-center gap-2', ar ? 'flex-row-reverse' : '')}>
                <Zap className="w-4 h-4 text-accent" />
                <span className="text-sm font-black text-primary dark:text-white uppercase tracking-widest">
                  {ar ? 'كيف تكسب نقاط XP؟' : 'How to Earn XP'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { icon: '📚', ar: 'استعارة كتاب', en: 'Borrow a book', pts: 50  },
                  { icon: '🔍', ar: 'بحث ذكي',      en: 'Smart search',  pts: 10  },
                  { icon: '📍', ar: 'الوصول للرف',  en: 'Navigate shelf', pts: 20 },
                  { icon: '🔬', ar: 'ماسح الفجوات', en: 'Gap scanner',    pts: 100 },
                  { icon: '🏆', ar: 'فتح وسام',     en: 'Unlock badge',   pts: 150 },
                  { icon: '📖', ar: 'قراءة فصل',    en: 'Read chapter',   pts: 30  },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn('bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/8 rounded-xl p-3 flex items-center gap-3', ar ? 'flex-row-reverse' : '')}
                  >
                    <span className="text-lg shrink-0">{item.icon}</span>
                    <div className={cn('flex-1 min-w-0', ar ? 'text-right' : '')}>
                      <div className="text-[11px] font-black text-primary dark:text-white truncate">{ar ? item.ar : item.en}</div>
                      <div className="text-[10px] font-black text-accent">+{item.pts} XP</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
