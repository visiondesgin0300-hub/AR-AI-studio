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
  AlertTriangle,
  Inbox,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';
import { User } from '../types';

type HelpTab = 'faqs' | 'contact' | 'requests' | 'inbox';

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

// Requests the user has actually submitted from the contact tab, kept per
// user in localStorage. This list used to be a single hardcoded entry, so
// every visitor saw a phantom request #R1 they had never sent.
interface HelpRequest {
  id: string;
  subject: string;
  sentAt: number;
}

function requestsKey(): string {
  try {
    const stored = localStorage.getItem('library_user');
    return `help_requests_v1_${stored ? JSON.parse(stored)?.id || 'anonymous' : 'anonymous'}`;
  } catch { return 'help_requests_v1_anonymous'; }
}

function loadRequests(): HelpRequest[] {
  try { return JSON.parse(localStorage.getItem(requestsKey()) || '[]'); } catch { return []; }
}

interface HelpCenterProps {
  /** Optional so the page still renders if mounted without one. */
  user?: User;
}

export function HelpCenter({ user }: HelpCenterProps) {
  const { t, dir, language } = useLanguage();
  const ar = language === 'ar';
  const isAdmin = user?.role === 'admin';
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<HelpTab>('faqs');
  const [query, setQuery] = useState('');
  // Keyed by question, not by list index — the index refers to the *filtered*
  // list, so typing a query used to leave a different question expanded than
  // the one the reader actually opened.
  const [openFaqKey, setOpenFaqKey] = useState<string | null>(null);

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactState, setContactState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [requests, setRequests] = useState<HelpRequest[]>(loadRequests);

  const needle = query.trim().toLowerCase();
  const filteredFaqs = FAQ_ITEMS.filter((item) =>
    t(item.qKey).toLowerCase().includes(needle) || t(item.aKey).toLowerCase().includes(needle)
  );

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactState('sending');
    try {
      // Same endpoint the feedback widget uses, so the message genuinely
      // lands in the admin "user requests" tab instead of being discarded.
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'inquiry',
          categories: [language === 'ar' ? 'مركز المساعدة' : 'Help Center'],
          text: contactMessage,
          user: contactName,
          email: contactEmail,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const { id } = await res.json();
      const next = [
        { id: String(id), subject: contactMessage.slice(0, 60), sentAt: Date.now() },
        ...requests,
      ];
      setRequests(next);
      try { localStorage.setItem(requestsKey(), JSON.stringify(next)); } catch {}
      setContactState('sent');
    } catch (err) {
      console.error('Help Center contact submit failed', err);
      setContactState('error');
    }
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
          <p className="text-white/70 dark:text-white/60 font-medium leading-relaxed">
            {isAdmin
              ? (ar
                  ? 'تصفّح الأسئلة الشائعة وشرح التقنية، وراجع الرسائل التي يرسلها المستخدمون من نموذج التواصل.'
                  : 'Browse the FAQs and the technology guide, and review the messages users send through the contact form.')
              : t('helpCenterDesc')}
          </p>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-3 -mt-4 relative z-10">
        {/* An admin has nowhere to send an inquiry — these messages land in
            their own dashboard — so they get a route to that inbox instead of
            a contact form and a personal request list. */}
        {(isAdmin
          ? [
              { id: 'faqs' as const, label: t('faqsGuideTab'), icon: HelpCircle, badge: 0 },
              { id: 'inbox' as const, label: ar ? 'رسائل المستخدمين' : 'User messages', icon: Inbox, badge: 0 },
            ]
          : [
              { id: 'faqs' as const, label: t('faqsGuideTab'), icon: HelpCircle, badge: 0 },
              { id: 'contact' as const, label: t('contactUsTab'), icon: Mail, badge: 0 },
              { id: 'requests' as const, label: t('myRequestsTab'), icon: MessageSquare, badge: requests.length },
            ]
        ).map((tab) => (
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
                {filteredFaqs.map((item) => {
                  const isOpen = openFaqKey === item.qKey;
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.qKey}
                      className="official-card overflow-hidden bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-sm"
                    >
                      <button
                        onClick={() => setOpenFaqKey(isOpen ? null : item.qKey)}
                        aria-expanded={isOpen}
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

          {contactState === 'sent' ? (
            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{t('messageSentSuccess')}</p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="contact-name" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">{t('yourName')}</label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder={t('yourName')}
                  className="w-full py-4 px-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-primary dark:text-white rounded-2xl text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="contact-email" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">{t('yourEmail')}</label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  autoComplete="email"
                  dir="ltr"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder={t('yourEmail')}
                  className={cn('w-full py-4 px-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-primary dark:text-white rounded-2xl text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-accent', dir === 'rtl' ? 'text-right' : 'text-left')}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="contact-message" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">{t('yourMessage')}</label>
                <textarea
                  id="contact-message"
                  required
                  rows={4}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder={t('yourMessage')}
                  className="w-full py-4 px-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-primary dark:text-white rounded-2xl text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                />
              </div>

              {contactState === 'error' && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-2xl flex items-center gap-3" role="alert">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-xs font-bold text-red-700 dark:text-red-300">{t('messageSendFailed')}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={contactState === 'sending'}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Send className={cn('w-4 h-4', contactState === 'sending' && 'animate-pulse')} />
                {contactState === 'sending' ? t('sendingMessage') : t('sendMessage')}
              </button>
            </form>
          )}
        </div>
      )}

      {activeTab === 'inbox' && (
        <div className="official-card p-8 md:p-10 max-w-xl mx-auto bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-sm space-y-6">
          <div className={cn('flex items-start gap-4', dir === 'rtl' ? 'flex-row-reverse text-right' : '')}>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 dark:bg-accent/10 flex items-center justify-center text-primary dark:text-accent shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-primary dark:text-white leading-snug">
                {ar ? 'أنت تدير هذه الرسائل، لا ترسلها' : 'You handle these messages, you don’t send them'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                {ar
                  ? 'نموذج «تواصل معنا» مخصص للطلاب، وما يُرسل منه يصل إلى تبويب الملاحظات في لوحة التحكم — وهو نفسه صندوق واردك.'
                  : 'The contact form belongs to students, and what they send lands in the feedback tab of the dashboard — which is your inbox.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/admin?tab=feedback')}
            className={cn(
              'w-full py-4 bg-primary dark:bg-accent text-white dark:text-primary rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95',
            )}
          >
            <Inbox className="w-4 h-4" />
            {ar ? 'افتح رسائل المستخدمين' : 'Open user messages'}
            <ArrowLeft className={cn('w-4 h-4', ar ? '' : 'rotate-180')} />
          </button>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold leading-relaxed text-center">
            {ar
              ? 'للأعطال التقنية في النظام نفسه، راجع تبويب «عن التقنية» أعلاه أو تواصل مع مزوّد النظام.'
              : 'For faults in the system itself, see the “About the technology” tab above or contact the system provider.'}
          </p>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="official-card p-8 md:p-10 max-w-xl mx-auto bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-sm space-y-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">{t('myRequestsDesc')}</p>
          {requests.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex items-center justify-center text-slate-300 dark:text-slate-600">
                <Mail className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 leading-relaxed">{t('noRequestsYet')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id} className={cn('flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5', dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                  <div className={cn('flex items-center gap-3 min-w-0', dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                    <div className="w-9 h-9 shrink-0 rounded-xl bg-primary/10 dark:bg-accent/10 flex items-center justify-center text-primary dark:text-accent">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      {/* dir="ltr": the leading "#" is a neutral character, so
                          under RTL it flips to the far side and reads "R1#". */}
                      <span dir="ltr" className="block text-sm font-bold text-primary dark:text-white font-mono">#{req.id.toUpperCase()}</span>
                      {req.subject && <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 truncate">{req.subject}</span>}
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 shrink-0 text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 px-3 py-1.5 rounded-lg uppercase tracking-widest">
                    <Clock className="w-3 h-3" />
                    {t('requestStatusPending')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
