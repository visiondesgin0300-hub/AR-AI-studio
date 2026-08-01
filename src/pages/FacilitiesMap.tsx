import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Compass, Camera, X, Box, Users, VolumeX, Monitor, Printer, Search, Map as MapIcon } from 'lucide-react';
import { cn, trackMapVisit } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../hooks/useLanguage';

const DARK_NAV_PATH_D = 'M 300,460 C 300,380 190,340 210,260 C 230,180 260,140 285,90';

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

  useEffect(() => { trackMapVisit('facilities'); }, []);

  const [manualTarget, setManualTarget] = useState<{ id: string } | null>(() => {
    if (location.state?.facilityCell) return { id: location.state.facilityCell };
    return null;
  });
  const [facilitySearch, setFacilitySearch] = useState('');
  const [mapMode, setMapMode] = useState<'flat' | '3d'>('flat');
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
    if (!showPath || !manualTarget) {
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
  }, [showPath, manualTarget, totalWalkSeconds]);

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

  // ── Shared 2D/3D toggle ──────────────────────────────────────────────────
  const MapToggle = () => (
    <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-white/90 dark:bg-black/60 backdrop-blur-xl rounded-xl p-1 border border-slate-200/80 dark:border-white/10 pointer-events-auto shadow-lg">
      <button
        onClick={() => setMapMode('flat')}
        className={cn(
          'px-3 py-1.5 rounded-lg text-[10px] font-black transition-all',
          mapMode === 'flat'
            ? 'bg-primary text-white dark:bg-[#0EA5D6] dark:text-[#050c1a] shadow'
            : 'text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/10'
        )}
      >2D</button>
      <button
        onClick={() => setMapMode('3d')}
        className={cn(
          'px-3 py-1.5 rounded-lg text-[10px] font-black transition-all',
          mapMode === '3d'
            ? 'bg-primary text-white dark:bg-[#0EA5D6] dark:text-[#050c1a] shadow'
            : 'text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/10'
        )}
      >3D</button>
    </div>
  );

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
        {/* ── Left: map panel ── */}
        <div className="flex-1 official-card relative overflow-hidden min-h-[650px] p-0 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20">
          <AnimatePresence mode="wait">

            {/* ════ 3D view — library-ar-floor iframe ════ */}
            {mapMode === '3d' ? (
              <motion.div
                key="3d-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative w-full h-full min-h-[650px] flex flex-col"
              >
                <iframe
                  src="/library-ar-floor.html"
                  title="3D Library Floor"
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; gyroscope"
                />

                {/* HUD overlay */}
                <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
                  {/* Top controls */}
                  <div className={cn('flex items-start gap-3 p-3 pointer-events-auto', dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                    {manualTarget && (
                      <button
                        onClick={() => { setManualTarget(null); setShowPath(false); setWalkProgress(0); }}
                        className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-xl text-white text-[10px] font-black uppercase tracking-widest border border-white/15 hover:bg-black/80 transition-all active:scale-95"
                      >
                        {t('changeRouteLabel')}
                      </button>
                    )}
                  </div>

                  {/* 2D/3D toggle */}
                  <MapToggle />

                  {/* Facility selected — navigation HUD */}
                  {targetFacility && (
                    <div className="flex-1 flex flex-col justify-end pointer-events-none">
                      {/* Direction info */}
                      <div className="flex flex-col items-center gap-2 mb-4 px-6 pointer-events-none">
                        <div className="px-5 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-white text-xs font-black flex items-center gap-2">
                          <Navigation className={cn('w-4 h-4 text-[#0EA5D6]', dir === 'rtl' ? 'rotate-180' : '')} />
                          {t('headTowardsDestination', { destination: targetFacility.name })}
                        </div>
                        <div className="px-4 py-1 rounded-full bg-black/50 backdrop-blur-xl border border-white/10 text-white/70 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <Box className="w-3 h-3 text-[#0EA5D6]/80" />
                          {targetFacility.location}
                        </div>
                        <div className="px-4 py-1.5 rounded-full bg-[#0EA5D6]/20 backdrop-blur-xl border border-[#0EA5D6]/30 text-[#0EA5D6] text-[11px] font-black flex items-center gap-2.5">
                          <span>{t('distanceLabel')}: {showPath ? liveDistanceMeters : distanceMeters}{language === 'ar' ? ' م' : 'm'}</span>
                          <span className="w-1 h-1 rounded-full bg-[#0EA5D6]/50" />
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
                                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                                  : 'bg-black/50 border-white/15 text-white'
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

                      {/* Bottom: start navigation button */}
                      <div className="p-4 pointer-events-auto">
                        {!hasArrived && (
                          !showPath ? (
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
                            <div className="flex items-center justify-center gap-2 py-2.5">
                              <motion.span
                                className="inline-block w-2 h-2 rounded-full bg-emerald-400"
                                animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                                transition={{ duration: 1.2, repeat: Infinity }}
                              />
                              <span className="text-emerald-400 text-[10px] font-black tracking-widest uppercase">
                                {language === 'ar' ? 'جاري الملاحة…' : 'Navigating…'}
                              </span>
                            </div>
                          )
                        )}
                        {hasArrived && (
                          <div className="w-full py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
                            ✓ {language === 'ar' ? 'وصلت!' : 'Arrived!'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* No facility selected in 3D mode */}
                  {!targetFacility && (
                    <div className="flex-1 flex items-end justify-center pb-8 pointer-events-none">
                      <div className="px-5 py-3 rounded-2xl bg-black/50 backdrop-blur-xl border border-white/15 text-white/70 text-xs font-black text-center">
                        {language === 'ar' ? 'اختر مرفقاً من القائمة لبدء التوجيه' : 'Select a facility from the list to start guidance'}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

            ) : (
              /* ════ Flat (2D) view ════ */
              <motion.div
                key="flat-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative w-full h-full min-h-[650px] overflow-hidden"
                style={{ background: '#F8FAFC' }}
              >
                {/* 2D/3D toggle */}
                <MapToggle />

                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 600 520"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    <pattern id="fmGridF" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                    </pattern>
                    <filter id="facilityGlowF">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <filter id="fCardShadowF" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#94a3b8" floodOpacity="0.18"/>
                    </filter>
                    <pattern id="fStripA" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(90)">
                      <line x1="0" y1="0" x2="0" y2="12" stroke="#93C5FD" strokeWidth="1.5" strokeOpacity="0.22"/>
                    </pattern>
                    <pattern id="fStripB" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(90)">
                      <line x1="0" y1="0" x2="0" y2="12" stroke="#FDBA74" strokeWidth="1.5" strokeOpacity="0.22"/>
                    </pattern>
                    <pattern id="fStripC" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(90)">
                      <line x1="0" y1="0" x2="0" y2="12" stroke="#C4B5FD" strokeWidth="1.5" strokeOpacity="0.22"/>
                    </pattern>
                    <pattern id="fStripD" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(90)">
                      <line x1="0" y1="0" x2="0" y2="12" stroke="#86EFAC" strokeWidth="1.5" strokeOpacity="0.22"/>
                    </pattern>
                    <linearGradient id="fNavPath" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#D97706" stopOpacity="0.4"/>
                      <stop offset="100%" stopColor="#D97706" stopOpacity="1"/>
                    </linearGradient>
                  </defs>

                  <rect x="0" y="0" width="600" height="520" fill="url(#fmGridF)" />
                  <rect x="18" y="18" width="564" height="464" rx="20" fill="white" stroke="#E2E8F0" strokeWidth="1.5"/>

                  {/* Zone A — upper-left (blue) */}
                  <rect x="28" y="28" width="217" height="192" rx="12" fill="#DBEAFE" fillOpacity="0.45"/>
                  <rect x="28" y="28" width="217" height="192" rx="12" fill="url(#fStripA)"/>
                  <rect x="28" y="28" width="217" height="192" rx="12" fill="none" stroke="#93C5FD" strokeWidth="1"/>
                  <text x="136" y="104" textAnchor="middle" fontSize="8" fontWeight="700" fill="#1D4ED8" fontFamily="'IBM Plex Mono',monospace">A · NATURAL SCIENCES</text>
                  <text x="136" y="115" textAnchor="middle" fontSize="6" fontWeight="600" fill="#60A5FA" fontFamily="sans-serif">العلوم الطبيعية</text>

                  {/* Zone B — upper-right (orange) */}
                  <rect x="355" y="28" width="217" height="192" rx="12" fill="#FED7AA" fillOpacity="0.45"/>
                  <rect x="355" y="28" width="217" height="192" rx="12" fill="url(#fStripB)"/>
                  <rect x="355" y="28" width="217" height="192" rx="12" fill="none" stroke="#FDBA74" strokeWidth="1"/>
                  <text x="463" y="104" textAnchor="middle" fontSize="8" fontWeight="700" fill="#C2410C" fontFamily="'IBM Plex Mono',monospace">B · ENGINEERING</text>
                  <text x="463" y="115" textAnchor="middle" fontSize="6" fontWeight="600" fill="#FB923C" fontFamily="sans-serif">الهندسة والتقنية</text>

                  {/* Zone C — lower-left (purple) */}
                  <rect x="28" y="300" width="217" height="172" rx="12" fill="#EDE9FE" fillOpacity="0.45"/>
                  <rect x="28" y="300" width="217" height="172" rx="12" fill="url(#fStripC)"/>
                  <rect x="28" y="300" width="217" height="172" rx="12" fill="none" stroke="#C4B5FD" strokeWidth="1"/>
                  <text x="136" y="378" textAnchor="middle" fontSize="8" fontWeight="700" fill="#6D28D9" fontFamily="'IBM Plex Mono',monospace">C · ARTS &amp; CRAFTS</text>
                  <text x="136" y="389" textAnchor="middle" fontSize="6" fontWeight="600" fill="#A78BFA" fontFamily="sans-serif">الفنون والعلوم الإنسانية</text>

                  {/* Zone D — lower-right (green) */}
                  <rect x="355" y="300" width="217" height="172" rx="12" fill="#DCFCE7" fillOpacity="0.45"/>
                  <rect x="355" y="300" width="217" height="172" rx="12" fill="url(#fStripD)"/>
                  <rect x="355" y="300" width="217" height="172" rx="12" fill="none" stroke="#86EFAC" strokeWidth="1"/>
                  <text x="463" y="378" textAnchor="middle" fontSize="8" fontWeight="700" fill="#15803D" fontFamily="'IBM Plex Mono',monospace">D · HUMANITIES</text>
                  <text x="463" y="389" textAnchor="middle" fontSize="6" fontWeight="600" fill="#4ADE80" fontFamily="sans-serif">العلوم الإنسانية</text>

                  {/* Center aisles */}
                  <rect x="255" y="28" width="90" height="464" fill="#F1F5F9" rx="3"/>
                  <rect x="28" y="228" width="217" height="64" fill="#F1F5F9" rx="3"/>
                  <rect x="355" y="228" width="217" height="64" fill="#F1F5F9" rx="3"/>
                  <line x1="300" y1="28" x2="300" y2="492" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="5 5"/>
                  <line x1="28" y1="260" x2="245" y2="260" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="5 5"/>
                  <line x1="355" y1="260" x2="572" y2="260" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="5 5"/>

                  {/* Entrance */}
                  <rect x="248" y="478" width="104" height="22" rx="8" fill="#1E293B"/>
                  <text x="300" y="488" textAnchor="middle" fontSize="7" fontWeight="800" fill="white" fontFamily="'IBM Plex Mono',monospace">🚪 ENTRANCE</text>
                  <text x="300" y="497" textAnchor="middle" fontSize="5.5" fill="#94A3B8" fontFamily="sans-serif">المدخل</text>
                  <line x1="300" y1="478" x2="300" y2="464" stroke="#334155" strokeWidth="1.5"/>

                  {/* Nav path + arrows — pure native SVG so nothing conflicts */}
                  {manualTarget && navPaths[manualTarget.id] && (() => {
                    const d = navPaths[manualTarget.id];
                    // Destination endpoint coords derived from navPaths
                    const destPt: Record<string, [number, number]> = {
                      'A-2': [136, 125], 'B-2': [463, 125],
                      'C-1': [136, 385], 'D-1': [463, 385],
                    };
                    const [ex, ey] = destPt[manualTarget.id] ?? [300, 250];
                    return (
                      <g key={manualTarget.id}>
                        {/* Wide glow halo */}
                        <path d={d} stroke="#D97706" strokeWidth="22" fill="none" strokeLinecap="round" opacity="0.08"/>
                        {/* Main solid path — draws in via SMIL */}
                        <path
                          d={d}
                          stroke="url(#fNavPath)"
                          strokeWidth="4"
                          fill="none"
                          strokeLinecap="round"
                          filter="url(#facilityGlowF)"
                          strokeDasharray="900"
                          strokeDashoffset="900"
                          opacity="0.95"
                        >
                          <animate attributeName="stroke-dashoffset" from="900" to="0" dur="1.1s" fill="freeze"/>
                        </path>
                        {/* Flowing amber arrow chevrons */}
                        {[0, 1, 2].map(i => (
                          <polygon key={i} points="-7,-9 10,0 -7,9" fill="#D97706" filter="url(#facilityGlowF)">
                            <animateMotion dur="1.6s" begin={`${i * 0.53}s`} repeatCount="indefinite" rotate="auto" path={d}/>
                          </polygon>
                        ))}
                        {/* Destination pulsing ring */}
                        <circle cx={ex} cy={ey} r="12" fill="#D97706" stroke="white" strokeWidth="3"/>
                        <circle cx={ex} cy={ey} r="12" fill="none" stroke="#D97706" strokeWidth="2" opacity="0.7">
                          <animate attributeName="r" values="12;30;12" dur="1.8s" repeatCount="indefinite"/>
                          <animate attributeName="opacity" values="0.7;0;0.7" dur="1.8s" repeatCount="indefinite"/>
                        </circle>
                      </g>
                    );
                  })()}
                </svg>

                {/* Facility markers (HTML overlay) */}
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
                        'absolute flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-300 shadow-lg cursor-pointer z-10 w-28',
                        isSelected
                          ? 'bg-amber-500 border-amber-400/60 shadow-[0_8px_30px_rgba(217,179,16,0.4)] scale-110'
                          : 'bg-white border-slate-200 hover:border-primary/40 hover:scale-105 shadow-md'
                      )}
                    >
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-colors', isSelected ? 'bg-black/15 text-primary' : 'bg-primary/10 text-primary')}>
                        <f.icon className="w-5 h-5" />
                      </div>
                      <span className={cn('text-[9px] font-black text-center leading-tight', isSelected ? 'text-primary' : 'text-primary dark:text-white')}>
                        {f.name}
                      </span>
                      <span className={cn('text-[8px] font-bold px-2 py-0.5 rounded-full',
                        f.status === 'available' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-700'
                      )}>
                        {f.status === 'available' ? t('facilityAvailable') : t('facilityBusy')}
                      </span>
                    </button>
                  );
                })}

                {/* Switch to 3D nudge */}
                {manualTarget && (
                  <button
                    onClick={() => setMapMode('3d')}
                    className={cn(
                      'absolute bottom-6 z-10 flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-white text-xs font-black shadow-xl hover:brightness-110 transition-all active:scale-95',
                      dir === 'rtl' ? 'right-6' : 'left-6'
                    )}
                  >
                    <Box className="w-4 h-4" />
                    {language === 'ar' ? 'عرض الخريطة 3D' : 'View 3D Map'}
                  </button>
                )}

                <div className={cn('absolute bottom-6 opacity-8 text-primary pointer-events-none', dir === 'rtl' ? 'left-6' : 'right-6')}>
                  <Compass className="w-14 h-14 opacity-[0.06]" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right sidebar ── */}
        <div className="w-full xl:w-[450px] flex flex-col gap-8">
          <AnimatePresence mode="wait">
            {manualTarget && targetFacility ? (
              /* Facility selected: navigation panel */
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
                    <span className={cn(
                      'inline-block text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider',
                      targetFacility.status === 'available'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                    )}>
                      {targetFacility.status === 'available' ? t('facilityAvailable') : t('facilityBusy')}
                    </span>
                  </div>

                  {/* Distance + ETA chips */}
                  <div className={cn('flex items-center justify-center gap-3', dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                    <div className="px-4 py-2 rounded-full bg-accent/10 dark:bg-accent/15 border border-accent/20 text-primary dark:text-accent text-[11px] font-black">
                      {showPath ? liveDistanceMeters : distanceMeters}{language === 'ar' ? ' م' : 'm'}
                    </div>
                    <span className="text-slate-300 dark:text-slate-700">·</span>
                    <div className="px-4 py-2 rounded-full bg-accent/10 dark:bg-accent/15 border border-accent/20 text-primary dark:text-accent text-[11px] font-black">
                      {showPath ? liveEtaMinutes : etaMinutes}{language === 'ar' ? ' د' : ' min'}
                    </div>
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

                  {/* Start navigation / in progress */}
                  {showPath ? (
                    <div className={cn(
                      'w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3',
                      hasArrived ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-500' : 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-500'
                    )}>
                      <span className={cn('w-2 h-2 rounded-full bg-emerald-500', !hasArrived && 'animate-pulse')} />
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

                  {/* View 3D / 2D map toggle buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setMapMode('3d')}
                      className={cn(
                        'py-3.5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95',
                        mapMode === '3d'
                          ? 'bg-primary text-white dark:bg-[#0EA5D6] dark:text-[#050c1a] shadow-lg'
                          : 'bg-slate-100 dark:bg-slate-800 text-primary dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-slate-700'
                      )}
                    >
                      <Box className="w-4 h-4" />
                      <span>3D</span>
                    </button>
                    <button
                      onClick={() => setMapMode('flat')}
                      className={cn(
                        'py-3.5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95',
                        mapMode === 'flat'
                          ? 'bg-primary text-white shadow-lg'
                          : 'bg-slate-100 dark:bg-slate-800 text-primary dark:text-white border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-slate-700'
                      )}
                    >
                      <MapIcon className="w-4 h-4" />
                      <span>2D</span>
                    </button>
                  </div>

                  <button
                    onClick={() => navigate('/ar')}
                    className="w-full py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-primary dark:text-white rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:border-accent/60 transition-all active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{language === 'ar' ? 'AR كاميرا' : 'AR Camera'}</span>
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
              /* No selection: facility search panel */
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
                    <Search className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none', dir === 'rtl' ? 'right-4' : 'left-4')} />
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
                        className={cn('absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors', dir === 'rtl' ? 'left-4' : 'right-4')}
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
                          <div className={cn('flex items-center gap-2 mt-1.5', dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                            <MapPin className="w-3 h-3 text-primary/40 dark:text-accent/60 shrink-0" />
                            <span className="text-[10px] font-bold text-primary/50 dark:text-accent/70 truncate">
                              {facility.location}
                            </span>
                            <span className={cn('shrink-0 text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider',
                              facility.status === 'available'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                            )}>
                              {facility.status === 'available' ? t('facilityAvailable') : t('facilityBusy')}
                            </span>
                          </div>
                        </div>
                        <Navigation className={cn('w-4 h-4 shrink-0 text-slate-200 dark:text-slate-700 group-hover:text-primary dark:group-hover:text-accent transition-colors', dir === 'rtl' ? 'rotate-180' : '')} />
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
