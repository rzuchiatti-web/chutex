import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { useRouter } from 'expo-router';
import NativePageView from '../src/components/NativePageView';
import { BG_IMAGES } from '../src/components/dashboard/constants';

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
  const glass = { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any;
  const categories = ['all', ...Array.from(new Set(catalog.map((p: any) => p.category).filter(Boolean)))];
  const visibleCatalog = catalog.filter((p: any) => selectedCategory === 'all' || p.category === selectedCategory);
  const remainingPrograms = visibleCatalog.filter((p: any) => !activeProgram?.active || p.id !== activeProgram?.program?.id);
  const singleProgramLock = !!activeProgram?.active;

  return (
    <div data-testid="programs-screen" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG_IMAGES.beneficiary} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(2,6,23,0.62), rgba(2,6,23,0.88))', zIndex: 1 } as any} />
      <div style={{ position: 'absolute', top: -120, left: -80, width: 260, height: 260, borderRadius: 999, background: 'radial-gradient(circle, rgba(16,185,129,0.18), transparent 70%)', zIndex: 2 } as any} />
      <div style={{ position: 'absolute', bottom: -140, right: -100, width: 320, height: 320, borderRadius: 999, background: 'radial-gradient(circle, rgba(249,115,22,0.16), transparent 70%)', zIndex: 2 } as any} />

      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ maxWidth: 420, margin: '0 auto', padding: 'calc(env(safe-area-inset-top, 44px) + 10px) 20px 120px' } as any}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 } as any}>
            <div data-testid="programs-back-button" onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', ...glass } as any}>
              <i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} />
            </div>
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{activeProgram?.active ? 'Mon Programme' : 'Programmes'}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Parcours prevention personnalises et progressifs</div>
            </div>
          </div>

          <div data-testid="programs-hero-block" style={{ padding: '16px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 14, ...glass } as any}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.85)', marginBottom: 6 }}>Programme unique actif</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
              Un seul programme peut etre actif a la fois pour garantir une progression claire et des recommandations Nora coherentes.
            </div>
          </div>

          {loading && (
            <div style={{ padding: '24px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14, ...glass } as any}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Chargement des programmes...</div>
            </div>
          )}

          {activeProgram?.active && prog && (
            <>
              <div style={{ padding: '22px', borderRadius: 24, background: 'rgba(255,255,255,0.06)', border: `1px solid ${prog.color}25`, marginBottom: 16, ...glass } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 } as any}>
                  <div style={{ width: 56, height: 56, borderRadius: 18, background: `${prog.color}15`, border: `1px solid ${prog.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                    <i className={prog.icon} style={{ fontSize: 28, color: prog.color }} />
                  </div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{prog.title}</div>
                    <div style={{ fontSize: 12, color: prog.color, fontWeight: 700 }}>Jour {activeProgram.current_day}/{prog.duration_days} — {activeProgram.progress_pct}%</div>
                  </div>
                </div>

                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 16 } as any}>
                  <div style={{ height: 8, borderRadius: 4, width: `${activeProgram.progress_pct}%`, background: `linear-gradient(90deg, ${prog.color}80, ${prog.color})`, transition: 'width 0.5s' } as any} />
                </div>

                <div style={{ display: 'flex', gap: 4, marginBottom: 16 } as any}>
                  {(prog.phases || []).map((ph: any, i: number) => {
                    const isCurrent = activeProgram.current_phase?.name === ph.name;
                    const isPast = activeProgram.current_day > ph.days[1];
                    return (
                      <div key={i} style={{ flex: 1, padding: '8px 6px', borderRadius: 12, background: isCurrent ? `${prog.color}15` : isPast ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isCurrent ? `${prog.color}30` : isPast ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)'}`, textAlign: 'center' } as any}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: isCurrent ? prog.color : isPast ? '#10B981' : 'rgba(255,255,255,0.2)' }}>{ph.name}</div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>J{ph.days[0]}-{ph.days[1]}</div>
                      </div>
                    );
                  })}
                </div>

                {activeProgram.today_tasks && (
                  <div style={{ padding: '16px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 } as any}>
                      <i className="ri-focus-3-line" style={{ fontSize: 14, color: prog.color }} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Mission du jour</span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>{activeProgram.today_tasks.focus}</div>

                    {activeProgram.today_tasks.mission && (
                      <div style={{ padding: '10px 12px', borderRadius: 12, background: `${prog.color}06`, border: `1px solid ${prog.color}12`, marginBottom: 12 } as any}>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{activeProgram.today_tasks.mission.substring(0, 200)}...</div>
                      </div>
                    )}

                    {activeProgram.today_tasks.tasks?.map((task: string, ti: number) => (
                      <div key={ti} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 } as any}>
                        <div style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${activeProgram.today_checkin ? `${prog.color}40` : 'rgba(255,255,255,0.15)'}`, background: activeProgram.today_checkin ? `${prog.color}15` : 'transparent', flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                          {activeProgram.today_checkin && <i className="ri-check-line" style={{ fontSize: 12, color: prog.color }} />}
                        </div>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{task}</span>
                      </div>
                    ))}

                    {activeProgram.today_tasks.tip && (
                      <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 12, background: `${prog.color}08`, border: `1px solid ${prog.color}15` } as any}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 } as any}>
                          <i className="ri-lightbulb-line" style={{ fontSize: 14, color: prog.color, marginTop: 1, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, fontStyle: 'italic' }}>{activeProgram.today_tasks.tip}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeProgram.streak > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, padding: '10px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' } as any}>
                    <i className="ri-fire-fill" style={{ fontSize: 18, color: '#F59E0B' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{activeProgram.streak} jour{activeProgram.streak > 1 ? 's' : ''} de suite</span>
                  </div>
                )}

                {activeProgram.team && activeProgram.team.members?.length > 1 && (
                  <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 14, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)' } as any}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(167,139,250,0.6)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Equipe · {activeProgram.team.members.length} membres</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' } as any}>
                      {activeProgram.team.members.map((m: any, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                          <div style={{ width: 26, height: 26, borderRadius: 8, background: m.checked_in_today ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${m.checked_in_today ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                            {m.checked_in_today ? <i className="ri-check-line" style={{ fontSize: 12, color: '#10B981' }} /> : <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>{m.name?.charAt(0)}</span>}
                          </div>
                          <span style={{ fontSize: 10, color: m.is_me ? '#A78BFA' : 'rgba(255,255,255,0.4)' }}>{m.is_me ? 'Moi' : m.name?.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {!showStopConfirm ? (
                <div data-testid="stop-active-program-button" onClick={() => setShowStopConfirm(true)} style={{ padding: '12px', borderRadius: 14, textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'rgba(239,68,68,0.4)', marginBottom: 20 } as any}>Arreter le programme</div>
              ) : (
                <div style={{ padding: '18px', borderRadius: 18, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 20, ...glass } as any}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#EF4444', marginBottom: 8 }}>Arreter le programme ?</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: 14 }}>Votre progression sera conservee. Vous pourrez recommencer ou choisir un autre programme.</div>
                  <div style={{ display: 'flex', gap: 10 } as any}>
                    <div onClick={() => setShowStopConfirm(false)} style={{ flex: 1, padding: '12px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#FFF' } as any}>Annuler</div>
                    <div data-testid="confirm-stop-program-button" onClick={stopProgram} style={{ flex: 1, padding: '12px', borderRadius: 999, background: '#EF4444', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#FFF' } as any}>{stopping ? '...' : 'Arreter'}</div>
                  </div>
                </div>
              )}
            </>
          )}

          <div style={{ marginBottom: 20 } as any}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>{activeProgram?.active ? 'Autres programmes' : 'Programmes disponibles'}</div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 } as any}>
              {categories.map((cat: string) => {
                const active = selectedCategory === cat;
                return (
                  <div key={cat} data-testid={`program-category-${cat}`} onClick={() => setSelectedCategory(cat)} style={{ padding: '6px 12px', borderRadius: 999, cursor: 'pointer', background: active ? 'rgba(16,185,129,0.16)' : 'rgba(255,255,255,0.06)', border: `1px solid ${active ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.1)'}`, fontSize: 11, fontWeight: 700, color: active ? '#34D399' : 'rgba(255,255,255,0.55)', textTransform: 'capitalize' } as any}>
                    {cat === 'all' ? 'Tous' : cat}
                  </div>
                );
              })}
            </div>

            {!hasDevices && !activeProgram?.active && (
              <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 14, ...glass } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                  <i className="ri-information-line" style={{ fontSize: 18, color: '#F59E0B', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>Appareil requis</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>Connectez votre bracelet Elio ou effectuez une pesee pour lancer un programme. Nora a besoin de vos donnees pour personnaliser le suivi.</div>
                  </div>
                </div>
              </div>
            )}

            {singleProgramLock && (
              <div data-testid="single-active-program-warning" style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', marginBottom: 12 } as any}>
                <div style={{ fontSize: 11, color: '#7DD3FC', fontWeight: 700, marginBottom: 4 }}>Un seul programme actif</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>Terminez ou arretez le programme en cours pour en lancer un autre.</div>
              </div>
            )}

            {remainingPrograms.map((p: any) => (
              <div key={p.id} data-testid={`catalog-${p.id}`}
                onClick={() => {
                  if (activeProgram?.active) return;
                  if (!hasDevices) {
                    router.push('/(tabs)/devices' as any);
                    return;
                  }
                  router.push({ pathname: '/program-detail' as any, params: { id: p.id } });
                }}
                style={{ padding: '18px', borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: `1px solid ${activeProgram?.active ? 'rgba(255,255,255,0.04)' : p.color + '20'}`, marginBottom: 10, cursor: activeProgram?.active ? 'not-allowed' : 'pointer', opacity: activeProgram?.active ? 0.5 : 1, transition: 'transform 0.15s', ...glass } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 } as any}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: `${p.color}12`, border: `1px solid ${p.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                    <i className={p.icon} style={{ fontSize: 24, color: p.color }} />
                  </div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', marginBottom: 2 }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{p.subtitle}</div>
                  </div>
                  {!activeProgram?.active && <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: 'rgba(255,255,255,0.2)' }} />}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 } as any}>
                  <span style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>{p.duration_days} jours</span>
                  {p.effort && <span style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.06)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>{p.effort}</span>}
                  {p.difficulty && <span style={{ padding: '4px 10px', borderRadius: 99, background: `${p.color}10`, border: `1px solid ${p.color}20`, fontSize: 10, fontWeight: 600, color: p.color }}>{p.difficulty}</span>}
                  {p.category && <span style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textTransform: 'capitalize' }}>{p.category}</span>}
                </div>
                {p.benefits?.slice(0, 2).map((b: string, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 } as any}>
                    <i className="ri-check-line" style={{ fontSize: 11, color: p.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.3 }}>{b}</span>
                  </div>
                ))}
              </div>
            ))}

            {!loading && remainingPrograms.length === 0 && (
              <div style={{ padding: '18px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' } as any}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Aucun programme disponible dans cette categorie.</div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
