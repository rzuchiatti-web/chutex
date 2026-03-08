import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { BG_IMAGES } from '../src/components/dashboard/constants';

const G: any = { borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };
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
  const [weighings, setWeighings] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any>({});
  const [showGoal, setShowGoal] = useState(false);
  const [targetKg, setTargetKg] = useState(75);
  const [weeks, setWeeks] = useState(8);
  const [validation, setValidation] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [showStop, setShowStop] = useState(false);
  const [noraAdvice, setNoraAdvice] = useState<any>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiFetch('/api/minceur/active', {}, token).catch(() => ({ active: false })),
      apiFetch('/api/devices/scale/history', {}, token).catch(() => []),
      apiFetch('/api/health/summary', {}, token).catch(() => ({})),
    ]).then(([m, w, h]) => {
      if (m?.active) setProg(m);
      setWeighings(w || []);
      setHealthData(h || {});
      const cw = w?.[0]?.weight || h?.weight || 79;
      setTargetKg(Math.round(cw - 4));
    }).finally(() => setLoading(false));
  }, [token]);

  // Load Nora advice if program active
  useEffect(() => {
    if (token && prog?.active && prog?.today) setNoraAdvice(prog.today);
  }, [prog]);

  const currentWeight = weighings[0]?.weight || healthData?.weight || 0;
  const bmi = weighings[0]?.bmi || healthData?.bmi || 0;
  const bodyFat = weighings[0]?.body_fat_pct || healthData?.body_fat_pct || 0;
  const muscle = weighings[0]?.muscle_rate || weighings[0]?.muscle_mass || 0;
  const water = weighings[0]?.hydration_pct || healthData?.water_pct || 0;

  const validate = async () => {
    try {
      const r = await apiFetch('/api/minceur/validate-goal', { method: 'POST', body: JSON.stringify({ current_kg: currentWeight, target_kg: targetKg, days: weeks * 7 }) }, token);
      setValidation(r);
    } catch {}
  };
  useEffect(() => { if (token && showGoal && currentWeight > 0) validate(); }, [targetKg, weeks, showGoal]);

  const create = async () => {
    setCreating(true);
    try {
      await apiFetch('/api/minceur/create', { method: 'POST', body: JSON.stringify({ current_kg: currentWeight, target_kg: targetKg, days: validation?.final_days || weeks * 7 }) }, token);
      const m = await apiFetch('/api/minceur/active', {}, token);
      if (m?.active) setProg(m);
      setShowGoal(false);
    } catch (e: any) { alert(e.message); }
    finally { setCreating(false); }
  };

  const stop = async () => { await apiFetch('/api/minceur/stop', { method: 'POST' }, token); setProg(null); setShowStop(false); };

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 } as any}>
            <div onClick={() => router.back()} style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
              <i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Poids & Nutrition</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Suivi personnalise</div>
            </div>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.4)' } as any}>Chargement...</div>}

          {!loading && (
            <>
              {/* ═══ WEIGHT HERO ═══ */}
              <div style={{ ...G, padding: 20, marginBottom: 14 } as any}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 } as any}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Poids actuel</div>
                    <div style={{ fontSize: 38, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{currentWeight > 0 ? currentWeight : '--'}<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>kg</span></div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 } as any}>
                    {bmi > 0 && <div style={{ textAlign: 'center' } as any}><div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{bmi}</div><div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>IMC</div></div>}
                    {bodyFat > 0 && <div style={{ textAlign: 'center' } as any}><div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{bodyFat}%</div><div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>Graisse</div></div>}
                    {muscle > 0 && <div style={{ textAlign: 'center' } as any}><div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{muscle}%</div><div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>Muscle</div></div>}
                  </div>
                </div>
                {/* Weight chart */}
                {weighings.length >= 2 && (
                  <div style={{ height: 60, display: 'flex', alignItems: 'flex-end', gap: 3, marginBottom: 8 } as any}>
                    {weighings.slice(0, 14).reverse().map((w: any, i: number, arr: any[]) => {
                      const ws = arr.map((x: any) => x.weight);
                      const min = Math.min(...ws) - 1; const max = Math.max(...ws) + 1;
                      const pct = Math.max(10, ((w.weight - min) / (max - min)) * 100);
                      const last = i === arr.length - 1;
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 } as any}>
                          {last && <div style={{ fontSize: 9, fontWeight: 800, color: '#F59E0B' }}>{w.weight}</div>}
                          <div style={{ width: '100%', height: `${pct}%`, borderRadius: 3, background: last ? '#F59E0B' : 'rgba(249,115,22,0.2)' } as any} />
                        </div>
                      );
                    })}
                  </div>
                )}
                {weighings.length > 0 && (
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Derniere pesee : {new Date(weighings[0].date || weighings[0].timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>
                )}
                {weighings.length === 0 && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: 8 }}>Pesez-vous sur la Balance Vita pour commencer le suivi</div>}
              </div>

              {/* ═══ GOAL (if active) ═══ */}
              {prog?.active && (
                <div style={{ ...G, padding: 16, marginBottom: 14 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } as any}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#FFF' }}>Objectif</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#F59E0B' }}>{prog.target_kg}kg</div>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 6 } as any}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${Math.max(2, p?.progress_pct || 0)}%`, background: 'linear-gradient(90deg, #F59E0B, #10B981)' } as any} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.25)' } as any}>
                    <span>{p?.lost_kg || 0}kg perdus</span>
                    <span>{prog.daily_calories}kcal/jour</span>
                    <span>J{p?.days_elapsed || 0}/{prog.days}</span>
                  </div>
                </div>
              )}

              {/* ═══ TODAY'S PLAN (if active) ═══ */}
              {today && (
                <>
                  {/* Meals */}
                  {today.meals && (
                    <div style={{ marginBottom: 14 } as any}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, padding: '0 4px' }}>Repas du jour</div>
                      {Object.entries(today.meals).map(([key, meal]: [string, any]) => {
                        const m = MEAL_ICONS[key] || { icon: 'ri-restaurant-line', color: '#FFF', label: key };
                        return (
                          <div key={key} style={{ ...G, padding: '12px 14px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 } as any}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${m.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                              <i className={m.icon} style={{ fontSize: 16, color: m.color }} />
                            </div>
                            <div style={{ flex: 1 } as any}>
                              <div style={{ fontSize: 8, fontWeight: 700, color: m.color, textTransform: 'uppercase' }}>{m.label}</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{meal.name}</div>
                              {meal.desc && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{meal.desc}</div>}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 900, color: 'rgba(255,255,255,0.5)' }}>{meal.calories}<span style={{ fontSize: 8 }}>kcal</span></div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* Exercises */}
                  {today.exercises?.length > 0 && (
                    <div style={{ marginBottom: 14 } as any}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, padding: '0 4px' }}>Exercices</div>
                      {today.exercises.map((ex: any, i: number) => (
                        <div key={i} style={{ ...G, padding: '12px 14px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 } as any}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                            <i className={ex.icon || 'ri-heart-pulse-line'} style={{ fontSize: 16, color: '#10B981' }} />
                          </div>
                          <div style={{ flex: 1 } as any}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{ex.name}</div>
                            {ex.desc && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{ex.desc}</div>}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#10B981' }}>{ex.duration}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {today.tip && (
                    <div style={{ ...G, padding: '12px 14px', marginBottom: 14, display: 'flex', gap: 10 } as any}>
                      <i className="ri-lightbulb-line" style={{ fontSize: 16, color: '#A78BFA', flexShrink: 0, marginTop: 2 }} />
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{today.tip}</div>
                    </div>
                  )}
                </>
              )}

              {/* ═══ SET GOAL (if no active program) ═══ */}
              {!prog?.active && !showGoal && (
                <div onClick={() => setShowGoal(true)} style={{ ...G, padding: 16, marginBottom: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 } as any}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                    <i className="ri-flag-line" style={{ fontSize: 20, color: '#F59E0B' }} />
                  </div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Fixer un objectif de poids</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Recevez des repas et exercices personnalises</div>
                  </div>
                  <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.15)' }} />
                </div>
              )}

              {showGoal && !prog?.active && (
                <div style={{ ...G, padding: 20, marginBottom: 14 } as any}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 16 }}>Objectif de poids</div>
                  {/* Target +/- */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16 } as any}>
                    <div onClick={() => setTargetKg(Math.max(40, targetKg - 0.5))} style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, fontWeight: 700, color: '#FFF' } as any}>-</div>
                    <div style={{ textAlign: 'center' } as any}>
                      <div style={{ fontSize: 36, fontWeight: 900, color: '#F59E0B', lineHeight: 1 }}>{targetKg}<span style={{ fontSize: 14, color: 'rgba(249,115,22,0.5)' }}>kg</span></div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>-{diff.toFixed(1)}kg</div>
                    </div>
                    <div onClick={() => setTargetKg(Math.min(currentWeight - 1, targetKg + 0.5))} style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, fontWeight: 700, color: '#FFF' } as any}>+</div>
                  </div>
                  {/* Weeks */}
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 14 } as any}>
                    {[4, 6, 8, 10, 12].map(w => (
                      <div key={w} onClick={() => setWeeks(w)} style={{ padding: '8px 12px', borderRadius: 10, cursor: 'pointer', background: weeks === w ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${weeks === w ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.08)'}`, fontSize: 12, fontWeight: 800, color: weeks === w ? '#F59E0B' : 'rgba(255,255,255,0.4)', textAlign: 'center' } as any}>{w}s</div>
                    ))}
                  </div>
                  {validation && (
                    <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 14 } as any}>
                      <div style={{ textAlign: 'center' } as any}><div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{validation.daily_calories}</div><div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>kcal/jour</div></div>
                      <div style={{ textAlign: 'center' } as any}><div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{validation.kg_per_week}</div><div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>kg/sem</div></div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 } as any}>
                    <div onClick={create} style={{ flex: 1, padding: 14, borderRadius: 999, background: '#F59E0B', cursor: creating ? 'wait' : 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 800, color: '#FFF', opacity: creating ? 0.6 : 1 } as any}>{creating ? 'Creation...' : 'Commencer'}</div>
                    <div onClick={() => setShowGoal(false)} style={{ padding: '14px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.4)' } as any}>Annuler</div>
                  </div>
                </div>
              )}

              {/* Stop */}
              {prog?.active && (
                !showStop ? (
                  <div onClick={() => setShowStop(true)} style={{ textAlign: 'center', padding: 12, cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.15)' } as any}>Arreter l'objectif</div>
                ) : (
                  <div style={{ ...G, padding: 16, textAlign: 'center' } as any}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 10 }}>Arreter l'objectif ?</div>
                    <div style={{ display: 'flex', gap: 8 } as any}>
                      <div onClick={stop} style={{ flex: 1, padding: 12, borderRadius: 999, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#EF4444' } as any}>Confirmer</div>
                      <div onClick={() => setShowStop(false)} style={{ flex: 1, padding: 12, borderRadius: 999, background: 'rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' } as any}>Annuler</div>
                    </div>
                  </div>
                )
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
