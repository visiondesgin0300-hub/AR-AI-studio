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

// Badges auto-calculated from user.points (earned by using the system).
// user.points grows with every action: borrowing books, returning, etc.
// مستكشف  → ≥ 15 XP  (borrowed 1 book)
// باحث     → ≥ 100 XP (active user)
// متميز    → ≥ 250 XP (dedicated user)
export function getEarnedBadges(user: User): string[] {
  const p = user.points ?? 0;
  const earned: string[] = [];
  if (p >= 15)  earned.push('مستكشف');
  if (p >= 100) earned.push('باحث');
  if (p >= 250) earned.push('متميز');
  return earned;
}
