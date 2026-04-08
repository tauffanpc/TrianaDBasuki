import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Sparkles, Flame, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FloatingHearts } from '../components/Layout';
import { useLanguage } from '../lib/LanguageContext';

export default function Intro() {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const handleEnter = () => {
    // Trigger day counter by setting first visit if not exists
    if (!localStorage.getItem('first_visit_date')) {
      localStorage.setItem('first_visit_date', new Date().toISOString());
    }
    
    setShowPopup(true);
    
    // Romantic delay before entering
    setTimeout(() => {
      navigate('/home');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#fffafa] flex flex-col items-center justify-center p-6 overflow-hidden relative font-relaxed">
      {/* Background Decorations */}
      <FloatingHearts />

      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-50">
        <button 
          onClick={() => {
            const nextLang = language === 'id' ? 'en' : language === 'en' ? 'zh' : 'id';
            setLanguage(nextLang);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-full shadow-xl hover:bg-pink-600 transition-all border-2 border-white group"
        >
          <Globe className="w-4 h-4 font-bold group-hover:rotate-12 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-widest px-1">
            {language === 'en' ? 'English (EN)' : language === 'id' ? 'Bahasa (ID)' : '中文 (ZH)'}
          </span>
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="text-center z-10 space-y-10"
      >
        <div className="relative inline-block">
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 3, -3, 0]
            }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="w-36 h-36 bg-white rounded-full shadow-[0_15px_40px_rgba(255,182,193,0.3)] flex items-center justify-center mx-auto border-[8px] border-pink-50/40 relative optimize-gpu"
          >
            <Heart className="w-16 h-16 text-pink-400 fill-pink-400 heart-pulse" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
              className="absolute inset-0 border border-dashed border-pink-200/50 rounded-full"
            />
          </motion.div>
          <motion.div
            animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="absolute -top-4 -right-4 text-yellow-300/60"
          >
            <Sparkles className="w-8 h-8" />
          </motion.div>
        </div>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            <h2 className="text-pink-600 text-xl mb-1 font-medium tracking-wide">{t('for_my_love')},</h2>
            <h1 className="text-4xl font-bold tracking-tight leading-tight text-gray-900">
              <span className="text-romantic-gradient">
                Triana D. Basuki
              </span>
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="relative px-4"
          >
            <p className="text-gray-700 text-base max-w-[280px] mx-auto leading-relaxed font-medium italic">
              {t('intro_message')}
            </p>
          </motion.div>
        </div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          whileHover={{ scale: 1.03, boxShadow: "0 20px 40px rgba(244,114,182,0.3)" }}
          whileTap={{ scale: 0.97 }}
          onClick={handleEnter}
          className="px-12 py-5 bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-full font-bold shadow-xl shadow-pink-100 transition-all flex items-center gap-3 mx-auto group relative overflow-hidden optimize-gpu"
        >
          <span className="relative z-10 text-base tracking-widest uppercase">{t('open_message')}</span>
          <Heart className="w-5 h-5 fill-current group-hover:scale-110 transition-transform relative z-10" />
        </motion.button>
      </motion.div>

      {/* Heart on Fire Popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="relative inline-block">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    filter: ["drop-shadow(0 0 10px #ff4d4d)", "drop-shadow(0 0 30px #ff4d4d)", "drop-shadow(0 0 10px #ff4d4d)"]
                  }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Heart className="w-24 h-24 text-red-500 fill-red-500" />
                </motion.div>
                <motion.div
                  animate={{ 
                    y: [-10, -30, -10],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="absolute -top-8 left-1/2 -translate-x-1/2 text-orange-500"
                >
                  <Flame className="w-12 h-12 fill-current" />
                </motion.div>
              </div>
              <motion.h2 
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-2xl font-bold text-gray-900 italic"
              >
                {t('welcome_back')}
              </motion.h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5 }}
        onClick={() => navigate('/admin-login')}
        className="absolute bottom-10 text-[10px] text-gray-500 uppercase tracking-[0.3em] font-bold cursor-pointer hover:text-pink-600 transition-colors"
      >
        Made with love, Tauffan Abdi
      </motion.div>
    </div>
  );
}
