import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * PastelMistBackground v3 - Injection CSS directe dans body
 * Contourne le problème des couches opaques d'Expo Router
 * L'animation est injectée sur document.body en position fixed
 */
export function PastelMistBackground() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    // Remove old styles
    const old = document.getElementById('pastel-mist-v3');
    if (old) old.remove();
    const oldContainer = document.getElementById('mist-container');
    if (oldContainer) oldContainer.remove();

    // Create the mist container
    const container = document.createElement('div');
    container.id = 'mist-container';
    container.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:0;overflow:hidden;';

    const blobs = [
      { color1: '#F8E4B4', color2: '#E6B78C', size: 450, x: 35, y: -8, blur: 120, opacity: 0.5, dur: 30, anim: 0 },
      { color1: '#E9B6C0', color2: '#D68B9A', size: 500, x: 5, y: 18, blur: 100, opacity: 0.45, dur: 26, anim: 1 },
      { color1: '#DE9D9D', color2: '#E6B78C', size: 320, x: 25, y: 10, blur: 110, opacity: 0.35, dur: 34, anim: 2 },
      { color1: '#C0B8D9', color2: '#D4B2C4', size: 620, x: 15, y: 42, blur: 120, opacity: 0.40, dur: 38, anim: 3 },
      { color1: '#A7C0E6', color2: '#C0B8D9', size: 380, x: 50, y: 32, blur: 130, opacity: 0.28, dur: 28, anim: 4 },
    ];

    blobs.forEach((b, i) => {
      const blob = document.createElement('div');
      blob.className = 'mist-blob-v3';
      blob.style.cssText = `position:absolute;left:${b.x}%;top:${b.y}%;width:${b.size}px;height:${b.size}px;border-radius:45% 55% 50% 50% / 50% 45% 55% 50%;background:radial-gradient(ellipse at 40% 40%,${b.color1} 0%,${b.color2} 40%,transparent 70%);opacity:${b.opacity};filter:blur(${b.blur}px);animation:mist-v3-${b.anim} ${b.dur}s ease-in-out infinite;will-change:transform;`;
      container.appendChild(blob);
    });

    // Insert at the very beginning of body
    document.body.insertBefore(container, document.body.firstChild);

    // Inject keyframes
    const style = document.createElement('style');
    style.id = 'pastel-mist-v3';
    style.textContent = `
      #root, #root > div, #root > div > div { background: transparent !important; }
      body { background: #FFFFFF !important; }
      @keyframes mist-v3-0{0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}30%{transform:translate(30px,-20px) scale(1.06) rotate(3deg)}60%{transform:translate(-15px,25px) scale(0.97) rotate(-2deg)}}
      @keyframes mist-v3-1{0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}25%{transform:translate(-20px,25px) scale(1.05) rotate(-3deg)}55%{transform:translate(15px,-10px) scale(0.96) rotate(2deg)}80%{transform:translate(-8px,5px) scale(1.02) rotate(-1deg)}}
      @keyframes mist-v3-2{0%,100%{transform:translate(0,0) scale(1)}35%{transform:translate(18px,15px) scale(1.04)}65%{transform:translate(-12px,-20px) scale(0.97)}}
      @keyframes mist-v3-3{0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}40%{transform:translate(-15px,18px) scale(1.03) rotate(2deg)}70%{transform:translate(20px,-12px) scale(0.98) rotate(-1deg)}}
      @keyframes mist-v3-4{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(12px,-18px) scale(1.05)}}
      @media(prefers-reduced-motion:reduce){.mist-blob-v3{animation:none!important}}
    `;
    document.head.appendChild(style);

    return () => {
      const c = document.getElementById('mist-container');
      if (c) c.remove();
      const s = document.getElementById('pastel-mist-v3');
      if (s) s.remove();
    };
  }, []);

  return null;
}
