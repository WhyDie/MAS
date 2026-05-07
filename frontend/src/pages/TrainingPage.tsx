import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainingService } from '@services/api';
import { offlineStorage } from '@services/offline';
import { TrainingModule } from '../types/index';
import { useAuthStore } from '@stores/index';

export const TrainingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    loadModules();
  }, [selectedCategory]);

  const loadModules = async () => {
    setIsLoading(true);
    try {
      const response = await trainingService.getAllModules(1, 100, selectedCategory);
      const data = response.data.data;
      const activeModules = (data || []).filter((m: TrainingModule) => (m as any).isActive !== false && (m as any).isActive !== 0);
      setModules(activeModules);

      for (const module of activeModules) {
        await offlineStorage.saveModule(module);
      }
    } catch (error) {
      const cached = await offlineStorage.getAllModules();
      setModules(cached.filter((m: any) => (m as any).isActive !== false && (m as any).isActive !== 0));
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    { value: '', label: 'Усі', icon: '📚' },
    { value: 'Тактична Медицина', label: 'Тактична Медицина', icon: '🏥' },
    { value: 'Озброєння', label: 'Озброєння', icon: '🔫' },
    { value: 'Топографія', label: 'Топографія', icon: '🗺️' },
    { value: 'Загальне Навчання', label: 'Загальне Навчання', icon: '📖' },
  ];

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return <span className="badge badge-success">Початківець</span>;
      case 'intermediate':
        return <span className="badge badge-warning">Середній</span>;
      case 'advanced':
        return <span className="badge badge-danger">Просунутий</span>;
      default:
        return null;
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-heading font-black uppercase tracking-widest mb-3 glitch-hover cursor-default transition-all duration-300" style={{ color: 'var(--text-primary)', fontSize: '32px', lineHeight: '1.2' }}>
              НАВЧАЛЬНІ МОДУЛІ
            </h1>
            <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
              // МАТЕРІАЛИ ДЛЯ ПІДВИЩЕННЯ КВАЛІФІКАЦІЇ //
            </p>
          </div>
          {(user?.role === 'commander' || user?.role === 'admin' || user?.role === 'superadmin') && (
            <button onClick={() => navigate('/training-admin')} className="btn btn-primary rounded-none uppercase tracking-widest font-bold" style={{ padding: '10px 20px', fontSize: '13px' }}>⚙️ Управління модулями</button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div
        className="p-4 rounded-none mb-8 animate-fade-in-up bg-[#0a0a0a] border border-[#333]"
        style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className="btn w-full flex items-center justify-center text-center rounded-none uppercase tracking-widest font-bold"
              style={{
                background: selectedCategory === cat.value ? 'var(--gradient-gold)' : 'transparent',
                color: selectedCategory === cat.value ? 'var(--ab3-black)' : 'var(--text-muted)',
                border: `1px solid ${selectedCategory === cat.value ? 'var(--ab3-gold)' : 'var(--border-subtle)'}`,
                fontSize: '13px',
                padding: '10px 18px',
              }}
            >
              <span className="mr-2">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modules Grid */}
      {isLoading ? (
        <div
          className="p-16 rounded-none text-center animate-fade-in-up"
          style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}
        >
          <svg className="animate-spin w-12 h-12 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
            <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/>
          </svg>
          <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>Завантаження модулів...</p>
        </div>
      ) : modules.length === 0 ? (
        <div
          className="p-16 rounded-none text-center animate-fade-in-up"
          style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', animationDelay: '0.1s', animationFillMode: 'both' }}
        >
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)', fontSize: '20px' }}>Модулів не знайдено</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6' }}>Навчальні модулі будуть додані найближчим часом</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module, index) => (
            <button
              key={module.id}
              onClick={() => navigate(`/training/${module.id}`)}
              className="military-card h-full flex flex-col rounded-none p-6 text-left group cursor-pointer animate-fade-in-up transition-all duration-300 hover:-translate-y-1 bg-[#0a0a0a] border border-[#333] hover:border-[var(--ab3-gold)] relative overflow-hidden"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'var(--gradient-gold)' }} />

              <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  {getDifficultyBadge(module.difficulty)}
                  <span className="text-[10px] px-3 py-1.5 rounded-none font-bold font-mono uppercase tracking-widest border border-[#333] bg-[#111]" style={{ color: 'var(--text-muted)' }}>
                    ⏱ {module.durationMinutes} хв
                  </span>
                </div>
                <h3 className="text-lg font-heading font-black uppercase tracking-widest mb-3 group-hover:text-[var(--ab3-gold)] transition-colors duration-300" style={{ color: 'var(--text-primary)', fontSize: '17px', lineHeight: '1.3' }}>
                  {module.title}
                </h3>
                <p className="font-mono text-xs mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  {module.description}
                </p>
              </div>

              <div className="mt-auto w-full flex justify-between items-center font-mono uppercase tracking-widest pt-4 border-t" style={{ borderColor: '#222', color: 'var(--text-muted)', fontSize: '10px' }}>
                <span className="text-[var(--ab3-gold)]">{module.category}</span>
                <span>👁 {module.viewCount || 0}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
