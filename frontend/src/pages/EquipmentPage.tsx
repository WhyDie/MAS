import React, { useState } from 'react';

interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  weight: number;
  type: 'issued' | 'personal' | 'recommended';
  cost?: number;
  isActive: boolean;
}

export const EquipmentPage: React.FC = () => {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([
    { id: '1', name: 'Бронежилет', category: 'Броня', weight: 6.5, type: 'issued', isActive: true },
    { id: '2', name: 'Шолом FAST MICH', category: 'Головний убір', weight: 1.2, type: 'issued', isActive: true },
    { id: '3', name: 'Термобілизна', category: 'Одяг', weight: 0.5, type: 'personal', cost: 45, isActive: true },
    { id: '4', name: 'Тактичні рукавички', category: 'Аксесуари', weight: 0.1, type: 'personal', cost: 25, isActive: true },
  ]);

  const [newEquipment, setNewEquipment] = useState({
    name: '', category: '', weight: '', type: 'personal' as 'issued' | 'personal' | 'recommended', cost: '',
  });

  const totalWeight = equipment.reduce((sum, item) => sum + (item.weight || 0), 0);

  const addEquipment = () => {
    if (newEquipment.name && newEquipment.category) {
      setEquipment([...equipment, {
        id: String(Date.now()), ...newEquipment,
        weight: parseFloat(newEquipment.weight) || 0,
        cost: parseFloat(newEquipment.cost) || 0, isActive: true,
      }]);
      setNewEquipment({ name: '', category: '', weight: '', type: 'personal', cost: '' });
    }
  };

  const removeEquipment = (id: string) => setEquipment(equipment.filter((item) => item.id !== id));

  const categories = ['Броня', 'Головний убір', 'Одяг', 'Зброя', 'Аксесуари', 'Рюкзак', 'Медикаменти', 'Електроніка'];

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'issued': return <span className="badge badge-blue">На озброєнні</span>;
      case 'personal': return <span className="badge badge-success">Особисте</span>;
      case 'recommended': return <span className="badge badge-warning">Рекомендовано</span>;
      default: return null;
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px', lineHeight: '1.2', letterSpacing: '1px' }}>
          🎒 Екіпірування та Логістика
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>
          Управління особистим та груповим інвентарем
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Загальна вага', value: `${totalWeight.toFixed(2)} кг`, icon: '⚖️', color: '#f59e0b', sub: 'Норма: 25-30 кг' },
          { label: 'На озброєнні', value: equipment.filter((e) => e.type === 'issued').length, icon: '🛡️', color: '#3b82f6' },
          { label: 'Особисті речі', value: equipment.filter((e) => e.type === 'personal').length, icon: '👤', color: '#22c55e' },
        ].map((stat, i) => (
          <div
            key={i}
            className="glass-card p-6 animate-scale-in"
            style={{ animationDelay: `${i * 0.1}s`, animationFillMode: 'both' }}
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">{stat.icon}</span>
              <div>
                <p className="text-sm mb-1" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{stat.label}</p>
                <p className="text-3xl font-heading font-black" style={{ color: stat.color, fontSize: '28px', lineHeight: '1.1' }}>{stat.value}</p>
                {stat.sub && <p className="text-xs mt-1" style={{ color: 'var(--text-faint)', fontSize: '12px' }}>{stat.sub}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Equipment Form */}
      <div
        className="p-6 rounded-2xl mb-8 animate-fade-in-up"
        style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', animationDelay: '0.3s', animationFillMode: 'both' }}
      >
        <h2 className="text-xl font-heading font-bold mb-6" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>
          ➕ Додати предмет
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {[
            { label: 'Назва', key: 'name', type: 'text', placeholder: 'Назва предмета' },
            { label: 'Вага (кг)', key: 'weight', type: 'number', placeholder: '0.0' },
            { label: 'Вартість (₴)', key: 'cost', type: 'number', placeholder: '0' },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{field.label}</label>
              <input
                type={field.type}
                placeholder={field.placeholder}
                value={(newEquipment as any)[field.key]}
                onChange={(e) => setNewEquipment({ ...newEquipment, [field.key]: e.target.value })}
                className="input"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Категорія</label>
            <select
              value={newEquipment.category}
              onChange={(e) => setNewEquipment({ ...newEquipment, category: e.target.value })}
              className="input"
            >
              <option value="">Виберіть категорію</option>
              {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Тип</label>
            <select
              value={newEquipment.type}
              onChange={(e) => setNewEquipment({ ...newEquipment, type: e.target.value as any })}
              className="input"
            >
              <option value="personal">Особисте</option>
              <option value="issued">На озброєнні</option>
              <option value="recommended">Рекомендовано</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={addEquipment} className="btn btn-success w-full" style={{ padding: '14px 20px', fontSize: '14px' }}>
              ✅ Додати предмет
            </button>
          </div>
        </div>
      </div>

      {/* Equipment Table */}
      <div
        className="rounded-2xl overflow-hidden animate-fade-in-up"
        style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', animationDelay: '0.35s', animationFillMode: 'both' }}
      >
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <h2 className="text-xl font-heading font-bold" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>
            📋 Список екіпірування
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Назва', 'Категорія', 'Вага', 'Вартість', 'Тип', 'Дії'].map((h) => (
                  <th key={h} style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '14px 18px', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {equipment.map((item) => (
                <tr key={item.id} style={{ transition: 'background 0.25s ease' }}>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '14px', padding: '14px 18px' }}>{item.name}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '14px 18px' }}>{item.category}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '14px 18px' }}>{item.weight ? `${item.weight} кг` : '-'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '14px 18px' }}>{item.cost ? `${item.cost} ₴` : '-'}</td>
                  <td style={{ padding: '14px 18px' }}>{getTypeBadge(item.type)}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <button
                      onClick={() => removeEquipment(item.id)}
                      className="btn"
                      style={{ background: 'var(--ab3-red-glow)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '8px 14px', fontSize: '12px' }}
                    >
                      🗑 Видалити
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations */}
      <div
        className="p-6 rounded-2xl mt-8 animate-fade-in-up"
        style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-subtle)', borderLeft: '4px solid #22c55e', animationDelay: '0.4s', animationFillMode: 'both' }}
      >
        <h3 className="text-xl font-heading font-bold mb-4" style={{ color: '#22c55e', fontSize: '20px' }}>
          💡 Рекомендації
        </h3>
        <ul className="space-y-3">
          {[
            { icon: '✅', text: 'Термобілизна — запобігає переохолодженню в польових умовах' },
            { icon: '✅', text: 'Тактичний ліхтар — незамінний в умовах обмеженої видимості' },
            { icon: '✅', text: 'Медичний набір — завжди майте при собі індивідуальну аптежку' },
            { icon: '💧', text: 'Вода — мінімум 2 літри на день для активного бойця' },
          ].map((rec, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{rec.icon}</span>
              <span style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.6' }}>{rec.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
