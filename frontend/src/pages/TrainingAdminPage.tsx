import React, { useState, useEffect } from 'react';
import { api } from '@services/api';

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  durationMinutes: number;
  tags?: string;
  content?: string;
  isActive: boolean;
  sortOrder: number;
  contentParsed?: any;
}

const categories = [
  { value: 'Тактична Медицина', label: 'Тактична Медицина', icon: '🏥' },
  { value: 'Озброєння', label: 'Озброєння', icon: '🔫' },
  { value: 'Топографія', label: 'Топографія', icon: '🗺️' },
  { value: 'Загальне Навчання', label: 'Загальне Навчання', icon: '📖' },
];

const difficulties = [
  { value: 'beginner', label: 'Початківець', color: '#22c55e' },
  { value: 'intermediate', label: 'Середній', color: '#f59e0b' },
  { value: 'advanced', label: 'Просунутий', color: '#ef4444' },
];

const emptyModule: Omit<TrainingModule, 'id' | 'sortOrder'> = {
  title: '', description: '', category: 'Тактична Медицина', difficulty: 'beginner', durationMinutes: 20, tags: '[]', content: '', isActive: true,
};

const DraggableList: React.FC<{
  items: Array<{ id: string }>;
  onReorder: (ids: string[]) => void;
  renderItem: (item: { id: string }, index: number, isDragging: boolean, isOver: boolean, handlers: {
    onDragStart: () => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: () => void;
  }) => React.ReactNode;
}> = ({ items, onReorder, renderItem }) => {
  const dragOverRef = React.useRef<number | null>(null);
  const dragSourceRef = React.useRef<number | null>(null);
  const [, forceUpdate] = React.useState(0);

  const handleDragStart = (i: number) => { dragSourceRef.current = i; };
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); if (dragOverRef.current !== i) { dragOverRef.current = i; forceUpdate(n => n + 1); } };
  const handleDrop = () => {
    const from = dragSourceRef.current, to = dragOverRef.current;
    if (from === null || to === null || from === to) { dragSourceRef.current = null; dragOverRef.current = null; return; }
    const newItems = [...items];
    const [dragged] = newItems.splice(from, 1);
    newItems.splice(to, 0, dragged);
    dragSourceRef.current = null; dragOverRef.current = null;
    onReorder(newItems.map(i => i.id));
  };

  return <>
    {items.map((item, index) => {
      const isDragging = dragSourceRef.current === index;
      const isOver = dragOverRef.current === index;
      return renderItem(item, index, isDragging, isOver, {
        onDragStart: () => handleDragStart(index),
        onDragOver: (e: React.DragEvent) => handleDragOver(e, index),
        onDrop: handleDrop,
      });
    })}
  </>;
};

export const TrainingAdminPage: React.FC = () => {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState<TrainingModule | null>(null);
  const [showContentViewer, setShowContentViewer] = useState(false);
  const [viewingModule, setViewingModule] = useState<TrainingModule | null>(null);
  const [form, setForm] = useState(emptyModule);

  useEffect(() => { loadModules(); }, []);

  const loadModules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/training/modules');
      const data = res.data.data || res.data || [];
      const list = Array.isArray(data) ? data : data.data || [];
      setModules(list.sort((a: TrainingModule, b: TrainingModule) => a.sortOrder - b.sortOrder));
    } catch { setError('Не вдалося завантажити модулі'); }
    finally { setLoading(false); }
  };

  const handleReorder = async (ids: string[]) => {
    try {
      await api.put('/training/modules/reorder', { ids });
      setSuccess('Порядок оновлено');
      loadModules();
    } catch { setError('Не вдалося змінити порядок'); }
  };

  const openForm = async (mod?: TrainingModule) => {
    if (mod) {
      setEditingModule(mod);
      // Load full module data including content
      try {
        const res = await api.get(`/training/modules/${mod.id}`);
        const fullData = res.data.data || res.data;
        const contentText = typeof fullData.content === 'object' ? (fullData.content.text || '') : (fullData.content || '');
        setForm({ title: fullData.title, description: fullData.description, category: fullData.category, difficulty: fullData.difficulty, durationMinutes: fullData.durationMinutes, tags: fullData.tags || '[]', content: contentText, isActive: fullData.isActive });
      } catch {
        setForm({ title: mod.title, description: mod.description, category: mod.category, difficulty: mod.difficulty, durationMinutes: mod.durationMinutes, tags: mod.tags || '[]', content: '', isActive: mod.isActive });
      }
    } else {
      setEditingModule(null);
      setForm(emptyModule);
    }
    setShowForm(true);
    setError(''); setSuccess('');
  };

  const viewContent = async (mod: TrainingModule) => {
    try {
      const res = await api.get(`/training/modules/${mod.id}`);
      const fullData = res.data.data || res.data;
      setViewingModule({ ...mod, content: typeof fullData.content === 'object' ? (fullData.content.text || '') : (fullData.content || '') });
    } catch {
      setViewingModule(mod);
    }
    setShowContentViewer(true);
  };

  const saveModule = async () => {
    if (!form.title.trim()) { setError('Назва обовʼязкова'); return; }
    try {
      setLoading(true);
      const data: any = {
        title: form.title,
        description: form.description,
        category: form.category,
        difficulty: form.difficulty,
        durationMinutes: form.durationMinutes,
        tags: form.tags,
        content: { text: form.content || '' },
        isOfflineAvailable: true,
      };
      if (editingModule) {
        await api.put(`/training/modules/${editingModule.id}`, data);
        setSuccess('Модуль оновлено');
      } else {
        await api.post('/training/modules', data);
        setSuccess('Модуль додано');
      }
      setShowForm(false);
      loadModules();
    } catch (err: any) { setError(err.response?.data?.error || err.message || 'Помилка'); }
    finally { setLoading(false); }
  };

  const deleteModule = async (id: string) => {
    if (!confirm('Видалити цей модуль?')) return;
    try {
      await api.delete(`/training/modules/${id}`);
      setSuccess('Модуль видалено');
      loadModules();
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
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px' }}>УПРАВЛІННЯ МОДУЛЯМИ</h1>
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>// БАЗА НАВЧАЛЬНИХ ПРОГРАМ //</p>
      </div>

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

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-heading font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>НАВЧАЛЬНІ МОДУЛІ</h2>
        <button onClick={() => openForm()} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>➕ Додати модуль</button>
      </div>

      {showForm && (
        <div className="p-6 rounded-none mb-8 animate-fade-in-up bg-[#0a0a0a] border border-[#333]">
          <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>{editingModule ? '✏️ Редагування' : '➕ Новий модуль'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Назва *</label><input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Назва модуля" /></div>
            <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Категорія</label>
              <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}</select>
            </div>
            <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Складність</label>
              <select className="input" value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}>{difficulties.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}</select>
            </div>
            <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Тривалість (хв)</label><input type="number" className="input" value={form.durationMinutes} onChange={e => setForm({ ...form, durationMinutes: parseInt(e.target.value) || 0 })} min="1" /></div>
          </div>
          <div className="mb-4"><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Опис</label><textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Опис модуля..." /></div>
          <div className="mb-4"><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Зміст модуля</label><textarea className="input" rows={8} value={form.content || ''} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Повний зміст навчального модуля..." /></div>
          <div className="mb-4"><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Теги (JSON масив)</label><input className="input" value={form.tags || '[]'} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder='["тег1", "тег2"]' /></div>
          <div className="flex gap-3">
            <button onClick={saveModule} disabled={loading} className="btn btn-primary disabled:opacity-50" style={{ padding: '12px 24px', fontSize: '14px' }}>{loading ? '⏳...' : '💾 Зберегти'}</button>
            <button onClick={() => setShowForm(false)} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '12px 24px', fontSize: '14px' }}>Скасувати</button>
          </div>
        </div>
      )}

      {loading && !showForm ? (
        <div className="p-16 text-center rounded-none bg-[#0a0a0a] border border-[#333]">
          <svg className="animate-spin w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/></svg>
          <p style={{ color: 'var(--text-muted)' }}>Завантаження...</p>
        </div>
      ) : (
        <div className="space-y-3">
          <DraggableList items={modules} onReorder={handleReorder}
            renderItem={(item, _index, isDragging, isOver, h) => {
              const m = item as TrainingModule;
              const cat = categories.find(c => c.value === m.category);
              const diff = difficulties.find(d => d.value === m.difficulty);
              return (
                <div key={m.id} draggable onDragStart={h.onDragStart} onDragOver={h.onDragOver} onDrop={h.onDrop}
                  className="military-card rounded-none bg-[#0a0a0a] border border-[#333] p-5 flex items-center gap-4 transition-all duration-300"
                  style={{ cursor: 'grab', opacity: isDragging ? 0.4 : 1, transform: isOver ? 'translateY(8px)' : 'none', boxShadow: isOver ? '0 -4px 0 0 var(--ab3-gold)' : 'none', borderLeft: `4px solid ${diff?.color || '#6b7280'}` }}>
                  <div className="flex-shrink-0">{dragIcon}</div>
                  <span className="text-2xl flex-shrink-0">{cat?.icon || '📚'}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold" style={{ color: 'var(--text-primary)', fontSize: '16px' }}>{m.title}</h3>
                    <div className="flex gap-2 mt-1">
                      {diff && <span className="badge" style={{ background: `${diff.color}20`, color: diff.color, border: `1px solid ${diff.color}40`, fontSize: '10px' }}>{diff.label}</span>}
                      <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>⏱ {m.durationMinutes} хв</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => viewContent(m)} className="btn" style={{ background: 'var(--ab3-blue-glow, rgba(59,130,246,0.15))', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', padding: '6px 12px', fontSize: '11px' }}>📖</button>
                    <button onClick={() => openForm(m)} className="btn" style={{ background: 'var(--ab3-gold-glow)', border: '1px solid rgba(201,162,39,0.3)', color: 'var(--ab3-gold)', padding: '6px 12px', fontSize: '11px' }}>✏️</button>
                    <button onClick={() => deleteModule(m.id)} className="btn" style={{ background: 'var(--ab3-red-glow)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '6px 12px', fontSize: '11px' }}>🗑</button>
                  </div>
                </div>
              );
            }}
          />
        </div>
      )}

      {/* Content Viewer Modal */}
      {showContentViewer && viewingModule && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }} onClick={() => setShowContentViewer(false)}>
          <div className="rounded-none max-w-3xl w-full max-h-[85vh] overflow-y-auto animate-fade-in-up bg-[#0a0a0a] border border-[#333]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-heading font-bold" style={{ color: 'var(--text-primary)' }}>📖 {viewingModule.title}</h2>
                  <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{viewingModule.description}</p>
                </div>
                <button onClick={() => setShowContentViewer(false)} className="text-2xl hover:opacity-70 flex-shrink-0 ml-4" style={{ color: 'var(--text-muted)' }}>✕</button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex gap-3 mb-6">
                {difficulties.map(d => d.value === viewingModule.difficulty && (
                  <span key={d.value} className="badge" style={{ background: `${d.color}20`, color: d.color, border: `1px solid ${d.color}40`, fontSize: '11px' }}>{d.label}</span>
                ))}
                <span className="badge badge-gold">{viewingModule.category}</span>
                <span className="badge badge-info">⏱ {viewingModule.durationMinutes} хв</span>
              </div>
              {viewingModule.content ? (
                <div className="p-5 rounded-none bg-[#111] border border-[#333]">
                  <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--ab3-gold)', fontSize: '13px', letterSpacing: '0.5px' }}>📝 ЗМІСТ МОДУЛЯ</h3>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                    {viewingModule.content.split('\n').map((line: string, i: number) => {
                      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold mt-5 mb-2" style={{ color: 'var(--text-primary)', fontSize: '17px' }}>{line.replace('### ', '')}</h3>;
                      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-6 mb-3" style={{ color: 'var(--ab3-gold)', fontSize: '19px' }}>{line.replace('## ', '')}</h2>;
                      if (line.startsWith('**')) {
                        const parts = line.split(/\*\*(.*?)\*\*/);
                        return <p key={i} className="font-semibold" style={{ color: 'var(--text-primary)' }}>{parts.map((p: string, j: number) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</p>;
                      }
                      if (line.startsWith('- ')) return <li key={i} className="ml-4 mb-1" style={{ color: 'var(--text-secondary)' }}>{line.replace('- ', '• ')}</li>;
                      if (/^\d+\.\s/.test(line)) return <p key={i} className="mb-2 font-medium" style={{ color: 'var(--text-primary)' }}>{line}</p>;
                      if (line.trim() === '') return <div key={i} className="h-3" />;
                      return <p key={i} className="mb-1" style={{ color: 'var(--text-secondary)' }}>{line}</p>;
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center rounded-none" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Зміст порожній</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Натисніть ✏️ щоб додати зміст модуля</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t flex justify-end" style={{ borderColor: 'var(--border-subtle)' }}>
              <button onClick={() => { setShowContentViewer(false); openForm(viewingModule); }} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>✏️ Редагувати</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
