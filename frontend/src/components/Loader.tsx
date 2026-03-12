import React from 'react';

export default function Loader() {
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
