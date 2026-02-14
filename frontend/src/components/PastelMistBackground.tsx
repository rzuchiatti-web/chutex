import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * PastelMistBackground v4 - Force visibility through ALL layers
 * Uses !important on every intermediate div to ensure transparency
 */
export function PastelMistBackground() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    // Clean previous
    document.getElementById('pastel-mist-v4')?.remove();
    document.getElementById('mist-container-v4')?.remove();

    // Create mist container INSIDE the app root, not on body
    const container = document.createElement('div');
    container.id = 'mist-container-v4';

    const blobs = [
      { color1: '#F8D4B4', color2: '#E6A87C', size: 500, x: 30, y: -10, blur: 100, opacity: 0.6, dur: 30, anim: 0 },
      { color1: '#E9A6B0', color2: '#D67B8A', size: 550, x: 0, y: 15, blur: 90, opacity: 0.55, dur: 26, anim: 1 },
      { color1: '#DE8D8D', color2: '#E6A87C', size: 350, x: 20, y: 8, blur: 100, opacity: 0.45, dur: 34, anim: 2 },
      { color1: '#B0A8C9', color2: '#C4A2B4', size: 650, x: 10, y: 40, blur: 110, opacity: 0.50, dur: 38, anim: 3 },
      { color1: '#97B0D6', color2: '#B0A8C9', size: 400, x: 45, y: 30, blur: 120, opacity: 0.35, dur: 28, anim: 4 },
    ];

    blobs.forEach((b) => {
      const blob = document.createElement('div');
      blob.className = 'mist-b4';
      blob.style.cssText = `position:fixed;left:${b.x}%;top:${b.y}%;width:${b.size}px;height:${b.size}px;border-radius:45% 55% 50% 50%/50% 45% 55% 50%;background:radial-gradient(ellipse at 40% 40%,${b.color1} 0%,${b.color2} 40%,transparent 70%);opacity:${b.opacity};filter:blur(${b.blur}px);animation:mv4-${b.anim} ${b.dur}s ease-in-out infinite;will-change:transform;pointer-events:none;z-index:-1;`;
      container.appendChild(blob);
    });

    // Inject styles that force ALL layers transparent
    const style = document.createElement('style');
    style.id = 'pastel-mist-v4';
    style.textContent = `
      body { background: #FFFFFF !important; }
      #root, #root > *, #root > * > *, #root > * > * > *, #root > * > * > * > *, #root > * > * > * > * > * { background-color: transparent !important; }
      .css-view-g5y9jx { background-color: transparent !important; }
      [data-testid="dashboard-screen"],
      [data-testid="alerts-screen"],
      [data-testid="health-screen"],
      [data-testid="teleconsult-screen"],
      [data-testid="devices-screen"],
      [data-testid="profile-screen"] { background-color: transparent !important; }
      [role="tabpanel"] { background-color: transparent !important; }
      #mist-container-v4 { position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:0;overflow:hidden; }
      @keyframes mv4-0{0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}30%{transform:translate(30px,-20px) scale(1.06) rotate(3deg)}60%{transform:translate(-15px,25px) scale(0.97) rotate(-2deg)}}
      @keyframes mv4-1{0%,100%{transform:translate(0,0) scale(1)}25%{transform:translate(-20px,25px) scale(1.05) rotate(-3deg)}55%{transform:translate(15px,-10px) scale(0.96)}80%{transform:translate(-8px,5px) scale(1.02)}}
      @keyframes mv4-2{0%,100%{transform:translate(0,0) scale(1)}35%{transform:translate(18px,15px) scale(1.04)}65%{transform:translate(-12px,-20px) scale(0.97)}}
      @keyframes mv4-3{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translate(-15px,18px) scale(1.03) rotate(2deg)}70%{transform:translate(20px,-12px) scale(0.98) rotate(-1deg)}}
      @keyframes mv4-4{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(12px,-18px) scale(1.05)}}
      @media(prefers-reduced-motion:reduce){.mist-b4{animation:none!important}}
    `;
    document.head.appendChild(style);
    document.body.insertBefore(container, document.body.firstChild);

    return () => {
      document.getElementById('mist-container-v4')?.remove();
      document.getElementById('pastel-mist-v4')?.remove();
    };
  }, []);

  return null;
}
