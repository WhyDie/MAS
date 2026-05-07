import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@services/api';
import { useAuthStore } from '@stores/index';

interface MilitaryResource {
  id: string;
  name: string;
  url: string;
  description?: string;
  icon?: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}

const categories = [
  { id: 'all' as const, label: 'Все', icon: '🌐' },
  { id: 'official' as const, label: 'Офіційні', icon: '🏛️' },
  { id: 'support' as const, label: 'Допомога', icon: '🤝' },
  { id: 'benefits' as const, label: 'Пільги', icon: '💳' },
  { id: 'training' as const, label: 'Навчання', icon: '📚' },
  { id: 'community' as const, label: 'Спільнота', icon: '👥' },
];

export function GuidePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [resources, setResources] = useState<MilitaryResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => { loadResources(); }, [selectedCategory]);

  const loadResources = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      const res = await api.get('/unit-guide/resources', { params });
      const data = res.data.data || res.data || [];
      setResources(data.sort((a: MilitaryResource, b: MilitaryResource) => a.sortOrder - b.sortOrder));
    } catch (err) {
      console.error('Failed to load resources:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter(r => {
    const matchesSearch = searchQuery === '' ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const canManage = user?.role === 'commander' || user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-heading font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px', lineHeight: '1.2' }}>
              ПУТІВНИК ПО РЕСУРСАХ
            </h1>
            <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              // САЙТИ, СЕРВІСИ ТА РЕСУРСИ ЗСУ //
            </p>
          </div>
          {canManage && (
            <button onClick={() => navigate('/guide-admin')} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
              ⚙️ Управління ресурсами
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="p-4 rounded-none mb-6 animate-fade-in-up bg-[#0a0a0a] border border-[#333]" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 Пошук ресурсів..."
          className="input"
          style={{ fontSize: '15px' }}
        />
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className="btn w-full flex items-center justify-center text-center"
            style={{
              background: selectedCategory === cat.id ? 'var(--gradient-gold)' : 'transparent',
              color: selectedCategory === cat.id ? 'var(--ab3-black)' : 'var(--text-muted)',
              border: `1px solid ${selectedCategory === cat.id ? 'var(--ab3-gold)' : '#333'}`,
              padding: '8px 14px',
              fontSize: '12px',
            }}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="p-16 text-center rounded-none bg-[#111] border border-[#333]">
          <svg className="animate-spin w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/></svg>
          <p style={{ color: 'var(--text-muted)' }}>Завантаження...</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="p-16 text-center rounded-none bg-[#111] border border-[#333]">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Ресурсів не знайдено</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6' }}>Спробуйте змінити пошуковий запит або фільтри</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource, index) => (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
            className="military-card h-full flex flex-col text-center rounded-none p-6 group animate-fade-in-up transition-all duration-300 hover:-translate-y-1 bg-[#0a0a0a] border border-[#333] relative overflow-hidden"
            style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'both' }}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'var(--gradient-gold)' }} />
              <div className="flex-1 flex flex-col items-center">
                <div className="w-16 h-16 rounded-none flex items-center justify-center text-3xl flex-shrink-0 bg-[#111] border border-[#333] mb-4">
                  {resource.icon || '🌐'}
                </div>
                <h3 className="font-bold group-hover:text-[var(--ab3-gold)] transition-colors duration-300" style={{ color: 'var(--text-primary)', fontSize: '16px', lineHeight: '1.3' }}>
                  {resource.name}
                </h3>
                <p className="text-xs" style={{ color: 'var(--ab3-gold)', fontSize: '12px' }}>{new URL(resource.url).hostname}</p>
                {resource.description && (
                  <p className="text-sm mt-3 line-clamp-3" style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                    {resource.description}
                  </p>
                )}
              </div>
              <div className="mt-auto w-full flex items-center justify-center pt-4 border-t border-[#222]">
                <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                  🔗 Перейти на сайт →
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
