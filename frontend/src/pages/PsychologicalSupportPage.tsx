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
        message,
        severity,
        contactType,
        keywords: keywordList,
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

  const tabs = [
    { id: 'create' as const, label: 'Новий запит', icon: '✉️' },
    { id: 'history' as const, label: 'Історія', icon: '📋' },
    { id: 'mood' as const, label: 'Настрій', icon: '😊' },
    { id: 'audio' as const, label: 'Аудіо', icon: '🎵' },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px', lineHeight: '1.2' }}>
          ПСИХОЛОГІЧНА ПІДТРИМКА
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
          // ЗВʼЯЗОК З ПСИХОЛОГОМ ДЛЯ КОНСУЛЬТАЦІЇ //
        </p>
      </div>

      {/* Tab Navigation */}
      <div
        className="p-3 rounded-none mb-8 animate-fade-in-up bg-[#0a0a0a] border border-[#333]"
        style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
              className="btn w-full flex items-center justify-center text-center transition-all duration-300 hover:scale-105 active:scale-95"
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
        <div className="mb-6 p-5 rounded-none border animate-slide-down" style={{ background: 'var(--ab3-red-glow)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <span style={{ fontSize: '15px', lineHeight: '1.5' }}>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-5 rounded-none border animate-slide-down" style={{ background: 'var(--ab3-green-glow)', borderColor: 'rgba(34, 197, 94, 0.3)', color: '#4ade80' }}>
          <div className="flex items-center gap-3">
            <span className="text-xl">✅</span>
            <span style={{ fontSize: '15px', lineHeight: '1.5' }}>{success}</span>
          </div>
        </div>
      )}

      {/* Create Request Tab */}
      {activeTab === 'create' && (
        <div
          className="p-6 rounded-none animate-fade-in-up bg-[#0a0a0a] border border-[#333]"
          style={{ animationDelay: '0.15s', animationFillMode: 'both' }}
        >
          <h2 className="text-xl font-heading font-black uppercase tracking-widest mb-6" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>
            СТВОРИТИ ЗАПИТ НА ДОПОМОГУ
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
                className="input"
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
                      className="btn"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { type: 'identified' as const, label: '👤 Ідентифікований' },
                  { type: 'anonymous' as const, label: '🔍 Анонімний' },
                ].map((option) => (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => setContactType(option.type)}
                    className="btn w-full flex items-center justify-center text-center"
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
                className="input"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_-10px_rgba(201,162,39,0.5)] active:scale-95"
              style={{ padding: '16px 24px', fontSize: '15px' }}
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
            <div className="p-16 rounded-none text-center" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
              <svg className="animate-spin w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
                <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/>
              </svg>
              <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>Завантаження...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-16 rounded-none text-center" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)', fontSize: '20px' }}>Запитів ще немає</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6' }}>Створіть перший запит на підтримку</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req, index) => (
                <div
                  key={req.id}
                  className="military-card rounded-none p-6 animate-fade-in-up transition-all duration-500 hover:-translate-y-1 border border-[#333] bg-[#0a0a0a] relative overflow-hidden"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
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
                    <div className="p-4 rounded-none" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
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
            className="p-6 rounded-none"
            style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)' }}
          >
            <h2 className="text-xl font-heading font-bold mb-6" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>
              😊 Мій настрій
            </h2>

            <form onSubmit={handleLogMood} className="space-y-6">
              {/* Mood Slider */}
              <div>
                <label className="block text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Настрій: <span style={{ color: '#f59e0b', fontSize: '18px', fontWeight: 700 }}>{mood}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={mood}
                  onChange={(e) => setMood(parseInt(e.target.value))}
                  className="w-full"
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
                  className="input"
                  rows={3}
                />
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading} className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-95" style={{ padding: '14px 20px', fontSize: '14px' }}>
                {loading ? '⏳ Збереження...' : '💾 Зберегти настрій'}
              </button>
            </form>
          </div>

          {/* Mood Trends */}
          <div
            className="lg:col-span-2 p-6 rounded-none"
            style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)' }}
          >
            <h2 className="text-xl font-heading font-bold mb-6" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>
              📈 Тренд настрою (останні 30 днів)
            </h2>

            {moodLogs.length > 0 ? (
              <div className="space-y-3">
                {moodLogs.slice(0, 10).map((log, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 rounded-none transition-all duration-300 hover:scale-[1.02] hover:bg-[rgba(255,255,255,0.05)]"
                    style={{ background: 'var(--bg-card)' }}
                  >
                    <span className="text-sm" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{log.timestamp}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 rounded-none overflow-hidden" style={{ background: 'var(--ab3-gray-800)' }}>
                        <div
                          className="h-full rounded-none"
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
                className="military-card h-full flex flex-col p-6 animate-fade-in-up transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(236,72,153,0.3)] relative overflow-hidden group"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-none flex items-center justify-center" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2"/><circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/><circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                    </div>
                    <h3 className="text-lg font-heading font-bold" style={{ color: 'var(--text-primary)', fontSize: '17px' }}>{track.title}</h3>
                  </div>
                  <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                    {track.description}
                  </p>
                </div>

                <div className="mt-auto w-full flex justify-between items-center pt-4 border-t border-[#222]">
                  <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    ⏱️ {Math.round(track.duration / 60)} хв
                  </span>
                  <button className="btn" style={{ background: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.3)', color: '#ec4899', padding: '8px 16px', fontSize: '12px' }}>
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
