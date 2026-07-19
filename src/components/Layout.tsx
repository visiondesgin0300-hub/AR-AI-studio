import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Map, Compass, LogOut, User as UserIcon, Award, ShieldCheck, Brain, Bell, Check, Info, AlertTriangle, Sun, Moon, Languages, Camera, Search, HelpCircle, PlayCircle, MessageCircle, QrCode, X, Printer } from 'lucide-react';
import { User } from '../types';
import { cn, getUserLevel } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../hooks/useNotifications';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { GuidedTour } from './GuidedTour';
import { LibrarianChat } from './LibrarianChat';

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
  const [showTour, setShowTour] = useState(false);
  const [showLibrarian, setShowLibrarian] = useState(false);
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { t, toggleLanguage, language, dir } = useLanguage();

  const isAdmin = user.role === 'admin';

  // Role-specific navigation so each storyboard reads clearly:
  // - Student journey: home → search a book → locate it on the map → track it
  //   in "my books" (AR stays reachable via the floating button).
  // - Admin journey: management dashboard first (their real home; "/" already
  //   redirects admins to /admin), then the catalog search and map for
  //   reference. Personal, student-only surfaces (my borrowed books,
  //   gamification) are omitted so the admin flow isn't muddied by them.
  const navItems = isAdmin
    ? [
        { icon: ShieldCheck, label: t('admin'), path: '/admin' },
        { icon: Search, label: t('smartSearchCard'), path: '/search' },
        { icon: Map, label: t('knowledgeCampusMap'), path: '/map' },
        { icon: Compass, label: t('libraryFacilities'), path: '/facilities' },
      ]
    : [
        { icon: Home, label: t('dashboard'), path: '/' },
        { icon: Search, label: t('smartSearchCard'), path: '/search' },
        { icon: Map, label: t('knowledgeCampusMap'), path: '/map' },
        { icon: Compass, label: t('libraryFacilities'), path: '/facilities' },
        { icon: BookOpen, label: t('readingHistory'), path: '/my-books' },
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
          <div className={cn("flex items-center gap-2 mt-1", dir === 'rtl' ? 'ml-1' : 'mr-1')}>
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 tracking-[0.25em] uppercase leading-none outline-none">
              {t('appSubtitle')}
            </div>
            <span className="px-2 py-0.5 rounded-md bg-accent/15 text-accent text-[8px] font-black uppercase tracking-widest">
              {t('demoVersionBadge')}
            </span>
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

        {/* User Card & Gamification Panel */}
        <div className="p-6 relative z-10 border-t border-slate-100 dark:border-white/5">
          {/* Gamified Level Indicator - student progression only. */}
          {!isAdmin && (
          <div className="mb-4 space-y-1.5 px-1.5">
            <div className="flex justify-between items-center text-[10px] font-black tracking-wide text-slate-400 dark:text-slate-500 uppercase">
              <span className="flex items-center gap-1 text-primary dark:text-accent">
                <Award className="w-3.5 h-3.5 text-accent" />
                {language === 'ar' ? `المستوى ${getUserLevel(user.points || 450)}` : `Level ${getUserLevel(user.points || 450)}`}
              </span>
              <span className="text-primary dark:text-accent">{(user.points || 450) % 100}/100 XP</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(user.points || 450) % 100}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full bg-accent rounded-full"
              />
            </div>
          </div>
          )}

          <div className="flex items-center gap-3.5 mb-5 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-accent/20 transition-all duration-300 group">
             <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-accent relative overflow-hidden shrink-0 shadow-sm">
                <UserIcon className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform" />
             </div>
             <div className="overflow-hidden flex-1">
                <div className="text-xs font-black text-primary dark:text-white truncate uppercase tracking-tight group-hover:text-accent transition-colors">
                  {user.name}
                </div>
                <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  {user.role === 'admin' ? t('adminRole') : t('academicResearcher')}
                </div>
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

      {/* Camera action FAB — tapping opens a quick menu: scan a shelf QR
          code, open the books map with AR guide, or open facilities map. */}
      {showCameraMenu && (
        <div className="fixed inset-0 z-30" onClick={() => setShowCameraMenu(false)} />
      )}
      <div className={cn(
        'fixed z-40 bottom-28 lg:bottom-10 flex flex-col items-end gap-2',
        dir === 'rtl' ? 'left-5 lg:left-10 items-start' : 'right-5 lg:right-10 items-end'
      )}>
        <AnimatePresence>
          {showCameraMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 10 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="flex flex-col gap-2 mb-1"
            >
              {[
                { icon: QrCode, labelAr: 'مسح رمز QR', labelEn: 'Scan Shelf QR', path: '/scan', accent: true, adminOnly: false },
                { icon: Map, labelAr: 'خريطة المراجع AR', labelEn: 'Books Map AR', path: '/map', accent: false, adminOnly: false },
                { icon: Compass, labelAr: 'مرافق AR', labelEn: 'Facilities AR', path: '/facilities', accent: false, adminOnly: false },
                { icon: Printer, labelAr: 'طباعة QR الأرفف', labelEn: 'Print Shelf QR', path: '/qr-print', accent: false, adminOnly: true },
              ].filter(item => !item.adminOnly || isAdmin).map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.path}
                    initial={{ opacity: 0, x: dir === 'rtl' ? -16 : 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => { setShowCameraMenu(false); navigate(item.path); }}
                    className={cn(
                      'flex items-center gap-3 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl whitespace-nowrap active:scale-95 transition-transform',
                      item.accent
                        ? 'bg-accent text-primary shadow-accent/30'
                        : 'bg-primary text-white shadow-primary/30',
                      dir === 'rtl' ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{language === 'ar' ? item.labelAr : item.labelEn}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setShowCameraMenu(!showCameraMenu)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          title={t('arHubFabLabel')}
          className={cn(
            'flex items-center gap-3 pl-4 pr-5 py-4 rounded-full bg-accent text-primary shadow-[0_15px_40px_rgba(217,179,16,0.45)] group relative',
          )}
        >
          {!showCameraMenu && (
            <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-30 pointer-events-none" />
          )}
          <AnimatePresence mode="wait" initial={false}>
            {showCameraMenu ? (
              <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="w-5 h-5 relative z-10 shrink-0" />
              </motion.div>
            ) : (
              <motion.div key="cam" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <Camera className="w-5 h-5 relative z-10 shrink-0" />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="hidden sm:inline lg:max-w-0 lg:overflow-hidden lg:group-hover:max-w-[220px] whitespace-nowrap text-[11px] font-black uppercase tracking-widest relative z-10 transition-all duration-300">
            {t('arHubFabLabel')}
          </span>
        </motion.button>
      </div>

      {/* Persistent AI Librarian entry point - a chat helper one tap away from
          every page, stacked just above the AR button on the same side so the
          two floating actions never overlap the bottom nav or each other. */}
      <motion.button
        onClick={() => setShowLibrarian(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        title={t('askLibrarianLabel')}
        className={cn(
          "fixed z-40 bottom-44 lg:bottom-28 w-14 h-14 flex items-center justify-center rounded-full bg-primary dark:bg-slate-800 text-white border-2 border-white/20 dark:border-white/10 shadow-[0_15px_40px_rgba(0,76,109,0.45)]",
          dir === 'rtl' ? 'left-5 lg:left-10' : 'right-5 lg:right-10'
        )}
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-accent border-2 border-white dark:border-slate-900" />
      </motion.button>

      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        {/* Top Header - Welcome banner */}
        <header className="relative h-24 overflow-hidden bg-gradient-to-r from-primary via-[#01354C] to-primary dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-3 sm:px-6 lg:px-10 flex items-center justify-between z-40 sticky top-0 gap-2">
          <div className={cn("absolute -top-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none", dir === 'rtl' ? '-right-10' : '-left-10')} />

          <div className="flex-1 min-w-0 relative z-10 hidden md:block">
            <h1 className="text-lg lg:text-xl font-black text-white tracking-tight truncate">
              {t('welcomeUser').replace('{name}', user.name)}
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

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-3 rounded-2xl bg-white/10 text-white/80 border border-white/15 hover:bg-white/20 hover:border-white/25 transition-all relative overflow-hidden"
              title={theme === 'light' ? 'الوضع الداكن' : 'الوضع الفاتح'}
            >
              <motion.div
                initial={false}
                animate={{ 
                  rotate: theme === 'light' ? 0 : 180,
                  scale: theme === 'light' ? 1 : 0
                }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Moon className="w-5 h-5" />
              </motion.div>
              <motion.div
                initial={false}
                animate={{ 
                  rotate: theme === 'light' ? -180 : 0,
                  scale: theme === 'light' ? 0 : 1
                }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Sun className="w-5 h-5 text-accent" />
              </motion.div>
              <div className="w-5 h-5 opacity-0"></div> {/* Spacer */}
            </motion.button>

            {/* Guided Tour - a self-driving walkthrough of every core feature,
                so the app can be presented to an audience without narrating
                each click manually. */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowTour(true)}
              title={t('guidedTourLabel')}
              className="p-3 rounded-2xl bg-white/10 text-white/80 border border-white/15 hover:bg-white/20 hover:border-white/25 transition-all"
            >
              <PlayCircle className="w-5 h-5" />
            </motion.button>

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
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
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
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowNotifications(false)}
                    ></div>
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 mt-4 w-96 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-white/10 z-20 overflow-hidden"
                    >
                      <div className="p-6 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <h3 className="text-sm font-black text-primary dark:text-white uppercase tracking-tight">{t('notifications')}</h3>
                            <div className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-black text-slate-400">
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
                          <div className="divide-y divide-slate-50">
                            {notifications.map((notif) => (
                              <div 
                                key={notif.id}
                                className={cn(
                                  "p-6 hover:bg-slate-50 transition-all cursor-pointer relative group",
                                  !notif.isRead && "bg-slate-50/50"
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
                                    notif.type === 'warning' ? "bg-amber-100 text-amber-600" : 
                                    notif.type === 'alert' ? "bg-red-100 text-red-600" : 
                                    "bg-blue-100 text-blue-600"
                                  )}>
                                    {notif.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : 
                                     notif.type === 'alert' ? <AlertTriangle className="w-5 h-5 animate-pulse" /> : 
                                     <Info className="w-5 h-5" />}
                                  </div>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex justify-between items-start">
                                      <h4 className="text-xs font-black text-primary leading-tight">{notif.title}</h4>
                                      <span className="text-[8px] font-bold text-slate-300 uppercase shrink-0">منذ قليل</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed line-clamp-2">
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
                             <div className="w-16 h-16 bg-slate-50 rounded-full mx-auto flex items-center justify-center text-slate-200">
                                <Bell className="w-8 h-8" />
                             </div>
                             <div className="text-xs font-black text-slate-300 uppercase tracking-widest">لا توجد تنبيهات حالياً</div>
                          </div>
                        )}
                      </div>

                      <button 
                        className="w-full py-4 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-100 transition-all border-t border-slate-50"
                        onClick={() => setShowNotifications(false)}
                      >
                        {t('close')}
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Premium Header Stat Capsules - student gamification only, so the
                admin header stays focused on management, not XP/borrows. */}
            {!isAdmin && (
            <div className="flex gap-3 items-center">
              {/* Borrowed Books Stat */}
              <motion.div
                whileHover={{ y: -2, scale: 1.02 }}
                className="flex items-center gap-3 px-4.5 py-2 bg-white/10 border border-white/15 rounded-2xl shadow-sm hover:bg-white/20 transition-all cursor-default"
              >
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#99d6ea]">
                  <BookOpen className="w-4 h-4 font-bold" />
                </div>
                <div>
                  <div className="text-[8px] font-black text-white/50 uppercase tracking-wider">{t('borrowed')}</div>
                  <div className="text-sm font-black text-[#99d6ea] leading-none mt-0.5">{user.borrowedBooks.length}</div>
                </div>
              </motion.div>

              {/* Experience points Stat with a gold medal flare */}
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
                    {user.points || 450} <span className="text-[9px] font-bold text-white/60">XP</span>
                  </div>
                </div>
              </motion.div>
            </div>
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
                  <Icon className={cn("w-5 h-5 transition-transform duration-300", isActive ? "text-accent scale-110" : "text-slate-450 dark:text-slate-500")} />
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
        </nav>
      </div>

      <AnimatePresence>
        {showTour && <GuidedTour user={user} onClose={() => setShowTour(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showLibrarian && <LibrarianChat onClose={() => setShowLibrarian(false)} />}
      </AnimatePresence>
    </div>
  );
}

// Helper to get count for sidebar logic
const borrowedBooksCount = 1; // Dummy for placeholder logic above
