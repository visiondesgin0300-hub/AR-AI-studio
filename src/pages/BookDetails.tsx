import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Share2, Heart, BookOpen, Clock, CheckCircle2, AlertCircle, X, Tag } from 'lucide-react';
import { MOCK_BOOKS } from '../data/mockData';
import { User, Book } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../hooks/useLanguage';
import { CitationBox } from '../components/CitationBox';
import { BookCover } from '../components/BookCover';
import { getArBookMeta } from '../lib/arCatalog';

const BORROW_XP_REWARD = 15;

interface BookDetailsProps {
  user: User;
  onUpdateUser: (updater: (current: User) => User) => void;
}

export function BookDetails({ user, onUpdateUser }: BookDetailsProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [justBorrowed, setJustBorrowed] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const { t, dir, language } = useLanguage();

  const book = MOCK_BOOKS.find(b => b.id === id);

  const categoryTranslationMap: Record<string, string> = {
    'فيزياء': t('physics'),
    'هندسة': t('engineering'),
    'علم نفس': t('psychology'),
    'عام': t('general')
  };

  if (!book) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-bold text-primary">{t('bookNotFound')}</h3>
        <button onClick={() => navigate('/')} className="mt-4 text-secondary font-medium underline">
          {t('backToHome')}
        </button>
      </div>
    );
  }

  const alreadyBorrowed = user.borrowedBooks.includes(book.id);
  const isAvailable = book.status === 'available' && !alreadyBorrowed && !justBorrowed;

  const handleBorrow = () => {
    if (!isAvailable) return;
    onUpdateUser((current) => ({
      ...current,
      borrowedBooks: current.borrowedBooks.includes(book.id)
        ? current.borrowedBooks
        : [...current.borrowedBooks, book.id],
      points: current.points + BORROW_XP_REWARD,
    }));
    setJustBorrowed(true);
    setTimeout(() => {
      navigate('/my-books');
    }, 1400);
  };

  return (
    <div className="pb-16 space-y-10 animate-in fade-in duration-300">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-accent transition-all font-bold text-sm bg-white dark:bg-slate-900 px-4 py-2 rounded-full shadow-sm border border-slate-100 dark:border-white/5"
        >
          <ArrowRight className="w-5 h-5 rtl-flip" />
          <span>{t('back')}</span>
        </button>
        <div className="flex gap-3">
            <button className="p-3 bg-white dark:bg-slate-900 rounded-full border border-gray-100 dark:border-white/5 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all shadow-md">
                <Heart className="w-5 h-5" />
            </button>
            <button className="p-3 bg-white dark:bg-slate-900 rounded-full border border-gray-100 dark:border-white/5 hover:bg-secondary/10 hover:text-secondary transition-all shadow-md">
                <Share2 className="w-5 h-5" />
            </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Book Cover Container */}
        <div className="w-full lg:w-80 flex flex-col items-center">
          <div className={cn("w-64 aspect-[3/4.5] relative rounded-3xl shadow-2xl overflow-hidden border-[10px] border-white dark:border-slate-800 z-10 transition-transform duration-500", dir === 'rtl' ? 'rotate-1 group hover:rotate-0' : '-rotate-1 group hover:rotate-0')}>
            <BookCover book={book} className="w-full h-full" />
            {!isAvailable && !(alreadyBorrowed || justBorrowed) && (
               <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
                  <div className="bg-red-500 text-white px-5 py-2.5 rounded-full font-black text-sm flex items-center gap-2 shadow-xl">
                     <AlertCircle className="w-5 h-5" />
                     <span>{t('notAvailableNow')}</span>
                  </div>
               </div>
            )}
          </div>

          <div className="mt-8 glass-panel p-4 w-full flex flex-col gap-4 bg-white/40 dark:bg-slate-900/40">
             <div className="flex items-center justify-between text-xs font-bold px-2">
                <span className="text-gray-400 dark:text-gray-500">{t('bookStatus')}</span>
                <span className={cn(
                  isAvailable ? "text-green-600 dark:text-green-400"
                  : (alreadyBorrowed || justBorrowed) ? "text-secondary dark:text-secondary"
                  : "text-red-500"
                )}>
                  {isAvailable ? t('availableForBorrow') : (alreadyBorrowed || justBorrowed) ? t('borrowedByYou') : t('borrowedCurrently')}
                </span>
             </div>
             <div className="h-px bg-gray-200/50 dark:bg-white/5 w-full"></div>
             <div className="flex items-center justify-between text-xs font-bold px-2">
                <span className="text-gray-400 dark:text-gray-500">{t('returnDateLabel')}</span>
                <span className="text-primary dark:text-white tracking-tight">
                  {language === 'ar' ? '١٩ مايو ٢٠٢٦' : 'May 19, 2026'}
                </span>
             </div>
          </div>
        </div>

        {/* Details Container */}
        <div className="flex-1 space-y-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary/10 dark:bg-secondary/20 text-secondary dark:text-secondary rounded-full text-[10px] font-black uppercase tracking-widest border border-secondary/20 dark:border-secondary/30">
              {categoryTranslationMap[book.category] || book.category}
            </div>
            <h1 className="text-4xl font-black text-primary dark:text-white leading-tight tracking-tight">{book.title}</h1>
            {book.titleEn && (
              <p className="text-lg text-slate-400 dark:text-slate-500 font-bold tracking-tight" dir="ltr">{book.titleEn}</p>
            )}
            <p className={cn("text-xl text-gray-500 dark:text-gray-400 font-medium", dir === 'rtl' ? 'border-r-4 pr-6' : 'border-l-4 pl-6')}>
              {t('authorLabel')}: {book.author}{book.year ? ` · ${book.year}` : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="glass-panel p-6 flex items-center gap-5 hover:bg-white dark:hover:bg-slate-900 transition-all border border-slate-100 dark:border-white/5 bg-white/40 dark:bg-slate-900/40">
              <div className="p-3 bg-secondary/10 dark:bg-secondary/20 rounded-2xl">
                 <MapPin className="w-6 h-6 text-secondary dark:text-secondary" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-wider mb-1">{t('exactLocation')}</span>
                <span className="text-base font-black text-primary dark:text-white">
                  {language === 'ar' 
                    ? `قسم ${book.section} | رف ${book.shelf}`
                    : `Section ${book.section} | Shelf ${book.shelf}`}
                </span>
              </div>
            </div>
            <div className="glass-panel p-6 flex items-center gap-5 hover:bg-white dark:hover:bg-slate-900 transition-all border border-slate-100 dark:border-white/5 bg-white/40 dark:bg-slate-900/40">
              <div className="p-3 bg-accent/10 dark:bg-accent/20 rounded-2xl">
                 <Clock className="w-6 h-6 text-accent" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-wider mb-1">{t('borrowDuration')}</span>
                <span className="text-base font-black text-primary dark:text-white">
                  {language === 'ar' ? '١٤' : '14'} {t('academicDays')}
                </span>
              </div>
            </div>
          </div>

          {/* Library of Congress classification number (bilingual label) */}
          <div className={cn("glass-panel p-5 flex items-center gap-4 border border-slate-100 dark:border-white/5 bg-white/40 dark:bg-slate-900/40", dir === 'rtl' ? 'flex-row-reverse text-right' : '')}>
            <div className="p-3 bg-primary/10 dark:bg-accent/15 rounded-2xl shrink-0">
              <Tag className="w-6 h-6 text-primary dark:text-accent" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-wider mb-1">
                {t('callNumberLabel')} <span className="opacity-50">· LC Call Number</span>
              </span>
              <span className="text-base font-black text-primary dark:text-white font-mono" dir="ltr">{getArBookMeta(book).callNumber}</span>
            </div>
          </div>

          <div className="space-y-5">
            <div className={cn("flex items-center justify-between py-1", dir === 'rtl' ? 'border-r-4 pr-4' : 'border-l-4 pl-4')}>
              <h3 className="font-bold text-primary dark:text-white flex items-center gap-3 text-lg">
                 <span>{t('aboutBookAi')}</span>
              </h3>
              <button 
                onClick={() => setShowSummary(true)}
                className="bg-primary/5 dark:bg-accent/10 hover:bg-primary/10 dark:hover:bg-accent/20 text-primary dark:text-accent px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-primary/5 dark:border-accent/10"
              >
                <span>{t('readSummary')}</span>
                <BookOpen className="w-4 h-4 text-accent" />
              </button>
            </div>
            <div className="glass-panel p-6 bg-white/60 dark:bg-slate-900/60 border border-slate-100 dark:border-white/5">
              <p className="text-gray-600 dark:text-gray-300 leading-loose text-justify font-medium text-sm line-clamp-3">
                 {(language === 'en' && book.descriptionEn) ? book.descriptionEn : book.description} {t('descriptionSuffix')}
              </p>
            </div>
          </div>

          {/* One-tap academic citations (APA/MLA/Chicago/BibTeX) */}
          <CitationBox book={book} />

        </div>
      </div>

      {/* Summary Modal */}
      <AnimatePresence>
        {showSummary && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/20 backdrop-blur-sm"
            onClick={() => setShowSummary(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-2xl bg-white/20 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 p-8 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Decorative elements */}
              <div className={cn("absolute top-0 w-32 h-32 bg-accent/20 rounded-full blur-3xl -mt-16", dir === 'rtl' ? 'right-0 -mr-16' : 'left-0 -ml-16')}></div>
              <div className={cn("absolute bottom-0 w-32 h-32 bg-secondary/20 rounded-full blur-3xl -mb-16", dir === 'rtl' ? 'left-0 -ml-16' : 'right-0 -mr-16')}></div>

              <button 
                onClick={() => setShowSummary(false)}
                className={cn("absolute top-6 p-3 bg-white/20 dark:bg-slate-800/40 hover:bg-white/40 dark:hover:bg-slate-800 text-primary dark:text-accent rounded-2xl transition-all border border-white/40 dark:border-white/10 group", dir === 'rtl' ? 'left-6' : 'right-6')}
              >
                <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
              </button>
              
              <div className="relative z-10 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary dark:bg-accent/20 rounded-2xl flex items-center justify-center text-accent">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="text-right ltr:text-left">
                      <h2 className="text-3xl font-black text-primary dark:text-white tracking-tight leading-tight">{book.title}</h2>
                      <p className="text-xs font-black text-secondary uppercase tracking-[0.2em] mt-1">{book.author}</p>
                    </div>
                  </div>
                  <div className={cn("w-16 h-1 w-16 bg-accent rounded-full", dir === 'rtl' ? 'mr-0' : 'ml-0')}></div>
                </div>
                
                <div className="bg-white/40 dark:bg-slate-800/40 p-8 rounded-3xl border border-white/50 dark:border-white/10 shadow-inner">
                  <p className="text-primary dark:text-slate-200 text-lg leading-relaxed font-medium text-justify">
                     {(language === 'en' && book.descriptionEn) ? book.descriptionEn : book.description} {t('descriptionSuffix')}
                  </p>
                </div>

                <div className="flex justify-center pt-4">
                    <p className="text-[10px] font-black text-primary/40 dark:text-white/20 uppercase tracking-[0.3em]">
                      {language === 'ar' ? 'تحليل ذكي • ARLibrary' : 'AI Analysis • ARLibrary'}
                    </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
