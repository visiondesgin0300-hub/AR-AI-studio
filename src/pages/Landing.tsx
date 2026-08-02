import React from 'react';
import { motion } from 'motion/react';
import { Brain, Globe, Search, BookOpen, Map as MapIcon, Camera, LogIn, Compass, Users, VolumeX, Monitor, Printer, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';
import { RafeeqAvatar } from '../components/RafeeqAvatar';

const STEPS = [
  { icon: Search, ar: 'ابحث عن كتابك', arDesc: 'ابحث في الفهرس الذكي بالاسم أو الموضوع', en: 'Search your book', enDesc: 'Search the smart index by title or subject' },
  { icon: BookOpen, ar: 'حدّد الموقع', arDesc: 'افتح تفاصيل الكتاب واضغط "تحديد الموقع"', en: 'Locate it', enDesc: 'Open the book details and tap "Locate"' },
  { icon: MapIcon, ar: 'اتبع الخريطة', arDesc: 'شاهد المسار المضيء على خريطة المكتبة', en: 'Follow the map', enDesc: 'See the glowing path on the library map' },
  { icon: Camera, ar: 'وجّه الكاميرا', arDesc: 'استخدم الواقع المعزز للوصول للرف مباشرة', en: 'Point your camera', enDesc: 'Use AR to walk straight to the shelf' },
];

// Same icon/copy as FacilitiesMap.tsx's facility list, kept in sync so a
// visitor sees the same four facilities here that they'll find once inside.
const FACILITIES_PREVIEW = [
  { icon: Users,   ar: 'قاعات الدراسة الجماعية', en: 'Group Study Rooms' },
  { icon: VolumeX, ar: 'منطقة القراءة الصامتة',  en: 'Silent Reading Zone' },
  { icon: Monitor, ar: 'معمل الحاسوب',           en: 'Computer Lab' },
  { icon: Printer, ar: 'خدمة الطباعة والتصوير',  en: 'Printing & Copying' },
];

export function Landing() {
  const { dir, language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const ar = language === 'ar';

  return (
    <div className={cn(
      "relative min-h-screen bg-[#F5F7FA] dark:bg-slate-950 font-sans overflow-hidden",
      dir === 'rtl' ? 'text-right' : 'text-left'
    )}>
      {/* Faint blueprint grid, consistent with the rest of the app */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#004C6D 1px, transparent 1px), linear-gradient(90deg, #004C6D 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      </div>

      <header className="relative z-10 px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className={cn("flex items-center gap-4", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/25 shrink-0">
              <Brain className="text-accent w-8 h-8" />
            </div>
            <div className="font-display text-3xl font-bold text-primary dark:text-white tracking-tight leading-tight">
              {ar ? 'المكتبة المعززة' : 'ARLibrary'}
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-accent/15 text-accent text-[9px] font-black uppercase tracking-widest">
              {t('demoVersionBadge')}
            </span>
          </div>

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/10 rounded-2xl text-xs font-black text-slate-500 dark:text-slate-300 shadow-sm hover:border-accent/40 hover:text-accent transition-all"
          >
            <Globe className="w-3.5 h-3.5" />
            {ar ? 'English' : 'عربي'}
          </button>
        </div>
      </header>

      <main className="relative z-10 px-6 pb-24">
        {/* ── Hero: headline + CTA on one side, a live-feeling wayfinding
            card on the other — the map/glowing-path moment is the single
            most characteristic thing this product does, so it opens the
            page instead of sitting empty behind a mascot. ── */}
        <div className={cn(
          "max-w-6xl w-full mx-auto flex flex-col lg:flex-row items-center gap-14 lg:gap-10 pt-10 pb-20",
          dir === 'rtl' ? 'lg:flex-row-reverse' : ''
        )}>
          <motion.div
            initial={{ opacity: 0, x: dir === 'rtl' ? 24 : -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className={cn("flex-1 flex flex-col max-w-xl", dir === 'rtl' ? 'items-end text-right' : 'items-start text-left')}
          >
            <div className="flex items-center gap-2 mb-5 text-accent">
              <Compass className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em]">
                {ar ? 'نظام الملاحة الذكي' : 'Smart Wayfinding System'}
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-[3.25rem] font-bold text-primary dark:text-white tracking-tight leading-[1.08] mb-6 text-balance">
              {ar ? (
                <>لا تبحث عن الكتاب<br /><span className="text-accent">دَع المكتبة تقودك إليه</span></>
              ) : (
                <>Stop searching for the book<br /><span className="text-accent">Let the library walk you there</span></>
              )}
            </h1>
            <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 font-bold leading-relaxed mb-10">
              {ar
                ? 'ابحث عن أي كتاب، وسيرسم لك مسار مضيء على الخريطة — أو وجّه كاميرتك في وضع الواقع المعزز لتصل إلى الرف مباشرة.'
                : 'Search any title and get a glowing path straight to its shelf — or point your camera in AR mode and walk right to it.'}
            </p>
            <div className={cn("flex items-center gap-4 flex-wrap", dir === 'rtl' ? 'flex-row-reverse' : '')}>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-7 py-4 bg-primary text-white rounded-2xl text-sm font-black shadow-lg shadow-primary/25 hover:brightness-110 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <LogIn className="w-4 h-4" />
                {ar ? 'تسجيل الدخول' : 'Log In'}
              </button>
              <a
                href="#how-it-works"
                className="text-sm font-black text-primary/70 dark:text-white/70 hover:text-accent transition-colors underline decoration-2 decoration-accent/40 underline-offset-4"
              >
                {ar ? 'شاهد كيف تعمل' : 'See how it works'}
              </a>
            </div>
          </motion.div>

          {/* ── Visual anchor: a compact illustrative wayfinding card,
              reusing the same zone-map + glowing-path language as the
              real library map, so this is a genuine preview of the
              product rather than decoration. ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.15 }}
            className="relative shrink-0 w-full max-w-[420px]"
          >
            <div className="relative rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-white/10 shadow-2xl shadow-primary/10 p-5 overflow-hidden">
              <svg viewBox="0 0 360 300" direction="ltr" className="w-full h-auto" role="img" aria-label={ar ? 'معاينة خريطة المكتبة مع مسار مضيء' : 'Library map preview with a glowing path'}>
                <defs>
                  <linearGradient id="heroPath" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#D7C826" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#D7C826" stopOpacity="1" />
                  </linearGradient>
                  <filter id="heroGlow" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="3.2" result="b" />
                    <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                <rect x="6" y="6" width="348" height="288" rx="20" fill="none" stroke="#E2E8F0" strokeWidth="1.5" />

                {/* Zone A — natural sciences (navy tint) */}
                <rect x="18" y="18" width="150" height="118" rx="12" fill="#004C6D" fillOpacity="0.06" stroke="#004C6D" strokeOpacity="0.18" />
                <text x="30" y="36" fontSize="8" fontWeight="800" fill="#004C6D" fillOpacity="0.55" fontFamily="'IBM Plex Mono',monospace" letterSpacing="1">A · SCIENCES</text>

                {/* Zone B — engineering (cyan tint) */}
                <rect x="192" y="18" width="150" height="118" rx="12" fill="#0EA5D6" fillOpacity="0.07" stroke="#0EA5D6" strokeOpacity="0.2" />
                <text x="204" y="36" fontSize="8" fontWeight="800" fill="#0E7EA6" fillOpacity="0.6" fontFamily="'IBM Plex Mono',monospace" letterSpacing="1">B · ENGINEERING</text>

                {/* Shelf blocks */}
                {[
                  { x: 30, y: 52 }, { x: 96, y: 52 },
                  { x: 30, y: 96 }, { x: 96, y: 96 },
                  { x: 204, y: 52 }, { x: 270, y: 52 },
                  { x: 204, y: 96 },
                ].map((s, i) => (
                  <rect key={i} x={s.x} y={s.y} width="56" height="30" rx="6" fill="white" stroke="#CBD5E1" strokeWidth="1" />
                ))}
                {/* Destination shelf, highlighted */}
                <rect x="270" y="96" width="56" height="30" rx="6" fill="#FEF3C7" stroke="#D7C826" strokeWidth="2" />
                <text x="298" y="115" textAnchor="middle" fontSize="9" fontWeight="900" fill="#92400E" fontFamily="'IBM Plex Mono',monospace">B-2</text>

                {/* Zone C/D lower strip */}
                <rect x="18" y="150" width="324" height="118" rx="12" fill="#004C6D" fillOpacity="0.04" stroke="#E2E8F0" />
                <text x="30" y="168" fontSize="8" fontWeight="800" fill="#004C6D" fillOpacity="0.4" fontFamily="'IBM Plex Mono',monospace" letterSpacing="1">C · HUMANITIES</text>
                {[
                  { x: 30, y: 184 }, { x: 96, y: 184 }, { x: 162, y: 184 },
                  { x: 30, y: 222 }, { x: 96, y: 222 }, { x: 162, y: 222 },
                ].map((s, i) => (
                  <rect key={i} x={s.x} y={s.y} width="56" height="26" rx="6" fill="white" stroke="#E2E8F0" strokeWidth="1" opacity="0.8" />
                ))}

                {/* Entrance */}
                <rect x="150" y="270" width="60" height="18" rx="9" fill="#004C6D" />
                <text x="180" y="282" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="white" fontFamily="'IBM Plex Mono',monospace">ENTRANCE</text>

                {/* Glowing wayfinding path, entrance → destination shelf */}
                <path d="M 180,270 L 180,190 L 298,190 L 298,126" stroke="#D7C826" strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.12" />
                <path
                  d="M 180,270 L 180,190 L 298,190 L 298,126"
                  stroke="url(#heroPath)" strokeWidth="4" fill="none" strokeLinecap="round" filter="url(#heroGlow)"
                  strokeDasharray="480" strokeDashoffset="480"
                >
                  <animate attributeName="stroke-dashoffset" from="480" to="0" dur="1.4s" begin="0.3s" fill="freeze" />
                </path>
                <polygon points="-5,-6 7,0 -5,6" fill="#D7C826" filter="url(#heroGlow)">
                  <animateMotion dur="2.4s" begin="1.7s" repeatCount="indefinite" rotate="auto" path="M 180,270 L 180,190 L 298,190 L 298,126" />
                </polygon>
                <circle cx="298" cy="126" r="7" fill="#D7C826" stroke="white" strokeWidth="2" />
                <circle cx="298" cy="126" r="7" fill="none" stroke="#D7C826" strokeWidth="2" opacity="0.7">
                  <animate attributeName="r" values="7;18;7" dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0;0.7" dur="1.8s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>

            {/* Rafeeq tucked beside the card as a supporting character,
                not the whole hero */}
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              className={cn("absolute -bottom-6 flex items-end gap-2", dir === 'rtl' ? '-left-6' : '-right-6')}
            >
              <div className="relative bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-white/10 rounded-xl px-3 py-2 shadow-md max-w-[140px] mb-3">
                <p className="text-[10px] font-black text-primary dark:text-white leading-snug">
                  {ar ? 'رفيقك في كل خطوة!' : 'With you every step!'}
                </p>
              </div>
              <RafeeqAvatar className="w-16 h-16 drop-shadow-xl shrink-0" />
            </motion.div>
          </motion.div>
        </div>

        {/* ── How it works — a real 4-step sequence, so numbering here
            actually encodes the order a user follows. ── */}
        <div id="how-it-works" className="max-w-6xl mx-auto pt-8 scroll-mt-10">
          <div className="text-center mb-12">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-primary dark:text-white tracking-tight mb-3">
              {ar ? 'من البحث إلى الرف، بأربع خطوات' : 'From search to shelf, in four steps'}
            </h2>
            <div className="w-12 h-[3px] bg-accent rounded-full mx-auto" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className={cn("flex flex-col gap-3", dir === 'rtl' ? 'items-end text-right' : 'items-start text-left')}
              >
                <div className={cn("flex items-center gap-3 w-full", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 dark:bg-white/10 text-primary dark:text-accent flex items-center justify-center shrink-0">
                    <step.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-black text-accent tracking-widest font-mono" dir="ltr">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="text-sm font-black text-primary dark:text-white">
                  {ar ? step.ar : step.en}
                </h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                  {ar ? step.arDesc : step.enDesc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Facilities — the same wayfinding also covers non-shelf
            destinations, so it gets its own quiet mention rather than
            competing with the hero for attention. ── */}
        <div className="max-w-6xl mx-auto pt-20">
          <div className={cn(
            "official-card bg-white dark:bg-slate-900 rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-12",
            dir === 'rtl' ? 'md:flex-row-reverse' : ''
          )}>
            <div className={cn("flex-1 flex flex-col", dir === 'rtl' ? 'items-end text-right' : 'items-start text-left')}>
              <h2 className="font-display text-xl md:text-2xl font-bold text-primary dark:text-white tracking-tight mb-2">
                {ar ? 'أبعد من الرفوف' : 'Beyond the shelves'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed mb-6 max-w-md">
                {ar
                  ? 'نفس الملاحة المضيئة تأخذك أيضاً إلى قاعات الدراسة، معمل الحاسوب، ومناطق القراءة الهادئة.'
                  : 'The same glowing wayfinding also gets you to study rooms, the computer lab, and quiet reading zones.'}
              </p>
              <button
                onClick={() => navigate('/login')}
                className={cn("flex items-center gap-2 text-sm font-black text-primary dark:text-accent hover:text-accent dark:hover:text-white transition-colors", dir === 'rtl' ? 'flex-row-reverse' : '')}
              >
                {t('libraryFacilities')}
                {dir === 'rtl' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full md:w-auto shrink-0">
              {FACILITIES_PREVIEW.map((f, i) => (
                <div
                  key={i}
                  className={cn("flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-white/5 w-full md:w-44", dir === 'rtl' ? 'flex-row-reverse text-right' : 'flex-row text-left')}
                >
                  <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-white/10 text-primary dark:text-accent flex items-center justify-center shrink-0">
                    <f.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-black text-primary dark:text-white leading-tight">
                    {ar ? f.ar : f.en}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-8 pb-8">
        <p className={cn("text-[9px] text-slate-350 dark:text-slate-600 font-bold uppercase tracking-widest max-w-7xl mx-auto", dir === 'rtl' ? 'text-right' : 'text-left')}>
          {t('copyright')}
        </p>
      </footer>
    </div>
  );
}
