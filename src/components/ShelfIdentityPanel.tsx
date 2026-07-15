import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, Layers } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';
import { getMarkerForShelf } from '../lib/arMarkers';
import { Book } from '../types';

interface ShelfIdentityPanelProps {
  shelfId: string;
  booksOnShelf: Book[];
}

export function ShelfIdentityPanel({ shelfId, booksOnShelf }: ShelfIdentityPanelProps) {
  const { t, dir } = useLanguage();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const markerId = getMarkerForShelf(shelfId);
  const markerUrl = markerId !== undefined ? `/ar/markers/marker-${markerId}.png` : null;

  useEffect(() => {
    let cancelled = false;
    const qrValue = `${window.location.origin}/map?shelf=${encodeURIComponent(shelfId)}`;
    QRCode.toDataURL(qrValue, { margin: 1, width: 240, color: { dark: '#01354C', light: '#FFFFFF' } })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(null); });
    return () => { cancelled = true; };
  }, [shelfId]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!doctype html>
      <html dir="${dir}">
        <head>
          <meta charset="utf-8" />
          <title>${t('printSheetTitle')} · ${shelfId}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 40px; }
            h1 { font-size: 20px; }
            .row { display: flex; gap: 32px; justify-content: center; align-items: flex-start; margin-top: 24px; }
            .col { display: flex; flex-direction: column; align-items: center; gap: 8px; }
            img { width: 220px; height: 220px; object-fit: contain; border: 1px solid #ddd; padding: 12px; }
            span { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }
          </style>
        </head>
        <body>
          <h1>${t('printSheetTitle')} · ${shelfId}</h1>
          <div class="row">
            ${markerUrl ? `<div class="col"><img src="${markerUrl}" alt="AR marker" /><span>${t('arMarkerLabel')}</span></div>` : ''}
            ${qrDataUrl ? `<div class="col"><img src="${qrDataUrl}" alt="QR code" /><span>${t('qrCodeLabel')}</span></div>` : ''}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="official-card p-6 bg-white dark:bg-slate-900 space-y-6">
      <div className={cn("flex items-center gap-2", dir === 'rtl' ? 'flex-row-reverse text-right' : 'flex-row text-left')}>
        <Layers className="w-4 h-4 text-accent" />
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">{t('shelfIdentityEyebrow')}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl p-4">
          {markerUrl ? (
            <img src={markerUrl} alt="" className="w-20 h-20 object-contain bg-white rounded-xl p-1.5" />
          ) : (
            <div className="w-20 h-20 flex items-center justify-center text-[9px] text-slate-400 font-bold text-center">--</div>
          )}
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('arMarkerLabel')}</span>
        </div>
        <div className="flex flex-col items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-2xl p-4">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="" className="w-20 h-20 object-contain bg-white rounded-xl p-1.5" />
          ) : (
            <div className="w-20 h-20 flex items-center justify-center text-[9px] text-slate-400 font-bold text-center">--</div>
          )}
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('qrCodeLabel')}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('booksOnThisShelfLabel')}</div>
        {booksOnShelf.length > 0 ? (
          <ul className="space-y-1.5">
            {booksOnShelf.map((b) => (
              <li key={b.id} className={cn("text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 rounded-xl px-3 py-2 truncate", dir === 'rtl' ? 'text-right' : 'text-left')}>
                {b.title}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">{t('noOtherBooksOnShelf')}</p>
        )}
      </div>

      <button
        onClick={handlePrint}
        disabled={!markerUrl && !qrDataUrl}
        className="w-full py-3.5 border-2 border-primary/15 dark:border-white/10 text-primary dark:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:border-accent hover:text-accent transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
      >
        <Printer className="w-4 h-4" />
        {t('printMarkerAndQrLabel')}
      </button>
    </div>
  );
}
