import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Map as MapIcon, Compass, Camera, X, Box, User as UserIcon, Users, VolumeX, Monitor, Printer } from 'lucide-react';
import { MOCK_BOOKS } from '../data/mockData';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../hooks/useLanguage';

interface ManualTarget {
  id: string;
}

export function LibraryMap() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language, dir } = useLanguage();
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [showPath, setShowPath] = useState(false);
  const [manualTarget, setManualTarget] = useState<ManualTarget | null>(null);

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

  const sections = [
    { id: 'A', name: t('naturalSciences'), icon: '🧪', subjects: [t('physics'), t('chemistry'), t('biology')], color: 'bg-blue-500', occupancy: t('quiet') },
    { id: 'B', name: t('engineeringAndTech'), icon: '⚙️', subjects: [t('mechEngineering'), t('ai'), t('software')], color: 'bg-orange-500', occupancy: t('activeOccupancy') },
    { id: 'C', name: t('artsAndCrafts'), icon: '🎨', subjects: [t('arabicLit'), t('graphicDesign'), t('philosophy')], color: 'bg-purple-500', occupancy: t('mediumOccupancy') },
    { id: 'D', name: t('humanities'), icon: '📚', subjects: [t('history'), t('sociology'), t('geography')], color: 'bg-green-500', occupancy: t('quiet') },
    { id: 'E', name: t('mechanicalAutomotiveEngineering'), icon: '🚗', subjects: [t('mechEngineering')], color: 'bg-red-500', occupancy: t('quiet') }
  ];

  const cells = [
    { id: 'A-1', section: 'A' }, { id: 'A-2', section: 'A' }, { id: 'B-1', section: 'B' }, { id: 'B-2', section: 'B' },
    { id: 'C-1', section: 'C' }, { id: 'C-2', section: 'C' }, { id: 'D-1', section: 'D' }, { id: 'D-2', section: 'D' }
  ];

  const FACILITIES = [
    { icon: Users, name: t('facilityGroupStudyRooms'), desc: t('facilityGroupStudyRoomsDesc'), location: t('facilityLocationGroupStudy'), status: 'available' as const, cellId: 'B-2' },
    { icon: VolumeX, name: t('facilitySilentZone'), desc: t('facilitySilentZoneDesc'), location: t('facilityLocationSilentZone'), status: 'available' as const, cellId: 'D-1' },
    { icon: Monitor, name: t('facilityComputerLab'), desc: t('facilityComputerLabDesc'), location: t('facilityLocationComputerLab'), status: 'busy' as const, cellId: 'A-2' },
    { icon: Printer, name: t('facilityPrinting'), desc: t('facilityPrintingDesc'), location: t('facilityLocationPrinting'), status: 'available' as const, cellId: 'C-1' },
  ];

  const bookData = MOCK_BOOKS.find(b => b.id === selectedBook);

  const navigateToCell = (cellId: string) => {
    setSelectedBook(null);
    setManualTarget({ id: cellId });
    setShowPath(true);
    setResourceTab('shelves');
    setActiveTab('map');
    // Light haptic confirmation that navigation started, so the user doesn't
    // have to visually double-check the destination was registered.
    if (typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(80); } catch { /* vibration is best-effort */ }
    }
  };

  useEffect(() => {
    if (location.state?.bookId) {
      setManualTarget(null);
      setSelectedBook(location.state.bookId);
      setShowPath(true);
    }
    if (location.state?.tab === 'facilities') {
      setResourceTab('facilities');
    }
    if (location.state?.facilityName) {
      const match = FACILITIES.find(f => f.name === location.state.facilityName);
      if (match) navigateToCell(match.cellId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const destinationShelfId = manualTarget?.id || bookData?.shelf || null;
  const targetFacility = manualTarget ? FACILITIES.find(f => f.cellId === manualTarget.id) : undefined;
  const destinationLabel = manualTarget
    ? (targetFacility?.name ?? t('shelfId', { id: manualTarget.id }))
    : bookData ? bookData.title : '';
  const destinationSectionId = destinationShelfId ? destinationShelfId.split('-')[0] : null;
  const destinationSectionName = sections.find(s => s.id === destinationSectionId)?.name || '';

  const navigationSteps = destinationShelfId ? [
    t('navStepStart'),
    t('navStepAisle'),
    destinationSectionId === 'A' || destinationSectionId === 'C'
      ? t('navStepTurnLeft', { section: destinationSectionName })
      : t('navStepTurnRight', { section: destinationSectionName }),
    t('navStepArrive', { destination: destinationLabel }),
  ] : [];

  // Simulated walking distance: sections further from the main entrance (in
  // aisle order A -> D) get a larger base distance, with a small offset for
  // the second shelf in each aisle, so different destinations don't all show
  // the exact same numbers.
  const DISTANCE_BY_SECTION: Record<string, number> = { A: 30, B: 45, C: 60, D: 75 };
  const distanceMeters = destinationShelfId
    ? (DISTANCE_BY_SECTION[destinationShelfId.split('-')[0]] ?? 45) + (destinationShelfId.endsWith('-2') ? 8 : 0)
    : 0;
  const etaMinutes = Math.max(1, Math.round(distanceMeters / 50));

  const getPathData = () => {
    if (!destinationShelfId) return "";
    const paths: Record<string, string> = {
      'A-1': "M 300,450 L 300,350 L 100,350 L 100,100",
      'A-2': "M 300,450 L 300,350 L 250,350 L 250,100",
      'B-1': "M 300,450 L 300,350 L 400,350 L 400,100",
      'B-2': "M 300,450 L 300,350 L 550,350 L 550,100",
      'C-1': "M 300,450 L 300,350 L 100,350 L 100,250",
      'C-2': "M 300,450 L 300,350 L 250,350 L 250,250",
      'D-1': "M 300,450 L 300,350 L 550,350 L 550,250",
      'D-2': "M 300,450 L 300,350 L 400,350 L 400,250",
    };
    return paths[destinationShelfId] || "M 300,450 L 300,200";
  };

  return (
    <div className={cn("h-full flex flex-col gap-8 animate-in duration-500 font-sans", dir === 'rtl' ? 'slide-in-from-left-4 text-right' : 'slide-in-from-right-4 text-left')}>
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
               onClick={() => { setResourceTab('shelves'); setActiveTab('map'); }}
               className={cn(
                 "px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-3",
                 resourceTab !== 'facilities' && activeTab === 'map' ? "bg-white dark:bg-slate-800 text-primary dark:text-accent shadow-lg shadow-black/5" : "text-slate-400 hover:text-primary dark:hover:text-slate-200"
               )}
             >
               <MapPin className="w-4 h-4" />
               {t('digitalView')}
             </button>
             <button
               onClick={() => { setResourceTab('shelves'); setActiveTab('sections'); }}
               className={cn(
                 "px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-3",
                 resourceTab !== 'facilities' && activeTab === 'sections' ? "bg-white dark:bg-slate-800 text-primary dark:text-accent shadow-lg shadow-black/5" : "text-slate-400 hover:text-primary dark:hover:text-slate-200"
               )}
             >
               <Box className="w-4 h-4" />
               {t('mainSections')}
             </button>
             <button
               onClick={() => setResourceTab('facilities')}
               className={cn(
                 "px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-3",
                 resourceTab === 'facilities' ? "bg-white dark:bg-slate-800 text-primary dark:text-accent shadow-lg shadow-black/5" : "text-slate-400 hover:text-primary dark:hover:text-slate-200"
               )}
             >
               <Compass className="w-4 h-4" />
               {t('libraryFacilities')}
             </button>
          </div>

          {bookData && (
            <button
              onClick={() => navigate('/ar', { state: { book: bookData } })}
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
        <div className="flex-1 official-card relative overflow-hidden min-h-[650px] p-0 transition-all duration-500 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20">
          {/* Blueprint Grid Overlay */}
          {activeTab === 'map' && resourceTab !== 'facilities' && (
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#004C6D 1px, transparent 1px), linear-gradient(90deg, #004C6D 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              <div className="absolute inset-0 opacity-[0.01] dark:opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#004C6D 1px, transparent 1px), linear-gradient(90deg, #004C6D 1px, transparent 1px)', backgroundSize: '200px 200px' }} />

              {/* Compass Rose Decoration */}
              <div className={cn("absolute bottom-12 opacity-5 scale-150 text-primary dark:text-white", dir === 'rtl' ? 'left-12' : 'right-12')}>
                 <Compass className="w-48 h-48" />
              </div>
            </div>
          )}

          {resourceTab === 'facilities' ? (
            <div className="relative z-10 w-full h-full p-12 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {FACILITIES.map((facility) => (
                  <div
                    key={facility.name}
                    onClick={() => navigateToCell(facility.cellId)}
                    className="official-card p-6 flex items-center gap-5 bg-white dark:bg-slate-900 cursor-pointer hover:border-accent dark:hover:border-accent transition-all"
                  >
                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-primary/10 dark:bg-accent/10 flex items-center justify-center text-primary dark:text-accent">
                      <facility.icon className="w-6 h-6" />
                    </div>
                    <div className={cn("flex-1 min-w-0 space-y-1", dir === 'rtl' ? 'text-right' : 'text-left')}>
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-black text-primary dark:text-white text-sm leading-tight">{facility.name}</h4>
                        <span className={cn(
                          "shrink-0 text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider",
                          facility.status === 'available'
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                        )}>
                          {facility.status === 'available' ? t('facilityAvailable') : t('facilityBusy')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold leading-relaxed">{facility.desc}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigateToCell(facility.cellId); }}
                        className="flex items-center gap-1.5 pt-1 text-[10px] font-black text-primary/60 dark:text-accent hover:text-primary dark:hover:text-white hover:underline cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{facility.location}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'map' ? (
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
                      const isDestination = destinationShelfId === cell.id;
                      const occupancy = occupancyData[cell.id as keyof typeof occupancyData];
                      const isHovered = hoveredCell === cell.id;

                      return (
                        <motion.div
                          key={cell.id}
                          onHoverStart={() => setHoveredCell(cell.id)}
                          onHoverEnd={() => setHoveredCell(null)}
                          onClick={() => !bookData && navigateToCell(cell.id)}
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
                  {showPath && destinationShelfId && (
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative w-full h-full min-h-[650px] bg-slate-950 flex flex-col overflow-hidden"
              >
                {destinationShelfId ? (
                  <>
                    <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)', backgroundSize: '26px 26px' }} />

                    <div className={cn("absolute top-6 z-20 flex items-center gap-3", dir === 'rtl' ? 'right-6' : 'left-6')}>
                      <button
                        onClick={() => { setManualTarget(null); setSelectedBook(null); setShowPath(false); }}
                        className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-xl border border-white/10 transition-all active:scale-95"
                      >
                        {t('changeRouteLabel')}
                      </button>
                    </div>

                    {/* Hands off to the real camera-based AR guidance; the
                        dark path here is a simulated preview of that same
                        route. */}
                    <button
                      onClick={() => navigate('/ar', bookData ? { state: { book: bookData } } : undefined)}
                      title={t('enterArMode')}
                      className={cn("absolute top-6 z-20 p-3 rounded-full bg-accent text-primary shadow-[0_8px_24px_rgba(217,179,16,0.4)] hover:brightness-110 transition-all active:scale-90", dir === 'rtl' ? 'left-6' : 'right-6')}
                    >
                      <Camera className="w-4 h-4" />
                    </button>

                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 500" preserveAspectRatio="xMidYMid slice">
                      <defs>
                        <linearGradient id="darkPathGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                          <stop offset="0%" stopColor="#D9B310" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#D9B310" stopOpacity="1" />
                        </linearGradient>
                        <filter id="darkGlow">
                          <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <motion.path
                        d="M 300,460 C 300,380 190,340 210,260 C 230,180 260,140 285,90"
                        stroke="url(#darkPathGradient)"
                        strokeWidth="10"
                        strokeDasharray="4 16"
                        strokeLinecap="round"
                        fill="none"
                        filter="url(#darkGlow)"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: 'easeInOut' }}
                      />
                      <circle cx="285" cy="90" r="13" fill="#D9B310" stroke="white" strokeWidth="3" />
                      <motion.circle
                        cx="285" cy="90" r="13"
                        stroke="#D9B310" strokeWidth="2" fill="none"
                        animate={{ r: [13, 32, 13], opacity: [0.7, 0, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </svg>

                    <div className="absolute top-24 inset-x-0 flex justify-center z-20 px-10">
                      <div className="px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-white text-xs font-black flex items-center gap-2">
                        <Navigation className={cn("w-4 h-4 text-accent", dir === 'rtl' ? 'rotate-180' : '')} />
                        {t('headTowardsShelf', { shelf: destinationShelfId })}
                      </div>
                    </div>

                    <div className="relative z-20 mt-auto p-6 space-y-3">
                      <div className={cn("bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2rem] p-5 flex items-center gap-4 shadow-2xl", dir === 'rtl' ? 'flex-row-reverse text-right' : 'flex-row text-left')}>
                        {bookData && (
                          <img src={bookData.coverUrl} className="w-14 h-[4.5rem] object-cover rounded-xl shrink-0" alt="" referrerPolicy="no-referrer" />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-primary dark:text-white text-sm truncate">{destinationLabel}</h4>
                          <div className={cn("flex items-center gap-4 mt-1 text-[10px] font-bold text-slate-400", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                            <span>{t('distanceLabel')}: {distanceMeters}{language === 'ar' ? ' م' : 'm'}</span>
                            <span>{t('etaLabel')}: {etaMinutes}{language === 'ar' ? ' د' : ' min'}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => { if (typeof navigator.vibrate === 'function') { try { navigator.vibrate(80); } catch { /* best-effort */ } } setShowPath(true); }}
                        className="w-full py-4 bg-accent text-primary rounded-2xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95"
                      >
                        {t('startNavigationLabel')}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 text-white/40 p-12">
                    <Compass className="w-12 h-12" />
                    <p className="text-sm font-bold max-w-xs">{t('selectDestinationFirstLabel')}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          )}
        </div>

        {/* Sidebar Intelligence */}
        <div className="w-full xl:w-[450px] flex flex-col gap-8">
          {bookData ? (
            <motion.div
              initial={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="official-card p-8 bg-white dark:bg-slate-900"
            >
              <div className="space-y-10">
                 <div className="flex justify-center">
                    <div className="relative group">
                       <img
                          src={bookData.coverUrl}
                          className="w-48 h-72 object-cover rounded-[1.5rem] shadow-lg border border-slate-100 dark:border-white/10"
                          alt=""
                          referrerPolicy="no-referrer"
                        />
                       <div className={cn("absolute -bottom-6 w-16 h-16 bg-accent rounded-3xl flex items-center justify-center text-primary shadow-lg border-4 border-white dark:border-slate-900", dir === 'rtl' ? '-left-6' : '-right-6')}>
                          <Navigation className={cn("w-7 h-7", dir === 'rtl' ? 'rotate-180' : '')} />
                       </div>
                    </div>
                 </div>

                 <div className="text-center space-y-4">
                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">{t('navigationOn')}</div>
                    <h2 className="text-3xl font-black leading-tight tracking-tight text-primary dark:text-white">{bookData.title}</h2>
                    <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[12px] tracking-widest flex items-center justify-center gap-2">
                       <UserIcon className="w-4 h-4" />
                       {bookData.author}
                    </p>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 p-6 rounded-3xl text-center">
                       <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 leading-relaxed">{t('digitalView')} ({t('shelfShort')})</div>
                       <div className="text-3xl font-black text-primary dark:text-white">{bookData.shelf}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 p-6 rounded-3xl text-center">
                       <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 leading-relaxed">{t('bookHall', { section: '' })}</div>
                       <div className="text-3xl font-black text-primary dark:text-white">{bookData.section}</div>
                    </div>
                 </div>

                 {navigationSteps.length > 0 && (
                    <div className="space-y-3 pt-2">
                       <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('navigationStepsTitle')}</div>
                       <ol className="space-y-2">
                          {navigationSteps.map((step, idx) => (
                            <li key={idx} className={cn("flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl p-3", dir === 'rtl' ? 'text-right' : 'text-left')}>
                               <span className="shrink-0 w-6 h-6 rounded-full bg-primary dark:bg-accent text-white dark:text-primary text-[11px] font-black flex items-center justify-center">{idx + 1}</span>
                               <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed">{step}</span>
                            </li>
                          ))}
                       </ol>
                    </div>
                 )}

                 <div className="space-y-4 pt-4">
                    <button
                      onClick={() => navigate(`/book/${bookData.id}`)}
                      className="w-full py-5 bg-accent text-primary rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:brightness-110 shadow-sm transition-all active:scale-95"
                    >
                       <span>{t('viewReferenceData')}</span>
                    </button>
                    <button
                      onClick={() => { setSelectedBook(null); setShowPath(false); }}
                      className="w-full py-4 text-slate-400 dark:text-slate-500 hover:text-red-500 font-black text-[11px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                       <X className="w-4 h-4" />
                       {t('cancelActiveNavigation')}
                    </button>
                 </div>
              </div>
            </motion.div>
          ) : manualTarget ? (
            <motion.div
              initial={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="official-card p-8 bg-white dark:bg-slate-900"
            >
              <div className="space-y-8">
                 <div className="flex justify-center">
                    <div className="relative">
                       <div className="w-28 h-28 bg-accent/10 dark:bg-accent/15 rounded-[2.5rem] flex items-center justify-center text-primary dark:text-accent">
                          <Navigation className={cn("w-12 h-12", dir === 'rtl' ? 'rotate-180' : '')} />
                       </div>
                    </div>
                 </div>

                 <div className="text-center space-y-3">
                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">{t('navigationOn')}</div>
                    <h2 className="text-2xl font-black leading-tight tracking-tight text-primary dark:text-white">{destinationLabel}</h2>
                    <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[11px] tracking-widest">{destinationSectionName}</p>
                 </div>

                 <div className="space-y-3">
                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('navigationStepsTitle')}</div>
                    <ol className="space-y-2">
                       {navigationSteps.map((step, idx) => (
                         <li key={idx} className={cn("flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl p-3", dir === 'rtl' ? 'text-right' : 'text-left')}>
                            <span className="shrink-0 w-6 h-6 rounded-full bg-primary dark:bg-accent text-white dark:text-primary text-[11px] font-black flex items-center justify-center">{idx + 1}</span>
                            <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed">{step}</span>
                         </li>
                       ))}
                    </ol>
                 </div>

                 <button
                   onClick={() => { setManualTarget(null); setShowPath(false); }}
                   className="w-full py-4 text-slate-400 dark:text-slate-500 hover:text-red-500 font-black text-[11px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                 >
                    <X className="w-4 h-4" />
                    {t('cancelActiveNavigation')}
                 </button>
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
                  <p className="text-slate-300 dark:text-slate-600 font-bold text-[11px] leading-relaxed px-4">
                    {t('navigateToShelfHint')}
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
