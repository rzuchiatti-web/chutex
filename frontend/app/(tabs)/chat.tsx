import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { apiFetch } from '../../src/services/api';
import { useRouter } from 'expo-router';

const PROG_IMAGES: any = {
  'prog-sleep-21': 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/8x2d3bbk_hearth%20red%20app%20healthbeat%20Chutex.png',
  'prog-tension-14': 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/5vzwu43l_m%C3%A9tabolique.png',
  'prog-activity-30': 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/75gbxosw_physique.png',
};

export default function ProgramsTab() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [programs, setPrograms] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/programs/catalog', {}, token).catch(() => ({ programs: [] })),
      apiFetch('/api/programs/active', {}, token).catch(() => null),
    ]).then(([cat, act]) => {
      setPrograms(cat?.programs || []);
      if (act?.active) setActive(act);
      setLoading(false);
    });
  }, [token]);

  if (Platform.OS !== 'web') return <NativePageView path="/(tabs)/chat" />;

  const BG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';

  return (
    <div data-testid="programs-tab" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '24px 20px 120px', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ marginBottom: 24 } as any}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', marginBottom: 6, letterSpacing: -0.5 }}>Programmes</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>Transforme ta sante avec des programmes guides et personnalises par l'IA.</div>
        </div>

        {/* Active program banner */}
        {active && (
          <div onClick={() => router.push('/(tabs)/health' as any)} style={{ padding: '16px 18px', borderRadius: 20, background: `${active.program.color}12`, border: `1px solid ${active.program.color}30`, marginBottom: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 } as any}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: `${active.program.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
              <i className={active.program.icon} style={{ fontSize: 22, color: active.program.color }} />
            </div>
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 10, fontWeight: 700, color: active.program.color, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>Programme en cours</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>{active.program.title}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Jour {active.current_day}/{active.program.duration_days}</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: active.program.color }}>{active.progress_pct}%</div>
          </div>
        )}

        {/* Program cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 } as any}>
          {programs.map((p: any) => (
            <div key={p.id} data-testid={`prog-card-${p.id}`} onClick={() => router.push({ pathname: '/program-detail', params: { id: p.id } } as any)}
              style={{ borderRadius: 20, overflow: 'hidden', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'stretch', minHeight: 120, transition: 'transform 0.2s' } as any}
              onMouseEnter={(e: any) => e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={(e: any) => e.currentTarget.style.transform=''}>
              {/* Left color accent + image */}
              <div style={{ width: 110, background: `${p.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 } as any}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: `${p.color}18`, border: `1px solid ${p.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                  <i className={p.icon} style={{ fontSize: 28, color: p.color }} />
                </div>
              </div>
              {/* Content */}
              <div style={{ flex: 1, padding: '16px 16px 16px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' } as any}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF', marginBottom: 4, lineHeight: 1.2 }}>{p.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, marginBottom: 10 }}>{p.subtitle || p.description?.slice(0, 60) + '...'}</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' } as any}>
                  <span style={{ padding: '3px 10px', borderRadius: 99, background: `${p.color}12`, border: `1px solid ${p.color}20`, fontSize: 10, fontWeight: 700, color: p.color }}>{p.duration_days} jours</span>
                  {p.difficulty && <span style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>{p.difficulty}</span>}
                  <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)', marginLeft: 'auto' }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 14, color: 'rgba(255,255,255,0.3)' } as any}>Chargement...</div>}
      </div>
    </div>
  );
}
