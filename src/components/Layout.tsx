import React from 'react';
import { motion } from 'motion/react';
import { Heart, LogOut, X, Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { AnimatePresence } from 'motion/react';
import { getSupabase } from '../lib/supabase';
import { Theme } from '../types';
import { DEFAULT_THEMES } from '../constants';

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

export default function Layout({ children, dayCounter, dateStr, customBg, fullWidth }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith('/admin');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);
  const [currentTheme, setCurrentTheme] = React.useState<Partial<Theme>>(DEFAULT_THEMES[0]);

  React.useEffect(() => {
    const fetchTheme = async () => {
      try {
        const supabase = getSupabase();
        const { data: themes, error } = await supabase
          .from('themes')
          .select('*')
          .eq('is_active', true);

        if (error) {
          if (error.code === 'PGRST205') {
            console.warn('Themes table not found, using defaults.');
            applyTheme(DEFAULT_THEMES[0]);
            return;
          }
          throw error;
        }

        const activeThemes = themes && themes.length > 0 ? themes : DEFAULT_THEMES;
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const dayOfMonth = now.getDate();

        // Priority 1: Specific Date
        let selectedTheme = activeThemes.find(t => t.schedule_type === 'specific_date' && t.scheduled_date === todayStr);
        
        // Priority 2: Daily Rotation
        if (!selectedTheme) {
          const rotationThemes = activeThemes.filter(t => t.schedule_type === 'daily_rotation');
          if (rotationThemes.length > 0) {
            selectedTheme = rotationThemes.find(t => t.rotation_day === dayOfMonth) || 
                            rotationThemes[(dayOfMonth - 1) % rotationThemes.length];
          }
        }

        // Priority 3: Always On (Default)
        if (!selectedTheme) {
          selectedTheme = activeThemes.find(t => t.schedule_type === 'always') || activeThemes[0];
        }

        applyTheme(selectedTheme);
      } catch (err) {
        applyTheme(DEFAULT_THEMES[0]);
      }
    };

    const applyTheme = (theme: Partial<Theme>) => {
      setCurrentTheme(theme);
      const root = document.documentElement;
      root.style.setProperty('--primary-color', theme.primary_color || DEFAULT_THEMES[0].primary_color);
      root.style.setProperty('--secondary-color', theme.secondary_color || DEFAULT_THEMES[0].secondary_color);
      root.style.setProperty('--accent-color', theme.accent_color || DEFAULT_THEMES[0].accent_color);
      root.style.setProperty('--bg-gradient', theme.background_gradient || DEFAULT_THEMES[0].background_gradient);

      // Apply custom CSS
      const styleId = 'custom-theme-styles';
      let styleTag = document.getElementById(styleId);
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

    fetchTheme();
  }, []);

  const handleUserLogout = () => {
    localStorage.removeItem('first_visit_date');
    navigate('/');
  };

  const currentBg = customBg || currentTheme.background_url || 'var(--bg-gradient)';
  const isHome = location.pathname === '/home' || location.pathname === '/';
  const isImageUrl = !isHome && (currentBg.startsWith('http') || currentBg.startsWith('https') || currentBg.startsWith('data:'));
  const isGradient = currentBg.includes('gradient') || currentBg.startsWith('var(');

  return (
    <div 
      className="min-h-screen text-[#4a4a4a] font-sans selection:bg-pink-100 selection:text-pink-600 relative transition-all duration-1000"
      style={{ 
        backgroundImage: isImageUrl ? `url(${currentBg})` : (isGradient ? currentBg : undefined),
        backgroundColor: (!isImageUrl && !isGradient) ? currentBg : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Container for custom HTML injection */}
      <div id="custom-theme-html" className="fixed inset-0 pointer-events-none z-0 overflow-hidden" />
      <FloatingHearts />

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

        {!isAdmin && (
          <div className="flex flex-col items-end text-[9px] text-[var(--primary-color)] font-bold uppercase tracking-[0.15em]">
            <span className="opacity-50">{dateStr}</span>
            {dayCounter !== undefined && (
              <span className="bg-[var(--primary-color)]/80 text-white px-2 py-0.5 rounded-full mt-1 shadow-sm">
                Day {dayCounter}
              </span>
            )}
          </div>
        )}
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
          <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md bg-white/30 backdrop-blur-lg border border-white/20 px-8 py-3.5 flex justify-around items-center z-50 rounded-[2rem] shadow-xl shadow-pink-100/20 optimize-gpu">
            <Link
              to="/home"
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-300",
                location.pathname === '/home' ? "text-[var(--primary-color)] scale-105" : "text-gray-400 hover:text-[var(--secondary-color)]"
              )}
            >
              <Heart className={cn("w-5 h-5", location.pathname === '/home' ? "fill-current" : "")} />
              <span className="text-[9px] font-bold uppercase tracking-widest">Beranda</span>
            </Link>
            <Link
              to="/archive"
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-300",
                location.pathname === '/archive' ? "text-[var(--primary-color)] scale-105" : "text-gray-400 hover:text-[var(--secondary-color)]"
              )}
            >
              <X className={cn("w-5 h-5", location.pathname === '/archive' ? "rotate-45" : "")} />
              <span className="text-[9px] font-bold uppercase tracking-widest">Arsip</span>
            </Link>
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="flex flex-col items-center gap-1 text-gray-400 hover:text-red-400 transition-all duration-300"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-[9px] font-bold uppercase tracking-widest">Keluar</span>
            </button>
          </nav>

          {/* Logout Modal */}
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
                    <h3 className="text-lg font-bold text-gray-800">Mau pergi, Sayang?</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Kenangan kita hari ini akan selalu tersimpan di hati. Sampai jumpa lagi ya...
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsLogoutModalOpen(false)}
                      className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-200 transition-all"
                    >
                      Batal
                    </button>
                    <button 
                      onClick={handleUserLogout}
                      className="flex-1 py-3 bg-[var(--primary-color)] text-white rounded-xl font-bold text-xs shadow-lg shadow-pink-100 hover:opacity-90 transition-all"
                    >
                      Ya, Keluar
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
