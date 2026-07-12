import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Map as MapIcon, BookOpen, Clock, ChevronRight, Star, Brain, AlertCircle, Sparkles, Award, Camera } from 'lucide-react';
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
    <div className="neu-surface rounded-[3rem] p-6 md:p-12 space-y-16 max-w-6xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Deadline Alert Banner */}
      {urgentDeadline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="neu-raised p-6 flex flex-col md:flex-row items-center justify-between gap-6 mb-[-2rem]"
        >
          <div className="flex items-center gap-6">
            <div className="neu-raised w-14 h-14 flex items-center justify-center text-red-500 shrink-0">
               <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1 text-right ltr:text-left">
               <h4 className="text-lg font-black text-slate-600 dark:text-slate-200 leading-tight">{t('deadlineAlert')}</h4>
               <p className="text-sm font-bold text-slate-400 dark:text-slate-400">
                 {language === 'ar'
                  ? `يجب إرجاع كتاب "${urgentDeadline.title}" خلال ٣ أيام لتجنب الغرامات.`
                  : `Book "${urgentDeadline.title}" must be returned within 3 days to avoid fines.`}
               </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/my-books')}
            className="neu-btn px-8 py-3 text-red-500 text-xs font-black uppercase tracking-widest whitespace-nowrap"
          >
            {t('viewMyBooksStatus')}
          </button>
        </motion.div>
      )}

      {/* Institutional Hero Section */}
      <section className="neu-raised p-8 md:p-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="max-w-xl space-y-6">
            <div className="neu-raised inline-flex items-center gap-2 px-4 py-2">
               <Star className="w-4 h-4 text-slate-400 fill-slate-400" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{t('smartPortal')}</span>
            </div>
            <h2 className="text-4xl font-black tracking-tight leading-tight text-slate-600 dark:text-slate-200">{t('welcomeUser').replace('{name}', user.name)}</h2>
            <p className="text-slate-400 dark:text-slate-400 text-lg font-medium leading-relaxed">{t('heroSubtitle')}</p>

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
                  className={cn("neu-pressed w-full py-5 bg-transparent text-slate-600 dark:text-slate-200 text-base font-bold transition-all focus:outline-none", dir === 'rtl' ? 'pr-16 pl-6' : 'pl-16 pr-6')}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="neu-btn absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 p-1 text-xs font-black z-20 w-7 h-7 flex items-center justify-center"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div
                onClick={() => navigate('/search')}
                className="neu-btn p-4 flex items-center gap-4 cursor-pointer shrink-0"
              >
                <div className="neu-raised w-12 h-12 flex items-center justify-center text-slate-500">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="text-right ltr:text-left">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t('new')}</div>
                  <div className="text-xs font-black text-slate-600 dark:text-slate-200">{t('searchBooks')}</div>
                </div>
              </div>

              <div
                onClick={() => navigate('/cover-scan')}
                className="neu-btn p-4 flex items-center gap-4 cursor-pointer shrink-0"
              >
                <div className="neu-raised w-12 h-12 flex items-center justify-center text-slate-500">
                  <Camera className="w-6 h-6" />
                </div>
                <div className="text-right ltr:text-left">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">AR</div>
                  <div className="text-xs font-black text-slate-600 dark:text-slate-200">{t('scanCoverAction')}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block w-72 h-72 relative">
             <div className="neu-raised absolute inset-0 rotate-6"></div>
             <div className="neu-raised absolute inset-0 -rotate-3"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="neu-raised flex p-4">
                   <BookOpen className="w-20 h-20 text-slate-400" />
                   <div className="w-px h-20 bg-slate-300/50 dark:bg-white/10 mx-4"></div>
                   <Brain className="w-20 h-20 text-slate-500" />
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Luxury Badges Cabinet Section */}
      <section className="neu-raised p-8 md:p-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="neu-raised w-12 h-12 flex items-center justify-center text-slate-500">
              <Award className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-600 dark:text-slate-200 tracking-tight leading-none">{t('royalBadgesCabinet')}</h3>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">{t('achievementRecord')}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/my-books?tab=badges')}
            className="neu-btn px-6 py-3 text-slate-500 text-xs font-black uppercase tracking-widest whitespace-nowrap self-start md:self-auto"
          >
            {language === 'ar' ? 'عرض الخزانة كاملة' : 'View Full Cabinet'}
          </button>
        </div>

        <BadgesCabinet user={user} variant="neu" />
      </section>

      {/* Smart Recommendations Section */}
      <section className="space-y-10">
        <div className="flex items-center gap-4">
          <div className="neu-raised w-12 h-12 flex items-center justify-center text-slate-500">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-600 dark:text-slate-200 tracking-tight">{t('smartRecommendations')}</h3>
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
                 className="neu-raised group block overflow-hidden p-4 space-y-4 transition-transform hover:scale-[1.02] active:scale-95"
               >
                 <div className="aspect-[16/10] rounded-[1.25rem] overflow-hidden relative">
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                 </div>

                 <div className="space-y-2 px-2 pb-2">
                    <div className="flex items-center gap-2">
                       <span className="neu-pressed px-3 py-1 text-[9px] font-black text-slate-500 uppercase">{t('smartSuggestion')}</span>
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{categoryTranslationMap[book.category] || book.category}</span>
                    </div>
                    <div className="space-y-1">
                       <h4 className="text-lg font-black text-slate-600 dark:text-slate-200 leading-tight group-hover:text-slate-800 dark:group-hover:text-white transition-colors line-clamp-2">{book.title}</h4>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{book.author}</span>
                    </div>
                 </div>
               </Link>
             </motion.div>
           ))}
        </div>
      </section>

      {/* Categories Explorer */}
      <section id="explore-collections" className="space-y-8 scroll-mt-24">
        <div className="flex flex-col items-center text-center space-y-2">
           <h3 className="text-2xl font-black text-slate-600 dark:text-slate-200 tracking-tight">{t('exploreCollections')}</h3>
           <div className="neu-pressed w-12 h-1.5 rounded-full mx-auto"></div>
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
                 "px-8 py-4 text-xs font-black uppercase tracking-widest transition-all",
                 selectedCategory === cat
                   ? "neu-pressed text-slate-700 dark:text-white"
                   : "neu-btn text-slate-400 dark:text-slate-500"
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
                className="neu-raised group overflow-hidden flex flex-col h-full p-4"
              >
                <div className="aspect-[3/4] relative overflow-hidden rounded-[1.25rem]">
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="pt-4 px-2 pb-2 space-y-2">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{categoryTranslationMap[book.category] || book.category}</div>
                  <h4 className="font-black text-slate-600 dark:text-slate-200 group-hover:text-slate-800 dark:group-hover:text-white transition-colors text-sm leading-tight line-clamp-1">{book.title}</h4>
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
                <h3 className="text-2xl font-black text-slate-600 dark:text-slate-200 tracking-tight">{t('bestInCatalog')}</h3>
                <div className="neu-pressed w-12 h-1.5 rounded-full"></div>
             </div>
             <button className="text-slate-400 text-xs font-black uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center gap-2">
                {t('viewMore')} <ChevronRight className="w-4 h-4 rtl-flip" />
             </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {mostRead.map((book) => (
              <Link
                to={`/book/${book.id}`}
                key={book.id}
                className="neu-raised group flex h-32 overflow-hidden p-3 gap-3"
              >
                <div className="w-24 h-full relative overflow-hidden shrink-0 rounded-[1rem]">
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex flex-col justify-center gap-1 min-w-0">
                  <div className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">{t('shelfItem')} {book.shelf}</div>
                  <h4 className="font-black text-slate-600 dark:text-slate-200 text-xs leading-tight line-clamp-2 uppercase">{book.title}</h4>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide">{book.author}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-1">
             <h3 className="text-2xl font-black text-slate-600 dark:text-slate-200 tracking-tight">{t('achievementsHistory')}</h3>
             <div className="neu-pressed w-12 h-1.5 rounded-full"></div>
          </div>
          <div className="space-y-4">
             <div className="neu-raised p-6 flex flex-col items-center text-center gap-4">
                <div className="neu-raised w-16 h-16 rounded-full flex items-center justify-center text-slate-500">
                   <Clock className="w-8 h-8" />
                </div>
                <div>
                   <div className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{t('totalLearningTime')}</div>
                   <div className="text-3xl font-black text-slate-600 dark:text-slate-200">
                     {language === 'ar' ? '١٤٢' : '142'} {t('hoursShort')}
                   </div>
                </div>
             </div>

             <div className="neu-raised p-6 flex items-center gap-6">
                <div className="flex-1 space-y-3">
                   <div className="flex justify-between items-center">
                     <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('levelProgress')}</span>
                     <span className="text-xs font-black text-slate-500">{language === 'ar' ? '٧٤٪' : '74%'}</span>
                   </div>
                   <div className="neu-pressed w-full h-3 overflow-hidden p-0.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "74%" }}
                        className="h-full bg-slate-400/70 dark:bg-slate-500/70 rounded-full"
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
