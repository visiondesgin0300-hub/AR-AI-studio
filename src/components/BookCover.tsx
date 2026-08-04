import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { cn, bookTitle } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';
import { getArBookMeta } from '../lib/arCatalog';
import { Book } from '../types';

interface BookCoverProps {
  book: Book;
  className?: string;
  imgClassName?: string;
}

// Renders a book cover with a graceful branded fallback: external cover images
// (Open Library / stock) can 404, rate-limit, or be blocked, and a broken-image
// icon looks unfinished. On any load failure (or missing URL) we show a colored
// spine-tinted placeholder with the book's initial instead.
export function BookCover({ book, className, imgClassName }: BookCoverProps) {
  const [failed, setFailed] = useState(false);
  const { language } = useLanguage();
  const meta = getArBookMeta(book);

  return (
    <div
      className={cn('overflow-hidden relative flex flex-col items-center justify-center', className)}
      style={(!book.coverUrl || failed)
        ? { background: `linear-gradient(150deg, ${meta.spineColor}, ${meta.spineColor}bb 60%, rgba(0,0,0,0.35))` }
        : undefined}
    >
      {(!book.coverUrl || failed) ? (
        <>
          <BookOpen className="w-1/4 h-1/4 min-w-6 min-h-6 opacity-80 text-white/90" />
          {/* w-full + break-words: as a centred flex child the span sized to
              its max-content width, so on the 80px thumbnail in search results
              a long title measured 104px and the tile's overflow-hidden shaved
              ~13px off each side of the text. */}
          <span className="w-full px-3 text-center text-[11px] font-black leading-tight line-clamp-3 break-words opacity-90 text-white/90">{bookTitle(book, language)}</span>
        </>
      ) : (
        <img
          src={book.coverUrl}
          alt={bookTitle(book, language)}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className={cn('w-full h-full object-cover', imgClassName)}
        />
      )}
    </div>
  );
}
