import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function PastelMistBackground() {
  const { isDark } = useTheme();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    ['pastel-mist-v3', 'pastel-mist-v4', 'pastel-mist-v5', 'pastel-mist-v6', 'pastel-mist-v7', 'clinic-bg'].forEach(id => {
      document.getElementById(id)?.remove();
    });

    const style = document.createElement('style');
    style.id = 'clinic-bg';

    if (isDark) {
      style.textContent = `
        body { background: #000000 !important; color: rgba(255,255,255,0.92) !important; }
        body::before { content:""; position:fixed; inset:0; pointer-events:none; z-index:0;
          background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 64px 64px; }
        body::after { content:""; position:fixed; inset:0; pointer-events:none; z-index:0;
          background: radial-gradient(ellipse 60% 50% at 50% 30%, rgba(255,255,255,0.02) 0%, transparent 60%), radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%); }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
      `;
    } else {
      style.textContent = `
        body { background: #F5F6F8 !important; color: #1A1D21 !important; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 3px; }
      `;
    }

    document.head.appendChild(style);
    return () => { document.getElementById('clinic-bg')?.remove(); };
  }, [isDark]);

  return null;
}
