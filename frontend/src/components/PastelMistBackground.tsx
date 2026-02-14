import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * PastelMistBackground v5 - Safari mobile compatible
 * Uses CSS pseudo-elements on body + absolute positioned divs
 * No position:fixed (breaks on Safari iOS with transforms)
 */
export function PastelMistBackground() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    // Clean previous versions
    ['pastel-mist-v3', 'pastel-mist-v4', 'pastel-mist-v5', 'mist-container', 'mist-container-v4'].forEach(id => {
      document.getElementById(id)?.remove();
    });

    const style = document.createElement('style');
    style.id = 'pastel-mist-v5';
    style.textContent = `
      body {
        background: 
          radial-gradient(ellipse 500px 500px at 35% 5%, rgba(248,212,180,0.55) 0%, rgba(230,168,124,0.3) 40%, transparent 70%),
          radial-gradient(ellipse 550px 550px at 5% 25%, rgba(233,166,176,0.50) 0%, rgba(214,123,138,0.25) 40%, transparent 70%),
          radial-gradient(ellipse 350px 350px at 25% 15%, rgba(222,141,141,0.40) 0%, rgba(230,168,124,0.2) 40%, transparent 70%),
          radial-gradient(ellipse 650px 650px at 20% 55%, rgba(176,168,201,0.45) 0%, rgba(196,162,180,0.2) 40%, transparent 70%),
          radial-gradient(ellipse 400px 400px at 55% 40%, rgba(151,176,214,0.30) 0%, rgba(176,168,201,0.15) 40%, transparent 70%),
          #FFFFFF !important;
        background-attachment: fixed !important;
        min-height: 100vh;
      }
      @supports (-webkit-touch-callout: none) {
        body {
          background-attachment: scroll !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Force ALL intermediate layers transparent - aggressive approach
    const forceTransparent = () => {
      const allDivs = document.querySelectorAll('#root div');
      allDivs.forEach(el => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.id?.includes('mist') || htmlEl.closest('[aria-modal="true"]')) return;
        const bg = window.getComputedStyle(htmlEl).backgroundColor;
        if (bg === 'rgb(242, 242, 242)' || bg === 'rgb(245, 240, 235)' || bg === 'rgb(255, 255, 255)') {
          htmlEl.style.setProperty('background-color', 'transparent', 'important');
        }
      });
    };

    // MutationObserver + interval combo for maximum reliability
    const observer = new MutationObserver(forceTransparent);
    observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    
    // Also run on interval as fallback (RN Web re-applies styles after observer fires)
    const interval = setInterval(forceTransparent, 300);
    forceTransparent();
    setTimeout(forceTransparent, 100);
    setTimeout(forceTransparent, 500);
    setTimeout(forceTransparent, 1500);
    setTimeout(forceTransparent, 3000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
      document.getElementById('pastel-mist-v5')?.remove();
    };
  }, []);

  return null;
}
