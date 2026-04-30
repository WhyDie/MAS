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
  }, [activeTab]);

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
      const response = await api.get('/mentorship/recruit/requests');
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

  const tabs = [
    { id: 'browse' as const, label: 'Знайти менторів', icon: '🔍' },
    { id: 'my-requests' as const, label: 'Мої запити', icon: '📋' },
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
        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
              className="btn font-bold uppercase tracking-widest"
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
