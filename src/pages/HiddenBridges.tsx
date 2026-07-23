import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Loader2, FlaskConical, MessageCircle, Send } from 'lucide-react';
import { MOCK_BOOKS } from '../data/mockData';
import { Book } from '../types';
import { useLanguage } from '../hooks/useLanguage';

// ── Books in each discipline zone ──────────────────────────────────────────────
const LEFT_IDS  = ['1', '3', '4'];  // Physics
const RIGHT_IDS = ['6', '7', '9'];  // CS / Engineering

interface Bridge {
  leftId: string;
  rightId: string;
  discoveryAr: string;
  discoveryEn: string;
  color: string;
  strength: 1 | 2 | 3;
}

const BRIDGES: Bridge[] = [
  { leftId: '1', rightId: '6', discoveryAr: 'حدود المعرفة',        discoveryEn: 'Limits of Knowledge',    color: '#D7C826', strength: 3 },
  { leftId: '3', rightId: '7', discoveryAr: 'فلسفة الأناقة',       discoveryEn: 'Philosophy of Elegance', color: '#60A5FA', strength: 2 },
  { leftId: '4', rightId: '9', discoveryAr: 'التفكير الحسابي',      discoveryEn: 'Computational Thinking', color: '#34D399', strength: 3 },
  { leftId: '1', rightId: '9', discoveryAr: 'الكون كخوارزمية',      discoveryEn: 'Universe as Algorithm',  color: '#A78BFA', strength: 2 },
  { leftId: '4', rightId: '6', discoveryAr: 'الشبكات والفيزياء',   discoveryEn: 'Networks & Physics',     color: '#FB923C', strength: 1 },
];

const FALLBACK_INSIGHTS: Record<string, string> = {
  'حدود المعرفة':   'هوكينج يُثبت أن الكون محكوم بقوانين لا يمكن للإنسان استيعابها كاملاً، والذكاء الاصطناعي يُثبت نفس الشيء للحواسيب — كلاهما يُعرّف حدود العقل من زاوية مختلفة. الباحث الذي يقرأهما معاً يجد إطاراً فلسفياً جديداً لحدود العلم لم يُنشر بعد.',
  'فلسفة الأناقة':  'روفيلي يرى أن أجمل النظريات الفيزيائية هي الأصح، ومارتن يرى أن أنظف الكود هو الأصح — كلاهما يجعل من الجمال معياراً علمياً. هذا التقاطع غير المنشور بين الفيزياء وهندسة البرمجيات يفتح باباً كاملاً في علاقة الجماليات بالصحة العلمية.',
  'التفكير الحسابي': 'فاينمان رأى الكون كحاسوب يحسب باستمرار، وكورمن صمّم خوارزميات تحاكي الطبيعة — المعادلات ذاتها تصف الموجة الكهرومغناطيسية وخوارزمية الفرز. هذا الاكتشاف أسّس لمجال "الفيزياء الحسابية" الذي لا يزال في بداياته.',
  'الكون كخوارزمية': 'هوكينج وصف قوانين الفيزياء كمعادلات رياضية دقيقة، وكورمن أثبت أن الخوارزميات ليست أكثر من معادلات تنفّذها الآلة — هل قوانين الطبيعة هي خوارزميات كون يشتغل؟ هذا السؤال الفلسفي-العلمي انتظر عقوداً من يطرحه رسمياً.',
  'الشبكات والفيزياء': 'فاينمان درس الشبكات الكمية بنفس الأدوات التي يستخدمها علماء الذكاء الاصطناعي اليوم في الشبكات العصبية — الاتصال المعرفي بين الحقلين لم يُوثَّق رسمياً إلا عام 2019، وما زالت تداعياته مفتوحة.',
};

// ── Module-level books (constant) ──────────────────────────────────────────────
const LEFT_BOOKS  = LEFT_IDS.map(id  => MOCK_BOOKS.find(b => b.id === id)).filter(Boolean) as Book[];
const RIGHT_BOOKS = RIGHT_IDS.map(id => MOCK_BOOKS.find(b => b.id === id)).filter(Boolean) as Book[];

// ── Component ──────────────────────────────────────────────────────────────────
export function HiddenBridges() {
  const navigate  = useNavigate();
  const { language } = useLanguage();
  const ar = language === 'ar';

  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const svgRef    = useRef<SVGSVGElement>(null);

  const [phase, setPhase]                     = useState<'loading' | 'live'>('loading');
  const [zonesVisible, setZonesVisible]       = useState(false);
  const [bridgesVisible, setBridgesVisible]   = useState(false);
  const [badgesVisible, setBadgesVisible]     = useState(false);
  const [selectedBridge, setSelectedBridge]   = useState<Bridge | null>(null);
  const [bridgeInsight, setBridgeInsight]     = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight]   = useState(false);
  const [svgDims, setSvgDims]                 = useState({ w: 375, h: 812 });

  // ── Q&A state ──────────────────────────────────────────────────────────────
  const [showQA, setShowQA]       = useState(false);
  const [qaQuery, setQaQuery]     = useState('');
  const [qaAnswer, setQaAnswer]   = useState<string | null>(null);
  const [loadingQA, setLoadingQA] = useState(false);
  const inputRef                  = useRef<HTMLInputElement>(null);

  // ── Node positions ─────────────────────────────────────────────────────────
  const leftX   = svgDims.w * 0.10;
  const rightX  = svgDims.w * 0.90;
  const centerX = svgDims.w * 0.50;
  const ys      = useMemo(() => [0.28, 0.48, 0.68].map(r => r * svgDims.h), [svgDims.h]);

  const leftNodes  = useMemo(() => LEFT_BOOKS.map((book, i)  => ({ book, x: leftX,  y: ys[i] ?? 0 })), [leftX,  ys]);
  const rightNodes = useMemo(() => RIGHT_BOOKS.map((book, i) => ({ book, x: rightX, y: ys[i] ?? 0 })), [rightX, ys]);

  // Build bridge geometry
  const bridgeGeometry = useMemo(() => BRIDGES.map(b => {
    const li = LEFT_IDS.indexOf(b.leftId);
    const ri = RIGHT_IDS.indexOf(b.rightId);
    if (li < 0 || ri < 0) return null;
    const x1 = leftX,  y1 = ys[li] ?? 0;
    const x2 = rightX, y2 = ys[ri] ?? 0;
    // S-curve: control points extend horizontally from each node
    const cx = (x2 - x1) * 0.38;
    const path = `M ${x1} ${y1} C ${x1 + cx} ${y1} ${x2 - cx} ${y2} ${x2} ${y2}`;
    const midX = centerX;
    const midY = (y1 + y2) / 2;
    return { path, midX, midY };
  }), [leftX, rightX, centerX, ys]);

  // Discovery zone centre (where crossing bridges meet)
  const discoveryY = ys[1] ?? svgDims.h * 0.48;

  // ── Camera ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const attach = (stream: MediaStream) => {
      if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      const v = videoRef.current;
      if (!v) return;
      v.srcObject = stream;
      v.addEventListener('playing', () => { if (!cancelled) setPhase('live'); }, { once: true });
      v.play().catch(() => { if (!cancelled) setPhase('live'); });
    };
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then(attach)
      .catch(() => {
        if (cancelled) return;
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          .then(attach).catch(() => { if (!cancelled) setPhase('live'); }); // fallback: dark bg
      });
    return () => { cancelled = true; streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  // ── SVG resize ─────────────────────────────────────────────────────────────
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

  // ── Reveal timing ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'live') return;
    const t1 = setTimeout(() => setZonesVisible(true),   700);
    const t2 = setTimeout(() => setBridgesVisible(true), 1500);
    const t3 = setTimeout(() => setBadgesVisible(true),  1500 + BRIDGES.length * 280 + 600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [phase]);

  // ── Fetch AI insight ───────────────────────────────────────────────────────
  const openBridge = useCallback(async (bridge: Bridge) => {
    setSelectedBridge(bridge);
    setBridgeInsight(null);
    setLoadingInsight(true);
    const bookA = MOCK_BOOKS.find(b => b.id === bridge.leftId);
    const bookB = MOCK_BOOKS.find(b => b.id === bridge.rightId);
    try {
      const res = await fetch('/api/hidden-bridges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookA, bookB, discoveryType: bridge.discoveryAr }),
      });
      if (res.ok) {
        const data = await res.json();
        setBridgeInsight(data.insight ?? FALLBACK_INSIGHTS[bridge.discoveryAr] ?? '');
        setLoadingInsight(false);
        return;
      }
    } catch { /* fallthrough */ }
    await new Promise<void>(r => setTimeout(r, 500));
    setBridgeInsight(FALLBACK_INSIGHTS[bridge.discoveryAr] ?? '');
    setLoadingInsight(false);
  }, []);

  // ── Q&A handler ────────────────────────────────────────────────────────────
  const askQuestion = useCallback(async () => {
    const q = qaQuery.trim();
    if (!q || loadingQA) return;
    setLoadingQA(true);
    setQaAnswer(null);
    try {
      const res = await fetch('/api/bridge-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, books: [...LEFT_BOOKS, ...RIGHT_BOOKS] }),
      });
      if (res.ok) {
        const data = await res.json();
        setQaAnswer(data.answer ?? '');
        setLoadingQA(false);
        return;
      }
    } catch { /* fallthrough */ }
    await new Promise<void>(r => setTimeout(r, 400));
    setQaAnswer(ar
      ? `سؤال رائع! الجسور المخفية بين التخصصات تبدأ دائماً بأسئلة كهذه. تجربة Swanson 1986 أثبتت أن ربط أدبيات منفصلة يكشف معرفة غير منشورة — وسؤالك "${q}" هو بالضبط نوع الجسر الذي يبحث عنه الباحثون.`
      : `Great question! Swanson's 1986 experiment proved that linking separate literatures reveals unpublished knowledge — your question "${q}" is exactly the kind of hidden bridge researchers look for.`
    );
    setLoadingQA(false);
  }, [qaQuery, loadingQA, ar]);

  // Auto-focus input when QA panel opens
  useEffect(() => {
    if (showQA) setTimeout(() => inputRef.current?.focus(), 150);
    else { setQaAnswer(null); setQaQuery(''); }
  }, [showQA]);

  const selLeft  = selectedBridge ? MOCK_BOOKS.find(b => b.id === selectedBridge.leftId)  : null;
  const selRight = selectedBridge ? MOCK_BOOKS.find(b => b.id === selectedBridge.rightId) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">

      {/* Camera */}
      <video ref={videoRef} autoPlay playsInline muted
        className="absolute inset-0 w-full h-full object-cover opacity-50" />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/30 to-black/80 pointer-events-none" />

      {/* ── Loading spinner (only while camera hasn't resolved yet) ── */}
      {phase === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <FlaskConical className="w-10 h-10 text-[#D7C826]" />
          </motion.div>
          <p className="text-white/70 text-sm font-bold">{ar ? 'جارٍ رصد التخصصات...' : 'Scanning disciplines...'}</p>
        </div>
      )}

      {/* ── AR experience (camera live or dark-bg fallback) ── */}
      {phase === 'live' && (
        <>
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-12 pb-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Zap className="w-4 h-4 text-[#D7C826]" />
                </motion.div>
                <span className="text-white font-black text-sm tracking-wide">
                  {ar ? 'الجسور المخفية' : 'Hidden Bridges'}
                </span>
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}>
                  <Zap className="w-4 h-4 text-[#D7C826]" />
                </motion.div>
              </div>
              <p className="text-white/35 text-[9px] font-black tracking-widest uppercase mt-0.5">
                Undiscovered Public Knowledge · AR
              </p>
            </div>
            <div className="w-10" />
          </div>

          {/* ── Zone panels ── */}
          <AnimatePresence>
            {zonesVisible && (
              <>
                {/* Left zone — Natural Sciences */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="absolute top-[22%] bottom-[20%] rounded-r-2xl border-r border-t border-b border-blue-400/20 flex flex-col justify-between py-4 px-2"
                  style={{ left: 0, width: '22%', background: 'rgba(96,165,250,0.06)' }}
                >
                  <div className="text-[8px] font-black text-blue-300/70 uppercase tracking-widest leading-tight text-center">
                    {ar ? 'العلوم\nالطبيعية' : 'Natural\nSciences'}
                  </div>
                  <div className="text-[8px] font-black text-blue-300/40 text-center">
                    {ar ? 'فيزياء' : 'Physics'}
                  </div>
                </motion.div>

                {/* Right zone — Computer Science */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="absolute top-[22%] bottom-[20%] rounded-l-2xl border-l border-t border-b border-purple-400/20 flex flex-col justify-between py-4 px-2"
                  style={{ right: 0, width: '22%', background: 'rgba(167,139,250,0.06)' }}
                >
                  <div className="text-[8px] font-black text-purple-300/70 uppercase tracking-widest leading-tight text-center">
                    {ar ? 'علوم\nالحاسب' : 'Computer\nScience'}
                  </div>
                  <div className="text-[8px] font-black text-purple-300/40 text-center">
                    {ar ? 'هندسة' : 'Engineering'}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* ── SVG layer ── */}
          <svg ref={svgRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            <defs>
              <filter id="hb-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="hb-discovery" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="10" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="hb-node" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <radialGradient id="hb-disc-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor="#D7C826" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#D7C826" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Discovery zone glow */}
            {bridgesVisible && (
              <motion.ellipse
                cx={centerX} cy={discoveryY}
                rx={svgDims.w * 0.16} ry={svgDims.h * 0.09}
                fill="url(#hb-disc-grad)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              />
            )}

            {/* Bridges */}
            {BRIDGES.map((bridge, i) => {
              const geo = bridgeGeometry[i];
              if (!geo) return null;
              const isSelected = selectedBridge?.leftId === bridge.leftId && selectedBridge?.rightId === bridge.rightId;
              return (
                <motion.path
                  key={`bridge-${i}`}
                  d={geo.path}
                  stroke={bridge.color}
                  strokeWidth={isSelected ? bridge.strength * 2.8 : bridge.strength * 1.4}
                  fill="none"
                  strokeLinecap="round"
                  filter="url(#hb-glow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={bridgesVisible ? { pathLength: 1, opacity: isSelected ? 1 : 0.55 } : { pathLength: 0, opacity: 0 }}
                  transition={{ duration: 1.2, delay: i * 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              );
            })}

            {/* Left nodes */}
            {leftNodes.map(({ x, y }, i) => (
              <motion.g key={`ln-${i}`}
                initial={{ opacity: 0 }} animate={zonesVisible ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.3 + i * 0.12 }}>
                <motion.circle cx={x} cy={y} r={9} fill="none" stroke="rgba(96,165,250,0.4)" strokeWidth={0.8}
                  animate={{ opacity: [0.4, 0.08, 0.4] }}
                  transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, delay: i * 0.3 }} />
                <circle cx={x} cy={y} r={4} fill="#60A5FA" filter="url(#hb-node)" />
              </motion.g>
            ))}

            {/* Right nodes */}
            {rightNodes.map(({ x, y }, i) => (
              <motion.g key={`rn-${i}`}
                initial={{ opacity: 0 }} animate={zonesVisible ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.3 + i * 0.12 }}>
                <motion.circle cx={x} cy={y} r={9} fill="none" stroke="rgba(167,139,250,0.4)" strokeWidth={0.8}
                  animate={{ opacity: [0.4, 0.08, 0.4] }}
                  transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, delay: i * 0.3 }} />
                <circle cx={x} cy={y} r={4} fill="#A78BFA" filter="url(#hb-node)" />
              </motion.g>
            ))}

            {/* Discovery zone core spark */}
            {bridgesVisible && (
              <motion.circle
                cx={centerX} cy={discoveryY} r={5}
                fill="#D7C826"
                filter="url(#hb-discovery)"
                animate={{ r: [5, 8, 5], opacity: [0.9, 0.3, 0.9] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </svg>

          {/* ── Book labels ── */}
          {zonesVisible && (
            <>
              {leftNodes.map(({ book, x, y }, i) => (
                <motion.div key={`ll-${i}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.12 }}
                  className="absolute pointer-events-none text-center"
                  style={{ left: x + 14, top: y, transform: 'translateY(-50%)', maxWidth: 70 }}>
                  <div className="text-[7px] font-bold text-blue-200/60 leading-tight text-left"
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ar ? book.title : (book.titleEn ?? book.title)}
                  </div>
                </motion.div>
              ))}
              {rightNodes.map(({ book, x, y }, i) => (
                <motion.div key={`rl-${i}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.12 }}
                  className="absolute pointer-events-none text-center"
                  style={{ right: svgDims.w - x + 14, top: y, transform: 'translateY(-50%)', maxWidth: 70 }}>
                  <div className="text-[7px] font-bold text-purple-200/60 leading-tight text-right"
                    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ar ? book.title : (book.titleEn ?? book.title)}
                  </div>
                </motion.div>
              ))}
            </>
          )}

          {/* ── Discovery zone label ── */}
          {bridgesVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.0, type: 'spring', stiffness: 260, damping: 22 }}
              className="absolute pointer-events-none"
              style={{ left: centerX, top: discoveryY - 34, transform: 'translateX(-50%)' }}
            >
              <div className="px-2 py-0.5 rounded-full bg-[#D7C826]/20 border border-[#D7C826]/40 text-[8px] font-black text-[#D7C826] tracking-widest whitespace-nowrap">
                {ar ? '✦ منطقة الاكتشاف ✦' : '✦ DISCOVERY ZONE ✦'}
              </div>
            </motion.div>
          )}

          {/* ── Bridge midpoint badges ── */}
          {badgesVisible && BRIDGES.map((bridge, i) => {
            const geo = bridgeGeometry[i];
            if (!geo) return null;
            const isSelected = selectedBridge?.leftId === bridge.leftId && selectedBridge?.rightId === bridge.rightId;
            return (
              <motion.button
                key={`bb-${i}`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08, type: 'spring', stiffness: 270, damping: 22 }}
                onClick={() => openBridge(bridge)}
                className="absolute text-[8px] font-black tracking-wide whitespace-nowrap rounded-full px-2 py-0.5 border transition-all active:scale-95"
                style={{
                  left: geo.midX,
                  top: geo.midY,
                  transform: 'translate(-50%, -50%)',
                  background: isSelected ? bridge.color : 'rgba(0,0,0,0.65)',
                  backdropFilter: 'blur(8px)',
                  color: isSelected ? '#000' : bridge.color,
                  borderColor: `${bridge.color}65`,
                  boxShadow: isSelected ? `0 0 20px ${bridge.color}55` : `0 0 8px ${bridge.color}28`,
                }}
              >
                {ar ? bridge.discoveryAr : bridge.discoveryEn}
              </motion.button>
            );
          })}

          {/* ── Pre-bridges hint ── */}
          {!bridgesVisible && zonesVisible && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 text-center px-8">
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-16 h-16 rounded-full border-2 border-[#D7C826]/50 flex items-center justify-center"
                >
                  <Zap className="w-7 h-7 text-[#D7C826]" />
                </motion.div>
                <p className="text-white font-black text-sm">{ar ? 'جارٍ اكتشاف الجسور المخفية...' : 'Discovering hidden bridges...'}</p>
              </motion.div>
            </div>
          )}

          {/* ── Bottom bar: tip + ask button ── */}
          {badgesVisible && !selectedBridge && !showQA && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="absolute bottom-6 left-0 right-0 flex items-center justify-between px-5 gap-3"
            >
              <div className="pointer-events-none px-3 py-2 rounded-full bg-black/55 backdrop-blur-sm border border-white/10 text-white/40 text-[10px] font-black tracking-wide whitespace-nowrap flex-1 text-center">
                {ar ? 'اضغط على الجسر لرؤية الاكتشاف' : 'Tap a bridge to reveal the discovery'}
              </div>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={() => { setShowQA(true); setSelectedBridge(null); }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full shrink-0"
                style={{ background: 'rgba(215,200,38,0.14)', border: '1px solid rgba(215,200,38,0.35)', backdropFilter: 'blur(12px)' }}
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#D7C826]" />
                <span className="text-[11px] font-black text-[#D7C826]">{ar ? 'اسأل' : 'Ask'}</span>
              </motion.button>
            </motion.div>
          )}

          {/* ── Q&A panel ── */}
          <AnimatePresence>
            {showQA && (
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl p-6 space-y-4"
                style={{ background: 'rgba(0,4,18,0.97)', backdropFilter: 'blur(30px)', borderTop: '1px solid rgba(255,255,255,0.07)' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-[#D7C826]" />
                    <span className="text-sm font-black text-white">
                      {ar ? 'اسأل عن الجسور المخفية' : 'Ask about Hidden Bridges'}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowQA(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    <X className="w-4 h-4 text-white/40" />
                  </button>
                </div>

                {/* Input row */}
                <div
                  className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={qaQuery}
                    onChange={e => setQaQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && askQuestion()}
                    placeholder={ar ? 'ما علاقة فيزياء الكم بالذكاء الاصطناعي؟' : 'What connects quantum physics to AI?'}
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/25 min-w-0"
                    dir={ar ? 'rtl' : 'ltr'}
                  />
                  <button
                    onClick={askQuestion}
                    disabled={!qaQuery.trim() || loadingQA}
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90 disabled:opacity-30"
                    style={{ background: '#D7C826' }}
                  >
                    {loadingQA
                      ? <Loader2 className="w-4 h-4 text-black animate-spin" />
                      : <Send className="w-4 h-4 text-black" style={{ transform: ar ? 'scaleX(-1)' : undefined }} />}
                  </button>
                </div>

                {/* Answer */}
                <AnimatePresence>
                  {(qaAnswer !== null || loadingQA) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="rounded-2xl p-4 min-h-[80px] flex items-center justify-center"
                      style={{ background: 'rgba(215,200,38,0.05)', border: '1px solid rgba(215,200,38,0.18)' }}
                    >
                      {loadingQA ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#D7C826]" />
                          <span className="text-xs font-bold text-white/40">
                            {ar ? 'جارٍ تحليل الجسور المعرفية...' : 'Analyzing knowledge bridges...'}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-white/80 leading-relaxed" dir={ar ? 'rtl' : 'ltr'}>
                          {qaAnswer}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Swanson badge */}
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: 'rgba(215,200,38,0.07)', border: '1px solid rgba(215,200,38,0.18)' }}
                  dir={ar ? 'rtl' : 'ltr'}
                >
                  <FlaskConical className="w-3 h-3 text-[#D7C826] shrink-0" />
                  <span className="text-[10px] font-black text-[#D7C826]/70 leading-snug">
                    {ar
                      ? 'يحلل الجسور المخفية بين التخصصات — Undiscovered Public Knowledge · Swanson 1986'
                      : 'Analyzes hidden bridges between disciplines — Undiscovered Public Knowledge · Swanson 1986'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Bridge detail panel ── */}
          <AnimatePresence>
            {selectedBridge && (
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="absolute bottom-0 left-0 right-0 z-20 rounded-t-3xl p-6 space-y-4"
                style={{ background: 'rgba(0,6,20,0.94)', backdropFilter: 'blur(28px)', borderTop: '1px solid rgba(255,255,255,0.07)' }}
              >
                {/* Handle + close */}
                <div className="flex items-center justify-between">
                  <div className="w-8" />
                  <div className="w-10 h-1 rounded-full bg-white/15" />
                  <button onClick={() => setSelectedBridge(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <X className="w-4 h-4 text-white/40" />
                  </button>
                </div>

                {/* Discovery type badge */}
                <div className="flex justify-center">
                  <div className="px-3 py-1 rounded-full text-[11px] font-black"
                    style={{ background: `${selectedBridge.color}18`, color: selectedBridge.color, border: `1px solid ${selectedBridge.color}45` }}>
                    ✦ {ar ? selectedBridge.discoveryAr : selectedBridge.discoveryEn}
                  </div>
                </div>

                {/* Two books */}
                <div className="flex items-start gap-3" dir={ar ? 'rtl' : 'ltr'}>
                  <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'rgba(96,165,250,0.07)', border: '1px solid rgba(96,165,250,0.18)' }}>
                    <div className="text-[8px] font-black text-blue-300/50 mb-1 uppercase tracking-widest">{ar ? 'العلوم الطبيعية' : 'Natural Sciences'}</div>
                    <div className="text-xs font-black text-white leading-snug line-clamp-2">{selLeft?.title}</div>
                    <div className="text-[9px] text-blue-300/50 font-bold mt-1">{selLeft?.author}</div>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-1 shrink-0 pt-4">
                    <div className="w-px h-3 rounded-full" style={{ background: selectedBridge.color }} />
                    <Zap className="w-3 h-3" style={{ color: selectedBridge.color }} />
                    <div className="w-px h-3 rounded-full" style={{ background: selectedBridge.color }} />
                  </div>

                  <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'rgba(167,139,250,0.07)', border: '1px solid rgba(167,139,250,0.18)' }}>
                    <div className="text-[8px] font-black text-purple-300/50 mb-1 uppercase tracking-widest">{ar ? 'علوم الحاسب' : 'Computer Science'}</div>
                    <div className="text-xs font-black text-white leading-snug line-clamp-2">{selRight?.title}</div>
                    <div className="text-[9px] text-purple-300/50 font-bold mt-1">{selRight?.author}</div>
                  </div>
                </div>

                {/* Hidden connection insight */}
                <div className="rounded-2xl p-4 min-h-[80px] flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {loadingInsight ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#D7C826]" />
                      <span className="text-xs font-bold text-white/35">
                        {ar ? 'جارٍ كشف الاتصال المخفي...' : 'Revealing hidden connection...'}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-white/72 leading-relaxed text-center" dir={ar ? 'rtl' : 'ltr'}>
                      {bridgeInsight}
                    </p>
                  )}
                </div>

                {/* PhD badge */}
                <div className="rounded-xl px-3 py-2 flex items-center gap-2"
                  style={{ background: 'rgba(215,200,38,0.07)', border: '1px solid rgba(215,200,38,0.18)' }}
                  dir={ar ? 'rtl' : 'ltr'}>
                  <FlaskConical className="w-3 h-3 text-[#D7C826] shrink-0" />
                  <span className="text-[10px] font-black text-[#D7C826]/75 leading-snug">
                    {ar
                      ? 'Undiscovered Public Knowledge — Swanson 1986 — لم يُنشر هذا الاتصال في الأدبيات'
                      : 'Undiscovered Public Knowledge — Swanson 1986 — link not yet in literature'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
