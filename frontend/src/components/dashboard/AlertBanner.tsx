import React from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../context/I18nContext';

interface Props { activeAlerts: any[]; isDark?: boolean; }

export default function AlertBanner({ activeAlerts, isDark = true }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const hasAlerts = activeAlerts.length > 0;

  const bgColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.55)';
  const textColor = isDark ? '#FFF' : '#1A1A2E';
  const subColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';

  return (
    <div data-testid="alert-banner" onClick={() => router.push('/(tabs)/alerts' as any)} style={{
      borderRadius: 16, overflow: 'hidden', position: 'relative', padding: '14px 16px',
      marginBottom: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: bgColor,
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.4)',
      transition: 'background 0.3s',
    } as any}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 } as any}>
        <div style={{ fontSize: 32, fontWeight: 900, color: textColor }}>{activeAlerts.length}</div>
        <div style={{ width: 1, height: 32, background: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', flexShrink: 0 } as any} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: textColor }}>Alerte{activeAlerts.length !== 1 ? 's' : ''}</div>
          <div style={{ fontSize: 11, color: subColor }}>{hasAlerts ? `${activeAlerts.length} alertes en cours` : t('no_alert')}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
        {hasAlerts ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.25)' } as any}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: '#EF4444' } as any} />
            <span style={{ fontSize: 10, fontWeight: 600, color: textColor }}>Active</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.2)' } as any}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: '#10B981' } as any} />
            <span style={{ fontSize: 10, fontWeight: 600, color: '#10B981' }}>Cloturee</span>
          </div>
        )}
        <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)' }} />
      </div>
    </div>
  );
}
