import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { X, QrCode, MapPin, BookOpen, RefreshCw, Loader2 } from 'lucide-react';
import { MOCK_BOOKS, SHELF_IDS } from '../data/mockData';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../hooks/useLanguage';
import { BookCover } from '../components/BookCover';

const SHELF_PREFIX  = 'ARLIBRARY:SHELF:';
const BOOK_PREFIX   = 'ARLIBRARY:BOOK:';
const BOOK_URL_RE   = /\/book\/([^/?#]+)/;
// Must match the codes the admin panel prints. This copy stopped at D-2,
// so a genuine ARLIBRARY:SHELF:B-3 sticker scanned as nothing at all.
const VALID_SHELVES: readonly string[] = SHELF_IDS;

type Phase = 'loading' | 'scanning' | 'shelf' | 'error';

/**
 * Why the camera did not start. The page used to show one message for every
 * cause — and, worse, could sit on the spinner for ever: if the browser's
 * permission prompt is never answered, getUserMedia simply never settles, so
 * nothing moved the page off "Starting camera…".
 */
type CameraFault = 'denied' | 'none' | 'busy' | 'insecure' | 'timeout' | 'unknown';

/** How long to wait for the camera before assuming the prompt went unanswered. */
const CAMERA_TIMEOUT_MS = 15_000;

/**
 * Reject if `work` has not settled within the deadline.
 *
 * Every step here can hang, not just the last one: getCameras() asks for
 * permission too, so an unanswered prompt stalls before the scanner even
 * starts. Each awaited step gets the deadline, not only the final one.
 */
function withDeadline<T>(work: Promise<T>, ms = CAMERA_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    work,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new DOMException('timeout', 'TimeoutError')), ms)),
  ]);
}

/** Map a getUserMedia rejection to the thing the reader has to do about it. */
function classifyCameraError(err: unknown): CameraFault {
  const name = (err as DOMException | undefined)?.name ?? '';
  const text = String((err as Error | undefined)?.message ?? err ?? '');
  if (name === 'TimeoutError') return 'timeout';
  if (name === 'NotAllowedError' || name === 'SecurityError' || /permission|denied/i.test(text)) return 'denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'DevicesNotFoundError'
      || /not ?found|no camera/i.test(text)) return 'none';
  if (name === 'NotReadableError' || name === 'TrackStartError' || /in use|busy/i.test(text)) return 'busy';
  return 'unknown';
}

export function QRScanner() {
  const navigate = useNavigate();
  const { language, dir } = useLanguage();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const activeRef  = useRef(true);
  const [phase, setPhase] = useState<Phase>('loading');
  const [detectedShelf, setDetectedShelf] = useState<string | null>(null);
  const [fault, setFault] = useState<CameraFault>('unknown');

  const shelfBooks = detectedShelf
    ? MOCK_BOOKS.filter(b => b.shelf === detectedShelf).slice(0, 4)
    : [];

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const stopScanner = () => {
    activeRef.current = false;
    scannerRef.current?.stop().catch(() => {});
    scannerRef.current = null;
  };

  const onScan = (text: string) => {
    if (!activeRef.current) return;
    try { navigator.vibrate?.([80, 40, 80]); } catch { /* best-effort */ }

    const urlMatch = BOOK_URL_RE.exec(text);
    if (urlMatch) {
      const found = MOCK_BOOKS.find(b => b.id === urlMatch[1]);
      if (found) { stopScanner(); navigate(`/book/${found.id}`); return; }
    }
    if (text.startsWith(BOOK_PREFIX)) {
      const found = MOCK_BOOKS.find(b => b.id === text.slice(BOOK_PREFIX.length));
      if (found) { stopScanner(); navigate(`/book/${found.id}`); return; }
    }
    if (text.startsWith(SHELF_PREFIX)) {
      const shelfId = text.slice(SHELF_PREFIX.length);
      if (!VALID_SHELVES.includes(shelfId)) return;
      stopScanner(); setDetectedShelf(shelfId); setPhase('shelf');
    }
  };

  const startScanner = async () => {
    activeRef.current = true;
    setPhase('loading');
    setDetectedShelf(null);

    // A camera needs a secure context. On plain http, navigator.mediaDevices
    // is undefined and every call below would throw something unhelpful.
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setFault('insecure');
      setPhase('error');
      return;
    }

    const el = document.getElementById('qr-reader');
    if (el) el.innerHTML = '';

    // Yield one frame so the browser finishes layout before the library
    // reads parentElement.clientWidth to size the video element.
    await new Promise<void>(r => requestAnimationFrame(() => r()));

    if (!activeRef.current) return;

    const scanner = new Html5Qrcode('qr-reader');
    scannerRef.current = scanner;
    const cfg = { fps: 10 };
    const onErr = () => {};

    try {
      // Enumerate cameras with device IDs — more reliable than facingMode on
      // Android where exact facingMode constraints sometimes return black frames.
      const cameras = await withDeadline(Html5Qrcode.getCameras()).catch(err => {
        if ((err as DOMException)?.name === 'TimeoutError') throw err;
        return [] as { id: string; label: string }[];
      });

      let cameraId: string | undefined;
      if (cameras.length === 1) {
        cameraId = cameras[0].id;
      } else if (cameras.length > 1) {
        const back = cameras.find(c => /back|rear|environment/i.test(c.label))
          ?? cameras[cameras.length - 1];
        cameraId = back.id;
      }

      if (!activeRef.current) return;

      const start = cameraId
        ? scanner.start(cameraId, cfg, onScan, onErr)
        : scanner.start({ facingMode: { exact: 'environment' } }, cfg, onScan, onErr)
            .catch(() => scanner.start({ facingMode: 'environment' }, cfg, onScan, onErr));

      await withDeadline(start);
      if (activeRef.current) setPhase('scanning');
    } catch (err) {
      if (!activeRef.current) return;
      setFault(classifyCameraError(err));
      setPhase('error');
    }
  };

  useEffect(() => {
    startScanner();
    return stopScanner;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRescan = () => {
    stopScanner();
    startScanner();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black" dir={dir}>
      <style>{`
        /* Hide Html5Qrcode's dashboard — we draw our own UI */
        #qr-reader__header_message,
        #qr-reader__dashboard { display: none !important; }

        /* Video fills viewport regardless of the inline width the library sets */
        #qr-reader video {
          position: fixed !important;
          top: 0 !important; left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          object-fit: cover !important;
          z-index: 0 !important;
        }
        #qr-reader canvas { display: none !important; }
      `}</style>

      {/* Camera feed container */}
      <div id="qr-reader" style={{ position: 'fixed', inset: 0, zIndex: 0 }} />

      {/* Header — always on top */}
      <div className={cn(
        'fixed top-0 inset-x-0 z-20 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-black/70 to-transparent',
        dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'
      )}>
        <button
          onClick={() => { stopScanner(); navigate(-1); }}
          className="w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white backdrop-blur-md active:scale-90 transition-transform"
        >
          <X className="w-5 h-5" />
        </button>
        <span className="text-white text-xs font-black uppercase tracking-widest">
          {t('مسح رمز QR', 'Scan QR Code')}
        </span>
        <div className="w-11" />
      </div>

      {/* Loading spinner */}
      <AnimatePresence>
        {phase === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-10 flex flex-col items-center justify-center gap-4"
          >
            <Loader2 className="w-10 h-10 text-accent animate-spin" />
            <p className="text-white/60 text-xs font-bold">
              {t('جارٍ تشغيل الكاميرا…', 'Starting camera…')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan frame — visible only while scanning */}
      {phase === 'scanning' && (
        <div className="fixed inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
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
            {t('وجّه الكاميرا نحو رمز AR الخاص بالكتاب أو الرف', 'Point camera at a book AR code or shelf QR code')}
          </p>
        </div>
      )}

      {/* Camera error */}
      <AnimatePresence>
        {phase === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-black/95 px-8 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
              <QrCode className="w-10 h-10 text-red-400" />
            </div>
            <div>
              <p className="text-white font-bold text-base mb-2">
                {fault === 'none'
                  ? t('لا توجد كاميرا في هذا الجهاز', 'No camera on this device')
                  : fault === 'busy'
                  ? t('الكاميرا مشغولة بتطبيق آخر', 'The camera is in use by another app')
                  : fault === 'insecure'
                  ? t('الكاميرا تتطلب اتصالاً آمناً', 'The camera needs a secure connection')
                  : fault === 'timeout'
                  ? t('لم يصل إذن الكاميرا', 'No answer to the camera prompt')
                  : t('لا يمكن الوصول إلى الكاميرا', 'Camera unavailable')}
              </p>
              <p className="text-white/50 text-xs leading-relaxed">
                {fault === 'none'
                  ? t('افتح هذه الصفحة على هاتف فيه كاميرا خلفية.',
                      'Open this page on a phone with a rear camera.')
                  : fault === 'busy'
                  ? t('أغلق التطبيقات أو التبويبات الأخرى التي تستعمل الكاميرا ثم أعد المحاولة.',
                      'Close other apps or tabs using the camera, then try again.')
                  : fault === 'insecure'
                  ? t('افتح الموقع عبر https، فالمتصفح لا يمنح الكاميرا لاتصال غير آمن.',
                      'Open the site over https — browsers do not grant camera access otherwise.')
                  : fault === 'timeout'
                  ? t('يظهر طلب الإذن بجانب شريط العنوان. اسمح بالوصول إلى الكاميرا ثم أعد المحاولة.',
                      'The permission prompt appears next to the address bar. Allow camera access, then try again.')
                  : t('امنح إذن الكاميرا لهذا المتصفح من إعدادات الموقع، ثم أعد المحاولة.',
                      'Grant camera permission to this browser in the site settings, then try again.')}
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <button
                onClick={handleRescan}
                className="w-full py-4 bg-accent text-primary rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <RefreshCw className="w-4 h-4" />
                {t('حاول مرة أخرى', 'Try Again')}
              </button>
              <button
                onClick={() => { stopScanner(); navigate(-1); }}
                className="w-full py-3.5 rounded-2xl border border-white/10 text-white/50 text-xs font-black uppercase tracking-widest active:scale-95 transition-transform"
              >
                {t('رجوع', 'Go Back')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shelf result bottom sheet */}
      <AnimatePresence>
        {phase === 'shelf' && detectedShelf && (
          <motion.div
            key="shelf"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-slate-900 rounded-t-[2.5rem] p-6 pb-8 shadow-[0_-20px_60px_rgba(0,0,0,0.5)]"
          >
            <div className="w-10 h-1 bg-slate-200 dark:bg-white/20 rounded-full mx-auto mb-5" />

            <div className={cn('flex items-center gap-3 mb-5', dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-emerald-500" />
              </div>
              <div className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {t('تم الكشف عن الرف', 'Shelf Detected')}
                </div>
                <div className="text-2xl font-black text-primary dark:text-white">{detectedShelf}</div>
              </div>
            </div>

            {shelfBooks.length > 0 && (
              <div className="mb-5">
                <div className={cn('text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                  <BookOpen className="w-3.5 h-3.5" />
                  {language === 'ar' ? `${shelfBooks.length} كتب على هذا الرف` : `${shelfBooks.length} books on this shelf`}
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

            <div className="flex flex-col gap-2">
              <button
                // '/shelf-ar' was never a route — the catch-all silently redirected the
                // main action of the whole scan flow to the home page. The page is
                // registered at '/shelf-scan'.
                onClick={() => navigate('/shelf-scan', { state: { shelfId: detectedShelf } })}
                className="w-full py-4 bg-accent text-primary rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-accent/25 active:scale-95 transition-all"
              >
                <BookOpen className="w-4 h-4" />
                {t('مسح كتب الرف بـ AR', 'AR Shelf Scan')}
              </button>
              <div className={cn('flex gap-2', dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                <button
                  onClick={handleRescan}
                  className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest hover:border-slate-300 active:scale-95 transition-all"
                >
                  {t('مسح مجدداً', 'Rescan')}
                </button>
                <button
                  onClick={() => navigate('/map', { state: { shelfId: detectedShelf, openAR: true } })}
                  className="flex-1 py-3.5 rounded-2xl border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:border-slate-300 active:scale-95 transition-all"
                >
                  <MapPin className="w-4 h-4" />
                  {t('الخريطة', 'Map')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
