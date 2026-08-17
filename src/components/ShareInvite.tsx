/**
 * Invite a classmate to the library app.
 *
 * This is the app's social-influence surface: the lever that spreads use is a
 * student telling another student, so the invitation is sent by the student,
 * from their own account, carrying their own progress. A bare "try this app"
 * link is an advert; "I've earned 2 of 3 badges and 145 points, come and
 * catch up" is a peer recommendation, and that is the thing that actually
 * moves someone to open it.
 *
 * WhatsApp and email are the two channels asked for. Both are plain links —
 * wa.me and mailto: — so nothing is sent from the app itself, no address book
 * is read, and no contact ever reaches our server. The student writes and
 * sends in their own client, which is also why nothing here needs a consent
 * dialog: we hand over a pre-filled draft and they decide.
 */

import { useState } from 'react';
import { Share2, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from '../types';
import { getEarnedBadges, badgeName } from '../lib/utils';
import { useXP } from '../hooks/useXP';
import { useLanguage } from '../hooks/useLanguage';
import { SharePayload, appOrigin, canNativeShare, openNativeShare } from '../lib/share';
import { ShareChannels } from './ShareChannels';

interface ShareInviteProps {
  user: User;
  /** 'card' is the full panel; 'row' is a compact strip of the three buttons. */
  variant?: 'card' | 'row';
}

export function ShareInvite({ user, variant = 'card' }: ShareInviteProps) {
  const { t, language } = useLanguage();
  const ar = language === 'ar';
  const [copied, setCopied] = useState(false);

  const badges = getEarnedBadges(user);
  const xp = useXP();

  // The invitation link is the app's own origin, so it works wherever this is
  // deployed rather than pointing at a hardcoded host.
  const url = appOrigin();

  /**
   * The student's progress, only when there is progress to report. Zero
   * badges and zero points is not social proof — it reads as an empty boast —
   * so a new account sends the plain invitation instead.
   */
  const proof = (() => {
    if (!badges.length && xp <= 0) return '';
    const parts: string[] = [];
    if (badges.length) {
      // The badge IDs are Arabic. Sent untranslated they left the English
      // invitation reading "I've earned 2 of 3 badges (مستكشف, باحث)".
      const named = badges.map(bid => badgeName(bid, language));
      parts.push(ar
        // Western digits on both sides of "من": the count is interpolated as
        // one, and "2 من ٣" mixes two numeral systems in a single phrase.
        ? `حصلت على ${badges.length} من 3 أوسمة (${named.join('، ')})`
        : `I've earned ${badges.length} of 3 badges (${named.join(', ')})`);
    }
    if (xp > 0) {
      parts.push(ar ? `و${xp} نقطة معرفة` : `and ${xp} knowledge points`);
    }
    return parts.join(' ');
  })();

  const message = [
    ar
      ? `${user.name} يدعوك لتجربة المكتبة المعززة الذكية 📚`
      : `${user.name} is inviting you to try the Smart AR Library 📚`,
    proof
      ? (ar ? `${proof} — جرّبها وشوف إذا تقدر تلحقني!` : `${proof} — see if you can catch up!`)
      : (ar
          ? 'ابحث عن الكتب، اتبع الخريطة للرف، وامسح الرفوف بالواقع المعزز.'
          : 'Search the catalogue, follow the map to the shelf, and scan shelves in AR.'),
    '',
    url,
  ].filter(Boolean).join('\n');

  const payload: SharePayload = {
    subject: ar ? 'جرّب المكتبة المعززة الذكية' : 'Try the Smart AR Library',
    message,
    url,
  };

  const channels = (
    <ShareChannels
      payload={payload}
      layout={variant === 'card' ? 'stack' : 'compact'}
      copyLabel={t('shareCopyInvite')}
      onCopied={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
    />
  );

  if (variant === 'row') return channels;

  return (
    <div className="glass-panel p-5 sm:p-6 bg-white/60 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-2xl bg-secondary/10 dark:bg-secondary/20 shrink-0">
          <UserPlus className="w-5 h-5 text-secondary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-black text-primary dark:text-white leading-tight">
            {t('inviteTitle')}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1 leading-relaxed">
            {t('inviteSubtitle')}
          </p>
        </div>
        {/* The OS share sheet, where the device offers one. It reaches
            channels we do not list, so it sits beside them rather than
            replacing them — on a desktop browser it simply is not there. */}
        {canNativeShare() && (
          <button
            onClick={() => openNativeShare(payload)}
            title={t('shareMore')}
            className="w-11 h-11 shrink-0 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-secondary active:scale-90 transition-all"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* What the classmate will actually receive. Shown, not hidden behind
          the button, because a student is about to send this under their own
          name and should be able to read it first. */}
      <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 p-3.5">
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium whitespace-pre-line break-words">
          {message}
        </p>
      </div>

      {channels}

      <AnimatePresence>
        {copied && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 text-center"
          >
            {t('inviteCopiedHint')}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
