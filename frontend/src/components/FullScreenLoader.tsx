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
      <video autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 } as any} src={VIDEO_BG} />
      <style dangerouslySetInnerHTML={{ __html: '@keyframes loader-bar{0%{width:0%}100%{width:100%}}@keyframes loader-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}' }} />
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'loader-fade 600ms ease' } as any}>
        <div style={{ width: 120, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' } as any}>
          <div style={{ height: 3, borderRadius: 2, background: 'linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.5), rgba(255,255,255,0.1))', animation: 'loader-bar 2s ease-in-out infinite' } as any} />
        </div>
      </div>
    </div>
  );
}
