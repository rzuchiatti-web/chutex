import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function PastelMistBackground() {
  const { isDark } = useTheme();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    ['pastel-mist-v3','pastel-mist-v4','pastel-mist-v5','pastel-mist-v6','pastel-mist-v7','clinic-bg'].forEach(id => {
      document.getElementById(id)?.remove();
    });

    // Load Inter font
    if (!document.getElementById('inter-font')) {
      const link = document.createElement('link');
      link.id = 'inter-font';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
      document.head.appendChild(link);
    }

    const style = document.createElement('style');
    style.id = 'clinic-bg';
    style.textContent = `
      * { font-family: 'Inter', system-ui, -apple-system, sans-serif !important; }

      body {
        background: ${isDark ? '#0f1318' : '#F5F6F8'} !important;
        color: ${isDark ? 'rgba(255,255,255,0.95)' : '#1A1D21'} !important;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      ::-webkit-scrollbar { width: 5px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'}; border-radius: 3px; }
    `;

    document.head.appendChild(style);
    return () => { document.getElementById('clinic-bg')?.remove(); };
  }, [isDark]);

  return null;
}
