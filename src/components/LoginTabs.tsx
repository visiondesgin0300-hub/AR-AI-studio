import { useNavigate } from 'react-router-dom';
import { GraduationCap, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';

/**
 * Switches between the two sign-in pages.
 *
 * This is navigation, not a role picker. The control that used to sit on the
 * login form let you *choose* to be an admin and was honoured at sign-in;
 * these tabs only move you between /login and /admin-login. Which door you
 * knock on changes nothing about what the server will accept — the role still
 * comes back with the credentials.
 */
export function LoginTabs({ active, variant = 'light' }: {
  active: 'student' | 'admin';
  variant?: 'light' | 'dark';
}) {
  const { language, dir } = useLanguage();
  const navigate = useNavigate();
  const ar = language === 'ar';
  const dark = variant === 'dark';

  const tabs = [
    { id: 'student' as const, to: '/login', icon: GraduationCap, label: ar ? 'طالب' : 'Student' },
    { id: 'admin' as const, to: '/admin-login', icon: ShieldCheck, label: ar ? 'الإدارة' : 'Admin' },
  ];

  return (
    <div
      role="tablist"
      aria-label={ar ? 'نوع الدخول' : 'Sign-in type'}
      className={cn(
        'grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl mb-7',
        dark ? 'bg-white/[0.06] border border-white/10' : 'bg-slate-100 dark:bg-slate-800/60',
        dir === 'rtl' ? 'flex-row-reverse' : ''
      )}
    >
      {tabs.map(tab => {
        const isActive = tab.id === active;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => { if (!isActive) navigate(tab.to); }}
            className={cn(
              'py-3 px-3 rounded-xl text-xs font-black uppercase tracking-widest',
              'flex items-center justify-center gap-2 transition-all cursor-pointer',
              isActive
                ? dark
                  ? 'bg-[#D7C826] text-[#01293b] shadow-lg'
                  : 'bg-white dark:bg-slate-900 text-[#004C6D] dark:text-[#D7C826] shadow-md shadow-black/[0.05]'
                : dark
                  ? 'text-white/45 hover:text-white/75'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
