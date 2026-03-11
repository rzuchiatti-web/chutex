import React from 'react';
import { Platform } from 'react-native';

const VIDEO_BG = 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/8h3820je_dna%281%29.webm';

export default function FullScreenLoader() {
  if (Platform.OS !== 'web') {
    const { View, ActivityIndicator } = require('react-native');
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050510' }}><ActivityIndicator size="large" color="#FFF" /></View>;
  }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050510' } as any}>
      <video autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 } as any} src={VIDEO_BG} />
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loader-orbit{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
        @keyframes loader-pulse{0%,100%{opacity:0.3;transform:scale(0.8)}50%{opacity:1;transform:scale(1)}}
        @keyframes loader-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      ` }} />
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'loader-fade 600ms ease' } as any}>
        {/* Orbital ring loader */}
        <div style={{ width: 48, height: 48, position: 'relative', marginBottom: 16 } as any}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.06)' } as any} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#FFF', animation: 'loader-orbit 1.2s linear infinite' } as any} />
          <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: '1.5px solid transparent', borderTopColor: 'rgba(255,255,255,0.4)', animation: 'loader-orbit 0.8s linear infinite reverse' } as any} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', width: 6, height: 6, borderRadius: '50%', background: '#FFF', transform: 'translate(-50%, -50%)', animation: 'loader-pulse 1.5s ease infinite' } as any} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, textTransform: 'uppercase' }}>Analyse en cours</div>
      </div>
    </div>
  );
}
