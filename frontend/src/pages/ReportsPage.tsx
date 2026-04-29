import React, { useState } from 'react';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');

  const myReports = [
    { id: 1, title: 'Рапорт на щорічну основну відпустку', date: '15.10.2023', status: 'approved' },
    { id: 2, title: 'Рапорт на заміну елементу екіпірування', date: '24.10.2023', status: 'pending' },
    { id: 3, title: 'Рапорт про звільнення від службових обов\'язків', date: '10.09.2023', status: 'rejected' },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px' }}>
          ЦИФРОВІ РАПОРТИ
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          // ОФІЦІЙНІ ЗВЕРНЕННЯ ТА ДОКУМЕНТООБІГ //
        </p>
      </div>

      {/* Tabs */}
      <div className="p-3 rounded-none mb-8 bg-[#0a0a0a] border border-[#333]">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('list')}
            className="btn"
            style={{
              background: activeTab === 'list' ? 'var(--gradient-gold)' : 'transparent',
              color: activeTab === 'list' ? 'var(--ab3-black)' : 'var(--text-muted)',
              border: `1px solid ${activeTab === 'list' ? 'var(--ab3-gold)' : '#333'}`,
              padding: '10px 18px', fontSize: '13px',
            }}
          >
            📋 Мої рапорти
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className="btn"
            style={{
              background: activeTab === 'new' ? 'var(--gradient-gold)' : 'transparent',
              color: activeTab === 'new' ? 'var(--ab3-black)' : 'var(--text-muted)',
              border: `1px solid ${activeTab === 'new' ? 'var(--ab3-gold)' : '#333'}`,
              padding: '10px 18px', fontSize: '13px',
            }}
          >
            ➕ Подати новий
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {myReports.map(r => (
            <div key={r.id} className="p-6 bg-[#0a0a0a] border border-[#333] flex justify-between items-center transition-all hover:border-[var(--ab3-gold)] animate-fade-in-up">
              <div>
                <h4 className="font-heading font-bold text-white text-lg mb-2">{r.title}</h4>
                <p className="text-xs text-gray-400 font-mono">Дата подачі: {r.date}</p>
              </div>
              <div>
                {r.status === 'approved' && <span className="badge badge-success text-xs px-3 py-1">✅ Затверджено</span>}
                {r.status === 'pending' && <span className="badge badge-warning text-xs px-3 py-1">⏳ На розгляді</span>}
                {r.status === 'rejected' && <span className="badge badge-danger text-xs px-3 py-1">❌ Відхилено</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'new' && (
        <div className="p-6 rounded-none bg-[#0a0a0a] border border-[#333] max-w-2xl animate-fade-in-up">
          <h2 className="text-xl font-heading font-bold mb-6 text-white">Форма подачі рапорту</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-400">Тип рапорту</label>
              <select className="input w-full">
                <option>Рапорт на відпустку</option>
                <option>Рапорт на лікування (ВЛК)</option>
                <option>Рапорт на отримання майна</option>
                <option>Рапорт про втрату майна</option>
                <option>Інше</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-400">Суть звернення / Обґрунтування</label>
              <textarea className="input w-full" rows={6} placeholder="Детально опишіть суть вашого звернення..."></textarea>
            </div>
            <button className="btn btn-primary w-full py-3">Відправити на розгляд</button>
          </div>
        </div>
      )}
    </div>
  );
};