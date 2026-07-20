import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, BookOpen, Filter } from 'lucide-react';
import { MOCK_BOOKS } from '../data/mockData';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';

const SHELVES = ['all', 'A-1', 'A-2', 'B-1', 'B-2', 'C-1', 'C-2', 'D-1', 'D-2'];

const CATEGORY_COLORS: Record<string, string> = {
  'فيزياء':    '#1B3A6B',
  'هندسة':     '#2D5A27',
  'علم نفس':   '#7B2D8B',
  'عام':       '#004C6D',
};

function getCategoryColor(category?: string) {
  return CATEGORY_COLORS[category ?? ''] ?? '#004C6D';
}

export function BookQRPrint() {
  const { language, dir } = useLanguage();
  const ar = language === 'ar';
  const [filterShelf, setFilterShelf] = useState<string>('all');

  const books = filterShelf === 'all'
    ? MOCK_BOOKS
    : MOCK_BOOKS.filter(b => b.shelf === filterShelf);

  return (
    <div className={cn('flex flex-col gap-8 animate-in duration-500', dir === 'rtl' ? 'text-right' : 'text-left')}>

      {/* ── Header ── */}
      <div className={cn('flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden', dir === 'rtl' ? 'md:flex-row-reverse' : '')}>
        <div>
          <div className={cn('flex items-center gap-3 mb-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
            <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center text-accent">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">AR BOOK CODES</span>
          </div>
          <h1 className="text-3xl font-black text-primary dark:text-white tracking-tight">
            {ar ? 'رموز AR للكتب' : 'Book AR Codes'}
          </h1>
          <p className="text-slate-400 font-bold mt-1 text-sm leading-relaxed">
            {ar
              ? 'اطبع هذه الرموز وضعها على ظهور الكتب أو على الرف — امسحها للوصول الفوري لمعلومات الكتاب.'
              : 'Print and attach to book spines or shelf positions — scan to instantly access book details.'}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-3 px-6 py-3.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 shrink-0"
        >
          <Printer className="w-4 h-4" />
          {ar ? 'طباعة الكل' : 'Print All'}
        </button>
      </div>

      {/* ── Shelf filter ── */}
      <div className={cn('flex flex-wrap gap-2 print:hidden', dir === 'rtl' ? 'flex-row-reverse' : '')}>
        <span className={cn('flex items-center gap-1.5 text-xs font-black text-slate-400 self-center', dir === 'rtl' ? 'flex-row-reverse' : '')}>
          <Filter className="w-3.5 h-3.5" />
          {ar ? 'تصفية:' : 'Filter:'}
        </span>
        {SHELVES.map(s => (
          <button
            key={s}
            onClick={() => setFilterShelf(s)}
            className={cn(
              'px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all',
              filterShelf === s
                ? 'bg-primary text-white border-primary dark:bg-accent dark:text-primary dark:border-accent'
                : 'bg-white dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10 hover:border-primary/40'
            )}
          >
            {s === 'all' ? (ar ? 'الكل' : 'All') : s}
          </button>
        ))}
        <span className="text-[10px] font-bold text-slate-400 self-center">
          {ar ? `${books.length} كتاب` : `${books.length} books`}
        </span>
      </div>

      {/* ── QR Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 print:grid-cols-4 print:gap-3">
        {books.map(book => {
          const qrValue = `ARLIBRARY:BOOK:${book.id}`;
          const color = getCategoryColor(book.category);
          const shortTitle = book.title.length > 40 ? book.title.slice(0, 38) + '…' : book.title;

          return (
            <div
              key={book.id}
              className="flex flex-col items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/10 shadow-sm text-center print:rounded-lg print:border print:border-slate-200 print:shadow-none print:break-inside-avoid"
            >
              {/* Color stripe (category indicator) */}
              <div
                className="w-full h-1.5 rounded-full"
                style={{ backgroundColor: color }}
              />

              {/* QR Code */}
              <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                <QRCodeSVG
                  value={qrValue}
                  size={110}
                  level="H"
                  includeMargin={false}
                  fgColor={color}
                />
              </div>

              {/* Shelf badge */}
              <div
                className="px-2.5 py-0.5 rounded-full text-white text-[9px] font-black uppercase tracking-wider"
                style={{ backgroundColor: color }}
              >
                {ar ? `رف ${book.shelf}` : `Shelf ${book.shelf}`}
              </div>

              {/* Book info */}
              <div className="w-full space-y-0.5">
                <p className="text-[10px] font-black text-slate-800 dark:text-white leading-tight line-clamp-2">
                  {shortTitle}
                </p>
                <p className="text-[9px] font-bold text-slate-400 leading-tight truncate">
                  {book.author}
                </p>
              </div>

              {/* QR value ref */}
              <div className="w-full px-1.5 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <p className="text-[7px] font-mono text-slate-300 dark:text-slate-600 break-all leading-tight">
                  {qrValue}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Instructions ── */}
      <div className="official-card p-6 bg-white dark:bg-slate-900 print:hidden">
        <h3 className="text-xs font-black text-primary dark:text-white uppercase tracking-widest mb-3">
          {ar ? 'كيفية الاستخدام' : 'How to Use'}
        </h3>
        <div className={cn('grid sm:grid-cols-2 gap-4', dir === 'rtl' ? 'text-right' : 'text-left')}>
          <ol className="space-y-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            {(ar ? [
              'اضغط "طباعة الكل" أو صفّح حسب الرف',
              'اطبع على ورق ملصق (A4)',
              'قصّ كل بطاقة وضعها على ظهر الكتاب أو على حافة الرف',
              'تأكد من وضوح الباركود وعدم وجود ثنيات',
            ] : [
              'Click "Print All" or filter by shelf',
              'Print on label or standard A4 paper',
              'Cut each card and attach to book spine or shelf edge',
              'Ensure barcode is flat and clearly visible',
            ]).map((step, i) => (
              <li key={i} className={cn('flex items-start gap-2.5', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                <span className="shrink-0 w-5 h-5 rounded-full bg-primary dark:bg-accent text-white dark:text-primary text-[10px] font-black flex items-center justify-center mt-0.5">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="space-y-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <p className="font-black text-primary dark:text-white text-[10px] uppercase tracking-wider mb-1">
              {ar ? 'لمسح الباركود:' : 'To scan:'}
            </p>
            {(ar ? [
              'افتح تطبيق المكتبة → زر الكاميرا AR',
              'أو افتح /scan مباشرة',
              'وجّه الكاميرا نحو الباركود',
              'تفتح صفحة الكتاب فوراً مع كامل التفاصيل',
            ] : [
              'Open the library app → AR camera button',
              'Or go to /scan directly',
              'Point camera at the barcode',
              'Book details page opens instantly',
            ]).map((tip, i) => (
              <li key={i} className={cn('flex items-start gap-2.5 list-none', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                <span className="shrink-0 text-accent">→</span>
                <span>{tip}</span>
              </li>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          header, nav, aside, .fixed, button, .print\\:hidden { display: none !important; }
          body { background: white !important; }
          .official-card { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
