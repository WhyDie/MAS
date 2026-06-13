import React, { useState, useEffect } from 'react';
import { api } from '@services/api';
import { useAuthStore } from '@stores/index';

export const UnitDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [unit, setUnit] = useState<any>(null);
  const [allUnits, setAllUnits] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roster' | 'requests' | 'add'>('roster');
  const [newUnitName, setNewUnitName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [modal, setModal] = useState<{isOpen: boolean, type: 'alert'|'confirm', title: string, message: string, onConfirm?: () => void} | null>(null);
  
  // Командиром вважається адмін, або той, хто створив цей підрозділ (commanderId)
  const isCommanderOrAdmin = user?.role === 'commander' || user?.role === 'admin' || user?.role === 'superadmin' || unit?.commanderId === user?.id;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const myUnitRes = await api.get('/units/my');
      if (myUnitRes.data?.data) {
        setUnit(myUnitRes.data.data);
        setEditName(myUnitRes.data.data.name);
        loadUnitDetails(myUnitRes.data.data.id);
      } else {
        setUnit(null);
        const allRes = await api.get('/units');
        setAllUnits(allRes.data?.data || []);
      }
    } catch (e) { 
      console.error(e);
      // Фоллбек, якщо бекенд не відповів (щоб форма створення все одно завантажилась)
      setUnit(null);
      api.get('/units').then(res => setAllUnits(res.data?.data || [])).catch(() => setAllUnits([]));
    }
    setLoading(false);
  };

  const loadUnitDetails = async (unitId: string) => {
    try {
      const [membersRes, reqRes] = await Promise.all([api.get(`/units/${unitId}/members`), api.get(`/units/${unitId}/requests`)]);
      setMembers(membersRes.data?.data || []);
      setRequests(reqRes.data?.data || []);
    } catch (e) { console.error(e); }
  };

  const handleCreateUnit = async () => {
    if (!newUnitName.trim()) return;
    try {
      await api.post('/units', { name: newUnitName });
      loadData();
    } catch (e) { console.error(e); }
  };

  const handleLeaveUnit = () => {
    setModal({
      isOpen: true, type: 'confirm', title: 'ВІДРЯДЖЕННЯ', message: 'ВИ ДІЙСНО БАЖАЄТЕ ПОКИНУТИ ЦЕЙ ПІДРОЗДІЛ?',
      onConfirm: async () => {
        try {
          await api.post('/units/my/leave');
          setUnit(null); setMembers([]); setRequests([]);
          loadData();
          setModal(null);
        } catch (e: any) { 
          setModal({ isOpen: true, type: 'alert', title: 'ПОМИЛКА', message: e.response?.data?.error || 'Помилка виходу з підрозділу' });
        }
      }
    });
  };

  const handleDeleteUnit = () => {
    setModal({
      isOpen: true, type: 'confirm', title: 'РОЗФОРМУВАННЯ', message: 'УВАГА! ЦЕ БЕЗПОВОРОТНО ВИДАЛИТЬ ПІДРОЗДІЛ, ЧАТИ ТА ВІДВ\'ЯЖЕ ВСІХ БІЙЦІВ. ПРОДОВЖИТИ?',
      onConfirm: async () => {
        try {
          await api.delete(`/units/${unit.id}`);
          setUnit(null); setMembers([]); setRequests([]);
          loadData();
          setModal(null);
        } catch (e: any) { 
          setModal({ isOpen: true, type: 'alert', title: 'ПОМИЛКА', message: e.response?.data?.error || 'Помилка видалення підрозділу' });
        }
      }
    });
  };

  const handleUpdateName = async () => {
    if (!editName.trim()) return;
    try {
      await api.put(`/units/${unit.id}`, { name: editName });
      setUnit({ ...unit, name: editName });
      setIsEditing(false);
    } catch (e: any) { 
      setModal({ isOpen: true, type: 'alert', title: 'ПОМИЛКА', message: e.response?.data?.error || 'Помилка збереження назви' });
    }
  };

  const handleDeleteFromList = (id: string) => {
    setModal({
      isOpen: true, type: 'confirm', title: 'ЗНИЩЕННЯ', message: 'ВИ ВПЕВНЕНІ, ЩО ХОЧЕТЕ БЕЗПОВОРОТНО ВИДАЛИТИ ЦЕЙ ПІДРОЗДІЛ?',
      onConfirm: async () => {
        try {
          await api.delete(`/units/${id}`);
          loadData();
          setModal(null);
        } catch (e: any) {
          setModal({ isOpen: true, type: 'alert', title: 'ПОМИЛКА', message: e.response?.data?.error || 'Помилка видалення підрозділу' });
        }
      }
    });
  };

  const handleRequestJoin = async (id: string) => {
    try {
      await api.post(`/units/${id}/request-join`);
      setModal({ isOpen: true, type: 'alert', title: 'ВІДПРАВЛЕНО', message: 'ЗАПИТ ВІДПРАВЛЕНО КОМАНДИРУ. ОЧІКУЙТЕ ПІДТВЕРДЖЕННЯ.' });
    } catch (e: any) { 
      setModal({ isOpen: true, type: 'alert', title: 'ПОМИЛКА', message: e.response?.data?.error || 'Помилка відправки запиту' });
    }
  };

  const handleActionReq = async (reqId: string, action: 'approve' | 'reject') => {
    try {
      await api.post(`/units/requests/${reqId}/${action}`);
      loadUnitDetails(unit.id);
    } catch (e) { console.error(e); }
  };

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    const res = await api.get(`/units/users/search?q=${searchQuery}`);
    setSearchResults(res.data?.data || []);
  };

  const handleForceAdd = async (userId: string) => {
    try {
      await api.post(`/units/${unit.id}/add-user`, { userId });
      loadUnitDetails(unit.id);
    } catch (e) {}
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Завантаження...</div>;

  if (!unit) {
    return (
      <div className="animate-fade-in-up max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-black uppercase tracking-widest mb-2" style={{ color: 'var(--text-primary)' }}>ПІДРОЗДІЛИ</h1>
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--ab3-gold)]">// СИСТЕМА УПРАВЛІННЯ ОСОБОВИМ СКЛАДОМ //</p>
        </div>
        
        <div className="p-8 bg-[#0a0a0a] border border-[#333] mb-12 shadow-[8px_8px_0_0_#111]">
          <h2 className="text-lg font-heading font-black text-[var(--ab3-gold)] mb-4 tracking-widest uppercase">Створити підрозділ / групу</h2>
          <div className="flex flex-col sm:flex-row gap-0 border border-[#333] bg-[#111] p-1 focus-within:border-[var(--ab3-gold)] transition-colors">
            <input className="flex-1 bg-transparent border-none text-white px-4 py-3 font-mono text-sm placeholder-gray-600 focus:outline-none" placeholder="ВВЕДІТЬ НАЗВУ ФОРМУВАННЯ..." value={newUnitName} onChange={e => setNewUnitName(e.target.value)} />
            <button onClick={handleCreateUnit} className="bg-[var(--ab3-gold)] text-black font-bold font-mono tracking-widest uppercase px-8 py-3 hover:bg-yellow-400 transition-colors shadow-[0_0_15px_rgba(201,162,39,0.2)]">ІНІЦІАЛІЗАЦІЯ</button>
          </div>
        </div>

        <h2 className="text-xl font-heading font-black mb-6 text-white tracking-widest uppercase border-b border-[#333] pb-2">Рєєстр підрозділів</h2>
        <div className="grid gap-4">
          {allUnits.map(u => (
            <div key={u.id} className="p-6 bg-[#0a0a0a] border border-[#333] flex flex-col sm:flex-row justify-between items-start sm:items-center hover:border-[var(--ab3-gold)] transition-all gap-4 group">
              <div>
                <h3 className="text-xl font-black text-white mb-1 font-heading tracking-widest uppercase group-hover:text-[var(--ab3-gold)] transition-colors">{u.name}</h3>
                <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">КОМАНДИР: {u.commanderRank || ''} {u.commanderName || 'НЕВІДОМО'}</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                {(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'commander') && (
                  <button onClick={() => handleDeleteFromList(u.id)} className="btn border border-red-900/50 bg-red-900/20 text-red-500 hover:bg-red-600 hover:text-white rounded-none px-4 flex-shrink-0 font-mono" title="Знищити">[X]</button>
                )}
                <button onClick={() => handleRequestJoin(u.id)} className="btn border border-[#333] bg-[#111] text-gray-400 hover:text-black hover:bg-[var(--ab3-gold)] hover:border-[var(--ab3-gold)] rounded-none whitespace-nowrap flex-1 sm:flex-auto font-mono uppercase tracking-widest text-xs px-6">Запит на переведення</button>
              </div>
            </div>
          ))}
        </div>
        
        {/* TACTICAL MODAL (Browse View) */}
        {modal?.isOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className={`bg-[#0a0a0a] border border-[#333] border-l-4 ${modal.type === 'alert' && modal.title === 'ПОМИЛКА' ? 'border-l-red-500' : 'border-l-[var(--ab3-gold)]'} p-8 max-w-md w-full shadow-[8px_8px_0_0_#111] animate-scale-in relative overflow-hidden`}>
              <div className={`absolute top-0 right-0 w-32 h-32 ${modal.type === 'alert' && modal.title === 'ПОМИЛКА' ? 'bg-red-500' : 'bg-[var(--ab3-gold)]'} opacity-10 blur-2xl pointer-events-none`}></div>
              <h3 className="text-xl font-heading font-black text-white uppercase tracking-widest mb-3 flex items-center gap-3">
                <span className={modal.type === 'alert' && modal.title === 'ПОМИЛКА' ? 'text-red-500' : 'text-[var(--ab3-gold)]'}>!</span> {modal.title}
              </h3>
              <p className="text-xs font-mono text-gray-400 mb-8 leading-relaxed uppercase tracking-widest">{modal.message}</p>
              <div className="flex gap-4">
                {modal.type === 'confirm' && (
                  <button onClick={modal.onConfirm} className="flex-1 bg-[var(--ab3-gold)] text-black font-mono font-bold uppercase tracking-widest px-4 py-3 hover:bg-yellow-400 transition-colors shadow-[4px_4px_0_0_rgba(201,162,39,0.2)]">ПІДТВЕРДИТИ</button>
                )}
                <button onClick={() => setModal(null)} className="flex-1 bg-[#111] border border-[#333] text-white font-mono font-bold uppercase tracking-widest px-4 py-3 hover:bg-[#222] transition-colors">{modal.type === 'alert' ? 'ЗАКРИТИ' : 'СКАСУВАТИ'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up max-w-6xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      
      <div className="bg-[#0a0a0a] border border-[#333] p-8 mb-6 relative overflow-hidden shadow-[8px_8px_0_0_#111]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--ab3-gold)] opacity-5 blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex-1 min-w-0 w-full">
            <p className="font-mono text-xs text-[var(--ab3-gold)] uppercase tracking-widest mb-2">// ШТАБ ПІДРОЗДІЛУ //</p>
          {isEditing ? (
              <div className="flex gap-2">
                <input value={editName} onChange={e=>setEditName(e.target.value)} className="bg-[#111] border border-[#333] text-white text-2xl md:text-4xl font-heading font-black uppercase tracking-widest px-4 py-2 focus:outline-none focus:border-[var(--ab3-gold)] w-full max-w-md" autoFocus />
                <button onClick={handleUpdateName} className="bg-green-600 text-white px-4 font-mono font-bold text-xs uppercase tracking-widest hover:bg-green-500">SAVE</button>
                <button onClick={()=>setIsEditing(false)} className="bg-[#222] text-white px-4 font-mono font-bold text-xs uppercase tracking-widest hover:bg-[#333]">ESC</button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <h1 className="text-3xl md:text-5xl font-heading font-black uppercase tracking-widest text-white truncate glitch-hover">{unit.name}</h1>
                {isCommanderOrAdmin && <button onClick={()=>setIsEditing(true)} className="text-gray-500 hover:text-[var(--ab3-gold)] text-xl transition-colors">⚙️</button>}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 border border-[#333] bg-[#111] p-1">
            <button onClick={handleLeaveUnit} className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-gray-400 hover:bg-[#222] hover:text-white transition-colors">ВІДРЯДЖЕННЯ (ВИЙТИ)</button>
            {isCommanderOrAdmin && (
              <button onClick={handleDeleteUnit} className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-red-500 hover:bg-red-950/50 hover:text-red-400 transition-colors">РОЗФОРМУВАТИ (ВИДАЛИТИ)</button>
            )}
          </div>
        </div>
      </div>

      <div className="flex border-b border-[#333] mb-4">
        <button onClick={() => setActiveTab('roster')} className={`px-6 py-3 font-mono font-bold uppercase tracking-widest text-xs transition-colors ${activeTab === 'roster' ? 'border-b-2 border-[var(--ab3-gold)] text-[var(--ab3-gold)] bg-[#111]' : 'text-gray-500 hover:text-white hover:bg-[#0a0a0a]'}`}>ОСОБОВИЙ СКЛАД</button>
        {isCommanderOrAdmin && (
          <>
            <button onClick={() => setActiveTab('requests')} className={`px-6 py-3 font-mono font-bold uppercase tracking-widest text-xs transition-colors ${activeTab === 'requests' ? 'border-b-2 border-[var(--ab3-gold)] text-[var(--ab3-gold)] bg-[#111]' : 'text-gray-500 hover:text-white hover:bg-[#0a0a0a]'}`}>ЗАПИТИ {requests.length > 0 && <span className="text-red-500 ml-1">({requests.length})</span>}</button>
            <button onClick={() => setActiveTab('add')} className={`px-6 py-3 font-mono font-bold uppercase tracking-widest text-xs transition-colors ${activeTab === 'add' ? 'border-b-2 border-[var(--ab3-gold)] text-[var(--ab3-gold)] bg-[#111]' : 'text-gray-500 hover:text-white hover:bg-[#0a0a0a]'}`}>РЕКРУТИНГ</button>
          </>
        )}
      </div>

      <div className="flex-1 bg-[#050505] border border-[#333] overflow-hidden flex flex-col relative shadow-xl">
        {activeTab === 'roster' ? (
          <div className="p-6 overflow-y-auto h-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#333] text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                  <th className="pb-3 px-4 font-normal">Звання</th>
                  <th className="pb-3 px-4 font-normal">ПІБ</th>
                  <th className="pb-3 px-4 font-normal">Посада</th>
                  <th className="pb-3 px-4 font-normal">Доступ</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id} className="border-b border-[#111] hover:bg-[#111] transition-colors">
                    <td className="py-4 px-4 text-[var(--ab3-gold)] font-bold font-heading tracking-widest uppercase">{m.rank || 'СОЛДАТ'}</td>
                    <td className="py-4 px-4 text-white font-bold">{m.lastName} {m.firstName} {m.middleName}</td>
                    <td className="py-4 px-4 text-gray-400 text-sm font-mono">{m.position || 'Стрілець'}</td>
                    <td className="py-4 px-4"><span className="px-2 py-1 bg-black text-[10px] text-gray-400 font-mono border border-[#333] tracking-widest uppercase">{m.role}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'requests' ? (
          <div className="p-6 overflow-y-auto">
            {requests.map(r => (
              <div key={r.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-[#0a0a0a] border border-[#333] mb-3 hover:border-[var(--ab3-gold)] transition-colors gap-4">
                <div>
                  <h4 className="text-white font-black font-heading uppercase tracking-widest text-lg">{r.rank} {r.lastName} {r.firstName} {r.middleName}</h4>
                  <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">{r.position}</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => handleActionReq(r.id, 'approve')} className="bg-green-900/30 border border-green-900 text-green-500 hover:bg-green-600 hover:text-white px-6 py-2 text-[10px] font-mono font-bold uppercase tracking-widest transition-colors flex-1 sm:flex-auto">ЗАРАХУВАТИ</button>
                  <button onClick={() => handleActionReq(r.id, 'reject')} className="bg-red-900/30 border border-red-900 text-red-500 hover:bg-red-600 hover:text-white px-6 py-2 text-[10px] font-mono font-bold uppercase tracking-widest transition-colors flex-1 sm:flex-auto">ВІДХИЛИТИ</button>
                </div>
              </div>
            ))}
            {requests.length === 0 && <p className="text-gray-500 text-center py-16 font-mono text-sm uppercase tracking-widest">/ ЗАПИТІВ НА ПЕРЕВЕДЕННЯ НЕ ВИЯВЛЕНО /</p>}
          </div>
        ) : (
          <div className="p-6 overflow-y-auto">
             <div className="flex gap-0 mb-8 border border-[#333] bg-[#111] p-1 focus-within:border-[var(--ab3-gold)] transition-colors">
                <span className="hidden sm:flex items-center pl-4 pr-2 font-mono text-[var(--ab3-gold)]">&gt;</span>
                <input className="flex-1 bg-transparent text-white font-mono text-sm uppercase tracking-widest px-3 py-3 outline-none placeholder-gray-600" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="ПОШУК ЗА ПРІЗВИЩЕМ..." />
                <button onClick={handleSearch} className="bg-[#222] hover:bg-[var(--ab3-gold)] hover:text-black text-white px-8 font-mono text-xs font-bold uppercase tracking-widest transition-colors">ШУКАТИ</button>
             </div>
             {searchResults.map(u => (
               <div key={u.id} className="flex justify-between items-center p-4 bg-[#0a0a0a] border border-[#333] mb-3 hover:border-blue-500 transition-colors gap-4">
                 <div>
                   <h4 className="text-white font-black font-heading uppercase tracking-widest text-lg">{u.rank} {u.lastName} {u.firstName} {u.middleName}</h4>
                   <p className="text-xs text-gray-500 font-mono tracking-widest uppercase">{u.position}</p>
                 </div>
                 <button onClick={() => handleForceAdd(u.id)} className="bg-blue-900/30 border border-blue-900 text-blue-400 hover:bg-blue-600 hover:text-white px-6 py-3 text-[10px] font-mono font-bold uppercase tracking-widest transition-colors">ВКЛЮЧИТИ В НАКАЗ</button>
               </div>
             ))}
          </div>
        )}
      </div>

      {/* TACTICAL MODAL (Dashboard View) */}
      {modal?.isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`bg-[#0a0a0a] border border-[#333] border-l-4 ${modal.type === 'alert' && modal.title === 'ПОМИЛКА' ? 'border-l-red-500' : 'border-l-[var(--ab3-gold)]'} p-8 max-w-md w-full shadow-[8px_8px_0_0_#111] animate-scale-in relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 w-32 h-32 ${modal.type === 'alert' && modal.title === 'ПОМИЛКА' ? 'bg-red-500' : 'bg-[var(--ab3-gold)]'} opacity-10 blur-2xl pointer-events-none`}></div>
            <h3 className="text-xl font-heading font-black text-white uppercase tracking-widest mb-3 flex items-center gap-3">
              <span className={modal.type === 'alert' && modal.title === 'ПОМИЛКА' ? 'text-red-500' : 'text-[var(--ab3-gold)]'}>!</span> {modal.title}
            </h3>
            <p className="text-xs font-mono text-gray-400 mb-8 leading-relaxed uppercase tracking-widest">{modal.message}</p>
            <div className="flex gap-4">
              {modal.type === 'confirm' && (
                <button onClick={modal.onConfirm} className="flex-1 bg-[var(--ab3-gold)] text-black font-mono font-bold uppercase tracking-widest px-4 py-3 hover:bg-yellow-400 transition-colors shadow-[4px_4px_0_0_rgba(201,162,39,0.2)]">ПІДТВЕРДИТИ</button>
              )}
              <button onClick={() => setModal(null)} className="flex-1 bg-[#111] border border-[#333] text-white font-mono font-bold uppercase tracking-widest px-4 py-3 hover:bg-[#222] transition-colors">{modal.type === 'alert' ? 'ЗАКРИТИ' : 'СКАСУВАТИ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};