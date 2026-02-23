import React from 'react';
import { Platform } from 'react-native';

export default function FullScreenLoader() {
  if (Platform.OS !== 'web') {
    const { View, ActivityIndicator } = require('react-native');
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}><ActivityIndicator size="large" color="#FFF" /></View>;
  }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', flexDirection: 'column', background: '#000' } as any}>
      <video autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} src="https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/c2ilm5te_background_loader.mp4" />
      <div style={{ position: 'absolute', bottom: 48, left: 0, right: 0, textAlign: 'center', zIndex: 2 } as any}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)', fontFamily: "'Inter', system-ui, sans-serif" }}>Chargement en cours<span style={{ display: 'inline-block', width: 20, textAlign: 'left' }} className="loading-dots">...</span></span>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `.loading-dots{animation:dots 1.4s steps(4,end) infinite}@keyframes dots{0%{content:""}25%{content:"."}50%{content:".."}75%{content:"..."}}` }} />
    </div>
  );
}
