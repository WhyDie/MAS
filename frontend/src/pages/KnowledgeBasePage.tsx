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

const tryzubPoints = [
  // Center (14 points)
  {x:50,y:15}, {x:50,y:20}, {x:50,y:25}, {x:50,y:30}, {x:50,y:35}, {x:50,y:40}, {x:50,y:45},
  {x:50,y:50}, {x:50,y:55}, {x:50,y:60}, {x:50,y:65}, {x:50,y:70}, {x:50,y:75}, {x:50,y:80},
  // Left outer (9 points)
  {x:34,y:30}, {x:33,y:40}, {x:33,y:50}, {x:33,y:60}, {x:35,y:68}, {x:38,y:75}, {x:42,y:79}, {x:46,y:81}, {x:49,y:81},
  // Right outer (9 points)
  {x:66,y:30}, {x:67,y:40}, {x:67,y:50}, {x:67,y:60}, {x:65,y:68}, {x:62,y:75}, {x:58,y:79}, {x:54,y:81}, {x:51,y:81},
  // Left inner (4 points)
  {x:43,y:45}, {x:44,y:52}, {x:46,y:59}, {x:48,y:65},
  // Right inner (4 points)
  {x:57,y:45}, {x:56,y:52}, {x:54,y:59}, {x:52,y:65}
];

const generateFireflyStyles = () => {
  let styles = '';
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  tryzubPoints.forEach((pt, i) => {
    const rX1 = -20 + seededRandom(i * 1.1) * 140; const rY1 = -20 + seededRandom(i * 1.2) * 140;
    const rX2 = -20 + seededRandom(i * 1.3) * 140; const rY2 = -20 + seededRandom(i * 1.4) * 140;
    const rX3 = -20 + seededRandom(i * 1.5) * 140; const rY3 = -20 + seededRandom(i * 1.6) * 140;

    const tX1 = rX1 - pt.x; const tY1 = rY1 - pt.y;
    const tX2 = rX2 - pt.x; const tY2 = rY2 - pt.y;
    const tX3 = rX3 - pt.x; const tY3 = rY3 - pt.y;

    styles += `
      @keyframes firefly-tryzub-${i} {
        0%   { transform: translate(calc(-50% + ${tX1}vw), calc(-50% + ${tY1}vh)); background: #4ade80; box-shadow: 0 0 12px 2px rgba(74,222,128,0.6); opacity: 0; }
        10%  { opacity: 1; }
        25%  { transform: translate(calc(-50% + ${tX2}vw), calc(-50% + ${tY2}vh)); background: #4ade80; box-shadow: 0 0 12px 2px rgba(74,222,128,0.6); }
        45%  { transform: translate(-50%, -50%); background: var(--ab3-gold); box-shadow: 0 0 20px 4px rgba(201,162,39,0.8); }
        55%  { transform: translate(-50%, -50%); background: var(--ab3-gold); box-shadow: 0 0 25px 6px rgba(201,162,39,1); }
        75%  { transform: translate(calc(-50% + ${tX3}vw), calc(-50% + ${tY3}vh)); background: #4ade80; box-shadow: 0 0 12px 2px rgba(74,222,128,0.6); }
        90%  { opacity: 1; }
        100% { transform: translate(calc(-50% + ${tX1}vw), calc(-50% + ${tY1}vh)); background: #4ade80; box-shadow: 0 0 12px 2px rgba(74,222,128,0.6); opacity: 0; }
      }
    `;
  });
  return styles;
};
const fireflyStyles = generateFireflyStyles();

export function KnowledgeBasePage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory, selectedDifficulty]);

  const fetchArticles = async () => {
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
      <span className="badge" style={{ background: `${diff.color}20`, color: diff.color, border: `1px solid ${diff.color}40` }}>
        {diff.label}
      </span>
    );
  };

  return (
    <div className="relative min-h-[calc(100vh-6rem)] pb-12 animate-fade-in-up z-10">
      {/* Військовий фон: Хаотичні світлячки, що об'єднуються у Тризуб */}
      <div className="fixed inset-0 z-[-1] bg-[var(--bg-primary)] overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f0a] via-[var(--bg-primary)] to-[#0a0f0a]" />
        <style>{fireflyStyles}</style>
        {tryzubPoints.map((pt, i) => (
          <div
            key={i}
            className="absolute rounded-full mix-blend-screen pointer-events-none"
            style={{
              left: `${pt.x}%`,
              top: `${pt.y}%`,
              width: '4px',
              height: '4px',
              animation: `firefly-tryzub-${i} 20s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px', lineHeight: '1.2', letterSpacing: '1px' }}>
          🔍 База Знань
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>
          Тактична медицина, озброєння, топографія та інші корисні матеріали
        </p>
      </div>

      {/* Search Bar */}
      <div
        className="p-4 rounded-2xl mb-8 animate-fade-in-up"
        style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', animationDelay: '0.1s', animationFillMode: 'both' }}
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
          <button type="submit" className="btn btn-primary" style={{ padding: '14px 24px', fontSize: '14px' }}>
            Пошук
          </button>
        </form>
      </div>

      {/* Categories */}
      <div
        className="p-6 rounded-2xl mb-8 animate-fade-in-up"
        style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', animationDelay: '0.15s', animationFillMode: 'both' }}
      >
        <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--ab3-gold)', fontSize: '16px', letterSpacing: '0.5px' }}>
          📂 Категорії
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className="p-4 rounded-xl border transition-all duration-300 hover:scale-105"
            style={{
              background: selectedCategory === null ? 'rgba(201, 162, 39, 0.15)' : 'var(--bg-card)',
              borderColor: selectedCategory === null ? 'var(--ab3-gold)' : 'var(--border-subtle)',
            }}
          >
            <div className="text-3xl mb-2">📖</div>
            <div className="font-bold text-sm" style={{ color: 'var(--text-primary)', fontSize: '13px' }}>Усі статті</div>
          </button>

          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className="p-4 rounded-xl border transition-all duration-300 hover:scale-105"
              style={{
                background: selectedCategory === cat.id ? 'rgba(201, 162, 39, 0.15)' : 'var(--bg-card)',
                borderColor: selectedCategory === cat.id ? 'var(--ab3-gold)' : 'var(--border-subtle)',
              }}
            >
              <div className="text-3xl mb-2">{cat.icon}</div>
              <div className="font-bold text-sm" style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{cat.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Filter */}
      <div
        className="p-4 rounded-2xl mb-8 animate-fade-in-up"
        style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', animationDelay: '0.2s', animationFillMode: 'both' }}
      >
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedDifficulty(null)}
            className="btn"
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
              className="btn"
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
          <h2 className="text-xl font-heading font-bold" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>
            {loading ? 'Завантаження...' : `${articles.length} статей`}
          </h2>
        </div>

        {loading ? (
          <div className="p-16 rounded-2xl text-center animate-fade-in-up" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
            <svg className="animate-spin w-12 h-12 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/>
            </svg>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>Завантаження матеріалів...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="p-16 rounded-2xl text-center animate-fade-in-up" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', animationDelay: '0.1s', animationFillMode: 'both' }}>
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)', fontSize: '20px' }}>Статей не знайдено</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6' }}>Спробуйте змінити фільтри або пошуковий запит</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article, index) => (
              <button
                key={article.id}
                onClick={() => setSelectedArticle(article)}
            className="military-card p-6 md:p-8 text-left group cursor-pointer animate-fade-in-up hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] hover:-translate-y-2 transition-all duration-500 border border-transparent hover:border-[var(--border-subtle)] relative overflow-hidden"
            style={{ background: 'rgba(20, 24, 20, 0.5)', backdropFilter: 'blur(16px)', animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
              >
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ background: `radial-gradient(circle at top left, rgba(201,162,39,0.06), transparent 70%)` }} />
                <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'var(--gradient-gold)' }} />

                <h3 className="text-lg font-heading font-bold mb-3 group-hover:text-[var(--ab3-gold)] transition-colors duration-300" style={{ color: 'var(--text-primary)', fontSize: '17px', lineHeight: '1.3' }}>
                  {article.title}
                </h3>
                <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                  {article.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="badge badge-gold">{article.category}</span>
                  {getDifficultyBadge(article.difficulty)}
                </div>

                <div className="flex justify-between items-center text-xs pt-4 border-t" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)', fontSize: '12px' }}>
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
            className="rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-fade-in-up"
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
                <div className="p-5 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
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
