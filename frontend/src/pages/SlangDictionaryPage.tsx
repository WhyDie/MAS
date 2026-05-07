import React, { useState, useEffect } from 'react';
import { api } from '@services/api';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@stores/index';

export const SlangDictionaryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [terms, setTerms] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTerms = async () => {
      try {
        const res = await api.get('/slang');
        setTerms(res.data?.data || []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    loadTerms();
  }, []);

  const filtered = terms.filter(t => 
    t.term.toLowerCase().includes(search.toLowerCase()) || 
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in-up max-w-4xl mx-auto pb-12">
      <div className="mb-10">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-heading font-black uppercase tracking-widest mb-2 text-white glitch-hover">
              ВІЙСЬКОВИЙ СЛОВНИК
            </h1>
            <p className="font-mono text-xs uppercase tracking-widest text-[var(--ab3-gold)]">
              // ТЕРМІНОЛОГІЯ ТА АБРЕВІАТУРИ //
            </p>
          </div>
          {(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'commander') && (
            <button onClick={() => navigate('/slang-admin')} className="btn btn-primary rounded-none uppercase tracking-widest font-bold" style={{ padding: '10px 20px', fontSize: '13px' }}>⚙️ Редагувати</button>
          )}
        </div>
      </div>

      <div className="flex border border-[#333] bg-[#111] p-1 focus-within:border-[var(--ab3-gold)] transition-colors mb-8 shadow-lg">
        <span className="flex items-center pl-4 pr-2 font-mono text-[var(--ab3-gold)] animate-pulse">&gt;</span>
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder="ПОШУК ТЕРМІНУ ЧИ АБРЕВІАТУРИ..." 
          className="flex-1 bg-transparent px-2 py-4 text-white font-mono uppercase tracking-widest outline-none placeholder-gray-600 text-sm" 
        />
      </div>

      {loading ? (
        <div className="text-center text-[var(--ab3-gold)] font-mono animate-pulse">ОТРИМАННЯ БАЗИ ДАНИХ...</div>
      ) : (
      <div className="grid gap-3">
        {filtered.map((item, i) => (
          <div key={i} className="flex flex-col md:flex-row p-5 bg-[#0a0a0a] border border-[#222] hover:border-[var(--ab3-gold)] transition-colors group">
            <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-[#333] pb-3 md:pb-0 md:pr-4 mb-3 md:mb-0 flex items-center">
              <span className="text-[var(--ab3-gold)] font-mono mr-3 opacity-0 group-hover:opacity-100 transition-opacity">&gt;&gt;</span>
              <h3 className="text-xl font-heading font-black uppercase tracking-widest text-white group-hover:text-[var(--ab3-gold)] transition-colors">
                {item.term}
              </h3>
            </div>
            <div className="md:w-2/3 md:pl-6 flex items-center">
              <p className="text-sm font-mono text-gray-400 leading-relaxed text-justify">
                {item.description}
              </p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="p-10 border border-[#333] bg-[#0a0a0a] text-center font-mono text-gray-500 uppercase tracking-widest">
            Термін не знайдено в базі даних.
          </div>
        )}
      </div>
      )}
    </div>
  );
};