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
  // Prefer a book's real catalog metadata (year/call number/publisher) when it
  // carries it; otherwise fall back to deterministic derived values so every
  // book still has a plausible profile.
  const year = book.year ?? 1998 + (h % 26); // 1998 - 2023
  const callNumber = book.callNumber ?? `${cls.code}${major.toFixed(1)} .${cutterLetter}${cutterNum} ${year}`;
  // Derive the LC class from a real call number's leading letters when present.
  const lcClass = book.callNumber ? (book.callNumber.match(/^[A-Z]+/)?.[0] ?? cls.code) : cls.code;
  return {
    callNumber,
    lcClass,
    subjectAr: cls.subjectAr,
    subjectEn: cls.subjectEn,
    year,
    publisher: book.publisher ?? PUBLISHERS[h % PUBLISHERS.length],
    spineColor: SPINE_COLORS[h % SPINE_COLORS.length],
  };
}

export type CitationStyle = 'APA' | 'MLA' | 'Chicago' | 'BibTeX';

// Deterministic, fully-local academic citations for a book, generated from its
// own fields plus the derived year/publisher — so the "cite this book" feature
// always works instantly, no API key or network round-trip required.
export function getCitations(book: Book): Record<CitationStyle, string> {
  const meta = getArBookMeta(book);
  const { year, publisher } = meta;
  // Prefer the original English title/author for citations (the standard
  // academic form), falling back to the Arabic fields for books that only
  // carry Arabic metadata.
  const author = (book.authorEn || book.author)?.trim() || 'Unknown author';
  const title = (book.titleEn || book.title)?.trim() || '';
  const keySeed = (book.authorEn || book.author || 'ref').split(/[\s,&]+/)[0].replace(/[^A-Za-z0-9]/g, '') || 'ref';
  const bibKey = `${keySeed}${book.id}${year}`;

  return {
    APA: `${author} (${year}). ${title}. ${publisher}.`,
    MLA: `${author}. ${title}. ${publisher}, ${year}.`,
    Chicago: `${author}. ${title}. ${publisher}, ${year}.`,
    BibTeX: `@book{${bibKey},\n  author    = {${author}},\n  title     = {${title}},\n  year      = {${year}},\n  publisher = {${publisher}}\n}`,
  };
}
