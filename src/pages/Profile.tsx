import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, Flame, Timer, Trophy, BookMarked,
  TrendingUp, Mail, BookOpen, Gamepad2, MapPin,
  Search as SearchIcon, ChevronRight,
  Bell, AlertTriangle, Info, CheckCircle2, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import {
  cn, getEarnedBadges, getGameXP, getCompletedGameLevels,
  getLoginCount, getSearchCount, getMapVisits, displayName } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';
import { useXP } from '../hooks/useXP';
import { BadgesCabinet } from '../components/BadgesCabinet';
import { ShareInvite } from '../components/ShareInvite';
import { useNotifications } from '../hooks/useNotifications';

interface ProfileProps { user: User }

// ── XP source breakdown ───────────────────────────────────────────────────────
function useXpBreakdown() {
  const visits    = getMapVisits();
  const mapXp     = visits.includes('map') ? 20 : 0;
  const placeCount = visits.filter(v => /^[A-Z]-\d/.test(v) || v === 'facilities').length;
  const shelvesXp = placeCount * 15;
  const loginXp   = Math.min(getLoginCount(), 5) * 10;
  const searchXp  = Math.min(getSearchCount(), 5) * 10;
  const gameXp    = getGameXP();
  const gameLevels = getCompletedGameLevels().length;
  return { mapXp, shelvesXp, loginXp, searchXp, placeCount, gameXp, gameLevels };
}

/** "1 round" / "جولة واحدة" — Arabic has a dual form, so spell all three out.
    The challenge calls them rounds on its own start button, and they are not
    the user levels that used to be shown elsewhere on this page. */
function levelsLabel(n: number, ar: boolean): string {
  if (ar) return n === 0 ? 'لا جولات' : n === 1 ? 'جولة واحدة' : n === 2 ? 'جولتان' : `${n} جولات`;
  return `${n} round${n === 1 ? '' : 's'}`;
}

export function Profile({ user }: ProfileProps) {
  const navigate  = useNavigate();
  const { language, dir } = useLanguage();
  const ar        = language === 'ar';

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user);

  const xp           = useXP();
  const xpInLevel    = xp % 100;
  const xpToNext     = 100 - xpInLevel;
  const earnedBadges = getEarnedBadges(user);
  const loginCount   = getLoginCount();
  const bookCount    = user.borrowedBooks.length;
  const { mapXp, shelvesXp, loginXp, searchXp, placeCount, gameXp, gameLevels } = useXpBreakdown();

  // ── Lock conditions ────────────────────────────────────────────────────────
  const hoursLocked  = bookCount === 0;
  const streakLocked = loginCount < 2;
  const badgesLocked = earnedBadges.length === 0;
  const xpZero       = xp === 0;

  const statsData = [
    {
      id: 'books',
      icon: BookMarked,
      labelAr: 'كتب مستعارة',
      labelEn: 'Borrowed Books',
      value: bookCount,
      locked: false,
      hintAr: '',
      hintEn: '',
    },
    {
      id: 'hours',
      icon: Timer,
      labelAr: 'ساعات القراءة',
      labelEn: 'Reading Hours',
      value: bookCount * 3,
      locked: hoursLocked,
      hintAr: 'استعر كتاباً لفتح هذه الإحصائية',
      hintEn: 'Borrow a book to unlock',
    },
    {
      id: 'streak',
      icon: Flame,
      labelAr: 'جلسات الدخول',
      labelEn: 'Login Sessions',
      value: loginCount,
      locked: streakLocked,
      hintAr: 'سجّل دخولك مرتين لفتح هذه الإحصائية',
      hintEn: 'Log in twice to unlock',
    },
    {
      id: 'badges',
      icon: Trophy,
      labelAr: 'أوسمة مكتسبة',
      labelEn: 'Badges Earned',
      value: earnedBadges.length,
      locked: badgesLocked,
      hintAr: 'اكسب XP والعب لفتح الأوسمة',
      hintEn: 'Earn XP & play to unlock',
    },
  ];

  const xpSources = [
    { icon: MapPin,       labelAr: 'خريطة المكتبة',  labelEn: 'Library Map',   earned: mapXp,     max: 20,   detail: ar ? 'مرة واحدة'  : 'once'       },
    { icon: BookOpen,     labelAr: 'زيارة الرفوف',   labelEn: 'Shelf Visits',  earned: shelvesXp, max: null,  detail: ar ? `${placeCount} رف` : `${placeCount} shelves` },
    { icon: Flame,        labelAr: 'تسجيل الدخول',  labelEn: 'Login Sessions', earned: loginXp,   max: 50,   detail: ar ? 'بحد أقصى ٥' : 'cap 5'       },
    { icon: SearchIcon,   labelAr: 'البحث الذكي',    labelEn: 'Smart Search',  earned: searchXp,  max: 50,   detail: ar ? 'بحد أقصى ٥' : 'cap 5'       },
    { icon: Gamepad2,     labelAr: 'تحدي الواقع المعزز', labelEn: 'AR Challenge', earned: gameXp,  max: 225,  detail: levelsLabel(gameLevels, ar) },
  ];

  return (
    <div dir={dir} className="space-y-8 max-w-3xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2rem] bg-primary p-6 sm:p-8 md:p-10">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* avatar */}
          <div className="w-20 h-20 rounded-2xl bg-white/15 border-2 border-white/20 flex items-center justify-center shrink-0 shadow-xl">
            <span className="text-3xl font-black text-white uppercase">{displayName(user, language).charAt(0)}</span>
          </div>

          {/* identity */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-white leading-tight">{displayName(user, language)}</h1>
            <div className={cn('flex items-center gap-2 mt-1.5 flex-wrap', ar ? 'flex-row-reverse justify-end' : '')}>
              <span className="flex items-center gap-1 text-[10px] text-white/50 font-bold truncate max-w-[200px]">
                <Mail className="w-3 h-3 shrink-0" />{user.email}
              </span>
            </div>
            {/* mini XP bar in hero */}
            <div className="mt-3 space-y-1">
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpInLevel}%` }}
                  transition={{ duration: 1.4, ease: 'easeOut' }}
                  className="h-full bg-accent rounded-full"
                />
              </div>
              {/* Two spans, the numeric one forced LTR — same shape as the
                  caption under the big progress bar below. As one string this
                  reached the screen as "التالي للمستوى XP — 90 10": bidi pulled
                  the 10 and the 90 together and stranded the XP label. */}
              <p className="flex items-center gap-1.5 text-[10px] font-black text-white/40 uppercase tracking-widest">
                <span dir="ltr">{xp} XP</span>
                <span>—</span>
                <span dir="ltr">{xpToNext} XP</span>
                <span>{ar ? 'للنقطة التالية' : 'to go'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── XP breakdown ─────────────────────────────────────────────────────── */}
      <div className="official-card p-5 sm:p-8 bg-white dark:bg-slate-900 space-y-6">
        <div className={cn('flex items-center justify-between', ar ? 'flex-row-reverse' : '')}>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {ar ? 'نقاط الخبرة الشخصية' : 'Personal XP'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl font-black text-primary dark:text-white">{xp}</span>
              <span className="text-slate-300 dark:text-slate-600 font-black text-sm uppercase">XP</span>
            </div>
          </div>
          <TrendingUp className="w-5 h-5 text-accent" />
        </div>

        {/* points progress bar */}
        <div className="space-y-2">
          <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpInLevel}%` }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              className="h-full bg-accent rounded-full shadow-[0_0_12px_rgba(217,179,16,0.4)]"
            />
          </div>
          <div className={cn('flex items-center justify-between text-[10px] font-black text-slate-400', ar ? 'flex-row-reverse' : '')}>
            <span dir="ltr">{xp} XP</span>
            <span className="flex items-center gap-1">
              <span dir="ltr">{xpToNext} XP</span>
              <span>{ar ? 'للنقطة التالية' : 'to go'}</span>
            </span>
          </div>
        </div>

        {/* XP source breakdown */}
        <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            {ar ? 'مصادر الخبرة' : 'XP Sources'}
          </p>
          {xpSources.map(({ icon: Icon, labelAr, labelEn, earned, max, detail }, i) => (
            <div key={i} className={cn('flex items-center gap-3', ar ? 'flex-row-reverse' : '')}>
              <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-primary dark:text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn('flex items-center justify-between gap-2', ar ? 'flex-row-reverse' : '')}>
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">
                    {ar ? labelAr : labelEn}
                  </span>
                  {/* dir=ltr: the leading + is neutral, so Arabic laid these
                      out as "XP 10 +" with the sign on the far side. */}
                  <span dir="ltr" className={cn('text-[11px] font-black shrink-0', earned > 0 ? 'text-accent' : 'text-slate-300 dark:text-slate-600')}>
                    +{earned} XP
                  </span>
                </div>
                <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-800 mt-1 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: max ? `${Math.min((earned / max) * 100, 100)}%` : earned > 0 ? '100%' : '0%' }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: i * 0.1 }}
                    className="h-full bg-accent rounded-full"
                  />
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 shrink-0 min-w-[44px] text-end">{detail}</span>
            </div>
          ))}
        </div>

        {/* motivational CTA when XP = 0 */}
        <AnimatePresence>
          {xpZero && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-4 rounded-2xl bg-accent/8 border border-accent/20 text-center"
            >
              <p className="text-[11px] font-bold text-primary dark:text-accent leading-relaxed">
                {ar
                  ? '🗺️ افتح خريطة المكتبة لتبدأ رحلتك وتكسب أول نقاطك!'
                  : '🗺️ Open the library map to start your journey and earn your first XP!'}
              </p>
              <button
                onClick={() => navigate('/map')}
                className="mt-3 px-5 py-3.5 bg-primary dark:bg-accent text-white dark:text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all"
              >
                {ar ? 'اذهب للخريطة' : 'Open Map'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Stats grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statsData.map(({ id, icon: Icon, labelAr, labelEn, value, locked, hintAr, hintEn }, i) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={cn(
              'official-card p-5 flex flex-col items-center text-center gap-2.5 relative overflow-hidden min-h-[110px]',
              locked ? 'bg-slate-50 dark:bg-slate-900/40' : 'bg-white dark:bg-slate-900',
            )}
          >
            {/* icon */}
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              locked ? 'bg-slate-100 dark:bg-slate-800' : 'bg-primary/10 dark:bg-accent/10',
            )}>
              {locked
                ? <Lock className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                : <Icon className="w-4 h-4 text-primary dark:text-accent" />
              }
            </div>

            {/* value */}
            <div className={cn(
              'text-2xl font-black',
              locked ? 'blur-sm select-none text-slate-300 dark:text-slate-700' : 'text-primary dark:text-white',
            )}>
              {locked ? '??' : value}
            </div>

            {/* label */}
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">
              {ar ? labelAr : labelEn}
            </div>

            {/* How to unlock. In normal flow, not an absolute overlay pinned to
                the card's bottom edge — as an overlay it was drawn straight on
                top of the label whenever the hint needed a second line. */}
            {locked && (hintAr || hintEn) && (
              <p className="text-[10px] font-bold text-slate-400 text-center leading-snug">
                {ar ? hintAr : hintEn}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* ── Badges & achievements ────────────────────────────────────────────── */}
      <div className="official-card p-5 sm:p-8 bg-white dark:bg-slate-900 space-y-6 relative overflow-hidden">
        <div className={cn('flex items-center justify-between', ar ? 'flex-row-reverse' : '')}>
          <div>
            <h3 className="text-lg font-black text-primary dark:text-white">
              {ar ? 'الأوسمة والإنجازات' : 'Badges & Achievements'}
            </h3>
            <div className="w-8 h-[3px] bg-accent rounded-full mt-1.5" />
          </div>
          <span className={cn(
            'text-[10px] font-black px-3 py-1 rounded-xl',
            earnedBadges.length === 3
              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
              : 'bg-accent/10 text-accent',
          )}>
            {earnedBadges.length === 3 && '🏆 '}{earnedBadges.length}/3 {ar ? 'مكتسب' : 'earned'}
          </span>
        </div>

        <BadgesCabinet user={user} />

        {/* locked section CTA — only when no badges yet */}
        <AnimatePresence>
          {badgesLocked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn('flex flex-col sm:flex-row items-center gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5', ar ? 'flex-row-reverse text-right' : '')}
            >
              <Lock className="w-6 h-6 text-slate-300 dark:text-slate-600 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-black text-primary dark:text-white">
                  {ar ? 'الأوسمة مقفلة' : 'Badges Locked'}
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  {ar
                    ? 'اكسب نقاط XP من الخريطة والبحث، ثم العب اللعبة لفتح الأوسمة'
                    : 'Earn XP from the map and search, then play the game to unlock badges'}
                </p>
              </div>
              <button
                onClick={() => navigate('/cognitive-ar')}
                className={cn('flex items-center gap-2 px-4 py-3.5 rounded-xl bg-primary dark:bg-accent text-white dark:text-primary text-[10px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all shrink-0', ar ? 'flex-row-reverse' : '')}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                {ar ? 'العب الآن' : 'Play Now'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Invite a classmate ───────────────────────────────────────────────
          Placed straight after the badges: this is the point in the page where
          the student has just read their own progress, which is exactly what
          the invitation carries. */}
      <ShareInvite user={user} />

      {/* ── Notifications ───────────────────────────────────────────────────── */}
      <div className="official-card p-5 sm:p-8 bg-white dark:bg-slate-900 space-y-5">
        {/* header */}
        <div className={cn('flex items-center justify-between', ar ? 'flex-row-reverse' : '')}>
          <div className={cn('flex items-center gap-3', ar ? 'flex-row-reverse' : '')}>
            <div className="relative">
              <Bell className="w-5 h-5 text-primary dark:text-accent" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <h3 className="text-lg font-black text-primary dark:text-white">
              {ar ? 'الإشعارات' : 'Notifications'}
            </h3>
            {unreadCount > 0 && (
              <span className="text-[9px] font-black bg-red-50 dark:bg-red-900/20 text-red-500 px-2 py-0.5 rounded-lg">
                {unreadCount} {ar ? 'جديد' : 'new'}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className={cn('flex items-center gap-1.5 text-[10px] font-black text-accent uppercase tracking-widest hover:opacity-70 transition-opacity', ar ? 'flex-row-reverse' : '')}
            >
              <Check className="w-3 h-3" />
              {ar ? 'تعيين الكل مقروءاً' : 'Mark all read'}
            </button>
          )}
        </div>

        {/* list */}
        {notifications.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6 text-slate-200 dark:text-slate-600" />
            </div>
            <p className="text-xs font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
              {ar ? 'لا توجد إشعارات' : 'No notifications'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  markAsRead(notif.id);
                  if (notif.link) navigate(notif.link);
                }}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group',
                  ar ? 'flex-row-reverse' : '',
                  notif.isRead
                    ? 'bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-white/5 hover:bg-slate-100/60 dark:hover:bg-slate-800/40'
                    : 'bg-white dark:bg-slate-900 border-accent/20 shadow-sm hover:border-accent/40',
                )}
              >
                {/* type icon */}
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  notif.type === 'alert'   ? 'bg-red-100 dark:bg-red-900/20 text-red-500'
                  : notif.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-500'
                  : 'bg-blue-100 dark:bg-blue-900/20 text-blue-500',
                )}>
                  {notif.type === 'alert' || notif.type === 'warning'
                    ? <AlertTriangle className="w-4.5 h-4.5" />
                    : <Info className="w-4.5 h-4.5" />
                  }
                </div>

                {/* content */}
                <div className={cn('flex-1 min-w-0', ar ? 'text-right' : '')}>
                  <div className={cn('flex items-start justify-between gap-2', ar ? 'flex-row-reverse' : '')}>
                    <p className="text-xs font-black text-primary dark:text-white leading-snug">
                      {notif.title}
                    </p>
                    <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 shrink-0 whitespace-nowrap">
                      {ar ? 'منذ قليل' : 'just now'}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {notif.message}
                  </p>
                  {notif.link && (
                    <span className={cn('inline-flex items-center gap-1 mt-1.5 text-[9px] font-black text-accent uppercase tracking-widest', ar ? 'flex-row-reverse' : '')}>
                      {ar ? 'عرض التفاصيل ←' : '→ View details'}
                    </span>
                  )}
                </div>

                {/* unread dot OR read check */}
                <div className="shrink-0 mt-1">
                  {notif.isRead
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-slate-200 dark:text-slate-700" />
                    : <span className="w-2.5 h-2.5 rounded-full bg-accent block" />
                  }
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Borrowed books quick-link ────────────────────────────────────────── */}
      <button
        onClick={() => navigate('/my-books')}
        className={cn(
          'w-full official-card p-5 bg-white dark:bg-slate-900 flex items-center gap-4 hover:border-accent hover:shadow-md transition-all group',
          ar ? 'flex-row-reverse' : '',
        )}
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
          <BookOpen className="w-4 h-4 text-primary dark:text-accent" />
        </div>
        <div className={cn('flex-1 text-start', ar ? 'text-right' : '')}>
          <p className="text-sm font-black text-primary dark:text-white">
            {ar ? 'الكتب المستعارة' : 'Borrowed Books'}
          </p>
          <p className="text-[10px] font-bold text-slate-400">
            {ar ? `${bookCount} كتاب حالياً` : `${bookCount} books currently`}
          </p>
        </div>
        <ChevronRight className={cn('w-4 h-4 text-slate-300 group-hover:text-primary dark:group-hover:text-accent transition-colors shrink-0', ar ? 'rotate-180' : '')} />
      </button>

    </div>
  );
}
