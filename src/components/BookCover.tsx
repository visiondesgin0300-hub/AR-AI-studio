import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
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
  const meta = getArBookMeta(book);

  if (!book.coverUrl || failed) {
    return (
      <div
        className={cn('flex flex-col items-center justify-center gap-2 text-white/90 overflow-hidden', className)}
        style={{ background: `linear-gradient(150deg, ${meta.spineColor}, ${meta.spineColor}bb 60%, rgba(0,0,0,0.35))` }}
      >
        <BookOpen className="w-1/4 h-1/4 min-w-6 min-h-6 opacity-80" />
        <span className="px-3 text-center text-[11px] font-black leading-tight line-clamp-3 opacity-90">{book.title}</span>
      </div>
    );
  }

  return (
    <img
      src={book.coverUrl}
      alt={book.title}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn('w-full h-full object-cover', imgClassName)}
    />
  );
}
