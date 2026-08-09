/**
 * Building share links, in one place.
 *
 * Every share surface in the app — the classmate invitation, a book, a
 * facility, the app itself from the home page — sends the same kind of thing
 * through the same two channels. The encoding is easy to get subtly wrong
 * (an unescaped newline or ampersand silently truncates a mailto: body), so
 * the links are built here once rather than at each call site.
 *
 * Both channels are plain links. Nothing is sent by the app, no address book
 * is read, and no recipient ever reaches our server: the student's own client
 * opens with a draft, and they decide whether to send it.
 */

import { bookTitle, bookAuthor } from './utils';

export interface SharePayload {
  /** Email subject. Ignored by WhatsApp, which has no subject line. */
  subject: string;
  /** The body, newlines and all. The link should already be part of it. */
  message: string;
  /** Canonical link, handed to the OS share sheet as a separate field. */
  url: string;
}

/** The app's own origin, so a share works wherever this is deployed. */
export function appOrigin(): string {
  return typeof window !== 'undefined' ? window.location.origin : '';
}

export function whatsappHref({ message }: SharePayload): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function mailHref({ subject, message }: SharePayload): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
}

/** Copies the whole message. Returns false when the clipboard is blocked. */
export async function copyShare({ message }: SharePayload): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(message);
    return true;
  } catch {
    return false;
  }
}

export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

/** Opens the OS share sheet. Resolves false if dismissed or unsupported. */
export async function openNativeShare(payload: SharePayload): Promise<boolean> {
  try {
    await navigator.share({ title: payload.subject, text: payload.message, url: payload.url });
    return true;
  } catch {
    return false;
  }
}

// ── What each kind of share actually says ─────────────────────────────
//
// A shared book or facility is only useful to the person receiving it if it
// carries the thing they would otherwise have to ask for: where it is. So a
// book share names its section, shelf and call number, and a facility share
// names its location and whether it is free right now — the message is the
// directions, and the link is how they follow them.

const APP_NAME_AR = 'المكتبة المعززة الذكية';
const APP_NAME_EN = 'the Smart AR Library';

function join(lines: (string | false | null | undefined)[]): string {
  return lines.filter(Boolean).join('\n');
}

export function bookSharePayload(
  // section and shelf are optional on Book, and a book without a location is
  // the one case where the line has to be dropped rather than sent as
  // "Section undefined".
  book: { id: string; title: string; titleEn?: string; author: string; authorEn?: string; section?: string; shelf?: string; status?: string },
  callNumber: string,
  language: string,
): SharePayload {
  const ar = language === 'ar';
  const url = `${appOrigin()}/book/${book.id}`;
  // Through the shared helpers, so the shared message names the book the same
  // way the page does. Built inline, the English share went out as
  // "By شون كارول" under an English title.
  const title = bookTitle(book, language);
  const author = bookAuthor(book, language);
  const available = book.status === 'available';
  const located = !!(book.section && book.shelf);
  return {
    subject: ar ? `كتاب في المكتبة: ${title}` : `A book in the library: ${title}`,
    url,
    message: join([
      `📚 ${title}`,
      ar ? `المؤلف: ${author}` : `By ${author}`,
      '',
      located && (ar
        ? `📍 قسم ${book.section} · رف ${book.shelf}`
        : `📍 Section ${book.section} · Shelf ${book.shelf}`),
      `🏷 ${callNumber}`,
      ar
        ? (available ? '✅ متوفر للاستعارة الآن' : '⏳ مستعار حالياً')
        : (available ? '✅ Available to borrow now' : '⏳ On loan right now'),
      '',
      ar ? `افتحه على ${APP_NAME_AR}:` : `Open it on ${APP_NAME_EN}:`,
      url,
    ]),
  };
}

export function facilitySharePayload(
  facility: { name: string; desc: string; location: string; status: string },
  language: string,
): SharePayload {
  const ar = language === 'ar';
  const url = `${appOrigin()}/facilities`;
  const free = facility.status === 'available';
  return {
    subject: ar ? `مرفق في المكتبة: ${facility.name}` : `A library facility: ${facility.name}`,
    url,
    message: join([
      `🏛 ${facility.name}`,
      facility.desc,
      '',
      `📍 ${facility.location}`,
      ar
        ? (free ? '✅ متاح الآن' : '⏳ مزدحم حالياً')
        : (free ? '✅ Free right now' : '⏳ Busy right now'),
      '',
      ar ? `اتبع الطريق إليه على ${APP_NAME_AR}:` : `Follow the route on ${APP_NAME_EN}:`,
      url,
    ]),
  };
}

export function appSharePayload(language: string): SharePayload {
  const ar = language === 'ar';
  const url = appOrigin();
  return {
    subject: ar ? `جرّب ${APP_NAME_AR}` : `Try ${APP_NAME_EN}`,
    url,
    message: join([
      ar ? `📚 ${APP_NAME_AR}` : '📚 The Smart AR Library',
      ar
        ? 'ابحث عن الكتب، اتبع الخريطة إلى الرف، وامسح الرفوف بالواقع المعزز.'
        : 'Search the catalogue, follow the map to the shelf, and scan shelves in AR.',
      '',
      url,
    ]),
  };
}
