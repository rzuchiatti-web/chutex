import React from 'react';
import { useRouter } from 'expo-router';

interface Props { activeAlerts: any[]; position?: 'top' | 'bottom'; }

export default function AlertBanner({ activeAlerts, position = 'top' }: Props) {
  const router = useRouter();
  if (activeAlerts.length === 0) {
    if (position === 'bottom') return (
      <div onClick={() => router.push('/(tabs)/alerts' as any)} style={{ padding: '14px 18px', borderRadius: 20, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', marginBottom: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 } as any}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-shield-check-line" style={{ fontSize: 18, color: '#10B981' }} /></div>
        <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Aucune alerte</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Consulter l'historique des alertes</div></div>
        <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }} />
      </div>
    );
    return null;
  }
  return (
    <div data-testid="alert-banner" onClick={() => router.push('/(tabs)/alerts' as any)} style={{ borderRadius: 20, padding: '16px 18px', marginBottom: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 } as any}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-alarm-warning-line" style={{ fontSize: 20, color: '#EF4444' }} /></div>
        <div><div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{activeAlerts.length} Alerte{activeAlerts.length !== 1 ? 's' : ''}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{activeAlerts.length} en cours</div></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.2)' } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: '#EF4444' } as any} /><span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>Active</span></div>
        <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)' }} />
      </div>
    </div>
  );
}
