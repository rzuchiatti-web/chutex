import React from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../context/I18nContext';

interface Props { activeAlerts: any[]; }

export default function AlertBanner({ activeAlerts }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const hasAlerts = activeAlerts.length > 0;

  return (
    <div data-testid="alert-banner" onClick={() => router.push('/(tabs)/alerts' as any)} style={{
      borderRadius: 16, overflow: 'hidden', position: 'relative', padding: '14px 16px',
      marginBottom: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(255,255,255,0.12)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.15)',
    } as any}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 } as any}>
        <div style={{ fontSize: 32, fontWeight: 900, color: '#FFF' }}>{activeAlerts.length}</div>
        <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.2)', flexShrink: 0 } as any} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Alerte{activeAlerts.length !== 1 ? 's' : ''}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{hasAlerts ? `${activeAlerts.length} alertes en cours` : t('no_alert')}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
        {hasAlerts ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.3)' } as any}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: '#EF4444' } as any} />
            <span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>Active</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.2)' } as any}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: '#10B981' } as any} />
            <span style={{ fontSize: 10, fontWeight: 600, color: '#10B981' }}>Cloturee</span>
          </div>
        )}
        <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }} />
      </div>
    </div>
  );
}
