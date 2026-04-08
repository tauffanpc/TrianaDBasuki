  {/* Letakkan di dalam div flex items-center gap-4 pada header */}
  {(location.pathname === '/admin-login' || !location.pathname.startsWith('/admin')) && (
    <button 
      onClick={() => {
        const nextLang = language === 'id' ? 'en' : language === 'en' ? 'zh' : 'id';
        setLanguage(nextLang);
      }}
      className="flex items-center gap-2 px-3 py-2 bg-pink-500 text-white rounded-full shadow-lg hover:bg-pink-600 transition-all border-2 border-white group z-50 pointer-events-auto"
    >
      <Globe className="w-4 h-4 font-bold group-hover:rotate-12 transition-transform" />
      <span className="text-[10px] font-bold uppercase tracking-widest px-1">
        {language === 'en' ? 'EN' : language === 'id' ? 'ID' : 'ZH'}
      </span>
    </button>
  )}
