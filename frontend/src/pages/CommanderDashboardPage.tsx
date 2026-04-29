import React, { useState, useEffect } from 'react';
import { api } from '@services/api';

interface Soldier {
  name: string;
  rank: string;
  tacticalMed: number;
  weapons: number;
  topography: number;
  leadership: number;
  completedModules: number;
  totalModules: number;
}

export const CommanderDashboardPage: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<'competencies' | 'training' | 'duties' | 'reports'>('competencies');
  const [loading, setLoading] = useState(true);
  const [unitStats, setUnitStats] = useState({ totalSoldiers: 0, completedTraining: 0, averageScore: 0, dutiesAssigned: 0, onLeave: 0, onMedical: 0 });
  const [competencyMatrix, setCompetencyMatrix] = useState<Soldier[]>([]);
  const [trainingProgress, setTrainingProgress] = useState<any[]>([]);
  const [dutySchedule, setDutySchedule] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/commander/dashboard');
      const data = res.data.data || res.data;
      if (data.unitStats) setUnitStats(data.unitStats);
      if (data.competencyMatrix) setCompetencyMatrix(data.competencyMatrix);
      if (data.trainingProgress) setTrainingProgress(data.trainingProgress);
      if (data.dutySchedule) setDutySchedule(data.dutySchedule);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAverageScore = (soldier: Soldier): number => {
    return Math.round((soldier.tacticalMed + soldier.weapons + soldier.topography + soldier.leadership) / 4);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="badge badge-success">Виконано</span>;
      case 'ongoing': return <span className="badge badge-warning">Триває</span>;
      case 'scheduled': return <span className="badge badge-gold">Заплановано</span>;
      default: return null;
    }
  };

  const pendingReports = [
    { id: 101, soldier: 'Іваненко І.П.', type: 'Рапорт на заміну елементу екіпірування', date: '24.10.2023' },
    { id: 102, soldier: 'Петренко О.В.', type: 'Рапорт на звільнення за сімейними обставинами', date: '25.10.2023' },
  ];

  const tabs = [
    { id: 'competencies' as const, label: 'Матриця компетенцій', icon: '📈' },
    { id: 'training' as const, label: 'Прогрес навчання', icon: '📚' },
    { id: 'duties' as const, label: 'Графік нарядів', icon: '📋' },
    { id: 'reports' as const, label: 'Рапорти (2)', icon: '📄' },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px', lineHeight: '1.2' }}>
          ПАНЕЛЬ КОМАНДИРА
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
          // АНАЛІТИКА ТА УПРАВЛІННЯ ПІДРОЗДІЛОМ //
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: 'Всього бійців', value: unitStats.totalSoldiers, icon: '👥', color: '#c9a227' },
          { label: 'Завершили навчання', value: unitStats.completedTraining, icon: '✅', color: '#22c55e' },
          { label: 'Середній бал', value: `${unitStats.averageScore}%`, icon: '📈', color: '#3b82f6' },
          { label: 'Нарядів активно', value: unitStats.dutiesAssigned, icon: '📋', color: '#f59e0b' },
          { label: 'У відпустці', value: unitStats.onLeave, icon: '🏖', color: '#06b6d4' },
          { label: 'На медогляді', value: unitStats.onMedical, icon: '🏥', color: '#ec4899' },
        ].map((stat, i) => (
          <div
            key={i}
            className="p-5 animate-scale-in transition-all duration-300 hover:-translate-y-1 rounded-none border border-[#333] bg-[#0a0a0a]"
            style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both', borderLeft: `3px solid ${stat.color}` }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{stat.icon}</span>
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{stat.label}</p>
                <p className="text-2xl font-heading font-black" style={{ color: stat.color, fontSize: '24px', lineHeight: '1.1' }}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div
        className="p-3 rounded-none mb-8 animate-fade-in-up bg-[#0a0a0a] border border-[#333]"
        style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
      >
        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedMetric(tab.id)}
              className="btn"
              style={{
                background: selectedMetric === tab.id ? 'var(--gradient-gold)' : 'transparent',
                color: selectedMetric === tab.id ? 'var(--ab3-black)' : 'var(--text-muted)',
                  border: `1px solid ${selectedMetric === tab.id ? 'var(--ab3-gold)' : '#333'}`,
                padding: '10px 18px',
                fontSize: '13px',
              }}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Competency Matrix */}
      {selectedMetric === 'competencies' && (
        <div
          className="rounded-none overflow-hidden animate-fade-in-up bg-[#050505] border border-[#333]"
          style={{ animationDelay: '0.35s', animationFillMode: 'both' }}
        >
          <div className="p-6 border-b border-[#333]">
            <h2 className="text-xl font-heading font-bold" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>
              📈 Матриця компетенцій особового складу
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Бієць', 'Тактична медицина', 'Озброєння', 'Топографія', 'Лідерство', 'Навчання', 'Загальний бал'].map((h) => (
                    <th key={h} style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '14px 18px', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {competencyMatrix.map((soldier) => {
                  const avg = getAverageScore(soldier);
                  return (
                    <tr key={soldier.name} className="transition-all duration-300 hover:bg-[rgba(255,255,255,0.03)] hover:shadow-sm">
                      <td style={{ padding: '14px 18px' }}>
                        <p className="font-semibold" style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                          {soldier.rank} {soldier.name}
                        </p>
                      </td>
                      {[soldier.tacticalMed, soldier.weapons, soldier.topography, soldier.leadership].map((score, i) => (
                        <td key={i} style={{ padding: '14px 18px' }}>
                          <div className="flex items-center gap-2">
                            <div className="rounded-none h-2 overflow-hidden flex-1" style={{ background: 'var(--ab3-gray-800)' }}>
                              <div className="h-full rounded-none" style={{
                                width: `${score}%`,
                                background: score >= 85 ? 'var(--ab3-green)' : score >= 75 ? 'var(--ab3-amber)' : 'var(--ab3-red)',
                              }} />
                            </div>
                            <span className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{score}%</span>
                          </div>
                        </td>
                      ))}
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {soldier.completedModules}/{soldier.totalModules}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span className={`badge ${avg >= 85 ? 'badge-success' : avg >= 75 ? 'badge-gold' : 'badge-danger'}`}>
                          {avg}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Training Progress */}
      {selectedMetric === 'training' && (
        <div
          className="p-6 rounded-none animate-fade-in-up bg-[#111] border border-[#333]"
          style={{ backdropFilter: 'blur(12px)', animationDelay: '0.35s', animationFillMode: 'both' }}
        >
          <h2 className="text-xl font-heading font-bold mb-6" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>
            📚 Прогрес навчання підрозділу
          </h2>

          <div className="space-y-6">
            {trainingProgress.map((module, index) => (
              <div key={module.module} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.08}s`, animationFillMode: 'both' }}>
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold" style={{ color: 'var(--text-primary)', fontSize: '15px' }}>
                    {module.module}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {module.completed}/{module.total} ({module.percentage}%)
                  </span>
                </div>
                <div className="w-full rounded-none h-3 overflow-hidden" style={{ background: 'var(--ab3-gray-800)' }}>
                  <div
                    className="h-full rounded-none transition-all duration-700"
                    style={{
                      width: `${module.percentage}%`,
                      background: module.percentage >= 80 ? 'var(--ab3-green)' : module.percentage >= 50 ? 'var(--ab3-amber)' : 'var(--ab3-red)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duty Schedule */}
      {selectedMetric === 'duties' && (
        <div
          className="rounded-none overflow-hidden animate-fade-in-up bg-[#111] border border-[#333]"
          style={{ backdropFilter: 'blur(12px)', animationDelay: '0.35s', animationFillMode: 'both' }}
        >
          <div className="p-6 border-b flex items-center justify-between border-[#333]">
            <h2 className="text-xl font-heading font-bold" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>
              📋 Графік нарядів
            </h2>
            <button className="btn btn-primary" style={{ padding: '10px 18px', fontSize: '13px' }}>
              + Додати наряд
            </button>
          </div>

          <div className="divide-y divide-[#333]">
            {dutySchedule.map((duty, index) => (
              <div
                key={duty.date}
                className="p-6 transition-colors duration-200 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.08}s`, animationFillMode: 'both' }}
              >
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-bold text-lg" style={{ color: 'var(--text-primary)', fontSize: '17px' }}>
                        {duty.duty}
                      </p>
                      {getStatusBadge(duty.status)}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                      📅 {new Date(duty.date).toLocaleDateString('uk-UA')} |
                      👥 {duty.soldiers} бійців |
                      🎖️ {duty.commander}
                    </p>
                  </div>
                  <button className="btn" style={{ background: '#0a0a0a', border: '1px solid #333', color: 'var(--text-muted)', padding: '8px 14px', fontSize: '12px' }}>
                    ✏️ Редагувати
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Digital Reports Review */}
      {selectedMetric === 'reports' && (
        <div
          className="rounded-none overflow-hidden animate-fade-in-up bg-[#111] border border-[#333]"
          style={{ backdropFilter: 'blur(12px)', animationDelay: '0.35s', animationFillMode: 'both' }}
        >
          <div className="p-6 border-b flex items-center justify-between border-[#333]">
            <h2 className="text-xl font-heading font-bold" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>📄 Розгляд рапортів</h2>
          </div>
          <div className="divide-y divide-[#333]">
            {pendingReports.map(r => (
              <div key={r.id} className="p-6 flex justify-between items-center flex-wrap gap-4 transition-colors hover:bg-[#1a1a1a]">
                <div>
                  <p className="font-bold text-lg text-white mb-2">{r.type}</p>
                  <p className="text-sm text-gray-400">👤 <strong>{r.soldier}</strong> | 📅 {r.date}</p>
                </div>
                <div className="flex gap-2">
                   <button className="btn" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', color: '#4ade80', padding: '8px 16px', fontSize: '12px' }}>✅ Затвердити</button>
                   <button className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#f87171', padding: '8px 16px', fontSize: '12px' }}>❌ Відхилити</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div
        className="p-6 rounded-none mt-8 animate-fade-in-up bg-[#111] border border-[#333] border-l-4 border-[#f59e0b]"
        style={{ backdropFilter: 'blur(12px)', animationDelay: '0.4s', animationFillMode: 'both' }}
      >
        <h3 className="text-xl font-heading font-bold mb-4" style={{ color: 'var(--ab3-amber)', fontSize: '20px' }}>
          💡 Рекомендації системи
        </h3>
        <ul className="space-y-3">
          {[
            { icon: '⚠️', text: 'Андрієнко А.О. потребує допомоги з топографії (58%) — рекомендується додаткове індивідуальне заняття' },
            { icon: '✅', text: 'Висока готовність підрозділу з радіозвʼязку (89%) — можна переходити до наступного модуля' },
            { icon: '📅', text: 'Чергування на 7 квітня потребує підтвердження від Петренка О.В.' },
            { icon: '🎓', text: '3 бійці готові до складання підсумкового іспиту — рекомендується призначити дату' },
          ].map((rec, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{rec.icon}</span>
              <span style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.6' }}>{rec.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
