import React, { useState, useMemo, useEffect } from 'react';
import {
  Users, BookOpen, Activity, PlusCircle, Download, Trash2, Edit, X,
  BarChart3, Bell, TrendingUp, Search,
  QrCode, Building2, MapPin,
  Printer, Monitor, VolumeX, User as UserIcon,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BookCover } from '../components/BookCover';
import { MOCK_BOOKS, MOCK_USERS } from '../data/mockData';
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

const SHELVES = ['A-1', 'A-2', 'B-1', 'B-2', 'C-1', 'C-2', 'D-1', 'D-2'];

const FACILITY_ICONS: Record<string, React.ComponentType<any>> = {
  Users, Monitor, VolumeX, Printer, MapPin, BookOpen, Building2,
};

const INITIAL_FACILITIES: Facility[] = [
  { id: 'f1', name: 'غرف الدراسة الجماعية', nameEn: 'Group Study Rooms', desc: '٤ غرف مجهزة بشاشات تفاعلية', location: 'القسم B-2', cellId: 'B-2', status: 'available', iconName: 'Users' },
  { id: 'f2', name: 'منطقة الصمت', nameEn: 'Silent Zone', desc: 'بيئة هادئة للقراءة المركّزة', location: 'القسم D-1', cellId: 'D-1', status: 'available', iconName: 'VolumeX' },
  { id: 'f3', name: 'مختبر الحاسوب', nameEn: 'Computer Lab', desc: '٤٠ جهاز حاسوب متطور', location: 'القسم A-2', cellId: 'A-2', status: 'busy', iconName: 'Monitor' },
  { id: 'f4', name: 'خدمات الطباعة', nameEn: 'Printing Services', desc: 'طباعة ومسح وتصوير', location: 'القسم C-1', cellId: 'C-1', status: 'available', iconName: 'Printer' },
];

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
    { label: t('sentNotificationsCount'), value: '٤٨', icon: Bell, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
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

  const MOOD_DATA = [
    { name: '😍', value: 32, label: ar ? 'رائع' : 'Amazing', fill: '#f43f5e' },
    { name: '🤩', value: 28, label: ar ? 'ممتاز' : 'Excellent', fill: '#f97316' },
    { name: '😊', value: 25, label: ar ? 'جيد' : 'Good', fill: '#10b981' },
    { name: '😐', value: 10, label: ar ? 'مقبول' : 'Okay', fill: '#64748b' },
    { name: '😕', value: 5, label: ar ? 'يحتاج تحسين' : 'Needs work', fill: '#004C6D' },
  ];

  const feedbackEntries = ar ? [
    { id: 1, mood: '😍', moodLabel: 'رائع', moodColor: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700', categories: ['تجربة AR'], text: 'التنقل بواسطة AR رائع جداً، أشعر وكأنني في مكتبة المستقبل!', time: 'منذ ١٠ دقائق', user: 'فاطمة المعمري' },
    { id: 2, mood: '😊', moodLabel: 'جيد', moodColor: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700', categories: ['البحث', 'الواجهة'], text: 'البحث يعمل بشكل جيد لكن يمكن تحسين سرعته.', time: 'منذ ساعة', user: 'محمد علي' },
    { id: 3, mood: '🤩', moodLabel: 'ممتاز', moodColor: 'bg-orange-100 dark:bg-orange-950/40 text-orange-700', categories: ['الخريطة'], text: 'الخريطة ثنائية الأبعاد مفيدة جداً في إيجاد الكتب.', time: 'منذ ٣ ساعات', user: 'سارة أحمد' },
    { id: 4, mood: '😐', moodLabel: 'مقبول', moodColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600', categories: ['اقتراح'], text: 'أقترح إضافة المزيد من تصنيفات الكتب.', time: 'منذ يوم', user: 'عمر خالد' },
    { id: 5, mood: '😕', moodLabel: 'يحتاج تحسين', moodColor: 'bg-primary/10 text-primary', categories: ['البحث'], text: 'أحياناً تظهر نتائج بحث غير دقيقة.', time: 'منذ يومين', user: 'نورة سالم' },
  ] : [
    { id: 1, mood: '😍', moodLabel: 'Amazing', moodColor: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700', categories: ['AR Experience'], text: 'The AR navigation is incredible, feels like the library of the future!', time: '10 mins ago', user: 'Fatima Al-Maamari' },
    { id: 2, mood: '😊', moodLabel: 'Good', moodColor: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700', categories: ['Search', 'UI/Design'], text: 'Search works well but could be faster.', time: '1 hour ago', user: 'Mohamed Ali' },
    { id: 3, mood: '🤩', moodLabel: 'Excellent', moodColor: 'bg-orange-100 dark:bg-orange-950/40 text-orange-700', categories: ['Map'], text: 'The 2D map is super helpful for finding books.', time: '3 hours ago', user: 'Sara Ahmed' },
    { id: 4, mood: '😐', moodLabel: 'Okay', moodColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600', categories: ['Suggestion'], text: 'Would love more book categories to choose from.', time: '1 day ago', user: 'Omar Khalid' },
    { id: 5, mood: '😕', moodLabel: 'Needs work', moodColor: 'bg-primary/10 text-primary', categories: ['Search'], text: 'Sometimes search returns irrelevant results.', time: '2 days ago', user: 'Noura Salem' },
  ];

  const openModal = (type: 'user' | 'book' | 'facility', data: any = {}) => {
    setEditingItem({ type, data });
    setIsModalOpen(true);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm(t('confirmDeleteUser'))) setUsers(u => u.filter(x => x.id !== id));
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

  const tabs = [
    { id: 'users', label: t('usersTab'), icon: Users },
    { id: 'books', label: t('libraryTab'), icon: BookOpen },
    { id: 'facilities', label: ar ? 'المرافق' : 'Facilities', icon: Building2 },
    { id: 'qr', label: ar ? 'رموز AR' : 'AR Codes', icon: QrCode },
    { id: 'stats', label: t('statsTab'), icon: BarChart3 },
    { id: 'logs', label: t('logsTab'), icon: Activity },
    { id: 'feedback', label: ar ? 'آراء المستخدمين' : 'Feedback', icon: TrendingUp },
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
          <button onClick={() => navigate('/qr-print')} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap">
            <QrCode className="w-4 h-4 text-accent" />{ar ? 'طباعة رموز AR' : 'Print AR Codes'}
          </button>
          <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap">
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
          <button key={tab.id} onClick={() => { setActiveTab(tab.id as AdminTab); setSearchQuery(''); }}
            className={cn('flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap',
              activeTab === tab.id ? 'bg-white dark:bg-slate-800 text-primary dark:text-accent shadow-xl shadow-black/5' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300')}>
            <tab.icon className={cn('w-4 h-4', activeTab === tab.id ? 'text-accent' : 'text-slate-400')} />
            <span>{tab.label}</span>
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
                        <defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#004C6D" stopOpacity={0.1} /><stop offset="95%" stopColor="#004C6D" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} dy={10} />
                        <YAxis hide />
                        <Tooltip contentStyle={{ backgroundColor: '#004C6D', border: 'none', borderRadius: '12px', padding: '12px', color: '#fff', fontWeight: 900, fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                        <Area type="monotone" dataKey="value" stroke="#004C6D" strokeWidth={3} fillOpacity={1} fill="url(#areaFill)" />
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
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900, fill: '#64748b' }} width={120} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none' }} formatter={(v: number) => [`${v}%`, '']} />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                          {CATEGORY_DATA.map((_, i) => <Cell key={i} fill={['#004C6D', '#10b981', '#f59e0b', '#94a3b8'][i % 4]} />)}
                          <LabelList dataKey="value" position="right" formatter={(v: number) => `${v}%`} style={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
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

            {/* ── FEEDBACK RESULTS ── */}
            {activeTab === 'feedback' && (
              <motion.div key="feedback" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                <div className={cn('flex items-center justify-between', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                  <h3 className="text-xl font-black text-primary dark:text-white tracking-tight">{ar ? 'آراء المستخدمين المُستلمة' : 'Received User Feedback'}</h3>
                  <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{feedbackEntries.length} {ar ? 'رأي' : 'entries'}</div>
                </div>

                {/* Mood summary */}
                <div className="grid grid-cols-5 gap-3">
                  {MOOD_DATA.map((m, i) => (
                    <div key={i} className="official-card p-4 flex flex-col items-center gap-2 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-lg text-center">
                      <span className="text-2xl">{m.name}</span>
                      <div className="text-lg font-black text-primary dark:text-white">{m.value}%</div>
                      <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-tight">{m.label}</div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${m.value}%` }} transition={{ duration: 1, delay: i * 0.1 }} className="h-full rounded-full" style={{ backgroundColor: m.fill }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Feedback entries */}
                <div className="space-y-4">
                  {feedbackEntries.map(entry => (
                    <div key={entry.id} className={cn('official-card p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-xl shadow-black/5 space-y-3', dir === 'rtl' ? 'text-right' : 'text-left')}>
                      <div className={cn('flex items-center justify-between gap-4', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                        <div className={cn('flex items-center gap-3', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                          <span className="text-2xl">{entry.mood}</span>
                          <div>
                            <div className="text-xs font-black text-primary dark:text-white">{entry.user}</div>
                            <span className={cn('text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg', entry.moodColor)}>{entry.moodLabel}</span>
                          </div>
                        </div>
                        <div className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-tighter shrink-0">{entry.time}</div>
                      </div>
                      {entry.text && <p className="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{entry.text}</p>}
                      <div className={cn('flex flex-wrap gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                        {entry.categories.map((cat, ci) => (
                          <span key={ci} className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10">{cat}</span>
                        ))}
                      </div>
                    </div>
                  ))}
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
                          {SHELVES.map(s => <option key={s} value={s}>{s}</option>)}
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
                          {SHELVES.map(s => <option key={s} value={s}>{s}</option>)}
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
