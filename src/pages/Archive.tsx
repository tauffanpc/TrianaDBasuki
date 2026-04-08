import React, { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { Message } from '../types';
import { format, subDays, isAfter, isSameDay } from 'date-fns';
import { id, enUS, zhCN } from 'date-fns/locale';
import { getCurrentWitaDate } from '../lib/logic';
import Layout from '../components/Layout';
import { motion } from 'motion/react';
import { Calendar, Lock, ChevronRight, ArrowLeft, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useLanguage } from '../lib/LanguageContext';

export default function Archive() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const today = getCurrentWitaDate();
  const { language, t } = useLanguage();

  useEffect(() => {
    async function fetchArchive() {
      try {
        const supabase = getSupabase();
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('is_active', true)
          .order('day', { ascending: true });

        setMessages(data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchArchive();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');

  // Generate all days from start of year to today
  const startOfYearDate = new Date(today.getFullYear(), 0, 1);
  const diffTime = today.getTime() - startOfYearDate.getTime();
  const daysSinceStartOfYear = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const allDays = Array.from({ length: daysSinceStartOfYear }).map((_, i) => {
    const date = subDays(today, i);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const possibleMsgs = messages.filter(m => 
      m.day === day && 
      (m.month === month || m.month === null) &&
      (m.year === year || m.year === null)
    );
    
    // Sort to prioritize exact year > exact month > general
    possibleMsgs.sort((a, b) => {
      if (a.year !== b.year) return a.year ? -1 : 1;
      if (a.month !== b.month) return a.month ? -1 : 1;
      return 0;
    });
    
    const msg = possibleMsgs[0];
    const isToday = isSameDay(date, today);
    const isFuture = isAfter(date, today);

    return {
      date,
      message: msg,
      isToday,
      isFuture
    };
  });

  const filteredArchive = allDays.filter(item => {
    const defaultMsg = "Aku mencintaimu lebih dari kemarin.";
    const textToSearch = item.message?.message || defaultMsg;
    const matchesSearch = textToSearch.toLowerCase().includes(searchTerm.toLowerCase());
    const itemMonth = (item.date.getMonth() + 1).toString();
    const matchesMonth = selectedMonth === 'all' || itemMonth === selectedMonth;
    return matchesSearch && matchesMonth;
  });

  const currentLocale = language === 'en' ? enUS : language === 'zh' ? zhCN : id;

  return (
    <Layout dateStr={format(today, 'MMMM yyyy', { locale: currentLocale })}>
      <div className="space-y-10 py-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/home')}
            className="px-4 py-2 bg-white/40 backdrop-blur-md border border-white/60 text-gray-500 hover:text-pink-500 rounded-2xl transition-all flex items-center gap-2 text-xs font-bold shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> {t('back')}
          </button>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">{t('archive')}</h1>
          <p className="text-sm text-pink-600 font-medium tracking-wide">Kenangan yang telah kita lewati</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/60 backdrop-blur-md border border-white/60 focus:border-pink-300 rounded-2xl text-sm outline-none transition-all placeholder:text-gray-400 text-gray-800 shadow-sm"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Filter className="w-4 h-4 text-gray-400" />
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full pl-11 pr-8 py-3 bg-white/60 backdrop-blur-md border border-white/60 focus:border-pink-300 rounded-2xl text-sm outline-none transition-all text-gray-800 shadow-sm appearance-none cursor-pointer"
            >
              <option value="all">{t('all_months')}</option>
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>{format(new Date(2024, i, 1), 'MMMM', { locale: currentLocale })}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredArchive.length === 0 ? (
            <div className="text-center py-20 opacity-50 bg-white/40 backdrop-blur-sm rounded-[2rem] border border-white/60 shadow-sm">
              <Calendar className="w-16 h-16 mx-auto text-pink-300 mb-4" />
              <p className="text-sm italic text-gray-600">{t('no_results')}</p>
            </div>
          ) : (
            filteredArchive.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={cn(
                "p-5 rounded-[1.5rem] border transition-all duration-300 optimize-gpu",
                item.isToday
                  ? "bg-gradient-to-br from-pink-500 to-rose-400 border-transparent text-white shadow-lg shadow-pink-100"
                  : item.isFuture
                  ? "bg-white/20 border-white/30 opacity-30 grayscale-[0.8]"
                  : "glass-card hover:border-pink-100 hover:shadow-md"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center",
                    item.isToday ? "bg-white/20" : "bg-pink-50"
                  )}>
                    <Calendar className={cn("w-3.5 h-3.5", item.isToday ? "text-white" : "text-pink-400")} />
                  </div>
                  <span className={cn(
                    "text-[11px] font-bold tracking-wider uppercase",
                    item.isToday ? "text-white" : "text-gray-700"
                  )}>
                    {format(item.date, 'EEEE, d MMM', { locale: currentLocale })}
                  </span>
                </div>
                {item.isToday && (
                  <span className="bg-white text-pink-600 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-sm">
                    Hari Ini
                  </span>
                )}
                {item.isFuture && <Lock className="w-3.5 h-3.5 text-gray-500" />}
              </div>

              {item.isFuture ? (
                <p className="text-[11px] text-gray-500 italic">Pesan ini masih terkunci...</p>
              ) : (
                <div className="flex justify-between items-end gap-5">
                  <p className={cn(
                    "text-sm leading-relaxed italic font-medium",
                    item.isToday ? "text-white/90" : "text-gray-800"
                  )}>
                    "{language === 'en' && item.message?.message_en ? item.message.message_en : language === 'zh' && item.message?.message_zh ? item.message.message_zh : (item.message?.message || "Aku mencintaimu lebih dari kemarin.")}"
                  </p>
                  <ChevronRight className={cn("w-4 h-4 flex-shrink-0", item.isToday ? "text-white/40" : "text-pink-300")} />
                </div>
              )}
            </motion.div>
          )))}
        </div>
      </div>
    </Layout>
  );
}
