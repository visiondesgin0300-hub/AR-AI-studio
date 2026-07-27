import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Map as MapIcon, Compass, Camera, X, Box, User as UserIcon, Search, Layers, Maximize2 } from 'lucide-react';
import { MOCK_BOOKS } from '../data/mockData';
import { cn, trackMapVisit } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../hooks/useLanguage';
import { ShelfIdentityPanel } from '../components/ShelfIdentityPanel';
import { BookCover } from '../components/BookCover';
import { RafeeqAvatar } from '../components/RafeeqAvatar';
import { Shelf3DView } from '../components/Shelf3DView';
import { UnityMap3D } from '../components/UnityMap3D';

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

  // Award XP for opening the map
  useEffect(() => { trackMapVisit('map'); }, []);

  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [showPath, setShowPath] = useState(false);
  const [manualTarget, setManualTarget] = useState<ManualTarget | null>(null);

  const [activeTab, setActiveTab] = useState<'map' | 'sections'>('map');
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [rafeeqDismissed, setRafeeqDismissed] = useState(false);
  const [map3D, setMap3D] = useState(false);
  const [mapMode, setMapMode] = useState<'flat' | 'unity' | 'ar-floor'>('flat');
  const [showARFloor, setShowARFloor] = useState(false);

  const [sidebarSearch, setSidebarSearch] = useState('');

  const sidebarSearchResults = useMemo(() => {
    const q = sidebarSearch.trim().toLowerCase();
    if (!q) return MOCK_BOOKS;
    return MOCK_BOOKS.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      (b.category ?? '').toLowerCase().includes(q) ||
      (b.shelf ?? '').toLowerCase().includes(q)
    );
  }, [sidebarSearch]);

  // Simulated real-time occupancy data
  const occupancyData = useMemo(() => {
    return {
      'A-1': Math.floor(Math.random() * 100),
      'A-2': Math.floor(Math.random() * 100),
      'B-1': Math.floor(Math.random() * 100),
      'B-2': Math.floor(Math.random() * 100),
      'B-3': Math.floor(Math.random() * 100),
      'B-4': Math.floor(Math.random() * 100),
      'C-1': Math.floor(Math.random() * 100),
      'C-2': Math.floor(Math.random() * 100),
      'D-1': Math.floor(Math.random() * 100),
      'D-2': Math.floor(Math.random() * 100),
      'E-1': Math.floor(Math.random() * 100),
      'E-2': Math.floor(Math.random() * 100),
    };
  }, []);

  const sections = [
    { id: 'A', name: t('naturalSciences'), icon: '🔭', subjects: [t('physics'), t('chemistry'), t('biology')], color: 'bg-blue-500', occupancy: t('quiet') },
    { id: 'B', name: t('engineeringAndTech'), icon: '⚙️', subjects: [t('mechEngineering'), t('ai'), t('software')], color: 'bg-orange-500', occupancy: t('activeOccupancy') },
    { id: 'C', name: t('psychologyAndBehavior'), icon: '🧠', subjects: [t('psychology'), t('philosophy'), t('sociology')], color: 'bg-purple-500', occupancy: t('mediumOccupancy') },
    { id: 'D', name: t('humanities'), icon: '📚', subjects: [t('history'), t('general'), t('philosophy')], color: 'bg-green-500', occupancy: t('quiet') },
    { id: 'E', name: t('economicsAndMarketing'), icon: '📊', subjects: [t('economics'), t('marketing')], color: 'bg-yellow-500', occupancy: t('quiet') },
  ];

  // Per-shelf content labels derived from actual book data in the system
  const CELL_LABELS: Record<string, { ar: string; en: string }> = {
    'A-1': { ar: 'فيزياء كمية وكونية',        en: 'Quantum & Cosmic Physics' },
    'A-2': { ar: 'فيزياء فلكية وجزيئية',       en: 'Astrophysics & Molecular' },
    'B-1': { ar: 'ذكاء اصطناعي وهندسة',        en: 'AI & Engineering' },
    'B-2': { ar: 'برمجيات وشبكات وتقنية',       en: 'Software, Networks & Tech' },
    'B-3': { ar: 'هندسة مدنية وإنشائية',        en: 'Civil & Structural Eng.' },
    'B-4': { ar: 'هندسة ميكانيكية ورياضيات',    en: 'Mechanical Eng. & Math' },
    'C-1': { ar: 'علم نفس معرفي وسلوكي',        en: 'Cognitive & Behavioral Psych.' },
    'C-2': { ar: 'علم نفس وتطوير ذاتي',         en: 'Psychology & Self-Dev.' },
    'D-1': { ar: 'تاريخ وحضارة',                en: 'History & Civilization' },
    'D-2': { ar: 'روايات وفكر وفلسفة',          en: 'Novels, Thought & Philosophy' },
    'E-1': { ar: 'اقتصاد كلي',                  en: 'Macroeconomics' },
    'E-2': { ar: 'تسويق دولي واقتصاد',          en: 'Global Marketing & Econ.' },
  };

  const cells = [
    { id: 'A-1', section: 'A' }, { id: 'A-2', section: 'A' },
    { id: 'B-1', section: 'B' }, { id: 'B-2', section: 'B' }, { id: 'B-3', section: 'B' }, { id: 'B-4', section: 'B' },
    { id: 'C-1', section: 'C' }, { id: 'C-2', section: 'C' },
    { id: 'D-1', section: 'D' }, { id: 'D-2', section: 'D' },
    { id: 'E-1', section: 'E' }, { id: 'E-2', section: 'E' },
  ];

  const bookData = MOCK_BOOKS.find(b => b.id === selectedBook);

  const navigateToCell = (cellId: string) => {
    trackMapVisit(cellId); // Award XP for each unique shelf explored
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
  const DISTANCE_BY_SECTION: Record<string, number> = { A: 30, B: 45, C: 60, D: 75, E: 55 };
  const distanceMeters = destinationShelfId
    ? (DISTANCE_BY_SECTION[destinationShelfId.split('-')[0]] ?? 45) + (parseInt(destinationShelfId.split('-')[1] ?? '1') - 1) * 8
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

  const rafeeqMessage = (() => {
    if (hasArrived) return { ar: 'وصلت! أحسنت! 🎉', en: 'You made it! Great job! 🎉' };
    if (showPath && destinationShelfId) return {
      ar: `أنت على بُعد ${liveDistanceMeters} م — استمر!`,
      en: `${liveDistanceMeters}m to go — keep going!`,
    };
    if (destinationShelfId) return { ar: 'وجدت الرف! اضغط "AR توجيه" لأريك الطريق', en: "Found it! Tap 'AR Guide' for the path" };
    return { ar: 'اختر رفاً من الخريطة وسأوجّهك! 👋', en: "Pick a shelf and I'll guide you! 👋" };
  })();
  const liveStepIndex = navigationSteps.length > 0
    ? Math.min(navigationSteps.length - 1, Math.floor(walkProgress * navigationSteps.length))
    : 0;

  const arIframeRef = useRef<HTMLIFrameElement>(null);

  // When the AR floor overlay is open and a destination is set, trigger the
  // 3D app's built-in guideTo() via postMessage so the correct 3D path is
  // drawn instead of our approximated SVG overlay.
  useEffect(() => {
    if (!showARFloor || !destinationShelfId) return;
    const send = () => {
      arIframeRef.current?.contentWindow?.postMessage(
        { type: 'LIBRARY_GUIDE_TO', shelf: destinationShelfId },
        '*'
      );
    };
    // Fire immediately, then once more after a short delay in case the
    // iframe is still mounting when this effect first runs.
    send();
    const t = setTimeout(send, 600);
    return () => clearTimeout(t);
  }, [showARFloor, destinationShelfId]);

  const getPathData = () => {
    if (!destinationShelfId) return "";
    const paths: Record<string, string> = {
      'A-1': "M 300,450 L 300,350 L 100,350 L 100,100",
      'A-2': "M 300,450 L 300,350 L 250,350 L 250,100",
      'B-1': "M 300,450 L 300,350 L 400,350 L 400,100",
      'B-2': "M 300,450 L 300,350 L 550,350 L 550,100",
      'B-3': "M 300,450 L 300,350 L 400,350 L 400,175",
      'B-4': "M 300,450 L 300,350 L 550,350 L 550,175",
      'C-1': "M 300,450 L 300,350 L 100,350 L 100,250",
      'C-2': "M 300,450 L 300,350 L 250,350 L 250,250",
      'D-1': "M 300,450 L 300,350 L 550,350 L 550,250",
      'D-2': "M 300,450 L 300,350 L 400,350 L 400,250",
      'E-1': "M 300,450 L 300,350 L 150,350 L 150,200",
      'E-2': "M 300,450 L 300,350 L 200,350 L 200,200",
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
                  {/* Map mode toggle */}
                  <div className={cn("absolute top-5 z-40 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1", dir === 'rtl' ? 'left-5' : 'right-5')}>
                    <button
                      onClick={() => setMapMode('flat')}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        mapMode === 'flat'
                          ? "bg-primary text-white shadow-sm"
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      )}
                    >
                      <Layers className="w-3 h-3" />
                      2D
                    </button>
                    <button
                      onClick={() => setMapMode('unity')}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        mapMode === 'unity'
                          ? "bg-primary text-accent shadow-sm"
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      )}
                    >
                      <Box className="w-3 h-3" />
                      Unity 3D
                    </button>
                    <button
                      onClick={() => setMapMode('ar-floor')}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        mapMode === 'ar-floor'
                          ? "bg-accent text-primary shadow-sm"
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      )}
                    >
                      <Maximize2 className="w-3 h-3" />
                      {language === 'ar' ? 'AR رفوف' : 'AR Floor'}
                    </button>
                  </div>

                  {/* Rafeeq floating guide */}
                  <AnimatePresence>
                    {!rafeeqDismissed && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={cn("absolute bottom-24 z-40 flex flex-col items-center gap-1", dir === 'rtl' ? 'right-6' : 'left-6')}
                      >
                        {/* Speech bubble */}
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={rafeeqMessage.ar}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="relative bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-white/10 rounded-2xl px-4 py-3 shadow-xl max-w-[180px] text-center mb-1"
                          >
                            <p className="text-[11px] font-black text-primary dark:text-white leading-snug">
                              {language === 'ar' ? rafeeqMessage.ar : rafeeqMessage.en}
                            </p>
                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-800 border-b border-r border-slate-200/60 dark:border-white/10 rotate-45" />
                            <button
                              onClick={() => setRafeeqDismissed(true)}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </motion.div>
                        </AnimatePresence>

                        {/* Rafeeq character */}
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <RafeeqAvatar className="w-20 h-20 drop-shadow-xl" />
                        </motion.div>
                        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          {language === 'ar' ? 'رفيق' : 'Rafeeq'}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Restore Rafeeq button when dismissed */}
                  {rafeeqDismissed && (
                    <button
                      onClick={() => setRafeeqDismissed(false)}
                      className={cn("absolute bottom-24 z-40 w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-lg flex items-center justify-center hover:scale-110 transition-all", dir === 'rtl' ? 'right-6' : 'left-6')}
                      title={language === 'ar' ? 'أظهر رفيق' : 'Show Rafeeq'}
                    >
                      <span className="text-lg">🤖</span>
                    </button>
                  )}

                  {/* Unity 3D mode */}
                  {mapMode === 'unity' && (
                    <div className="flex-1 relative overflow-hidden rounded-2xl bg-[#01202e]">
                      <UnityMap3D
                        destinationShelfId={destinationShelfId}
                        onSelectShelf={navigateToCell}
                        language={language}
                      />
                    </div>
                  )}

                  {/* AR Floor mode */}
                  {mapMode === 'ar-floor' && (
                    <div className="flex-1 relative overflow-hidden rounded-2xl bg-[#0A0E1C] min-h-[520px]">
                      <iframe
                        src="/library-ar-floor.html"
                        className="absolute inset-0 w-full h-full border-0"
                        title={language === 'ar' ? 'خريطة الرفوف AR' : 'AR Floor Map'}
                        allow="camera; microphone; accelerometer; gyroscope"
                      />
                    </div>
                  )}

                  {/* Flat / 2D mode */}
                  {mapMode === 'flat' && (
                  <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {cells.map((cell) => {
                      const section = sections.find(s => s.id === cell.section);
                      const isDestination = destinationShelfId === cell.id;
                      const occupancy = occupancyData[cell.id as keyof typeof occupancyData];
                      const isHovered = hoveredCell === cell.id;
                      const bookCount = MOCK_BOOKS.filter(b => b.shelf === cell.id).length;
                      const cellLabel = CELL_LABELS[cell.id];

                      return (
                        <motion.div
                          key={cell.id}
                          onHoverStart={() => setHoveredCell(cell.id)}
                          onHoverEnd={() => setHoveredCell(null)}
                          onClick={() => !bookData && navigateToCell(cell.id)}
                          className={cn(
                            "relative flex flex-col items-center justify-center rounded-3xl border-2 transition-all duration-500 cursor-pointer group min-h-[160px]",
                            isDestination
                              ? "bg-accent/5 dark:bg-accent/10 border-accent shadow-[0_20px_50px_rgba(217,179,16,0.2)] z-20 scale-[1.03]"
                              : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 hover:border-primary/20 dark:hover:border-accent/20",
                            isHovered && !isDestination && "shadow-xl shadow-black/5 dark:shadow-black/20 scale-[1.01]"
                          )}
                        >
                          {/* Live Occupancy Badge */}
                          <div className={cn("absolute top-3 flex items-center gap-1.5 bg-white dark:bg-slate-800 px-2 py-1 rounded-full shadow-sm border border-slate-100 dark:border-white/5", dir === 'rtl' ? 'left-3' : 'right-3')}>
                             <div className={cn("w-1.5 h-1.5 rounded-full", occupancy > 70 ? "bg-red-500" : occupancy > 40 ? "bg-amber-500" : "bg-emerald-500")}></div>
                             <span className="text-[8px] font-black text-slate-500 dark:text-slate-400">{occupancy}%</span>
                          </div>

                          {/* Book count badge */}
                          <div className={cn("absolute top-3 flex items-center gap-1 bg-primary/5 dark:bg-accent/10 px-2 py-1 rounded-full", dir === 'rtl' ? 'right-3' : 'left-3')}>
                            <span className="text-[8px] font-black text-primary/60 dark:text-accent/80">{bookCount} {language === 'ar' ? 'كتاب' : 'bks'}</span>
                          </div>

                          <div className="relative z-10 flex flex-col items-center gap-2.5 p-5 text-center">
                            <div className={cn(
                              "w-10 h-10 rounded-2xl flex items-center justify-center text-lg transition-all duration-500 shadow-md",
                              isDestination ? "bg-accent text-primary scale-110" : "bg-white dark:bg-slate-700 text-slate-300 dark:text-slate-400"
                            )}>
                               {section?.icon}
                            </div>

                            <div className="space-y-1">
                               <div className="text-[9px] font-black text-primary/40 dark:text-white/30 uppercase tracking-[0.15em] leading-tight">{section?.name}</div>
                               {/* Content label is the primary identity of the shelf */}
                               <div className="text-[13px] font-black text-primary dark:text-white leading-snug">
                                 {cellLabel ? (language === 'ar' ? cellLabel.ar : cellLabel.en) : cell.id}
                               </div>
                               {/* Shelf code as a small secondary badge */}
                               <div className={cn(
                                 "inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black tracking-wider",
                                 isDestination
                                   ? "bg-accent/20 text-primary dark:text-primary"
                                   : "bg-primary/8 dark:bg-white/8 text-primary/50 dark:text-white/40"
                               )}>
                                 {cell.id}
                               </div>
                            </div>

                            {isDestination && (
                              <motion.div
                                initial={{ y: 6, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className={cn("bg-primary text-accent px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}
                              >
                                <Navigation className={cn("w-2.5 h-2.5", dir === 'rtl' ? 'rotate-180' : '')} />
                                {t('currentDestination')}
                              </motion.div>
                            )}
                          </div>

                          {/* Decorative Section Color Tab */}
                          <div className={cn("absolute bottom-0 inset-x-8 h-1 rounded-t-full transition-all group-hover:h-2", section?.color, isDestination && "opacity-100", !isDestination && "opacity-20")} />
                        </motion.div>
                      );
                    })}
                  </div>
                  </div>
                  )} {/* end flat mode */}

                  {/* Enhanced Entrance Visual (flat mode only) */}
                  {mapMode === 'flat' && (<div><div>
                  <div className="mt-16 relative flex justify-center">
                     <div className="absolute bottom-full mb-8 h-20 w-px bg-gradient-to-t from-slate-200 dark:from-white/10 to-transparent" />
                     <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 px-12 py-4 rounded-full text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] shadow-inner text-center">
                        {t('mainGatePhaseOne')}
                     </div>
                  </div>

                  {/* Path Visualization SVG — road-strip style */}
                  {showPath && destinationShelfId && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-30" viewBox="0 0 600 500">
                      <defs>
                        <linearGradient id="flatRoadGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                          <stop offset="0%" stopColor="#06B6D4" stopOpacity="0" />
                          <stop offset="30%" stopColor="#06B6D4" stopOpacity="0.7" />
                          <stop offset="100%" stopColor="#22D3EE" stopOpacity="1" />
                        </linearGradient>
                        <filter id="flatHalo">
                          <feGaussianBlur stdDeviation="9" result="b"/>
                          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                        <filter id="flatEdge">
                          <feGaussianBlur stdDeviation="3" result="b"/>
                          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                      </defs>
                      {/* outer glow halo */}
                      <motion.path d={getPathData()} stroke="#06B6D4" strokeWidth="50" fill="none"
                        strokeLinecap="round" opacity="0.07"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, ease: 'easeInOut' }} />
                      {/* road body */}
                      <motion.path d={getPathData()} stroke="#06B6D4" strokeWidth="32" fill="none"
                        strokeLinecap="round" opacity="0.20"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, ease: 'easeInOut' }} />
                      {/* road inner tint */}
                      <motion.path d={getPathData()} stroke="#22D3EE" strokeWidth="16" fill="none"
                        strokeLinecap="round" opacity="0.1"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, ease: 'easeInOut' }} />
                      {/* road edge bright line */}
                      <motion.path d={getPathData()} stroke="url(#flatRoadGrad)" strokeWidth="2.5" fill="none"
                        strokeLinecap="round" filter="url(#flatEdge)" opacity="0.95"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, ease: 'easeInOut' }} />
                      {/* flowing yellow lane dashes */}
                      {[0,1,2,3,4,5].map(i => (
                        <rect key={i} width="13" height="5" x="-6.5" y="-2.5" rx="2.5" fill="#D9B310" opacity="0.95" filter="url(#flatEdge)">
                          <animateMotion dur="2s" begin={`${i * 0.33}s`} repeatCount="indefinite" rotate="auto" path={getPathData()} />
                        </rect>
                      ))}
                      {/* chevron arrows */}
                      {[0,1,2].map(i => (
                        <polygon key={i} points="-6,-8 8,0 -6,8" fill="#D9B310" stroke="#0A1628" strokeWidth="1.5" filter="url(#flatEdge)" opacity="0.9">
                          <animateMotion dur="1.8s" begin={`${i * 0.6}s`} repeatCount="indefinite" rotate="auto" path={getPathData()} />
                        </polygon>
                      ))}
                      {/* destination dot — yellow core + cyan pulse */}
                      <circle
                        cx={parseInt(getPathData().split(' ').at(-1)?.split(',')[0] ?? '285')}
                        cy={parseInt(getPathData().split(' ').at(-1)?.split(',')[1] ?? '90')}
                        r="11" fill="#D9B310" stroke="white" strokeWidth="3" filter="url(#flatHalo)"
                      />
                      <motion.circle
                        cx={parseInt(getPathData().split(' ').at(-1)?.split(',')[0] ?? '285')}
                        cy={parseInt(getPathData().split(' ').at(-1)?.split(',')[1] ?? '90')}
                        r="11" fill="none" stroke="#22D3EE" strokeWidth="2.5"
                        animate={{ r:[11,30,11], opacity:[0.9,0,0.9] }}
                        transition={{ duration: 1.8, repeat: Infinity }}
                      />
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
                      {language === 'ar' ? 'عرض AR توجيه' : 'View AR Guide'}
                    </button>
                  )}
                  </div></div>)} {/* end flat entrance + path wrapper */}
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
                    {/* 3D bookshelf view */}
                    <div className="absolute inset-0 z-10">
                      <Shelf3DView
                        targetBook={bookData ?? null}
                        shelfId={destinationShelfId}
                        language={language}
                        dir={dir}
                      />
                    </div>

                    <div className={cn("absolute top-6 z-20 flex items-center gap-3", dir === 'rtl' ? 'right-6' : 'left-6')}>
                      <button
                        onClick={() => { setManualTarget(null); setSelectedBook(null); setShowPath(false); }}
                        className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-xl border border-white/10 transition-all active:scale-95"
                      >
                        {t('changeRouteLabel')}
                      </button>
                    </div>

                    {/* Rafeeq mini guide in AR dark view */}
                    <motion.div
                      className={cn("absolute bottom-44 z-30 flex flex-col items-center gap-1", dir === 'rtl' ? 'left-4' : 'right-4')}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-3 py-2 max-w-[140px] text-center mb-1 shadow-xl">
                        <p className="text-[10px] font-black text-white leading-snug">
                          {language === 'ar' ? rafeeqMessage.ar : rafeeqMessage.en}
                        </p>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/10 border-b border-r border-white/20 rotate-45" />
                      </div>
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <RafeeqAvatar className="w-14 h-14 drop-shadow-2xl" />
                      </motion.div>
                    </motion.div>

                    {/* Hands off to the real camera-based AR guidance; the
                        dark path here is a simulated preview of that same
                        route. */}
                    <button
                      onClick={() => setShowARFloor(true)}
                      title={language === 'ar' ? 'AR الرفوف' : 'AR Floor'}
                      className={cn("absolute top-6 z-20 p-3 rounded-full bg-accent text-primary shadow-[0_8px_24px_rgba(217,179,16,0.4)] hover:brightness-110 transition-all active:scale-90", dir === 'rtl' ? 'left-6' : 'right-6')}
                    >
                      <Camera className="w-4 h-4" />
                    </button>

                    {/* 3D Perspective Corridor — sits between shelf (z-10) and SVG path (z-20) */}
                    <div
                      className="absolute inset-0 z-[18] pointer-events-none overflow-hidden flex items-end justify-center"
                      style={{ paddingBottom: '160px' }}
                    >
                      <div
                        style={{
                          width: '280px',
                          height: '500px',
                          flexShrink: 0,
                          transform: 'perspective(220px) rotateX(54deg)',
                          transformOrigin: 'bottom center',
                          maskImage: 'linear-gradient(to top, black 0%, rgba(0,0,0,0.75) 35%, transparent 62%)',
                          WebkitMaskImage: 'linear-gradient(to top, black 0%, rgba(0,0,0,0.75) 35%, transparent 62%)',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Corridor walls / rails */}
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(217,179,16,0.04)', borderLeft: '2.5px solid rgba(217,179,16,0.45)', borderRight: '2.5px solid rgba(217,179,16,0.45)' }} />
                        {/* Animated lane dashes flowing toward viewer */}
                        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(180deg, rgba(217,179,16,0.9) 0px, rgba(217,179,16,0.9) 12px, transparent 12px, transparent 36px)', animation: 'roadFlow 0.65s linear infinite' }} />
                      </div>
                    </div>
                    <style>{`@keyframes roadFlow { from { background-position: 0 0; } to { background-position: 0 36px; } }`}</style>

                    <svg className="absolute inset-0 w-full h-full z-20 pointer-events-none" viewBox="0 0 600 500" preserveAspectRatio="xMidYMid slice">
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

                    <div className="absolute top-24 inset-x-0 flex flex-col items-center gap-2.5 z-30 px-10">
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

                    <div className="relative z-30 mt-auto p-6 space-y-3">
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
                  <button onClick={() => { setShowPath(true); setActiveTab('map'); }} className="w-full py-5 bg-accent text-primary rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:brightness-110 shadow-sm transition-all active:scale-95">
                    <span>{language === 'ar' ? 'الخريطة' : 'Map'}</span>
                  </button>
                  <button onClick={() => setShowARFloor(true)} className="w-full py-4 bg-primary text-white rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:brightness-110 shadow-sm transition-all active:scale-95">
                    <Camera className="w-4 h-4" />
                    <span>{language === 'ar' ? 'AR توجيه' : 'AR Guide'}</span>
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
      {/* AR Floor full-screen overlay */}
      <AnimatePresence>
        {showARFloor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl h-[90vh] rounded-3xl overflow-hidden bg-[#0A0E1C] shadow-2xl shadow-black/60 border border-white/10"
              style={{ isolation: 'isolate' }}
            >
              {/* iframe — explicit z-index so overlays sit on top */}
              <iframe
                ref={arIframeRef}
                src="/library-ar-floor.html"
                className="absolute inset-0 w-full h-full border-0"
                style={{ zIndex: 1 }}
                title={language === 'ar' ? 'خريطة الرفوف AR' : 'AR Floor Map'}
                allow="camera; microphone; accelerometer; gyroscope"
              />

              {/* ── All overlays sit above the iframe (z ≥ 10) ── */}

              {/* Top info strip — shelf + distance/time */}
              {destinationShelfId && (
                <div className="absolute top-16 inset-x-4 flex flex-col items-center gap-2 pointer-events-none" style={{ zIndex: 20 }}>
                  <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                    className="px-5 py-2.5 rounded-full bg-black/65 backdrop-blur-xl border border-white/20 text-white text-xs font-black flex items-center gap-2 shadow-xl">
                    <Navigation className="w-3.5 h-3.5 text-accent shrink-0" />
                    {language === 'ar' ? `التوجه نحو رف ${destinationShelfId}` : `Head to shelf ${destinationShelfId}`}
                  </motion.div>
                  <motion.div initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.55 }}
                    className="px-4 py-1.5 rounded-full bg-accent/25 border border-accent/50 text-accent text-[10px] font-black flex items-center gap-2">
                    <span>{language === 'ar' ? 'المسافة' : 'Distance'}: {distanceMeters}{language === 'ar' ? ' م' : 'm'}</span>
                    <span className="w-1 h-1 rounded-full bg-accent/60" />
                    <span>{language === 'ar' ? 'الوقت' : 'ETA'}: {etaMinutes}{language === 'ar' ? ' د' : ' min'}</span>
                  </motion.div>
                </div>
              )}

              {/* Rafeeq avatar + speech bubble */}
              <motion.div
                className={cn("absolute bottom-40 flex flex-col items-center gap-1 pointer-events-none", dir === 'rtl' ? 'left-4' : 'right-4')}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                style={{ zIndex: 20 }}
              >
                <div className="relative bg-white/15 backdrop-blur-xl border border-white/25 rounded-2xl px-3 py-2 max-w-[150px] text-center mb-1 shadow-xl">
                  <p className="text-[10px] font-black text-white leading-snug">
                    {destinationShelfId
                      ? (language === 'ar' ? `أنت على بُعد ${distanceMeters} م — استمر!` : `${distanceMeters}m to go — keep going!`)
                      : (language === 'ar' ? 'اختر رفاً وسأوجّهك! 👋' : "Pick a shelf and I'll guide you! 👋")}
                  </p>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white/15 border-b border-r border-white/25 rotate-45" />
                </div>
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}>
                  <RafeeqAvatar className="w-16 h-16 drop-shadow-2xl" />
                </motion.div>
                <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">
                  {language === 'ar' ? 'رفيق' : 'Rafeeq'}
                </span>
              </motion.div>

              {/* Bottom book / shelf card */}
              {(bookData || destinationShelfId) && (
                <motion.div className="absolute bottom-5 inset-x-4 pointer-events-none" style={{ zIndex: 20 }}
                  initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                  <div className={cn("bg-white/95 backdrop-blur-xl rounded-2xl px-4 py-3 flex items-center gap-3 shadow-2xl shadow-black/50 border border-white/20", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                    {bookData && <BookCover book={bookData} className="w-11 h-16 rounded-xl shrink-0 shadow-lg" />}
                    <div className={cn("flex-1 min-w-0", dir === 'rtl' ? 'text-right' : 'text-left')}>
                      <p className="text-xs font-black text-primary truncate leading-snug">
                        {bookData ? bookData.title : (language === 'ar' ? `رف ${destinationShelfId}` : `Shelf ${destinationShelfId}`)}
                      </p>
                      {bookData && <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">{bookData.author}</p>}
                      <div className={cn("flex items-center gap-1.5 mt-1.5 flex-wrap", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                        <span className="text-[8px] font-black text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                          {language === 'ar' ? `رف ${destinationShelfId}` : `Shelf ${destinationShelfId}`}
                        </span>
                        <span className="text-[8px] text-slate-400 truncate">{destinationSectionName}</span>
                      </div>
                    </div>
                    {navigationSteps.length > 0 && (
                      <div className="flex flex-col gap-1 shrink-0">
                        {navigationSteps.slice(0, 2).map((s, i) => (
                          <div key={i} className={cn("flex items-center gap-1.5", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                            <span className="w-4 h-4 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[8px] font-black shrink-0">{i + 1}</span>
                            <span className="text-[9px] text-primary/80 truncate max-w-[110px]">{s}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Close button */}
              <button onClick={() => setShowARFloor(false)}
                className="absolute top-4 end-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 flex items-center justify-center text-white transition-all"
                style={{ zIndex: 30 }}>
                <X className="w-4 h-4" />
              </button>

              {/* AR label */}
              <div className="absolute top-4 start-4 px-3 py-1.5 rounded-full bg-accent/20 border border-accent/40 text-accent text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"
                style={{ zIndex: 30 }}>
                <Camera className="w-3 h-3" />
                {language === 'ar' ? 'AR الرفوف' : 'AR Floor'}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
