import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Compass, Camera, X, Box, Users, VolumeX, Monitor, Printer, Search, Map as MapIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../hooks/useLanguage';

interface ManualTarget { id: string }

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

const DISTANCE_BY_CELL: Record<string, number> = {
  'A-2': 38,
  'B-2': 52,
  'C-1': 64,
  'D-1': 75,
};

export function FacilitiesMap() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language, dir } = useLanguage();

  const [manualTarget, setManualTarget] = useState<ManualTarget | null>(() => {
    if (location.state?.facilityCell) return { id: location.state.facilityCell };
    return null;
  });
  const [facilitySearch, setFacilitySearch] = useState('');
  const [activeView, setActiveView] = useState<'map' | 'ar'>('map');
  const [showPath, setShowPath] = useState(false);
  const [walkProgress, setWalkProgress] = useState(0);

  const FACILITIES = [
    {
      icon: Users,
      name: t('facilityGroupStudyRooms'),
      desc: t('facilityGroupStudyRoomsDesc'),
      location: t('facilityLocationGroupStudy'),
      status: 'available' as const,
      cellId: 'B-2',
    },
    {
      icon: VolumeX,
      name: t('facilitySilentZone'),
      desc: t('facilitySilentZoneDesc'),
      location: t('facilityLocationSilentZone'),
      status: 'available' as const,
      cellId: 'D-1',
    },
    {
      icon: Monitor,
      name: t('facilityComputerLab'),
      desc: t('facilityComputerLabDesc'),
      location: t('facilityLocationComputerLab'),
      status: 'busy' as const,
      cellId: 'A-2',
    },
    {
      icon: Printer,
      name: t('facilityPrinting'),
      desc: t('facilityPrintingDesc'),
      location: t('facilityLocationPrinting'),
      status: 'available' as const,
      cellId: 'C-1',
    },
  ];

  const filtered = useMemo(() => {
    const q = facilitySearch.trim().toLowerCase();
    if (!q) return FACILITIES;
    return FACILITIES.filter(
      f =>
        f.name.toLowerCase().includes(q) ||
        f.desc.toLowerCase().includes(q) ||
        f.location.toLowerCase().includes(q)
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilitySearch, language]);

  const targetFacility = manualTarget
    ? FACILITIES.find(f => f.cellId === manualTarget.id)
    : undefined;

  const distanceMeters = manualTarget ? (DISTANCE_BY_CELL[manualTarget.id] ?? 50) : 0;
  const totalWalkSeconds = distanceMeters ? Math.max(60, Math.round((distanceMeters / 50) * 60) + 20) : 0;
  const etaMinutes = Math.max(1, Math.round(totalWalkSeconds / 60));

  useEffect(() => {
    if (!showPath || !manualTarget || activeView !== 'ar') {
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
  }, [showPath, manualTarget, activeView, totalWalkSeconds]);

  const liveDistanceMeters = Math.round(distanceMeters * (1 - walkProgress));
  const liveEtaMinutes = Math.max(0, Math.round(etaMinutes * (1 - walkProgress)));
  const hasArrived = showPath && walkProgress >= 1;

  const navigationSteps = targetFacility
    ? [
        t('navStepStart'),
        t('navStepAisle'),
        targetFacility.cellId === 'B-2' || targetFacility.cellId === 'D-1'
          ? t('navStepTurnRight', { section: targetFacility.name })
          : t('navStepTurnLeft', { section: targetFacility.name }),
        t('navStepArrive', { destination: targetFacility.name }),
      ]
    : [];

  const liveStepIndex = navigationSteps.length > 0
    ? Math.min(navigationSteps.length - 1, Math.floor(walkProgress * navigationSteps.length))
    : 0;

  const navPaths: Record<string, string> = {
    'A-2': 'M 300,478 L 300,260 L 136,260 L 136,125',
    'B-2': 'M 300,478 L 300,260 L 463,260 L 463,125',
    'C-1': 'M 300,478 L 300,260 L 136,260 L 136,385',
    'D-1': 'M 300,478 L 300,260 L 463,260 L 463,385',
  };

  const markerPositions: Record<string, { top: string; left?: string; right?: string }> = {
    'A-2': { top: '14%', left: '4%' },
    'B-2': { top: '14%', right: '4%' },
    'C-1': { top: '57%', left: '4%' },
    'D-1': { top: '57%', right: '4%' },
  };

  return (
    <div
      className={cn(
        'h-full flex flex-col gap-8 animate-in duration-500 font-sans',
        dir === 'rtl' ? 'slide-in-from-left-4 text-right' : 'slide-in-from-right-4 text-left'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex flex-col md:flex-row items-center justify-between gap-8 pb-8 border-b border-slate-200 dark:border-white/10',
          dir === 'rtl' ? 'md:flex-row-reverse' : 'md:flex-row'
        )}
      >
        <div className={cn(dir === 'rtl' ? 'text-right' : 'text-left')}>
          <div className={cn('flex items-center gap-3 mb-4', dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
            <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center text-accent">
              <Compass className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">
              {language === 'ar' ? 'نظام الملاحة الداخلية' : 'INDOOR NAVIGATION'}
            </span>
          </div>
          <h1 className="text-4xl font-black text-primary dark:text-white tracking-tight">
            {t('libraryFacilities')}
          </h1>
          <p className="text-slate-400 dark:text-slate-500 font-bold mt-2 leading-relaxed">
            {language === 'ar'
              ? 'اعثر على قاعات الدراسة، مختبرات الحاسوب، الطابعات والمرافق الأخرى'
              : 'Find study rooms, computer labs, printers, and other facilities'}
          </p>
        </div>

      </div>

      {/* Main content */}
      <div
        className={cn(
          'flex flex-col xl:flex-row gap-10 flex-1 min-h-0',
          dir === 'rtl' ? 'xl:flex-row-reverse' : 'xl:flex-row'
        )}
      >
        {/* Left: Map or AR view */}
        <div className="flex-1 official-card relative overflow-hidden min-h-[650px] p-0 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20">
          <AnimatePresence mode="wait">

            {/* ── AR navigation mode ── */}
            {activeView === 'ar' ? (
              <motion.div
                key="ar-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative w-full h-full min-h-[650px] flex flex-col bg-[#01354C] dark:bg-[#010f1a]"
              >
                {/* Shelf silhouette background */}
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

                {/* Top controls */}
                <div className={cn('absolute top-6 z-20 flex items-center gap-3', dir === 'rtl' ? 'right-6' : 'left-6')}>
                  <button
                    onClick={() => { setManualTarget(null); setShowPath(false); setWalkProgress(0); }}
                    className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-xl border border-white/10 transition-all active:scale-95"
                  >
                    {t('changeRouteLabel')}
                  </button>
                </div>
                <button
                  onClick={() => navigate('/ar')}
                  title={t('enterArMode')}
                  className={cn('absolute top-6 z-20 p-3 rounded-full bg-accent text-primary shadow-[0_8px_24px_rgba(217,179,16,0.4)] hover:brightness-110 transition-all active:scale-90', dir === 'rtl' ? 'left-6' : 'right-6')}
                >
                  <Camera className="w-4 h-4" />
                </button>

                {/* Yellow arrow path + pulsing dot */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 500" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <linearGradient id="darkPathGradientF" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#D9B310" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#D9B310" stopOpacity="1" />
                    </linearGradient>
                    <filter id="darkGlowF">
                      <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <motion.path
                    d={DARK_NAV_PATH_D}
                    stroke="url(#darkPathGradientF)"
                    strokeWidth="10"
                    strokeDasharray="4 16"
                    strokeLinecap="round"
                    fill="none"
                    filter="url(#darkGlowF)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                  />
                  {/* Flowing yellow arrows along path */}
                  {[0, 1, 2].map(i => (
                    <polygon key={i} points="-7,-9 8,0 -7,9" fill="#D9B310" stroke="#01354C" strokeWidth="1">
                      <animateMotion dur="2.2s" begin={`${i * 0.75}s`} repeatCount="indefinite" rotate="auto" path={DARK_NAV_PATH_D} />
                    </polygon>
                  ))}
                  {/* Destination marker with pulse */}
                  <circle cx="285" cy="90" r="13" fill="#D9B310" stroke="white" strokeWidth="3" />
                  <motion.circle
                    cx="285" cy="90" r="13"
                    stroke="#D9B310" strokeWidth="2" fill="none"
                    animate={{ r: [13, 32, 13], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </svg>

                {/* Overlaid labels */}
                {targetFacility ? (
                  <>
                    <div className="absolute top-24 inset-x-0 flex flex-col items-center gap-2.5 z-20 px-10">
                      <div className="px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-white text-xs font-black flex items-center gap-2">
                        <Navigation className={cn('w-4 h-4 text-accent', dir === 'rtl' ? 'rotate-180' : '')} />
                        {t('headTowardsDestination', { destination: targetFacility.name })}
                      </div>
                      <div className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Box className="w-3.5 h-3.5 text-accent/80" />
                        {targetFacility.location}
                      </div>
                      <div className="px-5 py-2 rounded-full bg-accent/15 backdrop-blur-xl border border-accent/30 text-accent text-[11px] font-black flex items-center gap-3">
                        <span>{t('distanceLabel')}: {showPath ? liveDistanceMeters : distanceMeters}{language === 'ar' ? ' م' : 'm'}</span>
                        <span className="w-1 h-1 rounded-full bg-accent/50" />
                        <span>{t('etaLabel')}: {showPath ? liveEtaMinutes : etaMinutes}{language === 'ar' ? ' د' : ' min'}</span>
                      </div>
                      {navigationSteps.length > 0 && (
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={hasArrived ? 'arrived' : liveStepIndex}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            className={cn(
                              'px-5 py-2 rounded-full backdrop-blur-xl border text-[11px] font-black flex items-center gap-2 max-w-full',
                              hasArrived
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                : 'bg-white/10 border-white/10 text-white'
                            )}
                          >
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">
                              {hasArrived ? t('reachedDestination') : navigationSteps[liveStepIndex]}
                            </span>
                          </motion.div>
                        </AnimatePresence>
                      )}
                    </div>

                    {/* Bottom info card + start button */}
                    <div className="relative z-20 mt-auto p-6 space-y-3">
                      <div className={cn('bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2rem] p-5 flex items-center gap-4 shadow-2xl', dir === 'rtl' ? 'flex-row-reverse text-right' : 'flex-row text-left')}>
                        <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shrink-0">
                          <targetFacility.icon className="w-7 h-7" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-primary dark:text-white text-sm truncate">{targetFacility.name}</h4>
                          <div className={cn('flex items-center gap-4 mt-1 text-[10px] font-bold text-slate-400', dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                            <span>{t('distanceLabel')}: {showPath ? liveDistanceMeters : distanceMeters}{language === 'ar' ? ' م' : 'm'}</span>
                            <span>{t('etaLabel')}: {showPath ? liveEtaMinutes : etaMinutes}{language === 'ar' ? ' د' : ' min'}</span>
                          </div>
                        </div>
                      </div>
                      {showPath ? (
                        <div className={cn(
                          'w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3',
                          hasArrived
                            ? 'bg-emerald-500/25 border border-emerald-500/40 text-emerald-400'
                            : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                        )}>
                          <span className={cn('w-2 h-2 rounded-full bg-emerald-400', !hasArrived && 'animate-pulse')} />
                          {hasArrived ? t('reachedDestination') : t('navigationInProgressLabel')}
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            if (typeof navigator.vibrate === 'function') {
                              try { navigator.vibrate(80); } catch { /* best-effort */ }
                            }
                            setShowPath(true);
                          }}
                          className="w-full py-4 bg-accent text-primary rounded-2xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95"
                        >
                          {t('startNavigationLabel')}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  /* No facility selected in AR mode */
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 text-white/40 p-12">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                      <Compass className="w-10 h-10" />
                    </div>
                    <p className="text-sm font-bold max-w-xs">
                      {language === 'ar'
                        ? 'اختر مرفقاً من القائمة لبدء التوجيه'
                        : 'Select a facility from the list to start guidance'}
                    </p>
                    <button
                      onClick={() => setActiveView('map')}
                      className="px-6 py-3 bg-accent text-primary rounded-2xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95"
                    >
                      {language === 'ar' ? 'اذهب للخريطة' : 'Go to Map'}
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              /* ── Floor plan (map mode) ── */
              <motion.div
                key="map-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative w-full h-full min-h-[650px] overflow-hidden bg-slate-50/50 dark:bg-slate-900/50"
              >
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 600 520"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    <pattern id="floorGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                    </pattern>
                    <filter id="facilityGlow">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <rect x="0" y="0" width="600" height="520" fill="url(#floorGrid)" />
                  <rect x="18" y="18" width="564" height="464" rx="20" fill="white" stroke="#e2e8f0" strokeWidth="2.5" />
                  <rect x="255" y="18" width="90" height="464" fill="#f8fafc" />
                  <rect x="18" y="228" width="564" height="64" fill="#f8fafc" />
                  <line x1="300" y1="18" x2="300" y2="482" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="6 4" />
                  <line x1="18" y1="260" x2="582" y2="260" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="6 4" />

                  {/* Section A */}
                  <rect x="28" y="28" width="217" height="192" rx="12" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5" />
                  <text x="136" y="110" textAnchor="middle" fontSize="13" fontWeight="900" fill="#1e40af" opacity="0.6">A</text>
                  <text x="136" y="128" textAnchor="middle" fontSize="9" fontWeight="700" fill="#93c5fd">NATURAL SCIENCES</text>
                  {[55, 70, 85, 100, 115, 130].map((x, i) => (
                    <line key={i} x1={x} y1="48" x2={x} y2="205" stroke="#bfdbfe" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
                  ))}
                  {[170, 185, 200, 215, 230].map((x, i) => (
                    <line key={i} x1={x} y1="48" x2={x} y2="205" stroke="#bfdbfe" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
                  ))}

                  {/* Section B */}
                  <rect x="355" y="28" width="217" height="192" rx="12" fill="#fff7ed" stroke="#fed7aa" strokeWidth="1.5" />
                  <text x="463" y="110" textAnchor="middle" fontSize="13" fontWeight="900" fill="#c2410c" opacity="0.6">B</text>
                  <text x="463" y="128" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fdba74">ENGINEERING &amp; TECH</text>
                  {[380, 395, 410, 425, 440].map((x, i) => (
                    <line key={i} x1={x} y1="48" x2={x} y2="205" stroke="#fed7aa" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
                  ))}
                  {[500, 515, 530, 545, 560].map((x, i) => (
                    <line key={i} x1={x} y1="48" x2={x} y2="205" stroke="#fed7aa" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
                  ))}

                  {/* Section C */}
                  <rect x="28" y="300" width="217" height="172" rx="12" fill="#faf5ff" stroke="#d8b4fe" strokeWidth="1.5" />
                  <text x="136" y="378" textAnchor="middle" fontSize="13" fontWeight="900" fill="#7e22ce" opacity="0.6">C</text>
                  <text x="136" y="396" textAnchor="middle" fontSize="9" fontWeight="700" fill="#c4b5fd">ARTS &amp; CRAFTS</text>
                  {[55, 70, 85, 100, 115, 130].map((x, i) => (
                    <line key={i} x1={x} y1="320" x2={x} y2="460" stroke="#d8b4fe" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
                  ))}
                  {[170, 185, 200, 215, 230].map((x, i) => (
                    <line key={i} x1={x} y1="320" x2={x} y2="460" stroke="#d8b4fe" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
                  ))}

                  {/* Section D */}
                  <rect x="355" y="300" width="217" height="172" rx="12" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="1.5" />
                  <text x="463" y="378" textAnchor="middle" fontSize="13" fontWeight="900" fill="#15803d" opacity="0.6">D</text>
                  <text x="463" y="396" textAnchor="middle" fontSize="9" fontWeight="700" fill="#86efac">HUMANITIES</text>
                  {[380, 395, 410, 425, 440].map((x, i) => (
                    <line key={i} x1={x} y1="320" x2={x} y2="460" stroke="#bbf7d0" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
                  ))}
                  {[500, 515, 530, 545, 560].map((x, i) => (
                    <line key={i} x1={x} y1="320" x2={x} y2="460" stroke="#bbf7d0" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
                  ))}

                  {/* Entrance */}
                  <rect x="248" y="478" width="104" height="22" rx="8" fill="#004C6D" />
                  <text x="300" y="493" textAnchor="middle" fontSize="8" fontWeight="800" fill="white" letterSpacing="1">ENTRANCE</text>
                  <line x1="300" y1="478" x2="300" y2="464" stroke="#004C6D" strokeWidth="2" />

                  {/* Animated nav path */}
                  <AnimatePresence>
                    {manualTarget && navPaths[manualTarget.id] && (
                      <>
                        <motion.path
                          key={`path-${manualTarget.id}`}
                          d={navPaths[manualTarget.id]}
                          stroke="#D9B310"
                          strokeWidth="5"
                          strokeDasharray="12 8"
                          fill="none"
                          strokeLinecap="round"
                          filter="url(#facilityGlow)"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          exit={{ pathLength: 0 }}
                          transition={{ duration: 1.2, ease: 'easeInOut' }}
                        />
                        <motion.circle key={`dot-${manualTarget.id}`} r="8" fill="#D9B310" stroke="white" strokeWidth="3">
                          <animateMotion dur="3s" repeatCount="indefinite" path={navPaths[manualTarget.id]} />
                        </motion.circle>
                      </>
                    )}
                  </AnimatePresence>
                </svg>

                {/* Facility markers */}
                {FACILITIES.map(f => {
                  const pos = markerPositions[f.cellId];
                  if (!pos) return null;
                  const isSelected = manualTarget?.id === f.cellId;
                  return (
                    <button
                      key={f.cellId}
                      onClick={() => {
                        setManualTarget(isSelected ? null : { id: f.cellId });
                        setShowPath(false);
                        setWalkProgress(0);
                      }}
                      style={{ top: pos.top, left: pos.left, right: pos.right }}
                      className={cn(
                        'absolute flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-300 shadow-lg cursor-pointer group z-10 w-28',
                        isSelected
                          ? 'bg-accent border-accent/60 shadow-[0_8px_30px_rgba(217,179,16,0.4)] scale-110'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 hover:border-primary/40 dark:hover:border-accent/40 hover:scale-105'
                      )}
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                          isSelected
                            ? 'bg-primary/20 text-primary'
                            : 'bg-primary/10 dark:bg-accent/10 text-primary dark:text-accent'
                        )}
                      >
                        <f.icon className="w-5 h-5" />
                      </div>
                      <span className={cn('text-[9px] font-black text-center leading-tight', isSelected ? 'text-primary' : 'text-primary dark:text-white')}>
                        {f.name}
                      </span>
                      <span
                        className={cn(
                          'text-[8px] font-bold px-2 py-0.5 rounded-full',
                          f.status === 'available'
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                        )}
                      >
                        {f.status === 'available' ? t('facilityAvailable') : t('facilityBusy')}
                      </span>
                    </button>
                  );
                })}

                {/* "Switch to AR" nudge when a facility is selected */}
                {manualTarget && (
                  <button
                    onClick={() => setActiveView('ar')}
                    className={cn(
                      'absolute bottom-6 z-10 flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-accent text-xs font-black shadow-xl shadow-primary/30 hover:brightness-110 transition-all active:scale-95',
                      dir === 'rtl' ? 'right-6' : 'left-6'
                    )}
                  >
                    <Camera className="w-4 h-4" />
                    {language === 'ar' ? 'عرض AR توجيه' : 'View AR Guide'}
                  </button>
                )}

                <div className={cn('absolute bottom-6 opacity-10 text-primary dark:text-white pointer-events-none', dir === 'rtl' ? 'left-6' : 'right-6')}>
                  <Compass className="w-16 h-16" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right sidebar */}
        <div className="w-full xl:w-[450px] flex flex-col gap-8">
          <AnimatePresence mode="wait">
            {manualTarget && targetFacility ? (
              /* ── Facility selected: navigation panel ── */
              <motion.div
                key="facility-nav"
                initial={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }}
                className="official-card p-8 bg-white dark:bg-slate-900"
              >
                <div className="space-y-8">
                  <div className="flex justify-center">
                    <div className="w-28 h-28 bg-accent/10 dark:bg-accent/15 rounded-[2.5rem] flex items-center justify-center text-primary dark:text-accent">
                      <targetFacility.icon className="w-12 h-12" />
                    </div>
                  </div>

                  <div className="text-center space-y-3">
                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">
                      {t('navigationOn')}
                    </div>
                    <h2 className="text-2xl font-black leading-tight tracking-tight text-primary dark:text-white">
                      {targetFacility.name}
                    </h2>
                    <p className="text-slate-400 dark:text-slate-500 font-bold text-[11px] tracking-widest">
                      {targetFacility.location}
                    </p>
                    <span
                      className={cn(
                        'inline-block text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider',
                        targetFacility.status === 'available'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                      )}
                    >
                      {targetFacility.status === 'available' ? t('facilityAvailable') : t('facilityBusy')}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {t('navigationStepsTitle')}
                    </div>
                    <ol className="space-y-2">
                      {navigationSteps.map((step, idx) => (
                        <li
                          key={idx}
                          className={cn(
                            'flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl p-3',
                            dir === 'rtl' ? 'text-right' : 'text-left'
                          )}
                        >
                          <span className="shrink-0 w-6 h-6 rounded-full bg-primary dark:bg-accent text-white dark:text-primary text-[11px] font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                            {step}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* AR mode button */}
                  <button
                    onClick={() => setActiveView('ar')}
                    className="w-full py-4 bg-primary text-white rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:brightness-110 shadow-sm transition-all active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{language === 'ar' ? 'عرض AR توجيه' : 'View AR Guide'}</span>
                  </button>

                  <button
                    onClick={() => setActiveView('map')}
                    className="w-full py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-primary dark:text-white rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:border-accent/60 transition-all active:scale-95"
                  >
                    <MapIcon className="w-4 h-4" />
                    <span>{language === 'ar' ? 'الخريطة' : 'Map'}</span>
                  </button>

                  <button
                    onClick={() => { setManualTarget(null); setShowPath(false); setWalkProgress(0); }}
                    className="w-full py-4 text-slate-400 dark:text-slate-500 hover:text-red-500 font-black text-[11px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    {t('cancelActiveNavigation')}
                  </button>
                </div>
              </motion.div>
            ) : (
              /* ── No selection: facility search panel ── */
              <motion.div
                key="facility-search"
                initial={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }}
                className="official-card flex flex-col bg-white dark:bg-slate-900 shadow-2xl shadow-black/5 dark:shadow-black/20 overflow-hidden min-h-[500px]"
              >
                <div className="px-7 pt-7 pb-5 border-b border-slate-100 dark:border-white/5">
                  <div className={cn('flex items-center gap-3 mb-4', dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                    <div className="w-9 h-9 bg-primary/10 dark:bg-accent/10 rounded-xl flex items-center justify-center text-primary dark:text-accent">
                      <Compass className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-black text-primary dark:text-white tracking-tight">
                      {language === 'ar' ? 'البحث في المرافق' : 'Search Facilities'}
                    </h3>
                  </div>
                  <div className="relative">
                    <Search
                      className={cn(
                        'absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none',
                        dir === 'rtl' ? 'right-4' : 'left-4'
                      )}
                    />
                    <input
                      type="text"
                      value={facilitySearch}
                      onChange={e => setFacilitySearch(e.target.value)}
                      placeholder={language === 'ar' ? 'اسم المرفق أو الموقع...' : 'Facility name or location...'}
                      className={cn(
                        'w-full py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold text-primary dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors',
                        dir === 'rtl' ? 'pr-11 pl-4 text-right' : 'pl-11 pr-4 text-left'
                      )}
                    />
                    {facilitySearch && (
                      <button
                        onClick={() => setFacilitySearch('')}
                        className={cn(
                          'absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors',
                          dir === 'rtl' ? 'left-4' : 'right-4'
                        )}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-white/5">
                  {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-300 dark:text-slate-600">
                      <Compass className="w-8 h-8" />
                      <p className="text-xs font-bold">{language === 'ar' ? 'لا توجد نتائج' : 'No results'}</p>
                    </div>
                  ) : (
                    filtered.map(facility => (
                      <button
                        key={facility.cellId}
                        onClick={() => { setManualTarget({ id: facility.cellId }); setShowPath(false); }}
                        className={cn(
                          'w-full flex items-center gap-4 px-5 py-5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group',
                          dir === 'rtl' ? 'flex-row-reverse text-right' : 'flex-row text-left'
                        )}
                      >
                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-primary/10 dark:bg-accent/10 flex items-center justify-center text-primary dark:text-accent group-hover:bg-primary/20 dark:group-hover:bg-accent/20 transition-colors">
                          <facility.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-primary dark:text-white truncate leading-tight group-hover:text-primary dark:group-hover:text-accent transition-colors">
                            {facility.name}
                          </p>
                          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            {facility.desc}
                          </p>
                          <div
                            className={cn(
                              'flex items-center gap-2 mt-1.5',
                              dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'
                            )}
                          >
                            <MapPin className="w-3 h-3 text-primary/40 dark:text-accent/60 shrink-0" />
                            <span className="text-[10px] font-bold text-primary/50 dark:text-accent/70 truncate">
                              {facility.location}
                            </span>
                            <span
                              className={cn(
                                'shrink-0 text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider',
                                facility.status === 'available'
                                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                                  : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                              )}
                            >
                              {facility.status === 'available' ? t('facilityAvailable') : t('facilityBusy')}
                            </span>
                          </div>
                        </div>
                        <Navigation
                          className={cn(
                            'w-4 h-4 shrink-0 text-slate-200 dark:text-slate-700 group-hover:text-primary dark:group-hover:text-accent transition-colors',
                            dir === 'rtl' ? 'rotate-180' : ''
                          )}
                        />
                      </button>
                    ))
                  )}
                </div>

                <div className="px-7 py-4 border-t border-slate-50 dark:border-white/5">
                  <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 text-center leading-relaxed">
                    {language === 'ar'
                      ? 'اختر مرفقاً لعرض مساره على الخريطة'
                      : 'Pick a facility to show its route on the map'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
