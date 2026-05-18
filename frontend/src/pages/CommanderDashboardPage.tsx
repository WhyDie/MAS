import React, { useState, useEffect } from 'react';
import { api } from '@services/api';
import { useAuthStore } from '@stores/index';

export const CommanderDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [unit, setUnit] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modal, setModal] = useState<{isOpen: boolean, title: string, message: string, onConfirm?: () => void} | null>(null);
  const [activeTab, setActiveTab] = useState<'personnel' | 'duties' | 'works'>('personnel');
  
  // Duty Management
  const [duties, setDuties] = useState<any[]>([]);
  const [dutyForm, setDutyForm] = useState({ title: '', taskType: '', timeRange: '', assignedUserIds: [] as string[] });
  const [passportModal, setPassportModal] = useState<any>(null); // For detailed user view
  const [statusModal, setStatusModal] = useState<{ id: string, name: string, status: string } | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const uRes = await api.get('/units/my');
        const myUnit = uRes.data?.data;
        if (myUnit) {
          setUnit(myUnit);
          const [mRes, aRes, dRes] = await Promise.all([
            api.get(`/units/${myUnit.id}/members`),
            api.get(`/units/${myUnit.id}/analytics`),
            api.get(`/units/${myUnit.id}/duties`)
          ]);
          setMembers(mRes.data?.data || []);
          setAnalytics(aRes.data?.data || null);
          setDuties(dRes.data?.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleRemoveUser = (userId: string, userName: string) => {
    setModal({
      isOpen: true,
      title: 'ВІДСТОРОНЕННЯ БІЙЦЯ',
      message: `ВИ ДІЙСНО БАЖАЄТЕ ВІДСТОРОНИТИ ${userName.toUpperCase()} ВІД ПІДРОЗДІЛУ? ВІН ВТРАТИТЬ ДОСТУП ДО ЧАТУ ТА РОЗПОРЯДКУ.`,
      onConfirm: async () => {
        try {
          await api.post(`/units/${unit.id}/remove-user`, { userId });
          setMembers(members.filter(m => m.id !== userId));
          setModal(null);
        } catch (e: any) {
          setModal({ isOpen: true, title: 'ПОМИЛКА', message: e.response?.data?.error || 'Помилка відсторонення' });
        }
      }
    });
  };

  const handleChangeStatus = async (userId: string, newStatus: string) => {
    try {
      await api.put(`/units/${unit.id}/members/${userId}/status`, { status: newStatus });
      setMembers(members.map(m => m.id === userId ? { ...m, currentStatus: newStatus } : m));
      setStatusModal(null);
    } catch (e: any) {
      setModal({ isOpen: true, title: 'ПОМИЛКА', message: 'Помилка зміни статусу: ' + (e.response?.data?.error || e.message) });
    }
  };

  const handleSaveNotes = async (userId: string, notes: string) => {
    try {
      await api.put(`/units/${unit.id}/members/${userId}/notes`, { notes });
      setMembers(members.map(m => m.id === userId ? { ...m, commanderNotes: notes } : m));
    } catch (e) {}
  };

  const handleCreateDuty = async (type: 'duty' | 'work') => {
    if (!dutyForm.taskType || !dutyForm.title.trim() || dutyForm.assignedUserIds.length === 0) {
      return setModal({ isOpen: true, title: 'УВАГА', message: 'Оберіть тип, вкажіть завдання та виберіть особовий склад!' });
    }
    try {
      const finalTitle = `${dutyForm.taskType}: ${dutyForm.title}`;
      await api.post(`/units/${unit.id}/duties`, { title: finalTitle, type, timeRange: dutyForm.timeRange, assignedUserIds: dutyForm.assignedUserIds });
      const [mRes, dRes] = await Promise.all([api.get(`/units/${unit.id}/members`), api.get(`/units/${unit.id}/duties`)]);
      setMembers(mRes.data?.data || []);
      setDuties(dRes.data?.data || []);
      setDutyForm({ title: '', taskType: '', timeRange: '', assignedUserIds: [] });
      setModal({ isOpen: true, title: 'УСПІШНО', message: 'Наказ успішно віддано та розіслано особовому складу!' });
    } catch (e: any) { setModal({ isOpen: true, title: 'ПОМИЛКА', message: 'Помилка створення: ' + (e.response?.data?.error || e.message) }); }
  };

  const toggleDutyUser = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDutyForm(prev => {
      if (prev.assignedUserIds.includes(id)) return { ...prev, assignedUserIds: prev.assignedUserIds.filter(uid => uid !== id) };
      return { ...prev, assignedUserIds: [...prev.assignedUserIds, id] };
    });
  };

  const handleExportCSV = () => {
    const headers = ['Звання', 'ПІБ', 'Посада', 'Служить днів', 'Нарядів', 'Боєготовність (%)', 'Остання активність'];
    const rows = filteredMembers.map(m => [
      m.rank || 'Солдат',
      `${m.lastName || ''} ${m.firstName || ''}`.trim(),
      m.position || 'Стрілець',
      m.serviceStartDate ? Math.floor((new Date().getTime() - new Date(m.serviceStartDate).getTime()) / (1000 * 3600 * 24)) : 'Невідомо',
      m.dutyCount || 0,
      Math.round(m.avgSimScore || 0),
      m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleDateString('uk-UA') : 'Ніколи'
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Особовий_Склад_${unit?.name?.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIndicator = (lastLoginAt: string) => {
    if (!lastLoginAt) return <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_red]" title="Ніколи не був у системі"></span>;
    const days = (new Date().getTime() - new Date(lastLoginAt).getTime()) / (1000 * 3600 * 24);
    if (days < 1) return <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_green] animate-pulse" title="Активний сьогодні"></span>;
    if (days < 7) return <span className="w-2 h-2 rounded-full bg-[var(--ab3-gold)] shadow-[0_0_5px_var(--ab3-gold)]" title="Був у системі цього тижня"></span>;
    return <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_red]" title="Неактивний більше тижня"></span>;
  };

  const isBirthdaySoon = (dateString: string | null) => {
    if (!dateString) return false;
    const today = new Date();
    const bDay = new Date(dateString);
    bDay.setFullYear(today.getFullYear());
    if (bDay < today) bDay.setFullYear(today.getFullYear() + 1);
    const diff = Math.ceil((bDay.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diff <= 7; // Попереджаємо за 7 днів
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="bg-green-900/40 text-green-500 border border-green-900 px-2 py-0.5 text-[9px]">В СТРОЮ</span>;
      case 'duty': return <span className="bg-red-900/20 text-red-500 border border-red-900 px-2 py-0.5 text-[9px]">В НАРЯДІ</span>;
      case 'trip': return <span className="bg-purple-900/40 text-purple-400 border border-purple-900 px-2 py-0.5 text-[9px]">ВІДРЯДЖЕННЯ</span>;
      case 'sick': return <span className="bg-orange-900/40 text-orange-500 border border-orange-900 px-2 py-0.5 text-[9px]">ХВОРИЙ</span>;
      case 'leave': return <span className="bg-blue-900/40 text-blue-400 border border-blue-900 px-2 py-0.5 text-[9px]">ВІДПУСТКА</span>;
      case 'awol': return <span className="bg-red-900/40 text-red-500 border border-red-900 px-2 py-0.5 text-[9px] animate-pulse">СЗЧ</span>;
      case 'working': return <span className="bg-yellow-900/20 text-yellow-500 border border-yellow-900 px-2 py-0.5 text-[9px]">НА РОБОТАХ</span>;
      default: return <span className="bg-gray-800 text-gray-400 px-2 py-0.5 text-[9px]">НЕВІДОМО</span>;
    }
  };

  const filteredMembers = members.filter(m => 
    `${m.lastName} ${m.firstName} ${m.rank} ${m.position}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 border-4 border-[#333] rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-[var(--ab3-gold)] border-r-[var(--ab3-gold)] rounded-full animate-spin"></div>
        </div>
        <h2 className="text-xl font-heading font-black uppercase tracking-widest text-[var(--ab3-gold)] glitch-hover">
          СИНХРОНІЗАЦІЯ ДАНИХ ШТАБУ...
        </h2>
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="p-16 bg-[#0a0a0a] border border-[#333] text-center shadow-[8px_8px_0_0_#111] max-w-3xl mx-auto mt-10">
        <div className="text-red-500 text-6xl mb-6">⚠️</div>
        <h2 className="text-2xl font-black text-white uppercase tracking-widest font-heading mb-4">Підрозділ не знайдено</h2>
        <p className="text-gray-400 font-mono text-sm uppercase tracking-widest leading-relaxed">
          Для доступу до аналітики командира необхідно створити новий або приєднатися до існуючого підрозділу через меню "Мій Підрозділ".
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up max-w-7xl mx-auto pb-12">
      <div className="mb-10">
        <h1 className="text-4xl font-heading font-black uppercase tracking-widest mb-2 text-[var(--ab3-gold)] glitch-hover cursor-default">
          ПАНЕЛЬ КОМАНДИРА
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest text-gray-500">
          // АНАЛІТИКА ТА БОЙОВА ГОТОВНІСТЬ: {unit.name} //
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="p-6 bg-[#0a0a0a] border border-[#333] border-l-4 border-l-[var(--ab3-gold)] shadow-[4px_4px_0_0_#111] hover:-translate-y-1 transition-transform">
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3">Особовий склад</p>
          <div className="flex items-end gap-4">
            <p className="text-5xl font-black text-white leading-none">{analytics?.totalMembers || members.length}</p>
            <p className="text-xs font-mono text-[var(--ab3-gold)] mb-1">БІЙЦІВ</p>
          </div>
        </div>
        
        <div className="p-6 bg-[#0a0a0a] border border-[#333] border-l-4 border-l-blue-500 shadow-[4px_4px_0_0_#111] hover:-translate-y-1 transition-transform">
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3">Пройдено симуляцій</p>
          <div className="flex items-end gap-4">
            <p className="text-5xl font-black text-blue-400 leading-none">{analytics?.completedSims || 0}</p>
            <p className="text-xs font-mono text-blue-500 mb-1">РАЗІВ</p>
          </div>
        </div>
        
        <div className="p-6 bg-[#0a0a0a] border border-[#333] border-l-4 border-l-green-500 shadow-[4px_4px_0_0_#111] hover:-translate-y-1 transition-transform">
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3">Бойова готовність (Сер. бал)</p>
          <div className="flex items-end gap-4">
            <p className="text-5xl font-black text-green-400 leading-none">{analytics?.avgScore || 0}%</p>
            <p className="text-xs font-mono text-green-500 mb-1">ТОЧНІСТЬ</p>
          </div>
        </div>
        
        <div className="p-6 bg-[#0a0a0a] border border-[#333] border-l-4 border-l-red-500 shadow-[4px_4px_0_0_#111] hover:-translate-y-1 transition-transform">
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3">Психологічна загроза</p>
          <div className="flex items-end gap-4">
            <p className="text-5xl font-black text-red-500 leading-none">{analytics?.criticalPsych || 0}</p>
            <p className="text-xs font-mono text-red-500 mb-1">КРИТИЧНИХ ЗАПИТІВ</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[#333]">
        <button onClick={() => {setActiveTab('personnel'); setDutyForm({title:'', taskType:'', timeRange:'', assignedUserIds:[]});}} className={`px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'personnel' ? 'text-[var(--ab3-gold)] border-b-2 border-[var(--ab3-gold)] bg-[#111]' : 'text-gray-500 hover:text-white'}`}>
          Особовий Склад
        </button>
        <button onClick={() => {setActiveTab('duties'); setDutyForm({title:'', taskType:'', timeRange:'', assignedUserIds:[]});}} className={`px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'duties' ? 'text-red-500 border-b-2 border-red-500 bg-red-950/20' : 'text-gray-500 hover:text-white'}`}>
          Бойові Наряди ({duties.filter(d => d.status === 'active' && d.type !== 'work').length})
        </button>
        <button onClick={() => {setActiveTab('works'); setDutyForm({title:'', taskType:'', timeRange:'', assignedUserIds:[]});}} className={`px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === 'works' ? 'text-yellow-500 border-b-2 border-yellow-500 bg-yellow-950/20' : 'text-gray-500 hover:text-white'}`}>
          Госп. Роботи ({duties.filter(d => d.status === 'active' && d.type === 'work').length})
        </button>
      </div>

      {activeTab === 'personnel' && (
      <div className="bg-[#050505] border border-[#333] shadow-[8px_8px_0_0_#111]">
        {/* Members Table */}
        <div className="p-5 border-b border-[#333] bg-[#111] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="font-heading font-black text-white uppercase tracking-widest text-sm">РЕЄСТР ОСОБОВОГО СКЛАДУ</h3>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="flex border border-[#333] bg-black focus-within:border-[var(--ab3-gold)] transition-colors w-full md:w-64">
              <span className="flex items-center pl-3 text-gray-500 font-mono">&gt;</span>
              <input 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                placeholder="ПОШУК БІЙЦЯ..." 
                className="w-full bg-transparent text-xs px-2 py-2 text-white outline-none placeholder-gray-700 font-mono uppercase tracking-widest" 
              />
            </div>
            <button onClick={handleExportCSV} className="bg-[#222] hover:bg-[var(--ab3-gold)] hover:text-black text-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest transition-colors flex-shrink-0">
              ЕКСПОРТ CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#222] bg-[#0a0a0a]">
                <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-normal whitespace-nowrap">Статус / Звання</th>
                <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-normal whitespace-nowrap">ПІБ</th>
                <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-normal whitespace-nowrap">Посада</th>
                <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-normal whitespace-nowrap text-center">Служба (Днів)</th>
                <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-normal whitespace-nowrap text-center">Наряди</th>
                <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-normal whitespace-nowrap text-center">Боєготовність</th>
                <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-normal whitespace-nowrap text-right">Управління</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(m => {
                const simScore = Math.round(parseFloat(m.avgSimScore || '0'));
                const readinessColor = simScore >= 80 ? 'text-green-400 bg-green-900/20 border-green-900' : simScore >= 50 ? 'text-[var(--ab3-gold)] bg-yellow-900/20 border-yellow-900' : 'text-red-400 bg-red-900/20 border-red-900';
                
                const daysServed = m.serviceStartDate ? Math.floor((new Date().getTime() - new Date(m.serviceStartDate).getTime()) / (1000 * 3600 * 24)) : null;
                const birthdayAlert = isBirthdaySoon(m.birthDate);

                return (
                <tr key={m.id} className="border-b border-[#111] hover:bg-[#111] transition-colors group">
                  <td className="p-4 flex items-center gap-3">
                    {getStatusIndicator(m.lastLoginAt)}
                    <span className="text-[var(--ab3-gold)] font-bold font-heading text-sm uppercase tracking-widest">{m.rank || 'СОЛДАТ'}</span>
                  </td>
                  <td className="p-4 text-white font-bold tracking-wide whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {m.lastName} {m.firstName}
                      {birthdayAlert && <span title="Скоро день народження!" className="text-xl drop-shadow-[0_0_5px_#f59e0b] animate-bounce">🎂</span>}
                      <button onClick={() => setPassportModal(m)} className="ml-2 text-[10px] bg-[#222] hover:bg-[var(--ab3-gold)] hover:text-black px-2 py-0.5 font-mono transition-colors">ДОСЬЄ</button>
                    </div>
                    <div className="mt-1 relative w-max">
                      <button onClick={() => setStatusModal({ id: m.id, name: `${m.lastName} ${m.firstName}`, status: m.currentStatus || 'active' })} className="focus:outline-none transition-transform hover:scale-105 active:scale-95 block">
                        {getStatusBadge(m.currentStatus || 'active')}
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400 text-xs font-mono tracking-widest uppercase">{m.position || 'СТРІЛЕЦЬ'}</td>
                  <td className="p-4 text-center">
                    <span className="text-xs font-mono text-gray-300">{daysServed !== null ? `${daysServed} дн.` : '-'}</span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-mono font-bold text-[var(--ab3-gold)]">{m.dutyCount || 0}</span>
                      <span className="text-[8px] text-gray-600 font-mono">
                        {m.lastDutyDate ? new Date(m.lastDutyDate).toLocaleDateString('uk-UA') : 'Ніколи'}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-xs font-mono font-bold border px-3 py-1 ${readinessColor}`}>{simScore}%</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleRemoveUser(m.id, `${m.lastName} ${m.firstName}`)} className="text-[10px] font-mono text-gray-500 hover:text-red-500 uppercase tracking-widest px-2 py-1 border border-transparent hover:border-red-900/50 hover:bg-red-900/20">
                        ЗНЯТИ
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          {filteredMembers.length === 0 && (
            <div className="p-10 text-center font-mono text-gray-500 text-xs uppercase tracking-widest">Бійців не знайдено</div>
          )}
        </div>
      </div>
      )}

      {/* Вкладка: Наряди АБО Роботи */}
      {(activeTab === 'duties' || activeTab === 'works') && (
        <div className="flex flex-col gap-6 animate-fade-in-up">
          
          {/* Брутальний дизайн для Нарядів та Робіт */}
          <div className={`border p-6 md:p-8 relative ${activeTab === 'works' ? 'bg-[#0a0a0a] border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'bg-[#050505] border-red-900 shadow-[0_0_20px_rgba(239,68,68,0.15)]'}`}>
             {activeTab === 'works' && <div className="absolute top-0 left-0 w-full h-3" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #eab308, #eab308 15px, #000 15px, #000 30px)' }}></div>}
             {activeTab === 'duties' && <div className="absolute top-0 right-0 w-64 h-64 bg-red-900/20 blur-3xl pointer-events-none"></div>}

             <div className="relative z-10">
                <h3 className={`text-2xl font-heading font-black uppercase tracking-widest mb-2 flex items-center gap-3 ${activeTab === 'works' ? 'text-yellow-500' : 'text-red-500'}`}>
                   <span className={`w-3 h-8 shadow-[0_0_10px_currentColor] ${activeTab === 'works' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                   {activeTab === 'works' ? 'ПРИЗНАЧЕННЯ: ГОСПОДАРСЬКІ РОБОТИ' : 'БОЙОВИЙ НАКАЗ: ВАРТА / ПАТРУЛЬ'}
                </h3>
                <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-8">
                  // {activeTab === 'works' ? 'ЗАБЕЗПЕЧЕННЯ ПІДРОЗДІЛУ ТА ОБСЛУГОВУВАННЯ ТЕХНІКИ' : 'ПРИЗНАЧЕННЯ ОСОБОВОГО СКЛАДУ НА ЧЕРГУВАННЯ'} //
                </p>
  
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                   <div className="md:col-span-2">
                      <label className={`block text-xs font-mono uppercase tracking-widest mb-2 font-bold ${activeTab === 'works' ? 'text-yellow-500' : 'text-red-400'}`}>{activeTab === 'works' ? 'Вид Робіт *' : 'Вид Наряду *'}</label>
                      <select value={dutyForm.taskType} onChange={e=>setDutyForm({...dutyForm, taskType: e.target.value})} className={`w-full bg-[#111] border border-[#333] text-white px-4 py-3 font-mono text-sm outline-none transition-colors appearance-none cursor-pointer ${activeTab === 'works' ? 'focus:border-yellow-500' : 'focus:border-red-500'}`}>
                        <option value="">-- Оберіть тип --</option>
                        {activeTab === 'works' ? (
                          <>
                            <option value="Обслуговування техніки">Обслуговування техніки</option>
                            <option value="Розвантаження БК / Майна">Розвантаження БК / Майна</option>
                            <option value="Інженерно-фортифікаційні">Інженерно-фортифікаційні (Окопи)</option>
                            <option value="Побутові / Прибирання">Побутові / Прибирання</option>
                          </>
                        ) : (
                          <>
                            <option value="Внутрішній наряд (КДП)">Внутрішній наряд (КДП)</option>
                            <option value="Варта / Патруль">Варта / Патруль</option>
                            <option value="Черговий підрозділу">Черговий підрозділу</option>
                            <option value="ППО / Спостереження">ППО / Спостереження</option>
                          </>
                        )}
                      </select>
                   </div>
                   <div>
                      <label className={`block text-xs font-mono uppercase tracking-widest mb-2 font-bold ${activeTab === 'works' ? 'text-yellow-500' : 'text-red-400'}`}>{activeTab === 'works' ? 'Завдання (Напр: Копання траншеї) *' : 'Об\'єкт Охорони (Напр: Пост №1 КДП) *'}</label>
                      <input value={dutyForm.title} onChange={e=>setDutyForm({...dutyForm, title: e.target.value})} placeholder="Введіть суть наказу..." className={`w-full bg-[#050505] border border-[#333] text-white px-4 py-3 font-mono text-sm outline-none transition-colors ${activeTab === 'works' ? 'focus:border-yellow-500' : 'focus:border-red-500'}`} />
                   </div>
                   <div>
                      <label className={`block text-xs font-mono uppercase tracking-widest mb-2 font-bold ${activeTab === 'works' ? 'text-yellow-500' : 'text-red-400'}`}>Період виконання</label>
                      <input value={dutyForm.timeRange} onChange={e=>setDutyForm({...dutyForm, timeRange: e.target.value})} placeholder="Напр: 08:00 - 20:00" className={`w-full bg-[#050505] border border-[#333] text-white px-4 py-3 font-mono text-sm outline-none transition-colors ${activeTab === 'works' ? 'focus:border-yellow-500' : 'focus:border-red-500'}`} />
                   </div>
                </div>
  
                <div className="flex justify-between items-center mb-3">
                   <label className={`block text-sm font-mono uppercase tracking-widest font-bold ${activeTab === 'works' ? 'text-yellow-500' : 'text-red-400'}`}>
                     Особовий склад ({dutyForm.assignedUserIds.length} обрано)
                   </label>
                   {user && members.find(m => m.id === user.id) && (
                     <button type="button" onClick={(e) => toggleDutyUser(e, user.id)} className={`text-[10px] font-mono border px-3 py-1 text-white transition-colors ${activeTab === 'works' ? 'border-yellow-600 hover:bg-yellow-900/30' : 'border-red-600 hover:bg-red-900/30'}`}>
                       {dutyForm.assignedUserIds.includes(user.id) ? 'Зняти себе' : '+ ДОДАТИ СЕБЕ'}
                     </button>
                   )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                   {members.map(m => {
                      const isSelected = dutyForm.assignedUserIds.includes(m.id);
                      const isUnavailable = ['sick', 'awol', 'leave'].includes(m.currentStatus || 'active');
                      const isBusy = ['duty', 'working'].includes(m.currentStatus || 'active');
                      const colorClass = activeTab === 'works' ? 'yellow' : 'red';
                      
                      return (
                        <div key={m.id} onClick={(e) => !isUnavailable && toggleDutyUser(e, m.id)} className={`p-4 border transition-all duration-200 flex items-center justify-between gap-3 ${isSelected ? `bg-${colorClass}-900/20 border-${colorClass}-500 cursor-pointer shadow-[0_0_15px_rgba(${activeTab === 'works' ? '234,179,8' : '239,68,68'},0.2)]` : isUnavailable ? 'bg-[#0a0a0a] border-[#222] opacity-50 cursor-not-allowed' : 'bg-[#111] border-[#333] hover:border-gray-500 cursor-pointer'}`}>
                           <div className="flex items-center gap-3">
                             <div className={`w-5 h-5 border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? `border-${colorClass}-500 bg-${colorClass}-500/20 text-${colorClass}-500` : 'border-gray-600'}`}>
                                {isSelected && <span className="text-xs">✓</span>}
                             </div>
                             <div>
                                <p className={`font-bold uppercase tracking-widest text-sm ${isSelected ? 'text-white' : isUnavailable ? 'text-red-500 line-through' : 'text-gray-300'}`}>{m.lastName} {m.firstName?.[0]}.</p>
                                <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">{m.rank} | {m.position}</p>
                             </div>
                           </div>
                           {isUnavailable ? <span className="text-[8px] font-mono text-red-500 bg-red-500/10 px-1 py-0.5 border border-red-500/30">НЕДОСТУПНИЙ</span> : isBusy ? <span className="text-[8px] font-mono text-yellow-500 bg-yellow-500/10 px-1 py-0.5 border border-yellow-500/30">ЗАЙНЯТИЙ</span> : null}
                        </div>
                      )
                   })}
                </div>
  
                {dutyForm.assignedUserIds.some(id => ['sick', 'awol', 'leave'].includes(members.find(m => m.id === id)?.currentStatus || '')) && (
                  <p className="text-[10px] text-red-500 mb-4 font-mono animate-pulse">УВАГА: Ви обрали бійців, які не можуть заступити в наряд!</p>
                )}
  
                <button type="button" onClick={() => handleCreateDuty(activeTab === 'works' ? 'work' : 'duty')} className={`w-full font-black font-heading uppercase tracking-widest py-4 text-lg transition-colors ${activeTab === 'works' ? 'bg-yellow-600 hover:bg-yellow-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.4)]' : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.4)]'}`}>
                   {activeTab === 'works' ? 'ПРИЗНАЧИТИ НА РОБОТИ' : 'ВІДДАТИ БОЙОВИЙ НАКАЗ'}
                </button>
             </div>
          </div>

          {/* Журнал активних наказів */}
          <div className="space-y-4">
            <h3 className="font-heading font-black text-white uppercase tracking-widest text-lg mb-4">ЖУРНАЛ НАКАЗІВ</h3>
            {duties.filter(d => activeTab === 'works' ? d.type === 'work' : d.type !== 'work').length === 0 ? <p className="text-gray-500 font-mono text-xs">Немає записів</p> : duties.filter(d => activeTab === 'works' ? d.type === 'work' : d.type !== 'work').map(duty => {
              let assignedList = [];
              try { assignedList = JSON.parse(duty.assignedUserIds || '[]'); } catch { assignedList = []; }
              return (
              <div key={duty.id} className={`p-5 border ${duty.status === 'completed' ? 'border-[#333] bg-[#0a0a0a] opacity-50' : activeTab === 'works' ? 'border-yellow-600 bg-[#111] shadow-[4px_4px_0_0_rgba(234,179,8,0.2)]' : 'border-red-900 bg-[#111] shadow-[4px_4px_0_0_rgba(239,68,68,0.2)]'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`text-[9px] font-mono px-2 py-0.5 mr-2 ${activeTab === 'works' ? 'bg-yellow-900/30 text-yellow-500 border border-yellow-900' : 'bg-red-900/30 text-red-500 border border-red-900'}`}>{duty.type === 'work' ? 'РОБОТА' : 'НАРЯД'}</span>
                    <span className="font-bold text-white uppercase tracking-widest">{duty.title}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${activeTab === 'works' ? 'text-yellow-500' : 'text-red-400'}`}>{duty.timeRange}</span>
                </div>
                <div className="text-xs text-gray-400 font-mono mb-4 mt-3 flex flex-wrap gap-2">
                  <span className="text-gray-600">Особовий склад:</span>
                  {assignedList.map((id: string) => (
                    <span key={id} className="bg-[#050505] border border-[#333] px-2 py-0.5">
                      {members.find(m => m.id === id)?.lastName || 'Невідомий'} {members.find(m => m.id === id)?.firstName?.[0]}.
                    </span>
                  ))}
                </div>
                {duty.status !== 'completed' && (
                  <button onClick={async () => {
                    await api.put(`/units/${unit.id}/duties/${duty.id}/complete`);
                    setDuties(duties.map(d => d.id === duty.id ? {...d, status: 'completed'} : d));
                    // Очищуємо статуси 'duty' на 'active'
                    assignedList.forEach(async (uId: string) => await api.put(`/units/${unit.id}/members/${uId}/status`, {status: 'active'}));
                  }} className="text-[10px] text-green-500 border border-green-500/50 bg-green-900/20 px-4 py-2 hover:bg-green-500 hover:text-black transition-colors uppercase font-bold tracking-widest">ВІДМІТИТИ ЯК ВИКОНАНО</button>
                )}
              </div>
            )})}
          </div>
        </div>
      )}


      {/* TACTICAL MODAL */}
      {modal?.isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`bg-[#0a0a0a] border border-[#333] border-l-4 ${modal.title === 'ПОМИЛКА' || modal.title === 'ВІДСТОРОНЕННЯ БІЙЦЯ' ? 'border-l-red-500' : modal.title === 'УСПІШНО' ? 'border-l-green-500' : 'border-l-[var(--ab3-gold)]'} p-8 max-w-md w-full shadow-[8px_8px_0_0_#111] animate-scale-in relative overflow-hidden font-mono`}>
            <div className={`absolute top-0 right-0 w-32 h-32 ${modal.title === 'ПОМИЛКА' || modal.title === 'ВІДСТОРОНЕННЯ БІЙЦЯ' ? 'bg-red-500' : modal.title === 'УСПІШНО' ? 'bg-green-500' : 'bg-[var(--ab3-gold)]'} opacity-10 blur-2xl pointer-events-none`}></div>
            <h3 className={`text-xl font-black uppercase tracking-widest mb-3 flex items-center gap-3 ${modal.title === 'ПОМИЛКА' || modal.title === 'ВІДСТОРОНЕННЯ БІЙЦЯ' ? 'text-red-500' : modal.title === 'УСПІШНО' ? 'text-green-500' : 'text-[var(--ab3-gold)]'}`}>
              <span className="text-white">!</span> {modal.title}
            </h3>
            <p className="text-xs text-gray-300 mb-8 leading-relaxed uppercase tracking-widest">{modal.message}</p>
            <div className="flex gap-4">
              {modal.onConfirm && <button onClick={modal.onConfirm} className={`w-full font-bold uppercase tracking-widest px-4 py-3 transition-colors ${modal.title === 'ВІДСТОРОНЕННЯ БІЙЦЯ' ? 'bg-red-900/30 border border-red-900 text-red-500 hover:bg-red-600 hover:text-white' : 'bg-[var(--ab3-gold)] text-black hover:bg-yellow-400'}`}>ПІДТВЕРДИТИ</button>}
              <button onClick={() => setModal(null)} className="w-full bg-[#111] border border-[#333] text-white font-bold uppercase tracking-widest px-4 py-3 hover:bg-[#222] transition-colors">{modal.onConfirm ? 'СКАСУВАТИ' : 'ЗАКРИТИ'}</button>
            </div>
          </div>
        </div>
      )}

      {/* SOLDIER PASSPORT MODAL (COMMANDER ONLY) */}
      {passportModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0a0a0a] border border-[#333] border-t-4 border-t-[var(--ab3-gold)] p-6 max-w-xl w-full shadow-[8px_8px_0_0_#111] font-mono max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-widest">{passportModal.lastName} {passportModal.firstName}</h2>
                <p className="text-gray-400 uppercase tracking-widest">{passportModal.rank} | {passportModal.position}</p>
                <p className="text-[10px] text-[var(--ab3-gold)] mt-1">ID: {passportModal.id}</p>
              </div>
              <button onClick={() => setPassportModal(null)} className="text-gray-500 hover:text-white text-xl">&times;</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#111] p-3 border border-[#222]"><p className="text-[10px] text-gray-500">ПОЧАТОК СЛУЖБИ</p><p className="text-sm text-white">{passportModal.serviceStartDate ? new Date(passportModal.serviceStartDate).toLocaleDateString() : '-'}</p></div>
              <div className="bg-[#111] p-3 border border-[#222]"><p className="text-[10px] text-gray-500">ОСТАННІЙ ВХІД</p><p className="text-sm text-white">{passportModal.lastLoginAt ? new Date(passportModal.lastLoginAt).toLocaleDateString() : '-'}</p></div>
              <div className="bg-[#111] p-3 border border-[#222]"><p className="text-[10px] text-gray-500">СТАТУС</p><div className="mt-1">{getStatusBadge(passportModal.currentStatus)}</div></div>
              <div className="bg-[#111] p-3 border border-[#222]"><p className="text-[10px] text-gray-500">СЕРЕДНІЙ БАЛ (СИМ)</p><p className="text-sm text-white">{Math.round(passportModal.avgSimScore || 0)}%</p></div>
            </div>

            <div className="mb-6">
              <label className="text-[10px] text-[var(--ab3-gold)] uppercase tracking-widest flex items-center gap-2 mb-2">🔒 ТАЄМНІ ПРИМІТКИ КОМАНДИРА (СІМЕЙНИЙ СТАН, ТА ІН.)</label>
              <textarea 
                defaultValue={passportModal.commanderNotes || ''} 
                onBlur={(e) => handleSaveNotes(passportModal.id, e.target.value)}
                className="w-full h-32 bg-[#050505] border border-[#333] text-gray-300 p-3 text-sm focus:border-[var(--ab3-gold)] outline-none resize-none" placeholder="Нотатки бачите лише ви..."
              ></textarea>
            </div>
          </div>
        </div>
      )}

      {/* STATUS CHANGE MODAL */}
      {statusModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0a0a0a] border border-[#333] border-t-4 border-t-[var(--ab3-gold)] p-8 max-w-md w-full shadow-[8px_8px_0_0_#111] animate-scale-in relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--ab3-gold)] opacity-10 blur-2xl pointer-events-none"></div>
            <h3 className="text-xl font-black text-white uppercase tracking-widest mb-1">ДИСЛОКАЦІЯ / СТАТУС</h3>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-6">БОЄЦЬ: <span className="text-[var(--ab3-gold)]">{statusModal.name}</span></p>
            
            <div className="grid grid-cols-1 gap-3 mb-6">
              <button onClick={() => handleChangeStatus(statusModal.id, 'active')} className={`p-4 border transition-all text-left font-mono uppercase tracking-widest text-xs font-bold ${statusModal.status === 'active' ? 'bg-green-900/20 border-green-500 text-green-500' : 'bg-[#111] border-[#333] text-gray-400 hover:border-green-500 hover:text-green-500'}`}>✅ В строю (Доступний)</button>
              <button onClick={() => handleChangeStatus(statusModal.id, 'trip')} className={`p-4 border transition-all text-left font-mono uppercase tracking-widest text-xs font-bold ${statusModal.status === 'trip' ? 'bg-purple-900/20 border-purple-500 text-purple-400' : 'bg-[#111] border-[#333] text-gray-400 hover:border-purple-500 hover:text-purple-400'}`}>🗺️ Відрядження</button>
              <button onClick={() => handleChangeStatus(statusModal.id, 'duty')} className={`p-4 border transition-all text-left font-mono uppercase tracking-widest text-xs font-bold ${statusModal.status === 'duty' ? 'bg-red-900/20 border-red-500 text-red-500' : 'bg-[#111] border-[#333] text-gray-400 hover:border-red-500 hover:text-red-500'}`}>🛡️ В наряді</button>
              <button onClick={() => handleChangeStatus(statusModal.id, 'working')} className={`p-4 border transition-all text-left font-mono uppercase tracking-widest text-xs font-bold ${statusModal.status === 'working' ? 'bg-yellow-900/20 border-yellow-500 text-yellow-500' : 'bg-[#111] border-[#333] text-gray-400 hover:border-yellow-500 hover:text-yellow-500'}`}>🛠️ На роботах</button>
              <button onClick={() => handleChangeStatus(statusModal.id, 'sick')} className={`p-4 border transition-all text-left font-mono uppercase tracking-widest text-xs font-bold ${statusModal.status === 'sick' ? 'bg-orange-900/20 border-orange-500 text-orange-500' : 'bg-[#111] border-[#333] text-gray-400 hover:border-orange-500 hover:text-orange-500'}`}>⚕️ Лікування / ВЛК</button>
              <button onClick={() => handleChangeStatus(statusModal.id, 'leave')} className={`p-4 border transition-all text-left font-mono uppercase tracking-widest text-xs font-bold ${statusModal.status === 'leave' ? 'bg-blue-900/20 border-blue-500 text-blue-400' : 'bg-[#111] border-[#333] text-gray-400 hover:border-blue-500 hover:text-blue-400'}`}>🏖️ Відпустка (Усі види)</button>
              <button onClick={() => handleChangeStatus(statusModal.id, 'awol')} className={`p-4 border transition-all text-left font-mono uppercase tracking-widest text-xs font-bold ${statusModal.status === 'awol' ? 'bg-red-900/20 border-red-500 text-red-500' : 'bg-[#111] border-[#333] text-gray-400 hover:border-red-500 hover:text-red-500'}`}>🚨 СЗЧ / Відсутній</button>
            </div>
            
            <button onClick={() => setStatusModal(null)} className="w-full bg-[#222] text-white py-3 font-mono font-bold uppercase tracking-widest hover:bg-[#333] transition-colors">СКАСУВАТИ</button>
          </div>
        </div>
      )}

      {/* STATUS CHANGE MODAL */}
      {statusModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0a0a0a] border border-[#333] border-t-4 border-t-[var(--ab3-gold)] p-8 max-w-md w-full shadow-[8px_8px_0_0_#111] animate-scale-in relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--ab3-gold)] opacity-10 blur-2xl pointer-events-none"></div>
            <h3 className="text-xl font-black text-white uppercase tracking-widest mb-1">ДИСЛОКАЦІЯ / СТАТУС</h3>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-6">БОЄЦЬ: <span className="text-[var(--ab3-gold)]">{statusModal.name}</span></p>
            
            <div className="grid grid-cols-1 gap-3 mb-6">
              <button onClick={() => handleChangeStatus(statusModal.id, 'active')} className={`p-4 border transition-all text-left font-mono uppercase tracking-widest text-xs font-bold ${statusModal.status === 'active' ? 'bg-green-900/20 border-green-500 text-green-500' : 'bg-[#111] border-[#333] text-gray-400 hover:border-green-500 hover:text-green-500'}`}>✅ В строю (Доступний)</button>
              <button onClick={() => handleChangeStatus(statusModal.id, 'trip')} className={`p-4 border transition-all text-left font-mono uppercase tracking-widest text-xs font-bold ${statusModal.status === 'trip' ? 'bg-purple-900/20 border-purple-500 text-purple-400' : 'bg-[#111] border-[#333] text-gray-400 hover:border-purple-500 hover:text-purple-400'}`}>🗺️ Відрядження</button>
              <button onClick={() => handleChangeStatus(statusModal.id, 'duty')} className={`p-4 border transition-all text-left font-mono uppercase tracking-widest text-xs font-bold ${statusModal.status === 'duty' ? 'bg-red-900/20 border-red-500 text-red-500' : 'bg-[#111] border-[#333] text-gray-400 hover:border-red-500 hover:text-red-500'}`}>🛡️ В наряді</button>
              <button onClick={() => handleChangeStatus(statusModal.id, 'working')} className={`p-4 border transition-all text-left font-mono uppercase tracking-widest text-xs font-bold ${statusModal.status === 'working' ? 'bg-yellow-900/20 border-yellow-500 text-yellow-500' : 'bg-[#111] border-[#333] text-gray-400 hover:border-yellow-500 hover:text-yellow-500'}`}>🛠️ На роботах</button>
              <button onClick={() => handleChangeStatus(statusModal.id, 'sick')} className={`p-4 border transition-all text-left font-mono uppercase tracking-widest text-xs font-bold ${statusModal.status === 'sick' ? 'bg-orange-900/20 border-orange-500 text-orange-500' : 'bg-[#111] border-[#333] text-gray-400 hover:border-orange-500 hover:text-orange-500'}`}>⚕️ Лікування / ВЛК</button>
              <button onClick={() => handleChangeStatus(statusModal.id, 'leave')} className={`p-4 border transition-all text-left font-mono uppercase tracking-widest text-xs font-bold ${statusModal.status === 'leave' ? 'bg-blue-900/20 border-blue-500 text-blue-400' : 'bg-[#111] border-[#333] text-gray-400 hover:border-blue-500 hover:text-blue-400'}`}>🏖️ Відпустка (Усі види)</button>
              <button onClick={() => handleChangeStatus(statusModal.id, 'awol')} className={`p-4 border transition-all text-left font-mono uppercase tracking-widest text-xs font-bold ${statusModal.status === 'awol' ? 'bg-red-900/20 border-red-500 text-red-500' : 'bg-[#111] border-[#333] text-gray-400 hover:border-red-500 hover:text-red-500'}`}>🚨 СЗЧ / Відсутній</button>
            </div>
            
            <button onClick={() => setStatusModal(null)} className="w-full bg-[#222] text-white py-3 font-mono font-bold uppercase tracking-widest hover:bg-[#333] transition-colors">СКАСУВАТИ</button>
          </div>
        </div>
      )}
    </div>
  );
};