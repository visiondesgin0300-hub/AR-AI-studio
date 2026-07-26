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

// Badges are auto-calculated from user activity — no game required.
// مستكشف  → XP ≥ 50  or borrowed/read ≥ 1 book
// باحث     → XP ≥ 150 or total read ≥ 3 books
// متميز    → XP ≥ 200
export function getEarnedBadges(user: User): string[] {
  const earned: string[] = [];
  const p = user.points ?? 0;
  const r = user.totalReadCount ?? 0;
  const b = user.borrowedBooks?.length ?? 0;

  if (p >= 50  || b >= 1 || r >= 1) earned.push('مستكشف');
  if (p >= 150 || r >= 3)            earned.push('باحث');
  if (p >= 200)                       earned.push('متميز');

  return earned;
}
