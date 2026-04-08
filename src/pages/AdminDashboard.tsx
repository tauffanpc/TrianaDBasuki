import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Download, Upload, LogOut, 
  MessageSquare, Heart, Smile, 
  FileSpreadsheet, AlertCircle, CheckCircle2,
  Inbox, LayoutDashboard, Eye, Pencil, Sparkles, Copy, Palette, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { getSupabase } from '../lib/supabase';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';
import { Message, Greeting, MoodMessage, UserMessage, Theme, MoodLog } from '../types';
import { MOODS, DEFAULT_THEMES } from '../constants';
import Layout from '../components/Layout';
import { cn } from '../lib/utils';

// ─── Toast Notification ───────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={cn(
        'fixed bottom-28 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white text-sm font-bold',
        type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-rose-400'
      )}
    >
      {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      {message}
    </motion.div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [greetings, setGreetings] = useState<Greeting[]>([]);
  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [userMessages, setUserMessages] = useState<UserMessage[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'messages' | 'greetings' | 'mood_stats' | 'themes' | 'inbox' | 'guide'>('messages');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemData, setNewItemData] = useState<any>({});
  const [isThemesTableMissing, setIsThemesTableMissing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth_token');
    if (!auth) {
      navigate('/admin-login');
    } else {
      fetchData();
    }
  }, [navigate]);

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setEditData(item);
  };

  const handleSaveEdit = async (table: string) => {
    try {
      const supabase = getSupabase();
      const dataToUpdate = { ...editData };
      const itemId = dataToUpdate.id;
      delete dataToUpdate.id;
      delete dataToUpdate.created_at;

      if (table === 'messages') {
        if (!dataToUpdate.day || !dataToUpdate.message) throw new Error('Hari dan Pesan romantis harus diisi!');
        dataToUpdate.day = parseInt(dataToUpdate.day);
        if (isNaN(dataToUpdate.day)) throw new Error('Hari harus berupa angka!');
        dataToUpdate.month = dataToUpdate.month ? parseInt(dataToUpdate.month) : null;
      } else if (table === 'greetings') {
        if (!dataToUpdate.type || !dataToUpdate.text) throw new Error('Tipe dan Teks sapaan harus diisi!');
      } else if (table === 'themes') {
        if (!dataToUpdate.name) throw new Error('Nama tema harus diisi!');
        if (dataToUpdate.rotation_day) {
          dataToUpdate.rotation_day = parseInt(dataToUpdate.rotation_day);
          if (isNaN(dataToUpdate.rotation_day)) throw new Error('Hari rotasi harus berupa angka!');
        }
      }

      const { error: updateError } = await supabase.from(table).update(dataToUpdate).eq('id', itemId);
      if (updateError) throw updateError;
      setEditingId(null);
      fetchData();
      showToast('Perubahan berhasil disimpan! ✨');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setIsThemesTableMissing(false);
    try {
      const supabase = getSupabase();
      
      // Mengambil secara paralel tetapi kita handle error secara spesifik nantinya, 
      // tidak menggunakan throw jika salah satu bermasalah.
      const msgsPromise = supabase.from('messages').select('*').order('month', { ascending: true }).order('day', { ascending: true });
      const greetsPromise = supabase.from('greetings').select('*');
      const moodsPromise = supabase.from('mood_messages').select('*').order('created_at', { ascending: false }).limit(200);
      const inboxPromise = supabase.from('user_messages').select('*').order('created_at', { ascending: false });
      const themesPromise = supabase.from('themes').select('*').order('created_at', { ascending: true });

      const [msgs, greets, moods, inbox, themesData] = await Promise.all([
        msgsPromise, greetsPromise, moodsPromise, inboxPromise, themesPromise
      ]);

      if (msgs.error) console.error('Messages fetch error:', msgs.error);
      if (greets.error) console.error('Greetings fetch error:', greets.error);
      if (moods.error) console.error('Mood logs fetch error:', moods.error);
      if (inbox.error) console.error('User messages fetch error:', inbox.error);

      if (themesData.error) {
        if (themesData.error.code === 'PGRST205' || themesData.error.message.includes('relation "themes" does not exist')) {
          setIsThemesTableMissing(true);
        } else {
          console.warn('Themes fetch error:', themesData.error);
        }
      }

      setMessages(msgs.data || []);
      setGreetings(greets.data || []);
      setMoodLogs(moods.data || []);
      setUserMessages(inbox.data || []);
      setThemes(themesData.data || []);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth_token');
    navigate('/');
  };

  const downloadTemplate = (type: string) => {
    let data: any[] = [];
    let filename = '';
    if (type === 'messages') {
      data = [{ day: 1, month: 4, message: 'Contoh pesan romantis...', is_active: true }];
      filename = 'template_pesan_harian.xlsx';
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, filename);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>, table: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        const supabase = getSupabase();
        const { error: importError } = await supabase.from(table).insert(data);
        if (importError) throw importError;
        showToast('Import berhasil! 🎉');
        fetchData();
      } catch (err: any) {
        showToast('Gagal import: ' + err.message, 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDelete = async (id: string, table: string) => {
    if (!confirm('Yakin ingin menghapus?')) return;
    try {
      const supabase = getSupabase();
      const { error: delError } = await supabase.from(table).delete().eq('id', id);
      if (delError) throw delError;
      fetchData();
      showToast('Data berhasil dihapus.');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const addItem = () => {
    setNewItemData({});
    setIsAddModalOpen(true);
  };

  const handleSaveNew = async () => {
    try {
      const supabase = getSupabase();
      let table = '';
      let data = { ...newItemData, is_active: true };

      if (activeTab === 'messages') {
        table = 'messages';
        if (!data.day || !data.message) throw new Error('Hari dan Pesan romantis harus diisi!');
        data.day = parseInt(data.day);
        if (isNaN(data.day)) throw new Error('Hari harus berupa angka!');
        data.month = data.month ? parseInt(data.month) : null;
      } else if (activeTab === 'greetings') {
        table = 'greetings';
        if (!data.type || !data.text) throw new Error('Tipe dan Teks sapaan harus diisi!');
      } else if (activeTab === 'themes') {
        table = 'themes';
        if (!data.name) throw new Error('Nama tema harus diisi!');
        if (!data.primary_color) throw new Error('Primary color harus dipilih!');
        if (!data.secondary_color) throw new Error('Secondary color harus dipilih!');
        if (!data.accent_color) data.accent_color = '#fdf2f8';
        data.background_gradient = data.background_gradient || 'linear-gradient(135deg, #fff1f2 0%, #fce7f3 100%)';
        data.schedule_type = data.schedule_type || 'always';
        if (data.rotation_day) {
          data.rotation_day = parseInt(data.rotation_day);
          if (isNaN(data.rotation_day)) throw new Error('Hari rotasi harus berupa angka!');
        }
      }

      if (!table) return;
      const { error: addError } = await supabase.from(table).insert(data);
      if (addError) throw addError;
      setIsAddModalOpen(false);
      setNewItemData({});
      fetchData();
      showToast('Data baru berhasil ditambahkan! ✨');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => showToast(`${label} disalin! 📋`));
  };

  // ─── Prompt templates ────────────────────────────────────────────────────────
  const PROMPT_TEMPLATES = [
    {
      label: 'Tema Romantis CSS',
      desc: 'Generate CSS custom untuk memperindah tampilan',
      prompt: `Saya punya website romantis bernama "Triana's Daily Love" dengan Tailwind CSS v4.
Tolong buatkan Custom CSS untuk mempercantik "glass-card" atau memberikan efek romantis tambahan.
Yang ingin saya ubah: [tulis keinginan Anda, contoh: kartu pesan membulat ekstrem dan font lebih elegan]

Instruksi teknis untuk AI:
- Berikan hanya kode CSS murni!
- Gunakan !important jika Anda override class tailwind.
- CSS variables utama: --primary-color, --secondary-color, --accent-color, --bg-gradient
- Anda bisa menargetkan elemen .glass-card, header, p, atau menambahkan animasi keyframes.
- Contoh selector aman: .glass-card { background: rgba(255,255,255,0.4) !important; borderRadius: 40px !important; border: 1px solid var(--accent-color); }`
    },
    {
      label: 'Custom HTML Dekoratif',
      desc: 'Generate HTML untuk elemen hias di lapisan background (z-index 0)',
      prompt: `Saya ingin menambahkan elemen dekoratif murni dari HTML dan CSS untuk website romantis saya "Triana's Daily Love".
Elemen hias ini akan ditempatkan di lapisan bawah (z-index 0, layer background) sehingga tidak menghalangi tombol.
Saya ingin: [tulis keinginan, contoh: efek hujan bintang kelap-kelip merah muda lembut atau bunga sakura berjatuhan lambat]

Instruksi teknis untuk AI:
- Gunakan 100vw dan 100vh untuk membungkusnya secara absolut/fixed.
- CSS letakkan sejajar dalam blok tag <style>...</style> di dalam output HTML (1 file HTML utuh).
- Jangan gunakan JavaScript yang interaktif, cukup CSS Animation saja.
- Pastikan pointer-events: none; di bungkus terluar!`
    },
    {
      label: 'Pemilihan Palet Tema',
      desc: 'Rekomendasi Skema Warna yang serasi untuk database',
      prompt: `Tolong rekomendasikan skema warna romantis untuk website saya "Triana's Daily Love".
Kesan yang saya inginkan: [pilih: hangat dan menenangkan / elegan mewah gelap / manis dan ceria]

Tolong berikan hasilnya dalam format persis seperti ini untuk database saya:
- primary_color: [kode hex contoh #ec4899]
- secondary_color: [kode hex]
- accent_color: [kode hex]
- background_gradient: [kode linear-gradient(135deg, warna1 0%, warna2 100%)]
- background_url: [sebaiknya link foto dari Unsplash dengan filter misal ?auto=format&fit=crop&q=80&w=1920&blend=... untuk memastikan estetika. Cari nuansa aesthetic/romance/sky/clouds]`
    },
    {
      label: 'Tema Spesial Ekstra',
      desc: 'Buat tema komplit (Animasi HTML + CSS) untuk Hari Spesial',
      prompt: `Saya akan menyambut perayaan: [Momen, misal Ulang Tahun Triana / Valentine]
Tanggal: [YYYY-MM-DD]

Bantu saya menyusun skenario elemen yang menakjubkan, tolong berikan:
1. Kombinasi 3 Warna (Primary, Secondary, Accent HEX)
2. Background URL Aesthetic Landscape / Abstract Romance dari Unsplash (resolusi 1080p).
3. Background Gradient sebagai Fallback.
4. Custom CSS untuk memodifikasi .glass-card agar terlihat mewah (ex: golden border).
5. Custom HTML berisi animasi (ex: "Happy Birthday Triana" terbang dari bawah ke atas perlahan dengan opacity pudar).

Tolong format semua ini menjadi jelas agar saya bisa langsung paste ke Admin Dashboard saya.`
    }
  ];

  return (
    <Layout fullWidth>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <Toast
            key={toast.message}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row min-h-[calc(100vh-120px)] gap-6 relative">
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.aside 
          initial={false}
          animate={{ 
            x: isSidebarOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 768 ? -300 : 0),
            opacity: 1
          }}
          className={cn(
            "fixed md:sticky top-28 left-0 z-50 w-64 h-[calc(100vh-160px)] bg-white/80 backdrop-blur-xl border border-white/40 rounded-[2.5rem] p-6 shadow-xl shadow-pink-100/20 transition-all duration-300 md:translate-x-0 overflow-y-auto no-scrollbar",
            !isSidebarOpen && "pointer-events-none md:pointer-events-auto opacity-0 md:opacity-100"
          )}
        >
          <div className="space-y-8">
            <div className="px-2">
              <h2 className="text-xl font-display font-bold text-gray-900">Admin Panel</h2>
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">Dashboard Konten</p>
            </div>

            <nav className="space-y-2">
              {[
                { id: 'messages', label: 'Pesan Harian', icon: MessageSquare },
                { id: 'greetings', label: 'Sapaan', icon: Heart },
                { id: 'mood_stats', label: 'Statistik Mood', icon: Smile },
                { id: 'themes', label: 'Tema & BG', icon: Palette },
                { id: 'inbox', label: 'Inbox Pesan', icon: Inbox },
                { id: 'guide', label: 'Panduan & Prompt', icon: Sparkles },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setIsSidebarOpen(false); }}
                  className={cn(
                    "w-full px-5 py-4 rounded-2xl flex items-center gap-4 text-sm font-bold transition-all duration-300 group",
                    activeTab === tab.id 
                      ? "bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-lg shadow-pink-200" 
                      : "text-gray-600 hover:bg-pink-50 hover:text-pink-500"
                  )}
                >
                  <tab.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", activeTab === tab.id ? "text-white" : "text-gray-500")} />
                  <span className="flex-1 text-left">{tab.label}</span>
                  {tab.id === 'inbox' && userMessages.length > 0 && (
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", activeTab === tab.id ? "bg-white text-pink-500" : "bg-pink-100 text-pink-500")}>
                      {userMessages.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="pt-8 border-t border-gray-100">
              <button 
                onClick={handleLogout}
                className="w-full px-5 py-4 rounded-2xl flex items-center gap-4 text-sm font-bold text-gray-600 hover:bg-red-50 hover:text-red-500 transition-all group"
              >
                <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </motion.aside>

        {/* Main Content */}
        <div className="flex-1 space-y-8 min-w-0">
          {/* Header Mobile & Desktop */}
          <div className="flex justify-between items-center bg-white/60 backdrop-blur-md p-4 md:p-6 rounded-[2rem] border border-white/40 shadow-sm gap-2">
            <div className="flex items-center gap-3 md:gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="md:hidden p-3 bg-pink-50 text-pink-600 hover:bg-pink-100 rounded-xl transition-colors shadow-sm"
              >
                <LayoutDashboard className="w-5 h-5" />
              </button>
              <div className="hidden md:flex w-12 h-12 bg-pink-50 rounded-2xl items-center justify-center text-pink-500">
                {activeTab === 'messages' && <MessageSquare className="w-6 h-6" />}
                {activeTab === 'greetings' && <Heart className="w-6 h-6" />}
                {activeTab === 'mood_stats' && <Smile className="w-6 h-6" />}
                {activeTab === 'themes' && <Palette className="w-6 h-6" />}
                {activeTab === 'inbox' && <Inbox className="w-6 h-6" />}
                {activeTab === 'guide' && <Sparkles className="w-6 h-6" />}
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm md:text-lg font-bold text-gray-900 capitalize">{activeTab.replace('_', ' ')}</h1>
                <p className="text-[10px] md:text-xs text-gray-600">Kelola konten bagian {activeTab}</p>
              </div>
            </div>
            <div className="flex gap-2 md:gap-3 flex-shrink-0">
              <button
                onClick={() => window.open('/home?preview_date=' + new Date().toISOString().split('T')[0], '_blank')}
                className="px-3 md:px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all flex items-center gap-2 text-xs font-bold"
              >
                <Eye className="w-4 h-4" /> <span className="hidden sm:inline">Preview</span>
              </button>
              {activeTab !== 'inbox' && activeTab !== 'guide' && activeTab !== 'mood_stats' && (
                <button 
                  onClick={addItem}
                  className="px-4 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-all flex items-center gap-2 text-xs font-bold shadow-lg shadow-pink-100"
                >
                  <Plus className="w-4 h-4" /> Tambah Baru
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-8 shadow-xl shadow-pink-100/10 border border-white/40 min-h-[500px]">

            {/* ── MESSAGES TAB ── */}
            {activeTab === 'messages' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <h2 className="font-bold text-gray-800">Daftar Pesan Harian</h2>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="px-3 py-1.5 bg-pink-50 border border-pink-100 rounded-xl text-xs font-bold text-pink-600 focus:outline-none focus:border-pink-300 transition-all cursor-pointer"
                    >
                      <option value="all">🗓️ Semua Bulan</option>
                      {Array.from({ length: 12 }).map((_, i) => (
                        <option key={i + 1} value={i + 1}>{format(new Date(2024, i, 1), 'MMMM', { locale: id })}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button onClick={() => downloadTemplate('messages')} className="p-2 text-pink-500 hover:bg-pink-50 rounded-xl transition-all flex items-center gap-2 font-bold">
                      <Download className="w-4 h-4" /> Template
                    </button>
                    <label className="p-2 bg-pink-500 text-white rounded-xl cursor-pointer hover:bg-pink-600 transition-all flex items-center gap-2 font-bold shadow-sm shadow-pink-200">
                      <Upload className="w-4 h-4" /> Import
                      <input type="file" className="hidden" onChange={(e) => handleImport(e, 'messages')} />
                    </label>
                  </div>
                </div>
                <div className="space-y-4">
                  {(selectedMonth === 'all' ? messages : messages.filter(m => m.month === parseInt(selectedMonth))).map((msg) => (
                    <div key={msg.id} className="p-5 bg-gray-50 rounded-2xl flex justify-between items-start gap-4 group border border-transparent hover:border-pink-100 transition-all">
                      {editingId === msg.id ? (
                        <div className="flex-1 space-y-2">
                          <div className="flex gap-2">
                            <input type="number" value={editData.day || ''} onChange={(e) => setEditData({...editData, day: e.target.value})} className="w-20 p-2 border rounded-lg text-xs" placeholder="Hari" />
                            <input type="number" value={editData.month || ''} onChange={(e) => setEditData({...editData, month: e.target.value})} className="w-20 p-2 border rounded-lg text-xs" placeholder="Bulan" />
                          </div>
                          <textarea value={editData.message || ''} onChange={(e) => setEditData({...editData, message: e.target.value})} className="w-full p-2 border rounded-lg text-xs min-h-[80px]" />
                          <div className="flex gap-2">
                            <button onClick={() => handleSaveEdit('messages')} className="px-3 py-1 bg-green-500 text-white rounded-lg text-[10px] font-bold">Simpan</button>
                            <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-200 text-gray-600 rounded-lg text-[10px] font-bold">Batal</button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1 flex-1">
                          <span className="px-2 py-0.5 bg-pink-100 text-pink-600 rounded-md text-[10px] font-bold">
                            Tgl {msg.day}{msg.month ? `/${msg.month}` : ' (Bulanan)'}
                          </span>
                          <p className="text-sm text-gray-600 leading-relaxed">{msg.message}</p>
                        </div>
                      )}
                      <div className="flex flex-col gap-2">
                        <button onClick={() => handleEdit(msg)} className="p-2 text-gray-300 hover:text-blue-500 transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(msg.id, 'messages')} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                  <button onClick={addItem} className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 hover:border-pink-200 hover:text-pink-400 transition-all flex items-center justify-center gap-2 font-bold text-sm">
                    <Plus className="w-4 h-4" /> Tambah Pesan Baru
                  </button>
                </div>
              </div>
            )}

            {/* ── GREETINGS TAB ── */}
            {activeTab === 'greetings' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-bold text-gray-800">Sapaan (Greetings)</h2>
                    <p className="text-[10px] text-gray-400 mt-0.5">{greetings.length} sapaan tersimpan</p>
                  </div>
                  <button onClick={addItem} className="px-4 py-2 bg-pink-500 text-white rounded-xl text-xs font-bold hover:bg-pink-600 transition-all flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Tambah Sapaan
                  </button>
                </div>

                {greetings.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <Heart className="w-12 h-12 mx-auto text-pink-200" />
                    <p className="text-sm text-gray-400 italic">Belum ada sapaan. Tambahkan sapaan pertama!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Group by type */}
                    {['daily', 'random'].map((type) => {
                      const filtered = greetings.filter((g) => g.type === type);
                      if (filtered.length === 0) return null;
                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex items-center gap-2 px-1">
                            <span className={cn(
                              "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider",
                              type === 'daily' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                            )}>
                              {type === 'daily' ? '📅 Harian' : '🎲 Acak'} ({filtered.length})
                            </span>
                            <div className="flex-1 h-[1px] bg-gray-100" />
                          </div>
                          {filtered.map((g) => (
                            <div key={g.id} className="p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-pink-100 transition-all">
                              {editingId === g.id ? (
                                <div className="space-y-2">
                                  <select value={editData.type || 'daily'} onChange={(e) => setEditData({...editData, type: e.target.value})} className="w-full p-2 border rounded-lg text-xs">
                                    <option value="daily">Daily (Harian)</option>
                                    <option value="random">Random (Acak)</option>
                                  </select>
                                  <input type="text" value={editData.text || ''} onChange={(e) => setEditData({...editData, text: e.target.value})} className="w-full p-2 border rounded-lg text-xs" />
                                  <div className="flex gap-2">
                                    <button onClick={() => handleSaveEdit('greetings')} className="px-3 py-1 bg-green-500 text-white rounded-lg text-[10px] font-bold">Simpan</button>
                                    <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-200 text-gray-600 rounded-lg text-[10px] font-bold">Batal</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-between items-start gap-3">
                                  <p className="text-sm text-gray-700 font-medium leading-relaxed flex-1 italic">"{g.text}"</p>
                                  <div className="flex gap-1 flex-shrink-0">
                                    <button onClick={() => handleEdit(g)} className="p-2 text-gray-300 hover:text-blue-500 transition-colors"><Pencil className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(g.id, 'greetings')} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── MOOD STATS TAB ── */}
            {activeTab === 'mood_stats' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/40 shadow-sm space-y-6">
                    <h2 className="font-bold text-gray-900">Persentase Mood</h2>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={MOODS.map(m => ({
                              name: m.label,
                              value: moodLogs.filter(log => log.mood === m.type).length,
                              color: m.hex
                            })).filter(d => d.value > 0)}
                            cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                          >
                            {MOODS.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.hex} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/40 shadow-sm space-y-6">
                    <h2 className="font-bold text-gray-900">Ringkasan Mood</h2>
                    <div className="grid grid-cols-2 gap-4">
                      {MOODS.map(m => {
                        const count = moodLogs.filter(log => log.mood === m.type).length;
                        const percent = moodLogs.length > 0 ? Math.round((count / moodLogs.length) * 100) : 0;
                        return (
                          <div key={m.type} className="p-4 rounded-2xl bg-white/40 border border-white/60 flex flex-col items-center text-center space-y-2 relative group cursor-pointer hover:bg-white/60 transition-all">
                            <span className="text-2xl group-hover:scale-125 transition-transform">{m.emoji}</span>
                            <span className="text-xs font-bold text-gray-900">{m.label}</span>
                            <span className="text-2xl font-display font-bold text-pink-500">{count}</span>
                            <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 bg-gray-900 text-white text-[10px] px-3 py-1.5 rounded-lg whitespace-nowrap transition-opacity pointer-events-none">
                              {percent}% dari total {moodLogs.length} logs
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/40 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="font-bold text-gray-900">Log Mood Terbaru</h2>
                    <button onClick={() => {
                      const data = moodLogs.map(log => ({
                        Mood: MOODS.find(m => m.type === log.mood)?.label || log.mood,
                        Emoji: MOODS.find(m => m.type === log.mood)?.emoji || '',
                        Waktu: format(new Date(log.created_at), 'dd MMM yyyy HH:mm'),
                        DeviceID: log.device_id
                      }));
                      const ws = XLSX.utils.json_to_sheet(data);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, 'Mood Logs');
                      XLSX.writeFile(wb, 'mood_logs.xlsx');
                    }} className="px-4 py-2 bg-pink-50 text-pink-500 rounded-xl text-xs font-bold hover:bg-pink-100 transition-all flex items-center gap-2">
                      <Download className="w-4 h-4" /> Export Excel
                    </button>
                  </div>
                  <div className="space-y-3">
                    {moodLogs.length === 0 ? (
                      <div className="text-center py-12 text-gray-400 italic text-sm">Belum ada data mood.</div>
                    ) : (
                      moodLogs.slice(0, 50).map((log) => (
                        <div key={log.id} className="p-4 bg-white/40 rounded-2xl border border-white/60 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-xl">
                              {MOODS.find(m => m.type === log.mood)?.emoji}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{MOODS.find(m => m.type === log.mood)?.label}</p>
                              <p className="text-[10px] text-gray-500">{format(new Date(log.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })}</p>
                            </div>
                          </div>
                          <div className="text-[10px] font-mono text-gray-300">{log.device_id.substring(0, 8)}...</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── INBOX TAB ── */}
            {activeTab === 'inbox' && (
              <div className="space-y-6">
                <h2 className="font-bold text-gray-900">Pesan dari Triana</h2>
                <div className="space-y-4">
                  {userMessages.length === 0 ? (
                    <div className="text-center py-20 text-gray-600 space-y-2">
                      <Inbox className="w-12 h-12 mx-auto opacity-20" />
                      <p>Belum ada pesan masuk...</p>
                    </div>
                  ) : (
                    userMessages.map((msg) => (
                      <div key={msg.id} className="p-6 bg-pink-50 rounded-3xl space-y-3 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Heart className="w-12 h-12 text-pink-500 fill-current" />
                        </div>
                        <p className="text-gray-800 font-medium leading-relaxed italic">"{msg.content}"</p>
                        <div className="flex justify-between items-center text-[10px] text-pink-600 font-bold uppercase tracking-widest">
                          <span>{format(new Date(msg.created_at), 'd MMM yyyy, HH:mm')}</span>
                          <button onClick={() => handleDelete(msg.id, 'user_messages')} className="hover:text-red-500 transition-colors">Hapus</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ── THEMES TAB ── */}
            {activeTab === 'themes' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="font-bold text-gray-800">Tema & Background</h2>
                    <p className="text-[10px] text-gray-400">Atur visual website secara menyeluruh</p>
                  </div>
                  {!isThemesTableMissing && (
                    <button onClick={addItem} className="px-4 py-2 bg-pink-500 text-white rounded-xl text-xs font-bold hover:bg-pink-600 transition-all">
                      Tambah Tema
                    </button>
                  )}
                </div>

                {/* Info box: default themes always work */}
                <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-green-800">Tema Otomatis Sudah Aktif</p>
                    <p className="text-[11px] text-green-700 leading-relaxed mt-0.5">
                      Website sudah memiliki 3 tema romantis yang berganti otomatis setiap hari (Blossom Pink → Sunset Love → Violet Dream) meski tanpa mengisi tabel di bawah ini. Tabel tema di bawah bersifat <strong>opsional</strong> — untuk tema custom tambahan.
                    </p>
                  </div>
                </div>

                {isThemesTableMissing ? (
                  <div className="p-8 bg-amber-50 rounded-[2rem] border border-amber-100 space-y-6">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-6 h-6 text-amber-500" />
                      <div>
                        <h3 className="font-bold text-amber-800">Tabel 'themes' belum dibuat di Supabase</h3>
                        <p className="text-xs text-amber-700">Jalankan SQL berikut di Supabase SQL Editor untuk mengaktifkan fitur tema custom:</p>
                      </div>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-xl overflow-x-auto relative">
                      <button
                        onClick={() => copyToClipboard(`create table themes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  primary_color text not null default '#ec4899',
  secondary_color text not null default '#fb7185',
  accent_color text not null default '#fdf2f8',
  background_gradient text not null default 'linear-gradient(135deg, #fff1f2, #fce7f3)',
  background_url text,
  custom_css text,
  custom_html text,
  schedule_type text default 'always' check (schedule_type in ('always','specific_date','daily_rotation')),
  scheduled_date text,
  rotation_day integer,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table themes enable row level security;
create policy "Public read" on themes for select using (true);
create policy "Admin all" on themes for all using (true);`, 'SQL')}
                        className="absolute top-3 right-3 px-3 py-1 bg-white/10 text-white text-[10px] rounded-lg hover:bg-white/20 transition-all flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Salin SQL
                      </button>
                      <pre className="text-[10px] text-green-400 font-mono leading-relaxed whitespace-pre-wrap">
{`create table themes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  primary_color text not null default '#ec4899',
  secondary_color text not null default '#fb7185',
  accent_color text not null default '#fdf2f8',
  background_gradient text not null default 'linear-gradient(135deg, #fff1f2, #fce7f3)',
  background_url text,
  custom_css text,
  custom_html text,
  schedule_type text default 'always'
    check (schedule_type in ('always','specific_date','daily_rotation')),
  scheduled_date text,
  rotation_day integer,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table themes enable row level security;
create policy "Public read" on themes for select using (true);
create policy "Admin all" on themes for all using (true);`}
                      </pre>
                    </div>
                    <button onClick={fetchData} className="px-6 py-3 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition-all">
                      Cek Lagi Setelah Jalankan SQL
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {themes.map((theme) => (
                        <div key={theme.id} className="p-6 bg-gray-50 rounded-3xl space-y-4 border border-gray-100 hover:shadow-md transition-all">
                          {editingId === theme.id ? (
                            <div className="space-y-3">
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Nama Tema</label>
                                <input type="text" value={editData.name || ''} onChange={(e) => setEditData({...editData, name: e.target.value})} className="w-full p-2 border rounded-lg text-xs mt-1" />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {['primary_color','secondary_color','accent_color'].map((key) => (
                                  <div key={key}>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">{key.replace('_color','').replace('_',' ')}</label>
                                    <input type="color" value={editData[key] || '#ec4899'} onChange={(e) => setEditData({...editData, [key]: e.target.value})} className="w-full h-8 rounded mt-1" />
                                  </div>
                                ))}
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Background URL / Gradient</label>
                                <input type="text" value={editData.background_url || ''} onChange={(e) => setEditData({...editData, background_url: e.target.value})} className="w-full p-2 border rounded-lg text-xs mt-1" placeholder="https://... atau linear-gradient(...)" />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-gray-400 uppercase">Jadwal</label>
                                  <select value={editData.schedule_type || 'always'} onChange={(e) => setEditData({...editData, schedule_type: e.target.value})} className="w-full p-2 border rounded-lg text-xs mt-1">
                                    <option value="always">Selalu Aktif</option>
                                    <option value="specific_date">Tanggal Spesifik</option>
                                    <option value="daily_rotation">Rotasi Harian</option>
                                  </select>
                                </div>
                                {editData.schedule_type === 'specific_date' && (
                                  <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Tanggal</label>
                                    <input type="date" value={editData.scheduled_date || ''} onChange={(e) => setEditData({...editData, scheduled_date: e.target.value})} className="w-full p-2 border rounded-lg text-xs mt-1" />
                                  </div>
                                )}
                                {editData.schedule_type === 'daily_rotation' && (
                                  <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Hari ke- (1-31)</label>
                                    <input type="number" min="1" max="31" value={editData.rotation_day || ''} onChange={(e) => setEditData({...editData, rotation_day: e.target.value})} className="w-full p-2 border rounded-lg text-xs mt-1" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Custom CSS</label>
                                <textarea value={editData.custom_css || ''} onChange={(e) => setEditData({...editData, custom_css: e.target.value})} className="w-full p-2 border rounded-lg text-[10px] font-mono min-h-[80px] mt-1" placeholder=".glass-card { border-radius: 60px !important; }" />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Custom HTML</label>
                                <textarea value={editData.custom_html || ''} onChange={(e) => setEditData({...editData, custom_html: e.target.value})} className="w-full p-2 border rounded-lg text-[10px] font-mono min-h-[80px] mt-1" placeholder="<div style='...'>konten dekoratif</div>" />
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleSaveEdit('themes')} className="flex-1 py-2 bg-green-500 text-white rounded-xl text-[10px] font-bold">Simpan</button>
                                <button onClick={() => setEditingId(null)} className="flex-1 py-2 bg-gray-200 text-gray-600 rounded-xl text-[10px] font-bold">Batal</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-bold text-gray-800">{theme.name}</h3>
                                  <div className="flex gap-1 mt-1 flex-wrap">
                                    <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase", theme.is_active ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-500")}>
                                      {theme.is_active ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 uppercase">
                                      {theme.schedule_type === 'specific_date' ? `Tgl: ${theme.scheduled_date}` : theme.schedule_type === 'daily_rotation' ? `Hari: ${theme.rotation_day}` : 'Selalu'}
                                    </span>
                                    {theme.custom_css && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">CSS</span>}
                                    {theme.custom_html && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">HTML</span>}
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <button onClick={() => handleEdit(theme)} className="p-2 text-gray-300 hover:text-blue-500 transition-colors"><Pencil className="w-4 h-4" /></button>
                                  <button onClick={() => handleDelete(theme.id, 'themes')} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </div>
                              <div className="w-full h-20 rounded-2xl overflow-hidden relative border border-gray-200"
                                style={{
                                  backgroundImage: theme.background_url?.startsWith('http') ? `url(${theme.background_url})` : undefined,
                                  background: !theme.background_url?.startsWith('http') ? (theme.background_url || theme.background_gradient) : undefined,
                                  backgroundSize: 'cover', backgroundPosition: 'center'
                                }}
                              >
                                <div className="absolute bottom-2 left-2 flex gap-1.5">
                                  {[theme.primary_color, theme.secondary_color, theme.accent_color].map((c, i) => (
                                    <div key={i} className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: c }} />
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    {themes.length === 0 && (
                      <div className="text-center py-10 space-y-4">
                        <p className="text-sm text-gray-400 italic">Belum ada tema custom. Pasang tema default?</p>
                        <button
                          onClick={async () => {
                            try {
                              const supabase = getSupabase();
                              const { error: addError } = await supabase.from('themes').insert(DEFAULT_THEMES);
                              if (addError) throw addError;
                              fetchData();
                              showToast('3 tema default berhasil dipasang! ✨');
                            } catch (err: any) { showToast(err.message, 'error'); }
                          }}
                          className="px-6 py-2 bg-pink-50 text-pink-500 rounded-xl text-xs font-bold hover:bg-pink-100 transition-all"
                        >
                          Pasang 3 Tema Default
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── GUIDE TAB ── */}
            {activeTab === 'guide' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-display font-bold text-gray-800">Panduan & Prompt AI</h2>
                  <p className="text-sm text-gray-500 mt-1">Gunakan prompt di bawah ini untuk membuat tema lebih indah dengan bantuan AI (ChatGPT / Gemini / Claude).</p>
                </div>

                {/* How it works */}
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { step: '1', title: 'Salin prompt', desc: 'Pilih prompt yang sesuai kebutuhan Anda, lalu salin.' },
                    { step: '2', title: 'Tanya AI', desc: 'Paste ke ChatGPT, Gemini, atau Claude. Isi bagian [dalam kurung] sesuai keinginan.' },
                    { step: '3', title: 'Paste ke form', desc: 'Salin hasil output AI ke field Custom CSS / Custom HTML di tab Tema.' },
                  ].map((s) => (
                    <div key={s.step} className="p-5 bg-pink-50 rounded-2xl border border-pink-100 space-y-2">
                      <div className="w-8 h-8 bg-pink-500 text-white rounded-xl flex items-center justify-center font-bold text-sm">{s.step}</div>
                      <p className="font-bold text-gray-800 text-sm">{s.title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Prompt cards */}
                <div className="space-y-4">
                  {PROMPT_TEMPLATES.map((pt, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 space-y-3 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-gray-800 text-sm">{pt.label}</h3>
                          <p className="text-[11px] text-gray-400 mt-0.5">{pt.desc}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(pt.prompt, pt.label)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 text-pink-600 rounded-xl text-[11px] font-bold hover:bg-pink-100 transition-all flex-shrink-0"
                        >
                          <Copy className="w-3.5 h-3.5" /> Salin Prompt
                        </button>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-4 font-mono text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap border border-gray-100">
                        {pt.prompt}
                      </div>
                    </div>
                  ))}
                </div>

                {/* CSS selectors reference */}
                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 space-y-4">
                  <h3 className="font-bold text-blue-800 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Referensi Selector CSS & Variabel</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Class yang bisa dipakai</p>
                      {['.glass-card', '.text-romantic-gradient', '.bg-romantic-gradient', '.heart-pulse', '.optimize-gpu', '.no-scrollbar'].map((cls) => (
                        <code key={cls} className="block text-[11px] bg-white/60 px-3 py-1 rounded-lg text-blue-800 font-mono">{cls}</code>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">CSS Variable</p>
                      {['--primary-color', '--secondary-color', '--accent-color', '--bg-gradient'].map((v) => (
                        <code key={v} className="block text-[11px] bg-white/60 px-3 py-1 rounded-lg text-blue-800 font-mono">var({v})</code>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/60 p-4 rounded-2xl space-y-2">
                    <p className="text-[11px] font-bold text-blue-700">Contoh CSS yang berfungsi:</p>
                    <pre className="text-[11px] text-blue-900 font-mono leading-relaxed">{`.glass-card {
  border-radius: 60px !important;
  border: 2px solid rgba(255,182,193,0.5) !important;
  box-shadow: 0 20px 60px rgba(236,72,153,0.15) !important;
}
.text-romantic-gradient {
  background-image: linear-gradient(to right, #ec4899, #f97316) !important;
}`}</pre>
                  </div>
                </div>

                {/* Tips */}
                <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 space-y-2">
                  <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2"><AlertCircle className="w-4 h-4 text-orange-400" /> Tips Penting</h4>
                  <ul className="text-xs text-gray-500 space-y-2 list-disc pl-4 leading-relaxed">
                    <li>Gunakan <code className="bg-gray-200 px-1 rounded">!important</code> jika perubahan CSS tidak muncul.</li>
                    <li>Custom HTML akan muncul di lapisan <strong>background</strong> halaman — gunakan untuk dekorasi, bukan konten utama.</li>
                    <li>Elemen HTML kustom tidak boleh menggunakan <code className="bg-gray-200 px-1 rounded">position: fixed</code> tanpa <code className="bg-gray-200 px-1 rounded">z-index</code> yang tepat.</li>
                    <li>Untuk animasi di Custom HTML, gunakan CSS <code className="bg-gray-200 px-1 rounded">@keyframes</code> — jangan gunakan library JS eksternal.</li>
                    <li>Jadwal <strong>"Rotasi Harian"</strong>: isi "Hari ke-" dengan angka 1–31 sesuai tanggal di mana tema ini aktif.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white rounded-[2rem] p-8 shadow-2xl relative z-10 w-full max-w-md space-y-6 max-h-[90vh] overflow-y-auto">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Tambah {activeTab === 'messages' ? 'Pesan Baru' : activeTab === 'greetings' ? 'Sapaan Baru' : 'Tema Baru'}</h3>
                <p className="text-xs text-gray-400 mt-1">Masukkan data yang diperlukan di bawah ini.</p>
              </div>

              <div className="space-y-4">
                {activeTab === 'messages' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hari (1-31) *</label>
                        <input type="number" onChange={(e) => setNewItemData({...newItemData, day: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm mt-1 outline-none focus:ring-2 focus:ring-pink-200" placeholder="Contoh: 14" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bulan (Opsional)</label>
                        <input type="number" onChange={(e) => setNewItemData({...newItemData, month: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm mt-1 outline-none focus:ring-2 focus:ring-pink-200" placeholder="1-12" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pesan Romantis *</label>
                      <textarea onChange={(e) => setNewItemData({...newItemData, message: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm mt-1 outline-none focus:ring-2 focus:ring-pink-200 min-h-[120px] resize-none" placeholder="Tuliskan pesan cintamu di sini..." />
                    </div>
                  </>
                )}

                {activeTab === 'greetings' && (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tipe Sapaan *</label>
                      <select onChange={(e) => setNewItemData({...newItemData, type: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm mt-1 outline-none focus:ring-2 focus:ring-pink-200">
                        <option value="">Pilih Tipe</option>
                        <option value="daily">Daily — muncul setiap hari (pakai 1 saja)</option>
                        <option value="random">Random — dipilih acak dari semua random</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Teks Sapaan *</label>
                      <input type="text" onChange={(e) => setNewItemData({...newItemData, text: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm mt-1 outline-none focus:ring-2 focus:ring-pink-200" placeholder="Contoh: Selamat pagi, Sayangku..." />
                    </div>
                  </>
                )}

                {activeTab === 'themes' && (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nama Tema *</label>
                      <input type="text" onChange={(e) => setNewItemData({...newItemData, name: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm mt-1 outline-none focus:ring-2 focus:ring-pink-200" placeholder="Contoh: Midnight Rose" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[['primary_color', 'Primary *'], ['secondary_color', 'Secondary *'], ['accent_color', 'Accent']].map(([key, label]) => (
                        <div key={key}>
                          <label className="text-[10px] font-bold text-gray-400 uppercase">{label}</label>
                          <input type="color" defaultValue={key === 'primary_color' ? '#ec4899' : key === 'secondary_color' ? '#fb7185' : '#fdf2f8'} onChange={(e) => setNewItemData({...newItemData, [key]: e.target.value})} className="w-full h-10 p-1 bg-gray-50 border border-gray-100 rounded-xl mt-1" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Background URL (foto) atau Gradient CSS</label>
                      <input type="text" onChange={(e) => setNewItemData({...newItemData, background_url: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm mt-1 outline-none focus:ring-2 focus:ring-pink-200" placeholder="https://images.unsplash.com/... atau linear-gradient(...)" />
                      <p className="text-[10px] text-gray-400 mt-1">Foto gratis: unsplash.com — tambahkan <code className="bg-gray-100 px-1 rounded">?auto=format&fit=crop&q=80&w=1920</code> di akhir URL</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Jadwal Tampil</label>
                        <select onChange={(e) => setNewItemData({...newItemData, schedule_type: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm mt-1 outline-none focus:ring-2 focus:ring-pink-200">
                          <option value="always">Selalu Aktif</option>
                          <option value="specific_date">Tanggal Spesifik</option>
                          <option value="daily_rotation">Rotasi Harian</option>
                        </select>
                      </div>
                      {newItemData.schedule_type === 'specific_date' && (
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tanggal (YYYY-MM-DD)</label>
                          <input type="date" onChange={(e) => setNewItemData({...newItemData, scheduled_date: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm mt-1 outline-none focus:ring-2 focus:ring-pink-200" />
                        </div>
                      )}
                      {newItemData.schedule_type === 'daily_rotation' && (
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hari ke- (1-31)</label>
                          <input type="number" min="1" max="31" onChange={(e) => setNewItemData({...newItemData, rotation_day: parseInt(e.target.value)})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm mt-1 outline-none focus:ring-2 focus:ring-pink-200" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Custom CSS (opsional — hasil generate AI)</label>
                      <textarea onChange={(e) => setNewItemData({...newItemData, custom_css: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-mono mt-1 outline-none focus:ring-2 focus:ring-pink-200 min-h-[80px]" placeholder={`.glass-card { border-radius: 60px !important; }`} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Custom HTML (opsional — elemen dekoratif)</label>
                      <textarea onChange={(e) => setNewItemData({...newItemData, custom_html: e.target.value})} className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-mono mt-1 outline-none focus:ring-2 focus:ring-pink-200 min-h-[80px]" placeholder={`<div style="position:fixed;top:0;left:0;width:100%;pointer-events:none">...</div>`} />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all">Batal</button>
                <button onClick={handleSaveNew} className="flex-1 py-3 bg-pink-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-pink-100 hover:bg-pink-600 transition-all">Simpan</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
