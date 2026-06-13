import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'; // Додаємо useSearchParams
import { api } from '@services/api';
import { useAuthStore } from '@stores/index';

interface ApiEvent {
  id: string;
  unitId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  eventType: string;
  location?: string;
  status: string;
  notifyParticipants: boolean;
  createdByUserId?: string;
}

const eventTypeConfig: Record<string, { icon: string; color: string; label: string }> = {
  training: { icon: '📚', color: '#22c55e', label: 'Навчання' },
  duty: { icon: '🛡️', color: '#f59e0b', label: 'Наряд' },
  meal: { icon: '🍽️', color: '#3b82f6', label: 'Їжа' },
  meeting: { icon: '👥', color: '#8b5cf6', label: 'Нарада' },
  medical: { icon: '⚕️', color: '#ef4444', label: 'Медичний' },
  rest: { icon: '🛌', color: '#6b7280', label: 'Відпочинок' },
  other: { icon: '📌', color: '#6b7280', label: 'Інше' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Заплановано', color: '#c9a227' },
  ongoing: { label: 'Триває', color: '#22c55e' },
  completed: { label: 'Виконано', color: '#6b7280' },
  cancelled: { label: 'Скасовано', color: '#ef4444' },
};

export const SchedulePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Ініціалізуємо useSearchParams
  const { user } = useAuthStore();
  
  const [apiEvents, setApiEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const startDate = '2026-01-01';
      const endDate = '2026-12-31';
      const res = await api.get(`/schedule/events?startDate=${startDate}&endDate=${endDate}`);
      const data = res.data.data || res.data || [];
      setApiEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
      setApiEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Обробка параметрів URL для підсвічування події
  useEffect(() => {
    const eventId = searchParams.get('eventId');
    const highlightDate = searchParams.get('highlightDate');

    if (eventId && highlightDate) {
      setSelectedDate(new Date(highlightDate)); // Встановлюємо дату події
      // Уявіть, що тут ви маєте спосіб зберегти eventId для підсвічування
      // setHighlightedEventId(eventId); // Наприклад, новий стан
      
      // TODO: Позначити сповіщення як прочитане через сервіс сповіщень
      // notificationService.markAsRead(notificationId);
    }
  }, [searchParams]);

  const filterEventsByDate = (date: Date): ApiEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return apiEvents.filter(event => {
      if (!event.startTime) return false;
      const eventDate = event.startTime.split('T')[0];
      return eventDate === dateStr;
    }).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  };

  const todayEvents = filterEventsByDate(selectedDate);

  const formatTime = (dt: string): string => {
    if (!dt) return '';
    const d = new Date(dt);
    return d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    const cfg = statusConfig[status] || statusConfig.scheduled;
    return (
      <span className="badge rounded-none font-mono uppercase tracking-widest" style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}`, fontSize: '9px' }}>
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="animate-fade-in-up overflow-x-hidden">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center flex-wrap gap-4 border-b border-[#333] pb-4">
          <div className="flex-1 min-w-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-heading font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>
                РОЗПОРЯДОК <span className="text-white/30 font-light">/ ДНЯ</span>
              </h1>
              <p className="font-mono text-xs uppercase tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>
                // ПЛАН ЗАХОДІВ ПІДРОЗДІЛУ //
              </p>
            </div>
          </div>
          {(user?.role === 'commander' || user?.role === 'admin' || user?.role === 'superadmin') && (
            <button onClick={() => navigate('/schedule-admin')} className="btn btn-primary rounded-none uppercase tracking-widest font-bold w-full sm:w-auto" style={{ padding: '10px 20px', fontSize: '13px' }}>⚙️ Управління розпорядком</button>
          )}
        </div>
      </div>

      {/* Date Navigation */}
      <div
        className="p-4 mb-6 animate-fade-in-up bg-[#0a0a0a] border border-[#222]"
        style={{ animationDelay: '0.1s', animationFillMode: 'both', borderRadius: '2px' }}
      >
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <button
            onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 86400000))}
            className="btn font-mono uppercase text-xs tracking-wider hover:text-white w-full sm:w-auto"
            style={{ background: '#111', border: '1px solid #333', color: 'var(--text-muted)', padding: '10px 18px' }}
          >
            ← Назад
          </button>

          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="input w-full"
            style={{ flexGrow: 1, padding: '8px 14px', borderRadius: '2px', border: '1px solid #333', background: '#111', color: 'white', fontFamily: 'monospace' }}
          />

          <button
            onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 86400000))}
            className="btn font-mono uppercase text-xs tracking-wider hover:text-white w-full sm:w-auto"
            style={{ background: '#111', border: '1px solid #333', color: 'var(--text-muted)', padding: '10px 18px' }}
          >
            Вперед →
          </button>

          <button
            onClick={() => setSelectedDate(new Date())}
            className="btn btn-primary sm:ml-auto uppercase font-bold tracking-widest text-xs w-full sm:w-auto"
            style={{ padding: '10px 18px', fontSize: '13px' }}
          >
            Сьогодні
          </button>
        </div>
      </div>

      {/* Week View */}
      <div
        className="p-4 mb-8 animate-fade-in-up bg-[#0a0a0a] border border-[#222]"
        style={{ animationDelay: '0.15s', animationFillMode: 'both', borderRadius: '2px' }}
      >
        <h3 className="font-mono text-xs font-bold mb-4 uppercase tracking-widest" style={{ color: 'var(--ab3-gold)' }}>[ ТИЖНЕВИЙ ОГЛЯД ]</h3>
        <div className="overflow-x-auto pb-2 -mb-2">
          <div className="grid grid-cols-7 gap-2 text-center text-sm min-w-[480px]">
            {Array.from({ length: 7 }).map((_, i) => {
              const date = new Date(selectedDate.getTime() + (i - 3) * 86400000);
              const dayEvents = filterEventsByDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = date.toDateString() === selectedDate.toDateString();

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className="p-3 rounded-none border transition-all duration-300 hover:scale-105"
                  style={{
                    background: isSelected ? 'var(--gradient-gold)' : isToday ? 'var(--bg-glass-hover)' : 'transparent',
                    borderColor: isToday ? 'var(--ab3-gold)' : 'var(--border-subtle)',
                    color: isSelected ? 'var(--ab3-black)' : 'var(--text-primary)',
                  }}
                >
                  <div className="font-bold" style={{ fontSize: '16px' }}>{date.getDate()}</div>
                  <div className="text-xs mt-1" style={{ color: isSelected ? 'var(--ab3-black)' : 'var(--text-muted)' }}>
                    {date.toLocaleDateString('uk-UA', { weekday: 'short' })}
                  </div>
                  {dayEvents.length > 0 && (
                    <div className="text-xs mt-1 font-bold" style={{ color: isSelected ? 'var(--ab3-black)' : '#f59e0b' }}>
                      {dayEvents.length}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Events List */}
      <div
        className="rounded-none overflow-hidden animate-fade-in-up"
        style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', animationDelay: '0.2s', animationFillMode: 'both' }}
      >
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <h2 className="text-xl font-heading font-bold" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>
            {selectedDate.toLocaleDateString('uk-UA', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h2>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <svg className="animate-spin w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/></svg>
            <p style={{ color: 'var(--text-muted)' }}>Завантаження...</p>
          </div>
        ) : todayEvents.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Немає подій на цей день</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6' }}>Оберіть іншу дату або додайте нову подію</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {todayEvents.map((event) => {
              const typeCfg = eventTypeConfig[event.eventType] || eventTypeConfig.other;
              return (
                <div
                  key={event.id} // Додаємо id до ключа
                  className="p-4 sm:p-6 transition-all duration-300"
                  style={{ background: 'var(--bg-card)', borderLeft: `4px solid ${typeCfg.color}` }}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl sm:text-4xl flex-shrink-0">{typeCfg.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                        <h3 className="text-lg font-heading font-bold" style={{ color: 'var(--text-primary)', fontSize: '17px', lineHeight: '1.3' }}>
                          {event.title}
                        </h3>
                        {getStatusBadge(event.status)}
                      </div>

                      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
                        🕐 {formatTime(event.startTime)} — {formatTime(event.endTime)}
                      </p>

                      {event.description && (
                        <p className="text-sm mb-3" style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.6' }}>
                          {event.description}
                        </p>
                      )}

                      {event.location && (
                        <p className="text-sm" style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                          📍 {event.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
