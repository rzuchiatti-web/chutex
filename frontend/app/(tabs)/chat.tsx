import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { apiFetch } from '../../src/services/api';
import NativePageView from '../../src/components/NativePageView';
import ProgramDailyView from '../../src/components/ProgramDailyView';
import { useRouter } from 'expo-router';
import { BG_IMAGES } from '../../src/components/dashboard/constants';

const CATEGORY_ICONS: Record<string, string> = {
  sommeil: 'ri-moon-line', cardiovasculaire: 'ri-heart-pulse-line', stress: 'ri-mental-health-line',
  nutrition: 'ri-restaurant-line', mobilite: 'ri-walk-line', all: 'ri-apps-2-line',
};

export default function ProgramsTab() {
  const { token } = useAuth();
  const router = useRouter();
  const [activeProgram, setActiveProgram] = useState<any>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasDevices, setHasDevices] = useState<any>({ bracelet: false, scale: false, any: false });
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  const categories = ['all', ...Array.from(new Set(catalog.map((p: any) => p.category).filter(Boolean)))];
  const visibleCatalog = catalog.filter((p: any) => selectedCategory === 'all' || p.category === selectedCategory);
  const remainingPrograms = visibleCatalog.filter((p: any) => !activeProgram?.active || p.id !== activeProgram?.program?.id);
  const singleProgramLock = !!activeProgram?.active;

  return (
    <div data-testid="programs-tab" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG_IMAGES.beneficiary} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1 } as any} />

      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px 120px' } as any}>

          {/* Header */}
          <div style={{ marginBottom: 24 } as any}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', letterSpacing: -0.5 }}>Programmes</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Parcours prevention personnalises</div>
          </div>

          {/* ══ PROGRAMME ACTIF — Check-in quotidien ══ */}
          {activeProgram?.active && token && (
            <div style={{ marginBottom: 24 } as any}>
              <ProgramDailyView token={token} onStop={() => { setActiveProgram(null); loadData(); }} />
            </div>
          )}

          {/* ══ CATALOGUE — hidden when program active, show button instead ══ */}
          {!singleProgramLock ? (
            <>
              {/* Category filters */}
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4, marginBottom: 14 } as any}>
                {categories.map((cat: string) => {
                  const active = selectedCategory === cat;
                  const icon = CATEGORY_ICONS[cat] || 'ri-price-tag-3-line';
                  return (
                    <div key={cat} data-testid={`program-category-${cat}`} onClick={() => setSelectedCategory(cat)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap', background: active ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`, fontSize: 11, fontWeight: 700, color: active ? '#34D399' : 'rgba(255,255,255,0.45)', textTransform: 'capitalize', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
                      <i className={icon} style={{ fontSize: 12 }} />
                      {cat === 'all' ? 'Tous' : cat}
                    </div>
                  );
                })}
              </div>

              {/* Warnings */}
              {!hasDevices.any && (
                <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
                  <i className="ri-bluetooth-connect-line" style={{ fontSize: 18, color: '#F59E0B' }} />
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>Connectez un appareil pour demarrer un programme.</div>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div style={{ padding: '28px', textAlign: 'center' } as any}>
                  <div style={{ width: 28, height: 28, borderRadius: 14, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#10B981', animation: 'spin 800ms linear infinite', margin: '0 auto 10px' } as any} />
                  <style dangerouslySetInnerHTML={{ __html: '@keyframes spin{to{transform:rotate(360deg)}}' }} />
                </div>
              )}

              {/* Program cards */}
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
                    style={{ padding: '18px 20px', borderRadius: 22, position: 'relative', marginBottom: 10, cursor: 'pointer', opacity: deviceMissing ? 0.6 : 1, border: `1px solid ${p.color}15`, background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', transition: 'transform 180ms' } as any}
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
                <div style={{ padding: '28px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
                  <i className="ri-search-line" style={{ fontSize: 24, color: 'rgba(255,255,255,0.15)', marginBottom: 8, display: 'block' }} />
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Aucun programme dans cette categorie.</div>
                </div>
              )}
            </>
          ) : (
            /* Button to see all programs when one is active */
            <div onClick={() => router.push('/programs' as any)} style={{ padding: '14px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.2s' } as any}
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
    </div>
  );
}
