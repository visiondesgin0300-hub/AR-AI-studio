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

/**
 * The title/author to show for a book in the active language.
 *
 * Every book in the catalogue carries an English title and author alongside
 * the Arabic ones; the app simply never reached for them, so an English
 * reader saw Arabic titles throughout. Mirrors displayName() for users.
 */
export function bookTitle(book: { title: string; titleEn?: string }, language: string): string {
  return language === 'en' && book.titleEn ? book.titleEn : book.title;
}

/**
 * The other title — the one bookTitle() did not pick.
 *
 * The book record shows both, the active language in the heading and the other
 * underneath it, so the pair swaps places when the language does. Empty when
 * the book carries only one title, which is what keeps the second line from
 * repeating the first.
 */
export function bookTitleAlt(book: { title: string; titleEn?: string }, language: string): string {
  if (!book.titleEn || book.titleEn === book.title) return '';
  return language === 'en' ? book.title : book.titleEn;
}

export function bookAuthor(book: { author: string; authorEn?: string }, language: string): string {
  return language === 'en' && book.authorEn ? book.authorEn : book.author;
}

export function bookDescription(book: { description?: string; descriptionEn?: string }, language: string): string {
  return (language === 'en' && book.descriptionEn ? book.descriptionEn : book.description) ?? '';
}

/**
 * Category names are stored in Arabic on every book, so anywhere that printed
 * book.category raw showed "فيزياء" to an English reader. Search had its own
 * local copy of this map; keeping one here stops the next page that needs it
 * from growing a third.
 */
const CATEGORY_EN: Record<string, string> = {
  'all': 'All',
  'فيزياء': 'Physics',
  'هندسة': 'Engineering',
  'عام': 'General',
  'علم نفس': 'Psychology',
  'طب': 'Medicine',
  'أدب': 'Literature',
};

export function bookCategory(category: string | undefined, language: string): string {
  if (!category) return '';
  return language === 'en' ? (CATEGORY_EN[category] ?? category) : category;
}

export function getUserLevel(points: number): number {
  return Math.floor(points / 100) + 1;
}

// ── Map & shelf navigation tracking ──────────────────────────────────
// مستكشف: opened map ≥ 1 time
// باحث:   navigated to ≥ 3 different shelves/places
// متميز:  visited all sections A/B/C/D AND has both previous badges

// Each user gets their own isolated XP/badge namespace in localStorage.
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
function resKey():    string { return `reserved_books_v1_${getCurrentUserId()}`; }

/**
 * Books this account has reserved.
 *
 * They are kept here as well as on the user object because the app re-reads
 * the account from /api/me on every load and adopts whatever the server
 * returns; the server holds no reservations, so a reservation made in the
 * browser vanished on the next refresh. This is the copy that survives.
 */
export function getReservedBooks(): string[] {
  try { return JSON.parse(localStorage.getItem(resKey()) || '[]'); } catch { return []; }
}

/** Records a reservation, and returns the full list including it. */
export function addReservedBook(bookId: string): string[] {
  const list = getReservedBooks();
  if (!list.includes(bookId)) list.push(bookId);
  try { localStorage.setItem(resKey(), JSON.stringify(list)); } catch { /* full or private */ }
  return list;
}

export function getCompletedGameLevels(): string[] {
  try { return JSON.parse(localStorage.getItem(gameKey()) || '[]'); } catch { return []; }
}

/**
 * XP paid for finishing each cognitive AR level. Single source of truth:
 * CognitiveARGame builds its level cards from this, and calcXP() adds it to
 * the app-wide total, so the "+50 XP" a card promises is the same 50 XP the
 * header and the profile then show.
 */
export const GAME_LEVEL_XP: Record<string, number> = {
  explorer: 50,
  researcher: 75,
  distinguished: 100,
};

/** XP earned from the cognitive AR game so far. */
export function getGameXP(): number {
  return getCompletedGameLevels()
    .reduce((total, id) => total + (GAME_LEVEL_XP[id] ?? 0), 0);
}

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

// Called once per search page visit from Search.tsx
export function incrementSearchCount(): void {
  try {
    const n = getSearchCount() + 1;
    localStorage.setItem(searchKey(), String(n));
  } catch {}
}

export function getSearchCount(): number {
  try { return parseInt(localStorage.getItem(searchKey()) || '0', 10); } catch { return 0; }
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

// ── Activity tags ─────────────────────────────────────────────────────
// A per-user set of things the student has actually done: which map views
// they used, which AR features they opened, whether they scanned anything.
// Map visits and the login/search counters already existed; these are the
// signals the badge requirements needed that nothing was recording yet.
function actKey(): string { return `activity_tags_v1_${getCurrentUserId()}`; }

export function getActivityTags(): string[] {
  try { return JSON.parse(localStorage.getItem(actKey()) || '[]'); } catch { return []; }
}

function trackActivity(tag: string): void {
  try {
    const current = getActivityTags();
    if (!current.includes(tag)) {
      localStorage.setItem(actKey(), JSON.stringify([...current, tag]));
    }
  } catch {}
}

/** The library map was viewed in this mode. The 2D plan is gone; both
    remaining modes are 3D, and the activity log keeps its existing value so
    entries recorded before the plan was removed still read the same. */
export function trackMapMode(_mode: 'unity' | 'ar-floor'): void {
  trackActivity('map-3d');
}

/** An augmented-reality feature was opened. Counted once per feature. */
export function trackArUse(featureId: string): void {
  trackActivity(`ar:${featureId}`);
}

/** The scanning camera was opened (shelf marker or book cover). */
export function trackScanUse(): void {
  trackActivity('scan');
}

function countArFeatures(): number {
  return getActivityTags().filter(t => t.startsWith('ar:')).length;
}

// Shelf/place navigations = visits whose ID matches a shelf pattern or 'facilities'
function getPlaceCount(): number {
  return getMapVisits().filter(v => /^[A-Z]-\d/.test(v) || v === 'facilities').length;
}

/** Distinct shelves the student has navigated to, excluding whole-map opens. */
function getShelfCount(): number {
  return getMapVisits().filter(v => /^[A-Z]-\d/.test(v)).length;
}

// XP for display: map open=20, each place/shelf=15, login 10/session (cap 5),
// search 10/visit (cap 5), the one-off achievement tasks, plus whatever the
// cognitive AR levels have paid. The game used to keep its own XP tally on its
// own page only, so a level card promising "+50 XP" left the header and the
// profile unchanged.
//
// This is the single total. The achievement pop-up does not carry its own
// number — it measures the change in this one across a completion, so what it
// announces is by construction what the header then shows.
export function calcXP(): number {
  const visits = getMapVisits();
  let xp = 0;
  if (visits.includes('map')) xp += 20;
  xp += getPlaceCount() * 15;
  xp += Math.min(getLoginCount(), 5) * 10;
  xp += Math.min(getSearchCount(), 5) * 10;
  xp += getTaskXP();
  xp += getGameXP();
  return xp;
}

/**
 * Fired whenever something changes the XP total. Displays subscribe through
 * useXP() — without it a screen keeps rendering whatever calcXP() returned
 * when it last rendered, which for the achievement pop-up meant announcing
 * points the header would not show until the next navigation.
 */
export const XP_CHANGED_EVENT = 'library:xp-changed';

export function notifyXPChanged(): void {
  try { window.dispatchEvent(new Event(XP_CHANGED_EVENT)); } catch { /* SSR */ }
}

/** Task XP, read here to keep calcXP the one place the total is assembled. */
function getTaskXP(): number {
  const TASK_XP: Record<string, number> = {
    'find-book': 25, 'locate-book': 50, 'evaluate-source': 75, 'cite-source': 100,
  };
  try {
    const raw = localStorage.getItem(`completed_tasks_v1_${getCurrentUserId()}`);
    return (JSON.parse(raw || '[]') as string[])
      .reduce((total, id) => total + (TASK_XP[id] ?? 0), 0);
  } catch { return 0; }
}

// ── Badges ────────────────────────────────────────────────────────────
//
// A badge is earned in two stages, not one.
//
//   1. Use the library. Each badge lists the activity it stands for, and the
//      student has to actually do it — open the app, search the catalogue and
//      the facilities, walk the shelves, use the 2D/3D map, use AR, scan.
//   2. Answer the questions. Finishing the activity unlocks that badge's round
//      in the Information Literacy Challenge; passing the round earns it.
//
// Activity alone used to be enough — the badge was granted by map navigation
// OR by the quiz, whichever came first, so the quiz was optional and a student
// could collect all three without answering a single question. Now the
// activity opens the door and the questions decide.
//
// These definitions are the only place the rules exist. The badges cabinet
// draws its checklist from them and the game gates its levels on them, so the
// requirement a student reads is by construction the requirement being tested.

export type BadgeId = 'مستكشف' | 'باحث' | 'متميز';

/** Badge ↔ the quiz level that awards it. */
export const BADGE_GAME_LEVEL: Record<BadgeId, string> = {
  'مستكشف': 'explorer',
  'باحث': 'researcher',
  'متميز': 'distinguished',
};

export const BADGE_ORDER: BadgeId[] = ['مستكشف', 'باحث', 'متميز'];

/** Badge names for display. The IDs are Arabic, so English needs a mapping. */
const BADGE_NAME_EN: Record<BadgeId, string> = {
  'مستكشف': 'Explorer',
  'باحث': 'Researcher',
  'متميز': 'Distinguished',
};

export function badgeName(badge: string, language: string): string {
  return language === 'en' ? (BADGE_NAME_EN[badge as BadgeId] ?? badge) : badge;
}

export interface BadgeRequirement {
  id: string;
  labelAr: string;
  labelEn: string;
  /** How far along, and how far there is to go. Both count the same unit. */
  current: number;
  target: number;
  met: boolean;
}

function req(
  id: string, labelAr: string, labelEn: string, current: number, target: number,
): BadgeRequirement {
  return { id, labelAr, labelEn, current: Math.min(current, target), target, met: current >= target };
}

/**
 * What each badge asks for, with live progress. Order matters: the list is
 * rendered in this order wherever it is shown.
 */
export function getBadgeRequirements(badge: BadgeId): BadgeRequirement[] {
  const logins   = getLoginCount();
  const searches = getSearchCount();
  const visits   = getMapVisits();
  const tags     = getActivityTags();
  const completed = getCompletedGameLevels();

  switch (badge) {
    // مستكشف — فتح التطبيق والبحث عن المصادر والمرافق
    case 'مستكشف':
      return [
        req('open-app',   'افتح التطبيق',              'Open the app',                  logins, 1),
        req('search',     'ابحث عن مصادر المكتبة',      'Search the library resources',  searches, 1),
        req('facilities', 'استكشف مرافق المكتبة',       'Explore the library facilities', visits.includes('facilities') ? 1 : 0, 1),
      ];

    // باحث — زيارة دائمة للبحث بين الرفوف واستخدام خريطة المكتبة
    case 'باحث':
      return [
        req('visits',  'زُر المكتبة في ٣ جلسات',                     'Visit the library in 3 sessions',      logins, 3),
        req('shelves', 'ابحث عن المصادر بين ٣ رفوف',                 'Search 3 shelves for resources',       getShelfCount(), 3),
        // The flat plan and its toggle are gone; the requirement still accepts
        // either tag, because accounts earned before the change carry 'map-2d'.
        req('map-view', 'استخدم خريطة المكتبة',                       'Use the library map',
            (tags.includes('map-2d') || tags.includes('map-3d')) ? 1 : 0, 1),
      ];

    // متميز — الزيارة المستمرة والاستخدام الدائم للواقع المعزز وكاميرا المسح
    case 'متميز':
      return [
        req('visits',  'زُر المكتبة في ٦ جلسات',                'Visit the library in 6 sessions',   logins, 6),
        req('ar',      'استخدم ٣ من أدوات الواقع المعزز',        'Use 3 augmented reality tools',     countArFeatures(), 3),
        req('scan',    'امسح رفاً أو غلاف كتاب بالكاميرا',       'Scan a shelf or a book cover',      tags.includes('scan') ? 1 : 0, 1),
        req('prior',   'احصل على وسامَي المستكشف والباحث',       'Earn the Explorer and Researcher badges',
            ['explorer', 'researcher'].filter(l => completed.includes(l)).length, 2),
      ];
  }
}

/** True once the activity is done and the badge's questions can be answered. */
export function isBadgeUnlocked(badge: BadgeId): boolean {
  return getBadgeRequirements(badge).every(r => r.met);
}

/** 0..1 across the badge's requirements, counting partial progress on each. */
export function getBadgeProgress(badge: BadgeId): number {
  const reqs = getBadgeRequirements(badge);
  const sum = reqs.reduce((total, r) => total + r.current / r.target, 0);
  return reqs.length ? sum / reqs.length : 0;
}

/** Badges actually earned: the quiz round was passed. */
export function getEarnedBadges(_user: User): string[] {
  const completed = getCompletedGameLevels();
  return BADGE_ORDER.filter(b => completed.includes(BADGE_GAME_LEVEL[b]));
}
