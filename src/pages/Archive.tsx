import React, { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { Message } from '../types';
import { format, subDays, isAfter, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { getCurrentWitaDate } from '../lib/logic';
import Layout from '../components/Layout';
import { motion } from 'motion/react';
import { Calendar, Lock, ChevronRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Archive() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const today = getCurrentWitaDate();

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

  // Generate last 30 days
  const archiveDays = Array.from({ length: 30 }).map((_, i) => {
    const date = subDays(today, i);
    const day = date.getDate();
    const month = date.getMonth() + 1;

    const msg = messages.find(m => m.day === day && (m.month === month || m.month === null));
    const isToday = isSameDay(date, today);
    const isFuture = isAfter(date, today);

    return {
      date,
      message: msg,
      isToday,
      isFuture
    };
  });

  return (
    <Layout dateStr={format(today, 'MMMM yyyy', { locale: id })}>
      <div className="space-y-10 py-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate('/home')}
            className="px-4 py-2 bg-white/40 backdrop-blur-md border border-white/60 text-gray-500 hover:text-pink-500 rounded-2xl transition-all flex items-center gap-2 text-xs font-bold shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </button>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Arsip Pesan</h1>
          <p className="text-sm text-pink-600 font-medium tracking-wide">Kenangan yang telah kita lewati</p>
        </div>

        <div className="space-y-4">
          {archiveDays.map((item, idx) => (
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
                    {format(item.date, 'EEEE, d MMM', { locale: id })}
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
                    "{item.message?.message || "Aku mencintaimu lebih dari kemarin."}"
                  </p>
                  <ChevronRight className={cn("w-4 h-4 flex-shrink-0", item.isToday ? "text-white/40" : "text-pink-300")} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
