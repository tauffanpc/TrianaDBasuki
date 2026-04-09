import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Image as ImageIcon, Sparkles, Heart } from 'lucide-react';
import { Message, Greeting } from '../types';
import { format } from 'date-fns';
import { id, enUS, zhCN } from 'date-fns/locale';
import { useLanguage } from '../lib/LanguageContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
  greeting: Greeting | null;
  currentBg: string;
}

export default function DownloadCardModal({ isOpen, onClose, message, greeting, currentBg }: Props) {
  const [resolution, setResolution] = useState<'2:3' | '9:16'>('2:3');
  const [cardTheme, setCardTheme] = useState<'glass' | 'polaroid' | 'vintage' | 'landing' | 'elegant'>('glass');
  const [isDownloading, setIsDownloading] = useState(false);
  const [base64Bg, setBase64Bg] = useState<string | null>(null);
  const { language, t } = useLanguage();
  
  const currentLocale = language === 'en' ? enUS : language === 'zh' ? zhCN : id;
  const currentMessageText = language === 'en' && message?.message_en ? message.message_en : language === 'zh' && message?.message_zh ? message.message_zh : message?.message;
  const currentGreetingText = language === 'en' && greeting?.text_en ? greeting.text_en : language === 'zh' && greeting?.text_zh ? greeting.text_zh : greeting?.text;
  
  const cardRef = useRef<HTMLDivElement>(null);
  
  const w = 1080;
  const h = resolution === '9:16' ? 1920 : 1620;

  React.useEffect(() => {
    if (isOpen && currentBg.startsWith('http')) {
      fetch(currentBg)
        .then(res => res.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => setBase64Bg(reader.result as string);
          reader.readAsDataURL(blob);
        })
        .catch(err => console.error('Failed to convert bg to base64:', err));
    } else {
      setBase64Bg(currentBg);
    }
  }, [isOpen, currentBg]);

  const handleDownload = async () => {
    if (!cardRef.current || !(window as any).html2canvas) {
      alert("Library html2canvas belum termuat. Coba refresh browser Anda.");
      return;
    }
    setIsDownloading(true);
    
    // Simpan posisi scroll
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    
    try {
      const originalCard = cardRef.current;
      
      // PAKSA UKURAN ASLI 1:1 UNTUK CAPTURE (Tanpa Scale)
      const canvas = await (window as any).html2canvas(originalCard, {
        scale: 3, // Kualitas ultra tajam
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        width: w,
        height: h,
        windowWidth: w,
        windowHeight: h,
        onclone: (clonedDoc: any) => {
          try {
            // == 1. FULL STYLE INLINING (PRECISION) ==
            const clonedCard = clonedDoc.getElementById('card-capture-target');
            if (clonedCard) {
              const inlineAllStyles = (sourceEl: HTMLElement, targetEl: HTMLElement) => {
                const computed = window.getComputedStyle(sourceEl);
                
                // Salin SEMUA properti yang tersedia
                for (let i = 0; i < computed.length; i++) {
                  const prop = computed[i];
                  let val = computed.getPropertyValue(prop);
                  
                  // Sanitasi oklab tetap wajib agar tidak crash
                  if (val && (val.includes('oklch') || val.includes('oklab'))) {
                    if (val.includes('0.5') || val.includes('0.6')) val = '#ec4899';
                    else if (val.includes('0.9')) val = '#ffffff';
                    else val = '#ec4899';
                  }

                  // FIX: Kunci line-height agar tidak tumpang tindih
                  if (prop === 'line-height' && (val === 'normal' || val === '0px' || !val)) {
                    val = '1.4'; 
                  }
                  
                  if (val) targetEl.style.setProperty(prop, val, 'important');
                }
                
                // Tambahan: Force rendering teks agar tajam dan tidak bertumpuk
                targetEl.style.webkitFontSmoothing = 'antialiased';
                targetEl.style.textRendering = 'optimizeLegibility';
                
                // Rekursif untuk semua anak
                for (let i = 0; i < sourceEl.children.length; i++) {
                  if (targetEl.children[i]) {
                    inlineAllStyles(sourceEl.children[i] as HTMLElement, targetEl.children[i] as HTMLElement);
                  }
                }
              };

              inlineAllStyles(originalCard, clonedCard);

              // Paksa layout absolut agar tidak terpengaruh sisa CSS
              clonedCard.style.cssText += `
                display: flex !important;
                flex-direction: column !important;
                width: ${w}px !important;
                min-width: ${w}px !important;
                height: ${h}px !important;
                min-height: ${h}px !important;
                transform: none !important;
                position: relative !important;
                margin: 0 !important;
                top: 0 !important;
                left: 0 !important;
                overflow: hidden !important;
              `;
            }

            // == 2. SMART CLEANUP (TAHAN FONT) ==
            // Hanya hapus stylesheet yang bukan Font
            const links = Array.from(clonedDoc.querySelectorAll('link[rel="stylesheet"]'));
            links.forEach((link: any) => {
              const href = link.getAttribute('href') || '';
              // JANGAN hapus jika itu Google Fonts atau font eksternal
              if (!href.includes('fonts.googleapis') && !href.includes('fonts.gstatic') && !href.includes('font')) {
                link.remove();
              }
            });
            
            // Hapus tag style internal (Tailwind hasil build) yang mengandung oklab
            const styles = Array.from(clonedDoc.querySelectorAll('style'));
            styles.forEach((style: any) => {
              if (style.textContent && (style.textContent.includes('oklch') || style.textContent.includes('oklab'))) {
                style.remove();
              }
            });
            
          } catch (e) {
            console.error('Perfect Preview error:', e);
          }
        }
      });

      window.scrollTo(scrollX, scrollY);

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Triana_DailyLove_${format(new Date(), 'dd_MMM_yyyy')}.png`;
      link.click();
      
      onClose();
    } catch (err: any) {
      console.error('Failed to download card:', err);
      alert('Maaf, terjadi kesalahan: ' + (err.message || err.toString()));
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

  const getBackgroundStyle = () => {
    const bgToUse = base64Bg || currentBg;
    if (cardTheme === 'glass') {
      return {
        backgroundImage: bgToUse.startsWith('http') || bgToUse.startsWith('data:') ? `url(${bgToUse})` : bgToUse,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    if (cardTheme === 'polaroid') {
      return {
        backgroundColor: '#f5f5f4',
        backgroundImage: 'radial-gradient(#e5e5e5 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      };
    }
    if (cardTheme === 'vintage') {
      return {
        backgroundColor: '#fef3c7',
        backgroundImage: 'linear-gradient(rgba(120, 53, 15, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(120, 53, 15, 0.05) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      };
    }
    if (cardTheme === 'landing') {
      return {
        backgroundImage: bgToUse.startsWith('http') || bgToUse.startsWith('data:') ? `url(${bgToUse})` : bgToUse,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    if (cardTheme === 'elegant') {
      return {
        backgroundColor: '#0f172a',
        backgroundImage: 'radial-gradient(ellipse at top, #1e293b, transparent)',
      };
    }
    return {};
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 max-w-4xl w-full flex flex-col md:flex-row gap-8 max-h-[85dvh] overflow-y-auto shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-pink-100 text-gray-500 hover:text-pink-600 transition-colors z-20">
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 flex flex-col items-center justify-center bg-gray-100/50 rounded-3xl p-4 overflow-hidden relative min-h-[400px]">
          <div className="relative transform-origin-top flex items-center justify-center" style={{ width: '100%', height: '100%' }}>
            
            <div 
              ref={cardRef}
              id="card-capture-target"
              style={{ 
                width: `${w}px`, 
                height: `${h}px`, 
                transform: `scale(0.25)`, 
                transformOrigin: 'center center',
                position: 'absolute',
                ...getBackgroundStyle()
              }}
              className="overflow-hidden flex flex-col shadow-2xl relative"
            >
              {cardTheme === 'glass' && (
                <div className="absolute inset-x-8 inset-y-16 flex flex-col items-center justify-center">
                  <div className="w-[88%] bg-white/35 backdrop-blur-3xl rounded-[4rem] border-4 border-white/60 p-16 md:p-24 flex flex-col items-center text-center shadow-2xl overflow-hidden" style={{ boxShadow: '0 30px 60px -12px rgba(236,72,153,0.25)' }}>
                    <Heart className="w-20 h-20 animate-pulse mb-10" style={{ color: '#ec4899', fill: '#ec4899' }} />
                    <h2 className="text-[3.5rem] leading-tight font-display italic mb-12 px-8" style={{ color: '#111827' }}>
                      "{currentGreetingText || t('for_my_love')}"
                    </h2>
                    <div className="flex-1 flex items-center justify-center py-6">
                      <p className="text-[2.75rem] leading-relaxed font-serif px-10 italic" style={{ color: '#1f2937' }}>
                        {currentMessageText || t('no_message_today')}
                      </p>
                    </div>
                    <div className="mt-14 w-48 h-1.5 bg-gradient-to-r from-transparent via-[#f472b6] to-transparent rounded-full" />
                    <div className="mt-10 flex flex-col items-center text-center">
                      <div style={{ color: '#be185d' }} className="text-[24px] font-bold tracking-[0.3em] uppercase opacity-50 whitespace-nowrap leading-[1.6]">
                        Triana's Daily Love
                      </div>
                      <div style={{ color: '#db2777' }} className="text-[20px] font-semibold italic mt-4 leading-normal">
                        {format(new Date(), 'd MMMM yyyy', {locale: currentLocale})}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {cardTheme === 'polaroid' && (
                <div className="flex-1 flex flex-col items-center justify-center p-16">
                  <div className="w-[820px] p-10 pb-28 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.35)] transform -rotate-1 relative border-4 border-white" style={{ backgroundColor: '#ffffff' }}>
                    <div className="w-full aspect-[4/3] mb-12 flex items-center justify-center relative overflow-hidden shadow-inner bg-gray-50">
                      {(base64Bg || currentBg).startsWith('http') || (base64Bg || currentBg).startsWith('data:') ? (
                         <img src={base64Bg || currentBg} crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover opacity-70 mix-blend-multiply" alt="bg" />
                      ) : (
                         <div className="absolute inset-0" style={{ background: base64Bg || currentBg, opacity: 0.2 }} />
                      )}
                      
                      <div className="relative z-10 text-center px-16">
                         <h2 className="text-[3rem] leading-tight font-serif italic font-semibold drop-shadow-md" style={{ color: '#1f2937' }}>"{currentGreetingText}"</h2>
                      </div>
                    </div>
                    <div className="px-10 py-4 min-h-[200px] flex items-center justify-center">
                      <p className="text-[2.25rem] leading-relaxed font-sans text-center italic" style={{ color: '#374151' }}>
                        {currentMessageText || t('no_message_today')}
                      </p>
                    </div>
                    <div className="absolute bottom-12 right-12 text-[2rem] font-display italic transform -rotate-6 opacity-60 tracking-wider" style={{ color: '#ec4899' }}>
                      Love Always
                    </div>
                  </div>
                  <div className="mt-20 px-16 py-8 rounded-full border-4 shadow-xl text-center flex items-center justify-center gap-6" style={{ backgroundColor: '#ffffff', borderColor: '#fce7f3' }}>
                    <Heart className="w-10 h-10" style={{ color: '#f472b6', fill: '#f472b6' }} />
                    <span className="text-[32px] font-bold tracking-[0.1em] uppercase whitespace-nowrap leading-none" style={{ color: '#f472b6' }}>
                      Triana's Daily Love • {format(new Date(), 'dd/MM/yyyy')}
                    </span>
                    <Heart className="w-10 h-10" style={{ color: '#f472b6', fill: '#f472b6' }} />
                  </div>
                </div>
              )}

              {cardTheme === 'vintage' && (
                <div className="flex-1 flex flex-col p-24 pt-32">
                  <div className="w-full h-full border-[8px] border-double rounded-3xl p-24 relative flex flex-col" style={{ borderColor: 'rgba(120,53,15,0.2)' }}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                       <Sparkles className="w-32 h-32" style={{ color: '#78350f' }} />
                    </div>
                    <p className="text-4xl uppercase tracking-[0.5em] font-bold mb-4" style={{ color: '#78350f' }}>SURAT HARI INI</p>
                    <p className="text-3xl font-medium mb-24" style={{ color: 'rgba(146,64,14,0.6)' }}>{format(new Date(), 'EEEE, d MMMM yyyy', {locale: currentLocale})}</p>
                    
                    <h2 className="text-[4.5rem] leading-tight font-serif italic mb-20" style={{ color: '#431407' }}>
                      "{currentGreetingText}"
                    </h2>
                    
                    <div className="flex-1 px-8">
                      <p className="text-[2.75rem] leading-[2em] font-serif" style={{ color: '#78350f' }}>
                        {currentMessageText || t('no_message_today')}
                      </p>
                    </div>

                    <div className="mt-auto flex justify-between items-end border-t-4 pt-16" style={{ borderColor: 'rgba(120,53,15,0.1)' }}>
                       <p className="text-4xl tracking-widest uppercase font-bold" style={{ color: '#92400e' }}>Triana's Daily Love</p>
                       <Heart className="w-24 h-24 opacity-80" style={{ color: '#ef4444', fill: '#ef4444' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* === THEME 4: LANDING LAYOUT === */}
              {cardTheme === 'landing' && (
                <div className="absolute inset-x-8 inset-y-16 flex flex-col items-center justify-center">
                  <div className="w-[85%] backdrop-blur-3xl rounded-[3rem] border-2 p-16 flex flex-col items-center text-center shadow-xl relative" style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.8)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}>
                    <div className="absolute -top-10 -right-10 opacity-[0.05]">
                      <Heart className="w-48 h-48" style={{ color: '#ec4899', fill: '#ec4899' }} />
                    </div>
                    
                    <div className="flex items-center justify-center gap-6 mb-16">
                      <div className="h-[2px] w-16" style={{ backgroundImage: 'linear-gradient(to right, transparent, #ec4899)' }} />
                      <div className="w-20 h-20 rounded-3xl flex items-center justify-center transform -rotate-6 shadow-lg shadow-pink-200" style={{ backgroundImage: 'linear-gradient(to bottom right, #ec4899, #fb7185)' }}>
                        <Heart className="w-10 h-10 animate-pulse" style={{ color: '#ffffff', fill: '#ffffff' }} />
                      </div>
                      <div className="h-[2px] w-16" style={{ backgroundImage: 'linear-gradient(to left, transparent, #ec4899)' }} />
                    </div>

                    <h2 className="text-[3.5rem] leading-tight font-display italic mb-10 px-8" style={{ color: '#111827' }}>
                      "{currentGreetingText}"
                    </h2>
                    
                    <div className="px-12 w-full max-h-[500px] overflow-hidden flex justify-center">
                      <p className="text-[2.25rem] leading-[1.8em] font-sans font-medium" style={{ color: '#1f2937' }}>
                        {currentMessageText || t('no_message_today')}
                      </p>
                    </div>

                    <div className="flex justify-center items-center gap-4 mt-16 opacity-40">
                      <Sparkles className="w-6 h-6" style={{ color: '#f472b6' }} />
                      <div className="h-[2px] w-48" style={{ backgroundImage: 'linear-gradient(to right, transparent, #fbcfe8, transparent)' }} />
                      <Sparkles className="w-6 h-6" style={{ color: '#f472b6' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* === THEME 5: MINIMALIST ELEGANT (Dark) === */}
              {cardTheme === 'elegant' && (
                <div className="flex-1 flex flex-col items-center justify-center p-20">
                  <div className="w-full h-full border p-20 flex flex-col relative" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <div className="absolute top-12 left-12">
                      <p className="text-[1.5rem] tracking-[0.4em] uppercase" style={{ color: '#cbd5e1' }}>Momen Spesial</p>
                      <p className="text-[3rem] font-serif italic mt-2" style={{ color: '#e2e8f0' }}>{format(new Date(), 'dd.MM.yy')}</p>
                    </div>

                    <div className="flex-1 flex flex-col justify-center items-start mt-20 pl-16 border-l shadow-[inset_1px_0_0_0_rgba(255,255,255,0.1)]" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                      <h2 className="text-[4.5rem] leading-tight font-serif italic mb-12 drop-shadow-lg" style={{ color: '#f8fafc' }}>
                        "{currentGreetingText}"
                      </h2>
                      <p className="text-[2.5rem] leading-[2em] font-sans font-light w-[90%]" style={{ color: '#cbd5e1' }}>
                        {currentMessageText || t('no_message_today')}
                      </p>
                    </div>

                    <div className="mt-auto flex justify-between items-end border-t pt-12" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                      <p className="text-[1.5rem] tracking-[0.5em] uppercase font-light" style={{ color: '#64748b' }}>Triana's Daily Love</p>
                      <Sparkles className="w-12 h-12" style={{ color: '#e2e8f0' }} />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
          
          <div className="absolute top-4 left-4 bg-black/40 text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1 backdrop-blur-md">
            <ImageIcon className="w-3 h-3" /> Live Preview ({resolution})
          </div>
        </div>

        {/* SETTINGS AREA (Right) */}
        <div className="w-full md:w-[320px] flex flex-col space-y-8 pt-8 md:pt-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-500" /> {t('share_happiness')}
            </h3>
            <p className="text-xs text-gray-500">{t('share_happiness_desc')}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">{t('select_size')}</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setResolution('2:3')}
                  className={`py-3 rounded-2xl border-2 transition-all font-bold text-sm ${resolution === '2:3' ? 'border-pink-500 bg-pink-50 text-pink-600 shadow-md' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                >
                  <div className="w-6 h-8 border-2 border-current rounded mx-auto mb-2 opacity-50" />
                  Portrait (2:3)
                </button>
                <button 
                  onClick={() => setResolution('9:16')}
                  className={`py-3 rounded-2xl border-2 transition-all font-bold text-sm ${resolution === '9:16' ? 'border-pink-500 bg-pink-50 text-pink-600 shadow-md' : 'border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                >
                  <div className="w-5 h-9 border-2 border-current rounded mx-auto mb-2 opacity-50" />
                  Story (9:16)
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block mt-6">{t('select_theme')}</label>
              <div className="space-y-2">
                {[
                  { id: 'landing', name: t('theme_original'), desc: t('desc_original') },
                  { id: 'elegant', name: t('theme_elegant'), desc: t('desc_elegant') },
                  { id: 'glass', name: t('theme_glass'), desc: t('desc_glass') },
                  { id: 'polaroid', name: t('theme_polaroid'), desc: t('desc_polaroid') },
                  { id: 'vintage', name: t('theme_vintage'), desc: t('desc_vintage') },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setCardTheme(t.id as any)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${cardTheme === t.id ? 'border-pink-500 bg-pink-50 shadow-sm' : 'border-gray-100 hover:border-pink-200'}`}
                  >
                    <p className={`font-bold text-sm ${cardTheme === t.id ? 'text-pink-600' : 'text-gray-700'}`}>{t.name}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className={`w-full py-4 bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-pink-200 transition-transform active:scale-95 ${isDownloading ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
            >
              {isDownloading ? (
                <>{t('preparing_image')}</>
              ) : (
                <>
                  <Download className="w-5 h-5" /> {t('download_button')}
                </>
              )}
            </button>
            <button onClick={onClose} className="w-full py-3 mt-2 text-gray-400 text-xs font-bold hover:text-gray-600 transition-colors">
              {t('cancel')}
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
