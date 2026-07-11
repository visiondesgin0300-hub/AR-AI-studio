import { useState, useEffect } from 'react';
import { User, Notification, Book } from '../types';
import { MOCK_BOOKS } from '../data/mockData';

export function useNotifications(user: User) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Generate deadline notifications based on borrowed books
    const newNotifications: Notification[] = [];
    
    user.borrowedBooks.forEach((bookId) => {
      const book = MOCK_BOOKS.find(b => b.id === bookId);
      if (book) {
        // Mocking deadline logic
        // In a real app, we'd have actual return dates in the user's borrowed books record
        // Here we simulate: books with ID '1', '2' etc. have different return dates
        const borrowDate = new Date(2024, 3, parseInt(book.id) * 5);
        const returnDate = new Date(borrowDate.getTime() + 14 * 24 * 60 * 60 * 1000);
        const now = new Date(2024, 3, 22); // Same fixed "now" as in MyBooks.tsx
        
        const daysLeft = Math.ceil((returnDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

        if (daysLeft <= 3 && daysLeft > 0) {
          newNotifications.push({
            id: `deadline-${book.id}`,
            userId: user.id,
            title: 'اقتراب موعد الإرجاع',
            message: `كتاب "${book.title}" يجب إرجاعه خلال ${daysLeft} أيام.`,
            type: 'warning',
            timestamp: Date.now(),
            isRead: false,
            link: `/my-books`
          });
        } else if (daysLeft <= 0) {
           newNotifications.push({
            id: `overdue-${book.id}`,
            userId: user.id,
            title: 'تجاوز موعد الإرجاع',
            message: `لقد تجاوزت الموعد المحدد لإرجاع كتاب "${book.title}". يرجى إعادته في أقرب وقت.`,
            type: 'alert',
            timestamp: Date.now(),
            isRead: false,
            link: `/my-books`
          });
        }
      }
    });

    // Add some general notifications
    newNotifications.push({
      id: 'welcome',
      userId: user.id,
      title: 'أهلاً بك في المكتبة المعززة الذكية',
      message: 'نسخة تجريبية جديدة من نظام الملاحة والبحث متاحة الآن.',
      type: 'info',
      timestamp: Date.now() - 1000000,
      isRead: true
    });

    setNotifications(newNotifications);
  }, [user]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return {
    notifications,
    unreadCount: notifications.filter(n => !n.isRead).length,
    markAsRead,
    markAllAsRead
  };
}
