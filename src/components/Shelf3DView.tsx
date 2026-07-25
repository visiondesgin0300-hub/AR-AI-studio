import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Book } from '../types';
import { BookCover } from './BookCover';

interface Shelf3DViewProps {
  targetBook?: Book | null;
  shelfId?: string | null;
  language: 'ar' | 'en';
  dir: 'rtl' | 'ltr';
}

// Muted, dark, professional library book colors
const SPINE_PALETTE = [
  '#1a2744', '#2b1f3e', '#1c3628', '#3d2215', '#1e1e38',
  '#3a1818', '#262626', '#183636', '#483318', '#243040',
  '#3a2508', '#12202e', '#1e3615', '#35224a', '#2c1410',
  '#0f2838', '#1a2e1a', '#2e0e0e', '#1c1c30', '#28351c',
];

const SPINE_HEIGHTS = [92, 76, 102, 70, 86, 94, 74, 90, 80, 98, 68, 84, 78, 88, 64, 96, 72, 88, 82, 100];
const SPINE_WIDTHS  = [13, 9, 16, 10, 14, 12, 9, 17, 11, 15, 8, 14, 10, 13, 7, 16, 9, 12, 11, 15];

function makeRows(count: number, seed: number) {
  return Array.from({ length: count }, (_, i) => ({
    color: SPINE_PALETTE[(i + seed) % SPINE_PALETTE.length],
    h: SPINE_HEIGHTS[(i + seed * 3) % SPINE_HEIGHTS.length],
    w: SPINE_WIDTHS[(i + seed * 5) % SPINE_WIDTHS.length],
  }));
}

export function Shelf3DView({ targetBook, shelfId, language }: Shelf3DViewProps) {
  const row1 = useMemo(() => makeRows(14, 0), []);
  const row2 = useMemo(() => makeRows(16, 7), []);

  const targetSlot = 5;
  const shelfLabel = shelfId ?? targetBook?.shelf ?? '—';
  const bookTitle = targetBook
    ? (language === 'ar' ? targetBook.title : (targetBook.titleEn ?? targetBook.title))
    : shelfLabel;

  return (
    <div className="w-full h-full flex flex-col items-center justify-end relative overflow-hidden select-none">

      {/* Warm ceiling lamp glow */}
      <div
        className="absolute top-0 inset-x-0 h-64 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 85% 70% at 50% -8%, rgba(240,190,70,0.18) 0%, rgba(100,150,210,0.05) 55%, transparent 100%)',
        }}
      />

      {/* Side vignette — depth illusion */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, rgba(0,0,0,0.4) 0%, transparent 18%, transparent 82%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* Floor fog blends shelf base into background */}
      <div
        className="absolute bottom-0 inset-x-0 h-28 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(1,11,20,0.9) 0%, transparent 100%)' }}
      />

      {/* 3D scene wrapper */}
      <div style={{ perspective: '1000px', width: '100%', paddingBottom: '0.75rem' }}>
        <div
          style={{ transform: 'rotateX(8deg)', transformOrigin: 'bottom center' }}
          className="w-full flex flex-col items-center gap-3 px-2"
        >
          <ShelfRow
            books={row1}
            targetSlot={-1}
            targetBook={null}
            language={language}
            depth={0.55}
            rowLabel={language === 'ar' ? 'الصف الثاني' : 'Row 2'}
          />
          <ShelfRow
            books={row2}
            targetSlot={targetSlot}
            targetBook={targetBook ?? null}
            language={language}
            depth={1}
            rowLabel={language === 'ar' ? 'الصف الأول' : 'Row 1'}
          />
        </div>
      </div>

      {/* Destination label */}
      <div className="relative z-20 px-5 py-2.5 rounded-full bg-white/8 backdrop-blur-xl border border-white/15 shadow-xl flex items-center gap-3 mb-3">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span className="text-white text-[11px] font-black truncate max-w-[220px]">{bookTitle}</span>
      </div>
    </div>
  );
}

interface ShelfRowProps {
  books: { color: string; h: number; w: number }[];
  targetSlot: number;
  targetBook: Book | null;
  language: 'ar' | 'en';
  depth: number;
  rowLabel: string;
}

function ShelfRow({ books, targetSlot, targetBook, language, depth, rowLabel }: ShelfRowProps) {
  return (
    <div className="w-full relative" style={{ opacity: depth, marginBottom: depth < 1 ? '-14px' : 0 }}>

      {/* Wooden shelf plank */}
      <div
        className="relative w-full rounded-sm"
        style={{
          height: '14px',
          background: 'linear-gradient(180deg, #c89218 0%, #9b6b0a 32%, #7a530c 70%, #5c400a 100%)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.75), 0 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        {/* Wood grain */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent, transparent 14px, rgba(0,0,0,0.2) 14px, rgba(0,0,0,0.2) 15px, transparent 15px, transparent 34px, rgba(255,255,255,0.07) 34px, rgba(255,255,255,0.07) 35px)',
          }}
        />
        {/* Top highlight edge */}
        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: 'rgba(255,205,55,0.35)' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[7px] font-black text-amber-300/30 uppercase tracking-widest">{rowLabel}</span>
        </div>
      </div>

      {/* Book slot */}
      <div
        className="flex items-end gap-[1.5px] w-full px-1"
        style={{
          height: '120px',
          background: 'linear-gradient(180deg, #010c14 0%, #011420 55%, #01202e 100%)',
          borderBottom: '3px solid #8b6408',
        }}
      >
        {books.map((book, i) => {
          const isTarget = i === targetSlot && targetBook !== null;
          const highlightAmt = 20 + (i % 7) * 7;

          return (
            <motion.div
              key={i}
              className="relative flex-shrink-0"
              style={{ width: `${book.w}px`, height: `${book.h}px`, alignSelf: 'flex-end' }}
              animate={isTarget ? { y: [-2, -13, -2], scale: [1, 1.08, 1] } : { y: 0, scale: 1 }}
              transition={isTarget ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
            >
              {isTarget ? (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-sm"
                    style={{ filter: 'blur(10px)', background: '#D4AF37', zIndex: 0 }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <div
                    className="absolute -inset-1.5 rounded-sm border-2 border-accent z-10 pointer-events-none"
                    style={{ boxShadow: '0 0 18px 6px rgba(212,175,55,0.65)' }}
                  />
                  <div className="relative z-20 w-full h-full rounded-sm overflow-hidden shadow-2xl">
                    <BookCover book={targetBook!} className="w-full h-full" imgClassName="object-cover w-full h-full" />
                  </div>
                  <div
                    className="absolute top-full mt-0.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[7px] font-black text-accent bg-black/75 backdrop-blur-sm rounded px-1.5 py-0.5 z-30"
                    style={{ textShadow: '0 0 8px rgba(212,175,55,0.9)' }}
                  >
                    {language === 'ar' ? 'هنا!' : 'Here!'}
                  </div>
                </>
              ) : (
                <div
                  className="w-full h-full rounded-sm relative overflow-hidden"
                  style={{
                    background: `linear-gradient(108deg, ${lighten(book.color, highlightAmt)} 0%, ${book.color} 28%, ${darken(book.color, 14)} 78%, ${darken(book.color, 28)} 100%)`,
                    boxShadow: 'inset -3px 0 5px rgba(0,0,0,0.6), inset 1px 0 2px rgba(255,255,255,0.07)',
                  }}
                >
                  {/* Page-edge strip — simulates paper at right side */}
                  <div className="absolute top-0 bottom-0 right-0 w-[1.5px]" style={{ background: 'rgba(240,228,195,0.3)' }} />
                  <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: 'rgba(220,210,180,0.12)' }} />
                  {/* Spine band decoration for taller books */}
                  {book.h > 84 && (
                    <div
                      className="absolute inset-x-1.5"
                      style={{
                        top: '28%',
                        bottom: '28%',
                        borderTop: '1px solid rgba(255,255,255,0.07)',
                        borderBottom: '1px solid rgba(255,255,255,0.07)',
                      }}
                    />
                  )}
                </div>
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
