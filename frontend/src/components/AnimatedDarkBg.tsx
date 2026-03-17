import React from 'react';

export default function AnimatedDarkBg() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, background: '#111316' } as any}>
      <style>{`
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          25% { transform: translate(15%, -10%) scale(1.1); }
          50% { transform: translate(-5%, 15%) scale(0.95); }
          75% { transform: translate(-12%, -5%) scale(1.05); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          30% { transform: translate(-18%, 12%) scale(1.08); }
          60% { transform: translate(10%, -8%) scale(0.92); }
          80% { transform: translate(5%, 18%) scale(1.04); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0%, 0%) scale(1); }
          20% { transform: translate(12%, 15%) scale(1.06); }
          45% { transform: translate(-15%, -12%) scale(0.94); }
          70% { transform: translate(8%, -6%) scale(1.1); }
        }
        @keyframes grainDrift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(-50px, -50px); }
        }
      `}</style>

      {/* Orb 1 — Deep blue, top-left */}
      <div style={{
        position: 'absolute',
        top: '-20%', left: '-10%',
        width: '70%', height: '60%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(30,58,95,0.35) 0%, transparent 70%)',
        animation: 'orbFloat1 25s ease-in-out infinite',
        willChange: 'transform',
      } as any} />

      {/* Orb 2 — Teal accent, center-right */}
      <div style={{
        position: 'absolute',
        top: '30%', right: '-15%',
        width: '60%', height: '55%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,120,110,0.2) 0%, transparent 70%)',
        animation: 'orbFloat2 30s ease-in-out infinite',
        willChange: 'transform',
      } as any} />

      {/* Orb 3 — Subtle purple, bottom-left */}
      <div style={{
        position: 'absolute',
        bottom: '-10%', left: '5%',
        width: '55%', height: '50%',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(80,40,120,0.18) 0%, transparent 70%)',
        animation: 'orbFloat3 35s ease-in-out infinite',
        willChange: 'transform',
      } as any} />

      {/* Subtle grain overlay */}
      <div style={{
        position: 'absolute', inset: '-50px',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
        backgroundSize: '128px 128px',
        opacity: 0.5,
        animation: 'grainDrift 8s linear infinite',
        pointerEvents: 'none',
      } as any} />
    </div>
  );
}
