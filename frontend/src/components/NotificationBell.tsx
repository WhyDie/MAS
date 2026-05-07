import React, { useState, useEffect, useRef } from 'react';
import { api } from '@services/api';
import { useNavigate } from 'react-router-dom';

interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      const notificationsList = res.data.data || res.data || [];
      
      // Дедублікування - залишаємо тільки унікальні запити за ID
      const uniqueNotifications = Array.from(
        new Map(notificationsList.map((n: any) => [n.id, n])).values()
      );
      
      // Сортуємо за часом (новіші першими)
      uniqueNotifications.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setNotifications(uniqueNotifications);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {}
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {}
  };

  const clearAll = async () => {
    try {
      await api.delete('/notifications');
      // Миттєво очищуємо список на фронтенді
      setNotifications([]);
      // Перевіримо, що на бекенді також очищено
      setTimeout(() => fetchNotifications(), 500);
    } catch (e) {
      console.error('Error clearing notifications:', e);
      // Все одно спробуємо освіжити список
      fetchNotifications();
    }
  };

  const handleNotificationClick = (n: AppNotification) => {
    markAsRead(n.id);
    setIsOpen(false);
    if (n.type === 'announcement') navigate('/notice-board');
    else if (n.type === 'faq') navigate('/faq');
    else if (n.type === 'schedule') navigate('/schedule');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 rounded-none border transition-all duration-300 hover:-translate-y-0.5"
        style={{
          background: '#0a0a0a',
          border: unreadCount > 0 ? '1px solid var(--ab3-gold)' : '1px solid #333',
          color: unreadCount > 0 ? 'var(--ab3-gold)' : 'var(--text-muted)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-[#0a0a0a] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-[#0a0a0a] border border-[#333] shadow-2xl z-50 animate-fade-in-up origin-top-right">
          <div className="flex items-center justify-between p-3 border-b border-[#333] bg-[#111]">
            <h3 className="font-heading font-black uppercase tracking-widest text-sm text-white">Сповіщення</h3>
            <div className="flex gap-3">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs font-mono text-[var(--ab3-gold)] hover:underline">Прочитати</button>
              )}
              {notifications.length > 0 && (
                <button onClick={clearAll} className="text-xs font-mono text-red-500 hover:underline">Очистити</button>
              )}
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">📭 Немає нових сповіщень</div>
            ) : (
              <div className="divide-y divide-[#222]">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3 cursor-pointer transition-colors hover:bg-[#111] ${!n.isRead ? 'border-l-2 border-[var(--ab3-gold)] bg-[#1a1814]' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-sm text-white">{n.title}</span>
                      <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap ml-2">
                        {new Date(n.createdAt).toLocaleString('uk-UA', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: false
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 line-clamp-2">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
