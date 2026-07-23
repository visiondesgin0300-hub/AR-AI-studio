import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Sparkles, ChevronLeft, ChevronRight, RotateCcw, X, BookOpen, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';

interface Flashcard { q: string; a: string; difficulty: 'easy' | 'medium' | 'hard' }

const DIFFICULTY_STYLE: Record<string, string> = {
  easy:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  medium: 'bg-accent/15 text-accent border-accent/30',
  hard:   'bg-red-500/15 text-red-400 border-red-500/30',
};
const DIFFICULTY_AR: Record<string, string> = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' };

function captureFromVideo(video: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d')!.drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
}

export function StudyCards() {
  const navigate = useNavigate();
  const { dir } = useLanguage();

  // Input state
  const [mode, setMode] = useState<'topic' | 'camera'>('topic');
  const [topic, setTopic] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Cards state
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState(0);

  const currentCard = cards[currentIdx];

  // Camera
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCameraActive(true);
    } catch { setMode('topic'); }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraActive(false);
  }

  function capturePhoto() {
    if (!videoRef.current) return;
    const data = captureFromVideo(videoRef.current);
    const preview = `data:image/jpeg;base64,${data}`;
    setImagePreview(preview);
    setImageData(data);
    stopCamera();
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      setImageData(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  }

  async function generate() {
    if (!topic.trim() && !imageData) return;
    setLoading(true);
    setCards([]);
    setCurrentIdx(0);
    setFlipped(false);
    try {
      const res = await fetch('/api/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim() || undefined, imageData: imageData || undefined, count: 6 }),
      });
      const data = await res.json();
      setCards(data.cards ?? []);
    } catch { /* show empty state */ }
    setLoading(false);
  }

  function navigate_card(delta: number) {
    setDirection(delta);
    setFlipped(false);
    setCurrentIdx(i => Math.max(0, Math.min(cards.length - 1, i + delta)));
  }

  function reset() {
    setCards([]);
    setTopic('');
    setImagePreview(null);
    setImageData(null);
  }

  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-slate-950 via-primary/20 to-slate-950 flex flex-col items-center px-4 py-8 font-sans', dir === 'rtl' ? 'text-right' : 'text-left')} dir={dir}>

      {/* Header */}
      <div className="w-full max-w-xl mb-8">
        <div className={cn('flex items-center gap-3 mb-6', dir === 'rtl' ? 'flex-row-reverse' : '')}>
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all">
            {dir === 'rtl' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          <div className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
            <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent" />
            </div>
            <h1 className="text-lg font-black text-white tracking-tight">بطاقات الدراسة الذكية</h1>
          </div>
        </div>

        {cards.length === 0 && (
          <div className="space-y-5">
            {/* Mode toggle */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl">
              {(['topic', 'camera'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); if (m === 'camera') startCamera(); else stopCamera(); }}
                  className={cn('flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2',
                    mode === m ? 'bg-accent text-primary shadow-lg' : 'text-white/50 hover:text-white')}
                >
                  {m === 'topic' ? <><BookOpen className="w-3.5 h-3.5" />موضوع نصي</> : <><Camera className="w-3.5 h-3.5" />صورة صفحة</>}
                </button>
              ))}
            </div>

            {/* Topic input */}
            {mode === 'topic' && (
              <textarea
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="اكتب موضوع الدراسة... مثال: الديناميكا الحرارية، الاقتصاد الكلي، التعلم الآلي"
                className="w-full h-28 p-4 rounded-2xl bg-white/8 border border-white/10 text-white text-sm font-medium placeholder:text-white/30 resize-none focus:outline-none focus:border-accent/50 transition-colors"
                dir="rtl"
              />
            )}

            {/* Camera mode */}
            {mode === 'camera' && (
              <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10">
                {cameraActive ? (
                  <>
                    <video ref={videoRef} muted playsInline className="w-full aspect-video object-cover" />
                    <button onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white border-4 border-accent shadow-xl active:scale-90 transition-transform" />
                  </>
                ) : imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="preview" className="w-full aspect-video object-cover opacity-80" />
                    <button onClick={() => { setImagePreview(null); setImageData(null); startCamera(); }}
                      className="absolute top-3 right-3 p-2 bg-black/60 rounded-xl text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="aspect-video flex flex-col items-center justify-center gap-3 cursor-pointer" onClick={() => fileRef.current?.click()}>
                    <Camera className="w-10 h-10 text-white/30" />
                    <p className="text-white/40 text-xs font-bold">اضغط لاختيار صورة صفحة كتاب</p>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </div>
                )}
              </div>
            )}

            <button
              onClick={generate}
              disabled={loading || (!topic.trim() && !imageData)}
              className="w-full py-4 bg-accent text-primary rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-40 hover:brightness-110 active:scale-95 transition-all"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />جاري التوليد...</> : <><Sparkles className="w-4 h-4" />ولّد البطاقات</>}
            </button>
          </div>
        )}
      </div>

      {/* Cards view */}
      <AnimatePresence mode="wait">
        {cards.length > 0 && currentCard && (
          <motion.div
            key="cards"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl space-y-6"
          >
            {/* Progress */}
            <div className={cn('flex items-center justify-between', dir === 'rtl' ? 'flex-row-reverse' : '')}>
              <span className="text-white/50 text-xs font-black uppercase tracking-widest">{currentIdx + 1} / {cards.length}</span>
              <div className="flex gap-1">
                {cards.map((_, i) => (
                  <div key={i} className={cn('h-1 rounded-full transition-all', i === currentIdx ? 'w-6 bg-accent' : i < currentIdx ? 'w-2 bg-accent/50' : 'w-2 bg-white/15')} />
                ))}
              </div>
              <button onClick={reset} className="text-white/40 hover:text-white text-xs font-black uppercase tracking-wider flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5" />إعادة
              </button>
            </div>

            {/* Flip card */}
            <div className="perspective-1000 cursor-pointer" style={{ perspective: '1000px' }} onClick={() => setFlipped(f => !f)}>
              <motion.div
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.5, type: 'spring', damping: 20 }}
                style={{ transformStyle: 'preserve-3d' }}
                className="relative w-full"
              >
                {/* Front */}
                <div className="w-full min-h-48 rounded-3xl bg-gradient-to-br from-primary/40 to-slate-900 border border-white/10 p-8 flex flex-col items-center justify-center gap-4 backface-hidden" style={{ backfaceVisibility: 'hidden' }}>
                  <div className={cn('px-3 py-1 rounded-full border text-xs font-black uppercase', DIFFICULTY_STYLE[currentCard.difficulty])}>
                    {DIFFICULTY_AR[currentCard.difficulty] ?? currentCard.difficulty}
                  </div>
                  <p className="text-white font-black text-lg text-center leading-relaxed" dir="rtl">{currentCard.q}</p>
                  <p className="text-white/30 text-xs font-bold mt-2">اضغط لرؤية الإجابة</p>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 min-h-48 rounded-3xl bg-gradient-to-br from-accent/20 to-slate-900 border border-accent/30 p-8 flex flex-col items-center justify-center gap-4"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-accent" />
                  </div>
                  <p className="text-white font-bold text-base text-center leading-relaxed" dir="rtl">{currentCard.a}</p>
                </div>
              </motion.div>
            </div>

            {/* Navigation */}
            <div className={cn('flex items-center gap-3', dir === 'rtl' ? 'flex-row-reverse' : '')}>
              <button
                onClick={() => navigate_card(-1)}
                disabled={currentIdx === 0}
                className="flex-1 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black text-sm disabled:opacity-30 transition-all flex items-center justify-center gap-2"
              >
                {dir === 'rtl' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                السابق
              </button>
              <button
                onClick={() => setFlipped(f => !f)}
                className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white/70 font-black text-sm transition-all"
              >
                قلّب
              </button>
              <button
                onClick={() => navigate_card(1)}
                disabled={currentIdx === cards.length - 1}
                className="flex-1 py-3.5 rounded-2xl bg-accent text-primary font-black text-sm disabled:opacity-30 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                التالي
                {dir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            {/* Completed */}
            {currentIdx === cards.length - 1 && flipped && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3"
              >
                <p className="text-emerald-400 font-black text-sm">🎉 أكملت جميع البطاقات!</p>
                <button onClick={reset} className="px-6 py-2.5 bg-accent text-primary rounded-xl text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all">
                  موضوع جديد
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
