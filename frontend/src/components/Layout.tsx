import React, { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore, useAuthStore } from '@stores/index';

interface LayoutProps {
  children: ReactNode;
}

interface MenuItem {
  path: string;
  icon: React.ReactNode;
  label: string;
  roles?: string[];
}

const roleLabels: Record<string, string> = {
  recruit: 'Боець',
  mentor: 'Ментор',
  commander: 'Командир',
  psychologist: 'Психолог',
  admin: 'Адмін',
  superadmin: 'Супер-Адмін',
};

const MODULE_MENU: MenuItem[] = [
  {
    path: '/',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/></svg>,
    label: 'Головна',
  },
  {
    path: '/unit-guide',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 21h18M3 7v14M21 7v14M6 11h4M6 15h4M14 11h4M14 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    label: 'Довідник по частині',
  },
  {
    path: '/ai-chat',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="2"/></svg>,
    label: 'AI Помічник',
  },
  {
    path: '/guide',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" strokeWidth="2"/></svg>,
    label: 'Путівник',
  },
  {
    path: '/onboarding',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>,
    label: 'Онбординг',
  },
  {
    path: '/training',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="2"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="2"/></svg>,
    label: 'Навчання',
  },
  {
    path: '/training-simulators',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="6" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="2"/><circle cx="15" cy="13" r="1" fill="currentColor"/><circle cx="18" cy="11" r="1" fill="currentColor"/></svg>,
    label: 'Симулятори',
  },
  {
    path: '/schedule',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>,
    label: 'Розпорядок',
  },
  {
    path: '/knowledge-base',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    label: 'База Знань',
  },
  {
    path: '/equipment',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 20h16" stroke="currentColor" strokeWidth="2"/><path d="M6 20V8a2 2 0 012-2h8a2 2 0 012 2v12" stroke="currentColor" strokeWidth="2"/><path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2"/></svg>,
    label: 'Екіпірування',
  },
  {
    path: '/psychological-support',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="2"/></svg>,
    label: 'Підтримка',
  },
  {
    path: '/mentorship',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/><circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M20 8v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M23 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    label: 'Менторство',
  },
  {
    path: '/commander-dashboard',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><line x1="12" y1="20" x2="12" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="18" y1="20" x2="18" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="20" x2="6" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    label: 'Панель Командира',
    roles: ['commander', 'admin', 'superadmin'],
  },
  {
    path: '/invite-codes',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    label: 'Коди Доступу',
    roles: ['commander', 'admin', 'superadmin'],
  },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const { panicButtonActive, activatePanicButton } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [hoverTimeout, setHoverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const canAccessMenuItem = (item: MenuItem): boolean => {
    if (!item.roles || item.roles.length === 0) return true;
    return user ? item.roles.includes(user.role) : false;
  };

  const isActivePath = (path: string): boolean => {
    if (path === '/') return location.pathname === '/';
    // Exact match or starts with path followed by / or end
    if (path === location.pathname) return true;
    return location.pathname.startsWith(path + '/') || location.pathname.startsWith(path + '?');
  };

  const handleNavigate = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const handleMouseEnter = () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    setSidebarCollapsed(false);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setSidebarCollapsed(true);
    }, 400);
    setHoverTimeout(timeout);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
      {/* Top Header Bar */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? 'rgba(8, 8, 8, 0.92)' : 'rgba(8, 8, 8, 0.6)',
          backdropFilter: 'blur(24px)',
          borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
        }}
      >
        <div className="flex items-center justify-between px-6 lg:px-8 py-4">
          {/* Left: Logo */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-xl transition-all"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-glass)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              {mobileMenuOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              )}
            </button>

            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 group"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:shadow-gold animate-float"
                style={{ background: 'var(--gradient-gold)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="#080808"/>
                </svg>
              </div>
              <div className="hidden md:block">
                <h1 className="text-sm font-heading font-extrabold tracking-widest text-gradient-gold">
                  СИСТЕМА АДАПТАЦІЇ
                </h1>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                  Збройні Сили України
                </p>
              </div>
            </button>
          </div>

          {/* Right: User Info + Actions */}
          <div className="flex items-center gap-3">
            {/* User Info - Clickable to go to Profile */}
            <button
              onClick={() => navigate('/profile')}
              className="hidden lg:flex items-center gap-3 pr-5 cursor-pointer transition-all duration-300 hover:opacity-80"
              style={{ borderRight: '1px solid var(--border-subtle)' }}
              title="Особистий кабінет"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold animate-glow-pulse"
                style={{ background: 'var(--gradient-olive)', color: 'var(--ab3-gold-light)' }}
              >
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.3' }}>
                  {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'Користувач'}
                </p>
                <span
                  className="text-[10px] px-2.5 py-0.5 rounded-full font-bold tracking-wide"
                  style={{ background: 'var(--ab3-gold-glow)', color: 'var(--ab3-gold-light)', border: '1px solid rgba(201, 162, 39, 0.2)' }}
                >
                  {roleLabels[user?.role || ''] || user?.role}
                </span>
              </div>
            </button>

            {/* SOS Button */}
            <button
              onClick={activatePanicButton}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${panicButtonActive ? 'animate-pulse-glow' : ''}`}
              style={{
                background: panicButtonActive ? 'var(--ab3-red-glow)' : 'transparent',
                border: `1px solid ${panicButtonActive ? 'rgba(239, 68, 68, 0.5)' : 'rgba(239, 68, 68, 0.2)'}`,
                color: '#f87171',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/></svg>
              <span className="hidden lg:inline">SOS</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
              style={{
                background: 'transparent',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-medium)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="hidden lg:inline">Вийти</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
        />
      )}

      <div className="flex flex-1 pt-20">
        {/* Sidebar Navigation - Collapsible on hover */}
        <aside
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={`fixed lg:sticky top-20 left-0 z-40 lg:z-auto flex flex-col transition-all duration-500 ease-in-out overflow-hidden ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}
          style={{
            height: 'calc(100vh - 5rem)',
            maxHeight: 'calc(100vh - 5rem)',
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-subtle)',
          }}
        >
          {/* Collapse indicator */}
          <div
            className="absolute top-1/2 -right-0.5 w-1 rounded-full transition-all duration-500"
            style={{
              height: sidebarCollapsed ? '60px' : '0px',
              background: 'var(--gradient-gold)',
              opacity: sidebarCollapsed ? 0.5 : 0,
            }}
          />

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1 min-h-0">
            {MODULE_MENU.map((item, index) => {
              if (!canAccessMenuItem(item)) return null;
              const isActive = isActivePath(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center rounded-xl transition-all duration-300 animate-fade-in-left ${
                    sidebarCollapsed ? 'justify-center p-3' : 'px-3 py-3 gap-3'
                  }`}
                  style={{
                    animationDelay: `${index * 0.04}s`,
                    animationFillMode: 'both',
                    background: isActive ? 'rgba(201, 162, 39, 0.12)' : 'transparent',
                    border: isActive ? '1px solid rgba(201, 162, 39, 0.25)' : '1px solid transparent',
                    color: isActive ? 'var(--ab3-gold)' : 'var(--text-muted)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--bg-glass-hover)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }
                  }}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0 transition-transform duration-300 hover:scale-110">
                    {item.icon}
                  </span>
                  <span
                    className={`font-medium whitespace-nowrap transition-all duration-300 ${
                      sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <div
              className={`rounded-xl transition-all duration-500 ${
                sidebarCollapsed ? 'p-2' : 'p-3'
              }`}
              style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)' }}
            >
              <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'var(--gradient-olive)', color: 'var(--ab3-gold-light)' }}
                >
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
                <div className={`flex-1 min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.3' }}>
                    {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'Користувач'}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 min-h-0" style={{ maxHeight: 'calc(100vh - 5rem)' }}>
          <div className="max-w-7xl mx-auto animate-fade-in-up" style={{ animationFillMode: 'both' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
