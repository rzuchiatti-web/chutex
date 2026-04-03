import React from 'react';

export function GlassOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.4)', overflowY: 'auto', animation: 'glassIn 0.3s ease' } as any}>
      <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '70px 24px 120px', boxSizing: 'border-box' } as any}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 } as any}>
          <div data-testid="close-popup" onClick={onClose} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} />
          </div>
        </div>
        {children}
      </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes glassIn{from{opacity:0}to{opacity:1}} @keyframes pulseRing{0%{transform:scale(1);opacity:0.4}100%{transform:scale(2.5);opacity:0}} @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}' }} />
    </div>
  );
}
