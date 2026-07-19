import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Map as MapIcon, Compass, Camera, X, Box, User as UserIcon, Search } from 'lucide-react';
import { MOCK_BOOKS } from '../data/mockData';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../hooks/useLanguage';
import { ShelfIdentityPanel } from '../components/ShelfIdentityPanel';
import { BookCover } from '../components/BookCover';

interface ManualTarget {
  id: string;
}

const DARK_NAV_PATH_D = 'M 300,460 C 300,380 190,340 210,260 C 230,180 260,140 285,90';
const SHELF_SILHOUETTE_ROWS = [0, 100, 200, 300, 400];
const SHELF_SPINE_WIDTHS = [14, 9, 17, 11, 15, 10, 18, 12, 13, 8];
const SHELF_SPINE_COLORS = ['#0e7490', '#155e75', '#D9B310', '#0891b2', '#164e63', '#0e7490', '#0c6a7a', '#1a7a6a'];
const AR_BOOK_TOP_OFFSETS = [12, 22, 5, 18, 3, 16, 8, 26, 4, 20];
const AR_BOOK_XS = SHELF_SPINE_WIDTHS.reduce<number[]>((acc, w, i) => {
  acc.push(i === 0 ? 4 : acc[i - 1] + SHELF_SPINE_WIDTHS[i - 1] + 2);
  return acc;
}, []);
const AR_SHELF_PANEL_W = AR_BOOK_XS[AR_BOOK_XS.length - 1] + SHELF_SPINE_WIDTHS[SHELF_SPINE_WIDTHS.length - 1] + 8;

export function LibraryMap() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language, dir } = useLanguage();
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [showPath, setShowPath] = useState(false);
  const [manualTarget, setManualTarget] = useState<ManualTarget | null>(null);

  const [activeTab, setActiveTab] = useState<'map' | 'sections'>('map');
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  const [sidebarSearch, setSidebarSearch] = useState('');

  const sidebarSearchResults = useMemo(() => {
    const q = sidebarSearch.trim().toLowerCase();
    if (!q) return MOCK_BOOKS.slice(0, 6);
    return MOCK_BOOKS.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      (b.category ?? '').toLowerCase().includes(q)
    ).slice(0, 8);
  }, [sidebarSearch]);

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

  const bookData = MOCK_BOOKS.find(b => b.id === selectedBook);

  const navigateToCell = (cellId: string) => {
    setSelectedBook(null);
    setManualTarget({ id: cellId });
    setShowPath(true);
    setActiveTab('map');
    if (typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(80); } catch { /* best-effort */ }
    }
  };

  useEffect(() => {
    if (location.state?.bookId) {
      setManualTarget(null);
      setSelectedBook(location.state.bookId);
      setShowPath(true);
    } else if (location.state?.shelfId) {
      setSelectedBook(null);
      setManualTarget({ id: location.state.shelfId });
      setShowPath(true);
      if (location.state?.openAR) {
        setActiveTab('sections');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const destinationShelfId = manualTarget?.id || bookData?.shelf || null;
  const destinationLabel = manualTarget
    ? t('shelfId', { id: manualTarget.id })
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

  // Floor guidance reuses the same ground/1st/2nd/3rd floor labels already
  // used for facility locations, so a shelf destination also tells the
  // student which floor to head to, not just which aisle. The numeric level
  // also feeds the walking-time estimate below - reaching a higher floor
  // takes longer than a same-floor stroll, not just a longer flat distance.
  const FLOOR_LABEL_KEY_BY_SECTION: Record<string, string> = {
    A: 'facilityLocationPrinting',
    B: 'facilityLocationComputerLab',
    C: 'facilityLocationGroupStudy',
    D: 'facilityLocationSilentZone',
    E: 'facilityLocationPrinting',
  };
  const FLOOR_LEVEL_BY_SECTION: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 0 };
  const destinationFloorLabel = destinationSectionId ? t(FLOOR_LABEL_KEY_BY_SECTION[destinationSectionId] ?? 'facilityLocationPrinting') : '';
  const destinationFloorLevel = destinationSectionId ? (FLOOR_LEVEL_BY_SECTION[destinationSectionId] ?? 0) : 0;

  // Walking time: a same-floor walk of ~30-83m realistically takes about a
  // minute, plus roughly 25 extra seconds per floor climbed by stairs - so
  // the estimate (and the live countdown below) actually reflects the floor,
  // not just a flat number regardless of how far up the destination is.
  const totalWalkSeconds = destinationShelfId
    ? Math.max(60, Math.round((distanceMeters / 50) * 60) + destinationFloorLevel * 25)
    : 0;
  const etaMinutes = Math.max(1, Math.round(totalWalkSeconds / 60));

  // Live "walking" simulation: once navigation is active, distance/time and
  // the current turn-by-turn step count down/advance over the estimated walk
  // duration instead of sitting on a single static number the whole time.
  // Gated on activeTab (not just showPath) because showPath is often already
  // true before the student ever switches to this tab - e.g. selecting a
  // shelf on the grid sets it while staying on the "map" tab - so timing the
  // walk from showPath alone meant it could finish in the background before
  // this screen was even visible, leaving distance/time stuck at 0 on arrival.
  const [walkProgress, setWalkProgress] = useState(0);
  useEffect(() => {
    if (!showPath || !destinationShelfId || activeTab !== 'sections') {
      setWalkProgress(0);
      return;
    }
    setWalkProgress(0);
    const WALK_DURATION_MS = totalWalkSeconds * 1000;
    const startedAt = Date.now();
    let rafId = 0;
    const tick = () => {
      const progress = Math.min((Date.now() - startedAt) / WALK_DURATION_MS, 1);
      setWalkProgress(progress);
      if (progress < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [showPath, destinationShelfId, activeTab, totalWalkSeconds]);

  const liveDistanceMeters = Math.round(distanceMeters * (1 - walkProgress));
  const liveEtaMinutes = Math.max(0, Math.round(etaMinutes * (1 - walkProgress)));
  const hasArrived = showPath && walkProgress >= 1;
  const liveStepIndex = navigationSteps.length > 0
    ? Math.min(navigationSteps.length - 1, Math.floor(walkProgress * navigationSteps.length))
    : 0;

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
               onClick={() => setActiveTab('map')}
               className={cn(
                 "px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-3",
                 activeTab === 'map' ? "bg-white dark:bg-slate-800 text-primary dark:text-accent shadow-lg shadow-black/5" : "text-slate-400 hover:text-primary dark:hover:text-slate-200"
               )}
             >
               <MapPin className="w-4 h-4" />
               {t('digitalView')}
             </button>
             <button
               onClick={() => setActiveTab('sections')}
               className={cn(
                 "px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-3",
                 activeTab === 'sections' ? "bg-white dark:bg-slate-800 text-primary dark:text-accent shadow-lg shadow-black/5" : "text-slate-400 hover:text-primary dark:hover:text-slate-200"
               )}
             >
               <Camera className="w-4 h-4" />
               {language === 'ar' ? 'AR توجيه' : 'AR Guide'}
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
          {activeTab === 'map' && (
            <div className="absolute inset-0 z-0 pointer-events-none">
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#004C6D 1px, transparent 1px), linear-gradient(90deg, #004C6D 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              <div className="absolute inset-0 opacity-[0.01] dark:opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(#004C6D 1px, transparent 1px), linear-gradient(90deg, #004C6D 1px, transparent 1px)', backgroundSize: '200px 200px' }} />

              {/* Compass Rose Decoration */}
              <div className={cn("absolute bottom-12 opacity-5 scale-150 text-primary dark:text-white", dir === 'rtl' ? 'left-12' : 'right-12')}>
                 <Compass className="w-48 h-48" />
              </div>
            </div>
          )}

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
                  {/* "View AR Guide" nudge when a destination is set */}
                  {destinationShelfId && (
                    <button
                      onClick={() => setActiveTab('sections')}
                      className={cn(
                        'absolute bottom-6 z-40 flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-accent text-xs font-black shadow-xl shadow-primary/30 hover:brightness-110 transition-all active:scale-95',
                        dir === 'rtl' ? 'right-6' : 'left-6'
                      )}
                    >
                      <Camera className="w-4 h-4" />
                      {language === 'ar' ? 'عرض AR توجيه' : 'View AR Guide'}
                    </button>
                  )}
              </motion.div>
            ) : (
              <motion.div
                key="sections"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative w-full h-full min-h-[650px] bg-[#01354C] dark:bg-[#010f1a] flex flex-col overflow-hidden"
              >
                {destinationShelfId ? (
                  <>
                    {/* Bookshelf aisle silhouette - stacked "book spine" bars
                        resting on a wooden plank line along both edges, so
                        the dark screen reads as a real library aisle lined
                        with shelved books instead of an empty black void. */}
                    <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none" viewBox="0 0 600 500" preserveAspectRatio="xMidYMid slice">
                      {SHELF_SILHOUETTE_ROWS.map((rowY, rowIdx) => (
                        <g key={rowY}>
                          {SHELF_SPINE_WIDTHS.map((w, i) => {
                            const topOff = AR_BOOK_TOP_OFFSETS[(rowIdx * 3 + i) % AR_BOOK_TOP_OFFSETS.length];
                            return <rect key={`l-${i}`} x={AR_BOOK_XS[i]} y={rowY + topOff} width={w} height={88 - topOff} rx={2} fill={SHELF_SPINE_COLORS[i % SHELF_SPINE_COLORS.length]} />;
                          })}
                          <rect x={0} y={rowY + 88} width={AR_SHELF_PANEL_W} height={8} rx={1.5} fill="#6b4423" />
                          {SHELF_SPINE_WIDTHS.map((_w, i) => {
                            const ri = SHELF_SPINE_WIDTHS.length - 1 - i;
                            const topOff = AR_BOOK_TOP_OFFSETS[(rowIdx * 3 + ri) % AR_BOOK_TOP_OFFSETS.length];
                            return <rect key={`r-${i}`} x={600 - AR_BOOK_XS[ri] - SHELF_SPINE_WIDTHS[ri]} y={rowY + topOff} width={SHELF_SPINE_WIDTHS[ri]} height={88 - topOff} rx={2} fill={SHELF_SPINE_COLORS[(ri + 2) % SHELF_SPINE_COLORS.length]} />;
                          })}
                          <rect x={600 - AR_SHELF_PANEL_W} y={rowY + 88} width={AR_SHELF_PANEL_W} height={8} rx={1.5} fill="#6b4423" />
                        </g>
                      ))}
                    </svg>
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
                        d={DARK_NAV_PATH_D}
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
                      {/* Once navigation is actively started, a stream of
                          arrows flows along the same path so the yellow
                          route visibly indicates the direction of travel
                          instead of sitting static. */}
                      {[0, 1, 2].map((i) => (
                        <polygon key={i} points="-7,-9 8,0 -7,9" fill="#D9B310" stroke="#01354C" strokeWidth="1">
                          <animateMotion dur="2.2s" begin={`${i * 0.75}s`} repeatCount="indefinite" rotate="auto" path={DARK_NAV_PATH_D} />
                        </polygon>
                      ))}
                      <circle cx="285" cy="90" r="13" fill="#D9B310" stroke="white" strokeWidth="3" />
                      <motion.circle
                        cx="285" cy="90" r="13"
                        stroke="#D9B310" strokeWidth="2" fill="none"
                        animate={{ r: [13, 32, 13], opacity: [0.7, 0, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </svg>

                    <div className="absolute top-24 inset-x-0 flex flex-col items-center gap-2.5 z-20 px-10">
                      <div className="px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-white text-xs font-black flex items-center gap-2">
                        <Navigation className={cn("w-4 h-4 text-accent", dir === 'rtl' ? 'rotate-180' : '')} />
                        {t('headTowardsShelf', { shelf: destinationShelfId })}
                      </div>
                      {/* Floor guidance, right under the heading, so the user
                          knows which floor to head to as well. Facilities carry
                          their own real floor label; shelves derive it. */}
                      <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Box className="w-3.5 h-3.5 text-accent/80" />
                        {destinationFloorLabel}
                      </div>
                      {/* Distance/ETA surfaced right under the heading so it's
                          visible without scrolling the tall aisle view on a
                          phone screen, and count down live once navigation
                          starts instead of sitting on one static number. */}
                      <div className="px-5 py-2 rounded-full bg-accent/15 backdrop-blur-xl border border-accent/30 text-accent text-[11px] font-black flex items-center gap-3">
                        <span>{t('distanceLabel')}: {showPath ? liveDistanceMeters : distanceMeters}{language === 'ar' ? ' م' : 'm'}</span>
                        <span className="w-1 h-1 rounded-full bg-accent/50" />
                        <span>{t('etaLabel')}: {showPath ? liveEtaMinutes : etaMinutes}{language === 'ar' ? ' د' : ' min'}</span>
                      </div>
                      {/* Live turn-by-turn instruction — shown immediately so the
                          student knows what to do right away, and cycles
                          through steps as the simulated walk progresses. */}
                      {navigationSteps.length > 0 && (
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={hasArrived ? 'arrived' : liveStepIndex}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            className={cn(
                              "px-5 py-2 rounded-full backdrop-blur-xl border text-[11px] font-black flex items-center gap-2 max-w-full",
                              hasArrived ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-white/10 border-white/10 text-white"
                            )}
                          >
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{hasArrived ? t('reachedDestination') : navigationSteps[liveStepIndex]}</span>
                          </motion.div>
                        </AnimatePresence>
                      )}
                    </div>

                    <div className="relative z-20 mt-auto p-6 space-y-3">
                      <div className={cn("bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2rem] p-5 flex items-center gap-4 shadow-2xl shadow-black/30", dir === 'rtl' ? 'flex-row-reverse text-right' : 'flex-row text-left')}>
                        {bookData ? (
                          <BookCover book={bookData} className="w-16 h-[5.25rem] rounded-xl shrink-0 shadow-lg" />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shrink-0">
                            <Navigation className={cn('w-7 h-7', dir === 'rtl' ? 'rotate-180' : '')} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-primary dark:text-white text-sm truncate">{destinationLabel}</h4>
                          <div className={cn("flex items-center gap-4 mt-1 text-[10px] font-bold text-slate-400", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                            <span>{t('distanceLabel')}: {showPath ? liveDistanceMeters : distanceMeters}{language === 'ar' ? ' م' : 'm'}</span>
                            <span>{t('etaLabel')}: {showPath ? liveEtaMinutes : etaMinutes}{language === 'ar' ? ' د' : ' min'}</span>
                          </div>
                        </div>
                      </div>
                      {showPath ? (
                        <div className={cn(
                          "w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-colors",
                          hasArrived ? "bg-emerald-500/25 border border-emerald-500/40 text-emerald-400" : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                        )}>
                          <span className={cn("w-2 h-2 rounded-full bg-emerald-400", !hasArrived && "animate-pulse")} />
                          {hasArrived ? t('reachedDestination') : t('navigationInProgressLabel')}
                        </div>
                      ) : (
                        <button
                          onClick={() => { if (typeof navigator.vibrate === 'function') { try { navigator.vibrate(80); } catch { /* best-effort */ } } setShowPath(true); }}
                          className="w-full py-4 bg-accent text-primary rounded-2xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95"
                        >
                          {t('startNavigationLabel')}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 text-white/40 p-12">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                      <Compass className="w-10 h-10" />
                    </div>
                    <p className="text-sm font-bold max-w-xs">{t('selectDestinationFirstLabel')}</p>
                    <button
                      onClick={() => navigate('/search')}
                      className="px-6 py-3 bg-accent text-primary rounded-2xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95"
                    >
                      {t('searchNowLabel')}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Intelligence */}
        <div className="w-full xl:w-[450px] flex flex-col gap-8">
          {bookData ? (
            /* ══ SHELVES TAB: book selected → book navigation ══ */
            <motion.div
              initial={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="official-card p-8 bg-white dark:bg-slate-900"
            >
              <div className="space-y-10">
                <div className="flex justify-center">
                  <div className="relative group">
                    <BookCover book={bookData} className="w-48 h-72 rounded-[1.5rem] shadow-lg border border-slate-100 dark:border-white/10" />
                    <div className={cn("absolute -bottom-6 w-16 h-16 bg-accent rounded-3xl flex items-center justify-center text-primary shadow-lg border-4 border-white dark:border-slate-900", dir === 'rtl' ? '-left-6' : '-right-6')}>
                      <Navigation className={cn("w-7 h-7", dir === 'rtl' ? 'rotate-180' : '')} />
                    </div>
                  </div>
                </div>
                <div className="text-center space-y-4">
                  <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">{t('navigationOn')}</div>
                  <h2 className="text-3xl font-black leading-tight tracking-tight text-primary dark:text-white">{bookData.title}</h2>
                  <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-[12px] tracking-widest flex items-center justify-center gap-2">
                    <UserIcon className="w-4 h-4" />{bookData.author}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 p-6 rounded-3xl text-center">
                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{t('digitalView')} ({t('shelfShort')})</div>
                    <div className="text-3xl font-black text-primary dark:text-white">{bookData.shelf}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 p-6 rounded-3xl text-center">
                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{t('bookHall', { section: '' })}</div>
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
                  <button onClick={() => navigate('/ar-showcase')} className="w-full py-5 bg-accent text-primary rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:brightness-110 shadow-sm transition-all active:scale-95">
                    <span>{t('viewReferenceData')}</span>
                  </button>
                  <button onClick={() => { setSelectedBook(null); setShowPath(false); }} className="w-full py-4 text-slate-400 dark:text-slate-500 hover:text-red-500 font-black text-[11px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                    <X className="w-4 h-4" />{t('cancelActiveNavigation')}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : manualTarget ? (
            /* Shelf cell selected → shelf navigation */
            <motion.div
              initial={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="official-card p-8 bg-white dark:bg-slate-900"
            >
              <div className="space-y-8">
                <div className="flex justify-center">
                  <div className="w-28 h-28 bg-accent/10 dark:bg-accent/15 rounded-[2.5rem] flex items-center justify-center text-primary dark:text-accent">
                    <Navigation className={cn("w-12 h-12", dir === 'rtl' ? 'rotate-180' : '')} />
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
                <button onClick={() => { setManualTarget(null); setShowPath(false); }} className="w-full py-4 text-slate-400 dark:text-slate-500 hover:text-red-500 font-black text-[11px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                  <X className="w-4 h-4" />{t('cancelActiveNavigation')}
                </button>
              </div>
            </motion.div>
          ) : (
            /* ── Book search sidebar (shelves tab, nothing selected) ── */
            <div className="official-card flex flex-col bg-white dark:bg-slate-900 shadow-2xl shadow-black/5 dark:shadow-black/20 overflow-hidden min-h-[500px]">
              <div className="px-7 pt-7 pb-5 border-b border-slate-100 dark:border-white/5">
                <div className={cn("flex items-center gap-3 mb-4", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                  <div className="w-9 h-9 bg-primary/10 dark:bg-accent/10 rounded-xl flex items-center justify-center text-primary dark:text-accent">
                    <Search className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-black text-primary dark:text-white tracking-tight">{t('searchReferenceFirst')}</h3>
                </div>
                <div className="relative">
                  <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none", dir === 'rtl' ? 'right-4' : 'left-4')} />
                  <input
                    type="text"
                    value={sidebarSearch}
                    onChange={e => setSidebarSearch(e.target.value)}
                    placeholder={language === 'ar' ? 'اسم الكتاب، المؤلف، التصنيف...' : 'Title, author, category...'}
                    className={cn(
                      "w-full py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold text-primary dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors",
                      dir === 'rtl' ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4 text-left'
                    )}
                  />
                  {sidebarSearch && (
                    <button onClick={() => setSidebarSearch('')} className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors", dir === 'rtl' ? 'left-4' : 'right-4')}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-white/5">
                {sidebarSearchResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-300 dark:text-slate-600">
                    <Compass className="w-8 h-8" />
                    <p className="text-xs font-bold">{language === 'ar' ? 'لا توجد نتائج' : 'No results'}</p>
                  </div>
                ) : (
                  sidebarSearchResults.map(book => (
                    <button
                      key={book.id}
                      onClick={() => {
                        setSelectedBook(book.id);
                        setManualTarget(null);
                        setShowPath(true);
                        setActiveTab('map');
                      }}
                      className={cn(
                        "w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group",
                        dir === 'rtl' ? 'flex-row-reverse text-right' : 'flex-row text-left'
                      )}
                    >
                      <BookCover book={book} className="w-10 h-14 rounded-xl shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-primary dark:text-white truncate leading-tight group-hover:text-primary dark:group-hover:text-accent transition-colors">{book.title}</p>
                        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 truncate mt-0.5">{book.author}</p>
                        <div className={cn("flex items-center gap-2 mt-1.5", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                          <span className="text-[9px] font-black text-primary/60 dark:text-accent/80 bg-primary/5 dark:bg-accent/10 px-2 py-0.5 rounded-lg uppercase tracking-wider">{book.shelf}</span>
                          <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600 truncate">{book.category}</span>
                        </div>
                      </div>
                      <Navigation className={cn("w-4 h-4 shrink-0 text-slate-200 dark:text-slate-700 group-hover:text-primary dark:group-hover:text-accent transition-colors", dir === 'rtl' ? 'rotate-180' : '')} />
                    </button>
                  ))
                )}
              </div>

              <div className="px-7 py-4 border-t border-slate-50 dark:border-white/5">
                <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 text-center leading-relaxed">
                  {language === 'ar' ? 'اختر كتاباً لعرض مساره على الخريطة' : 'Pick a book to show its route on the map'}
                </p>
              </div>
            </div>
          )}

          {manualTarget && !bookData && destinationShelfId && (
            <ShelfIdentityPanel
              shelfId={destinationShelfId}
              booksOnShelf={MOCK_BOOKS.filter(b => b.shelf === destinationShelfId && b.id !== bookData?.id)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
