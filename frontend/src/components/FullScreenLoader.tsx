import React from 'react';
import { Platform } from 'react-native';

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
    <div style={{ position: 'fixed', inset: 0, zIndex: 99998, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050510' } as any}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes analyse-dots{0%{content:''}25%{content:'.'}50%{content:'..'}75%{content:'...'}100%{content:''}}
        .analyse-dots::after{content:'';animation:analyse-dots 1.5s steps(4,end) infinite;display:inline}
      `}} />
      <span className="analyse-dots" style={{ fontSize: 15, fontWeight: 600, color: '#FFF', letterSpacing: 0.3 }}>Analyse en cours</span>
    </div>
  );
}
