import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { User } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Single source of truth for the gamification level shown across the app
// (sidebar, profile header, etc.) so it never disagrees from page to page.
export function getUserLevel(points: number): number {
  return Math.floor(points / 100) + 1;
}

// ── AR visit tracking ────────────────────────────────────────────────
// Each AR page calls trackARVisit('feature-id') on mount.
// The set is persisted in localStorage so badges survive navigation.

const AR_VISITS_KEY = 'ar_visits_v1';

export function trackARVisit(feature: string): void {
  try {
    const current = getARVisits();
    if (!current.includes(feature)) {
      localStorage.setItem(AR_VISITS_KEY, JSON.stringify([...current, feature]));
    }
  } catch {}
}

export function getARVisits(): string[] {
  try { return JSON.parse(localStorage.getItem(AR_VISITS_KEY) || '[]'); } catch { return []; }
}

// Badges auto-calculated from AR usage (no game or XP required).
// مستكشف  → used ≥ 1 AR feature
// باحث     → used ≥ 3 AR features
// متميز    → used ≥ 5 AR features
export function getEarnedBadges(_user: User): string[] {
  const count = getARVisits().length;
  const earned: string[] = [];
  if (count >= 1) earned.push('مستكشف');
  if (count >= 3) earned.push('باحث');
  if (count >= 5) earned.push('متميز');
  return earned;
}
