import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link href="https://cdn.jsdelivr.net/npm/remixicon@4.1.0/fonts/remixicon.css" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `
          html, body { margin: 0; padding: 0; background: #0A0A1A; overflow: hidden; height: 100%; }
          #root { height: 100%; padding-top: env(safe-area-inset-top, 0px); box-sizing: border-box; }
          * { -webkit-overflow-scrolling: touch; }

          /* ═══ Premium Clinical Motion System ═══ */

          /* Staggered reveal — calm upward fade */
          .cl-reveal {
            opacity: 0;
            transform: translateY(16px);
            animation: clReveal 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }
          .cl-reveal-d1 { animation-delay: 0.04s; }
          .cl-reveal-d2 { animation-delay: 0.08s; }
          .cl-reveal-d3 { animation-delay: 0.12s; }
          .cl-reveal-d4 { animation-delay: 0.16s; }
          .cl-reveal-d5 { animation-delay: 0.20s; }
          .cl-reveal-d6 { animation-delay: 0.24s; }
          .cl-reveal-d7 { animation-delay: 0.28s; }
          .cl-reveal-d8 { animation-delay: 0.32s; }
          .cl-reveal-d9 { animation-delay: 0.36s; }
          .cl-reveal-d10 { animation-delay: 0.40s; }
          @keyframes clReveal {
            to { opacity: 1; transform: translateY(0); }
          }

          /* Scale-in for cards */
          .cl-scale-in {
            opacity: 0;
            transform: scale(0.97);
            animation: clScaleIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }
          @keyframes clScaleIn {
            to { opacity: 1; transform: scale(1); }
          }

          /* Premium spring press */
          .cl-press { transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease; }
          .cl-press:active { transform: scale(0.97) !important; opacity: 0.85; }

          /* Glass card hover — subtle lift */
          .cl-card {
            transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), background 0.3s ease, box-shadow 0.3s ease;
          }
          .cl-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          }

          /* Skeleton shimmer */
          .cl-skeleton {
            background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
            background-size: 200% 100%;
            animation: clShimmer 1.8s ease-in-out infinite;
            border-radius: 12px;
          }
          @keyframes clShimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }

          /* Fade-in for modals */
          .cl-modal-enter {
            animation: clModalIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }
          @keyframes clModalIn {
            from { opacity: 0; transform: translateY(12px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          /* Smooth number counter feel */
          .cl-num { font-variant-numeric: tabular-nums; }

          /* Pulse for live indicators */
          .cl-live {
            animation: clLive 2s ease-in-out infinite;
          }
          @keyframes clLive {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }

          /* Spin */
          @keyframes spin { to { transform: rotate(360deg); } }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
