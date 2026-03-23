import React from 'react';
import { useRouter } from 'expo-router';

interface Props { d: any; subs: any; beneficiaryId?: string; }

export default function HealthSections({ d, subs, beneficiaryId }: Props) {
  const router = useRouter();
  const isDark = typeof localStorage !== 'undefined' ? localStorage.getItem('chutex_dark') !== '0' : true;
  const cardBg = isDark ? 'rgba(70,70,78,0.85)' : '#E8E8EA';
  const textColor = isDark ? '#FFF' : '#1A1A2E';
  const subColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)';
  const arrowColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';

  const sections = [
    { id: 'cardio', label: 'Sante cardiaque', sub: 'Coeur, circulation, rythme', img: 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/8x2d3bbk_hearth%20red%20app%20healthbeat%20Chutex.png', color: '#EF4444' },
    { id: 'metabolism', label: 'Sante metabolique', sub: 'Glycemie, IMC, graisse viscerale', img: 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/5vzwu43l_m%C3%A9tabolique.png', color: '#F59E0B' },
    { id: 'activity', label: 'Sante physique', sub: 'Pas, depense, stress, VO2 max', img: 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/75gbxosw_physique.png', color: '#10B981' },
    { id: 'composition', label: 'Composition corporelle', sub: 'Poids, muscle, graisse, hydratation', img: 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/3yq7hxyr_composition%281%29.png', color: '#F97316' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 } as any}>
      {sections.map((sec) => (
        <div key={sec.id} data-testid={`health-section-${sec.id}`}
          onClick={() => router.push({ pathname: '/health-detail' as any, params: { metricId: sec.id, ...(beneficiaryId ? { beneficiaryId } : {}) } })}
          style={{
            display: 'flex', alignItems: 'center',
            padding: '0 16px 0 0', borderRadius: 18,
            background: cardBg,
            cursor: 'pointer', transition: 'transform 0.15s',
            overflow: 'visible', position: 'relative', minHeight: 80,
          } as any}
          onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}
        >
          <div style={{ width: 70, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0 8px 12px' } as any}>
            <img src={sec.img} alt={sec.label} style={{ height: 52, objectFit: 'contain', filter: 'drop-shadow(0 3px 10px rgba(0,0,0,0.35))' } as any} />
          </div>
          <div style={{ flex: 1, padding: '16px 0' } as any}>
            <div style={{ fontSize: 15, fontWeight: 800, color: textColor, marginBottom: 3 }}>{sec.label}</div>
            <div style={{ fontSize: 11, color: subColor, lineHeight: 1.4 }}>{sec.sub}</div>
          </div>
          <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: arrowColor, flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}
