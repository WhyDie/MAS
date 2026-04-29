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
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px', lineHeight: '1.2', letterSpacing: '1px' }}>
          🔑 Коди Доступу
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>
          Управління кодами запрошення для реєстрації нових користувачів
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-5 rounded-none border animate-slide-down" style={{ background: 'var(--ab3-red-glow)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
          <div className="flex items-center gap-3">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/></svg>
            <span style={{ fontSize: '15px', lineHeight: '1.5' }}>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-5 rounded-none border animate-slide-down bg-[#0a0a0a]" style={{ borderColor: 'rgba(34, 197, 94, 0.3)', color: '#4ade80' }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <span style={{ fontSize: '15px', lineHeight: '1.5' }}>{success}</span>
          </div>
        </div>
      )}

      {/* Create New Code Form */}
      {canCreateCodes && (
        <div
          className="p-6 rounded-none mb-8 animate-fade-in-up bg-[#0a0a0a] border border-[#333]"
          style={{ animationDelay: '0.1s', animationFillMode: 'both' }}
        >
          <h2 className="text-xl font-heading font-black uppercase tracking-widest mb-6" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>
            ➕ Створити новий код
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Роль користувача</label>
              <select value={newCode.role} onChange={(e) => setNewCode({ ...newCode, role: e.target.value })} className="input">
                {getAvailableRoles().map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Термін дії (днів)</label>
              <input type="number" value={newCode.expiresIn} onChange={(e) => setNewCode({ ...newCode, expiresIn: parseInt(e.target.value) })} className="input" min="1" max="365" />
            </div>
            <div className="flex items-end">
              <button onClick={createCode} disabled={creating} className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed" style={{ padding: '14px 20px', fontSize: '14px' }}>
                {creating ? '⏳ Створення...' : '🔑 Створити код'}
              </button>
            </div>
          </div>

          <div className="p-4 rounded-none" style={{ background: 'rgba(201, 162, 39, 0.08)', border: '1px dashed rgba(201, 162, 39, 0.3)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              <strong style={{ color: 'var(--ab3-gold)' }}>Інформація:</strong> Код буде згенеровано автоматично.
              {user?.role === 'commander' && ' Як командир, ви можете створювати коди для рекрутів та менторів.'}
              {user?.role === 'admin' && ' Як адміністратор, ви можете створювати коди для всіх ролей.'}
              {user?.role === 'superadmin' && ' Як супер-адмін, ви маєте повний доступ до створення кодів для всіх ролей.'}
            </p>
          </div>
        </div>
      )}

      {/* Codes List */}
      <div
        className="rounded-none overflow-hidden animate-fade-in-up bg-[#050505] border border-[#333]"
        style={{ animationDelay: '0.15s', animationFillMode: 'both' }}
      >
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <h2 className="text-xl font-heading font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)', fontSize: '22px' }}>
            📋 Існуючі коди
          </h2>
        </div>

        {loading ? (
          <div className="p-16 text-center bg-[#0a0a0a]">
            <svg className="animate-spin w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ab3-gold)' }} viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/>
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/>
            </svg>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>Завантаження кодів...</p>
          </div>
        ) : codes.length === 0 ? (
          <div className="p-16 text-center bg-[#0a0a0a]">
            <div className="text-6xl mb-4">🔑</div>
            <h3 className="text-lg font-heading font-bold mb-2" style={{ color: 'var(--text-primary)', fontSize: '18px' }}>Кодів ще не створено</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.6' }}>Створіть перший код доступу вище</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  {['Код', 'Роль', 'Статус', 'Дійсний до', 'Створено', 'Дії'].map((h) => (
                    <th key={h} style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '14px 18px', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {codes.map((code) => {
                  const isExpired = new Date(code.expiresAt) < new Date();
                  return (
                    <tr key={code.id} style={{ transition: 'background 0.25s ease' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <code className="px-3 py-1.5 rounded-none font-mono" style={{ background: '#111', color: 'var(--ab3-gold)', border: '1px solid #333', fontSize: '13px' }}>
                          {code.code}
                        </code>
                      </td>
                      <td style={{ padding: '14px 18px' }}><span className="badge badge-gold">{getRoleLabel(code.defaultRole)}</span></td>
                      <td style={{ padding: '14px 18px' }}>
                        {code.isUsed ? <span className="badge badge-danger">Використано</span> :
                         isExpired ? <span className="badge" style={{ background: 'rgba(138,138,138,0.15)', color: '#8a8a8a', border: '1px solid rgba(138,138,138,0.3)' }}>Прострочено</span> :
                         <span className="badge badge-success">Активний</span>}
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '14px 18px' }}>{new Date(code.expiresAt).toLocaleDateString('uk-UA')}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '14px', padding: '14px 18px' }}>{new Date(code.createdAt).toLocaleDateString('uk-UA')}</td>
                      <td style={{ padding: '14px 18px' }}>
                        {!code.isUsed && !isExpired && (
                          <button onClick={() => copyToClipboard(code.code, code.id)}
                            className="btn"
                            style={{
                              background: copiedId === code.id ? 'var(--ab3-green-glow)' : 'rgba(201, 162, 39, 0.1)',
                              borderColor: 'var(--ab3-gold)',
                              color: copiedId === code.id ? '#4ade80' : 'var(--ab3-gold)',
                              padding: '8px 14px',
                              fontSize: '12px',
                            }}
                          >
                            {copiedId === code.id ? '✓ Скопійовано' : '📋 Копіювати'}
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
