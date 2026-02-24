import React from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../context/I18nContext';

interface Props { br: any; }

export default function VitalsRow({ br }: Props) {
  const router = useRouter();
  const { t } = useI18n();

  const vitals = [
    {
      val: br.heart_rate, unit: '', label: 'BPM', sublabel: 'Rythme cardiaque',
      icon: 'ri-heart-pulse-line', color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.12)',
      route: '/health-detail', params: { metricId: 'heart_rate' },
      status: br.heart_rate > 100 || br.heart_rate < 50 ? 'alert' : 'normal',
    },
    {
      val: `${br.spo2}`, unit: '%', label: 'SpO2', sublabel: 'Saturation O2',
      icon: 'ri-drop-line', color: '#38BDF8', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.12)',
      route: '/health-detail', params: { metricId: 'spo2' },
      status: br.spo2 < 94 ? 'alert' : 'normal',
    },
    {
      val: `${br.blood_pressure?.systolic || 125}`, unit: `/${br.blood_pressure?.diastolic || 78}`,
      label: 'mmHg', sublabel: 'Pression arterielle',
      icon: 'ri-pulse-line', color: '#A78BFA', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.12)',
      route: '/health-detail', params: { metricId: 'blood_pressure' },
      status: (br.blood_pressure?.systolic || 125) > 140 ? 'alert' : 'normal',
    },
    {
      val: `${br.temperature}`, unit: '°C', label: 'Temp', sublabel: 'Temperature corporelle',
      icon: 'ri-temp-hot-line', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.12)',
      route: '/health-detail', params: { metricId: 'temperature' },
      status: br.temperature > 38 ? 'alert' : 'normal',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 } as any}>
      {vitals.map((v, i) => (
        <div key={i} data-testid={`vital-card-${i}`}
          onClick={() => router.push({ pathname: v.route as any, params: v.params })}
          style={{
            padding: '16px', borderRadius: 18,
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${v.border}`,
            cursor: 'pointer',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            transition: 'transform 0.2s, border-color 0.2s',
          } as any}
          onMouseEnter={(e: any) => { e.currentTarget.style.borderColor = v.color; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.borderColor = v.border; e.currentTarget.style.transform = ''; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: v.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className={v.icon} style={{ fontSize: 13, color: v.color }} />
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: 0.3, textTransform: 'uppercase' }}>{v.sublabel}</div>
            </div>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: v.status === 'alert' ? '#EF4444' : '#10B981', flexShrink: 0 } as any} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 } as any}>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#FFF', lineHeight: 1, letterSpacing: -0.5 }}>{v.val}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.25)' }}>{v.unit}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: v.color, marginLeft: 'auto' }}>{v.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
