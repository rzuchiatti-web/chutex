import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { apiFetch } from '../../src/services/api';
import NativePageView from '../../src/components/NativePageView';
import ProgramDailyView from '../../src/components/ProgramDailyView';
import { useRouter } from 'expo-router';
import { BG_IMAGES } from '../../src/components/dashboard/constants';
import Loader from '../../src/components/Loader';
import AnimatedDarkBg from '../../src/components/AnimatedDarkBg';

export default function ProgramsTab() {
  const { token } = useAuth();
  const router = useRouter();
  const [activeProgram, setActiveProgram] = useState<any>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasDevices, setHasDevices] = useState<any>({ bracelet: false, scale: false, any: false });
  const [showGuide, setShowGuide] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prog, cat, dev] = await Promise.all([
        apiFetch('/api/programs/active', {}, token).catch(() => null),
        apiFetch('/api/programs/catalog', {}, token).catch(() => null),
        apiFetch('/api/devices/dashboard-summary', {}, token).catch(() => null),
      ]);
      if (prog) setActiveProgram(prog);
      if (cat?.programs) setCatalog(cat.programs);
      setHasDevices({ bracelet: !!(dev?.bracelet?.paired), scale: !!(dev?.scale?.paired), any: !!(dev?.bracelet?.paired || dev?.scale?.paired) });
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  if (Platform.OS !== 'web') return <NativePageView path="/(tabs)/chat" />;

  const remainingPrograms = catalog.filter((p: any) => !activeProgram?.active || p.id !== activeProgram?.program?.id);
  const singleProgramLock = !!activeProgram?.active;

  const glass = { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' };

  return (
    <div data-testid="programs-tab" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <AnimatedDarkBg />

      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px 120px' } as any}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 } as any}>
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', letterSpacing: -0.5 }}>Programmes</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Parcours prevention personnalises</div>
            </div>
            <div data-testid="programs-guide-btn" onClick={() => setShowGuide(true)}
              style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', ...glass, transition: 'transform 0.15s, background 0.15s' } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.transform = 'scale(1.06)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = ''; }}>
              <i className="ri-question-line" style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)' }} />
            </div>
          </div>

          {/* PROGRAMME ACTIF */}
          {activeProgram?.active && token && (
            <div style={{ marginBottom: 24 } as any}>
              <ProgramDailyView token={token} onStop={() => { setActiveProgram(null); loadData(); }} />
            </div>
          )}

          {/* CATALOGUE */}
          {!singleProgramLock ? (
            <>
              {!hasDevices.any && (
                <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, ...glass } as any}>
                  <i className="ri-bluetooth-connect-line" style={{ fontSize: 18, color: '#F59E0B' }} />
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>Connectez un appareil pour demarrer un programme.</div>
                </div>
              )}

              {loading && <Loader />}

              {remainingPrograms.map((p: any) => {
                const req = p.requires || 'any';
                const hasRequired = req === 'any' ? hasDevices.any : req === 'bracelet' ? hasDevices.bracelet : req === 'scale' ? hasDevices.scale : hasDevices.any;
                const deviceMissing = !hasRequired;
                return (
                  <div key={p.id} data-testid={`catalog-${p.id}`}
                    onClick={() => {
                      if (deviceMissing) { router.push('/(tabs)/devices' as any); return; }
                      router.push({ pathname: '/program-detail' as any, params: { id: p.id } });
                    }}
                    style={{ padding: '18px 20px', borderRadius: 22, position: 'relative', marginBottom: 10, cursor: 'pointer', opacity: deviceMissing ? 0.6 : 1, border: `1px solid ${p.color}15`, background: 'rgba(255,255,255,0.04)', ...glass, transition: 'transform 180ms' } as any}
                    onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 } as any}>
                      <div style={{ width: 48, height: 48, borderRadius: 16, background: `${p.color}12`, border: `1px solid ${p.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                        <i className={p.icon} style={{ fontSize: 24, color: p.color }} />
                      </div>
                      <div style={{ flex: 1 } as any}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', marginBottom: 2 }}>{p.title}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{p.subtitle}</div>
                      </div>
                      <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: 'rgba(255,255,255,0.15)' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' } as any}>
                      <span style={{ padding: '4px 10px', borderRadius: 99, background: `${p.color}10`, border: `1px solid ${p.color}18`, fontSize: 10, fontWeight: 700, color: p.color }}>{p.duration_days}j</span>
                      {p.difficulty && <span style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>{p.difficulty}</span>}
                      {p.category && <span style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'capitalize' }}>{p.category}</span>}
                      {deviceMissing && (
                        <span style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', fontSize: 10, fontWeight: 700, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 4 } as any}>
                          <i className="ri-bluetooth-connect-line" style={{ fontSize: 10 }} />{p.requires_label || 'Appareil requis'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {!loading && remainingPrograms.length === 0 && (
                <div style={{ padding: '28px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', ...glass } as any}>
                  <i className="ri-search-line" style={{ fontSize: 24, color: 'rgba(255,255,255,0.15)', marginBottom: 8, display: 'block' }} />
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Aucun programme disponible.</div>
                </div>
              )}
            </>
          ) : (
            <div onClick={() => router.push('/programs' as any)} style={{ padding: '14px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', ...glass, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.2s' } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
              <i className="ri-layout-grid-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Voir tous les programmes</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{catalog.length} programmes disponibles</div>
              </div>
              <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.15)' }} />
            </div>
          )}
        </div>
      </div>

      {/* ═══ GUIDE POPUP ═══ */}
      {showGuide && (
        <div data-testid="programs-guide-popup" onClick={() => setShowGuide(false)} style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', animation: 'pgFadeIn 250ms ease' } as any}>
          <style>{`@keyframes pgFadeIn{from{opacity:0}to{opacity:1}} @keyframes pgSlideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div onClick={(e) => e.stopPropagation()}
            style={{ width: '90%', maxWidth: 420, maxHeight: '80vh', overflowY: 'auto', borderRadius: 28, background: 'rgba(20,20,30,0.85)', border: '1px solid rgba(255,255,255,0.1)', padding: '28px 24px', ...glass, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', animation: 'pgSlideUp 300ms ease' } as any}>

            {/* Close button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 } as any}>
              <div data-testid="programs-guide-close" onClick={() => setShowGuide(false)}
                style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                <i className="ri-close-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} />
              </div>
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', letterSpacing: -0.3, marginBottom: 6 }}>Comment ca marche ?</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Nos programmes de prevention sont conçus pour ameliorer votre sante au quotidien.</div>
            </div>

            {/* Steps */}
            {[
              { icon: 'ri-search-line', color: '#60A5FA', title: '1. Choisissez un programme', desc: 'Parcourez le catalogue et selectionnez le programme adapte a vos besoins : equilibre, sommeil, nutrition, mobilite...' },
              { icon: 'ri-play-circle-line', color: '#10B981', title: '2. Suivez jour par jour', desc: 'Chaque programme propose des activites quotidiennes : exercices, conseils, meditations. Avancez a votre rythme.' },
              { icon: 'ri-checkbox-circle-line', color: '#F59E0B', title: '3. Check-in quotidien', desc: 'Evaluez votre humeur, fatigue et douleur chaque jour. Nora adapte ses conseils selon vos retours.' },
              { icon: 'ri-trophy-line', color: '#A78BFA', title: '4. Gagnez des badges', desc: 'Completez des etapes pour debloquer des badges. Partagez vos rapports hebdomadaires avec vos proches.' },
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start' } as any}>
                <div style={{ width: 40, height: 40, borderRadius: 14, background: `${step.color}12`, border: `1px solid ${step.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <i className={step.icon} style={{ fontSize: 18, color: step.color }} />
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', marginBottom: 3 }}>{step.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{step.desc}</div>
                </div>
              </div>
            ))}

            {/* CTA */}
            <div data-testid="programs-guide-cta" onClick={() => setShowGuide(false)}
              style={{ marginTop: 8, padding: '14px', borderRadius: 16, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', textAlign: 'center', cursor: 'pointer', transition: 'background 0.15s' } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(16,185,129,0.2)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(16,185,129,0.12)'; }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#34D399' }}>C'est parti !</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
