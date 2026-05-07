import React, { useState, useEffect } from 'react';
import { api } from '@services/api';
import { useAuthStore } from '@stores/index';

interface MentorProfile {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  skills?: string[];
  rating?: number;
  completedRequests?: number;
  availability?: boolean;
}

interface MentorshipRequest {
  id: string;
  recruitId: string;
  mentorId?: string;
  topic: string;
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  rating?: number;
  feedback?: string;
  response?: string;
  createdAt: string;
}

export const MentorshipPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'browse' | 'my-requests' | 'create'>('browse');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Browse state
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [searchTopic, setSearchTopic] = useState('');

  // My requests state
  const [myRequests, setMyRequests] = useState<MentorshipRequest[]>([]);

  // Create request state
  const [newRequest, setNewRequest] = useState({ topic: '', description: '', mentorId: '' });

  // Real Quests State
  const [quests, setQuests] = useState<any[]>([]);
  const [mentees, setMentees] = useState<any[]>([]);
  const [newQuest, setNewQuest] = useState({ title: '', desc: '', xp: 100, recruitId: '' });
  const isMentorAllowed = ['mentor', 'commander', 'admin', 'superadmin'].includes(user?.role || '');

  const getMentorName = (mentor: MentorProfile) => {
    const fullName = `${mentor.firstName ?? ''} ${mentor.lastName ?? ''}`.trim();
    return mentor.name || fullName || 'Ментор';
  };

  const getMentorRating = (mentor: MentorProfile) => {
    const rating = typeof mentor.rating === 'number' && !Number.isNaN(mentor.rating) ? Math.round(mentor.rating) : 0;
    return Math.min(Math.max(rating, 0), 5);
  };

  const getMentorSkills = (mentor: MentorProfile) => Array.isArray(mentor.skills) ? mentor.skills : [];
  const getMentorAvailability = (mentor: MentorProfile) => mentor.availability ?? true;
  const getMentorCompletedRequests = (mentor: MentorProfile) => mentor.completedRequests ?? 0;

  useEffect(() => {
    if (activeTab === 'browse') fetchMentors();
    else if (activeTab === 'my-requests') fetchMyRequests();
    else if (activeTab === 'quests') fetchQuests();
  }, [activeTab]);

  const fetchQuests = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/mentorship/quests?_t=${Date.now()}`);
      setQuests(response.data.data || []);
      
      if (isMentorAllowed) {
        const menteesRes = await api.get(`/mentorship/mentees?_t=${Date.now()}`);
        setMentees(menteesRes.data.data || []);
      }
    } catch (err) {
      setError('Не вдалося завантажити квести');
    } finally { setLoading(false); }
  };

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/mentorship/mentors/available');
      setMentors(response.data.data || response.data || []);
      setError('');
    } catch (err) {
      setError('Не вдалося завантажити менторів');
    } finally { setLoading(false); }
  };

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/mentorship/recruit/requests?_t=${Date.now()}`);
      setMyRequests(response.data.data || response.data || []);
      setError('');
    } catch (err) {
      setError('Не вдалося завантажити запити');
    } finally { setLoading(false); }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.topic.trim()) { setError('Тема обовʼязкова'); return; }
    try {
      setLoading(true);
      await api.post('/mentorship/requests', {
        topic: newRequest.topic,
        description: newRequest.description,
        mentorId: newRequest.mentorId || undefined,
        requestedMentorId: newRequest.mentorId || undefined,
        mentor: newRequest.mentorId || undefined,
      });
      setNewRequest({ topic: '', description: '', mentorId: '' });
      setSuccess('Запит створено! Ментора буде повідомлено.');
      setError('');
      setActiveTab('my-requests');
      fetchMyRequests();
    } catch (err) {
      setError('Не вдалося створити запит');
    } finally { setLoading(false); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="badge badge-success">Завершений</span>;
      case 'in_progress': return <span className="badge badge-blue">В процесі</span>;
      case 'assigned': return <span className="badge badge-warning">Призначений</span>;
      case 'open': return <span className="badge badge-gold">Відкритий</span>;
      case 'cancelled': return <span className="badge badge-danger">Скасований</span>;
      default: return null;
    }
  };

  const handleCreateQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuest.title || !newQuest.recruitId) { setError('Заповніть обовʼязкові поля'); return; }
    try {
      setLoading(true);
      await api.post('/mentorship/quests', { title: newQuest.title, description: newQuest.desc, xp: newQuest.xp, recruitId: newQuest.recruitId });
      setSuccess('Завдання успішно призначено!');
      setNewQuest({ title: '', desc: '', xp: 100, recruitId: '' });
      await fetchQuests();
    } catch (err: any) { setError(err.response?.data?.error || 'Помилка призначення завдання'); }
    finally { setLoading(false); }
  };

  const completeQuest = async (id: string) => {
    try {
      await api.put(`/mentorship/quests/${id}/status`, { status: 'review' });
      setSuccess('Відправлено на перевірку ментору!');
      await fetchQuests();
    } catch(e: any) { setError(e.response?.data?.error || 'Помилка відправки звіту'); }
  };

  const reviewQuest = async (id: string, status: 'completed' | 'pending') => {
    try {
      await api.put(`/mentorship/quests/${id}/status`, { status });
      setSuccess(status === 'completed' ? 'Завдання зараховано!' : 'Повернуто на доопрацювання');
      await fetchQuests();
    } catch(e: any) { setError(e.response?.data?.error || 'Помилка перевірки завдання'); }
  };

  const tabs = [
    { id: 'browse' as const, label: 'Знайти менторів', icon: '🔍' },
    { id: 'my-requests' as const, label: 'Мої запити', icon: '📋' },
    { id: 'quests' as const, label: 'Бойові квести', icon: '🎯' },
    { id: 'create' as const, label: 'Новий запит', icon: '✉️' },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px', lineHeight: '1.2' }}>
          МЕНТОРСТВО
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
          // ЗНАЙДІТЬ ДОСВІДЧЕНОГО НАСТАВНИКА АБО СТАНЬТЕ НИМ //
        </p>
      </div>

      {/* Tab Navigation */}
      <div
        className="p-3 rounded-none mb-8 bg-[#0a0a0a] border border-[#333] animate-fade-in-up"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
              className="btn w-full flex items-center justify-center text-center font-bold uppercase tracking-widest"
              style={{
                background: activeTab === tab.id ? 'var(--gradient-gold)' : 'transparent',
                color: activeTab === tab.id ? 'var(--ab3-black)' : 'var(--text-muted)',
                border: `1px solid ${activeTab === tab.id ? 'var(--ab3-gold)' : '#333'}`,
                padding: '10px 18px',
                fontSize: '12px',
              }}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-5 rounded-none border animate-slide-down bg-[#0a0a0a]" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171', borderLeft: '4px solid #ef4444' }}>
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <span style={{ fontSize: '15px', lineHeight: '1.5' }}>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-5 rounded-none border animate-slide-down bg-[#0a0a0a]" style={{ borderColor: 'rgba(34, 197, 94, 0.3)', color: '#4ade80', borderLeft: '4px solid #22c55e' }}>
          <div className="flex items-center gap-3">
            <span className="text-xl">✅</span>
            <span style={{ fontSize: '15px', lineHeight: '1.5' }}>{success}</span>
          </div>
        </div>
      )}

      {/* Browse Mentors */}
      {activeTab === 'browse' && (
        <div className="animate-fade-in-up">
          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
            placeholder="🔍 ШУКАТИ ЗА ТЕМОЮ..."
            className="input w-full font-mono text-xs uppercase tracking-widest"
            />
          </div>

          {loading ? (
            <div className="p-16 rounded-none text-center bg-[#0a0a0a] border border-[#333]">
              <svg className="animate-spin w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/>
              </svg>
              <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>Завантаження...</p>
            </div>
          ) : mentors.length === 0 ? (
            <div className="p-16 rounded-none text-center bg-[#0a0a0a] border border-[#333]">
              <div className="text-6xl mb-4">🤝</div>
              <h3 className="text-xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)', fontSize: '20px' }}>Менторів не знайдено</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6' }}>Створіть запит і ментор буде призначений</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mentors.map((mentor, index) => (
                <div
                  key={mentor.id}
                  className="military-card p-6 bg-[#0a0a0a] border border-[#333] animate-fade-in-up flex flex-col justify-between"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-heading font-black uppercase tracking-widest text-white mb-1">{getMentorName(mentor)}</h3>
                      <div className="flex items-center gap-1 mt-1" style={{ color: '#fbbf24' }}>
                        {'★'.repeat(getMentorRating(mentor))}{'☆'.repeat(5 - getMentorRating(mentor))}
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>( {getMentorRating(mentor).toFixed(1)} )</span>
                      </div>
                    </div>
                    <span className={`badge ${getMentorAvailability(mentor) ? 'badge-success' : 'badge'}`} style={!getMentorAvailability(mentor) ? { background: 'var(--bg-glass)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' } : {}}>
                      {getMentorAvailability(mentor) ? '✓ Доступний' : '✗ Зайнятий'}
                    </span>
                  </div>

                  <div className="mb-6">
                    <p className="font-mono text-xs uppercase tracking-widest text-gray-500 mb-3">Спеціалізація:</p>
                    <div className="flex flex-wrap gap-2">
                      {getMentorSkills(mentor).length > 0 ? (
                        getMentorSkills(mentor).slice(0, 3).map((skill) => (
                          <span key={skill} className="badge rounded-none font-mono uppercase tracking-widest" style={{ background: '#111', color: 'var(--ab3-gold)', border: '1px solid var(--ab3-gold)', fontSize: '10px' }}>
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="badge rounded-none font-mono uppercase tracking-widest" style={{ background: '#111', color: 'var(--text-muted)', border: '1px solid #333', fontSize: '10px' }}>
                          Інформація відсутня
                        </span>
                      )}
                      {getMentorSkills(mentor).length > 3 && (
                        <span className="badge rounded-none font-mono uppercase tracking-widest" style={{ background: '#111', color: 'var(--text-muted)', border: '1px solid #333', fontSize: '10px' }}>
                          +{getMentorSkills(mentor).length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="font-mono text-xs uppercase tracking-widest text-gray-400 mb-6">
                    Завершено запитів: <strong style={{ color: '#4ade80' }}>{getMentorCompletedRequests(mentor)}</strong>
                  </p>

                  <button
                    onClick={() => {
                      setNewRequest({ ...newRequest, mentorId: mentor.id });
                      setActiveTab('create');
                    }}
                    className="btn btn-primary w-full uppercase tracking-widest font-bold mt-auto"
                    style={{ padding: '12px 18px', fontSize: '12px' }}
                  >
                    ЗАПРОСИТИ МЕНТОРСТВО
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Requests */}
      {activeTab === 'my-requests' && (
        <div className="animate-fade-in-up">
          {loading ? (
            <div className="p-16 rounded-none text-center bg-[#0a0a0a] border border-[#333]">
              <svg className="animate-spin w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/>
              </svg>
              <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>Завантаження...</p>
            </div>
          ) : myRequests.length === 0 ? (
            <div className="p-16 rounded-none text-center bg-[#0a0a0a] border border-[#333]">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)', fontSize: '20px' }}>Запитів ще немає</h3>
              <p className="mb-6" style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6' }}>Створіть перший запит на менторство</p>
              <button onClick={() => setActiveTab('create')} className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '14px' }}>
                ✉️ Створити запит
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myRequests.map((req, index) => (
                <div
                  key={req.id}
                  className="military-card p-6 bg-[#0a0a0a] border border-[#333] animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both', borderLeft: req.status === 'completed' ? '4px solid #22c55e' : '4px solid var(--ab3-gold)' }}
                >
                  <div className="flex justify-between items-start flex-wrap gap-3 mb-4">
                    <div>
                      <h3 className="text-lg font-heading font-black uppercase tracking-widest mb-2 text-white">{req.topic}</h3>
                      {getStatusBadge(req.status)}
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      {new Date(req.createdAt).toLocaleDateString('uk-UA')}
                    </span>
                  </div>
                  {req.mentorId && (
                    <p className="font-mono text-xs uppercase tracking-widest text-gray-400">
                      Ментор: <strong className="text-blue-400">ПРИЗНАЧЕНИЙ</strong>
                    </p>
                  )}
                  
                  {req.response && (
                    <div className="mt-4 p-4 bg-[#111] border border-[#333]">
                      <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--ab3-gold)' }}>Відповідь ментора:</p>
                      <p className="text-sm text-gray-300 leading-relaxed">{req.response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quests (Task Tracker) */}
      {activeTab === 'quests' && (
        <div className="animate-fade-in-up max-w-4xl mx-auto">
          <div className="mb-6 p-6 bg-[#0a0a0a] border border-[#333]">
            <h2 className="text-xl font-heading font-black uppercase tracking-widest text-[var(--ab3-gold)] mb-2">БОЙОВІ ЗАВДАННЯ ВІД МЕНТОРА</h2>
            <p className="text-gray-400 font-mono text-sm leading-relaxed">Виконуйте практичні нормативи, призначені вашим наставником, щоб здобувати бойовий досвід (XP) та підвищувати кваліфікацію.</p>
          </div>

          {/* Form for mentors */}
          {isMentorAllowed && (
            <div className="mb-8 p-6 bg-[#111] border border-[var(--ab3-gold)] shadow-lg">
              <h3 className="text-lg font-heading font-black uppercase tracking-widest text-[var(--ab3-gold)] mb-4">Призначити завдання підопічному</h3>
              
              {mentees.length === 0 ? (
                <div className="p-6 border border-red-900/50 bg-red-900/10 text-center">
                  <p className="text-red-500 font-mono text-sm uppercase tracking-widest font-bold mb-2">⚠️ У ВАС ПОКИ НЕМАЄ АКТИВНИХ ПІДОПІЧНИХ</p>
                  <p className="text-gray-400 font-mono text-xs uppercase tracking-widest leading-relaxed">
                    Перейдіть у <strong className="text-white">«Панель Ментора»</strong> (в боковому меню управління), щоб прийняти запити від новобранців. Після цього ви зможете призначати їм бойові квести.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCreateQuest} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1">Підопічний *</label>
                  <select className="input w-full" value={newQuest.recruitId} onChange={e => setNewQuest({...newQuest, recruitId: e.target.value})} required>
                    <option value="">-- Оберіть бійця --</option>
                    {mentees.map(m => <option key={m.id} value={m.id}>{m.rank} {m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-gray-500 mb-1">Нагорода (XP) *</label>
                  <input type="number" className="input w-full" value={newQuest.xp} onChange={e => setNewQuest({...newQuest, xp: parseInt(e.target.value) || 0})} min="10" max="1000" required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-mono text-gray-500 mb-1">Назва завдання *</label>
                  <input className="input w-full" value={newQuest.title} onChange={e => setNewQuest({...newQuest, title: e.target.value})} placeholder="Напр. Розбирання АК-74" required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-mono text-gray-500 mb-1">Опис та умови виконання</label>
                  <textarea className="input w-full" rows={2} value={newQuest.desc} onChange={e => setNewQuest({...newQuest, desc: e.target.value})} placeholder="Вкластися в 15 секунд..."></textarea>
                </div>
                <div className="md:col-span-2 mt-2">
                  <button type="submit" disabled={loading} className="w-full bg-[var(--ab3-gold)] text-black font-bold font-mono uppercase tracking-widest py-3 hover:bg-yellow-400 transition-colors shadow-[0_0_15px_rgba(201,162,39,0.2)]">
                    {loading ? 'ОБРОБКА...' : 'ПРИЗНАЧИТИ КВЕСТ'}
                  </button>
                </div>
                </form>
              )}
            </div>
          )}

          <div className="space-y-4">
            {quests.length === 0 ? (
              <div className="p-10 border border-[#333] bg-[#0a0a0a] text-center font-mono text-gray-500 uppercase tracking-widest">
                Бойових завдань поки немає.
              </div>
            ) : (
              quests.map(quest => {
                const isMyQuest = quest.recruitId === user?.id;
                const isAssignedByMe = quest.mentorId === user?.id;
                
                return (
                  <div key={quest.id} className="p-6 bg-[#0a0a0a] border border-[#333] hover:border-[var(--ab3-gold)] transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-heading font-black uppercase tracking-widest text-white group-hover:text-[var(--ab3-gold)] transition-colors">{quest.title}</h3>
                        <span className="px-2 py-0.5 bg-[#111] border border-[var(--ab3-gold)] text-[var(--ab3-gold)] text-[10px] font-mono font-bold">+{quest.xp} XP</span>
                      </div>
                      <p className="text-gray-400 text-sm font-mono mb-3">{quest.description || quest.desc}</p>
                      
                      <div className="text-[10px] font-mono text-gray-500 flex gap-4">
                        {isMyQuest && <span>МЕНТОР: {quest.mentorRank || ''} {quest.mentorLastName || ''}</span>}
                        {isAssignedByMe && <span>ВИКОНАВЕЦЬ: {quest.recruitRank || ''} {quest.recruitLastName || ''}</span>}
                        <span>ДАТА: {new Date(quest.createdAt).toLocaleDateString('uk-UA')}</span>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-auto flex-shrink-0 flex flex-col gap-2">
                      {quest.status === 'completed' && (
                        <div className="px-6 py-3 bg-green-900/20 border border-green-900 text-green-500 font-mono text-xs font-bold uppercase tracking-widest text-center">✅ Зараховано</div>
                      )}
                      {quest.status === 'review' && isMyQuest && (
                        <div className="px-6 py-3 bg-blue-900/20 border border-blue-900 text-blue-400 font-mono text-xs font-bold uppercase tracking-widest text-center">⏳ Перевіряється</div>
                      )}
                      {quest.status === 'review' && isAssignedByMe && (
                        <div className="flex gap-2">
                          <button onClick={() => reviewQuest(quest.id, 'completed')} className="px-4 py-3 bg-green-600 hover:bg-green-500 text-white font-mono text-[10px] font-bold uppercase tracking-widest transition-colors">ЗАРАХУВАТИ</button>
                          <button onClick={() => reviewQuest(quest.id, 'pending')} className="px-4 py-3 bg-red-900/30 border border-red-900 text-red-500 hover:bg-red-600 hover:text-white font-mono text-[10px] font-bold uppercase tracking-widest transition-colors">ВІДХИЛИТИ</button>
                        </div>
                      )}
                      {quest.status === 'pending' && isMyQuest && (
                        <button onClick={() => completeQuest(quest.id)} className="w-full md:w-auto px-6 py-3 bg-[var(--ab3-gold)] hover:bg-yellow-400 text-black font-mono text-xs font-bold uppercase tracking-widest transition-colors shadow-[0_0_15px_rgba(201,162,39,0.2)]">ВІДЗВІТУВАТИ</button>
                      )}
                      {quest.status === 'pending' && isAssignedByMe && (
                        <div className="px-6 py-3 bg-[#111] border border-[#333] text-gray-500 font-mono text-xs font-bold uppercase tracking-widest text-center">В ПРОЦЕСІ</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Create Request */}
      {activeTab === 'create' && (
        <div
          className="p-8 rounded-none bg-[#0a0a0a] border border-[#333] animate-fade-in-up max-w-3xl"
          style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
        >
          <h2 className="text-xl font-heading font-black uppercase tracking-widest text-white mb-6">
            ✉️ СТВОРИТИ НОВИЙ ЗАПИТ
          </h2>
          <form onSubmit={handleCreateRequest} className="space-y-5">
            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-gray-400 mb-2">Тема менторинга *</label>
              <input
                type="text"
                value={newRequest.topic}
                onChange={(e) => setNewRequest({ ...newRequest, topic: e.target.value })}
                placeholder="Наприклад: тактична підготовка"
                className="input w-full"
                required
              />
            </div>
            <div>
              <label className="block font-mono text-xs uppercase tracking-widest text-gray-400 mb-2">Опис проблеми</label>
              <textarea
                value={newRequest.description}
                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                placeholder="Опишіть детальніше..."
                className="input w-full"
                rows={4}
              />
            </div>
            <div className="pt-4 border-t border-[#222]">
              <button type="submit" disabled={loading} className="btn btn-primary w-full md:w-auto uppercase tracking-widest font-bold disabled:opacity-50 disabled:cursor-not-allowed" style={{ padding: '14px 32px' }}>
                {loading ? '⏳ СТВОРЕННЯ...' : '✅ НАДІСЛАТИ ЗАПИТ'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
