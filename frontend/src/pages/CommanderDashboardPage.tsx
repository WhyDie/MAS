import React, { useState } from 'react';

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
  const [selectedMetric, setSelectedMetric] = useState<'competencies' | 'training' | 'duties'>('competencies');

  const unitStats = {
    totalSoldiers: 45,
    completedTraining: 28,
    averageScore: 82,
    dutiesAssigned: 15,
    onLeave: 3,
    onMedical: 2,
  };

  const competencyMatrix: Soldier[] = [
    { name: 'Петренко О.В.', rank: 'Сержант', tacticalMed: 85, weapons: 92, topography: 76, leadership: 88, completedModules: 12, totalModules: 15 },
    { name: 'Іваненко І.П.', rank: 'Боєць', tacticalMed: 72, weapons: 80, topography: 65, leadership: 70, completedModules: 9, totalModules: 15 },
    { name: 'Миколенко М.С.', rank: 'Боєць', tacticalMed: 88, weapons: 85, topography: 82, leadership: 79, completedModules: 13, totalModules: 15 },
    { name: 'Андрієнко А.О.', rank: 'Боєць', tacticalMed: 65, weapons: 70, topography: 58, leadership: 62, completedModules: 7, totalModules: 15 },
    { name: 'Сергієнко С.М.', rank: 'Боєць', tacticalMed: 91, weapons: 88, topography: 89, leadership: 85, completedModules: 14, totalModules: 15 },
  ];

  const trainingProgress = [
    { module: 'Тактична медицина', completed: 28, total: 45, percentage: 62 },
    { module: 'Озброєння та стрільба', completed: 35, total: 45, percentage: 78 },
    { module: 'Топографія та навігація', completed: 22, total: 45, percentage: 49 },
    { module: 'Радіозвʼязок', completed: 40, total: 45, percentage: 89 },
    { module: 'Виживання в польових умовах', completed: 18, total: 45, percentage: 40 },
  ];

  const dutySchedule = [
    { date: '2026-04-05', duty: 'Чергування на КПП', soldiers: 8, commander: 'Петренко О.В.', status: 'completed' as const },
    { date: '2026-04-06', duty: 'Патруль периметру', soldiers: 6, commander: 'Сергієнко С.М.', status: 'ongoing' as const },
    { date: '2026-04-07', duty: 'Моніторинг звʼязку', soldiers: 4, commander: 'Петренко О.В.', status: 'scheduled' as const },
    { date: '2026-04-08', duty: 'Охорона складу', soldiers: 5, commander: 'Миколенко М.С.', status: 'scheduled' as const },
  ];

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

  const tabs = [
    { id: 'competencies' as const, label: 'Матриця компетенцій', icon: '📈' },
    { id: 'training' as const, label: 'Прогрес навчання', icon: '📚' },
    { id: 'duties' as const, label: 'Графік нарядів', icon: '📋' },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px', lineHeight: '1.2', letterSpacing: '1px' }}>
          📊 Панель Командира
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>
          Аналітика підрозділу, управління навчанням та розпорядком
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
            className="glass-card p-5 animate-scale-in"
            style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both' }}
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
        className="p-3 rounded-2xl mb-8 animate-fade-in-up"
        style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', animationDelay: '0.3s', animationFillMode: 'both' }}
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
                border: `1px solid ${selectedMetric === tab.id ? 'var(--ab3-gold)' : 'var(--border-subtle)'}`,
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
          className="rounded-2xl overflow-hidden animate-fade-in-up"
          style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', animationDelay: '0.35s', animationFillMode: 'both' }}
        >
          <div className="p-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
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
                    <tr key={soldier.name} style={{ transition: 'background 0.25s ease' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <p className="font-semibold" style={{ color: 'var(--text-primary)', fontSize: '14px' }}>
                          {soldier.rank} {soldier.name}
                        </p>
                      </td>
                      {[soldier.tacticalMed, soldier.weapons, soldier.topography, soldier.leadership].map((score, i) => (
                        <td key={i} style={{ padding: '14px 18px' }}>
                          <div className="flex items-center gap-2">
                            <div className="rounded-full h-2 overflow-hidden flex-1" style={{ background: 'var(--ab3-gray-800)' }}>
                              <div className="h-full rounded-full" style={{
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
          className="p-6 rounded-2xl animate-fade-in-up"
          style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', animationDelay: '0.35s', animationFillMode: 'both' }}
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
                <div className="w-full rounded-full h-3 overflow-hidden" style={{ background: 'var(--ab3-gray-800)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
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
          className="rounded-2xl overflow-hidden animate-fade-in-up"
          style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', animationDelay: '0.35s', animationFillMode: 'both' }}
        >
          <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
            <h2 className="text-xl font-heading font-bold" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>
              📋 Графік нарядів
            </h2>
            <button className="btn btn-primary" style={{ padding: '10px 18px', fontSize: '13px' }}>
              + Додати наряд
            </button>
          </div>

          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
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
                  <button className="btn" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '8px 14px', fontSize: '12px' }}>
                    ✏️ Редагувати
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div
        className="p-6 rounded-2xl mt-8 animate-fade-in-up"
        style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', borderLeft: '4px solid var(--ab3-amber)', animationDelay: '0.4s', animationFillMode: 'both' }}
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
