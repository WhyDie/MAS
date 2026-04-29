import React, { useState, useEffect } from 'react';
import { api } from '@services/api';

interface MilitaryResource {
  id: string;
  name: string;
  url: string;
  description?: string;
  icon?: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}

const categories = [
  { value: 'official', label: 'Офіційні', icon: '🏛️', color: '#3b82f6' },
  { value: 'support', label: 'Допомога', icon: '🤝', color: '#22c55e' },
  { value: 'benefits', label: 'Пільги', icon: '💳', color: '#f59e0b' },
  { value: 'training', label: 'Навчання', icon: '📚', color: '#8b5cf6' },
  { value: 'community', label: 'Спільнота', icon: '👥', color: '#ec4899' },
];

const emptyResource: Omit<MilitaryResource, 'id' | 'sortOrder'> = {
  name: '', url: '', description: '', icon: '🌐', category: 'official', isActive: true,
};

// ===== Drag & Drop Component =====
const DraggableList: React.FC<{
  items: Array<{ id: string }>;
  onReorder: (newOrder: string[]) => void;
  renderItem: (item: { id: string }, index: number, isDragging: boolean, isOver: boolean, handlers: {
    onDragStart: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: () => void;
  }) => React.ReactNode;
}> = ({ items, onReorder, renderItem }) => {
  const dragOverIndexRef = React.useRef<number | null>(null);
  const dragSourceIndexRef = React.useRef<number | null>(null);
  const [, forceUpdate] = React.useState(0);

  const handleDragStart = (index: number) => { dragSourceIndexRef.current = index; };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndexRef.current !== index) { dragOverIndexRef.current = index; forceUpdate(n => n + 1); }
  };
  const handleDrop = () => {
    const from = dragSourceIndexRef.current, to = dragOverIndexRef.current;
    if (from === null || to === null || from === to) { dragSourceIndexRef.current = null; dragOverIndexRef.current = null; return; }
    const newItems = [...items];
    const [dragged] = newItems.splice(from, 1);
    newItems.splice(to, 0, dragged);
    dragSourceIndexRef.current = null; dragOverIndexRef.current = null;
    onReorder(newItems.map(i => i.id));
  };

  return (
    <>
      {items.map((item, index) => {
        const isDragging = dragSourceIndexRef.current === index;
        const isOver = dragOverIndexRef.current === index;
        return renderItem(item, index, isDragging, isOver, {
          onDragStart: () => handleDragStart(index),
          onDragOver: (e: React.DragEvent) => handleDragOver(e, index),
          onDrop: handleDrop,
        });
      })}
    </>
  );
};

export const ResourceAdminPage: React.FC = () => {
  const [resources, setResources] = useState<MilitaryResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<MilitaryResource | null>(null);
  const [form, setForm] = useState(emptyResource);

  useEffect(() => { loadResources(); }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const res = await api.get('/unit-guide/resources');
      setResources((res.data.data || res.data || []).sort((a: MilitaryResource, b: MilitaryResource) => a.sortOrder - b.sortOrder));
    } catch { setError('Не вдалося завантажити ресурси'); }
    finally { setLoading(false); }
  };

  const handleReorder = async (ids: string[]) => {
    try {
      await api.put('/unit-guide/resources/reorder', { ids });
      setSuccess('Порядок оновлено');
      loadResources();
    } catch (err: any) { setError(err.response?.data?.error || err.message || 'Не вдалося змінити порядок'); }
  };

  const openForm = (resource?: MilitaryResource) => {
    if (resource) {
      setEditingResource(resource);
      setForm({ name: resource.name, url: resource.url, description: resource.description || '', icon: resource.icon || '🌐', category: resource.category, isActive: resource.isActive });
    } else {
      setEditingResource(null);
      setForm(emptyResource);
    }
    setShowForm(true);
    setError(''); setSuccess('');
  };

  const saveResource = async () => {
    if (!form.name.trim() || !form.url.trim()) { setError('Назва та URL обовʼязкові'); return; }
    try {
      setLoading(true);
      if (editingResource) {
        await api.put(`/unit-guide/resources/${editingResource.id}`, form);
        setSuccess('Ресурс оновлено');
      } else {
        await api.post('/unit-guide/resources', form);
        setSuccess('Ресурс додано');
      }
      setShowForm(false);
      loadResources();
    } catch (err: any) { setError(err.response?.data?.error || err.message || 'Помилка збереження'); }
    finally { setLoading(false); }
  };

  const deleteResource = async (id: string) => {
    if (!confirm('Видалити цей ресурс?')) return;
    try {
      await api.delete(`/unit-guide/resources/${id}`);
      setSuccess('Ресурс видалено');
      loadResources();
    } catch { setError('Не вдалося видалити'); }
  };

  const dragIcon = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ cursor: 'grab', color: 'var(--text-faint)', flexShrink: 0 }}>
      <circle cx="9" cy="6" r="1.5" fill="currentColor"/><circle cx="15" cy="6" r="1.5" fill="currentColor"/>
      <circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/>
      <circle cx="9" cy="18" r="1.5" fill="currentColor"/><circle cx="15" cy="18" r="1.5" fill="currentColor"/>
    </svg>
  );

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px', letterSpacing: '1px' }}>
          🌐 Управління ресурсами
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>
          Додавання, редагування, видалення та сортування військових ресурсів
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-5 rounded-none border animate-slide-down bg-[#0a0a0a]" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
          <div className="flex items-center gap-3"><span className="text-xl">⚠️</span><span style={{ fontSize: '15px', lineHeight: '1.5' }}>{error}</span></div>
        </div>
      )}
      {success && (
        <div className="mb-6 p-5 rounded-none border animate-slide-down bg-[#0a0a0a]" style={{ borderColor: 'rgba(34, 197, 94, 0.3)', color: '#4ade80' }}>
          <div className="flex items-center gap-3"><span className="text-xl">✅</span><span style={{ fontSize: '15px', lineHeight: '1.5' }}>{success}</span></div>
        </div>
      )}

      {/* Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-heading font-bold" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>🌐 Військові ресурси</h2>
        <button onClick={() => openForm()} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>➕ Додати ресурс</button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="p-6 rounded-none mb-8 animate-fade-in-up bg-[#0a0a0a] border border-[#333]">
          <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>{editingResource ? '✏️ Редагування ресурсу' : '➕ Новий ресурс'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Назва *</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Міністерство оборони" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>URL *</label>
              <input className="input" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://www.mil.gov.ua" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Іконка</label>
              <input className="input" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="🏛️" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Категорія</label>
              <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Опис</label>
            <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Опис ресурсу..." />
          </div>
          <div className="flex gap-3">
            <button onClick={saveResource} disabled={loading} className="btn btn-primary disabled:opacity-50" style={{ padding: '12px 24px', fontSize: '14px' }}>{loading ? '⏳...' : '💾 Зберегти'}</button>
            <button onClick={() => setShowForm(false)} className="btn" style={{ background: 'transparent', border: '1px solid #333', color: 'var(--text-muted)', padding: '12px 24px', fontSize: '14px' }}>Скасувати</button>
          </div>
        </div>
      )}

      {/* Resources List with Drag & Drop */}
      {loading && !showForm ? (
        <div className="p-16 text-center rounded-none bg-[#0a0a0a] border border-[#333]">
          <svg className="animate-spin w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/></svg>
          <p style={{ color: 'var(--text-muted)' }}>Завантаження...</p>
        </div>
      ) : (
        <div className="space-y-3">
          <DraggableList items={resources} onReorder={handleReorder}
            renderItem={(item, _index, isDragging, isOver, h) => {
              const r = item as MilitaryResource;
              const cat = categories.find(c => c.value === r.category);
              return (
                <div key={r.id} draggable onDragStart={h.onDragStart} onDragOver={h.onDragOver} onDrop={h.onDrop}
                  className="military-card rounded-none bg-[#0a0a0a] border border-[#333] p-5 flex items-center gap-4 transition-all duration-300"
                  style={{ cursor: 'grab', opacity: isDragging ? 0.4 : 1, transform: isOver ? 'translateY(8px)' : 'none', boxShadow: isOver ? '0 -4px 0 0 var(--ab3-gold)' : 'none', borderLeft: `4px solid ${cat?.color || '#6b7280'}` }}>
                  <div className="flex-shrink-0">{dragIcon}</div>
                  <span className="text-3xl flex-shrink-0">{r.icon || '🌐'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)', fontSize: '16px' }}>{r.name}</h3>
                      {cat && <span className="badge" style={{ background: `${cat.color}20`, color: cat.color, border: `1px solid ${cat.color}40`, fontSize: '10px' }}>{cat.icon} {cat.label}</span>}
                    </div>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{r.url}</p>
                    {r.description && <p className="text-xs truncate mt-1" style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{r.description}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openForm(r)} className="btn" style={{ background: 'var(--ab3-gold-glow)', border: '1px solid rgba(201,162,39,0.3)', color: 'var(--ab3-gold)', padding: '6px 12px', fontSize: '11px' }}>✏️</button>
                    <button onClick={() => deleteResource(r.id)} className="btn" style={{ background: 'var(--ab3-red-glow)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '6px 12px', fontSize: '11px' }}>🗑</button>
                  </div>
                </div>
              );
            }}
          />
        </div>
      )}
    </div>
  );
};
