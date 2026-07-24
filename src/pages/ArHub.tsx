import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ScanLine, Sparkles, X, Cpu } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';
import { Book } from '../types';
import { MOCK_BOOKS } from '../data/mockData';
import { CoverScan } from './CoverScan';
import { ArView } from './ArView';

const SIMULATION_DURATION_MS = 2400;

function pickFallbackBook(excludeId: string | null): Book {
  const pool = MOCK_BOOKS.filter((b) => b.id !== excludeId);
  const list = pool.length > 0 ? pool : MOCK_BOOKS;
  return list[Math.floor(Math.random() * list.length)];
}

export function ArHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, dir, language } = useLanguage();

  const incomingBook = (location.state as { book?: Book } | null)?.book ?? null;
  const [targetBook, setTargetBook] = useState<Book | null>(incomingBook);
  const [isSimulating, setIsSimulating] = useState(false);
  const lastSimulatedBookId = useRef<string | null>(null);

  const handleClose = () => navigate(-1);

  const startSimulation = () => setIsSimulating(true);

  // Camera-free demo: fakes the scan-and-match step, then hands off to the
  // existing step-by-step map navigation instead of the camera-dependent
  // ArView, so a student without a camera or a real book cover can still see
  // how the smart navigation experience works end to end. The AI picks a
  // varied book on each run so repeated simulations don't always land on the
  // same shelf; if the request fails, fall back to a random pick locally.
  useEffect(() => {
    if (!isSimulating) return;
    let cancelled = false;

    const minDelay = new Promise<void>((resolve) => setTimeout(resolve, SIMULATION_DURATION_MS));
    const pickBook = fetch('/api/simulate-scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ excludeId: lastSimulatedBookId.current }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Server response error'))))
      .then((data: { bookId?: string }) => MOCK_BOOKS.find((b) => b.id === data.bookId) ?? pickFallbackBook(lastSimulatedBookId.current))
      .catch(() => pickFallbackBook(lastSimulatedBookId.current));

    Promise.all([pickBook, minDelay]).then(([book]) => {
      if (cancelled) return;
      lastSimulatedBookId.current = book.id;
      navigate('/map', { state: { bookId: book.id } });
    });

    return () => { cancelled = true; };
  }, [isSimulating, navigate]);

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden font-sans" dir={dir}>
      <button
        onClick={handleClose}
        className={cn(
          'absolute top-8 z-40 p-4 bg-primary/20 hover:bg-primary border border-white/20 backdrop-blur-xl rounded-2xl text-white transition-all shadow-2xl active:scale-90',
          dir === 'rtl' ? 'left-8' : 'right-8'
        )}
      >
        <X className="w-5 h-5" />
      </button>

      {/* Single continuous flow: scan a cover, then automatically guide to its
          shelf - no manual mode switcher to manage. */}
      <AnimatePresence mode="wait">
        {isSimulating ? (
          <motion.div key="simulation" className="absolute inset-0 flex flex-col items-center justify-center gap-6 text-center px-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="px-4 py-1.5 rounded-full bg-accent/20 border border-accent/40 text-accent text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              {t('simulationBadge')}
            </div>
            <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <ScanLine className="w-16 h-16 text-accent" />
            </motion.div>
            <p className="text-white font-black text-sm uppercase tracking-widest max-w-xs">
              {t('simulationScanningText')}
            </p>
          </motion.div>
        ) : !targetBook ? (
          <motion.div key="cover" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CoverScan embedded onMatch={(book) => setTargetBook(book)} onGoToShelf={(book) => setTargetBook(book)} />
            <div className={cn('absolute bottom-8 z-20 left-0 right-0 flex flex-col items-center gap-3 px-10 pointer-events-none')}>
              <button
                onClick={startSimulation}
                className="pointer-events-auto flex flex-col items-center gap-1.5 px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl text-white transition-all active:scale-95"
              >
                <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest">
                  <Sparkles className="w-4 h-4 text-accent" />
                  {t('trySimulationLabel')}
                </span>
                <span className="text-[10px] font-bold text-white/60 max-w-xs leading-relaxed">
                  {t('trySimulationDesc')}
                </span>
              </button>
              <button
                onClick={() => navigate('/ar-lab')}
                className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent/90 hover:bg-accent text-primary text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
              >
                <Cpu className="w-4 h-4" />
                {t('arLabEntryLabel')}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="navigate" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ArView book={targetBook} onClose={() => setTargetBook(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
