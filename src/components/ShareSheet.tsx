/**
 * The share dialog for a single thing — a book, a facility, the app itself.
 *
 * It shows the message before it is sent, because the student is about to
 * send it under their own name and should be able to read it first. The panel
 * is capped at the viewport with its body scrolling inside: an uncapped
 * centred overlay grows past the top of a short screen and takes its close
 * button with it, which is exactly how the book summary modal used to trap
 * people on a 375x667 display.
 */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';
import { SharePayload, canNativeShare, openNativeShare } from '../lib/share';
import { ShareChannels } from './ShareChannels';

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  /** Heading of the dialog, e.g. the book or facility name. */
  title: string;
  payload: SharePayload;
}

export function ShareSheet({ open, onClose, title, payload }: ShareSheetProps) {
  const { t } = useLanguage();

  // Escape closes it. Without this the only way out on a desktop keyboard is
  // to find and click the X.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Rendered into <body>: several of the pages that open this sit inside
  // animated (transformed) subtrees, and a transformed ancestor becomes the
  // containing block for fixed positioning — the overlay would be trapped
  // inside the card instead of covering the screen.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-primary/30 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 16 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-md max-h-[calc(100dvh-2rem)] flex flex-col gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-3xl shadow-2xl p-5 sm:p-6"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-secondary/10 dark:bg-secondary/20 shrink-0">
                <Share2 className="w-5 h-5 text-secondary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {t('shareTitle')}
                </p>
                <h2 className="text-base font-black text-primary dark:text-white leading-tight mt-0.5 break-words">
                  {title}
                </h2>
              </div>
              <button
                onClick={onClose}
                title={t('close')}
                className="w-11 h-11 shrink-0 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white active:scale-90 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="min-h-0 overflow-y-auto rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 p-3.5">
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium whitespace-pre-line break-words">
                {payload.message}
              </p>
            </div>

            <ShareChannels payload={payload} />

            {canNativeShare() && (
              <button
                onClick={() => openNativeShare(payload)}
                className={cn(
                  'min-h-11 w-full flex items-center justify-center gap-2 rounded-2xl',
                  'text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400',
                  'hover:text-secondary active:scale-95 transition-all'
                )}
              >
                <Share2 className="w-3.5 h-3.5" />
                {t('shareMore')}
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
