import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@stores/index';
import { api } from '@services/api';

interface TrainingStats {
  totalModules: number;
  completedModules: number;
  completionRate: number;
  inProgressModules: number;
  averageScore: number;
}

const roleLabels: Record<string, string> = {
  recruit: 'Боець',
  mentor: 'Ментор',
  commander: 'Командир',
  psychologist: 'Психолог',
  admin: 'Адміністратор',
  superadmin: 'Супер-Адміністратор',
};

const roleColors: Record<string, string> = {
  recruit: '#22c55e',
  mentor: '#3b82f6',
  commander: '#f59e0b',
  psychologist: '#ec4899',
  admin: '#8b5cf6',
  superadmin: '#ef4444',
};

const PREDEFINED_ICONS = ['👤', '🪖', '🦅', '🐺', '🦉', '🐻', '🐍', '⚡️', '⚔️', '🛡️'];

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'info' | 'progress' | 'settings'>('info');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [trainingStats, setTrainingStats] = useState<TrainingStats | null>(null);

  // Edit profile
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', callsign: '', rank: '', position: '', civilProfession: '', icon: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        callsign: (user as any).callsign || '',
        rank: user.rank || '',
        position: user.position || '',
        civilProfession: user.civilProfession || '',
        icon: (user as any).profilePictureUrl || (user as any).icon || '',
      });
    }
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const res = await api.get('/training/stats');
      setTrainingStats(res.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const saveProfile = async () => {
    try {
      setSavingProfile(true);
      // Надійно зберігаємо всі поля єдиним запитом
      await api.put('/users/profile-extended', profileForm);
      setUser({ ...user, ...profileForm, profilePictureUrl: profileForm.icon } as any);
      setSuccess('Профіль оновлено');
      setEditMode(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка збереження');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Паролі не збігаються');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setError('Пароль повинен містити щонайменше 6 символів');
      return;
    }
    try {
      setChangingPassword(true);
      // Відправляємо запит на зміну пароля
      await api.put('/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setSuccess('Пароль змінено');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm({ ...profileForm, icon: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  const roleColor = roleColors[user.role] || '#6b7280';

  const tabs = [
    { id: 'info' as const, label: '👤 Профіль' },
    { id: 'progress' as const, label: '📊 Прогрес' },
    { id: 'settings' as const, label: '⚙️ Налаштування' },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-primary)', fontSize: '32px' }}>
          ОСОБИСТИЙ КАБІНЕТ
        </h1>
        <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
          // ІДЕНТИФІКАЦІЯ, ПРОГРЕС, НАЛАШТУВАННЯ //
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 rounded-none border animate-slide-down bg-[#0a0a0a]" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
          <span>⚠️ {error}</span>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-none border animate-slide-down bg-[#0a0a0a]" style={{ borderColor: 'rgba(34, 197, 94, 0.3)', color: '#4ade80' }}>
          <span>✅ {success}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="p-3 rounded-none mb-8 bg-[#0a0a0a] border border-[#333]">
        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setError(''); setSuccess(''); }}
              className="btn"
              style={{
                background: activeTab === tab.id ? 'var(--gradient-gold)' : 'transparent',
                color: activeTab === tab.id ? 'var(--ab3-black)' : 'var(--text-muted)',
                border: `1px solid ${activeTab === tab.id ? 'var(--ab3-gold)' : '#333'}`,
                padding: '10px 18px',
                fontSize: '13px',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== PROFILE TAB ===== */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="p-6 rounded-none bg-[#0a0a0a] border border-[#333]">
              <div className="text-center mb-6">
                <div
                  className="w-24 h-24 rounded-none mx-auto flex items-center justify-center text-3xl font-black mb-4 border border-[#333]"
                  style={{ background: `${roleColor}20`, color: roleColor, border: `2px solid ${roleColor}40`, overflow: 'hidden' }}
                >
                  {(() => {
                    const currentIcon = editMode ? profileForm.icon : ((user as any).profilePictureUrl || (user as any).icon || '');
                    if (currentIcon && (currentIcon.startsWith('data:') || currentIcon.startsWith('http'))) {
                      return <img src={currentIcon} alt="Avatar" className="w-full h-full object-cover" />;
                    }
                    return currentIcon || (user.firstName ? `${user.firstName.charAt(0)}${user.lastName?.charAt(0) || ''}` : '👤');
                  })()}
                </div>
                <h2 className="text-xl font-heading font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>
                  {user.firstName} {user.lastName}
                </h2>
                {(user as any).callsign && <p className="text-sm font-bold text-[var(--ab3-gold)] mt-1">"{ (user as any).callsign }"</p>}
                <span className="badge rounded-none font-mono uppercase tracking-widest mt-2" style={{ background: `${roleColor}15`, color: roleColor, border: `1px solid ${roleColor}`, fontSize: '10px' }}>
                  {roleLabels[user.role] || user.role}
                </span>
              </div>

              {!editMode ? (
                <button onClick={() => setEditMode(true)} className="btn btn-primary w-full" style={{ padding: '12px 20px', fontSize: '14px' }}>✏️ Редагувати профіль</button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Ім'я</label>
                    <input className="input" value={profileForm.firstName} onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })} placeholder="Іван" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Прізвище</label>
                    <input className="input" value={profileForm.lastName} onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })} placeholder="Коваленко" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Позивний</label>
                    <input className="input" value={profileForm.callsign} onChange={e => setProfileForm({ ...profileForm, callsign: e.target.value })} placeholder="Сокіл" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Звання</label>
                    <input className="input" value={profileForm.rank} onChange={e => setProfileForm({ ...profileForm, rank: e.target.value })} placeholder="Рядовий" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Посада</label>
                    <input className="input" value={profileForm.position} onChange={e => setProfileForm({ ...profileForm, position: e.target.value })} placeholder="Стрілець" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Цивільна професія</label>
                    <input className="input" value={profileForm.civilProfession} onChange={e => setProfileForm({ ...profileForm, civilProfession: e.target.value })} placeholder="Інженер" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Іконка профілю</label>
                    <div className="flex flex-wrap gap-2">
                      {PREDEFINED_ICONS.map(icon => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setProfileForm({ ...profileForm, icon })}
                          className={`w-10 h-10 flex items-center justify-center text-xl rounded-none border transition-all ${profileForm.icon === icon ? 'border-[var(--ab3-gold)] bg-[rgba(201,162,39,0.15)]' : 'border-[#333] bg-[#111] hover:border-[#555]'}`}
                        >
                          {icon}
                        </button>
                      ))}
                      <input type="file" accept="image/*" id="avatar-upload" className="hidden" onChange={handleFileUpload} />
                      <label htmlFor="avatar-upload" className="px-3 h-10 flex items-center justify-center text-xs font-mono uppercase tracking-widest rounded-none border border-[#333] bg-[#111] hover:border-[#555] text-white cursor-pointer transition-all">
                        📷 ФОТО
                      </label>
                      <button
                        type="button"
                        onClick={() => setProfileForm({ ...profileForm, icon: '' })}
                        className={`px-3 h-10 flex items-center justify-center text-xs font-mono uppercase tracking-widest rounded-none border transition-all ${!profileForm.icon ? 'border-[var(--ab3-gold)] bg-[rgba(201,162,39,0.15)] text-[var(--ab3-gold)]' : 'border-[#333] bg-[#111] hover:border-[#555] text-white'}`}
                      >
                        бейзік
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveProfile} disabled={savingProfile} className="btn btn-primary flex-1 disabled:opacity-50" style={{ padding: '10px 16px', fontSize: '13px' }}>{savingProfile ? '⏳...' : '💾 Зберегти'}</button>
                    <button onClick={() => { setEditMode(false); setProfileForm({ firstName: user.firstName || '', lastName: user.lastName || '', callsign: (user as any).callsign || '', rank: user.rank || '', position: user.position || '', civilProfession: user.civilProfession || '', icon: (user as any).profilePictureUrl || (user as any).icon || '' }); }} className="btn flex-1" style={{ background: 'transparent', border: '1px solid #333', color: 'var(--text-muted)', padding: '10px 16px', fontSize: '13px' }}>Скасувати</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Info Cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-none bg-[#0a0a0a] border border-[#333]">
              <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>📋 Основна інформація</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-none bg-[#111]">
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>📧 Email</p>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user.email}</p>
                </div>
                <div className="p-4 rounded-none bg-[#111]">
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>🎖️ Звання</p>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user.rank || 'Не вказано'}</p>
                </div>
                <div className="p-4 rounded-none bg-[#111]">
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>💼 Посада</p>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user.position || 'Не вказано'}</p>
                </div>
                <div className="p-4 rounded-none bg-[#111]">
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>🏢 Цивільна професія</p>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{user.civilProfession || 'Не вказано'}</p>
                </div>
                <div className="p-4 rounded-none bg-[#111]">
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>🏷️ Роль</p>
                  <p className="font-semibold" style={{ color: roleColor }}>{roleLabels[user.role] || user.role}</p>
                </div>
                <div className="p-4 rounded-none bg-[#111]">
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>🆔 ID</p>
                  <p className="font-semibold font-mono text-xs" style={{ color: 'var(--text-primary)' }}>{user.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== PROGRESS TAB ===== */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          <div className="p-6 rounded-none bg-[#0a0a0a] border border-[#333]">
            <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>📊 Прогрес навчання</h3>
            {trainingStats ? (
              <div>
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Загальний прогрес</span>
                    <span className="text-sm font-bold" style={{ color: 'var(--ab3-gold)' }}>{trainingStats.completionRate}%</span>
                  </div>
                  <div className="w-full rounded-none h-4 overflow-hidden" style={{ background: 'var(--ab3-gray-800)' }}>
                    <div
                      className="h-full rounded-none transition-all duration-1000"
                      style={{ width: `${trainingStats.completionRate}%`, background: 'var(--gradient-gold)' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-5 rounded-none bg-[#111]">
                    <p className="text-4xl font-bold" style={{ color: '#22c55e' }}>{trainingStats.completedModules}</p>
                    <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Модулів завершено</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>з {trainingStats.totalModules}</p>
                  </div>
                  <div className="text-center p-5 rounded-none bg-[#111]">
                    <p className="text-4xl font-bold" style={{ color: '#3b82f6' }}>{trainingStats.inProgressModules}</p>
                    <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>В процесі</p>
                  </div>
                  <div className="text-center p-5 rounded-none bg-[#111]">
                    <p className="text-4xl font-bold" style={{ color: '#f59e0b' }}>{trainingStats.averageScore}%</p>
                    <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Середній бал</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h4 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Статистики немає</h4>
                <p style={{ color: 'var(--text-muted)' }}>Пройдіть хоча б один навчальний модуль</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== SETTINGS TAB ===== */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="p-6 rounded-none bg-[#0a0a0a] border border-[#333]">
            <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>🔒 Зміна паролю</h3>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Поточний пароль</label>
                <input type="password" className="input" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} placeholder="Введіть поточний пароль" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Новий пароль</label>
                <input type="password" className="input" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} placeholder="Мінімум 6 символів" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Підтвердіть пароль</label>
                <input type="password" className="input" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} placeholder="Повторіть новий пароль" />
              </div>
              <button onClick={changePassword} disabled={changingPassword} className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '14px' }}>{changingPassword ? '⏳...' : '🔑 Змінити пароль'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
