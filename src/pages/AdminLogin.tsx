import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, User, Globe } from 'lucide-react';
import { ADMIN_USERNAME } from '../constants';
import { FloatingHearts } from '../components/Layout';
import { useLanguage } from '../lib/LanguageContext';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    if (!correctPassword) {
      setError('Sistem belum terkonfigurasi (VITE_ADMIN_PASSWORD belum diset).');
      return;
    }

    if (username === ADMIN_USERNAME && password === correctPassword) {
      // Obfuscasi sederhana: gunakan hash atau string unik alih-alih 'true'
      const sessionToken = btoa(`admin_session_${new Date().getTime()}`);
      localStorage.setItem('admin_auth_token', sessionToken);
      navigate('/admin');
    } else {
      setError('Username atau password salah.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fffafa] flex items-center justify-center p-6 font-relaxed relative overflow-hidden">
      <FloatingHearts />

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
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white p-8 rounded-[2rem] shadow-xl border border-pink-50 optimize-gpu"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-pink-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
          <p className="text-gray-600 text-sm">Hanya untuk Tauffan</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800 ml-1">Username</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all text-gray-900"
                placeholder="Username"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-800 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all text-gray-900"
                placeholder="Password"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-xs text-center font-medium bg-red-50 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-pink-200 transition-all active:scale-95"
          >
            Masuk
          </button>
        </form>
      </motion.div>
    </div>
  );
}
