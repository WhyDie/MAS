import React, { useState } from 'react';

interface Announcement {
  id: number;
  title: string;
  text: string;
  date: string;
  author: string;
  type: 'urgent' | 'info' | 'event' | 'warning';
}

const ANNOUNCEMENTS: Announcement[] = [
  { id: 1, title: 'Бойова тривога! Навчальні збори', text: 'Усім командирам підрозділів терміново прибути до штабу. Особовому складу отримати зброю та вишикуватись на плацу в повній бойовій готовності.', date: 'Сьогодні, 08:00', author: 'Командир частини', type: 'urgent' },
  { id: 2, title: 'Зміни в розпорядку', text: 'Починаючи з понеділка, 01.11.2023, відбувається перехід на зимовий час. Підйом особового складу переноситься на 06:30.', date: '25.10.2023', author: 'Начальник штабу', type: 'warning' },
  { id: 3, title: 'Видача нового екіпірування', text: 'У вівторок на складі №2 буде проводитись видача зимових спальників та термобілизни. При собі обов\'язково мати військовий квиток. Графік видачі: 1-ша рота з 09:00 до 12:00, 2-га рота з 13:00 до 17:00.', date: '24.10.2023', author: 'Начальник логістики', type: 'info' },
  { id: 4, title: 'Турнір з міні-футболу', text: 'Наступної неділі відбудеться товариський турнір з міні-футболу серед підрозділів нашої частини. Заявки на участь команд подавати заступнику з МПЗ до п\'ятниці.', date: '22.10.2023', author: 'Заступник з МПЗ', type: 'event' },
  { id: 5, title: 'Візит комісії', text: 'У п\'ятницю очікується плановий візит перевіряючої комісії. Звернути увагу на порядок у казармах, стан форми одягу та зброї.', date: '20.10.2023', author: 'Командир частини', type: 'info' },
];

const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
  urgent: { label: 'Терміново', color: '#ef4444', icon: '🚨' }, // red
  warning: { label: 'Важливо', color: '#f59e0b', icon: '⚠️' },  // amber
  info: { label: 'Інформація', color: '#3b82f6', icon: 'ℹ️' },  // blue
  event: { label: 'Подія', color: '#22c55e', icon: '📅' },      // green
};

export const NoticeBoardPage: React.FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAnnouncements = ANNOUNCEMENTS.filter(a => {
    const matchesFilter = filter === 'all' || a.type === filter;
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px', lineHeight: '1.2' }}>
          ДОШКА ОГОЛОШЕНЬ
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
          // ОФІЦІЙНІ ПОВІДОМЛЕННЯ ТА ПОДІЇ //
        </p>
      </div>

      {/* Controls: Search and Filters */}
      <div className="p-4 rounded-none mb-8 animate-fade-in-up bg-[#0a0a0a] border border-[#333]" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="🔍 Пошук по оголошеннях..."
            className="input flex-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setFilter('all')} className="btn" style={{ background: filter === 'all' ? 'var(--gradient-gold)' : 'transparent', color: filter === 'all' ? 'var(--ab3-black)' : 'var(--text-muted)', border: `1px solid ${filter === 'all' ? 'var(--ab3-gold)' : '#333'}`, padding: '10px 16px', fontSize: '13px' }}>
              Всі
            </button>
            {Object.entries(typeConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className="btn"
                style={{ background: filter === key ? `${config.color}20` : 'transparent', color: filter === key ? config.color : 'var(--text-muted)', border: `1px solid ${filter === key ? config.color : '#333'}`, padding: '10px 16px', fontSize: '13px' }}
              >
                {config.icon} {config.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="p-16 text-center rounded-none bg-[#0a0a0a] border border-[#333]">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Оголошень не знайдено</h3>
            <p style={{ color: 'var(--text-muted)' }}>Спробуйте змінити параметри пошуку або фільтри</p>
          </div>
        ) : (
          filteredAnnouncements.map((a, index) => {
            const config = typeConfig[a.type];
            return (
              <div key={a.id} className="p-6 bg-[#0a0a0a] border border-[#333] transition-all duration-300 hover:translate-x-1 animate-fade-in-up relative overflow-hidden" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both', borderLeft: `4px solid ${config.color}` }}>
                
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                  <div>
                    <span className="badge rounded-none font-mono uppercase tracking-widest mb-3 inline-block" style={{ background: `${config.color}15`, color: config.color, border: `1px solid ${config.color}40`, fontSize: '10px' }}>
                      {config.icon} {config.label}
                    </span>
                    <h3 className="text-xl font-heading font-bold text-white">{a.title}</h3>
                  </div>
                  <span className="text-xs text-gray-400 font-mono flex-shrink-0 bg-[#111] px-3 py-1 border border-[#333]">{a.date}</span>
                </div>
                
                <p className="text-gray-300 mb-5 text-sm leading-relaxed">{a.text}</p>
                
                <div className="flex items-center gap-2 border-t border-[#333] pt-4">
                  <span className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Автор: <span style={{ color: 'var(--ab3-gold)' }}>{a.author}</span></span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};