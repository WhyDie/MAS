import React from 'react';

export const AchievementsPage: React.FC = () => {
  const achievements = [
    { id: 1, title: 'Перший крок', desc: 'Успішно пройдено онбординг', icon: '🔰', unlocked: true },
    { id: 2, title: 'Майстер Такмеду', desc: 'Завершено модуль медицини на відмінно', icon: '🩸', unlocked: true },
    { id: 3, title: 'Влучний стрілець', desc: 'Пройдено всі модулі зі зброї', icon: '🎯', unlocked: false },
    { id: 4, title: 'Лідер команди', desc: 'Надано допомогу 3 побратимам', icon: '⭐', unlocked: false },
    { id: 5, title: 'Виживання', desc: 'Пройдено симулятор виживання', icon: '🏕️', unlocked: false },
    { id: 6, title: 'Зв\'язківець', desc: 'Ідеальне володіння радіообміном', icon: '📡', unlocked: true },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px' }}>
          ДОСЯГНЕННЯ ТА КАР'ЄРА
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          // ВІДЗНАКИ, НАВИЧКИ ТА КАР'ЄРНИЙ РІСТ //
        </p>
      </div>

      {/* Career Progress */}
      <div className="p-8 rounded-none bg-[#0a0a0a] border border-[#333] mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 opacity-50" style={{ background: 'var(--gradient-gold)' }} />
        <h3 className="text-xl font-heading font-bold mb-6 text-white">🎖️ Кар'єрний шлях</h3>
        
        <div className="p-6 bg-[#111] border border-[#333]">
          <div className="flex justify-between items-center mb-4">
            <span className="font-heading font-bold text-lg text-white">
              Поточне звання: <span className="text-gray-400 font-normal">Солдат</span>
            </span>
            <span className="font-heading font-bold text-lg text-white">
              Наступне: <span className="text-[var(--ab3-gold)]">Старший солдат</span>
            </span>
          </div>
          
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-mono text-gray-500">Прогрес до підвищення</span>
            <span className="text-lg font-bold font-mono" style={{ color: 'var(--ab3-gold)' }}>65%</span>
          </div>
          <div className="w-full h-4 bg-[#222] mb-4">
            <div className="h-full transition-all duration-1000" style={{ background: 'var(--gradient-gold)', width: '65%' }}></div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-[#333]">
            <p className="text-sm font-bold text-white mb-2">Вимоги для підвищення:</p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2"><span className="text-green-500">✅</span> Завершити курс "Базова підготовка"</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✅</span> Не мати дисциплінарних стягнень</li>
              <li className="flex items-center gap-2"><span className="text-[#333]">⬛</span> Успішно скласти іспит "Вогнева підготовка" (залишилось 1 модуль)</li>
              <li className="flex items-center gap-2"><span className="text-[#333]">⬛</span> Відбути 5 нарядів без зауважень (відбуто 3/5)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <h3 className="text-xl font-heading font-bold mb-6 text-white">🏅 Ваші відзнаки</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map(a => (
          <div 
            key={a.id} 
            className={`p-6 border transition-all duration-300 ${
              a.unlocked 
                ? 'border-[var(--ab3-gold)] bg-[rgba(201,162,39,0.05)] hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(201,162,39,0.15)]' 
                : 'border-[#333] bg-[#111] opacity-50 grayscale'
            }`}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className="text-6xl mb-2 drop-shadow-lg">{a.icon}</div>
              <div>
                <h4 className="font-heading font-black tracking-wider text-white text-lg mb-2 uppercase">{a.title}</h4>
                <p className="text-sm text-gray-400 leading-relaxed">{a.desc}</p>
              </div>
              {a.unlocked ? (
                <span className="mt-2 text-xs font-bold text-[var(--ab3-gold)] uppercase tracking-widest bg-[rgba(201,162,39,0.1)] px-3 py-1 border border-[var(--ab3-gold)]">Здобуто</span>
              ) : (
                <span className="mt-2 text-xs font-bold text-gray-500 uppercase tracking-widest bg-[#222] px-3 py-1 border border-[#444]">Заблоковано</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};