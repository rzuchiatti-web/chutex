import React from 'react';
import { Platform } from 'react-native';
import { useI18n } from '../context/I18nContext';

export default function FullScreenLoader() {
  if (Platform.OS !== 'web') {
    const { View, ActivityIndicator } = require('react-native');
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}><ActivityIndicator size="large" color="#FFF" /></View>;
  }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' } as any}>
      <video autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} src="https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/c2ilm5te_background_loader.mp4" />
      <div style={{ position: 'relative', zIndex: 2, marginTop: '55vh', textAlign: 'center' } as any}>
        <span style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: 0.3 }}>
          Chargement en cours
          <span style={{ display: 'inline-flex', width: 22, justifyContent: 'flex-start', marginLeft: 2 } as any}>
            <span style={{ animation: 'ldot 1.4s infinite', animationDelay: '0s' }}>.</span>
            <span style={{ animation: 'ldot 1.4s infinite', animationDelay: '0.2s' }}>.</span>
            <span style={{ animation: 'ldot 1.4s infinite', animationDelay: '0.4s' }}>.</span>
          </span>
        </span>
      </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes ldot{0%,80%,100%{opacity:0.15}40%{opacity:1}}' }} />
    </div>
  );
}
