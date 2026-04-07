import React from 'react';

interface Props {
  nightApnea: number;
  onExplain: (key: string) => void;
}

export default function SleepApneaCard({ nightApnea, onExplain }: Props) {
  return (
    <div data-testid="sleep-apnea-card" style={{ borderRadius: 18, background: '#F4F4F5', padding: '16px 18px', marginBottom: 12 } as any}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
        <i className="ri-lungs-line" style={{ fontSize: 14, color: nightApnea < 30 ? '#10B981' : nightApnea < 60 ? '#F59E0B' : '#EF4444' }} />
        <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Risque d'apnée du sommeil</span>
        <div onClick={() => onExplain('apnea')} style={{ width: 28, height: 28, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginLeft: 'auto' } as any}>
          <i className="ri-information-line" style={{ fontSize: 14, color: '#EF4444' }} />
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 } as any}>
        <div style={{ textAlign: 'center' } as any}>
          <div style={{ fontSize: 40, fontWeight: 900, color: nightApnea < 30 ? '#10B981' : nightApnea < 60 ? '#F59E0B' : '#EF4444', lineHeight: 1 }}>{nightApnea}%</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: nightApnea < 30 ? '#10B981' : nightApnea < 60 ? '#F59E0B' : '#EF4444', marginTop: 4 }}>
            {nightApnea < 30 ? 'Faible' : nightApnea < 60 ? 'Modéré' : 'Élevé'}
          </div>
        </div>
        <div style={{ flex: 1 } as any}>
          <div style={{ height: 8, borderRadius: 4, background: '#E5E7EB', overflow: 'hidden', marginBottom: 6 } as any}>
            <div style={{ height: '100%', borderRadius: 4, width: `${nightApnea}%`, background: `linear-gradient(90deg, #10B981, #F59E0B 50%, #EF4444)`, transition: 'width 0.8s' } as any} />
          </div>
          <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.5 }}>
            {nightApnea < 30
              ? 'Votre sommeil semble continu et sans episodes respiratoires significatifs.'
              : nightApnea < 60
              ? "Quelques épisodes détectés. Surveillez l'évolution."
              : 'Risque élevé. Consultez un medecin pour un diagnostic.'}
          </div>
        </div>
      </div>
    </div>
  );
}
