import React, { useState, useMemo } from 'react';
import { Search as SearchIcon, Sparkles, BookOpen, MapPin, Tag, RefreshCw, Compass, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../hooks/useLanguage';
import { MOCK_BOOKS } from '../data/mockData';
import { Book } from '../types';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export function Search() {
  const { t, dir, language } = useLanguage();
  const navigate = useNavigate();
  
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState('');

  // Settle categories
  const categories = useMemo(() => {
    return ['all', ...Array.from(new Set(MOCK_BOOKS.map(b => b.category)))];
  }, []);

  const categoryTranslationMap: Record<string, string> = {
    'all': language === 'ar' ? 'الكل' : 'All',
    'فيزياء': language === 'ar' ? 'فيزياء' : 'Physics',
    'هندسة': language === 'ar' ? 'هندسة' : 'Engineering',
    'عام': language === 'ar' ? 'عام' : 'General',
    'طب': language === 'ar' ? 'طب' : 'Medicine',
    'أدب': language === 'ar' ? 'أدب' : 'Literature'
  };

  // Live filter mock books
  const filteredBooks = useMemo(() => {
    return MOCK_BOOKS.filter(book => {
      const matchesQuery = 
        book.title.toLowerCase().includes(query.toLowerCase()) ||
        book.author.toLowerCase().includes(query.toLowerCase()) ||
        book.description.toLowerCase().includes(query.toLowerCase()) ||
        book.shelf.toLowerCase().includes(query.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || book.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || book.status === selectedStatus;

      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [query, selectedCategory, selectedStatus]);

  // Suggested search prompts
  const searchPrompts = [
    { text: language === 'ar' ? 'قوانين الحركة والجاذبية' : 'Laws of motion and gravity', q: 'فيزياء' },
    { text: language === 'ar' ? 'الذكاء الاصطناعي وتطبيقاته' : 'AI applications', q: 'الذكاء الاصطناعي' },
    { text: language === 'ar' ? 'تصميم المنشآت الهندسية' : 'Engineering design', q: 'هندسة' },
    { text: language === 'ar' ? 'البحث عن الرف A-1' : 'Search Shelf A-1', q: 'A-1' }
  ];

  // Request AI search insights securely from the backend
  const handleGenerateInsights = async () => {
    if (filteredBooks.length === 0) {
      setAiInsights(language === 'ar' ? 'يرجى البحث والحصول على نتائج أولاً ليتمكن المساعد الذكي من تحليلها.' : 'Please search and obtain results first so that the AI assistant can analyze them.');
      return;
    }

    setIsGeneratingInsights(true);
    setInsightsError('');
    setAiInsights('');

    try {
      const response = await fetch('/api/search-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query || (selectedCategory !== 'all' ? selectedCategory : 'مجموعة عامة من الكتب'),
          results: filteredBooks.slice(0, 3)
        })
      });

      if (!response.ok) {
        throw new Error('Server response error');
      }

      const data = await response.json();
      setAiInsights(data.insights || '');
    } catch (err) {
      console.error(err);
      setInsightsError(language === 'ar' ? 'عذراً، لم نتمكن من الاتصال بالخادم الذكي حالياً. يرجى تجربة تشغيل الملقم بالكامل.' : 'Sorry, could not communicate with the smart server container.');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleApplyPrompt = (q: string) => {
    setQuery(q);
  };

  return (
    <div className={cn("space-y-8 animate-in duration-500 pb-12", dir === 'rtl' ? 'slide-in-from-left-4 text-right' : 'slide-in-from-right-4 text-left')}>
      
      {/* Search Header Banner */}
      <div className={cn("flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-white/10", dir === 'rtl' ? 'md:flex-row-reverse' : 'md:flex-row')}>
        <div className={cn(dir === 'rtl' ? 'text-right' : 'text-left')}>
          <div className={cn("flex items-center gap-3 mb-4 justify-start", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
            <div className="w-10 h-10 bg-primary/10 dark:bg-accent/20 rounded-xl flex items-center justify-center text-primary dark:text-accent">
              <SearchIcon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">{t('searchTitle')}</span>
          </div>
          <h2 className="text-3xl font-black text-primary dark:text-white tracking-tight leading-none">
            {t('searchBooksTitle')}
          </h2>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            {t('searchHelpPrompt')}
          </p>
        </div>
      </div>

      {/* Main Search Panel */}
      <div className="space-y-6">

          {/* Main search bar */}
          <div className="relative group shadow-xl shadow-black/[0.03] rounded-3xl">
            <SearchIcon className={cn("absolute top-1/2 -translate-y-1/2 text-primary w-6 h-6 z-10", dir === 'rtl' ? 'right-6' : 'left-6')} />
            <input
              type="text"
              placeholder={t('searchPlaceholderSearch')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={cn(
                "w-full py-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-primary dark:text-white rounded-3xl text-base font-bold transition-all shadow-inner focus:outline-none focus:ring-2 focus:ring-accent",
                dir === 'rtl' ? 'pr-16 pl-6 text-right' : 'pl-16 pr-6 text-left'
              )}
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary p-2 bg-slate-100 dark:bg-slate-850 rounded-full text-xs font-black z-20 transition-all", dir === 'rtl' ? 'left-6' : 'right-6')}
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick interactive prompts */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-bold">
               <Compass className="w-3.5 h-3.5 text-accent animate-pulse" />
               {language === 'ar' ? 'اقتراحات البحث:' : 'Suggested keywords:'}
             </span>
            {searchPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyPrompt(prompt.q)}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-[#004C6D]/5 hover:text-primary dark:hover:bg-[#D7C826]/10 dark:hover:text-accent border border-slate-200/65 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300 transition-all font-semibold active:scale-95 shadow-sm cursor-pointer"
              >
                {prompt.text}
              </button>
            ))}
          </div>

          {/* Detailed Pill Category & Availability Filters */}
          <div className="p-6 bg-white dark:bg-slate-900/60 backdrop-blur-3xl rounded-3xl border border-slate-200/50 dark:border-white/5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              
              {/* Category selector */}
              <div className="space-y-2 flex-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-bold">
                  {language === 'ar' ? 'التصنيف الدراسي' : 'Academic Class'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer active:scale-95",
                        selectedCategory === cat
                          ? "bg-primary text-white border-primary dark:bg-accent dark:text-primary dark:border-accent"
                          : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:border-slate-300"
                      )}
                    >
                      {categoryTranslationMap[cat] || cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status selector */}
              <div className="space-y-2 min-w-[160px]">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-bold">
                  {language === 'ar' ? 'حالة الإتاحة' : 'Availability Status'}
                </span>
                <div className="flex gap-2">
                  {['all', 'available', 'borrowed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-bold transition-all border flex-1 cursor-pointer",
                        selectedStatus === status
                          ? "bg-primary text-white border-primary dark:bg-accent dark:text-primary dark:border-accent"
                          : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5"
                      )}
                    >
                      {status === 'all' 
                        ? (language === 'ar' ? 'الكل' : 'All')
                        : status === 'available' 
                        ? (language === 'ar' ? 'متاح' : 'Available') 
                        : (language === 'ar' ? 'مستعار' : 'Borrowed')}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Smart Search Insights - only meaningful once there are actual
              results to analyze, so it sits directly above them instead of
              a persistent sidebar card with a permanently-disabled button. */}
          {filteredBooks.length > 0 && (
            <div className="p-6 bg-gradient-to-l from-[#004C6D] to-[#01354c] dark:from-slate-900 dark:to-slate-950 text-white rounded-3xl shadow-xl shadow-[#004C6D]/15 border border-white/10 relative overflow-hidden">
              <div className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full bg-[#D7C826]/10 blur-xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
                <div className="space-y-2 flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/15">
                    <Sparkles className="w-3.5 h-3.5 text-[#D7C826]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#D7C826]">{language === 'ar' ? 'محلل الفهرس الموحد' : 'Unified Index AI'}</span>
                  </div>
                  <h3 className="text-lg font-black tracking-tight">
                    {language === 'ar' ? 'تحليلات البحث الذكية' : 'Smart Search Insights'}
                  </h3>
                  <p className="text-xs text-white/80 leading-relaxed font-semibold max-w-xl">
                    {language === 'ar'
                      ? 'بناءً على نتائج تصفيتك الحالية، يستطيع نموذج الذكاء الاصطناعي تركيب أهم 3 كتب وتقديم ملخص يربطها بموضوع بحثك مباشرة.'
                      : 'Based on current search filters, our AI synthesizer creates a quick academic report drawing pathways across the top matches.'}
                  </p>
                </div>

                <button
                  onClick={handleGenerateInsights}
                  disabled={isGeneratingInsights}
                  className="shrink-0 px-8 py-4 bg-[#D7C826] text-[#004C6D] font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2.5 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-lg shadow-black/10"
                >
                  {isGeneratingInsights ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                      <span>{t('searching')}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#004C6D]" />
                      <span>{language === 'ar' ? 'توليد تقرير وربط أكاديمي' : 'Analyze Core Insights'}</span>
                    </>
                  )}
                </button>
              </div>

              <AnimatePresence>
                {(aiInsights || isGeneratingInsights || insightsError) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative z-10 mt-6 pt-6 border-t border-white/10 space-y-4"
                  >
                    {isGeneratingInsights && (
                      <div className="space-y-2 text-center py-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="w-6 h-6 border-2 border-[#D7C826] border-t-transparent rounded-full animate-spin mx-auto" />
                        <span className="text-[10px] font-black text-white/60 block animate-pulse uppercase tracking-widest">
                          {t('analyzingResultsDeeply')}
                        </span>
                      </div>
                    )}

                    {insightsError && (
                      <div className="p-4 bg-red-950/40 text-red-300 rounded-2xl border border-red-900/50 text-xs font-semibold leading-relaxed">
                        {insightsError}
                      </div>
                    )}

                    {aiInsights && !isGeneratingInsights && (
                      <div className="p-5 bg-white/5 rounded-2xl border border-white/10 text-xs leading-relaxed space-y-3 shadow-inner text-white">
                        <div className="flex items-center gap-1.5 font-black text-[#D7C826] border-b border-white/5 pb-2 uppercase tracking-wide text-[10px]">
                          <BookOpen className="w-4 h-4" />
                          <span>{t('smartSummaryTopResults')}</span>
                        </div>
                        <p className="whitespace-pre-wrap font-medium text-white/90">
                          {aiInsights}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Results section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-primary dark:text-white tracking-tight flex items-center gap-2">
                <span>{t('searchResults')}</span>
                <span className="text-xs font-bold text-slate-400 px-2 py-0.5 bg-slate-100 dark:bg-slate-950 rounded-full">
                  {filteredBooks.length}
                </span>
              </h3>
            </div>

            <AnimatePresence mode="popLayout">
              {filteredBooks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredBooks.map((book, index) => (
                    <motion.div
                      key={book.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.35, delay: index * 0.04 }}
                      onClick={() => navigate(`/book/${book.id}`)}
                      className="group p-5 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 rounded-3xl hover:border-accent dark:hover:border-accent shadow-sm hover:shadow-xl transition-all duration-300 flex gap-4 cursor-pointer relative overflow-hidden"
                    >
                      {/* Interactive background ripple hover accent */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                      {/* Cover image wrap */}
                      <div className="w-20 h-28 rounded-2xl overflow-hidden shadow-md flex-shrink-0 border border-slate-100 dark:border-white/5 relative bg-slate-50 dark:bg-slate-950">
                        <img 
                          src={book.coverUrl} 
                          alt={book.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Book info content */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-accent tracking-wider uppercase block">
                            {categoryTranslationMap[book.category] || book.category}
                          </span>
                          <h4 className="text-sm font-black text-primary dark:text-white leading-tight limit-lines-2 group-hover:text-[#004C6D] dark:group-hover:text-accent transition-colors">
                            {book.title}
                          </h4>
                          <span className="text-xs text-slate-400 font-bold block truncate">
                            {book.author}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5 mt-2">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-550 dark:text-slate-400 font-bold">
                            <MapPin className="w-3.5 h-3.5 text-primary/60 dark:text-accent" />
                            <span>{book.shelf}</span>
                          </div>

                          <span className={cn(
                            "text-[9px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-wider",
                            book.status === 'available'
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/45"
                              : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/45"
                          )}>
                            {book.status === 'available' ? (language === 'ar' ? 'متاح' : 'Available') : (language === 'ar' ? 'مستعار' : 'Borrowed')}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-12 text-center bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200/50 dark:border-white/5 space-y-3"
                >
                  <HelpCircle className="w-12 h-12 text-slate-350 dark:text-slate-600 mx-auto animate-bounce" />
                  <p className="text-slate-400 dark:text-slate-500 font-bold max-w-sm mx-auto text-sm leading-relaxed">
                    {t('searchHintText')}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

    </div>
  );
}
