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

// ── Map & shelf visit tracking ────────────────────────────────────────
// LibraryMap calls trackMapVisit('map') on mount.
// navigateToCell calls trackMapVisit(cellId) for each unique shelf clicked.
// FacilitiesMap calls trackMapVisit('facilities') on mount.
// XP: opening the map = 20, each unique shelf = 15, facilities = 10.

const MAP_VISITS_KEY = 'map_visits_v1';

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

function calcMapXP(): number {
  const visits = getMapVisits();
  let xp = 0;
  if (visits.includes('map'))        xp += 20;
  if (visits.includes('facilities')) xp += 10;
  // Each unique shelf ID (A-1, B-2, …) = 15 XP
  xp += visits.filter(v => /^[A-Z]-\d/.test(v)).length * 15;
  return xp;
}

// Badges auto-calculated from map & shelf exploration.
// مستكشف  → ≥ 20 XP  (opened the map once)
// باحث     → ≥ 65 XP  (explored ≥ 3 shelves)
// متميز    → ≥ 125 XP (explored all 8 shelves)
export function getEarnedBadges(_user: User): string[] {
  const xp = calcMapXP();
  const earned: string[] = [];
  if (xp >= 20)  earned.push('مستكشف');
  if (xp >= 65)  earned.push('باحث');
  if (xp >= 125) earned.push('متميز');
  return earned;
}
