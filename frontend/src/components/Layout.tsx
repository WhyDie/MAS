import React, { ReactNode, useState, useEffect, useRef, useMemo } from 'react';
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
      {
        path: '/slang',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="2"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="2"/></svg>,
        label: 'Словник Сленгу',
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
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/><path d="M23 21v-2a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth="2"/><path d="M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2"/></svg>,
    label: 'Мій Підрозділ',
    subItems: [
      {
        path: '/unit-dashboard',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M3 9h18" stroke="currentColor" strokeWidth="2"/><path d="M9 21V9" stroke="currentColor" strokeWidth="2"/></svg>,
        label: 'Склад та Запити',
      },
      {
        path: '/chat',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="2"/><path d="M12 12v.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><path d="M16 12v.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><path d="M8 12v.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>,
        label: 'Захищений Чат',
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
        path: '/visual-gear',
        icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" stroke="currentColor" strokeWidth="2"/></svg>,
        label: 'Тактичний Конструктор',
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

// === ТАКТИЧНІ ГЛОБАЛЬНІ ФІЛЬТРИ ===
const toggleRedLightMode = (enable: boolean) => {
  if (enable) {
    document.documentElement.style.filter = 'grayscale(1) sepia(1) hue-rotate(-50deg) saturate(5) brightness(0.7) contrast(1.2)';
    document.documentElement.style.backgroundColor = '#000';
  } else {
    document.documentElement.style.filter = '';
    document.documentElement.style.backgroundColor = '';
  }
};

// --- СЕКРЕТНИЙ КОМПОНЕНТ "МАТРИЦІ" (GOD MODE) ---
const MatrixRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Українська абетка + цифри + спецсимволи для брутального вигляду
    const chars = 'АБВГДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ0123456789$+-*/=%""\'#&_(),.;:?!\\|{}<>[]^~';
    const letters = chars.split('');
    const fontSize = 16;
    let columns = Math.floor(width / fontSize);
    let drops: number[] = [];

    for (let i = 0; i < columns; i++) drops[i] = Math.random() * -100;

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'; // Слід від падаючої літери
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#0f0'; // Хакерський зелений
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = letters[Math.floor(Math.random() * letters.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };

    const intervalId = setInterval(draw, 33);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      columns = Math.floor(width / fontSize);
      drops = [];
      for (let i = 0; i < columns; i++) drops[i] = Math.random() * -100;
    };
    window.addEventListener('resize', handleResize);

    return () => { clearInterval(intervalId); window.removeEventListener('resize', handleResize); };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden cursor-crosshair">
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full opacity-80" />
      <div className="relative z-10 flex flex-col items-center p-8 sm:p-12 border-2 border-green-500/40 bg-black/70 backdrop-blur-sm shadow-[0_0_50px_rgba(0,255,0,0.15)] animate-fade-in-up text-center">
        <h1 className="text-5xl md:text-8xl font-black text-green-500 uppercase tracking-widest animate-pulse drop-shadow-[0_0_15px_rgba(0,255,0,0.8)] font-mono mb-2">GOD MODE</h1>
        <p className="text-green-400 font-mono mt-6 text-xs md:text-sm uppercase tracking-widest border border-green-500/50 px-6 py-3 bg-green-950/30">СИСТЕМА ПІД ПОВНИМ КОНТРОЛЕМ</p>
        <p className="text-green-600 font-mono mt-6 text-[10px] uppercase tracking-widest animate-bounce">[ ПЕРЕЗАВАНТАЖТЕ СТОРІНКУ (F5) ДЛЯ ВИХОДУ З МАТРИЦІ ]</p>
      </div>
    </div>
  );
};

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
  const [logoClicks, setLogoClicks] = useState(0);
  const [isRedLight, setIsRedLight] = useState(false);

  // --- Search State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRefDesktop = useRef<HTMLDivElement>(null);
  const searchRefMobile = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        (!searchRefDesktop.current || !searchRefDesktop.current.contains(e.target as Node)) &&
        (!searchRefMobile.current || !searchRefMobile.current.contains(e.target as Node))
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const canAccessMenuItem = (item: MenuItem): boolean => {
    if (!item.roles || item.roles.length === 0) return true;
    return user ? item.roles.includes(user.role) : false;
  };

  const searchableItems = useMemo(() => {
    const items: { label: string; path: string; icon: React.ReactNode }[] = [];
    MODULE_MENU.forEach(item => {
      if (!canAccessMenuItem(item)) return;
      if (item.path && item.path !== '') items.push({ label: item.label, path: item.path, icon: item.icon });
      if (item.subItems) {
        item.subItems.forEach(sub => {
          if (canAccessMenuItem(sub) && sub.path && sub.path !== '') {
            items.push({ label: `${item.label} > ${sub.label}`, path: sub.path, icon: sub.icon });
          }
        });
      }
    });
    return items;
  }, [user?.role]);

  // --- Dead Man's Switch (Автовикид при неактивності) ---
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timeout);
      // 1 година без активності = авто-вихід (для безпеки пристрою на позиціях)
      timeout = setTimeout(() => {
        if (user) {
          logout();
          window.location.href = '/login';
        }
      }, 1000 * 60 * 60);
    };
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    resetTimer();
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      clearTimeout(timeout);
    };
  }, [user, logout]);

  const searchResults = searchableItems.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    toggleRedLightMode(isRedLight);
    return () => toggleRedLightMode(false);
  }, [isRedLight]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const executeLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/login');
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
              onClick={() => {
                setLogoClicks(prev => prev + 1);
                navigate('/');
              }}
              className="flex items-center gap-3 group relative"
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
              {logoClicks >= 7 && (
                <span className="absolute -bottom-6 left-14 text-[8px] font-mono text-[var(--ab3-gold)] animate-pulse tracking-widest whitespace-nowrap">GOD_MODE_UNLOCKED</span>
              )}
            </button>
          </div>

          {/* Right: User Info + Actions */}
          <div className="flex items-center gap-3">
            
            {/* Desktop Search */}
            <div className="hidden md:block relative w-64 lg:w-80 mr-2" ref={searchRefDesktop}>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
                </span>
                <input
                  type="text"
                  placeholder="Швидкий пошук..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-full pl-10 py-2 text-sm bg-[#111] border border-[#333] text-white focus:border-[var(--ab3-gold)] focus:outline-none transition-colors"
                />
              </div>
              
              {isSearchOpen && searchQuery && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-[#333] shadow-2xl z-50 max-h-96 overflow-y-auto animate-fade-in-up">
                  {searchResults.length > 0 ? (
                    <div className="p-2 space-y-1">
                      {searchResults.map(result => (
                        <button
                          key={result.path}
                          onClick={() => { handleNavigate(result.path); setIsSearchOpen(false); setSearchQuery(''); }}
                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#111] border border-transparent hover:border-[#333] transition-colors group"
                        >
                          <span className="text-[var(--ab3-gold)] opacity-70 group-hover:opacity-100 transition-opacity">{result.icon}</span>
                          <span className="text-sm font-bold text-gray-300 group-hover:text-white uppercase tracking-wider truncate">{result.label}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500 uppercase tracking-widest font-mono">
                      Нічого не знайдено
                    </div>
                  )}
                </div>
              )}
            </div>

        {/* Tactical Theme Toggle */}
        <button
          onClick={() => setIsRedLight(!isRedLight)}
          title="Режим Нічного Бачення (Red Light)"
          className={`hidden sm:flex items-center justify-center w-10 h-10 rounded-none border transition-all ${isRedLight ? 'bg-red-900 border-red-500 text-red-500 shadow-[0_0_15px_red]' : 'bg-[#111] border-[#333] text-gray-500 hover:border-red-500 hover:text-red-500'}`}
        >
          👁️
        </button>

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
            {/* Mobile Search */}
            <div className={`md:hidden mb-4 relative transition-all duration-300 ${sidebarCollapsed ? 'hidden' : 'block'}`} ref={searchRefMobile}>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg>
                </span>
                <input
                  type="text"
                  placeholder="Пошук по системі..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-full pl-9 py-2 text-xs bg-[#0a0a0a] border border-[#333] text-white focus:border-[var(--ab3-gold)] focus:outline-none transition-colors"
                />
              </div>
              
              {isSearchOpen && searchQuery && (
                <div className="mt-1 bg-[#0a0a0a] border border-[#333] z-50 max-h-60 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <div className="p-1 space-y-1">
                      {searchResults.map(result => (
                        <button
                          key={result.path}
                          onClick={() => { handleNavigate(result.path); setIsSearchOpen(false); setSearchQuery(''); }}
                          className="w-full flex items-center gap-2 p-2 text-left hover:bg-[#111] transition-colors"
                        >
                          <span className="text-[var(--ab3-gold)] scale-75 opacity-70">{result.icon}</span>
                          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider truncate">{result.label}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-[10px] text-gray-500 uppercase tracking-widest font-mono">
                      Нічого не знайдено
                    </div>
                  )}
                </div>
              )}
            </div>

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
                    {(user?.firstName || user?.lastName || (user as any)?.middleName) ? `${user?.lastName || ''} ${user?.firstName || ''} ${(user as any)?.middleName || ''}`.trim() : user?.email || 'Користувач'}
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
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0a0a0a] border border-[#333] border-l-4 border-l-[var(--ab3-gold)] p-8 max-w-md w-full shadow-[8px_8px_0_0_#111] animate-scale-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--ab3-gold)] opacity-10 blur-2xl pointer-events-none"></div>
            <h3 className="text-xl font-heading font-black text-white uppercase tracking-widest mb-3 flex items-center gap-3">
              <span className="text-[var(--ab3-gold)]">!</span> ВИХІД ІЗ СИСТЕМИ
            </h3>
            <p className="text-xs font-mono text-gray-400 mb-8 leading-relaxed uppercase tracking-widest">Чи точно ви бажаєте завершити поточний сеанс та вийти з акаунту?</p>
            <div className="flex gap-4">
              <button onClick={executeLogout} className="flex-1 bg-[var(--ab3-gold)] text-black font-mono font-bold uppercase tracking-widest px-4 py-3 hover:bg-yellow-400 transition-colors shadow-[4px_4px_0_0_rgba(201,162,39,0.2)]">ПІДТВЕРДИТИ</button>
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 bg-[#111] border border-[#333] text-white font-mono font-bold uppercase tracking-widest px-4 py-3 hover:bg-[#222] transition-colors">СКАСУВАТИ</button>
            </div>
          </div>
        </div>
      )}

      {/* God Mode Easter Egg */}
      {logoClicks >= 7 && <MatrixRain />}
    </div>
  );
};
