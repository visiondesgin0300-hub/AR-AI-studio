import React from 'react';
import { motion } from 'motion/react';

interface UnityMap3DProps {
  destinationShelfId: string | null;
  onSelectShelf: (id: string) => void;
  language: 'ar' | 'en';
}

// Shelf grid: 4 columns × 2 rows = 8 shelf blocks
const SHELF_BLOCKS = [
  { id: 'A-1', label: 'A-1', icon: '🧪', col: 0, row: 0 },
  { id: 'A-2', label: 'A-2', icon: '🧪', col: 1, row: 0 },
  { id: 'B-1', label: 'B-1', icon: '⚙️', col: 2, row: 0 },
  { id: 'B-2', label: 'B-2', icon: '⚙️', col: 3, row: 0 },
  { id: 'C-1', label: 'C-1', icon: '🎨', col: 0, row: 1 },
  { id: 'C-2', label: 'C-2', icon: '🎨', col: 1, row: 1 },
  { id: 'D-1', label: 'D-1', icon: '📚', col: 2, row: 1 },
  { id: 'D-2', label: 'D-2', icon: '📚', col: 3, row: 1 },
];

const CELL_W = 110;
const CELL_D = 70;   // depth (Z)
const BLOCK_H = 54;  // shelf unit height
const GAP_X   = 28;
const GAP_Z   = 36;
const AISLE_Z  = 44; // aisle gap between rows

// Isometric projection: x, y, z → screen x, y
function iso(x: number, y: number, z: number) {
  return {
    sx: (x - z) * 0.866,
    sy: (x + z) * 0.5 - y,
  };
}

export function UnityMap3D({ destinationShelfId, onSelectShelf, language }: UnityMap3DProps) {
  // SVG viewport — large enough for isometric layout
  const VW = 640;
  const VH = 420;
  const ORIGIN_X = VW / 2;
  const ORIGIN_Y = VH - 80;

  // Build each block's 3D corners
  const blocks = SHELF_BLOCKS.map((s) => {
    const wx = s.col * (CELL_W + GAP_X);
    const wz = s.row * (CELL_D + GAP_Z + AISLE_Z);
    const x0 = wx - (3.5 * (CELL_W + GAP_X)) / 2;
    const z0 = wz - ((CELL_D + GAP_Z + AISLE_Z)) / 2 - 20;

    const pts = {
      // floor corners
      fl: iso(x0,          0, z0         ),
      fr: iso(x0 + CELL_W, 0, z0         ),
      br: iso(x0 + CELL_W, 0, z0 + CELL_D),
      bl: iso(x0,          0, z0 + CELL_D),
      // top corners
      tl: iso(x0,          BLOCK_H, z0         ),
      tr: iso(x0 + CELL_W, BLOCK_H, z0         ),
      trb: iso(x0 + CELL_W,BLOCK_H, z0 + CELL_D),
      tlb: iso(x0,          BLOCK_H, z0 + CELL_D),
      // center top for label
      center: iso(x0 + CELL_W / 2, BLOCK_H + 8, z0 + CELL_D / 2),
    };
    return { ...s, pts, x0, z0 };
  });

  // Navigation path: from entrance (bottom center) to destination shelf center
  const dest = blocks.find(b => b.id === destinationShelfId);
  const entrance = iso(0, 0, 200);

  function pt(p: { sx: number; sy: number }) {
    return `${ORIGIN_X + p.sx},${ORIGIN_Y - p.sy}`;
  }

  function poly(pts: { sx: number; sy: number }[]) {
    return pts.map(pt).join(' ');
  }

  return (
    <svg
      viewBox={`0 0 ${VW} ${VH}`}
      className="w-full h-full"
      style={{ userSelect: 'none' }}
    >
      <defs>
        {/* floor grid */}
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
          <stop offset="0%" stopColor="#004C6D" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
      </defs>

      {/* ── floor ── */}
      <rect width={VW} height={VH} fill="url(#um3d-floor)" />
      <rect width={VW} height={VH} fill="url(#um3d-grid)" />
      {/* floor edge glow */}
      <ellipse cx={ORIGIN_X} cy={ORIGIN_Y - 10} rx={300} ry={30}
        fill="rgba(0,200,255,0.04)" />

      {/* ── shelf blocks ── */}
      {blocks.map((b) => {
        const isDest = b.id === destinationShelfId;
        const topFill = isDest ? 'url(#um3d-top-dest)' : 'url(#um3d-top)';
        const sideRFill = isDest ? 'rgba(180,130,10,0.7)' : 'url(#um3d-side-r)';
        const sideFill  = isDest ? 'rgba(150,100,5,0.8)'  : 'url(#um3d-side-f)';
        const stroke    = isDest ? '#D4AF37' : 'rgba(0,180,220,0.25)';
        const sw        = isDest ? 1.5 : 0.5;

        return (
          <g key={b.id} onClick={() => onSelectShelf(b.id)} style={{ cursor: 'pointer' }}>
            {/* destination pulse halo */}
            {isDest && (
              <motion.ellipse
                cx={ORIGIN_X + b.pts.center.sx}
                cy={ORIGIN_Y - b.pts.center.sy + 20}
                rx={50} ry={20}
                fill="#D4AF37"
                filter="url(#um3d-glow-strong)"
                animate={{ opacity: [0.15, 0.4, 0.15], ry: [18, 26, 18] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
            )}

            {/* right face */}
            <polygon
              points={poly([b.pts.fr, b.pts.br, b.pts.trb, b.pts.tr])}
              fill={sideRFill} stroke={stroke} strokeWidth={sw}
            />
            {/* front face */}
            <polygon
              points={poly([b.pts.fl, b.pts.fr, b.pts.tr, b.pts.tl])}
              fill={sideFill} stroke={stroke} strokeWidth={sw}
            />
            {/* top face */}
            <polygon
              points={poly([b.pts.tl, b.pts.tr, b.pts.trb, b.pts.tlb])}
              fill={topFill} stroke={stroke} strokeWidth={sw}
            />
            {/* shelf lines on top (book dividers) */}
            {[0.25, 0.5, 0.75].map((f, i) => (
              <line key={i}
                x1={ORIGIN_X + iso(b.x0 + CELL_W * f, BLOCK_H, b.z0).sx}
                y1={ORIGIN_Y - iso(b.x0 + CELL_W * f, BLOCK_H, b.z0).sy}
                x2={ORIGIN_X + iso(b.x0 + CELL_W * f, BLOCK_H, b.z0 + CELL_D).sx}
                y2={ORIGIN_Y - iso(b.x0 + CELL_W * f, BLOCK_H, b.z0 + CELL_D).sy}
                stroke={isDest ? 'rgba(255,220,80,0.4)' : 'rgba(0,180,220,0.15)'} strokeWidth="0.7"
              />
            ))}

            {/* shelf ID label */}
            <text
              x={ORIGIN_X + b.pts.center.sx}
              y={ORIGIN_Y - b.pts.center.sy}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fontWeight="900"
              fill={isDest ? '#D4AF37' : 'rgba(180,220,255,0.7)'}
              filter={isDest ? 'url(#um3d-glow)' : undefined}
              style={{ fontFamily: 'sans-serif', pointerEvents: 'none' }}
            >
              {b.icon} {b.label}
            </text>
          </g>
        );
      })}

      {/* ── aisle labels ── */}
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

      {/* ── navigation path to destination ── */}
      {dest && (
        <>
          <motion.line
            x1={pt(entrance).split(',')[0]} y1={pt(entrance).split(',')[1]}
            x2={ORIGIN_X + dest.pts.center.sx} y2={ORIGIN_Y - dest.pts.center.sy + 20}
            stroke="url(#um3d-path)"
            strokeWidth="4"
            strokeDasharray="10 8"
            strokeLinecap="round"
            filter="url(#um3d-glow)"
            initial={{ pathLength: 0 } as never}
            animate={{ pathLength: 1 } as never}
            transition={{ duration: 1.2 }}
          />
          {[0, 1].map((i) => (
            <polygon key={i} points="-5,-7 6,0 -5,7" fill="#D4AF37" filter="url(#um3d-glow)">
              <animateMotion
                dur="1.8s" begin={`${i * 0.9}s`} repeatCount="indefinite" rotate="auto"
                path={`M ${pt(entrance)} L ${ORIGIN_X + dest.pts.center.sx},${ORIGIN_Y - dest.pts.center.sy + 20}`}
              />
            </polygon>
          ))}
        </>
      )}

      {/* ── entrance marker ── */}
      <g>
        <circle cx={ORIGIN_X + entrance.sx} cy={ORIGIN_Y - entrance.sy} r="10" fill="#004C6D" stroke="rgba(0,200,255,0.6)" strokeWidth="1.5" />
        <text x={ORIGIN_X + entrance.sx} y={ORIGIN_Y - entrance.sy + 22}
          textAnchor="middle" fontSize="8" fontWeight="900" fill="rgba(0,200,255,0.6)"
          style={{ fontFamily: 'sans-serif' }}>
          {language === 'ar' ? '🚪 المدخل' : '🚪 Entrance'}
        </text>
      </g>
    </svg>
  );
}
