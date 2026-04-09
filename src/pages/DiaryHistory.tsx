import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { id, enUS, zhCN } from 'date-fns/locale';
import { BookOpen, Clock, ArrowLeft, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserDiaryArchive } from '../lib/logic';
import { UserMessage } from '../types';
import Layout from '../components/Layout';
import { cn } from '../lib/utils';
import { useLanguage } from '../lib/LanguageContext';

export default function DiaryHistory() {
  const navigate = useNavigate();
  const [diaryHistory, setDiaryHistory] = useState<UserMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const { language, t } = useLanguage();

  const filteredHistory = diaryHistory.filter(item => {
    const matchesSearch = item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const itemMonth = (new Date(item.created_at).getMonth() + 1).toString();
    const matchesMonth = selectedMonth === 'all' || itemMonth === selectedMonth;
    return matchesSearch && matchesMonth;
  });

  useEffect(() => {
    async function fetchHistory() {
      try {
        const archive = await getUserDiaryArchive();
        setDiaryHistory(archive);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const currentLocale = language === 'en' ? enUS : language === 'zh' ? zhCN : id;

  return (
    <Layout dateStr={format(new Date(), 'MMMM yyyy', { locale: currentLocale })}>
      <div className="space-y-10 py-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/home')}
            className="px-5 py-2.5 bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 rounded-2xl transition-all flex items-center gap-2 text-xs font-bold shadow-lg shadow-black/20"
          >
            <ArrowLeft className="w-4 h-4 text-pink-300" /> {t('back')}
          </button>
        </div>

        <div className="text-center space-y-3">
          <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-[0_0_25px_rgba(255,182,193,0.3)]">{t('diary_history')}</h1>
          <p className="text-sm text-pink-200 font-medium tracking-[0.2em] uppercase opacity-80">{t('diary_title')}</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-white/40" />
            </div>
            <input
              type="text"
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-4 bg-black/20 backdrop-blur-xl border border-white/10 focus:border-pink-400/50 rounded-2xl text-sm outline-none transition-all placeholder:text-white/30 text-white shadow-inner"
            />
          </div>
          <div className="relative w-full sm:w-56">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Filter className="w-4 h-4 text-white/40" />
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full pl-11 pr-8 py-4 bg-black/20 backdrop-blur-xl border border-white/10 focus:border-pink-400/50 rounded-2xl text-sm outline-none transition-all text-white shadow-inner appearance-none cursor-pointer"
            >
              <option value="all" className="bg-gray-900">{t('all_months')}</option>
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1} className="bg-gray-900">{format(new Date(2024, i, 1), 'MMMM', { locale: currentLocale })}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4 pb-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-10 h-10 rounded-full bg-pink-200 shadow-xl shadow-pink-100"
              />
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-20 opacity-50 bg-white/40 backdrop-blur-sm rounded-[2rem] border border-white/60 shadow-sm">
              <BookOpen className="w-16 h-16 mx-auto text-pink-300 mb-4" />
              <p className="text-sm italic text-gray-600">{t('no_results')}</p>
            </div>
          ) : (
            filteredHistory.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "p-6 rounded-[1.5rem] transition-all duration-300 optimize-gpu bg-white/60 backdrop-blur-md border border-white/60 hover:border-pink-200 shadow-sm hover:shadow-md space-y-3"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-500">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-pink-500 uppercase tracking-widest">
                    {format(new Date(item.created_at), 'EEEE, d MMM yyyy, HH:mm', { locale: currentLocale })}
                  </span>
                </div>
                
                <p className="text-sm text-gray-800 font-serif leading-relaxed italic pl-10 border-l-2 border-pink-100">
                  "{item.content}"
                </p>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
