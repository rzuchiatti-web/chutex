import React from 'react';
import { useRouter } from 'expo-router';

const G: any = { borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };

export default function GuardiansCard({ guards }: { guards: any[] }) {
  const router = useRouter();

  return (
    <div style={{ ...G, padding: '16px', marginBottom: 12 } as any}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Gardiens ({guards.length})</div>
      {guards.map((g: any, i: number) => (
        <div key={g.id || i} onClick={() => router.push({ pathname: '/guardian-detail' as any, params: { guardianId: g.id } })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 6, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' } as any}>
          <div style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 14, fontWeight: 800, color: '#10B981' }}>{g.name?.charAt(0)}</span></div>
          <div style={{ flex: 1 } as any}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{g.name}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{g.relationship || g.guardian_type} - {g.phone}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 } as any}>
            {g.phone && <a href={`tel:${g.phone}`} onClick={(e: any) => e.stopPropagation()} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' } as any}><i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981' }} /></a>}
            <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.15)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
