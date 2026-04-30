import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@services/api';

export const TrainingModuleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [module, setModule] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) loadModule();
  }, [id]);

  const loadModule = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/training/modules/${id}`);
      const data = res.data.data || res.data;
      // Parse content if it's a JSON string
      if (typeof data.content === 'string') {
        try { data.content = JSON.parse(data.content); } catch {}
      }
      setModule(data);
    } catch {
      setError('Не вдалося завантажити модуль');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center rounded-none bg-[#0a0a0a] border border-[#333]">
        <svg className="animate-spin w-12 h-12 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/></svg>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>Завантаження модуля...</p>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="p-16 text-center rounded-none bg-[#0a0a0a] border border-[#333]">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Помилка завантаження</h3>
        <p style={{ color: 'var(--text-muted)' }}>{error || 'Модуль не знайдено'}</p>
        <button onClick={() => navigate('/training')} className="btn btn-primary mt-6" style={{ padding: '12px 28px' }}>← До навчання</button>
      </div>
    );
  }

  const diffLabels: Record<string, { label: string; color: string }> = {
    beginner: { label: 'Початківець', color: '#22c55e' },
    intermediate: { label: 'Середній', color: '#f59e0b' },
    advanced: { label: 'Просунутий', color: '#ef4444' },
  };
  const diff = diffLabels[module.difficulty] || { label: module.difficulty, color: '#6b7280' };

  const contentText = typeof module.content === 'object' ? module.content.text || '' : (module.content || '');

  return (
    <div className="animate-fade-in-up overflow-x-hidden">
      {/* Back button */}
      <button onClick={() => navigate('/training')} className="mb-6 btn" style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '10px 20px', fontSize: '13px' }}>
        ← Назад до модулів
      </button>

      {/* Header */}
      <div className="p-4 sm:p-6 lg:p-8 rounded-none mb-8 bg-[#0a0a0a] border border-[#333]">
        <div className="flex flex-wrap gap-3 mb-4">
          <span className="badge badge-gold">{module.category}</span>
          <span className="badge" style={{ background: `${diff.color}20`, color: diff.color, border: `1px solid ${diff.color}40`, fontSize: '11px' }}>{diff.label}</span>
          <span className="badge badge-info">⏱ {module.durationMinutes} хв</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-heading font-black uppercase tracking-widest mb-4" style={{ color: 'var(--text-primary)', lineHeight: '1.2' }}>
          {module.title}
        </h1>

        <p className="text-base sm:text-lg" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          {module.description}
        </p>

        <div className="flex gap-4 sm:gap-6 mt-6 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Переглядів</p>
            <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--ab3-gold)' }}>{module.viewCount || 0}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Категорія</p>
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{module.category}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      {contentText && (
        <div className="p-4 sm:p-6 lg:p-8 rounded-none bg-[#0a0a0a] border border-[#333]">
          <h2 className="text-xl font-heading font-bold mb-6" style={{ color: 'var(--ab3-gold)', fontSize: '22px' }}>📖 Зміст модуля</h2>
          <div className="prose" style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.7' }}>
            {contentText.split('\n').map((line: string, i: number) => {
              if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-6 mb-3" style={{ color: 'var(--text-primary)', fontSize: '18px' }}>{line.replace('### ', '')}</h3>;
              if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-8 mb-4" style={{ color: 'var(--ab3-gold)', fontSize: '20px' }}>{line.replace('## ', '')}</h2>;
              if (line.startsWith('**')) {
                const parts = line.split(/\*\*(.*?)\*\*/);
                return <p key={i} className="font-semibold" style={{ color: 'var(--text-primary)' }}>{parts.map((p: string, j: number) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</p>;
              }
              if (line.startsWith('- ')) return <li key={i} className="ml-4 mb-1" style={{ color: 'var(--text-secondary)' }}>{line.replace('- ', '• ')}</li>;
              if (/^\d+\.\s/.test(line)) return <p key={i} className="mb-2 font-medium" style={{ color: 'var(--text-primary)' }}>{line}</p>;
              if (line.trim() === '') return <div key={i} className="h-3" />;
              return <p key={i} className="mb-1" style={{ color: 'var(--text-secondary)' }}>{line}</p>;
            })}
          </div>
        </div>
      )}

      {/* Tags */}
      {module.tags && module.tags.length > 0 && (
        <div className="mt-6 p-6 rounded-none bg-[#0a0a0a] border border-[#333]">
          <p className="text-sm font-bold mb-3" style={{ color: 'var(--text-muted)' }}>🏷️ Теги</p>
          <div className="flex flex-wrap gap-2">
            {(typeof module.tags === 'string' ? JSON.parse(module.tags) : module.tags).map((tag: string) => (
              <span key={tag} className="badge" style={{ background: 'var(--bg-glass)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', fontSize: '12px' }}>#{tag}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
