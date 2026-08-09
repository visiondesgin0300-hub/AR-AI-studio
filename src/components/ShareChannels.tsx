/**
 * The WhatsApp / email / copy row, shared by every share surface in the app.
 *
 * One implementation so a fix to a tap target, a label, or the way a link is
 * encoded lands everywhere at once — the invitation panel, a book, a facility
 * and the home-page share all render this.
 */

import { useState } from 'react';
import { MessageCircle, Mail, Link2, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';
import { SharePayload, whatsappHref, mailHref, copyShare } from '../lib/share';

interface ShareChannelsProps {
  payload: SharePayload;
  /** 'stack' is one per row on a phone; 'compact' keeps all three in a row. */
  layout?: 'stack' | 'compact';
  /** Overrides the copy button's label, e.g. "Copy invite". */
  copyLabel?: string;
  onCopied?: () => void;
}

export function ShareChannels({ payload, layout = 'stack', copyLabel, onCopied }: ShareChannelsProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!(await copyShare(payload))) return;
    setCopied(true);
    onCopied?.();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('grid gap-2', layout === 'stack' ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-3')}>
      {/* target=_blank + noopener: wa.me is a third-party origin. */}
      <a
        href={whatsappHref(payload)}
        target="_blank"
        rel="noopener noreferrer"
        className="min-h-12 flex items-center justify-center gap-2 px-3 rounded-2xl bg-[#25D366] text-white font-black text-sm shadow-lg shadow-[#25D366]/25 hover:brightness-105 active:scale-95 transition-all"
      >
        <MessageCircle className="w-4 h-4 shrink-0" />
        <span className="truncate">{t('shareViaWhatsApp')}</span>
      </a>

      <a
        href={mailHref(payload)}
        className="min-h-12 flex items-center justify-center gap-2 px-3 rounded-2xl bg-secondary text-white font-black text-sm shadow-lg shadow-secondary/25 hover:brightness-105 active:scale-95 transition-all"
      >
        <Mail className="w-4 h-4 shrink-0" />
        <span className="truncate">{t('shareViaEmail')}</span>
      </a>

      <button
        onClick={copy}
        className={cn(
          'min-h-12 flex items-center justify-center gap-2 px-3 rounded-2xl font-black text-sm border transition-all active:scale-95',
          copied
            ? 'bg-emerald-500 text-white border-emerald-500'
            : 'bg-white dark:bg-slate-900 text-primary dark:text-white border-slate-200 dark:border-white/10 hover:border-secondary'
        )}
      >
        {copied ? <Check className="w-4 h-4 shrink-0" /> : <Link2 className="w-4 h-4 shrink-0" />}
        <span className="truncate">{copied ? t('linkCopied') : (copyLabel ?? t('shareCopy'))}</span>
      </button>
    </div>
  );
}
