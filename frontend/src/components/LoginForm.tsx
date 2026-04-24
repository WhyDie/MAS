import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@stores/index';
import { authService } from '@services/api';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setToken, setError, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(email, password);
      const { data } = response.data;

      setUser(data.user);
      setToken(data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Помилка входу. Перевірте дані.');
    } finally {
      setIsLoading(false);
    }
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
            className="inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-8 animate-float"
            style={{ background: 'var(--gradient-gold)', boxShadow: '0 8px 50px rgba(201, 162, 39, 0.3)' }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="#080808"/>
            </svg>
          </div>
          <h1 className="text-5xl font-heading font-black text-gradient-gold mb-4 animate-glow-pulse" style={{ letterSpacing: '3px', lineHeight: '1.1' }}>
            СИСТЕМА АДАПТАЦІЇ
          </h1>
          <p className="text-base" style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: '1.6' }}>
            Збройні Сили України
          </p>
        </div>

        {/* Login Card */}
        <div
          className="p-8 rounded-3xl animate-fade-in-up"
          style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(24px)', border: '1px solid var(--border-subtle)', animationDelay: '0.2s', animationFillMode: 'both' }}
        >
          <h2 className="text-2xl font-heading font-bold mb-8 text-center" style={{ color: 'var(--text-primary)', fontSize: '24px', lineHeight: '1.3' }}>
            Вхід до системи
          </h2>

          {error && (
            <div className="mb-6 p-4 rounded-2xl border animate-slide-down" style={{ background: 'var(--ab3-red-glow)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/></svg>
                <span style={{ fontSize: '14px', lineHeight: '1.5' }}>{error}</span>
              </div>
            </div>
          )}

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

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed py-4 text-base"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25"/><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75"/></svg>
                  Вхід...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Увійти
                </>
              )}
            </button>
          </form>

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
