import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, ShieldCheck, Lock, Mail, Eye, EyeOff, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';
import { LoginTabs } from '../components/LoginTabs';

interface AdminLoginProps {
  onLogin: (user: User) => void;
}

/**
 * Staff entrance, on its own route and linked from nowhere in the app.
 *
 * It posts to the same /api/login as the student form — the server is still
 * the only thing that validates credentials and decides a role. What this page
 * adds is separation: it refuses to sign in a student account, so the admin
 * panel has one clearly marked door instead of sharing the public one.
 */
export function AdminLogin({ onLogin }: AdminLoginProps) {
  const { dir, language, toggleLanguage } = useLanguage();
  const ar = language === 'ar';
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError(ar ? 'أدخل البريد الإلكتروني وكلمة المرور.' : 'Enter your email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.status === 429) {
        setError(ar
          ? 'محاولات كثيرة. انتظر دقيقة ثم حاول مرة أخرى.'
          : 'Too many attempts. Please wait a minute and try again.');
        return;
      }
      if (!res.ok) {
        setError(ar ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' : 'Incorrect email or password.');
        return;
      }

      const { user, token } = await res.json();
      // Valid credentials, wrong door. Don't quietly sign a student in here.
      if (user.role !== 'admin') {
        setError(ar
          ? 'هذا المدخل مخصص لطاقم المكتبة. استخدم صفحة الدخول العامة.'
          : 'This entrance is for library staff. Please use the main sign-in page.');
        try {
          await fetch('/api/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        } catch { /* best effort */ }
        return;
      }

      try { sessionStorage.setItem('library_token', token); } catch { /* private mode */ }
      onLogin(user);
      navigate('/admin');
    } catch (err) {
      console.error('Admin login request failed', err);
      setError(ar
        ? 'تعذّر الاتصال بالخادم. تحقق من اتصالك وحاول مجدداً.'
        : 'Could not reach the server. Check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // text-base, not text-sm: iOS Safari zooms the page in whenever a focused
  // input is under 16px, and the user then has to pinch back out to see the
  // form. Drops to 14px only from sm: upward, where that behaviour doesn't apply.
  const fieldCls = cn(
    'w-full bg-white/5 text-white placeholder:text-white/25 rounded-2xl py-4 text-base sm:text-sm font-bold',
    'border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#D7C826]/40 focus:border-[#D7C826]/40 transition-all',
    dir === 'rtl' ? 'pr-12 pl-14 text-right' : 'pl-12 pr-14 text-left'
  );

  return (
    <div
      // pt-24 reserves the language/back row. The card is vertically centred,
      // so on a short phone it grew upward until those buttons sat on top of
      // it — at 320px the language button landed over the shield badge.
      className={cn('min-h-screen flex items-center justify-center px-4 pt-24 pb-8 md:p-8 bg-[#01293b] relative font-sans',
        dir === 'rtl' ? 'text-right' : 'text-left')}
      dir={dir}
    >
      <div className="absolute inset-0 pointer-events-none"
           style={{ backgroundImage: 'radial-gradient(at 50% 0%, rgba(215,200,38,.10) 0px, transparent 55%)' }} />

      <div className={cn('absolute top-6 z-20', dir === 'rtl' ? 'left-6' : 'right-6')}>
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-4 py-3 bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-white/80 uppercase tracking-widest hover:bg-white/15 transition-all cursor-pointer active:scale-95"
        >
          <Globe className="w-3.5 h-3.5 text-[#D7C826]" />
          <span>{ar ? 'English' : 'العربية'}</span>
        </button>
      </div>

      <div className={cn('absolute top-6 z-20', dir === 'rtl' ? 'right-6' : 'left-6')}>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-3 bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-white/80 uppercase tracking-widest hover:bg-white/15 transition-all cursor-pointer active:scale-95"
        >
          {dir === 'rtl' ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
          <span>{ar ? 'رجوع' : 'Back'}</span>
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10 rounded-[2rem] bg-white/[0.04] border border-white/10 backdrop-blur-xl p-8 md:p-10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-[#D7C826] items-center justify-center mb-5">
            <ShieldCheck className="w-7 h-7 text-[#01293b]" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {ar ? 'دخول الإدارة' : 'Administration Sign-in'}
          </h1>
          <p className="text-[11px] font-bold text-white/45 mt-2 leading-relaxed">
            {ar ? 'مخصص لطاقم المكتبة المصرّح له' : 'For authorised library staff only'}
          </p>
        </div>

        <LoginTabs active="admin" variant="dark" />

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25" role="alert">
              <p className="text-[11px] font-bold text-red-300 leading-relaxed">{error}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="admin-email" className="block text-[10px] font-black text-white/40 uppercase tracking-widest px-1">
              {ar ? 'البريد الإلكتروني' : 'Email'}
            </label>
            <div className="relative">
              <div className={cn('absolute inset-y-0 flex items-center pointer-events-none text-white/30', dir === 'rtl' ? 'right-4' : 'left-4')}>
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="admin-email"
                type="email"
                dir="ltr"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="name@example.com"
                className={fieldCls}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="block text-[10px] font-black text-white/40 uppercase tracking-widest px-1">
              {ar ? 'كلمة المرور' : 'Password'}
            </label>
            <div className="relative">
              <div className={cn('absolute inset-y-0 flex items-center pointer-events-none text-white/30', dir === 'rtl' ? 'right-4' : 'left-4')}>
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                className={fieldCls}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={ar ? (showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور')
                               : (showPassword ? 'Hide password' : 'Show password')}
                aria-pressed={showPassword}
                className={cn('absolute inset-y-0 w-12 flex items-center justify-center text-white/35 hover:text-white/70 transition-colors cursor-pointer', dir === 'rtl' ? 'left-0' : 'right-0')}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-4 bg-[#D7C826] text-[#01293b] rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>{ar ? 'دخول' : 'Sign in'}</span>
              </>
            )}
          </button>
        </form>

        <p className="mt-7 pt-5 border-t border-white/10 text-[10px] font-bold text-white/30 text-center leading-relaxed">
          {ar
            ? 'إن لم تكن من طاقم المكتبة، استخدم صفحة الدخول العامة.'
            : 'Not staff? Use the main sign-in page.'}
        </p>
      </motion.div>
    </div>
  );
}
