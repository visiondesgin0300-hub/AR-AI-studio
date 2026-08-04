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

export function bookAuthor(book: { author: string; authorEn?: string }, language: string): string {
  return language === 'en' && book.authorEn ? book.authorEn : book.author;
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

// Shelf/place navigations = visits whose ID matches a shelf pattern or 'facilities'
function getPlaceCount(): number {
  return getMapVisits().filter(v => /^[A-Z]-\d/.test(v) || v === 'facilities').length;
}

// XP for display: map open=20, each place/shelf=15, login 10/session (cap 5),
// search 10/visit (cap 5), plus whatever the cognitive AR levels have paid.
// The game used to keep its own XP tally on its own page only, so a level card
// promising "+50 XP" left the header and the profile unchanged.
export function calcXP(): number {
  const visits = getMapVisits();
  let xp = 0;
  if (visits.includes('map')) xp += 20;
  xp += getPlaceCount() * 15;
  xp += Math.min(getLoginCount(), 5) * 10;
  xp += Math.min(getSearchCount(), 5) * 10;
  xp += getGameXP();
  return xp;
}

// Single source of truth for earned badges.
// A badge can be earned via map/shelf navigation OR by completing the
// corresponding level in CognitiveARGame (whichever comes first).
export function getEarnedBadges(_user: User): string[] {
  const visits  = getMapVisits();
  const places  = getPlaceCount();
  const game    = getCompletedGameLevels();
  const earned: string[] = [];

  // مستكشف — فتح الخريطة  OR  إتمام مستوى المستكشف في اللعبة
  if (visits.includes('map') || visits.includes('facilities') || game.includes('explorer')) {
    earned.push('مستكشف');
  }

  // باحث — التنقل بين ≥ 3 رفوف  OR  إتمام مستوى الباحث في اللعبة
  if (places >= 3 || game.includes('researcher')) {
    earned.push('باحث');
  }

  // متميز — رحلة عبر جميع الأقسام  OR  إتمام مستوى المتميز في اللعبة
  const ALL_SECTIONS = ['A', 'B', 'C', 'D'];
  const visitedSections = new Set(
    visits.filter(v => /^[A-Z]-\d/.test(v)).map(v => v.split('-')[0])
  );
  const completedJourney = ALL_SECTIONS.every(s => visitedSections.has(s));
  if (
    (completedJourney || game.includes('distinguished')) &&
    earned.includes('مستكشف') && earned.includes('باحث')
  ) {
    earned.push('متميز');
  }

  return earned;
}
