import React from 'react';
import ReactDOM from 'react-dom/client';
import { setupPWA } from './pwaSetup';
import App from './App';
import '@styles/index.css';

setupPWA();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
