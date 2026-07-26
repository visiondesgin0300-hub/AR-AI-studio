import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getUserLevel(points: number): number {
  return Math.floor(points / 100) + 1;
}

// ── Map & shelf navigation tracking ──────────────────────────────────
// مستكشف: opened map ≥ 1 time
// باحث:   navigated to ≥ 3 different shelves/places
// متميز:  logged in ≥ 3 sessions AND has both previous badges

const MAP_VISITS_KEY   = 'map_visits_v2';
const LOGIN_COUNT_KEY  = 'login_count_v1';
const SEARCH_COUNT_KEY = 'search_count_v1';
const GAME_KEY         = 'cognitive_ar_v4';

function getCompletedGameLevels(): string[] {
  try { return JSON.parse(localStorage.getItem(GAME_KEY) || '[]'); } catch { return []; }
}

export function trackMapVisit(locationId: string): void {
  try {
    const current = getMapVisits();
    if (!current.includes(locationId)) {
      localStorage.setItem(MAP_VISITS_KEY, JSON.stringify([...current, locationId]));
    }
  } catch {}
}

export function getMapVisits(): string[] {
  try { return JSON.parse(localStorage.getItem(MAP_VISITS_KEY) || '[]'); } catch { return []; }
}

// Called once per login from App.tsx handleLogin
export function incrementLoginCount(): void {
  try {
    const n = getLoginCount() + 1;
    localStorage.setItem(LOGIN_COUNT_KEY, String(n));
  } catch {}
}

export function getLoginCount(): number {
  try { return parseInt(localStorage.getItem(LOGIN_COUNT_KEY) || '0', 10); } catch { return 0; }
}

// Called once per search page visit from Search.tsx
export function incrementSearchCount(): void {
  try {
    const n = getSearchCount() + 1;
    localStorage.setItem(SEARCH_COUNT_KEY, String(n));
  } catch {}
}

export function getSearchCount(): number {
  try { return parseInt(localStorage.getItem(SEARCH_COUNT_KEY) || '0', 10); } catch { return 0; }
}

// Shelf/place navigations = visits whose ID matches a shelf pattern or 'facilities'
function getPlaceCount(): number {
  return getMapVisits().filter(v => /^[A-Z]-\d/.test(v) || v === 'facilities').length;
}

// XP for display: map open=20, each place/shelf=15, login bonus 10/session (cap 5)
export function calcXP(): number {
  const visits = getMapVisits();
  let xp = 0;
  if (visits.includes('map')) xp += 20;
  xp += getPlaceCount() * 15;
  xp += Math.min(getLoginCount(), 5) * 10;
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
