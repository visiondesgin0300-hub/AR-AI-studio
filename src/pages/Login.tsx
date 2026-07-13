import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Search as SearchIcon,
  Map as MapIcon,
  BookOpen,
  GraduationCap,
  ShieldAlert,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  UserCheck,
  Globe,
  User as UserIcon,
  UserPlus,
  Compass
} from 'lucide-react';
import { motion } from 'motion/react';
import { MOCK_USERS } from '../data/mockData';
import { User } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';

interface LoginProps {
  onLogin: (user: User) => void;
}

export function Login({ onLogin }: LoginProps) {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateAccountNotice, setShowCreateAccountNotice] = useState(false);

  const navigate = useNavigate();

  // Get matching mock users for quick access based on selected role
  const quickAccessProfiles = MOCK_USERS.filter(u => u.role === role);

  const handleGuestAccess = () => {
    const guestUser: User = {
      id: `guest_${Date.now()}`,
      name: language === 'ar' ? 'ضيف' : 'Guest',
      email: 'guest@arlibrary.demo',
      role: 'student',
      borrowedBooks: [],
      totalReadCount: 0,
      points: 0,
      badges: [],
    };
    onLogin(guestUser);
    navigate('/');
  };

  const handleProfileClick = (profile: User) => {
    setEmail(profile.email);
    setPassword('••••••••');
    setError('');
    
    setIsLoading(true);
    setTimeout(() => {
      onLogin(profile);
      setIsLoading(false);
      navigate(profile.role === 'admin' ? '/admin' : '/');
    }, 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError(language === 'ar' ? 'الرجاء إدخال البريد الإلكتروني الأكاديمي' : 'Please enter your academic email');
      return;
    }
    if (!password) {
      setError(language === 'ar' ? 'الرجاء إدخال كلمة المرور' : 'Please enter your password');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const foundUser = MOCK_USERS.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.role === role
      );

      if (foundUser) {
        onLogin(foundUser);
        setIsLoading(false);
        navigate(foundUser.role === 'admin' ? '/admin' : '/');
      } else {
        const userWithWrongRole = MOCK_USERS.find(
          u => u.email.toLowerCase() === email.toLowerCase()
        );

        if (userWithWrongRole) {
          setError(
            language === 'ar' 
              ? `هذا الحساب مسجل كـ ${userWithWrongRole.role === 'admin' ? 'مسؤول' : 'مستخدم'}. يرجى تغيير نوع الحساب المختار فوق.` 
              : `This account is registered as ${userWithWrongRole.role === 'admin' ? 'Admin' : 'User'}. Please change the account type above.`
          );
          setIsLoading(false);
          return;
        }

        const dynamicUser: User = {
          id: `dynamic_${Date.now()}`,
          name: email.split('@')[0].split('.')[0].replace(/^\w/, c => c.toUpperCase()) || (role === 'admin' ? 'Specialist' : 'User'),
          email: email,
          role: role,
          borrowedBooks: [],
          totalReadCount: 0,
          points: 100,
          badges: role === 'admin' ? ['مشرف جديد'] : ['قارئ جديد']
        };

        onLogin(dynamicUser);
        setIsLoading(false);
        navigate(dynamicUser.role === 'admin' ? '/admin' : '/');
      }
    }, 600);
  };

  return (
    <div className={cn("min-h-screen flex items-center justify-center p-4 md:p-8 bg-[#99d6ea] dark:bg-slate-950 relative overflow-hidden font-sans", dir === 'rtl' ? 'text-right' : 'text-left')}>
      
      {/* LANGUAGE SWITCHER */}
      <div className={cn("absolute top-6 z-20", dir === 'rtl' ? 'left-6' : 'right-6')}>
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl text-[10px] font-black text-slate-750 dark:text-slate-300 uppercase tracking-widest hover:bg-[#004C6D]/10 hover:text-[#004C6D] dark:hover:text-[#D7C826] shadow-lg shadow-black/[0.04] border border-white/20 dark:border-white/5 transition-all cursor-pointer active:scale-95"
        >
          <Globe className="w-3.5 h-3.5 text-[#D7C826] animate-spin-slow" />
          <span>{language === 'ar' ? 'English' : 'العربية'}</span>
        </button>
      </div>

      {/* BACK AS GUEST */}
      <div className={cn("absolute top-6 z-20", dir === 'rtl' ? 'right-6' : 'left-6')}>
        <button
          type="button"
          onClick={handleGuestAccess}
          className="flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl text-[10px] font-black text-slate-750 dark:text-slate-300 uppercase tracking-widest hover:bg-[#004C6D]/10 hover:text-[#004C6D] dark:hover:text-[#D7C826] shadow-lg shadow-black/[0.04] border border-white/20 dark:border-white/5 transition-all cursor-pointer active:scale-95"
        >
          {dir === 'rtl' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
          <span>{t('backAsGuest')}</span>
        </button>
      </div>

      {/* BACKGROUND DECORATIVE GLOWS AND SKY ELEMENTS */}
      {/* ☀️ Beautiful Concentric Sun RIngs in Upper Corner */}
      <div className="absolute top-[-40px] right-[-40px] w-64 h-64 rounded-full bg-[#D7C826]/10 dark:bg-[#D7C826]/5 pointer-events-none" />
      <div className="absolute top-[-10px] right-[-10px] w-40 h-40 rounded-full bg-[#D7C826]/20 dark:bg-[#D7C826]/10 blur-xl pointer-events-none" />

      {/* ☁️ Delicate Floating Clouds */}
      <div className="absolute top-16 left-[15%] w-32 h-10 bg-white/40 dark:bg-white/5 rounded-full blur-[2px] pointer-events-none animate-pulse" />
      <div className="absolute top-12 left-[18%] w-16 h-16 bg-white/45 dark:bg-white/5 rounded-full blur-[1px] pointer-events-none pr-1" />
      
      <div className="absolute bottom-20 right-[15%] w-28 h-8 bg-white/40 dark:bg-white/5 rounded-full blur-[2px] pointer-events-none" />
      <div className="absolute bottom-16 right-[17%] w-12 h-12 bg-white/45 dark:bg-white/5 rounded-full blur-[1px] pointer-events-none" />

      {/* ⭐ Star/Sparkle accents */}
      <div className="absolute top-1/4 right-[10%] opacity-50 dark:opacity-30 pointer-events-none animate-bounce">
        <Sparkles className="w-6 h-6 text-[#D7C826]" />
      </div>
      <div className="absolute bottom-1/4 left-[10%] opacity-40 dark:opacity-25 pointer-events-none animate-pulse">
        <Sparkles className="w-5 h-5 text-white" />
      </div>

      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#99d6ea]/30 dark:bg-[#004C6D]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#D7C826]/10 dark:bg-[#D7C826]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* LOG IN CARD WITH RE-WORKED CLEAN BRANDING AND PALETTE */}
      <motion.div 
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-xl w-full p-6 md:p-12 relative z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-white/60 dark:border-white/5 shadow-2xl shadow-slate-900/10 rounded-3xl"
      >
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
             <div className="inline-flex items-center ring-8 ring-[#99d6ea]/20 dark:ring-slate-800/30 shadow-xl shadow-[#004C6D]/5 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-950">
                <div className="bg-[#004C6D] p-3.5 flex items-center justify-center">
                   <BookOpen className="text-[#D7C826] w-7 h-7" />
                </div>
                <div className="bg-[#D7C826] p-3.5 flex items-center justify-center">
                   <GraduationCap className="text-[#004C6D] w-7 h-7" />
                </div>
             </div>
          </div>
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-[#004C6D] dark:text-white tracking-tight leading-relaxed">{t('smartLibraryTitle')}</h2>
            <div className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] leading-relaxed">{t('smartKnowledgePortal')}</div>
          </div>
          <p className="text-xs text-slate-550 dark:text-slate-400 mt-3 font-medium max-w-sm mx-auto leading-relaxed">
            {t('loginDescription')}
          </p>
          <div className="w-12 h-1 bg-[#D7C826] mx-auto rounded-full mt-4"></div>
        </div>

        {/* Role Selection Tabs (Deep Teal and Gold highlight) */}
        <div className="mb-6">
          <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 text-center">
            {t('selectRole')}
          </label>
          <div className="grid grid-cols-2 gap-2.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-2xl">
            <button
              type="button"
              onClick={() => { setRole('student'); setError(''); }}
              className={cn(
                "py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer border border-transparent",
                role === 'student' 
                  ? "bg-white dark:bg-slate-900 text-[#004C6D] dark:text-[#D7C826] shadow-md shadow-black/[0.04] ring-2 ring-[#99d6ea] border-[#99d6ea]" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <UserIcon className={cn("w-4.5 h-4.5 transition-all duration-300", role === 'student' ? "text-[#99d6ea] scale-110 drop-shadow-[0_0_5px_rgba(153,214,234,0.8)]" : "text-slate-400")} />
              <span>{t('studentRole')}</span>
            </button>
            <button
              type="button"
              onClick={() => { setRole('admin'); setError(''); }}
              className={cn(
                "py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer border border-transparent",
                role === 'admin' 
                  ? "bg-white dark:bg-slate-900 text-[#004C6D] dark:text-[#D7C826] shadow-md shadow-black/[0.04] ring-2 ring-[#99d6ea] border-[#99d6ea]" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              <UserCheck className={cn("w-4.5 h-4.5 transition-all duration-300", role === 'admin' ? "text-[#99d6ea] scale-110 drop-shadow-[0_0_5px_rgba(153,214,234,0.8)]" : "text-slate-400")} />
              <span>{t('adminRole')}</span>
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 bg-red-50 dark:bg-red-950/25 border border-red-200/50 dark:border-red-900/30 rounded-2xl flex items-start gap-3"
            >
              <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800 dark:text-red-300 font-bold leading-relaxed">{error}</p>
            </motion.div>
          )}

          {/* Email */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              {t('emailAddress')}
            </label>
            <div className="relative">
              <div className={cn("absolute inset-y-0 flex items-center pointer-events-none text-[#004C6D] dark:text-slate-500", dir === 'rtl' ? 'right-4' : 'left-4')}>
                <Mail className="w-4.5 h-4.5" />
              </div>
              <input
                type="email"
                placeholder={role === 'admin' ? "fatima@example.com" : "sarah@example.com"}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                className={cn(
                  "w-full bg-[#E5E1E6]/40 dark:bg-slate-950 text-slate-800 dark:text-white rounded-2xl py-4 text-xs font-semibold border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-[#004C6D]/20 focus:border-[#004C6D] transition-all duration-300",
                  dir === 'rtl' ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"
                )}
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              {t('passwordLabel')}
            </label>
            <div className="relative">
              <div className={cn("absolute inset-y-0 flex items-center pointer-events-none text-[#004C6D] dark:text-slate-500", dir === 'rtl' ? 'right-4' : 'left-4')}>
                <Lock className="w-4.5 h-4.5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className={cn(
                  "w-full bg-[#E5E1E6]/40 dark:bg-slate-950 text-slate-800 dark:text-white rounded-2xl py-4 text-xs font-semibold border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-[#004C6D]/20 focus:border-[#004C6D] transition-all duration-300",
                  dir === 'rtl' ? "pr-12 pl-12 text-right" : "pl-12 pr-12 text-left"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={cn("absolute inset-y-0 flex items-center px-4 text-slate-400 hover:text-[#004C6D] dark:hover:text-[#D7C826] cursor-pointer", dir === 'rtl' ? 'left-0' : 'right-0')}
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          {/* Log In Button - Pure color scheme */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#004C6D] dark:bg-[#D7C826] text-white dark:text-[#004C6D] py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-95 active:scale-[0.98] transition-all duration-200 shadow-xl shadow-[#004C6D]/15 dark:shadow-[#D7C826]/5 border border-white/5 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{t('loginBtn')} ({role === 'admin' ? t('adminRole') : t('studentRole')})</span>
                {dir === 'rtl' ? <ArrowLeft className="w-4 h-4 text-[#D7C826] dark:text-[#004C6D]" /> : <ArrowRight className="w-4 h-4 text-[#D7C826] dark:text-[#004C6D]" />}
              </>
            )}
          </button>
        </form>

        {/* Create account / guest access links */}
        <div className="mt-6 space-y-3 text-center">
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>{t('noAccountPrompt')} </span>
            <button
              type="button"
              onClick={() => setShowCreateAccountNotice(true)}
              className="inline-flex items-center gap-1.5 text-[#004C6D] dark:text-[#D7C826] font-black hover:underline cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {t('createNewAccount')}
            </button>
          </div>
          {showCreateAccountNotice && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-bold text-slate-400 dark:text-slate-500"
            >
              {t('createAccountComingSoon')}
            </motion.p>
          )}
          <button
            type="button"
            onClick={handleGuestAccess}
            className="inline-flex items-center gap-1.5 text-xs font-black text-slate-500 dark:text-slate-400 hover:text-[#004C6D] dark:hover:text-[#D7C826] transition-colors cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            {t('enterAsGuestExplore')}
            {dir === 'rtl' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Quick Demo Access Options */}
        <div className="mt-8 pt-6 border-t border-slate-150/60 dark:border-white/5">
          <div className="flex items-center justify-between mb-4">
             <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5 font-bold">
               <Sparkles className="w-3.5 h-3.5 text-[#D7C826] animate-pulse" />
               {t('quickAccessDemo')}
             </span>
             <span className="text-[9px] font-bold text-[#004C6D] dark:text-[#D7C826] bg-[#004C6D]/5 dark:bg-[#D7C826]/10 px-2 py-0.5 rounded-lg border border-[#004C6D]/10 dark:border-[#D7C826]/20">
               Demo accounts
             </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickAccessProfiles.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => handleProfileClick(profile)}
                disabled={isLoading}
                className="group flex items-center justify-between p-3.5 bg-slate-50/70 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/40 rounded-2xl text-left border border-slate-150/50 dark:border-white/5 transition-all text-sm font-semibold hover:scale-[1.02] active:scale-95 disabled:pointer-events-none cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#004C6D] group-hover:bg-[#D7C826] text-white group-hover:text-[#004C6D] flex items-center justify-center text-xs font-black shadow-sm transition-colors duration-300">
                    {profile.name.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 leading-tight group-hover:text-[#004C6D] dark:group-hover:text-[#D7C826] transition-colors">
                      {profile.name}
                    </h4>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 truncate block max-w-[130px]">
                      {profile.email}
                    </span>
                  </div>
                </div>
                {dir === 'rtl' ? (
                  <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform group-hover:text-[#004C6D] dark:group-hover:text-[#D7C826]" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform group-hover:text-[#004C6D] dark:group-hover:text-[#D7C826]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Access Technology features panel */}
        <div className="flex flex-col gap-3 pt-6 mt-6 border-t border-slate-150/60 dark:border-white/5 max-w-sm mx-auto">
          <div className="text-center">
             <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('accessTech')}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
             <div className="official-card py-2.5 px-1.5 flex flex-col items-center gap-1.5 bg-slate-50/50 dark:bg-slate-800/30 border-none transition-transform hover:scale-105">
               <SearchIcon className="w-3.5 h-3.5 text-[#004C6D] dark:text-white" />
               <span className="text-[8px] font-black text-slate-600 dark:text-white uppercase truncate max-w-full">{t('searchTitle')}</span>
             </div>
             <div className="official-card py-2.5 px-1.5 flex flex-col items-center gap-1.5 bg-slate-50/50 dark:bg-slate-800/30 border-none transition-transform hover:scale-105">
               <MapIcon className="w-3.5 h-3.5 text-[#004C6D] dark:text-white" />
               <span className="text-[8px] font-black text-slate-600 dark:text-white uppercase truncate max-w-full">{t('mapTitle')}</span>
             </div>
             <div className="official-card py-2.5 px-1.5 flex flex-col items-center gap-1.5 bg-slate-50/50 dark:bg-slate-800/30 border-none transition-transform hover:scale-105">
               <BookOpen className="w-3.5 h-3.5 text-[#004C6D] dark:text-white" />
               <span className="text-[8px] font-black text-slate-600 dark:text-white uppercase truncate max-w-full">{t('myBooksTitle')}</span>
             </div>
          </div>
        </div>

        {/* Footer info/copyright */}
        <div className="mt-8 text-center">
           <p className="text-[9px] text-slate-350 dark:text-slate-600 font-bold uppercase tracking-widest">{t('copyright')}</p>
        </div>
      </motion.div>
    </div>
  );
}
