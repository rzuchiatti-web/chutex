import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

export function PastelMistBackground() {
  const initialized = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    // Load Inter font
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
        --warm-50: #FFF8F0;
        --warm-100: #FFECD6;
        --warm-200: #F5CBA7;
        --warm-300: #E8A87C;
        --warm-400: #D4845A;
        --warm-500: #C67A4F;
        --warm-600: #B56A3F;
        --warm-700: #9A5533;
        --bg: #FAF8F5;
        --text: #1C1917;
        --text-secondary: #78716C;
        --card: #FFFFFF;
        --radius-lg: 24px;
        --radius-xl: 32px;
      }

      * { 
        font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
        -webkit-tap-highlight-color: transparent;
      }

      body {
        background: var(--bg) !important;
        color: var(--text) !important;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        overflow-x: hidden;
      }

      /* Smooth scrolling */
      * { scroll-behavior: smooth; }

      /* Custom scrollbar */
      ::-webkit-scrollbar { width: 4px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(198,122,79,0.2); border-radius: 99px; }

      /* ─── ANIMATIONS ─── */
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(30px); }
        to { opacity: 1; transform: translateX(0); }
      }

      @keyframes slideInLeft {
        from { opacity: 0; transform: translateX(-30px); }
        to { opacity: 1; transform: translateX(0); }
      }

      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0.92); }
        to { opacity: 1; transform: scale(1); }
      }

      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }

      @keyframes pulseGlow {
        0%, 100% { box-shadow: 0 0 0 0 rgba(198,122,79,0.3); }
        50% { box-shadow: 0 0 20px 8px rgba(198,122,79,0.15); }
      }

      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-6px); }
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      @keyframes sosPulse {
        0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
        50% { transform: scale(1.02); box-shadow: 0 0 24px 8px rgba(239,68,68,0.15); }
      }

      /* ─── ANIMATION UTILITY CLASSES ─── */
      .animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      .animate-fade-in { animation: fadeIn 0.4s ease forwards; }
      .animate-scale-in { animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      .animate-slide-right { animation: slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

      /* Staggered delays */
      .delay-1 { animation-delay: 0.05s; opacity: 0; }
      .delay-2 { animation-delay: 0.1s; opacity: 0; }
      .delay-3 { animation-delay: 0.15s; opacity: 0; }
      .delay-4 { animation-delay: 0.2s; opacity: 0; }
      .delay-5 { animation-delay: 0.25s; opacity: 0; }
      .delay-6 { animation-delay: 0.3s; opacity: 0; }

      /* ─── PREMIUM CARD STYLES ─── */
      .premium-card {
        background: #FFFFFF;
        border-radius: var(--radius-lg);
        border: 1px solid rgba(28,25,23,0.06);
        box-shadow: 0 2px 20px rgba(28,25,23,0.05), 0 0 0 1px rgba(28,25,23,0.02);
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
      }

      .premium-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(28,25,23,0.08), 0 0 0 1px rgba(28,25,23,0.04);
      }

      .premium-card:active {
        transform: translateY(0px) scale(0.99);
      }

      /* ─── HERO GRADIENT ─── */
      .hero-gradient {
        background: linear-gradient(135deg, var(--warm-400) 0%, var(--warm-300) 40%, var(--warm-200) 100%);
        background-size: 200% 200%;
        animation: gradientShift 8s ease infinite;
      }

      .hero-gradient-subtle {
        background: linear-gradient(135deg, var(--warm-100) 0%, var(--warm-50) 50%, #FAF8F5 100%);
      }

      /* ─── BUTTON STYLES ─── */
      .btn-primary {
        background: #1C1917;
        color: #FFFFFF;
        border-radius: 999px;
        border: none;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        font-weight: 700;
      }

      .btn-primary:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(28,25,23,0.2);
      }

      .btn-primary:active {
        transform: translateY(0px) scale(0.98);
      }

      .btn-warm {
        background: linear-gradient(135deg, var(--warm-500), var(--warm-400));
        color: #FFFFFF;
        border-radius: 999px;
        border: none;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        font-weight: 700;
      }

      .btn-warm:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(198,122,79,0.3);
      }

      /* ─── GLASS EFFECT ─── */
      .glass {
        background: rgba(255,255,255,0.65);
        backdrop-filter: blur(20px) saturate(140%);
        -webkit-backdrop-filter: blur(20px) saturate(140%);
        border: 1px solid rgba(255,255,255,0.5);
      }

      /* ─── SOS BUTTON ─── */
      .sos-btn {
        animation: sosPulse 2s ease infinite;
      }

      /* ─── QUICK ACTION CIRCLE ─── */
      .quick-action {
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .quick-action:hover {
        transform: translateY(-3px) scale(1.05);
      }
      .quick-action:active {
        transform: scale(0.95);
      }

      /* ─── FLOATING TAB BAR ─── */
      [role="tablist"] {
        position: fixed !important;
        bottom: 16px !important;
        left: 16px !important;
        right: 16px !important;
        border-radius: 28px !important;
        background: rgba(255,255,255,0.92) !important;
        backdrop-filter: blur(24px) saturate(150%) !important;
        -webkit-backdrop-filter: blur(24px) saturate(150%) !important;
        box-shadow: 0 4px 32px rgba(28,25,23,0.10), inset 0 0 0 1px rgba(28,25,23,0.05) !important;
        border: none !important;
        z-index: 99999 !important;
        height: 64px !important;
        padding-bottom: 6px !important;
        border-top: none !important;
      }
      [role="tablist"] ~ div, [role="tabpanel"] { padding-bottom: 96px !important; }

      /* Tab icons & labels */
      [role="tab"] {
        transition: all 0.2s ease !important;
      }
      [role="tab"][aria-selected="true"] {
        transform: scale(1.05);
      }

      /* ─── INPUT STYLES ─── */
      input:focus, textarea:focus {
        outline: none;
        border-color: var(--warm-400) !important;
        box-shadow: 0 0 0 3px rgba(198,122,79,0.12) !important;
      }
    `;
  }, []);

  return null;
}
