import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  GraduationCap,
  ShieldAlert,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Globe,
  User as UserIcon,
  UserPlus
} from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';

interface LoginProps {
  onLogin: (user: User) => void;
}

export function Login({ onLogin }: LoginProps) {
  const { t, dir, language, toggleLanguage } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName]       = useState('');
  const [newEmail, setNewEmail]     = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [createError, setCreateError] = useState('');

  const navigate = useNavigate();

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    if (!newName.trim()) {
      setCreateError(language === 'ar' ? 'الرجاء إدخال الاسم' : 'Please enter your name');
      return;
    }
    if (!newEmail.trim()) {
      setCreateError(language === 'ar' ? 'الرجاء إدخال البريد الإلكتروني' : 'Please enter your email');
      return;
    }
    if (!newPassword) {
      setCreateError(language === 'ar' ? 'الرجاء إدخال كلمة المرور' : 'Please enter a password');
      return;
    }
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim(),
      role: 'student',
      borrowedBooks: [],
      totalReadCount: 0,
      points: 0,
      badges: [],
    };
    onLogin(newUser);
    navigate('/');
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
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
    try {
      // The server decides whether the credentials are valid and what role the
      // account has. Nothing here invents a user, and the role selector above
      // no longer grants anything — picking "Admin" cannot make you one.
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.status === 429) {
        setError(language === 'ar'
          ? 'محاولات كثيرة. انتظر دقيقة ثم حاول مرة أخرى.'
          : 'Too many attempts. Please wait a minute and try again.');
        return;
      }
      if (!res.ok) {
        setError(language === 'ar'
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
          : 'Incorrect email or password.');
        return;
      }

      const { user, token } = await res.json();
      try { sessionStorage.setItem('library_token', token); } catch { /* private mode */ }
      onLogin(user);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      console.error('Login request failed', err);
      setError(language === 'ar'
        ? 'تعذّر الاتصال بالخادم. تحقق من اتصالك وحاول مجدداً.'
        : 'Could not reach the server. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("min-h-screen flex items-center justify-center p-4 md:p-8 bg-bg-light dark:bg-slate-950 relative overflow-hidden font-sans", dir === 'rtl' ? 'text-right' : 'text-left')}>

      {/* LANGUAGE SWITCHER */}
      <div className={cn("absolute top-6 z-20", dir === 'rtl' ? 'left-6' : 'right-6')}>
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest hover:bg-[#004C6D]/10 hover:text-[#004C6D] dark:hover:text-[#D7C826] shadow-lg shadow-black/[0.04] border border-white/20 dark:border-white/5 transition-all cursor-pointer active:scale-95"
        >
          <Globe className="w-3.5 h-3.5 text-[#D7C826] animate-spin-slow" />
          <span>{language === 'ar' ? 'English' : 'العربية'}</span>
        </button>
      </div>

      {/* BACK */}
      <div className={cn("absolute top-6 z-20", dir === 'rtl' ? 'right-6' : 'left-6')}>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest hover:bg-[#004C6D]/10 hover:text-[#004C6D] dark:hover:text-[#D7C826] shadow-lg shadow-black/[0.04] border border-white/20 dark:border-white/5 transition-all cursor-pointer active:scale-95"
        >
          {dir === 'rtl' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
          <span>{language === 'ar' ? 'رجوع' : 'Back'}</span>
        </button>
      </div>

      {/* LOG IN CARD */}
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="official-card max-w-xl w-full p-6 md:p-12 relative z-10 bg-white dark:bg-slate-900"
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
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium max-w-sm mx-auto leading-relaxed">
            {t('loginDescription')}
          </p>
          <div className="w-12 h-1 bg-[#D7C826] mx-auto rounded-full mt-4"></div>
        </div>

        {/* Role Selection Tabs (Deep Teal and Gold highlight) */}
        {/* The role picker that used to sit here is gone. It looked like a
            choice of who to sign in as, and it behaved like one: selecting
            "Admin" with any address at all produced an admin session. The
            account's role now comes from the server with its credentials. */}

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
            <label htmlFor="login-email" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              {t('emailAddress')}
            </label>
            <div className="relative">
              <div className={cn("absolute inset-y-0 flex items-center pointer-events-none text-[#004C6D] dark:text-slate-500", dir === 'rtl' ? 'right-4' : 'left-4')}>
                <Mail className="w-4.5 h-4.5" />
              </div>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="user01@arlibrary.test"
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
            <label htmlFor="login-password" className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">
              {t('passwordLabel')}
            </label>
            <div className="relative">
              <div className={cn("absolute inset-y-0 flex items-center pointer-events-none text-[#004C6D] dark:text-slate-500", dir === 'rtl' ? 'right-4' : 'left-4')}>
                <Lock className="w-4.5 h-4.5" />
              </div>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
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
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                aria-pressed={showPassword}
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
                {/* No role in the label — the account's role comes from the
                    server, so promising to sign in "as Admin" would be a lie. */}
                <span>{t('loginBtn')}</span>
                {dir === 'rtl' ? <ArrowLeft className="w-4 h-4 text-[#D7C826] dark:text-[#004C6D]" /> : <ArrowRight className="w-4 h-4 text-[#D7C826] dark:text-[#004C6D]" />}
              </>
            )}
          </button>
        </form>

        {/* Create account / guest access links */}
        <div className="mt-6 space-y-3 text-center">
          {(
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>{t('noAccountPrompt')} </span>
              <button
                type="button"
                onClick={() => { setShowCreateForm(!showCreateForm); setCreateError(''); }}
                className="inline-flex items-center gap-1.5 text-[#004C6D] dark:text-[#D7C826] font-black hover:underline cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {t('createNewAccount')}
              </button>
            </div>
          )}

          {showCreateForm && (
            <motion.form
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleCreateAccount}
              className="space-y-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200/60 dark:border-white/5"
            >
              {createError && (
                <p className={cn("text-[10px] font-bold text-red-600 dark:text-red-400", dir === 'rtl' ? 'text-right' : 'text-left')}>
                  {createError}
                </p>
              )}
              <div className="relative">
                <div className={cn("absolute inset-y-0 flex items-center pointer-events-none text-[#004C6D] dark:text-slate-500", dir === 'rtl' ? 'right-3' : 'left-3')}>
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  autoComplete="name"
                  aria-label={language === 'ar' ? 'الاسم الكامل' : 'Full name'}
                  placeholder={language === 'ar' ? 'الاسم الكامل' : 'Full name'}
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setCreateError(''); }}
                  className={cn(
                    "w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl py-3 text-xs font-semibold border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-[#004C6D]/20 focus:border-[#004C6D] transition-all",
                    dir === 'rtl' ? "pr-10 pl-3 text-right" : "pl-10 pr-3 text-left"
                  )}
                />
              </div>
              <div className="relative">
                <div className={cn("absolute inset-y-0 flex items-center pointer-events-none text-[#004C6D] dark:text-slate-500", dir === 'rtl' ? 'right-3' : 'left-3')}>
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  aria-label={language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                  value={newEmail}
                  onChange={(e) => { setNewEmail(e.target.value); setCreateError(''); }}
                  className={cn(
                    "w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl py-3 text-xs font-semibold border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-[#004C6D]/20 focus:border-[#004C6D] transition-all",
                    dir === 'rtl' ? "pr-10 pl-3 text-right" : "pl-10 pr-3 text-left"
                  )}
                />
              </div>
              <div className="relative">
                <div className={cn("absolute inset-y-0 flex items-center pointer-events-none text-[#004C6D] dark:text-slate-500", dir === 'rtl' ? 'right-3' : 'left-3')}>
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  autoComplete="new-password"
                  aria-label={language === 'ar' ? 'كلمة المرور' : 'Password'}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setCreateError(''); }}
                  className={cn(
                    "w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-xl py-3 text-xs font-semibold border border-slate-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-[#004C6D]/20 focus:border-[#004C6D] transition-all",
                    dir === 'rtl' ? "pr-10 pl-3 text-right" : "pl-10 pr-3 text-left"
                  )}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#D7C826] text-[#004C6D] py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
              >
                {language === 'ar' ? 'إنشاء الحساب' : 'Create Account'}
              </button>
            </motion.form>
          )}

          <button
            type="button"
            onClick={handleGuestAccess}
            className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-[#004C6D] dark:hover:text-[#D7C826] transition-colors cursor-pointer underline-offset-2 hover:underline"
          >
            {language === 'ar' ? '← الدخول كضيف' : 'Continue as Guest →'}
          </button>
        </div>


        {/* Footer info/copyright */}
        <div className="mt-8 text-center">
           <p className="text-[9px] text-slate-300 dark:text-slate-600 font-bold uppercase tracking-widest">{t('copyright')}</p>
        </div>
      </motion.div>
    </div>
  );
}
