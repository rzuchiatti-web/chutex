import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';

/**
 * PastelMistBackground - Reproduit le fond brume pastel de reference
 * 3 blobs principaux : rose/rouge, orange/dore, lavande/bleu
 * Fond blanc, blur tres eleve, mouvement organique lent
 */

const BLOBS = [
  // Orange/gold - top center, flowing down-right
  { colors: ['#F8E4B4', '#E6B78C'], size: 420, x: '40%', y: '-5%', blur: 120, opacity: 0.55, dur: 30, kf: 0 },
  // Pink/rose - center left, main warm blob
  { colors: ['#E9B6C0', '#D68B9A'], size: 480, x: '10%', y: '20%', blur: 100, opacity: 0.50, dur: 26, kf: 1 },
  // Orange-pink transition - between pink and gold
  { colors: ['#DE9D9D', '#E6B78C'], size: 300, x: '30%', y: '12%', blur: 110, opacity: 0.40, dur: 34, kf: 2 },
  // Lavender/purple - large, bottom center-right
  { colors: ['#C0B8D9', '#D4B2C4'], size: 600, x: '20%', y: '45%', blur: 120, opacity: 0.45, dur: 38, kf: 3 },
  // Soft blue - right side, blending with lavender
  { colors: ['#A7C0E6', '#C0B8D9'], size: 350, x: '55%', y: '35%', blur: 130, opacity: 0.30, dur: 28, kf: 4 },
];

function WebMistBackground() {
  if (typeof document !== 'undefined' && !document.getElementById('pastel-mist-v2')) {
    const style = document.createElement('style');
    style.id = 'pastel-mist-v2';
    style.textContent = `
      @keyframes md0{0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}30%{transform:translate(25px,-15px) scale(1.06) rotate(3deg)}60%{transform:translate(-10px,20px) scale(0.97) rotate(-2deg)}}
      @keyframes md1{0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}25%{transform:translate(-20px,25px) scale(1.05) rotate(-3deg)}55%{transform:translate(15px,-10px) scale(0.96) rotate(2deg)}80%{transform:translate(-8px,5px) scale(1.02) rotate(-1deg)}}
      @keyframes md2{0%,100%{transform:translate(0,0) scale(1)}35%{transform:translate(18px,15px) scale(1.04)}65%{transform:translate(-12px,-20px) scale(0.97)}}
      @keyframes md3{0%,100%{transform:translate(0,0) scale(1) rotate(0deg)}40%{transform:translate(-15px,18px) scale(1.03) rotate(2deg)}70%{transform:translate(20px,-12px) scale(0.98) rotate(-1deg)}}
      @keyframes md4{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(12px,-18px) scale(1.05)}}
      @media(prefers-reduced-motion:reduce){.mist-v2{animation:none!important}}
    `;
    document.head.appendChild(style);
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
      background: '#FFFFFF',
    }}>
      {BLOBS.map((b, i) => (
        <div key={i} className="mist-v2" style={{
          position: 'absolute',
          left: b.x, top: b.y,
          width: b.size, height: b.size,
          borderRadius: '45% 55% 50% 50% / 50% 45% 55% 50%',
          background: `radial-gradient(ellipse at 40% 40%, ${b.colors[0]} 0%, ${b.colors[1]} 40%, transparent 70%)`,
          opacity: b.opacity,
          filter: `blur(${b.blur}px)`,
          animation: `md${b.kf} ${b.dur}s ease-in-out infinite`,
          willChange: 'transform',
        }} />
      ))}
    </div>
  );
}

export function PastelMistBackground() {
  if (Platform.OS !== 'web') {
    return (
      <View style={[StyleSheet.absoluteFillObject, { zIndex: -1, backgroundColor: '#FFFFFF' }]} pointerEvents="none">
        <View style={{ position: 'absolute', top: -50, left: '10%', width: 480, height: 480, borderRadius: 240, backgroundColor: '#E9B6C0', opacity: 0.25 }} />
        <View style={{ position: 'absolute', top: -30, left: '40%', width: 400, height: 400, borderRadius: 200, backgroundColor: '#F8E4B4', opacity: 0.20 }} />
        <View style={{ position: 'absolute', top: '45%', left: '20%', width: 600, height: 600, borderRadius: 300, backgroundColor: '#C0B8D9', opacity: 0.22 }} />
      </View>
    );
  }
  return <WebMistBackground />;
}
