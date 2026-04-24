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
      const response = await trainingService.getAllModules(1, 20, selectedCategory);
      const data = response.data.data;
      setModules(data || []);

      for (const module of data || []) {
        await offlineStorage.saveModule(module);
      }
    } catch (error) {
      const cached = await offlineStorage.getAllModules();
      setModules(cached);
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
            <h1 className="text-3xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px', lineHeight: '1.2', letterSpacing: '1px' }}>
              📚 Навчальні Модулі
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>
              Інтерактивні уроки, тести та навчальні матеріали для підвищення кваліфікації
            </p>
          </div>
          {(user?.role === 'commander' || user?.role === 'admin' || user?.role === 'superadmin') && (
            <button onClick={() => navigate('/training-admin')} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>⚙️ Управління модулями</button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div
        className="p-4 rounded-2xl mb-8 animate-fade-in-up"
        style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', animationDelay: '0.1s', animationFillMode: 'both' }}
      >
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className="btn"
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
          className="p-16 rounded-2xl text-center animate-fade-in-up"
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
          className="p-16 rounded-2xl text-center animate-fade-in-up"
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
              className="military-card p-6 text-left group cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'var(--gradient-gold)' }} />

              <div className="flex justify-between items-start mb-4">
                {getDifficultyBadge(module.difficulty)}
                <span className="text-xs px-3 py-1.5 rounded-lg font-bold" style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '12px' }}>
                  ⏱ {module.durationMinutes} хв
                </span>
              </div>

              <h3 className="text-lg font-heading font-bold mb-3 group-hover:text-[var(--ab3-gold)] transition-colors duration-300" style={{ color: 'var(--text-primary)', fontSize: '17px', lineHeight: '1.3' }}>
                {module.title}
              </h3>

              <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                {module.description}
              </p>

              <div className="flex justify-between items-center text-xs pt-4 border-t" style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)', fontSize: '12px' }}>
                <span>{module.category}</span>
                <span>👁 {module.viewCount}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
