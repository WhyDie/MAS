import React, { useState, useEffect } from 'react';
import { api } from '@services/api';

interface Announcement {
  id: string;
  title: string;
  text: string;
  type: string;
  author: string;
  createdAt: string;
}

const typeConfig: Record<string, { label: string; color: string; icon: string }> = {
  urgent: { label: 'Терміново', color: '#ef4444', icon: '🚨' },
  warning: { label: 'Важливо', color: '#f59e0b', icon: '⚠️' },
  info: { label: 'Інформація', color: '#3b82f6', icon: 'ℹ️' },
  event: { label: 'Подія', color: '#22c55e', icon: '📅' },
};

const defaultTypeConfig = { label: 'Інформація', color: '#3b82f6', icon: 'ℹ️' };

const emptyAnnouncement: Omit<Announcement, 'id' | 'author' | 'createdAt'> = {
  title: '',
  text: '',
  type: 'info',
};

export const NoticeBoardAdminPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [form, setForm] = useState(emptyAnnouncement);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/announcements');
      setAnnouncements((res.data.data || res.data || []).sort((a: Announcement, b: Announcement) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch {
      setError('Не вдалося завантажити оголошення');
    } finally {
      setLoading(false);
    }
  };

  const openForm = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setForm({ title: announcement.title, text: announcement.text, type: announcement.type });
    } else {
      setEditingAnnouncement(null);
      setForm(emptyAnnouncement);
    }
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const saveAnnouncement = async () => {
    if (!form.title.trim() || !form.text.trim()) {
      setError('Заголовок та текст обовʼязкові');
      return;
    }
    try {
      setLoading(true);
      if (editingAnnouncement) {
        await api.put(`/announcements/${editingAnnouncement.id}`, form);
        setSuccess('Оголошення оновлено');
      } else {
        await api.post('/announcements', form);
        setSuccess('Оголошення додано');
      }
      setShowForm(false);
      loadAnnouncements();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка збереження');
    } finally {
      setLoading(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Видалити це оголошення?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setSuccess('Оголошення видалено');
      loadAnnouncements();
    } catch {
      setError('Не вдалося видалити');
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-heading font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)' }}>
          📢 Управління Оголошеннями
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Додавання, редагування та видалення оголошень
        </p>
      </div>

      {error && <div className="mb-6 p-5 rounded-none border animate-slide-down bg-[#0a0a0a]" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}><div className="flex items-center gap-3"><span className="text-xl">⚠️</span><span style={{ fontSize: '15px', lineHeight: '1.5' }}>{error}</span></div></div>}
      {success && <div className="mb-6 p-5 rounded-none border animate-slide-down bg-[#0a0a0a]" style={{ borderColor: 'rgba(34, 197, 94, 0.3)', color: '#4ade80' }}><div className="flex items-center gap-3"><span className="text-xl">✅</span><span style={{ fontSize: '15px', lineHeight: '1.5' }}>{success}</span></div></div>}

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-heading font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>Список оголошень</h2>
        <button onClick={() => openForm()} className="btn btn-primary w-full sm:w-auto" style={{ padding: '10px 20px', fontSize: '13px' }}>➕ Додати оголошення</button>
      </div>

      {showForm && (
        <div className="p-4 sm:p-6 rounded-none mb-8 animate-fade-in-up bg-[#0a0a0a] border border-[#333]">
          <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>{editingAnnouncement ? '✏️ Редагування' : '➕ Нове оголошення'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Заголовок *</label><input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Заголовок оголошення" /></div>
            <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Тип</label><select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}>{Object.entries(typeConfig).map(([key, config]) => <option key={key} value={key}>{config.icon} {config.label}</option>)}</select></div>
          </div>
          <div className="mb-4"><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Текст оголошення *</label><textarea className="input" rows={5} value={form.text} onChange={e => setForm({ ...form, text: e.target.value })} placeholder="Повний текст оголошення..." /></div>
          <div className="flex gap-3">
            <button onClick={saveAnnouncement} disabled={loading} className="btn btn-primary disabled:opacity-50" style={{ padding: '12px 24px', fontSize: '14px' }}>{loading ? '⏳...' : '💾 Зберегти'}</button>
            <button onClick={() => setShowForm(false)} className="btn" style={{ background: 'transparent', border: '1px solid #333', color: 'var(--text-muted)', padding: '12px 24px', fontSize: '14px' }}>Скасувати</button>
          </div>
        </div>
      )}

      {loading && !showForm ? <div className="p-16 text-center rounded-none bg-[#0a0a0a] border border-[#333]"><svg className="animate-spin w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/></svg><p style={{ color: 'var(--text-muted)' }}>Завантаження...</p></div> : (
        <div className="space-y-3">
          {announcements.map(a => {
            const config = typeConfig[a.type] || defaultTypeConfig;
            return (
              <div key={a.id} className="military-card rounded-none bg-[#0a0a0a] border border-[#333] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4" style={{ borderLeft: `4px solid ${config.color}` }}>
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex items-center gap-3 flex-wrap mb-2"><h3 className="font-bold" style={{ color: 'var(--text-primary)', fontSize: '16px' }}>{a.title}</h3><span className="badge" style={{ background: `${config.color}20`, color: config.color, border: `1px solid ${config.color}40`, fontSize: '10px' }}>{config.icon} {config.label}</span></div>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Автор: {a.author} | {new Date(a.createdAt).toLocaleString('uk-UA')}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0 self-end sm:self-center">
                  <button onClick={() => openForm(a)} className="btn" style={{ background: 'var(--ab3-gold-glow)', border: '1px solid rgba(201,162,39,0.3)', color: 'var(--ab3-gold)', padding: '6px 12px', fontSize: '11px' }}>✏️</button>
                  <button onClick={() => deleteAnnouncement(a.id.toString())} className="btn" style={{ background: 'var(--ab3-red-glow)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '6px 12px', fontSize: '11px' }}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};