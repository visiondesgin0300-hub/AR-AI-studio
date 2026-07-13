import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ScanLine, Navigation as NavIcon, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';
import { Book } from '../types';
import { CoverScan } from './CoverScan';
import { ArView } from './ArView';

type ArMode = 'cover' | 'navigate';

export function ArHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, dir } = useLanguage();

  const incomingBook = (location.state as { book?: Book } | null)?.book ?? null;
  const [mode, setMode] = useState<ArMode>(incomingBook ? 'navigate' : 'cover');
  const [targetBook, setTargetBook] = useState<Book | null>(incomingBook);

  const handleClose = () => navigate(-1);

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden font-sans" dir={dir}>
      {/* Unified mode switcher - the single entry point for both AR experiences */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40 flex gap-1.5 p-1.5 rounded-2xl bg-black/50 border border-white/15 backdrop-blur-xl shadow-2xl">
        <button
          onClick={() => setMode('cover')}
          className={cn(
            'px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all',
            mode === 'cover' ? 'bg-accent text-primary' : 'text-white/60 hover:text-white'
          )}
        >
          <ScanLine className="w-4 h-4" />
          <span className="hidden sm:inline">{t('arModeCoverScan')}</span>
        </button>
        <button
          onClick={() => targetBook && setMode('navigate')}
          disabled={!targetBook}
          title={!targetBook ? t('arNavigateHint') : undefined}
          className={cn(
            'px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all',
            mode === 'navigate' ? 'bg-accent text-primary' : targetBook ? 'text-white/60 hover:text-white' : 'text-white/20 cursor-not-allowed'
          )}
        >
          <NavIcon className="w-4 h-4" />
          <span className="hidden sm:inline">{t('arModeNavigate')}</span>
        </button>
      </div>

      <button
        onClick={handleClose}
        className={cn(
          'absolute top-8 z-40 p-4 bg-primary/20 hover:bg-primary border border-white/20 backdrop-blur-xl rounded-2xl text-white transition-all shadow-2xl active:scale-90',
          dir === 'rtl' ? 'left-8' : 'right-8'
        )}
      >
        <X className="w-5 h-5" />
      </button>

      <AnimatePresence mode="wait">
        {mode === 'cover' ? (
          <motion.div key="cover" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CoverScan
              embedded
              onMatch={(book) => setTargetBook(book)}
              onGoToShelf={(book) => {
                setTargetBook(book);
                setMode('navigate');
              }}
            />
          </motion.div>
        ) : (
          targetBook && (
            <motion.div key="navigate" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ArView book={targetBook} onClose={() => setMode('cover')} />
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
}
