import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Map as MapIcon, ChevronRight, Compass, Camera, X, Box, User as UserIcon, Search as SearchIcon, Trophy, Clock, Sparkles } from 'lucide-react';
import { MOCK_BOOKS } from '../data/mockData';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../hooks/useLanguage';
import { BadgesCabinet } from '../components/BadgesCabinet';

import { User } from '../types';

// Lazy-loaded: pulls in three.js + AR.js, a multi-MB dependency that should
// only load once a user actually enters AR mode for a shelf, not on every
// visit to the map page.
const ArView = lazy(() => import('./ArView').then((m) => ({ default: m.ArView })));

interface LibraryMapProps {
  user: User;
}

export function LibraryMap({ user }: LibraryMapProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language, dir } = useLanguage();
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [showPath, setShowPath] = useState(false);
  const [isArMode, setIsArMode] = useState(false);

  const [activeTab, setActiveTab] = useState<'map' | 'sections'>('map');
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const [resourceTab, setResourceTab] = useState<'shelves' | 'facilities'>('shelves');

  // Simulated real-time occupancy data
  const occupancyData = useMemo(() => {
    return {
      'A-1': Math.floor(Math.random() * 100),
      'A-2': Math.floor(Math.random() * 100),
      'B-1': Math.floor(Math.random() * 100),
      'B-2': Math.floor(Math.random() * 100),
      'C-1': Math.floor(Math.random() * 100),
      'C-2': Math.floor(Math.random() * 100),
      'D-1': Math.floor(Math.random() * 100),
      'D-2': Math.floor(Math.random() * 100),
    };
  }, []);

  useEffect(() => {
    if (location.state?.bookId) {
      setSelectedBook(location.state.bookId);
      setShowPath(true);
    }
  }, [location.state]);

  const bookData = MOCK_BOOKS.find(b => b.id === selectedBook);

  const sections = [
    { id: 'A', name: t('naturalSciences'), icon: '🧪', subjects: [t('physics'), t('chemistry'), t('biology')], color: 'bg-blue-500', occupancy: t('quiet') },
    { id: 'B', name: t('engineeringAndTech'), icon: '⚙️', subjects: [t('mechEngineering'), t('ai'), t('software')], color: 'bg-orange-500', occupancy: t('activeOccupancy') },
    { id: 'C', name: t('artsAndCrafts'), icon: '🎨', subjects: [t('arabicLit'), t('graphicDesign'), t('philosophy')], color: 'bg-purple-500', occupancy: t('mediumOccupancy') },
    { id: 'D', name: t('humanities'), icon: '📚', subjects: [t('history'), t('sociology'), t('geography')], color: 'bg-green-500', occupancy: t('quiet') }
  ];

  const cells = [
    { id: 'A-1', section: 'A' }, { id: 'A-2', section: 'A' }, { id: 'B-1', section: 'B' }, { id: 'B-2', section: 'B' },
    { id: 'C-1', section: 'C' }, { id: 'C-2', section: 'C' }, { id: 'D-1', section: 'D' }, { id: 'D-2', section: 'D' }
  ];

  const getPathData = () => {
    if (!bookData) return "";
    const shelf = bookData.shelf;
    const paths: Record<string, string> = {
      'A-1': "M 300,450 L 300,350 L 100,350 L 100,100",
      'A-2': "M 300,450 L 300,350 L 250,350 L 250,100",
      'B-1': "M 300,450 L 300,350 L 400,350 L 400,100",
      'B-2': "M 300,450 L 300,350 L 550,350 L 550,100",
      'C-1': "M 300,450 L 300,350 L 100,350 L 100,250",
      'D-1': "M 300,450 L 300,350 L 550,350 L 550,250",
    };
    return paths[shelf] || "M 300,450 L 300,200";
  };

  return (
    <div className={cn("h-full flex flex-col gap-8 animate-in duration-500 font-sans", dir === 'rtl' ? 'slide-in-from-left-4 text-right' : 'slide-in-from-right-4 text-left')}>
      {/* Pre-selection landing: search + recommended sources + XP/badges guide.
          Hidden once a book is picked so navigation mode stays uncluttered. */}
      {!bookData && (
        <div className="space-y-10 pb-10 border-b border-slate-200 dark:border-white/10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h1 className="text-4xl font-black text-primary dark:text-white tracking-tight">{t('augmentedLibraryMap')}</h1>
            <p className="text-slate-400 dark:text-slate-500 font-bold leading-relaxed">{t('augmentedLibraryMapDesc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => navigate('/search')}
              className="official-card relative overflow-hidden p-8 flex flex-col items-center text-center gap-3 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-accent dark:hover:border-accent transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
              <div className="relative w-14 h-14 bg-primary/10 dark:bg-accent/10 rounded-2xl flex items-center justify-center text-primary dark:text-accent">
                <SearchIcon className="w-6 h-6" />
              </div>
              <h3 className="relative text-sm font-black text-primary dark:text-white tracking-tight">{t('smartSearchCard')}</h3>
              <p className="relative text-[11px] text-slate-400 dark:text-slate-500 font-bold leading-relaxed">{t('smartSearchCardDesc')}</p>
              <span className={cn("relative text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-1", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                {t('searchNowLabel')}
                <ChevronRight className={cn("w-3 h-3", dir === 'rtl' ? 'rotate-180' : '')} />
              </span>
            </button>

            <button
              onClick={() => setResourceTab(resourceTab === 'facilities' ? 'shelves' : 'facilities')}
              className={cn(
                "official-card relative overflow-hidden p-8 flex flex-col items-center text-center gap-3 shadow-sm hover:shadow-xl transition-all",
                resourceTab === 'facilities'
                  ? "bg-primary dark:bg-slate-950 border-primary text-white"
                  : "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 hover:border-accent dark:hover:border-accent"
              )}
            >
              {resourceTab !== 'facilities' && <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent pointer-events-none" />}
              <div className={cn("relative w-14 h-14 rounded-2xl flex items-center justify-center", resourceTab === 'facilities' ? "bg-white/10 text-white" : "bg-primary/10 dark:bg-accent/10 text-primary dark:text-accent")}>
                <Compass className="w-6 h-6" />
              </div>
              <h3 className={cn("relative text-sm font-black tracking-tight", resourceTab === 'facilities' ? "text-white" : "text-primary dark:text-white")}>{t('libraryFacilities')}</h3>
              <p className={cn("relative text-[11px] font-bold leading-relaxed", resourceTab === 'facilities' ? "text-white/60" : "text-slate-400 dark:text-slate-500")}>{t('libraryFacilitiesCardDesc')}</p>
              <span className={cn("relative text-[10px] font-black uppercase tracking-widest flex items-center gap-1", resourceTab === 'facilities' ? "text-accent" : "text-accent", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                {t('viewFacilitiesLabel')}
                <ChevronRight className={cn("w-3 h-3", dir === 'rtl' ? 'rotate-180' : '')} />
              </span>
            </button>

            <button
              onClick={() => navigate('/cover-scan')}
              className="official-card relative overflow-hidden p-8 flex flex-col items-center text-center gap-3 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-accent dark:hover:border-accent transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
              <div className="relative w-14 h-14 bg-primary/10 dark:bg-accent/10 rounded-2xl flex items-center justify-center text-primary dark:text-accent">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="relative text-sm font-black text-primary dark:text-white tracking-tight">{t('smartBookCoverScannerCard')}</h3>
              <p className="relative text-[11px] text-slate-400 dark:text-slate-500 font-bold leading-relaxed">{t('smartBookCoverScannerCardDesc')}</p>
              <span className={cn("relative text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-1", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                {t('startScanningLabel')}
                <ChevronRight className={cn("w-3 h-3", dir === 'rtl' ? 'rotate-180' : '')} />
              </span>
            </button>
          </div>

          {resourceTab === 'facilities' && (
            <div className="official-card p-16 text-center text-slate-400 dark:text-slate-500 font-bold bg-white dark:bg-slate-900 border-dashed border-slate-200 dark:border-white/10">
              {t('facilitiesComingSoon')}
            </div>
          )}

          <div className="text-center space-y-2 max-w-xl mx-auto">
            <span className="inline-block px-4 py-1.5 bg-primary/10 dark:bg-accent/10 text-primary dark:text-accent rounded-full text-[9px] font-black uppercase tracking-widest">
              {t('xpPointsGuideEyebrow')}
            </span>
            <h4 className="text-lg font-black text-primary dark:text-white tracking-tight">{t('knowledgeXpBadgesGuide')}</h4>
            <p className="text-slate-400 dark:text-slate-500 font-bold text-xs leading-relaxed">{t('knowledgeXpBadgesGuideDesc')}</p>
          </div>

          <div className="grid grid-cols-2 gap-6 max-w-xl mx-auto">
            <div className="official-card p-6 flex flex-col items-center text-center gap-2 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                <Trophy className="w-6 h-6" />
              </div>
              <div className="text-2xl font-black text-primary dark:text-white">{user.points} <span className="text-[11px] text-slate-400">KXP</span></div>
              <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">{t('totalExperiencePoints')}</div>
            </div>
            <div className="official-card p-6 flex flex-col items-center text-center gap-2 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary to-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-2xl font-black text-primary dark:text-white">45 <span className="text-[11px] text-slate-400">{t('minutesShort')}</span></div>
              <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">{t('knowledgeLearningTimeToday')}</div>
            </div>
          </div>

          <button
            onClick={() => navigate('/my-books?tab=badges')}
            className="w-full py-4 bg-slate-900 dark:bg-accent text-white dark:text-primary rounded-2xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {t('viewInteractiveXpBadgesGuide')}
          </button>

          <div className="space-y-6">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <span className="inline-block px-4 py-1.5 bg-primary/10 dark:bg-accent/10 text-primary dark:text-accent rounded-full text-[9px] font-black uppercase tracking-widest">
                {t('earnedBadgesEyebrow')}
              </span>
              <h4 className="text-lg font-black text-primary dark:text-white tracking-tight">{t('informationCognitiveBadgesChest')}</h4>
              <p className="text-slate-400 dark:text-slate-500 font-bold text-xs leading-relaxed">{t('informationCognitiveBadgesChestDesc')}</p>
            </div>
            <BadgesCabinet user={user} badgeIds={['مستكشف', 'باحث', 'متميز']} />
          </div>
        </div>
      )}

      {/* Dynamic Header */}
      <div className={cn("flex flex-col md:flex-row items-center justify-between gap-8 pb-8 border-b border-slate-200 dark:border-white/10", dir === 'rtl' ? 'md:flex-row-reverse' : 'md:flex-row')}>
        <div className={cn(dir === 'rtl' ? 'text-right' : 'text-left')}>
          <div className={cn("flex items-center gap-3 mb-4", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
            <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center text-accent">
              <MapIcon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">{t('smartNavSystem')}</span>
          </div>
          <h1 className="text-4xl font-black text-primary dark:text-white tracking-tight">{t('knowledgeCampusMap')}</h1>
          <p className="text-slate-400 dark:text-slate-500 font-bold mt-2 leading-relaxed">{t('navAccuratelyDesc')}</p>
        </div>

        <div className={cn("flex flex-col sm:flex-row items-center gap-4", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5">
             <button 
               onClick={() => { setActiveTab('map'); setIsArMode(false); }}
               className={cn(
                 "px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-3", 
                 activeTab === 'map' && !isArMode ? "bg-white dark:bg-slate-800 text-primary dark:text-accent shadow-lg shadow-black/5" : "text-slate-400 hover:text-primary dark:hover:text-slate-200"
               )}
             >
               <MapPin className="w-4 h-4" />
               {t('digitalView')}
             </button>
             <button 
               onClick={() => { setActiveTab('sections'); setIsArMode(false); }}
               className={cn(
                 "px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-3", 
                 activeTab === 'sections' ? "bg-white dark:bg-slate-800 text-primary dark:text-accent shadow-lg shadow-black/5" : "text-slate-400 hover:text-primary dark:hover:text-slate-200"
               )}
             >
               <Box className="w-4 h-4" />
               {t('mainSections')}
             </button>
          </div>

          {bookData && (
            <button 
              onClick={() => setIsArMode(true)}
              className="px-8 py-4 bg-primary text-white rounded-2xl text-xs font-black flex items-center gap-3 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all group"
            >
               <Camera className="w-5 h-5 group-hover:animate-pulse" />
               <span>{t('enterArMode')}</span>
               <div className="flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                 <span className="text-[9px] text-emerald-400 opacity-80 uppercase">{t('activeStatus')}</span>
               </div>
            </button>
          )}
        </div>
      </div>

      <div className={cn("flex flex-col xl:flex-row gap-10 flex-1 min-h-0", dir === 'rtl' ? 'xl:flex-row-reverse' : 'xl:flex-row')}>
        {/* Map Visualization Zone */}
        <div className={cn(
          "flex-1 official-card relative overflow-hidden min-h-[650px] p-0 transition-all duration-500",
          isArMode ? "bg-black border-0" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20"
        )}>
          {/* Blueprint Grid Overlay */}
          {!isArMode && ( activeTab === 'map' && (
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#004C6D 1px, transparent 1px), linear-gradient(90deg, #004C6D 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              <div className="absolute inset-0 opacity-[0.01] dark:opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#004C6D 1px, transparent 1px), linear-gradient(90deg, #004C6D 1px, transparent 1px)', backgroundSize: '200px 200px' }} />
              
              {/* Compass Rose Decoration */}
              <div className={cn("absolute bottom-12 opacity-5 scale-150 text-primary dark:text-white", dir === 'rtl' ? 'left-12' : 'right-12')}>
                 <Compass className="w-48 h-48" />
              </div>
            </div>
          ))}

          <AnimatePresence mode="wait">
            {isArMode ? (
              <Suspense fallback={<div key="ar-loading" className="w-full h-full bg-black" />}>
                <ArView key="ar" book={bookData!} onClose={() => setIsArMode(false)} />
              </Suspense>
            ) : activeTab === 'map' ? (
              <motion.div 
                key="map"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative z-10 w-full h-full p-12 flex flex-col"
              >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1">
                    {cells.map((cell) => {
                      const section = sections.find(s => s.id === cell.section);
                      const isDestination = bookData?.shelf === cell.id;
                      const occupancy = occupancyData[cell.id as keyof typeof occupancyData];
                      const isHovered = hoveredCell === cell.id;

                      return (
                        <motion.div 
                          key={cell.id}
                          onHoverStart={() => setHoveredCell(cell.id)}
                          onHoverEnd={() => setHoveredCell(null)}
                          className={cn(
                            "relative flex flex-col items-center justify-center rounded-[3rem] border-2 transition-all duration-500 cursor-pointer group",
                            isDestination 
                              ? "bg-accent/5 dark:bg-accent/10 border-accent shadow-[0_30px_70px_rgba(217,179,16,0.2)] z-20 scale-105" 
                              : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 hover:border-primary/20 dark:hover:border-accent/20",
                            isHovered && !isDestination && "shadow-2xl shadow-black/5 dark:shadow-black/20 scale-[1.02]"
                          )}
                        >
                          {/* Live Occupancy Badge */}
                          <div className={cn("absolute top-6 flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-full shadow-sm border border-slate-100 dark:border-white/5", dir === 'rtl' ? 'left-8' : 'right-8')}>
                             <div className={cn("w-1.5 h-1.5 rounded-full", occupancy > 70 ? "bg-red-500" : occupancy > 40 ? "bg-amber-500" : "bg-emerald-500")}></div>
                             <span className="text-[9px] font-black text-slate-500 dark:text-slate-400">{occupancy}%</span>
                          </div>

                          <div className="relative z-10 flex flex-col items-center gap-6 p-8 text-center">
                            <div className={cn(
                              "w-16 h-16 rounded-[2rem] flex items-center justify-center text-2xl transition-all duration-500 shadow-lg",
                              isDestination ? "bg-accent text-primary scale-110" : "bg-white dark:bg-slate-700 text-slate-300 dark:text-slate-400"
                            )}>
                               {section?.icon}
                            </div>
                            
                            <div className="space-y-1">
                               <div className="text-[10px] font-black text-primary/40 dark:text-white/30 uppercase tracking-[0.2em]">{section?.name}</div>
                               <div className="text-xl font-black text-primary dark:text-white">{t('shelfId', { id: cell.id })}</div>
                            </div>

                            {isDestination && (
                              <motion.div 
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className={cn("bg-primary text-accent px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}
                              >
                                <Navigation className={cn("w-3 h-3", dir === 'rtl' ? 'rotate-180' : '')} />
                                {t('currentDestination')}
                              </motion.div>
                            )}
                          </div>

                          {/* Decorative Section Color Tab */}
                          <div className={cn("absolute bottom-0 inset-x-12 h-1.5 rounded-t-full transition-all group-hover:h-3", section?.color, isDestination && "opacity-100", !isDestination && "opacity-20")} />
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Enhanced Entrance Visual */}
                  <div className="mt-16 relative flex justify-center">
                     <div className="absolute bottom-full mb-8 h-20 w-px bg-gradient-to-t from-slate-200 dark:from-white/10 to-transparent" />
                     <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-12 py-4 rounded-full text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] shadow-inner text-center">
                        {t('mainGatePhaseOne')}
                     </div>
                  </div>

                  {/* Path Visualization SVG */}
                  {showPath && bookData && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" viewBox="0 0 600 500">
                      <defs>
                        <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#004C6D" stopOpacity="0" />
                          <stop offset="50%" stopColor="#D9B310" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="#D9B310" stopOpacity="1" />
                        </linearGradient>
                         <filter id="glow">
                          <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      <motion.path 
                        d={getPathData()}
                        stroke="url(#pathGradient)"
                        strokeWidth="12"
                        strokeDasharray="20 15"
                        fill="none"
                        strokeLinecap="round"
                        filter="url(#glow)"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                      />
                      <motion.circle r="12" fill="#D9B310" stroke="white" strokeWidth="4">
                        <animateMotion dur="4s" repeatCount="indefinite" path={getPathData()} />
                      </motion.circle>
                    </svg>
                  )}
              </motion.div>
            ) : (
              <motion.div 
                key="sections"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-10 p-12"
              >
                 {sections.map(section => (
                   <div key={section.id} className={cn("official-card p-10 flex flex-col justify-between group hover:border-primary/20 dark:hover:border-accent/20 transition-all cursor-pointer bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20", dir === 'rtl' ? 'text-right' : 'text-left')}>
                      <div className={cn("flex items-start justify-between", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                         <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-500">
                            {section.icon}
                         </div>
                         <div className={cn(dir === 'rtl' ? 'text-left' : 'text-right')}>
                            <span className="text-[10px] font-black text-primary dark:text-accent uppercase tracking-widest block mb-1">{t('shelfShort')} {section.id}</span>
                            <h3 className="text-2xl font-black text-primary dark:text-white tracking-tight">{section.name}</h3>
                         </div>
                      </div>

                      <div className="mt-8 space-y-6">
                         <div className={cn("flex flex-wrap gap-2", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                            {section.subjects.map(s => (
                              <span key={s} className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 rounded-xl border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-slate-700 hover:text-primary dark:hover:text-white transition-all">
                                {s}
                              </span>
                            ))}
                         </div>
                         
                         <div className={cn("flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                            <div className={cn("flex items-center gap-3", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                               <div className={cn("w-3 h-3 rounded-full", section.occupancy === t('quiet') ? "bg-emerald-500" : section.occupancy === t('activeOccupancy') ? "bg-amber-500" : "bg-blue-500")} />
                               <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{section.occupancy} {language === 'ar' ? 'الآن' : 'Now'}</span>
                            </div>
                            <button className={cn("text-[10px] font-black text-primary dark:text-accent uppercase tracking-widest flex items-center gap-2 group-hover:text-accent dark:group-hover:text-white transition-colors", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                                {t('previewShelves')}
                                <ChevronRight className={cn("w-4 h-4", dir === 'rtl' ? 'rotate-180' : '')} />
                            </button>
                         </div>
                      </div>
                   </div>
                 ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Intelligence */}
        <div className="w-full xl:w-[450px] flex flex-col gap-8">
          {bookData ? (
            <motion.div 
              initial={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-[2rem] p-12 bg-primary dark:bg-slate-950 text-white shadow-[0_50px_100px_rgba(11,60,93,0.3)] dark:shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden relative"
            >
              <div className={cn("absolute top-0 w-64 h-64 bg-accent/10 rounded-full blur-[100px] -mt-32", dir === 'rtl' ? 'left-0 -ml-32' : 'right-0 -mr-32')} />

              <div className="relative z-10 space-y-12 bg-white/10 dark:bg-slate-900/60 p-8 rounded-[2rem] text-white backdrop-blur-md border border-white/5 dark:border-white/10">
                 <div className="flex justify-center">
                    <div className="relative group">
                       <img
                          src={bookData.coverUrl}
                          className="w-48 h-72 object-cover rounded-[1.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] border-4 border-white/10 dark:border-white/5"
                          alt=""
                          referrerPolicy="no-referrer"
                        />
                       <div className={cn("absolute -bottom-6 w-16 h-16 bg-accent rounded-3xl flex items-center justify-center text-primary shadow-2xl border-4 border-primary dark:border-slate-950", dir === 'rtl' ? '-left-6' : '-right-6')}>
                          <Navigation className={cn("w-7 h-7", dir === 'rtl' ? 'rotate-180' : '')} />
                       </div>
                    </div>
                 </div>

                 <div className="text-center space-y-4">
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">{t('navigationOn')}</div>
                    <h2 className="text-3xl font-black leading-tight tracking-tight text-white drop-shadow-sm">{bookData.title}</h2>
                    <p className="text-white/60 font-bold uppercase text-[12px] tracking-widest flex items-center justify-center gap-2">
                       <UserIcon className="w-4 h-4" />
                       {bookData.author}
                    </p>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 border border-white/10 p-6 rounded-3xl text-center backdrop-blur-md">
                       <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 opacity-70 leading-relaxed">{t('digitalView')} ({t('shelfShort')})</div>
                       <div className="text-3xl font-black text-white">{bookData.shelf}</div>
                    </div>
                    <div className="bg-white/10 border border-white/10 p-6 rounded-3xl text-center backdrop-blur-md">
                       <div className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 opacity-70 leading-relaxed">{t('bookHall', { section: '' })}</div>
                       <div className="text-3xl font-black text-white">{bookData.section}</div>
                    </div>
                 </div>

                 <div className="space-y-4 pt-4">
                    <button
                      onClick={() => navigate(`/book/${bookData.id}`)}
                      className="w-full py-5 bg-accent text-primary rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:brightness-110 shadow-lg shadow-accent/20 transition-all active:scale-95"
                    >
                       <span>{t('viewReferenceData')}</span>
                    </button>
                    <button
                      onClick={() => { setSelectedBook(null); setShowPath(false); }}
                      className="w-full py-4 text-white/60 hover:text-red-400 font-black text-[11px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                       <X className="w-4 h-4" />
                       {t('cancelActiveNavigation')}
                    </button>
                 </div>
              </div>
            </motion.div>
          ) : (
            <div className="official-card p-16 flex flex-col items-center justify-center text-center gap-10 min-h-[500px] border-dashed border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl shadow-black/5 dark:shadow-black/20">
               <div className="relative">
                  <div className="w-32 h-32 bg-slate-50 dark:bg-slate-800 rounded-[3.5rem] flex items-center justify-center text-slate-200 dark:text-slate-700">
                     <Compass className="w-16 h-16" />
                  </div>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-4 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[4rem]"
                  />
               </div>
               
               <div className="space-y-4">
                  <h3 className="text-2xl font-black text-primary dark:text-white tracking-tight">{t('searchReferenceFirst')}</h3>
                  <p className="text-slate-400 dark:text-slate-500 font-bold leading-relaxed px-4">
                    {t('unifiedSearchDesc')}
                  </p>
               </div>

               <button 
                onClick={() => navigate('/')}
                className="w-full py-6 rounded-[2.5rem] border-2 border-primary dark:border-accent text-primary dark:text-accent font-black text-xs uppercase tracking-[0.3em] hover:bg-primary dark:hover:bg-accent hover:text-white dark:hover:text-primary transition-all active:scale-95 shadow-lg shadow-black/5"
               >
                 {t('searchInIndex')}
               </button>

               <div className={cn("flex items-center gap-8 pt-8 border-t border-slate-100 dark:border-white/5 w-full justify-center", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                  <div className="text-center">
                    <div className="text-lg font-black text-primary dark:text-white tracking-tighter">١٥٠ألف+</div>
                    <div className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase leading-relaxed">{t('indexedBooks')}</div>
                  </div>
                  <div className="w-px h-10 bg-slate-100 dark:bg-white/5" />
                  <div className="text-center">
                    <div className="text-lg font-black text-emerald-500 tracking-tighter">{language === 'ar' ? 'مباشر' : 'Live'}</div>
                    <div className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase leading-relaxed">{t('shelfUpdates')}</div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
