import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { id, enUS, zhCN } from 'date-fns/locale';
import { Heart, Send, Sparkles, MessageCircle, Share2, BookOpen, Clock } from 'lucide-react';
import { getCurrentWitaDate, getDailyMessage, getGreeting, logMood, getDayCounter, getDailyBackground, sendUserMessage, getUserDiaryArchive } from '../lib/logic';
import { Message, Greeting, UserMessage } from '../types';
import { MOODS } from '../constants';
import Layout from '../components/Layout';
import DownloadCardModal from '../components/DownloadCardModal';
import { cn } from '../lib/utils';
import { useLanguage } from '../lib/LanguageContext';

function TypingText({ text, speed = 40 }: { text: string; speed?: number }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isDone, setIsDone] = useState(false);
  
  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    setIsDone(false);
    if (!text) return;
    
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, index + 1));
      index++;
      if (index >= text.length) {
        clearInterval(interval);
        setIsDone(true);
      }
    }, speed);
    
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className="relative">
      {displayedText}
      {!isDone && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-[3px] h-[1.2em] bg-[var(--primary-color)] ml-1 align-middle"
        />
      )}
    </span>
  );
}

export default function Landing() {
  const [searchParams] = useSearchParams();
  const previewDate = searchParams.get('preview_date');

  const [date, setDate] = useState<Date>(getCurrentWitaDate(previewDate));
  const [message, setMessage] = useState<Message | null>(null);
  const [greeting, setGreeting] = useState<Greeting | null>(null);
  const [dayCount, setDayCount] = useState<number>(0);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [hasSelectedMood, setHasSelectedMood] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [background, setBackground] = useState<string | null>(null);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const { language, t } = useLanguage();
  
  // User Curhat State
  const [userCurhat, setUserCurhat] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    const moodSelected = localStorage.getItem(`mood_selected_${format(new Date(), 'yyyy-MM-dd')}`);
    if (moodSelected) {
      setHasSelectedMood(true);
      setSelectedMood(moodSelected);
    }
  }, []);

  useEffect(() => {
    async function init() {
      setLoading(true);
      setError(null);
      try {
        const currentWita = getCurrentWitaDate(previewDate);
        setDate(currentWita);

        let firstVisit = localStorage.getItem('first_visit_date');
        if (!firstVisit) {
          // Set first visit menggunakan WITA
          firstVisit = currentWita.toISOString();
          localStorage.setItem('first_visit_date', firstVisit);
        }
        setDayCount(getDayCounter(firstVisit));

        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
          deviceId = Math.random().toString(36).substring(7);
          localStorage.setItem('device_id', deviceId);
        }

        const [msg, greet, bg, archive] = await Promise.all([
          getDailyMessage(currentWita),
          getGreeting(),
          getDailyBackground(currentWita),
          getUserDiaryArchive(deviceId)
        ]);

        setMessage(msg);
        setGreeting(greet);
        if (bg) setBackground(bg.url);
        if (bg) setBackground(bg.url);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [previewDate]);

  const handleMoodSelect = async (mood: string) => {
    setSelectedMood(mood);
    setHasSelectedMood(true);
    localStorage.setItem(`mood_selected_${format(new Date(), 'yyyy-MM-dd')}`, mood);
    
    try {
      let deviceId = localStorage.getItem('device_id');
      if (!deviceId) {
        deviceId = Math.random().toString(36).substring(7);
        localStorage.setItem('device_id', deviceId);
      }
      await logMood(mood, deviceId);
    } catch (err) {
      console.error('Failed to log mood:', err);
    }
  };

  const handleSendCurhat = async () => {
    if (!userCurhat.trim()) return;
    setIsSending(true);
    try {
      let deviceId = localStorage.getItem('device_id') || 'unknown';
      await sendUserMessage(userCurhat, deviceId);
      setSentSuccess(true);
      setUserCurhat('');
      
      setUserCurhat('');

      setTimeout(() => setSentSuccess(false), 3000);
    } catch (err: any) {
      alert("Gagal mengirim pesan: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fffafa]">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-16 h-16 rounded-full bg-pink-200 shadow-xl shadow-pink-100"
        />
      </div>
    );
  }

  const currentLocale = language === 'en' ? enUS : language === 'zh' ? zhCN : id;
  const dateStr = format(date, 'EEEE, d MMMM yyyy', { locale: currentLocale });

  return (
    <Layout dayCounter={dayCount} dateStr={dateStr} customBg={background || undefined}>
      <div className="space-y-12 py-4">
        {/* Greeting Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/40 backdrop-blur-md rounded-full text-pink-600 border border-white/60 shadow-sm">
            <Heart className="w-3 h-3 fill-current animate-pulse" />
            <Sparkles className="w-4 h-4" />
            <Heart className="w-3 h-3 fill-current animate-pulse" />
          </div>
          <h2 className="text-lg md:text-xl font-display font-medium text-gray-900 leading-tight italic px-4">
            "{language === 'en' && greeting?.text_en ? greeting.text_en : language === 'zh' && greeting?.text_zh ? greeting.text_zh : (greeting?.text || t('dear_diary'))}"
          </h2>
        </motion.div>

        {/* Main Message Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            boxShadow: [
              "0 15px 40px -12px rgba(255,182,193,0.15)",
              "0 15px 40px -12px rgba(255,182,193,0.3)",
              "0 15px 40px -12px rgba(255,182,193,0.15)"
            ]
          }}
          transition={{ 
            delay: 0.2,
            boxShadow: { repeat: Infinity, duration: 6 }
          }}
          className="glass-card rounded-[2.5rem] p-10 relative overflow-hidden group optimize-gpu border-2 border-white/80"
        >
          <div className="absolute -top-10 -right-10 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700">
            <Heart className="w-48 h-48 text-pink-500 fill-current" />
          </div>
          
          {/* Subtle paper texture/lines */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #ec4899 31px, #ec4899 32px)' }} />
          
          <div className="relative z-10 space-y-8 py-4">
            <div className="flex items-center justify-center gap-6">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-pink-200" />
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-400 rounded-3xl flex items-center justify-center shadow-xl shadow-pink-200/50 transform -rotate-6 group-hover:rotate-0 transition-transform duration-500">
                <Heart className="w-8 h-8 text-white fill-current animate-pulse" />
              </div>
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-pink-200" />
            </div>
            
            <div className="min-h-[140px] max-h-[450px] overflow-y-auto no-scrollbar flex items-center justify-center px-4">
              <div className="w-full">
                <p className="text-sm md:text-base text-gray-900 leading-relaxed font-sans font-medium italic whitespace-pre-wrap text-center">
                  {message ? (
                    <TypingText text={language === 'en' && message.message_en ? message.message_en : language === 'zh' && message.message_zh ? message.message_zh : message.message} />
                  ) : (
                    <TypingText text={t('no_message_today')} />
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-center items-center gap-2 opacity-30">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-pink-200 to-transparent" />
              <Sparkles className="w-4 h-4 text-pink-400" />
            </div>
          </div>
        </motion.div>

        {/* Share Happiness Button */}
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex justify-center -mt-6 relative z-20">
           <motion.button 
             whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(236,72,153,0.4)" }}
             whileTap={{ scale: 0.95 }}
             onClick={() => setIsDownloadOpen(true)} className="px-6 py-3 bg-white/60 backdrop-blur-xl rounded-full border border-pink-200 text-pink-600 font-bold flex items-center gap-2 transition-all shadow-[0_10px_20px_-5px_rgba(236,72,153,0.3)]">
             <Share2 className="w-5 h-5" /> {t('share_happiness')}
           </motion.button>
        </motion.div>

        <DownloadCardModal 
           isOpen={isDownloadOpen} 
           onClose={() => setIsDownloadOpen(false)} 
           message={message} 
           greeting={greeting} 
           currentBg={background || 'var(--bg-gradient)'} 
        />

        {/* Mood Selection */}
        <AnimatePresence>
          {!hasSelectedMood && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6 overflow-hidden"
            >
              <div className="text-center space-y-2">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{t('mood_question')}</h3>
                <p className="text-xs italic text-pink-500">{t('mood_hint')}</p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-4 px-4">
                {MOODS.map((mood) => (
                  <motion.button
                    key={mood.type}
                    whileHover={{ 
                      scale: 1.1, 
                      y: -8,
                      boxShadow: "0 20px 25px -5px rgba(236, 72, 153, 0.2)"
                    }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleMoodSelect(mood.type)}
                    className={cn(
                      "w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 optimize-gpu flex-shrink-0",
                      selectedMood === mood.type 
                        ? "bg-romantic-gradient border-transparent text-white shadow-xl shadow-pink-200" 
                        : "bg-white/80 backdrop-blur-md border-white text-gray-700 hover:border-pink-200 shadow-sm"
                    )}
                  >
                    <span className="text-xl md:text-2xl filter drop-shadow-sm transform group-hover:scale-110 transition-transform">{mood.emoji}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mood Selection Confirmation (Optional, just a small hint) */}
        {hasSelectedMood && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-50 rounded-full text-[10px] font-bold text-pink-500 uppercase tracking-widest border border-pink-100">
              <Heart className="w-3 h-3 fill-current" />
              {t('mood_sent')}
            </div>
          </motion.div>
        )}

        {/* Diary Triana */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-[2rem] p-8 space-y-5 optimize-gpu relative overflow-hidden"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-pink-50 rounded-xl flex items-center justify-center text-pink-500">
                <BookOpen className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-xs uppercase tracking-[0.15em] text-pink-600 italic">{t('diary_title')}</h4>
            </div>
          </div>
          
          <p className="text-xs text-gray-700 leading-relaxed italic opacity-80 backdrop-blur-sm bg-white/30 p-4 rounded-xl border border-white/40">
            {t('diary_description')}
          </p>

          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={userCurhat}
                onChange={(e) => setUserCurhat(e.target.value)}
                placeholder={t('curhat_placeholder')}
                className="w-full bg-pink-50/50 border border-pink-100 focus:border-pink-300 rounded-3xl p-6 text-sm text-gray-800 focus:ring-4 focus:ring-pink-100/50 outline-none transition-all min-h-[160px] resize-none shadow-inner italic placeholder:text-gray-400 font-serif leading-relaxed"
              />
              <button
                onClick={handleSendCurhat}
                disabled={isSending || !userCurhat.trim()}
                className="absolute bottom-6 right-6 p-3.5 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-2xl shadow-lg shadow-pink-200 disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105 active:scale-95 optimize-gpu"
              >
                {isSending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4 ml-0.5" />
                )}
              </button>
            </div>
            <AnimatePresence>
              {sentSuccess && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-[10px] font-bold text-pink-500 flex items-center justify-center gap-1.5 bg-pink-50 py-2.5 rounded-xl border border-pink-100"
                >
                  <Heart className="w-3 h-3 fill-current" /> {t('curhat_sent')}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
