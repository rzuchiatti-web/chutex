import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * PastelMistBackground v6 - Subtle, animated, readable
 * Very low opacity blobs with CSS animation on body pseudo-element
 */
export function PastelMistBackground() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    // Clean all previous versions
    ['pastel-mist-v3', 'pastel-mist-v4', 'pastel-mist-v5', 'pastel-mist-v6', 'mist-container', 'mist-container-v4'].forEach(id => {
      document.getElementById(id)?.remove();
    });

    // Create animated blob container
    const container = document.createElement('div');
    container.id = 'mist-animated';
    container.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:0;overflow:hidden;';

    const blobs = [
      { color: 'rgba(247,199,217,0.18)', size: 55, x: 20, y: -10, blur: 80, dur: 25, dx: 30, dy: 20 },
      { color: 'rgba(246,208,177,0.15)', size: 50, x: 50, y: 5, blur: 90, dur: 32, dx: -25, dy: 25 },
      { color: 'rgba(207,230,255,0.16)', size: 60, x: -5, y: 30, blur: 100, dur: 28, dx: 20, dy: -15 },
      { color: 'rgba(216,207,243,0.18)', size: 65, x: 30, y: 50, blur: 90, dur: 35, dx: -20, dy: 20 },
      { color: 'rgba(247,199,217,0.12)', size: 45, x: 60, y: 40, blur: 100, dur: 22, dx: 15, dy: -25 },
    ];

    blobs.forEach((b, i) => {
      const blob = document.createElement('div');
      blob.className = 'mist-anim';
      blob.style.cssText = `
        position:absolute;
        left:${b.x}%;top:${b.y}%;
        width:${b.size}vw;height:${b.size}vw;
        border-radius:50%;
        background:${b.color};
        filter:blur(${b.blur}px);
        animation:mist-float-${i} ${b.dur}s ease-in-out infinite;
        will-change:transform;
      `;
      container.appendChild(blob);
    });

    document.body.insertBefore(container, document.body.firstChild);

    const style = document.createElement('style');
    style.id = 'pastel-mist-v6';
    style.textContent = `
      body { background: #FAFAFA !important; }

      @keyframes mist-float-0 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(${blobs[0].dx}px, ${blobs[0].dy}px) scale(1.08); }
        66% { transform: translate(${-blobs[0].dx}px, ${-blobs[0].dy}px) scale(0.95); }
      }
      @keyframes mist-float-1 {
        0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
        40% { transform: translate(${blobs[1].dx}px, ${blobs[1].dy}px) scale(1.06) rotate(3deg); }
        70% { transform: translate(${-blobs[1].dx}px, ${-blobs[1].dy}px) scale(0.97) rotate(-2deg); }
      }
      @keyframes mist-float-2 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        30% { transform: translate(${blobs[2].dx}px, ${blobs[2].dy}px) scale(1.1); }
        60% { transform: translate(${-blobs[2].dx * 0.5}px, ${blobs[2].dy}px) scale(0.94); }
      }
      @keyframes mist-float-3 {
        0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
        25% { transform: translate(${blobs[3].dx}px, ${blobs[3].dy}px) scale(1.05) rotate(2deg); }
        50% { transform: translate(0, ${blobs[3].dy * 1.5}px) scale(0.96) rotate(-1deg); }
        75% { transform: translate(${-blobs[3].dx}px, ${-blobs[3].dy}px) scale(1.03) rotate(1deg); }
      }
      @keyframes mist-float-4 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(${blobs[4].dx}px, ${blobs[4].dy}px) scale(1.07); }
      }

      @media (prefers-reduced-motion: reduce) {
        .mist-anim { animation: none !important; }
      }
    `;
    document.head.appendChild(style);

    // Force transparency on RN Web layers
    const forceTransparent = () => {
      document.querySelectorAll('#root div').forEach(el => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.id?.includes('mist') || htmlEl.closest('[aria-modal="true"]')) return;
        const bg = window.getComputedStyle(htmlEl).backgroundColor;
        if (bg === 'rgb(242, 242, 242)' || bg === 'rgb(245, 240, 235)' || bg === 'rgb(250, 250, 250)') {
          htmlEl.style.setProperty('background-color', 'transparent', 'important');
        }
      });
    };
    const observer = new MutationObserver(forceTransparent);
    observer.observe(document.getElementById('root') || document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
    const interval = setInterval(forceTransparent, 500);
    setTimeout(forceTransparent, 100);
    setTimeout(forceTransparent, 500);
    setTimeout(forceTransparent, 2000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
      document.getElementById('mist-animated')?.remove();
      document.getElementById('pastel-mist-v6')?.remove();
    };
  }, []);

  return null;
}
