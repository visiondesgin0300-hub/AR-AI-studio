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

// Single source of truth for which badges a user has earned, shared between
// the Dashboard's badges cabinet and the library map's badges chest.
export function getEarnedBadges(user: User): string[] {
  const earnedBadges = [...user.badges];
  if (user.totalReadCount > 10 && !earnedBadges.includes('قارئ نشط')) {
    earnedBadges.push('قارئ نشط');
  }
  if (user.points > 400 && !earnedBadges.includes('قارئ الشهر')) {
    earnedBadges.push('قارئ الشهر');
  }
  return earnedBadges;
}
