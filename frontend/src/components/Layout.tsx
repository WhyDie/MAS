import React, { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@stores/index';
import { NotificationBell } from './NotificationBell';

interface LayoutProps {
  children: ReactNode;
}

interface MenuItem {
  path?: string;
  icon: React.ReactNode;
  label: string;
  roles?: string[];
  subItems?: MenuItem[];
}

const MODULE_MENU: MenuItem[] = [
  {
    path: '/',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2"/></svg>,
    label: 'Головна',
  },
  {
    path: '',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 21h18M3 7v14M21 7v14M6 11h4M6 15h4M14 11h4M14 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    label: 'Довідник частини',
    subItems: [
      {
        path: '/unit-guide',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 21h18M3 7v14M21 7v14M6 11h4M6 15h4M14 11h4M14 15h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
        label: 'Інфраструктура',
      },
      {
        path: '/notice-board',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
        label: 'Оголошення',
      },
      {
        path: '/faq',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
        label: 'FAQ',
      },
    ]
  },
  {
    path: '/ai-chat',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="2"/></svg>,
    label: 'AI Помічник',
  },
  {
    path: '',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="2"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="2"/></svg>,
    label: 'Навчання',
    subItems: [
      {
        path: '/onboarding',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>,
        label: 'Онбординг',
      },
      {
        path: '/training',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="2"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="2"/></svg>,
        label: 'Теорія',
      },
      {
        path: '/training-simulators',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="6" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="2"/><circle cx="15" cy="13" r="1" fill="currentColor"/><circle cx="18" cy="11" r="1" fill="currentColor"/></svg>,
        label: 'Симулятори',
      },
      {
        path: '/guide',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" strokeWidth="2"/></svg>,
        label: 'Путівник',
      },
      {
        path: '/achievements',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="7" stroke="currentColor" strokeWidth="2"/><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
        label: 'Досягнення',
      },
    ]
  },
  {
    path: '',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>,
    label: 'Служба',
    subItems: [
      {
        path: '/schedule',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/></svg>,
        label: 'Розпорядок',
      },
      {
        path: '/equipment',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 20h16" stroke="currentColor" strokeWidth="2"/><path d="M6 20V8a2 2 0 012-2h8a2 2 0 012 2v12" stroke="currentColor" strokeWidth="2"/><path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2"/></svg>,
        label: 'Екіпірування',
      },
      {
        path: '/reports',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
        label: 'Рапорти',
      },
    ]
  },
  {
    path: '',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="2"/></svg>,
    label: 'Підтримка',
    subItems: [
      {
        path: '/psychological-support',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="2"/></svg>,
        label: 'Психологічна',
      },
      {
        path: '/mentorship',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/><circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M20 8v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M23 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
        label: 'Менторство',
      },
    ]
  },
  {
    path: '',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><line x1="12" y1="20" x2="12" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="18" y1="20" x2="18" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="20" x2="6" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
    label: 'Управління',
    roles: ['mentor', 'psychologist', 'commander', 'admin', 'superadmin'],
    subItems: [
      {
        path: '/commander-dashboard',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><line x1="12" y1="20" x2="12" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="18" y1="20" x2="18" y2="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="20" x2="6" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
        label: 'Панель Командира',
        roles: ['commander', 'admin', 'superadmin'],
      },
      {
        path: '/mentor-dashboard',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M23 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="2"/><path d="M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2"/></svg>,
        label: 'Панель Ментора',
        roles: ['mentor', 'commander', 'admin', 'superadmin'],
      },
      {
        path: '/psychologist-dashboard',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M10 10h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
        label: 'Панель Психолога',
        roles: ['psychologist', 'commander', 'admin', 'superadmin'],
      },
      {
        path: '/invite-codes',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
        label: 'Коди Доступу',
        roles: ['commander', 'admin', 'superadmin'],
      },
    ]
  },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [hoverTimeout, setHoverTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const executeLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
  };

  const canAccessMenuItem = (item: MenuItem): boolean => {
    if (!item.roles || item.roles.length === 0) return true;
    return user ? item.roles.includes(user.role) : false;
  };

  const isActivePath = (path: string): boolean => {
    if (!path) return false;
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
          background: scrolled ? 'rgba(10, 10, 10, 0.95)' : 'rgba(10, 10, 10, 0.7)',
          backdropFilter: 'blur(24px)',
          borderBottom: scrolled ? '1px solid #333' : '1px solid transparent',
        }}
      >
        <div className="flex items-center justify-between px-6 lg:px-8 py-4">
          {/* Left: Logo */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex items-center justify-center w-10 h-10 rounded-none border border-[#333] transition-all bg-[#0a0a0a]"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ab3-gold)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
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
                className="w-11 h-11 rounded-none border border-[var(--ab3-gold)] bg-black flex items-center justify-center transition-all duration-300 group-hover:shadow-[0_0_15px_rgba(201,162,39,0.4)]"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="var(--ab3-gold)"/>
                </svg>
              </div>
              <div className="hidden md:block">
                <h1 className="text-sm font-heading font-black uppercase tracking-widest text-white">
                  СИСТЕМА АДАПТАЦІЇ
                </h1>
                <p className="font-mono text-[10px] uppercase tracking-widest mt-0.5" style={{ color: 'var(--ab3-gold)' }}>
                  // ЗБРОЙНІ СИЛИ УКРАЇНИ //
                </p>
              </div>
            </button>
          </div>

          {/* Right: User Info + Actions */}
          <div className="flex items-center gap-3">

            <NotificationBell />

            {/* Logout Button */}
            <button
              onClick={handleLogoutClick}
              className="flex items-center gap-2 px-4 py-2.5 rounded-none border font-mono text-xs uppercase tracking-widest font-bold transition-all duration-300 hover:-translate-y-0.5 active:scale-95"
              style={{
                background: '#0a0a0a',
                border: '1px solid #333',
                color: 'var(--text-muted)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ab3-gold)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span className="hidden lg:inline">ВИЙТИ</span>
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
              
              if (item.subItems && item.subItems.length > 0) {
                const isExpanded = expandedMenus[item.label];
                const isParentActive = item.subItems.some(sub => sub.path && isActivePath(sub.path));
                
                return (
                  <div key={item.label} className="space-y-1 animate-fade-in-left" style={{ animationDelay: `${index * 0.04}s`, animationFillMode: 'both' }}>
                    <button
                      onClick={() => {
                        setExpandedMenus(prev => ({ ...prev, [item.label]: !prev[item.label] }));
                        if (sidebarCollapsed) setSidebarCollapsed(false);
                      }}
                      className={`w-full flex items-center rounded-none transition-all duration-300 ${
                        sidebarCollapsed ? 'justify-center p-3' : 'px-3 py-3 gap-3'
                      }`}
                      style={{
                        background: isParentActive && sidebarCollapsed ? 'rgba(201, 162, 39, 0.12)' : 'transparent',
                        borderLeft: isParentActive && sidebarCollapsed ? '3px solid var(--ab3-gold)' : '3px solid transparent',
                        color: isParentActive && sidebarCollapsed ? 'var(--ab3-gold)' : 'var(--text-muted)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#111'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                      onMouseLeave={(e) => {
                        if (!(isParentActive && sidebarCollapsed)) {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = 'var(--text-muted)';
                        }
                      }}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <span className="flex-shrink-0 transition-transform duration-300 hover:scale-110">{item.icon}</span>
                      <span className={`flex-1 text-left font-heading font-black uppercase tracking-widest text-[11px] whitespace-nowrap transition-all duration-300 ${
                        sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
                      }`}>
                        {item.label}
                      </span>
                      {!sidebarCollapsed && (
                        <span className="flex-shrink-0 transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </span>
                      )}
                    </button>
                    
                    <div className={`overflow-hidden transition-all duration-300 ${isExpanded && !sidebarCollapsed ? 'max-h-96 opacity-100 mt-1 space-y-1' : 'max-h-0 opacity-0'}`}>
                      {item.subItems.map((sub) => {
                        if (!canAccessMenuItem(sub)) return null;
                        const isSubActive = sub.path ? isActivePath(sub.path) : false;
                        return (
                          <button
                            key={sub.path}
                            onClick={() => sub.path && handleNavigate(sub.path)}
                            className={`w-full flex items-center px-3 py-2 pl-10 rounded-none transition-all duration-300 gap-3`}
                            style={{ background: isSubActive ? 'rgba(201, 162, 39, 0.12)' : 'transparent', borderLeft: isSubActive ? '3px solid var(--ab3-gold)' : '3px solid transparent', color: isSubActive ? 'var(--ab3-gold)' : 'var(--text-muted)' }}
                            onMouseEnter={(e) => { if (!isSubActive) { e.currentTarget.style.background = '#111'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderLeft = '3px solid #333'; } }}
                            onMouseLeave={(e) => { if (!isSubActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderLeft = '3px solid transparent'; } }}
                          >
                            <span className="flex-shrink-0 scale-75 opacity-70">{sub.icon}</span>
                            <span className="font-heading font-black uppercase tracking-widest text-[10px] whitespace-nowrap">{sub.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              const isActive = item.path ? isActivePath(item.path) : false;
              return (
                <button
                  key={item.path || item.label}
                  onClick={() => item.path && handleNavigate(item.path)}
                  className={`w-full flex items-center rounded-none transition-all duration-300 animate-fade-in-left ${
                    sidebarCollapsed ? 'justify-center p-3' : 'px-3 py-3 gap-3'
                  }`}
                  style={{
                    animationDelay: `${index * 0.04}s`,
                    animationFillMode: 'both',
                    background: isActive ? 'rgba(201, 162, 39, 0.12)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--ab3-gold)' : '3px solid transparent',
                    color: isActive ? 'var(--ab3-gold)' : 'var(--text-muted)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = '#111';
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.borderLeft = '3px solid #333';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.borderLeft = '3px solid transparent';
                    }
                  }}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0 transition-transform duration-300 hover:scale-110">
                    {item.icon}
                  </span>
                  <span
                    className={`font-heading font-black uppercase tracking-widest text-[11px] whitespace-nowrap transition-all duration-300 ${
                      sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer (Profile Link) */}
          <div className="p-3" style={{ borderTop: '1px solid #333' }}>
            <button
              onClick={() => navigate('/profile')}
              title="Особистий кабінет"
              className={`w-full text-left rounded-none transition-all duration-300 bg-[#0a0a0a] border border-[#333] hover:border-[var(--ab3-gold)] hover:bg-[#111] group ${
                sidebarCollapsed ? 'p-2 flex justify-center' : 'p-3'
              }`}
            >
              <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                <div
                  className="w-10 h-10 rounded-none border border-[#333] bg-[#111] flex items-center justify-center text-xs font-bold flex-shrink-0 group-hover:border-[var(--ab3-gold)] transition-colors duration-300 overflow-hidden"
                  style={{ color: 'var(--ab3-gold)' }}
                >
                {((user as any)?.profilePictureUrl || (user as any)?.icon) && (((user as any).profilePictureUrl || (user as any).icon).startsWith('data:') || ((user as any).profilePictureUrl || (user as any).icon).startsWith('http')) ? (
                  <img src={(user as any).profilePictureUrl || (user as any).icon} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                  (user as any)?.profilePictureUrl || (user as any)?.icon || (user?.firstName ? `${user.firstName.charAt(0)}${user.lastName?.charAt(0) || ''}` : '👤')
                  )}
                </div>
                <div className={`flex-1 min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                  <p className="font-heading font-black uppercase tracking-wider truncate group-hover:text-[var(--ab3-gold)] transition-colors duration-300" style={{ color: 'var(--text-primary)', fontSize: '13px', lineHeight: '1.3' }}>
                    {(user?.firstName || user?.lastName) ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() : user?.email || 'Користувач'}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-widest truncate" style={{ color: 'var(--text-faint)' }}>
                    {user?.email}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 min-h-0" style={{ maxHeight: 'calc(100vh - 5rem)' }}>
          <div className="max-w-7xl mx-auto animate-fade-in-up" style={{ animationFillMode: 'both' }}>
            {children}
          </div>
        </main>
      </div>

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
    </div>
  );
};
