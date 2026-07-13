import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  HelpCircle,
  Search as SearchIcon,
  Mail,
  MessageSquare,
  MapPin,
  Award,
  BookOpen,
  ChevronDown,
  Send,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';

type HelpTab = 'faqs' | 'contact' | 'requests';

interface FaqItem {
  icon: React.ComponentType<{ className?: string }>;
  qKey: string;
  aKey: string;
}

const FAQ_ITEMS: FaqItem[] = [
  { icon: MapPin, qKey: 'faqArNav', aKey: 'faqArNavAnswer' },
  { icon: Award, qKey: 'faqXpLevel', aKey: 'faqXpLevelAnswer' },
  { icon: BookOpen, qKey: 'faqBorrowLimit', aKey: 'faqBorrowLimitAnswer' },
  { icon: HelpCircle, qKey: 'faqFacilities', aKey: 'faqFacilitiesAnswer' },
  { icon: HelpCircle, qKey: 'faqGroupRooms', aKey: 'faqGroupRoomsAnswer' },
];

const MOCK_REQUESTS = [
  { id: 'r1', status: 'pending' as const },
];

export function HelpCenter() {
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<HelpTab>('faqs');
  const [query, setQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);

  const filteredFaqs = FAQ_ITEMS.filter((item) =>
    t(item.qKey).toLowerCase().includes(query.toLowerCase())
  );

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSent(true);
  };

  return (
    <div className={cn('space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-20', dir === 'rtl' ? 'text-right' : 'text-left')}>
      {/* Hero */}
      <section className="relative rounded-[2rem] overflow-hidden bg-primary dark:bg-slate-950 text-white p-10 md:p-14 shadow-2xl">
        <div className={cn('absolute -bottom-24 w-64 h-64 bg-accent/20 dark:bg-accent/10 rounded-full blur-[100px]', dir === 'rtl' ? '-left-24' : '-right-24')} />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 dark:bg-accent/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 dark:border-accent/20">
            <HelpCircle className="w-4 h-4 text-accent" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('helpCenterBadge')}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">{t('howCanWeHelp')}</h1>
          <p className="text-white/70 dark:text-white/60 font-medium leading-relaxed">{t('helpCenterDesc')}</p>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-3 -mt-4 relative z-10">
        {([
          { id: 'faqs', label: t('faqsGuideTab'), icon: HelpCircle, badge: 0 },
          { id: 'contact', label: t('contactUsTab'), icon: Mail, badge: 0 },
          { id: 'requests', label: t('myRequestsTab'), icon: MessageSquare, badge: MOCK_REQUESTS.length },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-6 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg',
              activeTab === tab.id
                ? 'bg-primary dark:bg-accent text-white dark:text-primary shadow-primary/20'
                : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-white shadow-black/5'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.badge ? (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {activeTab === 'faqs' && (
        <div className="space-y-10">
          <div className="relative max-w-xl mx-auto">
            <SearchIcon className={cn('absolute top-1/2 -translate-y-1/2 text-primary w-5 h-5', dir === 'rtl' ? 'right-5' : 'left-5')} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchForAnswer')}
              className={cn(
                'w-full py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-primary dark:text-white rounded-2xl text-sm font-bold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent',
                dir === 'rtl' ? 'pr-14 pl-5 text-right' : 'pl-14 pr-5 text-left'
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => navigate('/map')}
              className="official-card p-6 flex items-center gap-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-accent dark:hover:border-accent transition-all text-start"
            >
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-primary dark:text-white tracking-tight mb-1">{t('smartNavigationCard')}</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold leading-relaxed">{t('smartNavigationCardDesc')}</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/my-books?tab=badges')}
              className="official-card p-6 flex items-center gap-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:border-accent dark:hover:border-accent transition-all text-start"
            >
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-primary/10 dark:bg-white/10 flex items-center justify-center text-primary dark:text-white">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-primary dark:text-white tracking-tight mb-1">{t('pointsBadgesCard')}</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold leading-relaxed">{t('pointsBadgesCardDesc')}</p>
              </div>
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-black text-primary dark:text-white tracking-tight">{t('mostFrequentQuestions')}</h3>

            {filteredFaqs.length === 0 ? (
              <div className="official-card p-10 text-center text-slate-400 dark:text-slate-500 font-bold bg-white dark:bg-slate-900">
                {t('noFaqResults')}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFaqs.map((item, idx) => {
                  const isOpen = openFaqIndex === idx;
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.qKey}
                      className="official-card overflow-hidden bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-sm"
                    >
                      <button
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        className={cn('w-full p-5 flex items-center gap-4', dir === 'rtl' ? 'flex-row-reverse text-right' : 'flex-row text-left')}
                      >
                        <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/10 dark:bg-accent/10 flex items-center justify-center text-primary dark:text-accent">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="flex-1 text-sm font-black text-primary dark:text-white">{t(item.qKey)}</span>
                        <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform shrink-0', isOpen && 'rotate-180')} />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <p className="px-5 pb-5 ps-[4.5rem] text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                              {t(item.aKey)}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'contact' && (
        <div className="official-card p-8 md:p-10 max-w-xl mx-auto bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-sm space-y-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">{t('contactUsDesc')}</p>

          {contactSent ? (
            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{t('messageSentSuccess')}</p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder={t('yourName')}
                className="w-full py-4 px-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-primary dark:text-white rounded-2xl text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder={t('yourEmail')}
                className="w-full py-4 px-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-primary dark:text-white rounded-2xl text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <textarea
                required
                rows={4}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder={t('yourMessage')}
                className="w-full py-4 px-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-primary dark:text-white rounded-2xl text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              />
              <button
                type="submit"
                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                {t('sendMessage')}
              </button>
            </form>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="official-card p-8 md:p-10 max-w-xl mx-auto bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-sm space-y-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">{t('myRequestsDesc')}</p>
          <div className="space-y-3">
            {MOCK_REQUESTS.map((req) => (
              <div key={req.id} className={cn('flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5', dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                <div className={cn('flex items-center gap-3', dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                  <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-accent/10 flex items-center justify-center text-primary dark:text-accent">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-primary dark:text-white">#{req.id.toUpperCase()}</span>
                </div>
                <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 px-3 py-1.5 rounded-lg uppercase tracking-widest">
                  <Clock className="w-3 h-3" />
                  {t('requestStatusPending')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
