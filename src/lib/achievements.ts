/**
 * Achievement feedback: what a student just did, what it paid, and what to
 * say about it.
 *
 * The rule that keeps this honest is that the "+25 XP" in the pop-up is not a
 * number printed next to the total — it *is* the change in the total. Every
 * completion records itself, then the XP is recomputed from calcXP() and the
 * difference is what gets shown and counted up. A reward the pop-up announces
 * and the header does not show is the classic failure here, and measuring the
 * delta makes it impossible.
 *
 * Each task pays once. Finding your first book is worth celebrating; finding
 * your two-hundredth is worth a badge, not a fresh 25 XP every time, and a
 * pop-up that fires on every repeat stops being a reward and becomes a
 * nuisance to dismiss.
 */

import { calcXP, notifyXPChanged, getBadgeRequirements, getEarnedBadges, isBadgeUnlocked, BadgeId, BADGE_ORDER, badgeName } from './utils';
import { User } from '../types';

export type TaskId = 'find-book' | 'locate-book' | 'evaluate-source' | 'cite-source';

/** What each task pays the first time it is completed. */
export const TASK_XP: Record<TaskId, number> = {
  'find-book': 25,
  'locate-book': 50,
  'evaluate-source': 75,
  'cite-source': 100,
};

function userId(): string {
  try {
    const stored = localStorage.getItem('library_user');
    return stored ? (JSON.parse(stored)?.id || 'anonymous') : 'anonymous';
  } catch { return 'anonymous'; }
}

function tasksKey(): string { return `completed_tasks_v1_${userId()}`; }

export function getCompletedTasks(): string[] {
  try { return JSON.parse(localStorage.getItem(tasksKey()) || '[]'); } catch { return []; }
}

export function hasCompletedTask(id: TaskId): boolean {
  return getCompletedTasks().includes(id);
}

/** Records the task. Returns false if it had already been paid for. */
function recordTask(id: TaskId): boolean {
  try {
    const current = getCompletedTasks();
    if (current.includes(id)) return false;
    localStorage.setItem(tasksKey(), JSON.stringify([...current, id]));
    return true;
  } catch { return false; }
}

/** XP earned from one-off tasks. Folded into calcXP() as one of its sources. */
export function getTaskXP(): number {
  return getCompletedTasks()
    .reduce((total, id) => total + (TASK_XP[id as TaskId] ?? 0), 0);
}

// ── What the pop-up says ──────────────────────────────────────────────

export interface AchievementDetail {
  /** e.g. 📚 for the book, 📍 for the shelf. */
  icon: string;
  text: string;
}

export interface Achievement {
  /** 'task' is an ordinary completion; 'badge' is the big one. */
  kind: 'task' | 'badge';
  headline: string;
  /** The personal sentence — what they did well, in their language. */
  praise: string;
  /** How far from the next badge, or what the badge they just earned means. */
  nextUp: string;
  details: AchievementDetail[];
  /** The real change in total XP, measured across the completion. */
  xp: number;
  totalXp: number;
  /** 0..1 toward the badge named in `progressLabel`. */
  progress: number;
  progressLabel: string;
  badge?: BadgeId;
}

/** The badge a student is working toward: first one not yet earned. */
function nextBadge(user: User): BadgeId | null {
  const earned = getEarnedBadges(user);
  return BADGE_ORDER.find(b => !earned.includes(b)) ?? null;
}

const TASK_PRAISE: Record<TaskId, { ar: string; en: string }> = {
  'find-book': {
    ar: 'وجدت الكتاب! أنت الآن تعرف كيف تستخدم فهرس المكتبة.',
    en: 'You found the book. You now know your way around the catalogue.',
  },
  'locate-book': {
    ar: 'وصلت إلى الرف بنفسك — هذه أصعب خطوة في المكتبة، وقد تجاوزتها.',
    en: 'You reached the shelf yourself — the hardest step in any library, and you cleared it.',
  },
  'evaluate-source': {
    ar: 'تقييمك للمصادر دقيق. هذه مهارة البحث المتقدمة التي يبنيها الباحثون.',
    en: 'Your judgement of the sources was sound — the advanced research skill scholars build on.',
  },
  'cite-source': {
    ar: 'استشهادك صحيح ومنسّق. هذا ما يفصل العمل الأكاديمي عن غيره.',
    en: 'A correct, properly formatted citation — what separates academic work from everything else.',
  },
};

/**
 * Builds the achievement to show. `details` are the task's own facts (which
 * book, which shelf, how long it took) and are passed in by the caller,
 * because only the caller knows them.
 */
export function buildTaskAchievement(
  id: TaskId,
  details: AchievementDetail[],
  xp: number,
  user: User,
  language: string,
): Achievement {
  const ar = language === 'ar';
  const target = nextBadge(user);
  const progress = target ? badgeRequirementProgress(target) : 1;
  const remaining = target
    ? getBadgeRequirements(target).filter(r => !r.met).length
    : 0;

  return {
    kind: 'task',
    headline: ar ? 'مبروك!' : 'Well done!',
    praise: TASK_PRAISE[id][ar ? 'ar' : 'en'],
    // Progress toward a badge is measured in requirements, not XP — the two
    // are separate in this app, and telling a student "60 XP to Explorer"
    // would point them at a number that does not actually open anything.
    nextUp: !target
      ? (ar ? 'حصلت على الأوسمة الثلاثة كلها.' : 'You hold all three badges.')
      : remaining === 0
        ? (ar
            ? `أسئلة وسام ${target} جاهزة لك الآن!`
            : `Your ${badgeName(target, language)} questions are ready!`)
        : (ar
            ? `بقي ${remaining} ${remaining === 1 ? 'شرط' : 'شروط'} لفتح أسئلة وسام ${target}.`
            : `${remaining} more to unlock the ${badgeName(target, language)} questions.`),
    details,
    xp,
    totalXp: calcXP(),
    progress,
    progressLabel: target ? badgeName(target, language) : (ar ? 'مكتمل' : 'Complete'),
    badge: target ?? undefined,
  };
}

export function buildBadgeAchievement(badge: BadgeId, xp: number, user: User, language: string): Achievement {
  const ar = language === 'ar';
  const earned = getEarnedBadges(user);
  const after = BADGE_ORDER.find(b => b !== badge && !earned.includes(b)) ?? null;
  const name = badgeName(badge, language);

  const MEANING: Record<BadgeId, { ar: string; en: string }> = {
    'مستكشف': { ar: 'أنت الآن تعرف أين تعيش المعرفة الموثوقة.', en: 'You know where trustworthy knowledge lives.' },
    'باحث':   { ar: 'أنت الآن تبني بحثاً حقيقياً وتوثّقه.', en: 'You can build a real search and cite it.' },
    'متميز':  { ar: 'أنت الآن تحكم على المصادر كما يفعل الباحثون.', en: 'You judge sources the way researchers do.' },
  };

  return {
    kind: 'badge',
    headline: ar ? `وسام ${name}!` : `${name} badge!`,
    praise: MEANING[badge][ar ? 'ar' : 'en'],
    nextUp: after
      ? (ar ? `الوسام التالي: ${after}` : `Next up: ${badgeName(after, language)}`)
      : (ar ? 'أتممت الأوسمة الثلاثة كلها. 🏆' : 'All three badges are yours. 🏆'),
    details: [],
    xp,
    totalXp: calcXP(),
    progress: after ? badgeRequirementProgress(after) : 1,
    progressLabel: after ? badgeName(after, language) : (ar ? 'مكتمل' : 'Complete'),
    badge,
  };
}

function badgeRequirementProgress(badge: BadgeId): number {
  const reqs = getBadgeRequirements(badge);
  if (!reqs.length) return 0;
  return reqs.reduce((sum, r) => sum + r.current / r.target, 0) / reqs.length;
}

/**
 * Runs a task completion: record it, then report what it was worth.
 *
 * `sideEffects` is where the caller does whatever else the completion implies
 * (tracking a shelf visit, for instance) — it runs between the two XP reads so
 * that anything it earns is included in the reported delta.
 *
 * Returns null when the task was already complete, which is the signal not to
 * show a pop-up at all.
 */
export function completeTask(id: TaskId, sideEffects?: () => void): number | null {
  const before = calcXP();
  const isNew = recordTask(id);
  sideEffects?.();
  const after = calcXP();
  // Tell every XP display to re-read. Without this the pop-up announces
  // points the header keeps hidden until the next navigation.
  if (after !== before) notifyXPChanged();
  if (!isNew) return null;
  return after - before;
}

/** Badges newly earned since `previous`. Used to fire the big pop-up. */
export function newlyEarnedBadges(previous: string[], user: User): BadgeId[] {
  const now = getEarnedBadges(user);
  return now.filter(b => !previous.includes(b)) as BadgeId[];
}

export { isBadgeUnlocked };
