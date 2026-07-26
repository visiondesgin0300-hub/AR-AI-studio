import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Loader2, FlaskConical, MessageCircle, Send, Sparkles } from 'lucide-react';
import { MOCK_BOOKS } from '../data/mockData';
import { Book } from '../types';
import { useLanguage } from '../hooks/useLanguage';

const LEFT_IDS  = ['1', '3', '4'];
const RIGHT_IDS = ['6', '7', '9'];

const LEFT_BOOKS  = LEFT_IDS.map(id  => MOCK_BOOKS.find(b => b.id === id)).filter(Boolean) as Book[];
const RIGHT_BOOKS = RIGHT_IDS.map(id => MOCK_BOOKS.find(b => b.id === id)).filter(Boolean) as Book[];

const BRIDGE_COLORS = ['#D7C826', '#60A5FA', '#34D399', '#A78BFA', '#FB923C'];

interface DynamicBridge {
  leftId: string;
  rightId: string;
  connectionName: string;
  explanation: string;
  color: string;
  strength: 1 | 2 | 3;
}

const EXAMPLES_AR = [
  'ما علاقة فيزياء الكم بالذكاء الاصطناعي؟',
  'كيف يشبه الكون الخوارزمية؟',
  'ما الجسر بين الأناقة في الفيزياء والكود؟',
  'كيف ترتبط حدود العلم بحدود الحوسبة؟',
];

const EXAMPLES_EN = [
  'How does quantum physics relate to AI?',
  'How is the universe like an algorithm?',
  'What bridges elegance in physics and code?',
  'How do limits of science connect to computing?',
];

function fallbackBridges(q: string): { leftId: string; rightId: string; connectionName: string; strength: 1 | 2 | 3; explanation: string }[] {
  const t = q.toLowerCase();
  const picks: { leftId: string; rightId: string; connectionName: string; strength: 1 | 2 | 3; explanation: string }[] = [];

  if (/كم|quantum/.test(t))            picks.push({ leftId: '4', rightId: '6', connectionName: 'الحوسبة الكمية',       strength: 3, explanation: 'فاينمان أسّس الحوسبة الكمية بنفس المبادئ التي يبني عليها الذكاء الاصطناعي اليوم شبكاته العصبية.' });
  if (/ذكاء|artificial|ai\b/.test(t))  picks.push({ leftId: '1', rightId: '6', connectionName: 'حدود الذكاء',          strength: 3, explanation: 'هوكينج وضع حدوداً للمعرفة البشرية والذكاء الاصطناعي يضع حدوداً مشابهة للحواسيب — نفس السؤال بلغتين مختلفتين.' });
  if (/خوارزم|algorithm/.test(t))      picks.push({ leftId: '4', rightId: '9', connectionName: 'التفكير الحسابي',      strength: 2, explanation: 'فاينمان رأى الكون كحاسوب يحسب، وكورمن بنى خوارزميات تحاكي الطبيعة — نفس المعادلة في سياقين.' });
  if (/أناق|جمال|elegant|beauty/.test(t)) picks.push({ leftId: '3', rightId: '7', connectionName: 'فلسفة الأناقة',    strength: 2, explanation: 'روفيلي يجعل الجمال معياراً للصحة الفيزيائية، ومارتن يجعله معياراً للكود الجيد — الجمال علم.' });
  if (/شبك|network/.test(t))           picks.push({ leftId: '4', rightId: '6', connectionName: 'الشبكات والفيزياء',   strength: 1, explanation: 'فاينمان درس الشبكات الكمية بأدوات يستخدمها الذكاء الاصطناعي اليوم في شبكاته العصبية.' });
  if (/حد|limit|bound/.test(t))        picks.push({ leftId: '1', rightId: '9', connectionName: 'حدود الكون والحوسبة', strength: 2, explanation: 'هوكينج وكورمن كلاهما يبحث في ما لا يمكن حسابه — الكون ومعقدية الخوارزميات وجهان لنفس الحد.' });

  if (picks.length === 0) picks.push({ leftId: '1', rightId: '6', connectionName: 'حدود المعرفة', strength: 3, explanation: 'الجسر الأصلي بين العلوم الطبيعية وعلوم الحاسب — هوكينج والذكاء الاصطناعي يحددان معاً ما لا يمكن معرفته.' });

  const seen = new Set<string>();
  return picks.filter(p => {
    const k = `${p.leftId}-${p.rightId}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).slice(0, 3);
}

export function HiddenBridges() {
  const navigate     = useNavigate();
  const { language } = useLanguage();
  const ar = language === 'ar';

  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const svgRef    = useRef<SVGSVGElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  const [phase, setPhase]               = useState<'loading' | 'live'>('loading');
  const [zonesVisible, setZonesVisible] = useState(false);
  const [svgDims, setSvgDims]           = useState({ w: 375, h: 812 });

  const [dynBridges, setDynBridges]         = useState<DynamicBridge[]>([]);
  const [selectedBridge, setSelectedBridge] = useState<DynamicBridge | null>(null);

  const [showQA, setShowQA]     = useState(false);
  const [qaQuery, setQaQuery]   = useState('');
  const [qaAnswer, setQaAnswer] = useState<string | null>(null);
  const [loadingQA, setLoadingQA] = useState(false);

  const leftX   = svgDims.w * 0.10;
  const rightX  = svgDims.w * 0.90;
  const centerX = svgDims.w * 0.50;
  const ys = useMemo(() => [0.28, 0.48, 0.68].map(r => r * svgDims.h), [svgDims.h]);

  const leftNodes  = useMemo(() => LEFT_BOOKS.map((book, i)  => ({ book, x: leftX,  y: ys[i] ?? 0 })), [leftX,  ys]);
  const rightNodes = useMemo(() => RIGHT_BOOKS.map((book, i) => ({ book, x: rightX, y: ys[i] ?? 0 })), [rightX, ys]);

  const allPotentialPaths = useMemo(() => {
    const paths: string[] = [];
    for (let li = 0; li < 3; li++) {
      for (let ri = 0; ri < 3; ri++) {
        const x1 = leftX, y1 = ys[li] ?? 0;
        const x2 = rightX, y2 = ys[ri] ?? 0;
        const cx = (x2 - x1) * 0.38;
        paths.push(`M ${x1} ${y1} C ${x1+cx} ${y1} ${x2-cx} ${y2} ${x2} ${y2}`);
      }
    }
    return paths;
  }, [leftX, rightX, ys]);

  const bridgeGeometry = useMemo(() => dynBridges.map(b => {
    const li = LEFT_IDS.indexOf(b.leftId);
    const ri = RIGHT_IDS.indexOf(b.rightId);
    if (li < 0 || ri < 0) return null;
    const x1 = leftX, y1 = ys[li] ?? 0;
    const x2 = rightX, y2 = ys[ri] ?? 0;
    const cx = (x2 - x1) * 0.38;
    return { path: `M ${x1} ${y1} C ${x1+cx} ${y1} ${x2-cx} ${y2} ${x2} ${y2}`, midX: centerX, midY: (y1+y2)/2 };
  }), [dynBridges, leftX, rightX, centerX, ys]);

  const discoveryY = ys[1] ?? svgDims.h * 0.48;
  const hasBridges = dynBridges.length > 0;

  // Camera
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
          .then(attach).catch(() => { if (!cancelled) setPhase('live'); });
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
    if (phase !== 'live') return;
    const t = setTimeout(() => setZonesVisible(true), 700);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (showQA && !loadingQA) setTimeout(() => inputRef.current?.focus(), 150);
  }, [showQA, loadingQA]);

  const askQuestion = useCallback(async (question: string) => {
    const q = question.trim();
    if (!q || loadingQA) return;
    setQaQuery(q);
    setLoadingQA(true);
    setQaAnswer(null);
    setDynBridges([]);
    setSelectedBridge(null);
    setShowQA(true);

    try {
      const res = await fetch('/api/bridge-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, books: [...LEFT_BOOKS, ...RIGHT_BOOKS], leftIds: LEFT_IDS, rightIds: RIGHT_IDS }),
      });
      if (res.ok) {
        const data = await res.json();
        const raw: any[] = Array.isArray(data.bridges) ? data.bridges : [];
        const valid = raw.filter(b => LEFT_IDS.includes(b.leftId) && RIGHT_IDS.includes(b.rightId));
        const source = valid.length > 0 ? valid : fallbackBridges(q);
        setDynBridges(source.slice(0, 3).map((b, i) => ({
          leftId: b.leftId, rightId: b.rightId,
          connectionName: b.connectionName ?? '',
          explanation: b.explanation ?? data.answer ?? '',
          color: BRIDGE_COLORS[i % BRIDGE_COLORS.length],
          strength: ([1,2,3].includes(b.strength) ? b.strength : 2) as 1|2|3,
        })));
        setQaAnswer(data.answer ?? '');
        setLoadingQA(false);
        return;
      }
    } catch { /* fallthrough */ }

    const fb = fallbackBridges(q);
    setDynBridges(fb.map((b, i) => ({ ...b, color: BRIDGE_COLORS[i % BRIDGE_COLORS.length] })));
    setQaAnswer(ar
      ? `الجسور المخفية المرتبطة بسؤالك تُظهر روابط معرفية بين الفيزياء وعلوم الحاسب لم تُوثَّق رسمياً — هذا جوهر نظرية Swanson 1986.`
      : `The hidden bridges for your question reveal cross-disciplinary links not yet formally documented — the core of Swanson's 1986 theory.`
    );
    setLoadingQA(false);
  }, [loadingQA, ar]);

  const selLeft  = selectedBridge ? MOCK_BOOKS.find(b => b.id === selectedBridge.leftId)  : null;
  const selRight = selectedBridge ? MOCK_BOOKS.find(b => b.id === selectedBridge.rightId) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/30 to-black/80 pointer-events-none" />

      {phase === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
            <FlaskConical className="w-10 h-10 text-[#D7C826]" />
          </motion.div>
          <p className="text-white/70 text-sm font-bold">{ar ? 'جارٍ رصد التخصصات...' : 'Scanning disciplines...'}</p>
        </div>
      )}

      {phase === 'live' && (
        <>
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-12 pb-3">
            <button onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center">
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center">
                <motion.div animate={{ scale: [1,1.2,1] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Zap className="w-4 h-4 text-[#D7C826]" />
                </motion.div>
                <span className="text-white font-black text-sm tracking-wide">{ar ? 'الجسور المخفية' : 'Hidden Bridges'}</span>
                <motion.div animate={{ scale: [1,1.2,1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}>
                  <Zap className="w-4 h-4 text-[#D7C826]" />
                </motion.div>
              </div>
              <p className="text-white/35 text-[9px] font-black tracking-widest uppercase mt-0.5">Undiscovered Public Knowledge · AR</p>
            </div>
            <div className="w-10" />
          </div>

          {/* Zone panels */}
          <AnimatePresence>
            {zonesVisible && (
              <>
                <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
                  className="absolute top-[22%] bottom-[20%] rounded-r-2xl border-r border-t border-b border-blue-400/40 flex flex-col justify-between py-4 px-2"
                  style={{ left: 0, width: '22%', background: 'rgba(96,165,250,0.14)' }}>
                  <div className="text-[8px] font-black text-blue-300/70 uppercase tracking-widest leading-tight text-center">{ar ? 'العلوم\nالطبيعية' : 'Natural\nSciences'}</div>
                  <div className="text-[8px] font-black text-blue-300/40 text-center">{ar ? 'فيزياء' : 'Physics'}</div>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}
                  className="absolute top-[22%] bottom-[20%] rounded-l-2xl border-l border-t border-b border-purple-400/40 flex flex-col justify-between py-4 px-2"
                  style={{ right: 0, width: '22%', background: 'rgba(167,139,250,0.14)' }}>
                  <div className="text-[8px] font-black text-purple-300/70 uppercase tracking-widest leading-tight text-center">{ar ? 'علوم\nالحاسب' : 'Computer\nScience'}</div>
                  <div className="text-[8px] font-black text-purple-300/40 text-center">{ar ? 'هندسة' : 'Engineering'}</div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* SVG */}
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

            {hasBridges && (
              <motion.ellipse cx={centerX} cy={discoveryY} rx={svgDims.w*0.16} ry={svgDims.h*0.09}
                fill="url(#hb-disc-grad)" initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }} />
            )}

            {zonesVisible && !hasBridges && allPotentialPaths.map((path, i) => (
              <motion.path key={`pot-${i}`} d={path}
                stroke="rgba(255,255,255,0.10)" strokeWidth={0.8} strokeDasharray="6 10"
                fill="none" strokeLinecap="round"
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: 1, pathLength: 1 }}
                transition={{ delay: 0.5 + i * 0.06, duration: 1 }} />
            ))}

            {dynBridges.map((bridge, i) => {
              const geo = bridgeGeometry[i];
              if (!geo) return null;
              const sel = selectedBridge?.leftId === bridge.leftId && selectedBridge?.rightId === bridge.rightId;
              return (
                <motion.path key={`br-${i}`} d={geo.path}
                  stroke={bridge.color} strokeWidth={sel ? bridge.strength*2.8 : bridge.strength*1.4}
                  fill="none" strokeLinecap="round" filter="url(#hb-glow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: sel ? 1 : 0.55 }}
                  transition={{ duration: 1.2, delay: i*0.22, ease: [0.25,0.46,0.45,0.94] }} />
              );
            })}

            {leftNodes.map(({ x, y }, i) => (
              <motion.g key={`ln-${i}`} initial={{ opacity: 0 }} animate={zonesVisible ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 0.3+i*0.12 }}>
                <motion.circle cx={x} cy={y} r={18} fill="none" stroke="rgba(96,165,250,0.5)" strokeWidth={2}
                  animate={{ opacity: [0.4,0.08,0.4] }} transition={{ duration: 2.5+i*0.4, repeat: Infinity, delay: i*0.3 }} />
                <circle cx={x} cy={y} r={8} fill="#60A5FA" filter="url(#hb-node)" />
              </motion.g>
            ))}

            {rightNodes.map(({ x, y }, i) => (
              <motion.g key={`rn-${i}`} initial={{ opacity: 0 }} animate={zonesVisible ? { opacity: 1 } : { opacity: 0 }} transition={{ delay: 0.3+i*0.12 }}>
                <motion.circle cx={x} cy={y} r={18} fill="none" stroke="rgba(167,139,250,0.5)" strokeWidth={2}
                  animate={{ opacity: [0.4,0.08,0.4] }} transition={{ duration: 2.5+i*0.4, repeat: Infinity, delay: i*0.3 }} />
                <circle cx={x} cy={y} r={8} fill="#A78BFA" filter="url(#hb-node)" />
              </motion.g>
            ))}

            {hasBridges && (
              <motion.circle cx={centerX} cy={discoveryY} r={5} fill="#D7C826" filter="url(#hb-discovery)"
                initial={{ opacity: 0 }} animate={{ r: [5,8,5], opacity: [0.9,0.3,0.9] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
            )}
          </svg>

          {/* Book labels */}
          {zonesVisible && (
            <>
              {leftNodes.map(({ book, x, y }, i) => (
                <motion.div key={`ll-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5+i*0.12 }}
                  className="absolute pointer-events-none"
                  style={{ left: 4, top: y + 22, width: '20%' }}>
                  <div className="text-[10px] font-bold text-blue-200 leading-tight text-center px-1.5 py-0.5 rounded-lg"
                    style={{ background: 'rgba(96,165,250,0.20)', backdropFilter: 'blur(6px)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ar ? book.title : (book.titleEn ?? book.title)}
                  </div>
                </motion.div>
              ))}
              {rightNodes.map(({ book, x, y }, i) => (
                <motion.div key={`rl-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5+i*0.12 }}
                  className="absolute pointer-events-none"
                  style={{ right: 4, top: y + 22, width: '20%' }}>
                  <div className="text-[10px] font-bold text-purple-200 leading-tight text-center px-1.5 py-0.5 rounded-lg"
                    style={{ background: 'rgba(167,139,250,0.20)', backdropFilter: 'blur(6px)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ar ? book.title : (book.titleEn ?? book.title)}
                  </div>
                </motion.div>
              ))}
            </>
          )}

          {/* Discovery zone label */}
          {hasBridges && (
            <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, type: 'spring', stiffness: 260, damping: 22 }}
              className="absolute pointer-events-none"
              style={{ left: centerX, top: discoveryY-34, transform: 'translateX(-50%)' }}>
              <div className="px-2 py-0.5 rounded-full bg-[#D7C826]/20 border border-[#D7C826]/40 text-[8px] font-black text-[#D7C826] tracking-widest whitespace-nowrap">
                {ar ? '✦ منطقة الاكتشاف ✦' : '✦ DISCOVERY ZONE ✦'}
              </div>
            </motion.div>
          )}

          {/* Bridge badges */}
          {hasBridges && dynBridges.map((bridge, i) => {
            const geo = bridgeGeometry[i];
            if (!geo) return null;
            const sel = selectedBridge?.leftId === bridge.leftId && selectedBridge?.rightId === bridge.rightId;
            return (
              <motion.button key={`bb-${i}`}
                initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4+i*0.12, type: 'spring', stiffness: 270, damping: 22 }}
                onClick={() => { setSelectedBridge(bridge); setShowQA(false); }}
                className="absolute text-[11px] font-black tracking-wide whitespace-nowrap rounded-full px-3 py-1 border active:scale-95 transition-all"
                style={{
                  left: geo.midX, top: geo.midY, transform: 'translate(-50%,-50%)', zIndex: 15,
                  background: sel ? bridge.color : 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
                  color: sel ? '#000' : bridge.color, borderColor: `${bridge.color}65`,
                  boxShadow: sel ? `0 0 20px ${bridge.color}55` : `0 0 8px ${bridge.color}28`,
                }}>
                {bridge.connectionName}
              </motion.button>
            );
          })}

          {/* Initial prompt — no bridges yet */}
          <AnimatePresence>
            {zonesVisible && !hasBridges && !loadingQA && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: 0.5 }}
                className="absolute left-0 right-0 flex flex-col items-center px-6 gap-4"
                style={{ top: '22%' }}>
                <motion.div animate={{ scale: [1,1.1,1] }} transition={{ duration: 2, repeat: Infinity }}
                  className="w-14 h-14 rounded-full border-2 border-[#D7C826]/50 flex items-center justify-center"
                  style={{ background: 'rgba(215,200,38,0.08)' }}>
                  <Sparkles className="w-6 h-6 text-[#D7C826]" />
                </motion.div>
                <div className="text-center space-y-1">
                  <p className="text-white font-black text-sm">{ar ? 'اسأل عن جسر مخفي' : 'Ask about a hidden bridge'}</p>
                  <p className="text-white/40 text-[11px] font-bold">{ar ? 'اكتب سؤالاً لاكتشاف الروابط المخفية بين التخصصين' : 'Type a question to discover hidden cross-disciplinary links'}</p>
                </div>
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  {(ar ? EXAMPLES_AR : EXAMPLES_EN).map((ex, i) => (
                    <motion.button key={i}
                      initial={{ opacity: 0, x: ar ? 10 : -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7+i*0.08 }}
                      onClick={() => askQuestion(ex)}
                      className="px-4 py-2.5 rounded-2xl text-xs font-bold text-white/75 active:scale-95 transition-all text-start"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', backdropFilter: 'blur(10px)' }}
                      dir={ar ? 'rtl' : 'ltr'}>
                      <span className="text-[#D7C826]">→ </span>{ex}
                    </motion.button>
                  ))}
                </div>
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}
                  onClick={() => setShowQA(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-sm"
                  style={{ background: '#D7C826', color: '#001a00' }}>
                  <MessageCircle className="w-4 h-4" />
                  {ar ? 'اكتب سؤالك' : 'Write your question'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading */}
          <AnimatePresence>
            {loadingQA && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                  <Loader2 className="w-10 h-10 text-[#D7C826]" />
                </motion.div>
                <p className="text-white font-black text-sm">{ar ? 'جارٍ اكتشاف الجسور المخفية...' : 'Discovering hidden bridges...'}</p>
                <p className="text-white/35 text-xs font-bold">"{qaQuery}"</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom bar — ask again */}
          {hasBridges && !showQA && !selectedBridge && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-6 left-0 right-0 flex items-center justify-between px-5 gap-3">
              <div className="pointer-events-none px-3 py-2 rounded-full bg-black/55 backdrop-blur-sm border border-white/10 text-white/40 text-[10px] font-black flex-1 text-center">
                {ar ? 'اضغط على الجسر لرؤية التفاصيل' : 'Tap a bridge to see details'}
              </div>
              <motion.button whileTap={{ scale: 0.92 }} onClick={() => setShowQA(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full shrink-0"
                style={{ background: 'rgba(215,200,38,0.14)', border: '1px solid rgba(215,200,38,0.35)', backdropFilter: 'blur(12px)' }}>
                <MessageCircle className="w-3.5 h-3.5 text-[#D7C826]" />
                <span className="text-[11px] font-black text-[#D7C826]">{ar ? 'سؤال جديد' : 'New question'}</span>
              </motion.button>
            </motion.div>
          )}

          {/* Q&A panel */}
          <AnimatePresence>
            {showQA && !loadingQA && (
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl p-6 space-y-4"
                style={{ background: 'rgba(0,4,18,0.97)', backdropFilter: 'blur(30px)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-[#D7C826]" />
                    <span className="text-sm font-black text-white">{ar ? 'اسأل عن الجسور المخفية' : 'Ask about Hidden Bridges'}</span>
                  </div>
                  <button onClick={() => setShowQA(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <X className="w-4 h-4 text-white/40" />
                  </button>
                </div>

                <div className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)' }}>
                  <input ref={inputRef} type="text" value={qaQuery}
                    onChange={e => setQaQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && askQuestion(qaQuery)}
                    placeholder={ar ? 'ما علاقة فيزياء الكم بالذكاء الاصطناعي؟' : 'How does quantum physics relate to AI?'}
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/25 min-w-0"
                    dir={ar ? 'rtl' : 'ltr'} />
                  <button onClick={() => askQuestion(qaQuery)} disabled={!qaQuery.trim()}
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 active:scale-90 disabled:opacity-30 transition-all"
                    style={{ background: '#D7C826' }}>
                    <Send className="w-4 h-4 text-black" style={{ transform: ar ? 'scaleX(-1)' : undefined }} />
                  </button>
                </div>

                <AnimatePresence>
                  {qaAnswer !== null && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl p-4 min-h-[70px]"
                      style={{ background: 'rgba(215,200,38,0.05)', border: '1px solid rgba(215,200,38,0.18)' }}>
                      <p className="text-sm font-bold text-white/80 leading-relaxed" dir={ar ? 'rtl' : 'ltr'}>{qaAnswer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!qaAnswer && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">{ar ? 'أمثلة' : 'Examples'}</p>
                    {(ar ? EXAMPLES_AR : EXAMPLES_EN).map((ex, i) => (
                      <button key={i} onClick={() => askQuestion(ex)}
                        className="text-xs font-bold text-white/55 text-start px-3 py-1.5 rounded-xl active:scale-95 transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                        dir={ar ? 'rtl' : 'ltr'}>
                        <span className="text-[#D7C826]">→ </span>{ex}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                  style={{ background: 'rgba(215,200,38,0.07)', border: '1px solid rgba(215,200,38,0.18)' }}
                  dir={ar ? 'rtl' : 'ltr'}>
                  <FlaskConical className="w-3 h-3 text-[#D7C826] shrink-0" />
                  <span className="text-[10px] font-black text-[#D7C826]/70 leading-snug">
                    {ar ? 'يبني الجسور بناءً على سؤالك — Undiscovered Public Knowledge · Swanson 1986' : 'Builds bridges from your question — Undiscovered Public Knowledge · Swanson 1986'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bridge detail panel */}
          <AnimatePresence>
            {selectedBridge && !showQA && (
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="absolute bottom-0 left-0 right-0 z-20 rounded-t-3xl p-6 space-y-4"
                style={{ background: 'rgba(0,6,20,0.94)', backdropFilter: 'blur(28px)', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center justify-between">
                  <div className="w-8" />
                  <div className="w-10 h-1 rounded-full bg-white/15" />
                  <button onClick={() => setSelectedBridge(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <X className="w-4 h-4 text-white/40" />
                  </button>
                </div>

                <div className="flex justify-center">
                  <div className="px-3 py-1 rounded-full text-[11px] font-black"
                    style={{ background: `${selectedBridge.color}18`, color: selectedBridge.color, border: `1px solid ${selectedBridge.color}45` }}>
                    ✦ {selectedBridge.connectionName}
                  </div>
                </div>

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

                <div className="rounded-2xl p-4 min-h-[70px] flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-sm font-bold text-white/72 leading-relaxed text-center" dir={ar ? 'rtl' : 'ltr'}>
                    {selectedBridge.explanation}
                  </p>
                </div>

                <div className="rounded-xl px-3 py-2 flex items-center gap-2"
                  style={{ background: 'rgba(215,200,38,0.07)', border: '1px solid rgba(215,200,38,0.18)' }}
                  dir={ar ? 'rtl' : 'ltr'}>
                  <FlaskConical className="w-3 h-3 text-[#D7C826] shrink-0" />
                  <span className="text-[10px] font-black text-[#D7C826]/75 leading-snug">
                    {ar ? 'Undiscovered Public Knowledge — Swanson 1986 — لم يُنشر هذا الاتصال في الأدبيات' : 'Undiscovered Public Knowledge — Swanson 1986 — link not yet in literature'}
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
