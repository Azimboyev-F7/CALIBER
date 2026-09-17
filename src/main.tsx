import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { PasswordRecoveryView } from './components/PasswordRecoveryView';
import './index.css';

// Prevent mouse wheel from inadvertently changing values in number inputs (scroll selecting)
if (typeof window !== 'undefined') {
  window.addEventListener(
    'wheel',
    (e) => {
      const active = document.activeElement;
      if (active instanceof HTMLInputElement && active.type === 'number') {
        active.blur();
      }
    },
    { passive: true }
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {window.location.pathname === '/reset-password' ? <PasswordRecoveryView /> : <App />}
  </StrictMode>,
);
