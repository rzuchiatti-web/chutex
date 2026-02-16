import { useEffect } from 'react';
import { Platform } from 'react-native';

export function PastelMistBackground() {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    if (!document.getElementById('inter-font')) {
      const link = document.createElement('link');
      link.id = 'inter-font';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
      document.head.appendChild(link);
    }

    let style = document.getElementById('clinic-bg') as HTMLStyleElement;
    if (!style) {
      style = document.createElement('style');
      style.id = 'clinic-bg';
      document.head.appendChild(style);
    }

    style.textContent = `
      * { font-family: 'Inter', system-ui, -apple-system, sans-serif !important; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      body { background: #FFFFFF !important; color: #111 !important; -webkit-font-smoothing: antialiased; margin:0; }

      /* ── Clinical grid background ── */
      .clinic-grid-light {
        background-color: #FAFAFA;
        background-image:
          linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px);
        background-size: 40px 40px;
      }
      .clinic-grid-dark {
        background-color: #0A0A0A;
        background-image:
          linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
        background-size: 40px 40px;
      }

      /* ── Typewriter animation ── */
      @keyframes typewriter {
        from { width: 0; }
        to { width: 100%; }
      }
      @keyframes blink-caret {
        0%, 100% { border-color: currentColor; }
        50% { border-color: transparent; }
      }
      .typewriter {
        display: inline-block;
        overflow: hidden;
        white-space: nowrap;
        border-right: 2px solid currentColor;
        animation: typewriter 1.8s steps(40, end) forwards, blink-caret 0.8s step-end infinite;
        width: 0;
      }
      .typewriter-slow {
        animation: typewriter 2.5s steps(50, end) forwards, blink-caret 0.8s step-end infinite;
        width: 0;
      }

      /* ── Pulse dot animation ── */
      @keyframes pulse-dot {
        0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
        50% { opacity: 0.7; transform: scale(1.3); box-shadow: 0 0 8px 3px rgba(255,255,255,0.15); }
      }

      /* ── Scan line sweep on buttons ── */
      @keyframes scan-sweep {
        0% { left: -100%; }
        100% { left: 100%; }
      }

      /* ── Glow breathe for glass pills ── */
      @keyframes glow-breathe {
        0%, 100% { box-shadow: 0 0 12px rgba(255,255,255,0.04), inset 0 0 0 1px rgba(255,255,255,0.1); }
        50% { box-shadow: 0 0 20px rgba(255,255,255,0.08), inset 0 0 0 1px rgba(255,255,255,0.18); }
      }

      /* ── Slide-up entrance ── */
      @keyframes enterUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
      @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
      @keyframes spin { to { transform: rotate(360deg); } }

      .anim-up { animation: enterUp 0.6s cubic-bezier(.4,0,.15,1) both; }
      .d1 { animation-delay: 0.1s; }
      .d2 { animation-delay: 0.2s; }
      .d3 { animation-delay: 0.35s; }
      .d4 { animation-delay: 0.5s; }
      .d5 { animation-delay: 0.65s; }
      .d6 { animation-delay: 0.8s; }
      .d7 { animation-delay: 0.95s; }

      /* ── Glass pill badge ── */
      .glass-pill {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 8px 18px; border-radius: 999px;
        background: rgba(255,255,255,0.08);
        backdrop-filter: blur(12px) saturate(120%);
        -webkit-backdrop-filter: blur(12px) saturate(120%);
        border: 1px solid rgba(255,255,255,0.12);
        font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;
      }
      .glass-pill-light {
        background: rgba(255,255,255,0.7);
        backdrop-filter: blur(12px) saturate(120%);
        -webkit-backdrop-filter: blur(12px) saturate(120%);
        border: 1px solid rgba(0,0,0,0.06);
        color: #333;
      }

      /* ── Scan/glow button ── */
      .btn-scan {
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        padding: 14px 32px; border-radius: 999px;
        background: #111; color: #FFF;
        font-size: 14px; font-weight: 600;
        border: none; cursor: pointer;
        position: relative; overflow: hidden;
        box-shadow: 0 0 20px rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.1);
        transition: all 0.35s cubic-bezier(.4,0,.15,1);
      }
      .btn-scan:hover {
        box-shadow: 0 0 30px rgba(255,255,255,0.12), inset 0 0 0 1px rgba(255,255,255,0.2);
        transform: scale(1.02);
      }
      .btn-scan:active { transform: scale(0.97); }
      .btn-scan-light {
        background: #FFF; color: #111;
        box-shadow: 0 0 20px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.08);
      }
      .btn-scan-light:hover {
        box-shadow: 0 0 30px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(0,0,0,0.12);
      }

      /* ── Circle arrow button ── */
      .btn-circle {
        width: 44px; height: 44px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        background: #111; color: #FFF; border: none; cursor: pointer;
        box-shadow: 0 0 16px rgba(255,255,255,0.05), inset 0 0 0 1px rgba(255,255,255,0.1);
        transition: all 0.3s ease;
      }
      .btn-circle:hover { transform: scale(1.06); box-shadow: 0 0 24px rgba(255,255,255,0.1), inset 0 0 0 1px rgba(255,255,255,0.15); }

      /* ── Tab bar ── */
      [role="tablist"] {
        position: fixed !important; bottom: 0 !important; left: 0 !important; right: 0 !important;
        background: rgba(255,255,255,0.85) !important;
        backdrop-filter: blur(20px) saturate(150%) !important;
        -webkit-backdrop-filter: blur(20px) saturate(150%) !important;
        border-top: 1px solid rgba(0,0,0,0.06) !important;
        z-index: 99999 !important; height: 60px !important; padding-bottom: 4px !important;
      }
      [role="tablist"] ~ div, [role="tabpanel"] { padding-bottom: 70px !important; }

      input:focus, textarea:focus { outline: none; border-color: #111 !important; box-shadow: 0 0 0 3px rgba(0,0,0,0.06) !important; }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
      }
    `;
  }, []);

  return null;
}
