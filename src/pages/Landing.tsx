import React from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Brain, 
  Map as MapIcon, 
  Box, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  ArrowLeft,
  ChevronRight,
  Globe,
  Users,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';

export function Landing() {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();

  const features = [
    {
      icon: MapIcon,
      title: t('arNavigation'),
      desc: t('arNavigationDesc'),
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      icon: Brain,
      title: t('aiSummarization'),
      desc: t('aiSummarizationDesc'),
      color: 'text-accent',
      bg: 'bg-accent/10'
    },
    {
      icon: Box,
      title: t('digitalInventory'),
      desc: t('digitalInventoryDesc'),
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      icon: ShieldCheck,
      title: t('institutionalExcellence'),
      desc: t('institutionalExcellenceDesc'),
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    }
  ];

  const stats = [
    { label: t('totalBooksCount'), value: '50K+' },
    { label: t('totalUsersCount'), value: '12K+' },
    { label: t('institutionalExcellence'), value: '25+' },
    { label: t('efficiency'), value: '94%' }
  ];

  return (
    <div className={cn("min-h-screen bg-white dark:bg-slate-950 font-sans selection:bg-accent/30", dir === 'rtl' ? 'text-right' : 'text-left')}>
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px] translate-y-1/2"></div>
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-50 px-6 py-4 border-b border-slate-100 dark:border-white/5 backdrop-blur-md bg-white/70 dark:bg-slate-950/70 sticky top-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className={cn("flex items-center gap-3", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <BookOpen className="text-accent w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-primary dark:text-white tracking-tight uppercase">Bevero <span className="text-accent underline decoration-2 underline-offset-4">Signage AI</span></h1>
              <p className="text-[8px] font-black tracking-[0.3em] text-slate-400 uppercase">{t('smartKnowledgePortal')}</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-white/5 rounded-xl text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:bg-accent/10 hover:text-accent transition-all"
            >
              <Globe className="w-3 h-3" />
              {language === 'ar' ? 'English' : 'عربي'}
            </button>
            <button onClick={() => navigate('/login')} className="text-xs font-black text-slate-500 hover:text-primary dark:hover:text-accent uppercase tracking-widest transition-colors">
              {t('login')}
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="bg-primary dark:bg-accent text-white dark:text-primary px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 dark:shadow-accent/20 hover:scale-105 active:scale-95 transition-all"
            >
              {t('enterPlatform')}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: dir === 'rtl' ? 50 : -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className={cn("inline-flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-full", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
              <Zap className="w-4 h-4 text-accent animate-pulse" />
              <span className="text-[10px] font-black text-accent uppercase tracking-widest">{t('academicAi')} {t('enabledStatus')}</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-black text-primary dark:text-white tracking-tighter leading-[1.1]">
              {t('landingHeroTitle')}
            </h1>
            
            <p className="text-lg text-slate-500 dark:text-slate-400 font-bold leading-relaxed max-w-xl">
              {t('landingHeroDesc')}
            </p>

            <div className={cn("flex flex-wrap gap-4 pt-4", dir === 'rtl' ? 'justify-end' : 'justify-start')}>
              <button 
                onClick={() => navigate('/login')}
                className="bg-primary dark:bg-accent text-white dark:text-primary px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_20px_40px_rgba(15,67,129,0.3)] dark:shadow-none hover:translate-y-[-4px] active:translate-y-0 transition-all flex items-center gap-3 group"
              >
                {t('explorePlatform')}
                {dir === 'rtl' ? <ArrowLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" /> : <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />}
              </button>
              <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-primary dark:text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95">
                {t('viewDemo')}
              </button>
            </div>
          </motion.div>

          {/* Visual Asset Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative z-10 official-card p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border-white/20 dark:border-white/5 rounded-[3rem] shadow-[0_80px_160px_rgba(0,0,0,0.15)] ring-1 ring-black/5">
               <img 
                 src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80" 
                 className="w-full h-auto rounded-[2.5rem] shadow-2xl" 
                 alt="Smart ARLibrary"
                 referrerPolicy="no-referrer"
               />
               
               {/* Floating Badges */}
               <motion.div 
                 animate={{ y: [0, -20, 0] }}
                 transition={{ repeat: Infinity, duration: 4 }}
                 className={cn("absolute -top-10 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl border border-slate-100 dark:border-white/5 flex flex-col gap-2", dir === 'rtl' ? '-left-10' : '-right-10')}
               >
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('operationalStatusStable')}</span>
                  </div>
                  <div className="text-xl font-black text-primary dark:text-accent font-mono tracking-tighter">99.9% UPTIME</div>
               </motion.div>

               <motion.div 
                 animate={{ y: [0, 20, 0] }}
                 transition={{ repeat: Infinity, duration: 5, delay: 1 }}
                 className={cn("absolute -bottom-10 bg-primary p-6 rounded-3xl shadow-2xl flex items-center gap-6", dir === 'rtl' ? '-right-10' : '-left-10')}
               >
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                     <Brain className="text-accent w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-white/50 uppercase tracking-widest">{t('smartSummary')}</div>
                    <div className="text-sm font-black text-white">{t('deepAnalysis')} {t('enabledStatus')}</div>
                  </div>
               </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Detailed Features Highlighting */}
      <section className="py-32 px-6 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto space-y-32">
          
          {/* AI Search & Summarization Section */}
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, x: dir === 'rtl' ? 50 : -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div className={cn("inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                <Brain className="w-4 h-4 text-accent" />
                <span className="text-[10px] font-black text-accent uppercase tracking-widest">{t('academicAi')}</span>
              </div>
              <h2 className="text-4xl lg:text-6xl font-black text-primary dark:text-white tracking-tight leading-tight">
                {language === 'ar' ? 'بحث ذكي يتجاوز مجرد الكلمات' : 'Smart Search That Goes Beyond Words'}
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                {language === 'ar' 
                  ? 'محرك البحث المدعوم بـ Gemini يفهم سياق استفساراتك الأكاديمية، ويقدم لك نتائج دقيقة مع ملخصات فورية وتحليل للمحتوى لمساعدتك في العثور على المعرفة المطلوبة في ثوانٍ.'
                  : 'The Gemini-powered search engine understands the context of your academic queries, providing precise results with instant summaries and content analysis to help you find required knowledge in seconds.'}
              </p>
              <ul className="space-y-4">
                {[
                  { icon: Zap, text: language === 'ar' ? 'تحليل المحتوى الفوري' : 'Instant Content Analysis' },
                  { icon: BookOpen, text: language === 'ar' ? 'تلخيص الكتب الضخمة' : 'Large Book Summarization' },
                  { icon: Brain, text: language === 'ar' ? 'توصيات بحث ذكية' : 'Smart Search Recommendations' }
                ].map((item, idx) => (
                  <li key={idx} className={cn("flex items-center gap-3", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                    <div className="w-6 h-6 bg-accent/10 rounded-full flex items-center justify-center">
                      <item.icon className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <span className="text-sm font-black text-primary dark:text-slate-300 uppercase tracking-wide">{item.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative p-8 bg-white dark:bg-slate-800 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-white/5"
            >
               <img 
                 src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80" 
                 className="w-full h-auto rounded-[2rem] brightness-90" 
                 alt="AI Interface"
                 referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent rounded-[2rem]"></div>
            </motion.div>
          </div>

          {/* AR Navigation Section */}
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative order-2 lg:order-1 p-8 bg-primary rounded-[3rem] shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/grid.png')]"></div>
              <img 
                 src="https://images.unsplash.com/photo-1558231221-191f586c539d?auto=format&fit=crop&w=1200&q=80" 
                 className="w-full h-auto rounded-[2rem] shadow-2xl border border-white/10" 
                 alt="AR Navigation"
                 referrerPolicy="no-referrer"
               />
               {/* Simulated AR UI */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-accent border-dashed rounded-full animate-[spin_10s_linear_infinite] opacity-50"></div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                  <div className="bg-accent text-primary px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">Target Found</div>
                  <div className="w-1 h-16 bg-gradient-to-t from-accent to-transparent"></div>
               </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: dir === 'rtl' ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-8 order-1 lg:order-2"
            >
              <div className={cn("inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                <MapIcon className="w-4 h-4 text-blue-500" />
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{t('arNavigation')}</span>
              </div>
              <h2 className="text-4xl lg:text-6xl font-black text-primary dark:text-white tracking-tight leading-tight">
                {language === 'ar' ? 'تجربة تجول بالواقع المعزز' : 'Augmented Reality Tour Experience'}
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                {language === 'ar' 
                  ? 'استخدم كاميرا هاتفك للتجول في أروقة المكتبة. سيوفر لك النظام مسارات رقمية دقيقة تظهر مباشرة على شاشتك لترشدك إلى القسم والرف الذي يحتوي على كتابك المفضل، مع معلومات تفصيلية تظهر في الوقت الفعلي.'
                  : 'Use your phone camera to tour the library corridors. The system will provide precise digital paths appearing directly on your screen to guide you to the section and shelf containing your favorite book, with detailed information appearing in real-time.'}
              </p>
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center">
                    <Zap className="text-blue-500 w-5 h-5" />
                  </div>
                  <h5 className="text-xs font-black text-primary dark:text-white uppercase tracking-wider">{language === 'ar' ? 'تتبع لحظي' : 'Real-time Tracking'}</h5>
                </div>
                <div className="space-y-2">
                   <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="text-emerald-500 w-5 h-5" />
                  </div>
                  <h5 className="text-xs font-black text-primary dark:text-white uppercase tracking-wider">{language === 'ar' ? 'دقة عالية' : 'High Precision'}</h5>
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* Stats Banner */}
      <section className="bg-slate-50 dark:bg-slate-900/50 py-20 px-6 border-y border-slate-100 dark:border-white/5">
         <div className="max-w-7xl mx-auto flex flex-wrap justify-between gap-12">
            {stats.map((stat, i) => (
              <div key={i} className="space-y-1">
                 <div className="text-4xl lg:text-5xl font-black text-primary dark:text-white tracking-tighter font-mono">{stat.value}</div>
                 <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">{stat.label}</div>
              </div>
            ))}
         </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className={cn("max-w-2xl", dir === 'rtl' ? 'mr-auto text-right' : 'ml-0 text-left')}>
            <h2 className="text-sm font-black text-accent uppercase tracking-[0.4em] mb-4">{t('coreFeatures')}</h2>
            <h3 className="text-4xl lg:text-5xl font-black text-primary dark:text-white tracking-tight leading-tight">
               {language === 'ar' ? 'حلول ذكية مصممة لرفع كفاءة البحث الأكاديمي' : 'Smart Solutions Designed to Elevate Academic Research Efficiency'}
            </h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="official-card p-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5 hover:border-accent/40 transition-all flex flex-col gap-6"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", feature.bg)}>
                  <feature.icon className={cn("w-8 h-8", feature.color)} />
                </div>
                <div className="space-y-3">
                  <h4 className="text-lg font-black text-primary dark:text-white uppercase tracking-tight">{feature.title}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-bold leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="bg-primary dark:bg-slate-950 py-32 px-6 relative overflow-hidden">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
         <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-20 items-center relative z-10 text-white">
            <div className="space-y-8">
               <div className={cn("inline-flex items-center gap-2", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                  <Globe className="w-5 h-5 text-accent" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-accent">{t('techStack')}</span>
               </div>
               <h2 className="text-4xl lg:text-6xl font-black tracking-tight leading-tight">
                 {t('techStackDesc')}
               </h2>
               <div className="grid grid-cols-2 gap-8 pt-8">
                  <div className="space-y-2">
                     <div className="text-3xl font-black font-mono">0.02s</div>
                     <div className="text-[9px] font-black uppercase tracking-widest text-white/40">Latency Response</div>
                  </div>
                  <div className="space-y-2">
                     <div className="text-3xl font-black font-mono">256-bit</div>
                     <div className="text-[9px] font-black uppercase tracking-widest text-white/40">AES Encryption</div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {[
                 { icon: Zap, label: 'Cloud Native' },
                 { icon: Users, label: 'Multi Tenant' },
                 { icon: Layers, label: 'Microservices' },
                 { icon: ShieldCheck, label: 'Secure Auth' }
               ].map((tech, i) => (
                 <div key={i} className="official-card p-10 bg-white/5 border-white/10 backdrop-blur-md flex flex-col items-center justify-center gap-4 hover:bg-white/10 transition-all border-0">
                    <tech.icon className="w-10 h-10 text-accent" />
                    <span className="text-[10px] font-black uppercase tracking-widest">{tech.label}</span>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* Call to Action */}
      <section className="py-32 px-6 text-center">
         <div className="max-w-4xl mx-auto space-y-12">
            <div className="space-y-4">
                <h2 className="text-5xl lg:text-7xl font-black text-primary dark:text-white tracking-tighter leading-tight">
                  {t('getStartedNow')}
                </h2>
                <p className="text-xl text-slate-500 dark:text-slate-400 font-bold max-w-2xl mx-auto leading-relaxed">
                  {t('joinUniversities')}
                </p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6">
               <button 
                 onClick={() => navigate('/login')}
                 className="bg-primary dark:bg-accent text-white dark:text-primary px-12 py-6 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-4"
               >
                  {t('enterPlatform')}
                  {dir === 'rtl' ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
               </button>
               <button className="bg-slate-100 dark:bg-slate-900 text-primary dark:text-white px-12 py-6 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all">
                  {language === 'ar' ? 'تواصل معنا' : 'Contact Sales'}
               </button>
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-20">
          <div className="col-span-2 space-y-6">
            <div className={cn("flex items-center gap-3", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <BookOpen className="text-accent w-6 h-6" />
              </div>
              <h1 className="text-lg font-black text-primary dark:text-white tracking-tight uppercase">Bevero <span className="text-accent underline">Signage AI</span></h1>
            </div>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-bold leading-relaxed max-w-sm">
              {t('landingHeroDesc')}
            </p>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-700">{t('mainSections')}</h4>
            <ul className="space-y-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              <li className="hover:text-accent cursor-pointer transition-colors">{t('dashboard')}</li>
              <li className="hover:text-accent cursor-pointer transition-colors">{t('searchTitle')}</li>
              <li className="hover:text-accent cursor-pointer transition-colors">{t('mapTitle')}</li>
              <li className="hover:text-accent cursor-pointer transition-colors">{t('academicAi')}</li>
            </ul>
          </div>

          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-700">{t('institutionalExcellence')}</h4>
            <ul className="space-y-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              <li className="hover:text-accent cursor-pointer transition-colors">Documentation</li>
              <li className="hover:text-accent cursor-pointer transition-colors">Enterprise API</li>
              <li className="hover:text-accent cursor-pointer transition-colors">Privacy Policy</li>
              <li className="hover:text-accent cursor-pointer transition-colors">Support Center</li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-20 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-slate-200/50 dark:border-white/5 mt-20">
           <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">{t('copyright')}</p>
           <div className="flex items-center gap-8 text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">
              <span className="hover:text-primary transition-colors cursor-pointer">LinkedIn</span>
              <span className="hover:text-primary transition-colors cursor-pointer">Twitter</span>
              <span className="hover:text-primary transition-colors cursor-pointer">Instagram</span>
           </div>
        </div>
      </footer>
    </div>
  );
}
