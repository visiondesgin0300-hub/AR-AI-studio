import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';
import { Book } from '../types';
import { CoverScan } from './CoverScan';
import { ArView } from './ArView';

export function ArHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dir } = useLanguage();

  const incomingBook = (location.state as { book?: Book } | null)?.book ?? null;
  const [targetBook, setTargetBook] = useState<Book | null>(incomingBook);

  const handleClose = () => navigate(-1);

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
        {!targetBook ? (
          <motion.div key="cover" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CoverScan embedded onMatch={(book) => setTargetBook(book)} onGoToShelf={(book) => setTargetBook(book)} />
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
