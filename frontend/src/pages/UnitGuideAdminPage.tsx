import React, { useState, useEffect, useRef } from 'react';
import { api } from '@services/api';

interface UnitRoom {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  category: string;
  floor?: number;
  roomNumber?: string;
  phone?: string;
  sortOrder: number;
  isActive: boolean;
}

interface UnitStaff {
  id: string;
  rank: string;
  fullName: string;
  position: string;
  icon?: string;
  room?: string;
  floor?: number;
  phone?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

interface ArrivalStep {
  id: string;
  title: string;
  description: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}

const categories = [
  { value: 'command', label: 'Командування', icon: '⭐', color: '#c9a227' },
  { value: 'support', label: 'Забезпечення', icon: '📋', color: '#3b82f6' },
  { value: 'living', label: 'Побут', icon: '🏠', color: '#22c55e' },
  { value: 'food', label: 'Харчування', icon: '🍽️', color: '#f59e0b' },
  { value: 'training', label: 'Навчання', icon: '📚', color: '#8b5cf6' },
  { value: 'storage', label: 'Склади', icon: '📦', color: '#6b7280' },
  { value: 'medical', label: 'Медична служба', icon: '⚕️', color: '#ec4899' },
  { value: 'other', label: 'Інше', icon: '📌', color: '#6b7280' },
];

const emptyRoom: Omit<UnitRoom, 'id' | 'sortOrder'> = {
  name: '', description: '', icon: '🏢', category: 'other', floor: 1, roomNumber: '', phone: '', isActive: true,
};

const emptyStaff: Omit<UnitStaff, 'id' | 'sortOrder'> = {
  rank: '', fullName: '', position: '', icon: '👤', room: '', floor: 1, phone: '', description: '', isActive: true,
};

const emptyStep: Partial<ArrivalStep> = {
  title: '', description: '', icon: '📝', isActive: true, sortOrder: 0,
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
  const dragOverIndexRef = useRef<number | null>(null);
  const dragSourceIndexRef = useRef<number | null>(null);
  const [, forceUpdate] = useState(0);

  const handleDragStart = (index: number) => {
    dragSourceIndexRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndexRef.current !== index) {
      dragOverIndexRef.current = index;
      forceUpdate(n => n + 1);
    }
  };

  const handleDrop = () => {
    const fromIndex = dragSourceIndexRef.current;
    const toIndex = dragOverIndexRef.current;

    if (fromIndex === null || toIndex === null || fromIndex === toIndex) {
      dragSourceIndexRef.current = null;
      dragOverIndexRef.current = null;
      return;
    }

    const newItems = [...items];
    const [dragged] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, dragged);

    dragSourceIndexRef.current = null;
    dragOverIndexRef.current = null;
    onReorder(newItems.map(i => i.id));
  };

  return (
    <>
      {items.map((item, index) => {
        const isDragging = dragSourceIndexRef.current === index;
        const isOver = dragOverIndexRef.current === index;
        const handlers = {
          onDragStart: () => handleDragStart(index),
          onDragOver: (e: React.DragEvent) => handleDragOver(e, index),
          onDrop: handleDrop,
        };
        return renderItem(item, index, isDragging, isOver, handlers);
      })}
    </>
  );
};

export const UnitGuideAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'staff' | 'steps'>('rooms');
  const [rooms, setRooms] = useState<UnitRoom[]>([]);
  const [staffList, setStaffList] = useState<UnitStaff[]>([]);
  const [steps, setSteps] = useState<ArrivalStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Room form
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<UnitRoom | null>(null);
  const [roomForm, setRoomForm] = useState(emptyRoom);

  // Staff form
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<UnitStaff | null>(null);
  const [staffForm, setStaffForm] = useState(emptyStaff);

  // Step form
  const [showStepForm, setShowStepForm] = useState(false);
  const [editingStep, setEditingStep] = useState<ArrivalStep | null>(null);
  const [stepForm, setStepForm] = useState<Partial<ArrivalStep>>(emptyStep);

  useEffect(() => {
    if (activeTab === 'rooms') loadRooms();
    else if (activeTab === 'staff') loadStaff();
    else loadSteps();
  }, [activeTab]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const res = await api.get('/unit-guide/rooms');
      setRooms((res.data.data || res.data || []).sort((a: UnitRoom, b: UnitRoom) => a.sortOrder - b.sortOrder));
    } catch { setError('Не вдалося завантажити приміщення'); }
    finally { setLoading(false); }
  };

  const loadStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/unit-guide/staff');
      setStaffList((res.data.data || res.data || []).sort((a: UnitStaff, b: UnitStaff) => a.sortOrder - b.sortOrder));
    } catch { setError('Не вдалося завантажити персонал'); }
    finally { setLoading(false); }
  };

  const loadSteps = async () => {
    try {
      setLoading(true);
      const res = await api.get('/unit-guide/steps');
      setSteps((res.data.data || res.data || []).sort((a: ArrivalStep, b: ArrivalStep) => a.sortOrder - b.sortOrder));
    } catch { setError('Не вдалося завантажити кроки'); }
    finally { setLoading(false); }
  };

  const handleReorder = async (type: 'rooms' | 'staff' | 'steps', ids: string[]) => {
    try {
      await api.put(`/unit-guide/${type}/reorder`, { ids });
      setSuccess('Порядок оновлено');
      if (type === 'rooms') loadRooms();
      else if (type === 'staff') loadStaff();
      else loadSteps();
    } catch (err: any) {
      console.error('Reorder error:', err);
      setError(err.response?.data?.error || err.message || 'Не вдалося змінити порядок');
    }
  };

  // ===== ROOM CRUD =====

  const openRoomForm = (room?: UnitRoom) => {
    if (room) {
      setEditingRoom(room);
      setRoomForm({ name: room.name, description: room.description || '', icon: room.icon || '🏢', category: room.category, floor: room.floor, roomNumber: room.roomNumber || '', phone: room.phone || '', isActive: room.isActive });
    } else {
      setEditingRoom(null);
      setRoomForm(emptyRoom);
    }
    setShowRoomForm(true);
    setError(''); setSuccess('');
  };

  const saveRoom = async () => {
    if (!roomForm.name.trim()) { setError('Назва обовʼязкова'); return; }
    try {
      setLoading(true);
      if (editingRoom) {
        await api.put(`/unit-guide/rooms/${editingRoom.id}`, roomForm);
        setSuccess('Приміщення оновлено');
      } else {
        await api.post('/unit-guide/rooms', roomForm);
        setSuccess('Приміщення додано');
      }
      setShowRoomForm(false);
      loadRooms();
    } catch (err: any) { setError(err.response?.data?.error || 'Помилка збереження'); }
    finally { setLoading(false); }
  };

  const deleteRoom = async (id: string) => {
    if (!confirm('Видалити це приміщення?')) return;
    try {
      await api.delete(`/unit-guide/rooms/${id}`);
      setSuccess('Приміщення видалено');
      loadRooms();
    } catch { setError('Не вдалося видалити'); }
  };

  // ===== STAFF CRUD =====

  const openStaffForm = (person?: UnitStaff) => {
    if (person) {
      setEditingStaff(person);
      setStaffForm({ rank: person.rank, fullName: person.fullName, position: person.position, icon: person.icon || '👤', room: person.room || '', floor: person.floor, phone: person.phone || '', description: person.description || '', isActive: person.isActive });
    } else {
      setEditingStaff(null);
      setStaffForm(emptyStaff);
    }
    setShowStaffForm(true);
    setError(''); setSuccess('');
  };

  const saveStaff = async () => {
    if (!staffForm.fullName.trim() || !staffForm.rank.trim()) { setError("Звання та ПІБ обов'язкові"); return; }
    try {
      setLoading(true);
      if (editingStaff) {
        await api.put(`/unit-guide/staff/${editingStaff.id}`, staffForm);
        setSuccess('Співробітника оновлено');
      } else {
        await api.post('/unit-guide/staff', staffForm);
        setSuccess('Співробітника додано');
      }
      setShowStaffForm(false);
      loadStaff();
    } catch (err: any) { setError(err.response?.data?.error || 'Помилка збереження'); }
    finally { setLoading(false); }
  };

  const deleteStaff = async (id: string) => {
    if (!confirm('Видалити цього співробітника?')) return;
    try {
      await api.delete(`/unit-guide/staff/${id}`);
      setSuccess('Співробітника видалено');
      loadStaff();
    } catch { setError('Не вдалося видалити'); }
  };

  // ===== STEPS CRUD =====

  const openStepForm = (step?: ArrivalStep) => {
    if (step) {
      setEditingStep(step);
      setStepForm({ title: step.title, description: step.description, icon: step.icon || '📝', isActive: step.isActive });
    } else {
      setEditingStep(null);
      setStepForm(emptyStep);
    }
    setShowStepForm(true);
    setError(''); setSuccess('');
  };

  const saveStep = async () => {
    if (!(stepForm.title || '').trim()) { setError('Назва обовʼязкова'); return; }
    try {
      setLoading(true);
      if (editingStep) {
        await api.put(`/unit-guide/steps/${editingStep.id}`, stepForm);
        setSuccess('Крок оновлено');
      } else {
        await api.post('/unit-guide/steps', stepForm);
        setSuccess('Крок додано');
      }
      setShowStepForm(false);
      loadSteps();
    } catch (err: any) { setError(err.response?.data?.error || 'Помилка збереження'); }
    finally { setLoading(false); }
  };

  const deleteStep = async (id: string) => {
    if (!confirm('Видалити цей крок?')) return;
    try {
      await api.delete(`/unit-guide/steps/${id}`);
      setSuccess('Крок видалено');
      loadSteps();
    } catch { setError('Не вдалося видалити'); }
  };

  const tabs = [
    { id: 'rooms' as const, label: 'Приміщення', icon: '🏢', count: rooms.length },
    { id: 'staff' as const, label: 'Персонал', icon: '👥', count: staffList.length },
    { id: 'steps' as const, label: 'Прибуття', icon: '📝', count: steps.length },
  ];

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
        <h1 className="text-3xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px', lineHeight: '1.2', letterSpacing: '1px' }}>
          ⚙️ Управління довідником
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>
          Додавання, редагування, видалення та сортування перетягуванням
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-5 rounded-2xl border animate-slide-down" style={{ background: 'var(--ab3-red-glow)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
          <div className="flex items-center gap-3"><span className="text-xl">⚠️</span><span style={{ fontSize: '15px', lineHeight: '1.5' }}>{error}</span></div>
        </div>
      )}
      {success && (
        <div className="mb-6 p-5 rounded-2xl border animate-slide-down" style={{ background: 'var(--ab3-green-glow)', borderColor: 'rgba(34, 197, 94, 0.3)', color: '#4ade80' }}>
          <div className="flex items-center gap-3"><span className="text-xl">✅</span><span style={{ fontSize: '15px', lineHeight: '1.5' }}>{success}</span></div>
        </div>
      )}

      {/* Tabs */}
      <div className="p-3 rounded-2xl mb-8" style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setShowRoomForm(false); setShowStaffForm(false); setShowStepForm(false); }}
              className="btn" style={{
                background: activeTab === tab.id ? 'var(--gradient-gold)' : 'transparent',
                color: activeTab === tab.id ? 'var(--ab3-black)' : 'var(--text-muted)',
                border: `1px solid ${activeTab === tab.id ? 'var(--ab3-gold)' : 'var(--border-subtle)'}`,
                padding: '10px 18px', fontSize: '13px',
              }}>
              {tab.icon} {tab.label} <span className="ml-1 text-xs opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ===== ROOMS ===== */}
      {activeTab === 'rooms' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-heading font-bold" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>🏢 Приміщення</h2>
            <button onClick={() => openRoomForm()} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>➕ Додати</button>
          </div>

          {/* Room Form */}
          {showRoomForm && (
            <div className="p-6 rounded-2xl mb-8 animate-fade-in-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>{editingRoom ? '✏️ Редагування' : '➕ Нове приміщення'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Назва *</label>
                  <input className="input" value={roomForm.name} onChange={e => setRoomForm({ ...roomForm, name: e.target.value })} placeholder="Кабінет командира" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Іконка</label>
                  <input className="input" value={roomForm.icon} onChange={e => setRoomForm({ ...roomForm, icon: e.target.value })} placeholder="🏢" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Категорія</label>
                  <select className="input" value={roomForm.category} onChange={e => setRoomForm({ ...roomForm, category: e.target.value })}>
                    {categories.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Поверх</label>
                  <input type="number" className="input" value={roomForm.floor || ''} onChange={e => setRoomForm({ ...roomForm, floor: parseInt(e.target.value) || 0 })} min="0" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Номер кімнати</label>
                  <input className="input" value={roomForm.roomNumber} onChange={e => setRoomForm({ ...roomForm, roomNumber: e.target.value })} placeholder="201" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Телефон</label>
                  <input className="input" value={roomForm.phone} onChange={e => setRoomForm({ ...roomForm, phone: e.target.value })} placeholder="вн. 101" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Опис</label>
                <textarea className="input" rows={3} value={roomForm.description} onChange={e => setRoomForm({ ...roomForm, description: e.target.value })} placeholder="Опис..." />
              </div>
              <div className="flex gap-3">
                <button onClick={saveRoom} disabled={loading} className="btn btn-primary disabled:opacity-50" style={{ padding: '12px 24px', fontSize: '14px' }}>{loading ? '⏳...' : '💾 Зберегти'}</button>
                <button onClick={() => setShowRoomForm(false)} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '12px 24px', fontSize: '14px' }}>Скасувати</button>
              </div>
            </div>
          )}

          {/* Rooms List with Drag & Drop */}
          {loading && !showRoomForm ? (
            <div className="p-16 text-center rounded-2xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
              <svg className="animate-spin w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/></svg>
              <p style={{ color: 'var(--text-muted)' }}>Завантаження...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <DraggableList items={rooms} onReorder={(ids) => handleReorder('rooms', ids)}
                renderItem={(room, _index, isDragging, isOver, h) => {
                  const cat = categories.find(c => c.value === (room as UnitRoom).category);
                  return (
                    <div
                      key={(room as UnitRoom).id}
                      draggable
                      onDragStart={h.onDragStart}
                      onDragOver={h.onDragOver}
                      onDrop={h.onDrop}
                      className="military-card p-4 flex items-center gap-4 group transition-all duration-300"
                      style={{
                        borderLeft: `4px solid ${cat?.color || '#6b7280'}`,
                        cursor: 'grab',
                        opacity: isDragging ? 0.4 : 1,
                        transform: isOver ? 'translateY(8px)' : 'none',
                        boxShadow: isOver ? '0 -4px 0 0 var(--ab3-gold)' : 'none',
                      }}
                    >
                      <div className="flex-shrink-0">{dragIcon}</div>
                      <span className="text-2xl flex-shrink-0">{(room as UnitRoom).icon || '🏢'}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate" style={{ color: 'var(--text-primary)', fontSize: '15px' }}>{(room as UnitRoom).name}</h3>
                        {(room as UnitRoom).roomNumber && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>🚪 {(room as UnitRoom).roomNumber} | Поверх: {((room as UnitRoom).floor || 0) + 1}</p>}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => openRoomForm(room as UnitRoom)} className="btn" style={{ background: 'var(--ab3-gold-glow)', border: '1px solid rgba(201,162,39,0.3)', color: 'var(--ab3-gold)', padding: '6px 12px', fontSize: '11px' }}>✏️</button>
                        <button onClick={() => deleteRoom((room as UnitRoom).id)} className="btn" style={{ background: 'var(--ab3-red-glow)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '6px 12px', fontSize: '11px' }}>🗑</button>
                      </div>
                    </div>
                  );
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ===== STAFF ===== */}
      {activeTab === 'staff' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-heading font-bold" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>👥 Персонал</h2>
            <button onClick={() => openStaffForm()} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>➕ Додати</button>
          </div>

          {showStaffForm && (
            <div className="p-6 rounded-2xl mb-8 animate-fade-in-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>{editingStaff ? '✏️ Редагування' : '➕ Новий співробітник'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Звання *</label><input className="input" value={staffForm.rank} onChange={e => setStaffForm({ ...staffForm, rank: e.target.value })} placeholder="Полковник" /></div>
                <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>ПІБ *</label><input className="input" value={staffForm.fullName} onChange={e => setStaffForm({ ...staffForm, fullName: e.target.value })} placeholder="Коваленко О.В." /></div>
                <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Посада</label><input className="input" value={staffForm.position} onChange={e => setStaffForm({ ...staffForm, position: e.target.value })} placeholder="Командир частини" /></div>
                <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Іконка</label><input className="input" value={staffForm.icon} onChange={e => setStaffForm({ ...staffForm, icon: e.target.value })} placeholder="⭐" /></div>
                <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Кабінет</label><input className="input" value={staffForm.room} onChange={e => setStaffForm({ ...staffForm, room: e.target.value })} placeholder="201" /></div>
                <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Поверх</label><input type="number" className="input" value={staffForm.floor || ''} onChange={e => setStaffForm({ ...staffForm, floor: parseInt(e.target.value) || 0 })} min="0" /></div>
                <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Телефон</label><input className="input" value={staffForm.phone} onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })} placeholder="вн. 101" /></div>
              </div>
              <div className="mb-4"><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Опис</label><textarea className="input" rows={3} value={staffForm.description} onChange={e => setStaffForm({ ...staffForm, description: e.target.value })} placeholder="Додаткова інформація..." /></div>
              <div className="flex gap-3">
                <button onClick={saveStaff} disabled={loading} className="btn btn-primary disabled:opacity-50" style={{ padding: '12px 24px', fontSize: '14px' }}>{loading ? '⏳...' : '💾 Зберегти'}</button>
                <button onClick={() => setShowStaffForm(false)} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '12px 24px', fontSize: '14px' }}>Скасувати</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <DraggableList items={staffList} onReorder={(ids) => handleReorder('staff', ids)}
              renderItem={(person, _index, isDragging, isOver, h) => (
                <div
                  key={(person as UnitStaff).id}
                  draggable
                  onDragStart={h.onDragStart}
                  onDragOver={h.onDragOver}
                  onDrop={h.onDrop}
                  className="military-card p-4 flex items-center gap-4 group transition-all duration-300"
                  style={{
                    cursor: 'grab',
                    opacity: isDragging ? 0.4 : 1,
                    transform: isOver ? 'translateY(8px)' : 'none',
                    boxShadow: isOver ? '0 -4px 0 0 var(--ab3-gold)' : 'none',
                  }}
                >
                  <div className="flex-shrink-0">{dragIcon}</div>
                  <span className="text-2xl flex-shrink-0">{(person as UnitStaff).icon || '👤'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge badge-gold" style={{ fontSize: '10px' }}>{(person as UnitStaff).rank}</span>
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)', fontSize: '15px' }}>{(person as UnitStaff).fullName}</h3>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{(person as UnitStaff).position} {((person as UnitStaff).room && ((person as UnitStaff).room !== '—')) ? `| Каб. ${(person as UnitStaff).room}` : ''}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openStaffForm(person as UnitStaff)} className="btn" style={{ background: 'var(--ab3-gold-glow)', border: '1px solid rgba(201,162,39,0.3)', color: 'var(--ab3-gold)', padding: '6px 12px', fontSize: '11px' }}>✏️</button>
                    <button onClick={() => deleteStaff((person as UnitStaff).id)} className="btn" style={{ background: 'var(--ab3-red-glow)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '6px 12px', fontSize: '11px' }}>🗑</button>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      )}

      {/* ===== STEPS ===== */}
      {activeTab === 'steps' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-heading font-bold" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>📝 Кроки прибуття</h2>
            <button onClick={() => openStepForm()} className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>➕ Додати крок</button>
          </div>

          {showStepForm && (
            <div className="p-6 rounded-2xl mb-8 animate-fade-in-up" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}>
              <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>{editingStep ? '✏️ Редагування кроку' : '➕ Новий крок'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Назва *</label><input className="input" value={stepForm.title} onChange={e => setStepForm({ ...stepForm, title: e.target.value })} placeholder="Реєстрація" /></div>
                <div><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Іконка</label><input className="input" value={stepForm.icon} onChange={e => setStepForm({ ...stepForm, icon: e.target.value })} placeholder="📝" /></div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Номер кроку</label>
                  <select className="input" value={editingStep ? editingStep.sortOrder : steps.length} onChange={e => setStepForm({ ...stepForm, sortOrder: parseInt(e.target.value) })}>
                    {Array.from({ length: steps.length + 1 }, (_, i) => (
                      <option key={i} value={i}>Крок {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mb-4"><label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Опис</label><textarea className="input" rows={4} value={stepForm.description} onChange={e => setStepForm({ ...stepForm, description: e.target.value })} placeholder="Детальний опис кроку..." /></div>
              <div className="flex gap-3">
                <button onClick={saveStep} disabled={loading} className="btn btn-primary disabled:opacity-50" style={{ padding: '12px 24px', fontSize: '14px' }}>{loading ? '⏳...' : '💾 Зберегти'}</button>
                <button onClick={() => setShowStepForm(false)} className="btn" style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '12px 24px', fontSize: '14px' }}>Скасувати</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <DraggableList items={steps} onReorder={(ids) => handleReorder('steps', ids)}
              renderItem={(step, index, isDragging, isOver, h) => (
                <div
                  key={(step as ArrivalStep).id}
                  draggable
                  onDragStart={h.onDragStart}
                  onDragOver={h.onDragOver}
                  onDrop={h.onDrop}
                  className="military-card p-5 flex items-center gap-5 transition-all duration-300"
                  style={{
                    cursor: 'grab',
                    opacity: isDragging ? 0.4 : 1,
                    transform: isOver ? 'translateY(8px)' : 'none',
                    boxShadow: isOver ? '0 -4px 0 0 var(--ab3-gold)' : 'none',
                  }}
                >
                  <div className="flex-shrink-0">{dragIcon}</div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 font-heading font-black text-lg" style={{ background: 'var(--gradient-gold)', color: 'var(--ab3-black)' }}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xl">{(step as ArrivalStep).icon || '📝'}</span>
                      <h3 className="font-bold" style={{ color: 'var(--text-primary)', fontSize: '16px' }}>{(step as ArrivalStep).title}</h3>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>{(step as ArrivalStep).description}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openStepForm(step as ArrivalStep)} className="btn" style={{ background: 'var(--ab3-gold-glow)', border: '1px solid rgba(201,162,39,0.3)', color: 'var(--ab3-gold)', padding: '6px 12px', fontSize: '11px' }}>✏️</button>
                    <button onClick={() => deleteStep((step as ArrivalStep).id)} className="btn" style={{ background: 'var(--ab3-red-glow)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '6px 12px', fontSize: '11px' }}>🗑</button>
                  </div>
                </div>
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
};
