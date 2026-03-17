import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { useRouter } from 'expo-router';
import NativePageView from '../src/components/NativePageView';
import AnimatedDarkBg from '../src/components/AnimatedDarkBg';
import Loader from '../src/components/Loader';

const PROG_IMAGES: Record<string, string> = {
  sommeil: 'https://static.prod-images.emergentagent.com/jobs/2f205700-5cab-4634-9bb6-d20327bb5e5e/images/70f74062050eb73f37e4af1bc825ec64a37ff59e36dbd21dddaad395538ae8c2.png',
  cardiovasculaire: 'https://static.prod-images.emergentagent.com/jobs/2f205700-5cab-4634-9bb6-d20327bb5e5e/images/d66cc24bb801dd5a49a3b5c1b9c86a9907b695f586fe2fe988aec823410f86d8.png',
  nutrition: 'https://static.prod-images.emergentagent.com/jobs/2f205700-5cab-4634-9bb6-d20327bb5e5e/images/e4a68ff7d7a65b968fac91bde8737ab89ce4e0a2a9c049a00137f9978bb7b4c3.png',
  mobilite: 'https://static.prod-images.emergentagent.com/jobs/2f205700-5cab-4634-9bb6-d20327bb5e5e/images/a82a3cb593d5dd34df75877948b00f683eb3753126a74b7a620bff3ac8dff8ae.png',
  stress: 'https://static.prod-images.emergentagent.com/jobs/2f205700-5cab-4634-9bb6-d20327bb5e5e/images/a82a3cb593d5dd34df75877948b00f683eb3753126a74b7a620bff3ac8dff8ae.png',
};

export default function ProgramsScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [activeProgram, setActiveProgram] = useState<any>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/programs/active', {}, token).catch(() => null),
      apiFetch('/api/programs/catalog', {}, token).catch(() => null),
    ]).then(([prog, cat]) => {
      if (prog) setActiveProgram(prog);
      if (cat?.programs) setCatalog(cat.programs);
      setLoading(false);
    });
  }, []);

  if (Platform.OS !== 'web') return <NativePageView path="/programs" />;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <AnimatedDarkBg />
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes progSlideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes progPulse { 0%,100% { box-shadow: 0 0 20px rgba(167,139,250,0.15); } 50% { box-shadow: 0 0 35px rgba(167,139,250,0.25); } }
      `}} />

      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'calc(env(safe-area-inset-top, 44px) + 10px) 20px 120px' } as any}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 } as any}>
            <div onClick={() => router.back()} style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
              <i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Programmes sante</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{catalog.length} parcours cliniques disponibles</div>
            </div>
          </div>

          {/* Active program */}
          {activeProgram?.active && (() => {
            const pg = activeProgram.program;
            const c = pg?.color || '#A78BFA';
            const pct = activeProgram.progress_pct || 0;
            return (
              <div onClick={() => router.push('/(tabs)/chat' as any)} style={{ borderRadius: 22, overflow: 'hidden', marginBottom: 24, cursor: 'pointer', border: '1.5px solid rgba(255,255,255,0.25)', boxShadow: '0 0 30px rgba(255,255,255,0.08), 0 0 60px rgba(167,139,250,0.06), 0 8px 40px rgba(0,0,0,0.5)', animation: 'progPulse 3s ease infinite', background: '#1a1a1e' } as any}>
                <div style={{ padding: '18px 20px' } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 } as any}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: `${c}15`, border: `1px solid ${c}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                      <i className={pg.icon} style={{ fontSize: 22, color: c }} />
                    </div>
                    <div style={{ flex: 1 } as any}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{pg.title}</div>
                      <div style={{ fontSize: 11, color: c, fontWeight: 700 }}>Jour {activeProgram.current_day}/{pg.duration_days}</div>
                    </div>
                    <span style={{ padding: '4px 12px', borderRadius: 999, background: `${c}18`, fontSize: 12, fontWeight: 900, color: c }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' } as any}>
                    <div style={{ height: 6, borderRadius: 3, width: `${pct}%`, background: `linear-gradient(90deg, ${c}88, ${c})`, transition: 'width 1s ease', boxShadow: `0 0 12px ${c}44` } as any} />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Program cards — clinical style with images */}
          {catalog.map((p: any, idx: number) => {
            const isActive = activeProgram?.active && activeProgram?.program?.id === p.id;
            const img = PROG_IMAGES[p.category] || PROG_IMAGES.mobilite;
            return (
              <div key={p.id}
                onClick={() => {
                  if (isActive) { router.push('/(tabs)/chat' as any); return; }
                  router.push({ pathname: '/program-detail' as any, params: { id: p.id } });
                }}
                style={{ borderRadius: 22, overflow: 'hidden', marginBottom: 14, cursor: 'pointer', border: '1.5px solid rgba(255,255,255,0.12)', background: '#1a1a1e', transition: 'transform 200ms, box-shadow 200ms', animation: `progSlideUp 400ms ease ${idx * 60}ms both` } as any}
                onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 0 30px rgba(255,255,255,0.1), 0 12px 40px rgba(0,0,0,0.5)'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
                {/* Image banner */}
                <div style={{ position: 'relative', height: 120, overflow: 'hidden' } as any}>
                  <img src={img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(26,26,30,0.85) 80%, #1a1a1e 100%)' } as any} />
                  {/* Category pill */}
                  <div style={{ position: 'absolute', top: 12, left: 12, padding: '5px 12px', borderRadius: 999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 10, fontWeight: 700, color: p.color || '#A78BFA', textTransform: 'uppercase', letterSpacing: 0.5 } as any}>
                    <i className={p.icon} style={{ fontSize: 11, marginRight: 5 }} />{p.category || 'Sante'}
                  </div>
                  {/* Duration pill */}
                  <div style={{ position: 'absolute', top: 12, right: 12, padding: '5px 10px', borderRadius: 999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)' } as any}>
                    {p.duration_days}j
                  </div>
                  {isActive && (
                    <div style={{ position: 'absolute', bottom: 12, right: 12, padding: '4px 12px', borderRadius: 999, background: `${p.color || '#10B981'}25`, border: `1px solid ${p.color || '#10B981'}40`, fontSize: 10, fontWeight: 800, color: p.color || '#10B981' } as any}>En cours</div>
                  )}
                </div>
                {/* Content */}
                <div style={{ padding: '14px 18px 18px' } as any}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginBottom: 4, letterSpacing: -0.3 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, marginBottom: 12 }}>{p.subtitle}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                    {p.difficulty && <span style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>{p.difficulty}</span>}
                    {(p.tracked_metrics || []).slice(0, 2).map((m: string, i: number) => (
                      <span key={i} style={{ padding: '4px 8px', borderRadius: 99, background: `${p.color || '#A78BFA'}08`, border: `1px solid ${p.color || '#A78BFA'}18`, fontSize: 9, fontWeight: 600, color: p.color || '#A78BFA' }}>{m.replace(/_/g, ' ')}</span>
                    ))}
                    <i className="ri-arrow-right-s-line" style={{ marginLeft: 'auto', fontSize: 18, color: 'rgba(255,255,255,0.12)' }} />
                  </div>
                </div>
              </div>
            );
          })}

          {loading && <Loader />}
        </div>
      </div>
    </div>
  );
}
