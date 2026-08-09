/**
 * One place any page can say "the student just did the thing".
 *
 * A page calls `completed('locate-book', details)` and everything else — the
 * XP delta, the pop-up, the confetti, the cue, the buzz, and the badge check
 * that follows — happens here. The alternative is each page assembling its own
 * celebration, which is how two of them end up disagreeing about what a task
 * is worth.
 *
 * Achievements queue. Reaching the shelf can complete a task *and* finish the
 * last requirement for a badge, and firing both pop-ups at once would mean one
 * silently replacing the other — so they play in order, task first.
 */

import { createContext, useCallback, useContext, useMemo, useRef, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { useLanguage } from './useLanguage';
import { getEarnedBadges, BadgeId } from '../lib/utils';
import {
  Achievement, AchievementDetail, TaskId,
  completeTask, buildTaskAchievement, buildBadgeAchievement,
} from '../lib/achievements';
import { celebrate } from '../lib/celebrate';
import { AchievementPopup } from '../components/AchievementPopup';
import { ShareSheet } from '../components/ShareSheet';
import { SharePayload, appOrigin } from '../lib/share';

interface AchievementsApi {
  /**
   * Report a completed task. Silent when the task was already done, so a
   * student re-scanning a shelf is not congratulated a second time.
   *
   * `sideEffects` runs inside the measurement, so anything else the completion
   * earns is included in the XP the pop-up reports.
   */
  completed: (id: TaskId, details?: AchievementDetail[], sideEffects?: () => void) => void;
  /** Run an action and announce any badge it caused. */
  withBadgeWatch: (action: () => void) => void;
}

const Ctx = createContext<AchievementsApi | null>(null);

export function useAchievements(): AchievementsApi {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // A page rendered outside the provider should not crash on a celebration;
    // it just does not get one.
    return { completed: () => {}, withBadgeWatch: a => a() };
  }
  return ctx;
}

interface ProviderProps {
  user: User | null;
  children: ReactNode;
}

export function AchievementsProvider({ user, children }: ProviderProps) {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [sharing, setSharing] = useState<Achievement | null>(null);
  const userRef = useRef(user);
  userRef.current = user;

  const push = useCallback((a: Achievement) => {
    setQueue(q => [...q, a]);
    celebrate(a.kind === 'badge' ? 'fanfare' : 'ding');
  }, []);

  /** Fires a badge pop-up for anything earned that was not earned before. */
  const watchBadges = useCallback((before: string[]) => {
    const u = userRef.current;
    if (!u) return;
    const after = getEarnedBadges(u);
    for (const badge of after.filter(b => !before.includes(b)) as BadgeId[]) {
      setQueue(q => [...q, buildBadgeAchievement(badge, 0, u, language)]);
      celebrate('fanfare');
    }
  }, [language]);

  const completed = useCallback<AchievementsApi['completed']>((id, details = [], sideEffects) => {
    const u = userRef.current;
    if (!u) return;
    const badgesBefore = getEarnedBadges(u);
    const gained = completeTask(id, sideEffects);
    if (gained === null) {
      // Already done. Still check for a badge, because the side effects may
      // have completed the last requirement even on a repeat visit.
      watchBadges(badgesBefore);
      return;
    }
    push(buildTaskAchievement(id, details, gained, u, language));
    watchBadges(badgesBefore);
  }, [language, push, watchBadges]);

  const withBadgeWatch = useCallback<AchievementsApi['withBadgeWatch']>(action => {
    const u = userRef.current;
    const before = u ? getEarnedBadges(u) : [];
    action();
    watchBadges(before);
  }, [watchBadges]);

  const current = queue[0] ?? null;
  const dismiss = useCallback(() => setQueue(q => q.slice(1)), []);

  const sharePayload = useMemo<SharePayload | null>(() => {
    if (!sharing) return null;
    const ar = language === 'ar';
    const url = appOrigin();
    const lines = [
      ar ? `🎉 ${sharing.headline}` : `🎉 ${sharing.headline}`,
      sharing.praise,
      ...sharing.details.map(d => `${d.icon} ${d.text}`),
      sharing.xp > 0 ? (ar ? `⭐ +${sharing.xp} نقطة (${sharing.totalXp} الإجمالي)` : `⭐ +${sharing.xp} XP (${sharing.totalXp} total)`) : '',
      '',
      ar ? 'على المكتبة المعززة الذكية:' : 'On the Smart AR Library:',
      url,
    ].filter(Boolean);
    return {
      subject: ar ? 'إنجاز في المكتبة المعززة الذكية' : 'An achievement on the Smart AR Library',
      message: lines.join('\n'),
      url,
    };
  }, [sharing, language]);

  const api = useMemo<AchievementsApi>(
    () => ({ completed, withBadgeWatch }),
    [completed, withBadgeWatch],
  );

  return (
    <Ctx.Provider value={api}>
      {children}

      <AchievementPopup
        achievement={current}
        onClose={dismiss}
        onShare={a => { setSharing(a); dismiss(); }}
        // "Next" points at the thing the student should do now: the badge's
        // questions when a badge is in reach, the profile when it is not.
        onNext={a => {
          dismiss();
          navigate(a.kind === 'badge' ? '/profile' : '/cognitive-ar');
        }}
        nextLabel={current?.kind === 'badge' ? t('viewProfile') : t('continueLabel')}
      />

      {sharing && sharePayload && (
        <ShareSheet
          open
          onClose={() => setSharing(null)}
          title={sharing.headline}
          payload={sharePayload}
        />
      )}
    </Ctx.Provider>
  );
}
