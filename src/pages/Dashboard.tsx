import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, BookOpen, Clock, ChevronRight, Sparkles, Compass, MapPin } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { User, Book } from '../types';
import { MOCK_BOOKS } from '../data/mockData';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';
import { BadgesCabinet } from '../components/BadgesCabinet';

interface DashboardProps {
  user: User;
}

export function Dashboard({ user }: DashboardProps) {
  const navigate = useNavigate();
  const { t, dir, language } = useLanguage();

  const mostRead = MOCK_BOOKS.slice(0, 4);
  const categories: string[] = Array.from(new Set(MOCK_BOOKS.map(b => b.category)));
  const [selectedCategory, setSelectedCategory] = React.useState(categories[0]);
  const [searchQuery, setSearchQuery] = React.useState('');

  const categoryTranslationMap: Record<string, string> = {
    'فيزياء': t('physics'),
    'هندسة': t('engineering'),
    'علم نفس': t('psychology'),
    'عام': t('general')
  };

  const filteredBooks = React.useMemo(() => {
    let books = MOCK_BOOKS;
    if (selectedCategory) {
      books = books.filter(b => b.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      books = books.filter(b => 
        b.title.toLowerCase().includes(q) || 
        b.author.toLowerCase().includes(q) || 
        b.description.toLowerCase().includes(q)
      );
    }
    return books;
  }, [selectedCategory, searchQuery]);

  // Smart Recommendations Logic
  const recommendationCategories = Array.from(new Set(
    MOCK_BOOKS.filter(b => user.borrowedBooks.includes(b.id)).map(b => b.category)
  ));
  
  const [mapSearchQuery, setMapSearchQuery] = React.useState('');

  const recommendations = React.useMemo(() => {
    if (mapSearchQuery.trim()) {
      const q = mapSearchQuery.toLowerCase();
      return MOCK_BOOKS.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        (b.category ?? '').toLowerCase().includes(q)
      ).slice(0, 3);
    }
    return MOCK_BOOKS
      .filter(b => !user.borrowedBooks.includes(b.id))
      .filter(b => recommendationCategories.length > 0 ? recommendationCategories.includes(b.category) : true)
      .slice(0, 3);
  }, [mapSearchQuery, recommendationCategories, user.borrowedBooks]);
  const MATCH_SCORES = [98, 94, 91];

  const WEEKLY_ACTIVITY = React.useMemo(() => [
    { day: t('saturday'), value: 40 },
    { day: t('sunday'), value: 30 },
    { day: t('monday'), value: 60 },
    { day: t('tuesday'), value: 45 },
    { day: t('wednesday'), value: 70 },
    { day: t('thursday'), value: 90 },
    { day: t('friday'), value: 65 },
  ], [t]);

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-20">
      {/* Title + resource shortcuts */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <h1 className="text-4xl font-black text-primary dark:text-white tracking-tight">{t('augmentedLibraryMap')}</h1>
        <p className="text-slate-400 dark:text-slate-500 font-bold leading-relaxed">{t('augmentedLibraryMapDesc')}</p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/map')}
            className="px-6 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 bg-primary text-white shadow-lg shadow-primary/20"
          >
            <BookOpen className="w-4 h-4" />
            {t('libraryResourcesShelves')}
          </button>
          <button
            onClick={() => navigate('/map')}
            className="px-6 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 bg-slate-100 dark:bg-slate-900 text-slate-400 hover:text-primary dark:hover:text-slate-200"
          >
            <Compass className="w-4 h-4" />
            {t('libraryFacilities')}
          </button>
        </div>
      </div>

      {/* Search prompt */}
      <section className="official-card p-10 flex flex-col items-center text-center gap-6 bg-white dark:bg-slate-900">
        <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <BookOpen className="w-8 h-8" />
        </div>
        <div className="space-y-2 max-w-lg">
          <h3 className="text-xl font-black text-primary dark:text-white tracking-tight">{t('searchForBookFirst')}</h3>
          <p className="text-slate-400 dark:text-slate-500 font-bold text-sm leading-relaxed">{t('searchForBookFirstDesc')}</p>
        </div>
        <div className="relative w-full max-w-xl">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 text-primary w-5 h-5", dir === 'rtl' ? 'right-5' : 'left-5')} />
          <input
            type="text"
            value={mapSearchQuery}
            onChange={(e) => setMapSearchQuery(e.target.value)}
            placeholder={t('searchByBookPlaceholder')}
            className={cn(
              "w-full py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-primary dark:text-white rounded-2xl text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-accent",
              dir === 'rtl' ? 'pr-14 pl-5 text-right' : 'pl-14 pr-5 text-left'
            )}
          />
        </div>
      </section>

      {/* Recommended & Featured Sources for Instant Navigation */}
      {recommendations.length > 0 && (
        <section className="space-y-6">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h4 className="text-lg font-black text-primary dark:text-white tracking-tight flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              {t('recommendedFeaturedSources')}
            </h4>
            <p className="text-slate-400 dark:text-slate-500 font-bold text-xs leading-relaxed">{t('recommendedFeaturedSourcesDesc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((book, idx) => (
              <div
                key={book.id}
                onClick={() => navigate('/map', { state: { bookId: book.id } })}
                className="official-card p-5 space-y-4 cursor-pointer bg-white dark:bg-slate-900 hover:border-accent dark:hover:border-accent shadow-sm hover:shadow-xl transition-all"
              >
                <div className={cn("flex items-center justify-between", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-1 rounded-lg uppercase tracking-widest">
                    {MATCH_SCORES[idx] ?? 90}% {t('matchLabel')}
                  </span>
                </div>
                <div className={cn("flex gap-4", dir === 'rtl' ? 'flex-row-reverse text-right' : 'flex-row text-left')}>
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-16 h-20 object-cover rounded-xl shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 space-y-1">
                    <h5 className="text-sm font-black text-primary dark:text-white leading-tight line-clamp-2">{book.title}</h5>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase truncate">{book.author}</p>
                  </div>
                </div>
                <div className={cn("flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                  <span className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-primary/60 dark:text-accent" />
                    {t('shelfItem')} {book.shelf}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-black text-primary dark:text-accent uppercase tracking-widest">
                    {t('instantNav')}
                    <ChevronRight className={cn("w-3.5 h-3.5", dir === 'rtl' ? 'rotate-180' : '')} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Weekly Achievements Summary + Badges Chest */}
      <section className="official-card p-8 md:p-10 bg-white dark:bg-slate-900 space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-primary dark:text-white tracking-tight">{t('weeklyAchievementsSummary')}</h3>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t('weeklyAchievementsSummaryDesc')}</p>
          </div>
          <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 flex items-center gap-4">
            <span>{t('totalTimeSpentLabel')}: {language === 'ar' ? '٦' : '6'} {t('hoursShort')} {language === 'ar' ? '٤٠' : '40'} {t('minutesShort')}</span>
            <span className="text-accent">{t('totalPointsEarnedLabel')}: +{user.points} KXP</span>
          </div>
        </div>

        <div className="h-48 w-full -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={WEEKLY_ACTIVITY} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="weeklyActivityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#99d6ea" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#99d6ea" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-white/5" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 11, fontWeight: 700 }} />
              <Area type="monotone" dataKey="value" stroke="#99d6ea" strokeWidth={3} fill="url(#weeklyActivityFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-6">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="inline-block px-4 py-1.5 bg-primary/10 dark:bg-accent/10 text-primary dark:text-accent rounded-full text-[9px] font-black uppercase tracking-widest">
              {t('earnedBadgesEyebrow')}
            </span>
            <h4 className="text-lg font-black text-primary dark:text-white tracking-tight">{t('informationCognitiveBadgesChest')}</h4>
            <p className="text-slate-400 dark:text-slate-500 font-bold text-xs leading-relaxed">{t('informationCognitiveBadgesChestDesc')}</p>
          </div>
          <BadgesCabinet user={user} />
        </div>
      </section>

      {/* Categories Explorer */}
      <section id="explore-collections" className="space-y-8 scroll-mt-24">
        <div className="flex flex-col items-center text-center space-y-2">
           <h3 className="text-2xl font-black text-primary dark:text-white tracking-tight">{t('exploreCollections')}</h3>
           <div className="w-12 h-1.5 bg-accent rounded-full mx-auto"></div>
           <p className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest pt-2">{t('categoriesSubtitle')}</p>
        </div>

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
          className="flex flex-wrap justify-center gap-4"
        >
           {categories.map((cat) => (
             <motion.button
               key={cat}
               variants={{
                 hidden: { opacity: 0, y: 10 },
                 visible: { opacity: 1, y: 0 }
               }}
               onClick={() => setSelectedCategory(cat)}
               className={cn(
                 "px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border shadow-sm",
                 selectedCategory === cat 
                   ? "bg-primary dark:bg-slate-800 text-white dark:text-accent border-primary dark:border-accent shadow-xl shadow-primary/20 dark:shadow-none scale-105" 
                   : "bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-white/5 hover:border-accent hover:text-primary dark:hover:text-accent"
               )}
             >
               {categoryTranslationMap[cat] || cat}
             </motion.button>
           ))}
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pt-4">
          {filteredBooks.map((book) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={book.id}
            >
              <Link 
                to={`/book/${book.id}`} 
                className="official-card group overflow-hidden flex flex-col h-full bg-white dark:bg-slate-900 transition-all hover:shadow-2xl"
              >
                <div className="aspect-[3/4] relative overflow-hidden bg-slate-100 dark:bg-slate-800 rounded-2xl">
                  <img 
                    src={book.coverUrl} 
                    alt={book.title}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className={cn("absolute top-4 bg-white/10 dark:bg-black/20 backdrop-blur-md p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 border border-white/20 dark:border-white/10", dir === 'rtl' ? 'right-4' : 'left-4')}>
                    <BookOpen className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="p-6 space-y-2">
                  <div className="text-[10px] font-black text-secondary dark:text-accent uppercase tracking-widest">{categoryTranslationMap[book.category] || book.category}</div>
                  <h4 className="font-black text-primary dark:text-white group-hover:text-accent transition-colors text-sm leading-tight line-clamp-1">{book.title}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">{book.author}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats and Rankings Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-center px-1">
             <div className="space-y-1">
                <h3 className="text-2xl font-black text-primary dark:text-white tracking-tight">{t('bestInCatalog')}</h3>
                <div className="w-12 h-1.5 bg-accent rounded-full"></div>
             </div>
             <button className="text-secondary dark:text-accent/80 text-xs font-black uppercase tracking-widest hover:text-primary dark:hover:text-accent transition-colors flex items-center gap-2">
                {t('viewMore')} <ChevronRight className="w-4 h-4 rtl-flip" />
             </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {mostRead.map((book) => (
              <Link 
                to={`/book/${book.id}`} 
                key={book.id}
                className="official-card group flex h-32 bg-white dark:bg-slate-900 transition-all hover:border-primary/20 dark:hover:border-accent/20 overflow-hidden"
              >
                <div className={cn("w-24 h-full relative overflow-hidden shrink-0 border-slate-50 dark:border-white/5", dir === 'rtl' ? 'border-l' : 'border-r')}>
                  <img 
                    src={book.coverUrl} 
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-4 flex flex-col justify-center gap-1">
                  <div className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">{t('shelfItem')} {book.shelf}</div>
                  <h4 className="font-black text-primary dark:text-white text-xs leading-tight line-clamp-2 uppercase">{book.title}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide">{book.author}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-1">
             <h3 className="text-2xl font-black text-primary dark:text-white tracking-tight">{t('achievementsHistory')}</h3>
             <div className="w-12 h-1.5 bg-secondary dark:bg-accent rounded-full"></div>
          </div>
          <div className="space-y-4">
             <div className="official-card p-6 flex flex-col items-center text-center gap-4 group hover:border-accent/40 transition-colors bg-white dark:bg-slate-900">
                <div className="w-16 h-16 rounded-full bg-accent/5 dark:bg-accent/10 flex items-center justify-center text-accent ring-8 ring-accent/5">
                   <Clock className="w-8 h-8" />
                </div>
                <div>
                   <div className="text-xs font-black text-primary dark:text-accent uppercase tracking-[0.2em] mb-1">{t('totalLearningTime')}</div>
                   <div className="text-3xl font-black text-primary dark:text-white">
                     {language === 'ar' ? '١٤٢' : '142'} {t('hoursShort')}
                   </div>
                </div>
             </div>
             
             <div className="official-card p-6 flex items-center gap-6 bg-white dark:bg-slate-900">
                <div className="flex-1 space-y-3">
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('levelProgress')}</span>
                     <span className="text-xs font-black text-accent">{language === 'ar' ? '٧٤٪' : '74%'}</span>
                   </div>
                   <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "74%" }}
                        className="h-full bg-accent"
                      />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
