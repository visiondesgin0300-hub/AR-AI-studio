import { QRCodeSVG } from 'qrcode.react';
import { Printer, QrCode } from 'lucide-react';
import { MOCK_BOOKS } from '../data/mockData';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';

const SHELVES = ['A-1', 'A-2', 'B-1', 'B-2', 'C-1', 'C-2', 'D-1', 'D-2'];
const SECTION_NAMES: Record<string, { ar: string; en: string }> = {
  A: { ar: 'العلوم الطبيعية', en: 'Natural Sciences' },
  B: { ar: 'الهندسة والتقنية', en: 'Engineering & Tech' },
  C: { ar: 'الفنون والآداب', en: 'Arts & Humanities' },
  D: { ar: 'العلوم الإنسانية', en: 'Human Sciences' },
};

export function ShelfQRPrint() {
  const { language, dir } = useLanguage();

  return (
    <div className={cn('flex flex-col gap-8 animate-in duration-500', dir === 'rtl' ? 'text-right' : 'text-left')}>
      {/* Header */}
      <div className={cn('flex flex-col md:flex-row items-start md:items-center justify-between gap-4', dir === 'rtl' ? 'md:flex-row-reverse' : '')}>
        <div>
          <div className={cn('flex items-center gap-3 mb-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
            <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center text-accent">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">
              {language === 'ar' ? 'طباعة رموز QR' : 'QR Code Print'}
            </span>
          </div>
          <h1 className="text-3xl font-black text-primary dark:text-white tracking-tight">
            {language === 'ar' ? 'رموز QR للأرفف' : 'Shelf QR Codes'}
          </h1>
          <p className="text-slate-400 font-bold mt-1 text-sm">
            {language === 'ar'
              ? 'اطبع هذه الرموز وضعها على الأرفف لتفعيل المسح التلقائي'
              : 'Print and place these on shelves to enable automatic scanning'}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-3 px-6 py-3.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          <Printer className="w-4 h-4" />
          {language === 'ar' ? 'طباعة الكل' : 'Print All'}
        </button>
      </div>

      {/* QR Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 print:grid-cols-4">
        {SHELVES.map(shelfId => {
          const sectionKey = shelfId.split('-')[0];
          const sectionName = SECTION_NAMES[sectionKey];
          const bookCount = MOCK_BOOKS.filter(b => b.shelf === shelfId).length;
          const qrValue = `ARLIBRARY:SHELF:${shelfId}`;

          return (
            <div
              key={shelfId}
              className="official-card flex flex-col items-center gap-4 p-6 bg-white dark:bg-slate-900 text-center print:border print:border-slate-200 print:shadow-none"
            >
              {/* QR Code */}
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 dark:border-white/10">
                <QRCodeSVG
                  value={qrValue}
                  size={150}
                  level="H"
                  includeMargin={false}
                  fgColor="#004C6D"
                />
              </div>

              {/* Shelf label */}
              <div>
                <div className="text-3xl font-black text-primary dark:text-white tracking-tight">{shelfId}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                  {language === 'ar' ? sectionName?.ar : sectionName?.en}
                </div>
                <div className="text-[9px] font-bold text-slate-300 dark:text-slate-600 mt-1">
                  {language === 'ar' ? `${bookCount} كتاب` : `${bookCount} books`}
                </div>
              </div>

              {/* QR value for admin reference */}
              <div className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <p className="text-[8px] font-mono text-slate-400 break-all leading-tight">{qrValue}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Print instructions */}
      <div className="official-card p-6 bg-white dark:bg-slate-900">
        <h3 className="text-xs font-black text-primary dark:text-white uppercase tracking-widest mb-3">
          {language === 'ar' ? 'تعليمات التركيب' : 'Installation Instructions'}
        </h3>
        <ol className={cn('space-y-2 text-xs font-bold text-slate-500 dark:text-slate-400', dir === 'rtl' ? 'text-right' : 'text-left')}>
          {(language === 'ar'
            ? [
                'اطبع الصفحة (يُفضَّل طباعة ملصقات)',
                'قصّ كل رمز QR مع تسميته',
                'ضعه على الجانب الأمامي للرف المقابل',
                'تأكد من وضوح الرمز وعدم وجود عوائق',
              ]
            : [
                'Print this page (label paper preferred)',
                'Cut each QR code with its label',
                'Attach to the front face of the corresponding shelf',
                'Ensure the code is clearly visible with no obstructions',
              ]
          ).map((step, i) => (
            <li key={i} className={cn('flex items-start gap-2.5', dir === 'rtl' ? 'flex-row-reverse' : '')}>
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary dark:bg-accent text-white dark:text-primary text-[10px] font-black flex items-center justify-center mt-0.5">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <style>{`
        @media print {
          header, nav, aside, .fixed, button { display: none !important; }
          body { background: white !important; }
          .official-card { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
