import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Compass, X, Box, Users, VolumeX, Monitor, Printer, Search, Share2, Clock, Home, Languages } from 'lucide-react';
import { cn, trackMapVisit } from '../lib/utils';
import { ShareSheet } from '../components/ShareSheet';
import { facilitySharePayload } from '../lib/share';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../hooks/useLanguage';

const DARK_NAV_PATH_D = 'M 300,460 C 300,380 190,340 210,260 C 230,180 260,140 285,90';

const DISTANCE_BY_CELL: Record<string, number> = {
  'A-2': 38,
  'B-2': 52,
  'C-1': 64,
  'D-1': 75,
};

// Matches the facility anchors added to library-ar-floor.html's 3D scene
// (see the zones array / geometry groups keyed on these same x,z coords).
const FACILITY_3D_TARGETS: Record<string, { x: number; z: number; ar: string; en: string }> = {
  'A-2': { x: -21, z: 15, ar: 'مختبر الحاسوب', en: 'Computer Lab' },
  'B-2': { x: 22, z: 12, ar: 'غرف الدراسة الجماعية', en: 'Group Study Rooms' },
  'C-1': { x: 9, z: 4, ar: 'الطباعة والنسخ', en: 'Printing & Copying' },
  'D-1': { x: -10, z: 22, ar: 'منطقة القراءة الهادئة', en: 'Silent Reading Zone' },
};

export function FacilitiesMap() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language, dir, toggleLanguage } = useLanguage();

  useEffect(() => { trackMapVisit('facilities'); }, []);

  // The facility whose share dialog is open, if any.
  const [shareFacility, setShareFacility] = useState<{ name: string; desc: string; location: string; status: string } | null>(null);

  const [manualTarget, setManualTarget] = useState<{ id: string } | null>(() => {
    if (location.state?.facilityCell) return { id: location.state.facilityCell };
    return null;
  });
  const [facilitySearch, setFacilitySearch] = useState('');
  const [showPath, setShowPath] = useState(false);
  const [walkProgress, setWalkProgress] = useState(0);
  const arIframeRef = useRef<HTMLIFrameElement>(null);
  const mapPanelRef = useRef<HTMLDivElement>(null);

  // Draw the glowing wayfinding beam inside the 3D scene toward the
  // selected facility (the iframe's built-in guide only knew about shelf
  // codes; guideToPoint()/LIBRARY_GUIDE_TO_FACILITY were added to
  // library-ar-floor.html so facility destinations get the same beam).
  //
  // On a cold load the embedded Three.js scene can take several seconds to
  // finish building (window.__cmp isn't assigned until then), so a single
  // retry isn't enough — the postMessage silently drops if it arrives
  // before the iframe's listener is registered. Keep resending until the
  // iframe (same-origin, so directly inspectable) confirms it's actually
  // showing this exact target, or give up after ~12s.
  //
  // The beam waits for the walk to be started rather than appearing the moment
  // a facility is picked: picking one is choosing where to go, pressing the
  // button is setting off. Clearing on the way out matters as much as drawing
  // — the scene keeps whatever it was last told.
  useEffect(() => {
    if (!manualTarget || !showPath) {
      arIframeRef.current?.contentWindow?.postMessage({ type: 'LIBRARY_CLEAR_GUIDE' }, '*');
      return;
    }
    const target = FACILITY_3D_TARGETS[manualTarget.id];
    if (!target) return;
    const msg = {
      type: 'LIBRARY_GUIDE_TO_FACILITY',
      x: target.x,
      z: target.z,
      labelAr: target.ar,
      labelEn: target.en,
    };
    let attempts = 0;
    const MAX_ATTEMPTS = 30;
    const send = () => arIframeRef.current?.contentWindow?.postMessage(msg, '*');
    send();
    const interval = setInterval(() => {
      attempts += 1;
      const win = arIframeRef.current?.contentWindow as (Window & {
        __cmp?: { _guide?: { visible?: boolean }; _guideItem?: { labelEn?: string } };
      }) | undefined;
      const cmp = win?.__cmp;
      const showingThisTarget = !!cmp?._guide?.visible && cmp?._guideItem?.labelEn === target.en;
      if (showingThisTarget || attempts >= MAX_ATTEMPTS) {
        clearInterval(interval);
        return;
      }
      send();
    }, 400);
    return () => clearInterval(interval);
  }, [manualTarget, showPath]);

  // The scene writes its own header, in Arabic. Tell it which language the
  // interface is in — by message rather than by reloading the iframe, so
  // switching language mid-route does not rebuild the scene and lose the beam.
  useEffect(() => {
    const send = () => arIframeRef.current?.contentWindow
      ?.postMessage({ type: 'LIBRARY_SET_LANG', lang: language }, '*');
    send();
    const t = setInterval(send, 600);
    const stop = setTimeout(() => clearInterval(t), 6000);
    return () => { clearInterval(t); clearTimeout(stop); };
  }, [language]);

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
  const liveEtaSeconds = Math.max(0, Math.round(totalWalkSeconds * (1 - walkProgress)));
  const hasArrived = showPath && walkProgress >= 1;

  // Clock time of arrival, counting down live with the walk. "3 min" tells you
  // how long; this tells you when — the thing you actually compare against the
  // lecture you are heading to. ar-EG, not ar-SA, for the same reason as the
  // dates elsewhere.
  const arrivalClock = new Date(Date.now() + liveEtaSeconds * 1000)
    .toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

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
        'h-full flex flex-col gap-3 roomy:gap-8 animate-in duration-500 font-sans',
        dir === 'rtl' ? 'slide-in-from-left-4 text-right' : 'slide-in-from-right-4 text-left'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'flex flex-row items-center justify-between gap-3 roomy:gap-8 pb-3 roomy:pb-8 border-b border-slate-200 dark:border-white/10',
          dir === 'rtl' ? 'md:flex-row-reverse' : 'md:flex-row'
        )}
      >
        <div className={cn('min-w-0', dir === 'rtl' ? 'text-right' : 'text-left')}>
          <div className={cn('hidden roomy:flex items-center gap-3 mb-4', dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
            <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center text-accent">
              <Compass className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">
              {language === 'ar' ? 'نظام الملاحة الداخلية' : 'INDOOR NAVIGATION'}
            </span>
          </div>
          <h1 className="text-lg roomy:text-4xl font-black text-primary dark:text-white tracking-tight truncate roomy:whitespace-normal">
            {t('libraryFacilities')}
          </h1>
          <p className="hidden roomy:block text-slate-400 dark:text-slate-500 font-bold mt-2 leading-relaxed">
            {language === 'ar'
              ? 'اعثر على قاعات الدراسة، مختبرات الحاسوب، الطابعات والمرافق الأخرى'
              : 'Find study rooms, computer labs, printers, and other facilities'}
          </p>
        </div>

        {/* Both bars are hidden on this page so the map can have the screen.
            These are the two controls that went with them. */}
        <div className="roomy:hidden shrink-0 flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            aria-label={language === 'ar' ? 'English' : 'عربي'}
            title={language === 'ar' ? 'English' : 'عربي'}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-primary dark:text-white shadow-sm active:scale-95 transition-all"
          >
            <Languages className="w-4.5 h-4.5 text-accent" />
          </button>
          <button
            onClick={() => navigate('/')}
            aria-label={t('backToHome')}
            title={t('backToHome')}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-primary dark:text-white shadow-sm active:scale-95 transition-all"
          >
            <Home className="w-4.5 h-4.5" />
          </button>
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
        <div
          ref={mapPanelRef}
          className={cn(
            "flex-none roomy:flex-1 official-card relative overflow-hidden -mx-8 roomy:mx-0 rounded-none roomy:rounded-2xl h-[calc(100dvh-5.5rem)] roomy:h-[calc(100dvh-12rem)] min-h-0 roomy:min-h-[650px] p-0 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20",
            // On a phone the map fills the screen, so opening on it buries the
            // list a whole screenful down. Land on the list instead and bring
            // the map up when there is somewhere to go. A desktop shows both.
            !manualTarget && "hidden roomy:block"
          )}
        >
          <AnimatePresence mode="wait">

            {/* ════ 3D view — library-ar-floor iframe ════ */}
            {/* ════ The floor plan — the only view ════ */}
              <motion.div
                key="3d-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative w-full h-full min-h-0 roomy:min-h-[650px] flex flex-col"
              >
                <iframe
                  ref={arIframeRef}
                  src={`/library-ar-floor.html?chrome=off&lang=${language}`}
                  title="3D Library Floor"
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; gyroscope"
                />

                {/* HUD overlay */}
                <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">

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
                        <div className="px-4 py-1.5 rounded-full bg-[#0EA5D6]/20 backdrop-blur-xl border border-[#0EA5D6]/30 text-[#0EA5D6] text-[11px] font-black flex items-center gap-2.5 flex-wrap justify-center">
                          <span>{t('distanceLabel')}: {showPath ? liveDistanceMeters : distanceMeters}{language === 'ar' ? ' م' : 'm'}</span>
                          <span className="w-1 h-1 rounded-full bg-[#0EA5D6]/50" />
                          <span>{t('etaLabel')}: {showPath ? liveEtaMinutes : etaMinutes}{language === 'ar' ? ' د' : ' min'}</span>
                          <span className="w-1 h-1 rounded-full bg-[#0EA5D6]/50" />
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {language === 'ar' ? 'الوصول' : 'Arrive'} <span dir="ltr">{arrivalClock}</span>
                          </span>
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
                      'inline-block text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider',
                      targetFacility.status === 'available'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                    )}>
                      {targetFacility.status === 'available' ? t('facilityAvailable') : t('facilityBusy')}
                    </span>

                    {/* Telling a classmate where to meet is the most ordinary
                        thing to do with a facility, so the share sits with the
                        facility's own details rather than in a page toolbar. */}
                    <div className="flex justify-center pt-1">
                      <button
                        onClick={() => setShareFacility(targetFacility)}
                        className="min-h-11 flex items-center gap-2 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-primary dark:text-white text-[11px] font-black hover:bg-secondary/10 hover:text-secondary active:scale-95 transition-all"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        {t('shareFacility')}
                      </button>
                    </div>
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

                  {/* Navigation is started from the button on the map itself;
                      this only reports how it is going. */}
                  {showPath && (
                    <div className={cn(
                      'w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3',
                      hasArrived ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-500' : 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-500'
                    )}>
                      <span className={cn('w-2 h-2 rounded-full bg-emerald-500', !hasArrived && 'animate-pulse')} />
                      {hasArrived ? t('reachedDestination') : t('navigationInProgressLabel')}
                    </div>
                  )}

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
                        // text-base below sm: iOS zooms the whole page in when a
                        // focused field is under 16px, and this one was 14px.
                        'w-full py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-base sm:text-sm font-bold text-primary dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary dark:focus:border-accent transition-colors',
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
                        onClick={() => {
                          setManualTarget({ id: facility.cellId });
                          setShowPath(false);
                          requestAnimationFrame(() =>
                            mapPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
                        }}
                        className={cn(
                          'w-full flex flex-col gap-3 px-5 py-5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group',
                          dir === 'rtl' ? 'text-right' : 'text-left'
                        )}
                      >
                        <div className={cn('w-full flex items-center gap-4', dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-primary/10 dark:bg-accent/10 flex items-center justify-center text-primary dark:text-accent group-hover:bg-primary/20 dark:group-hover:bg-accent/20 transition-colors">
                          <facility.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-primary dark:text-white leading-tight group-hover:text-primary dark:group-hover:text-accent transition-colors">
                            {facility.name}
                          </p>
                          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 leading-snug">
                            {facility.desc}
                          </p>
                          <div className={cn('flex items-center gap-2 mt-1.5', dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                            <MapPin className="w-3 h-3 text-primary/40 dark:text-accent/60 shrink-0" />
                            <span className="text-[10px] font-bold text-primary/50 dark:text-accent/70">
                              {facility.location}
                            </span>
                            <span className={cn('shrink-0 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider',
                              facility.status === 'available'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'
                                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                            )}>
                              {facility.status === 'available' ? t('facilityAvailable') : t('facilityBusy')}
                            </span>
                          </div>
                        </div>
                        </div>
                        {/* Named, not a bare arrow: on a phone there is no hover
                            to reveal what the row does, and the map opens from
                            here. On its own line so it cannot squeeze the name. */}
                        <span className={cn(
                          'flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-primary/10 dark:bg-accent/15 text-primary dark:text-accent text-[10px] font-black uppercase tracking-wider group-hover:bg-primary group-hover:text-white dark:group-hover:bg-accent dark:group-hover:text-primary transition-colors',
                          dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'
                        )}>
                          <Navigation className={cn('w-3.5 h-3.5 shrink-0', dir === 'rtl' ? 'rotate-180' : '')} />
                          {t('locate')}
                        </span>
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

      {shareFacility && (
        <ShareSheet
          open
          onClose={() => setShareFacility(null)}
          title={shareFacility.name}
          payload={facilitySharePayload(shareFacility, language)}
        />
      )}
    </div>
  );
}
