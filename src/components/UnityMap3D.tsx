import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookCover } from './BookCover';
import { cn } from '../lib/utils';
import type { Book } from '../types';

interface UnityMap3DProps {
  destinationShelfId: string | null;
  onSelectShelf: (id: string) => void;
  language: 'ar' | 'en';
  dir?: 'ltr' | 'rtl';
  bookData?: Book | null;
  distanceMeters?: number;
  etaMinutes?: number;
  navigationSteps?: string[];
}

// Shelf grid: 4 columns × 3 rows = 12 shelf blocks (all sections A–E)
const SHELF_BLOCKS = [
  { id: 'A-1', label: 'A-1', icon: '🔭', col: 0, row: 0 },
  { id: 'A-2', label: 'A-2', icon: '🔭', col: 1, row: 0 },
  { id: 'B-1', label: 'B-1', icon: '⚙️', col: 2, row: 0 },
  { id: 'B-2', label: 'B-2', icon: '⚙️', col: 3, row: 0 },
  { id: 'B-3', label: 'B-3', icon: '⚙️', col: 0, row: 1 },
  { id: 'B-4', label: 'B-4', icon: '⚙️', col: 1, row: 1 },
  { id: 'C-1', label: 'C-1', icon: '🧠', col: 2, row: 1 },
  { id: 'C-2', label: 'C-2', icon: '🧠', col: 3, row: 1 },
  { id: 'D-1', label: 'D-1', icon: '📚', col: 0, row: 2 },
  { id: 'D-2', label: 'D-2', icon: '📚', col: 1, row: 2 },
  { id: 'E-1', label: 'E-1', icon: '📊', col: 2, row: 2 },
  { id: 'E-2', label: 'E-2', icon: '📊', col: 3, row: 2 },
];

const CELL_W = 100;
const CELL_D = 62;
const BLOCK_H = 52;
const GAP_X   = 22;
const GAP_Z   = 28;
const AISLE_Z  = 36;

function iso(x: number, y: number, z: number) {
  return {
    sx: (x - z) * 0.866,
    sy: (x + z) * 0.5 - y,
  };
}

export function UnityMap3D({
  destinationShelfId,
  onSelectShelf,
  language,
  dir = 'ltr',
  bookData,
  distanceMeters = 0,
  etaMinutes = 0,
  navigationSteps = [],
}: UnityMap3DProps) {
  const VW = 680;
  const VH = 520;
  const ORIGIN_X = VW / 2;
  const ORIGIN_Y = VH - 60;

  const blocks = SHELF_BLOCKS.map((s) => {
    const wx = s.col * (CELL_W + GAP_X);
    const wz = s.row * (CELL_D + GAP_Z + AISLE_Z);
    const x0 = wx - (3.5 * (CELL_W + GAP_X)) / 2;
    const z0 = wz - ((CELL_D + GAP_Z + AISLE_Z)) / 2 - 20;

    const pts = {
      fl: iso(x0,          0, z0         ),
      fr: iso(x0 + CELL_W, 0, z0         ),
      br: iso(x0 + CELL_W, 0, z0 + CELL_D),
      bl: iso(x0,          0, z0 + CELL_D),
      tl: iso(x0,          BLOCK_H, z0         ),
      tr: iso(x0 + CELL_W, BLOCK_H, z0         ),
      trb: iso(x0 + CELL_W,BLOCK_H, z0 + CELL_D),
      tlb: iso(x0,          BLOCK_H, z0 + CELL_D),
      center: iso(x0 + CELL_W / 2, BLOCK_H + 8, z0 + CELL_D / 2),
    };
    return { ...s, pts, x0, z0 };
  });

  const dest = blocks.find(b => b.id === destinationShelfId);
  const entrance = iso(0, 0, 200);

  function pt(p: { sx: number; sy: number }) {
    return `${ORIGIN_X + p.sx},${ORIGIN_Y - p.sy}`;
  }
  function poly(pts: { sx: number; sy: number }[]) {
    return pts.map(pt).join(' ');
  }

  const hasDestination = !!destinationShelfId && !!dest;
  const isRtl = dir === 'rtl';

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">

      {/* ── Animated gold top bar ── */}
      <AnimatePresence>
        {hasDestination && (
          <motion.div
            key={destinationShelfId}
            initial={{ y: -56, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -56, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="absolute top-0 inset-x-0 z-30 h-14 flex items-center overflow-hidden"
            style={{ background: 'linear-gradient(90deg,#b8860b 0%,#D4AF37 40%,#ffe066 60%,#D4AF37 80%,#b8860b 100%)', backgroundSize: '200% 100%' }}
          >
            {/* shimmer sweep */}
            <motion.div
              className="absolute inset-0 opacity-40"
              style={{ background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.6) 50%,transparent 100%)', backgroundSize: '200% 100%' }}
              animate={{ backgroundPosition: ['200% 0%', '-200% 0%'] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
            />
            <div className={cn('relative z-10 flex items-center w-full px-4 gap-3', isRtl ? 'flex-row-reverse' : 'flex-row')}>
              <span className="text-[11px] font-black text-primary/80 uppercase tracking-widest">
                {language === 'ar' ? 'الوجهة' : 'Destination'}
              </span>
              <span className="text-base font-black text-primary tracking-wider">{destinationShelfId}</span>
              {bookData && (
                <span className="text-[11px] font-bold text-primary/70 truncate max-w-[160px]">{bookData.title}</span>
              )}
              <div className={cn('flex items-center gap-3 ml-auto text-[11px] font-black text-primary/80', isRtl && 'mr-auto ml-0 flex-row-reverse')}>
                <span>📍 {distanceMeters}{language === 'ar' ? ' م' : 'm'}</span>
                <span>⏱ {etaMinutes}{language === 'ar' ? ' د' : ' min'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3D isometric SVG map ── */}
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full flex-1"
        style={{ userSelect: 'none' }}
      >
        <defs>
          <pattern id="um3d-grid" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(-30) scale(1,0.577)">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(0,200,255,0.08)" strokeWidth="0.5" />
          </pattern>
          <filter id="um3d-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="um3d-glow-strong">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="um3d-floor" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#0a3a50" />
            <stop offset="100%" stopColor="#01202e" />
          </radialGradient>
          <linearGradient id="um3d-top" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1a6a8a" />
            <stop offset="100%" stopColor="#0d4a68" />
          </linearGradient>
          <linearGradient id="um3d-top-dest" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#9A7018" />
          </linearGradient>
          <linearGradient id="um3d-side-r" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0a4060" />
            <stop offset="100%" stopColor="#062030" />
          </linearGradient>
          <linearGradient id="um3d-side-f" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0d4a68" />
            <stop offset="100%" stopColor="#071e2a" />
          </linearGradient>
          <linearGradient id="um3d-path" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
        </defs>

        <rect width={VW} height={VH} fill="url(#um3d-floor)" />
        <rect width={VW} height={VH} fill="url(#um3d-grid)" />
        <ellipse cx={ORIGIN_X} cy={ORIGIN_Y - 10} rx={300} ry={30} fill="rgba(0,200,255,0.04)" />

        {blocks.map((b) => {
          const isDest = b.id === destinationShelfId;
          const topFill = isDest ? 'url(#um3d-top-dest)' : 'url(#um3d-top)';
          const sideRFill = isDest ? 'rgba(180,130,10,0.7)' : 'url(#um3d-side-r)';
          const sideFill  = isDest ? 'rgba(150,100,5,0.8)'  : 'url(#um3d-side-f)';
          const stroke    = isDest ? '#D4AF37' : 'rgba(0,180,220,0.25)';
          const sw        = isDest ? 1.5 : 0.5;

          return (
            <g key={b.id} onClick={() => onSelectShelf(b.id)} style={{ cursor: 'pointer' }}>
              {isDest && (
                <motion.ellipse
                  cx={ORIGIN_X + b.pts.center.sx}
                  cy={ORIGIN_Y - b.pts.center.sy + 20}
                  rx={50} ry={20}
                  fill="#D4AF37"
                  filter="url(#um3d-glow-strong)"
                  animate={{ opacity: [0.15, 0.5, 0.15], ry: [18, 28, 18] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
              )}
              <polygon points={poly([b.pts.fr, b.pts.br, b.pts.trb, b.pts.tr])} fill={sideRFill} stroke={stroke} strokeWidth={sw} />
              <polygon points={poly([b.pts.fl, b.pts.fr, b.pts.tr, b.pts.tl])} fill={sideFill} stroke={stroke} strokeWidth={sw} />
              <polygon points={poly([b.pts.tl, b.pts.tr, b.pts.trb, b.pts.tlb])} fill={topFill} stroke={stroke} strokeWidth={sw} />
              {[0.25, 0.5, 0.75].map((f, i) => (
                <line key={i}
                  x1={ORIGIN_X + iso(b.x0 + CELL_W * f, BLOCK_H, b.z0).sx}
                  y1={ORIGIN_Y - iso(b.x0 + CELL_W * f, BLOCK_H, b.z0).sy}
                  x2={ORIGIN_X + iso(b.x0 + CELL_W * f, BLOCK_H, b.z0 + CELL_D).sx}
                  y2={ORIGIN_Y - iso(b.x0 + CELL_W * f, BLOCK_H, b.z0 + CELL_D).sy}
                  stroke={isDest ? 'rgba(255,220,80,0.4)' : 'rgba(0,180,220,0.15)'} strokeWidth="0.7"
                />
              ))}
              <text
                x={ORIGIN_X + b.pts.center.sx}
                y={ORIGIN_Y - b.pts.center.sy}
                textAnchor="middle" dominantBaseline="middle"
                fontSize="11" fontWeight="900"
                fill={isDest ? '#D4AF37' : 'rgba(180,220,255,0.7)'}
                filter={isDest ? 'url(#um3d-glow)' : undefined}
                style={{ fontFamily: 'sans-serif', pointerEvents: 'none' }}
              >
                {b.icon} {b.label}
              </text>
            </g>
          );
        })}

        {/* aisle labels */}
        {[
          { label: language === 'ar' ? 'الممر الأيسر' : 'Left Aisle',  pos: iso(-200, 5, 60) },
          { label: language === 'ar' ? 'الممر الأيمن' : 'Right Aisle', pos: iso(160,  5, 60) },
        ].map((a, i) => (
          <text key={i}
            x={ORIGIN_X + a.pos.sx} y={ORIGIN_Y - a.pos.sy}
            textAnchor="middle" fontSize="8" fontWeight="700"
            fill="rgba(0,200,255,0.25)"
            style={{ fontFamily: 'sans-serif' }}
          >{a.label}</text>
        ))}

        {/* navigation path + animated golden arrows */}
        {dest && (
          <>
            <motion.line
              x1={pt(entrance).split(',')[0]} y1={pt(entrance).split(',')[1]}
              x2={ORIGIN_X + dest.pts.center.sx} y2={ORIGIN_Y - dest.pts.center.sy + 20}
              stroke="url(#um3d-path)"
              strokeWidth="5"
              strokeDasharray="12 8"
              strokeLinecap="round"
              filter="url(#um3d-glow)"
              initial={{ pathLength: 0 } as never}
              animate={{ pathLength: 1 } as never}
              transition={{ duration: 1.4 }}
            />
            {[0, 1, 2].map((i) => (
              <polygon key={i} points="-6,-8 7,0 -6,8" fill="#D4AF37" filter="url(#um3d-glow)">
                <animateMotion
                  dur="1.6s" begin={`${i * 0.53}s`} repeatCount="indefinite" rotate="auto"
                  path={`M ${pt(entrance)} L ${ORIGIN_X + dest.pts.center.sx},${ORIGIN_Y - dest.pts.center.sy + 20}`}
                />
              </polygon>
            ))}
          </>
        )}

        {/* entrance */}
        <g>
          <circle cx={ORIGIN_X + entrance.sx} cy={ORIGIN_Y - entrance.sy} r="10"
            fill="#004C6D" stroke="rgba(0,200,255,0.6)" strokeWidth="1.5" />
          <text x={ORIGIN_X + entrance.sx} y={ORIGIN_Y - entrance.sy + 22}
            textAnchor="middle" fontSize="8" fontWeight="900" fill="rgba(0,200,255,0.6)"
            style={{ fontFamily: 'sans-serif' }}>
            {language === 'ar' ? '🚪 المدخل' : '🚪 Entrance'}
          </text>
        </g>
      </svg>

      {/* ── Bottom card: book info + navigation steps ── */}
      <AnimatePresence>
        {hasDestination && (
          <motion.div
            key="bottom-card"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26, delay: 0.15 }}
            className="absolute bottom-3 inset-x-3 z-30 flex items-end gap-3"
          >
            {/* Info card */}
            <div className="flex-1 bg-[#01202e]/90 backdrop-blur-xl border border-[#D4AF37]/30 rounded-2xl p-3 shadow-2xl overflow-hidden">
              {/* book row */}
              {bookData && (
                <div className={cn('flex items-center gap-3 mb-2', isRtl ? 'flex-row-reverse' : 'flex-row')}>
                  <BookCover book={bookData} className="w-9 h-13 rounded-lg shrink-0 shadow-lg" />
                  <div className={cn('flex-1 min-w-0', isRtl ? 'text-right' : 'text-left')}>
                    <p className="text-[11px] font-black text-white truncate leading-snug">{bookData.title}</p>
                    <p className="text-[9px] text-white/50 truncate mt-0.5">{bookData.author}</p>
                    <span className="inline-block mt-1 text-[8px] font-black text-[#D4AF37] bg-[#D4AF37]/15 px-2 py-0.5 rounded-full">
                      {destinationShelfId}
                    </span>
                  </div>
                </div>
              )}
              {/* navigation steps (first 2) */}
              {navigationSteps.slice(0, 2).map((step, i) => (
                <div key={i} className={cn('flex items-center gap-2 text-[10px] py-1 border-t border-white/5', isRtl ? 'flex-row-reverse' : 'flex-row')}>
                  <span className="w-4 h-4 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[8px] font-black text-[#D4AF37] shrink-0">{i + 1}</span>
                  <span className="text-white/70 truncate">{step}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
