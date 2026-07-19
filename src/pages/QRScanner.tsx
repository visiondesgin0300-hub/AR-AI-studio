import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { X, QrCode, MapPin, BookOpen } from 'lucide-react';
import { MOCK_BOOKS } from '../data/mockData';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../hooks/useLanguage';
import { BookCover } from '../components/BookCover';

const SHELF_PREFIX = 'ARLIBRARY:SHELF:';
const VALID_SHELVES = ['A-1', 'A-2', 'B-1', 'B-2', 'C-1', 'C-2', 'D-1', 'D-2'];

export function QRScanner() {
  const navigate = useNavigate();
  const { language, dir } = useLanguage();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [detectedShelf, setDetectedShelf] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shelfBooks = detectedShelf
    ? MOCK_BOOKS.filter(b => b.shelf === detectedShelf).slice(0, 4)
    : [];

  const startScanning = () => {
    const el = document.getElementById('qr-reader');
    if (el) el.innerHTML = '';

    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;
    let active = true;

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (text) => {
        if (!active || !text.startsWith(SHELF_PREFIX)) return;
        const shelfId = text.slice(SHELF_PREFIX.length);
        if (!VALID_SHELVES.includes(shelfId)) return;
        active = false;
        scanner.stop().catch(() => {});
        setDetectedShelf(shelfId);
        try { navigator.vibrate?.([80, 40, 80]); } catch { /* best-effort */ }
      },
      () => {}
    ).catch(() => {
      if (active) setError(language === 'ar' ? 'لا يمكن الوصول إلى الكاميرا' : 'Camera unavailable');
    });

    return () => {
      active = false;
      if (scannerRef.current) scannerRef.current.stop().catch(() => {});
    };
  };

  useEffect(() => {
    return startScanning();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRescan = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch { /* ignore */ }
    }
    setDetectedShelf(null);
    setError(null);
    startScanning();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black" dir={dir}>
      <style>{`
        #qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #qr-reader canvas { display: none !important; }
      `}</style>

      {/* Camera feed */}
      <div
        id="qr-reader"
        style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
      />

      {/* Header */}
      <div className={cn(
        'absolute top-0 inset-x-0 z-20 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-black/70 to-transparent',
        dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'
      )}>
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white backdrop-blur-md active:scale-90 transition-transform"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-white text-xs font-black uppercase tracking-widest">
          {language === 'ar' ? 'مسح رمز QR' : 'Scan QR Code'}
        </span>
        <div className="w-11" />
      </div>

      {/* Scanning frame overlay */}
      {!detectedShelf && !error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
          <div className="relative w-64 h-64">
            <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-accent rounded-tl-2xl" />
            <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-accent rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-accent rounded-bl-2xl" />
            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-accent rounded-br-2xl" />
            <motion.div
              className="absolute inset-x-0 h-0.5 bg-accent shadow-[0_0_12px_rgba(217,179,16,0.9)]"
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <p className="mt-8 text-white/70 text-xs font-bold text-center px-10 leading-relaxed">
            {language === 'ar'
              ? 'وجّه الكاميرا نحو رمز QR المطبوع على الرف'
              : 'Point camera at the QR code printed on the shelf'}
          </p>
        </div>
      )}

      {/* Camera error */}
      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 bg-black/90 px-8 text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
            <QrCode className="w-10 h-10 text-red-400" />
          </div>
          <p className="text-white font-bold text-sm">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-4 bg-accent text-primary rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-transform"
          >
            {language === 'ar' ? 'رجوع' : 'Go Back'}
          </button>
        </div>
      )}

      {/* Result bottom sheet */}
      <AnimatePresence>
        {detectedShelf && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="absolute bottom-0 inset-x-0 z-30 bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-6 pb-8 shadow-[0_-20px_60px_rgba(0,0,0,0.5)]"
          >
            <div className="w-10 h-1 bg-slate-200 dark:bg-white/20 rounded-full mx-auto mb-5" />

            <div className={cn('flex items-center gap-3 mb-5', dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-emerald-500" />
              </div>
              <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {language === 'ar' ? 'تم الكشف عن الرف' : 'Shelf Detected'}
                </div>
                <div className="text-2xl font-black text-primary dark:text-white">{detectedShelf}</div>
              </div>
            </div>

            {shelfBooks.length > 0 && (
              <div className="mb-5">
                <div className={cn('text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                  <BookOpen className="w-3.5 h-3.5" />
                  {language === 'ar'
                    ? `${shelfBooks.length} كتب على هذا الرف`
                    : `${shelfBooks.length} books on this shelf`}
                </div>
                <div className={cn('flex gap-3 overflow-x-auto pb-1', dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                  {shelfBooks.map(book => (
                    <div key={book.id} className="flex flex-col items-center gap-1.5 shrink-0">
                      <BookCover book={book} className="w-14 h-20 rounded-xl shadow-md" />
                      <p className="text-[9px] font-bold text-slate-500 w-14 text-center line-clamp-2 leading-tight">{book.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={cn('flex gap-3', dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
              <button
                onClick={handleRescan}
                className="flex-1 py-4 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest hover:border-slate-300 active:scale-95 transition-all"
              >
                {language === 'ar' ? 'مسح مجدداً' : 'Rescan'}
              </button>
              <button
                onClick={() => navigate('/map', { state: { shelfId: detectedShelf, openAR: true } })}
                className="flex-[2] py-4 bg-accent text-primary rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-accent/25 active:scale-95 transition-all"
              >
                <MapPin className="w-4 h-4" />
                {language === 'ar' ? 'عرض على الخريطة' : 'View on Map'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
