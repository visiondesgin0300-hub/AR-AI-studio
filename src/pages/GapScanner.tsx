import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Search, FlaskConical, Zap, BookOpen, ExternalLink } from 'lucide-react';
import { MOCK_BOOKS } from '../data/mockData';
import { Book } from '../types';
import { useLanguage } from '../hooks/useLanguage';

interface ResearchGap {
  topicArea: string;
  topicAreaAr: string;
  status: 'unexplored' | 'partial' | 'covered';
  opportunity: string;
  relatedBookIds: string[];
  bridgeField: string | null;
  x: number;
  y: number;
}

const STATUS_COLOR: Record<ResearchGap['status'], string> = {
  unexplored: '#34D399',
  partial:    '#FBBF24',
  covered:    '#F87171',
};

const STATUS_LABEL_AR: Record<ResearchGap['status'], string> = {
  unexplored: 'فجوة مفتوحة',
  partial:    'فرصة جسر',
  covered:    'مغطى',
};

const STATUS_LABEL_EN: Record<ResearchGap['status'], string> = {
  unexplored: 'Open Gap',
  partial:    'Bridge Opportunity',
  covered:    'Covered',
};

const BUBBLE_POSITIONS = [
  { x: 0.25, y: 0.30 },
  { x: 0.70, y: 0.26 },
  { x: 0.16, y: 0.56 },
  { x: 0.62, y: 0.51 },
  { x: 0.36, y: 0.74 },
  { x: 0.78, y: 0.68 },
];

const EXAMPLES_AR = [
  'الواقع المعزز في المكتبات الأكاديمية',
  'الذكاء الاصطناعي في التعليم الجامعي',
  'تحليل البيانات الضخمة في البحث العلمي',
  'التعلم الآلي والفيزياء النظرية',
];

const EXAMPLES_EN = [
  'Augmented reality in academic libraries',
  'AI in university education',
  'Big data analysis in scientific research',
  'Machine learning and theoretical physics',
];

function fallbackGaps(topic: string, ar: boolean): { gaps: ResearchGap[]; summary: string } {
  const t = topic.toLowerCase();
  const all: Omit<ResearchGap, 'x' | 'y'>[] = [];

  if (/مكتب|librar/.test(t))    all.push({ topicArea: 'AR Library UX',          topicAreaAr: 'تجربة AR في المكتبة',          status: 'unexplored', opportunity: ar ? 'لا توجد دراسات كافية عن تجربة الواقع المعزز في المكتبات العربية — مجال بحثي مفتوح بالكامل' : 'No sufficient studies on AR UX in Arabic-speaking academic libraries — fully open field', relatedBookIds: ['6','7'], bridgeField: 'HCI' });
  if (/ذكاء|ai\b|artificial/.test(t)) all.push({ topicArea: 'AI + Library Science', topicAreaAr: 'ذكاء اصطناعي + علم المكتبات', status: 'partial',    opportunity: ar ? 'الجسر بين الذكاء الاصطناعي وعلم المكتبات موجود لكن لم يُوثَّق في السياق العربي' : 'Bridge between AI and library science exists but undocumented in Arabic context', relatedBookIds: ['6','7'], bridgeField: 'Library Science' });
  if (/واقع|augment|ar\b/.test(t))  all.push({ topicArea: 'Mobile AR Adoption',   topicAreaAr: 'تبني AR على الجوال',           status: 'unexplored', opportunity: ar ? 'قبول AR على الهاتف في السياق الأكاديمي شبه غائب في الأدبيات العربية' : 'Mobile AR acceptance in academic context nearly absent from Arabic literature', relatedBookIds: ['6'], bridgeField: null });
  if (/تعل|learn|education/.test(t)) all.push({ topicArea: 'Personalized Learning', topicAreaAr: 'التعلم الشخصي بالذكاء',     status: 'partial',    opportunity: ar ? 'التعلم المخصص بالذكاء الاصطناعي مغطى عموماً — لكن مقترنًا بالمكتبات ففجوة واضحة' : 'AI personalized learning is broadly covered — but combined with libraries, a clear gap exists', relatedBookIds: ['6','7','9'], bridgeField: 'Cognitive Science' });
  if (/بيانات|data/.test(t))         all.push({ topicArea: 'Library Analytics',     topicAreaAr: 'تحليلات المكتبات',            status: 'unexplored', opportunity: ar ? 'تحليل سلوك المستخدمين في المكتبات الأكاديمية لتحسين الخدمات — مجال ناشئ' : 'Analyzing user behavior in academic libraries to improve services — emerging field', relatedBookIds: ['9','7'], bridgeField: 'Data Science' });
  all.push({ topicArea: 'Research Methodology',   topicAreaAr: 'منهجية البحث AR',             status: 'covered',    opportunity: ar ? 'مغطى جيداً في الأدبيات العامة — تخصص زاوية تطبيقية في مجالك' : 'Well covered in general literature — narrow down to a specific applied angle', relatedBookIds: ['1','3'], bridgeField: null });

  const gaps = all.slice(0, 6).map((g, i) => ({ ...g, ...(BUBBLE_POSITIONS[i] ?? { x: 0.5, y: 0.5 }) }));
  const summary = ar
    ? `مشهد الأدبيات في مجال "${topic}" يكشف فجوات بحثية واعدة — لا سيما في تقاطع الواقع المعزز والمكتبات الأكاديمية.`
    : `The literature landscape for "${topic}" reveals promising research gaps — especially at the intersection of AR and academic libraries.`;
  return { gaps, summary };
}

export function GapScanner() {
  const navigate     = useNavigate();
  const { language } = useLanguage();
  const ar = language === 'ar';

  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const svgRef    = useRef<SVGSVGElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const [phase, setPhase]               = useState<'loading' | 'idle' | 'scanning' | 'results'>('loading');
  const [svgDims, setSvgDims]           = useState({ w: 375, h: 812 });
  const [topic, setTopic]               = useState('');
  const [inputText, setInputText]       = useState('');
  const [gaps, setGaps]                 = useState<ResearchGap[]>([]);
  const [summary, setSummary]           = useState<string | null>(null);
  const [selectedGap, setSelectedGap]   = useState<ResearchGap | null>(null);
  const [showInput, setShowInput]       = useState(false);
  const [scholarPapers, setScholarPapers] = useState<{ title: string; year: number; citations: number; doi: string | null }[]>([]);
  const [scholarCount, setScholarCount]   = useState<number | null>(null);

  // Camera
  useEffect(() => {
    let cancelled = false;
    const attach = (stream: MediaStream) => {
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      const v = videoRef.current;
      if (!v) return;
      v.srcObject = stream;
      v.addEventListener('playing', () => { if (!cancelled) setPhase('idle'); }, { once: true });
      v.play().catch(() => { if (!cancelled) setPhase('idle'); });
    };
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then(attach)
      .catch(() => {
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          .then(attach).catch(() => { if (!cancelled) setPhase('idle'); });
      });
    return () => { cancelled = true; streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  // SVG resize
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      if (width && height) setSvgDims({ w: width, h: height });
    });
    obs.observe(el);
    const r = el.getBoundingClientRect();
    if (r.width && r.height) setSvgDims({ w: r.width, h: r.height });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (showInput) setTimeout(() => inputRef.current?.focus(), 150);
  }, [showInput]);

  const scanTopic = useCallback(async (q: string) => {
    const t = q.trim();
    if (!t) return;
    setTopic(t);
    setInputText(t);
    setPhase('scanning');
    setGaps([]);
    setSummary(null);
    setSelectedGap(null);
    setShowInput(false);
    setScholarPapers([]);
    setScholarCount(null);

    try {
      const res = await fetch('/api/gap-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: t, books: MOCK_BOOKS }),
      });
      if (res.ok) {
        const data = await res.json();
        const rawGaps: any[] = Array.isArray(data.gaps) ? data.gaps : [];
        const positioned = rawGaps.slice(0, 6).map((g: any, i: number) => ({
          topicArea:      g.topicArea      ?? `Area ${i+1}`,
          topicAreaAr:    g.topicAreaAr    ?? g.topicArea ?? `مجال ${i+1}`,
          status:         (['unexplored','partial','covered'].includes(g.status) ? g.status : 'partial') as ResearchGap['status'],
          opportunity:    g.opportunity    ?? '',
          relatedBookIds: Array.isArray(g.relatedBookIds) ? g.relatedBookIds : [],
          bridgeField:    g.bridgeField    ?? null,
          ...(BUBBLE_POSITIONS[i] ?? { x: 0.5, y: 0.5 }),
        }));
        setGaps(positioned);
        setSummary(data.summary ?? null);
        setScholarPapers(Array.isArray(data.scholarPapers) ? data.scholarPapers : []);
        setScholarCount(typeof data.scholarCount === 'number' ? data.scholarCount : null);
        setPhase('results');
        return;
      }
    } catch { /* fallthrough */ }

    const fb = fallbackGaps(t, ar);
    setGaps(fb.gaps);
    setSummary(fb.summary);
    setPhase('results');
  }, [ar]);

  const selBooks = useMemo(
    () => (selectedGap?.relatedBookIds ?? []).map(id => MOCK_BOOKS.find(b => b.id === id)).filter(Boolean) as Book[],
    [selectedGap],
  );

  const cx0 = svgDims.w / 2;
  const cy0 = svgDims.h / 2;

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/20 to-black/85 pointer-events-none" />

      {/* Loading */}
      {phase === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <Search className="w-10 h-10 text-[#34D399]" />
          </motion.div>
          <p className="text-white/70 text-sm font-bold">{ar ? 'جارٍ تهيئة الماسح...' : 'Initializing scanner...'}</p>
        </div>
      )}

      {/* SVG: radar + bubbles */}
      <svg ref={svgRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <filter id="gs-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="gs-ring" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Radar sweep */}
        {phase === 'scanning' && (
          <>
            {[0.28, 0.50, 0.78].map((r, i) => (
              <motion.circle key={i} cx={cx0} cy={cy0} r={Math.min(svgDims.w, svgDims.h) * r}
                fill="none" stroke="rgba(52,211,153,0.18)" strokeWidth={1}
                initial={{ opacity: 0, scale: 0.2 }}
                animate={{ opacity: [0, 0.6, 0], scale: [0.2, 1.3, 1.3] }}
                transition={{ duration: 2.2, delay: i * 0.45, repeat: Infinity, ease: 'easeOut' }} />
            ))}
            <motion.line x1={cx0} y1={cy0} x2={cx0} y2={0}
              stroke="rgba(52,211,153,0.55)" strokeWidth={2}
              style={{ transformOrigin: `${cx0}px ${cy0}px` }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }} />
          </>
        )}

        {/* Gap bubbles */}
        {phase === 'results' && gaps.map((gap, i) => {
          const bx = gap.x * svgDims.w;
          const by = gap.y * svgDims.h;
          const color = STATUS_COLOR[gap.status];
          const baseR = gap.status === 'unexplored' ? 38 : gap.status === 'partial' ? 30 : 24;
          const sel = selectedGap === gap;
          return (
            <motion.g key={i} style={{ pointerEvents: 'all', cursor: 'pointer' }}
              onClick={() => setSelectedGap(sel ? null : gap)}>
              {gap.status === 'unexplored' && (
                <motion.circle cx={bx} cy={by} r={baseR + 18}
                  fill={`${color}0A`}
                  filter="url(#gs-ring)"
                  animate={{ r: [baseR+18, baseR+32, baseR+18], opacity: [0.6, 0.1, 0.6] }}
                  transition={{ duration: 2.8, repeat: Infinity, delay: i * 0.35 }} />
              )}
              <motion.circle cx={bx} cy={by} r={sel ? baseR + 10 : baseR}
                fill={`${color}1A`}
                stroke={color}
                strokeWidth={sel ? 2.5 : 1.8}
                filter="url(#gs-glow)"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.14, type: 'spring', stiffness: 260, damping: 22 }} />
            </motion.g>
          );
        })}
      </svg>

      {/* Header */}
      {phase !== 'loading' && (
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-12 pb-3">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center">
              <motion.div animate={{ scale: [1,1.2,1] }} transition={{ duration: 2.5, repeat: Infinity }}>
                <Search className="w-4 h-4 text-[#34D399]" />
              </motion.div>
              <span className="text-white font-black text-sm">{ar ? 'ماسح الفجوات البحثية' : 'Research Gap Scanner'}</span>
              <motion.div animate={{ scale: [1,1.2,1] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.8 }}>
                <Search className="w-4 h-4 text-[#34D399]" />
              </motion.div>
            </div>
            <p className="text-white/35 text-[9px] font-black tracking-widest uppercase mt-0.5">Literature Gap Analysis · AR</p>
          </div>
          <div className="w-10" />
        </div>
      )}

      {/* Legend strip */}
      {(phase === 'idle' || phase === 'results') && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="absolute z-10 flex items-center gap-3 px-4 py-2 rounded-2xl"
          style={{ top: 96, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,0.07)' }}>
          {(['unexplored','partial','covered'] as const).map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: STATUS_COLOR[s] }} />
              <span className="text-[9px] font-black" style={{ color: STATUS_COLOR[s] }}>
                {ar ? STATUS_LABEL_AR[s] : STATUS_LABEL_EN[s]}
              </span>
            </div>
          ))}
        </motion.div>
      )}

      {/* Idle prompt */}
      <AnimatePresence>
        {phase === 'idle' && !showInput && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: 0.3 }}
            className="absolute left-0 right-0 flex flex-col items-center px-6 gap-4"
            style={{ top: '24%' }}>
            <div className="text-center space-y-1">
              <p className="text-white font-black text-sm">{ar ? 'امسح الفجوات في مجالك' : 'Scan gaps in your field'}</p>
              <p className="text-white/40 text-[11px] font-bold">
                {ar ? 'اكتب موضوع بحثك ليظهر مشهد الفجوات حولك' : 'Enter your research topic to reveal the gap landscape'}
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {(ar ? EXAMPLES_AR : EXAMPLES_EN).map((ex, i) => (
                <motion.button key={i}
                  initial={{ opacity: 0, x: ar ? 10 : -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                  onClick={() => scanTopic(ex)}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-white/75 active:scale-95 transition-all text-start"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(10px)' }}
                  dir={ar ? 'rtl' : 'ltr'}>
                  <span className="text-[#34D399]">→ </span>{ex}
                </motion.button>
              ))}
            </div>
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              onClick={() => setShowInput(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-sm"
              style={{ background: '#34D399', color: '#001a00' }}>
              <Search className="w-4 h-4" />
              {ar ? 'اكتب موضوعك' : 'Enter your topic'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanning */}
      <AnimatePresence>
        {phase === 'scanning' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}>
              <Loader2 className="w-10 h-10 text-[#34D399]" />
            </motion.div>
            <p className="text-white font-black text-sm">{ar ? 'جارٍ مسح الأدبيات الأكاديمية...' : 'Scanning academic literature...'}</p>
            <p className="text-[#34D399]/60 text-xs font-bold">"{topic}"</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bubble labels (HTML over SVG) */}
      {phase === 'results' && gaps.map((gap, i) => {
        const color = STATUS_COLOR[gap.status];
        const sel = selectedGap === gap;
        return (
          <motion.button key={`lbl-${i}`}
            initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 + i * 0.14, type: 'spring', stiffness: 260, damping: 22 }}
            onClick={() => setSelectedGap(sel ? null : gap)}
            className="absolute pointer-events-auto active:scale-95 transition-transform"
            style={{ left: gap.x * svgDims.w, top: gap.y * svgDims.h, transform: 'translate(-50%,-50%)', zIndex: 15, maxWidth: 90 }}>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] font-black text-center leading-tight" style={{ color }}>
                {ar ? gap.topicAreaAr : gap.topicArea}
              </span>
              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full mt-0.5" style={{ background: `${color}22`, color }}>
                {ar ? STATUS_LABEL_AR[gap.status] : STATUS_LABEL_EN[gap.status]}
              </span>
            </div>
          </motion.button>
        );
      })}

      {/* Results bottom bar */}
      {phase === 'results' && !selectedGap && !showInput && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-3 px-5">
          {summary && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="w-full max-w-sm px-4 py-2.5 rounded-2xl text-center space-y-1.5"
              style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(16px)', border: '1px solid rgba(52,211,153,0.18)' }}>
              <p className="text-xs font-bold text-white/65 leading-snug" dir={ar ? 'rtl' : 'ltr'}>{summary}</p>
              {scholarCount !== null && (
                <div className="flex items-center justify-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                  <p className="text-[9px] font-black text-[#34D399]/70">
                    {ar
                      ? `${scholarCount}+ ورقة بحثية حقيقية من OpenAlex`
                      : `${scholarCount}+ real papers from OpenAlex`}
                  </p>
                </div>
              )}
            </motion.div>
          )}
          <div className="flex items-center gap-3">
            <div className="px-3 py-2 rounded-full bg-black/55 backdrop-blur-sm border border-white/10 text-white/40 text-[10px] font-black">
              {ar ? 'اضغط على فقاعة لعرض التفاصيل' : 'Tap a bubble to see details'}
            </div>
            <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowInput(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full shrink-0"
              style={{ background: 'rgba(52,211,153,0.14)', border: '1px solid rgba(52,211,153,0.35)', backdropFilter: 'blur(12px)' }}>
              <Search className="w-3.5 h-3.5 text-[#34D399]" />
              <span className="text-[11px] font-black text-[#34D399]">{ar ? 'موضوع جديد' : 'New topic'}</span>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Input panel */}
      <AnimatePresence>
        {showInput && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl p-6 space-y-4"
            style={{ background: 'rgba(0,4,18,0.97)', backdropFilter: 'blur(30px)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#34D399]" />
                <span className="text-sm font-black text-white">{ar ? 'أدخل موضوع بحثك' : 'Enter your research topic'}</span>
              </div>
              <button onClick={() => setShowInput(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>

            <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(52,211,153,0.22)' }}>
              <input ref={inputRef} type="text" value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && scanTopic(inputText)}
                placeholder={ar ? 'مثال: الواقع المعزز في المكتبات...' : 'e.g. Augmented reality in libraries...'}
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/25 min-w-0"
                dir={ar ? 'rtl' : 'ltr'} />
              <button onClick={() => scanTopic(inputText)} disabled={!inputText.trim()}
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 active:scale-90 disabled:opacity-30 transition-all"
                style={{ background: '#34D399' }}>
                <Search className="w-4 h-4 text-black" />
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">{ar ? 'أمثلة' : 'Examples'}</p>
              {(ar ? EXAMPLES_AR : EXAMPLES_EN).map((ex, i) => (
                <button key={i} onClick={() => scanTopic(ex)}
                  className="text-xs font-bold text-white/55 text-start px-3 py-1.5 rounded-xl active:scale-95 transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  dir={ar ? 'rtl' : 'ltr'}>
                  <span className="text-[#34D399]">→ </span>{ex}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)' }}
              dir={ar ? 'rtl' : 'ltr'}>
              <FlaskConical className="w-3 h-3 text-[#34D399] shrink-0" />
              <span className="text-[10px] font-black text-[#34D399]/70 leading-snug">
                {ar
                  ? 'يُحلّل الأدبيات ويكشف الفجوات غير المدروسة — Literature Gap Analysis · Swanson 1986'
                  : 'Analyzes academic literature to reveal unexplored gaps — Literature Gap Analysis · Swanson 1986'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gap detail panel */}
      <AnimatePresence>
        {selectedGap && !showInput && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="absolute bottom-0 left-0 right-0 z-20 rounded-t-3xl p-6 space-y-4"
            style={{ background: 'rgba(0,6,20,0.95)', backdropFilter: 'blur(28px)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between">
              <div className="w-8" />
              <div className="w-10 h-1 rounded-full bg-white/15" />
              <button onClick={() => setSelectedGap(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.08)' }}>
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>

            <div className="flex justify-center">
              <div className="px-3 py-1 rounded-full text-[11px] font-black"
                style={{ background: `${STATUS_COLOR[selectedGap.status]}18`, color: STATUS_COLOR[selectedGap.status], border: `1px solid ${STATUS_COLOR[selectedGap.status]}45` }}>
                ✦ {ar ? selectedGap.topicAreaAr : selectedGap.topicArea} — {ar ? STATUS_LABEL_AR[selectedGap.status] : STATUS_LABEL_EN[selectedGap.status]}
              </div>
            </div>

            <div className="rounded-2xl p-4"
              style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${STATUS_COLOR[selectedGap.status]}22` }}>
              <p className="text-sm font-bold text-white/80 leading-relaxed" dir={ar ? 'rtl' : 'ltr'}>
                {selectedGap.opportunity}
              </p>
            </div>

            {selBooks.length > 0 && (
              <div dir={ar ? 'rtl' : 'ltr'}>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-2">{ar ? 'كتب ذات صلة في المكتبة' : 'Related books in library'}</p>
                <div className="flex flex-col gap-1.5">
                  {selBooks.map(book => (
                    <div key={book.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: STATUS_COLOR[selectedGap.status] }} />
                      <span className="text-xs font-bold text-white/70 line-clamp-1">
                        {ar ? book.title : (book.titleEn ?? book.title)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedGap.bridgeField && (
              <div className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: 'rgba(215,200,38,0.07)', border: '1px solid rgba(215,200,38,0.25)' }}
                dir={ar ? 'rtl' : 'ltr'}>
                <Zap className="w-4 h-4 text-[#D7C826] shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-[#D7C826]/90">
                    {ar ? 'فرصة جسر مع:' : 'Bridge opportunity with:'} <span className="text-[#D7C826]">{selectedGap.bridgeField}</span>
                  </p>
                  <p className="text-[9px] text-white/40 font-bold mt-0.5">
                    {ar ? 'استخدم تطبيق الجسور المخفية لاكتشاف الرابط' : 'Use Hidden Bridges app to discover the link'}
                  </p>
                </div>
              </div>
            )}

            {/* Real scholar papers from OpenAlex */}
            {scholarPapers.length > 0 && (
              <div dir={ar ? 'rtl' : 'ltr'}>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-3 h-3 text-white/30 shrink-0" />
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                    {ar
                      ? `أوراق بحثية حقيقية — OpenAlex (${scholarCount ?? scholarPapers.length}+ نتيجة)`
                      : `Real papers — OpenAlex (${scholarCount ?? scholarPapers.length}+ results)`}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  {scholarPapers.slice(0, 4).map((p, i) => (
                    <div key={i} className="px-3 py-2 rounded-xl"
                      style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.12)' }}>
                      <p className="text-[10px] font-bold text-white/75 leading-tight line-clamp-2">{p.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-[#34D399]/60 font-bold">{p.year}</span>
                        <span className="text-[9px] text-white/25">·</span>
                        <span className="text-[9px] text-white/35 font-bold">{p.citations.toLocaleString()} {ar ? 'استشهاد' : 'citations'}</span>
                        {p.doi && (
                          <>
                            <span className="text-[9px] text-white/25">·</span>
                            <span className="text-[9px] text-[#34D399]/50 font-bold flex items-center gap-0.5">
                              <ExternalLink className="w-2.5 h-2.5" />DOI
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)' }}
              dir={ar ? 'rtl' : 'ltr'}>
              <FlaskConical className="w-3 h-3 text-[#34D399] shrink-0" />
              <span className="text-[10px] font-black text-[#34D399]/70 leading-snug">
                {ar
                  ? 'تحليل مبني على Literature Gap Analysis — Swanson 1986 — Kuhn 1962'
                  : 'Analysis based on Literature Gap Analysis — Swanson 1986 — Kuhn 1962'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
