import { useState, useEffect } from 'react';
import { api } from '@services/api';

interface Article {
  id: string;
  title: string;
  description: string;
  content?: string;
  category: string;
  difficulty: string;
  tags: string[];
  videoUrl?: string;
  audioUrl?: string;
  estimatedMinutes: number;
  viewCount: number;
}

const categories = [
  { id: 'tactical_medicine', label: 'Тактична медицина', icon: '🏥' },
  { id: 'weapons', label: 'Озброєння', icon: '🔫' },
  { id: 'topography', label: 'Топографія', icon: '🗺️' },
  { id: 'modern_threats', label: 'Сучасні загрози', icon: '⚠️' },
  { id: 'survival', label: 'Виживання', icon: '🏕️' },
  { id: 'communications', label: 'Комунікація', icon: '📡' }
];

const difficulties = [
  { id: 'beginner', label: 'Початківець', color: '#22c55e' },
  { id: 'intermediate', label: 'Середній', color: '#f59e0b' },
  { id: 'advanced', label: 'Просунутий', color: '#ef4444' },
  { id: 'expert', label: 'Експерт', color: '#8a8a8a' }
];

export function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory, selectedDifficulty]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      let url = '/knowledge-base/articles';
      const params: Record<string, string> = {};

      if (selectedCategory) params.category = selectedCategory;
      if (selectedDifficulty) params.difficulty = selectedDifficulty;

      if (searchQuery) {
        url = '/knowledge-base/search';
        params.query = searchQuery;
      }

      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`${url}${queryString ? '?' + queryString : ''}`);
      let articles = response.data.data || response.data || [];

      // Parse JSON strings to arrays for tags
      articles = articles.map((a: any) => ({
        ...a,
        tags: typeof a.tags === 'string' ? JSON.parse(a.tags) : (a.tags || []),
      }));

      setArticles(articles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchArticles();
  };

  const getDifficultyBadge = (difficulty: string) => {
    const diff = difficulties.find(d => d.id === difficulty);
    if (!diff) return null;
    return (
      <span className="badge rounded-none font-mono uppercase tracking-widest text-[10px]" style={{ background: `${diff.color}15`, color: diff.color, border: `1px solid ${diff.color}` }}>
        {diff.label}
      </span>
    );
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-black uppercase tracking-widest mb-3 glitch-hover cursor-default transition-all duration-300" style={{ color: 'var(--text-primary)', fontSize: '32px', lineHeight: '1.2' }}>
          БАЗА ЗНАНЬ
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
          // МЕДИЦИНА, ОЗБРОЄННЯ, ТОПОГРАФІЯ, ВИЖИВАННЯ //
        </p>
      </div>

      {/* Search Bar */}
      <div
        className="p-4 rounded-none mb-8 animate-fade-in-up bg-[#0a0a0a] border border-[#333]"
        style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
      >
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="🔍 Шукати в базі знань..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input flex-1"
            style={{ fontSize: '15px' }}
          />
          <button type="submit" className="btn btn-primary rounded-none uppercase tracking-widest font-bold" style={{ padding: '14px 24px', fontSize: '14px' }}>
            Пошук
          </button>
        </form>
      </div>

      {/* Categories */}
      <div
        className="p-6 rounded-none mb-8 animate-fade-in-up bg-[#0a0a0a] border border-[#333]"
        style={{ animationDelay: '0.15s', animationFillMode: 'both' }}
      >
        <h2 className="font-mono text-xs font-bold mb-4 uppercase tracking-widest" style={{ color: 'var(--ab3-gold)' }}>
          [ КАТЕГОРІЇ ]
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className="p-4 rounded-none border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_rgba(201,162,39,0.4)]"
            style={{
              background: selectedCategory === null ? 'rgba(201, 162, 39, 0.15)' : '#050505',
              borderColor: selectedCategory === null ? 'var(--ab3-gold)' : '#333',
            }}
          >
            <div className="text-3xl mb-2">📖</div>
            <div className="font-mono font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)', fontSize: '11px' }}>Усі статті</div>
          </button>

          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="p-4 rounded-none border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_rgba(201,162,39,0.4)]"
              style={{
                background: selectedCategory === cat.id ? 'rgba(201, 162, 39, 0.15)' : '#050505',
                borderColor: selectedCategory === cat.id ? 'var(--ab3-gold)' : '#333',
              }}
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <div className="font-mono font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)', fontSize: '11px' }}>{cat.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Filter */}
      <div
        className="p-4 rounded-none mb-8 animate-fade-in-up bg-[#0a0a0a] border border-[#333]"
        style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <button
            onClick={() => setSelectedDifficulty(null)}
            className="btn w-full flex items-center justify-center text-center rounded-none uppercase tracking-widest font-bold"
            style={{
              background: selectedDifficulty === null ? 'var(--gradient-gold)' : 'transparent',
              color: selectedDifficulty === null ? 'var(--ab3-black)' : 'var(--text-muted)',
              border: `1px solid ${selectedDifficulty === null ? 'var(--ab3-gold)' : 'var(--border-subtle)'}`,
              padding: '10px 18px',
              fontSize: '13px',
            }}
          >
            Усі рівні
          </button>
          {difficulties.map(diff => (
            <button
              key={diff.id}
              onClick={() => setSelectedDifficulty(diff.id)}
              className="btn w-full flex items-center justify-center text-center rounded-none uppercase tracking-widest font-bold"
              style={{
                background: selectedDifficulty === diff.id ? diff.color : 'transparent',
                color: selectedDifficulty === diff.id ? 'white' : 'var(--text-muted)',
                border: `1px solid ${selectedDifficulty === diff.id ? diff.color : 'var(--border-subtle)'}`,
                padding: '10px 18px',
                fontSize: '13px',
              }}
            >
              {diff.label}
            </button>
          ))}
        </div>
      </div>

      {/* Articles List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>
            {loading ? 'ЗАВАНТАЖЕННЯ...' : `${articles.length} СТАТЕЙ`}
          </h2>
        </div>

        {loading ? (
          <div className="p-16 rounded-none text-center animate-fade-in-up bg-[#0a0a0a] border border-[#333]">
            <svg className="animate-spin w-12 h-12 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/>
            </svg>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>Завантаження матеріалів...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="p-16 rounded-none text-center animate-fade-in-up bg-[#0a0a0a] border border-[#333]" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-heading font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)', fontSize: '20px' }}>СТАТЕЙ НЕ ЗНАЙДЕНО</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6' }}>Спробуйте змінити фільтри або пошуковий запит</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article, index) => (
              <button
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="military-card h-full flex flex-col rounded-none p-6 text-left group cursor-pointer animate-fade-in-up transition-all duration-300 hover:-translate-y-1 bg-[#0a0a0a] border border-[#333] hover:border-[var(--ab3-gold)] relative overflow-hidden"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
              >
                <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'var(--gradient-gold)' }} />

                <div className="flex-1">
                  <h3 className="text-lg font-heading font-black uppercase tracking-widest mb-3 group-hover:text-[var(--ab3-gold)] transition-colors duration-300" style={{ color: 'var(--text-primary)', fontSize: '17px', lineHeight: '1.3' }}>
                    {article.title}
                  </h3>
                  <p className="font-mono text-xs mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    {article.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="badge rounded-none font-mono uppercase tracking-widest bg-[#111] border border-[var(--ab3-gold)] text-[var(--ab3-gold)] text-[10px]">{article.category}</span>
                    {getDifficultyBadge(article.difficulty)}
                  </div>
                </div>

                <div className="mt-auto w-full flex justify-between items-center font-mono uppercase tracking-widest pt-4 border-t" style={{ borderColor: '#222', color: 'var(--text-muted)', fontSize: '10px' }}>
                  <span>⏱️ {article.estimatedMinutes} хв</span>
                  <span>👁️ {article.viewCount}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50 animate-scale-in"
          style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedArticle(null)}
        >
          <div
            className="rounded-none max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-fade-in-up"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', animationFillMode: 'both' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-heading font-bold" style={{ color: 'var(--text-primary)', fontSize: '24px', lineHeight: '1.3' }}>
                    {selectedArticle.title}
                  </h2>
                  <p className="text-sm mt-3" style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6' }}>
                    {selectedArticle.description}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="text-2xl hover:opacity-70 flex-shrink-0 ml-4"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex flex-wrap gap-2">
                <span className="badge badge-gold">{selectedArticle.category}</span>
                {getDifficultyBadge(selectedArticle.difficulty)}
              </div>

              {/* Full Article Content */}
              {selectedArticle.content && (
                <div className="p-5 rounded-none" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
                  <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--ab3-gold)', fontSize: '13px', letterSpacing: '0.5px' }}>📖 ЗМІСТ СТАТТІ</h3>
                  <div className="prose" style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.7' }}>
                    {selectedArticle.content.split('\n').map((line: string, i: number) => {
                      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-5 mb-2" style={{ color: 'var(--text-primary)', fontSize: '17px' }}>{line.replace('### ', '')}</h3>;
                      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-6 mb-3" style={{ color: 'var(--ab3-gold)', fontSize: '19px' }}>{line.replace('## ', '')}</h2>;
                      if (line.startsWith('**')) {
                        const parts = line.split(/\*\*(.*?)\*\*/);
                        return <p key={i} className="font-semibold" style={{ color: 'var(--text-primary)' }}>{parts.map((p: string, j: number) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</p>;
                      }
                      if (line.startsWith('- ')) return <li key={i} className="ml-4 mb-1" style={{ color: 'var(--text-secondary)' }}>{line.replace('- ', '• ')}</li>;
                      if (/^\d+\.\s/.test(line)) return <p key={i} className="mb-1" style={{ color: 'var(--text-secondary)' }}>{line}</p>;
                      if (line.trim() === '') return <div key={i} className="h-2" />;
                      return <p key={i} className="mb-1" style={{ color: 'var(--text-secondary)' }}>{line}</p>;
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-5 text-sm">
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Час читання</p>
                  <p className="font-bold" style={{ color: 'var(--text-primary)', fontSize: '18px' }}>{selectedArticle.estimatedMinutes} хв</p>
                </div>
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Переглядів</p>
                  <p className="font-bold" style={{ color: 'var(--text-primary)', fontSize: '18px' }}>{selectedArticle.viewCount}</p>
                </div>
              </div>

              {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                <div>
                  <p className="text-xs mb-3" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Теги</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.tags.map(tag => (
                      <span key={tag} className="badge" style={{ background: 'var(--bg-glass)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', fontSize: '11px' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
