import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ScanLine, Cpu, Sparkles, MapPin, User as UserIcon, Radar, BookOpen, Play } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';
import { MOCK_BOOKS } from '../data/mockData';
import { getArBookMeta } from '../lib/arCatalog';
import { CitationBox } from '../components/CitationBox';
import { Book } from '../types';

// A camera-free "AR shelf scan" simulation: a row of colorful book spines the
// student taps to trigger a holographic AR info window (LC call number,
// subject class, publisher, plus an AI academic summary), alongside live-ish
// AR telemetry readouts. Showcases the whole recognition pipeline as an
// interactive demo without needing a real camera or printed markers.
export function ArLab() {
  const navigate = useNavigate();
  const { t, dir, language } = useLanguage();

  // A representative slice of the catalog across sections, so the shelf shows
  // a varied spread of subjects rather than seven physics books in a row.
  const shelfBooks = useMemo(() => {
    const seen = new Set<string>();
    const picks: Book[] = [];
    for (const b of MOCK_BOOKS) {
      const section = b.shelf?.split('-')[0] ?? '?';
      if (!seen.has(section)) { seen.add(section); picks.push(b); }
    }
    for (const b of MOCK_BOOKS) {
      if (picks.length >= 7) break;
      if (!picks.includes(b)) picks.push(b);
    }
    return picks.slice(0, 7);
  }, []);

  const [selected, setSelected] = useState<Book | null>(null);
  const [scanning, setScanning] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const meta = selected ? getArBookMeta(selected) : null;

  // Fetch the AI academic summary whenever a new book is scanned. The endpoint
  // always resolves with a usable summary (Gemini or a local fallback).
  useEffect(() => {
    if (!selected) { setSummary(null); return; }
    let cancelled = false;
    setLoadingSummary(true);
    setSummary(null);
    fetch('/api/book-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: selected.title, author: selected.author,
        category: selected.category, description: selected.description,
      }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad response'))))
      .then((d: { summary?: string }) => { if (!cancelled) setSummary(d.summary || selected.description); })
      .catch(() => { if (!cancelled) setSummary(selected.description); })
      .finally(() => { if (!cancelled) setLoadingSummary(false); });
    return () => { cancelled = true; };
  }, [selected]);

  const scan = (book: Book) => {
    setScanning(true);
    if (typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(60); } catch { /* best-effort */ }
    }
    setTimeout(() => {
      setSelected(book);
      setScanning(false);
    }, 700);
  };

  return (
    <div className={cn('space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto pb-20', dir === 'rtl' ? 'text-right' : 'text-left')} dir={dir}>
      {/* Header */}
      <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4', dir === 'rtl' ? 'sm:flex-row-reverse' : '')}>
        <div className="space-y-2">
          <div className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 dark:bg-accent/10 text-primary dark:text-accent', dir === 'rtl' ? 'flex-row-reverse' : '')}>
            <Cpu className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black uppercase tracking-[0.25em]">{t('arLabBadge')} · v2.5</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-primary dark:text-white tracking-tight leading-tight">{t('arLabTitle')}</h1>
          <p className="text-slate-400 dark:text-slate-500 font-bold text-xs md:text-sm leading-relaxed max-w-xl">{t('arLabSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{scanning ? t('arLabStatusScanning') : t('arLabStatusIdle')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: shelf of spines + telemetry */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative official-card p-6 bg-slate-950 border-white/10 overflow-hidden">
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
            <div className={cn('relative flex items-center gap-2 mb-5', dir === 'rtl' ? 'flex-row-reverse' : '')}>
              <BookOpen className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.25em] font-mono">{t('arLabRowSequence')} // REF-04A</span>
            </div>

            {/* Book spines */}
            <div className="relative flex items-end justify-center gap-1.5 sm:gap-2.5 h-52 overflow-x-auto no-scrollbar pb-2" dir="ltr">
              {shelfBooks.map((book, i) => {
                const m = getArBookMeta(book);
                const isActive = selected?.id === book.id;
                const height = 150 + ((i * 37) % 45);
                return (
                  <motion.button
                    key={book.id}
                    onClick={() => scan(book)}
                    whileHover={{ y: -8 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      'relative shrink-0 w-9 sm:w-11 rounded-t-md rounded-b-sm flex items-center justify-center transition-all duration-300 group',
                      isActive ? 'ring-2 ring-accent ring-offset-2 ring-offset-slate-950 shadow-[0_0_25px_rgba(217,179,16,0.4)]' : 'hover:brightness-110'
                    )}
                    style={{ height, background: `linear-gradient(180deg, ${m.spineColor}, ${m.spineColor}cc)` }}
                    title={book.title}
                  >
                    {isActive && (
                      <motion.span layoutId="scanDot" className="absolute -top-4 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_10px_rgba(217,179,16,0.9)]" />
                    )}
                    <span className="text-white/90 text-[8px] sm:text-[9px] font-bold [writing-mode:vertical-rl] rotate-180 max-h-full overflow-hidden py-2 tracking-tight">
                      {book.title}
                    </span>
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-white/40 text-[6px] font-mono">{m.lcClass}</span>
                  </motion.button>
                );
              })}

              {/* Sweeping scan line while a scan is in progress */}
              {scanning && (
                <motion.div
                  initial={{ left: '0%' }}
                  animate={{ left: '100%' }}
                  transition={{ duration: 0.7, ease: 'linear' }}
                  className="absolute top-0 bottom-6 w-0.5 bg-accent shadow-[0_0_18px_rgba(217,179,16,0.9)]"
                />
              )}
            </div>

            {/* Telemetry readout */}
            <ArTelemetry />

            <p className={cn('relative mt-4 text-[10px] font-bold text-white/40 flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
              <ScanLine className="w-3.5 h-3.5 text-accent/70" />
              {t('arLabTapHint')}
            </p>
          </div>

          {/* Target deck grid */}
          <div className="official-card p-6 bg-white dark:bg-slate-900">
            <div className={cn('flex items-center justify-between mb-4', dir === 'rtl' ? 'flex-row-reverse' : '')}>
              <div className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">{t('arLabTargetDeck')}</span>
              </div>
              <span className="text-[9px] font-black text-primary/60 dark:text-accent uppercase tracking-widest font-mono">{t('arLabAvailableForScan')} · {t('arLabTitlesCount', { count: shelfBooks.length })}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {shelfBooks.map((book) => {
                const m = getArBookMeta(book);
                const isActive = selected?.id === book.id;
                return (
                  <button
                    key={book.id}
                    onClick={() => scan(book)}
                    className={cn(
                      'p-3 rounded-2xl border text-start transition-all active:scale-95',
                      isActive
                        ? 'bg-accent/10 border-accent shadow-lg shadow-accent/10'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-white/5 hover:border-accent/40'
                    )}
                  >
                    <span className="inline-block text-[8px] font-black text-white px-1.5 py-0.5 rounded font-mono mb-1.5" style={{ background: m.spineColor }}>{m.lcClass}{m.callNumber.split(' ')[0].replace(m.lcClass, '')}</span>
                    <h4 className="text-[11px] font-black text-primary dark:text-white leading-tight line-clamp-2">{book.title}</h4>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold truncate mt-0.5">{book.author}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT: AR info window (or camera stream idle state) */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {selected && meta ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="official-card p-6 bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/40 space-y-5 sticky top-6"
              >
                <div className={cn('flex items-center justify-between', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                  <div className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                      <Radar className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{t('arLabInfoWindow')}</span>
                  </div>
                  <span className="text-[8px] font-black text-white bg-emerald-500 px-2 py-0.5 rounded-md uppercase tracking-widest font-mono">AR</span>
                </div>

                <div>
                  <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{t('arLabDiscoveredSection')}</div>
                  <div className="text-xs font-black text-primary dark:text-accent">{meta.subjectAr} · {meta.lcClass}</div>
                </div>

                <div className="border-t border-slate-100 dark:border-white/5 pt-4">
                  <h3 className="text-lg font-black text-primary dark:text-white leading-tight">{selected.title}</h3>
                  <p className={cn('text-[11px] text-slate-400 dark:text-slate-500 font-bold mt-1 flex items-center gap-1.5', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                    <UserIcon className="w-3.5 h-3.5" />
                    {selected.author}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <MetaRow label={t('arLabCallNumber')} value={meta.callNumber} mono />
                  <MetaRow label={t('arLabSubjectClass')} value={meta.subjectAr} />
                  <MetaRow label={t('arLabPublishYear')} value={`${meta.year} · ${meta.publisher}`} />
                  <MetaRow label={language === 'ar' ? 'الموقع الفعلي' : 'Physical location'} value={t('shelfId', { id: selected.shelf ?? '' })} />
                </div>

                {/* AI academic summary */}
                <div className="rounded-2xl bg-primary/5 dark:bg-accent/5 border border-primary/10 dark:border-accent/10 p-4 space-y-2">
                  <div className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                    <Sparkles className="w-3.5 h-3.5 text-accent" />
                    <span className="text-[9px] font-black text-primary dark:text-accent uppercase tracking-widest">{t('arLabAiAnalysis')}</span>
                  </div>
                  <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('arLabAcademicSummary')}</div>
                  {loadingSummary ? (
                    <div className={cn('flex items-center gap-2 text-[11px] font-bold text-slate-400 dark:text-slate-500', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                      <span className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      {t('arLabGeneratingSummary')}
                    </div>
                  ) : (
                    <p className="text-[12px] font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">{summary}</p>
                  )}
                </div>

                {/* One-tap academic citations (APA/MLA/Chicago/BibTeX) */}
                <CitationBox book={selected} />

                <button
                  onClick={() => navigate('/map', { state: { bookId: selected.id } })}
                  className={cn('w-full py-3.5 bg-accent text-primary rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95', dir === 'rtl' ? 'flex-row-reverse' : '')}
                >
                  <MapPin className="w-4 h-4" />
                  {t('goToShelf')}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="official-card p-6 bg-slate-950 border-white/10 min-h-[420px] flex flex-col sticky top-6"
              >
                <div className={cn('flex items-center gap-2 mb-4', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] font-mono">{t('arLabCameraStream')}</span>
                </div>
                {/* Faux camera feed: blurred spines */}
                <div className="relative flex-1 rounded-2xl overflow-hidden bg-slate-900 flex items-end justify-center gap-1.5 p-4" dir="ltr">
                  <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '100% 8px' }} />
                  {shelfBooks.slice(0, 6).map((book, i) => {
                    const m = getArBookMeta(book);
                    return <div key={book.id} className="shrink-0 w-8 rounded-t-sm opacity-70" style={{ height: 90 + ((i * 29) % 50), background: m.spineColor }} />;
                  })}
                  <div className="absolute top-3 left-3 text-[8px] font-mono text-white/40">// ROW-AUDIT-CHAMBER</div>
                </div>
                <button
                  onClick={() => shelfBooks[0] && scan(shelfBooks[0])}
                  className={cn('mt-4 w-full py-3.5 bg-accent text-primary rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95', dir === 'rtl' ? 'flex-row-reverse' : '')}
                >
                  <Play className="w-4 h-4" />
                  {t('arLabRunScan')}
                </button>
                <p className="mt-3 text-center text-[10px] font-bold text-white/40">{t('arLabSelectPrompt')}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const { dir } = useLanguage();
  return (
    <div className={cn('flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-xl px-3 py-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
      <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0">{label}</span>
      <span className={cn('text-[11px] font-black text-primary dark:text-white truncate', mono && 'font-mono')}>{value}</span>
    </div>
  );
}

// Live-ish AR telemetry that drifts continuously, so the readout feels like a
// real device attitude/depth feed rather than static text.
function ArTelemetry() {
  const { t, dir } = useLanguage();
  const [tick, setTick] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    let last = 0;
    const loop = (ts: number) => {
      if (ts - last > 120) { setTick((n) => n + 1); last = ts; }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, []);
  const pitch = (Math.sin(tick / 9) * 9).toFixed(1);
  const roll = (Math.cos(tick / 11) * 8).toFixed(1);
  const compass = (184 + Math.sin(tick / 15) * 6).toFixed(0);
  const depth = (1.05 + Math.sin(tick / 13) * 0.18).toFixed(2);
  const readings: Array<[string, string]> = [
    [t('arLabPitch'), `${pitch}°`],
    [t('arLabRoll'), `${roll}°`],
    [t('arLabCompass'), `${compass}° N`],
    [t('arLabDepth'), `${depth}m`],
    [t('arLabFps'), '60'],
  ];
  return (
    <div className="relative mt-5 grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono" dir="ltr">
      {readings.map(([label, value]) => (
        <div key={label} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
          <div className="text-[8px] font-black text-white/40 uppercase tracking-widest truncate" dir={dir}>{label}</div>
          <div className="text-[11px] font-black text-accent mt-0.5">{value}</div>
        </div>
      ))}
    </div>
  );
}
