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
      :root {
        --bg: #F5F6F8;
        --surface: #FFFFFF;
        --glass: rgba(255,255,255,0.72);
        --text: #1E1F24;
        --text-sec: #6B7084;
        --text-muted: #9CA3B0;
        --accent: #D4845A;
        --accent-light: #E8A87C;
        --accent-peach: #F5CBA7;
        --border: rgba(20,20,30,0.06);
        --shadow: 0 10px 30px rgba(20,20,30,0.08);
        --shadow-hover: 0 16px 40px rgba(20,20,30,0.12);
        --shadow-soft: 0 4px 16px rgba(20,20,30,0.05);
        --glass-blur: blur(12px) saturate(120%);
        --glass-heavy: blur(20px) saturate(140%);
        --r-frame: 34px;
        --r-card: 24px;
        --r-card-sm: 20px;
        --r-pill: 999px;
        --ease: cubic-bezier(0.22, 1, 0.36, 1);
        --dur: 380ms;
        --stagger: 55ms;
      }

      * {
        font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
        -webkit-tap-highlight-color: transparent;
        box-sizing: border-box;
      }

      body {
        background: var(--bg) !important;
        color: var(--text) !important;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        overflow-x: hidden;
      }

      * { scroll-behavior: smooth; }
      ::-webkit-scrollbar { width: 3px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(20,20,30,0.1); border-radius: 99px; }

      /* ─── PAGE ENTER ─── */
      @keyframes pageEnter {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.96); }
        to { opacity: 1; transform: scale(1); }
      }

      @keyframes slideUp {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes haloGlow {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 0.6; transform: scale(1.08); }
      }

      @keyframes gradientDrift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      @keyframes typewriter {
        from { width: 0; }
        to { width: 100%; }
      }

      @keyframes sosPulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0.3); }
        50% { transform: scale(1.015); box-shadow: 0 0 24px 8px rgba(239,68,68,0.12); }
      }

      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }

      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* ─── STAGGER ANIMATION CLASSES ─── */
      .anim-enter {
        animation: pageEnter var(--dur) var(--ease) both;
      }
      .stagger-1 { animation-delay: calc(var(--stagger) * 1); }
      .stagger-2 { animation-delay: calc(var(--stagger) * 2); }
      .stagger-3 { animation-delay: calc(var(--stagger) * 3); }
      .stagger-4 { animation-delay: calc(var(--stagger) * 4); }
      .stagger-5 { animation-delay: calc(var(--stagger) * 5); }
      .stagger-6 { animation-delay: calc(var(--stagger) * 6); }
      .stagger-7 { animation-delay: calc(var(--stagger) * 7); }
      .stagger-8 { animation-delay: calc(var(--stagger) * 8); }

      /* ─── GLASS CARD ─── */
      .glass-card {
        background: var(--surface);
        border-radius: var(--r-card);
        border: 1px solid var(--border);
        box-shadow: var(--shadow);
        transition: transform 320ms var(--ease), box-shadow 320ms var(--ease);
      }
      .glass-card:hover {
        transform: scale(1.012) translateY(-1px);
        box-shadow: var(--shadow-hover);
      }
      .glass-card:active {
        transform: scale(0.98);
        box-shadow: var(--shadow-soft);
      }

      /* ─── GLASS SURFACE ─── */
      .glass-surface {
        background: var(--glass);
        backdrop-filter: var(--glass-blur);
        -webkit-backdrop-filter: var(--glass-blur);
        border: 1px solid rgba(255,255,255,0.65);
        border-radius: var(--r-card);
      }

      /* ─── HERO GRADIENT ─── */
      .hero-gradient {
        background: linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 45%, var(--accent-peach) 100%);
        background-size: 200% 200%;
        animation: gradientDrift 12s ease infinite;
        border-radius: var(--r-card);
      }

      /* ─── PAGE HEADER HALO ─── */
      .page-halo {
        position: absolute;
        top: -30px;
        left: 50%;
        transform: translateX(-50%);
        width: 200px;
        height: 100px;
        border-radius: 50%;
        background: radial-gradient(ellipse, rgba(212,132,90,0.15) 0%, transparent 70%);
        animation: haloGlow 5s ease-in-out infinite;
        pointer-events: none;
        z-index: 0;
      }

      /* ─── PILL BUTTONS ─── */
      .btn-pill {
        border-radius: var(--r-pill);
        border: none;
        cursor: pointer;
        transition: all 280ms var(--ease);
        font-weight: 600;
        font-family: inherit;
      }
      .btn-pill:hover {
        transform: translateY(-1px) scale(1.015);
        box-shadow: 0 8px 24px rgba(20,20,30,0.12);
      }
      .btn-pill:active {
        transform: scale(0.98);
      }

      .btn-dark {
        background: linear-gradient(135deg, #1E1F24, #2D2E34);
        color: #FFFFFF;
      }
      .btn-warm {
        background: linear-gradient(135deg, var(--accent), var(--accent-light));
        color: #FFFFFF;
      }
      .btn-glass {
        background: var(--glass);
        backdrop-filter: var(--glass-blur);
        -webkit-backdrop-filter: var(--glass-blur);
        color: var(--text);
        border: 1px solid var(--border);
      }

      /* ─── ICON BUTTON (circular soft-raised) ─── */
      .icon-btn {
        border-radius: 50%;
        background: var(--surface);
        border: 1px solid var(--border);
        box-shadow: var(--shadow-soft);
        transition: all 250ms var(--ease);
        cursor: pointer;
      }
      .icon-btn:hover {
        transform: scale(1.08);
        box-shadow: var(--shadow);
      }
      .icon-btn:active {
        transform: scale(0.95);
      }

      /* ─── FLOATING TAB BAR ─── */
      [role="tablist"] {
        position: fixed !important;
        bottom: 16px !important;
        left: 16px !important;
        right: 16px !important;
        border-radius: 28px !important;
        background: rgba(255,255,255,0.82) !important;
        backdrop-filter: blur(20px) saturate(140%) !important;
        -webkit-backdrop-filter: blur(20px) saturate(140%) !important;
        box-shadow: 0 10px 40px rgba(20,20,30,0.10), inset 0 0 0 1px rgba(255,255,255,0.6) !important;
        border: none !important;
        z-index: 99999 !important;
        height: 64px !important;
        padding-bottom: 6px !important;
        border-top: none !important;
        animation: pageEnter 500ms var(--ease) both;
        animation-delay: 300ms;
      }
      [role="tablist"] ~ div, [role="tabpanel"] { padding-bottom: 96px !important; }

      [role="tab"] {
        transition: all 200ms var(--ease) !important;
      }
      [role="tab"][aria-selected="true"] {
        transform: scale(1.06);
      }

      /* ─── INPUT FOCUS ─── */
      input:focus, textarea:focus {
        outline: none;
        border-color: rgba(212,132,90,0.4) !important;
        box-shadow: 0 0 0 4px rgba(212,132,90,0.08) !important;
      }

      /* ─── REDUCED MOTION ─── */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }

      /* ─── INSET SURFACE ─── */
      .inset-surface {
        background: var(--bg);
        border-radius: var(--r-card-sm);
        box-shadow: inset 0 2px 6px rgba(20,20,30,0.04);
      }

      /* ─── SOS ─── */
      .sos-pulse {
        animation: sosPulse 2.2s ease infinite;
      }

      /* ─── BADGE ─── */
      .badge-pill {
        border-radius: var(--r-pill);
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.3px;
        padding: 4px 12px;
      }
    `;
  }, []);

  return null;
}
