import React from 'react';
import { Redirect, usePathname } from 'expo-router';

export default function NotFoundScreen() {
  const pathname = usePathname();

  if ((pathname || '').startsWith('/geofencing')) {
    return <Redirect href={'/(tabs)/index' as any} />;
  }

  return (
    <div data-testid="app-not-found-screen" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at 20% 20%, #0B253A, #020617)', color: '#FFF', fontFamily: "'Inter', system-ui, sans-serif", padding: 16 } as any}>
      <div style={{ textAlign: 'center' } as any}>
        <div style={{ fontSize: 34, fontWeight: 900, marginBottom: 8 }}>404</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>Page introuvable.</div>
      </div>
    </div>
  );
}
