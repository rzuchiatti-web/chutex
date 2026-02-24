import React from 'react';
import { useRouter } from 'expo-router';

interface Props { d: any; subs: any; }

export default function HealthSections({ d, subs }: Props) {
  const router = useRouter();
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
          onClick={() => router.push({ pathname: '/health-detail' as any, params: { metricId: sec.id } })}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 16px', borderRadius: 18,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            cursor: 'pointer', transition: 'transform 0.15s, background 0.15s',
          } as any}
          onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = ''; }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 16, background: `${sec.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
            <img src={sec.img} alt={sec.label} style={{ height: 40, objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))' } as any} />
          </div>
          <div style={{ flex: 1 } as any}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 2 }}>{sec.label}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{sec.sub}</div>
            {subs[sec.id] && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: `${sec.color}12`, marginTop: 6 } as any}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: subs[sec.id].score >= 80 ? '#10B981' : subs[sec.id].score >= 60 ? '#F59E0B' : '#EF4444' } as any} />
                <span style={{ fontSize: 9, fontWeight: 700, color: subs[sec.id].score >= 80 ? '#10B981' : subs[sec.id].score >= 60 ? '#F59E0B' : '#EF4444' }}>{subs[sec.id].score}/100</span>
              </div>
            )}
          </div>
          <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
        </div>
      ))}
    </div>
  );
}
