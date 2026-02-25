import React from 'react';
import { useRouter } from 'expo-router';

const G: any = { borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };

export default function IntervenantCard({ assignedIv, alertId }: { assignedIv: any; alertId: string }) {
  const router = useRouter();
  if (!assignedIv) return null;

  return (
    <div style={{ ...G, padding: '16px', marginBottom: 12, borderColor: 'rgba(124,92,255,0.2)' } as any}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Intervenant assigne</div>
      <div onClick={() => { if (assignedIv.intervenant_id || assignedIv.assigned_to) router.push({ pathname: '/guardian-detail' as any, params: { guardianId: assignedIv.intervenant_id || assignedIv.assigned_to } }); }} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 12 } as any}>
        <div style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(124,92,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#A78BFA' }}>{(assignedIv.intervenant_name || 'I').charAt(0)}</span></div>
        <div style={{ flex: 1 } as any}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>{assignedIv.intervenant_name}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{assignedIv.status === 'accepted' ? 'Intervention acceptee' : assignedIv.status === 'en_route' ? 'En route' : assignedIv.status === 'on_site' ? 'Sur place' : assignedIv.status}</div>
          {assignedIv.intervenant_profile?.structure_name && <div style={{ fontSize: 10, color: 'rgba(167,139,250,0.6)', marginTop: 2 }}>{assignedIv.intervenant_profile.structure_name}</div>}
        </div>
        {(assignedIv.intervenant_phone || assignedIv.intervenant_profile?.phone) && <a href={`tel:${assignedIv.intervenant_phone || assignedIv.intervenant_profile?.phone}`} onClick={(e: any) => e.stopPropagation()} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' } as any}><i className="ri-phone-line" style={{ fontSize: 16, color: '#10B981' }} /></a>}
        <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.15)' }} />
      </div>
      <div onClick={() => router.push({ pathname: '/intervention-map' as any, params: { interventionId: assignedIv.id || '', alertId } })} style={{ padding: '12px', borderRadius: 12, background: 'rgba(124,92,255,0.12)', border: '1px solid rgba(124,92,255,0.2)', cursor: 'pointer', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
        <i className="ri-map-pin-range-line" style={{ fontSize: 16, color: '#A78BFA' }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#A78BFA' }}>Suivre l'intervention sur la carte</span>
      </div>
    </div>
  );
}
