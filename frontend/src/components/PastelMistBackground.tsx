import { useEffect } from 'react';
import { Platform } from 'react-native';

export function PastelMistBackground() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    if (!document.getElementById('inter-font')) {
      const link = document.createElement('link');
      link.id = 'inter-font';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
      document.head.appendChild(link);
    }

    let style = document.getElementById('clinic-bg') as HTMLStyleElement;
    if (!style) {
      style = document.createElement('style');
      style.id = 'clinic-bg';
      document.head.appendChild(style);
    }

    style.textContent = `
      * { font-family: 'Inter', system-ui, -apple-system, sans-serif !important; box-sizing: border-box; }
      body { background: #FFFFFF !important; color: #111827 !important; -webkit-font-smoothing: antialiased; }
      @keyframes spin { to { transform: rotate(360deg); } }
      [role="tablist"] {
        position: fixed !important; bottom: 0 !important; left: 0 !important; right: 0 !important;
        background: #FFFFFF !important; border-top: 1px solid #E5E7EB !important;
        z-index: 99999 !important; height: 60px !important; padding-bottom: 4px !important;
      }
      [role="tablist"] ~ div, [role="tabpanel"] { padding-bottom: 70px !important; }
    `;
  }, []);

  return null;
}
