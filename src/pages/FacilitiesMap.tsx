import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Navigation, Compass, Camera, X, Users, VolumeX, Monitor, Printer, Search, Map as MapIcon, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../hooks/useLanguage';

interface ManualTarget { id: string }

export function FacilitiesMap() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language, dir } = useLanguage();

  const [manualTarget, setManualTarget] = useState<ManualTarget | null>(() => {
    if (location.state?.facilityCell) return { id: location.state.facilityCell };
    return null;
  });
  const [facilitySearch, setFacilitySearch] = useState('');

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

        {/* Back to book map */}
        <button
          onClick={() => navigate('/map')}
          className={cn(
            'flex items-center gap-3 px-6 py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-black text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white hover:border-primary/30 dark:hover:border-accent/30 transition-all',
            dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'
          )}
        >
          {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <MapIcon className="w-4 h-4" />
          <span>{language === 'ar' ? 'خريطة الكتب والأرفف' : 'Book & Shelf Map'}</span>
        </button>
      </div>

      {/* Main content */}
      <div
        className={cn(
          'flex flex-col xl:flex-row gap-10 flex-1 min-h-0',
          dir === 'rtl' ? 'xl:flex-row-reverse' : 'xl:flex-row'
        )}
      >
        {/* Floor Plan */}
        <div className="flex-1 official-card relative overflow-hidden min-h-[650px] p-0 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20">
          <motion.div
            className="relative w-full h-full min-h-[650px] overflow-hidden bg-slate-50/50 dark:bg-slate-900/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
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
                <linearGradient id="corridorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#f1f5f9" />
                </linearGradient>
                <filter id="facilityGlow">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Grid */}
              <rect x="0" y="0" width="600" height="520" fill="url(#floorGrid)" />

              {/* Building outline */}
              <rect x="18" y="18" width="564" height="464" rx="20" fill="white" stroke="#e2e8f0" strokeWidth="2.5" />

              {/* Main corridors */}
              <rect x="255" y="18" width="90" height="464" fill="#f8fafc" />
              <rect x="18" y="228" width="564" height="64" fill="#f8fafc" />

              {/* Corridor dashed centre lines */}
              <line x1="300" y1="18" x2="300" y2="482" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="6 4" />
              <line x1="18" y1="260" x2="582" y2="260" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="6 4" />

              {/* Section A — top left */}
              <rect x="28" y="28" width="217" height="192" rx="12" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5" />
              <text x="136" y="110" textAnchor="middle" fontSize="13" fontWeight="900" fill="#1e40af" opacity="0.6">A</text>
              <text x="136" y="128" textAnchor="middle" fontSize="9" fontWeight="700" fill="#93c5fd">NATURAL SCIENCES</text>
              {[55, 70, 85, 100, 115, 130].map((x, i) => (
                <line key={i} x1={x} y1="48" x2={x} y2="205" stroke="#bfdbfe" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
              ))}
              {[170, 185, 200, 215, 230].map((x, i) => (
                <line key={i} x1={x} y1="48" x2={x} y2="205" stroke="#bfdbfe" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
              ))}

              {/* Section B — top right */}
              <rect x="355" y="28" width="217" height="192" rx="12" fill="#fff7ed" stroke="#fed7aa" strokeWidth="1.5" />
              <text x="463" y="110" textAnchor="middle" fontSize="13" fontWeight="900" fill="#c2410c" opacity="0.6">B</text>
              <text x="463" y="128" textAnchor="middle" fontSize="9" fontWeight="700" fill="#fdba74">ENGINEERING &amp; TECH</text>
              {[380, 395, 410, 425, 440].map((x, i) => (
                <line key={i} x1={x} y1="48" x2={x} y2="205" stroke="#fed7aa" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
              ))}
              {[500, 515, 530, 545, 560].map((x, i) => (
                <line key={i} x1={x} y1="48" x2={x} y2="205" stroke="#fed7aa" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
              ))}

              {/* Section C — bottom left */}
              <rect x="28" y="300" width="217" height="172" rx="12" fill="#faf5ff" stroke="#d8b4fe" strokeWidth="1.5" />
              <text x="136" y="378" textAnchor="middle" fontSize="13" fontWeight="900" fill="#7e22ce" opacity="0.6">C</text>
              <text x="136" y="396" textAnchor="middle" fontSize="9" fontWeight="700" fill="#c4b5fd">ARTS &amp; CRAFTS</text>
              {[55, 70, 85, 100, 115, 130].map((x, i) => (
                <line key={i} x1={x} y1="320" x2={x} y2="460" stroke="#d8b4fe" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
              ))}
              {[170, 185, 200, 215, 230].map((x, i) => (
                <line key={i} x1={x} y1="320" x2={x} y2="460" stroke="#d8b4fe" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
              ))}

              {/* Section D — bottom right */}
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
              <text x="300" y="493" textAnchor="middle" fontSize="8" fontWeight="800" fill="white" letterSpacing="1">
                ENTRANCE
              </text>
              <line x1="300" y1="478" x2="300" y2="464" stroke="#004C6D" strokeWidth="2" />

              {/* Animated nav path to selected facility */}
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

            {/* HTML facility markers */}
            {FACILITIES.map(f => {
              const pos = markerPositions[f.cellId];
              if (!pos) return null;
              const isSelected = manualTarget?.id === f.cellId;
              return (
                <button
                  key={f.cellId}
                  onClick={() => setManualTarget(isSelected ? null : { id: f.cellId })}
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
                  <span
                    className={cn(
                      'text-[9px] font-black text-center leading-tight',
                      isSelected ? 'text-primary' : 'text-primary dark:text-white'
                    )}
                  >
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

            {/* Compass decoration */}
            <div
              className={cn(
                'absolute bottom-6 opacity-10 text-primary dark:text-white pointer-events-none',
                dir === 'rtl' ? 'left-6' : 'right-6'
              )}
            >
              <Compass className="w-16 h-16" />
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
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

                  {/* Launch AR camera */}
                  <button
                    onClick={() => navigate('/ar')}
                    className="w-full py-4 bg-primary text-white rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:brightness-110 shadow-sm transition-all active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{t('enterArMode')}</span>
                  </button>

                  <button
                    onClick={() => setManualTarget(null)}
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
                        onClick={() => setManualTarget({ id: facility.cellId })}
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
