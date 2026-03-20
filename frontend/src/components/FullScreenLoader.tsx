import React from 'react';
import { Platform } from 'react-native';

const VIDEO_BG = 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/8h3820je_dna%281%29.webm';

export default function FullScreenLoader() {
  if (Platform.OS !== 'web') {
    const { View, Text } = require('react-native');
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#050510' }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#FFF' }}>Analyse en cours...</Text>
      </View>
    );
  }
  return (
    <div data-loader-active="true" style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050510' } as any}>
      <video autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 } as any} src={VIDEO_BG} />
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes analyse-dots{0%{content:''}25%{content:'.'}50%{content:'..'}75%{content:'...'}100%{content:''}}
        .analyse-dots::after{content:'';animation:analyse-dots 1.5s steps(4,end) infinite;display:inline}
        .glass-tab-bar-root { display: none !important; }
      `}} />
      <span className="analyse-dots" style={{ position: 'relative', zIndex: 2, fontSize: 15, fontWeight: 600, color: '#FFF', letterSpacing: 0.3 }}>Analyse en cours</span>
    </div>
  );
}
