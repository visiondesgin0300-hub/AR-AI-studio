import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { GitBranch, Sparkles, ChevronLeft, ChevronRight, MapPin, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';
import { MOCK_BOOKS } from '../data/mockData';
import { Book } from '../types';

interface GraphNode { id: string; title: string; author: string; relation: string; why?: string; isLibrary: boolean; shelf?: string; x: number; y: number; }

const RELATION_COLOR: Record<string, string> = {
  'نفس التخصص': '#D7C826',
  'نفس المؤلف': '#10B981',
  'مكمِّل': '#60A5FA',
  'متقدم': '#F59E0B',
  'مدخل': '#34D399',
  'مرجع جانبي': '#A78BFA',
};

function getColor(rel: string) {
  for (const [key, val] of Object.entries(RELATION_COLOR)) {
    if (rel.includes(key)) return val;
  }
  return '#94A3B8';
}

function drawGraph(canvas: HTMLCanvasElement, center: GraphNode, nodes: GraphNode[], hovered: string | null) {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const cx = center.x, cy = center.y;

  nodes.forEach(node => {
    const color = getColor(node.relation);
    const isHov = hovered === node.id;

    // Edge
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(node.x, node.y);
    ctx.strokeStyle = `${color}55`;
    ctx.lineWidth = isHov ? 2.5 : 1.5;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Node circle
    const r = node.isLibrary ? 22 : 18;
    ctx.beginPath();
    ctx.arc(node.x, node.y, r + (isHov ? 4 : 0), 0, Math.PI * 2);
    ctx.fillStyle = isHov ? color : `${color}33`;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Icon char
    ctx.fillStyle = isHov ? '#000' : color;
    ctx.font = `bold ${node.isLibrary ? 11 : 9}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.isLibrary ? '📚' : '📖', node.x, node.y);

    // Title below node
    ctx.fillStyle = isHov ? '#fff' : 'rgba(255,255,255,0.65)';
    ctx.font = `${isHov ? 'bold ' : ''}${node.isLibrary ? 10 : 9}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const label = node.title.length > 18 ? node.title.slice(0, 16) + '…' : node.title;
    ctx.fillText(label, node.x, node.y + r + 6);
  });

  // Center node
  const cr = 32;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
  grad.addColorStop(0, 'rgba(215,200,38,0.4)');
  grad.addColorStop(1, 'rgba(215,200,38,0.08)');
  ctx.beginPath();
  ctx.arc(cx, cy, cr, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#D7C826';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cLabel = center.title.length > 16 ? center.title.slice(0, 14) + '…' : center.title;
  ctx.fillText(cLabel, cx, cy);
}

function layoutNodes(nodes: GraphNode[], cx: number, cy: number, radius: number): GraphNode[] {
  return nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    const r = radius + (i % 2 === 0 ? 0 : 30);
    return { ...n, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
}

export function KnowledgeWeb() {
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [search, setSearch] = useState('');

  const filtered = MOCK_BOOKS.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 12);

  async function loadGraph(book: Book) {
    setSelectedBook(book);
    setLoading(true);
    setNodes([]);
    setHovered(null);

    try {
      const res = await fetch('/api/knowledge-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: book.id, title: book.title, author: book.author, category: book.category }),
      });
      const data = await res.json();

      const canvas = canvasRef.current;
      if (!canvas) return;
      const W = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H / 2;

      const libraryNodes: GraphNode[] = (data.nodes ?? []).map((n: any) => ({
        id: n.id, title: n.title, author: '', relation: n.relation, isLibrary: true, shelf: n.shelf, x: 0, y: 0,
      }));
      const externalNodes: GraphNode[] = (data.externalTitles ?? []).map((n: any, i: number) => ({
        id: `ext-${i}`, title: n.title, author: n.author, relation: n.relation, why: n.why, isLibrary: false, x: 0, y: 0,
      }));

      const all = layoutNodes([...libraryNodes, ...externalNodes], cx, cy, 150);
      setNodes(all);
    } catch { /* ignore */ }

    setLoading(false);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedBook || nodes.length === 0) return;
    const W = canvas.offsetWidth;
    const H = Math.min(420, window.innerHeight * 0.55);
    canvas.width = W;
    canvas.height = H;
    const center: GraphNode = { id: 'center', title: selectedBook.title, author: selectedBook.author, relation: '', isLibrary: true, x: W / 2, y: H / 2 };
    const positioned = layoutNodes(nodes, W / 2, H / 2, Math.min(W, H) * 0.32);
    setNodes(positioned);
    drawGraph(canvas, center, positioned, hovered);
  }, [selectedBook, nodes.length, hovered]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleCanvasMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let found: GraphNode | null = null;
    for (const n of nodes) {
      const dist = Math.hypot(n.x - mx, n.y - my);
      if (dist < 28) { found = n; break; }
    }
    setHovered(found?.id ?? null);
    setHoveredNode(found);
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (hoveredNode?.isLibrary && hoveredNode.id !== 'center') {
      navigate(`/book/${hoveredNode.id}`);
    }
  }

  return (
    <div className={cn('space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto pb-20', dir === 'rtl' ? 'text-right' : 'text-left')} dir={dir}>

      {/* Header */}
      <div className={cn('flex items-center gap-3', dir === 'rtl' ? 'flex-row-reverse' : '')}>
        <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
          <GitBranch className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight">خريطة المعرفة</h1>
          <p className="text-slate-400 dark:text-slate-500 font-bold text-xs">اختر كتاباً لرؤية شبكة الكتب المرتبطة به</p>
        </div>
      </div>

      {/* Book selector */}
      <div className="official-card p-5 bg-white dark:bg-slate-900 space-y-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ابحث عن كتاب..."
          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 text-primary dark:text-white text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-accent/50 transition-colors"
          dir="rtl"
        />
        <div className="flex gap-2 flex-wrap">
          {filtered.map(book => (
            <button
              key={book.id}
              onClick={() => loadGraph(book)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-black border transition-all active:scale-95',
                selectedBook?.id === book.id
                  ? 'bg-accent text-primary border-accent'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-white/5 hover:border-accent/40'
              )}
            >
              {book.title.length > 28 ? book.title.slice(0, 26) + '…' : book.title}
            </button>
          ))}
        </div>
      </div>

      {/* Graph canvas */}
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="official-card p-12 bg-white dark:bg-slate-900 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <p className="text-slate-400 font-bold text-sm">يبني Gemini شبكة المعرفة…</p>
          </motion.div>
        )}

        {!loading && selectedBook && nodes.length > 0 && (
          <motion.div key="graph" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            className="official-card p-0 bg-slate-950 overflow-hidden">
            <div className={cn('flex items-center justify-between px-5 py-3 border-b border-white/5', dir === 'rtl' ? 'flex-row-reverse' : '')}>
              <span className="text-white/50 font-mono text-[10px] uppercase tracking-widest">Knowledge Graph · {selectedBook.title.slice(0, 30)}</span>
              <div className="flex gap-3">
                {Object.entries(RELATION_COLOR).slice(0, 4).map(([label, color]) => (
                  <div key={label} className={cn('flex items-center gap-1', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-[9px] font-bold text-white/40">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <canvas
              ref={canvasRef}
              className="w-full cursor-pointer"
              style={{ minHeight: 360 }}
              onMouseMove={handleCanvasMove}
              onMouseLeave={() => { setHovered(null); setHoveredNode(null); }}
              onClick={handleCanvasClick}
            />

            {/* Tooltip */}
            <AnimatePresence>
              {hoveredNode && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="mx-4 mb-4 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1"
                  dir="rtl"
                >
                  <div className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded border"
                      style={{ color: getColor(hoveredNode.relation), borderColor: `${getColor(hoveredNode.relation)}44`, background: `${getColor(hoveredNode.relation)}11` }}>
                      {hoveredNode.relation}
                    </span>
                    {hoveredNode.isLibrary && <span className="text-[9px] font-black text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded">في المكتبة</span>}
                  </div>
                  <p className="text-white font-black text-sm">{hoveredNode.title}</p>
                  {hoveredNode.author && <p className="text-white/50 text-xs">{hoveredNode.author}</p>}
                  {hoveredNode.why && <p className="text-white/40 text-xs italic">{hoveredNode.why}</p>}
                  {hoveredNode.isLibrary && (
                    <div className={cn('flex items-center gap-1.5 pt-1', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                      <MapPin className="w-3 h-3 text-accent" />
                      <span className="text-accent text-xs font-bold">{hoveredNode.shelf}</span>
                      <span className="text-white/30 text-xs">· اضغط للانتقال</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <p className="px-5 pb-4 text-center text-[10px] text-white/25 font-bold">
              🟡 في المكتبة — يمكن الضغط للانتقال إليه · 📖 مقترح خارجي
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
