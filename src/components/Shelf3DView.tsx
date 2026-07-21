import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book } from '../types';
import { BookCover } from './BookCover';
import { RafeeqAvatar } from './RafeeqAvatar';
import { cn } from '../lib/utils';

interface Shelf3DViewProps {
  targetBook?: Book | null;
  shelfId?: string | null;
  language: 'ar' | 'en';
  dir: 'rtl' | 'ltr';
}

// Deterministic "fake" spine colors per slot
const SPINE_PALETTE = [
  '#1565C0','#0288D1','#00838F','#2E7D32','#558B2F',
  '#F9A825','#E65100','#6A1B9A','#AD1457','#4527A0',
  '#0277BD','#00695C','#37474F','#795548','#1B5E20',
];

const SPINE_HEIGHTS = [88,74,96,68,82,90,72,86,78,94,70,88,76,84,66];
const SPINE_WIDTHS  = [14,10,16,11,13,15,10,17,12,14,9,15,11,13,8];

function makeRows(count = 15) {
  return Array.from({ length: count }, (_, i) => ({
    color: SPINE_PALETTE[i % SPINE_PALETTE.length],
    h: SPINE_HEIGHTS[i % SPINE_HEIGHTS.length],
    w: SPINE_WIDTHS[i % SPINE_WIDTHS.length],
  }));
}

export function Shelf3DView({ targetBook, shelfId, language, dir }: Shelf3DViewProps) {
  const row1 = useMemo(() => makeRows(14), []);
  const row2 = useMemo(() => makeRows(16), []);

  // Pick a random slot in row1 for the target book (slot 5 by default)
  const targetSlot = 5;

  const shelfLabel = shelfId ?? targetBook?.shelf ?? '—';
  const bookTitle  = targetBook ? (language === 'ar' ? targetBook.title : (targetBook.titleEn ?? targetBook.title)) : shelfLabel;

  const rafeeqTip = language === 'ar'
    ? `كتابك هنا! رف ${shelfLabel} 👆`
    : `Your book is here! Shelf ${shelfLabel} 👆`;

  return (
    <div className="w-full h-full flex flex-col items-center justify-end gap-0 relative overflow-hidden select-none">

      {/* ── ambient ceiling light ── */}
      <div className="absolute top-0 inset-x-0 h-40 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(255,220,100,0.12) 0%, transparent 100%)' }} />

      {/* ── floor reflection line ── */}
      <div className="absolute bottom-0 inset-x-0 h-px bg-white/10" />

      {/* ── Rafeeq + speech ── */}
      <motion.div
        className={cn(
          'absolute top-4 z-30 flex flex-col items-center gap-1',
          dir === 'rtl' ? 'right-4' : 'left-4'
        )}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-3 py-2 shadow-xl max-w-[150px] text-center mb-1">
          <p className="text-[10px] font-black text-white leading-snug">{rafeeqTip}</p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/10 border-b border-r border-white/20 rotate-45" />
        </div>
        <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}>
          <RafeeqAvatar className="w-14 h-14 drop-shadow-2xl" />
        </motion.div>
      </motion.div>

      {/* ── 3D scene wrapper ── */}
      <div style={{ perspective: '900px', width: '100%', paddingBottom: '1rem' }}>
        <div style={{ transform: 'rotateX(10deg)', transformOrigin: 'bottom center' }} className="w-full flex flex-col items-center gap-2 px-4">

          {/* ══ ROW 1 (back) ══ */}
          <ShelfRow books={row1} targetSlot={-1} targetBook={null} language={language} depth={0.65} rowLabel={language === 'ar' ? 'الصف الثاني' : 'Row 2'} />

          {/* ══ ROW 2 (front — contains the target book) ══ */}
          <ShelfRow books={row2} targetSlot={targetSlot} targetBook={targetBook ?? null} language={language} depth={1} rowLabel={language === 'ar' ? 'الصف الأول' : 'Row 1'} />

        </div>
      </div>

      {/* ── destination label ── */}
      <div className="relative z-20 px-5 py-2.5 rounded-full bg-white/8 backdrop-blur-xl border border-white/15 shadow-xl flex items-center gap-3 mb-3">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span className="text-white text-[11px] font-black truncate max-w-[200px]">{bookTitle}</span>
      </div>
    </div>
  );
}

/* ── individual shelf row ── */
interface ShelfRowProps {
  books: { color: string; h: number; w: number }[];
  targetSlot: number;
  targetBook: Book | null;
  language: 'ar' | 'en';
  depth: number;
  rowLabel: string;
}

function ShelfRow({ books, targetSlot, targetBook, language, depth, rowLabel }: ShelfRowProps) {
  const SHELF_DEPTH = 20;
  const SHELF_H = 12;
  const BOOK_BASE = 24; // baseline y from shelf top

  return (
    <div className="w-full relative" style={{ opacity: depth, marginBottom: depth < 1 ? '-12px' : 0 }}>
      {/* shelf plank — front face */}
      <div className="relative w-full rounded-sm overflow-hidden" style={{ height: `${SHELF_H}px`, background: 'linear-gradient(180deg, #8B6914 0%, #5C4210 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
        {/* shelf top edge */}
        <div className="absolute inset-x-0 top-0 h-2" style={{ background: 'linear-gradient(180deg, #C8921A 0%, #8B6914 100%)' }} />
        {/* shelf label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[8px] font-black text-amber-200/60 uppercase tracking-widest">{rowLabel}</span>
        </div>
      </div>

      {/* books row */}
      <div className="flex items-end gap-[2px] w-full px-1" style={{ height: '110px', background: 'linear-gradient(180deg, #01354C 0%, #011e2d 100%)', borderBottom: '2px solid #8B6914' }}>
        {books.map((book, i) => {
          const isTarget = i === targetSlot && targetBook !== null;

          return (
            <motion.div
              key={i}
              className="relative flex-shrink-0"
              style={{ width: `${book.w}px`, height: `${book.h}px`, alignSelf: 'flex-end' }}
              animate={isTarget
                ? { y: [-2, -10, -2], scale: [1, 1.06, 1] }
                : { y: 0, scale: 1 }}
              transition={isTarget
                ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                : {}}
            >
              {isTarget ? (
                /* ── TARGET BOOK: show cover + glow ── */
                <>
                  {/* Glow behind */}
                  <motion.div
                    className="absolute inset-0 rounded-sm"
                    style={{ filter: 'blur(8px)', background: '#D4AF37', zIndex: 0 }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  {/* Gold outline ring */}
                  <div
                    className="absolute -inset-1 rounded-sm border-2 border-accent z-10 pointer-events-none"
                    style={{ boxShadow: '0 0 12px 4px rgba(212,175,55,0.7)' }}
                  />
                  {/* Book cover */}
                  <div className="relative z-20 w-full h-full rounded-sm overflow-hidden shadow-2xl">
                    <BookCover
                      book={targetBook!}
                      className="w-full h-full"
                      imgClassName="object-cover w-full h-full"
                    />
                  </div>
                  {/* Label below */}
                  <div
                    className="absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] font-black text-accent bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5 z-30"
                    style={{ textShadow: '0 0 6px rgba(212,175,55,0.8)' }}
                  >
                    {language === 'ar' ? 'هنا!' : 'Here!'}
                  </div>
                </>
              ) : (
                /* ── REGULAR BOOK: colored spine ── */
                <div
                  className="w-full h-full rounded-sm"
                  style={{
                    background: `linear-gradient(180deg, ${lighten(book.color, 30)} 0%, ${book.color} 40%, ${darken(book.color, 20)} 100%)`,
                    boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.3)',
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function lighten(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (n >> 16) + amt);
  const g = Math.min(255, ((n >> 8) & 0xff) + amt);
  const b = Math.min(255, (n & 0xff) + amt);
  return `rgb(${r},${g},${b})`;
}

function darken(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (n >> 16) - amt);
  const g = Math.max(0, ((n >> 8) & 0xff) - amt);
  const b = Math.max(0, (n & 0xff) - amt);
  return `rgb(${r},${g},${b})`;
}
