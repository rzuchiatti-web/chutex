import { useI18n } from '../../context/I18nContext';
import React from 'react';

export default function AdminDevices({ data, token, mob }: any) {
  const { t } = useI18n();
  const devices = data?.devices || [];
  const summary = data?.summary || {};

  const byType = (type: string) => devices.filter((d: any) => d.device_type === type);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' } as any}>
      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr 1fr' : 'repeat(5, 1fr)', gap: 14, marginBottom: 24 } as any}>
        {[
          { v: summary.total || 0, l: 'Total appareils', i: 'ri-cpu-line', c: '#3B82F6', bg: '#EFF6FF' },
          { v: summary.bracelets || 0, l: 'Bracelets', i: 'ri-heart-pulse-line', c: '#8B5CF6', bg: '#F5F3FF' },
          { v: summary.scales || 0, l: 'Balances', i: 'ri-scales-3-line', c: '#10B981', bg: '#F0FDF4' },
          { v: summary.connected || 0, l: 'Connectes', i: 'ri-wifi-line', c: '#059669', bg: '#ECFDF5' },
          { v: summary.low_battery || 0, l: 'Batterie faible', i: 'ri-battery-low-line', c: summary.low_battery > 0 ? '#EF4444' : '#94A3B8', bg: summary.low_battery > 0 ? '#FEF2F2' : '#F8FAFC' },
        ].map((k, i) => (
          <div key={i} className="adm-card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: mob ? 14 : 20 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className={k.i} style={{ fontSize: 19, color: k.c }} /></div>
            <div><div style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>{k.v}</div><div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{k.l}</div></div>
          </div>
        ))}
      </div>

      {devices.length === 0 ? (
        <div className="adm-card" style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
          <i className="ri-cpu-line" style={{ fontSize: 40, marginBottom: 12, display: 'block', opacity: 0.4 }} />
          Aucun appareil enregistré
        </div>
      ) : (
        <>
          {/* Bracelets */}
          {byType('bracelet').length > 0 && (
            <div style={{ marginBottom: 24 } as any}>
              <div className="adm-section-title">Bracelets ({byType('bracelet').length})</div>
              <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 12 } as any}>
                {byType('bracelet').map((d: any, i: number) => (
                  <div key={i} className="adm-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: d.connected ? '#F0FDF4' : '#F8FAFC', border: `1.5px solid ${d.connected ? '#BBF7D0' : '#E2E8F0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                      <i className="ri-heart-pulse-line" style={{ fontSize: 20, color: d.connected ? '#10B981' : '#CBD5E1' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 } as any}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{d.name || t('bracelet')}</div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{d.user_name} · {d.user_phone}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' } as any}>
                        <i className={(d.battery || 100) < 20 ? 'ri-battery-low-line' : 'ri-battery-2-charge-line'} style={{ fontSize: 14, color: (d.battery || 100) < 20 ? '#EF4444' : '#10B981' }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#1E293B' }}>{d.battery || 100}%</span>
                      </div>
                      <div style={{ width: 8, height: 8, borderRadius: 4, background: d.connected ? '#10B981' : '#CBD5E1', display: 'inline-block', marginTop: 4 } as any} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scales */}
          {byType('scale').length > 0 && (
            <div>
              <div className="adm-section-title">Balances ({byType('scale').length})</div>
              <div style={{ display: 'grid', gridTemplateColumns: mob ? '1fr' : '1fr 1fr', gap: 12 } as any}>
                {byType('scale').map((d: any, i: number) => (
                  <div key={i} className="adm-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: d.connected ? '#F0FDF4' : '#F8FAFC', border: `1.5px solid ${d.connected ? '#BBF7D0' : '#E2E8F0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                      <i className="ri-scales-3-line" style={{ fontSize: 20, color: d.connected ? '#10B981' : '#CBD5E1' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 } as any}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{d.name || t('scale')}</div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{d.user_name} · {d.user_phone}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' } as any}>
                        <i className="ri-battery-2-charge-line" style={{ fontSize: 14, color: '#10B981' }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#1E293B' }}>{d.battery || 100}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
