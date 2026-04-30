import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@stores/index';
import { api } from '@services/api';

interface TwoFactorSetup {
  otpAuthUrl?: string;
  secret?: string;
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
  const { user, setUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit profile
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', callsign: '', rank: '', position: '', civilProfession: '', icon: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Change password
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  // 2FA & Security state
  const [isAuthenticatorEnabled, setIsAuthenticatorEnabled] = useState(false);
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);
  const [isEmailCodeEnabled, setIsEmailCodeEnabled] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

  // Modal states
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteStep1, setShowDeleteStep1] = useState(false);
  const [showDeleteStep2, setShowDeleteStep2] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

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

      // Завантажуємо поточні налаштування 2FA
      const twoFactorStatus = (user as any).twoFactorStatus || {};
      setIsAuthenticatorEnabled(twoFactorStatus.isAuthenticatorEnabled || false);
      setIsBiometricsEnabled(twoFactorStatus.isBiometricsEnabled || false);
      setIsEmailCodeEnabled(twoFactorStatus.isEmailCodeEnabled || false);
    }
  }, [user]);

  const saveProfile = async () => {
    try {
      setSavingProfile(true);
      await api.put('/users/profile-extended', profileForm); // Використовуємо правильний ендпоінт
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
      await api.put('/users/change-password', { // Використовуємо правильний ендпоінт
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

  const handleToggleAuthenticator = async () => {
    if (isAuthenticatorEnabled) {
      try {
        await api.post('/auth/2fa/disable', { method: 'authenticator' });
        setIsAuthenticatorEnabled(false);
        setTwoFactorSetup(null);
        setSuccess('Аутентифікатор вимкнено.');
      } catch (err: any) { setError(err.response?.data?.error || 'Не вдалося вимкнути аутентифікатор'); }
    } else {
      try {
        const res = await api.post('/auth/2fa/generate-authenticator');
        setTwoFactorSetup(res.data.data);
      } catch (err: any) { setError(err.response?.data?.error || 'Не вдалося згенерувати QR-код'); }
    }
  };

  const handleVerifyAuthenticator = async () => {
    try {
      await api.post('/auth/2fa/verify-authenticator', { code: verificationCode });
      setIsAuthenticatorEnabled(true);
      setTwoFactorSetup(null);
      setVerificationCode('');
      setSuccess('Аутентифікатор увімкнено.');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Невірний код підтвердження');
    }
  };

  const handleToggleBiometrics = async () => {
    // Захист: вимагаємо наявність іншого способу
    if (!isAuthenticatorEnabled && !isEmailCodeEnabled && !isBiometricsEnabled) {
      setError('Для використання біометрії необхідно спочатку налаштувати Аутентифікатор або Пошту як резервний спосіб.');
      return;
    }
    try {
      if (isBiometricsEnabled) {
        await api.post('/auth/2fa/disable', { method: 'biometrics' });
        setIsBiometricsEnabled(false);
        setSuccess('Біометрію вимкнено.');
      } else {
        if (!window.PublicKeyCredential || !window.isSecureContext) {
          setError('Не можна активувати біометрію в цьому браузері.');
          return;
        }

        // Реальний виклик біометричного сенсора пристрою (FaceID / Відбиток)
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        const credential = await navigator.credentials.create({
          publicKey: {
            challenge: challenge,
            rp: { name: 'Military System', id: window.location.hostname },
            user: { id: new Uint8Array(16), name: user?.email || 'user', displayName: user?.email || 'user' },
            pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
            authenticatorSelection: { userVerification: 'required' },
            timeout: 60000,
            attestation: 'none'
          }
        }) as PublicKeyCredential;
        
        if (!credential) return; // Користувач скасував сканування
        await api.post('/auth/2fa/setup-biometrics', { credentialId: credential.id });
        setIsBiometricsEnabled(true);
        setSuccess('Біометрію увімкнено!');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка налаштування біометрії. Скасовано.');
    }
  };

  const handleToggleEmailCode = async () => {
    if (isEmailCodeEnabled) {
      await api.post('/auth/2fa/disable', { method: 'email' });
      setIsEmailCodeEnabled(false);
      setSuccess('Код на пошту вимкнено.');
    } else {
      const emailToUse = prompt('На яку пошту надсилати код? Залиште пустим, щоб використовувати пошту профілю.', user?.email);
      if (emailToUse !== null) {
        try {
          await api.post('/auth/2fa/setup-email', { email: emailToUse || user?.email });
          setIsEmailCodeEnabled(true);
          setSuccess(`Код на пошту увімкнено для ${emailToUse || user?.email}.`);
        } catch (err: any) {
          setError(err.response?.data?.error || 'Не вдалося підключити пошту');
        }
      }
    }
  };

  const executeDeleteAccount = async () => {
    if (deleteInput !== 'ВИДАЛИТИ') {
      setError('Невірне слово підтвердження. Акаунт не видалено.');
      setShowDeleteStep2(false);
      setDeleteInput('');
      return;
    }
    try {
      await api.delete('/users/me');
      setShowDeleteStep2(false);
      logout();
      navigate('/login');
    } catch (err) {
      setError('Не вдалося видалити акаунт.');
      setShowDeleteStep2(false);
    }
  };

  const executeLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const roleColor = roleColors[user.role] || '#6b7280';

  const tabs = [
    { id: 'info' as const, label: '👤 Профіль' },
    { id: 'security' as const, label: '🛡️ Безпека' },
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
                <div className="space-y-3">
                  <button onClick={() => setEditMode(true)} className="btn btn-primary w-full" style={{ padding: '12px 20px', fontSize: '14px' }}>✏️ Редагувати профіль</button>
                  <button onClick={() => setShowLogoutModal(true)} className="btn w-full" style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '12px 20px', fontSize: '14px' }}>🚪 Вийти з акаунту</button>
                </div>
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

      {/* ===== SECURITY TAB ===== */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="p-6 rounded-none bg-[#0a0a0a] border border-[#333]">
            <h3 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}> Безпека та пароль</h3>
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

          {/* 2FA */}
          <div className="p-4 sm:p-6 bg-[#0a0a0a] border border-[#333] mt-6">
            <h2 className="text-xl font-heading font-black uppercase tracking-widest mb-6" style={{ color: 'var(--text-primary)' }}>Двофакторна аутентифікація (2FA)</h2>
            <p className="text-sm text-gray-400 mb-6">Підвищіть безпеку свого акаунту, увімкнувши один або декілька методів перевірки.</p>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-[#333]"><div className="flex-1"><h3 className="font-bold text-white">📱 Додаток-аутентифікатор</h3><p className="text-xs text-gray-400 mt-1">Використовуйте Google Authenticator, Authy, або інший TOTP-додаток.</p></div><button onClick={handleToggleAuthenticator} className={`btn ${isAuthenticatorEnabled ? 'btn-danger' : 'btn-primary'}`}>{isAuthenticatorEnabled ? 'Вимкнути' : 'Увімкнути'}</button></div>
              {twoFactorSetup && (<div className="p-4 border border-[var(--ab3-gold)] bg-[#111] space-y-4"><p className="text-sm text-gray-300">1. Відскануйте QR-код за допомогою додатку-аутентифікатора.</p><div className="bg-white p-2 inline-block"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(twoFactorSetup.otpAuthUrl || '')}`} alt="QR Code" /></div><p className="text-sm text-gray-300">Або введіть цей ключ вручну:</p><p className="font-mono p-2 bg-black border border-[#333] text-center text-lg tracking-widest">{twoFactorSetup.secret}</p><p className="text-sm text-gray-300">2. Введіть 6-значний код з додатку для підтвердження.</p><div className="flex gap-2"><input className="input" placeholder="123456" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} /><button onClick={handleVerifyAuthenticator} className="btn btn-primary">Підтвердити</button></div></div>)}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-[#333]"><div className="flex-1"><h3 className="font-bold text-white">🖐️ Біометрія (Відбиток пальця / Face ID)</h3><p className="text-xs text-gray-400 mt-1">Використовуйте біометричні дані вашого пристрою для швидкого входу.</p></div><button onClick={handleToggleBiometrics} className={`btn ${isBiometricsEnabled ? 'btn-danger' : 'btn-primary'}`}>{isBiometricsEnabled ? 'Вимкнути' : 'Увімкнути'}</button></div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-[#333]"><div className="flex-1"><h3 className="font-bold text-white">✉️ Код на пошту</h3><p className="text-xs text-gray-400 mt-1">Отримуйте одноразовий код на вашу пошту при кожному вході.</p></div><button onClick={handleToggleEmailCode} className={`btn ${isEmailCodeEnabled ? 'btn-danger' : 'btn-primary'}`}>{isEmailCodeEnabled ? 'Вимкнути' : 'Увімкнути'}</button></div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="p-4 sm:p-6 bg-[#0a0a0a] border-2 border-red-500/50 mt-6">
            <h2 className="text-xl font-heading font-black uppercase tracking-widest mb-4 text-red-500">НЕБЕЗПЕЧНА ЗОНА</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div><h3 className="font-bold text-white">Видалення акаунту</h3><p className="text-xs text-gray-400 mt-1">Ця дія є незворотною. Всі ваші дані, прогрес та налаштування будуть видалені назавжди.</p></div>
              <button onClick={() => setShowDeleteStep1(true)} className="btn btn-danger">Видалити акаунт</button>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM MODALS --- */}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0a0a0a] border border-[#333] border-l-4 border-l-[var(--ab3-gold)] p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            <h3 className="text-xl font-heading font-black text-white uppercase tracking-widest mb-3">Вихід із системи</h3>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">Чи точно ви бажаєте завершити поточний сеанс та вийти з акаунту?</p>
            <div className="flex gap-3">
              <button onClick={executeLogout} className="btn btn-primary flex-1 py-3 text-sm">🚪 Вийти</button>
              <button onClick={() => setShowLogoutModal(false)} className="btn flex-1 py-3 text-sm" style={{ background: 'transparent', border: '1px solid #333', color: 'var(--text-muted)' }}>Скасувати</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Step 1 Modal */}
      {showDeleteStep1 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0a0a0a] border border-[#333] border-l-4 border-l-red-500 p-6 max-w-md w-full shadow-[0_0_40px_rgba(239,68,68,0.15)] animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-xl font-heading font-black text-red-500 uppercase tracking-widest">Критична дія</h3>
            </div>
            <p className="text-sm text-gray-300 mb-6 leading-relaxed">
              Чи точно ви бажаєте безповоротно видалити свій акаунт? Усі ваші дані, історія навчання, прогрес та налаштування будуть знищені. <strong className="text-red-400">Цю дію неможливо скасувати.</strong>
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setShowDeleteStep1(false); setShowDeleteStep2(true); setDeleteInput(''); }} className="btn btn-danger flex-1 py-3 text-sm">Так, видалити</button>
              <button onClick={() => setShowDeleteStep1(false)} className="btn flex-1 py-3 text-sm" style={{ background: 'transparent', border: '1px solid #333', color: 'var(--text-muted)' }}>Скасувати</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Step 2 Modal */}
      {showDeleteStep2 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0a0a0a] border border-[#333] border-l-4 border-l-red-500 p-6 max-w-md w-full shadow-[0_0_40px_rgba(239,68,68,0.15)] animate-scale-in">
            <h3 className="text-xl font-heading font-black text-red-500 uppercase tracking-widest mb-3">Остаточне підтвердження</h3>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Для підтвердження видалення введіть слово <strong className="text-red-500 tracking-widest">ВИДАЛИТИ</strong> у поле нижче:
            </p>
            <input 
              type="text" 
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="ВИДАЛИТИ"
              className="input w-full mb-6 font-mono text-center tracking-widest text-red-500 border-red-500/30 focus:border-red-500"
            />
            <div className="flex gap-3">
              <button onClick={executeDeleteAccount} disabled={deleteInput !== 'ВИДАЛИТИ'} className="btn btn-danger flex-1 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed">Знищити акаунт</button>
              <button onClick={() => { setShowDeleteStep2(false); setDeleteInput(''); }} className="btn flex-1 py-3 text-sm" style={{ background: 'transparent', border: '1px solid #333', color: 'var(--text-muted)' }}>Скасувати</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
