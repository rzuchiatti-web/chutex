import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function PastelMistBackground() {
  const { isDark } = useTheme();
  const initialized = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    // Load Inter font once
    if (!document.getElementById('inter-font')) {
      const link = document.createElement('link');
      link.id = 'inter-font';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
      document.head.appendChild(link);
    }

    // Update theme CSS without removing/re-adding element (avoids Safari re-layout)
    let style = document.getElementById('clinic-bg') as HTMLStyleElement;
    if (!style) {
      style = document.createElement('style');
      style.id = 'clinic-bg';
      document.head.appendChild(style);
    }

    style.textContent = `
      * { font-family: 'Inter', system-ui, -apple-system, sans-serif !important; }
      body {
        background: ${isDark ? '#0f1318' : '#F5F6F8'} !important;
        color: ${isDark ? 'rgba(255,255,255,0.95)' : '#1A1D21'} !important;
        -webkit-font-smoothing: antialiased;
      }
    `;
    // NO cleanup - avoid removing/re-adding style elements which causes Safari to re-layout
  }, [isDark]);

  return null;
}
