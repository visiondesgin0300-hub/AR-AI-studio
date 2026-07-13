import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Map, LogOut, User as UserIcon, Award, ShieldCheck, Brain, Bell, Check, Info, AlertTriangle, Sun, Moon, Languages, Camera } from 'lucide-react';
import { User } from '../types';
import { cn, getUserLevel } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNotifications } from '../hooks/useNotifications';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';

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
  const { theme, toggleTheme } = useTheme();
  const { t, toggleLanguage, language, dir } = useLanguage();

  const navItems = [
    { icon: Home, label: t('dashboard'), path: '/' },
    { icon: Camera, label: t('arHubFabLabel'), path: '/ar' },
    { icon: Map, label: t('libraryMap'), path: '/map' },
    { icon: BookOpen, label: t('readingHistory'), path: '/my-books' },
  ];

  if (user.role === 'admin') {
    navItems.push({ icon: ShieldCheck, label: t('admin'), path: '/admin' });
  }

  return (
    <div className={cn(
      "flex h-screen w-full overflow-hidden bg-bg-light dark:bg-bg-dark transition-all duration-700",
      dir === 'rtl' ? 'flex-row' : 'flex-row'
    )}>
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div 
          animate={{ 
            scale: theme === 'light' ? 1 : 1.2,
            opacity: theme === 'light' ? 0.3 : 0.1,
            x: theme === 'light' ? 0 : 100,
            y: theme === 'light' ? -50 : -200,
            rotate: theme === 'light' ? 0 : 45
          }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute -top-[10%] -right-[10%] w-[60%] h-[60%] bg-primary/20 dark:bg-accent/10 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: theme === 'light' ? 1 : 1.5,
            opacity: theme === 'light' ? 0.2 : 0.4,
            x: theme === 'light' ? 0 : -200,
            y: theme === 'light' ? 50 : 250,
            rotate: theme === 'light' ? 0 : -45
          }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute -bottom-[20%] -left-[10%] w-[70%] h-[70%] bg-accent/20 dark:bg-primary/30 rounded-full blur-[150px]"
        />
        
        {/* Subtler procedural beams in dark mode */}
        <AnimatePresence>
          {theme === 'dark' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
               <div className="absolute top-1/4 left-1/4 w-[1px] h-[500px] bg-gradient-to-b from-transparent via-accent/20 to-transparent rotate-45 blur-sm"></div>
               <div className="absolute bottom-1/4 right-1/4 w-[1px] h-[500px] bg-gradient-to-b from-transparent via-primary/30 to-transparent rotate-45 blur-sm"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop Sidebar (Ultra-Attractive Gradient and Glassmorphic Theme) */}
      <aside className={cn(
        "hidden lg:flex w-72 flex-col flex-shrink-0 z-50 relative overflow-hidden transition-all duration-500",
        "bg-gradient-to-b from-[#004C6D] via-[#01354C] to-[#002233] text-white",
        dir === 'rtl' ? 'border-l border-white/10 shadow-[-10px_0_30px_rgba(0,0,0,0.15)]' : 'border-r border-white/10 shadow-[10px_0_30px_rgba(0,0,0,0.15)]'
      )}>
        {/* Glowing Decorative Orbs inside Sidebar */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-40 right-0 w-24 h-24 bg-[#99d6ea]/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        
        {/* Brand Header */}
        <div className="p-8 relative z-10 border-b border-white/5 bg-black/5">
          <div className="flex items-center gap-3.5 mb-2 justify-start">
             <div className="flex items-center group cursor-pointer">
                <div className={cn("w-9 h-9 bg-accent flex items-center justify-center text-primary shadow-lg shadow-accent/30 hover:scale-105 transition-transform", dir === 'rtl' ? 'rounded-r-xl' : 'rounded-l-xl')}>
                   <BookOpen className="w-5 h-5 font-black" />
                </div>
                <div className={cn("w-9 h-9 bg-white/10 flex items-center justify-center text-accent shadow-lg backdrop-blur-md hover:scale-105 transition-transform", dir === 'rtl' ? 'rounded-l-xl' : 'rounded-r-xl')}>
                   <Brain className="w-5 h-5 font-black animate-pulse" />
                </div>
             </div>
             <span className="text-xl font-black tracking-widest uppercase italic bg-gradient-to-r from-white via-slate-150 to-accent bg-clip-text text-transparent">{t('appName')}</span>
          </div>
          <div className={cn("text-[10px] font-black text-[#99d6ea]/60 tracking-[0.25em] uppercase leading-none mt-1 outline-none", dir === 'rtl' ? 'ml-1' : 'mr-1')}>
            {t('appSubtitle')}
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
                  "group flex items-center gap-4 px-5 py-4 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden",
                  isActive 
                    ? "bg-gradient-to-r from-accent/15 to-accent/5 border border-accent/25 text-accent shadow-[0_4px_20px_rgba(215,200,38,0.15)]" 
                    : "hover:bg-white/5 text-white/60 hover:text-white"
                )}
              >
                {/* Active side-border glow */}
                {isActive && (
                  <div className={cn(
                    "absolute top-0 bottom-0 w-1 bg-gradient-to-b from-accent to-secondary", 
                    dir === 'rtl' ? 'left-0' : 'right-0'
                  )} />
                )}
                
                <Icon className={cn("w-5 h-5 transition-all duration-300", isActive ? "scale-110 text-accent rotate-3" : "group-hover:text-accent group-hover:scale-105")} />
                <span className="font-bold text-xs uppercase tracking-widest transition-colors duration-300">{item.label}</span>
                
                {isActive && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className={cn("w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_12px_rgba(215,200,38,1)]", dir === 'rtl' ? 'mr-auto' : 'ml-auto')}
                  />
                )}
              </Link>
            );
          })}
        </nav>
        
        {/* User Card & Gamification Panel */}
        <div className="p-6 relative z-10 border-t border-white/5 bg-black/20 backdrop-blur-md">
          {/* Gamified Level Indicator */}
          <div className="mb-4 space-y-1.5 px-1.5">
            <div className="flex justify-between items-center text-[10px] font-black tracking-wide text-white/60 uppercase">
              <span className="flex items-center gap-1 text-[#99d6ea]">
                <Award className="w-3.5 h-3.5 text-accent animate-bounce" />
                {language === 'ar' ? `المستوى ${getUserLevel(user.points || 450)}` : `Level ${getUserLevel(user.points || 450)}`}
              </span>
              <span className="text-accent">{(user.points || 450) % 100}/100 XP</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/10 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(user.points || 450) % 100}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-accent via-[#99d6ea] to-sky-400 rounded-full" 
              />
            </div>
          </div>

          <div className="flex items-center gap-3.5 mb-5 p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-300 group">
             <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-accent to-[#99d6ea] p-0.5 flex items-center justify-center text-primary relative overflow-hidden shrink-0 shadow-lg shadow-black/15">
                <div className="absolute inset-0 bg-[#004C6D] rounded-[10px] group-hover:scale-95 transition-transform" />
                <UserIcon className="w-5 h-5 text-accent relative z-10 group-hover:scale-110 transition-transform" />
             </div>
             <div className="overflow-hidden flex-1">
                <div className="text-xs font-black text-white truncate uppercase tracking-tight group-hover:text-accent transition-colors">
                  {user.name}
                </div>
                <div className="text-[9px] font-bold text-[#99d6ea] uppercase tracking-widest leading-none mt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  {t('academicResearcher')}
                </div>
             </div>
          </div>

          <button 
            onClick={onLogout}
            className="w-full py-3.5 rounded-2xl text-white/40 hover:text-white hover:bg-red-500/10 hover:border-red-500/20 flex items-center justify-center gap-2.5 transition-all duration-300 text-[10px] font-black tracking-[0.2em] uppercase border border-white/5 cursor-pointer"
          >
            <LogOut className="w-4 h-4 rtl-flip" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Persistent AR entry point - AR is the app's primary interface, so it
          stays one tap away from anywhere, not buried inside a single page. */}
      <motion.button
        onClick={() => navigate('/ar')}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className={cn(
          "fixed z-40 bottom-28 lg:bottom-10 flex items-center gap-3 pl-4 pr-5 py-4 rounded-full bg-accent text-primary shadow-[0_15px_40px_rgba(217,179,16,0.45)] group",
          dir === 'rtl' ? 'left-5 lg:left-10' : 'right-5 lg:right-10'
        )}
      >
        <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-30 pointer-events-none" />
        <Camera className="w-5 h-5 relative z-10" />
        <span className="hidden sm:inline text-[11px] font-black uppercase tracking-widest relative z-10">
          {t('arHubFabLabel')}
        </span>
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

            {/* Premium Header Stat Capsules */}
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
        <main className="flex-1 overflow-y-auto pt-10 pb-24 lg:pb-12 px-8 lg:px-12 bg-bg-light dark:bg-bg-dark transition-colors duration-300">
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
    </div>
  );
}

// Helper to get count for sidebar logic
const borrowedBooksCount = 1; // Dummy for placeholder logic above
