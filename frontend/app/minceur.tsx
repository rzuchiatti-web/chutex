import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { BG_IMAGES } from '../src/components/dashboard/constants';

const G: any = { borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };
const MEAL_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  breakfast: { icon: 'ri-cup-line', color: '#F59E0B', label: 'Petit-dejeuner' },
  lunch: { icon: 'ri-restaurant-2-line', color: '#10B981', label: 'Dejeuner' },
  snack: { icon: 'ri-apple-line', color: '#A78BFA', label: 'Collation' },
  dinner: { icon: 'ri-moon-line', color: '#60A5FA', label: 'Diner' },
};

export default function MinceurPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [prog, setProg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'create'>('dashboard');
  const [targetKg, setTargetKg] = useState(75);
  const [weeks, setWeeks] = useState(8);
  const [validation, setValidation] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [currentWeight, setCW] = useState(79);
  const [showStop, setShowStop] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch('/api/minceur/active', {}, token).then(d => {
      if (d.active) { setProg(d); setView('dashboard'); }
      else {
        setView('create');
        apiFetch('/api/devices/scale/history', {}, token).then((h: any[]) => {
          if (h?.[0]?.weight) { setCW(h[0].weight); setTargetKg(Math.round(h[0].weight - 4)); }
        }).catch(() => {});
      }
    }).catch(() => setView('create')).finally(() => setLoading(false));
  }, [token]);

  const validate = async () => {
    try {
      const r = await apiFetch('/api/minceur/validate-goal', { method: 'POST', body: JSON.stringify({ current_kg: currentWeight, target_kg: targetKg, days: weeks * 7 }) }, token);
      setValidation(r);
    } catch {}
  };
  useEffect(() => { if (token && view === 'create') validate(); }, [targetKg, weeks, view]);

  const create = async () => {
    setCreating(true);
    try {
      const r = await apiFetch('/api/minceur/create', { method: 'POST', body: JSON.stringify({ current_kg: currentWeight, target_kg: targetKg, days: validation?.final_days || weeks * 7 }) }, token);
      const active = await apiFetch('/api/minceur/active', {}, token);
      setProg(active); setView('dashboard');
    } catch (e: any) { alert(e.message); }
    finally { setCreating(false); }
  };

  const stop = async () => { await apiFetch('/api/minceur/stop', { method: 'POST' }, token); setProg(null); setView('create'); setShowStop(false); };

  if (Platform.OS !== 'web') return null;
  const p = prog?.progress;
  const today = prog?.today;
  const diff = currentWeight - targetKg;

  return (
    <div data-testid="minceur-page" style={{ position: 'absolute', inset: 0, fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <img src={BG_IMAGES.beneficiary} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'calc(env(safe-area-inset-top, 20px) + 10px) 20px 120px' } as any}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 } as any}>
            <div onClick={() => router.back()} style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
              <i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Programme Minceur</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{prog?.active ? `Jour ${p?.days_elapsed || 0}/${prog.days}` : 'Sur-mesure'}</div>
            </div>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.4)' } as any}><i className="ri-loader-4-line" style={{ fontSize: 28, display: 'block', marginBottom: 8, animation: 'spin 1s linear infinite' }} />Chargement...</div>}

          {/* ═══ CREATE ═══ */}
          {view === 'create' && !loading && (
            <div style={{ ...G, padding: 24 } as any}>
              <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Poids actuel</div>
                <div style={{ fontSize: 42, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{currentWeight}<span style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>kg</span></div>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 -24px 20px' } as any} />
              {/* Target */}
              <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Objectif</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 } as any}>
                  <div onClick={() => setTargetKg(Math.max(40, targetKg - 0.5))} style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22, fontWeight: 700, color: '#FFF' } as any}>-</div>
                  <div>
                    <div style={{ fontSize: 48, fontWeight: 900, color: '#F59E0B', lineHeight: 1 }}>{targetKg}<span style={{ fontSize: 16, color: 'rgba(249,115,22,0.5)' }}>kg</span></div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>-{diff.toFixed(1)}kg</div>
                  </div>
                  <div onClick={() => setTargetKg(Math.min(currentWeight - 1, targetKg + 0.5))} style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22, fontWeight: 700, color: '#FFF' } as any}>+</div>
                </div>
              </div>
              {/* Weeks */}
              <div style={{ marginBottom: 20 } as any}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, textAlign: 'center' }}>Duree</div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' } as any}>
                  {[4, 6, 8, 10, 12, 16].map(w => (
                    <div key={w} onClick={() => setWeeks(w)} style={{ padding: '10px 16px', borderRadius: 12, cursor: 'pointer', background: weeks === w ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${weeks === w ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.08)'}` } as any}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: weeks === w ? '#F59E0B' : '#FFF', textAlign: 'center' }}>{w}</div>
                      <div style={{ fontSize: 8, color: weeks === w ? 'rgba(249,115,22,0.6)' : 'rgba(255,255,255,0.25)', textAlign: 'center' }}>sem.</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Validation */}
              {validation && (
                <div style={{ padding: 14, borderRadius: 14, background: validation.valid ? 'rgba(16,185,129,0.06)' : 'rgba(249,115,22,0.06)', border: `1px solid ${validation.valid ? 'rgba(16,185,129,0.15)' : 'rgba(249,115,22,0.15)'}`, marginBottom: 16 } as any}>
                  {!validation.valid && validation.recommended_days && (
                    <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 } as any}>
                      <i className="ri-alert-line" style={{ fontSize: 14 }} />Ajuste a {Math.ceil(validation.recommended_days / 7)} semaines
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-around' } as any}>
                    {[{ v: validation.daily_calories, l: 'kcal/jour' }, { v: validation.kg_per_week, l: 'kg/sem' }, { v: `-${validation.daily_deficit}`, l: 'deficit/j' }].map((x, i) => (
                      <div key={i} style={{ textAlign: 'center' } as any}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{x.v}</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{x.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div onClick={create} data-testid="create-minceur-btn" style={{ padding: '16px', borderRadius: 999, background: '#F59E0B', cursor: creating ? 'wait' : 'pointer', textAlign: 'center', fontSize: 15, fontWeight: 800, color: '#FFF', opacity: creating ? 0.6 : 1 } as any}>
                {creating ? 'Nora cree votre programme...' : 'Commencer le programme'}
              </div>
            </div>
          )}

          {/* ═══ DASHBOARD ═══ */}
          {view === 'dashboard' && prog?.active && !loading && (
            <>
              {/* Progress */}
              <div style={{ ...G, padding: 20, marginBottom: 14 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as any}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Maintenant</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{p?.current_kg}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>kg</span></div>
                  </div>
                  <i className="ri-arrow-right-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ textAlign: 'right' } as any}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Objectif</div>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#F59E0B', lineHeight: 1 }}>{prog.target_kg}<span style={{ fontSize: 12, color: 'rgba(249,115,22,0.4)' }}>kg</span></div>
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 6 } as any}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${Math.max(2, p?.progress_pct || 0)}%`, background: 'linear-gradient(90deg, #F59E0B, #10B981)' } as any} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.25)' } as any}>
                  <span>{p?.lost_kg || 0}kg perdus</span>
                  <span>{prog.daily_calories}kcal/jour</span>
                  <span>{p?.days_remaining || 0}j restants</span>
                </div>
              </div>

              {/* Pesez-vous reminder */}
              <div style={{ ...G, padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 } as any}>
                <i className="ri-scales-3-line" style={{ fontSize: 18, color: '#A78BFA' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', flex: 1 }}>Pesez-vous chaque matin a jeun sur la Balance Vita</span>
              </div>

              {/* Today's plan header */}
              {today && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '0 4px' } as any}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Jour {p?.days_elapsed || 0}</div>
                    <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.06)' } as any} />
                    {today.tip && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', maxWidth: 180, textAlign: 'right' }}>{today.tip}</div>}
                  </div>

                  {/* Meals */}
                  <div style={{ marginBottom: 14 } as any}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, padding: '0 4px' }}>Repas du jour</div>
                    {today.meals && Object.entries(today.meals).map(([key, meal]: [string, any]) => {
                      const m = MEAL_ICONS[key] || { icon: 'ri-restaurant-line', color: '#FFF', label: key };
                      return (
                        <div key={key} style={{ ...G, padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 } as any}>
                          <div style={{ width: 42, height: 42, borderRadius: 12, background: `${m.color}12`, border: `1px solid ${m.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                            <i className={m.icon} style={{ fontSize: 20, color: m.color }} />
                          </div>
                          <div style={{ flex: 1 } as any}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: m.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.label}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginTop: 1 }}>{meal.name}</div>
                            {meal.desc && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2, lineHeight: 1.4 }}>{meal.desc}</div>}
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 } as any}>
                            <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF' }}>{meal.calories}</div>
                            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>kcal</div>
                          </div>
                        </div>
                      );
                    })}
                    {/* Total */}
                    {today.meals && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 8px', gap: 8 } as any}>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Total:</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#F59E0B' }}>
                          {Object.values(today.meals).reduce((a: number, m: any) => a + (m.calories || 0), 0)} kcal
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Exercises */}
                  {today.exercises?.length > 0 && (
                    <div style={{ marginBottom: 14 } as any}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, padding: '0 4px' }}>Exercices du jour</div>
                      {today.exercises.map((ex: any, i: number) => (
                        <div key={i} style={{ ...G, padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 } as any}>
                          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                            <i className={ex.icon || 'ri-heart-pulse-line'} style={{ fontSize: 20, color: '#10B981' }} />
                          </div>
                          <div style={{ flex: 1 } as any}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{ex.name}</div>
                            {ex.desc && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{ex.desc}</div>}
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 } as any}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#10B981' }}>{ex.duration}</div>
                            {ex.intensity && <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase' }}>{ex.intensity}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Water */}
                  {today.water_ml > 0 && (
                    <div style={{ ...G, padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 } as any}>
                      <i className="ri-drop-fill" style={{ fontSize: 18, color: '#60A5FA' }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF', flex: 1 }}>Hydratation</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#60A5FA' }}>{(today.water_ml / 1000).toFixed(1)}L</span>
                    </div>
                  )}
                </>
              )}

              {/* Weight history */}
              {prog.weigh_ins?.length > 1 && (
                <div style={{ ...G, padding: 16, marginBottom: 14 } as any}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Evolution</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 50 } as any}>
                    {prog.weigh_ins.slice(-12).map((w: any, i: number, arr: any[]) => {
                      const min = prog.target_kg - 1; const max = prog.current_kg + 1;
                      const pct = Math.max(8, ((w.weight - min) / (max - min)) * 100);
                      const last = i === arr.length - 1;
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 } as any}>
                          {last && <div style={{ fontSize: 9, fontWeight: 800, color: '#F59E0B' }}>{w.weight}</div>}
                          <div style={{ width: '100%', height: `${pct}%`, borderRadius: 3, background: last ? '#F59E0B' : 'rgba(249,115,22,0.2)' } as any} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stop */}
              {!showStop ? (
                <div onClick={() => setShowStop(true)} style={{ textAlign: 'center', padding: 12, cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.15)' } as any}>Arreter le programme</div>
              ) : (
                <div style={{ ...G, padding: 16, textAlign: 'center' } as any}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 10 }}>Arreter le programme ?</div>
                  <div style={{ display: 'flex', gap: 8 } as any}>
                    <div onClick={stop} style={{ flex: 1, padding: 12, borderRadius: 999, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#EF4444' } as any}>Confirmer</div>
                    <div onClick={() => setShowStop(false)} style={{ flex: 1, padding: 12, borderRadius: 999, background: 'rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' } as any}>Annuler</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}' }} />
    </div>
  );
}
