import React, { useState } from 'react';
import { API, uploadImage, DAYS_FR } from './constants';

export function GlassModal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div data-testid="glass-modal" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', background: 'rgba(0,0,0,0.35)' } as any}>
      <style>{`.glass-tab-bar-root { display: none !important; }`}</style>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, maxHeight: '85vh', overflowY: 'auto', padding: '24px 20px 100px', WebkitOverflowScrolling: 'touch', borderRadius: '28px 28px 0 0', background: '#FFFFFF', boxShadow: '0 -8px 40px rgba(0,0,0,0.12)' } as any}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: '#D1D5DB', margin: '0 auto 16px' } as any} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#111' }}>{title}</div>
          <div onClick={onClose} style={{ width: 34, height: 34, borderRadius: 999, background: '#F4F4F5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-close-line" style={{ fontSize: 16, color: '#6B7280' }} />
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
    <div onClick={pick} style={{ width: '100%', height: 140, borderRadius: 16, border: '2px dashed #D1D5DB', background: value ? 'none' : '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', position: 'relative', marginBottom: 14 } as any}>
      {value ? <img src={value.startsWith('/') ? `${API}${value}` : value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} /> : (
        <div style={{ textAlign: 'center', color: '#9CA3AF' } as any}>
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
              background: sel ? '#111' : '#F4F4F5',
              border: sel ? '1.5px solid #111' : '1px solid #E5E7EB',
              cursor: 'pointer', fontSize: 12, fontWeight: 700,
              color: sel ? '#FFF' : '#6B7280', textTransform: 'capitalize', transition: 'all 0.2s' } as any}>
            {d.slice(0, 3)}
          </div>
        );
      })}
    </div>
  );
}
