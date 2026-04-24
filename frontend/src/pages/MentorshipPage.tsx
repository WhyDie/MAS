import React, { useState, useEffect } from 'react';
import { api } from '@services/api';

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
  createdAt: string;
}

const tryzubPoints = [
  // Center (14 points)
  {x:50,y:15}, {x:50,y:20}, {x:50,y:25}, {x:50,y:30}, {x:50,y:35}, {x:50,y:40}, {x:50,y:45},
  {x:50,y:50}, {x:50,y:55}, {x:50,y:60}, {x:50,y:65}, {x:50,y:70}, {x:50,y:75}, {x:50,y:80},
  // Left outer (9 points)
  {x:34,y:30}, {x:33,y:40}, {x:33,y:50}, {x:33,y:60}, {x:35,y:68}, {x:38,y:75}, {x:42,y:79}, {x:46,y:81}, {x:49,y:81},
  // Right outer (9 points)
  {x:66,y:30}, {x:67,y:40}, {x:67,y:50}, {x:67,y:60}, {x:65,y:68}, {x:62,y:75}, {x:58,y:79}, {x:54,y:81}, {x:51,y:81},
  // Left inner (4 points)
  {x:43,y:45}, {x:44,y:52}, {x:46,y:59}, {x:48,y:65},
  // Right inner (4 points)
  {x:57,y:45}, {x:56,y:52}, {x:54,y:59}, {x:52,y:65}
];

const generateFireflyStyles = () => {
  let styles = '';
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  tryzubPoints.forEach((pt, i) => {
    const rX1 = -20 + seededRandom(i * 1.1) * 140; const rY1 = -20 + seededRandom(i * 1.2) * 140;
    const rX2 = -20 + seededRandom(i * 1.3) * 140; const rY2 = -20 + seededRandom(i * 1.4) * 140;
    const rX3 = -20 + seededRandom(i * 1.5) * 140; const rY3 = -20 + seededRandom(i * 1.6) * 140;

    const tX1 = rX1 - pt.x; const tY1 = rY1 - pt.y;
    const tX2 = rX2 - pt.x; const tY2 = rY2 - pt.y;
    const tX3 = rX3 - pt.x; const tY3 = rY3 - pt.y;

    styles += `
      @keyframes firefly-tryzub-${i} {
        0%   { transform: translate(calc(-50% + ${tX1}vw), calc(-50% + ${tY1}vh)); background: #4ade80; box-shadow: 0 0 12px 2px rgba(74,222,128,0.6); opacity: 0; }
        10%  { opacity: 1; }
        25%  { transform: translate(calc(-50% + ${tX2}vw), calc(-50% + ${tY2}vh)); background: #4ade80; box-shadow: 0 0 12px 2px rgba(74,222,128,0.6); }
        45%  { transform: translate(-50%, -50%); background: var(--ab3-gold); box-shadow: 0 0 20px 4px rgba(201,162,39,0.8); }
        55%  { transform: translate(-50%, -50%); background: var(--ab3-gold); box-shadow: 0 0 25px 6px rgba(201,162,39,1); }
        75%  { transform: translate(calc(-50% + ${tX3}vw), calc(-50% + ${tY3}vh)); background: #4ade80; box-shadow: 0 0 12px 2px rgba(74,222,128,0.6); }
        90%  { opacity: 1; }
        100% { transform: translate(calc(-50% + ${tX1}vw), calc(-50% + ${tY1}vh)); background: #4ade80; box-shadow: 0 0 12px 2px rgba(74,222,128,0.6); opacity: 0; }
      }
    `;
  });
  return styles;
};
const fireflyStyles = generateFireflyStyles();

export const MentorshipPage: React.FC = () => {
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
        requestedMentorId: newRequest.mentorId || undefined,
      });
      setNewRequest({ topic: '', description: '', mentorId: '' });
      setSuccess('Запит створено! Ментора буде призначено найближчим часом.');
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
    <div className="relative min-h-[calc(100vh-6rem)] pb-12 animate-fade-in-up z-10">
      {/* Військовий фон: Хаотичні світлячки, що об'єднуються у Тризуб */}
      <div className="fixed inset-0 z-[-1] bg-[var(--bg-primary)] overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f0a] via-[var(--bg-primary)] to-[#0a0f0a]" />
        <style>{fireflyStyles}</style>
        {tryzubPoints.map((pt, i) => (
          <div
            key={i}
            className="absolute rounded-full mix-blend-screen pointer-events-none"
            style={{
              left: `${pt.x}%`,
              top: `${pt.y}%`,
              width: '4px',
              height: '4px',
              animation: `firefly-tryzub-${i} 20s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px', lineHeight: '1.2', letterSpacing: '1px' }}>
          🤝 Менторство
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>
          Знайдіть досвідченого наставника або станьте ним
        </p>
      </div>

      {/* Tab Navigation */}
      <div
        className="p-3 rounded-2xl mb-8 animate-fade-in-up"
        style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', animationDelay: '0.1s', animationFillMode: 'both' }}
      >
        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
              className="btn"
              style={{
                background: activeTab === tab.id ? 'var(--gradient-gold)' : 'transparent',
                color: activeTab === tab.id ? 'var(--ab3-black)' : 'var(--text-muted)',
                border: `1px solid ${activeTab === tab.id ? 'var(--ab3-gold)' : 'var(--border-subtle)'}`,
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

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-5 rounded-2xl border animate-slide-down" style={{ background: 'var(--ab3-red-glow)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <span style={{ fontSize: '15px', lineHeight: '1.5' }}>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-5 rounded-2xl border animate-slide-down" style={{ background: 'var(--ab3-green-glow)', borderColor: 'rgba(34, 197, 94, 0.3)', color: '#4ade80' }}>
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
              placeholder="🔍 Шукати за темою..."
              className="input"
              style={{ fontSize: '15px' }}
            />
          </div>

          {loading ? (
            <div className="p-16 rounded-2xl text-center" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
              <svg className="animate-spin w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/>
              </svg>
              <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>Завантаження...</p>
            </div>
          ) : mentors.length === 0 ? (
            <div className="p-16 rounded-2xl text-center" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
              <div className="text-6xl mb-4">🤝</div>
              <h3 className="text-xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)', fontSize: '20px' }}>Менторів не знайдено</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6' }}>Створіть запит і ментор буде призначений</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mentors.map((mentor, index) => (
                <div
                  key={mentor.id}
              className="military-card p-6 animate-fade-in-up hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] hover:-translate-y-2 transition-all duration-500 border border-transparent hover:border-[var(--border-subtle)] relative overflow-hidden group"
              style={{ background: 'rgba(20, 24, 20, 0.5)', backdropFilter: 'blur(16px)', animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" style={{ background: `radial-gradient(circle at top right, rgba(201,162,39,0.05), transparent 60%)` }} />
                  <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 hover:opacity-100 transition-opacity duration-500" style={{ background: 'var(--gradient-gold)' }} />
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-heading font-bold" style={{ color: 'var(--text-primary)', fontSize: '17px' }}>{getMentorName(mentor)}</h3>
                      <div className="flex items-center gap-1 mt-1" style={{ color: '#fbbf24' }}>
                        {'★'.repeat(getMentorRating(mentor))}{'☆'.repeat(5 - getMentorRating(mentor))}
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>( {getMentorRating(mentor).toFixed(1)} )</span>
                      </div>
                    </div>
                    <span className={`badge ${getMentorAvailability(mentor) ? 'badge-success' : 'badge'}`} style={!getMentorAvailability(mentor) ? { background: 'var(--bg-glass)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' } : {}}>
                      {getMentorAvailability(mentor) ? '✓ Доступний' : '✗ Зайнятий'}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm mb-2" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Спеціалізація:</p>
                    <div className="flex flex-wrap gap-2">
                      {getMentorSkills(mentor).length > 0 ? (
                        getMentorSkills(mentor).slice(0, 3).map((skill) => (
                          <span key={skill} className="badge" style={{ background: 'var(--ab3-gold-glow)', color: 'var(--ab3-gold-light)', border: '1px solid rgba(201, 162, 39, 0.2)', fontSize: '11px' }}>
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="badge" style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '11px' }}>
                          Інформація відсутня
                        </span>
                      )}
                      {getMentorSkills(mentor).length > 3 && (
                        <span className="badge" style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)', fontSize: '11px' }}>
                          +{getMentorSkills(mentor).length - 3}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    Завершено запитів: <strong style={{ color: '#4ade80' }}>{getMentorCompletedRequests(mentor)}</strong>
                  </p>

                  <button
                    onClick={() => {
                      setNewRequest({ ...newRequest, mentorId: mentor.id });
                      setActiveTab('create');
                    }}
                    className="btn btn-primary w-full"
                    style={{ padding: '12px 18px', fontSize: '13px' }}
                  >
                    Запросити менторство
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
            <div className="p-16 rounded-2xl text-center" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
              <svg className="animate-spin w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/>
              </svg>
              <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>Завантаження...</p>
            </div>
          ) : myRequests.length === 0 ? (
            <div className="p-16 rounded-2xl text-center" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
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
                  className="military-card p-6 animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                >
                  <div className="flex justify-between items-start flex-wrap gap-3 mb-4">
                    <div>
                      <h3 className="text-lg font-heading font-bold mb-2" style={{ color: 'var(--text-primary)', fontSize: '17px' }}>{req.topic}</h3>
                      {getStatusBadge(req.status)}
                    </div>
                    <span className="text-sm" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      {new Date(req.createdAt).toLocaleDateString('uk-UA')}
                    </span>
                  </div>
                  {req.mentorId && (
                    <p className="text-sm" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                      Ментор: <strong style={{ color: '#60a5fa' }}>Призначений</strong>
                    </p>
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
          className="p-6 rounded-2xl animate-fade-in-up"
          style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', animationDelay: '0.1s', animationFillMode: 'both' }}
        >
          <h2 className="text-xl font-heading font-bold mb-6" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>
            ✉️ Створити новий запит
          </h2>
          <form onSubmit={handleCreateRequest} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Тема менторинга *</label>
              <input
                type="text"
                value={newRequest.topic}
                onChange={(e) => setNewRequest({ ...newRequest, topic: e.target.value })}
                placeholder="Наприклад: тактична підготовка"
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Опис</label>
              <textarea
                value={newRequest.description}
                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                placeholder="Розкажіть більше про те, що вам потрібно..."
                className="input"
                rows={4}
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed" style={{ padding: '14px 20px', fontSize: '14px' }}>
              {loading ? '⏳ Створення...' : '✅ Створити запит'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
