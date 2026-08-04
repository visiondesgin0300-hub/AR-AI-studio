import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Compass, LogOut, User as UserIcon, Award, ShieldCheck, Brain, Bell, Check, Info, AlertTriangle, Languages, Camera, Search, HelpCircle, MessageCircle, X, Sparkles } from 'lucide-react';
import { RafeeqAvatar } from './RafeeqAvatar';
import { User } from '../types';
import { cn, calcXP, displayName } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../hooks/useNotifications';
import { useLanguage } from '../hooks/useLanguage';
import { LibrarianChat } from './LibrarianChat';
import { Onboarding } from './Onboarding';
import { FeedbackWidget } from './FeedbackWidget';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

export function Layout({ children, user, onLogout }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifPanelPos, setNotifPanelPos] = useState({ top: 80, left: 16 });
  const bellRef = useRef<HTMLDivElement>(null);
  const [showLibrarian, setShowLibrarian] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showFabHint, setShowFabHint] = useState(() => !localStorage.getItem('ar_fab_seen'));
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('onboarding_done'));

  // Notifications carry a real timestamp; the panel used to print a hardcoded
  // "Just now" on every row regardless of age. Format from the actual value.
  const formatRelativeTime = (timestamp: number): string => {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 1)   return t('timeJustNow');
    if (minutes < 60)  return t('timeMinutesAgo', { n: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24)    return t('timeHoursAgo', { n: hours });
    return t('timeDaysAgo', { n: Math.floor(hours / 24) });
  };

  useEffect(() => {
    if (!showFabHint) return;
    const timer = setTimeout(() => {
      localStorage.setItem('ar_fab_seen', '1');
      setShowFabHint(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [showFabHint]);

  useEffect(() => {
    const handler = () => setShowLibrarian(true);
    window.addEventListener('open-rafeeq', handler);
    return () => window.removeEventListener('open-rafeeq', handler);
  }, []);


  const dismissFabHint = () => {
    localStorage.setItem('ar_fab_seen', '1');
    setShowFabHint(false);
  };
  const { t, toggleLanguage, language, dir } = useLanguage();

  const isAdmin = user.role === 'admin';

  // Role-specific navigation so each storyboard reads clearly:
  // - Student journey: home → search the catalogue → search the facilities →
  //   their own progress. The library map is not listed here on purpose: it is
  //   opened from a specific book or facility rather than browsed on its own,
  //   so the dashboard cards and the "locate" action on a book lead into it.
  //   AR stays reachable via the floating button.
  // - Admin journey: management dashboard first (their real home; "/" already
  //   redirects admins to /admin), then the catalog search and map for
  //   reference. Personal, student-only surfaces (my borrowed books,
  //   gamification) are omitted so the admin flow isn't muddied by them.
  const navItems = isAdmin
    ? [
        { icon: ShieldCheck, label: t('admin'), path: '/admin' },
        { icon: Search, label: t('smartSearchCard'), path: '/search' },
        { icon: Compass, label: t('libraryFacilities'), path: '/facilities' },
      ]
    : [
        { icon: Home,     label: t('dashboard'),          path: '/'           },
        { icon: Search,   label: t('smartSearchCard'),    path: '/search'     },
        { icon: Compass,  label: t('libraryFacilities'),  path: '/facilities' },
        { icon: UserIcon, label: t('profile'),            path: '/profile'    },
      ];

  return (
    <div className={cn(
      "flex h-screen w-full overflow-hidden bg-bg-light dark:bg-bg-dark transition-all duration-700",
      dir === 'rtl' ? 'flex-row' : 'flex-row'
    )}>
      {/* Desktop Sidebar (light theme: white surface, navy text, gold accents) */}
      <aside className={cn(
        "hidden lg:flex w-72 flex-col flex-shrink-0 z-50 relative overflow-hidden transition-all duration-500",
        "bg-white dark:bg-slate-950 text-primary dark:text-white",
        dir === 'rtl' ? 'border-l border-slate-100 dark:border-white/5' : 'border-r border-slate-100 dark:border-white/5'
      )}>
        {/* Brand Header */}
        <div className="p-8 relative z-10 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-3.5 mb-2 justify-start">
             <div className="flex items-center group cursor-pointer">
                <div className={cn("w-9 h-9 bg-primary flex items-center justify-center text-accent shadow-sm hover:scale-105 transition-transform", dir === 'rtl' ? 'rounded-r-xl' : 'rounded-l-xl')}>
                   <BookOpen className="w-5 h-5 font-black" />
                </div>
                <div className={cn("w-9 h-9 bg-accent flex items-center justify-center text-primary shadow-sm hover:scale-105 transition-transform", dir === 'rtl' ? 'rounded-l-xl' : 'rounded-r-xl')}>
                   <Brain className="w-5 h-5 font-black" />
                </div>
             </div>
             <span className="text-xl font-black tracking-widest uppercase italic text-primary dark:text-white">{t('appName')}</span>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="mt-6 flex-1 relative z-10 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = item.path.includes('?')
              ? (location.pathname === item.path.split('?')[0] && location.search === '?' + item.path.split('?')[1])
              : (location.pathname === item.path && !location.search);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "group flex items-center gap-4 px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300 relative",
                  isActive
                    ? "bg-accent/10 text-primary dark:text-accent"
                    : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white"
                )}
              >
                {/* Active side-border accent */}
                {isActive && (
                  <div className={cn(
                    "absolute top-0 bottom-0 w-1 bg-accent rounded-full",
                    dir === 'rtl' ? 'left-0' : 'right-0'
                  )} />
                )}

                <Icon className={cn("w-5 h-5 transition-all duration-300", isActive ? "scale-110 text-accent" : "group-hover:text-accent group-hover:scale-105")} />
                <span className="font-bold text-xs uppercase tracking-widest transition-colors duration-300">{item.label}</span>

                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className={cn("w-1.5 h-1.5 bg-accent rounded-full", dir === 'rtl' ? 'mr-auto' : 'ml-auto')}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Feedback trigger — students only */}
        {!isAdmin && <div className="px-5 py-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowFeedback(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-accent/10 dark:bg-accent/10 border border-accent/20 hover:bg-accent/20 dark:hover:bg-accent/20 transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shrink-0 shadow-md shadow-accent/20 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[11px] font-black text-primary dark:text-accent uppercase tracking-widest">
              {language === 'ar' ? 'شاركنا رأيك' : 'Share Feedback'}
            </span>
          </motion.button>
        </div>}

        {/* User Card */}
        <div className="p-6 relative z-10 border-t border-slate-100 dark:border-white/5">

          <div className="flex items-center gap-3.5 mb-5 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-accent/20 transition-all duration-300 group">
             <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-accent relative overflow-hidden shrink-0 shadow-sm">
                <UserIcon className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />
             </div>
             {/* An admin is identified by role here too. Naming the role on
                 both lines would just repeat itself, so the card collapses to
                 one line for them. */}
             <div className="overflow-hidden flex-1">
                {isAdmin ? (
                  <div className="text-xs font-black text-primary dark:text-white truncate uppercase tracking-tight flex items-center gap-1.5 group-hover:text-accent transition-colors">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                    {t('adminRole')}
                  </div>
                ) : (
                  <>
                    <div className="text-xs font-black text-primary dark:text-white truncate uppercase tracking-tight group-hover:text-accent transition-colors">
                      {displayName(user, language)}
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-1.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      {t('academicResearcher')}
                    </div>
                  </>
                )}
             </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-3.5 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center gap-2.5 transition-all duration-300 text-[10px] font-black tracking-[0.2em] uppercase border border-slate-100 dark:border-white/5 cursor-pointer"
          >
            <LogOut className="w-4 h-4 rtl-flip" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Smart Lens FAB — direct entry point to the AR camera experience (students only) */}
      {!isAdmin && <div className={cn(
        'fixed z-40 bottom-28 lg:bottom-10 flex flex-col items-end gap-2',
        dir === 'rtl' ? 'left-5 lg:left-10 items-start' : 'right-5 lg:right-10 items-end'
      )}>
        <AnimatePresence>
          {showFabHint && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.92 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="relative mb-1"
            >
              <div className={cn(
                "px-4 py-3 bg-primary dark:bg-slate-800 text-white rounded-2xl shadow-2xl text-[11px] font-black leading-snug max-w-[160px] text-center",
                dir === 'rtl' ? 'text-right' : 'text-left'
              )}>
                {language === 'ar' ? 'العدسة الذكية — كاميرا AR' : 'Smart Lens — AR Camera'}
                <button
                  onClick={(e) => { e.stopPropagation(); dismissFabHint(); }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-slate-600 hover:bg-slate-500 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
              </div>
              <div className={cn(
                "absolute -bottom-2 w-4 h-2 overflow-hidden",
                dir === 'rtl' ? 'left-5' : 'right-5'
              )}>
                <div className="w-4 h-4 bg-primary dark:bg-slate-800 rotate-45 -translate-y-3 mx-auto shadow-md" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => { dismissFabHint(); navigate('/smart-lens'); }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          title={language === 'ar' ? 'العدسة الذكية' : 'Smart Lens'}
          className={cn(
            'flex items-center gap-3 pl-4 pr-5 py-4 rounded-full bg-accent text-primary shadow-[0_15px_40px_rgba(217,179,16,0.45)] group relative',
          )}
        >
          <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-30 pointer-events-none" />
          <Camera className="w-5 h-5 relative z-10 shrink-0" />
          <span className="hidden sm:inline lg:max-w-0 lg:overflow-hidden lg:group-hover:max-w-[220px] whitespace-nowrap text-[11px] font-black uppercase tracking-widest relative z-10 transition-all duration-300">
            {language === 'ar' ? 'العدسة الذكية' : 'Smart Lens'}
          </span>
        </motion.button>
      </div>}

      {/* Persistent AI Librarian entry point - a chat helper one tap away from
          every page, stacked just above the AR button on the same side so the
          two floating actions never overlap the bottom nav or each other. */}
      <motion.button
        onClick={() => setShowLibrarian(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        title={t('askLibrarianLabel')}
        className={cn(
          "fixed z-40 bottom-44 lg:bottom-28 w-14 h-14 flex items-end justify-center rounded-full bg-primary dark:bg-slate-800 border-2 border-white/20 dark:border-white/10 shadow-[0_15px_40px_rgba(0,76,109,0.45)] overflow-hidden",
          dir === 'rtl' ? 'left-5 lg:left-10' : 'right-5 lg:right-10'
        )}
      >
        <RafeeqAvatar className="w-full h-full scale-110" />
        <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-accent border-2 border-white dark:border-slate-900" />
      </motion.button>

      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Top Header - Welcome banner */}
        <header className="relative h-24 overflow-hidden bg-gradient-to-r from-primary via-[#01354C] to-primary dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-3 sm:px-6 lg:px-10 flex items-center justify-between z-40 sticky top-0 gap-2">
          <div className={cn("absolute -top-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none", dir === 'rtl' ? '-right-10' : '-left-10')} />

          <div className="flex-1 min-w-0 relative z-10 hidden md:block">
            <h1 className="text-lg lg:text-xl font-black text-white tracking-tight truncate">
              {/* An admin is greeted by role, not by name — the dashboard is a
                  staff console, not a personal page. */}
              {t('welcomeUser').replace('{name}', isAdmin ? t('adminRole') : displayName(user, language))}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-1 -my-1 relative z-10">
            {/* Language Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleLanguage}
              className="p-3 rounded-2xl bg-white/10 text-white/80 border border-white/15 hover:bg-white/20 hover:border-white/25 transition-all flex items-center gap-2"
            >
              <Languages className="w-5 h-5 text-accent" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
                {language === 'ar' ? 'English' : 'عربي'}
              </span>
            </motion.button>


            {/* Guided Tour trigger */}
            {!isAdmin && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/tour')}
                title={language === 'ar' ? 'الجولة الافتراضية' : 'Virtual Tour'}
                className="p-3 rounded-2xl bg-white/10 text-white/80 border border-white/15 hover:bg-white/20 hover:border-white/25 transition-all"
              >
                <Sparkles className="w-5 h-5" />
              </motion.button>
            )}

            {/* Help Center - always one tap away, since students hitting a
                snag shouldn't have to hunt for support in a submenu. */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/help')}
              title={t('helpCenter')}
              className="p-3 rounded-2xl bg-white/10 text-white/80 border border-white/15 hover:bg-white/20 hover:border-white/25 transition-all"
            >
              <HelpCircle className="w-5 h-5" />
            </motion.button>

            {/* Notification Bell */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => {
                  if (bellRef.current) {
                    const rect = bellRef.current.getBoundingClientRect();
                    // Anchor by the bell's left edge (the icon cluster sits at
                    // the left of the header, not the right) and clamp so the
                    // w-80/sm:w-96 panel never runs off either edge.
                    const panelWidth = 384;
                    const left = Math.min(rect.left, window.innerWidth - panelWidth - 16);
                    setNotifPanelPos({
                      top: rect.bottom + 10,
                      left: Math.max(16, left),
                    });
                  }
                  setShowNotifications(v => !v);
                }}
                className={cn(
                  "p-3 rounded-2xl transition-all relative border",
                  showNotifications
                    ? "bg-accent text-primary border-accent shadow-lg shadow-accent/20"
                    : "bg-white/10 text-white/80 border-white/15 hover:bg-white/20 hover:border-white/25"
                )}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div
                      className="fixed inset-0 z-[55]"
                      onClick={() => setShowNotifications(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      style={{ top: notifPanelPos.top, left: notifPanelPos.left }}
                      className="fixed w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-white/10 z-[60] overflow-hidden"
                    >
                      <div className="p-6 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <h3 className="text-sm font-black text-primary dark:text-white uppercase tracking-tight">{t('notifications')}</h3>
                            <div className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-black text-slate-400 dark:text-slate-300">
                               {unreadCount} {t('new')}
                            </div>
                         </div>
                         <button 
                           onClick={markAllAsRead}
                           className="text-[10px] font-black text-accent uppercase tracking-widest hover:text-primary transition-colors"
                         >
                           {t('markAllAsRead')}
                         </button>
                      </div>

                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          <div className="divide-y divide-slate-50 dark:divide-white/5">
                            {notifications.map((notif) => (
                              <div
                                key={notif.id}
                                className={cn(
                                  "p-6 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer relative group",
                                  !notif.isRead && "bg-slate-50/50 dark:bg-white/[0.04]"
                                )}
                                onClick={() => {
                                  markAsRead(notif.id);
                                  if (notif.link) navigate(notif.link);
                                  setShowNotifications(false);
                                }}
                              >
                                <div className="flex gap-4">
                                  <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                    notif.type === 'warning' ? "bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300" :
                                    notif.type === 'alert' ? "bg-red-100 text-red-600 dark:bg-red-400/15 dark:text-red-300" :
                                    "bg-blue-100 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300"
                                  )}>
                                    {notif.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : 
                                     notif.type === 'alert' ? <AlertTriangle className="w-5 h-5 animate-pulse" /> : 
                                     <Info className="w-5 h-5" />}
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-start">
                                      <h4 className="text-xs font-black text-primary dark:text-white leading-tight">{notif.title}</h4>
                                      <span className="text-[8px] font-bold text-slate-300 dark:text-slate-500 uppercase shrink-0">{formatRelativeTime(notif.timestamp)}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 dark:text-slate-400 font-bold leading-relaxed line-clamp-2">
                                      {notif.message}
                                    </p>
                                  </div>
                                </div>
                                {!notif.isRead && (
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-accent rounded-full"></div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-10 text-center space-y-4">
                             <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full mx-auto flex items-center justify-center text-slate-200 dark:text-slate-600">
                                <Bell className="w-8 h-8" />
                             </div>
                             <div className="text-xs font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest">{t('noNotifications')}</div>
                          </div>
                        )}
                      </div>

                      <button
                        className="w-full py-4 bg-slate-50 dark:bg-white/5 text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/10 transition-all border-t border-slate-50 dark:border-white/5"
                        onClick={() => setShowNotifications(false)}
                      >
                        {t('close')}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>


            {/* XP Points Capsule */}
            {!isAdmin && (
              <motion.div
                whileHover={{ y: -2, scale: 1.02 }}
                className="flex items-center gap-3 px-4.5 py-2 bg-accent/15 border border-accent/25 rounded-2xl shadow-sm hover:bg-accent/25 transition-all cursor-default"
              >
                <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-primary shadow-lg shadow-accent/20">
                  <Award className="w-4 h-4 font-bold" />
                </div>
                <div>
                  <div className="text-[8px] font-black text-accent/70 uppercase tracking-wider">{t('experiencePoints')}</div>
                  <div className="text-sm font-black text-accent leading-none mt-0.5">
                    {calcXP()} <span className="text-[9px] font-bold text-white/60">XP</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Decorative brand mark */}
            <div className="hidden lg:block relative w-14 h-14 shrink-0">
              <div className="absolute inset-0 bg-white/5 rounded-2xl rotate-6 border border-white/10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex bg-white/10 p-2 rounded-xl backdrop-blur-md gap-1">
                  <BookOpen className="w-5 h-5 text-accent" />
                  <Brain className="w-5 h-5 text-white/80" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className={cn(
          "flex-1 overflow-y-auto pt-10 pb-40 lg:pb-28 px-8 bg-bg-light dark:bg-bg-dark transition-colors duration-300",
          // Modest extra clearance on whichever side the floating AR button
          // sits on; the button itself now collapses to an icon-only circle
          // at rest on desktop (see the button's own comment), so this only
          // needs to cover that small resting footprint, not the full label.
          dir === 'rtl' ? 'lg:pl-20 lg:pr-12' : 'lg:pr-20 lg:pl-12'
        )}>
          <div className="max-w-7xl mx-auto w-full">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </div>
        </main>

        {/* Bottom Floating Navigation (Mobile Only) */}
        <nav className="lg:hidden fixed bottom-5 left-5 right-5 z-50 rounded-[2rem] flex justify-around items-center py-3.5 bg-white/85 dark:bg-slate-950/80 backdrop-blur-3xl border border-white/45 dark:border-white/5 shadow-[0_15px_35px_rgba(0,0,0,0.18)]">
          {navItems.map((item) => {
            const isActive = item.path.includes('?')
              ? (location.pathname === item.path.split('?')[0] && location.search === '?' + item.path.split('?')[1])
              : (location.pathname === item.path && !location.search);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1.5 px-3 transition-all duration-300 relative group",
                  isActive ? "text-primary dark:text-accent" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                )}
              >
                <div className={cn(
                  "p-2.5 rounded-2xl transition-all duration-300",
                  isActive
                    ? "bg-[#004C6D]/10 dark:bg-accent/15 shadow-inner scale-105 border border-[#004C6D]/10 dark:border-accent/15"
                    : "group-hover:bg-slate-50 dark:group-hover:bg-white/5"
                )}>
                  <Icon className={cn("w-5 h-5 transition-transform duration-300", isActive ? "text-accent scale-110" : "text-slate-400 dark:text-slate-500")} />
                </div>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-wider transition-all duration-300",
                  isActive ? "opacity-100 font-black text-primary dark:text-accent" : "opacity-60 font-semibold"
                )}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="activeDot"
                    className="absolute -bottom-1.5 w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_8px_rgba(215,200,38,1)]"
                  />
                )}
              </Link>
            );
          })}
          {/* Logout — mobile only — confirm to prevent accidental tap */}
          <button
            onClick={() => { if (window.confirm(language === 'ar' ? 'هل تريد تسجيل الخروج؟' : 'Sign out?')) onLogout(); }}
            className="flex flex-col items-center gap-1.5 px-3 text-red-400 hover:text-red-500 transition-all duration-300 group"
          >
            <div className="p-2.5 rounded-2xl group-hover:bg-red-50 dark:group-hover:bg-red-500/10 transition-all duration-300">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider opacity-70">
              {language === 'ar' ? 'خروج' : 'Logout'}
            </span>
          </button>
        </nav>
      </div>



      <AnimatePresence>
        {showLibrarian && <LibrarianChat onClose={() => setShowLibrarian(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showOnboarding && (
          <Onboarding onDone={() => {
            localStorage.setItem('onboarding_done', '1');
            setShowOnboarding(false);
          }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFeedback && <FeedbackWidget onClose={() => setShowFeedback(false)} />}
      </AnimatePresence>
    </div>
  );
}

