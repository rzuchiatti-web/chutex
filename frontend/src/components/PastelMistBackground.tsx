import React, { useEffect, useRef } from 'react';
import { Platform, View, StyleSheet } from 'react-native';

/**
 * PastelMistBackground - Brume pastel animée premium
 * 
 * Injecté au niveau racine, derrière tout le contenu.
 * GPU-friendly (transform/opacity only), respecte prefers-reduced-motion.
 * 
 * Palette: Rose #F7C7D9, Pêche #F6D0B1, Bleu #CFE6FF, Lavande #D8CFF3
 * 3-5 blobs superposés, dérive lente 18-40s, opacité 8-22%
 */

const BLOBS = [
  { color: '#F7C7D9', size: 500, x: '10%', y: '-5%',  dur: 28, delay: 0,   opacity: 0.18 },
  { color: '#CFE6FF', size: 600, x: '55%', y: '15%',  dur: 35, delay: 2,   opacity: 0.15 },
  { color: '#D8CFF3', size: 450, x: '-5%', y: '50%',  dur: 22, delay: 5,   opacity: 0.16 },
  { color: '#F6D0B1', size: 550, x: '60%', y: '55%',  dur: 32, delay: 8,   opacity: 0.14 },
  { color: '#F7C7D9', size: 400, x: '30%', y: '80%',  dur: 40, delay: 3,   opacity: 0.12 },
];

function WebMistBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Check prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Inject keyframes once
    const styleId = 'pastel-mist-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes mist-drift-0 { 0%,100%{transform:translate(0,0) scale(1)} 25%{transform:translate(30px,-20px) scale(1.05)} 50%{transform:translate(-15px,25px) scale(0.97)} 75%{transform:translate(20px,10px) scale(1.03)} }
        @keyframes mist-drift-1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-25px,15px) scale(1.04)} 66%{transform:translate(20px,-18px) scale(0.96)} }
        @keyframes mist-drift-2 { 0%,100%{transform:translate(0,0) scale(1)} 20%{transform:translate(18px,22px) scale(1.06)} 50%{transform:translate(-22px,-12px) scale(0.95)} 80%{transform:translate(12px,-20px) scale(1.02)} }
        @keyframes mist-drift-3 { 0%,100%{transform:translate(0,0) scale(1) rotate(0deg)} 35%{transform:translate(-20px,18px) scale(1.03) rotate(2deg)} 70%{transform:translate(15px,-15px) scale(0.98) rotate(-1deg)} }
        @keyframes mist-drift-4 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(22px,-25px) scale(1.04)} 60%{transform:translate(-18px,20px) scale(0.97)} }
        @media (prefers-reduced-motion: reduce) { .mist-blob { animation: none !important; } }
      `;
      document.head.appendChild(style);
    }

    // Also set body background as fallback
    document.body.style.background = '#F5F0EB';

    return () => {};
  }, []);

  return (
    <div ref={ref} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
      background: '#F5F0EB',
    }}>
      {BLOBS.map((b, i) => (
        <div key={i} className="mist-blob" style={{
          position: 'absolute',
          left: b.x, top: b.y,
          width: b.size, height: b.size,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
          opacity: b.opacity,
          filter: 'blur(80px)',
          animation: `mist-drift-${i % 5} ${b.dur}s ease-in-out ${b.delay}s infinite`,
          willChange: 'transform',
        }} />
      ))}
      {/* Subtle grain overlay for depth */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.015'/%3E%3C/svg%3E")`,
        backgroundSize: '200px 200px',
        opacity: 0.5,
      }} />
    </div>
  );
}

export function PastelMistBackground() {
  if (Platform.OS !== 'web') {
    // Native: static pastel gradient fallback
    return (
      <View style={[StyleSheet.absoluteFillObject, { zIndex: -1 }]} pointerEvents="none">
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#F5F0EB' }]} />
        <View style={{ position: 'absolute', top: -100, left: -50, width: 400, height: 400, borderRadius: 200, backgroundColor: '#F7C7D9', opacity: 0.12 }} />
        <View style={{ position: 'absolute', top: 200, right: -80, width: 500, height: 500, borderRadius: 250, backgroundColor: '#CFE6FF', opacity: 0.10 }} />
        <View style={{ position: 'absolute', bottom: -50, left: -30, width: 350, height: 350, borderRadius: 175, backgroundColor: '#D8CFF3', opacity: 0.12 }} />
      </View>
    );
  }

  return <WebMistBackground />;
}
