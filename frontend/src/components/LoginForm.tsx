import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@stores/index';
import { authService } from '@services/api';
import { api } from '@services/api';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setToken, setError, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 2FA states
  const [loginStep, setLoginStep] = useState<'credentials' | '2fa' | 'forgot-request' | 'forgot-confirm'>('credentials');
  const [tempToken, setTempToken] = useState('');
  const [available2FAMethods, setAvailable2FAMethods] = useState<string[]>([]);
  const [selected2FAMethod, setSelected2FAMethod] = useState<string>('');
  const [twoFaCode, setTwoFaCode] = useState('');
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  
  // Forgot password states
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [modal, setModal] = useState<{isOpen: boolean, title: string, message: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(email, password);
      const { data } = response.data;

      // Якщо потрібна двофакторка, блокуємо вхід і показуємо другий крок
      if (data.require2FA) {
        setTempToken(data.tempToken);
        setAvailable2FAMethods(data.methods);
        setSelected2FAMethod(data.methods[0]);
        setLoginStep('2fa');
        return;
      }

      setUser(data.user);
      setToken(data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка входу. Перевірте дані.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e?: React.FormEvent, credentialId?: string) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/2fa/verify-login', { tempToken, method: selected2FAMethod, code: twoFaCode, credentialId });
      const { data } = response.data;
      setUser(data.user);
      setToken(data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Невірний код або метод перевірки.');
    } finally { setIsLoading(false); }
  };

  const handleSendEmailCode = async () => {
    try {
      // Використовуємо правильний ендпоінт для надсилання коду
      await api.post('/auth/2fa/send-login-email', { tempToken });
      setEmailCodeSent(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Не вдалося надіслати код на пошту.');
    }
  };

  const handleBiometricLogin = async () => {
    try {
      if (!window.PublicKeyCredential || !window.isSecureContext) {
        setError('Не можна активувати біометрію в цьому браузері.');
        return;
      }

      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);
      const assertion = await navigator.credentials.get({ 
        publicKey: { challenge: challenge, timeout: 60000, userVerification: 'required' } 
      }) as PublicKeyCredential;
      
      if (!assertion) return; // Користувач скасував
      handleVerify2FA(undefined, assertion.id);
    } catch (err) { setError('Не вдалося перевірити біометрію.'); }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(null);
    try {
      const res = await api.post('/auth/password-reset/request', { email: resetEmail });
      setModal({ isOpen: true, title: 'ЗАПИТ ВІДПРАВЛЕНО', message: res.data.message || 'Запит відправлено адміністратору. Очікуйте.' });
      setLoginStep('forgot-confirm');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка відправки запиту.');
    } finally { setIsLoading(false); }
  };

  const handleForgotConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return setError('Мінімум 6 символів');
    setIsLoading(true); setError(null);
    try {
      const res = await api.post('/auth/password-reset/confirm', { 
        email: resetEmail, 
        code: resetCode, 
        newPassword 
      });
      setModal({ isOpen: true, title: 'ПАРОЛЬ ЗМІНЕНО', message: res.data.message || 'Пароль успішно змінено!' });
      setResetEmail('');
      setResetCode('');
      setNewPassword('');
      setLoginStep('credentials');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка відновлення пароля.');
    } finally { setIsLoading(false); }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-pattern" />
      <div
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] animate-float"
        style={{ background: 'radial-gradient(circle, rgba(201, 162, 39, 0.06) 0%, transparent 70%)', animationDelay: '0s' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] animate-float"
        style={{ background: 'radial-gradient(circle, rgba(74, 93, 35, 0.1) 0%, transparent 70%)', animationDelay: '1.5s' }}
      />

      <div className="w-full max-w-md animate-scale-in relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-none mb-8 border-2 border-[var(--ab3-gold)] bg-black"
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="var(--ab3-gold)"/>
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-heading font-black uppercase tracking-widest text-white mb-4" style={{ lineHeight: '1.1' }}>
            СИСТЕМА АДАПТАЦІЇ
          </h1>
          <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'var(--ab3-gold)' }}>
            // ЗБРОЙНІ СИЛИ УКРАЇНИ //
          </p>
        </div>

        {/* Login Card */}
        <div
          className="p-6 sm:p-8 rounded-none animate-fade-in-up bg-[#0a0a0a] border border-[#333]"
          style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
        >
          <h2 className="text-2xl font-heading font-black uppercase tracking-widest mb-8 text-center" style={{ color: 'var(--text-primary)', fontSize: '24px', lineHeight: '1.3' }}>
            ВХІД ДО СИСТЕМИ
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-none border animate-slide-down bg-[#0a0a0a]" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/></svg>
                <span style={{ fontSize: '14px', lineHeight: '1.5' }}>{error}</span>
              </div>
            </div>
          )}

          {loginStep === 'credentials' ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="inline mr-2 -mt-0.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/><polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/></svg>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="inline mr-2 -mt-0.5"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2"/></svg>
                  Пароль
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="Введіть пароль"
                  required
                />
              </div>
              <button type="submit" disabled={isLoading} className="btn btn-primary rounded-none uppercase tracking-widest font-bold w-full disabled:opacity-50 disabled:cursor-not-allowed py-4 text-base">
                {isLoading ? 'Вхід...' : 'Увійти'}
              </button>
              <div className="text-center mt-4">
                <button type="button" onClick={() => setLoginStep('forgot-request')} className="text-xs font-mono text-gray-500 hover:text-[var(--ab3-gold)] transition-colors uppercase tracking-widest">
                  [ Забули пароль? ]
                </button>
              </div>
            </form>
          ) : loginStep === '2fa' ? (
            // --- 2FA STEP ---
            <form onSubmit={handleVerify2FA} className="space-y-6 animate-scale-in">
              <div className="p-4 bg-[#111] border border-[#333] mb-4">
                <p className="text-sm text-[var(--ab3-gold)] font-bold mb-2">🛡️ Двофакторна перевірка</p>
                <select className="input w-full" value={selected2FAMethod} onChange={e => { setSelected2FAMethod(e.target.value); setEmailCodeSent(false); setTwoFaCode(''); }}>
                  {available2FAMethods.includes('authenticator') && <option value="authenticator">📱 Додаток-аутентифікатор</option>}
                  {available2FAMethods.includes('email') && <option value="email">✉️ Код на електронну пошту</option>}
                  {available2FAMethods.includes('biometrics') && <option value="biometrics">🖐️ Біометрія (FaceID / Відбиток)</option>}
                </select>
              </div>

              {selected2FAMethod === 'authenticator' && (
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Код з додатку (6 цифр)</label>
                  <input type="text" value={twoFaCode} onChange={(e) => setTwoFaCode(e.target.value)} className="input text-center text-2xl tracking-[0.5em] font-mono" placeholder="000000" maxLength={6} required />
                  <button type="submit" disabled={isLoading || twoFaCode.length !== 6} className="btn btn-primary w-full mt-4 py-4">Підтвердити вхід</button>
                </div>
              )}

              {selected2FAMethod === 'email' && (
                <div>
                  {!emailCodeSent ? (
                    <button type="button" onClick={handleSendEmailCode} className="btn w-full py-4 bg-[#111] border border-[var(--ab3-gold)] text-[var(--ab3-gold)] font-bold">Надіслати код на пошту</button>
                  ) : (
                    <div className="animate-fade-in-up">
                      <label className="block text-sm font-semibold mb-3 text-green-500">Код надіслано!</label>
                      <input type="text" value={twoFaCode} onChange={(e) => setTwoFaCode(e.target.value)} className="input text-center text-2xl tracking-[0.5em] font-mono" placeholder="000000" maxLength={6} required />
                      <button type="submit" disabled={isLoading || twoFaCode.length !== 6} className="btn btn-primary w-full mt-4 py-4">Підтвердити вхід</button>
                    </div>
                  )}
                </div>
              )}

              {selected2FAMethod === 'biometrics' && (
                <button type="button" onClick={handleBiometricLogin} className="btn w-full py-4 bg-[#111] border border-[var(--ab3-gold)] text-[var(--ab3-gold)] font-bold text-lg">
                  🖐️ Сканувати біометрію
                </button>
              )}
              <button type="button" onClick={() => setLoginStep('credentials')} className="w-full text-center text-xs text-gray-500 mt-4 hover:text-white">Скасувати</button>
            </form>
          ) : loginStep === 'forgot-request' ? (
            // --- FORGOT PASSWORD REQUEST ---
            <form onSubmit={handleForgotRequest} className="space-y-6 animate-scale-in">
              <p className="text-sm font-mono text-gray-400 text-center uppercase tracking-widest mb-4">
                ВВЕДІТЬ EMAIL ДЛЯ ЗАПИТУ ДО АДМІНІСТРАТОРА
              </p>
              <div>
                <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="input text-center font-mono" placeholder="EMAIL" required />
              </div>
              <button type="submit" disabled={isLoading} className="btn bg-[var(--ab3-gold)] text-black w-full py-4 font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(201,162,39,0.2)]">
                {isLoading ? 'ОБРОБКА...' : 'ВІДПРАВИТИ ЗАПИТ'}
              </button>
              <button type="button" onClick={() => setLoginStep('credentials')} className="w-full text-center text-xs font-mono text-gray-500 hover:text-white uppercase tracking-widest mt-2">← ПОВЕРНУТИСЯ</button>
            </form>
          ) : (
            // --- FORGOT PASSWORD CONFIRM ---
            <form onSubmit={handleForgotConfirm} className="space-y-6 animate-scale-in">
              <div className="p-4 bg-yellow-950/20 border border-yellow-900 mb-4 text-center">
                <p className="text-[10px] font-mono text-yellow-500 uppercase tracking-widest">
                  Якщо Адміністратор підтвердив ваш запит, ви отримали код на пошту (або особисто). Введіть його нижче.
                </p>
              </div>
              <div>
                <input type="text" value={resetCode} onChange={(e) => setResetCode(e.target.value)} className="input text-center text-xl tracking-[0.5em] font-mono mb-4" placeholder="КОД (6 ЦИФР)" required />
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input text-center font-mono" placeholder="НОВИЙ ПАРОЛЬ" required />
              </div>
              <button type="submit" disabled={isLoading || resetCode.length < 5} className="btn bg-[var(--ab3-gold)] text-black w-full py-4 font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(201,162,39,0.2)]">
                {isLoading ? 'ОБРОБКА...' : 'ВСТАНОВИТИ ПАРОЛЬ'}
              </button>
              <button type="button" onClick={() => setLoginStep('forgot-request')} className="w-full text-center text-xs font-mono text-gray-500 hover:text-white uppercase tracking-widest mt-2">← СТВОРИТИ НОВИЙ ЗАПИТ</button>
            </form>
          )}

          <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p className="text-sm text-center" style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
              Не маєте акаунту?{' '}
              <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--ab3-gold)' }}>
                Реєстрація за кодом запрошення
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-10" style={{ color: 'var(--text-faint)', fontSize: '12px', lineHeight: '1.5' }}>
          © 2026 Система Адаптації ЗСУ. Всі права захищені.
        </p>
      </div>
    </div>
  );
};
