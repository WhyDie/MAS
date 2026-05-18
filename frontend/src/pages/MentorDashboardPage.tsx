import React, { useState, useEffect } from 'react';
import { api } from '@services/api';
import { useAuthStore } from '@stores/index';

export const MentorDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'requests' | 'analytics'>('requests');
  const [requests, setRequests] = useState<any[]>([]);
  const [mentees, setMentees] = useState<any[]>([]);
  const [, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [myReqRes, allReqRes, menRes] = await Promise.all([
        api.get('/mentorship/requests').catch(() => ({ data: [] })),
        api.get('/mentorship/all-requests').catch(() => ({ data: [] })),
        api.get('/mentorship/mentees').catch(() => ({ data: [] }))
      ]);
      
      const myReqs = Array.isArray(myReqRes.data?.data) ? myReqRes.data.data : (Array.isArray(myReqRes.data) ? myReqRes.data : []);
      const allReqs = Array.isArray(allReqRes.data?.data) ? allReqRes.data.data : (Array.isArray(allReqRes.data) ? allReqRes.data : []);
      
      const reqMap = new Map();
      allReqs.forEach((r: any) => {
        if (r.status === 'open' || r.status === 'new' || !r.mentorId) reqMap.set(r.id, r);
      });
      myReqs.forEach((r: any) => {
        const existing = reqMap.get(r.id);
        if (existing && existing.recruit && !r.recruit) r.recruit = existing.recruit;
        reqMap.set(r.id, r);
      });
      
      const combined = Array.from(reqMap.values()).sort((a: any, b: any) => {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      setRequests(combined);
      const menteesData = menRes.data?.data || menRes.data || [];
      // Додаємо самого себе (ментора) до списку, якщо він є в підрозділі
      const selfInList = menteesData.find((m: any) => m.id === user?.id);
      if (!selfInList && user) menteesData.push({ id: user.id, name: `${user.firstName} ${user.lastName}`, rank: user.rank, isSelf: true });
      setMentees(menteesData);
    } catch (err) {
      console.error('Failed to load mentor data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (id: string | number, status: string, responseText?: string) => {
    try {
      await api.put(`/mentorship/requests/${id}/status`, { status, response: responseText });
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
          <button onClick={() => setActiveTab('analytics')} className="btn w-full flex items-center justify-center text-center" style={{ background: activeTab === 'analytics' ? 'var(--gradient-gold)' : 'transparent', color: activeTab === 'analytics' ? 'var(--ab3-black)' : 'var(--text-muted)', border: `1px solid ${activeTab === 'analytics' ? 'var(--ab3-gold)' : '#333'}`, padding: '10px 18px', fontSize: '13px' }}>
            📊 Аналітика та Прогрес
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
      {activeTab === 'analytics' && (
        <div className="bg-[#050505] border border-[#333] shadow-[8px_8px_0_0_#111]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#222] bg-[#0a0a0a]">
                  <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-normal">ПІБ / Звання</th>
                  <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-normal text-center">Модулі</th>
                  <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-normal text-center">Симулятори (Бал)</th>
                  <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-normal text-center">Запити</th>
                  <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-normal text-right">Остання активність</th>
                </tr>
              </thead>
              <tbody>
                {mentees.map(m => (
                  <tr key={m.id} className="border-b border-[#111] hover:bg-[#111] transition-colors group">
                    <td className="p-4">
                      <p className="font-bold text-white">{m.name}</p>
                      <p className="text-xs text-[var(--ab3-gold)]">{m.rank}</p>
                    </td>
                    <td className="p-4 text-center font-mono text-lg text-blue-400 font-bold">{m.completedModules || 0}</td>
                    <td className="p-4 text-center font-mono text-lg font-bold" style={{ color: (m.avgSimScore || 0) >= 80 ? '#22c55e' : (m.avgSimScore || 0) >= 50 ? '#f59e0b' : '#ef4444' }}>
                      {m.avgSimScore || 0}%
                    </td>
                    <td className="p-4 text-center font-mono text-lg text-gray-400 font-bold">{m.requestsCount || 0}</td>
                    <td className="p-4 text-right font-mono text-xs text-gray-500">
                      {m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleDateString('uk-UA') : 'Ніколи'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {mentees.length === 0 && (
              <div className="p-10 text-center font-mono text-gray-500 text-xs uppercase tracking-widest">У вас немає активних підопічних</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};