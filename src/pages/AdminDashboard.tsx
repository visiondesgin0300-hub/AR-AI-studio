import React, { useState, useMemo } from 'react';
import { Users, BookOpen, Activity, PlusCircle, Download, Trash2, Edit, X, BarChart3, ListFilter, AlertCircle, Bell, TrendingUp, Search, User as UserIcon, Settings, Clock, ShieldCheck, QrCode } from 'lucide-react';
import { ShelfAuditPanel } from '../components/ShelfAuditPanel';
import { BookCover } from '../components/BookCover';
import { MOCK_BOOKS, MOCK_USERS } from '../data/mockData';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { User, Book } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { useLanguage } from '../hooks/useLanguage';
import { useNavigate } from 'react-router-dom';

export function AdminDashboard() {
  const { t, dir, language } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'books' | 'audit' | 'logs' | 'stats'>('users');
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [books, setBooks] = useState<Book[]>(MOCK_BOOKS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: 'user' | 'book', data: any } | null>(null);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookFilter, setBookFilter] = useState('all');

  const WEEKLY_DATA = useMemo(() => [
    { day: t('saturday'), value: 400 },
    { day: t('sunday'), value: 300 },
    { day: t('monday'), value: 600 },
    { day: t('tuesday'), value: 800 },
    { day: t('wednesday'), value: 500 },
    { day: t('thursday'), value: 900 },
    { day: t('friday'), value: 700 },
  ], [t]);

  const CATEGORY_DATA = useMemo(() => [
    { name: t('computerScience'), value: 45 },
    { name: t('engineering'), value: 30 },
    { name: t('business'), value: 15 },
    { name: t('other'), value: 10 },
  ], [t]);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBooks = books.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         b.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = bookFilter === 'all' || b.category === bookFilter;
    return matchesSearch && matchesFilter;
  });

  const stats = [
    { label: t('totalUsersCount'), value: users.length, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: t('totalBooksCount'), value: books.length, icon: BookOpen, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: t('borrowedBooksCount'), value: books.filter(b => b.status === 'borrowed').length, icon: Activity, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
    { label: t('sentNotificationsCount'), value: '٤٨', icon: Bell, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/20' }
  ];

  const handleSendReminders = () => {
    setIsSendingReminders(true);
    setTimeout(() => {
      setIsSendingReminders(false);
      alert(t('remindersSentAlert'));
    }, 1500);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm(t('confirmDeleteUser'))) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleDeleteBook = (id: string) => {
    if (confirm(t('confirmDeleteBook'))) {
      setBooks(books.filter(b => b.id !== id));
    }
  };

  const handleToggleRole = (id: string) => {
    setUsers(users.map(u => 
      u.id === id ? { ...u, role: u.role === 'admin' ? 'student' : 'admin' } : u
    ));
  };

  const logs = [
    { id: 1, user: language === 'ar' ? 'فاطمة المعمري' : 'Fatima Al-Maamari', action: t('borrowBookAction'), target: t('ai'), time: language === 'ar' ? 'منذ ١٠ دقائق' : '10 mins ago' },
    { id: 2, user: language === 'ar' ? 'سارة أحمد' : 'Sara Ahmed', action: t('updateProfileAction'), target: t('settingsTarget'), time: language === 'ar' ? 'منذ ٣٠ دقيقة' : '30 mins ago' },
    { id: 3, user: language === 'ar' ? 'نظام الملاحة' : 'Navigation System', action: t('updatePathsAction'), target: t('engineeringDeptTarget'), time: language === 'ar' ? 'منذ ساعة' : '1 hour ago' },
    { id: 4, user: language === 'ar' ? 'محمد علي' : 'Mohamed Ali', action: t('returnBookAction'), target: t('software'), time: language === 'ar' ? 'منذ ساعتين' : '2 hours ago' },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const title = formData.get('title') as string;
    const shelf = formData.get('shelf') as string;
    const coverUrl = formData.get('coverUrl') as string;

    if (editingItem?.type === 'book') {
      if (editingItem.data.id) {
        setBooks(books.map(b => b.id === editingItem.data.id ? { ...b, title, shelf, coverUrl } : b));
      } else {
        const newBook: Book = {
          id: Math.random().toString(36).substr(2, 9),
          title,
          author: 'Unknown Author',
          category: 'عام',
          shelf: shelf || 'A-1',
          section: (shelf?.split('-')[0] as any) || 'A',
          description: 'New automatic description added via control panel.',
          status: 'available',
          coverUrl: coverUrl || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=300&q=80'
        };
        setBooks([newBook, ...books]);
      }
    }
    setIsModalOpen(false);
  };

  return (
    <div className={cn("space-y-12 animate-in duration-500 max-w-7xl mx-auto pb-10 font-sans", dir === 'rtl' ? 'slide-in-from-left-4 text-right' : 'slide-in-from-right-4 text-left')}>
      {/* Admin Header */}
      <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 dark:border-white/10 pb-8", dir === 'rtl' ? 'md:flex-row-reverse' : 'md:flex-row')}>
        <div className="space-y-1">
          <div className={cn("flex items-center gap-3", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
            <h2 className="text-3xl font-black text-primary dark:text-white tracking-tight">{t('systemManagement')}</h2>
            <div className="bg-primary/5 dark:bg-accent/10 text-primary dark:text-accent px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/10 dark:border-accent/20 whitespace-nowrap">
               {t('centralControlPanel')}
            </div>
          </div>
          <p className="text-slate-400 dark:text-slate-500 font-bold text-sm tracking-tight leading-relaxed">{t('fullControlDesc')}</p>
        </div>
        
        <div className={cn("flex items-center gap-4", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
           <button
             onClick={() => navigate('/qr-print')}
             className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm shadow-black/5 whitespace-nowrap"
           >
              <QrCode className="w-4 h-4 text-accent" />
              {language === 'ar' ? 'طباعة QR الأرفف' : 'Print Shelf QR'}
           </button>
           <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm shadow-black/5 whitespace-nowrap">
              <Download className="w-4 h-4" />
              {t('exportReports')}
           </button>
           <button 
             onClick={() => {
                setEditingItem({ type: 'book', data: {} });
                setIsModalOpen(true);
             }}
             className="bg-primary dark:bg-accent text-white dark:text-primary px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2 shadow-xl shadow-primary/20 dark:shadow-accent/20 whitespace-nowrap"
           >
              <PlusCircle className="w-4 h-4 text-accent dark:text-primary" />
              {t('addNewResource')}
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-right">
        {stats.map((stat, idx) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn("official-card p-8 group hover:border-primary/20 dark:hover:border-accent/20 transition-all bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5", dir === 'rtl' ? 'text-right' : 'text-left')}
          >
            <div className={cn("flex items-start justify-between mb-4", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
              <div className={cn("p-4 rounded-2xl shadow-inner", stat.bg)}>
                 <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest leading-relaxed">{t('updatedNow')}</div>
            </div>
            <div className="space-y-1">
               <div className="text-4xl font-black text-primary dark:text-white tracking-tighter font-mono">{stat.value}</div>
               <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs Selection */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 p-2 rounded-[2rem] w-fit mx-auto lg:mx-0 shadow-inner flex-wrap justify-center">
         {[
           { id: 'users', label: t('usersTab'), icon: Users },
           { id: 'books', label: t('libraryTab'), icon: BookOpen },
           { id: 'audit', label: t('shelfAuditTab'), icon: ShieldCheck },
           { id: 'stats', label: t('statsTab'), icon: BarChart3 },
           { id: 'logs', label: t('logsTab'), icon: Activity },
         ].map((tab) => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id as any)}
             className={cn(
               "flex items-center gap-3 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
               activeTab === tab.id 
                 ? "bg-white dark:bg-slate-800 text-primary dark:text-accent shadow-xl shadow-black/5" 
                 : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
             )}
           >
             <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-accent" : "text-slate-400")} />
             <span>{tab.label}</span>
           </button>
         ))}
      </div>

      {/* Main Content Sections */}
      <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-10", dir === 'rtl' ? 'xl:flex-row-reverse' : 'xl:flex-row')}>
         <div className={cn("lg:col-span-2 space-y-8", dir === 'rtl' ? 'order-last lg:order-first' : '')}>
            <AnimatePresence mode="wait">
               {activeTab === 'users' && (
                  <motion.div 
                    key="users"
                    initial={{ opacity: 0, x: dir === 'rtl' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }}
                    className="space-y-8"
                  >
                     <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4", dir === 'rtl' ? 'sm:flex-row-reverse' : 'sm:flex-row')}>
                        <h3 className="text-xl font-black text-primary dark:text-white tracking-tight">{t('userManagementTitle')}</h3>
                        <div className="relative w-full sm:w-auto">
                           <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400", dir === 'rtl' ? 'right-4' : 'left-4')} />
                           <input 
                             type="text" 
                             placeholder={t('searchUserPlaceholder')} 
                             value={searchQuery}
                             onChange={(e) => setSearchQuery(e.target.value)}
                             className={cn("py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 outline-none w-full sm:w-64 text-slate-900 dark:text-slate-100 placeholder:text-slate-400/50", dir === 'rtl' ? 'pr-10 pl-6' : 'pl-10 pr-6')} 
                           />
                        </div>
                     </div>
                     <div className={cn("official-card overflow-hidden bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5", dir === 'rtl' ? 'text-right' : 'text-left')}>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                             <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                <tr className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                                   <th className="px-6 py-5 whitespace-nowrap">{t('userTableHead')}</th>
                                   <th className="px-6 py-5 whitespace-nowrap">{t('roleTableHead')}</th>
                                   <th className="px-6 py-5 text-center whitespace-nowrap">{t('actionsTableHead')}</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {filteredUsers.map((user) => (
                                   <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                      <td className="px-6 py-5">
                                         <div className={cn("flex items-center gap-4", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                                            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-primary dark:text-accent shadow-sm shrink-0">{user.name[0]}</div>
                                            <div className={cn(dir === 'rtl' ? 'text-right' : 'text-left')}>
                                               <div className="text-xs font-black text-primary dark:text-white">{user.name}</div>
                                               <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold leading-relaxed">{user.email}</div>
                                            </div>
                                         </div>
                                      </td>
                                      <td className="px-6 py-5">
                                         <button 
                                           onClick={() => handleToggleRole(user.id)}
                                           className={cn(
                                             "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border whitespace-nowrap",
                                             user.role === 'admin' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30"
                                           )}
                                         >
                                           {user.role === 'admin' ? t('adminRole') : t('studentRole')}
                                         </button>
                                      </td>
                                      <td className="px-6 py-5">
                                         <div className="flex items-center justify-center gap-2">
                                           <button className="p-2.5 text-slate-400 hover:text-primary dark:hover:text-accent transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-white/10 shadow-sm"><Edit className="w-4 h-4" /></button>
                                           <button onClick={() => handleDeleteUser(user.id)} className="p-2.5 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent hover:border-red-100 dark:hover:border-red-900/50 shadow-sm"><Trash2 className="w-4 h-4" /></button>
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

               {activeTab === 'books' && (
                  <motion.div 
                    key="books"
                    initial={{ opacity: 0, x: dir === 'rtl' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }}
                    className="space-y-8"
                  >
                     <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4", dir === 'rtl' ? 'sm:flex-row-reverse' : 'sm:flex-row')}>
                        <h3 className="text-xl font-black text-primary dark:text-white tracking-tight">{t('libraryManagementTitle')}</h3>
                        <div className={cn("flex items-center gap-3 w-full sm:w-auto", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                           <select 
                             value={bookFilter}
                             onChange={(e) => setBookFilter(e.target.value)}
                             className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[10px] font-black uppercase px-4 py-2.5 rounded-xl outline-none focus:ring-2 ring-primary/5 text-slate-900 dark:text-slate-100 cursor-pointer"
                           >
                              <option value="all">{t('allCategories')}</option>
                              <option value="علوم">{t('science')}</option>
                              <option value="فيزياء">{t('physics')}</option>
                              <option value="هندسة">{t('engineering')}</option>
                              <option value="تقنية">{t('tech')}</option>
                           </select>
                           <div className="relative flex-1 sm:flex-initial">
                              <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400", dir === 'rtl' ? 'right-4' : 'left-4')} />
                              <input 
                                type="text" 
                                placeholder={t('searchPlaceholderAdmin')} 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={cn("py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 outline-none w-full sm:w-48 transition-all focus:sm:w-64 text-slate-900 dark:text-slate-100", dir === 'rtl' ? 'pr-10 pl-6' : 'pl-10 pr-6')} 
                              />
                           </div>
                           <button 
                             onClick={() => {
                               setEditingItem({ type: 'book', data: {} });
                               setIsModalOpen(true);
                             }}
                             className="bg-primary dark:bg-accent text-white dark:text-primary p-3 rounded-xl shadow-lg hover:scale-105 transition-all shrink-0"
                           >
                             <PlusCircle className="w-5 h-5" />
                           </button>
                        </div>
                     </div>
                     <div className={cn("official-card overflow-hidden bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5", dir === 'rtl' ? 'text-right' : 'text-left')}>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                             <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-white/10 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                <tr className={dir === 'rtl' ? 'text-right' : 'text-left'}>
                                   <th className="px-6 py-5 whitespace-nowrap">{t('bookTableHead')}</th>
                                   <th className="px-6 py-5 whitespace-nowrap">{t('statusTableHead')}</th>
                                   <th className="px-6 py-5 text-center whitespace-nowrap">{t('actionsTableHead')}</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {filteredBooks.map((book) => (
                                   <tr key={book.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                      <td className="px-6 py-5">
                                         <div className={cn("flex items-center gap-4", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                                            <BookCover book={book} className="w-12 h-16 rounded-xl shadow-md border-2 border-slate-100 dark:border-white/5 shrink-0 overflow-hidden" />
                                            <div className={cn(dir === 'rtl' ? 'text-right' : 'text-left')}>
                                               <div className="text-xs font-black text-primary dark:text-white truncate max-w-[180px] sm:max-w-[250px] leading-tight">{book.title}</div>
                                               <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 uppercase tracking-widest">{book.author}</div>
                                            </div>
                                         </div>
                                      </td>
                                      <td className="px-6 py-5">
                                         <span className={cn(
                                           "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border whitespace-nowrap",
                                           book.status === 'borrowed' ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50"
                                         )}>
                                           {book.status === 'borrowed' ? t('borrowedStatus') : t('availableStatus')}
                                         </span>
                                      </td>
                                      <td className="px-6 py-5 text-center">
                                         <div className="flex items-center justify-center gap-2">
                                           <button 
                                             onClick={() => {
                                               setEditingItem({ type: 'book', data: book });
                                               setIsModalOpen(true);
                                             }}
                                             className="p-2.5 text-slate-400 hover:text-primary dark:hover:text-accent transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent shadow-sm"
                                           >
                                             <Edit className="w-4 h-4" />
                                           </button>
                                           <button onClick={() => handleDeleteBook(book.id)} className="p-2.5 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent shadow-sm"><Trash2 className="w-4 h-4" /></button>
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

               {activeTab === 'audit' && (
                 <motion.div
                    key="audit"
                    initial={{ opacity: 0, x: dir === 'rtl' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }}
                 >
                   <ShelfAuditPanel />
                 </motion.div>
               )}

               {activeTab === 'logs' && (
                 <motion.div
                    key="logs"
                    initial={{ opacity: 0, x: dir === 'rtl' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }}
                    className="space-y-8"
                 >
                   <h3 className="text-xl font-black text-primary dark:text-white tracking-tight">{t('digitalActivityLogs')}</h3>
                   <div className="space-y-4">
                     {logs.map((log) => (
                       <div key={log.id} className={cn("official-card p-6 flex items-center gap-6 border-slate-100 dark:border-white/5 hover:border-primary/20 dark:hover:border-accent/20 transition-all bg-white dark:bg-slate-900 shadow-xl shadow-black/5", dir === 'rtl' ? 'flex-row-reverse text-right' : 'flex-row text-left')}>
                         <div className="w-14 h-14 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary dark:text-accent border border-slate-100 dark:border-white/5 shrink-0">
                           <Activity className="w-6 h-6 opacity-40 dark:opacity-60" />
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className={cn("flex items-center gap-3", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                             <span className="text-sm font-black text-primary dark:text-white truncate">{log.user}</span>
                             <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest whitespace-nowrap">{log.action}</div>
                           </div>
                           <div className="text-[11px] font-black text-accent uppercase tracking-[0.2em] mt-1.5 leading-relaxed">{log.target}</div>
                         </div>
                         <div className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-tighter shrink-0">{log.time}</div>
                       </div>
                     ))}
                   </div>
                 </motion.div>
               )}

               {activeTab === 'stats' && (
                 <motion.div 
                    key="stats"
                    initial={{ opacity: 0, x: dir === 'rtl' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }}
                    className="space-y-8"
                 >
                   <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4", dir === 'rtl' ? 'sm:flex-row-reverse' : 'sm:flex-row')}>
                      <h3 className="text-xl font-black text-primary dark:text-white tracking-tight">{t('dataAnalysisTitle')}</h3>
                      <div className="flex bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 p-1 rounded-xl">
                         <button className="px-5 py-2 bg-white dark:bg-slate-800 text-primary dark:text-accent text-[10px] font-black rounded-lg shadow-sm">{t('weeklyChart')}</button>
                         <button className="px-5 py-2 text-slate-400 dark:text-slate-500 text-[10px] font-black">{t('monthlyChart')}</button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 gap-8">
                     {/* Activity Chart */}
                     <div className="official-card p-6 md:p-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5">
                        <div className={cn("flex flex-col sm:flex-row items-center justify-between mb-10 gap-4", dir === 'rtl' ? 'sm:flex-row-reverse' : 'sm:flex-row')}>
                           <div className={cn("space-y-1", dir === 'rtl' ? 'text-right' : 'text-left')}>
                              <h4 className="text-sm font-black text-primary dark:text-white uppercase tracking-tight leading-relaxed">{t('cumulativeActivity')}</h4>
                              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed">{t('cumulativeActivityDesc')}</p>
                           </div>
                           <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                              <TrendingUp className="w-4 h-4" />
                              <span className="text-xs font-black font-mono">+١٢٪</span>
                           </div>
                        </div>
                        <div className="h-80 w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={WEEKLY_DATA} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                 <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor="#004C6D" stopOpacity={0.1}/>
                                       <stop offset="95%" stopColor="#004C6D" stopOpacity={0}/>
                                    </linearGradient>
                                 </defs>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={window.matchMedia('(prefers-color-scheme: dark)').matches ? '#334155' : '#f1f5f9'} />
                                 <XAxis 
                                   dataKey="day" 
                                   axisLine={false} 
                                   tickLine={false} 
                                   tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} 
                                   dy={15}
                                 />
                                 <YAxis hide />
                                 <Tooltip 
                                   contentStyle={{ 
                                     backgroundColor: '#004C6D', 
                                     border: 'none', 
                                     borderRadius: '16px',
                                     padding: '16px',
                                     color: '#fff',
                                     fontFamily: 'inherit',
                                     fontWeight: 900,
                                     fontSize: '12px',
                                     boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                                   }}
                                   itemStyle={{ color: '#fff' }}
                                 />
                                 <Area 
                                   type="monotone" 
                                   dataKey="value" 
                                   stroke="#004C6D" 
                                   strokeWidth={4}
                                   fillOpacity={1} 
                                   fill="url(#colorValue)" 
                                   animationDuration={2000}
                                 />
                              </AreaChart>
                           </ResponsiveContainer>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className={cn("official-card p-6 md:p-10 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5 flex flex-col", dir === 'rtl' ? 'text-right' : 'text-left')}>
                          <h4 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-10 leading-relaxed">{t('knowledgeCampusMap')}</h4>
                          <div className="h-64 w-full flex-1">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={CATEGORY_DATA} layout="vertical" margin={{ left: -30 }}>
                                   <XAxis type="number" hide />
                                   <YAxis 
                                     dataKey="name" 
                                     type="category" 
                                     axisLine={false} 
                                     tickLine={false}
                                     tick={{ fontSize: 11, fontWeight: 900, fill: '#64748b' }}
                                     width={120}
                                   />
                                   <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                   <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                                      {CATEGORY_DATA.map((entry, index) => (
                                         <Cell key={`cell-${index}`} fill={['#004C6D', '#10b981', '#f59e0b', '#94a3b8'][index % 4]} />
                                      ))}
                                   </Bar>
                                </BarChart>
                             </ResponsiveContainer>
                          </div>
                       </div>

                       <div className="official-card p-6 md:p-10 flex flex-col items-center justify-center text-center space-y-8 bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-2xl shadow-black/5">
                          <div className="relative">
                             <div className="w-32 h-32 rounded-full border-[8px] border-slate-100 dark:border-slate-800 flex items-center justify-center shadow-inner">
                                <div className="w-28 h-28 rounded-full border-[8px] border-accent border-t-transparent animate-spin-slow"></div>
                             </div>
                             <div className="absolute inset-0 flex flex-col items-center justify-center text-2xl font-black text-primary dark:text-white">
                                <span className="font-mono">٩٤٪</span>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 tracking-widest uppercase mt-1 leading-relaxed">{t('efficiency')}</span>
                             </div>
                          </div>
                          <div className="space-y-2">
                             <div className="text-lg font-black text-primary dark:text-white tracking-tight leading-tight">{t('academicSatisfaction')}</div>
                             <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed max-w-[200px]">{t('academicSatisfactionDesc')}</p>
                          </div>
                       </div>
                     </div>
                   </div>
                 </motion.div>
               )}
            </AnimatePresence>
         </div>

         {/* Sidebar Actions/Settings */}
         <div className="space-y-10">
            <div className="space-y-8">
               <div className={cn("space-y-2", dir === 'rtl' ? 'text-right' : 'text-left')}>
                  <h3 className="text-xl font-black text-primary dark:text-white tracking-tight leading-tight">{t('sovereignOperations')}</h3>
                  <div className={cn("w-12 h-1.5 bg-accent rounded-full", dir === 'rtl' ? 'mr-0 ml-auto' : 'ml-0 mr-auto')}></div>
               </div>
               
               <div className="grid grid-cols-1 gap-5">
                  {[
                    { id: 'sync', label: t('updateInventory'), icon: ListFilter, desc: t('syncDatabases') },
                    { id: 'reminders', label: t('expiryWarnings'), icon: AlertCircle, desc: t('alertProtocol') },
                    { id: 'settings', label: t('envConfig'), icon: Settings, desc: t('operationalParams') }
                  ].map((action) => (
                    <button 
                      key={action.id} 
                      onClick={() => action.id === 'reminders' && handleSendReminders()}
                      disabled={isSendingReminders && action.id === 'reminders'}
                      className={cn(
                        "official-card p-6 md:p-8 flex items-center gap-6 group transition-all bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-xl shadow-black/5",
                        isSendingReminders && action.id === 'reminders' ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-[1.02]",
                        dir === 'rtl' ? 'flex-row-reverse text-right' : 'flex-row text-left'
                      )}
                    >
                       <div className="w-14 h-14 rounded-[1.5rem] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:text-primary dark:group-hover:text-accent transition-all border border-slate-200 dark:border-white/10 shadow-sm shrink-0">
                          {isSendingReminders && action.id === 'reminders' ? (
                            <Clock className="w-6 h-6 animate-spin text-accent" />
                          ) : (
                            <action.icon className="w-6 h-6" />
                          )}
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="text-xs font-black text-primary dark:text-white uppercase tracking-wider group-hover:text-accent dark:group-hover:text-accent transition-colors truncate">
                            {isSendingReminders && action.id === 'reminders' ? (language === 'ar' ? 'بروتوكول الإرسال نشط...' : 'Sending protocol active...') : action.label}
                          </div>
                          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mt-1.5 leading-tight truncate">{action.desc}</div>
                       </div>
                    </button>
                  ))}
               </div>
            </div>

            {/* Quick Helper */}
            <div className={cn("official-card p-8 md:p-10 bg-primary dark:bg-slate-950 text-white relative overflow-hidden shadow-[0_40px_80px_rgba(15,67,129,0.3)] dark:shadow-none border-0", dir === 'rtl' ? 'text-right' : 'text-left')}>
               <div className={cn("absolute top-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mt-24", dir === 'rtl' ? 'left-0 -ml-24' : 'right-0 -mr-24')}></div>
               <div className={cn("absolute bottom-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -mb-16", dir === 'rtl' ? 'right-0 -mr-16' : 'left-0 -ml-16')}></div>
               
               <div className="relative z-10 space-y-8">
                  <div className={cn("flex items-center gap-4", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                     <div className="relative shrink-0">
                        <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></div>
                        <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-400 rounded-full"></div>
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 leading-relaxed whitespace-nowrap">{t('connectionReliability')}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-xl font-black leading-tight tracking-tight">{t('operationalStatusStable')}</h4>
                    <p className="text-[11px] text-white/50 font-bold leading-relaxed">{t('allSystemsStable')}</p>
                  </div>

                  <div className="pt-6 border-t border-white/10 space-y-4">
                     <div className={cn("flex justify-between items-center text-[10px] font-black uppercase tracking-widest", dir === 'rtl' ? 'flex-row-reverse' : 'flex-row')}>
                        <span>{t('computingOccupancy')}</span>
                        <span className="text-accent">٤٢٪ {t('enabledStatus')}</span>
                     </div>
                     <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden p-0.5">
                        <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: "42%" }}
                           transition={{ duration: 2, ease: "easeOut" }}
                           className="h-full bg-accent shadow-[0_0_15px_rgba(217,179,16,0.5)] rounded-full" 
                        />
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* Simplified CRUD Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary/40 dark:bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[3.5rem] shadow-[0_100px_200px_rgba(0,0,0,0.4)] relative border border-slate-100 dark:border-white/5"
            >
              <button 
                onClick={() => setIsModalOpen(false)}
                className={cn("absolute top-10 p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary dark:hover:text-accent rounded-2xl transition-all hover:rotate-90", dir === 'rtl' ? 'left-10' : 'right-10')}
              >
                <X className="w-6 h-6" />
              </button>

              <form onSubmit={handleSave} className="space-y-10">
                <div className="text-center space-y-2">
                   <div className="text-[11px] font-black text-accent uppercase tracking-[0.5em] mb-2 leading-relaxed">{language === 'ar' ? 'إدارة البيانات' : 'Data Management'}</div>
                  <h3 className="text-3xl font-black text-primary dark:text-white tracking-tight leading-tight">
                    {editingItem?.data?.id ? t('updateRecord') : t('depositKnowledge')}
                  </h3>
                </div>

                <div className="space-y-6">
                   <div className={cn("space-y-3", dir === 'rtl' ? 'text-right' : 'text-left')}>
                      <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">{t('titleLabel')}</label>
                      <input 
                        name="title"
                        type="text" 
                        defaultValue={editingItem?.data?.title || ''}
                        className={cn("w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 p-5 rounded-2xl text-sm font-black outline-none focus:border-accent/40 dark:focus:border-accent/40 transition-all text-primary dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700", dir === 'rtl' ? 'text-right' : 'text-left')} 
                        placeholder={t('titlePlaceholder')} 
                        required
                      />
                   </div>
                   <div className={cn("space-y-3", dir === 'rtl' ? 'text-right' : 'text-left')}>
                      <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">{t('shelfLabel')}</label>
                      <input 
                        name="shelf"
                        type="text" 
                        defaultValue={editingItem?.data?.shelf || ''}
                        className={cn("w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 p-5 rounded-2xl text-sm font-black outline-none focus:border-accent/40 dark:focus:border-accent/40 transition-all text-primary dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700", dir === 'rtl' ? 'text-right' : 'text-left font-mono')} 
                        placeholder={t('shelfPlaceholder')} 
                      />
                   </div>
                   <div className={cn("space-y-3", dir === 'rtl' ? 'text-right' : 'text-left')}>
                      <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">{t('mediaLinkLabel')}</label>
                      <input 
                        name="coverUrl"
                        type="text" 
                        defaultValue={editingItem?.data?.coverUrl || ''}
                        className={cn("w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/10 p-5 rounded-2xl text-sm font-black outline-none focus:border-accent/40 dark:focus:border-accent/40 transition-all text-primary dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700", dir === 'rtl' ? 'text-right' : 'text-left font-mono')} 
                        placeholder="https://visuals.unsplash.com/..." 
                      />
                   </div>
                </div>

                <div className={cn("flex flex-col sm:flex-row gap-4", dir === 'rtl' ? 'sm:flex-row-reverse' : 'sm:flex-row')}>
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-5 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-3xl font-black text-xs uppercase tracking-widest hover:text-primary dark:hover:text-white transition-all shadow-sm active:scale-95"
                  >
                    {t('cancel')}
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] bg-primary dark:bg-accent text-white dark:text-primary py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_20px_40px_rgba(217,179,16,0.2)] active:scale-95"
                  >
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
