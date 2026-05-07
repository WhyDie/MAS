import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@services/api';
import { useAuthStore } from '@stores/index';

interface Announcement {
  id: string;
  title: string;
  text: string;
  createdAt: string;
  author: string;
  type: 'urgent' | 'info' | 'event' | 'warning';
}

const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
  urgent: { label: 'Терміново', color: '#ef4444', icon: '🚨' }, // red
  warning: { label: 'Важливо', color: '#f59e0b', icon: '⚠️' },  // amber
  info: { label: 'Інформація', color: '#3b82f6', icon: 'ℹ️' },  // blue
  event: { label: 'Подія', color: '#22c55e', icon: '📅' },      // green
};

export const NoticeBoardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      try {
        const res = await api.get('/announcements');
        setAnnouncements((res.data.data || res.data || []).sort((a: Announcement, b: Announcement) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (error) {
        console.error("Failed to fetch announcements", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const filteredAnnouncements = announcements.filter(a => {
    const matchesFilter = filter === 'all' || a.type === filter;
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const canManage = user?.role === 'commander' || user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <div className="animate-fade-in-up overflow-x-hidden">
      {/* Header */}
      <div className="mb-8 text-center sm:text-left">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)', lineHeight: '1.2' }}>
              ДОШКА ОГОЛОШЕНЬ
            </h1>
            <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              // ОФІЦІЙНІ ПОВІДОМЛЕННЯ ТА ПОДІЇ //
            </p>
          </div>
          {canManage && (
            <button onClick={() => navigate('/notice-board-admin')} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>⚙️ Управління</button>
          )}
        </div>
      </div>

      {/* Controls: Search and Filters */}
      <div className="p-4 rounded-none mb-8 animate-fade-in-up bg-[#0a0a0a] border border-[#333]" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="🔍 Пошук по оголошеннях..."
            className="input flex-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 w-full lg:w-auto flex-1">
            <button onClick={() => setFilter('all')} className="btn w-full flex items-center justify-center text-center" style={{ background: filter === 'all' ? 'var(--gradient-gold)' : 'transparent', color: filter === 'all' ? 'var(--ab3-black)' : 'var(--text-muted)', border: `1px solid ${filter === 'all' ? 'var(--ab3-gold)' : '#333'}`, padding: '10px 16px', fontSize: '13px' }}>
              Всі
            </button>
            {Object.entries(typeConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="btn w-full flex items-center justify-center text-center"
                style={{ background: filter === key ? `${config.color}20` : 'transparent', color: filter === key ? config.color : 'var(--text-muted)', border: `1px solid ${filter === key ? config.color : '#333'}`, padding: '10px 16px', fontSize: '13px' }}
              >
                {config.icon} {config.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-16 text-center rounded-none bg-[#0a0a0a] border border-[#333]">
            <svg className="animate-spin w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/></svg>
            <p style={{ color: 'var(--text-muted)' }}>Завантаження оголошень...</p>
          </div>
        ) :
        filteredAnnouncements.length === 0 ? (
          <div className="p-16 text-center rounded-none bg-[#0a0a0a] border border-[#333]">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Оголошень не знайдено</h3>
            <p style={{ color: 'var(--text-muted)' }}>Спробуйте змінити параметри пошуку або фільтри</p>
          </div>
        ) : (
          filteredAnnouncements.map((a, index) => {
            const config = typeConfig[a.type];
            return (
              <div key={a.id} className="p-4 sm:p-6 bg-[#0a0a0a] border border-[#333] transition-all duration-300 hover:translate-x-1 animate-fade-in-up relative overflow-hidden" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both', borderLeft: `4px solid ${config.color}` }}>
                
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                  <div>
                    <span className="badge rounded-none font-mono uppercase tracking-widest mb-3 inline-block" style={{ background: `${config.color}15`, color: config.color, border: `1px solid ${config.color}40`, fontSize: '10px' }}>
                      {config.icon} {config.label}
                    </span>
                    <h3 className="text-xl font-heading font-bold text-white">{a.title}</h3>
                  </div>
                  <span className="text-xs text-gray-400 font-mono flex-shrink-0 bg-[#111] px-3 py-1 border border-[#333]">{new Date(a.createdAt).toLocaleString('uk-UA')}</span>
                </div>
                
                <p className="text-gray-300 mb-5 text-sm leading-relaxed">{a.text}</p>
                
                <div className="flex items-center gap-2 border-t border-[#333] pt-4">
                  <span className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Автор: <span style={{ color: 'var(--ab3-gold)' }}>{a.author}</span></span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};