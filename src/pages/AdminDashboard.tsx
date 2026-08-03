import React, { useState, useMemo, useEffect } from 'react';
import {
  Users, BookOpen, Activity, PlusCircle, Download, Trash2, Edit, X,
  BarChart3, Bell, TrendingUp, Search,
  QrCode, Building2, MapPin,
  Printer, Monitor, VolumeX, User as UserIcon,
  CheckCircle2, Clock, MessageSquareReply, ChevronDown, ChevronUp, Mail,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BookCover } from '../components/BookCover';
import { MOCK_BOOKS, MOCK_USERS, SHELF_IDS } from '../data/mockData';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { User, Book } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell, LabelList, PieChart, Pie } from 'recharts';
import { useLanguage } from '../hooks/useLanguage';
import { useNavigate } from 'react-router-dom';

interface Facility {
  id: string;
  name: string;
  nameEn: string;
  desc: string;
  location: string;
  cellId: string;
  status: 'available' | 'busy' | 'closed';
  iconName: string;
}

type AdminTab = 'users' | 'books' | 'facilities' | 'qr' | 'stats' | 'logs' | 'feedback';

// Every shelf that exists on the library map and in the catalogue. This list
// was missing B-3/B-4/E-1/E-2, which meant those shelves got no printable AR
// code and — worse — the edit form's <select> had no matching <option>, so it
// fell back to A-1 and silently moved the book off its real shelf on save.
const SHELVES: readonly string[] = SHELF_IDS;

const FACILITY_ICONS: Record<string, React.ComponentType<any>> = {
  Users, Monitor, VolumeX, Printer, MapPin, BookOpen, Building2,
};

const INITIAL_FACILITIES: Facility[] = [
  { id: 'f1', name: 'غرف الدراسة الجماعية', nameEn: 'Group Study Rooms', desc: '٤ غرف مجهزة بشاشات تفاعلية', location: 'القسم B-2', cellId: 'B-2', status: 'available', iconName: 'Users' },
  { id: 'f2', name: 'منطقة الصمت', nameEn: 'Silent Zone', desc: 'بيئة هادئة للقراءة المركّزة', location: 'القسم D-1', cellId: 'D-1', status: 'available', iconName: 'VolumeX' },
  { id: 'f3', name: 'مختبر الحاسوب', nameEn: 'Computer Lab', desc: '٤٠ جهاز حاسوب متطور', location: 'القسم A-2', cellId: 'A-2', status: 'busy', iconName: 'Monitor' },
  { id: 'f4', name: 'خدمات الطباعة', nameEn: 'Printing Services', desc: 'طباعة ومسح وتصوير', location: 'القسم C-1', cellId: 'C-1', status: 'available', iconName: 'Printer' },
];

// Guards against the same silent-reassignment bug returning if a record ever
// carries a shelf this list doesn't know about: keep the record's own value
// selectable rather than letting the <select> fall through to the first option.
const shelfOptions = (current?: string): readonly string[] =>
  current && !SHELVES.includes(current) ? [current, ...SHELVES] : SHELVES;

const INPUT_CLS = (dir: string) =>
  cn('w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 p-4 rounded-2xl text-sm font-bold outline-none focus:border-accent/40 dark:focus:border-accent/40 transition-all text-primary dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700',
    dir === 'rtl' ? 'text-right' : 'text-left');

const LABEL_CLS = 'text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1';

export function AdminDashboard() {
  const { t, dir, language } = useLanguage();
  const navigate = useNavigate();
  const ar = language === 'ar';

  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [books, setBooks] = useState<Book[]>(MOCK_BOOKS);
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: 'user' | 'book' | 'facility'; data: any } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookFilter, setBookFilter] = useState('all');
  const [qrSection, setQrSection] = useState<'shelves' | 'books' | 'facilities'>('shelves');
  const [realFeedback, setRealFeedback] = useState<any[]>([]);
  const [newFeedbackCount, setNewFeedbackCount] = useState(0);
  const [feedbackStatuses, setFeedbackStatuses] = useState<Record<string, 'pending' | 'reviewing' | 'resolved'>>(() => {
    try { return JSON.parse(localStorage.getItem('admin_feedback_statuses') || '{}'); } catch { return {}; }
  });
  const [expandedReply, setExpandedReply] = useState<string | null>(null);
  // Notes used to live in component state only, so anything typed here was
  // lost the moment the admin switched tabs. Persist alongside the statuses.
  const [replyText, setReplyText] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('admin_feedback_notes') || '{}'); } catch { return {}; }
  });

  // Reading other users' feedback now needs the admin session token issued at
  // login; the endpoint rejects anyone else with 403.
  const [feedbackDenied, setFeedbackDenied] = useState(false);
  useEffect(() => {
    const token = (() => {
      try { return sessionStorage.getItem('library_token') || ''; } catch { return ''; }
    })();
    fetch('/api/feedback', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => {
        if (r.status === 403) { setFeedbackDenied(true); return null; }
        return r.json();
      })
      .then(data => {
        if (data && Array.isArray(data.entries)) {
          setRealFeedback(data.entries);
          setNewFeedbackCount(data.count || 0);
        }
      })
      .catch(() => {});
  }, []);

  const WEEKLY_DATA = useMemo(() => [
    { day: t('saturday'), value: 400 }, { day: t('sunday'), value: 300 },
    { day: t('monday'), value: 600 }, { day: t('tuesday'), value: 800 },
    { day: t('wednesday'), value: 500 }, { day: t('thursday'), value: 900 },
    { day: t('friday'), value: 700 },
  ], [t]);

  const CATEGORY_DATA = useMemo(() => [
    { name: t('computerScience'), value: 45 }, { name: t('engineering'), value: 30 },
    { name: t('business'), value: 15 }, { name: t('other'), value: 10 },
  ], [t]);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()));

  const filteredBooks = books.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = bookFilter === 'all' || b.category === bookFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredFacilities = facilities.filter(f =>
    f.name.includes(searchQuery) || f.nameEn.toLowerCase().includes(searchQuery.toLowerCase()));

  const stats = [
    { label: t('totalUsersCount'), value: users.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: t('totalBooksCount'), value: books.length, icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: ar ? 'المرافق' : 'Facilities', value: facilities.length, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: t('sentNotificationsCount'), value: 48, icon: Bell, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ];

  const logs = [
    { id: 1, user: ar ? 'فاطمة المعمري' : 'Fatima Al-Maamari', action: t('borrowBookAction'), target: t('ai'), time: ar ? 'منذ ١٠ دقائق' : '10 mins ago' },
    { id: 2, user: ar ? 'سارة أحمد' : 'Sara Ahmed', action: t('updateProfileAction'), target: t('settingsTarget'), time: ar ? 'منذ ٣٠ دقيقة' : '30 mins ago' },
    { id: 3, user: ar ? 'نظام الملاحة' : 'Navigation System', action: t('updatePathsAction'), target: t('engineeringDeptTarget'), time: ar ? 'منذ ساعة' : '1 hour ago' },
    { id: 4, user: ar ? 'محمد علي' : 'Mohamed Ali', action: t('returnBookAction'), target: t('software'), time: ar ? 'منذ ساعتين' : '2 hours ago' },
  ];

  const FACILITY_USAGE = useMemo(() => [
    { name: ar ? 'غرف الدراسة' : 'Study Rooms', value: 75 },
    { name: ar ? 'منطقة الصمت' : 'Silent Zone', value: 90 },
    { name: ar ? 'مختبر الحاسوب' : 'Computer Lab', value: 45 },
    { name: ar ? 'الطباعة' : 'Printing', value: 60 },
  ], [ar]);

  // The five moods a rating can carry — the axis of the distribution below.
  // These used to ship fixed percentages (32/28/25/10/5) that never moved no
  // matter what users actually submitted; the shares are now counted from the
  // entries in the list.
  const MOOD_SCALE = [
    { name: '😍', label: ar ? 'رائع' : 'Amazing', fill: '#f43f5e' },
    { name: '🤩', label: ar ? 'ممتاز' : 'Excellent', fill: '#f97316' },
    { name: '😊', label: ar ? 'جيد' : 'Good', fill: '#10b981' },
    { name: '😐', label: ar ? 'مقبول' : 'Okay', fill: '#64748b' },
    { name: '😕', label: ar ? 'يحتاج تحسين' : 'Needs work', fill: '#004C6D' },
  ];

  const MOOD_COLOR_MAP: Record<string, string> = {
    '😍': 'bg-rose-100 dark:bg-rose-950/40 text-rose-700',
    '🤩': 'bg-orange-100 dark:bg-orange-950/40 text-orange-700',
    '😊': 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700',
    '😐': 'bg-slate-100 dark:bg-slate-800 text-slate-600',
    '😕': 'bg-primary/10 text-primary',
  };

  const mockFeedbackEntries = ar ? [
    { id: 'm1', mood: '😍', moodLabel: 'رائع', moodColor: MOOD_COLOR_MAP['😍'], categories: ['تجربة AR'], text: 'التنقل بواسطة AR رائع جداً، أشعر وكأنني في مكتبة المستقبل!', time: 'منذ يوم', user: 'فاطمة المعمري', isDemo: true },
    { id: 'm2', mood: '😊', moodLabel: 'جيد', moodColor: MOOD_COLOR_MAP['😊'], categories: ['البحث', 'الواجهة'], text: 'البحث يعمل بشكل جيد لكن يمكن تحسين سرعته.', time: 'منذ يومين', user: 'محمد علي', isDemo: true },
    { id: 'm3', mood: '🤩', moodLabel: 'ممتاز', moodColor: MOOD_COLOR_MAP['🤩'], categories: ['الخريطة'], text: 'الخريطة ثنائية الأبعاد مفيدة جداً في إيجاد الكتب.', time: 'منذ ٣ أيام', user: 'سارة أحمد', isDemo: true },
  ] : [
    { id: 'm1', mood: '😍', moodLabel: 'Amazing', moodColor: MOOD_COLOR_MAP['😍'], categories: ['AR Experience'], text: 'The AR navigation is incredible, feels like the library of the future!', time: '1 day ago', user: 'Fatima Al-Maamari', isDemo: true },
    { id: 'm2', mood: '😊', moodLabel: 'Good', moodColor: MOOD_COLOR_MAP['😊'], categories: ['Search', 'UI/Design'], text: 'Search works well but could be faster.', time: '2 days ago', user: 'Mohamed Ali', isDemo: true },
    { id: 'm3', mood: '🤩', moodLabel: 'Excellent', moodColor: MOOD_COLOR_MAP['🤩'], categories: ['Map'], text: 'The 2D map is super helpful for finding books.', time: '3 days ago', user: 'Sara Ahmed', isDemo: true },
  ];

  const feedbackEntries = [
    ...realFeedback.map(e => ({
      id: e.id,
      // Help-centre inquiries carry no mood. They used to be pushed through
      // the mood slot anyway, so a support ticket appeared in the row of
      // satisfaction faces as if the sender had rated the library "✉️".
      isInquiry: e.kind === 'inquiry',
      mood: e.mood,
      moodLabel: e.moodLabel,
      moodColor: MOOD_COLOR_MAP[e.mood] || 'bg-slate-100 dark:bg-slate-800 text-slate-600',
      categories: e.categories,
      text: e.text,
      email: e.email || '',
      // ar-EG, not ar-SA: ar-SA resolves to the Umm al-Qura calendar in the
      // browser, so these stamps read as Hijri while every other date in the
      // app (due dates, loan history) is Gregorian.
      time: new Date(e.time).toLocaleString(ar ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }),
      user: e.user,
      isDemo: false,
    })),
    ...mockFeedbackEntries.map(m => ({ ...m, isInquiry: false, email: '' })),
  ];

  const inquiryCount = feedbackEntries.filter(e => e.isInquiry).length;
  const ratingCount = feedbackEntries.length - inquiryCount;

  // Counted from the ratings actually in the list. Percentages of a handful of
  // entries overstate their own precision, so the card leads with the count
  // and shows the share underneath.
  const moodDistribution = MOOD_SCALE.map(m => {
    const count = feedbackEntries.filter(e => !e.isInquiry && e.mood === m.name).length;
    return { ...m, count, pct: ratingCount > 0 ? Math.round((count / ratingCount) * 100) : 0 };
  });

  // Arabic counts take four forms (1 / 2 / 3–10 / 11+); English just needs
  // the -s. Enough to keep "1 inquiries" and "3 تقييم" off the screen.
  const countLabel = (n: number, forms: { one: string; two: string; few: string; many: string }): string => {
    if (!ar) return `${n} ${n === 1 ? forms.one : forms.many}`;
    if (n === 1) return forms.one;
    if (n === 2) return forms.two;
    return `${n} ${n % 100 >= 3 && n % 100 <= 10 ? forms.few : forms.many}`;
  };
  const ratingsLabel = ar
    ? countLabel(ratingCount, { one: 'تقييم واحد', two: 'تقييمان', few: 'تقييمات', many: 'تقييماً' })
    : countLabel(ratingCount, { one: 'rating', two: '', few: '', many: 'ratings' });
  const inquiriesLabel = ar
    ? countLabel(inquiryCount, { one: 'استفسار واحد', two: 'استفساران', few: 'استفسارات', many: 'استفساراً' })
    : countLabel(inquiryCount, { one: 'inquiry', two: '', few: '', many: 'inquiries' });

  const openModal = (type: 'user' | 'book' | 'facility', data: any = {}) => {
    setEditingItem({ type, data });
    setIsModalOpen(true);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm(t('confirmDeleteUser'))) setUsers(u => u.filter(x => x.id !== id));
  };

  const setFeedbackStatus = (id: string, status: 'pending' | 'reviewing' | 'resolved') => {
    setFeedbackStatuses(prev => {
      const next = { ...prev, [id]: status };
      localStorage.setItem('admin_feedback_statuses', JSON.stringify(next));
      return next;
    });
  };
  const handleDeleteBook = (id: string) => {
    if (confirm(t('confirmDeleteBook'))) setBooks(b => b.filter(x => x.id !== id));
  };
  const handleDeleteFacility = (id: string) => {
    if (confirm(ar ? 'هل تريد حذف هذا المرفق؟' : 'Delete this facility?'))
      setFacilities(f => f.filter(x => x.id !== id));
  };
  const handleToggleRole = (id: string) => {
    setUsers(u => u.map(x => x.id === id ? { ...x, role: x.role === 'admin' ? 'student' : 'admin' } : x));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const get = (k: string) => (fd.get(k) as string) || '';

    if (editingItem?.type === 'book') {
      const patch: Partial<Book> = {
        title: get('title'), author: get('author'),
        titleEn: get('titleEn'), authorEn: get('authorEn'),
        category: get('category'), shelf: get('shelf'),
        section: (get('shelf').split('-')[0] as any) || 'A',
        isbn: get('isbn'), year: parseInt(get('year')) || undefined,
        publisher: get('publisher'), coverUrl: get('coverUrl'),
        description: get('description'),
      };
      if (editingItem.data.id) {
        setBooks(b => b.map(x => x.id === editingItem.data.id ? { ...x, ...patch } : x));
      } else {
        setBooks(b => [{ ...patch, id: Math.random().toString(36).substr(2, 9), status: 'available', description: patch.description || '' } as Book, ...b]);
      }
    } else if (editingItem?.type === 'user') {
      const patch = { name: get('name'), email: get('email'), role: get('role') as 'student' | 'admin' };
      if (editingItem.data.id) {
        setUsers(u => u.map(x => x.id === editingItem.data.id ? { ...x, ...patch } : x));
      } else {
        setUsers(u => [{ ...patch, id: 'u' + Math.random().toString(36).substr(2, 6), borrowedBooks: [], totalReadCount: 0, points: 0, badges: [] }, ...u]);
      }
    } else if (editingItem?.type === 'facility') {
      const patch: Facility = {
        id: editingItem.data.id || 'f' + Math.random().toString(36).substr(2, 6),
        name: get('name'), nameEn: get('nameEn'), desc: get('desc'),
        location: get('location'), cellId: get('cellId'),
        status: get('status') as any, iconName: get('iconName'),
      };
      if (editingItem.data.id) {
        setFacilities(f => f.map(x => x.id === patch.id ? patch : x));
      } else {
        setFacilities(f => [patch, ...f]);
      }
    }
    setIsModalOpen(false);
  };

  const handlePrintQR = () => {
    window.print();
  };

  // The export control used to be inert. It now downloads whichever table the
  // admin is actually looking at, as CSV. The BOM keeps Excel from mangling
  // the Arabic columns.
  const handleExport = () => {
    const rows: (string | number)[][] =
      activeTab === 'books'
        ? [[ar ? 'العنوان' : 'Title', ar ? 'المؤلف' : 'Author', ar ? 'التصنيف' : 'Category', ar ? 'الرف' : 'Shelf', ar ? 'الحالة' : 'Status'],
           ...filteredBooks.map(b => [b.title, b.author, b.category || '', b.shelf || '', b.status || 'available'])]
      : activeTab === 'facilities'
        ? [[ar ? 'المرفق' : 'Facility', ar ? 'الاسم (EN)' : 'Name (EN)', ar ? 'الموقع' : 'Location', ar ? 'الحالة' : 'Status'],
           ...filteredFacilities.map(f => [f.name, f.nameEn, f.cellId, f.status])]
        : [[ar ? 'الاسم' : 'Name', ar ? 'البريد الإلكتروني' : 'Email', ar ? 'الدور' : 'Role', ar ? 'الاستعارات' : 'Borrowed'],
           ...filteredUsers.map(u => [u.name, u.email, u.role, u.borrowedBooks.length])];

    const csv = rows
      .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `arlibrary-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'users', label: t('usersTab'), icon: Users },
    { id: 'books', label: t('libraryTab'), icon: BookOpen },
    { id: 'facilities', label: ar ? 'المرافق' : 'Facilities', icon: Building2 },
    { id: 'qr', label: ar ? 'رموز AR' : 'AR Codes', icon: QrCode },
    { id: 'stats', label: t('statsTab'), icon: BarChart3 },
    { id: 'logs', label: t('logsTab'), icon: Activity },
    { id: 'feedback', label: ar ? 'طلبات المستخدمين' : 'User Requests', icon: TrendingUp, count: newFeedbackCount },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      available: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50',
      busy: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/50',
      closed: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50',
      borrowed: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50',
    };
    const labels: Record<string, string> = {
      available: ar ? 'متاح' : 'Available', busy: ar ? 'مشغول' : 'Busy',
      closed: ar ? 'مغلق' : 'Closed', borrowed: t('borrowedStatus'),
    };
    return <span className={cn('text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border whitespace-nowrap', map[status] || map.available)}>{labels[status] || status}</span>;
  };

  return (
    <div className={cn('space-y-12 animate-in duration-500 max-w-7xl mx-auto pb-10 font-sans', dir === 'rtl' ? 'slide-in-from-left-4 text-right' : 'slide-in-from-right-4 text-left')}>
      {/* Print CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; }
          #admin-qr-print-area, #admin-qr-print-area * { visibility: visible !important; }
          #admin-qr-print-area { position: fixed; top: 0; left: 0; width: 100%; padding: 24px; }
        }
      ` }} />

      {/* Header */}
      <div className={cn('flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-white/10 pb-8', dir === 'rtl' ? 'md:flex-row-reverse' : '')}>
        <div className="space-y-1">
          <div className={cn('flex items-center gap-3', dir === 'rtl' ? 'flex-row-reverse' : '')}>
            <h2 className="text-3xl font-black text-primary dark:text-white tracking-tight">{t('systemManagement')}</h2>
            <div className="bg-primary/5 dark:bg-accent/10 text-primary dark:text-accent px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/10 dark:border-accent/20 whitespace-nowrap">{t('centralControlPanel')}</div>
          </div>
          <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">{t('fullControlDesc')}</p>
        </div>
        <div className={cn('flex items-center gap-3 flex-wrap', dir === 'rtl' ? 'flex-row-reverse' : '')}>
          <button onClick={handleExport} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap">
            <Download className="w-4 h-4" />{t('exportReports')}
          </button>
          <button onClick={() => openModal('book')} className="bg-primary dark:bg-accent text-white dark:text-primary px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2 shadow-xl shadow-primary/20 dark:shadow-accent/20 whitespace-nowrap">
            <PlusCircle className="w-4 h-4 text-accent dark:text-primary" />{t('addNewResource')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={cn('official-card p-8 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5', dir === 'rtl' ? 'text-right' : 'text-left')}>
            <div className={cn('flex items-start justify-between mb-4', dir === 'rtl' ? 'flex-row-reverse' : '')}>
              <div className={cn('p-4 rounded-2xl shadow-inner', s.bg)}><s.icon className={cn('w-6 h-6', s.color)} /></div>
              <div className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">{t('updatedNow')}</div>
            </div>
            <div className="text-4xl font-black text-primary dark:text-white tracking-tighter font-mono">{s.value}</div>
            <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 p-2 rounded-[2rem] w-fit mx-auto lg:mx-0 shadow-inner flex-wrap justify-center">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id as AdminTab); setSearchQuery(''); if (tab.id === 'feedback') setNewFeedbackCount(0); }}
            className={cn('relative flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap',
              activeTab === tab.id ? 'bg-white dark:bg-slate-800 text-primary dark:text-accent shadow-xl shadow-black/5' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300')}>
            <tab.icon className={cn('w-4 h-4', activeTab === tab.id ? 'text-accent' : 'text-slate-400')} />
            <span>{tab.label}</span>
            {(tab as any).count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 shadow-lg animate-pulse">
                {(tab as any).count > 99 ? '99+' : (tab as any).count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div>
        <div className="space-y-8">
          <AnimatePresence mode="wait">

            {/* ── USERS ── */}
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4', dir === 'rtl' ? 'sm:flex-row-reverse' : '')}>
                  <h3 className="text-xl font-black text-primary dark:text-white tracking-tight">{t('userManagementTitle')}</h3>
                  <div className={cn('flex items-center gap-3', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                    <div className="relative">
                      <Search className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400', dir === 'rtl' ? 'right-4' : 'left-4')} />
                      <input type="text" placeholder={t('searchUserPlaceholder')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className={cn('py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 outline-none w-56 text-slate-900 dark:text-slate-100 placeholder:text-slate-400/50', dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4')} />
                    </div>
                    <button onClick={() => openModal('user')} className="bg-primary dark:bg-accent text-white dark:text-primary p-2.5 rounded-xl shadow-lg hover:scale-105 transition-all shrink-0">
                      <PlusCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className={cn('official-card overflow-hidden bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5', dir === 'rtl' ? 'text-right' : 'text-left')}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <tr className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                          <th className="px-6 py-4 whitespace-nowrap">{t('userTableHead')}</th>
                          <th className="px-6 py-4 whitespace-nowrap">{t('roleTableHead')}</th>
                          <th className="px-6 py-4 text-center whitespace-nowrap">{t('actionsTableHead')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {filteredUsers.map(user => (
                          <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className={cn('flex items-center gap-4', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-primary dark:text-accent shadow-sm shrink-0">{user.name[0]}</div>
                                <div>
                                  <div className="text-xs font-black text-primary dark:text-white">{user.name}</div>
                                  <div className="text-[10px] text-slate-400 font-bold">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <button onClick={() => handleToggleRole(user.id)}
                                className={cn('text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border whitespace-nowrap',
                                  user.role === 'admin' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 border-amber-200' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 border-emerald-200')}>
                                {user.role === 'admin' ? t('adminRole') : t('studentRole')}
                              </button>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => openModal('user', user)} className="p-2 text-slate-400 hover:text-primary dark:hover:text-accent bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent shadow-sm transition-colors"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent shadow-sm transition-colors"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── BOOKS ── */}
            {activeTab === 'books' && (
              <motion.div key="books" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4', dir === 'rtl' ? 'sm:flex-row-reverse' : '')}>
                  <h3 className="text-xl font-black text-primary dark:text-white tracking-tight">{t('libraryManagementTitle')}</h3>
                  <div className={cn('flex items-center gap-3', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                    <select value={bookFilter} onChange={e => setBookFilter(e.target.value)}
                      className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase px-4 py-2.5 rounded-xl outline-none text-slate-900 dark:text-slate-100 cursor-pointer">
                      <option value="all">{t('allCategories')}</option>
                      <option value="فيزياء">{t('physics')}</option>
                      <option value="هندسة">{t('engineering')}</option>
                      <option value="علم نفس">{t('psychology')}</option>
                      <option value="عام">{t('general')}</option>
                    </select>
                    <div className="relative">
                      <Search className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400', dir === 'rtl' ? 'right-4' : 'left-4')} />
                      <input type="text" placeholder={t('searchPlaceholderAdmin')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className={cn('py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 outline-none w-48 text-slate-900 dark:text-slate-100', dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4')} />
                    </div>
                    <button onClick={() => openModal('book')} className="bg-primary dark:bg-accent text-white dark:text-primary p-2.5 rounded-xl shadow-lg hover:scale-105 transition-all shrink-0">
                      <PlusCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className={cn('official-card overflow-hidden bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5', dir === 'rtl' ? 'text-right' : 'text-left')}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <tr className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                          <th className="px-6 py-4 whitespace-nowrap">{t('bookTableHead')}</th>
                          <th className="px-6 py-4 whitespace-nowrap">{ar ? 'الرف' : 'Shelf'}</th>
                          <th className="px-6 py-4 whitespace-nowrap">{t('statusTableHead')}</th>
                          <th className="px-6 py-4 text-center whitespace-nowrap">QR</th>
                          <th className="px-6 py-4 text-center whitespace-nowrap">{t('actionsTableHead')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {filteredBooks.map(book => (
                          <tr key={book.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className={cn('flex items-center gap-4', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                                <BookCover book={book} className="w-10 h-14 rounded-xl shadow-md border-2 border-slate-100 dark:border-white/5 shrink-0 overflow-hidden" />
                                <div>
                                  <div className="text-xs font-black text-primary dark:text-white truncate max-w-[180px]">{book.title}</div>
                                  <div className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-widest">{book.author}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-mono font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">{book.shelf || '—'}</span>
                            </td>
                            <td className="px-6 py-4">{statusBadge(book.status || 'available')}</td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center">
                                <div className="p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm">
                                  <QRCodeSVG value={`ARLIBRARY:BOOK:${book.id}`} size={40} level="M" fgColor="#004C6D" />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => openModal('book', book)} className="p-2 text-slate-400 hover:text-primary dark:hover:text-accent bg-slate-50 dark:bg-slate-800 rounded-xl shadow-sm transition-colors"><Edit className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteBook(book.id)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-sm transition-colors"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── FACILITIES ── */}
            {activeTab === 'facilities' && (
              <motion.div key="facilities" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4', dir === 'rtl' ? 'sm:flex-row-reverse' : '')}>
                  <h3 className="text-xl font-black text-primary dark:text-white tracking-tight">{ar ? 'إدارة المرافق' : 'Facilities Management'}</h3>
                  <div className={cn('flex items-center gap-3', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                    <div className="relative">
                      <Search className={cn('absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400', dir === 'rtl' ? 'right-4' : 'left-4')} />
                      <input type="text" placeholder={ar ? 'بحث...' : 'Search...'} value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className={cn('py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 outline-none w-48 text-slate-900 dark:text-slate-100', dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4')} />
                    </div>
                    <button onClick={() => openModal('facility')} className="bg-primary dark:bg-accent text-white dark:text-primary p-2.5 rounded-xl shadow-lg hover:scale-105 transition-all shrink-0">
                      <PlusCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className={cn('official-card overflow-hidden bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5', dir === 'rtl' ? 'text-right' : 'text-left')}>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <tr className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                          <th className="px-6 py-4 whitespace-nowrap">{ar ? 'المرفق' : 'Facility'}</th>
                          <th className="px-6 py-4 whitespace-nowrap">{ar ? 'الموقع' : 'Location'}</th>
                          <th className="px-6 py-4 whitespace-nowrap">{t('statusTableHead')}</th>
                          <th className="px-6 py-4 text-center whitespace-nowrap">QR</th>
                          <th className="px-6 py-4 text-center whitespace-nowrap">{t('actionsTableHead')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {filteredFacilities.map(fac => {
                          const Icon = FACILITY_ICONS[fac.iconName] || MapPin;
                          return (
                            <tr key={fac.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className={cn('flex items-center gap-4', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                                  <div className="w-10 h-10 rounded-2xl bg-primary/5 dark:bg-accent/10 flex items-center justify-center shrink-0">
                                    <Icon className="w-5 h-5 text-primary dark:text-accent" />
                                  </div>
                                  <div>
                                    <div className="text-xs font-black text-primary dark:text-white">{ar ? fac.name : fac.nameEn}</div>
                                    <div className="text-[10px] text-slate-400 font-bold mt-0.5">{fac.desc}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-xs font-mono font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">{fac.cellId}</span>
                              </td>
                              <td className="px-6 py-4">{statusBadge(fac.status)}</td>
                              <td className="px-6 py-4">
                                <div className="flex justify-center">
                                  <div className="p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm">
                                    <QRCodeSVG value={`ARLIBRARY:FACILITY:${fac.cellId}`} size={40} level="M" fgColor="#004C6D" />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => openModal('facility', fac)} className="p-2 text-slate-400 hover:text-primary dark:hover:text-accent bg-slate-50 dark:bg-slate-800 rounded-xl shadow-sm transition-colors"><Edit className="w-4 h-4" /></button>
                                  <button onClick={() => handleDeleteFacility(fac.id)} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-sm transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── QR CODES ── */}
            {activeTab === 'qr' && (
              <motion.div key="qr" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4', dir === 'rtl' ? 'sm:flex-row-reverse' : '')}>
                  <h3 className="text-xl font-black text-primary dark:text-white tracking-tight">{ar ? 'رموز AR التلقائية' : 'Auto-Generated AR Codes'}</h3>
                  <button onClick={handlePrintQR} className="flex items-center gap-2 bg-primary dark:bg-accent text-white dark:text-primary px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-primary/20">
                    <Printer className="w-4 h-4" />{ar ? 'طباعة' : 'Print'}
                  </button>
                </div>

                {/* Section switcher */}
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 p-1.5 rounded-2xl w-fit shadow-inner">
                  {([['shelves', ar ? 'الأرفف' : 'Shelves'], ['books', ar ? 'الكتب' : 'Books'], ['facilities', ar ? 'المرافق' : 'Facilities']] as const).map(([id, label]) => (
                    <button key={id} onClick={() => setQrSection(id)}
                      className={cn('px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap',
                        qrSection === id ? 'bg-white dark:bg-slate-800 text-primary dark:text-accent shadow-md' : 'text-slate-400 hover:text-slate-600')}>
                      {label}
                    </button>
                  ))}
                </div>

                <div id="admin-qr-print-area">
                  {/* Shelf QR codes */}
                  {qrSection === 'shelves' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {SHELVES.map(shelfId => (
                        <div key={shelfId} className="official-card p-5 flex flex-col items-center gap-3 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-lg hover:shadow-xl transition-shadow">
                          <QRCodeSVG value={`ARLIBRARY:SHELF:${shelfId}`} size={120} level="H" fgColor="#004C6D" />
                          <div className="text-center">
                            <div className="text-sm font-black text-primary dark:text-white">{ar ? `رف ${shelfId}` : `Shelf ${shelfId}`}</div>
                            <div className="text-[9px] font-mono text-slate-400 mt-1">ARLIBRARY:SHELF:{shelfId}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Book QR codes */}
                  {qrSection === 'books' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {books.map(book => (
                        <div key={book.id} className="official-card p-4 flex flex-col items-center gap-3 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-lg hover:shadow-xl transition-shadow">
                          <QRCodeSVG value={`ARLIBRARY:BOOK:${book.id}`} size={100} level="M" fgColor="#004C6D" />
                          <div className="text-center w-full">
                            <div className="text-[10px] font-black text-primary dark:text-white truncate w-full">{book.title}</div>
                            <div className="text-[8px] font-mono text-slate-400 mt-0.5">BOOK:{book.id} · {book.shelf}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Facility QR codes */}
                  {qrSection === 'facilities' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {facilities.map(fac => {
                        const Icon = FACILITY_ICONS[fac.iconName] || MapPin;
                        return (
                          <div key={fac.id} className="official-card p-5 flex flex-col items-center gap-3 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-lg hover:shadow-xl transition-shadow">
                            <QRCodeSVG value={`ARLIBRARY:FACILITY:${fac.cellId}`} size={120} level="H" fgColor="#004C6D" />
                            <div className="text-center">
                              <div className={cn('flex items-center justify-center gap-1.5 mb-1', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                                <Icon className="w-3 h-3 text-accent shrink-0" />
                                <div className="text-[10px] font-black text-primary dark:text-white">{ar ? fac.name : fac.nameEn}</div>
                              </div>
                              <div className="text-[8px] font-mono text-slate-400">ARLIBRARY:FACILITY:{fac.cellId}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}


            {/* ── LOGS ── */}
            {activeTab === 'logs' && (
              <motion.div key="logs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <h3 className="text-xl font-black text-primary dark:text-white tracking-tight">{t('digitalActivityLogs')}</h3>
                <div className="space-y-4">
                  {logs.map(log => (
                    <div key={log.id} className={cn('official-card p-6 flex items-center gap-6 border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 shadow-xl shadow-black/5', dir === 'rtl' ? 'flex-row-reverse text-right' : 'text-left')}>
                      <div className="w-14 h-14 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary dark:text-accent border border-slate-100 dark:border-white/5 shrink-0">
                        <Activity className="w-6 h-6 opacity-40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={cn('flex items-center gap-3', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                          <span className="text-sm font-black text-primary dark:text-white truncate">{log.user}</span>
                          <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">{log.action}</div>
                        </div>
                        <div className="text-[11px] font-black text-accent uppercase tracking-[0.2em] mt-1">{log.target}</div>
                      </div>
                      <div className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-tighter shrink-0">{log.time}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── STATS ── */}
            {activeTab === 'stats' && (
              <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4', dir === 'rtl' ? 'sm:flex-row-reverse' : '')}>
                  <h3 className="text-xl font-black text-primary dark:text-white tracking-tight">{t('dataAnalysisTitle')}</h3>
                </div>
                <div className="official-card p-6 md:p-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5">
                  <h4 className={cn('text-sm font-black text-primary dark:text-white uppercase tracking-tight mb-8', dir === 'rtl' ? 'text-right' : 'text-left')}>{t('cumulativeActivity')}</h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={WEEKLY_DATA} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--chart-line)" stopOpacity={0.15} /><stop offset="95%" stopColor="var(--chart-line)" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--grid-color)" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} dy={10} />
                        <YAxis hide />
                        <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)', border: 'none', borderRadius: '12px', padding: '12px', color: 'var(--tooltip-text)', fontWeight: 900, fontSize: '12px' }} itemStyle={{ color: 'var(--tooltip-text)' }} />
                        <Area type="monotone" dataKey="value" stroke="var(--chart-line)" strokeWidth={3} fillOpacity={1} fill="url(#areaFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="official-card p-6 md:p-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5">
                  <h4 className={cn('text-sm font-black text-primary dark:text-white uppercase tracking-tight mb-8', dir === 'rtl' ? 'text-right' : 'text-left')}>{t('knowledgeCampusMap')}</h4>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={CATEGORY_DATA} layout="vertical" margin={{ left: -30, right: 40 }}>
                        <XAxis type="number" hide domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#94a3b8' }} width={120} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'var(--tooltip-bg)', color: 'var(--tooltip-text)' }} itemStyle={{ color: 'var(--tooltip-text)' }} formatter={(v: number) => [`${v}%`, '']} />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                          {CATEGORY_DATA.map((_, i) => <Cell key={i} fill={['#004C6D', '#10b981', '#f59e0b', '#94a3b8'][i % 4]} />)}
                          <LabelList dataKey="value" position="right" formatter={(v: number) => `${v}%`} style={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="official-card p-6 md:p-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5">
                  <h4 className={cn('text-sm font-black text-primary dark:text-white uppercase tracking-tight mb-8', dir === 'rtl' ? 'text-right' : 'text-left')}>{ar ? 'نسبة استخدام المرافق' : 'Facility Usage Rate'}</h4>
                  <div className="space-y-4">
                    {FACILITY_USAGE.map((item, i) => (
                      <div key={i} className={cn('flex items-center gap-4', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                        <div className="text-[11px] font-black text-slate-500 dark:text-slate-400 w-28 shrink-0 truncate">{item.name}</div>
                        <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value}%` }}
                            transition={{ duration: 1.2, delay: i * 0.15, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: ['#004C6D', '#10b981', '#f59e0b', '#94a3b8'][i % 4] }}
                          />
                        </div>
                        <div className="text-[11px] font-black text-primary dark:text-white w-10 shrink-0 text-right">{item.value}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── MY REQUESTS (FEEDBACK) ── */}
            {activeTab === 'feedback' && (
              <motion.div key="feedback" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className={cn('flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3', dir === 'rtl' ? 'sm:flex-row-reverse' : '')}>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-primary dark:text-white tracking-tight">{ar ? 'طلبات المستخدمين' : 'User Requests'}</h3>
                    <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">{ar ? 'آراء وملاحظات المستخدمين المُستلمة من تطبيق ARLibrary' : 'User feedback received from the ARLibrary app'}</p>
                    {feedbackDenied && (
                      <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400" role="alert">
                        {ar
                          ? 'جلسة الإدارة منتهية — سجّل الدخول مجدداً لعرض الرسائل الواردة. المعروض أدناه بيانات تجريبية فقط.'
                          : 'Admin session expired — sign in again to load incoming messages. Only demo entries are shown below.'}
                      </p>
                    )}
                  </div>
                  <div className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                    {realFeedback.length > 0 && (
                      <span className="flex items-center gap-1.5 text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                        {realFeedback.length} {ar ? 'جديد' : 'live'}
                      </span>
                    )}
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{feedbackEntries.length} {ar ? 'إجمالي' : 'total'}</span>
                  </div>
                </div>

                {/* Mood summary — ratings only. Inquiries carry no mood, so
                    folding them into these percentages would misreport them. */}
                <div className="space-y-3">
                  <div className={cn('flex items-baseline gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      {ar ? 'توزيع التقييمات' : 'Rating distribution'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600">
                      {ratingsLabel} · {inquiriesLabel}
                    </span>
                  </div>
                <div className="grid grid-cols-5 gap-3">
                  {moodDistribution.map((m, i) => (
                    <div key={m.name} className={cn('official-card p-4 flex flex-col items-center gap-2 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-lg text-center transition-opacity', m.count === 0 && 'opacity-50')}>
                      <span className="text-2xl">{m.name}</span>
                      <div className="text-lg font-black text-primary dark:text-white tabular-nums">{m.count}</div>
                      <div className="text-[9px] font-black text-slate-400 tabular-nums">{m.pct}%</div>
                      <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-tight">{m.label}</div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${m.pct}%` }} transition={{ duration: 1, delay: i * 0.1 }} className="h-full rounded-full" style={{ backgroundColor: m.fill }} />
                      </div>
                    </div>
                  ))}
                </div>
                </div>

                {/* Feedback entries */}
                <div className="space-y-4">
                  {feedbackEntries.map(entry => {
                    const status = feedbackStatuses[entry.id] || 'pending';
                    const isResolved = status === 'resolved';
                    const isReviewing = status === 'reviewing';
                    const replyOpen = expandedReply === entry.id;
                    return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'official-card p-6 bg-white dark:bg-slate-900 shadow-xl shadow-black/5 space-y-3 relative overflow-hidden transition-opacity',
                        isResolved ? 'opacity-50' : (entry as any).isDemo ? 'opacity-70' : '',
                        isResolved
                          ? 'border-slate-200 dark:border-white/5'
                          : isReviewing
                          ? 'border-amber-200 dark:border-amber-800/50'
                          : (entry as any).isDemo
                          ? 'border-slate-100 dark:border-white/5'
                          : 'border-emerald-200 dark:border-emerald-800/50',
                        dir === 'rtl' ? 'text-right' : 'text-left'
                      )}
                    >
                      {/* Status badge */}
                      <div className={cn('absolute top-4 flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border', dir === 'rtl' ? 'left-4' : 'right-4',
                        isResolved
                          ? 'text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/10'
                          : isReviewing
                          ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-200 dark:border-amber-800/50'
                          : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-200 dark:border-emerald-800/50'
                      )}>
                        {isResolved
                          ? <><CheckCircle2 className="w-2.5 h-2.5" />{ar ? 'تم الحل' : 'Resolved'}</>
                          : isReviewing
                          ? <><Clock className="w-2.5 h-2.5 animate-pulse" />{ar ? 'قيد المراجعة' : 'Reviewing'}</>
                          : <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{ar ? 'جديد' : 'Pending'}</>
                        }
                      </div>

                      <div className={cn('flex items-center justify-between gap-4', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                        <div className={cn('flex items-center gap-3 min-w-0', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                          {entry.isInquiry ? (
                            <div className="w-9 h-9 shrink-0 rounded-xl bg-primary/10 dark:bg-accent/10 flex items-center justify-center text-primary dark:text-accent">
                              <Mail className="w-4 h-4" />
                            </div>
                          ) : (
                            <span className="text-2xl">{entry.mood}</span>
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-black text-primary dark:text-white truncate">{entry.user}</div>
                            {entry.isInquiry ? (
                              <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-primary/10 dark:bg-accent/10 text-primary dark:text-accent">
                                {ar ? 'استفسار دعم' : 'Support inquiry'}
                              </span>
                            ) : (
                              <span className={cn('text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg', entry.moodColor)}>{entry.moodLabel}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-tighter shrink-0">{entry.time}</div>
                      </div>

                      {/* An inquiry expects a reply, so surface a usable address. */}
                      {entry.isInquiry && entry.email && (
                        <a
                          href={`mailto:${entry.email}`}
                          dir="ltr"
                          className={cn('inline-flex items-center gap-1.5 text-[11px] font-black text-primary dark:text-accent hover:underline', dir === 'rtl' ? 'flex-row-reverse' : '')}
                        >
                          <Mail className="w-3 h-3 shrink-0" />
                          {entry.email}
                        </a>
                      )}

                      {entry.text && <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{entry.text}</p>}

                      <div className={cn('flex flex-wrap gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                        {entry.categories.map((cat: string, ci: number) => (
                          <span key={ci} className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10">{cat}</span>
                        ))}
                      </div>

                      {/* Admin reply panel */}
                      <AnimatePresence>
                        {replyOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-2 space-y-2">
                              <textarea
                                rows={2}
                                value={replyText[entry.id] || ''}
                                onChange={e => setReplyText(prev => {
                                  const next = { ...prev, [entry.id]: e.target.value };
                                  try { localStorage.setItem('admin_feedback_notes', JSON.stringify(next)); } catch {}
                                  return next;
                                })}
                                placeholder={ar ? 'اكتب ردًا داخليًا للمراجعة...' : 'Write an internal note...'}
                                className={cn('w-full text-xs font-medium rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950 text-primary dark:text-white p-3 focus:outline-none focus:ring-2 focus:ring-accent resize-none', dir === 'rtl' ? 'text-right' : 'text-left')}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Action buttons */}
                      {!isResolved && (
                        <div className={cn('flex items-center gap-2 pt-1 flex-wrap', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                          {!isReviewing && (
                            <button
                              onClick={() => setFeedbackStatus(entry.id, 'reviewing')}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all"
                            >
                              <Clock className="w-3 h-3" />
                              {ar ? 'قيد المراجعة' : 'Mark Reviewing'}
                            </button>
                          )}
                          <button
                            onClick={() => { setExpandedReply(replyOpen ? null : entry.id); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                          >
                            <MessageSquareReply className="w-3 h-3" />
                            {ar ? 'ملاحظة' : 'Note'}
                            {(replyText[entry.id] || '').trim() && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                            {replyOpen ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                          </button>
                          <button
                            onClick={() => { setFeedbackStatus(entry.id, 'resolved'); setExpandedReply(null); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {ar ? 'تم الحل' : 'Resolve'}
                          </button>
                        </div>
                      )}
                      {isResolved && (
                        <button
                          onClick={() => setFeedbackStatus(entry.id, 'pending')}
                          className="text-[9px] font-black text-slate-400 hover:text-primary dark:hover:text-white uppercase tracking-widest transition-colors"
                        >
                          {ar ? '↩ إعادة فتح' : '↩ Reopen'}
                        </button>
                      )}
                    </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

      {/* ── UNIFIED MODAL ── */}
      <AnimatePresence>
        {isModalOpen && editingItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/40 dark:bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-[0_100px_200px_rgba(0,0,0,0.4)] relative border border-slate-100 dark:border-white/5 max-h-[90vh] overflow-y-auto">
              <button onClick={() => setIsModalOpen(false)}
                className={cn('absolute top-8 p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary dark:hover:text-accent rounded-2xl transition-all hover:rotate-90', dir === 'rtl' ? 'left-8' : 'right-8')}>
                <X className="w-5 h-5" />
              </button>

              <form key={`${editingItem.type}-${editingItem.data.id || 'new'}`} onSubmit={handleSave} className="space-y-8">
                <div className="text-center space-y-1 pt-2">
                  <div className="text-[10px] font-black text-accent uppercase tracking-[0.4em]">
                    {editingItem.type === 'book' ? (ar ? 'إدارة المراجع' : 'Books') :
                     editingItem.type === 'user' ? (ar ? 'إدارة المستخدمين' : 'Users') :
                     (ar ? 'إدارة المرافق' : 'Facilities')}
                  </div>
                  <h3 className="text-2xl font-black text-primary dark:text-white tracking-tight">
                    {editingItem.data.id ? (ar ? 'تعديل السجل' : 'Edit Record') : (ar ? 'إضافة جديد' : 'Add New')}
                  </h3>
                </div>

                {/* Book form */}
                {editingItem.type === 'book' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className={LABEL_CLS}>{ar ? 'العنوان (عربي)' : 'Title (AR)'} *</label>
                        <input name="title" defaultValue={editingItem.data.title || ''} required className={INPUT_CLS(dir)} placeholder={ar ? 'عنوان الكتاب' : 'Book title'} />
                      </div>
                      <div className="space-y-2">
                        <label className={LABEL_CLS}>{ar ? 'العنوان (إنجليزي)' : 'Title (EN)'}</label>
                        <input name="titleEn" defaultValue={editingItem.data.titleEn || ''} className={INPUT_CLS(dir)} placeholder="English title" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className={LABEL_CLS}>{ar ? 'المؤلف' : 'Author'} *</label>
                        <input name="author" defaultValue={editingItem.data.author || ''} required className={INPUT_CLS(dir)} placeholder={ar ? 'اسم المؤلف' : 'Author name'} />
                      </div>
                      <div className="space-y-2">
                        <label className={LABEL_CLS}>{ar ? 'المؤلف (EN)' : 'Author (EN)'}</label>
                        <input name="authorEn" defaultValue={editingItem.data.authorEn || ''} className={INPUT_CLS(dir)} placeholder="Author EN" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className={LABEL_CLS}>{ar ? 'التصنيف' : 'Category'}</label>
                        <select name="category" defaultValue={editingItem.data.category || 'عام'} className={INPUT_CLS(dir)}>
                          <option value="فيزياء">{t('physics')}</option>
                          <option value="هندسة">{t('engineering')}</option>
                          <option value="علم نفس">{t('psychology')}</option>
                          <option value="عام">{t('general')}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className={LABEL_CLS}>{ar ? 'الرف' : 'Shelf'}</label>
                        <select name="shelf" defaultValue={editingItem.data.shelf || 'A-1'} className={INPUT_CLS(dir)}>
                          {shelfOptions(editingItem.data.shelf).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className={LABEL_CLS}>ISBN</label>
                        <input name="isbn" defaultValue={editingItem.data.isbn || ''} className={INPUT_CLS(dir)} placeholder="9780..." />
                      </div>
                      <div className="space-y-2">
                        <label className={LABEL_CLS}>{ar ? 'السنة' : 'Year'}</label>
                        <input name="year" type="number" defaultValue={editingItem.data.year || ''} className={INPUT_CLS(dir)} placeholder="2024" />
                      </div>
                      <div className="space-y-2">
                        <label className={LABEL_CLS}>{ar ? 'الناشر' : 'Publisher'}</label>
                        <input name="publisher" defaultValue={editingItem.data.publisher || ''} className={INPUT_CLS(dir)} placeholder="Publisher" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={LABEL_CLS}>{ar ? 'رابط الغلاف' : 'Cover URL'}</label>
                      <input name="coverUrl" defaultValue={editingItem.data.coverUrl || ''} className={INPUT_CLS(dir)} placeholder="https://covers.openlibrary.org/..." />
                    </div>
                    <div className="space-y-2">
                      <label className={LABEL_CLS}>{ar ? 'الوصف' : 'Description'}</label>
                      <textarea name="description" defaultValue={editingItem.data.description || ''} rows={3} className={cn(INPUT_CLS(dir), 'resize-none')} placeholder={ar ? 'وصف موجز للكتاب...' : 'Brief description...'} />
                    </div>
                  </div>
                )}

                {/* User form */}
                {editingItem.type === 'user' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className={LABEL_CLS}>{ar ? 'الاسم الكامل' : 'Full Name'} *</label>
                      <input name="name" defaultValue={editingItem.data.name || ''} required className={INPUT_CLS(dir)} placeholder={ar ? 'الاسم الكامل' : 'Full name'} />
                    </div>
                    <div className="space-y-2">
                      <label className={LABEL_CLS}>{ar ? 'البريد الإلكتروني' : 'Email'} *</label>
                      <input name="email" type="email" defaultValue={editingItem.data.email || ''} required className={INPUT_CLS(dir)} placeholder="user@example.com" dir="ltr" />
                    </div>
                    <div className="space-y-2">
                      <label className={LABEL_CLS}>{ar ? 'الدور' : 'Role'}</label>
                      <select name="role" defaultValue={editingItem.data.role || 'student'} className={INPUT_CLS(dir)}>
                        <option value="student">{t('studentRole')}</option>
                        <option value="admin">{t('adminRole')}</option>
                      </select>
                    </div>
                    {!editingItem.data.id && (
                      <div className="space-y-2">
                        <label className={LABEL_CLS}>{ar ? 'كلمة المرور الأولية' : 'Initial Password'}</label>
                        <input name="password" type="password" className={INPUT_CLS(dir)} placeholder="••••••••" />
                      </div>
                    )}
                  </div>
                )}

                {/* Facility form */}
                {editingItem.type === 'facility' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className={LABEL_CLS}>{ar ? 'الاسم (عربي)' : 'Name (AR)'} *</label>
                        <input name="name" defaultValue={editingItem.data.name || ''} required className={INPUT_CLS(dir)} placeholder={ar ? 'اسم المرفق' : 'Facility name'} />
                      </div>
                      <div className="space-y-2">
                        <label className={LABEL_CLS}>{ar ? 'الاسم (EN)' : 'Name (EN)'}</label>
                        <input name="nameEn" defaultValue={editingItem.data.nameEn || ''} className={INPUT_CLS(dir)} placeholder="Facility name EN" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={LABEL_CLS}>{ar ? 'الوصف' : 'Description'}</label>
                      <input name="desc" defaultValue={editingItem.data.desc || ''} className={INPUT_CLS(dir)} placeholder={ar ? 'وصف قصير' : 'Short description'} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className={LABEL_CLS}>{ar ? 'الموقع' : 'Location'}</label>
                        <input name="location" defaultValue={editingItem.data.location || ''} className={INPUT_CLS(dir)} placeholder={ar ? 'القسم B-2' : 'Section B-2'} />
                      </div>
                      <div className="space-y-2">
                        <label className={LABEL_CLS}>{ar ? 'خلية الخريطة' : 'Map Cell'}</label>
                        <select name="cellId" defaultValue={editingItem.data.cellId || 'A-1'} className={INPUT_CLS(dir)}>
                          {shelfOptions(editingItem.data.cellId).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className={LABEL_CLS}>{ar ? 'الحالة' : 'Status'}</label>
                        <select name="status" defaultValue={editingItem.data.status || 'available'} className={INPUT_CLS(dir)}>
                          <option value="available">{ar ? 'متاح' : 'Available'}</option>
                          <option value="busy">{ar ? 'مشغول' : 'Busy'}</option>
                          <option value="closed">{ar ? 'مغلق' : 'Closed'}</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className={LABEL_CLS}>{ar ? 'الأيقونة' : 'Icon'}</label>
                      <select name="iconName" defaultValue={editingItem.data.iconName || 'MapPin'} className={INPUT_CLS(dir)}>
                        {Object.keys(FACILITY_ICONS).map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                <div className={cn('flex gap-3', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                  <button type="button" onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-primary dark:hover:text-white transition-all">
                    {t('cancel')}
                  </button>
                  <button type="submit"
                    className="flex-[2] bg-primary dark:bg-accent text-white dark:text-primary py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_15px_30px_rgba(217,179,16,0.2)]">
                    {t('confirmChanges')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
