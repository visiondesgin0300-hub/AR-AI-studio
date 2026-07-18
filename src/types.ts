export interface Book {
  id: string;
  title: string;
  titleArabic?: string;
  titleEn?: string;          // English title (bilingual display)
  author: string;
  authorEn?: string;         // English/original author name
  category?: 'فيزياء' | 'هندسة' | 'علم نفس' | 'عام' | string;
  shelf?: string;
  section?: 'A' | 'B' | 'C' | 'D' | 'E' | string;
  description: string;
  descriptionEn?: string;    // English summary (bilingual display)
  callNumber?: string;       // real LC classification number
  publisher?: string;        // real publisher (used for citations)
  status?: 'available' | 'borrowed';
  coverUrl?: string;
  genre?: string;
  genreArabic?: string;
  year?: number;
  pages?: number;
  coverColor?: string;
  summary?: string;
  location?: {
    floor: number;
    aisle: string;
    shelf: number;
    section?: string;
  };
  chapters?: {
    number: number;
    title: string;
    content: string;
  }[];
  quizzes?: {
    question: string;
    options: string[];
    answerIndex: number;
    explanation: string;
  }[];
}

export interface Badge {
  id: string;
  title: string;
  titleArabic: string;
  description: string;
  iconName: string;
  color: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  borrowedBooks: string[]; // IDs of books currently borrowed
  totalReadCount: number;  // Total books ever read
  points: number;          // Gamification points
  badges: string[];
}

export interface BorrowRecord {
  userId: string;
  bookId: string;
  borrowDate: string;
  returnDate: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert';
  timestamp: number;
  isRead: boolean;
  link?: string;
}

export type Category = Book['category'];
