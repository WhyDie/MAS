import React, { useState, useEffect } from 'react';
import { api } from '@services/api';

interface SupportRequest {
  id: string;
  userId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'responded' | 'escalated' | 'resolved';
  response?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const severityConfig: Record<string, { label: string; color: string; icon: string }> = {
  low: { label: 'Низька', color: '#22c55e', icon: '🟢' },
  medium: { label: 'Середня', color: '#f59e0b', icon: '🟡' },
  high: { label: 'Висока', color: '#f97316', icon: '🟠' },
  critical: { label: 'Критична', color: '#ef4444', icon: '🔴' },
};

const statusLabels: Record<string, string> = {
  pending: 'Очікування',
  in_progress: 'В обробці',
  responded: 'Отримали відповідь',
  escalated: 'Передано',
  resolved: 'Вирішено',
};

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

export const PsychologicalSupportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'history' | 'mood' | 'audio'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create request state
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [keywords, setKeywords] = useState('');
  const [contactType, setContactType] = useState<'identified' | 'anonymous'>('identified');

  // History state
  const [requests, setRequests] = useState<SupportRequest[]>([]);

  // Mood state
  const [mood, setMood] = useState(5);
  const [moodNotes, setMoodNotes] = useState('');
  const [moodLogs, setMoodLogs] = useState<{ mood: number; notes?: string; timestamp: string }[]>([]);

  // Audio state
  const [audioTracks] = useState<Array<{ id: string; title: string; description: string; duration: number; type: string }>>([
    { id: '1', title: 'Дихальні вправи', description: 'Заспокійлива техніка дихання для зниження тривожності', duration: 300, type: 'relaxation' },
    { id: '2', title: 'Медитація спокою', description: 'Керована медитація для внутрішнього миру', duration: 600, type: 'meditation' },
    { id: '3', title: 'Природа заспокоює', description: 'Звуки природи для релаксації', duration: 900, type: 'nature' },
    { id: '4', title: 'Позитивні афірмації', description: 'Позитивні твердження для впевненості', duration: 240, type: 'affirmation' },
  ]);

  useEffect(() => {
    if (activeTab === 'history') fetchUserRequests();
    else if (activeTab === 'mood') fetchMoodTrends();
  }, [activeTab]);

  const fetchUserRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/psychological-support/my-requests');
      setRequests(response.data.data || response.data || []);
      setError('');
    } catch (err) {
      setError('Не вдалося завантажити запити');
    } finally { setLoading(false); }
  };

  const fetchMoodTrends = async () => {
    try {
      setLoading(true);
      const response = await api.get('/psychological-support/trends', { params: { days: 30 } });
      setMoodLogs(response.data.data?.moodTrend || []);
      setError('');
    } catch (err) {
      setError('Не вдалося завантажити тренди настрою');
    } finally { setLoading(false); }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) { setError('Повідомлення обовʼязкове'); return; }
    try {
      setLoading(true);
      const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k);
      await api.post('/psychological-support/request', {
        message, severity, contactType, keywords: keywordList,
      });
      setMessage('');
      setKeywords('');
      setSeverity('medium');
      setContactType('identified');
      setSuccess('Запит на підтримку успішно надіслано!');
      setError('');
      setActiveTab('history');
      fetchUserRequests();
    } catch (err) {
      setError('Не вдалося надіслати запит');
    } finally { setLoading(false); }
  };

  const handleLogMood = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/psychological-support/mood', { mood, notes: moodNotes });
      setMood(5);
      setMoodNotes('');
      setSuccess('Настрій збережено!');
      setError('');
      fetchMoodTrends();
    } catch (err) {
      setError('Не вдалося зберегти настрій');
    } finally { setLoading(false); }
  };

  const getSeverityBadge = (severity: string) => {
    const cfg = severityConfig[severity];
    if (!cfg) return null;
    return (
      <span className="badge" style={{ background: `${cfg.color}20`, color: cfg.color, border: `1px solid ${cfg.color}40`, fontSize: '11px' }}>
        {cfg.icon} {cfg.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved': return <span className="badge badge-success">{statusLabels[status]}</span>;
      case 'responded': return <span className="badge badge-blue">{statusLabels[status]}</span>;
      case 'escalated': return <span className="badge badge-danger">{statusLabels[status]}</span>;
      case 'in_progress': return <span className="badge badge-warning">{statusLabels[status]}</span>;
      case 'pending': return <span className="badge badge-gold">{statusLabels[status]}</span>;
      default: return null;
    }
  };

  const getMoodEmoji = (val: number) => {
    if (val >= 9) return '🤩';
    if (val >= 7) return '😊';
    if (val >= 5) return '😐';
    if (val >= 3) return '😔';
    return '😫';
  };

  const tabs = [
    { id: 'create' as const, label: 'Новий запит', icon: '✉️' },
    { id: 'history' as const, label: 'Історія', icon: '📋' },
    { id: 'mood' as const, label: 'Настрій', icon: '😊' },
    { id: 'audio' as const, label: 'Аудіо', icon: '🎵' },
  ];

  return (
    <div className="relative min-h-[calc(100vh-6rem)] pb-12 animate-fade-in-up">
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
      <div className="mb-10 relative z-10">
        <h1 className="text-[36px] md:text-[42px] font-heading font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-[#fef08a] to-[var(--ab3-gold)] leading-tight tracking-wide flex items-center gap-4 drop-shadow-2xl">
          <span className="animate-bounce drop-shadow-[0_0_15px_rgba(34,197,94,0.5)] text-4xl">💚</span> Психологічна Броня
        </h1>
        <p className="text-base text-[var(--text-muted)] leading-relaxed">
          Звʼяжіться з психологом для консультації та емоційної підтримки
        </p>
      </div>

      {/* Tab Navigation */}
      <div
        className="p-3 rounded-2xl mb-10 animate-fade-in-up shadow-2xl relative z-10"
        style={{ background: 'rgba(20, 24, 20, 0.4)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.05)', animationDelay: '0.1s', animationFillMode: 'both' }}
      >
        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
              className="btn hover:scale-105 active:scale-95 transition-all duration-300 relative overflow-hidden group"
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

      {/* Create Request Tab */}
      {activeTab === 'create' && (
        <div
          className="p-6 md:p-8 rounded-3xl animate-fade-in-up relative z-10 shadow-2xl"
          style={{ background: 'rgba(15, 20, 15, 0.5)', backdropFilter: 'blur(24px)', border: '1px solid rgba(201, 162, 39, 0.1)', animationDelay: '0.15s', animationFillMode: 'both', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
        >
          <h2 className="text-xl font-heading font-bold mb-6" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>
            ✉️ Створити запит на допомогу
          </h2>

          <form onSubmit={handleCreateRequest} className="space-y-6">
            {/* Message */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Опишіть вашу проблему *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Будьте щирі та детальні..."
                className="input focus:ring-2 focus:ring-[var(--ab3-gold)] transition-all duration-300 resize-none"
                rows={5}
                required
              />
            </div>

            {/* Severity */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Рівень серйозності
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['low', 'medium', 'high', 'critical'] as const).map((level) => {
                  const cfg = severityConfig[level];
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSeverity(level)}
                      className="btn hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                      style={{
                        background: severity === level ? `${cfg.color}30` : 'transparent',
                        color: cfg.color,
                        border: `2px solid ${severity === level ? cfg.color : `${cfg.color}40`}`,
                        padding: '12px 16px',
                        fontSize: '14px',
                      }}
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact Type */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Тип контакту
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { type: 'identified' as const, label: '👤 Ідентифікований' },
                  { type: 'anonymous' as const, label: '🔍 Анонімний' },
                ].map((option) => (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => setContactType(option.type)}
                    className="btn hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                    style={{
                      background: contactType === option.type ? 'var(--gradient-gold)' : 'transparent',
                      color: contactType === option.type ? 'var(--ab3-black)' : 'var(--text-muted)',
                      border: `1px solid ${contactType === option.type ? 'var(--ab3-gold)' : 'var(--border-subtle)'}`,
                      padding: '12px 16px',
                      fontSize: '14px',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Ключові слова (опціонально)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="стрес, сон, тривога (розділені комами)"
                className="input focus:ring-2 focus:ring-[var(--ab3-gold)] transition-all duration-300"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn w-full disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(201,162,39,0.6)] hover:-translate-y-1 transition-all duration-500 text-lg font-bold"
              style={{ background: 'var(--gradient-gold)', color: 'var(--ab3-black)', padding: '16px 24px', border: 'none' }}
            >
              {loading ? '⏳ Надсилання...' : '📤 Надіслати запит'}
            </button>
          </form>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="animate-fade-in-up">
          {loading ? (
            <div className="p-16 rounded-2xl text-center" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
              <svg className="animate-spin w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/>
              </svg>
              <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>Завантаження...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-16 rounded-2xl text-center" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)', fontSize: '20px' }}>Запитів ще немає</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6' }}>Створіть перший запит на підтримку</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req, index) => (
                <div
                  key={req.id}
              className="military-card p-6 animate-fade-in-up hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:-translate-y-2 transition-all duration-500 border border-transparent hover:border-[var(--border-subtle)]"
              style={{ background: 'rgba(20, 24, 20, 0.5)', backdropFilter: 'blur(16px)', animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
                >
                  <div className="flex flex-wrap gap-2 mb-4">
                    {getSeverityBadge(req.severity)}
                    {getStatusBadge(req.status)}
                  </div>

                  <p className="text-base mb-4" style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: '1.6' }}>
                    {req.message}
                  </p>

                  <div className="flex items-center justify-between text-sm mb-4" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    <span>{new Date(req.createdAt).toLocaleDateString('uk-UA')}</span>
                  </div>

                  {req.response && (
                    <div className="p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
                      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--ab3-gold)', fontSize: '12px' }}>Відповідь психолога:</p>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                        {req.response}
                      </p>
                      {req.respondedAt && (
                        <p className="text-xs mt-2" style={{ color: 'var(--text-faint)', fontSize: '12px' }}>
                          {new Date(req.respondedAt).toLocaleDateString('uk-UA')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mood Tab */}
      {activeTab === 'mood' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
          {/* Mood Tracker Form */}
          <div
            className="p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden group"
            style={{ background: 'rgba(15, 20, 15, 0.5)', backdropFilter: 'blur(24px)', border: '1px solid rgba(201, 162, 39, 0.1)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#f59e0b]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <h2 className="text-xl font-heading font-bold mb-6" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>
              😊 Мій настрій
            </h2>

            <form onSubmit={handleLogMood} className="space-y-6">
              {/* Mood Slider */}
              <div>
                <label className="block text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Настрій: <span className="inline-block animate-bounce mx-2 text-2xl drop-shadow-md">{getMoodEmoji(mood)}</span> <span style={{ color: '#f59e0b', fontSize: '18px', fontWeight: 700 }}>{mood}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={mood}
                  onChange={(e) => setMood(parseInt(e.target.value))}
                  className="w-full cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ accentColor: '#f59e0b' }}
                />
                <div className="flex justify-between text-xs mt-2" style={{ color: 'var(--text-faint)', fontSize: '11px' }}>
                  <span>🔴 Дуже погано</span>
                  <span>🟢 Відмінно</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Нотатки (опціонально)
                </label>
                <textarea
                  value={moodNotes}
                  onChange={(e) => setMoodNotes(e.target.value)}
                  placeholder="Як у вас справи?"
                  className="input focus:ring-2 focus:ring-[var(--ab3-gold)] transition-all duration-300 resize-none"
                  rows={3}
                />
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(201,162,39,0.4)] hover:-translate-y-0.5 transition-all duration-300" style={{ padding: '14px 20px', fontSize: '14px' }}>
                {loading ? '⏳ Збереження...' : '✨ Зберегти настрій'}
              </button>
            </form>
          </div>

          {/* Mood Trends */}
          <div
            className="lg:col-span-2 p-6 md:p-8 rounded-3xl shadow-2xl"
            style={{ background: 'rgba(15, 20, 15, 0.5)', backdropFilter: 'blur(24px)', border: '1px solid rgba(201, 162, 39, 0.1)' }}
          >
            <h2 className="text-xl font-heading font-bold mb-6" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>
              📈 Тренд настрою (останні 30 днів)
            </h2>

            {moodLogs.length > 0 ? (
              <div className="space-y-3">
                {moodLogs.slice(0, 10).map((log, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-[var(--bg-glass-hover)] transition-colors duration-300 hover:scale-[1.02] transform"
                    style={{ background: 'var(--bg-card)' }}
                  >
                    <span className="text-sm" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{log.timestamp}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: 'var(--ab3-gray-800)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(log.mood / 10) * 100}%`,
                            background: `linear-gradient(90deg, #ef4444, #f59e0b, #22c55e)`,
                          }}
                        />
                      </div>
                      <span className="font-bold" style={{ color: '#f59e0b', fontSize: '15px' }}>{log.mood}/10</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-16 text-center">
                <div className="text-6xl mb-4">😊</div>
                <h3 className="text-lg font-heading font-bold mb-2" style={{ color: 'var(--text-primary)', fontSize: '18px' }}>Немає даних</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6' }}>Почніть вести журнал настрою!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audio Tab */}
      {activeTab === 'audio' && (
        <div className="animate-fade-in-up">
          <div className="mb-6">
            <h2 className="text-xl font-heading font-bold" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>
              🎵 Аудіо-терапія
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5' }}>
              Заспокійливі аудіо для релаксації та внутрішнього спокою
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {audioTracks.map((track, index) => (
              <div
                key={track.id}
              className="military-card p-6 animate-fade-in-up hover:shadow-[0_15px_40px_-10px_rgba(236,72,153,0.3)] hover:-translate-y-2 transition-all duration-500 group border border-transparent hover:border-[rgba(236,72,153,0.3)] relative overflow-hidden"
              style={{ background: 'rgba(20, 24, 20, 0.5)', backdropFilter: 'blur(16px)', animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
              >
              <div className="absolute inset-0 bg-gradient-to-br from-[#ec4899]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-[rgba(236,72,153,0.2)] transition-all duration-500 shadow-[0_0_15px_rgba(236,72,153,0.1)] group-hover:shadow-[0_0_25px_rgba(236,72,153,0.3)]" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="group-hover:animate-pulse"><path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2"/><circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/><circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                  </div>
                  <h3 className="text-lg font-heading font-bold" style={{ color: 'var(--text-primary)', fontSize: '17px' }}>{track.title}</h3>
                </div>

                <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                  {track.description}
                </p>

                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    ⏱️ {Math.round(track.duration / 60)} хв
                  </span>
                  <button className="btn group-hover:bg-[rgba(236,72,153,0.25)] hover:scale-105 transition-all duration-300" style={{ background: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.3)', color: '#ec4899', padding: '8px 16px', fontSize: '12px' }}>
                    ▶️ Слухати
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
