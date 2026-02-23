import React from 'react';
import { useRouter } from 'expo-router';

interface Props { br: any; }

export default function VitalsRow({ br }: Props) {
  const router = useRouter();
  const vitals = [
    { val: br.heart_rate, unit: '', label: 'BPM', icon: 'ri-heart-pulse-line', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
    { val: `${br.spo2}%`, unit: '', label: 'SpO2', icon: 'ri-drop-line', color: '#38BDF8', bg: 'rgba(56,189,248,0.12)' },
    { val: `${br.blood_pressure?.systolic || 125}`, unit: `/${br.blood_pressure?.diastolic || 78}`, label: 'Tension', icon: 'ri-pulse-line', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
    { val: `${br.temperature}`, unit: 'C', label: 'Temp.', icon: 'ri-temp-hot-line', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 16 } as any}>
      {vitals.map((v, i) => (
        <div key={i} data-testid={`vital-${i}`} onClick={() => router.push('/(tabs)/health')} style={{ padding: '14px 8px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', cursor: 'pointer' } as any}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: v.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' } as any}><i className={v.icon} style={{ fontSize: 16, color: v.color }} /></div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{v.val}<span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>{v.unit}</span></div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 }}>{v.label}</div>
        </div>
      ))}
    </div>
  );
}
