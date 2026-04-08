import React from 'react';
import { motion } from 'motion/react';
import { Heart, LogOut, X, Sparkles, Menu, BookOpen, Archive as ArchiveIcon, Home, Globe } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { AnimatePresence } from 'motion/react';
import { getSupabase } from '../lib/supabase';
import { Theme } from '../types';
import { DEFAULT_THEMES, getDefaultThemeForToday } from '../constants';
import { useLanguage } from '../lib/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

interface LayoutProps {
  children: React.ReactNode;
  dayCounter?: number;
  dateStr?: string;
  customBg?: string;
  fullWidth?: boolean;
}

export function FloatingHearts() {
  const hearts = React.useMemo(() => Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    duration: 10 + Math.random() * 15,
    delay: Math.random() * 15,
    size: 12 + Math.random() * 8,
    xOffset: Math.sin(i) * 100
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          initial={{ opacity: 0, y: -50, rotate: 0 }}
          animate={{ 
            opacity: [0, 0.5, 0], 
            y: '110vh',
            x: [0, heart.xOffset, 0],
            rotate: 360
          }}
          transition={{ 
            duration: heart.duration, 
            repeat: Infinity, 
            delay: heart.delay,
            ease: "linear"
          }}
          className="absolute text-[var(--primary-color)]/30 optimize-gpu"
          style={{ left: heart.left }}
        >
          <Heart className="fill-current" style={{ width: heart.size, height: heart.size }} />
        </motion.div>
      ))}
    </div>
  );
}

export function HeartConfetti() {
  const petals = React.useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: Math.random() * 5,
    duration: 5 + Math.random() * 5,
    size: 20 + Math.random() * 20,
    rotate: Math.random() * 360
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {petals.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -100, x: 0, opacity: 0, rotate: p.rotate }}
          animate={{ 
            y: '100vh',
            x: [0, 50, -50, 0],
            opacity: [0, 1, 1, 0],
            rotate: p.rotate + 360
          }}
          transition={{ 
            duration: p.duration, 
            repeat: Infinity, 
            delay: p.delay,
            ease: "linear"
          }}
          className="absolute"
          style={{ left: p.left }}
        >
          <Sparkles className="text-[var(--primary-color)] fill-current" style={{ width: p.size, height: p.size }} />
        </motion.div>
      ))}
    </div>
  );
}

export default function Layout({ children, dayCounter, dateStr, customBg, fullWidth }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith('/admin');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [currentTheme, setCurrentTheme] = React.useState<Partial<Theme>>(getDefaultThemeForToday());
  const { language, setLanguage, t } = useLanguage();

  React.useEffect(() => {
    const applyTheme = (theme: Partial<Theme>) => {
      setCurrentTheme(theme);
      const root = document.documentElement;
      const fallback = getDefaultThemeForToday();
      root.style.setProperty('--primary-color', theme.primary_color || fallback.primary_color!);
      root.style.setProperty('--secondary-color', theme.secondary_color || fallback.secondary_color!);
      root.style.setProperty('--accent-color', theme.accent_color || fallback.accent_color!);
      root.style.setProperty('--bg-gradient', theme.background_gradient || fallback.background_gradient!);

      // Apply custom CSS
      const styleId = 'custom-theme-styles';
      let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = styleId;
        document.head.appendChild(styleTag);
      }
      styleTag.innerHTML = theme.custom_css || '';

      // Apply custom HTML
      const htmlContainer = document.getElementById('custom-theme-html');
      if (htmlContainer) {
        htmlContainer.innerHTML = theme.custom_html || '';
      }
    };

    const fetchTheme = async () => {
      // Terapkan tema default hari ini dulu (rotasi otomatis tanpa Supabase)
      applyTheme(getDefaultThemeForToday());

      try {
        const supabase = getSupabase();
        const { data: themes, error } = await supabase
          .from('themes')
          .select('*')
          .eq('is_active', true);

        if (error) {
          // Tabel themes belum dibuat — gunakan default, tidak perlu log error
          return;
        }

        if (!themes || themes.length === 0) {
          // Belum ada tema di DB — rotasi default sudah diterapkan di atas
          return;
        }

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const dayOfMonth = now.getDate();

        // Prioritas 1: Tanggal spesifik
        let selectedTheme = themes.find(
          (t) => t.schedule_type === 'specific_date' && t.scheduled_date === todayStr
        );

        // Prioritas 2: Rotasi harian — cari rotation_day yang cocok, fallback modulo
        if (!selectedTheme) {
          const rotationThemes = themes.filter((t) => t.schedule_type === 'daily_rotation');
          if (rotationThemes.length > 0) {
            selectedTheme =
              rotationThemes.find((t) => t.rotation_day === dayOfMonth) ||
              rotationThemes[(dayOfMonth - 1) % rotationThemes.length];
          }
        }

        // Prioritas 3: Selalu aktif
        if (!selectedTheme) {
          selectedTheme = themes.find((t) => t.schedule_type === 'always') || themes[0];
        }

        if (selectedTheme) applyTheme(selectedTheme);
      } catch (err) {
        // Supabase gagal — tema default sudah diterapkan, tidak perlu tindakan
      }
    };

    fetchTheme();
  }, []);

  const handleUserLogout = () => {
    localStorage.removeItem('first_visit_date');
    navigate('/');
  };

  // Prioritas background: 
  // 1. Jika ada customBg dari prop (Background harian), gunakan itu
  // 2. Jika ada background_url dari tema DB, gunakan it
  // 3. Fallback ke gradien tema
  const currentBg = customBg || currentTheme.background_url || 'var(--bg-gradient)';
  
  // Deteksi jika tema aktif adalah tema spesial untuk efek tambahan
  const isSpecialTheme = currentTheme.name?.toLowerCase().includes('anniversary') || 
                        currentTheme.name?.toLowerCase().includes('ultah') ||
                        currentTheme.name?.toLowerCase().includes('birthday');
  const isHome = location.pathname === '/home' || location.pathname === '/';

  return (
    <div className={cn(
      "min-h-screen relative overflow-x-hidden text-[var(--primary-color)] selection:bg-pink-200 pointer-events-auto transition-colors duration-1000",
      fullWidth ? "bg-white/10 backdrop-blur-[2px]" : ""
    )}>
      {/* Background layer */}
      <div 
        className="fixed inset-0 -z-10 transition-all duration-1000"
        style={{
          backgroundImage: customBg ? `url(${customBg})` : (
            currentTheme?.background_url?.startsWith('http') 
              ? `url(${currentTheme.background_url})` 
              : 'var(--bg-gradient)'
          ),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          opacity: fullWidth ? 0.9 : 1
        }}
      />
      <div id="custom-theme-html" className="fixed inset-0 pointer-events-none z-0 overflow-hidden" />
      <FloatingHearts />
      {isSpecialTheme && <HeartConfetti />}

      <header className="fixed top-0 left-0 right-0 z-50 bg-white/30 backdrop-blur-md border-b border-white/10 px-8 py-4 flex justify-between items-center shadow-sm optimize-gpu">
        <Link to="/home" className="flex items-center gap-4 group">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="w-14 h-14 bg-white/80 rounded-[2rem] flex items-center justify-center shadow-xl shadow-pink-200/40 border-2 border-white group-hover:scale-110 transition-transform"
          >
            <Heart className="w-8 h-8 text-[var(--primary-color)] fill-[var(--primary-color)] drop-shadow-sm" />
          </motion.div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-display font-bold text-[var(--primary-color)] leading-none text-2xl tracking-tight italic drop-shadow-sm">Triana's</span>
              <Sparkles className="w-3 h-3 text-pink-300 animate-pulse" />
            </div>
            <span className="text-[var(--secondary-color)] text-[10px] leading-none mt-1.5 font-bold uppercase tracking-[0.4em] opacity-80">Daily Love</span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {(location.pathname === '/admin-login' || !location.pathname.startsWith('/admin')) && (
            <LanguageSwitcher />
          )}

          {!isAdmin && (
            <div className="flex flex-col items-end text-[9px] text-[var(--primary-color)] font-bold uppercase tracking-[0.15em]">
              <span className="opacity-50">{dateStr}</span>
              {dayCounter !== undefined && (
                <span className="bg-[var(--primary-color)]/80 text-white px-2 py-0.5 rounded-full mt-1 shadow-sm">
                  {t('day_counter', { count: dayCounter })}
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <main className={cn(
        "pt-28 pb-36 px-6 relative z-10",
        fullWidth ? "w-full max-w-7xl mx-auto" : "max-w-lg mx-auto"
      )}>
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {children}
        </motion.div>

        {!isAdmin && (
          <div className="mt-20 text-center opacity-30 hover:opacity-100 transition-opacity duration-500 pb-10">
            <p className="text-[9px] text-[var(--primary-color)] font-bold uppercase tracking-[0.4em]">
              Made with love, Tauffan Abdi
            </p>
          </div>
        )}
      </main>

      {!isAdmin && (
        <>
          {/* Floating Action Menu */}
          <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
            
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-2 pointer-events-auto items-end mb-2"
                >
                  <button 
                    onClick={() => { setIsMenuOpen(false); navigate('/home'); }}
                    className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg hover:bg-pink-50 transition-all border border-pink-100 group"
                  >
                    <span className="text-xs font-bold text-gray-700 group-hover:text-pink-600 transition-colors">{t('home')}</span>
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 group-hover:scale-110 transition-transform">
                      <Home className="w-4 h-4" />
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => { setIsMenuOpen(false); navigate('/archive'); }}
                    className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg hover:bg-pink-50 transition-all border border-pink-100 group"
                  >
                    <span className="text-xs font-bold text-gray-700 group-hover:text-pink-600 transition-colors">{t('archive')}</span>
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 group-hover:scale-110 transition-transform">
                      <ArchiveIcon className="w-4 h-4" />
                    </div>
                  </button>

                  <button 
                    onClick={() => { setIsMenuOpen(false); navigate('/diary-history'); }}
                    className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg hover:bg-pink-50 transition-all border border-pink-100 group"
                  >
                    <span className="text-xs font-bold text-gray-700 group-hover:text-pink-600 transition-colors">{t('diary_history')}</span>
                    <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 group-hover:scale-110 transition-transform">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  </button>

                  <button 
                    onClick={() => { setIsMenuOpen(false); setIsLogoutModalOpen(true); }}
                    className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-lg hover:bg-red-50 transition-all border border-red-100 group"
                  >
                    <span className="text-xs font-bold text-gray-700 group-hover:text-red-500 transition-colors">{t('logout')}</span>
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                      <LogOut className="w-4 h-4" />
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="pointer-events-auto px-5 py-3.5 bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-full shadow-xl shadow-pink-200/50 flex items-center gap-2 border border-white/20"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <>
                  <span className="font-bold text-sm tracking-wide">Menu</span>
                  <Sparkles className="w-4 h-4 opacity-80" />
                </>
              )}
            </motion.button>
          </div>

          <AnimatePresence>
            {isLogoutModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsLogoutModalOpen(false)}
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-white rounded-[2rem] p-8 shadow-2xl relative z-10 w-full max-w-xs text-center space-y-6"
                >
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center">
                      <Heart className="w-8 h-8 text-[var(--primary-color)] fill-[var(--primary-color)] animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-gray-800">{t('logout_confirm_title')}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-line">
                      {t('logout_confirm_desc')}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsLogoutModalOpen(false)}
                      className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all"
                    >
                      {t('cancel')}
                    </button>
                    <button 
                      onClick={handleUserLogout}
                      className="flex-1 py-3 bg-[var(--primary-color)] text-white rounded-xl font-bold text-xs shadow-lg shadow-pink-100 hover:opacity-90 transition-all"
                    >
                      {t('logout')}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
