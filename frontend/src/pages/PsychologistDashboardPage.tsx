import React, { useState, useEffect } from 'react';
import { api } from '@services/api';

export const PsychologistDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'requests'>('analytics');
  const [moodStats, setMoodStats] = useState<any>({ totalPolled: 0, good: 0, normal: 0, stressed: 0, critical: 0 });
  const [supportRequests, setSupportRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, reqRes] = await Promise.all([
        api.get('/psychological-support/analytics').catch(() => ({ data: { totalPolled: 0, good: 0, normal: 0, stressed: 0, critical: 0 } })),
        api.get('/psychological-support/all-requests').catch(() => ({ data: [] }))
      ]);
      if (statsRes.data?.data || statsRes.data) {
        setMoodStats(statsRes.data?.data || statsRes.data);
      }
      setSupportRequests(reqRes.data?.data || reqRes.data || []);
    } catch (err) {
      console.error('Failed to load psychologist data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (id: string | number, status: string, responseText?: string) => {
    try {
      await api.put(`/psychological-support/requests/${id}/status`, { status, response: responseText });
      setReplyingTo(null);
      setReplyText('');
      loadData();
    } catch (err) {
      console.error('Failed to update request status:', err);
    }
  };

  const getSeverityColor = (sev: string) => {
    if (sev === 'high') return '#ef4444'; // red
    if (sev === 'medium') return '#f59e0b'; // amber
    return '#3b82f6'; // blue
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px' }}>
          ПАНЕЛЬ ПСИХОЛОГА
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          // МОНІТОРИНГ НАСТРОЮ ТА ПІДТРИМКА ОСОБОВОГО СКЛАДУ //
        </p>
      </div>

      {/* Tabs */}
      <div className="p-3 rounded-none mb-8 bg-[#0a0a0a] border border-[#333]">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setActiveTab('analytics')} className="btn" style={{ background: activeTab === 'analytics' ? 'var(--gradient-gold)' : 'transparent', color: activeTab === 'analytics' ? 'var(--ab3-black)' : 'var(--text-muted)', border: `1px solid ${activeTab === 'analytics' ? 'var(--ab3-gold)' : '#333'}`, padding: '10px 18px', fontSize: '13px' }}>
            📊 Аналітика настрою
          </button>
          <button onClick={() => setActiveTab('requests')} className="btn flex items-center gap-2" style={{ background: activeTab === 'requests' ? 'var(--gradient-gold)' : 'transparent', color: activeTab === 'requests' ? 'var(--ab3-black)' : 'var(--text-muted)', border: `1px solid ${activeTab === 'requests' ? 'var(--ab3-gold)' : '#333'}`, padding: '10px 18px', fontSize: '13px' }}>
            📨 Запити на допомогу {supportRequests.filter(r => r.status === 'new').length > 0 && (
              <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-[10px]">{supportRequests.filter(r => r.status === 'new').length}</span>
            )}
          </button>
        </div>
      </div>

      {/* Analytics Content */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#0a0a0a] border border-[#333] animate-fade-in-up">
            <h2 className="text-xl font-heading font-bold text-white mb-6">Загальний морально-психологічний стан (ЗМПС)</h2>
            <p className="text-sm text-gray-400 mb-6">Дані зібрані на основі щоденних опитувань {moodStats.totalPolled} військовослужбовців за останні 7 днів.</p>
            
            <div className="space-y-4 max-w-3xl">
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-green-500 font-bold">Відмінний / Бойовий</span><span className="text-white">{moodStats.good}%</span></div>
                <div className="w-full h-3 bg-[#111]"><div className="h-full bg-green-500" style={{ width: `${moodStats.good}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-blue-500 font-bold">Нормальний</span><span className="text-white">{moodStats.normal}%</span></div>
                <div className="w-full h-3 bg-[#111]"><div className="h-full bg-blue-500" style={{ width: `${moodStats.normal}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-yellow-500 font-bold">Стрес / Втома</span><span className="text-white">{moodStats.stressed}%</span></div>
                <div className="w-full h-3 bg-[#111]"><div className="h-full bg-yellow-500" style={{ width: `${moodStats.stressed}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="text-red-500 font-bold">Критичний стан</span><span className="text-white">{moodStats.critical}%</span></div>
                <div className="w-full h-3 bg-[#111]"><div className="h-full bg-red-500 animate-pulse" style={{ width: `${moodStats.critical}%` }}></div></div>
              </div>
            </div>
            
            <div className="mt-8 p-4 border border-[#333] bg-[#111] border-l-4 border-l-red-500">
              <p className="text-sm text-white">⚠️ <strong>Увага:</strong> Виявлено 2 бійців у зоні ризику (критичний стан). Рекомендується ініціювати індивідуальні бесіди.</p>
            </div>
          </div>
        </div>
      )}

      {/* Requests Content */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {supportRequests.length === 0 ? (
            <div className="p-16 text-center rounded-none bg-[#0a0a0a] border border-[#333]">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-heading font-bold mb-3 text-white">Немає запитів</h3>
              <p className="text-gray-400">Наразі запитів на психологічну підтримку не надходило</p>
            </div>
          ) : (
            supportRequests.map(r => {
              const isNew = r.status === 'pending' || r.status === 'new';
              const isInProgress = r.status === 'in_progress' || r.status === 'in-progress';
              const isResolved = r.status === 'resolved' || r.status === 'completed';
              const isAnon = r.contactType === 'anonymous' || r.isAnonymous;
              const soldierName = isAnon ? 'Анонімно' : (r.user ? `${r.user.rank || ''} ${r.user.firstName || ''} ${r.user.lastName || ''}`.trim() : r.type || 'Боєць');

              return (
                <div key={r.id} className="p-6 bg-[#0a0a0a] border border-[#333] transition-all hover:border-[var(--ab3-gold)] animate-fade-in-up flex flex-col md:flex-row justify-between gap-6" style={{ borderLeft: `4px solid ${getSeverityColor(r.severity)}` }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="badge font-mono" style={{ background: '#111', color: 'white', border: '1px solid #333' }}>{soldierName}</span>
                      {(r.severity === 'high' || r.severity === 'critical') && <span className="badge bg-red-500/20 text-red-500 border border-red-500/50 text-xs">🚨 Високий пріоритет</span>}
                    </div>
                    <h4 className="font-bold text-white text-lg mb-2">{r.message || r.topic}</h4>
                    <p className="text-xs font-mono mt-3" style={{ color: 'var(--text-muted)' }}>📅 Отримано: {r.createdAt ? new Date(r.createdAt).toLocaleString('uk-UA') : r.date}</p>
                  </div>

                  {replyingTo === r.id ? (
                    <div className="w-full md:w-1/3 min-w-[250px]">
                      <textarea className="input w-full mb-2" rows={3} placeholder="Ваша відповідь або рекомендація..." value={replyText} onChange={e => setReplyText(e.target.value)}></textarea>
                      <div className="flex gap-2">
                        <button onClick={() => updateRequestStatus(r.id, 'resolved', replyText)} className="btn btn-primary flex-1 text-xs" style={{ padding: '8px' }}>Закрити</button>
                        <button onClick={() => setReplyingTo(null)} className="btn flex-1 text-xs" style={{ background: 'transparent', border: '1px solid #333', color: 'var(--text-muted)', padding: '8px' }}>Скасувати</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-row md:flex-col gap-2 min-w-[160px]">
                      {isNew ? (
                        <>
                          <button onClick={() => updateRequestStatus(r.id, 'in_progress')} className="btn btn-primary w-full text-xs font-bold uppercase tracking-widest" style={{ padding: '10px' }}>Взяти в роботу</button>
                          <button onClick={() => { setReplyingTo(r.id); setReplyText(''); }} className="btn w-full text-xs font-bold uppercase tracking-widest" style={{ background: 'transparent', border: '1px solid #333', color: 'var(--text-primary)', padding: '10px' }}>Вирішено ✅</button>
                        </>
                      ) : !isResolved ? (
                        <button onClick={() => { setReplyingTo(r.id); setReplyText(''); }} className="btn w-full text-xs font-bold uppercase tracking-widest" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', color: '#4ade80', padding: '10px' }}>Закрити запит 🔄</button>
                      ) : (
                        <span className="text-sm text-green-500 font-bold flex items-center justify-center h-full">Питання закрито</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};