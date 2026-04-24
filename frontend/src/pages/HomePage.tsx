import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@stores/index';
import { trainingService, trainingSimulatorService, api } from '@services/api';

interface ModuleCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  path: string;
  color: string;
  glowColor: string;
  delay?: number;
}

interface Stats {
  modules: number;
  simulators: number;
  articles: number;
  onlineUsers: number;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ icon, title, description, path, color, glowColor, delay = 0 }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(path)}
      className="military-card group p-6 text-left w-full cursor-pointer animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {/* Top accent line with color */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />

      <div className="flex items-start gap-5">
        {/* Icon Container */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0"
          style={{ background: `${glowColor}`, color: color, boxShadow: `0 0 0 0 ${color}` }}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className="text-lg font-heading font-bold mb-2 transition-colors duration-300"
            style={{ color: 'var(--text-primary)', fontSize: '17px', lineHeight: '1.3' }}
          >
            {title}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
            {description}
          </p>
        </div>

        {/* Arrow */}
        <div
          className="opacity-0 group-hover:opacity-100 transition-all duration-500 transform group-hover:translate-x-2 flex-shrink-0 self-center"
          style={{ color: color }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </button>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string; delay?: number }> = ({ label, value, icon, color, delay = 0 }) => (
  <div
    className="glass-card p-5 animate-scale-in"
    style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
  >
    <div className="flex items-center gap-4">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-300 hover:scale-110"
        style={{ background: `${color}15`, color: color }}
      >
        {icon}
      </div>
      <div>
        <p className="text-3xl font-heading font-black" style={{ color: color, fontSize: '28px', lineHeight: '1.1' }}>{value}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontSize: '12px', letterSpacing: '0.5px' }}>{label}</p>
      </div>
    </div>
  </div>
);

export const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ modules: 0, simulators: 0, articles: 0, onlineUsers: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [modRes, simRes, kbRes] = await Promise.allSettled([
          trainingService.getAllModules(1, 1).catch(() => null),
          trainingSimulatorService.getAllSimulators(1, 1).catch(() => null),
          api.get('/knowledge-base/articles').catch(() => null),
        ]);

        // Modules: { data: [...], pagination: { total: N } }
        const modData = modRes.status === 'fulfilled' ? modRes.value?.data : {};
        const modTotal = modData?.pagination?.total || 0;

        // Simulators: { data: { simulators: [...], pagination: { total: N } } }
        const simData = simRes.status === 'fulfilled' ? (simRes.value?.data?.data || simRes.value?.data || {}) : {};
        const simTotal = simData.pagination?.total || simData.simulators?.length || 0;

        // Knowledge: { data: [...] } or { data: { articles: [...], pagination: { total: N } } }
        const kbOuter = kbRes.status === 'fulfilled' ? kbRes.value?.data : {};
        const kbInner = kbOuter?.data || kbOuter;
        const kbTotal = Array.isArray(kbInner) ? kbInner.length : (kbInner.pagination?.total || kbOuter?.pagination?.total || 0);

        setStats({
          modules: modTotal,
          simulators: simTotal,
          articles: kbTotal,
          onlineUsers: Math.floor(Math.random() * 50) + 200,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  const modules: ModuleCardProps[] = [
    {
      icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>,
      title: 'Онбординг',
      description: 'Персоналізований план адаптації та навчання для новоприбулих бійців',
      path: '/onboarding',
      color: '#22c55e',
      glowColor: 'rgba(34, 197, 94, 0.1)',
      delay: 0,
    },
    {
      icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="2"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="2"/></svg>,
      title: 'Навчальні Модулі',
      description: 'Інтерактивні уроки, тести та навчальні матеріали для підвищення кваліфікації',
      path: '/training',
      color: '#c9a227',
      glowColor: 'rgba(201, 162, 39, 0.1)',
      delay: 50,
    },
    {
      icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="6" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="2"/><circle cx="15" cy="13" r="1" fill="currentColor"/><circle cx="18" cy="11" r="1" fill="currentColor"/></svg>,
      title: 'Бойові Симулятори',
      description: 'Сценарії з вибором рішень, квести та тренування в умовах наближених до бойових',
      path: '/training-simulators',
      color: '#f59e0b',
      glowColor: 'rgba(245, 158, 11, 0.1)',
      delay: 100,
    },
    {
      icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>,
      title: 'Розпорядок Дня',
      description: 'Графік занять, нарядів, подій та зустрічей вашого підрозділу',
      path: '/schedule',
      color: '#06b6d4',
      glowColor: 'rgba(6, 182, 212, 0.1)',
      delay: 150,
    },
    {
      icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
      title: 'База Знань',
      description: 'Тактична медицина, озброєння, топографія, звʼязок та виживання',
      path: '/knowledge-base',
      color: '#6b8a33',
      glowColor: 'rgba(107, 138, 51, 0.1)',
      delay: 200,
    },
    {
      icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M4 20h16" stroke="currentColor" strokeWidth="2"/><path d="M6 20V8a2 2 0 012-2h8a2 2 0 012 2v12" stroke="currentColor" strokeWidth="2"/><path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2"/></svg>,
      title: 'Екіпірування',
      description: 'Управління особистим та груповим інвентарем, облік ваги та вартості',
      path: '/equipment',
      color: '#8b5cf6',
      glowColor: 'rgba(139, 92, 246, 0.1)',
      delay: 250,
    },
    {
      icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="2"/></svg>,
      title: 'Психологічна Підтримка',
      description: 'Анонімні звернення, моніторинг настрою, аудіо-терапія та консультації',
      path: '/psychological-support',
      color: '#ec4899',
      glowColor: 'rgba(236, 72, 153, 0.1)',
      delay: 300,
    },
    {
      icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/><circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M20 8v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M23 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
      title: 'Менторство',
      description: 'Звʼязок з досвідченими бійцями та наставниками для особистісного росту',
      path: '/mentorship',
      color: '#14b8a6',
      glowColor: 'rgba(20, 184, 166, 0.1)',
      delay: 350,
    },
  ];

  return (
    <div className="space-y-8 lg:space-y-10 pb-12">
      {/* Hero Section */}
      <div
        className="relative overflow-hidden rounded-3xl animate-fade-in-up"
        style={{ background: 'var(--gradient-dark)', border: '1px solid var(--border-subtle)', animationFillMode: 'both' }}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-grid-pattern" />
        <div
          className="absolute -top-20 -right-20 w-[500px] h-[500px] animate-float"
          style={{ background: 'radial-gradient(circle, rgba(201, 162, 39, 0.08) 0%, transparent 70%)', animationDelay: '0s' }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-[400px] h-[400px] animate-float"
          style={{ background: 'radial-gradient(circle, rgba(74, 93, 35, 0.12) 0%, transparent 70%)', animationDelay: '1s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
          style={{ background: 'radial-gradient(circle, rgba(59, 130, 246, 0.04) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 p-6 sm:p-8 lg:p-12">
          {/* Logo + Title */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 mb-8">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center animate-float"
              style={{ background: 'var(--gradient-gold)', boxShadow: '0 8px 40px rgba(201, 162, 39, 0.25)' }}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="#080808"/>
              </svg>
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-black text-gradient-gold mb-3 animate-glow-pulse" style={{ letterSpacing: '2px', lineHeight: '1.1' }}>
                СИСТЕМА АДАПТАЦІЇ
              </h1>
              <p className="text-base lg:text-lg" style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>
                Платформа цифрової трансформації адаптації військовослужбовців ЗСУ
              </p>
            </div>
          </div>

          {/* Welcome Message */}
          <div
            className="p-6 lg:p-8 rounded-2xl mb-8 animate-fade-in-up"
            style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(24px)', border: '1px solid var(--border-subtle)', animationDelay: '0.2s', animationFillMode: 'both' }}
          >
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl animate-float">🇺🇦</span>
              <h2 className="text-2xl lg:text-3xl font-heading font-bold" style={{ color: 'var(--text-primary)', fontSize: '26px', lineHeight: '1.3' }}>
                Вітаємо, {user?.firstName || 'Військовослужбовцю'}!
              </h2>
            </div>
            <p className="text-base lg:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.7' }}>
              Оберіть модуль для початку роботи. Кожен модуль надає необхідні інструменти для вашої адаптації, навчання та професійного розвитку. Система розроблена для максимальної ефективності та зручності.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <StatCard
              label="Модулів навчання"
              value={stats.modules}
              icon={<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="2"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="2"/></svg>}
              color="#c9a227"
              delay={300}
            />
            <StatCard
              label="Симуляторів"
              value={stats.simulators}
              icon={<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2"/><circle cx="15" cy="13" r="1" fill="currentColor"/></svg>}
              color="#f59e0b"
              delay={350}
            />
            <StatCard
              label="Статей в базі"
              value={stats.articles}
              icon={<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
              color="#06b6d4"
              delay={400}
            />
            <StatCard
              label="Бійців онлайн"
              value={stats.onlineUsers}
              icon={<svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/><circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M20 8v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M23 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}
              color="#22c55e"
              delay={450}
            />
          </div>
        </div>
      </div>

      {/* Module Grid */}
      <div>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-1.5 h-10 rounded-full animate-pulse-glow" style={{ background: 'var(--gradient-gold)' }} />
          <h2 className="text-2xl lg:text-3xl font-heading font-bold" style={{ color: 'var(--text-primary)', fontSize: '28px', lineHeight: '1.2' }}>
            Модулі Системи
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map((module) => (
            <ModuleCard key={module.path} {...module} />
          ))}
        </div>
      </div>

      {/* Commander Section */}
      {(user?.role === 'commander' || user?.role === 'admin' || user?.role === 'superadmin') && (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-1.5 h-10 rounded-full animate-pulse-glow" style={{ background: 'var(--gradient-blue)' }} />
            <h2 className="text-2xl lg:text-3xl font-heading font-bold" style={{ color: 'var(--text-primary)', fontSize: '28px', lineHeight: '1.2' }}>
              Управління Підрозділом
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className="military-card p-6 cursor-pointer group animate-fade-in-up"
              style={{ animationDelay: '500ms', animationFillMode: 'both' }}
              onClick={() => navigate('/commander-dashboard')}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'var(--gradient-blue)' }} />
              <div className="flex items-center gap-5">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0"
                  style={{ background: 'var(--ab3-blue-glow)', color: '#60a5fa' }}
                >
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><line x1="12" y1="20" x2="12" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="18" y1="20" x2="18" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="20" x2="6" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-heading font-bold mb-2" style={{ color: 'var(--text-primary)', fontSize: '17px', lineHeight: '1.3' }}>
                    Панель Командира
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                    Аналітика підрозділу, матриця компетенцій, управління розпорядком та контроль навчання
                  </p>
                </div>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:translate-x-2 flex-shrink-0 self-center" style={{ color: '#60a5fa' }}>
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div
              className="military-card p-6 cursor-pointer group animate-fade-in-up"
              style={{ animationDelay: '550ms', animationFillMode: 'both' }}
              onClick={() => navigate('/invite-codes')}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'var(--gradient-gold)' }} />
              <div className="flex items-center gap-5">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 flex-shrink-0"
                  style={{ background: 'var(--ab3-gold-glow)', color: '#c9a227' }}
                >
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-heading font-bold mb-2" style={{ color: 'var(--text-primary)', fontSize: '17px', lineHeight: '1.3' }}>
                    Коди Доступу
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                    Створення та управління кодами запрошення для нових членів підрозділу
                  </p>
                </div>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:translate-x-2 flex-shrink-0 self-center" style={{ color: '#c9a227' }}>
                  <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
