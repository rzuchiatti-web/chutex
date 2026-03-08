import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { BG_IMAGES } from '../src/components/dashboard/constants';

const GLASS: any = { borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };

export default function MinceurPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'create'>('dashboard');
  const [targetKg, setTargetKg] = useState(75);
  const [weeks, setWeeks] = useState(8);
  const [validation, setValidation] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [dailyTip, setDailyTip] = useState<any>(null);
  const [weighInValue, setWeighInValue] = useState('');
  const [showWeighIn, setShowWeighIn] = useState(false);
  const [showStop, setShowStop] = useState(false);
  const [currentWeight, setCurrentWeight] = useState(79.2);

  useEffect(() => {
    if (!token) return;
    apiFetch('/api/minceur/active', {}, token).then(d => {
      if (d.active) { setProgram(d); setView('dashboard'); }
      else {
        setView('create');
        // Get current weight from scale
        apiFetch('/api/devices/scale/history', {}, token).then((h: any[]) => {
          if (h?.length > 0) { setCurrentWeight(h[0].weight || 79.2); setTargetKg(Math.round((h[0].weight || 79.2) - 4)); }
        }).catch(() => {});
      }
    }).catch(() => setView('create')).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (token && program?.active) apiFetch('/api/minceur/daily-tip', {}, token).then(setDailyTip).catch(() => {});
  }, [token, program]);

  const validate = async () => {
    try {
      const res = await apiFetch('/api/minceur/validate-goal', {
        method: 'POST', body: JSON.stringify({ current_kg: currentWeight, target_kg: targetKg, days: weeks * 7 })
      }, token);
      setValidation(res);
    } catch {}
  };

  useEffect(() => { if (token && view === 'create') validate(); }, [targetKg, weeks, view]);

  const createProgram = async () => {
    setCreating(true);
    try {
      const res = await apiFetch('/api/minceur/create', {
        method: 'POST', body: JSON.stringify({ current_kg: currentWeight, target_kg: targetKg, days: (validation?.final_days || weeks * 7) })
      }, token);
      setProgram({ ...res, active: true, progress: { current_kg: res.current_kg, lost_kg: 0, progress_pct: 0, days_elapsed: 0, days_remaining: res.days }, daily_tasks: [
        { icon: 'ri-restaurant-line', label: 'Objectif calorique', value: `${res.daily_calories} kcal`, color: '#F59E0B' },
        { icon: 'ri-drop-line', label: 'Hydratation', value: '1.5L minimum', color: '#60A5FA' },
        { icon: 'ri-walk-line', label: 'Activite', value: '30 min de marche', color: '#10B981' },
        { icon: 'ri-scales-3-line', label: 'Pesee matinale', value: 'A jeun le matin', color: '#A78BFA' },
      ] });
      setView('dashboard');
    } catch (e: any) { alert(e.message); }
    finally { setCreating(false); }
  };

  const submitWeighIn = async () => {
    const w = parseFloat(weighInValue);
    if (!w) return;
    await apiFetch('/api/minceur/weigh-in', { method: 'POST', body: JSON.stringify({ weight: w }) }, token);
    setShowWeighIn(false); setWeighInValue('');
    const d = await apiFetch('/api/minceur/active', {}, token);
    if (d.active) setProgram(d);
  };

  const stopProgram = async () => {
    await apiFetch('/api/minceur/stop', { method: 'POST' }, token);
    setProgram(null); setView('create'); setShowStop(false);
  };

  if (Platform.OS !== 'web') return null;
  const p = program?.progress;
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
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Objectif poids sur-mesure</div>
            </div>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.4)' } as any}>Chargement...</div>}

          {/* ═══ CREATE ═══ */}
          {view === 'create' && !loading && (
            <div style={{ ...GLASS, padding: 24 } as any}>
              {/* Current weight display */}
              <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Poids actuel</div>
                <div style={{ fontSize: 42, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{currentWeight}<span style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>kg</span></div>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 -24px 24px' } as any} />

              {/* Target weight — +/- buttons */}
              <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Objectif</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 } as any}>
                  <div onClick={() => setTargetKg(Math.max(40, targetKg - 0.5))} style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22, fontWeight: 700, color: '#FFF' } as any}>-</div>
                  <div>
                    <div style={{ fontSize: 48, fontWeight: 900, color: '#F59E0B', lineHeight: 1 }}>{targetKg}<span style={{ fontSize: 16, color: 'rgba(249,115,22,0.5)' }}>kg</span></div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>-{diff.toFixed(1)}kg a perdre</div>
                  </div>
                  <div onClick={() => setTargetKg(Math.min(currentWeight - 1, targetKg + 0.5))} style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22, fontWeight: 700, color: '#FFF' } as any}>+</div>
                </div>
              </div>

              {/* Duration — week selector */}
              <div style={{ marginBottom: 24 } as any}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, textAlign: 'center' }}>Duree</div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' } as any}>
                  {[4, 6, 8, 10, 12, 16].map(w => (
                    <div key={w} onClick={() => setWeeks(w)} style={{
                      padding: '10px 16px', borderRadius: 12, cursor: 'pointer',
                      background: weeks === w ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${weeks === w ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.08)'}`,
                    } as any}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: weeks === w ? '#F59E0B' : '#FFF', textAlign: 'center' }}>{w}</div>
                      <div style={{ fontSize: 8, color: weeks === w ? 'rgba(249,115,22,0.6)' : 'rgba(255,255,255,0.25)', textAlign: 'center' }}>sem.</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation card */}
              {validation && (
                <div style={{ padding: 16, borderRadius: 16, background: validation.valid ? 'rgba(16,185,129,0.06)' : 'rgba(249,115,22,0.06)', border: `1px solid ${validation.valid ? 'rgba(16,185,129,0.15)' : 'rgba(249,115,22,0.15)'}`, marginBottom: 20 } as any}>
                  {!validation.valid && validation.recommended_days && (
                    <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 700, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 } as any}>
                      <i className="ri-alert-line" style={{ fontSize: 14 }} />
                      Trop rapide — duree ajustee a {Math.ceil(validation.recommended_days / 7)} semaines
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-around' } as any}>
                    <div style={{ textAlign: 'center' } as any}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{validation.daily_calories}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>kcal/jour</div>
                    </div>
                    <div style={{ width: 1, background: 'rgba(255,255,255,0.06)' } as any} />
                    <div style={{ textAlign: 'center' } as any}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{validation.kg_per_week}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>kg/sem</div>
                    </div>
                    <div style={{ width: 1, background: 'rgba(255,255,255,0.06)' } as any} />
                    <div style={{ textAlign: 'center' } as any}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>-{validation.daily_deficit}</div>
                      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>deficit/j</div>
                    </div>
                  </div>
                </div>
              )}

              <div onClick={createProgram} data-testid="create-minceur-btn" style={{ padding: '16px', borderRadius: 999, background: '#F59E0B', cursor: creating ? 'wait' : 'pointer', textAlign: 'center', fontSize: 15, fontWeight: 800, color: '#FFF', opacity: creating ? 0.6 : 1 } as any}>
                {creating ? 'Nora prepare votre programme...' : 'Commencer'}
              </div>
            </div>
          )}

          {/* ═══ DASHBOARD ═══ */}
          {view === 'dashboard' && program?.active && !loading && (
            <>
              {/* Weight journey card */}
              <div style={{ ...GLASS, padding: 24, marginBottom: 14 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 } as any}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Aujourd'hui</div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{p?.current_kg || program.current_kg}<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>kg</span></div>
                  </div>
                  <div style={{ textAlign: 'center' } as any}>
                    <i className="ri-arrow-right-line" style={{ fontSize: 20, color: 'rgba(255,255,255,0.15)' }} />
                  </div>
                  <div style={{ textAlign: 'right' } as any}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Objectif</div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: '#F59E0B', lineHeight: 1 }}>{program.target_kg}<span style={{ fontSize: 14, color: 'rgba(249,115,22,0.4)' }}>kg</span></div>
                  </div>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 8 } as any}>
                  <div style={{ height: '100%', borderRadius: 4, width: `${Math.max(2, p?.progress_pct || 0)}%`, background: 'linear-gradient(90deg, #F59E0B, #10B981)', transition: 'width 0.8s' } as any} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' } as any}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{p?.lost_kg || 0}kg perdus</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>J{p?.days_elapsed || 0}/{program.days}</span>
                </div>
              </div>

              {/* Daily calories — big and clear */}
              <div style={{ ...GLASS, padding: '16px 20px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 16 } as any}>
                <div style={{ width: 50, height: 50, borderRadius: 16, background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <i className="ri-restaurant-line" style={{ fontSize: 24, color: '#F59E0B' }} />
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF' }}>{program.daily_calories} <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>kcal/jour</span></div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Deficit {program.daily_deficit}kcal — Rythme {program.kg_per_week}kg/sem</div>
                </div>
              </div>

              {/* Daily checklist */}
              <div style={{ ...GLASS, padding: 16, marginBottom: 14 } as any}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Objectifs du jour</div>
                {(program.daily_tasks || []).map((t: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: `${t.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                      <i className={t.icon} style={{ fontSize: 16, color: t.color }} />
                    </div>
                    <div style={{ flex: 1 } as any}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{t.label}</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{t.value}</div>
                  </div>
                ))}
              </div>

              {/* Nora tip — chat bubble style */}
              {(dailyTip?.tip || program.ai_tip?.tip) && (
                <div style={{ ...GLASS, padding: 16, marginBottom: 14 } as any}>
                  <div style={{ display: 'flex', gap: 10 } as any}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                      <i className="ri-robot-2-line" style={{ fontSize: 16, color: '#A78BFA' }} />
                    </div>
                    <div style={{ flex: 1 } as any}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#A78BFA', marginBottom: 4 }}>Nora</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{dailyTip?.tip || program.ai_tip?.tip}</div>
                      {(dailyTip?.meal_plan || program.ai_tip?.meal_plan) && (
                        <div style={{ marginTop: 8, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, whiteSpace: 'pre-line' } as any}>
                          {dailyTip?.meal_plan || program.ai_tip?.meal_plan}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Weigh-in */}
              {!showWeighIn ? (
                <div onClick={() => setShowWeighIn(true)} data-testid="weigh-in-btn" style={{ ...GLASS, padding: '14px 16px', marginBottom: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 } as any}>
                  <i className="ri-add-circle-line" style={{ fontSize: 20, color: '#10B981' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF', flex: 1 }}>Enregistrer une pesee</span>
                  <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }} />
                </div>
              ) : (
                <div style={{ ...GLASS, padding: 16, marginBottom: 14 } as any}>
                  <input type="number" step="0.1" placeholder={`Ex: ${(p?.current_kg || 79) - 0.3}`} value={weighInValue}
                    onChange={(e: any) => setWeighInValue(e.target.value)} autoFocus
                    style={{ width: '100%', padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', fontSize: 22, fontWeight: 900, textAlign: 'center', outline: 'none', boxSizing: 'border-box' } as any} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 } as any}>
                    <div onClick={submitWeighIn} style={{ flex: 1, padding: '12px', borderRadius: 999, background: '#10B981', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#FFF' } as any}>Valider</div>
                    <div onClick={() => setShowWeighIn(false)} style={{ padding: '12px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' } as any}>Annuler</div>
                  </div>
                </div>
              )}

              {/* Weight history mini-chart */}
              {program.weigh_ins?.length > 1 && (
                <div style={{ ...GLASS, padding: 16, marginBottom: 14 } as any}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Evolution</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 60 } as any}>
                    {program.weigh_ins.slice(-12).map((w: any, i: number, arr: any[]) => {
                      const min = program.target_kg - 1;
                      const max = program.current_kg + 1;
                      const pct = Math.max(8, ((w.weight - min) / (max - min)) * 100);
                      const isLast = i === arr.length - 1;
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 } as any}>
                          {isLast && <div style={{ fontSize: 9, fontWeight: 800, color: '#F59E0B' }}>{w.weight}</div>}
                          <div style={{ width: '100%', height: `${pct}%`, borderRadius: 3, background: isLast ? '#F59E0B' : 'rgba(249,115,22,0.25)' } as any} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stop button */}
              {!showStop ? (
                <div onClick={() => setShowStop(true)} style={{ textAlign: 'center', padding: '12px', cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.2)' } as any}>
                  Arreter le programme
                </div>
              ) : (
                <div style={{ ...GLASS, padding: 16, textAlign: 'center' } as any}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 10 }}>Arreter le programme ?</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>Votre progression sera conservee.</div>
                  <div style={{ display: 'flex', gap: 8 } as any}>
                    <div onClick={stopProgram} style={{ flex: 1, padding: '12px', borderRadius: 999, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#EF4444' } as any}>Confirmer</div>
                    <div onClick={() => setShowStop(false)} style={{ flex: 1, padding: '12px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' } as any}>Annuler</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
