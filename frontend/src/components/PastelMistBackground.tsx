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

    // Remix Icon CDN
    if (!document.getElementById('remix-icon')) {
      const ri = document.createElement('link');
      ri.id = 'remix-icon';
      ri.rel = 'stylesheet';
      ri.href = 'https://cdn.jsdelivr.net/npm/remixicon@4.6.0/fonts/remixicon.css';
      document.head.appendChild(ri);
    }

    let style = document.getElementById('clinic-bg') as HTMLStyleElement;
    if (!style) {
      style = document.createElement('style');
      style.id = 'clinic-bg';
      document.head.appendChild(style);
    }

    style.textContent = `
      :root {
        --chx-radius: 22px;
        --chx-pill: 999px;
        --chx-ease: cubic-bezier(.22,.61,.36,1);
        --chx-dur: .28s;
      }
      * { font-family: 'Inter', system-ui, -apple-system, sans-serif !important; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      body { -webkit-font-smoothing: antialiased; margin: 0; }

      /* ── ANIMATED BACKGROUNDS ── */
      @keyframes chxDriftDark {
        0%   { transform: translate3d(-1.6%,-.6%,0) scale(1); }
        50%  { transform: translate3d(1.8%,1.4%,0) scale(1.05); }
        100% { transform: translate3d(-1.6%,-.6%,0) scale(1); }
      }
      @keyframes chxDriftLight {
        0%   { transform: translate3d(-1.2%,0,0) scale(1); }
        50%  { transform: translate3d(1.5%,1.4%,0) scale(1.06); }
        100% { transform: translate3d(-1.2%,0,0) scale(1); }
      }

      .chx-bg-dark {
        background: #0b0f16 !important;
        color: #f4f7ff !important;
        position: relative;
        overflow: hidden;
      }
      .chx-bg-dark::before {
        content: '';
        position: absolute; inset: -15%; z-index: 0; pointer-events: none;
        filter: blur(30px);
        background:
          radial-gradient(520px 340px at 18% 22%, rgba(124,180,255,.22), transparent 66%),
          radial-gradient(520px 360px at 84% 28%, rgba(255,138,169,.18), transparent 70%),
          radial-gradient(500px 330px at 50% 92%, rgba(139,255,231,.13), transparent 72%);
        animation: chxDriftDark 20s linear infinite;
      }

      .chx-bg-light {
        background: linear-gradient(180deg, rgba(255,255,255,.92), rgba(245,247,250,.96)) !important;
        color: #0f172a !important;
        position: relative;
        overflow: hidden;
      }
      .chx-bg-light::before {
        content: '';
        position: absolute; inset: -15%; z-index: 0; pointer-events: none;
        filter: blur(30px);
        background:
          radial-gradient(560px 350px at 20% 20%, rgba(131,190,255,.34), transparent 68%),
          radial-gradient(520px 340px at 84% 26%, rgba(255,173,156,.32), transparent 70%),
          radial-gradient(500px 320px at 50% 85%, rgba(255,167,211,.28), transparent 72%);
        animation: chxDriftLight 22s ease-in-out infinite;
      }

      /* ── CLINICAL GRID (onboarding/login) ── */
      .clinic-grid-dark {
        background-color: #0A0A0A;
        background-image:
          linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
        background-size: 44px 44px;
        animation: grid-drift 20s linear infinite;
      }
      .clinic-grid-light {
        background-color: #FAFAFA;
        background-image:
          linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px);
        background-size: 44px 44px;
        animation: grid-drift 25s linear infinite;
      }
      @keyframes grid-drift {
        0% { background-position: 0 0; }
        100% { background-position: 44px 44px; }
      }

      /* ── GLASS CARDS ── */
      .chx-card-dark {
        border-radius: var(--chx-radius);
        border: 1px solid rgba(255,255,255,.12);
        background: linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.02));
        backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
        box-shadow: 0 12px 28px rgba(0,0,0,.18);
        position: relative; z-index: 1;
      }
      .chx-card-light {
        border-radius: var(--chx-radius);
        border: 1px solid rgba(0,0,0,.08);
        background: linear-gradient(180deg, rgba(255,255,255,.76), rgba(255,255,255,.54));
        backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
        box-shadow: 0 12px 28px rgba(0,0,0,.08);
        position: relative; z-index: 1;
      }

      /* ── HEADER ACCOUNT CARD ── */
      .chx-header-dark {
        border-radius: 24px;
        background:
          linear-gradient(145deg, rgba(255,255,255,.10), rgba(255,255,255,.04)),
          radial-gradient(120% 120% at 12% 10%, #35507f 0%, #23355b 45%, #1a2742 100%);
        border: 1px solid rgba(255,255,255,.12);
        backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
        box-shadow: 0 12px 28px rgba(0,0,0,.18);
      }
      .chx-header-light {
        border-radius: 24px;
        background:
          linear-gradient(145deg, rgba(255,255,255,.25), rgba(255,255,255,.18)),
          radial-gradient(140% 140% at 10% 10%, #ffb187 0%, #f39c70 30%, #cc9fbe 64%, #a9b8ea 100%);
        border: 1px solid rgba(0,0,0,.08);
        backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
        box-shadow: 0 12px 28px rgba(0,0,0,.08);
      }

      /* ── SEGMENT TOGGLE ── */
      .chx-segment {
        display: flex; gap: 6px;
        border: 1px solid rgba(255,255,255,.46);
        background: rgba(255,255,255,.22);
        border-radius: 999px; padding: 3px;
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      }

      /* ── ICON BUTTONS (round, gray bg, black icon) ── */
      .chx-icon-btn {
        width: 38px; height: 38px; border-radius: 50%;
        border: 1px solid #d8e2ef; background: #eef2f6; color: #111827;
        display: grid; place-items: center; cursor: pointer;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.96);
        transition: transform var(--chx-dur) var(--chx-ease), box-shadow var(--chx-dur) var(--chx-ease);
      }
      .chx-icon-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 16px rgba(15,23,42,.12);
      }

      /* ── PILL BUTTONS WITH SCAN/HALO/RIPPLE ── */
      @keyframes chxBtnScan { to { transform: translateX(120%); } }
      @keyframes chxHalo {
        0%,100% { transform: scale(.95); opacity: .24; }
        50% { transform: scale(1.05); opacity: .42; }
      }
      @keyframes chxRipple {
        to { opacity: 0; transform: translate(-50%,-50%) scale(6); }
      }
      @keyframes chxPulse {
        0%,100% { transform: scale(1); opacity: .76; }
        50% { transform: scale(1.2); opacity: 1; }
      }

      .chx-btn {
        --mx: 50%; --my: 50%;
        position: relative;
        min-height: 52px; border-radius: 999px;
        padding: 0 20px;
        display: inline-flex; align-items: center; justify-content: center; gap: 10px;
        width: 100%; cursor: pointer;
        font-size: 14px; font-weight: 700; letter-spacing: .01em;
        overflow: hidden; isolation: isolate;
        border: 1px solid var(--bd, rgba(255,255,255,.16));
        color: var(--txt, #fff);
        background:
          radial-gradient(170px 80px at var(--mx) var(--my), rgba(255,255,255,.18), transparent 72%),
          linear-gradient(145deg, var(--bg1, rgba(255,255,255,.1)), var(--bg2, rgba(255,255,255,.04)));
        backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
        box-shadow: 0 1px 0 rgba(255,255,255,.16) inset, 0 10px 22px rgba(0,0,0,.24);
        transition: transform var(--chx-dur) var(--chx-ease), box-shadow var(--chx-dur) var(--chx-ease), filter var(--chx-dur) var(--chx-ease);
        font-family: inherit;
      }
      .chx-btn:hover { transform: translateY(-2px); box-shadow: 0 1px 0 rgba(255,255,255,.22) inset, 0 16px 30px rgba(0,0,0,.28); }
      .chx-btn:active { transform: translateY(0); }

      /* Button variants */
      .chx-btn-dark-primary { --txt:#0b0f17; --bd:rgba(255,255,255,.26); --bg1:#fff; --bg2:#e9edf7; box-shadow: 0 1px 0 rgba(255,255,255,.95) inset, 0 16px 34px rgba(0,0,0,.4); }
      .chx-btn-dark-danger { --txt:#fff; --bd:rgba(255,120,130,.4); --bg1:rgba(255,90,110,.34); --bg2:rgba(190,40,60,.24); }
      .chx-btn-light-primary { --txt:#fff; --bd:rgba(17,24,39,.26); --bg1:#111827; --bg2:#0b1220; box-shadow: 0 12px 24px rgba(17,24,39,.26); }
      .chx-btn-light-danger { --txt:#fff; --bd:rgba(215,40,62,.35); --bg1:#e93f5d; --bg2:#bf2742; box-shadow: 0 10px 22px rgba(212,52,75,.3); }
      .chx-btn-ia { --txt:#1a2030; --bd:#e5d5f0; --bg1:#ffd8ea; --bg2:#d7e4ff; box-shadow: 0 10px 22px rgba(145,137,190,.24), inset 0 1px 0 rgba(255,255,255,.85); }

      /* Scan sweep inside buttons */
      .chx-btn-scan { position: absolute; inset: 0; z-index: 2; pointer-events: none; border-radius: inherit; overflow: hidden; }
      .chx-btn-scan::before {
        content: ''; position: absolute; inset: -2px;
        background: linear-gradient(112deg, transparent 20%, var(--scan, rgba(255,255,255,.42)) 50%, transparent 80%);
        transform: translateX(-120%); animation: chxBtnScan 2.2s linear infinite; opacity: .94;
      }
      .chx-btn:hover .chx-btn-scan::before { animation-duration: .9s; }

      .chx-btn-halo {
        position: absolute; inset: -20%; z-index: 1; pointer-events: none; border-radius: 999px;
        background: radial-gradient(circle at 50% 50%, var(--halo, rgba(255,255,255,.2)), transparent 62%);
        filter: blur(18px); opacity: .34; animation: chxHalo 2.2s ease-in-out infinite;
      }

      /* ── TYPEWRITER ── */
      @keyframes blink-caret { 0%,100%{border-color:currentColor} 50%{border-color:transparent} }

      /* ── MISC ANIMATIONS ── */
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes enterUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
      @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
      @keyframes pulse-dot {
        0%,100% { opacity:1; transform:scale(1); box-shadow:0 0 0 0 rgba(255,255,255,0.4); }
        50% { opacity:.7; transform:scale(1.3); box-shadow:0 0 8px 3px rgba(255,255,255,0.15); }
      }
      @keyframes glow-breathe {
        0%,100% { box-shadow:0 0 12px rgba(255,255,255,.04), inset 0 0 0 1px rgba(255,255,255,.1); }
        50% { box-shadow:0 0 20px rgba(255,255,255,.08), inset 0 0 0 1px rgba(255,255,255,.18); }
      }
      @keyframes scan-sweep { 0%{left:-100%} 100%{left:100%} }

      .anim-up { animation: enterUp 0.6s cubic-bezier(.4,0,.15,1) both; }
      .d1 { animation-delay: 0.1s; } .d2 { animation-delay: 0.2s; } .d3 { animation-delay: 0.35s; }
      .d4 { animation-delay: 0.5s; } .d5 { animation-delay: 0.65s; } .d6 { animation-delay: 0.8s; } .d7 { animation-delay: 0.95s; }

      /* ── GLASS PILL BADGE ── */
      .glass-pill {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 8px 18px; border-radius: 999px;
        font-size: 11px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;
        backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
        animation: glow-breathe 3s ease-in-out infinite;
      }
      .glass-pill-dark { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.18); color: rgba(255,255,255,.72); }
      .glass-pill-light { background: rgba(255,255,255,.62); border: 1px solid rgba(0,0,0,.10); color: rgba(0,0,0,.62); }

      /* Navbar on white bg: dark icons, active = black circle white icon */
      [role="tablist"] {
        position: fixed !important; bottom: 10px !important; left: 20px !important; right: 20px !important;
        width: auto !important;
        z-index: 99999 !important; height: 56px !important; padding: 4px 6px !important;
        border-radius: 999px !important;
        background: rgba(255,255,255,0.85) !important;
        backdrop-filter: blur(28px) saturate(160%) !important; -webkit-backdrop-filter: blur(28px) saturate(160%) !important;
        border: 1px solid rgba(0,0,0,0.06) !important;
        box-shadow: 0 4px 24px rgba(0,0,0,0.1) !important;
        border-top: none !important;
        display: flex !important; align-items: center !important; justify-content: space-around !important;
        margin: 0 !important; transform: none !important;
      }
      [role="tablist"] span {
        font-size: 0 !important; line-height: 0 !important; height: 0 !important; overflow: hidden !important; display: none !important;
      }
      [role="tablist"] [role="tab"] {
        flex: 1 !important; max-width: 48px !important; height: 48px !important;
        display: flex !important; align-items: center !important; justify-content: center !important;
        padding: 0 !important; border-radius: 999px !important;
        background: transparent !important;
        border: none !important;
        transition: background 0.25s ease !important;
      }
      [role="tablist"] [role="tab"][aria-selected="true"] {
        background: #111 !important;
        border-radius: 999px !important;
      }
      [role="tablist"] [role="tab"] svg {
        color: rgba(0,0,0,0.45) !important; width: 22px !important; height: 22px !important;
        fill: none !important; stroke: currentColor !important;
      }
      [role="tablist"] [role="tab"][aria-selected="true"] svg {
        color: #FFF !important; fill: none !important; stroke: #FFF !important;
      }
      [role="tablist"] ~ div, [role="tabpanel"] { padding-bottom: 80px !important; }
      /* Remove any white padding at top */
      [role="tabpanel"] > div:first-child { padding-top: 0 !important; }
      /* Kill ALL page headers/titles from Expo Router */
      header[role="banner"], [data-testid*="header"], div[style*="headerTitle"] { display: none !important; }
      /* Full screen - no white borders */
      #root, #root > div, #root > div > div { min-height: 100dvh !important; background: transparent !important; }
      html, body, #root { margin: 0 !important; padding: 0 !important; background: #0b0f16 !important; overflow-x: hidden !important; }

      /* ── GUARDIANS STACK ── */
      .chx-guard-stack { display: flex; align-items: center; }
      .chx-guard-stack > * { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; margin-left: -8px; border: 2px solid #fff; box-shadow: 0 6px 12px rgba(0,0,0,.16); }
      .chx-guard-stack > *:first-child { margin-left: 0; }

      input:focus, textarea:focus { outline: none; border-color: rgba(124,180,255,.5) !important; box-shadow: 0 0 0 3px rgba(124,180,255,.12) !important; }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
      }
    `;
  }, []);

  return null;
}
