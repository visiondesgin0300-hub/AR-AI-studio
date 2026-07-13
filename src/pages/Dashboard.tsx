import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Map as MapIcon, BookOpen, Clock, ChevronRight, Star, AlertCircle, Sparkles, Award, Camera } from 'lucide-react';
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
  
  const recommendations = MOCK_BOOKS
    .filter(b => !user.borrowedBooks.includes(b.id))
    .filter(b => recommendationCategories.length > 0 ? recommendationCategories.includes(b.category) : true)
    .slice(0, 3);

  // Check for urgent book deadlines (3 days or less)
  const urgentDeadline = MOCK_BOOKS
    .filter(b => user.borrowedBooks.includes(b.id))
    .find(b => {
      const borrowDate = new Date(2024, 3, parseInt(b.id) * 5);
      const returnDate = new Date(borrowDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      const now = new Date(2024, 3, 22);
      const daysLeft = Math.ceil((returnDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      return daysLeft <= 3 && daysLeft > 0;
    });

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-20">
      {/* Deadline Alert Banner */}
      {urgentDeadline && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group mb-[-2rem]"
        >
          <div className={cn("absolute top-0 w-32 h-full bg-red-100/50 dark:bg-red-900/30 skew-x-12 transition-transform duration-700", dir === 'rtl' ? 'right-0 translate-x-16 group-hover:translate-x-12' : 'left-0 -translate-x-16 group-hover:-translate-x-12')}></div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-200 dark:shadow-none animate-pulse">
               <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1 text-right ltr:text-left">
               <h4 className="text-lg font-black text-red-900 dark:text-red-100 leading-tight">{t('deadlineAlert')}</h4>
               <p className="text-sm font-bold text-red-700/70 dark:text-red-200/60">
                 {language === 'ar' 
                  ? `يجب إرجاع كتاب "${urgentDeadline.title}" خلال ٣ أيام لتجنب الغرامات.`
                  : `Book "${urgentDeadline.title}" must be returned within 3 days to avoid fines.`}
               </p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/my-books')}
            className="bg-red-600 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200 relative z-10 whitespace-nowrap"
          >
            {t('viewMyBooksStatus')}
          </button>
        </motion.div>
      )}

      {/* Hero Section */}
      <section className="official-card p-12 bg-white dark:bg-slate-900">
        <div className="max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/5 dark:bg-accent/10 px-4 py-2 rounded-full border border-primary/10 dark:border-accent/20">
             <Star className="w-4 h-4 text-accent fill-accent" />
             <span className="text-[10px] font-black text-primary dark:text-accent uppercase tracking-[0.2em]">{t('smartPortal')}</span>
          </div>
          <h2 className="text-4xl font-black text-primary dark:text-white tracking-tight leading-tight">{t('welcomeUser').replace('{name}', user.name)}</h2>
          <p className="text-slate-400 dark:text-slate-500 text-lg font-medium leading-relaxed">{t('heroSubtitle')}</p>

          <div className="flex flex-wrap gap-4 mt-8">
            <div className="relative group max-w-md flex-1 min-w-[280px]">
              <Search className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6 z-10", dir === 'rtl' ? 'right-6' : 'left-6')} />
              <input
                type="text"
                placeholder={t('searchPlaceholderMain')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  const el = document.getElementById('explore-collections');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={cn("w-full py-5 bg-slate-50 dark:bg-slate-800 text-primary dark:text-white rounded-2xl text-base font-bold transition-all border border-slate-100 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-accent", dir === 'rtl' ? 'pr-16 pl-6' : 'pl-16 pr-6')}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary p-1 bg-slate-100 rounded-full text-xs font-black z-20"
                >
                  ✕
                </button>
              )}
            </div>

            <div
              onClick={() => navigate('/search')}
              className="bg-accent/10 border border-accent/20 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-accent/20 transition-all group shrink-0"
            >
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="text-right ltr:text-left">
                <div className="text-[10px] font-black text-accent uppercase tracking-widest leading-none mb-1">{t('new')}</div>
                <div className="text-xs font-black text-primary dark:text-white">{t('searchBooks')}</div>
              </div>
            </div>

            <div
              onClick={() => navigate('/ar')}
              className="bg-primary/5 dark:bg-white/5 border border-primary/10 dark:border-white/10 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-primary/10 dark:hover:bg-white/10 transition-all group shrink-0"
            >
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <div className="text-right ltr:text-left">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">AR</div>
                <div className="text-xs font-black text-primary dark:text-white">{t('scanCoverAction')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Badges Cabinet Section */}
      <section className="official-card p-8 md:p-10 bg-white dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-lg shadow-accent/5">
              <Award className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-primary dark:text-white tracking-tight leading-none">{t('royalBadgesCabinet')}</h3>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">{t('achievementRecord')}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/my-books?tab=badges')}
            className="px-6 py-3 bg-[#99d6ea]/15 hover:bg-[#99d6ea]/25 text-[#004C6D] dark:text-[#99d6ea] border border-[#99d6ea]/25 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap self-start md:self-auto"
          >
            {language === 'ar' ? 'عرض الخزانة كاملة' : 'View Full Cabinet'}
          </button>
        </div>

        <BadgesCabinet user={user} />
      </section>

      {/* Smart Recommendations Section */}
      <section className="space-y-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent shadow-lg shadow-accent/5">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-primary dark:text-white tracking-tight">{t('smartRecommendations')}</h3>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">{t('recsSubtitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {recommendations.map((book, idx) => (
             <motion.div
               key={book.id}
               initial={{ opacity: 0, scale: 0.95 }}
               whileInView={{ opacity: 1, scale: 1 }}
               transition={{ delay: idx * 0.1, duration: 0.5 }}
               viewport={{ once: true }}
             >
               <Link 
                 to={`/book/${book.id}`}
                 className="group relative block aspect-[16/9] md:aspect-[16/10] bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/5 dark:shadow-none border border-slate-100 dark:border-white/5 transition-all hover:scale-[1.02] active:scale-95"
               >
                 <div className="absolute inset-0">
                    <img 
                      src={book.coverUrl} 
                      alt={book.title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/95 dark:from-slate-950/95 via-primary/50 dark:via-slate-950/50 to-transparent"></div>
                 </div>
                 
                 <div className="absolute inset-x-0 bottom-0 p-8 space-y-4">
                    <div className="flex items-center gap-2">
                       <span className="px-3 py-1 bg-accent rounded-lg text-[9px] font-black text-primary uppercase">{t('smartSuggestion')}</span>
                       <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">{categoryTranslationMap[book.category] || book.category}</span>
                    </div>
                    <div className="space-y-1">
                       <h4 className="text-lg font-black text-white leading-tight group-hover:text-accent transition-colors line-clamp-2">{book.title}</h4>
                       <div className="flex items-center gap-2">
                          <div className="w-4 h-px bg-accent/50"></div>
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide">{book.author}</span>
                       </div>
                    </div>
                 </div>
                 
                 {/* Decorative elements */}
                 <div className={cn("absolute top-6 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 opacity-0 group-hover:opacity-100 transition-all", dir === 'rtl' ? 'left-6' : 'right-6')}>
                    <ChevronRight className="w-5 h-5 text-white rtl-flip" />
                 </div>
               </Link>
             </motion.div>
           ))}
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
