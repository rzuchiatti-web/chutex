import React from 'react';

export default function AnimatedDarkBg() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 } as any}>
      <style>{`
        @keyframes glow1 {
          0%, 100% { transform: translate(0%, 0%) scale(1); opacity: 0.35; }
          30% { transform: translate(12%, -15%) scale(1.15); opacity: 0.5; }
          60% { transform: translate(-8%, 10%) scale(0.9); opacity: 0.3; }
          80% { transform: translate(5%, -5%) scale(1.05); opacity: 0.45; }
        }
        @keyframes glow2 {
          0%, 100% { transform: translate(0%, 0%) scale(1); opacity: 0.25; }
          25% { transform: translate(-15%, 8%) scale(1.1); opacity: 0.4; }
          55% { transform: translate(10%, -12%) scale(0.95); opacity: 0.2; }
          75% { transform: translate(-5%, 15%) scale(1.08); opacity: 0.35; }
        }
        @keyframes glow3 {
          0%, 100% { transform: translate(0%, 0%) scale(1); opacity: 0.2; }
          20% { transform: translate(8%, 12%) scale(1.12); opacity: 0.38; }
          50% { transform: translate(-12%, -8%) scale(0.88); opacity: 0.18; }
          70% { transform: translate(15%, -3%) scale(1.06); opacity: 0.32; }
        }
      `}</style>

      {/* Base */}
      <div style={{ position: 'absolute', inset: 0, background: '#0a0a0e' } as any} />

      {/* Glow 1 — Purple, top-left area */}
      <div style={{
        position: 'absolute',
        top: '-15%', left: '-5%',
        width: '65%', height: '55%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(120,60,200,0.22) 0%, rgba(90,40,160,0.08) 40%, transparent 70%)',
        filter: 'blur(60px)',
        animation: 'glow1 20s ease-in-out infinite',
        willChange: 'transform, opacity',
      } as any} />

      {/* Glow 2 — Violet-pink, center-right */}
      <div style={{
        position: 'absolute',
        top: '35%', right: '-10%',
        width: '55%', height: '50%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(150,50,180,0.18) 0%, rgba(100,30,150,0.06) 40%, transparent 70%)',
        filter: 'blur(70px)',
        animation: 'glow2 28s ease-in-out infinite',
        willChange: 'transform, opacity',
      } as any} />

      {/* Glow 3 — Deep indigo, bottom-left */}
      <div style={{
        position: 'absolute',
        bottom: '-10%', left: '10%',
        width: '50%', height: '45%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(80,50,180,0.2) 0%, rgba(60,30,140,0.06) 40%, transparent 70%)',
        filter: 'blur(65px)',
        animation: 'glow3 24s ease-in-out infinite',
        willChange: 'transform, opacity',
      } as any} />

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 40%, transparent 25%, rgba(0,0,0,0.55) 100%)',
      } as any} />
    </div>
  );
}
