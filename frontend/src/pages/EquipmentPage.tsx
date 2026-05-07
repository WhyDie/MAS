import React, { useState, useEffect } from 'react';
import { api } from '@services/api';

interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  weight: number;
  type: 'issued' | 'personal' | 'recommended';
  cost?: number;
  isActive: boolean;
}

const categoryIcons: Record<string, string> = {
  'Броня': '🛡️', 'Головний убір': '🪖', 'Одяг': '🧥', 'Зброя': '⚔️',
  'Аксесуари': '🥽', 'Рюкзак': '🎒', 'Медикаменти': '💊', 'Електроніка': '📻'
};

const categories = ['Броня', 'Головний убір', 'Одяг', 'Зброя', 'Аксесуари', 'Рюкзак', 'Медикаменти', 'Електроніка'];

export const EquipmentPage: React.FC = () => {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'requisition' | 'norms'>('inventory');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const [newEquipment, setNewEquipment] = useState({
    name: '', category: '', weight: '', type: 'personal' as 'issued' | 'personal' | 'recommended', cost: '',
  });

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const res = await api.get('/equipment');
      setEquipment(res.data.data || res.data || []);
    } catch (err) {
      console.error('Failed to load equipment:', err);
    }
  };

  const addEquipment = async () => {
    if (newEquipment.name && newEquipment.category) {
      try {
        const payload = {
          ...newEquipment,
          weight: parseFloat(newEquipment.weight) || 0,
          cost: parseFloat(newEquipment.cost) || 0,
          isActive: true,
        };
        await api.post('/equipment', payload);
        setNewEquipment({ name: '', category: '', weight: '', type: 'personal', cost: '' });
        loadEquipment();
        setActiveTab('inventory');
      } catch (err) {
        console.error('Failed to add equipment:', err);
      }
    }
  };

  const removeEquipment = async (id: string) => {
    try {
      await api.delete(`/equipment/${id}`);
      loadEquipment();
    } catch (err) {
      console.error('Failed to remove equipment:', err);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'issued': return <span className="badge badge-blue">На озброєнні</span>;
      case 'personal': return <span className="badge badge-success">Особисте</span>;
      case 'recommended': return <span className="badge badge-warning">Рекомендовано</span>;
      default: return null;
    }
  };

  const totalWeight = equipment.reduce((sum, item) => sum + (item.weight || 0), 0);
  const maxWeight = 30; // Максимально рекомендована вага
  const weightPercent = Math.min((totalWeight / maxWeight) * 100, 100);
  const weightColor = totalWeight > 35 ? 'var(--ab3-red)' : totalWeight > 25 ? 'var(--ab3-amber)' : 'var(--ab3-green)';

  const filteredEquipment = selectedCategory === 'all' 
    ? equipment 
    : equipment.filter(item => item.category === selectedCategory);

  const tabs = [
    { id: 'inventory' as const, label: 'Мій інвентар', icon: '🎒' },
    { id: 'requisition' as const, label: 'Отримання майна', icon: '📥' },
    { id: 'norms' as const, label: 'Нормозабезпечення', icon: '📋' },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-black uppercase tracking-widest mb-3 glitch-hover cursor-default transition-all duration-300" style={{ color: 'var(--text-primary)', fontSize: '32px', lineHeight: '1.2' }}>
          ЕКІПІРУВАННЯ ТА ЛОГІСТИКА
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
          // ОБЛІК МАЙНА, ОЗБРОЄННЯ ТА ОСОБИСТИХ РЕЧЕЙ //
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="p-6 rounded-none bg-[#0a0a0a] border border-[#333] border-l-4" style={{ borderLeftColor: weightColor }}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm mb-1 uppercase tracking-widest font-mono text-gray-500">Загальна вага</p>
              <p className="text-3xl font-heading font-black" style={{ color: weightColor }}>{totalWeight.toFixed(1)} <span className="text-lg">кг</span></p>
            </div>
            <span className="text-3xl">⚖️</span>
          </div>
          <div className="w-full h-2 bg-[#222] mt-4 mb-2">
            <div className="h-full transition-all duration-1000" style={{ background: weightColor, width: `${weightPercent}%` }} />
          </div>
          <p className="text-xs font-mono text-gray-500 text-right">Максимум: 30 кг</p>
        </div>

        <div className="p-6 rounded-none bg-[#0a0a0a] border border-[#333] border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm mb-1 uppercase tracking-widest font-mono text-gray-500">Казенне майно</p>
              <p className="text-3xl font-heading font-black text-blue-500">{equipment.filter((e) => e.type === 'issued').length} <span className="text-lg">од.</span></p>
            </div>
            <span className="text-3xl">🛡️</span>
          </div>
          <p className="text-xs font-mono text-gray-500 mt-6">Підлягає здачі при звільненні</p>
        </div>

        <div className="p-6 rounded-none bg-[#0a0a0a] border border-[#333] border-l-4 border-l-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm mb-1 uppercase tracking-widest font-mono text-gray-500">Особисті речі</p>
              <p className="text-3xl font-heading font-black text-green-500">{equipment.filter((e) => e.type === 'personal').length} <span className="text-lg">од.</span></p>
            </div>
            <span className="text-3xl">🎒</span>
          </div>
          <p className="text-xs font-mono text-gray-500 mt-6">Власне екіпірування</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-3 rounded-none mb-8 bg-[#0a0a0a] border border-[#333] animate-fade-in-up">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="btn w-full flex items-center justify-center text-center font-bold uppercase tracking-widest"
              style={{
                background: activeTab === tab.id ? 'var(--gradient-gold)' : 'transparent',
                color: activeTab === tab.id ? 'var(--ab3-black)' : 'var(--text-muted)',
                border: `1px solid ${activeTab === tab.id ? 'var(--ab3-gold)' : '#333'}`,
                padding: '10px 18px',
                fontSize: '12px',
              }}
            >
              <span className="mr-2">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* === INVENTORY TAB === */}
      {activeTab === 'inventory' && (
        <div className="animate-fade-in-up">
          {/* Category Filter */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-6">
            <button
              onClick={() => setSelectedCategory('all')}
              className="btn w-full flex items-center justify-center text-center uppercase tracking-widest font-bold"
              style={{ background: selectedCategory === 'all' ? '#222' : 'transparent', color: selectedCategory === 'all' ? '#fff' : 'var(--text-muted)', border: `1px solid ${selectedCategory === 'all' ? '#555' : '#333'}`, padding: '6px 12px', fontSize: '11px' }}
            >
              Усі категорії
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="btn w-full flex items-center justify-center text-center uppercase tracking-widest font-bold"
                style={{ background: selectedCategory === cat ? '#222' : 'transparent', color: selectedCategory === cat ? '#fff' : 'var(--text-muted)', border: `1px solid ${selectedCategory === cat ? '#555' : '#333'}`, padding: '6px 12px', fontSize: '11px' }}
              >
                {categoryIcons[cat] || '📦'} {cat}
              </button>
            ))}
          </div>

          {filteredEquipment.length === 0 ? (
            <div className="p-16 text-center rounded-none bg-[#0a0a0a] border border-[#333]">
              <div className="text-6xl mb-4">🪹</div>
              <h3 className="text-xl font-heading font-bold mb-3 text-white">Інвентар порожній</h3>
              <p className="text-gray-400">Додайте екіпірування через вкладку "Отримання майна"</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEquipment.map((item, i) => (
                <div key={item.id} className="military-card h-full p-5 bg-[#0a0a0a] border border-[#333] transition-all hover:border-[var(--ab3-gold)] flex flex-col justify-between" style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both' }}>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-[#111] border border-[#333] flex items-center justify-center text-2xl">
                        {categoryIcons[item.category] || '📦'}
                      </div>
                      {getTypeBadge(item.type)}
                    </div>
                    <h3 className="font-heading font-bold text-lg text-white mb-1 uppercase tracking-wider">{item.name}</h3>
                    <p className="text-xs font-mono text-gray-500 mb-4">{item.category}</p>
                  </div>
                  
                  <div className="mt-auto w-full flex justify-between items-center pt-4 border-t border-[#222]">
                    <div className="font-mono text-sm text-[var(--ab3-gold)] font-bold">
                      ⚖️ {item.weight} кг
                    </div>
                    <button
                      onClick={() => removeEquipment(item.id)}
                      className="btn hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50"
                      style={{ background: 'transparent', border: '1px solid #333', color: 'var(--text-muted)', padding: '6px 12px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}
                    >
                      Списати
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === REQUISITION TAB === */}
      {activeTab === 'requisition' && (
        <div className="p-8 rounded-none animate-fade-in-up bg-[#0a0a0a] border border-[#333] max-w-4xl">
          <div className="flex items-center gap-4 mb-8 pb-4 border-b border-[#333]">
            <span className="text-4xl">📝</span>
            <div>
              <h2 className="text-xl font-heading font-black uppercase tracking-widest text-white">Рапорт на отримання майна</h2>
              <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-1">Форма №4-ЕК / Внесення до електронного реєстру</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest mb-2 text-gray-400">Номенклатурна назва *</label>
                <input
                  type="text"
                  placeholder="Напр.: Шолом балістичний FAST"
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment({ ...newEquipment, name: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest mb-2 text-gray-400">Категорія постачання *</label>
                <select
                  value={newEquipment.category}
                  onChange={(e) => setNewEquipment({ ...newEquipment, category: e.target.value })}
                  className="input w-full"
                >
                  <option value="">-- Виберіть категорію --</option>
                  {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest mb-2 text-gray-400">Вага (кг) *</label>
                <input
                  type="number"
                  placeholder="0.0"
                  value={newEquipment.weight}
                  onChange={(e) => setNewEquipment({ ...newEquipment, weight: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest mb-2 text-gray-400">Власність *</label>
                <select
                  value={newEquipment.type}
                  onChange={(e) => setNewEquipment({ ...newEquipment, type: e.target.value as any })}
                  className="input w-full"
                >
                  <option value="issued">Державне (Казенне)</option>
                  <option value="personal">Особисте (Волонтерське)</option>
                  <option value="recommended">Рекомендоване командиром</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest mb-2 text-gray-400">Балансова вартість (₴)</label>
                <input
                  type="number"
                  placeholder="За наявності"
                  value={newEquipment.cost}
                  onChange={(e) => setNewEquipment({ ...newEquipment, cost: e.target.value })}
                  className="input w-full"
                />
              </div>
            </div>
            
            <div className="pt-6 border-t border-[#222]">
              <button onClick={addEquipment} className="btn btn-primary w-full md:w-auto uppercase tracking-widest font-bold" style={{ padding: '14px 32px' }}>
                Внести до реєстру
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === NORMS TAB === */}
      {activeTab === 'norms' && (
        <div className="animate-fade-in-up">
          <div className="p-6 bg-[#0a0a0a] border border-[#333] mb-6">
            <h2 className="text-xl font-heading font-black uppercase tracking-widest mb-2 text-white">Бойовий комплект (Норма №1)</h2>
            <p className="text-sm text-gray-400 font-mono mb-6">Мінімальний обов'язковий перелік майна військовослужбовця перед виходом на БЗ.</p>
            
            <div className="space-y-3">
              {[
                { name: 'Шолом балістичний', cat: 'Головний убір', req: 1 },
                { name: 'Бронежилет (плитоноска)', cat: 'Броня', req: 1 },
                { name: 'Аптечка IFAK', cat: 'Медикаменти', req: 1 },
                { name: 'Турнікет кровоспинний', cat: 'Медикаменти', req: 2 },
                { name: 'Автомат', cat: 'Зброя', req: 1 },
              ].map((norm, i) => {
                const count = equipment.filter(e => e.category === norm.cat).length;
                const isReady = count >= norm.req;
                return (
                  <div key={i} className="flex items-center justify-between p-4 bg-[#111] border border-[#222]">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${isReady ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`} />
                      <span className="font-bold text-gray-200">{norm.name}</span>
                    </div>
                    <div className="font-mono text-sm">
                      <span className={isReady ? 'text-green-500' : 'text-red-500'}>{count}</span>
                      <span className="text-gray-600"> / {norm.req} од.</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          <div className="p-6 rounded-none animate-fade-in-up bg-[#0a0a0a] border border-[#333] border-l-4 border-[#22c55e]">
            <h3 className="text-xl font-heading font-black uppercase tracking-widest mb-4" style={{ color: '#22c55e', fontSize: '20px' }}>
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
      )}
    </div>
  );
};
