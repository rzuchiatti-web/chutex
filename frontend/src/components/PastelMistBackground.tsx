import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * PastelMistBackground v7 - Clean version, no DOM manipulation
 * Just sets body background with CSS gradients, no transparency hacks
 */
export function PastelMistBackground() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    // Clean all previous
    ['pastel-mist-v3', 'pastel-mist-v4', 'pastel-mist-v5', 'pastel-mist-v6', 'mist-container', 'mist-container-v4', 'mist-animated'].forEach(id => {
      document.getElementById(id)?.remove();
    });

    // Just set body background - subtle pastel
    const style = document.createElement('style');
    style.id = 'pastel-mist-v7';
    style.textContent = `
      body {
        background: #F5F0EB !important;
      }
    `;
    document.head.appendChild(style);

    return () => { document.getElementById('pastel-mist-v7')?.remove(); };
  }, []);

  return null;
}
