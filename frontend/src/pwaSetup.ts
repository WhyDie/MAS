import { registerSW } from 'virtual:pwa-register';

export function setupPWA() {
  if ('serviceWorker' in navigator) {
    const updateSW = registerSW({
      onNeedRefresh() {
        if (confirm('Доступне нове оновлення Системи Адаптації. Оновити сторінку зараз?')) {
          updateSW(true);
        }
      },
      onOfflineReady() {
        console.log('Система закешована і повністю готова до роботи в офлайн-режимі.');
      },
    });
  }
}