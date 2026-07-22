import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, MapPin, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../hooks/useLanguage';
import { MOCK_BOOKS } from '../data/mockData';
import { RafeeqAvatar } from './RafeeqAvatar';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestedBookIds?: string[];
}

interface LibrarianChatProps {
  onClose: () => void;
}

export function LibrarianChat({ onClose }: LibrarianChatProps) {
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: t('librarianGreeting') },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: 'user' as const, content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/librarian-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.map(({ role, content }) => ({ role, content })) }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: 'assistant', content: data.reply || t('librarianError'), suggestedBookIds: data.suggestedBookIds }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: t('librarianError') }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="fixed inset-x-4 bottom-4 top-20 sm:inset-auto sm:bottom-6 sm:end-6 sm:w-[420px] sm:h-[620px] z-[70] flex flex-col bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden"
        dir={dir}
      >
        {/* Header with Omani character */}
        <div className="flex items-center justify-between px-5 py-4 bg-primary dark:bg-slate-950 text-white shrink-0 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-[#01354C] pointer-events-none" />
          <div className={cn('absolute top-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 pointer-events-none', dir === 'rtl' ? 'right-0' : 'left-0')} />

          <div className={cn('relative z-10 flex items-center gap-3', dir === 'rtl' ? 'flex-row-reverse' : '')}>
            {/* Omani character avatar */}
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex items-end justify-center p-0.5 shrink-0"
            >
              <RafeeqAvatar className="w-full h-full" />
            </motion.div>

            <div className={cn(dir === 'rtl' ? 'text-right' : 'text-left')}>
              <div className="text-base font-black tracking-wide">{t('librarianTitle')}</div>
              <div className="text-[10px] font-bold text-accent uppercase tracking-widest">{t('librarianSubtitle')}</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative z-10 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                'flex items-end gap-2',
                m.role === 'user'
                  ? (dir === 'rtl' ? 'justify-end' : 'justify-end')
                  : (dir === 'rtl' ? 'justify-start flex-row-reverse' : 'justify-start')
              )}
            >
              {/* Tiny avatar next to AI messages */}
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-slate-800 border border-primary/10 dark:border-white/10 overflow-hidden flex items-end justify-center shrink-0 mb-0.5">
                  <RafeeqAvatar className="w-full h-full" />
                </div>
              )}

              <div className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] font-semibold leading-relaxed whitespace-pre-wrap',
                m.role === 'user'
                  ? 'bg-primary dark:bg-accent text-white dark:text-primary rounded-br-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-md'
              )}>
                {m.content}
                {m.suggestedBookIds && m.suggestedBookIds.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {m.suggestedBookIds.map((id) => {
                      const book = MOCK_BOOKS.find((b) => b.id === id);
                      if (!book) return null;
                      return (
                        <div key={id} className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
                          <button
                            onClick={() => { navigate(`/book/${id}`); onClose(); }}
                            className="flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-primary dark:text-accent text-[11px] font-black hover:brightness-95 transition-all"
                          >
                            <BookOpen className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{book.title}</span>
                          </button>
                          <button
                            onClick={() => { navigate('/map', { state: { bookId: id } }); onClose(); }}
                            title={t('goToShelf')}
                            className="w-8 h-8 shrink-0 rounded-xl bg-accent text-primary flex items-center justify-center hover:brightness-110 transition-all"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className={cn('flex items-end gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
              <div className="w-8 h-8 rounded-xl bg-primary/10 dark:bg-slate-800 border border-primary/10 dark:border-white/10 overflow-hidden flex items-end justify-center shrink-0">
                <RafeeqAvatar className="w-full h-full" />
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-slate-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-slate-100 dark:border-white/5 shrink-0">
          <div className={cn('flex items-center gap-2', dir === 'rtl' ? 'flex-row-reverse' : '')}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              placeholder={t('librarianPlaceholder')}
              className={cn(
                'flex-1 py-3 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 text-primary dark:text-white rounded-2xl text-[13px] font-semibold focus:outline-none focus:ring-2 focus:ring-accent',
                dir === 'rtl' ? 'text-right' : 'text-left'
              )}
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-11 h-11 shrink-0 rounded-2xl bg-accent text-primary flex items-center justify-center hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95"
            >
              <Send className={cn('w-4 h-4', dir === 'rtl' ? 'rotate-180' : '')} />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
