import React from 'react';

const G: any = { borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };

export default function VitalsGrid({ ben }: { ben: any }) {
  const vitals = [
    { val: ben.heart_rate || '72', unit: 'bpm', label: 'Rythme cardiaque', icon: 'ri-heart-pulse-line', color: '#EF4444' },
    { val: ben.spo2 || '97', unit: '%', label: 'Saturation O2', icon: 'ri-drop-line', color: '#6366F1' },
    { val: ben.blood_pressure ? `${ben.blood_pressure.systolic}/${ben.blood_pressure.diastolic}` : '125/78', unit: 'mmHg', label: 'Tension', icon: 'ri-water-flash-line', color: '#8B5CF6' },
    { val: ben.temperature || '36.6', unit: '\u00B0C', label: 'Temperature', icon: 'ri-temp-hot-line', color: '#F59E0B' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 } as any}>
      {vitals.map((v, i) => (
        <div key={i} style={{ ...G, padding: '12px 14px' } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 } as any}>
            <i className={v.icon} style={{ fontSize: 12, color: v.color }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>{v.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 } as any}>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{v.val}</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{v.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
