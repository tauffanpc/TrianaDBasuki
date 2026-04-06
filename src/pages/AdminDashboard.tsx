import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Download, Upload, LogOut, 
  MessageSquare, Heart, Smile, Image, 
  FileSpreadsheet, AlertCircle, CheckCircle2,
  Inbox, LayoutDashboard, Eye, Pencil, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { getSupabase } from '../lib/supabase';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Message, Greeting, MoodMessage, UserMessage, Theme, MoodLog } from '../types';
import { MOODS, DEFAULT_THEMES } from '../constants';
import Layout from '../components/Layout';
import { cn } from '../lib/utils';
import { Palette } from 'lucide-react';

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

  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
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
      
      // Remove internal fields that shouldn't be updated directly or might cause issues
      const id = dataToUpdate.id;
      delete dataToUpdate.id;
      delete dataToUpdate.created_at;

      if (table === 'messages') {
        if (!dataToUpdate.day || !dataToUpdate.message) {
          throw new Error('Hari dan Pesan romantis harus diisi!');
        }
        dataToUpdate.day = parseInt(dataToUpdate.day);
        if (isNaN(dataToUpdate.day)) throw new Error('Hari harus berupa angka!');
        if (dataToUpdate.month) {
          dataToUpdate.month = parseInt(dataToUpdate.month);
          if (isNaN(dataToUpdate.month)) throw new Error('Bulan harus berupa angka!');
        } else {
          dataToUpdate.month = null;
        }
      } else if (table === 'greetings') {
        if (!dataToUpdate.type || !dataToUpdate.text) {
          throw new Error('Tipe dan Teks sapaan harus diisi!');
        }
      } else if (table === 'themes') {
        if (!dataToUpdate.name) throw new Error('Nama tema harus diisi!');
        if (dataToUpdate.rotation_day) {
          dataToUpdate.rotation_day = parseInt(dataToUpdate.rotation_day);
          if (isNaN(dataToUpdate.rotation_day)) throw new Error('Hari rotasi harus berupa angka!');
        }
      }

      const { error: updateError } = await supabase.from(table).update(dataToUpdate).eq('id', id);
      if (updateError) throw updateError;
      
      setEditingId(null);
      fetchData();
      alert('Berhasil memperbarui data!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const [isThemesTableMissing, setIsThemesTableMissing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setIsThemesTableMissing(false);
    try {
      const supabase = getSupabase();
      const [msgs, greets, moods, inbox, themesData] = await Promise.all([
        supabase.from('messages').select('*').order('day', { ascending: true }),
        supabase.from('greetings').select('*'),
        supabase.from('mood_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('user_messages').select('*').order('created_at', { ascending: false }),
        supabase.from('themes').select('*').order('created_at', { ascending: true })
      ]);

      if (msgs.error) throw msgs.error;
      if (greets.error) throw greets.error;
      if (moods.error) throw moods.error;
      if (inbox.error) throw inbox.error;
      
      // Handle missing themes table gracefully (PGRST205)
      if (themesData.error) {
        if (themesData.error.code === 'PGRST205') {
          setIsThemesTableMissing(true);
        } else {
          throw themesData.error;
        }
      }

      setMessages(msgs.data || []);
      setGreetings(greets.data || []);
      setMoodLogs(moods.data || []);
      setUserMessages(inbox.data || []);
      setThemes(themesData.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_auth');
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
    XLSX.utils.book_append_sheet(wb, ws, "Template");
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
        
        alert('Import berhasil!');
        fetchData();
      } catch (err: any) {
        alert('Gagal import: ' + err.message);
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
    } catch (err: any) {
      alert(err.message);
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
        if (!data.day || !data.message) {
          throw new Error('Hari dan Pesan romantis harus diisi!');
        }
        data.day = parseInt(data.day);
        if (isNaN(data.day)) {
          throw new Error('Hari harus berupa angka!');
        }
        if (data.month) {
          data.month = parseInt(data.month);
          if (isNaN(data.month)) throw new Error('Bulan harus berupa angka!');
        } else {
          data.month = null;
        }
      } else if (activeTab === 'greetings') {
        table = 'greetings';
        if (!data.type || !data.text) {
          throw new Error('Tipe dan Teks sapaan harus diisi!');
        }
      } else if (activeTab === 'themes') {
        table = 'themes';
        if (!data.name) {
          throw new Error('Nama tema harus diisi!');
        }
        data.background_gradient = data.background_gradient || 'linear-gradient(to bottom right, #fff1f2, #fffafa)';
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
      alert('Berhasil menambahkan data baru!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <Layout fullWidth>
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-120px)] gap-6 relative">
        {/* Mobile Sidebar Toggle */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="md:hidden fixed bottom-24 right-6 z-[60] p-4 bg-pink-500 text-white rounded-full shadow-2xl"
        >
          <LayoutDashboard className="w-6 h-6" />
        </button>

        {/* Mobile Sidebar Overlay */}
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
            x: isSidebarOpen ? 0 : (window.innerWidth < 768 ? -300 : 0),
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
                { id: 'guide', label: 'Panduan Custom', icon: FileSpreadsheet },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setIsSidebarOpen(false);
                  }}
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
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold",
                      activeTab === tab.id ? "bg-white text-pink-500" : "bg-pink-100 text-pink-500"
                    )}>
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

        {/* Main Content Area */}
        <div className="flex-1 space-y-8 min-w-0">
          {/* Header (Desktop Only) */}
          <div className="hidden md:flex justify-between items-center bg-white/60 backdrop-blur-md p-6 rounded-[2rem] border border-white/40 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-500">
                {activeTab === 'messages' && <MessageSquare className="w-6 h-6" />}
                {activeTab === 'greetings' && <Heart className="w-6 h-6" />}
                {activeTab === 'mood_stats' && <Smile className="w-6 h-6" />}
                {activeTab === 'themes' && <Palette className="w-6 h-6" />}
                {activeTab === 'inbox' && <Inbox className="w-6 h-6" />}
                {activeTab === 'guide' && <FileSpreadsheet className="w-6 h-6" />}
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 capitalize">{activeTab.replace('_', ' ')}</h1>
                <p className="text-xs text-gray-600">Kelola konten bagian {activeTab}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.open('/home?preview_date=' + new Date().toISOString().split('T')[0], '_blank')}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all flex items-center gap-2 text-xs font-bold"
              >
                <Eye className="w-4 h-4" /> Preview App
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
            {activeTab === 'guide' && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <h2 className="text-2xl font-display font-bold text-gray-800">Panduan Custom Tema</h2>
                  <p className="text-sm text-gray-500">Pelajari cara menggunakan fitur advanced untuk mempercantik website Anda.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 bg-blue-50 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3 text-blue-600">
                      <LayoutDashboard className="w-6 h-6" />
                      <h3 className="font-bold">Custom CSS</h3>
                    </div>
                    <p className="text-xs text-blue-800/70 leading-relaxed">
                      Gunakan CSS untuk mengubah tampilan elemen yang sudah ada. Anda bisa mengubah warna, ukuran, hingga bentuk elemen.
                    </p>
                    <div className="bg-white/60 p-4 rounded-xl font-mono text-[10px] space-y-2 border border-blue-100">
                      <p className="text-blue-500 font-bold">// Contoh: Membuat kartu lebih bulat</p>
                      <p>.glass-card {'{'} border-radius: 60px !important; {'}'}</p>
                      <p className="text-blue-500 font-bold mt-2">// Contoh: Mengubah warna teks utama</p>
                      <p>.text-gray-800 {'{'} color: #ff69b4 !important; {'}'}</p>
                    </div>
                  </div>

                  <div className="p-6 bg-pink-50 rounded-3xl space-y-4">
                    <div className="flex items-center gap-3 text-pink-600">
                      <Eye className="w-6 h-6" />
                      <h3 className="font-bold">Custom HTML</h3>
                    </div>
                    <p className="text-xs text-pink-800/70 leading-relaxed">
                      Gunakan HTML untuk menyisipkan elemen baru ke dalam halaman. Elemen ini akan muncul di lapisan latar belakang.
                    </p>
                    <div className="bg-white/60 p-4 rounded-xl font-mono text-[10px] space-y-2 border border-pink-100">
                      <p className="text-pink-500 font-bold">// Contoh: Teks berjalan</p>
                      <p>{'<marquee className="text-pink-400 font-bold">I Love You Triana!</marquee>'}</p>
                      <p className="text-pink-500 font-bold mt-2">// Contoh: Gambar hiasan</p>
                      <p>{'<img src="URL_GAMBAR" className="w-20 opacity-50" />'}</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-[2.5rem] border border-indigo-100 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-indigo-900">Gunakan AI untuk Custom Tema</h3>
                      <p className="text-xs text-indigo-600">Salin prompt di bawah ini dan gunakan di ChatGPT/Gemini untuk membuat kode custom.</p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="p-4 bg-white/60 rounded-2xl space-y-2 border border-indigo-100">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Prompt untuk CSS</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText("Saya ingin mengubah tampilan website saya yang menggunakan Tailwind CSS. Tolong buatkan kode CSS murni (bukan Tailwind classes) untuk mengubah: [Sebutkan elemen yang ingin diubah, misal: warna background, bentuk tombol, atau font]. Berikan kodenya saja.");
                            alert("Prompt disalin!");
                          }}
                          className="text-[10px] text-indigo-500 font-bold hover:underline"
                        >
                          Salin Prompt
                        </button>
                      </div>
                      <p className="text-[11px] text-indigo-900 italic">"Saya ingin mengubah tampilan website saya yang menggunakan Tailwind CSS. Tolong buatkan kode CSS murni..."</p>
                    </div>

                    <div className="p-4 bg-white/60 rounded-2xl space-y-2 border border-indigo-100">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Prompt untuk HTML</span>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText("Tolong buatkan kode HTML sederhana untuk elemen dekoratif website, misalnya: [Sebutkan elemen, misal: animasi salju, teks berjalan, atau widget ucapan]. Pastikan kodenya mandiri dan tidak memerlukan file eksternal.");
                            alert("Prompt disalin!");
                          }}
                          className="text-[10px] text-indigo-500 font-bold hover:underline"
                        >
                          Salin Prompt
                        </button>
                      </div>
                      <p className="text-[11px] text-indigo-900 italic">"Tolong buatkan kode HTML sederhana untuk elemen dekoratif website, misalnya: animasi salju..."</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-3xl space-y-2 border border-gray-100">
                  <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-400" /> Tips Penting
                  </h4>
                  <ul className="text-xs text-gray-500 space-y-2 list-disc pl-4">
                    <li>Gunakan <code className="bg-gray-200 px-1 rounded">!important</code> di akhir kode CSS jika perubahan tidak muncul.</li>
                    <li>Pastikan kode HTML yang Anda masukkan aman dan tidak merusak tata letak utama.</li>
                    <li>Anda bisa menggunakan class Tailwind CSS langsung di dalam kode HTML kustom Anda.</li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="font-bold text-gray-800">Daftar Pesan Harian</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => downloadTemplate('messages')}
                    className="p-2 text-pink-500 hover:bg-pink-50 rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
                  >
                    <Download className="w-4 h-4" /> Template
                  </button>
                  <label className="p-2 bg-pink-500 text-white rounded-xl cursor-pointer hover:bg-pink-600 transition-all flex items-center gap-2 text-xs font-bold">
                    <Upload className="w-4 h-4" /> Import Excel
                    <input type="file" className="hidden" onChange={(e) => handleImport(e, 'messages')} />
                  </label>
                </div>
              </div>
              
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className="p-5 bg-gray-50 rounded-2xl flex justify-between items-start gap-4 group border border-transparent hover:border-pink-100 transition-all">
                    {editingId === msg.id ? (
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <input 
                            type="number" 
                            value={editData.day || ''} 
                            onChange={(e) => setEditData({...editData, day: e.target.value})}
                            className="w-20 p-2 border rounded-lg text-xs"
                            placeholder="Hari"
                          />
                          <input 
                            type="number" 
                            value={editData.month || ''} 
                            onChange={(e) => setEditData({...editData, month: e.target.value})}
                            className="w-20 p-2 border rounded-lg text-xs"
                            placeholder="Bulan"
                          />
                        </div>
                        <textarea 
                          value={editData.message} 
                          onChange={(e) => setEditData({...editData, message: e.target.value})}
                          className="w-full p-2 border rounded-lg text-xs min-h-[80px]"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveEdit('messages')} className="px-3 py-1 bg-green-500 text-white rounded-lg text-[10px] font-bold">Simpan</button>
                          <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-200 text-gray-600 rounded-lg text-[10px] font-bold">Batal</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-pink-100 text-pink-600 rounded-md text-[10px] font-bold">
                            Tgl {msg.day}{msg.month ? `/${msg.month}` : ' (Bulanan)'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{msg.message}</p>
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => handleEdit(msg)}
                        className="p-2 text-gray-300 hover:text-blue-500 transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(msg.id, 'messages')}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={addItem}
                  className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 hover:border-pink-200 hover:text-pink-400 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                >
                  <Plus className="w-4 h-4" /> Tambah Pesan Baru
                </button>
              </div>
            </div>
          )}

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
                          <button 
                            onClick={() => handleDelete(msg.id, 'user_messages')}
                            className="hover:text-red-500 transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          {activeTab === 'mood_stats' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pie Chart Card */}
                <div className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/40 shadow-sm space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-500">
                      <Smile className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900">Persentase Mood</h2>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Distribusi perasaan Triana</p>
                    </div>
                  </div>
                  
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={MOODS.map(m => ({
                            name: m.label,
                            value: moodLogs.filter(log => log.mood === m.type).length,
                            color: m.hex
                          })).filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {MOODS.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.hex} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Summary Card */}
                <div className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/40 shadow-sm space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-500">
                      <LayoutDashboard className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900">Ringkasan Mood</h2>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Total pilihan mood</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {MOODS.map(m => {
                      const count = moodLogs.filter(log => log.mood === m.type).length;
                      return (
                        <div key={m.type} className="p-4 rounded-2xl bg-white/40 border border-white/60 flex flex-col items-center text-center space-y-2">
                          <span className="text-2xl">{m.emoji}</span>
                          <span className="text-xs font-bold text-gray-900">{m.label}</span>
                          <span className="text-2xl font-display font-bold text-pink-500">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Mood Logs List */}
              <div className="bg-white/60 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/40 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-500">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900">Log Mood Terbaru</h2>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Riwayat perasaan Triana</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const data = moodLogs.map(log => ({
                        Mood: MOODS.find(m => m.type === log.mood)?.label || log.mood,
                        Emoji: MOODS.find(m => m.type === log.mood)?.emoji || '',
                        Waktu: format(new Date(log.created_at), 'dd MMM yyyy HH:mm'),
                        DeviceID: log.device_id
                      }));
                      const ws = XLSX.utils.json_to_sheet(data);
                      const wb = XLSX.utils.book_new();
                      XLSX.utils.book_append_sheet(wb, ws, "Mood Logs");
                      XLSX.writeFile(wb, "mood_logs.xlsx");
                    }}
                    className="px-4 py-2 bg-pink-50 text-pink-500 rounded-xl text-xs font-bold hover:bg-pink-100 transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Export Excel
                  </button>
                </div>

                <div className="space-y-3">
                  {moodLogs.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 italic text-sm">Belum ada data mood yang tercatat.</div>
                  ) : (
                    moodLogs.slice(0, 50).map((log) => (
                      <div key={log.id} className="p-4 bg-white/40 rounded-2xl border border-white/60 flex items-center justify-between group hover:bg-white/60 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center text-xl">
                            {MOODS.find(m => m.type === log.mood)?.emoji}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">
                              {MOODS.find(m => m.type === log.mood)?.label}
                            </p>
                            <p className="text-[10px] text-gray-500 font-medium">
                              {format(new Date(log.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })}
                            </p>
                          </div>
                        </div>
                        <div className="text-[10px] font-mono text-gray-300 group-hover:text-gray-400 transition-colors">
                          ID: {log.device_id.substring(0, 8)}...
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'greetings' && (
            <div className="space-y-6">
              <h2 className="font-bold text-gray-800">Sapaan (Greetings)</h2>
              <div className="space-y-4">
                {greetings.map((g) => (
                  <div key={g.id} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center border border-transparent hover:border-pink-100 transition-all">
                    {editingId === g.id ? (
                      <div className="flex-1 space-y-2">
                        <select 
                          value={editData.type} 
                          onChange={(e) => setEditData({...editData, type: e.target.value})}
                          className="w-full p-2 border rounded-lg text-xs"
                        >
                          <option value="daily">Daily</option>
                          <option value="random">Random</option>
                        </select>
                        <input 
                          type="text"
                          value={editData.text} 
                          onChange={(e) => setEditData({...editData, text: e.target.value})}
                          className="w-full p-2 border rounded-lg text-xs"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveEdit('greetings')} className="px-3 py-1 bg-green-500 text-white rounded-lg text-[10px] font-bold">Simpan</button>
                          <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-200 text-gray-600 rounded-lg text-[10px] font-bold">Batal</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1 flex-1">
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wider">{g.type}</span>
                        <p className="text-sm text-gray-600 font-medium leading-tight">{g.text}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(g)} className="p-2 text-gray-300 hover:text-blue-500 transition-colors"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(g.id, 'greetings')} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={addItem}
                  className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 hover:border-pink-200 hover:text-pink-400 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                >
                  <Plus className="w-4 h-4" /> Tambah Sapaan Baru
                </button>
              </div>
            </div>
          )}

          {activeTab === 'themes' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-bold text-gray-800">Tema & Background</h2>
                  <p className="text-[10px] text-gray-400">Atur visual website secara menyeluruh</p>
                </div>
                <div className="flex gap-2">
                  {!isThemesTableMissing && (
                    <button 
                      onClick={addItem}
                      className="px-4 py-2 bg-pink-500 text-white rounded-xl text-xs font-bold hover:bg-pink-600 transition-all"
                    >
                      Tambah Tema Baru
                    </button>
                  )}
                </div>
              </div>

              {isThemesTableMissing ? (
                <div className="p-8 bg-red-50 rounded-[2rem] border border-red-100 space-y-6 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-bold text-red-800">Tabel 'themes' Perlu Diperbarui</h3>
                    <p className="text-xs text-red-600 leading-relaxed max-w-sm mx-auto">
                      Fitur tema sekarang mendukung Background dan Custom CSS. Silakan jalankan perintah SQL berikut untuk memperbarui tabel:
                    </p>
                  </div>
                  <div className="bg-gray-900 p-4 rounded-xl text-left overflow-x-auto">
                    <pre className="text-[10px] text-green-400 font-mono leading-relaxed">
{`-- Jalankan ini jika tabel belum ada:
create table themes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  primary_color text not null,
  secondary_color text not null,
  accent_color text not null,
  background_gradient text not null,
  background_url text,
  custom_css text,
  custom_html text,
  schedule_type text default 'always',
  scheduled_date text,
  rotation_day integer,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Jalankan ini jika tabel sudah ada tapi kolom baru belum ada:
alter table themes add column if not exists background_url text;
alter table themes add column if not exists custom_css text;
alter table themes add column if not exists custom_html text;
alter table themes add column if not exists schedule_type text default 'always';
alter table themes add column if not exists scheduled_date text;
alter table themes add column if not exists rotation_day integer;

-- Enable RLS
alter table themes enable row level security;

-- Create policies
create policy "Allow public read access" on themes for select using (true);
create policy "Allow admin all access" on themes for all using (true);`}
                    </pre>
                  </div>
                  <button 
                    onClick={fetchData}
                    className="px-6 py-3 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-100"
                  >
                    Cek Lagi Setelah Menjalankan SQL
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {themes.map((theme) => (
                      <div key={theme.id} className="p-6 bg-gray-50 rounded-3xl space-y-4 border border-gray-100 group relative hover:shadow-md transition-all">
                        {editingId === theme.id ? (
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Nama Tema</label>
                              <input 
                                type="text" 
                                value={editData.name} 
                                onChange={(e) => setEditData({...editData, name: e.target.value})}
                                className="w-full p-2 border rounded-lg text-xs"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Primary</label>
                                <input type="color" value={editData.primary_color} onChange={(e) => setEditData({...editData, primary_color: e.target.value})} className="w-full h-8 rounded" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Secondary</label>
                                <input type="color" value={editData.secondary_color} onChange={(e) => setEditData({...editData, secondary_color: e.target.value})} className="w-full h-8 rounded" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Accent</label>
                                <input type="color" value={editData.accent_color} onChange={(e) => setEditData({...editData, accent_color: e.target.value})} className="w-full h-8 rounded" />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Background URL (Image/Gradient)</label>
                              <input 
                                type="text" 
                                value={editData.background_url || ''} 
                                onChange={(e) => setEditData({...editData, background_url: e.target.value})}
                                className="w-full p-2 border rounded-lg text-xs"
                                placeholder="https://... atau linear-gradient(...)"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Jadwal</label>
                                <select 
                                  value={editData.schedule_type || 'always'} 
                                  onChange={(e) => setEditData({...editData, schedule_type: e.target.value})}
                                  className="w-full p-2 border rounded-lg text-xs"
                                >
                                  <option value="always">Selalu Aktif</option>
                                  <option value="specific_date">Tanggal Spesifik</option>
                                  <option value="daily_rotation">Rotasi Harian</option>
                                </select>
                              </div>
                              {editData.schedule_type === 'specific_date' && (
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase">Tanggal (YYYY-MM-DD)</label>
                                  <input 
                                    type="date" 
                                    value={editData.scheduled_date || ''} 
                                    onChange={(e) => setEditData({...editData, scheduled_date: e.target.value})}
                                    className="w-full p-2 border rounded-lg text-xs"
                                  />
                                </div>
                              )}
                              {editData.schedule_type === 'daily_rotation' && (
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase">Hari ke- (1-31)</label>
                                  <input 
                                    type="number" 
                                    min="1" max="31"
                                    value={editData.rotation_day || ''} 
                                    onChange={(e) => setEditData({...editData, rotation_day: e.target.value})}
                                    className="w-full p-2 border rounded-lg text-xs"
                                  />
                                </div>
                              )}
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Custom CSS (Advanced)</label>
                              <textarea 
                                value={editData.custom_css || ''} 
                                onChange={(e) => setEditData({...editData, custom_css: e.target.value})}
                                className="w-full p-2 border rounded-lg text-[10px] font-mono min-h-[80px]"
                                placeholder=".main-card { border-radius: 50px; }"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Custom HTML (Advanced)</label>
                              <textarea 
                                value={editData.custom_html || ''} 
                                onChange={(e) => setEditData({...editData, custom_html: e.target.value})}
                                className="w-full p-2 border rounded-lg text-[10px] font-mono min-h-[80px]"
                                placeholder="<div>Konten kustom</div>"
                              />
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
                                <div className="flex gap-2 mt-1">
                                  <span className={cn(
                                    "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                    theme.is_active ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-500"
                                  )}>
                                    {theme.is_active ? 'Aktif' : 'Nonaktif'}
                                  </span>
                                  {theme.custom_css && (
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-blue-100 text-blue-600">
                                      CSS
                                    </span>
                                  )}
                                  {theme.custom_html && (
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-purple-100 text-purple-600">
                                      HTML
                                    </span>
                                  )}
                                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-orange-100 text-orange-600">
                                    {theme.schedule_type === 'specific_date' ? `Tgl: ${theme.scheduled_date}` : 
                                     theme.schedule_type === 'daily_rotation' ? `Hari: ${theme.rotation_day}` : 'Selalu'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => handleEdit(theme)}
                                  className="p-2 text-gray-300 hover:text-blue-500 transition-colors"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(theme.id, 'themes')}
                                  className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div 
                              className="w-full h-24 rounded-2xl border border-gray-200 shadow-inner overflow-hidden relative"
                              style={{ 
                                backgroundImage: theme.background_url?.startsWith('http') ? `url(${theme.background_url})` : (theme.background_url || theme.background_gradient),
                                backgroundColor: (!theme.background_url?.startsWith('http') && !theme.background_url?.includes('gradient') && !theme.background_gradient?.includes('gradient')) ? (theme.background_url || theme.background_gradient) : undefined,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                              }}
                            >
                              <div className="absolute bottom-2 left-2 flex gap-1.5">
                                <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: theme.primary_color }} />
                                <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: theme.secondary_color }} />
                                <div className="w-5 h-5 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: theme.accent_color }} />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  {themes.length === 0 && (
                    <div className="text-center py-10 space-y-4">
                      <p className="text-sm text-gray-400 italic">Belum ada tema custom. Gunakan tema default?</p>
                      <button 
                        onClick={async () => {
                          try {
                            const supabase = getSupabase();
                            const { error: addError } = await supabase.from('themes').insert(DEFAULT_THEMES);
                            if (addError) throw addError;
                            fetchData();
                          } catch (err: any) {
                            alert(err.message);
                          }
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
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] p-8 shadow-2xl relative z-10 w-full max-w-md space-y-6"
            >
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-800">
                  Tambah {activeTab === 'messages' ? 'Pesan Baru' : activeTab === 'greetings' ? 'Sapaan Baru' : 'Tema Baru'}
                </h3>
                <p className="text-xs text-gray-400">Masukkan data yang diperlukan di bawah ini.</p>
              </div>

              <div className="space-y-4">
                {activeTab === 'themes' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nama Tema</label>
                      <input 
                        type="text" 
                        onChange={(e) => setNewItemData({...newItemData, name: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-pink-400 outline-none"
                        placeholder="Contoh: Romantic Pink"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Primary Color</label>
                        <input 
                          type="color" 
                          onChange={(e) => setNewItemData({...newItemData, primary_color: e.target.value})}
                          className="w-full h-10 p-1 bg-gray-50 border border-gray-100 rounded-xl outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Secondary Color</label>
                        <input 
                          type="color" 
                          onChange={(e) => setNewItemData({...newItemData, secondary_color: e.target.value})}
                          className="w-full h-10 p-1 bg-gray-50 border border-gray-100 rounded-xl outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Accent Color (Background Soft)</label>
                      <input 
                        type="color" 
                        onChange={(e) => setNewItemData({...newItemData, accent_color: e.target.value})}
                        className="w-full h-10 p-1 bg-gray-50 border border-gray-100 rounded-xl outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Background URL (Image/Gradient)</label>
                      <input 
                        type="text" 
                        onChange={(e) => setNewItemData({...newItemData, background_url: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-pink-400 outline-none"
                        placeholder="https://... atau linear-gradient(...)"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Jadwal</label>
                        <select 
                          onChange={(e) => setNewItemData({...newItemData, schedule_type: e.target.value})}
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-pink-400 outline-none"
                        >
                          <option value="always">Selalu Aktif</option>
                          <option value="specific_date">Tanggal Spesifik</option>
                          <option value="daily_rotation">Rotasi Harian</option>
                        </select>
                      </div>
                      {newItemData.schedule_type === 'specific_date' && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tanggal</label>
                          <input 
                            type="date" 
                            onChange={(e) => setNewItemData({...newItemData, scheduled_date: e.target.value})}
                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-pink-400 outline-none"
                          />
                        </div>
                      )}
                      {newItemData.schedule_type === 'daily_rotation' && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hari (1-31)</label>
                          <input 
                            type="number" 
                            min="1" max="31"
                            onChange={(e) => setNewItemData({...newItemData, rotation_day: parseInt(e.target.value)})}
                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-pink-400 outline-none"
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Custom CSS (Advanced)</label>
                      <textarea 
                        onChange={(e) => setNewItemData({...newItemData, custom_css: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-mono focus:ring-2 focus:ring-pink-400 outline-none min-h-[80px]"
                        placeholder=".main-card { border-radius: 50px; }"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Custom HTML (Advanced)</label>
                      <textarea 
                        onChange={(e) => setNewItemData({...newItemData, custom_html: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-mono focus:ring-2 focus:ring-pink-400 outline-none min-h-[80px]"
                        placeholder="<div>Konten kustom</div>"
                      />
                    </div>
                  </>
                )}
                {activeTab === 'messages' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Hari (1-31)</label>
                        <input 
                          type="number" 
                          onChange={(e) => setNewItemData({...newItemData, day: e.target.value})}
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-pink-400 outline-none"
                          placeholder="Contoh: 1"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bulan (Opsional)</label>
                        <input 
                          type="number" 
                          onChange={(e) => setNewItemData({...newItemData, month: e.target.value})}
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-pink-400 outline-none"
                          placeholder="1-12"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pesan Romantis</label>
                      <textarea 
                        onChange={(e) => setNewItemData({...newItemData, message: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-pink-400 outline-none min-h-[120px] resize-none"
                        placeholder="Tuliskan pesanmu di sini..."
                      />
                    </div>
                  </>
                )}

                {activeTab === 'greetings' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tipe Sapaan</label>
                      <select 
                        onChange={(e) => setNewItemData({...newItemData, type: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-pink-400 outline-none"
                      >
                        <option value="">Pilih Tipe</option>
                        <option value="daily">Daily (Harian)</option>
                        <option value="random">Random (Acak)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Teks Sapaan</label>
                      <input 
                        type="text"
                        onChange={(e) => setNewItemData({...newItemData, text: e.target.value})}
                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-pink-400 outline-none"
                        placeholder="Contoh: Selamat pagi, Sayang!"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold text-sm hover:bg-gray-200 transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveNew}
                  className="flex-1 py-3 bg-pink-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-pink-100 hover:bg-pink-600 transition-all"
                >
                  Simpan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
