import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MOCK_BOOKS } from '../data/mockData';
import { Book } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, BookOpen, MapPin, QrCode } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { cn } from '../lib/utils';

const SHELF_LIST = ['A-1', 'A-2', 'B-1', 'B-2', 'C-1', 'C-2', 'D-1', 'D-2'];

const SECTION_LABEL: Record<string, { ar: string; en: string }> = {
  A: { ar: 'علوم طبيعية', en: 'Natural Sciences' },
  B: { ar: 'هندسة وتقنية', en: 'Engineering & Tech' },
  C: { ar: 'فنون وآداب', en: 'Arts & Humanities' },
  D: { ar: 'علوم إنسانية', en: 'Human Sciences' },
};

const CAT_COLOR: Record<string, string> = {
  'فيزياء':  '#5B3A8C',
  'هندسة':   '#2D5A27',
  'علم نفس': '#7B2D8B',
  'عام':     '#1B3A6B',
};
const FALLBACK_COLORS = ['#6B3FA0','#5C4033','#1B4D6B','#2D5A27','#8B3A2A','#1A3A5C','#7B4F00','#3D2B6B'];
const HEIGHTS       = [92, 76, 100, 84, 88, 72, 96, 80, 86, 70, 94, 78];

function bookColor(b: Book, i: number) {
  return b.category ? (CAT_COLOR[b.category] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]) : FALLBACK_COLORS[i % FALLBACK_COLORS.length];
}
function bookH(i: number) { return HEIGHTS[i % HEIGHTS.length]; }

// Simulated AR sensor metrics that drift gently
function useMetrics() {
  const [v, setV] = useState({ fps: 58, depth: 1.05, compass: 189, roll: 8.4, pitch: 5.7 });
  useEffect(() => {
    const id = setInterval(() => setV(p => ({
      fps:     Math.max(50, Math.min(63, p.fps + Math.floor((Math.random() - .5) * 4))),
      depth:   +Math.max(.7, Math.min(2.0, p.depth + (Math.random() - .5) * .1)).toFixed(2),
      compass: Math.max(178, Math.min(202, p.compass + Math.floor((Math.random() - .5) * 4))),
      roll:    +Math.max(4, Math.min(14, p.roll + (Math.random() - .5) * 1.2)).toFixed(1),
      pitch:   parseFloat(Math.max(2, Math.min(10, p.pitch + (Math.random() - .5) * 1)).toFixed(1)),
    })), 2200);
    return () => clearInterval(id);
  }, []);
  return v;
}

export function ShelfARScan() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { language, dir } = useLanguage();
  const ar = language === 'ar';

  const [shelf,   setShelf]   = useState('A-1');
  const [book,    setBook]    = useState<Book | null>(null);
  const [scanning,setScanning]= useState(false);
  const metrics = useMetrics();
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Accept shelf from navigation state (from QR scanner or map)
  useEffect(() => {
    const st = location.state as { shelfId?: string; bookId?: string } | null;
    if (st?.shelfId) setShelf(st.shelfId);
    if (st?.bookId) {
      const found = MOCK_BOOKS.find(b => b.id === st.bookId);
      if (found) { setBook(found); if (found.shelf) setShelf(found.shelf); }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const shelfBooks = MOCK_BOOKS.filter(b => b.shelf === shelf);
  const sectionKey = shelf.split('-')[0];
  const refCode    = `REF-${sectionKey}${shelf.replace('-', '')}`;

  // Auto-select first book when shelf changes
  useEffect(() => {
    if (!shelfBooks.find(b => b.id === book?.id)) {
      setBook(shelfBooks[0] ?? null);
    }
  }, [shelf]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── QR scanner ──────────────────────────────────────────────────────────
  const startScan = () => {
    setScanning(true);
    const el = document.getElementById('sas-qr');
    if (el) el.innerHTML = '';
    const scanner = new Html5Qrcode('sas-qr');
    scannerRef.current = scanner;

    const onHit = (text: string) => {
      const urlMatch = /\/book\/([^/?#]+)/.exec(text);
      const bookId = urlMatch?.[1] ?? (text.startsWith('ARLIBRARY:BOOK:') ? text.slice(15) : null);
      if (bookId) {
        const found = MOCK_BOOKS.find(b => b.id === bookId);
        if (found) {
          scanner.stop().catch(() => {});
          setScanning(false);
          if (found.shelf) setShelf(found.shelf);
          setBook(found);
          try { navigator.vibrate?.([80, 40, 80]); } catch { /* ok */ }
        }
      }
    };

    Html5Qrcode.getCameras()
      .then(cams => {
        const back = cams.length > 1
          ? (cams.find(c => /back|rear|environment/i.test(c.label)) ?? cams[cams.length - 1])
          : null;
        const cfg = { fps: 10, qrbox: { width: 200, height: 200 } };
        const run = (cam?: string) =>
          scanner.start(cam ?? ({ facingMode: 'environment' } as any), cfg, onHit, () => {})
                 .catch(() => cam ? run() : setScanning(false));
        run(back?.id);
      })
      .catch(() => setScanning(false));
  };

  const stopScan = () => { scannerRef.current?.stop().catch(() => {}); setScanning(false); };

  useEffect(() => () => { scannerRef.current?.stop().catch(() => {}); }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col md:flex-row overflow-hidden" dir={dir}>

      {/* ══════════════════════════════════════════
          LEFT — AR HUD shelf panel
      ══════════════════════════════════════════ */}
      <div
        className="flex-none md:w-[42%] flex flex-col bg-[#080e18] text-white"
        style={{ fontFamily: "'JetBrains Mono','Courier New',monospace", minHeight: scanning ? 340 : 'auto' }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
          <div>
            <div className="text-[10px] text-accent/90 tracking-[0.35em] uppercase font-black">SHELF {shelf}</div>
            <div className="text-[7px] text-white/25 tracking-[0.2em] uppercase">BOOK ROW SEQUENCE // {refCode}</div>
          </div>
          <button onClick={() => navigate(-1)} className="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Shelf selector */}
        <div className="flex border-b border-white/[0.07] overflow-x-auto scrollbar-none">
          {SHELF_LIST.map(sh => (
            <button key={sh} onClick={() => setShelf(sh)}
              className={cn(
                'flex-none px-3.5 py-2 text-[8px] font-black tracking-wider uppercase transition-all border-b-2',
                shelf === sh ? 'text-accent border-accent bg-accent/[0.08]' : 'text-white/25 border-transparent hover:text-white/50'
              )}
            >
              {sh}
            </button>
          ))}
        </div>

        {/* ── Shelf books visual ── */}
        <div className="flex-1 flex flex-col justify-end px-4 pt-6 pb-2 relative">
          {/* Corner AR brackets */}
          <div className="absolute inset-8 pointer-events-none">
            {['top-0 left-0 border-t border-l','top-0 right-0 border-t border-r',
              'bottom-0 left-0 border-b border-l','bottom-0 right-0 border-b border-r'
            ].map((cls, i) => (
              <div key={i} className={`absolute w-5 h-5 border-accent/30 ${cls}`} />
            ))}
          </div>

          {/* Books row */}
          <div className={cn('flex items-end gap-1', ar ? 'flex-row-reverse justify-end' : 'flex-row')}>
            {shelfBooks.map((b, i) => {
              const h = bookH(i);
              const color = bookColor(b, i);
              const sel = book?.id === b.id;
              return (
                <motion.button key={b.id} onClick={() => setBook(b)}
                  animate={{ y: sel ? -6 : 0, scale: sel ? 1.04 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  style={{ height: h, width: 30, flexShrink: 0 }}
                  className="relative focus:outline-none"
                >
                  <div className="w-full h-full rounded-[3px] flex items-center justify-center overflow-hidden"
                    style={{
                      backgroundColor: color,
                      boxShadow: sel
                        ? `0 0 0 1.5px #D9B310, 0 0 18px rgba(217,179,16,.55), inset 0 1px 0 rgba(255,255,255,.18)`
                        : `inset 0 1px 0 rgba(255,255,255,.08), 2px 3px 6px rgba(0,0,0,.5)`,
                    }}
                  >
                    <span className="text-white/60 leading-tight px-0.5 overflow-hidden"
                      style={{ fontSize: 5.5, writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)', maxHeight: h - 8 }}
                    >
                      {b.title}
                    </span>
                  </div>
                  {sel && (
                    <motion.div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent"
                      animate={{ opacity: [1, .25] }} transition={{ duration: .8, repeat: Infinity }} />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Shelf plank */}
          <div className="h-2 mt-1.5 rounded-sm mx-1"
            style={{ background: 'linear-gradient(to right, #2a1a0e, #5c3820, #3a2012)' }} />
        </div>

        {/* ── QR scanner area ── */}
        <div className="px-4 pb-2">
          {!scanning ? (
            <motion.button whileTap={{ scale: .96 }} onClick={startScan}
              className="w-full py-2.5 rounded-lg bg-accent/[0.12] border border-accent/30 text-accent text-[9px] font-black tracking-widest uppercase flex items-center justify-center gap-2"
            >
              <QrCode className="w-3.5 h-3.5" />
              {ar ? 'مسح رمز QR للكتاب' : 'SCAN BOOK QR CODE'}
            </motion.button>
          ) : (
            <div>
              <div id="sas-qr" className="w-full rounded-lg overflow-hidden" style={{ height: 180 }} />
              <button onClick={stopScan}
                className="w-full py-1.5 mt-1.5 rounded-lg bg-white/[0.07] text-white/40 text-[9px] font-black tracking-widest uppercase"
              >
                {ar ? 'إلغاء' : 'CANCEL'}
              </button>
            </div>
          )}
        </div>

        {/* ── Sensor metrics ── */}
        <div className="border-t border-white/[0.07] px-3 py-2.5 grid grid-cols-5 gap-1">
          {[
            { l: 'SYS FPS', v: String(metrics.fps) },
            { l: 'EST.DEPTH', v: `${metrics.depth}m` },
            { l: 'COMPASS', v: `N ${metrics.compass}°` },
            { l: 'ROLL', v: `${metrics.roll}°` },
            { l: 'PITCH', v: `${metrics.pitch}°` },
          ].map(({ l, v }) => (
            <div key={l} className="text-center">
              <div className="text-[5.5px] text-white/25 uppercase tracking-wider leading-tight">{l}</div>
              <div className="text-[9px] text-white/60 font-black tabular-nums leading-tight mt-0.5">{v}</div>
            </div>
          ))}
        </div>

        {/* Instruction */}
        <div className="text-center pb-3 px-4">
          <p className="text-[7.5px] text-white/20 leading-relaxed">
            {ar
              ? 'اضغط على أي كتاب لعرض معلوماته · أو امسح رمز QR الحقيقي'
              : 'TAP A BOOK TO VIEW INFO  ·  OR SCAN REAL QR CODE'}
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT — AR info panel
      ══════════════════════════════════════════ */}
      <div className="flex-1 bg-white dark:bg-slate-950 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {book ? (
            <motion.div key={book.id}
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              transition={{ duration: .18 }}
              className="flex flex-col h-full overflow-y-auto"
            >
              {/* Header bar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-white/[0.07] shrink-0">
                <div className="px-2 py-0.5 rounded bg-accent text-primary text-[8px] font-black tracking-widest">AR</div>
                <span className="text-[7.5px] font-black text-slate-200 dark:text-white/[0.15] uppercase tracking-[0.35em]">AR INFO WINDOW</span>
              </div>

              {/* Section badge */}
              <div className="px-5 pt-4 shrink-0">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/[0.08] border border-accent/25">
                  <span className="text-[7px] font-black text-slate-300 dark:text-white/30 uppercase tracking-widest">DISCOVERED SECTION</span>
                  <span className="text-[8px] font-black text-accent uppercase tracking-wider">
                    {sectionKey} · {book.category}
                  </span>
                </div>
              </div>

              {/* Title + author */}
              <div className={cn('px-5 pt-3 pb-4 border-b border-slate-100 dark:border-white/[0.07] shrink-0', ar ? 'text-right' : 'text-left')}>
                <h2 className="text-2xl font-black text-primary dark:text-white leading-tight">{book.title}</h2>
                {book.titleEn && (
                  <p className="text-[9px] font-bold text-slate-300 dark:text-white/[0.25] mt-0.5 text-left">{book.titleEn}</p>
                )}
                <p className="text-sm font-black text-accent mt-1.5">{book.author}</p>
                {book.authorEn && (
                  <p className="text-[9px] font-bold text-slate-400 dark:text-white/30">{book.authorEn}</p>
                )}
              </div>

              {/* Metadata rows */}
              <div className="px-5 py-4 space-y-3.5 border-b border-slate-100 dark:border-white/[0.07] shrink-0">
                {([
                  { label: 'LC CALL NUMBER',                               value: book.callNumber ?? '—', mono: true },
                  { label: ar ? 'التصنيف الموضوعي' : 'SUBJECT CATEGORY',  value: book.category ?? '—' },
                  { label: ar ? 'السنة والناشر'    : 'PUBLISHER & YEAR',   value: [book.publisher, book.year].filter(Boolean).join(' · ') || '—' },
                  { label: ar ? 'الموقع المادي'    : 'PHYSICAL LOCATION',  value: `Shelf ${book.shelf}` },
                  { label: ar ? 'الحالة'           : 'STATUS',
                    value: book.status === 'available' ? (ar ? 'متاح' : 'Available') : (ar ? 'مستعار' : 'Borrowed'),
                    accent: book.status === 'available' },
                ] as { label: string; value: string; mono?: boolean; accent?: boolean }[]).map(({ label, value, mono, accent }) => (
                  <div key={label} className="flex items-start justify-between gap-3">
                    <span className="text-[7.5px] font-black text-slate-300 dark:text-white/[0.18] uppercase tracking-widest shrink-0 mt-px">
                      {label}
                    </span>
                    <span className={cn(
                      'text-[10px] font-black text-right leading-tight',
                      mono ? 'font-mono text-primary dark:text-white' : 'text-primary dark:text-white',
                      accent && 'text-emerald-500'
                    )}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* AI Analysis */}
              <div className="px-5 py-4 flex-1">
                <div className={cn('flex items-center gap-2 mb-3', ar ? 'flex-row-reverse' : '')}>
                  <Zap className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="text-[7.5px] font-black text-slate-300 dark:text-white/[0.2] uppercase tracking-[0.3em]">
                    AI ANALYSIS (GEMINI)
                  </span>
                </div>
                <div className={cn('text-[7px] font-black text-slate-300 dark:text-white/[0.15] uppercase tracking-widest mb-2', ar ? 'text-right' : 'text-left')}>
                  ACADEMIC SUMMARY
                </div>
                <p className={cn('text-xs font-bold text-primary dark:text-white leading-relaxed', ar ? 'text-right' : 'text-left')}>
                  {book.description}
                </p>
                {book.descriptionEn && (
                  <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 leading-relaxed mt-2 text-left">
                    {book.descriptionEn}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className={cn('px-5 pb-5 flex gap-3 shrink-0', ar ? 'flex-row-reverse' : '')}>
                <motion.button whileTap={{ scale: .96 }}
                  onClick={() => navigate(`/book/${book.id}`)}
                  className="flex-1 py-3 bg-primary dark:bg-accent text-white dark:text-primary rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  {ar ? 'صفحة الكتاب' : 'Book Page'}
                </motion.button>
                <motion.button whileTap={{ scale: .96 }}
                  onClick={() => navigate('/map', { state: { shelfId: book.shelf } })}
                  className="flex-1 py-3 bg-slate-100 dark:bg-white/[0.07] text-primary dark:text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {ar ? 'الخريطة' : 'Show Map'}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center"
            >
              <BookOpen className="w-10 h-10 text-slate-200 dark:text-white/[0.08]" />
              <p className="text-[10px] font-black text-slate-300 dark:text-white/[0.2] uppercase tracking-widest">
                {ar ? 'اختر كتاباً من الرف' : 'Select a book from the shelf'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        #sas-qr video { width:100%!important; height:100%!important; object-fit:cover!important; }
        #sas-qr canvas { display:none!important; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { scrollbar-width: none; }
      `}</style>
    </div>
  );
}
