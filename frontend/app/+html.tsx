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
          #root { height: 100%; }
          /* Global safe area — adds 52px padding top to ALL full-screen containers on iOS */
          body { padding-top: env(safe-area-inset-top, 0px) !important; padding-top: constant(safe-area-inset-top, 0px) !important; }
          /* Ensure scrollability */
          * { -webkit-overflow-scrolling: touch; }
          /* Force padding on all absolute/fixed positioned pages */
          @supports (padding-top: env(safe-area-inset-top)) {
            body { padding-top: env(safe-area-inset-top) !important; }
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
