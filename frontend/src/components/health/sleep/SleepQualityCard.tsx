import React from 'react';

interface Props {
  nightQuality: number;
  onExplain: (key: string) => void;
}

export default function SleepQualityCard({ nightQuality, onExplain }: Props) {
  return (
    <div data-testid="sleep-quality-card" style={{ borderRadius: 18, background: '#F4F4F5', padding: '16px 18px', marginBottom: 12 } as any}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } as any}>
        <i className="ri-star-line" style={{ fontSize: 14, color: nightQuality >= 80 ? '#10B981' : '#F59E0B' }} />
        <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Qualite du sommeil</span>
        <span style={{ fontSize: 16, fontWeight: 900, color: nightQuality >= 80 ? '#10B981' : nightQuality >= 60 ? '#F59E0B' : '#EF4444', marginLeft: 'auto' }}>{nightQuality}%</span>
        <div onClick={() => onExplain('quality')} style={{ width: 28, height: 28, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}>
          <i className="ri-information-line" style={{ fontSize: 14, color: '#A78BFA' }} />
        </div>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: '#E5E7EB', overflow: 'hidden' } as any}>
        <div style={{ height: '100%', borderRadius: 4, width: `${nightQuality}%`, background: nightQuality >= 80 ? '#10B981' : nightQuality >= 60 ? '#F59E0B' : '#EF4444', transition: 'width 0.8s' } as any} />
      </div>
    </div>
  );
}
