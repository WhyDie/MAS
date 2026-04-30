import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../stores/notificationStore';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    // Періодичне оновлення сповіщень кожні 3 хвилини
    const interval = setInterval(fetchNotifications, 180000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Закриття дропдауну при кліку поза ним
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (id: string, link?: string) => {
    markAsRead(id);
    setIsOpen(false);
    if (link) {
      navigate(link);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mentorship': return '🤝';
      case 'schedule': return '📅';
      case 'psychology': return '🧠';
      case 'report': return '📄';
      default: return '🔔';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 rounded-none border transition-all duration-300 hover:bg-[#111] bg-[#0a0a0a] border-[#333]"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-red-600 text-white text-[10px] font-bold rounded-full animate-pulse border border-black">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0a0a0a] border border-[#333] shadow-2xl z-50 animate-fade-in-up flex flex-col max-h-[80vh]">
          <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#111]">
            <h3 className="font-heading font-black uppercase tracking-widest text-white text-sm">Сигнали</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-[10px] font-mono text-[var(--ab3-gold)] hover:underline uppercase tracking-widest">
                Прочитано все
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <span className="text-4xl block mb-2 opacity-50">📭</span>
                <p className="text-xs font-mono text-[var(--text-muted)] uppercase tracking-widest">Немає нових сповіщень</p>
              </div>
            ) : (
              <div className="divide-y divide-[#222]">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n.id, n.link)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-[#151515] ${!n.isRead ? 'bg-[#0f0f0f]' : ''}`}
                    style={{ borderLeft: !n.isRead ? '3px solid var(--ab3-gold)' : '3px solid transparent' }}
                  >
                    <div className="flex gap-3 items-start">
                      <span className="text-2xl flex-shrink-0 mt-1">{getTypeIcon(n.type)}</span>
                      <div>
                        <h4 className={`text-sm font-bold mb-1 ${!n.isRead ? 'text-white' : 'text-gray-400'}`}>
                          {n.title}
                        </h4>
                        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-[10px] font-mono text-[var(--text-faint)] mt-2 uppercase">
                          {new Date(n.createdAt).toLocaleString('uk-UA')}
                        </p>
                      </div>
                    </div>
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