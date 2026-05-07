import React, { useState, useEffect } from 'react';
import { api } from '@services/api';

interface FAQ {
  id: string;
  category: string;
  q: string;
  a: string;
}

const categories = ['Документи', 'Фінанси', 'Медицина', 'Побут', 'Екіпірування', 'Інше'];

const emptyFAQ: Omit<FAQ, 'id'> = {
  q: '',
  a: '',
  category: 'Інше',
};

export const FAQAdminPage: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [form, setForm] = useState(emptyFAQ);

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/faq');
      setFaqs(res.data.data || res.data || []);
    } catch {
      setError('Не вдалося завантажити FAQ');
    } finally {
      setLoading(false);
    }
  };

  const openForm = (faq?: FAQ) => {
    if (faq) {
      setEditingFAQ(faq);
      setForm({ q: faq.q, a: faq.a, category: faq.category });
    } else {
      setEditingFAQ(null);
      setForm(emptyFAQ);
    }
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const saveFAQ = async () => {
    if (!form.q.trim() || !form.a.trim()) {
      setError('Питання та відповідь обовʼязкові');
      return;
    }
    try {
      setLoading(true);
      if (editingFAQ) {
        await api.put(`/faq/${editingFAQ.id}`, form);
        setSuccess('FAQ оновлено');
      } else {
        await api.post('/faq', form);
        setSuccess('FAQ додано');
      }
      setShowForm(false);
      loadFAQs();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка збереження');
    } finally {
      setLoading(false);
    }
  };

  const deleteFAQ = async (id: string) => {
    if (!confirm('Видалити це питання?')) return;
    try {
      await api.delete(`/faq/${id}`);
      setSuccess('FAQ видалено');
      loadFAQs();
    } catch {
      setError('Не вдалося видалити');
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-heading font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)' }}>
          ❓ Управління FAQ
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Додавання, редагування та видалення частих запитань
        </p>
      </div>

      {error && <div className="mb-6 p-5 rounded-none border animate-slide-down bg-[#0a0a0a]" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}><div className="flex items-center gap-3"><span className="text-xl">⚠️</span><span style={{ fontSize: '15px', lineHeight: '1.5' }}>{error}</span></div></div>}
      {success && <div className="mb-6 p-5 rounded-none border animate-slide-down bg-[#0a0a0a]" style={{ borderColor: 'rgba(34, 197, 94, 0.3)', color: '#4ade80' }}><div className="flex items-center gap-3"><span className="text-xl">✅</span><span style={{ fontSize: '15px', lineHeight: '1.5' }}>{success}</span></div></div>}

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-heading font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>Список питань</h2>
        <button onClick={() => openForm()} className="btn btn-primary w-full sm:w-auto" style={{ padding: '10px 20px', fontSize: '13px' }}>➕ Додати питання</button>
      </div>

      {showForm && (
        <div className="p-4 sm:p-6 rounded-none mb-8 animate-fade-in-up bg-[#0a0a0a] border border-[#333]">
          <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>{editingFAQ ? '✏️ Редагування' : '➕ Нове питання'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Питання *</label><input className="input" value={form.q} onChange={e => setForm({ ...form, q: e.target.value })} placeholder="Введіть питання" /></div>
            <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Категорія</label><select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          </div>
          <div className="mb-4"><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Відповідь *</label><textarea className="input" rows={5} value={form.a} onChange={e => setForm({ ...form, a: e.target.value })} placeholder="Введіть відповідь..." /></div>
          <div className="flex gap-3">
            <button onClick={saveFAQ} disabled={loading} className="btn btn-primary disabled:opacity-50" style={{ padding: '12px 24px', fontSize: '14px' }}>{loading ? '⏳...' : '💾 Зберегти'}</button>
            <button onClick={() => setShowForm(false)} className="btn" style={{ background: 'transparent', border: '1px solid #333', color: 'var(--text-muted)', padding: '12px 24px', fontSize: '14px' }}>Скасувати</button>
          </div>
        </div>
      )}

      {loading && !showForm ? <div className="p-16 text-center rounded-none bg-[#0a0a0a] border border-[#333]"><svg className="animate-spin w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/></svg><p style={{ color: 'var(--text-muted)' }}>Завантаження...</p></div> : (
        <div className="space-y-3">
          {faqs.map(faq => (
            <div key={faq.id} className="military-card rounded-none bg-[#0a0a0a] border border-[#333] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 min-w-0 w-full">
                <div className="flex items-center gap-3 flex-wrap mb-2"><h3 className="font-bold" style={{ color: 'var(--text-primary)', fontSize: '16px' }}>{faq.q}</h3><span className="badge badge-gold">{faq.category}</span></div>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{faq.a}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0 self-end sm:self-center">
                <button onClick={() => openForm(faq)} className="btn" style={{ background: 'var(--ab3-gold-glow)', border: '1px solid rgba(201,162,39,0.3)', color: 'var(--ab3-gold)', padding: '6px 12px', fontSize: '11px' }}>✏️</button>
                <button onClick={() => deleteFAQ(faq.id.toString())} className="btn" style={{ background: 'var(--ab3-red-glow)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '6px 12px', fontSize: '11px' }}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};