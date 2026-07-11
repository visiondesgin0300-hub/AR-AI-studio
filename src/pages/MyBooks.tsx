import React, { useState, useMemo } from 'react';
import { User, Book } from '../types';
import { MOCK_BOOKS } from '../data/mockData';
import { 
  Award, BookOpen, Clock, ChevronLeft, MapPin, Calendar, Heart, Star, 
  Map as MapIcon, ArrowDown, ArrowUp, Zap, Trophy, Lightbulb, Compass, 
  Search, TrendingUp, BarChart3, PieChart, Activity, User as UserIcon,
  Navigation
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, AreaChart, Area 
} from 'recharts';
import { useLanguage } from '../hooks/useLanguage';

interface MyBooksProps {
  user: User;
}

export function MyBooks({ user }: MyBooksProps) {
  const navigate = useNavigate();
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [hoveredBadge, setHoveredBadge] = useState<string | null>(null);
  const [activeStatTab, setActiveStatTab] = useState<'weekly' | 'categories'>('weekly');
  const { t, language, dir } = useLanguage();

  React.useEffect(() => {
    if (window.location.hash === '#royal-badges-cabinet' || window.location.search.includes('tab=badges')) {
      const element = document.getElementById('royal-badges-cabinet');
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    }
  }, []);

  const dayMap: Record<string, string> = {
    'السبت': t('saturday'),
    'الأحد': t('sunday'),
    'الاثنين': t('monday'),
    'الثلاثاء': t('tuesday'),
    'الأربعاء': t('wednesday'),
    'الخميس': t('thursday'),
    'الجمعة': t('friday'),
  };

  const READING_ACTIVITY = useMemo(() => [
    { day: dayMap['السبت'], pages: 45, duration: 1.2 },
    { day: dayMap['الأحد'], pages: 52, duration: 1.5 },
    { day: dayMap['الاثنين'], pages: 38, duration: 0.8 },
    { day: dayMap['الثلاثاء'], pages: 65, duration: 2.1 },
    { day: dayMap['الأربعاء'], pages: 48, duration: 1.4 },
    { day: dayMap['الخميس'], pages: 70, duration: 2.5 },
    { day: dayMap['الجمعة'], pages: 95, duration: 3.2 },
  ], [t, dayMap]);

  const categoryTranslationMap: Record<string, string> = {
    'فيزياء': t('physics'),
    'هندسة': t('engineering'),
    'علم نفس': t('psychology'),
    'عام': t('general')
  };

  const badgeTranslationMap: Record<string, { title: string, desc: string }> = {
    'باحث': { title: t('badgeResearcher'), desc: t('badgeResearcherDesc') },
    'متميز': { title: t('badgeDistinguished'), desc: t('badgeDistinguishedDesc') },
    'قارئ نشط': { title: t('badgeActiveReader'), desc: t('badgeActiveReaderDesc') },
    'قارئ الشهر': { title: t('badgeReaderOfMonth'), desc: t('badgeReaderOfMonthDesc') },
    'ملهم': { title: t('badgeInspirational'), desc: t('badgeInspirationalDesc') },
    'مستكشف': { title: t('badgeExplorer'), desc: t('badgeExplorerDesc') },
  };

  // Combine user records with book data and assign stable mock borrow dates
  const borrowedBooks = useMemo(() => {
    const baseBooks = MOCK_BOOKS.filter(b => user.borrowedBooks.includes(b.id));
    
    // Assign mock borrow dates: earlier ID = earlier date for simplicity
    const withDates = baseBooks.map(book => {
      const borrowDate = new Date(2024, 3, parseInt(book.id) * 5);
      const returnDate = new Date(borrowDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      const now = new Date(2024, 3, 22); // Fixed "now" for mock purpose to show progress
      
      const totalPeriod = returnDate.getTime() - borrowDate.getTime();
      const elapsed = now.getTime() - borrowDate.getTime();
      const timeLeftPercent = Math.max(0, Math.min(100, 100 - (elapsed / totalPeriod) * 100));
      const daysLeft = Math.ceil((returnDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      const localizedDateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
      const locale = language === 'ar' ? 'ar-EG' : 'en-US';

      return {
        ...book,
        borrowDate: borrowDate.toLocaleDateString(locale, localizedDateOptions),
        returnDate: returnDate.toLocaleDateString(locale, localizedDateOptions),
        borrowTimestamp: borrowDate.getTime(),
        timeLeftPercent,
        daysLeft,
        readingProgress: Math.floor(Math.random() * 60) + 20 // Mock reading progress
      };
    });

    return withDates.sort((a, b) => {
      return sortOrder === 'newest' 
        ? b.borrowTimestamp - a.borrowTimestamp 
        : a.borrowTimestamp - b.borrowTimestamp;
    });
  }, [user.borrowedBooks, sortOrder, language]);

  // Gamification Logic: Award badges dynamically
  const earnedBadges = [...user.badges];
  
  if (user.totalReadCount > 10 && !earnedBadges.includes('قارئ نشط')) {
    earnedBadges.push('قارئ نشط');
  }
  
  if (user.points > 400 && !earnedBadges.includes('قارئ الشهر')) {
    earnedBadges.push('قارئ الشهر');
  }

  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    borrowedBooks.forEach(b => {
      const localizedCat = categoryTranslationMap[b.category] || b.category;
      counts[localizedCat] = (counts[localizedCat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [borrowedBooks, categoryTranslationMap]);

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Dynamic Profile Cover Header */}
      <section className="relative h-[300px] rounded-[3rem] overflow-hidden shadow-2xl group">
        <div className="absolute inset-0 bg-primary">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent"></div>
        </div>
        
        {/* Animated Background Elements */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className={cn("absolute -top-20 w-96 h-96 bg-accent dark:bg-accent/40 rounded-full blur-[100px]", dir === 'rtl' ? '-right-20' : '-left-20')}
        />

        <div className={cn("absolute inset-0 flex flex-col md:flex-row items-end gap-8 p-10 md:p-14", dir === 'rtl' ? 'text-right' : 'text-left')}>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 md:w-40 md:h-40 bg-white dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center border-8 border-white/20 dark:border-slate-800/20 shadow-2xl relative shrink-0"
          >
             <span className="text-5xl md:text-6xl font-black text-primary dark:text-white uppercase">{user.name.charAt(0)}</span>
             <motion.div 
               animate={{ scale: [1, 1.2, 1] }}
               transition={{ duration: 2, repeat: Infinity }}
               className={cn("absolute -bottom-2 w-10 h-10 bg-emerald-500 border-4 border-white dark:border-slate-900 rounded-full flex items-center justify-center", dir === 'rtl' ? '-right-2' : '-left-2')}
             >
               <Zap className="w-5 h-5 text-white fill-white" />
             </motion.div>
          </motion.div>
          
          <div className="flex-1 space-y-3 mb-4 text-white">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight">{user.name}</h2>
                <div className="bg-accent text-primary px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl">
                  {t('level')} {Math.floor(user.points / 100)}
                </div>
              </div>
              <p className="text-white/60 flex items-center gap-2 font-bold text-sm">
                <Calendar className="w-4 h-4 text-accent" />
                {t('activeMemberSince', { date: language === 'ar' ? 'سبتمبر ٢٠٢٤' : 'September 2024' })}
              </p>
            </motion.div>
          </div>

          <div className="hidden lg:flex gap-4 mb-4">
             {earnedBadges.slice(0, 3).map((badge, i) => (
                <motion.div 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  key={badge} 
                  className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-2 rounded-2xl flex items-center gap-3"
                >
                   <Award className="w-5 h-5 text-accent" />
                   <span className="text-xs font-black text-white">{badgeTranslationMap[badge]?.title || badge}</span>
                </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* Stats Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Reading Activity Chart */}
        <div className="lg:col-span-2 glass-panel p-8 bg-white/40 dark:bg-slate-900/40 border-white/60 dark:border-white/5">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-primary dark:bg-accent rounded-2xl flex items-center justify-center text-white dark:text-primary shadow-xl shadow-primary/20 dark:shadow-accent/20">
                  <Activity className="w-6 h-6" />
               </div>
               <div className={cn(dir === 'rtl' ? 'text-right' : 'text-left')}>
                  <h3 className="text-lg font-black text-primary dark:text-white">{t('weeklyReadingAnalysis')}</h3>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{t('dailyCognitiveProgress')}</p>
               </div>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
               <button 
                 onClick={() => setActiveStatTab('weekly')}
                 className={cn("px-4 py-2 rounded-lg text-[10px] font-black transition-all", activeStatTab === 'weekly' ? "bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm" : "text-slate-400 dark:text-slate-500")}
               >{t('weekly')}</button>
               <button 
                 onClick={() => setActiveStatTab('categories')}
                 className={cn("px-4 py-2 rounded-lg text-[10px] font-black transition-all", activeStatTab === 'categories' ? "bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm" : "text-slate-400 dark:text-slate-500")}
               >{t('specialties')}</button>
            </div>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeStatTab === 'weekly' ? (
                <AreaChart data={READING_ACTIVITY} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPages" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0B3C5D" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0B3C5D" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontFamily: 'inherit', backgroundColor: 'var(--tooltip-bg)', color: 'var(--tooltip-text)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    labelStyle={{ fontWeight: '900' }}
                  />
                  <XAxis dataKey="day" hide />
                  <Area 
                    type="monotone" 
                    dataKey="pages" 
                    stroke="var(--chart-line)" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorPages)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              ) : (
                <BarChart data={categoryStats} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grid-color)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748B' }} />
                  <Tooltip 
                     cursor={{ fill: 'transparent' }}
                     contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', backgroundColor: 'var(--tooltip-bg)' }}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]} layout="vertical">
                    {categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--chart-primary)' : 'var(--chart-secondary)'} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Level & Points Card */}
        <div className="glass-panel p-8 bg-primary shadow-2xl relative overflow-hidden flex flex-col justify-between group">
           <div className={cn("absolute top-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl -translate-y-1/2", dir === 'rtl' ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2')}></div>
           
           <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                 <h4 className="text-white font-black uppercase tracking-widest text-[10px] opacity-70">{t('experiencePointsTitle')}</h4>
                 <TrendingUp className="text-accent w-5 h-5 group-hover:scale-125 transition-transform" />
              </div>
              <div className="flex items-baseline gap-2">
                 <span className="text-6xl font-black text-white">{user.points}</span>
                 <span className="text-white/40 font-black text-sm uppercase">XP</span>
              </div>
           </div>

           <div className="relative z-10 space-y-4 pt-8">
              <div className="flex items-end justify-between text-white">
                 <div className="space-y-1">
                    <div className="text-[10px] font-black opacity-50 uppercase tracking-widest">{t('currentRank')}</div>
                    <div className="text-lg font-black">{t('eliteReader')}</div>
                 </div>
                 <div className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-lg border border-white/5 uppercase tracking-widest">
                    {t('pointsToNextRank', { points: 500 - (user.points % 500) })}
                 </div>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden border border-white/5 p-0.5">
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(user.points % 500) / 5}%` }}
                    className="h-full bg-accent shadow-[0_0_15px_rgba(217,179,16,0.5)] rounded-full"
                 />
              </div>
           </div>
           
           <div className="flex items-center gap-4 pt-8 border-t border-white/10 mt-8 overflow-x-auto no-scrollbar pb-1">
              {[t('daysAgo', { count: 7 }) + ' 🔥', t('physics') + ' 📚', t('availableNow') + ' 💎'].map(b => (
                <span key={b} className="text-[9px] font-black text-white/60 bg-white/5 px-3 py-2 rounded-xl whitespace-nowrap border border-white/5">
                   {b}
                </span>
              ))}
           </div>
        </div>
      </div>

      {/* Borrowed Books Section */}
      <section className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className={cn("space-y-2", dir === 'rtl' ? 'text-right' : 'text-left')}>
             <h3 className="text-4xl font-black text-primary dark:text-white tracking-tight">{t('myBooksTitle')}</h3>
             <p className="text-sm font-bold text-slate-400 dark:text-slate-500">{t('manageFollowReading')}</p>
          </div>
          
          <div className="flex bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-1.5 rounded-[1.8rem] border border-white/40 dark:border-white/10 shadow-xl self-start">
             <button 
               onClick={() => setSortOrder('newest')}
               className={cn(
                 "px-8 py-3 rounded-2xl text-[10px] font-black transition-all flex items-center gap-2",
                 sortOrder === 'newest' ? "bg-primary dark:bg-slate-700 text-white shadow-lg" : "text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-accent"
               )}
             >
                <ArrowDown className="w-3.5 h-3.5" />
                {t('newestFirst')}
             </button>
             <button 
               onClick={() => setSortOrder('oldest')}
               className={cn(
                 "px-8 py-3 rounded-2xl text-[10px] font-black transition-all flex items-center gap-2",
                 sortOrder === 'oldest' ? "bg-primary dark:bg-slate-700 text-white shadow-lg" : "text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-accent"
               )}
             >
                <ArrowUp className="w-3.5 h-3.5" />
                {t('oldestFirst')}
             </button>
          </div>
        </div>
        
        {borrowedBooks.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            {borrowedBooks.map((book) => (
              <motion.div 
                 key={book.id} 
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ duration: 0.5 }}
                 className="group relative"
              >
                <div className="glass-panel p-6 bg-white/70 dark:bg-slate-900/70 border-white dark:border-white/5 relative z-10 shadow-[0_30px_60px_rgba(0,0,0,0.06)] dark:shadow-none hover:shadow-[0_50px_100px_rgba(0,0,0,0.12)] transition-all duration-500 rounded-[3rem] overflow-hidden flex flex-col md:flex-row gap-10 group/card">
                  {/* Luxury Background Detail */}
                  <div className={cn("absolute top-0 w-32 h-32 bg-accent/5 dark:bg-accent/10 rounded-full blur-3xl -mt-16 group-hover/card:bg-accent/10 dark:group-hover/card:bg-accent/20 transition-colors", dir === 'rtl' ? 'right-0 -mr-16' : 'left-0 -ml-16')}></div>

                  <div className="w-full md:w-52 h-[340px] md:h-auto rounded-[2.5rem] overflow-hidden shadow-2xl relative shrink-0">
                    <img 
                      src={book.coverUrl} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover/card:scale-110" 
                      alt={book.title} 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/90 dark:from-slate-950/90 via-transparent to-transparent opacity-40 group-hover/card:opacity-20 transition-opacity"></div>
                    
                    <div className={cn("absolute bottom-6 left-6 right-6 bg-white/10 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl p-4 border border-white/20 dark:border-white/10", dir === 'rtl' ? 'text-right' : 'text-left')}>
                       <div className="text-[9px] font-black text-white/60 dark:text-white/40 uppercase tracking-widest mb-1.5">{t('physicalLocation')}</div>
                       <div className="text-sm font-black text-white flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-accent" />
                          {t('shelfShort')} {book.shelf}
                       </div>
                    </div>
                  </div>

                  <div className={cn("flex-1 py-2 flex flex-col justify-between", dir === 'rtl' ? 'text-right' : 'text-left')}>
                    <div className="space-y-6">
                      <div className="flex justify-between items-start gap-4">
                         <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-4">
                               <span className="text-[10px] font-black text-secondary dark:text-secondary px-4 py-1.5 bg-secondary/5 dark:bg-secondary/10 rounded-xl uppercase tracking-widest">
                                 {categoryTranslationMap[book.category] || book.category}
                               </span>
                               <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                            </div>
                            <h4 className="text-2xl font-black text-primary dark:text-white leading-tight group-hover/card:text-secondary dark:group-hover/card:text-accent transition-colors line-clamp-2">{book.title}</h4>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-3 uppercase tracking-[0.15em] flex items-center gap-2">
                               <UserIcon className="w-4 h-4" />
                               {book.author}
                            </p>
                         </div>
                         <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 px-5 py-4 rounded-[1.8rem] text-center shadow-sm shrink-0">
                            <div className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-1.5">{t('daysShort')}</div>
                            <div className={cn("text-xl font-black", book.daysLeft <= 3 ? "text-red-500 animate-pulse" : "text-primary dark:text-white")}>
                               {book.daysLeft}
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50/80 dark:bg-slate-800/50 p-5 rounded-[1.8rem] border border-white dark:border-white/5 flex flex-col justify-center gap-1.5">
                           <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('dueAt')}</div>
                           <div className="text-xs font-black text-primary dark:text-white truncate">{book.returnDate}</div>
                        </div>
                        <div className="bg-slate-50/80 dark:bg-slate-800/50 p-5 rounded-[1.8rem] border border-white dark:border-white/5 flex flex-col justify-center gap-1.5">
                           <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('lastRead')}</div>
                           <div className="text-xs font-black text-primary dark:text-white">{t('daysAgo', { count: 2 })}</div>
                        </div>
                      </div>

                      <div className="space-y-4">
                         <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('bookAchievement')}</span>
                            <span className="text-xs font-black text-primary dark:text-white">{book.readingProgress}%</span>
                         </div>
                         <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-100 dark:border-white/5">
                            <motion.div 
                               initial={{ width: 0 }}
                               whileInView={{ width: `${book.readingProgress}%` }}
                               transition={{ duration: 1, ease: "easeOut" }}
                               className="h-full bg-primary dark:bg-accent rounded-full shadow-[0_0_10px_rgba(11,60,93,0.3)] dark:shadow-[0_0_10px_rgba(217,179,16,0.3)]"
                            />
                         </div>
                      </div>
                    </div>

                    <div className="flex gap-4 mt-10">
                      <button 
                        onClick={() => navigate(`/book/${book.id}`)}
                        className="flex-1 py-5 bg-primary dark:bg-slate-800 text-white rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-secondary dark:hover:bg-slate-700 transition-all shadow-xl shadow-primary/10 active:scale-95 flex items-center justify-center"
                      >
                        {t('openDigitalReference')}
                      </button>
                      <button 
                        onClick={() => navigate('/map', { state: { bookId: book.id } })}
                        className="px-8 py-5 bg-white dark:bg-slate-900 text-primary dark:text-accent border-2 border-slate-100 dark:border-white/5 rounded-[1.8rem] hover:border-accent hover:text-accent transition-all active:scale-95 group/btn flex items-center justify-center shrink-0"
                      >
                        <Navigation className={cn("w-6 h-6 group-hover/btn:rotate-12 transition-transform", dir === 'ltr' ? '' : 'rotate-180')} />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Background shadow glow */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-12 bg-primary/20 dark:bg-accent/10 blur-[50px] -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-24 text-center space-y-10 bg-white/20 border-dashed border-2 relative overflow-hidden rounded-[3rem]">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none"></div>
             <div className="w-28 h-28 bg-white dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl border border-gray-100 dark:border-white/5 relative z-10 scale-110">
                <BookOpen className="w-12 h-12 text-slate-200 dark:text-slate-700" />
             </div>
             <div className="space-y-4 relative z-10">
                <h4 className="text-3xl font-black text-primary dark:text-white leading-tight">{t('newBeginningAwaits')}</h4>
                <p className="text-slate-400 dark:text-slate-500 font-bold max-w-md mx-auto text-lg leading-relaxed">{t('noBooksBorrowedMessage')}</p>
             </div>
             <button 
               onClick={() => navigate('/')} 
               className="px-12 py-5 bg-primary dark:bg-accent text-white dark:text-primary rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:scale-105 transition-all hover:bg-secondary dark:hover:bg-accent/80 relative z-10"
             >
               {t('discoverSmartLibrary')}
             </button>
          </div>
        )}
      </section>

      {/* Luxury Badges Cabinet Section */}
      <section id="royal-badges-cabinet" className="glass-panel p-8 md:p-16 bg-white dark:bg-slate-900 shadow-[0_50px_100px_rgba(0,0,0,0.08)] dark:shadow-none relative overflow-hidden rounded-[4rem] border-white dark:border-white/5">
         <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--grid-color) 2px, transparent 0)', backgroundSize: '40px 40px' }}></div>
         
         <div className="flex flex-col lg:flex-row items-center justify-between mb-20 gap-10 relative z-10">
           <div className={cn("space-y-2 text-center", dir === 'rtl' ? 'lg:text-right' : 'lg:text-left')}>
              <h3 className="text-4xl font-black text-primary dark:text-white tracking-tight leading-tight">{t('royalBadgesCabinet')}</h3>
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500">{t('achievementRecord')}</p>
           </div>
           <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-inner">
              <div className={cn("flex", dir === 'rtl' ? '-space-x-4 space-x-reverse' : '-space-x-4')}>
                 {[...Array(4)].map((_, i) => (
                   <div key={i} className="w-12 h-12 rounded-full border-4 border-white dark:border-slate-700 bg-slate-200 dark:bg-slate-600 shadow-sm flex items-center justify-center overflow-hidden grayscale hover:grayscale-0 transition-all cursor-pointer">
                      <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="" />
                   </div>
                 ))}
              </div>
              <div className={cn("text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest", dir === 'rtl' ? 'pr-4' : 'pl-4')}>
                {user.totalReadCount > 0 ? t('topReadersPercent', { percent: 100 - user.totalReadCount }) : t('startReadingToCompete')}
              </div>
           </div>
         </div>

         <motion.div 
           initial="hidden"
           whileInView="visible"
           viewport={{ once: true }}
           variants={{
             visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
           }}
           className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-12 lg:gap-16 relative z-10"
         >
            {[
              { id: 'باحث', icon: Search, color: 'bg-blue-500' },
              { id: 'متميز', icon: Star, color: 'bg-yellow-500' },
              { id: 'قارئ نشط', icon: Zap, color: 'bg-emerald-500' },
              { id: 'قارئ الشهر', icon: Trophy, color: 'bg-purple-500' },
              { id: 'ملهم', icon: Lightbulb, color: 'bg-orange-500' },
              { id: 'مستكشف', icon: Compass, color: 'bg-indigo-500' }
            ].map((badge) => {
               const isEarned = earnedBadges.includes(badge.id);
               const translation = badgeTranslationMap[badge.id];
               return (
                 <motion.div 
                   key={badge.id}
                   variants={{
                     hidden: { opacity: 0, scale: 0.8, y: 20 },
                     visible: { opacity: 1, scale: 1, y: 0 }
                   }}
                   className="flex flex-col items-center gap-8 group"
                 >
                    <div className="relative">
                      {/* Floating Tooltip */}
                      <AnimatePresence>
                        {isEarned && hoveredBadge === badge.id && (
                          <motion.div 
                            initial={{ opacity: 0, y: 15, scale: 0.85, x: '-50%' }}
                            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                            exit={{ opacity: 0, y: 15, scale: 0.85, x: '-50%' }}
                            className={cn(
                               "absolute -top-24 left-1/2 px-6 py-4 bg-primary dark:bg-slate-800 text-white rounded-[1.8rem] shadow-2xl z-[100] whitespace-nowrap text-center border border-white/10 ring-8 ring-primary/5 dark:ring-white/5",
                            )}
                          >
                             <div className="text-[11px] font-black uppercase tracking-[0.2em] mb-1.5">{translation?.title}</div>
                             <div className="text-[10px] font-bold opacity-60 max-w-[200px] whitespace-normal leading-relaxed">{translation?.desc}</div>
                             <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary dark:bg-slate-800 rotate-45"></div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.div 
                        onHoverStart={() => isEarned && setHoveredBadge(badge.id)}
                        onHoverEnd={() => setHoveredBadge(null)}
                        whileHover={isEarned ? { 
                          scale: 1.15, 
                          rotate: 5,
                          y: -15,
                          transition: { type: "spring", stiffness: 400, damping: 10 }
                        } : {}}
                        className={cn(
                          "w-32 h-32 rounded-[3.5rem] flex items-center justify-center transition-all relative overflow-hidden p-8 shadow-[0_30px_60px_rgba(0,0,0,0.1)]",
                          isEarned 
                            ? "bg-white dark:bg-slate-800 border-2 border-accent text-accent shadow-accent/20" 
                            : "bg-slate-100 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-white/5 text-slate-300 dark:text-slate-600 grayscale"
                        )}
                      >
                         {isEarned && (
                           <>
                              <motion.div 
                                 animate={{ rotate: 360 }}
                                 transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                 className="absolute inset-0 bg-[conic-gradient(from_0deg,_transparent_0%,_#D9B310_50%,_transparent_100%)] opacity-20 blur-2xl"
                              />
                              <div className="absolute inset-1.5 bg-white dark:bg-slate-800 rounded-[3.2rem] z-0 shadow-inner"></div>
                           </>
                         )}

                         <badge.icon className={cn("w-14 h-14 relative z-10", isEarned && "drop-shadow-xl animate-pulse [animation-duration:3s]")} />
                         
                         {isEarned && (
                           <motion.div 
                             animate={{ left: ['-100%', '200%'] }}
                             transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
                             className="absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 dark:via-white/5 to-transparent skew-x-12 z-20"
                           />
                         )}
                      </motion.div>
                      
                      {isEarned && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', delay: 0.5 }}
                          className={cn("absolute -bottom-2 w-10 h-10 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-lg z-30", dir === 'rtl' ? '-right-2' : '-left-2')}
                        >
                           <Zap className="w-5 h-5 text-white fill-white" />
                        </motion.div>
                      )}
                    </div>
                    
                    <div className="text-center px-2">
                      <span className={cn(
                        "text-xs font-black transition-colors uppercase tracking-[0.2em] leading-relaxed",
                        isEarned ? "text-primary dark:text-white" : "text-slate-300 dark:text-slate-600 opacity-60"
                      )}>
                        {translation?.title || badge.id}
                      </span>
                    </div>
                 </motion.div>
               );
            })}
         </motion.div>
      </section>
    </div>
  );
}
