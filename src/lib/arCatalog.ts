import { Book } from '../types';

// Deterministic pseudo-academic catalog metadata for the AR shelf-scan
// simulation. A real integrated library system would read these from a MARC
// record; here we derive stable, plausible values from each book's category
// and id so the "AR info window" always has authentic-looking academic data
// (LC call number, subject class, publisher, year) to display in the demo.

interface LcClass {
  code: string;
  subjectAr: string;
  subjectEn: string;
}

const LC_CLASS_BY_CATEGORY: Record<string, LcClass> = {
  'فيزياء': { code: 'QC', subjectAr: 'الفيزياء والعلوم الطبيعية', subjectEn: 'Physics & Natural Science' },
  'هندسة': { code: 'TA', subjectAr: 'الهندسة والتقنية', subjectEn: 'Engineering & Technology' },
  'علم نفس': { code: 'BF', subjectAr: 'علم النفس والسلوك', subjectEn: 'Psychology & Behavior' },
  'عام': { code: 'AC', subjectAr: 'معارف عامة وفلسفة', subjectEn: 'General Knowledge & Philosophy' },
};

const DEFAULT_CLASS: LcClass = LC_CLASS_BY_CATEGORY['عام'];

// Deep, saturated spine colors reminiscent of academic hardcovers.
const SPINE_COLORS = [
  '#0e7490', '#155e75', '#b45309', '#7c2d12', '#4c1d95',
  '#065f46', '#9f1239', '#1e3a8a', '#3f6212', '#701a75',
];

const PUBLISHERS = [
  'MIT Press', 'Springer', 'Oxford University Press', 'Pearson',
  'Wiley', 'Cambridge University Press', 'دار المعرفة العلمية',
];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export interface ArBookMeta {
  callNumber: string;
  lcClass: string;
  subjectAr: string;
  subjectEn: string;
  year: number;
  publisher: string;
  spineColor: string;
}

export function getArBookMeta(book: Book): ArBookMeta {
  const cls = LC_CLASS_BY_CATEGORY[book.category ?? 'عام'] ?? DEFAULT_CLASS;
  const h = hashId(book.id);
  const major = 20 + (h % 900) / 10; // e.g. 76.6
  const cutterLetter = String.fromCharCode(65 + (h % 26)); // A-Z
  const cutterNum = (h % 900) + 100; // 3-digit
  const year = 1998 + (h % 26); // 1998 - 2023
  const callNumber = `${cls.code}${major.toFixed(1)} .${cutterLetter}${cutterNum} ${year}`;
  return {
    callNumber,
    lcClass: cls.code,
    subjectAr: cls.subjectAr,
    subjectEn: cls.subjectEn,
    year,
    publisher: PUBLISHERS[h % PUBLISHERS.length],
    spineColor: SPINE_COLORS[h % SPINE_COLORS.length],
  };
}
