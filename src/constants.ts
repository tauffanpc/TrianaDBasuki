import { MoodType } from './types';

export const MOODS: { type: MoodType; label: string; emoji: string; color: string; hex: string }[] = [
  { type: 'happy', label: 'Bahagia', emoji: '😊', color: 'bg-pink-100 text-pink-700 hover:bg-pink-200', hex: '#ec4899' },
  { type: 'energy', label: 'Butuh Semangat', emoji: '⚡', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200', hex: '#eab308' },
  { type: 'sad', label: 'Sedih', emoji: '😔', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200', hex: '#3b82f6' },
  { type: 'angry', label: 'Kesal', emoji: '😤', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200', hex: '#f97316' },
];

export const TIMEZONE = 'Asia/Makassar';
export const ADMIN_USERNAME = 'tauffan';

import { Theme } from './types';

export const DEFAULT_THEMES: Partial<Theme>[] = [
  {
    name: 'Blossom Pink',
    primary_color: '#ec4899',
    secondary_color: '#fb7185',
    accent_color: '#fdf2f8',
    background_gradient: 'linear-gradient(135deg, #fff1f2 0%, #fce7f3 50%, #fffafa 100%)',
    background_url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=1920',
    custom_css: `.glass-card { border: 1.5px solid rgba(255,182,193,0.35) !important; }
.heart-pulse { filter: drop-shadow(0 0 8px rgba(236,72,153,0.4)); }`,
    schedule_type: 'daily_rotation',
    rotation_day: 1,
    is_active: true
  },
  {
    name: 'Sunset Love',
    primary_color: '#f43f5e',
    secondary_color: '#fb923c',
    accent_color: '#fff7ed',
    background_gradient: 'linear-gradient(135deg, #fff7ed 0%, #ffe4e6 50%, #fef3c7 100%)',
    background_url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&q=80&w=1920',
    custom_css: `.glass-card { border: 1.5px solid rgba(251,146,60,0.25) !important; }
.text-romantic-gradient { background-image: linear-gradient(to right, #f43f5e, #fb923c) !important; }`,
    schedule_type: 'daily_rotation',
    rotation_day: 2,
    is_active: true
  },
  {
    name: 'Violet Dream',
    primary_color: '#8b5cf6',
    secondary_color: '#ec4899',
    accent_color: '#f5f3ff',
    background_gradient: 'linear-gradient(135deg, #f5f3ff 0%, #fce7f3 50%, #ede9fe 100%)',
    background_url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&q=80&w=1920',
    custom_css: `.glass-card { border: 1.5px solid rgba(139,92,246,0.25) !important; }
.text-romantic-gradient { background-image: linear-gradient(to right, #8b5cf6, #ec4899) !important; }`,
    schedule_type: 'daily_rotation',
    rotation_day: 3,
    is_active: true
  }
];

// Fungsi untuk memilih tema berdasarkan hari kalender
// Digunakan sebagai fallback ketika tabel themes di Supabase kosong/tidak tersedia
export function getDefaultThemeForToday(): Partial<Theme> {
  const today = new Date().getDate(); // 1-31
  const index = (today - 1) % DEFAULT_THEMES.length;
  return DEFAULT_THEMES[index];
}
