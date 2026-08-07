import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Map as MapIcon, Compass, Camera, X, User as UserIcon, Search, Layers, Maximize2, Clock } from 'lucide-react';
import { MOCK_BOOKS } from '../data/mockData';
import { cn, trackMapVisit, trackMapMode, bookCategory } from '../lib/utils';
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

/** Split a shelf subject label at a word boundary for SVG 2-line display. */
function wrapShelfLabel(text: string, maxChars = 13): [string, string] {
  if (!text || text.length <= maxChars) return [text || '', ''];
  const words = text.split(' ');
  let line1 = '';
  for (let i = 0; i < words.length; i++) {
    const candidate = line1 ? `${line1} ${words[i]}` : words[i];
    if (candidate.length <= maxChars) {
      line1 = candidate;
    } else {
      const line2 = words.slice(i).join(' ');
      return [line1 || words[i], line2.slice(0, 18)];
    }
  }
  return [line1, ''];
}

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
  const [mapMode, setMapMode] = useState<'flat' | 'unity' | 'ar-floor'>('ar-floor');
  const [showARFloor, setShowARFloor] = useState(false);

  // Which view the student actually used to find resources — the Researcher
  // badge asks for the 2D or the 3D map, and only this page knows which is on.
  useEffect(() => { trackMapMode(mapMode); }, [mapMode]);

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

  // LC class assigned to each shelf — matches the 2D map & AR Floor signs
  const SHELF_LC_CLASS: Record<string, string> = {
    'A-1': 'QC',  'A-2': 'QB',
    'B-1': 'Q',   'B-2': 'TK',
    'B-3': 'TA',  'B-4': 'QA',
    'C-1': 'BF',  'C-2': 'BF',
    'D-1': 'D',   'D-2': 'P',
    'E-1': 'HB',  'E-2': 'HF',
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

  // The floor a section sits on. The chip that displayed this to the reader is
  // gone; the level is kept because the walking-time estimate below still uses
  // it — reaching a higher floor takes longer than a same-floor stroll.
  const FLOOR_LEVEL_BY_SECTION: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 0 };
  const destinationFloorLevel = destinationSectionId ? (FLOOR_LEVEL_BY_SECTION[destinationSectionId] ?? 0) : 0;

  // Walking time: a same-floor walk of ~30-83m realistically takes about a
  // minute, plus roughly 25 extra seconds per floor climbed by stairs - so
  // the estimate (and the live countdown below) actually reflects the floor,
  // not just a flat number regardless of how far up the destination is.
  const totalWalkSeconds = destinationShelfId
    ? Math.max(60, Math.round((distanceMeters / 50) * 60) + destinationFloorLevel * 25)
    : 0;
  const etaMinutes = Math.max(1, Math.round(totalWalkSeconds / 60));

  // Live "walking" demo: as soon as navigation is active (showPath + destination)
  // the distance/time count down in real time on any tab or view.
  const [walkProgress, setWalkProgress] = useState(0);
  useEffect(() => {
    if (!showPath || !destinationShelfId) {
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
  }, [showPath, destinationShelfId, totalWalkSeconds]);

  const liveDistanceMeters = Math.round(distanceMeters * (1 - walkProgress));
  const liveEtaSeconds = Math.max(0, Math.round(totalWalkSeconds * (1 - walkProgress)));
  const liveEtaMinutes = Math.max(0, Math.round(etaMinutes * (1 - walkProgress)));
  const hasArrived = showPath && walkProgress >= 1;

  // Actual clock time of arrival (updates live as walkProgress changes)
  const arrivalTime = (() => {
    const arrival = new Date(Date.now() + liveEtaSeconds * 1000);
    return arrival.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  })();

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
  const arInlineIframeRef = useRef<HTMLIFrameElement>(null);

  // Maps our shelf codes → the 3D floor app's physical shelf codes.
  // The 3D app names shelves by LC class position (A-1=Philosophy, B-1=Psychology…)
  // which is completely different from our content-based codes (A-1=Physics, B-1=AI…).
  const SHELF_TO_3D_CODE: Record<string, string> = {
    'A-1': 'H-2',  // QC Physics
    'A-2': 'H-2',  // QB Astrophysics → same physical arc as QC
    'B-1': 'F-2',  // Q = General Science / AI
    'B-2': 'L-2',  // TA Technology & Engineering
    'B-3': 'L-2',  // TA Engineering (civil)
    'B-4': 'L-2',  // TA Engineering / QA Math
    'C-1': 'B-1',  // BF Psychology
    'C-2': 'B-1',  // BF Psychology
    'D-1': 'E-1',  // D = History & Civilization
    'D-2': 'E-2',  // P = Language & Literature
    'E-1': 'I-1',  // HB Economics
    'E-2': 'J-1',  // HF Commerce & Marketing
  };

  const displayShelfCode = destinationShelfId ? (SHELF_TO_3D_CODE[destinationShelfId] ?? destinationShelfId) : null;

  // Compute a 0-1 position for the selected book within its shelf,
  // ordered by call number. Used to pinpoint the exact location in the 3D app.
  const bookPositionInShelf = useMemo(() => {
    if (!bookData?.shelf || !bookData.callNumber) return 0.5;
    const shelfBooks = MOCK_BOOKS
      .filter(b => b.shelf === bookData.shelf && b.callNumber)
      .sort((a, b) => (a.callNumber ?? '').localeCompare(b.callNumber ?? ''));
    const idx = shelfBooks.findIndex(b => b.id === bookData.id);
    if (idx < 0 || shelfBooks.length <= 1) return 0.5;
    return idx / (shelfBooks.length - 1);
  }, [bookData]);

  // Auto-start the walk simulation only in the fullscreen AR overlay (showARFloor).
  // In the inline ar-floor tab the user taps "ابدأ الملاحة" to start explicitly.
  useEffect(() => {
    if (showARFloor && destinationShelfId) {
      setShowPath(true);
    }
  }, [showARFloor, destinationShelfId]);

  useEffect(() => {
    const isVisible = showARFloor || mapMode === 'ar-floor';
    if (!isVisible || !destinationShelfId) return;
    const floorCode = SHELF_TO_3D_CODE[destinationShelfId] ?? destinationShelfId;
    const msg = {
      type: 'LIBRARY_GUIDE_TO',
      shelf: floorCode,
      reactShelf: floorCode,
      bookPosition: bookPositionInShelf,
      bookTitle: bookData?.title ?? '',
      callNumber: bookData?.callNumber ?? '',
    };
    const send = () => {
      arIframeRef.current?.contentWindow?.postMessage(msg, '*');
      arInlineIframeRef.current?.contentWindow?.postMessage(msg, '*');
    };
    // A cold iframe load can take several seconds for the embedded 3D scene
    // to finish building (window.__cmp isn't ready until then), so a
    // single retry at 600ms isn't reliable — keep resending until either
    // iframe (same-origin, so directly inspectable) confirms it's actually
    // guiding to this shelf, or give up after ~12s.
    let attempts = 0;
    const MAX_ATTEMPTS = 30;
    send();
    const interval = setInterval(() => {
      attempts += 1;
      const isGuidingTo = (win: Window | null | undefined) => {
        const cmp = (win as (Window & { __cmp?: { _guide?: { visible?: boolean }; _guideItem?: { code?: string } } }) | null | undefined)?.__cmp;
        return !!cmp?._guide?.visible && cmp?._guideItem?.code === floorCode;
      };
      const showingTarget = isGuidingTo(arIframeRef.current?.contentWindow) || isGuidingTo(arInlineIframeRef.current?.contentWindow);
      if (showingTarget || attempts >= MAX_ATTEMPTS) {
        clearInterval(interval);
        return;
      }
      send();
    }, 400);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showARFloor, mapMode, destinationShelfId, bookPositionInShelf, selectedBook]);

  const getPathData = () => {
    if (!destinationShelfId) return "";
    // Grid layout in SVG coords (viewBox 600×500):
    // Cols centers: 0→75, 1→225, 2→375, 3→525
    // Row centers:  1→130, 2→190, 3→340
    // Horizontal aisles: between rows 1-2 → y=160, zone boundary → y=249, below row3 → y=370
    // Vertical aisles:   between cols 0-1 → x=150, center → x=300, between cols 2-3 → x=450
    // Entrance: (300, 450)
    const paths: Record<string, string> = {
      // Row 1 — go up center through zone aisle, through row1/2 gap, arrive at card
      'A-1': "M 300,450 L 300,160 L 150,160 L 75,160 L 75,130",
      'A-2': "M 300,450 L 300,160 L 225,160 L 225,130",
      'B-1': "M 300,450 L 300,160 L 375,160 L 375,130",
      'B-2': "M 300,450 L 300,160 L 450,160 L 525,160 L 525,130",
      // Row 2 — go up center to zone boundary aisle, branch to column, arrive at card
      'B-3': "M 300,450 L 300,249 L 150,249 L 75,249 L 75,190",
      'B-4': "M 300,450 L 300,249 L 225,249 L 225,190",
      'C-1': "M 300,450 L 300,249 L 375,249 L 375,190",
      'C-2': "M 300,450 L 300,249 L 450,249 L 525,249 L 525,190",
      // Row 3 — short way up from entrance to below-shelf aisle, branch to column
      'D-1': "M 300,450 L 300,370 L 150,370 L 75,370 L 75,340",
      'D-2': "M 300,450 L 300,370 L 225,370 L 225,340",
      'E-1': "M 300,450 L 300,370 L 375,370 L 375,340",
      'E-2': "M 300,450 L 300,370 L 450,370 L 525,370 L 525,340",
    };
    return paths[destinationShelfId] || "M 300,450 L 300,249";
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
                className="relative z-10 w-full h-full p-4 sm:p-8 lg:p-12 flex flex-col"
              >
                  {/* Rafeeq floating guide — AR-floor view only.
                      The flat map and the Unity view each already draw their
                      own Rafeeq, so rendering this one in every mode put two
                      of him in one corner; the AR-floor view had none. */}
                  <AnimatePresence>
                    {mapMode !== 'unity' && !rafeeqDismissed && (
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
                              aria-label={language === 'ar' ? 'إخفاء رفيق' : 'Dismiss Rafeeq'}
                              className="absolute -top-5 -right-5 w-11 h-11 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
                            >
                              <span className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                <X className="w-3 h-3" />
                              </span>
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
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          {language === 'ar' ? 'رفيق' : 'Rafeeq'}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Restore Rafeeq button when dismissed */}
                  {mapMode !== 'unity' && rafeeqDismissed && (
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
                        dir={dir}
                        bookData={bookData}
                        distanceMeters={showPath ? liveDistanceMeters : distanceMeters}
                        etaMinutes={showPath ? liveEtaMinutes : etaMinutes}
                        navigationSteps={navigationSteps}
                      />
                    </div>
                  )}

                  {/* AR Floor mode */}
                  {mapMode === 'ar-floor' && (
                    <div className="flex-1 relative overflow-hidden rounded-2xl bg-[#0A0E1C] min-h-[520px]">
                      <iframe
                        ref={arInlineIframeRef}
                        src="/library-ar-floor.html"
                        className="absolute inset-0 w-full h-full border-0"
                        title={language === 'ar' ? 'خريطة الرفوف AR' : 'AR Floor Map'}
                        allow="camera; microphone; accelerometer; gyroscope"
                      />
                      {/* 2D / 3D mode toggle */}
                      <div className="absolute top-12 sm:top-3 right-3 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-xl rounded-xl p-1 border border-white/10 pointer-events-auto">
                        <button
                          onClick={() => setMapMode('flat')}
                          className="px-4 py-3 rounded-lg text-[11px] font-black transition-all text-white/60 hover:text-white hover:bg-white/10"
                        >
                          2D
                        </button>
                        <button
                          onClick={() => setMapMode('ar-floor')}
                          className="px-4 py-3 rounded-lg text-[11px] font-black transition-all bg-[#0EA5D6] text-[#050c1a] shadow"
                        >
                          3D
                        </button>
                      </div>

                      {/* Navigation HUD — always visible above the 3D iframe */}
                      <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30, delay: 0.3 }}
                        className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none"
                      >
                        <div className="bg-[#050c1a]/90 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-2xl shadow-black/50 overflow-hidden">
                          <div className="h-0.5 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
                          <div className="p-4">
                            <AnimatePresence mode="wait">
                              {hasArrived ? (
                                <motion.div
                                  key="arrived"
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="flex items-center gap-3"
                                >
                                  <motion.div
                                    animate={{ scale: [1, 1.15, 1] }}
                                    transition={{ duration: 1.2, repeat: Infinity }}
                                    className="text-3xl"
                                  >
                                    🎉
                                  </motion.div>
                                  <div>
                                    <p className="text-white font-black text-base">
                                      {language === 'ar' ? 'وصلت! أحسنت!' : 'You made it!'}
                                    </p>
                                    <p className="text-[#D4AF37] text-xs font-bold mt-0.5">
                                      {destinationShelfId} · {destinationSectionName}
                                    </p>
                                  </div>
                                </motion.div>
                              ) : destinationShelfId ? (
                                <motion.div
                                  key="navigating"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="flex items-center gap-3"
                                >
                                  {/* Animated directional arrow */}
                                  <motion.div
                                    animate={{ y: [-4, 0, -4] }}
                                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                                    className="w-12 h-12 rounded-xl bg-[#0EA5D6]/20 border border-[#0EA5D6]/40 flex items-center justify-center flex-shrink-0"
                                  >
                                    <Navigation className="w-6 h-6 text-[#0EA5D6]" style={{ transform: 'rotate(-45deg)' }} />
                                  </motion.div>
                                  {/* Step + destination */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">
                                      {language === 'ar' ? 'اتجاه' : 'Direction'}
                                    </p>
                                    <p className="text-white font-black text-sm leading-tight mt-0.5 truncate">
                                      {navigationSteps[liveStepIndex] || (language === 'ar' ? `توجه إلى رف ${displayShelfCode}` : `Head to Shelf ${displayShelfCode}`)}
                                    </p>
                                    {/* The clock used to sit here bare — "36m left · 01:12 PM" —
                                        with nothing saying what the time was, and no
                                        remaining minutes at all. Both are named now. */}
                                    <div className={cn("flex items-center gap-2 mt-1 flex-wrap", dir === 'rtl' ? 'flex-row-reverse' : '')}>
                                      <span className="text-[#D4AF37] text-[10px] font-black">{displayShelfCode}</span>
                                      <span className="text-white/20">·</span>
                                      <span className="text-white/50 text-[10px]" dir="ltr">
                                        {liveDistanceMeters}m
                                      </span>
                                      <span className="text-white/20">·</span>
                                      <span className="text-white/70 text-[10px] font-black">
                                        {liveEtaMinutes > 0 ? liveEtaMinutes : '< 1'} {language === 'ar' ? 'دقيقة' : 'min'}
                                      </span>
                                      <span className="text-white/20">·</span>
                                      <span className={cn('text-white/50 text-[10px] flex items-center gap-1', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                                        <Clock className="w-2.5 h-2.5 shrink-0" />
                                        {language === 'ar' ? 'الوصول' : 'Arrive'} <span dir="ltr">{arrivalTime}</span>
                                      </span>
                                    </div>
                                  </div>
                                  {/* Progress ring */}
                                  <div className="relative w-10 h-10 flex-shrink-0">
                                    <svg width="40" height="40" viewBox="0 0 40 40">
                                      <circle cx="20" cy="20" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3"/>
                                      <circle
                                        cx="20" cy="20" r="15"
                                        fill="none"
                                        stroke="#0EA5D6"
                                        strokeWidth="3"
                                        strokeDasharray={`${walkProgress * 94.25} 94.25`}
                                        strokeLinecap="round"
                                        transform="rotate(-90 20 20)"
                                      />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white">
                                      {Math.round(walkProgress * 100)}%
                                    </span>
                                  </div>
                                </motion.div>
                              ) : (
                                <motion.div
                                  key="idle"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="flex items-center gap-3"
                                >
                                  {/* Pulsing idle arrow */}
                                  <motion.div
                                    animate={{ y: [-3, 0, -3], opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                    className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0"
                                  >
                                    <Navigation className="w-6 h-6 text-white/30" style={{ transform: 'rotate(-45deg)' }} />
                                  </motion.div>
                                  <div>
                                    <p className="text-white/70 font-black text-sm">
                                      {language === 'ar' ? 'اختر كتاباً لبدء التنقل' : 'Select a book to navigate'}
                                    </p>
                                    <p className="text-white/30 text-[10px] mt-0.5">
                                      {language === 'ar' ? 'أو ابحث في لوحة WAYFINDING' : 'or search in the WAYFINDING panel'}
                                    </p>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* ابدأ الملاحة — explicit start button shown when a destination is set */}
                            {destinationShelfId && !hasArrived && (
                              <div className="mt-3 pointer-events-auto">
                                {!showPath ? (
                                  <motion.button
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                                    onClick={() => {
                                      if (typeof navigator.vibrate === 'function') {
                                        try { navigator.vibrate(80); } catch { /* best-effort */ }
                                      }
                                      setShowPath(true);
                                    }}
                                    className="w-full py-3 bg-[#0EA5D6] text-[#050c1a] rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-[#0EA5D6]/30"
                                  >
                                    <Navigation className="w-4 h-4" style={{ transform: 'rotate(-45deg)' }} />
                                    {language === 'ar' ? 'ابدأ الملاحة' : 'Start Navigation'}
                                  </motion.button>
                                ) : (
                                  <div className="flex items-center justify-center gap-2 py-1.5">
                                    <motion.span
                                      className="inline-block w-2 h-2 rounded-full bg-emerald-400"
                                      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                                      transition={{ duration: 1.2, repeat: Infinity }}
                                    />
                                    <span className="text-emerald-400 text-[10px] font-black tracking-widest uppercase">
                                      {language === 'ar' ? 'جاري الملاحة…' : 'Navigating…'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* Flat / 2D mode */}

                  {/* ── Flat mode: floor plan map ── */}
                  {mapMode === 'flat' && (
                    <div className="flex-1 relative rounded-2xl overflow-hidden flex flex-col" style={{ background: '#F8FAFC', minHeight: '400px', border: '1px solid #E2E8F0' }}>
                      {/* 2D / 3D mode toggle */}
                      <div className="absolute top-3 right-3 z-40 flex items-center gap-1 bg-white/80 backdrop-blur-xl rounded-xl p-1 border border-slate-200 shadow-sm">
                        <button onClick={() => setMapMode('flat')}
                          className="px-4 py-3 rounded-lg text-[11px] font-black transition-all bg-slate-800 text-white shadow">
                          2D
                        </button>
                        <button onClick={() => setMapMode('ar-floor')}
                          className="px-4 py-3 rounded-lg text-[11px] font-black transition-all text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                          3D
                        </button>
                      </div>

                      {/* The plan draws with xMidYMid meet, so in a box that is
                          not 600:500 it letterboxes itself: on an iPhone SE the
                          svg box was 275x398 and the drawing only 275x229, with
                          169px of the map card left blank. Giving the shared box
                          the plan's own ratio removes the dead band. */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative w-full max-h-full" style={{ aspectRatio: '600 / 500' }}>
                      <svg viewBox="0 0 600 500" className="absolute inset-0 w-full h-full" style={{ userSelect: 'none' }}>
                        <defs>
                          {/* Vertical book-spine stripe patterns per zone */}
                          <pattern id="stripA" width="7" height="7" patternUnits="userSpaceOnUse">
                            <line x1="3.5" y1="0" x2="3.5" y2="7" stroke="#93C5FD" strokeWidth="1.3" opacity="0.45"/>
                          </pattern>
                          <pattern id="stripB" width="7" height="7" patternUnits="userSpaceOnUse">
                            <line x1="3.5" y1="0" x2="3.5" y2="7" stroke="#FDBA74" strokeWidth="1.3" opacity="0.45"/>
                          </pattern>
                          <pattern id="stripC" width="7" height="7" patternUnits="userSpaceOnUse">
                            <line x1="3.5" y1="0" x2="3.5" y2="7" stroke="#C4B5FD" strokeWidth="1.3" opacity="0.45"/>
                          </pattern>
                          <pattern id="stripD" width="7" height="7" patternUnits="userSpaceOnUse">
                            <line x1="3.5" y1="0" x2="3.5" y2="7" stroke="#86EFAC" strokeWidth="1.3" opacity="0.45"/>
                          </pattern>
                          {/* Facility card drop shadow */}
                          <filter id="cardShadow" x="-15%" y="-15%" width="130%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor="#00000018"/>
                          </filter>
                          {/* Destination glow */}
                          <filter id="fmGlow">
                            <feGaussianBlur stdDeviation="4" result="b"/>
                            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                          </filter>
                          <filter id="fmPulse">
                            <feGaussianBlur stdDeviation="9" result="b"/>
                            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                          </filter>
                          <linearGradient id="fmPath" x1="0%" y1="100%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="#D97706" stopOpacity="0.2"/>
                            <stop offset="100%" stopColor="#D97706" stopOpacity="1"/>
                          </linearGradient>
                        </defs>

                        {/* Floor outline (light) */}
                        <rect x="15" y="15" width="570" height="462" rx="22" fill="white" stroke="#E2E8F0" strokeWidth="1.5"/>

                        {/* ── Zone A: upper-left — Natural Sciences (blue) ── */}
                        <rect x="18" y="40" width="249" height="200" rx="12" fill="#DBEAFE" fillOpacity="0.45"/>
                        <rect x="18" y="40" width="249" height="200" rx="12" fill="url(#stripA)"/>
                        <rect x="18" y="40" width="249" height="200" rx="12" fill="none" stroke="#93C5FD" strokeWidth="1"/>
                        <text x="142" y="72" textAnchor="middle" fontSize="15" fontWeight="700" fill="#1D4ED8" fontFamily="'IBM Plex Mono',monospace">A · NATURAL SCIENCES</text>
                        <text x="142" y="91" textAnchor="middle" fontSize="11" fontWeight="600" fill="#60A5FA" fontFamily="sans-serif">العلوم الطبيعية</text>

                        {/* ── Zone B: upper-right — Engineering & Tech (orange) ── */}
                        <rect x="333" y="40" width="252" height="200" rx="12" fill="#FED7AA" fillOpacity="0.45"/>
                        <rect x="333" y="40" width="252" height="200" rx="12" fill="url(#stripB)"/>
                        <rect x="333" y="40" width="252" height="200" rx="12" fill="none" stroke="#FDBA74" strokeWidth="1"/>
                        <text x="459" y="72" textAnchor="middle" fontSize="15" fontWeight="700" fill="#C2410C" fontFamily="'IBM Plex Mono',monospace">B · ENGINEERING &amp; TECH</text>
                        <text x="459" y="91" textAnchor="middle" fontSize="11" fontWeight="600" fill="#FB923C" fontFamily="sans-serif">الهندسة والتقنية</text>

                        {/* ── Zone C: lower-left — Arts & Crafts (purple) ── */}
                        <rect x="18" y="258" width="249" height="200" rx="12" fill="#EDE9FE" fillOpacity="0.45"/>
                        <rect x="18" y="258" width="249" height="200" rx="12" fill="url(#stripC)"/>
                        <rect x="18" y="258" width="249" height="200" rx="12" fill="none" stroke="#C4B5FD" strokeWidth="1"/>
                        <text x="142" y="290" textAnchor="middle" fontSize="15" fontWeight="700" fill="#6D28D9" fontFamily="'IBM Plex Mono',monospace">C · ARTS &amp; CRAFTS</text>
                        <text x="142" y="309" textAnchor="middle" fontSize="11" fontWeight="600" fill="#A78BFA" fontFamily="sans-serif">الفنون والعلوم الإنسانية</text>

                        {/* ── Zone D: lower-right — Humanities (green) ── */}
                        <rect x="333" y="258" width="252" height="200" rx="12" fill="#DCFCE7" fillOpacity="0.45"/>
                        <rect x="333" y="258" width="252" height="200" rx="12" fill="url(#stripD)"/>
                        <rect x="333" y="258" width="252" height="200" rx="12" fill="none" stroke="#86EFAC" strokeWidth="1"/>
                        <text x="459" y="290" textAnchor="middle" fontSize="15" fontWeight="700" fill="#15803D" fontFamily="'IBM Plex Mono',monospace">D · HUMANITIES</text>
                        <text x="459" y="309" textAnchor="middle" fontSize="11" fontWeight="600" fill="#4ADE80" fontFamily="sans-serif">العلوم الإنسانية والاقتصاد</text>

                        {/* Center aisles */}
                        <rect x="267" y="40" width="66" height="418" fill="#F1F5F9" rx="3"/>
                        <rect x="18" y="240" width="249" height="18" fill="#F1F5F9" rx="3"/>
                        <rect x="333" y="240" width="252" height="18" fill="#F1F5F9" rx="3"/>
                        {/* Dashed center guides */}
                        <line x1="300" y1="40" x2="300" y2="458" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="5 5"/>
                        <line x1="18" y1="249" x2="267" y2="249" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="5 5"/>
                        <line x1="333" y1="249" x2="585" y2="249" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="5 5"/>

                        {/* Shelf blocks — light theme */}
                        {([
                          { id: 'A-1', cx: 75,  cy: 130, zStroke: '#93C5FD',  zFill: '#EFF6FF' },
                          { id: 'A-2', cx: 225, cy: 130, zStroke: '#93C5FD',  zFill: '#EFF6FF' },
                          { id: 'B-1', cx: 375, cy: 130, zStroke: '#FDBA74',  zFill: '#FFF7ED' },
                          { id: 'B-2', cx: 525, cy: 130, zStroke: '#FDBA74',  zFill: '#FFF7ED' },
                          { id: 'B-3', cx: 75,  cy: 190, zStroke: '#93C5FD',  zFill: '#EFF6FF' },
                          { id: 'B-4', cx: 225, cy: 190, zStroke: '#93C5FD',  zFill: '#EFF6FF' },
                          { id: 'C-1', cx: 375, cy: 190, zStroke: '#FDBA74',  zFill: '#FFF7ED' },
                          { id: 'C-2', cx: 525, cy: 190, zStroke: '#FDBA74',  zFill: '#FFF7ED' },
                          { id: 'D-1', cx: 75,  cy: 340, zStroke: '#C4B5FD',  zFill: '#FAF5FF' },
                          { id: 'D-2', cx: 225, cy: 340, zStroke: '#C4B5FD',  zFill: '#FAF5FF' },
                          { id: 'E-1', cx: 375, cy: 340, zStroke: '#86EFAC',  zFill: '#F0FDF4' },
                          { id: 'E-2', cx: 525, cy: 340, zStroke: '#86EFAC',  zFill: '#F0FDF4' },
                        ] as {id:string; cx:number; cy:number; zStroke:string; zFill:string}[]).map(({ id, cx, cy, zStroke, zFill }) => {
                          const isDest = id === destinationShelfId;
                          const cellLabel = CELL_LABELS[id];
                          return (
                            <g key={id}
                              onClick={() => !bookData && navigateToCell(id)}
                              onMouseEnter={() => setHoveredCell(id)}
                              onMouseLeave={() => setHoveredCell(null)}
                              style={{ cursor: 'pointer' }}
                            >
                              {isDest && (
                                <motion.rect x={cx - 52} y={cy - 32} width="104" height="64" rx="11"
                                  fill="#D97706" filter="url(#fmPulse)"
                                  animate={{ opacity: [0.12, 0.35, 0.12] } as never}
                                  transition={{ duration: 1.6, repeat: Infinity }}
                                />
                              )}
                              {/* Shelf card */}
                              <rect x={cx - 48} y={cy - 28} width="96" height="56" rx="9"
                                fill={isDest ? '#FEF3C7' : hoveredCell === id ? zFill : 'white'}
                                stroke={isDest ? '#D97706' : hoveredCell === id ? zStroke : '#E2E8F0'}
                                strokeWidth={isDest ? 2 : 1}
                                filter={isDest ? undefined : 'url(#cardShadow)'}
                              />
                              {/* Book spine lines */}
                              {([0.28, 0.52, 0.76] as number[]).map((f, i) => (
                                <line key={i}
                                  x1={cx - 48 + 96 * f} y1={cy - 28}
                                  x2={cx - 48 + 96 * f} y2={cy + 28}
                                  stroke={isDest ? '#D97706' : zStroke}
                                  strokeWidth="0.9" opacity="0.35"
                                />
                              ))}
                              {/* Shelf ID */}
                              <text x={cx} y={cy - 12} textAnchor="middle"
                                fontSize="17" fontWeight="900"
                                fill={isDest ? '#92400E' : '#1E293B'}
                                fontFamily="'IBM Plex Mono',monospace"
                                filter={isDest ? 'url(#fmGlow)' : undefined}
                                style={{ pointerEvents: 'none' }}
                              >{id}</text>
                              {/* LC class badge */}
                              {SHELF_LC_CLASS[id] && (
                                <text x={cx} y={cy + 3} textAnchor="middle" fontSize="11" fontWeight="700"
                                  fill={isDest ? '#B45309' : zStroke.replace('4', '7').replace('E', '9')}
                                  fontFamily="'IBM Plex Mono',monospace" style={{ pointerEvents: 'none' }}
                                >{SHELF_LC_CLASS[id]}</text>
                              )}
                              {/* Subject English */}
                              {cellLabel && (
                                <>
                                  <text x={cx} y={cy + 18} textAnchor="middle" fontSize="10"
                                    fill={isDest ? '#92400E' : '#334155'}
                                    fontFamily="'IBM Plex Mono',monospace" style={{ pointerEvents: 'none' }}
                                  >{(cellLabel.en || '').slice(0, 16)}</text>
                                  <text x={cx} y={cy + 31} textAnchor="middle" fontSize="9"
                                    fill={isDest ? '#B45309' : '#94A3B8'}
                                    fontFamily="sans-serif" style={{ pointerEvents: 'none' }}
                                  >{cellLabel.ar || ''}</text>
                                </>
                              )}
                            </g>
                          );
                        })}

                        {/* Entrance */}
                        <rect x="242" y="451" width="116" height="24" rx="12" fill="#1E293B"/>
                        <text x="300" y="461" textAnchor="middle" fontSize="12" fontWeight="700" fill="white" fontFamily="'IBM Plex Mono',monospace">🚪 ENTRANCE</text>
                        <text x="300" y="474" textAnchor="middle" fontSize="9" fill="#94A3B8" fontFamily="sans-serif">المدخل</text>

                        {/* Compass rose — bottom right */}
                        <g opacity="0.12" transform="translate(558, 448) scale(0.7)">
                          <circle cx="0" cy="0" r="22" fill="none" stroke="#475569" strokeWidth="1.5"/>
                          <polygon points="0,-20 4,-7 0,-2 -4,-7" fill="#475569"/>
                          <polygon points="0,20 4,7 0,2 -4,7" fill="#94A3B8"/>
                          <polygon points="-20,0 -7,4 -2,0 -7,-4" fill="#94A3B8"/>
                          <polygon points="20,0 7,4 2,0 7,-4" fill="#94A3B8"/>
                          <text x="0" y="-25" textAnchor="middle" fontSize="6" fill="#475569" fontWeight="700" fontFamily="sans-serif">N</text>
                        </g>

                        {/* ── Facility pod cards — white floating cards on zone corners ── */}

                        {/* Computer Lab — top-left (Zone A) */}
                        <g filter="url(#cardShadow)">
                          <rect x="14" y="38" width="94" height="64" rx="12" fill="white" stroke="#E2E8F0" strokeWidth="1"/>
                          <text x="28" y="62" fontSize="18" fontFamily="sans-serif">💻</text>
                          <text x="52" y="57" fontSize="8.5" fontWeight="700" fill="#2563EB" fontFamily="sans-serif">Computer Lab</text>
                          <text x="52" y="67" fontSize="6" fill="#94A3B8" fontFamily="sans-serif">مختبر الحاسوب</text>
                          <rect x="52" y="72" width="36" height="14" rx="7" fill="#FEE2E2"/>
                          <text x="70" y="90" textAnchor="middle" fontSize="11" fontWeight="700" fill="#DC2626" fontFamily="sans-serif">Busy</text>
                          <circle cx="104" cy="42" r="4.5" fill="#EF4444">
                            <animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite"/>
                          </circle>
                        </g>

                        {/* Group Study Rooms — top-right (Zone B) */}
                        <g filter="url(#cardShadow)">
                          <rect x="492" y="38" width="94" height="64" rx="12" fill="white" stroke="#E2E8F0" strokeWidth="1"/>
                          <text x="496" y="62" fontSize="17" fontFamily="sans-serif">👥</text>
                          <text x="516" y="57" fontSize="8" fontWeight="700" fill="#2563EB" fontFamily="sans-serif">Study Rooms</text>
                          <text x="516" y="67" fontSize="6" fill="#94A3B8" fontFamily="sans-serif">غرف الدراسة</text>
                          <rect x="496" y="72" width="44" height="14" rx="7" fill="#DCFCE7"/>
                          <text x="518" y="90" textAnchor="middle" fontSize="11" fontWeight="700" fill="#16A34A" fontFamily="sans-serif">Available</text>
                          <circle cx="496" cy="42" r="4.5" fill="#22C55E">
                            <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite"/>
                          </circle>
                        </g>

                        {/* Printing & Copying — bottom-left (Zone C) */}
                        <g filter="url(#cardShadow)">
                          <rect x="14" y="397" width="94" height="64" rx="12" fill="white" stroke="#E2E8F0" strokeWidth="1"/>
                          <text x="26" y="422" fontSize="17" fontFamily="sans-serif">🖨️</text>
                          <text x="48" y="418" fontSize="8" fontWeight="700" fill="#C2410C" fontFamily="sans-serif">Print &amp; Copy</text>
                          <text x="48" y="428" fontSize="6" fill="#94A3B8" fontFamily="sans-serif">الطباعة والنسخ</text>
                          <rect x="26" y="433" width="44" height="14" rx="7" fill="#DCFCE7"/>
                          <text x="48" y="451" textAnchor="middle" fontSize="11" fontWeight="700" fill="#16A34A" fontFamily="sans-serif">Available</text>
                          <circle cx="104" cy="401" r="4.5" fill="#22C55E">
                            <animate attributeName="opacity" values="1;0.4;1" dur="1.8s" repeatCount="indefinite"/>
                          </circle>
                        </g>

                        {/* Silent Reading Zone — bottom-right (Zone D) */}
                        <g filter="url(#cardShadow)">
                          <rect x="492" y="397" width="94" height="64" rx="12" fill="white" stroke="#E2E8F0" strokeWidth="1"/>
                          <text x="496" y="422" fontSize="17" fontFamily="sans-serif">📖</text>
                          <text x="516" y="418" fontSize="8" fontWeight="700" fill="#6D28D9" fontFamily="sans-serif">Silent Zone</text>
                          <text x="516" y="428" fontSize="6" fill="#94A3B8" fontFamily="sans-serif">منطقة هادئة</text>
                          <rect x="496" y="433" width="44" height="14" rx="7" fill="#DCFCE7"/>
                          <text x="518" y="451" textAnchor="middle" fontSize="11" fontWeight="700" fill="#16A34A" fontFamily="sans-serif">Available</text>
                          <circle cx="496" cy="401" r="4.5" fill="#22C55E">
                            <animate attributeName="opacity" values="1;0.4;1" dur="2.2s" repeatCount="indefinite"/>
                          </circle>
                        </g>

                        {/* Navigation path overlay — pure native SVG/SMIL. Using
                            plain <path>/<animate> (not framer-motion's
                            pathLength, which also drives strokeDasharray
                            internally and silently overrides any dash pattern
                            we set) so the draw-in reveal and the flowing arrow
                            chevrons both render reliably. */}
                        {showPath && destinationShelfId && (() => {
                          const d = getPathData();
                          const destPt: Record<string, [number, number]> = {
                            'A-1': [75, 130],  'A-2': [225, 130],
                            'B-1': [375, 130], 'B-2': [525, 130],
                            'B-3': [75, 190],  'B-4': [225, 190],
                            'C-1': [375, 190], 'C-2': [525, 190],
                            'D-1': [75, 340],  'D-2': [225, 340],
                            'E-1': [375, 340], 'E-2': [525, 340],
                          };
                          const [ex, ey] = destPt[destinationShelfId] ?? [300, 250];
                          return (
                            <g key={destinationShelfId}>
                              {/* Wide glow halo */}
                              <path d={d} stroke="#D97706" strokeWidth="24" fill="none" strokeLinecap="round" opacity="0.08" />
                              {/* Main solid path — draws in via stroke-dashoffset */}
                              <path
                                d={d} stroke="url(#fmPath)" strokeWidth="5" fill="none" strokeLinecap="round"
                                filter="url(#fmGlow)" strokeDasharray="1400" strokeDashoffset="1400" opacity="0.95"
                              >
                                <animate attributeName="stroke-dashoffset" from="1400" to="0" dur="1.1s" fill="freeze" />
                              </path>
                              {/* Flowing amber arrow chevrons */}
                              {[0, 1, 2].map(i => (
                                <polygon key={i} points="-6,-8 9,0 -6,8" fill="#D97706" opacity="0.9" filter="url(#fmGlow)">
                                  <animateMotion dur="1.8s" begin={`${i * 0.6}s`} repeatCount="indefinite" rotate="auto" path={d} />
                                </polygon>
                              ))}
                              {/* Destination pulsing ring */}
                              <circle cx={ex} cy={ey} r="10" fill="#D97706" stroke="white" strokeWidth="2.5" />
                              <circle cx={ex} cy={ey} r="10" fill="none" stroke="#D97706" strokeWidth="2" opacity="0.7">
                                <animate attributeName="r" values="10;26;10" dur="1.8s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="0.7;0;0.7" dur="1.8s" repeatCount="indefinite" />
                              </circle>
                            </g>
                          );
                        })()}
                      </svg>
                        </div>
                      </div>

                      {/* Navigation HUD — live distance / ETA / arrival time */}
                      {showPath && destinationShelfId && (
                        <div className="absolute top-3 inset-x-0 flex justify-center z-30 pointer-events-none px-4">
                          <div className="flex items-center gap-2 flex-wrap justify-center">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/75 backdrop-blur-xl border border-white/20 text-white text-[11px] font-black shadow-xl">
                              <Navigation className="w-3.5 h-3.5 text-accent shrink-0" />
                              <AnimatePresence mode="wait">
                                <motion.span key={liveDistanceMeters} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                  className="text-accent font-black"
                                >{liveDistanceMeters}م / {liveDistanceMeters}m</motion.span>
                              </AnimatePresence>
                              <span className="text-white/30">·</span>
                              <AnimatePresence mode="wait">
                                <motion.span key={liveEtaMinutes} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                  {liveEtaMinutes > 0 ? `${liveEtaMinutes} د / ${liveEtaMinutes} min` : '< 1 د / min'}
                                </motion.span>
                              </AnimatePresence>
                            </div>
                            {!hasArrived ? (
                              <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/75 backdrop-blur-xl border border-white/20 text-white text-[11px] font-black shadow-xl">
                                <Clock className="w-3 h-3 text-accent shrink-0" />
                                <span>الوصول / Arrive</span>
                                <span className="text-accent">{arrivalTime}</span>
                              </div>
                            ) : (
                              <div className="px-4 py-2 rounded-full bg-accent text-primary text-[11px] font-black shadow-xl">
                                ✓ وصلت! / Arrived!
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Shelf hover info card */}
                      <AnimatePresence>
                        {hoveredCell && (() => {
                          const lbl = CELL_LABELS[hoveredCell];
                          const lc = SHELF_LC_CLASS[hoveredCell];
                          return (
                            <motion.div
                              key={hoveredCell}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.15 }}
                              className={cn('absolute bottom-16 z-40 pointer-events-none', dir === 'rtl' ? 'left-4' : 'right-4')}
                            >
                              <div className="bg-slate-900/95 backdrop-blur-xl border border-accent/40 rounded-2xl px-4 py-3 shadow-2xl">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-black text-accent font-mono">{hoveredCell}</span>
                                  {lc && <span className="px-1.5 py-0.5 bg-accent/20 text-accent text-[9px] font-black rounded-md font-mono">{lc}</span>}
                                </div>
                                {lbl && (
                                  <>
                                    <div className="text-[11px] font-black text-white">{language === 'ar' ? lbl.ar : lbl.en}</div>
                                    <div className="text-[9px] text-white/50 mt-0.5">{language === 'ar' ? lbl.en : lbl.ar}</div>
                                  </>
                                )}
                              </div>
                            </motion.div>
                          );
                        })()}
                      </AnimatePresence>

                      {/* Start Navigation + AR Guide buttons */}
                      {destinationShelfId && (
                        <div className={cn('absolute bottom-4 z-40 flex items-center gap-2', dir === 'rtl' ? 'right-4' : 'left-4')}>
                          {!showPath ? (
                            <button
                              onClick={() => {
                                if (typeof navigator.vibrate === 'function') {
                                  try { navigator.vibrate(80); } catch { /* best-effort */ }
                                }
                                setShowPath(true);
                              }}
                              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-accent text-primary text-[11px] font-black shadow-xl shadow-accent/30 hover:brightness-110 transition-all active:scale-95"
                            >
                              <Navigation className="w-4 h-4" style={{ transform: 'rotate(-45deg)' }} />
                              <span>ابدأ الملاحة</span>
                              <span className="opacity-55 font-bold">/ Start</span>
                            </button>
                          ) : !hasArrived ? (
                            <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-black shadow-xl">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                              <span>جاري الملاحة / Navigating…</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-accent text-primary text-[11px] font-black shadow-xl">
                              ✓ وصلت! / Arrived!
                            </div>
                          )}
                          <button
                            onClick={() => setActiveTab('sections')}
                            title="AR Guide"
                            className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-slate-900/90 border border-accent/30 text-accent text-[11px] font-black shadow-xl hover:brightness-110 transition-all active:scale-95"
                          >
                            <Camera className="w-4 h-4" />
                            <span>AR</span>
                          </button>
                        </div>
                      )}
                    </div>
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
                    {/* 3D bookshelf view */}
                    <div className="absolute inset-0 z-10">
                      <Shelf3DView
                        targetBook={bookData ?? null}
                        shelfId={destinationShelfId}
                        language={language}
                        dir={dir}
                      />
                    </div>

                    {/* Walking readout, pinned to the top of the 3D view where
                        it stays glanceable. The distance, remaining minutes and
                        arrival clock were only inside Rafeeq's 150px bubble at
                        the bottom, at 9-10px — too small to read while walking,
                        and the clock time is the part you compare against the
                        lecture you are heading to. */}
                    {showPath && destinationShelfId && !hasArrived && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn('absolute top-6 z-30 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/15 shadow-xl', dir === 'rtl' ? 'right-6 flex-row-reverse' : 'left-6')}
                      >
                        <Clock className="w-4 h-4 text-accent shrink-0" />
                        <div className={cn(dir === 'rtl' ? 'text-right' : 'text-left')}>
                          <div className="flex items-baseline gap-1.5 text-white">
                            <span className="text-lg font-black leading-none">
                              {liveEtaMinutes > 0 ? liveEtaMinutes : '<1'}
                            </span>
                            <span className="text-[10px] font-bold text-white/60">{language === 'ar' ? 'دقيقة' : 'min'}</span>
                            <span className="w-1 h-1 rounded-full bg-white/25 mx-0.5" />
                            <span className="text-[11px] font-black text-accent" dir="ltr">{liveDistanceMeters}m</span>
                          </div>
                          <div className="text-[10px] font-bold text-white/50 mt-0.5">
                            {language === 'ar' ? 'الوصول' : 'Arrive'} <span dir="ltr">{arrivalTime}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Rafeeq mini guide in AR dark view — live demo countdown */}
                    <motion.div
                      className={cn("absolute bottom-44 z-30 flex flex-col items-center gap-1", dir === 'rtl' ? 'left-4' : 'right-4')}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={hasArrived ? 'arrived' : liveDistanceMeters}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-3 py-2 max-w-[150px] text-center mb-1 shadow-xl"
                        >
                          <p className="text-[10px] font-black text-white leading-snug">
                            {language === 'ar' ? rafeeqMessage.ar : rafeeqMessage.en}
                          </p>
                          {showPath && destinationShelfId && (
                            <div className="mt-1.5 h-1 rounded-full bg-white/15 overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-accent"
                                animate={{ width: `${Math.round(walkProgress * 100)}%` }}
                                transition={{ duration: 0.5, ease: 'linear' }}
                              />
                            </div>
                          )}
                          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/10 border-b border-r border-white/20 rotate-45" />
                        </motion.div>
                      </AnimatePresence>
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <RafeeqAvatar className="w-14 h-14 drop-shadow-2xl" />
                      </motion.div>
                      <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">
                        {language === 'ar' ? 'رفيق' : 'Rafeeq'}
                      </span>
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
                        {t('headTowardsShelf', { shelf: displayShelfCode })}
                      </div>
                      {/* Distance/ETA surfaced right under the heading so it's
                          visible without scrolling the tall aisle view on a
                          phone screen, and count down live once navigation
                          starts instead of sitting on one static number. */}
                      <div className="flex items-center gap-2">
                        <div className="px-4 py-2 rounded-full bg-accent/15 backdrop-blur-xl border border-accent/30 text-accent text-[11px] font-black flex items-center gap-2.5">
                          <span className="text-sm font-black">{showPath ? liveDistanceMeters : distanceMeters}{language === 'ar' ? 'م' : 'm'}</span>
                          <span className="w-1 h-1 rounded-full bg-accent/50" />
                          <span>{showPath ? liveEtaMinutes : etaMinutes}{language === 'ar' ? ' د' : ' min'}</span>
                        </div>
                        {showPath && destinationShelfId && !hasArrived && (
                          <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[11px] font-black flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-accent shrink-0" />
                            <span>{language === 'ar' ? 'الوصول' : 'Arrive'}</span>
                            <span className="text-accent font-black">{arrivalTime}</span>
                          </div>
                        )}
                        {hasArrived && (
                          <div className="px-4 py-2 rounded-full bg-accent text-primary text-[11px] font-black">
                            {language === 'ar' ? '✓ وصلت!' : '✓ Arrived!'}
                          </div>
                        )}
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
                <div className="grid grid-cols-2 gap-3">
                  {/* Card 1: Shelf code + LC class */}
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 p-5 rounded-3xl flex flex-col gap-3">
                    <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {language === 'ar' ? 'الرف · الخريطة' : 'SHELF · MAP'}
                    </div>
                    {/* Shelf code row */}
                    <div className={cn('flex items-center gap-3', dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                      <span className="text-4xl font-black text-primary dark:text-white font-mono tracking-tight leading-none">{SHELF_TO_3D_CODE[bookData.shelf] ?? bookData.shelf}</span>
                      {SHELF_LC_CLASS[bookData.shelf] && (
                        <span className="bg-primary text-white dark:bg-accent dark:text-primary px-2.5 py-1 rounded-lg text-sm font-black font-mono shadow-sm tracking-wider">
                          {SHELF_LC_CLASS[bookData.shelf]}
                        </span>
                      )}
                    </div>
                    {/* Subject name from 2D map */}
                    {CELL_LABELS[bookData.shelf] && (
                      <div className={cn('text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-snug', dir === 'rtl' ? 'text-right' : 'text-left')}>
                        {language === 'ar' ? CELL_LABELS[bookData.shelf].ar : CELL_LABELS[bookData.shelf].en}
                      </div>
                    )}
                    <div className="text-[9px] font-bold text-accent/70 leading-snug">
                      {language === 'ar' ? '✓ يطابق الخريطة 2D و AR Floor' : '✓ Matches 2D map & AR Floor'}
                    </div>
                  </div>
                  {/* Card 2: Subject area */}
                  <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 p-5 rounded-3xl flex flex-col gap-2">
                    <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {language === 'ar' ? 'التخصص الموضوعي' : 'SUBJECT AREA'}
                    </div>
                    {CELL_LABELS[bookData.shelf] ? (
                      <>
                        <div className={cn('text-sm font-black text-primary dark:text-white leading-snug', dir === 'rtl' ? 'text-right' : 'text-left')}>
                          {language === 'ar' ? CELL_LABELS[bookData.shelf].ar : CELL_LABELS[bookData.shelf].en}
                        </div>
                        <div className={cn('text-[10px] text-slate-400 dark:text-slate-500 leading-snug mt-1', dir === 'rtl' ? 'text-right' : 'text-left')}>
                          {language === 'ar' ? CELL_LABELS[bookData.shelf].en : CELL_LABELS[bookData.shelf].ar}
                        </div>
                      </>
                    ) : (
                      <div className="text-2xl font-black text-primary dark:text-white">{bookData.section}</div>
                    )}
                  </div>
                </div>
                {/* Call number + position within shelf */}
                {bookData.callNumber && (() => {
                  const shelfBooks = MOCK_BOOKS
                    .filter(b => b.shelf === bookData.shelf && b.callNumber)
                    .sort((a, b) => (a.callNumber ?? '').localeCompare(b.callNumber ?? ''));
                  const pos = shelfBooks.findIndex(b => b.id === bookData.id);
                  const total = shelfBooks.length;
                  const posLabel = pos < total / 3
                    ? (language === 'ar' ? 'بداية الرف' : 'Start of shelf')
                    : pos < (2 * total) / 3
                    ? (language === 'ar' ? 'منتصف الرف' : 'Middle of shelf')
                    : (language === 'ar' ? 'نهاية الرف' : 'End of shelf');
                  return (
                    <div className="space-y-3">
                      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 p-5 rounded-3xl">
                        <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                          {language === 'ar' ? 'رقم التصنيف (الكوندرس)' : 'LC Call Number'}
                        </div>
                        <div className="font-mono text-sm font-black text-primary dark:text-white tracking-wide">{bookData.callNumber}</div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 p-5 rounded-3xl">
                        <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                          {language === 'ar' ? 'موضع الكتاب على الرف' : 'Position on Shelf'}
                        </div>
                        {/* Visual spine row */}
                        <div className="flex gap-0.5 mb-3">
                          {shelfBooks.map((b, i) => (
                            <div
                              key={b.id}
                              className={cn(
                                "flex-1 rounded-sm transition-all",
                                b.id === bookData.id
                                  ? "h-9 bg-accent shadow-lg shadow-accent/30"
                                  : "h-6 bg-slate-200 dark:bg-slate-700"
                              )}
                              title={b.callNumber}
                            />
                          ))}
                        </div>
                        <div className={cn("flex items-center justify-between text-[10px] font-black", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                          <span className="text-accent">{posLabel}</span>
                          <span className="text-slate-400 dark:text-slate-500" dir="ltr">
                            {pos + 1} / {total}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
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
                      "w-full py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-base sm:text-sm font-bold text-primary dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors",
                      dir === 'rtl' ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4 text-left'
                    )}
                  />
                  {sidebarSearch && (
                    <button onClick={() => setSidebarSearch('')} aria-label={language === 'ar' ? 'مسح البحث' : 'Clear search'} className={cn("absolute top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors", dir === 'rtl' ? 'left-2' : 'right-2')}>
                      <X className="w-4 h-4" />
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
                          <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 truncate">{bookCategory(book.category, language)}</span>
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
                    {language === 'ar' ? `التوجه نحو رف ${displayShelfCode}` : `Head to shelf ${displayShelfCode}`}
                  </motion.div>
                  <motion.div initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.55 }}
                    className="px-4 py-1.5 rounded-full bg-accent/25 border border-accent/50 text-accent text-[10px] font-black flex items-center gap-2">
                    <span>{language === 'ar' ? 'المسافة' : 'Distance'}: {distanceMeters}{language === 'ar' ? ' م' : 'm'}</span>
                    <span className="w-1 h-1 rounded-full bg-accent/60" />
                    <span>{language === 'ar' ? 'الوقت' : 'ETA'}: {etaMinutes}{language === 'ar' ? ' د' : ' min'}</span>
                  </motion.div>
                </div>
              )}

              {/* Rafeeq avatar + speech bubble — live demo countdown */}
              <motion.div
                className={cn("absolute bottom-40 flex flex-col items-center gap-1 pointer-events-none", dir === 'rtl' ? 'left-4' : 'right-4')}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                style={{ zIndex: 20 }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={hasArrived ? 'arrived' : liveDistanceMeters}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="relative bg-white/15 backdrop-blur-xl border border-white/25 rounded-2xl px-3 py-2 max-w-[160px] text-center mb-1 shadow-xl"
                  >
                    {showPath && destinationShelfId && !hasArrived && (
                      <div className="flex flex-col items-center gap-1 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-accent font-black text-base leading-none">{liveDistanceMeters}م</span>
                          <span className="text-white/40 text-[9px]">·</span>
                          <span className="text-white/70 font-bold text-[11px]">{liveEtaMinutes > 0 ? `${liveEtaMinutes} دقيقة` : 'أقل من دقيقة'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-white/50 font-bold">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{language === 'ar' ? 'الوصول' : 'Arrive'} {arrivalTime}</span>
                        </div>
                      </div>
                    )}
                    <p className="text-[10px] font-black text-white leading-snug">
                      {language === 'ar' ? rafeeqMessage.ar : rafeeqMessage.en}
                    </p>
                    {showPath && destinationShelfId && (
                      <div className="mt-1.5 h-1.5 rounded-full bg-white/15 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-accent"
                          animate={{ width: `${Math.round(walkProgress * 100)}%` }}
                          transition={{ duration: 0.5, ease: 'linear' }}
                        />
                      </div>
                    )}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white/15 border-b border-r border-white/25 rotate-45" />
                  </motion.div>
                </AnimatePresence>
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
                        {bookData ? bookData.title : (language === 'ar' ? `رف ${displayShelfCode}` : `Shelf ${displayShelfCode}`)}
                      </p>
                      {bookData && <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">{bookData.author}</p>}
                      <div className={cn("flex items-center gap-1.5 mt-1.5 flex-wrap", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                        <span className="text-[8px] font-black text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                          {language === 'ar' ? `رف ${displayShelfCode}` : `Shelf ${displayShelfCode}`}
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
