import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { useRouter } from 'expo-router';
import NativePageView from '../src/components/NativePageView';
import { BG_IMAGES } from '../src/components/dashboard/constants';

const CATEGORY_ICONS: Record<string, string> = {
  sommeil: 'ri-moon-line', cardiovasculaire: 'ri-heart-pulse-line', stress: 'ri-mental-health-line',
  nutrition: 'ri-restaurant-line', mobilite: 'ri-walk-line', all: 'ri-apps-2-line',
};

export default function ProgramsScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [activeProgram, setActiveProgram] = useState<any>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasDevices, setHasDevices] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => { loadData(); }, []);

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
      if (dev?.devices?.length > 0 || dev?.bracelet || dev?.scale) setHasDevices(true);
    } catch {} finally { setLoading(false); }
  };

  const stopProgram = async () => {
    setStopping(true);
    try {
      await apiFetch('/api/programs/stop', { method: 'POST' }, token);
      setActiveProgram(null);
      setShowStopConfirm(false);
      loadData();
    } catch {} finally { setStopping(false); }
  };

  if (Platform.OS !== 'web') return <NativePageView path="/programs" />;

  const prog = activeProgram?.program;
  const categories = ['all', ...Array.from(new Set(catalog.map((p: any) => p.category).filter(Boolean)))];
  const visibleCatalog = catalog.filter((p: any) => selectedCategory === 'all' || p.category === selectedCategory);
  const remainingPrograms = visibleCatalog.filter((p: any) => !activeProgram?.active || p.id !== activeProgram?.program?.id);
  const singleProgramLock = !!activeProgram?.active;

  return (
    <div data-testid="programs-screen" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG_IMAGES.beneficiary} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1 } as any} />
      <style>{`
        @keyframes prog-fade-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes prog-pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
        @keyframes prog-progress { from { width:0; } }
      `}</style>

      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'calc(env(safe-area-inset-top, 44px) + 10px) 20px 120px' } as any}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 } as any}>
            <div data-testid="programs-back-button" onClick={() => router.back()} style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
              <i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} />
            </div>
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', letterSpacing: -0.5 }}>Programmes</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Parcours prevention personnalises</div>
            </div>
          </div>

          {/* Active Program Hero */}
          {activeProgram?.active && prog && (
            <div data-testid="active-program-hero" style={{ animation: 'prog-fade-in 350ms ease both', marginBottom: 24 } as any}>
              <div style={{ position: 'relative', padding: '24px 22px', borderRadius: 28, overflow: 'hidden', border: `1px solid ${prog.color}30` } as any}>
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${prog.color}18, ${prog.color}06)`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any} />
                <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: 999, background: `radial-gradient(circle, ${prog.color}22, transparent 70%)` } as any} />
                <div style={{ position: 'relative', zIndex: 2 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 } as any}>
                    <div style={{ width: 52, height: 52, borderRadius: 16, background: `${prog.color}20`, border: `1px solid ${prog.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                      <i className={prog.icon} style={{ fontSize: 26, color: prog.color }} />
                    </div>
                    <div style={{ flex: 1 } as any}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', lineHeight: 1.15, marginBottom: 3 }}>{prog.title}</div>
                      <div style={{ fontSize: 12, color: prog.color, fontWeight: 700 }}>Jour {activeProgram.current_day}/{prog.duration_days}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' } as any}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: prog.color, lineHeight: 1 }}>{activeProgram.progress_pct}%</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 18 } as any}>
                    <div style={{ height: 6, borderRadius: 3, width: `${activeProgram.progress_pct}%`, background: `linear-gradient(90deg, ${prog.color}90, ${prog.color})`, animation: 'prog-progress 800ms ease', transition: 'width 0.5s' } as any} />
                  </div>

                  {/* Phases */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 18 } as any}>
                    {(prog.phases || []).map((ph: any, i: number) => {
                      const isCurrent = activeProgram.current_phase?.name === ph.name;
                      const isPast = activeProgram.current_day > ph.days[1];
                      return (
                        <div key={i} style={{ flex: 1, padding: '8px 4px', borderRadius: 10, background: isCurrent ? `${prog.color}18` : isPast ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isCurrent ? `${prog.color}35` : isPast ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.05)'}`, textAlign: 'center' } as any}>
                          <div style={{ fontSize: 9, fontWeight: 800, color: isCurrent ? prog.color : isPast ? '#10B981' : 'rgba(255,255,255,0.2)' }}>{ph.name}</div>
                          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', marginTop: 1 }}>J{ph.days[0]}-{ph.days[1]}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Today's mission */}
                  {activeProgram.today_tasks && (
                    <div style={{ padding: '16px', borderRadius: 18, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 } as any}>
                        <i className="ri-focus-3-line" style={{ fontSize: 13, color: prog.color }} />
                        <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1 }}>Mission du jour</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', marginBottom: 10, lineHeight: 1.3 }}>{activeProgram.today_tasks.focus}</div>

                      {activeProgram.today_tasks.mission && (
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.55, marginBottom: 12 }}>{activeProgram.today_tasks.mission.substring(0, 180)}...</div>
                      )}

                      {activeProgram.today_tasks.tasks?.map((task: string, ti: number) => (
                        <div key={ti} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 } as any}>
                          <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${activeProgram.today_checkin ? `${prog.color}50` : 'rgba(255,255,255,0.12)'}`, background: activeProgram.today_checkin ? `${prog.color}15` : 'transparent', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                            {activeProgram.today_checkin && <i className="ri-check-line" style={{ fontSize: 11, color: prog.color }} />}
                          </div>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.45 }}>{task}</span>
                        </div>
                      ))}

                      {activeProgram.today_tasks.tip && (
                        <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: `${prog.color}08`, border: `1px solid ${prog.color}12`, display: 'flex', alignItems: 'flex-start', gap: 8 } as any}>
                          <i className="ri-lightbulb-line" style={{ fontSize: 13, color: prog.color, marginTop: 1, flexShrink: 0 }} />
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, fontStyle: 'italic' }}>{activeProgram.today_tasks.tip}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Streak + Team */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 } as any}>
                    {activeProgram.streak > 0 && (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px', borderRadius: 12, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' } as any}>
                        <i className="ri-fire-fill" style={{ fontSize: 16, color: '#F59E0B' }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{activeProgram.streak} jour{activeProgram.streak > 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {activeProgram.team && activeProgram.team.members?.length > 1 && (
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '10px 12px', borderRadius: 12, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)' } as any}>
                        <i className="ri-team-line" style={{ fontSize: 16, color: '#A78BFA' }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{activeProgram.team.members.length} membres</span>
                      </div>
                    )}
                  </div>

                  {/* Stop button */}
                  {!showStopConfirm ? (
                    <div data-testid="stop-active-program-button" onClick={() => setShowStopConfirm(true)} style={{ marginTop: 14, padding: '10px', borderRadius: 12, textAlign: 'center', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'rgba(239,68,68,0.35)' } as any}>Arreter le programme</div>
                  ) : (
                    <div style={{ marginTop: 14, padding: '16px', borderRadius: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' } as any}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#EF4444', marginBottom: 6 }}>Arreter le programme ?</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: 12 }}>Votre progression sera conservee.</div>
                      <div style={{ display: 'flex', gap: 8 } as any}>
                        <div onClick={() => setShowStopConfirm(false)} style={{ flex: 1, padding: '10px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#FFF' } as any}>Annuler</div>
                        <div data-testid="confirm-stop-program-button" onClick={stopProgram} style={{ flex: 1, padding: '10px', borderRadius: 999, background: '#EF4444', cursor: 'pointer', textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#FFF' } as any}>{stopping ? '...' : 'Arreter'}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Category filters */}
          <div style={{ marginBottom: 16 } as any}>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 } as any}>
              {categories.map((cat: string) => {
                const active = selectedCategory === cat;
                const icon = CATEGORY_ICONS[cat] || 'ri-price-tag-3-line';
                return (
                  <div key={cat} data-testid={`program-category-${cat}`} onClick={() => setSelectedCategory(cat)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 999, cursor: 'pointer', whiteSpace: 'nowrap', background: active ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`, fontSize: 11, fontWeight: 700, color: active ? '#34D399' : 'rgba(255,255,255,0.45)', textTransform: 'capitalize', transition: 'all 180ms ease' } as any}>
                    <i className={icon} style={{ fontSize: 12 }} />
                    {cat === 'all' ? 'Tous' : cat}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Device warning */}
          {!hasDevices && !activeProgram?.active && (
            <div data-testid="programs-device-warning" style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, animation: 'prog-fade-in 300ms ease both' } as any}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className="ri-bluetooth-connect-line" style={{ fontSize: 16, color: '#F59E0B' }} />
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', marginBottom: 2 }}>Appareil requis</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>Connectez un appareil pour demarrer un programme.</div>
              </div>
            </div>
          )}

          {singleProgramLock && (
            <div data-testid="single-active-program-warning" style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(14,165,233,0.06)', border: '1px solid rgba(14,165,233,0.15)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, animation: 'prog-fade-in 300ms ease both' } as any}>
              <i className="ri-lock-line" style={{ fontSize: 14, color: '#7DD3FC' }} />
              <div style={{ fontSize: 11, color: '#7DD3FC', fontWeight: 600 }}>Terminez le programme actif pour en lancer un autre.</div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ padding: '28px', textAlign: 'center' } as any}>
              <div style={{ width: 28, height: 28, borderRadius: 14, border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#10B981', animation: 'prog-pulse 800ms linear infinite', margin: '0 auto 10px' } as any} />
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Chargement...</div>
            </div>
          )}

          {/* Catalog section label */}
          {!loading && (
            <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.25)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 } as any}>
              {activeProgram?.active ? 'Autres programmes' : `${remainingPrograms.length} programme${remainingPrograms.length > 1 ? 's' : ''} disponible${remainingPrograms.length > 1 ? 's' : ''}`}
            </div>
          )}

          {/* Program cards */}
          {remainingPrograms.map((p: any, idx: number) => (
            <div key={p.id} data-testid={`catalog-${p.id}`}
              onClick={() => {
                if (activeProgram?.active) return;
                if (!hasDevices) { router.push('/(tabs)/devices' as any); return; }
                router.push({ pathname: '/program-detail' as any, params: { id: p.id } });
              }}
              style={{ padding: '18px 20px', borderRadius: 22, overflow: 'hidden', position: 'relative', marginBottom: 10, cursor: activeProgram?.active ? 'not-allowed' : 'pointer', opacity: activeProgram?.active ? 0.4 : 1, animation: `prog-fade-in 300ms ease ${idx * 60}ms both`, transition: 'transform 180ms ease, border-color 180ms ease', border: `1px solid ${p.color}15`, background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}
              onMouseEnter={(e: any) => { if (!activeProgram?.active) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = `${p.color}35`; } }}
              onMouseLeave={(e: any) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = `${p.color}15`; }}
            >
              <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: 999, background: `radial-gradient(circle, ${p.color}12, transparent 70%)` } as any} />
              <div style={{ position: 'relative', zIndex: 2 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 } as any}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: `${p.color}12`, border: `1px solid ${p.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                    <i className={p.icon} style={{ fontSize: 24, color: p.color }} />
                  </div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', marginBottom: 2, lineHeight: 1.2 }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.3 }}>{p.subtitle}</div>
                  </div>
                  {!activeProgram?.active && <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: 'rgba(255,255,255,0.15)' }} />}
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 } as any}>
                  <span style={{ padding: '4px 10px', borderRadius: 99, background: `${p.color}10`, border: `1px solid ${p.color}18`, fontSize: 10, fontWeight: 700, color: p.color }}>{p.duration_days}j</span>
                  {p.difficulty && <span style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>{p.difficulty}</span>}
                  {p.category && <span style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'capitalize' }}>{p.category}</span>}
                </div>

                {p.benefits?.slice(0, 2).map((b: string, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 } as any}>
                    <div style={{ width: 4, height: 4, borderRadius: 2, background: p.color, flexShrink: 0 } as any} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.3 }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!loading && remainingPrograms.length === 0 && (
            <div style={{ padding: '28px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' } as any}>
              <i className="ri-search-line" style={{ fontSize: 24, color: 'rgba(255,255,255,0.15)', marginBottom: 8 }} />
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Aucun programme dans cette categorie.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
