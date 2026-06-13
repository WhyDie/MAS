import React, { useState, useEffect } from 'react';
import { api } from '@services/api';

const COMBAT_RANKS = [
  { xp: 150000, title: 'Вальхалла (Вічність)', icon: '🌌', color: '#a855f7' },
  { xp: 100000, title: 'Абсолют (Бог Війни)', icon: '👑', color: '#a855f7' },
  { xp: 80000, title: 'Легенда (Ейнхерій)', icon: '⚡️', color: '#ef4444' },
  { xp: 60000, title: 'Напівбог', icon: '🌟', color: '#f59e0b' },
  { xp: 50000, title: 'Син Одіна', icon: '👁️', color: '#3b82f6' },
  { xp: 45000, title: 'Вісник Вальгалли', icon: '🦅', color: '#f59e0b' },
  { xp: 40000, title: 'Рунний Майстер', icon: '🪨', color: '#3b82f6' },
  { xp: 36000, title: 'Драконоборець', icon: '🐉', color: '#ef4444' },
  { xp: 32000, title: 'Титан', icon: '🌋', color: '#ef4444' },
  { xp: 28000, title: 'Колос', icon: '🗿', color: '#64748b' },
  { xp: 25000, title: 'Громовержець', icon: '🌩️', color: '#3b82f6' },
  { xp: 22000, title: 'Повелитель бур', icon: '🌪️', color: '#f59e0b' },
  { xp: 19000, title: 'Володар сталі', icon: '⚔️', color: '#94a3b8' },
  { xp: 16000, title: 'Конунг', icon: '👑', color: '#ef4444' },
  { xp: 14000, title: 'Ярл (Еліта)', icon: '🐺', color: '#f59e0b' },
  { xp: 12000, title: 'Лорд', icon: '🏰', color: '#3b82f6' },
  { xp: 10000, title: 'Мисливець на демонів', icon: '🔥', color: '#ef4444' },
  { xp: 9000, title: 'Вбивця орків', icon: '👹', color: '#22c55e' },
  { xp: 8000, title: 'Тінь', icon: '🥷', color: '#64748b' },
  { xp: 7000, title: 'Привид', icon: '👻', color: '#cbd5e1' },
  { xp: 6200, title: 'Месник', icon: '🗡️', color: '#ef4444' },
  { xp: 5500, title: 'Герой', icon: '🦸', color: '#f59e0b' },
  { xp: 4800, title: 'Отаман', icon: '🐎', color: '#ef4444' },
  { xp: 4200, title: 'Воєвода', icon: '🚩', color: '#3b82f6' },
  { xp: 3700, title: 'Сотник', icon: '💯', color: '#22c55e' },
  { xp: 3200, title: 'Спартанець', icon: '🛡️', color: '#ef4444' },
  { xp: 2800, title: 'Гладіатор', icon: '🏟️', color: '#f59e0b' },
  { xp: 2400, title: 'Паладин', icon: '✨', color: '#3b82f6' },
  { xp: 2100, title: 'Лицар', icon: '🏇', color: '#94a3b8' },
  { xp: 1800, title: 'Центуріон', icon: '🦅', color: '#ef4444' },
  { xp: 1500, title: 'Гвардієць', icon: '💂', color: '#3b82f6' },
  { xp: 1300, title: 'Ветеран', icon: '🎖️', color: '#f59e0b' },
  { xp: 1100, title: 'Захисник', icon: '🛡️', color: '#22c55e' },
  { xp: 950, title: 'Каратель', icon: '⛓️', color: '#ef4444' },
  { xp: 800, title: 'Руйнівник', icon: '💥', color: '#f59e0b' },
  { xp: 700, title: 'Берсерк (Штурмовик)', icon: '🪓', color: '#ef4444' },
  { xp: 600, title: 'Рейнджер', icon: '🌲', color: '#22c55e' },
  { xp: 500, title: 'Мисливець', icon: '🏹', color: '#f59e0b' },
  { xp: 420, title: 'Розвідник', icon: '🔭', color: '#3b82f6' },
  { xp: 350, title: 'Слідопит', icon: '🐾', color: '#22c55e' },
  { xp: 290, title: 'Воїн клану', icon: '🤝', color: '#f59e0b' },
  { xp: 240, title: 'Хірдман (Загартований)', icon: '🪓', color: '#3b82f6' },
  { xp: 190, title: 'Сокирник', icon: '🪓', color: '#94a3b8' },
  { xp: 150, title: 'Списник', icon: '🔱', color: '#64748b' },
  { xp: 110, title: 'Мечник', icon: '🗡️', color: '#cbd5e1' },
  { xp: 80, title: 'Щитоносець', icon: '🛡️', color: '#3b82f6' },
  { xp: 50, title: 'Стражник', icon: '👁️', color: '#22c55e' },
  { xp: 25, title: 'Ополченець', icon: '🌾', color: '#f59e0b' },
  { xp: 10, title: 'Рекрут', icon: '📝', color: '#94a3b8' },
  { xp: 0, title: 'Дренг (Необстріляний)', icon: '🔰', color: '#6b7280' },
];

const getRankInfo = (currentXp: number) => {
  for (let i = 0; i < COMBAT_RANKS.length; i++) {
    if (currentXp >= COMBAT_RANKS[i].xp) {
      const rank = COMBAT_RANKS[i];
      const nextRank = i > 0 ? COMBAT_RANKS[i - 1] : null;
      let progress = 100;
      let nextXp = null;

      if (nextRank) {
        const range = nextRank.xp - rank.xp;
        const earned = currentXp - rank.xp;
        progress = (earned / range) * 100;
        nextXp = nextRank.xp;
      }

      return { ...rank, next: nextXp, progress: Math.min(100, Math.max(0, progress)) };
    }
  }
  return { ...COMBAT_RANKS[COMBAT_RANKS.length - 1], next: 10, progress: 0 };
};

export const AchievementsPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [statsRes, boardRes] = await Promise.all([
        api.get(`/achievements/stats?_t=${Date.now()}`),
        api.get(`/units/my/leaderboard`).catch(() => ({ data: { data: [] } }))
      ]);
      setStats(statsRes.data.data || statsRes.data);
      setLeaderboard(boardRes.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center rounded-none bg-[#0a0a0a] border border-[#333]">
        <svg className="animate-spin w-10 h-10 mx-auto mb-4 text-[var(--ab3-gold)]" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/></svg>
        <p className="text-[var(--text-muted)]">Завантаження досягнень...</p>
      </div>
    );
  }

  const xp = stats?.xp || 0;
  const rank = getRankInfo(xp);

  const achievementsList = [
    {
      id: 'modules_1',
      title: 'Перший крок',
      description: 'Успішно завершено перший навчальний модуль.',
      icon: '📖',
      color: '#22c55e',
      isUnlocked: (stats?.modulesCompleted || 0) >= 1,
      progress: Math.min(1, stats?.modulesCompleted || 0),
      total: 1
    },
    {
      id: 'modules_5',
      title: 'Теоретик',
      description: 'Успішно завершено 5 навчальних модулів.',
      icon: '📚',
      color: '#3b82f6',
      isUnlocked: (stats?.modulesCompleted || 0) >= 5,
      progress: Math.min(5, stats?.modulesCompleted || 0),
      total: 5
    },
    {
      id: 'sim_1',
      title: 'Бойове хрещення',
      description: 'Пройдено перший бойовий симулятор.',
      icon: '🎮',
      color: '#f59e0b',
      isUnlocked: (stats?.simAttempts || 0) >= 1,
      progress: Math.min(1, stats?.simAttempts || 0),
      total: 1
    },
    {
      id: 'sim_perfect',
      title: 'Бездоганний',
      description: 'Пройдено симулятор з максимальним балом (100%).',
      icon: '🎯',
      color: '#ef4444',
      isUnlocked: (stats?.perfectSims || 0) >= 1,
      progress: Math.min(1, stats?.perfectSims || 0),
      total: 1
    },
    {
      id: 'mentor_1',
      title: 'Братерство',
      description: 'Успішно завершено роботу з ментором.',
      icon: '🤝',
      color: '#8b5cf6',
      isUnlocked: (stats?.mentorshipCompleted || 0) >= 1,
      progress: Math.min(1, stats?.mentorshipCompleted || 0),
      total: 1
    },
    {
      id: 'psych_1',
      title: 'Сталева Воля',
      description: 'Звернення за психологічною підтримкою (дбаємо про себе).',
      icon: '🛡️',
      color: '#ec4899',
      isUnlocked: (stats?.psychRequests || 0) >= 1,
      progress: Math.min(1, stats?.psychRequests || 0),
      total: 1
    },
  ];

  return (
    <div className="animate-fade-in-up overflow-x-hidden">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-black uppercase tracking-widest mb-3 text-[var(--text-primary)]" style={{ fontSize: '32px' }}>
          КВАЛІФІКАЦІЯ ТА ДОСЯГНЕННЯ
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--text-muted)]">
          // ВАШ БОЙОВИЙ ПРОГРЕС //
        </p>
      </div>

      <div className="p-8 mb-8 rounded-none bg-[#0a0a0a] border border-[#333] relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full" style={{ background: rank.color }} />
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-32 h-32 rounded-full border-4 flex items-center justify-center text-6xl flex-shrink-0 bg-[#111] shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-110" style={{ borderColor: rank.color, color: rank.color, textShadow: `0 0 20px ${rank.color}` }}>
            {rank.icon}
          </div>
          <div className="flex-1 w-full text-center md:text-left">
            <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Бойовий Ранг / Статус</p>
            <h2 className="text-3xl md:text-4xl font-heading font-black uppercase tracking-widest mb-2" style={{ color: rank.color }}>
              {rank.title}
            </h2>
            <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
              <span className="px-3 py-1 bg-[#111] border border-[#333] font-mono text-lg font-bold text-white shadow-inner">
                {xp} XP
              </span>
              {rank.next && (
                <span className="text-sm font-mono text-gray-500">
                  До наступної кваліфікації: {rank.next - xp} XP
                </span>
              )}
            </div>
            
            {rank.next && (
              <div className="w-full h-3 bg-[#1a1a1a] rounded-none border border-[#333] overflow-hidden">
                <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${rank.progress}%`, background: rank.color }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <h3 className="text-xl font-heading font-black uppercase tracking-widest mb-4 text-[var(--text-primary)]">Бойові Відзнаки</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievementsList.map((ach, idx) => (
          <div 
            key={ach.id} 
            className={`p-6 rounded-none border relative overflow-hidden transition-all duration-300 animate-fade-in-up ${ach.isUnlocked ? 'bg-[#0a0a0a] hover:-translate-y-1' : 'bg-[#050505] opacity-70 grayscale'}`}
            style={{ 
              borderColor: ach.isUnlocked ? ach.color : '#222',
              animationDelay: `${idx * 100}ms` 
            }}
          >
            {ach.isUnlocked && (
              <div className="absolute top-0 right-0 p-2 text-xs font-mono font-bold" style={{ color: ach.color, background: `${ach.color}20` }}>
                ОТРИМАНО
              </div>
            )}
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl flex-shrink-0" style={{ filter: ach.isUnlocked ? `drop-shadow(0 0 10px ${ach.color}80)` : 'none' }}>
                {ach.icon}
              </div>
              <div>
                <h4 className="font-bold text-lg leading-tight mb-1" style={{ color: ach.isUnlocked ? 'white' : '#666' }}>{ach.title}</h4>
                <p className="text-xs" style={{ color: ach.isUnlocked ? 'var(--text-secondary)' : '#444' }}>{ach.description}</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-[#222]">
              <div className="flex justify-between text-xs font-mono mb-1" style={{ color: ach.isUnlocked ? ach.color : '#555' }}>
                <span>Прогрес</span>
                <span>{ach.progress} / {ach.total}</span>
              </div>
              <div className="w-full h-1.5 bg-[#111] overflow-hidden">
                <div 
                  className="h-full transition-all duration-1000" 
                  style={{ 
                    width: `${(ach.progress / ach.total) * 100}%`, 
                    background: ach.isUnlocked ? ach.color : '#444' 
                  }} 
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {leaderboard.length > 0 && (
        <div className="mt-12 animate-fade-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
          <h3 className="text-xl font-heading font-black uppercase tracking-widest mb-4 text-[var(--ab3-gold)] border-b border-[#333] pb-2">Дошка Пошани Підрозділу (Топ-10)</h3>
          <div className="bg-[#050505] border border-[#333] shadow-[8px_8px_0_0_#111]">
            {leaderboard.map((fighter, index) => (
              <div key={fighter.id} className="flex items-center justify-between p-4 border-b border-[#111] hover:bg-[#111] transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 flex items-center justify-center font-black font-heading text-sm ${index === 0 ? 'bg-[var(--ab3-gold)] text-black shadow-[0_0_10px_var(--ab3-gold)]' : index === 1 ? 'bg-gray-300 text-black' : index === 2 ? 'bg-[#b45309] text-white' : 'bg-[#222] text-gray-500'}`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-bold text-white uppercase tracking-widest">{fighter.callsign ? `"${fighter.callsign}"` : `${fighter.lastName || 'БОЄЦЬ'} ${fighter.firstName?.[0] || ''}.`}</p>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{fighter.rank || 'Солдат'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-[var(--ab3-gold)]">{Math.round(fighter.combatScore || 0)} <span className="text-[10px] text-gray-500">XP</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};