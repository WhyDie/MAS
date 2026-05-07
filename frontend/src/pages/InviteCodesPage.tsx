import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@stores/index';
import { authService } from '@services/api';

interface InviteCode {
  id: string;
  code: string;
  defaultRole: string;
  isUsed: boolean;
  usedByUserId?: string;
  usedAt?: string;
  expiresAt: string;
  createdAt: string;
}

export const InviteCodesPage: React.FC = () => {
  const { user } = useAuthStore();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newCode, setNewCode] = useState({ role: 'recruit', expiresIn: 7 });

  useEffect(() => { loadCodes(); }, []);

  const loadCodes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.getInviteCodes();
      setCodes(response.data.data.codes || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не вдалося завантажити коди');
    } finally { setLoading(false); }
  };

  const createCode = async () => {
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await authService.createInviteCode(newCode);
      const created = response.data.data;
      setCodes([created, ...codes]);
      setSuccess(`Код "${created.code}" успішно створено!`);
      setNewCode({ role: 'recruit', expiresIn: 7 });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Не вдалося створити код');
    } finally { setCreating(false); }
  };

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const canCreateCodes = user?.role === 'commander' || user?.role === 'admin' || user?.role === 'superadmin';

  const getAvailableRoles = () => {
    const roles = [{ value: 'recruit', label: 'Рекрут / Солдат' }];
    if (user?.role === 'admin' || user?.role === 'superadmin') {
      roles.push(
        { value: 'mentor', label: 'Ментор' },
        { value: 'commander', label: 'Командир' },
        { value: 'psychologist', label: 'Психолог' },
        { value: 'admin', label: 'Адміністратор' },
      );
      if (user?.role === 'superadmin') roles.push({ value: 'superadmin', label: 'Супер-Адміністратор' });
    } else if (user?.role === 'commander') {
      roles.push({ value: 'mentor', label: 'Ментор' });
    }
    return roles;
  };

  const getRoleLabel = (role: string): string => {
    const labels: Record<string, string> = { recruit: 'Рекрут', mentor: 'Ментор', commander: 'Командир', psychologist: 'Психолог', admin: 'Адмін', superadmin: 'Супер-Адмін' };
    return labels[role] || role;
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-heading font-black uppercase tracking-widest mb-2 text-white glitch-hover cursor-default">
          ТЕРМІНАЛ ДОСТУПУ
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest text-[var(--ab3-gold)]">
          // СИСТЕМА ГЕНЕРАЦІЇ КЛЮЧІВ АВТЕНТИФІКАЦІЇ //
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-950/20 border border-red-900 border-l-4 border-l-red-500 animate-slide-down">
          <div className="flex items-center gap-3 font-mono text-sm text-red-500 uppercase tracking-widest">
            <span>[ПОМИЛКА]</span> <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-950/20 border border-green-900 border-l-4 border-l-green-500 animate-slide-down">
          <div className="flex items-center gap-3 font-mono text-sm text-green-500 uppercase tracking-widest">
            <span>[ОК]</span> <span>{success}</span>
          </div>
        </div>
      )}

      {/* Create New Code Form */}
      {canCreateCodes && (
        <div className="p-8 bg-[#0a0a0a] border border-[#333] mb-12 shadow-[8px_8px_0_0_#111] relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--ab3-gold)] opacity-5 blur-[80px] pointer-events-none"></div>
          
          <div className="relative z-10">
            <h2 className="text-lg font-heading font-black text-[var(--ab3-gold)] mb-6 tracking-widest uppercase">
              ГЕНЕРАЦІЯ НОВОГО КЛЮЧА
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Цільова роль</label>
                <select value={newCode.role} onChange={(e) => setNewCode({ ...newCode, role: e.target.value })} className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 font-mono text-sm focus:border-[var(--ab3-gold)] focus:outline-none transition-colors rounded-none appearance-none cursor-pointer">
                  {getAvailableRoles().map((role) => <option key={role.value} value={role.value}>{role.label.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">Термін дії (ДІБ)</label>
                <input type="number" value={newCode.expiresIn} onChange={(e) => setNewCode({ ...newCode, expiresIn: parseInt(e.target.value) || 1 })} className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 font-mono text-sm focus:border-[var(--ab3-gold)] focus:outline-none transition-colors rounded-none" min="1" max="365" />
              </div>
              <div className="flex items-end">
                <button onClick={createCode} disabled={creating} className="w-full bg-[var(--ab3-gold)] text-black font-mono font-bold uppercase tracking-widest px-4 py-3 hover:bg-yellow-400 transition-colors shadow-[0_0_15px_rgba(201,162,39,0.2)] disabled:opacity-50 disabled:bg-[#333] disabled:text-gray-500 disabled:shadow-none">
                  {creating ? 'ОБРОБКА...' : 'ЗГЕНЕРУВАТИ'}
                </button>
              </div>
            </div>

            <div className="p-4 bg-[#111] border border-[#222] border-l-2 border-l-blue-500">
              <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest leading-relaxed">
                <strong className="text-blue-400">СИСТЕМНЕ ПОВІДОМЛЕННЯ:</strong> КОД БУДЕ ЗГЕНЕРОВАНО АВТОМАТИЧНО.
                {user?.role === 'commander' && ' РІВЕНЬ ДОСТУПУ: РЕКРУТИ ТА МЕНТОРИ.'}
                {user?.role === 'admin' && ' РІВЕНЬ ДОСТУПУ: ВЕСЬ ОСОБОВИЙ СКЛАД БАЗИ.'}
                {user?.role === 'superadmin' && ' РІВЕНЬ ДОСТУПУ: АБСОЛЮТНИЙ ПРИВІЛЕЙОВАНИЙ.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Codes List */}
      <div className="bg-[#050505] border border-[#333] shadow-[8px_8px_0_0_#111] animate-fade-in-up" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
        <div className="p-5 border-b border-[#333] bg-[#111] flex justify-between items-center">
          <h3 className="font-heading font-black text-white uppercase tracking-widest text-sm">РЕЄСТР АКТИВНИХ ТА АРХІВНИХ КОДІВ</h3>
        </div>

        {loading ? (
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="relative w-12 h-12 mb-4">
              <div className="absolute inset-0 border-2 border-[#333] rounded-full"></div>
              <div className="absolute inset-0 border-2 border-t-[var(--ab3-gold)] border-r-[var(--ab3-gold)] rounded-full animate-spin"></div>
            </div>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Отримання даних...</p>
          </div>
        ) : codes.length === 0 ? (
          <div className="p-16 text-center bg-[#0a0a0a]">
            <div className="text-4xl mb-4 opacity-50">⚠️</div>
            <h3 className="text-lg font-heading font-black mb-2 text-white uppercase tracking-widest">РЕЄСТР ПОРОЖНІЙ</h3>
            <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Система не виявила згенерованих ключів.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#222] bg-[#0a0a0a]">
                  {['Код', 'Роль', 'Статус', 'Дійсний до', 'Створено', 'Дії'].map((h) => (
                    <th key={h} className="p-5 text-[10px] font-mono text-gray-500 uppercase tracking-widest font-normal whitespace-nowrap text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => {
                  const isExpired = new Date(code.expiresAt) < new Date();
                  return (
                    <tr key={code.id} className="border-b border-[#111] hover:bg-[#111] transition-colors group">
                      <td className="p-5">
                        <code className="px-3 py-1.5 bg-black border border-[var(--ab3-gold)] text-[var(--ab3-gold)] font-mono text-sm tracking-widest shadow-[0_0_10px_rgba(201,162,39,0.1)] block w-max">
                          {code.code}
                        </code>
                      </td>
                      <td className="p-5">
                        <span className="px-2 py-1 bg-[#111] border border-[#333] text-[10px] text-gray-400 font-mono tracking-widest uppercase whitespace-nowrap">
                          {getRoleLabel(code.defaultRole)}
                        </span>
                      </td>
                      <td className="p-5">
                        {code.isUsed ? <span className="px-2 py-1 bg-red-900/20 border border-red-900 text-red-500 text-[10px] font-mono tracking-widest uppercase">ВИКОРИСТАНО</span> :
                         isExpired ? <span className="px-2 py-1 bg-[#222] border border-[#444] text-gray-500 text-[10px] font-mono tracking-widest uppercase">ПРОСТРОЧЕНО</span> :
                         <span className="px-2 py-1 bg-green-900/20 border border-green-900 text-green-500 text-[10px] font-mono tracking-widest uppercase">АКТИВНИЙ</span>}
                      </td>
                      <td className="p-5 text-gray-400 font-mono text-xs uppercase tracking-widest whitespace-nowrap">{new Date(code.expiresAt).toLocaleDateString('uk-UA')}</td>
                      <td className="p-5 text-gray-400 font-mono text-xs uppercase tracking-widest whitespace-nowrap">{new Date(code.createdAt).toLocaleDateString('uk-UA')}</td>
                      <td className="p-5">
                        {!code.isUsed && !isExpired && (
                          <button onClick={() => copyToClipboard(code.code, code.id)}
                            className={`px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest border transition-colors whitespace-nowrap ${
                              copiedId === code.id 
                                ? 'bg-green-900/30 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                                : 'bg-[#111] border-[#333] text-gray-400 hover:border-[var(--ab3-gold)] hover:text-[var(--ab3-gold)]'
                            }`}
                          >
                            {copiedId === code.id ? '[ СКОПІЙОВАНО ]' : 'КОПІЮВАТИ'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
