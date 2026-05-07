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

  useEffect(() => {
    const init = async () => {
      try {
        const uRes = await api.get('/units/my');
        const myUnit = uRes.data?.data;
        if (myUnit) {
          setUnit(myUnit);
          const [mRes, aRes] = await Promise.all([
            api.get(`/units/${myUnit.id}/members`),
            api.get(`/units/${myUnit.id}/analytics`)
          ]);
          setMembers(mRes.data?.data || []);
          setAnalytics(aRes.data?.data || null);
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
          alert(e.response?.data?.error || 'Помилка відсторонення');
        }
      }
    });
  };

  const handleExportCSV = () => {
    const headers = ['Звання', 'ПІБ', 'Посада', 'Пройдено модулів', 'Боєготовність (%)', 'Остання активність'];
    const rows = filteredMembers.map(m => [
      m.rank || 'Солдат',
      `${m.lastName || ''} ${m.firstName || ''}`.trim(),
      m.position || 'Стрілець',
      m.completedModules || 0,
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

      {/* Members Table */}
      <div className="bg-[#050505] border border-[#333] shadow-[8px_8px_0_0_#111]">
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
                <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-normal whitespace-nowrap text-center">Навчання</th>
                <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-normal whitespace-nowrap text-center">Боєготовність</th>
                <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-normal whitespace-nowrap text-right">Управління</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(m => {
                const simScore = Math.round(parseFloat(m.avgSimScore || '0'));
                const readinessColor = simScore >= 80 ? 'text-green-400 bg-green-900/20 border-green-900' : simScore >= 50 ? 'text-[var(--ab3-gold)] bg-yellow-900/20 border-yellow-900' : 'text-red-400 bg-red-900/20 border-red-900';
                
                return (
                <tr key={m.id} className="border-b border-[#111] hover:bg-[#111] transition-colors group">
                  <td className="p-4 flex items-center gap-3">
                    {getStatusIndicator(m.lastLoginAt)}
                    <span className="text-[var(--ab3-gold)] font-bold font-heading text-sm uppercase tracking-widest">{m.rank || 'СОЛДАТ'}</span>
                  </td>
                  <td className="p-4 text-white font-bold tracking-wide whitespace-nowrap">{m.lastName} {m.firstName}</td>
                  <td className="p-4 text-gray-400 text-xs font-mono tracking-widest uppercase">{m.position || 'СТРІЛЕЦЬ'}</td>
                  <td className="p-4 text-center">
                    <span className="text-xs font-mono text-gray-300 bg-black border border-[#333] px-3 py-1">{m.completedModules || 0} КУРСІВ</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-xs font-mono font-bold border px-3 py-1 ${readinessColor}`}>{simScore}%</span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleRemoveUser(m.id, `${m.lastName} ${m.firstName}`)} className="text-[10px] font-mono text-gray-500 hover:text-red-500 uppercase tracking-widest transition-colors px-2 py-1 border border-transparent hover:border-red-900/50 bg-transparent hover:bg-red-900/20">
                      ВІДСТОРОНИТИ
                    </button>
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

      {/* TACTICAL MODAL */}
      {modal?.isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0a0a0a] border border-[#333] border-l-4 border-l-red-500 p-8 max-w-md w-full shadow-[8px_8px_0_0_#111] animate-scale-in relative overflow-hidden font-mono">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 opacity-10 blur-2xl pointer-events-none"></div>
            <h3 className="text-xl font-black text-white uppercase tracking-widest mb-3 flex items-center gap-3">
              <span className="text-red-500">!</span> {modal.title}
            </h3>
            <p className="text-xs text-gray-400 mb-8 leading-relaxed uppercase tracking-widest">{modal.message}</p>
            <div className="flex gap-4">
              {modal.onConfirm && <button onClick={modal.onConfirm} className="w-full bg-red-900/30 border border-red-900 text-red-500 font-bold uppercase tracking-widest px-4 py-3 hover:bg-red-600 hover:text-white transition-colors">ПІДТВЕРДИТИ</button>}
              <button onClick={() => setModal(null)} className="w-full bg-[#111] border border-[#333] text-white font-bold uppercase tracking-widest px-4 py-3 hover:bg-[#222] transition-colors">СКАСУВАТИ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};