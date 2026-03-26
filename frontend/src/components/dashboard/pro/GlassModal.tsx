import React, { useState } from 'react';
import { API, uploadImage, DAYS_FR } from './constants';

export function GlassModal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div data-testid="glass-modal" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', background: 'rgba(0,0,0,0.55)' } as any}>
      <style>{`.glass-tab-bar-root { display: none !important; }`}</style>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, maxHeight: '85vh', overflowY: 'auto', padding: '24px 20px 100px', WebkitOverflowScrolling: 'touch', borderRadius: '28px 28px 0 0', background: 'rgba(20,20,30,0.82)', backdropFilter: 'blur(60px)', WebkitBackdropFilter: 'blur(60px)', border: '1px solid rgba(255,255,255,0.12)', borderBottom: 'none' } as any}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 auto 16px' } as any} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{title}</div>
          <div onClick={onClose} style={{ width: 34, height: 34, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-close-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }} />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ImagePicker({ value, onChange, token }: { value: string; onChange: (url: string) => void; token: string }) {
  const [uploading, setUploading] = useState(false);
  const pick = async () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
    input.onchange = async () => {
      const f = input.files?.[0]; if (!f) return;
      setUploading(true);
      try { const url = await uploadImage(f, token); onChange(url); } catch {} finally { setUploading(false); }
    };
    input.click();
  };
  return (
    <div onClick={pick} style={{ width: '100%', height: 140, borderRadius: 16, border: '2px dashed rgba(255,255,255,0.15)', background: value ? 'none' : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative', marginBottom: 14 } as any}>
      {value ? <img src={value.startsWith('/') ? `${API}${value}` : value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} /> : (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' } as any}>
          <i className={uploading ? 'ri-loader-4-line ri-spin' : 'ri-image-add-line'} style={{ fontSize: 28, display: 'block', marginBottom: 6 }} />
          <div style={{ fontSize: 12, fontWeight: 600 }}>{uploading ? 'Upload...' : 'Ajouter une image'}</div>
        </div>
      )}
      {value && <div style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-pencil-line" style={{ fontSize: 14, color: '#FFF' }} /></div>}
    </div>
  );
}

export function DaysPicker({ selected, onChange, accent }: { selected: string[]; onChange: (days: string[]) => void; accent: string }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' } as any}>
      {DAYS_FR.map(d => {
        const sel = selected.includes(d);
        return (
          <div key={d} data-testid={`day-${d}`} onClick={() => onChange(sel ? selected.filter(x => x !== d) : [...selected, d])}
            style={{ padding: '8px 12px', borderRadius: 999,
              background: sel ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.06)',
              backdropFilter: sel ? 'blur(12px)' : 'none', WebkitBackdropFilter: sel ? 'blur(12px)' : 'none',
              border: sel ? '1.5px solid rgba(220,38,38,0.25)' : '1px solid rgba(255,255,255,0.1)',
              boxShadow: sel ? '0 2px 10px rgba(220,38,38,0.1), inset 0 1px 0 rgba(255,255,255,0.06)' : 'none',
              cursor: 'pointer', fontSize: 12, fontWeight: 700,
              color: sel ? '#FFF' : 'rgba(255,255,255,0.4)', textTransform: 'capitalize', transition: 'all 0.2s' } as any}>
            {d.slice(0, 3)}
          </div>
        );
      })}
    </div>
  );
}
