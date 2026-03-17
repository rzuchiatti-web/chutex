import React from 'react';

export default function AnimatedDarkBg() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 } as any}>
      <style>{`
        @keyframes meshShift {
          0%, 100% { background-position: 0% 0%; }
          25% { background-position: 100% 0%; }
          50% { background-position: 100% 100%; }
          75% { background-position: 0% 100%; }
        }
        @keyframes meshShift2 {
          0%, 100% { background-position: 100% 100%; }
          25% { background-position: 0% 100%; }
          50% { background-position: 0% 0%; }
          75% { background-position: 100% 0%; }
        }
      `}</style>

      {/* Base layer — deep black */}
      <div style={{ position: 'absolute', inset: 0, background: '#0c0d0f' } as any} />

      {/* Layer 1 — Primary shifting gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 20% 50%, rgba(15,30,55,0.6) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(10,45,40,0.4) 0%, transparent 50%), radial-gradient(ellipse at 60% 80%, rgba(25,15,45,0.35) 0%, transparent 50%)',
        backgroundSize: '200% 200%',
        animation: 'meshShift 40s ease-in-out infinite',
      } as any} />

      {/* Layer 2 — Counter-moving accent */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 70% 60%, rgba(20,50,70,0.3) 0%, transparent 45%), radial-gradient(ellipse at 30% 30%, rgba(40,20,50,0.2) 0%, transparent 45%)',
        backgroundSize: '200% 200%',
        animation: 'meshShift2 55s ease-in-out infinite',
      } as any} />

      {/* Vignette — darkens edges for depth */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 40%, transparent 30%, rgba(0,0,0,0.5) 100%)',
      } as any} />
    </div>
  );
}
