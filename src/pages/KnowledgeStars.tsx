import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, GitBranch, Loader2 } from 'lucide-react';
import { MOCK_BOOKS } from '../data/mockData';
import { Book } from '../types';
import { useLanguage } from '../hooks/useLanguage';

// ── Module-level constants ─────────────────────────────────────────────────────
const STAR_BOOK_IDS = ['1', '2', '3', '4', '5', '6', '7', '9'];

interface Relation {
  from: string;
  to: string;
  typeAr: string;
  typeEn: string;
  color: string;
  strength: 1 | 2 | 3;
}

const RELATIONS: Relation[] = [
  { from: '1', to: '2', typeAr: 'نظرية كل شيء',       typeEn: 'Theory of Everything', color: '#D7C826', strength: 3 },
  { from: '1', to: '5', typeAr: 'علم الكونيات',        typeEn: 'Cosmology',            color: '#D7C826', strength: 2 },
  { from: '3', to: '4', typeAr: 'الفيزياء الكلاسيكية', typeEn: 'Classical Physics',    color: '#60A5FA', strength: 3 },
  { from: '2', to: '3', typeAr: 'ميكانيكا الكم',       typeEn: 'Quantum Mechanics',    color: '#60A5FA', strength: 2 },
  { from: '1', to: '4', typeAr: 'قوانين الكون',        typeEn: 'Laws of Universe',     color: '#34D399', strength: 2 },
  { from: '6', to: '9', typeAr: 'الخوارزميات',         typeEn: 'Applied Algorithms',   color: '#A78BFA', strength: 3 },
  { from: '7', to: '8', typeAr: 'فلسفة البرمجة',       typeEn: 'Prog. Philosophy',     color: '#F472B6', strength: 3 },
  { from: '5', to: '6', typeAr: 'الحوسبة العلمية',     typeEn: 'Scientific Computing', color: '#FB923C', strength: 1 },
];

const FALLBACK_INSIGHTS: Record<string, string> = {
  'نظرية كل شيء':       'كلا الكتابين يسعيان للإجابة عن السؤال الأكبر: هل يمكن توحيد قوانين الكون في نظرية واحدة؟ هوكينج وغرين يمشيان على الدرب ذاته من اتجاهين مختلفين — أحدهما من الكونيات، والآخر من نظرية الأوتار.',
  'علم الكونيات':        'الكتابان يتناولان أصل الكون ومصيره — أحدهما من ثقوب هوكينج السوداء، والآخر من عيون تايسون الفلكية على الكون الواسع. معاً يُكملان الصورة.',
  'الفيزياء الكلاسيكية': 'فاينمان يُبسّط المعقد بجماله المميز، وروفيلي يُعيد روايته بشعرية فيزيائية — معاً يُكوّنان صورة متكاملة للفيزياء الحديثة.',
  'ميكانيكا الكم':       'نظرية الأوتار عند غرين تعتمد على ميكانيكا الكم التي يشرحها روفيلي — أحدهما يبني على الآخر مباشرةً في سلسلة معرفية متكاملة.',
  'قوانين الكون':        'هوكينج وفاينمان — عقلان عظيمان يصفان الواقع بأدوات مختلفة، لكنهما يلتقيان في الإيمان بأن الكون محكوم بقوانين موحّدة وجميلة.',
  'الخوارزميات':         'كورمن يضع الأساس النظري، وراسل-نورفيغ يأخذها للتطبيق في الذكاء الاصطناعي — رحلة من النظرية الصرفة إلى الواقع التطبيقي.',
  'فلسفة البرمجة':       'مارتن وهانت يتفقان: البرمجة حرفة قبل أن تكون تقنية، والكود الجيد يُكتب مرةً واحدة بعناية وتفكير عميق.',
  'الحوسبة العلمية':     'تايسون يحدّث الأسئلة الكونية، وراسل-نورفيغ يقدّم الأدوات الحاسوبية للإجابة عنها — الفيزياء والذكاء الاصطناعي وجهان للعلم الحديث.',
};

const STAR_BOOKS: Book[] = STAR_BOOK_IDS
  .map(id => MOCK_BOOKS.find(b => b.id === id))
  .filter(Boolean) as Book[];

const N = STAR_BOOKS.length;

// ── Component ──────────────────────────────────────────────────────────────────
export function KnowledgeStars() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const ar = language === 'ar';

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [phase, setPhase] = useState<'loading' | 'live'>('loading');
  const [constellationReady, setConstellationReady] = useState(false);
  const [badgesReady, setBadgesReady] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState<Relation | null>(null);
  const [relationInsight, setRelationInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [svgDims, setSvgDims] = useState({ w: 375, h: 812 });

  // Memoised node positions — recomputed only when SVG dimensions change
  const nodes = useMemo(() => {
    const nY = svgDims.h * 0.78;
    return STAR_BOOKS.map((book, i) => ({
      book,
      x: ((i + 0.5) / N) * svgDims.w,
      y: nY,
    }));
  }, [svgDims.w, svgDims.h]);

  const getArcPath = useCallback((fromId: string, toId: string): string => {
    const fi = STAR_BOOKS.findIndex(b => b.id === fromId);
    const ti = STAR_BOOKS.findIndex(b => b.id === toId);
    if (fi < 0 || ti < 0) return '';
    const f = nodes[fi], t = nodes[ti];
    const dist = Math.abs(t.x - f.x);
    const arcH = Math.max(48, Math.min(dist * 0.7, svgDims.h * 0.42));
    return `M ${f.x} ${f.y} C ${f.x} ${f.y - arcH} ${t.x} ${t.y - arcH} ${t.x} ${t.y}`;
  }, [nodes, svgDims.h]);

  const getArcMidpoint = useCallback((fromId: string, toId: string) => {
    const fi = STAR_BOOKS.findIndex(b => b.id === fromId);
    const ti = STAR_BOOKS.findIndex(b => b.id === toId);
    if (fi < 0 || ti < 0) return null;
    const f = nodes[fi], t = nodes[ti];
    const dist = Math.abs(t.x - f.x);
    const arcH = Math.max(48, Math.min(dist * 0.7, svgDims.h * 0.42));
    return { x: (f.x + t.x) / 2, y: f.y - arcH * 0.75 };
  }, [nodes, svgDims.h]);

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
          .then(attach)
          .catch(() => { if (!cancelled) setPhase('live'); }); // fallback: dark bg
      });
    return () => { cancelled = true; streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  // ── SVG size tracking ──────────────────────────────────────────────────────
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

  // ── Constellation timing ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'live') return;
    const t1 = setTimeout(() => setConstellationReady(true), 900);
    const t2 = setTimeout(() => setBadgesReady(true), 900 + RELATIONS.length * 200 + 700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [phase]);

  // ── Fetch relation insight ─────────────────────────────────────────────────
  const openRelation = useCallback(async (rel: Relation) => {
    setSelectedRelation(rel);
    setRelationInsight(null);
    setLoadingInsight(true);
    const bookA = MOCK_BOOKS.find(b => b.id === rel.from);
    const bookB = MOCK_BOOKS.find(b => b.id === rel.to);
    try {
      const res = await fetch('/api/knowledge-relations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookA, bookB, relationType: rel.typeAr }),
      });
      if (res.ok) {
        const data = await res.json();
        setRelationInsight(data.insight ?? FALLBACK_INSIGHTS[rel.typeAr] ?? '');
        setLoadingInsight(false);
        return;
      }
    } catch { /* fall through */ }
    await new Promise<void>(r => setTimeout(r, 500));
    setRelationInsight(FALLBACK_INSIGHTS[rel.typeAr] ?? '');
    setLoadingInsight(false);
  }, []);

  const selBookA = selectedRelation ? MOCK_BOOKS.find(b => b.id === selectedRelation.from) : null;
  const selBookB = selectedRelation ? MOCK_BOOKS.find(b => b.id === selectedRelation.to) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">

      {/* ── Camera feed ── */}
      <video
        ref={videoRef}
        autoPlay playsInline muted
        className="absolute inset-0 w-full h-full object-cover opacity-55"
      />

      {/* Cosmic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/80 pointer-events-none" />

      {/* ── Loading ── */}
      {phase === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          >
            <Star className="w-10 h-10 text-[#D7C826]" />
          </motion.div>
          <p className="text-white/70 text-sm font-bold tracking-wide">
            {ar ? 'جارٍ رصد الكتب...' : 'Scanning books...'}
          </p>
        </div>
      )}

      {/* ── Live AR ── */}
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
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2.2, repeat: Infinity }}
                  className="text-[#D7C826] text-sm"
                >★</motion.span>
                <span className="text-white font-black text-sm tracking-wide">
                  {ar ? 'نجوم المعرفة' : 'Knowledge Stars'}
                </span>
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: 0.8 }}
                  className="text-[#D7C826] text-sm"
                >★</motion.span>
              </div>
              <p className="text-white/35 text-[9px] font-black tracking-widest uppercase mt-0.5">
                Spatial Knowledge Graph · AR
              </p>
            </div>

            <div className="w-10" />
          </div>

          {/* ── SVG constellation ── */}
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: 'none' }}
          >
            <defs>
              <filter id="ks-glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="ks-star" x="-120%" y="-120%" width="340%" height="340%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Relation arcs — draw in with pathLength */}
            {RELATIONS.map((rel, i) => {
              const path = getArcPath(rel.from, rel.to);
              if (!path) return null;
              const isSelected = selectedRelation?.from === rel.from && selectedRelation?.to === rel.to;
              return (
                <motion.path
                  key={`arc-${i}`}
                  d={path}
                  stroke={rel.color}
                  strokeWidth={isSelected ? rel.strength * 2.2 : rel.strength * 1.1}
                  fill="none"
                  strokeLinecap="round"
                  filter="url(#ks-glow)"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={constellationReady
                    ? { pathLength: 1, opacity: isSelected ? 1 : 0.5 }
                    : { pathLength: 0, opacity: 0 }}
                  transition={{ duration: 1.1, delay: i * 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              );
            })}

            {/* Star nodes */}
            {nodes.map(({ x, y }, i) => (
              <motion.g
                key={`node-${i}`}
                initial={{ opacity: 0 }}
                animate={constellationReady ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                {/* Outer pulsing ring */}
                <motion.circle
                  cx={x} cy={y} r={11}
                  fill="none"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth={0.6}
                  animate={{ opacity: [0.3, 0.04, 0.3] }}
                  transition={{ duration: 2.8 + i * 0.35, repeat: Infinity, delay: i * 0.22, ease: 'easeInOut' }}
                />
                {/* Mid ring */}
                <motion.circle
                  cx={x} cy={y} r={6.5}
                  fill="none"
                  stroke="rgba(255,255,255,0.45)"
                  strokeWidth={0.5}
                  animate={{ opacity: [0.45, 0.08, 0.45] }}
                  transition={{ duration: 2.3 + i * 0.3, repeat: Infinity, delay: 0.5 + i * 0.18, ease: 'easeInOut' }}
                />
                {/* Core star */}
                <circle cx={x} cy={y} r={3.5} fill="white" filter="url(#ks-star)" />
              </motion.g>
            ))}
          </svg>

          {/* ── Relation midpoint badges ── */}
          {badgesReady && RELATIONS.map((rel, i) => {
            const mid = getArcMidpoint(rel.from, rel.to);
            if (!mid) return null;
            const isSelected = selectedRelation?.from === rel.from && selectedRelation?.to === rel.to;
            return (
              <motion.button
                key={`badge-${i}`}
                initial={{ opacity: 0, scale: 0.55 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07, type: 'spring', stiffness: 270, damping: 22 }}
                onClick={() => openRelation(rel)}
                className="absolute text-[9px] font-black tracking-wide whitespace-nowrap rounded-full px-2 py-0.5 border transition-all active:scale-95"
                style={{
                  left: mid.x,
                  top: mid.y,
                  transform: 'translate(-50%, -50%)',
                  background: isSelected ? rel.color : 'rgba(0,0,0,0.60)',
                  backdropFilter: 'blur(8px)',
                  color: isSelected ? '#000' : rel.color,
                  borderColor: `${rel.color}70`,
                  boxShadow: isSelected ? `0 0 18px ${rel.color}55` : `0 0 8px ${rel.color}28`,
                }}
              >
                {ar ? rel.typeAr : rel.typeEn}
              </motion.button>
            );
          })}

          {/* ── Book title labels ── */}
          {constellationReady && nodes.map(({ book, x, y }, i) => (
            <motion.div
              key={`lbl-${book.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 + i * 0.1 }}
              className="absolute pointer-events-none text-center"
              style={{ left: x, top: y + 13, transform: 'translateX(-50%)', width: 58 }}
            >
              <div
                className="text-[7px] font-bold text-white/55 leading-tight"
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
              >
                {ar ? book.title : (book.titleEn ?? book.title)}
              </div>
            </motion.div>
          ))}

          {/* ── Pre-constellation hint ── */}
          {!constellationReady && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 text-center px-8"
              >
                <motion.div
                  animate={{ scale: [1, 1.07, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-16 h-16 rounded-full border-2 border-[#D7C826]/50 flex items-center justify-center"
                >
                  <GitBranch className="w-7 h-7 text-[#D7C826]" />
                </motion.div>
                <p className="text-white font-black text-sm">
                  {ar ? 'جارٍ تحليل العلاقات المعرفية...' : 'Mapping knowledge relations...'}
                </p>
              </motion.div>
            </div>
          )}

          {/* ── Usage tip ── */}
          {badgesReady && !selectedRelation && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none"
            >
              <div className="px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/45 text-[10px] font-black tracking-wide whitespace-nowrap">
                {ar ? 'اضغط على أي خط لاستكشاف التقاطع المعرفي' : 'Tap a badge to explore the knowledge link'}
              </div>
            </motion.div>
          )}

          {/* ── Relation detail panel ── */}
          <AnimatePresence>
            {selectedRelation && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="absolute bottom-0 left-0 right-0 z-20 rounded-t-3xl p-6 space-y-4"
                style={{
                  background: 'rgba(0, 8, 24, 0.93)',
                  backdropFilter: 'blur(28px)',
                  borderTop: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {/* Handle + close */}
                <div className="flex items-center justify-between">
                  <div className="w-8" />
                  <div className="w-10 h-1 rounded-full bg-white/15" />
                  <button
                    onClick={() => setSelectedRelation(null)}
                    className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.08)' }}
                  >
                    <X className="w-4 h-4 text-white/40" />
                  </button>
                </div>

                {/* Book pair */}
                <div className="flex items-start gap-3" dir={ar ? 'rtl' : 'ltr'}>
                  <div className="flex-1 text-center">
                    <div className="text-[9px] font-black text-white/35 mb-1 uppercase tracking-widest">
                      {ar ? 'الكتاب الأول' : 'Book A'}
                    </div>
                    <div className="text-xs font-black text-white leading-snug line-clamp-3">{selBookA?.title}</div>
                    <div className="text-[9px] text-white/35 font-bold mt-1">{selBookA?.author}</div>
                  </div>

                  <div className="flex flex-col items-center gap-1 shrink-0 pt-3">
                    <div className="h-px w-5 rounded-full" style={{ background: selectedRelation.color }} />
                    <div
                      className="px-2 py-0.5 rounded-full text-[8px] font-black text-center"
                      style={{
                        background: `${selectedRelation.color}18`,
                        color: selectedRelation.color,
                        border: `1px solid ${selectedRelation.color}45`,
                        maxWidth: 68,
                        lineHeight: 1.3,
                      }}
                    >
                      {ar ? selectedRelation.typeAr : selectedRelation.typeEn}
                    </div>
                    <div className="h-px w-5 rounded-full" style={{ background: selectedRelation.color }} />
                  </div>

                  <div className="flex-1 text-center">
                    <div className="text-[9px] font-black text-white/35 mb-1 uppercase tracking-widest">
                      {ar ? 'الكتاب الثاني' : 'Book B'}
                    </div>
                    <div className="text-xs font-black text-white leading-snug line-clamp-3">{selBookB?.title}</div>
                    <div className="text-[9px] text-white/35 font-bold mt-1">{selBookB?.author}</div>
                  </div>
                </div>

                {/* AI insight */}
                <div
                  className="rounded-2xl p-4 min-h-[72px] flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  {loadingInsight ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#D7C826]" />
                      <span className="text-xs font-bold text-white/35">
                        {ar ? 'جارٍ تحليل التقاطع المعرفي...' : 'Analyzing knowledge link...'}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-white/72 leading-relaxed text-center" dir={ar ? 'rtl' : 'ltr'}>
                      {relationInsight}
                    </p>
                  )}
                </div>

                {/* Research tag */}
                <div
                  className="rounded-xl px-3 py-2 flex items-center gap-2"
                  style={{ background: 'rgba(215,200,38,0.07)', border: '1px solid rgba(215,200,38,0.18)' }}
                  dir={ar ? 'rtl' : 'ltr'}
                >
                  <Star className="w-3 h-3 text-[#D7C826] shrink-0" />
                  <span className="text-[10px] font-black text-[#D7C826]/75 leading-snug">
                    {ar
                      ? 'Spatial Knowledge Graph — تمثيل معرفي في الفضاء الفيزيائي'
                      : 'Spatial Knowledge Graph — knowledge mapped onto physical space'}
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
