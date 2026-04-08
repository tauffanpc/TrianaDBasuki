import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Heart, Send, Sparkles, MessageCircle, Share2, BookOpen, Clock } from 'lucide-react';
import { getCurrentWitaDate, getDailyMessage, getGreeting, logMood, getDayCounter, getDailyBackground, sendUserMessage, getUserDiaryArchive } from '../lib/logic';
import { Message, Greeting, UserMessage } from '../types';
import { MOODS } from '../constants';
import Layout from '../components/Layout';
import DownloadCardModal from '../components/DownloadCardModal';
import { cn } from '../lib/utils';

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
  const [diaryHistory, setDiaryHistory] = useState<UserMessage[]>([]);
  const [activeTab, setActiveTab] = useState<'beranda' | 'arsip'>('beranda');
  
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
        setDiaryHistory(archive);
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
      
      // Update rekam jejak archive dengan data yang baru terkirim secara optimis
      setDiaryHistory([{ id: Date.now().toString(), content: userCurhat, created_at: new Date().toISOString(), device_id: deviceId, is_read: false }, ...diaryHistory]);

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

  const dateStr = format(date, 'EEEE, d MMMM yyyy', { locale: id });

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
            "{greeting?.text || 'Semoga harimu menyenangkan, Sayang.'}"
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
                  {message?.message ? (
                    <TypingText text={message.message} />
                  ) : (
                    <TypingText text="Maaf Sayang, Tauffan belum menulis pesan untuk hari ini. Tapi ketahuilah bahwa dia selalu mencintaimu." />
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
           <button onClick={() => setIsDownloadOpen(true)} className="px-6 py-3 bg-white/60 backdrop-blur-xl rounded-full border border-pink-200 text-pink-600 font-bold flex items-center gap-2 hover:bg-pink-100 hover:scale-105 transition-all shadow-[0_10px_20px_-5px_rgba(236,72,153,0.3)]">
             <Share2 className="w-5 h-5" /> Share Happiness
           </button>
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
                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Bagaimana perasaanmu saat ini?</h3>
                <p className="text-xs italic text-pink-500">Pilih satu untuk memberitahu Tauffan...</p>
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
              Mood Terkirim ke Tauffan
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
              <h4 className="font-bold text-xs uppercase tracking-[0.15em] text-pink-600 italic">Diary Triana</h4>
            </div>
          
          <p className="text-xs text-gray-700 leading-relaxed italic opacity-80 backdrop-blur-sm bg-white/30 p-4 rounded-xl border border-white/40">
            "Buku harian rahasia milikku. Di sini aku bisa menulis keluh kesah, harapan, dan pikiranku tanpa takut dihakimi. Tempat aman yang hanya aku sendiri yang menyimpan, tak akan ada siapapun yang membacanya..."
          </p>

          {!showArchive ? (
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={userCurhat}
                  onChange={(e) => setUserCurhat(e.target.value)}
                  placeholder="Dear Diary, hari ini rasanya..."
                  className="w-full bg-white/80 border border-white rounded-2xl p-5 text-sm text-gray-900 focus:ring-4 focus:ring-pink-50 focus:border-pink-100 outline-none transition-all min-h-[140px] resize-none shadow-inner italic placeholder:text-gray-400 font-serif"
                />
                <button
                  onClick={handleSendCurhat}
                  disabled={isSending || !userCurhat.trim()}
                  className="absolute bottom-4 right-4 p-3.5 bg-gradient-to-r from-pink-400 to-rose-300 text-white rounded-xl shadow-lg shadow-pink-100 disabled:opacity-50 disabled:shadow-none transition-all hover:scale-105 active:scale-95 optimize-gpu"
                >
                  {isSending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <AnimatePresence>
                {sentSuccess && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-[10px] font-bold text-pink-500 flex items-center justify-center gap-1 bg-pink-50 py-2 rounded-xl"
                  >
                    <Heart className="w-3 h-3 fill-current" /> Tersimpan aman dalam Diary.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
           ) : null}
          
          {activeTab === 'arsip' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pt-2 mt-4"
            >
              <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-4">Catatan Sebelumnya</h5>
              {diaryHistory.map((item) => (
                <div key={item.id} className="p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/60 space-y-2">
                  <span className="text-[9px] font-bold text-pink-400 uppercase tracking-widest">
                    {format(new Date(item.created_at), 'd MMM yyyy, HH:mm')}
                  </span>
                  <p className="text-sm italic text-gray-800 font-serif leading-relaxed">
                    "{item.content}"
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Floating Bottom Menu for Navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-4 z-50 flex justify-center pointer-events-none">
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-2xl p-2 rounded-[2rem] flex items-center gap-2 pointer-events-auto w-full max-w-sm justify-between">
          <button 
            onClick={() => { setActiveTab('beranda'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`flex-1 flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${
              activeTab === 'beranda' ? 'bg-gradient-to-tr from-pink-500 to-rose-400 text-white shadow-lg' : 'text-gray-500 hover:bg-pink-50 hover:text-pink-600'
            }`}
          >
            <Heart className={`w-5 h-5 mb-1 ${activeTab === 'beranda' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Beranda</span>
          </button>
          
          <button 
            onClick={() => { setActiveTab('arsip'); setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100); }}
            className={`flex-1 flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${
              activeTab === 'arsip' ? 'bg-gradient-to-tr from-pink-500 to-rose-400 text-white shadow-lg' : 'text-gray-500 hover:bg-pink-50 hover:text-pink-600'
            }`}
          >
            <BookOpen className={`w-5 h-5 mb-1 ${activeTab === 'arsip' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Arsip Diary</span>
          </button>
        </div>
      </div>
      <div className="pb-24" /> {/* Spacing for the floating menu */}
    </Layout>
  );
}
