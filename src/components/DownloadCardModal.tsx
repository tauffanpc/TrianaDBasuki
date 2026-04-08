import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Image as ImageIcon, Sparkles, Heart } from 'lucide-react';
import { Message, Greeting } from '../types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

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
  
  const cardRef = useRef<HTMLDivElement>(null);

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
    
    try {
      // Temporarily remove transform for accurate rendering
      const originalTransform = cardRef.current.style.transform;
      cardRef.current.style.transform = 'scale(1)';
      
      const canvas = await (window as any).html2canvas(cardRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        onclone: (clonedDoc: any) => {
          try {
            // Ultimate fallback to strip out any OKLAB/OKLCH colors injected by Tailwind V4
            const elements = clonedDoc.querySelectorAll('*');
            elements.forEach((el: any) => {
              const compStyles = window.getComputedStyle(el);
              const props = ['color', 'backgroundColor', 'borderColor', 'textDecorationColor', 'fill', 'stroke'];
              props.forEach(p => {
                const val = compStyles[p as any] || '';
                if (val.includes('oklab') || val.includes('oklch') || val.includes('color(')) {
                  if (p.includes('color') || p.includes('fill') || p.includes('stroke')) {
                    el.style[p] = '#ec4899'; // Safe fallback pink
                  }
                  if (p === 'backgroundColor') {
                    el.style[p] = '#ffffff'; // Safe fallback white
                  }
                }
              });
            });
          } catch (e) {
            console.error('onclone error:', e);
          }
        }
      });

      cardRef.current.style.transform = originalTransform;

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Triana_DailyLove_${format(new Date(), 'dd_MMM_yyyy')}.png`;
      link.click();
      
      onClose();
    } catch (err: any) {
      console.error('Failed to download card:', err);
      alert('Maaf, terjadi kesalahan: ' + (err.message || err.toString()) + '\n\nSilakan coba lagi.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

  const w = 1080;
  const h = resolution === '9:16' ? 1920 : 1620;

  // Background style based on theme
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
        backgroundColor: '#f5f5f4', // Wood/stone light tone
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

        {/* PREVIEW AREA (Left) */}
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-100/50 rounded-3xl p-4 overflow-hidden relative min-h-[400px]">
          {/* Card Rendering Container - Scaled down for preview but keeps exact 1080px width for hi-res export */}
          <div className="relative transform-origin-top flex items-center justify-center" style={{ width: '100%', height: '100%' }}>
            
            <div 
              ref={cardRef}
              style={{ 
                width: `${w}px`, 
                height: `${h}px`, 
                transform: `scale(0.25)`, // Visually downscale for preview UI constraint
                transformOrigin: 'center center',
                position: 'absolute',
                ...getBackgroundStyle()
              }}
              className="overflow-hidden flex flex-col shadow-2xl relative"
            >
              {/* === THEME 1: GLASSMORPHISM === */}
              {cardTheme === 'glass' && (
                <div className="absolute inset-x-8 inset-y-16 flex flex-col items-center justify-center">
                  <div className="w-[85%] bg-white/30 backdrop-blur-3xl rounded-[4rem] border-4 border-white/60 p-20 flex flex-col items-center text-center shadow-2xl" style={{ boxShadow: '0 25px 50px -12px rgba(236,72,153,0.2)' }}>
                    <Heart className="w-24 h-24 animate-pulse mb-8" style={{ color: '#ec4899', fill: '#ec4899' }} />
                    <h2 className="text-5xl font-display italic mb-16 px-8" style={{ color: '#111827' }}>
                      "{greeting?.text || 'Semoga harimu menyenangkan, Sayang.'}"
                    </h2>
                    <p className="text-4xl leading-relaxed font-serif px-8" style={{ color: '#1f2937' }}>
                      {message?.message || 'Maaf Sayang, Tauffan belum menulis pesan untuk hari ini.'}
                    </p>
                    <div className="mt-20 w-40 h-2 bg-gradient-to-r from-transparent to-transparent rounded-full" style={{ backgroundImage: 'linear-gradient(to right, transparent, #f472b6, transparent)' }} />
                    <p className="mt-12 text-3xl font-bold tracking-[0.3em] uppercase opacity-60" style={{ color: '#be185d' }}>Triana's Daily Love</p>
                    <p className="mt-4 text-2xl font-medium" style={{ color: '#db2777' }}>{format(new Date(), 'd MMMM yyyy', {locale: id})}</p>
                  </div>
                </div>
              )}

              {/* === THEME 2: POLAROID CLASSIC === */}
              {cardTheme === 'polaroid' && (
                <div className="flex-1 flex flex-col items-center justify-center p-16">
                  <div className="w-[800px] p-12 pb-32 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] transform -rotate-2 relative border" style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}>
                    <div className="w-full aspect-[4/3] mb-16 flex items-center justify-center relative overflow-hidden shadow-inner" style={{ backgroundColor: '#fce7f3' }}>
                      {(base64Bg || currentBg).startsWith('http') || (base64Bg || currentBg).startsWith('data:') ? (
                         <img src={base64Bg || currentBg} crossOrigin="anonymous" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-multiply" alt="bg" />
                      ) : (
                         <div className="absolute inset-0" style={{ background: base64Bg || currentBg, opacity: 0.3 }} />
                      )}
                      
                      <div className="relative z-10 text-center px-16">
                         <h2 className="text-[3.5rem] leading-tight font-serif italic font-medium drop-shadow-sm" style={{ color: '#1f2937' }}>"{greeting?.text}"</h2>
                      </div>
                    </div>
                    <p className="text-[2.5rem] leading-relaxed font-sans text-center px-8" style={{ color: '#1f2937' }}>
                      {message?.message || 'Belum ada pesan.'}
                    </p>
                    <div className="absolute bottom-16 right-16 text-[2.5rem] font-sans italic transform -rotate-12 opacity-80 decoration-wavy" style={{ color: '#ec4899' }}>
                      A beautiful memory
                    </div>
                  </div>
                  <div className="mt-24 px-12 py-6 rounded-full shadow-lg border flex items-center gap-4" style={{ backgroundColor: 'rgba(255,255,255,0.8)', borderColor: '#fce7f3' }}>
                    <Heart className="w-8 h-8" style={{ color: '#f472b6', fill: '#f472b6' }} />
                    <p className="text-3xl font-bold tracking-[0.2em] uppercase" style={{ color: '#f472b6' }}>Triana's Daily Love • {format(new Date(), 'dd/MM/yyyy')}</p>
                    <Heart className="w-8 h-8" style={{ color: '#f472b6', fill: '#f472b6' }} />
                  </div>
                </div>
              )}

              {/* === THEME 3: VINTAGE LOVE LETTER === */}
              {cardTheme === 'vintage' && (
                <div className="flex-1 flex flex-col p-24 pt-32">
                  <div className="w-full h-full border-[8px] border-double rounded-3xl p-24 relative flex flex-col" style={{ borderColor: 'rgba(120,53,15,0.2)' }}>
                    <div className="absolute top-16 right-16 opacity-30">
                       <Sparkles className="w-32 h-32" style={{ color: '#78350f' }} />
                    </div>
                    <p className="text-4xl uppercase tracking-[0.5em] font-bold mb-4" style={{ color: '#78350f' }}>SURAT HARI INI</p>
                    <p className="text-3xl font-medium mb-24" style={{ color: 'rgba(146,64,14,0.6)' }}>{format(new Date(), 'EEEE, d MMMM yyyy', {locale: id})}</p>
                    
                    <h2 className="text-[4.5rem] leading-tight font-serif italic mb-20" style={{ color: '#431407' }}>
                      "{greeting?.text}"
                    </h2>
                    
                    <div className="flex-1 px-8">
                      <p className="text-[2.75rem] leading-[2em] font-serif" style={{ color: '#78350f' }}>
                        {message?.message || 'Belum ada pesan.'}
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
                      "{greeting?.text}"
                    </h2>
                    
                    <div className="px-12 w-full max-h-[500px] overflow-hidden flex justify-center">
                      <p className="text-[2.25rem] leading-[1.8em] font-sans font-medium" style={{ color: '#1f2937' }}>
                        {message?.message || 'Belum ada pesan hari ini.'}
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
                        "{greeting?.text}"
                      </h2>
                      <p className="text-[2.5rem] leading-[2em] font-sans font-light w-[90%]" style={{ color: '#cbd5e1' }}>
                        {message?.message || 'Belum ada pesan.'}
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
              <Sparkles className="w-5 h-5 text-pink-500" /> Share Happiness
            </h3>
            <p className="text-xs text-gray-500">Kemas pesan romantis ini menjadi gambar manis dan bagikan ke media sosial.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">1. Pilih Ukuran (Rasio)</label>
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
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block mt-6">2. Pilih Tema Kartu</label>
              <div className="space-y-2">
                {[
                  { id: 'landing', name: 'Original UI', desc: 'Layout sama seperti Beranda web' },
                  { id: 'elegant', name: 'Midnight Elegance', desc: 'Gelap, Estensial, Mewah & Elegan' },
                  { id: 'glass', name: 'Glassmorphism', desc: 'Bersih, efek kaca tembus pandang' },
                  { id: 'polaroid', name: 'Classic Polaroid', desc: 'Bingkai foto retro manis' },
                  { id: 'vintage', name: 'Vintage Love Letter', desc: 'Kertas romantis klasik' },
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
                <>Menyiapkan Gambar...</>
              ) : (
                <>
                  <Download className="w-5 h-5" /> Download Kartu
                </>
              )}
            </button>
            <button onClick={onClose} className="w-full py-3 mt-2 text-gray-400 text-xs font-bold hover:text-gray-600 transition-colors">
              Batal
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
