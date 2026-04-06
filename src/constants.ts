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
    name: 'Romantic Pink',
    primary_color: '#ec4899', // pink-500
    secondary_color: '#fb7185', // rose-400
    accent_color: '#fdf2f8', // pink-50
    background_gradient: 'linear-gradient(to bottom right, #fff1f2, #fffafa)',
    background_url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&q=80&w=1920',
    schedule_type: 'daily_rotation',
    rotation_day: 1,
    is_active: true
  },
  {
    name: 'Sunset Love',
    primary_color: '#f43f5e', // rose-500
    secondary_color: '#f97316', // orange-500
    accent_color: '#fff7ed', // orange-50
    background_gradient: 'linear-gradient(to bottom right, #fff7ed, #fff1f2)',
    background_url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&q=80&w=1920',
    schedule_type: 'daily_rotation',
    rotation_day: 2,
    is_active: true
  },
  {
    name: 'Midnight Dream',
    primary_color: '#8b5cf6', // violet-500
    secondary_color: '#ec4899', // pink-500
    accent_color: '#f5f3ff', // violet-50
    background_gradient: 'linear-gradient(to bottom right, #f5f3ff, #fdf2f8)',
    background_url: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?auto=format&fit=crop&q=80&w=1920',
    schedule_type: 'daily_rotation',
    rotation_day: 3,
    is_active: true
  }
];
