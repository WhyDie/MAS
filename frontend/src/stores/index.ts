import { create } from 'zustand';
import { User, UserPreferences } from '../types/index';

const getSavedUser = (): User | null => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const saved = localStorage.getItem('user');
    return saved ? (JSON.parse(saved) as User) : null;
  } catch {
    return null;
  }
};

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updatePreferences: (prefs: UserPreferences) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: getSavedUser(),
  token: localStorage.getItem('token'),
  isLoading: false,
  error: null,

  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    set({ user });
  },
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  updatePreferences: (prefs) =>
    set((state) => ({
      user: state.user ? { ...state.user, preferences: prefs } : null,
    })),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
}));

interface UIStore {
  sidebarOpen: boolean;
  notificationsOpen: boolean;
  panicButtonActive: boolean;

  toggleSidebar: () => void;
  toggleNotifications: () => void;
  activatePanicButton: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  notificationsOpen: false,
  panicButtonActive: false,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleNotifications: () =>
    set((state) => ({ notificationsOpen: !state.notificationsOpen })),
  activatePanicButton: () => {
    // Реалізація кнопки паніки
    console.log('Panic button activated');
    set({ panicButtonActive: true });
    setTimeout(() => set({ panicButtonActive: false }), 3000);
  },
}));
