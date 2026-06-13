import React, { useState, useEffect } from 'react';
import { api } from '@services/api';

interface ScheduleEvent {
  id: string;
  unitId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  eventType: string;
  location?: string;
  assignedUserIds?: string;
  status: string;
  notifyParticipants: boolean;
  createdByUserId?: string;
}

const eventTypeConfig: Record<string, { label: string; icon: string; color: string }> = {
  training: { label: 'Навчання', icon: '📚', color: '#22c55e' },
  duty: { label: 'Наряд', icon: '🛡️', color: '#f59e0b' },
  meal: { label: 'Їжа', icon: '🍽️', color: '#3b82f6' },
  meeting: { label: 'Нарада', icon: '👥', color: '#8b5cf6' },
  medical: { label: 'Медичний', icon: '⚕️', color: '#ef4444' },
  rest: { label: 'Відпочинок', icon: '🛌', color: '#6b7280' },
  other: { label: 'Інше', icon: '📌', color: '#6b7280' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Заплановано', color: '#c9a227' },
  ongoing: { label: 'Триває', color: '#22c55e' },
  completed: { label: 'Виконано', color: '#6b7280' },
  cancelled: { label: 'Скасовано', color: '#ef4444' },
};

const emptyEvent: Omit<ScheduleEvent, 'id'> = {
  unitId: 'unit-1',
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  eventType: 'training',
  location: '',
  status: 'scheduled',
  notifyParticipants: false,
};

export const ScheduleAdminPage: React.FC = () => {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [form, setForm] = useState(emptyEvent);

  useEffect(() => { loadEvents(); }, [selectedDate]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      // Get events for a wide date range
      const currentYear = new Date().getFullYear();
      const startDate = `${currentYear - 1}-01-01`;
      const endDate = `${currentYear + 2}-12-31`;
      const res = await api.get(`/schedule/events?startDate=${startDate}&endDate=${endDate}`);
      const data = res.data.data || res.data || [];
      setEvents(data);
    } catch { setError('Не вдалося завантажити події'); }
    finally { setLoading(false); }
  };

  const openForm = (ev?: ScheduleEvent) => {
    if (ev) {
      setEditingEvent(ev);
      setForm({
        unitId: ev.unitId || 'unit-1',
        title: ev.title,
        description: ev.description || '',
        startTime: ev.startTime || '',
        endTime: ev.endTime || '',
        eventType: ev.eventType,
        location: ev.location || '',
        status: ev.status,
        notifyParticipants: ev.notifyParticipants || false,
      });
    } else {
      setEditingEvent(null);
      setForm({ ...emptyEvent, startTime: `${selectedDate}T08:00`, endTime: `${selectedDate}T09:00` });
    }
    setShowForm(true);
    setError(''); setSuccess('');
  };

  const saveEvent = async () => {
    if (!form.title.trim()) { setError('Назва обовʼязкова'); return; }
    if (!form.startTime || !form.endTime) { setError('Вкажіть час початку та закінчення'); return; }
    try {
      setLoading(true);
      if (editingEvent) {
        await api.put(`/schedule/events/${editingEvent.id}`, form);
        setSuccess('Подію оновлено');
      } else {
        await api.post('/schedule/events', form);
        setSuccess('Подію додано');
      }
      setShowForm(false);
      loadEvents();
    } catch (err: any) { setError(err.response?.data?.error || err.message || 'Помилка'); }
    finally { setLoading(false); }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Видалити цю подію?')) return;
    try {
      await api.delete(`/schedule/events/${id}`);
      setSuccess('Подію видалено');
      loadEvents();
    } catch { setError('Не вдалося видалити'); }
  };

  const filterByDate = (events: ScheduleEvent[]) => {
    return events.filter(ev => {
      if (!ev.startTime) return false;
      return ev.startTime.startsWith(selectedDate);
    }).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  };

  const formatTime = (dt: string) => {
    if (!dt) return '';
    const d = new Date(dt);
    return d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="animate-fade-in-up overflow-x-hidden">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-heading font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)' }}>УПРАВЛІННЯ РОЗПОРЯДКОМ</h1>
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>// РЕДАГУВАННЯ ГРАФІКА //</p>
      </div>

      {error && (
        <div className="mb-6 p-5 rounded-none border animate-slide-down bg-[#0a0a0a]" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
          <span>⚠️ {error}</span>
        </div>
      )}
      {success && (
        <div className="mb-6 p-5 rounded-none border animate-slide-down bg-[#0a0a0a]" style={{ borderColor: 'rgba(34, 197, 94, 0.3)', color: '#4ade80' }}>
          <span>✅ {success}</span>
        </div>
      )}

      {/* Date Picker & Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>📅 Дата:</label>
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="input flex-1" style={{ padding: '8px 14px' }} />
        </div>
        <button onClick={() => openForm()} className="btn btn-primary w-full sm:w-auto" style={{ padding: '10px 20px', fontSize: '13px' }}>➕ Додати подію</button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="p-4 sm:p-6 rounded-none mb-8 animate-fade-in-up bg-[#0a0a0a] border border-[#333]">
          <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>{editingEvent ? '✏️ Редагування події' : '➕ Нова подія'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Назва *</label><input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Побудова" /></div>
            <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Тип</label>
              <select className="input" value={form.eventType} onChange={e => setForm({ ...form, eventType: e.target.value })}>{Object.entries(eventTypeConfig).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}</select>
            </div>
            <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Час початку *</label><input type="datetime-local" className="input" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Час закінчення *</label><input type="datetime-local" className="input" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Місце</label><input className="input" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Плац" /></div>
            <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Статус</label>
              <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select>
            </div>
          </div>
          <div className="mb-4"><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Опис</label><textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Деталі події..." /></div>
          <div className="flex gap-3">
            <button onClick={saveEvent} disabled={loading} className="btn btn-primary disabled:opacity-50" style={{ padding: '12px 24px', fontSize: '14px' }}>{loading ? '⏳...' : '💾 Зберегти'}</button>
            <button onClick={() => setShowForm(false)} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '12px 24px', fontSize: '14px' }}>Скасувати</button>
          </div>
        </div>
      )}

      {/* Events List */}
      {loading && !showForm ? (
        <div className="p-16 text-center rounded-none bg-[#0a0a0a] border border-[#333]">
          <svg className="animate-spin w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/></svg>
          <p style={{ color: 'var(--text-muted)' }}>Завантаження...</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filterByDate(events).length === 0 ? (
            <div className="p-16 text-center rounded-none bg-[#0a0a0a] border border-[#333]">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Немає подій на цю дату</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>Натисніть "➕ Додати подію" щоб створити розпорядок</p>
            </div>
          ) : (
            filterByDate(events).map((ev) => {
              const typeCfg = eventTypeConfig[ev.eventType] || eventTypeConfig.other;
              const statusCfg = statusConfig[ev.status] || statusConfig.scheduled;
              return (
                <div key={ev.id} className="military-card rounded-none p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#0a0a0a] border border-[#333]" style={{ borderLeft: `4px solid ${typeCfg.color}` }}>
                  <div className="text-2xl sm:text-3xl flex-shrink-0">{typeCfg.icon}</div>
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)', fontSize: '16px' }}>{ev.title}</h3>
                      <span className="badge" style={{ background: `${typeCfg.color}20`, color: typeCfg.color, border: `1px solid ${typeCfg.color}40`, fontSize: '10px' }}>{typeCfg.label}</span>
                      <span className="badge" style={{ background: `${statusCfg.color}20`, color: statusCfg.color, border: `1px solid ${statusCfg.color}40`, fontSize: '10px' }}>{statusCfg.label}</span>
                    </div>
                    <div className="flex gap-3 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span>🕐 {formatTime(ev.startTime)} — {formatTime(ev.endTime)}</span>
                      {ev.location && <span>📍 {ev.location}</span>}
                    </div>
                    {ev.description && <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{ev.description}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0 self-end sm:self-center">
                    <button onClick={() => openForm(ev)} className="btn" style={{ background: 'var(--ab3-gold-glow)', border: '1px solid rgba(201,162,39,0.3)', color: 'var(--ab3-gold)', padding: '6px 12px', fontSize: '11px' }}>✏️</button>
                    <button onClick={() => deleteEvent(ev.id)} className="btn" style={{ background: 'var(--ab3-red-glow)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '6px 12px', fontSize: '11px' }}>🗑</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
