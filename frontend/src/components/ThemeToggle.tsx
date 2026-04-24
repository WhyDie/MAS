import React from 'react';
import { useUIStore } from '@stores/index';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useUIStore();

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setTheme('dark')}
        className={`px-3 py-1 rounded ${
          theme === 'dark' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'
        }`}
      >
        🌙 Dark
      </button>
      <button
        onClick={() => setTheme('red-light')}
        className={`px-3 py-1 rounded ${
          theme === 'red-light' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-300'
        }`}
      >
        🔴 Red Light
      </button>
    </div>
  );
};
