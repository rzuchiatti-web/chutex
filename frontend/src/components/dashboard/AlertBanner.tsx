import React from 'react';
import { useRouter } from 'expo-router';

interface Props { activeAlerts: any[]; }

const BG_RED = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
const BG_GREEN = 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/75gbxosw_physique.png';

export default function AlertBanner({ activeAlerts }: Props) {
  const router = useRouter();
  const hasAlerts = activeAlerts.length > 0;

  return (
    <div data-testid="alert-banner" onClick={() => router.push('/(tabs)/alerts' as any)} style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', padding: '16px 18px', marginBottom: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
      {hasAlerts ? (
        <img src={BG_RED} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(16,185,129,0.25), rgba(6,95,70,0.3))', zIndex: 0 } as any} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 14, flex: 1 } as any}>
        <div style={{ fontSize: 32, fontWeight: 900, color: '#FFF' }}>{hasAlerts ? activeAlerts.length : 0}</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{hasAlerts ? `Alerte${activeAlerts.length !== 1 ? 's' : ''}` : 'Alerte'}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{hasAlerts ? `${activeAlerts.length} en cours` : 'Aucune alerte en cours'}</div>
        </div>
      </div>
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 6 } as any}>
        {hasAlerts ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.3)' } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: '#EF4444' } as any} /><span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>Active</span></div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.2)' } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: '#10B981' } as any} /><span style={{ fontSize: 10, fontWeight: 600, color: '#10B981' }}>Cloturee</span></div>
        )}
        <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }} />
      </div>
    </div>
  );
}
