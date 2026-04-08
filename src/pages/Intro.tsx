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
