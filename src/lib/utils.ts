import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** The name to show for a user in the active language. */
export function displayName(user: Pick<User, 'name' | 'nameEn'>, language: string): string {
  return language === 'en' && user.nameEn ? user.nameEn : user.name;
}

export function getUserLevel(points: number): number {
  return Math.floor(points / 100) + 1;
}

// ── Activity tracking ────────────────────────────────────────────────
// Every badge below is earned by doing something in the app, never by
// merely landing on a page. Each user gets their own isolated namespace
// in localStorage.
function getCurrentUserId(): string {
  try {
    const stored = localStorage.getItem('library_user');
    if (!stored) return 'anonymous';
    return JSON.parse(stored)?.id || 'anonymous';
  } catch { return 'anonymous'; }
}

function mapKey():    string { return `map_visits_v2_${getCurrentUserId()}`; }
function loginKey():  string { return `login_count_v1_${getCurrentUserId()}`; }
function searchKey(): string { return `search_count_v1_${getCurrentUserId()}`; }
function gameKey():   string { return `cognitive_ar_v4_${getCurrentUserId()}`; }
function favKey():    string { return `favorite_books_v1_${getCurrentUserId()}`; }
function bookKey():   string { return `viewed_books_v1_${getCurrentUserId()}`; }
function borrowKey(): string { return `borrowed_books_v1_${getCurrentUserId()}`; }
// Facilities live in their own namespace on purpose: their cell codes
// (A-2, B-2, C-1, D-1) are the same strings the shelf grid uses, so sharing
// a list with the map would let a facility count as a shelf.
function facilityKey(): string { return `facility_visits_v1_${getCurrentUserId()}`; }

export function getCompletedGameLevels(): string[] {
  try { return JSON.parse(localStorage.getItem(gameKey()) || '[]'); } catch { return []; }
}

function addUnique(key: string, value: string): void {
  try {
    const current: string[] = JSON.parse(localStorage.getItem(key) || '[]');
    if (!current.includes(value)) {
      localStorage.setItem(key, JSON.stringify([...current, value]));
    }
  } catch {}
}

function readList(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

/** Called when a book's details page is opened. */
export function trackBookView(bookId: string): void { addUnique(bookKey(), bookId); }
export function getViewedBooks(): string[] { return readList(bookKey()); }

/** Called when the user asks to be guided to a facility. */
export function trackFacilityVisit(cellId: string): void { addUnique(facilityKey(), cellId); }
export function getFacilityVisits(): string[] { return readList(facilityKey()); }

/**
 * Called when the user borrows a book.
 *
 * Borrowing writes to user.borrowedBooks, but that object is replaced by the
 * server's copy on every page load (App.tsx refreshes it from /api/me) and the
 * server does not store borrows — so a badge that read only user.borrowedBooks
 * would un-earn itself as soon as the page reloaded. The action is recorded
 * here as well, in the same per-user namespace as favourites.
 */
export function trackBorrow(bookId: string): void { addUnique(borrowKey(), bookId); }
export function getTrackedBorrows(): string[] { return readList(borrowKey()); }

export function trackMapVisit(locationId: string): void {
  try {
    const current = getMapVisits();
    if (!current.includes(locationId)) {
      localStorage.setItem(mapKey(), JSON.stringify([...current, locationId]));
    }
  } catch {}
}

export function getMapVisits(): string[] {
  try { return JSON.parse(localStorage.getItem(mapKey()) || '[]'); } catch { return []; }
}

// Called once per login from App.tsx handleLogin
export function incrementLoginCount(): void {
  try {
    const n = getLoginCount() + 1;
    localStorage.setItem(loginKey(), String(n));
  } catch {}
}

export function getLoginCount(): number {
  try { return parseInt(localStorage.getItem(loginKey()) || '0', 10); } catch { return 0; }
}

function searchTermsKey(): string { return `search_terms_v1_${getCurrentUserId()}`; }

/**
 * Record a search the user actually ran.
 *
 * This used to be a counter incremented once per visit to the search page,
 * gated behind a ref — so no matter how many things you looked up, a session
 * could only ever register a single search. Distinct terms are stored instead,
 * which is both the honest measure and one a badge can be built on.
 *
 * Terms are recorded once typing settles (see Search.tsx). A term that the
 * next one merely extends ("phys" → "physics") is folded into it so a single
 * query typed in bursts is not counted twice.
 */
export function trackSearchTerm(query: string): void {
  const term = query.trim().toLowerCase().replace(/\s+/g, ' ');
  if (term.length < 2) return;
  try {
    const current: string[] = JSON.parse(localStorage.getItem(searchTermsKey()) || '[]');
    if (current.includes(term)) return;
    const next = [...current.filter(t => !term.startsWith(t)), term].slice(-20);
    localStorage.setItem(searchTermsKey(), JSON.stringify(next));
  } catch {}
}

export function getSearchTerms(): string[] { return readList(searchTermsKey()); }

/** Distinct searches run. Falls back to the old counter for existing users. */
export function getSearchCount(): number {
  let legacy = 0;
  try { legacy = parseInt(localStorage.getItem(searchKey()) || '0', 10) || 0; } catch {}
  return Math.max(legacy, getSearchTerms().length);
}

// Favorite books, stored per user in localStorage (same pattern as map visits).
// The heart control on the book page used to be inert; these back it so the
// choice actually persists across visits.
export function getFavoriteBooks(): string[] {
  try { return JSON.parse(localStorage.getItem(favKey()) || '[]'); } catch { return []; }
}

export function isFavoriteBook(bookId: string): boolean {
  return getFavoriteBooks().includes(bookId);
}

/** Toggles the book's favorite state and returns whether it is now a favorite. */
export function toggleFavoriteBook(bookId: string): boolean {
  try {
    const current = getFavoriteBooks();
    const next = current.includes(bookId)
      ? current.filter(id => id !== bookId)
      : [...current, bookId];
    localStorage.setItem(favKey(), JSON.stringify(next));
    return next.includes(bookId);
  } catch { return false; }
}

/** Distinct shelves the user has actually navigated to on the library map. */
function getShelfVisits(): string[] {
  return getMapVisits().filter(v => /^[A-Z]-\d/.test(v));
}

// ── Badges ───────────────────────────────────────────────────────────
//
// One badge per journey the app actually offers, and every requirement is a
// *deliberate action* — no badge is handed out for a page load. Each badge is
// a short checklist so its progress bar is literal ("2 of 3 steps done") and
// the user can always read what is left.
//
// XP is the reward the badges pay, so the number on a badge card and the XP
// total on the profile are the same figure counted once.

export interface BadgeStep {
  labelAr: string;
  labelEn: string;
  done: boolean;
}

export interface BadgeStatus {
  id: string;
  xp: number;
  earned: boolean;
  steps: BadgeStep[];
  /** Completed steps / total steps, for the progress bars. */
  current: number;
  target: number;
}

/** How much XP each badge pays when earned. */
export const BADGE_XP: Record<string, number> = {
  'مستكشف': 50,
  'باحث': 75,
  'دليل المرافق': 60,
  'قارئ': 65,
  'بطل التحدي': 50,
  'متميز': 100,
};

const step = (labelAr: string, labelEn: string, done: boolean): BadgeStep =>
  ({ labelAr, labelEn, done });

/**
 * The awarding rules, in one place.
 *
 * A badge is earned when every one of its steps is done. The three cognitive
 * AR game levels are shortcuts to the badge they are named after, so beating
 * the game is a genuine alternative route rather than a parallel scoreboard.
 */
export function getBadgeStatuses(user: User): BadgeStatus[] {
  const visits     = getMapVisits();
  const shelves    = getShelfVisits().length;
  const facilities = getFacilityVisits().length;
  const searches   = getSearchCount();
  const books      = getViewedBooks().length;
  const borrowed   = Math.max(user?.borrowedBooks?.length ?? 0, getTrackedBorrows().length);
  const favorites  = getFavoriteBooks().length;
  const game       = getCompletedGameLevels();

  const build = (id: string, steps: BadgeStep[], shortcut = false): BadgeStatus => {
    const done = shortcut ? steps.length : steps.filter(s => s.done).length;
    return {
      id,
      xp: BADGE_XP[id] ?? 0,
      earned: done === steps.length,
      steps: shortcut ? steps.map(s => ({ ...s, done: true })) : steps,
      current: done,
      target: steps.length,
    };
  };

  // 1 · مستكشف — يقرأ خريطة المكتبة ويصل إلى الرفوف
  const explorer = build('مستكشف', [
    step('افتح خريطة المكتبة', 'Open the library map', visits.includes('map')),
    step('حدّد موقع ٣ رفوف', 'Locate 3 shelves', shelves >= 3),
  ], game.includes('explorer'));

  // 2 · باحث — يبحث عن مصادر المكتبة ويفتحها
  const researcher = build('باحث', [
    step('ابحث عن ٣ مصادر', 'Run 3 resource searches', searches >= 3),
    step('افتح تفاصيل ٣ كتب', 'Open 3 book pages', books >= 3),
  ], game.includes('researcher'));

  // 3 · دليل المرافق — يعرف مرافق المكتبة ويصل إليها
  const guide = build('دليل المرافق', [
    step('افتح خريطة المرافق', 'Open the facilities map', visits.includes('facilities')),
    step('استدلّ على ٣ مرافق', 'Get directions to 3 facilities', facilities >= 3),
  ]);

  // 4 · قارئ — يستخدم المكتبة فعلياً: استعارة ومفضلة
  const reader = build('قارئ', [
    step('استعر كتاباً', 'Borrow a book', borrowed >= 1),
    step('أضف كتاباً إلى المفضلة', 'Add a book to favourites', favorites >= 1),
  ]);

  // 5 · بطل التحدي — يُتقن مستويات لعبة الواقع المعزز الثلاثة
  const champion = build('بطل التحدي', [
    step('أكمل مستوى المستكشف', 'Finish the Explorer level', game.includes('explorer')),
    step('أكمل مستوى الباحث', 'Finish the Researcher level', game.includes('researcher')),
    step('أكمل مستوى المتميز', 'Finish the Distinguished level', game.includes('distinguished')),
  ]);

  // 6 · متميز — وسام ختامي: يُمنح بعد اكتساب الأوسمة الخمسة
  const distinguished = build('متميز', [
    step('وسام المستكشف', 'Explorer badge', explorer.earned),
    step('وسام الباحث', 'Researcher badge', researcher.earned),
    step('وسام دليل المرافق', 'Facility Guide badge', guide.earned),
    step('وسام القارئ', 'Reader badge', reader.earned),
    step('وسام بطل التحدي', 'Challenge Champion badge', champion.earned),
  ]);

  return [explorer, researcher, guide, reader, champion, distinguished];
}

/** Single source of truth for earned badges. */
export function getEarnedBadges(user: User): string[] {
  return getBadgeStatuses(user).filter(b => b.earned).map(b => b.id);
}

/** Total XP: the sum of every badge the user has earned. */
export function calcXP(user: User): number {
  return getBadgeStatuses(user)
    .filter(b => b.earned)
    .reduce((total, b) => total + b.xp, 0);
}

/** Highest XP obtainable — every badge earned. */
export const MAX_XP = Object.values(BADGE_XP).reduce((a, b) => a + b, 0);

/**
 * How close one badge is, for the progress bars.
 *
 * This used to be drawn as `currentXP / xpRequired`, which cannot work now
 * that XP comes *from* badges — you would need the XP to earn the badge that
 * pays it. Progress is measured against the badge's own checklist instead.
 */
export function getBadgeProgress(user: User, badgeId: string): { current: number; target: number } {
  const badge = getBadgeStatuses(user).find(b => b.id === badgeId);
  return badge ? { current: badge.current, target: badge.target } : { current: 0, target: 1 };
}
