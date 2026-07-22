import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Compass, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { Book } from '../types';
import { SHELF_MARKERS } from '../lib/arMarkers';
import { MOCK_BOOKS } from '../data/mockData';
import { cn } from '../lib/utils';

const SHELF_IDS = Object.keys(SHELF_MARKERS);
const SHELF_COUNT = SHELF_IDS.length;
const FOV = 70; // horizontal field of view in degrees

// Each shelf gets an angle derived from its barcode value so that they
// spread evenly around 360° and the distribution is deterministic.
function shelfAngle(id: string): number {
  const val = SHELF_MARKERS[id];
  return val !== undefined ? Math.round((val / SHELF_COUNT) * 360) : 0;
}

// Group books by shelf for the label previews.
const BOOKS_BY_SHELF = MOCK_BOOKS.reduce<Record<string, Book[]>>((acc, b) => {
  if (b.shelf) {
    if (!acc[b.shelf]) acc[b.shelf] = [];
    acc[b.shelf].push(b);
  }
  return acc;
}, {});

const COMPASS_POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

export function CompassAR() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, dir } = useLanguage();

  const targetBook = (location.state as { book?: Book } | null)?.book ?? null;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [heading, setHeading] = useState(0);
  const [orientPerm, setOrientPerm] = useState<'pending' | 'granted' | 'denied'>('pending');

  // Start rear camera
  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then((s) => {
        stream = s;
        const vid = videoRef.current;
        if (vid) {
          vid.srcObject = s;
          vid.play().catch(() => {});
        }
      })
      .catch((e: Error) => setCameraError(e.message || 'Camera access denied'));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  // Detect if permission dialog is needed (iOS 13+) or just grant straight away.
  useEffect(() => {
    const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof DOE.requestPermission === 'function') {
      // iOS: need explicit user gesture to request
      setOrientPerm('pending');
    } else {
      setOrientPerm('granted');
    }
  }, []);

  const requestOrientPermission = async () => {
    const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof DOE.requestPermission === 'function') {
      try {
        const result = await DOE.requestPermission();
        setOrientPerm(result === 'granted' ? 'granted' : 'denied');
      } catch {
        setOrientPerm('denied');
      }
    } else {
      setOrientPerm('granted');
    }
  };

  // Listen for compass heading
  useEffect(() => {
    if (orientPerm !== 'granted') return;
    const handle = (e: DeviceOrientationEvent) => {
      // webkitCompassHeading (iOS) is the magnetic heading directly.
      // On Android, alpha is the rotation around Z axis — 360 - alpha gives heading.
      const h =
        (e as DeviceOrientationEvent & { webkitCompassHeading?: number }).webkitCompassHeading ??
        (360 - (e.alpha ?? 0));
      setHeading(h);
    };
    window.addEventListener('deviceorientation', handle, true);
    return () => window.removeEventListener('deviceorientation', handle, true);
  }, [orientPerm]);

  // Compute screen-space positions for every shelf label
  const labels = useMemo(() => {
    return SHELF_IDS.map((id) => {
      const angle = shelfAngle(id);
      // Angular offset from heading: negative = left of center, positive = right
      const offset = ((angle - heading + 540) % 360) - 180;
      const xPct = 50 + (offset / (FOV / 2)) * 50;
      // Fade out toward the edge of the visible cone
      const opacity = Math.max(0, 1 - Math.max(0, Math.abs(offset) - FOV * 0.3) / (FOV * 0.25));
      const inView = Math.abs(offset) <= FOV / 2 + 8;
      const isTarget = id === targetBook?.shelf;
      const preview = (BOOKS_BY_SHELF[id] ?? []).slice(0, 2);
      return { id, angle, offset, xPct, opacity, inView, isTarget, preview };
    });
  }, [heading, targetBook?.shelf]);

  // Current cardinal direction label
  const cardinalLabel = useMemo(() => {
    return COMPASS_POINTS[Math.round(heading / 45) % 8];
  }, [heading]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden font-sans" dir={dir}>

      {/* Camera video background */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
        style={{ opacity: cameraError ? 0 : 1, zIndex: 0 }}
      />

      {/* Subtle dark vignette so labels are readable over any background */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, background: 'radial-gradient(ellipse 120% 120% at 50% 50%, transparent 40%, rgba(0,0,0,0.45) 100%)' }} />

      {/* Horizon reference line at 55% height */}
      <div className="absolute inset-x-0 pointer-events-none" style={{ top: '55%', zIndex: 2 }}>
        <div className="w-full h-px" style={{ background: 'rgba(255,255,255,0.12)' }} />
      </div>

      {/* Camera error */}
      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-10 z-10 gap-4">
          <AlertTriangle className="w-12 h-12 text-accent" />
          <p className="text-white font-black text-sm">{cameraError}</p>
          <p className="text-white/50 text-xs font-bold">
            {language === 'ar' ? 'يُمكنك استخدام البوصلة بدون كاميرا' : 'Compass still works without camera'}
          </p>
        </div>
      )}

      {/* iOS orientation permission gate */}
      <AnimatePresence>
        {orientPerm === 'pending' && (
          <motion.div
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/65 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-black/85 border border-white/20 rounded-3xl p-8 max-w-xs mx-6 text-center">
              <Compass className="w-14 h-14 text-accent mx-auto mb-4" />
              <h3 className="text-white font-black text-lg mb-2">
                {language === 'ar' ? 'صلاحية الاتجاه' : 'Orientation Access'}
              </h3>
              <p className="text-white/60 text-sm font-bold leading-relaxed mb-6">
                {language === 'ar'
                  ? 'نحتاج إذن الجهاز لعرض لافتات الرفوف في الاتجاه الصحيح'
                  : 'We need device orientation to show shelf labels in the correct direction'}
              </p>
              <button
                onClick={requestOrientPermission}
                className="w-full py-3 bg-accent text-primary font-black rounded-2xl text-sm uppercase tracking-wider"
              >
                {language === 'ar' ? 'السماح' : 'Allow'}
              </button>
              <button
                onClick={() => setOrientPerm('granted')}
                className="w-full py-2 mt-2 text-white/40 font-bold text-xs"
              >
                {language === 'ar' ? 'تخطّ (وضع ثابت)' : 'Skip (static view)'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orientation denied notice */}
      {orientPerm === 'denied' && (
        <div className="absolute top-24 inset-x-4 z-20 bg-red-900/60 border border-red-500/40 backdrop-blur-xl rounded-2xl p-4 text-center pointer-events-none">
          <p className="text-red-300 text-[11px] font-black">
            {language === 'ar'
              ? 'تم رفض إذن البوصلة — يعمل في وضع العرض الثابت'
              : 'Compass permission denied — showing static layout'}
          </p>
        </div>
      )}

      {/* ── Shelf AR labels ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 5 }}>
        {labels.filter((s) => s.inView).map((shelf) => (
          <motion.div
            key={shelf.id}
            className="absolute flex flex-col items-center"
            style={{
              left: `${shelf.xPct}%`,
              top: '14%',
              height: '41%',
              transform: 'translateX(-50%)',
              opacity: shelf.opacity,
            }}
            animate={{ opacity: shelf.opacity }}
            transition={{ duration: 0.08 }}
          >
            {/* Info card */}
            <div
              className={cn(
                'rounded-xl px-3 py-2 border backdrop-blur-xl shadow-xl text-center shrink-0',
                shelf.isTarget
                  ? 'bg-accent/25 border-accent/70'
                  : 'bg-black/55 border-white/20'
              )}
              style={shelf.isTarget ? { boxShadow: '0 0 18px rgba(212,175,55,0.45)' } : {}}
            >
              <div className={cn('text-[7px] font-black uppercase tracking-widest mb-0.5', shelf.isTarget ? 'text-accent' : 'text-white/50')}>
                {shelf.isTarget
                  ? (language === 'ar' ? '★ الهدف' : '★ TARGET')
                  : (language === 'ar' ? 'رف' : 'SHELF')}
              </div>
              <div className={cn('font-black text-sm leading-none', shelf.isTarget ? 'text-accent' : 'text-white')}>
                {shelf.id}
              </div>
              {shelf.isTarget && targetBook && (
                <div className="text-white/80 text-[8px] font-bold mt-1 max-w-[90px] line-clamp-2 leading-snug">
                  {language === 'ar' ? targetBook.title : (targetBook.titleEn ?? targetBook.title)}
                </div>
              )}
              {!shelf.isTarget && shelf.preview.length > 0 && (
                <div className="text-white/40 text-[7px] font-bold mt-0.5 max-w-[80px] line-clamp-1">
                  {language === 'ar' ? shelf.preview[0].title : (shelf.preview[0].titleEn ?? shelf.preview[0].title)}
                </div>
              )}
            </div>

            {/* Vertical line from card to horizon */}
            <div
              className="flex-1 w-px mt-1"
              style={{
                background: shelf.isTarget
                  ? 'linear-gradient(to bottom, rgba(212,175,55,0.7), rgba(212,175,55,0.05))'
                  : 'linear-gradient(to bottom, rgba(255,255,255,0.35), rgba(255,255,255,0.03))',
              }}
            />

            {/* Floor dot */}
            <div
              className={cn('w-2 h-2 rounded-full shrink-0', shelf.isTarget ? 'bg-accent' : 'bg-white/40')}
              style={shelf.isTarget ? { boxShadow: '0 0 8px rgba(212,175,55,0.9)' } : {}}
            />
          </motion.div>
        ))}
      </div>

      {/* ── Top compass bar ── */}
      <div className="absolute top-0 inset-x-0 z-20 pointer-events-none">
        <div
          className="border-b border-white/10 px-5"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(20px)', paddingTop: 'env(safe-area-inset-top, 40px)', paddingBottom: '12px' }}
        >
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-accent" style={{ animation: 'spin 8s linear infinite reverse' }} />
              <div>
                <div className="text-[8px] font-black text-white/35 uppercase tracking-widest">
                  {language === 'ar' ? 'البوصلة AR' : 'COMPASS AR'}
                </div>
                <div className="text-white font-black text-sm leading-none">
                  {cardinalLabel} · {Math.round(heading)}°
                </div>
              </div>
            </div>
            {targetBook && (
              <div className={dir === 'rtl' ? 'text-left' : 'text-right'}>
                <div className="text-[7px] font-black text-accent uppercase tracking-widest">
                  {language === 'ar' ? 'الهدف' : 'TARGET'}
                </div>
                <div className="text-white font-black text-xs">{targetBook.shelf}</div>
              </div>
            )}
          </div>

          {/* Scrolling compass tick strip */}
          <div className="relative h-6 overflow-hidden">
            <div className="absolute inset-0 flex items-center">
              {/* Render compass points with virtual positions */}
              {COMPASS_POINTS.map((pt, i) => {
                const angle = i * 45;
                const offset = ((angle - heading + 540) % 360) - 180;
                if (Math.abs(offset) > 100) return null;
                const xPct = 50 + (offset / 90) * 50;
                return (
                  <div
                    key={`${pt}-${i}`}
                    className="absolute flex flex-col items-center gap-0.5"
                    style={{ left: `${xPct}%`, transform: 'translateX(-50%)' }}
                  >
                    <span className={cn('text-[9px] font-black leading-none', pt === cardinalLabel ? 'text-accent' : 'text-white/50')}>
                      {pt}
                    </span>
                    <div className={cn('w-px', pt.length === 1 ? 'h-2 bg-white/50' : 'h-1.5 bg-white/25')} />
                  </div>
                );
              })}
            </div>
            {/* Center aim line */}
            <div className="absolute left-1/2 top-0 w-px h-full -translate-x-1/2" style={{ background: 'rgba(212,175,55,0.7)' }} />
          </div>
        </div>
      </div>

      {/* ── Bottom target panel ── */}
      {targetBook && (
        <div className="absolute bottom-0 inset-x-0 z-20" style={{ paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}>
          <div className="mx-4 mb-4 flex items-center gap-4 px-5 py-4 rounded-3xl border border-white/15"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(24px)' }}>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-accent/40"
              style={{ background: 'rgba(212,175,55,0.15)' }}>
              <Compass className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[8px] font-black text-accent uppercase tracking-widest mb-0.5">
                {language === 'ar' ? 'وجّه الكاميرا نحو' : 'POINT CAMERA TOWARD'}
              </div>
              <div className="text-white font-black text-sm truncate">
                {language === 'ar' ? targetBook.title : (targetBook.titleEn ?? targetBook.title)}
              </div>
              <div className="text-white/50 text-[10px] font-bold">
                {language === 'ar' ? `رف: ${targetBook.shelf}` : `Shelf: ${targetBook.shelf}`}
                {' · '}
                {shelfAngle(targetBook.shelf ?? '')}°
              </div>
            </div>
            <div className="text-accent font-black text-xl shrink-0">{targetBook.shelf}</div>
          </div>
        </div>
      )}

      {/* Close button */}
      <button
        onClick={() => navigate(-1)}
        className={cn(
          'absolute z-30 p-3.5 border border-white/20 backdrop-blur-xl rounded-2xl text-white transition-all active:scale-90',
          dir === 'rtl' ? 'left-4' : 'right-4'
        )}
        style={{ top: 'max(8px, env(safe-area-inset-top, 8px))', marginTop: '8px', background: 'rgba(0,0,0,0.4)' }}
      >
        <X className="w-5 h-5" />
      </button>

    </div>
  );
}
