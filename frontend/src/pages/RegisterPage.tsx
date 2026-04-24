import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@services/api';
import { useAuthStore } from '@stores/index';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setToken, setError, error } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    inviteCode: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Паролі не збігаються');
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль повинен містити щонайменше 6 символів');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        inviteCode: formData.inviteCode,
      });

      const { data } = response.data;
      setUser(data.user);
      setToken(data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Помилка реєстрації');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96" style={{ background: 'radial-gradient(circle, rgba(74, 93, 35, 0.1) 0%, transparent 70%)' }} />

      <div className="w-full max-w-lg animate-scale-in relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 animate-float"
            style={{ background: 'var(--gradient-olive)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="#c9a227"/>
            </svg>
          </div>
          <h1 className="text-3xl font-heading font-black text-gradient-gold mb-3">
            РЕЄСТРАЦІЯ
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Створення облікового запису за кодом запрошення
          </p>
        </div>

        {/* Register Card */}
        <div
          className="p-8 rounded-2xl animate-fade-in-up"
          style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(20px)', border: '1px solid var(--border-subtle)' }}
        >
          {error && (
            <div className="mb-6 p-4 rounded-xl border" style={{ background: 'rgba(220, 38, 38, 0.1)', borderColor: 'rgba(220, 38, 38, 0.3)', color: '#f87171' }}>
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/></svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Імʼя</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="input" placeholder="Іван" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Прізвище</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="input" placeholder="Петренко" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="input" placeholder="your@email.com" required />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Пароль</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="input" placeholder="Мінімум 6 символів" required />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Повторіть пароль</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="input" placeholder="Повторіть пароль" required />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="inline mr-2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Код запрошення
              </label>
              <input type="text" name="inviteCode" value={formData.inviteCode} onChange={handleChange} className="input" placeholder="Введіть код від командира" required />
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Для реєстрації необхідний дійсний код запрошення
              </p>
            </div>

            <button type="submit" disabled={isLoading} className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed py-4 text-base">
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/></svg>
                  Реєстрація...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/><circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><line x1="20" y1="8" x2="20" y2="14" stroke="currentColor" strokeWidth="2"/><line x1="23" y1="11" x2="17" y2="11" stroke="currentColor" strokeWidth="2"/></svg>
                  Зареєструватися
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
              Вже маєте акаунт?{' '}
              <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--ab3-gold)' }}>
                Увійти в систему
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs mt-8" style={{ color: 'var(--text-muted)' }}>
          © 2026 Система Адаптації ЗСУ. Всі права захищені.
        </p>
      </div>
    </div>
  );
};
