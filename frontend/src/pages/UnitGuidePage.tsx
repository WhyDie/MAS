import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@services/api';
import { useAuthStore } from '@stores/index';

interface UnitRoom {
  id: string; name: string; description?: string; icon?: string; category: string; floor?: number; roomNumber?: string; phone?: string; isActive: boolean; sortOrder: number;
}
interface UnitStaff {
  id: string; rank: string; fullName: string; position: string; icon?: string; room?: string; floor?: number; phone?: string; isActive: boolean; sortOrder: number;
}
interface ArrivalStep {
  id: string; title: string; description: string; icon?: string; sortOrder: number; isActive: boolean;
}

const categories = [
  { id: 'all' as const, label: 'Все', icon: '🏢' },
  { id: 'command' as const, label: 'Командування', icon: '⭐' },
  { id: 'support' as const, label: 'Забезпечення', icon: '📋' },
  { id: 'living' as const, label: 'Побут', icon: '🏠' },
  { id: 'food' as const, label: 'Харчування', icon: '🍽️' },
  { id: 'training' as const, label: 'Навчання', icon: '📚' },
  { id: 'storage' as const, label: 'Склади', icon: '📦' },
];

export const UnitGuidePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'rooms' | 'staff' | 'arrival'>('rooms');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [rooms, setRooms] = useState<UnitRoom[]>([]);
  const [staffList, setStaffList] = useState<UnitStaff[]>([]);
  const [arrivalSteps, setArrivalSteps] = useState<ArrivalStep[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'rooms') loadRooms();
    else if (activeTab === 'staff') loadStaff();
    else loadSteps();
  }, [activeTab]);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const res = await api.get('/unit-guide/rooms');
      setRooms(res.data.data || res.data || []);
    } catch { /* use empty */ }
    finally { setLoading(false); }
  };

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get('/unit-guide/staff');
      setStaffList(res.data.data || res.data || []);
    } catch { /* use empty */ }
    finally { setLoading(false); }
  };

  const loadSteps = async () => {
    setLoading(true);
    try {
      const res = await api.get('/unit-guide/steps');
      setArrivalSteps(res.data.data || res.data || []);
    } catch { /* use empty */ }
    finally { setLoading(false); }
  };

  const filteredRooms = selectedCategory === 'all' ? rooms : rooms.filter(r => r.category === selectedCategory);

  const canManage = user?.role === 'commander' || user?.role === 'admin' || user?.role === 'superadmin';

  const tabs = [
    { id: 'rooms' as const, label: 'Приміщення', icon: '🏢' },
    { id: 'staff' as const, label: 'Командування', icon: '👥' },
    { id: 'arrival' as const, label: 'Прибуття до частини', icon: '📝' },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px', lineHeight: '1.2', letterSpacing: '1px' }}>
          🏢 Довідник по частині
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>
          Де що знаходиться, хто за що відповідає, як діяти коли ви прибули
        </p>
      </div>

      {/* Tabs */}
      <div
        className="p-3 rounded-2xl mb-8 animate-fade-in-up"
        style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', animationDelay: '0.1s', animationFillMode: 'both' }}
      >
        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
          {canManage && (
            <button
              onClick={() => navigate('/unit-guide-admin')}
              className="btn"
              style={{
                background: 'var(--ab3-gold-glow)',
                border: '1px solid rgba(201, 162, 39, 0.3)',
                color: 'var(--ab3-gold)',
                padding: '10px 18px',
                fontSize: '13px',
              }}
            >
              ⚙️ Управління
            </button>
          )}
        </div>
      </div>
      {activeTab === 'rooms' && (
        <div className="animate-fade-in-up">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="btn"
                style={{
                  background: selectedCategory === cat.id ? 'var(--gradient-gold)' : 'transparent',
                  color: selectedCategory === cat.id ? 'var(--ab3-black)' : 'var(--text-muted)',
                  border: `1px solid ${selectedCategory === cat.id ? 'var(--ab3-gold)' : 'var(--border-subtle)'}`,
                  padding: '8px 14px',
                  fontSize: '12px',
                }}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {/* Floor Legend */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 rounded-xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
            {[
              { floor: '0', label: '1 поверх (партер)' },
              { floor: '1', label: '2 поверх' },
              { floor: '2', label: '3 поверх' },
            ].map((f) => (
              <div key={f.floor} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ background: f.floor === '0' ? '#22c55e' : f.floor === '1' ? '#3b82f6' : '#f59e0b' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{f.label}</span>
              </div>
            ))}
          </div>

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room, index) => {
              const floorColors: Record<number, string> = { 0: '#22c55e', 1: '#3b82f6', 2: '#f59e0b' };
              const floorColor = room.floor !== undefined ? (floorColors[room.floor] || '#c9a227') : '#c9a227';
              return (
                <div
                  key={room.name}
                  className="military-card p-5 animate-fade-in-up"
                  style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'both', borderLeft: `4px solid ${floorColor}` }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl">{room.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-heading font-bold" style={{ color: 'var(--text-primary)', fontSize: '15px', lineHeight: '1.3' }}>
                        {room.name}
                      </h3>
                    </div>
                  </div>

                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.6' }}>
                    {room.description}
                  </p>

                  <div className="flex gap-3 text-xs" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    {room.floor !== undefined && room.floor >= 0 && (
                      <span>
                        🏢 Поверх: <strong style={{ color: floorColor }}>{room.floor === 0 ? '1' : room.floor + 1}</strong>
                      </span>
                    )}
                    {room.roomNumber && room.roomNumber !== '—' && (
                      <span>
                        🚪 Кімната: <strong style={{ color: 'var(--text-primary)' }}>{room.roomNumber}</strong>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <div className="animate-fade-in-up">
          <div className="overflow-x-auto rounded-2xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
            <table className="w-full">
              <thead>
                <tr>
                  {['', 'Звання', 'ПІБ', 'Посада', 'Кабінет', 'Поверх', 'Телефон'].map((h) => (
                    <th key={h} style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '14px 18px', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                    <svg className="animate-spin w-8 h-8 mx-auto mb-3" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/></svg>
                    Завантаження...
                  </td></tr>
                ) : staffList.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>Співробітників не додано</td></tr>
                ) : (
                  staffList.map((person) => (
                    <tr key={person.id} style={{ transition: 'background 0.25s ease' }}>
                      <td style={{ padding: '14px 18px' }}><span className="text-xl">{person.icon || '👤'}</span></td>
                      <td style={{ padding: '14px 18px' }}><span className="badge badge-gold" style={{ fontSize: '10px' }}>{person.rank}</span></td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-primary)', fontWeight: 600, fontSize: '14px' }}>{person.fullName}</td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontSize: '14px' }}>{person.position}</td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-primary)', fontWeight: 600, fontSize: '14px' }}>{person.room || '—'}</td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-secondary)', fontSize: '14px' }}>{person.floor !== undefined ? person.floor + 1 : '—'}</td>
                      <td style={{ padding: '14px 18px', color: 'var(--text-muted)', fontSize: '14px' }}>{person.phone || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Arrival Steps Tab */}
      {activeTab === 'arrival' && (
        <div className="animate-fade-in-up">
          <div
            className="p-6 rounded-2xl mb-6"
            style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)' }}
          >
            <h2 className="text-xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>
              📝 Порядок дій при прибутті до військової частини
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6' }}>
              Покроковий алгоритм дій для новоприбулого військовослужбовця. Зберігайте посвідчення, направлення та особисті документи при собі.
            </p>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="p-16 text-center rounded-2xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
                <svg className="animate-spin w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/></svg>
                <p style={{ color: 'var(--text-muted)' }}>Завантаження...</p>
              </div>
            ) : arrivalSteps.length === 0 ? (
              <div className="p-16 text-center rounded-2xl" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}>
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Кроків ще не додано</h3>
                <p style={{ color: 'var(--text-muted)' }}>Командир може додати кроки через панель управління</p>
              </div>
            ) : (
              arrivalSteps.map((step, index) => (
                <div
                  key={step.id}
                  className="military-card p-6 animate-fade-in-up"
                  style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
                >
                  <div className="flex items-start gap-5">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 font-heading font-black text-lg"
                      style={{ background: 'var(--gradient-gold)', color: 'var(--ab3-black)' }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl">{step.icon || '📝'}</span>
                        <h3 className="text-lg font-heading font-bold" style={{ color: 'var(--text-primary)', fontSize: '17px' }}>
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
