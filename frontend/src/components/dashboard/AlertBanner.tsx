import React from 'react';
import { useRouter } from 'expo-router';

interface Props { activeAlerts: any[]; }

export default function AlertBanner({ activeAlerts }: Props) {
  const router = useRouter();
  const hasAlerts = activeAlerts.length > 0;

  return (
    <div data-testid="alert-banner" onClick={() => router.push('/(tabs)/alerts' as any)} style={{
      borderRadius: 20, padding: '16px 18px', marginBottom: 16, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: hasAlerts ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.08)',
      border: `1px solid ${hasAlerts ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)'}`,
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    } as any}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 } as any}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: hasAlerts ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
          <i className={hasAlerts ? 'ri-alarm-warning-line' : 'ri-shield-check-line'} style={{ fontSize: 20, color: hasAlerts ? '#EF4444' : '#10B981' }} />
        </div>
        <div>
          <div style={{ fontSize: hasAlerts ? 18 : 13, fontWeight: hasAlerts ? 900 : 700, color: '#FFF' }}>
            {hasAlerts ? `${activeAlerts.length} Alerte${activeAlerts.length !== 1 ? 's' : ''}` : 'Aucune alerte'}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
            {hasAlerts ? `${activeAlerts.length} en cours` : 'Consulter l\'historique'}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
        {hasAlerts && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.2)' } as any}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: '#EF4444' } as any} />
            <span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>Active</span>
          </div>
        )}
        <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)' }} />
      </div>
    </div>
  );
}
