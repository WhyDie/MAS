import React, { useState, useEffect } from 'react';
import { api } from '@services/api';

export const MentorDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'mentees'>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [mentees, setMentees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [myReqRes, allReqRes, menRes] = await Promise.all([
        // 1. Мої вже призначені запити
        api.get('/mentorship/requests').catch(() => ({ data: [] })),
        // 2. Всі запити системи (щоб знайти "нічийні" відкриті)
        api.get('/mentorship/all-requests').catch(() => ({ data: [] })),
        // 3. Мої підопічні
        api.get('/mentorship/mentees').catch(() => ({ data: [] }))
      ]);
      
      const myReqs = Array.isArray(myReqRes.data?.data) ? myReqRes.data.data : (Array.isArray(myReqRes.data) ? myReqRes.data : []);
      const allReqs = Array.isArray(allReqRes.data?.data) ? allReqRes.data.data : (Array.isArray(allReqRes.data) ? allReqRes.data : []);
      
      const reqMap = new Map();
      // Спочатку додаємо всі "нічийні" або відкриті запити
      allReqs.forEach((r: any) => {
        if (r.status === 'open' || r.status === 'new' || !r.mentorId) reqMap.set(r.id, r);
      });
      // Потім перезаписуємо моїми запитами
      myReqs.forEach((r: any) => {
        const existing = reqMap.get(r.id);
        if (existing && existing.recruit && !r.recruit) r.recruit = existing.recruit;
        reqMap.set(r.id, r);
      });
      
      const combined = Array.from(reqMap.values()).sort((a: any, b: any) => {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      setRequests(combined);
      setMentees(menRes.data?.data || menRes.data || []);
    } catch (err) {
      console.error('Failed to load mentor data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (id: string | number, status: string, responseText?: string) => {
    try {
      await api.put(`/mentorship/requests/${id}/status`, { status, response: responseText });
      // Якщо беремо в роботу, можливо бекенд також вимагає окремого запиту на призначення
      if (status === 'in_progress') {
        await api.post(`/mentorship/requests/${id}/assign`).catch(() => {});
      }
      setReplyingTo(null);
      setReplyText('');
      loadData(); // Перезавантажуємо дані після оновлення
    } catch (err) {
      console.error('Failed to update request status:', err);
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px' }}>
          ПАНЕЛЬ МЕНТОРА
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          // КООРДИНАЦІЯ ТА ДОПОМОГА ПІДОПІЧНИМ //
        </p>
      </div>

      {/* Tabs */}
      <div className="p-3 rounded-none mb-8 bg-[#0a0a0a] border border-[#333]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button onClick={() => setActiveTab('requests')} className="btn w-full flex items-center justify-center text-center" style={{ background: activeTab === 'requests' ? 'var(--gradient-gold)' : 'transparent', color: activeTab === 'requests' ? 'var(--ab3-black)' : 'var(--text-muted)', border: `1px solid ${activeTab === 'requests' ? 'var(--ab3-gold)' : '#333'}`, padding: '10px 18px', fontSize: '13px' }}>
            📩 Вхідні запити {requests.filter(r => r.status === 'open' || r.status === 'new').length > 0 && (
              <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-[10px] ml-2">{requests.filter(r => r.status === 'open' || r.status === 'new').length}</span>
            )}
          </button>
          <button onClick={() => setActiveTab('mentees')} className="btn w-full flex items-center justify-center text-center" style={{ background: activeTab === 'mentees' ? 'var(--gradient-gold)' : 'transparent', color: activeTab === 'mentees' ? 'var(--ab3-black)' : 'var(--text-muted)', border: `1px solid ${activeTab === 'mentees' ? 'var(--ab3-gold)' : '#333'}`, padding: '10px 18px', fontSize: '13px' }}>
            👥 Мої підопічні
          </button>
        </div>
      </div>

      {/* Requests Content */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="p-16 text-center rounded-none bg-[#0a0a0a] border border-[#333]">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-heading font-bold mb-3 text-white">Немає нових запитів</h3>
              <p className="text-gray-400">Бійці ще не надсилали вам запитів на менторство</p>
            </div>
          ) : (
            requests.map(r => {
              const isNew = r.status === 'open' || r.status === 'assigned' || r.status === 'new';
              const isInProgress = r.status === 'in_progress' || r.status === 'in-progress';
              const isResolved = r.status === 'completed' || r.status === 'resolved';
              const soldierName = r.recruit ? `${r.recruit.rank || ''} ${r.recruit.firstName || ''} ${r.recruit.lastName || ''}`.trim() : r.soldier || 'Невідомий боєць';
              
              return (
                <div key={r.id} className="p-6 bg-[#0a0a0a] border border-[#333] transition-all hover:border-[var(--ab3-gold)] animate-fade-in-up flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="badge font-mono" style={{ background: '#111', color: 'var(--ab3-gold)', border: '1px solid var(--ab3-gold)' }}>{r.topic}</span>
                      {isNew && <span className="badge badge-success text-xs">Нове</span>}
                      {isInProgress && <span className="badge badge-warning text-xs">В роботі</span>}
                    </div>
                    <h4 className="font-bold text-white text-lg mb-2">{soldierName || 'Боєць'}</h4>
                    <p className="text-sm text-gray-400 leading-relaxed mb-3">"{r.description || r.text || 'Без опису'}"</p>
                    <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>🕒 {r.createdAt ? new Date(r.createdAt).toLocaleString('uk-UA') : r.date}</p>
                  </div>
                  
                  {replyingTo === r.id ? (
                    <div className="w-full md:w-1/3 min-w-[250px]">
                      <textarea className="input w-full mb-2" rows={3} placeholder="Напишіть пораду або відповідь..." value={replyText} onChange={e => setReplyText(e.target.value)}></textarea>
                      <div className="flex gap-2">
                        <button onClick={() => updateRequestStatus(r.id, 'completed', replyText)} className="btn btn-primary flex-1 text-xs" style={{ padding: '8px' }}>Закрити</button>
                        <button onClick={() => setReplyingTo(null)} className="btn flex-1 text-xs" style={{ background: 'transparent', border: '1px solid #333', color: 'var(--text-muted)', padding: '8px' }}>Скасувати</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-row md:flex-col gap-2 min-w-[140px]">
                      {!isResolved && <button onClick={() => updateRequestStatus(r.id, 'in_progress')} className="btn btn-primary w-full text-xs font-bold uppercase tracking-widest" style={{ padding: '10px' }}>В роботу</button>}
                      {!isResolved && <button onClick={() => { setReplyingTo(r.id); setReplyText(''); }} className="btn w-full text-xs font-bold uppercase tracking-widest" style={{ background: 'transparent', border: '1px solid #333', color: 'var(--text-muted)', padding: '10px' }}>Вирішено ✅</button>}
                      {isResolved && <span className="text-sm text-green-500 font-bold flex items-center justify-center h-full">Питання закрито</span>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Mentees Content */}
      {activeTab === 'mentees' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mentees.map(m => (
            <div key={m.id} className="p-6 bg-[#0a0a0a] border border-[#333] animate-fade-in-up">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-none bg-[#111] border border-[#333] flex items-center justify-center text-xl">👤</div>
                <div>
                  <h4 className="font-bold text-white">{m.name}</h4>
                  <p className="text-xs text-[var(--ab3-gold)]">{m.rank}</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-2">{m.status}</p>
              <div className="w-full h-2 bg-[#222] mb-4">
                <div className="h-full transition-all duration-1000" style={{ background: 'var(--gradient-gold)', width: `${m.progress}%` }}></div>
              </div>
              <div className="flex gap-2 mt-4">
              <button onClick={() => alert('Детальна статистика у розробці')} className="btn flex-1 text-xs" style={{ background: '#111', border: '1px solid #333', color: 'var(--text-primary)' }}>📊 Прогрес</button>
              <button onClick={() => alert('Внутрішній чат з бійцем зʼявиться у наступному оновленні!')} className="btn flex-1 text-xs" style={{ background: '#111', border: '1px solid #333', color: 'var(--text-primary)' }}>💬 Написати</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};