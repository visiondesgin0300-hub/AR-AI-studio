import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Single source of truth for the gamification level shown across the app
// (sidebar, profile header, etc.) so it never disagrees from page to page.
export function getUserLevel(points: number): number {
  return Math.floor(points / 100) + 1;
}
