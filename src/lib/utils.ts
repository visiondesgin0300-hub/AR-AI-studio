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

const MAP_VISITS_KEY  = 'map_visits_v2';
const LOGIN_COUNT_KEY = 'login_count_v1';

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

// Shelf/place navigations = visits whose ID matches a shelf pattern or 'facilities'
function getPlaceCount(): number {
  return getMapVisits().filter(v => /^[A-Z]-\d/.test(v) || v === 'facilities').length;
}

// XP for display: map open=20, each place/shelf=15, login bonus 10/session (cap 3)
export function calcXP(): number {
  const visits = getMapVisits();
  let xp = 0;
  if (visits.includes('map')) xp += 20;
  xp += getPlaceCount() * 15;
  xp += Math.min(getLoginCount(), 5) * 10;
  return xp;
}

// Single source of truth for earned badges
export function getEarnedBadges(_user: User): string[] {
  const visits  = getMapVisits();
  const places  = getPlaceCount();
  const logins  = getLoginCount();
  const earned: string[] = [];

  // مستكشف: فتح الخريطة مرة واحدة
  if (visits.includes('map') || visits.includes('facilities')) {
    earned.push('مستكشف');
  }

  // باحث: التنقل بين ≥ 3 رفوف أو أماكن مختلفة
  if (places >= 3) {
    earned.push('باحث');
  }

  // متميز: دخول النظام ≥ 3 مرات + امتلاك الوسامَين السابقَين
  if (logins >= 3 && earned.includes('مستكشف') && earned.includes('باحث')) {
    earned.push('متميز');
  }

  return earned;
}
