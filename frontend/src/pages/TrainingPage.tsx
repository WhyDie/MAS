import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trainingService } from '@services/api';
import { offlineStorage } from '@services/offline';
import { TrainingModule } from '../types/index';
import { useAuthStore } from '@stores/index';

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
          className="military-card p-6 md:p-8 text-left group cursor-pointer animate-fade-in-up hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] hover:-translate-y-2 transition-all duration-500 border border-transparent hover:border-[var(--border-subtle)] relative overflow-hidden"
          style={{ background: 'rgba(20, 24, 20, 0.5)', backdropFilter: 'blur(16px)', animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
            >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ background: `radial-gradient(circle at bottom right, rgba(201,162,39,0.08), transparent 70%)` }} />
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
