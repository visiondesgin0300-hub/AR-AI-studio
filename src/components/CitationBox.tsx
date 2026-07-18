import { useMemo, useState } from 'react';
import { Quote, Copy, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';
import { getCitations, CitationStyle } from '../lib/arCatalog';
import { Book } from '../types';

const STYLES: CitationStyle[] = ['APA', 'MLA', 'Chicago', 'BibTeX'];

interface CitationBoxProps {
  book: Book;
  // 'light' for white pages (BookDetails), 'dark' for the AR info window.
  variant?: 'light' | 'dark';
}

export function CitationBox({ book, variant = 'light' }: CitationBoxProps) {
  const { t, dir } = useLanguage();
  const citations = useMemo(() => getCitations(book), [book]);
  const [style, setStyle] = useState<CitationStyle>('APA');
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(citations[style]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard is best-effort (blocked contexts) */
    }
  };

  const dark = variant === 'dark';

  return (
    <div className={cn(
      'rounded-2xl border p-4 space-y-3',
      dark ? 'bg-white/5 border-white/10' : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-white/5'
    )}>
      <div className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
        <Quote className="w-3.5 h-3.5 text-accent" />
        <span className={cn('text-[10px] font-black uppercase tracking-widest', dark ? 'text-white/70' : 'text-primary dark:text-accent')}>
          {t('citeThisBook')}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5" dir="ltr">
        {STYLES.map((s) => (
          <button
            key={s}
            onClick={() => setStyle(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
              style === s
                ? 'bg-accent text-primary'
                : dark
                  ? 'bg-white/5 text-white/50 hover:text-white/80'
                  : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-white/5 hover:text-primary dark:hover:text-accent'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="relative">
        <pre className={cn(
          'text-[11px] font-mono leading-relaxed whitespace-pre-wrap break-words rounded-xl p-3 pe-11',
          dark ? 'bg-black/30 text-white/80' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-white/5'
        )} dir="ltr">
          {citations[style]}
        </pre>
        <button
          onClick={copy}
          title={t(copied ? 'citeCopiedLabel' : 'citeCopyLabel')}
          className={cn(
            'absolute top-2 flex items-center justify-center w-8 h-8 rounded-lg transition-all active:scale-90',
            dir === 'rtl' ? 'left-2' : 'right-2',
            copied ? 'bg-emerald-500 text-white' : 'bg-accent text-primary hover:brightness-110'
          )}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
