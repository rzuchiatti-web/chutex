import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const BG_IMG = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=60';
const GLASS: any = { borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };

export default function MinceurPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [program, setProgram] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'create'>('dashboard');
  const [targetKg, setTargetKg] = useState(75);
  const [days, setDays] = useState(60);
  const [validation, setValidation] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [dailyTip, setDailyTip] = useState<any>(null);
  const [weighInValue, setWeighInValue] = useState('');
  const [showWeighIn, setShowWeighIn] = useState(false);

  useEffect(() => {
    if (token) {
      apiFetch('/api/minceur/active', {}, token).then(d => {
        if (d.active) { setProgram(d); setView('dashboard'); }
        else setView('create');
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [token]);

  useEffect(() => {
    if (token && program?.active) {
      apiFetch('/api/minceur/daily-tip', {}, token).then(setDailyTip).catch(() => {});
    }
  }, [token, program]);

  const validate = async () => {
    const currentKg = program?.current_kg || 79.2;
    const res = await apiFetch('/api/minceur/validate-goal', {
      method: 'POST', body: JSON.stringify({ current_kg: currentKg, target_kg: targetKg, days })
    }, token);
    setValidation(res);
  };

  useEffect(() => { if (token && view === 'create') validate(); }, [targetKg, days, view]);

  const createProgram = async () => {
    setCreating(true);
    try {
      const res = await apiFetch('/api/minceur/create', {
        method: 'POST', body: JSON.stringify({ target_kg: targetKg, days: validation?.final_days || days })
      }, token);
      setProgram({ ...res, active: true, progress: { current_kg: res.current_kg, lost_kg: 0, progress_pct: 0, days_elapsed: 0, days_remaining: res.days }, daily_tasks: [] });
      setView('dashboard');
    } catch (e: any) { alert(e.message); }
    finally { setCreating(false); }
  };

  const submitWeighIn = async () => {
    const w = parseFloat(weighInValue);
    if (!w || w <= 0) return;
    await apiFetch('/api/minceur/weigh-in', { method: 'POST', body: JSON.stringify({ weight: w }) }, token);
    setShowWeighIn(false); setWeighInValue('');
    const d = await apiFetch('/api/minceur/active', {}, token);
    if (d.active) setProgram(d);
  };

  if (Platform.OS !== 'web') return null;

  const p = program?.progress;

  return (
    <div data-testid="minceur-page" style={{ position: 'absolute', inset: 0, fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <img src={BG_IMG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, filter: 'brightness(0.3)' } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.3), rgba(0,0,0,0.7))', zIndex: 1 } as any} />
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '0 20px 120px', WebkitOverflowScrolling: 'touch', zIndex: 5 } as any}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '20px 0 16px', gap: 12 } as any}>
          <div onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} />
          </div>
          <div style={{ flex: 1 } as any}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Programme Minceur</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Objectif poids sur-mesure</div>
          </div>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.4)' } as any}>Chargement...</div>}

        <div style={{ maxWidth: 480, margin: '0 auto' } as any}>
          {/* ═══ CREATE VIEW ═══ */}
          {view === 'create' && !loading && (
            <>
              <div style={{ ...GLASS, padding: 24, marginBottom: 16 } as any}>
                <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
                  <i className="ri-scales-3-line" style={{ fontSize: 36, color: '#F59E0B', display: 'block', marginBottom: 8 }} />
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Definir votre objectif</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Poids actuel: {program?.current_kg || 79.2}kg</div>
                </div>

                <div style={{ marginBottom: 20 } as any}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 } as any}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>Poids cible</span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#F59E0B' }}>{targetKg} kg</span>
                  </div>
                  <input type="range" min={50} max={Math.round((program?.current_kg || 79) - 1)} step={0.5} value={targetKg}
                    onChange={(e: any) => setTargetKg(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#F59E0B' }} />
                </div>

                <div style={{ marginBottom: 20 } as any}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 } as any}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>Duree</span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#60A5FA' }}>{days} jours</span>
                  </div>
                  <input type="range" min={14} max={180} step={7} value={days}
                    onChange={(e: any) => setDays(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#60A5FA' }} />
                </div>

                {/* Validation result */}
                {validation && (
                  <div style={{ padding: 14, borderRadius: 14, background: validation.valid ? 'rgba(16,185,129,0.08)' : 'rgba(249,115,22,0.08)', border: `1px solid ${validation.valid ? 'rgba(16,185,129,0.2)' : 'rgba(249,115,22,0.2)'}`, marginBottom: 16 } as any}>
                    {!validation.valid && validation.recommended_days && (
                      <div style={{ fontSize: 12, color: '#F59E0B', fontWeight: 700, marginBottom: 6 }}>
                        Objectif trop rapide ! Duree recommandee : {validation.recommended_days} jours ({validation.recommended_weeks} semaines)
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } as any}>
                      <div style={{ textAlign: 'center' } as any}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{validation.daily_calories}</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>kcal/jour</div>
                      </div>
                      <div style={{ textAlign: 'center' } as any}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{validation.kg_per_week}</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>kg/semaine</div>
                      </div>
                    </div>
                  </div>
                )}

                <div onClick={createProgram} data-testid="create-minceur-btn" style={{ padding: '16px', borderRadius: 999, background: '#F59E0B', cursor: creating ? 'wait' : 'pointer', textAlign: 'center', fontSize: 15, fontWeight: 800, color: '#FFF', opacity: creating ? 0.6 : 1 } as any}>
                  {creating ? 'Creation...' : 'Lancer le programme'}
                </div>
              </div>
            </>
          )}

          {/* ═══ DASHBOARD VIEW ═══ */}
          {view === 'dashboard' && program?.active && !loading && (
            <>
              {/* Progress hero */}
              <div style={{ ...GLASS, padding: 24, marginBottom: 16, textAlign: 'center', position: 'relative', overflow: 'hidden' } as any}>
                <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 16px' } as any}>
                  <svg viewBox="0 0 120 120" style={{ width: 120, height: 120, transform: 'rotate(-90deg)' } as any}>
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#F59E0B" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${(p?.progress_pct || 0) / 100 * 314} 314`} />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } as any}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF' }}>{p?.current_kg || program.current_kg}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>kg</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>
                  Objectif <strong style={{ color: '#F59E0B' }}>{program.target_kg}kg</strong> — {p?.lost_kg || 0}kg perdus
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 8 } as any}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${Math.max(2, p?.progress_pct || 0)}%`, background: 'linear-gradient(90deg, #F59E0B, #10B981)' } as any} />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  Jour {p?.days_elapsed || 0}/{program.days} — {p?.days_remaining || program.days} jours restants
                </div>
              </div>

              {/* Calorie target */}
              <div style={{ ...GLASS, padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 } as any}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(249,115,22,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <i className="ri-restaurant-line" style={{ fontSize: 22, color: '#F59E0B' }} />
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF' }}>{program.daily_calories} <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>kcal/jour</span></div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Deficit de {program.daily_deficit}kcal vs votre metabolisme ({program.tdee}kcal)</div>
                </div>
              </div>

              {/* Daily tasks */}
              <div style={{ ...GLASS, padding: 16, marginBottom: 16 } as any}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', marginBottom: 10 }}>Objectifs du jour</div>
                {(program.daily_tasks || []).map((t: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' } as any}>
                    <i className={t.icon} style={{ fontSize: 18, color: t.color, width: 24, textAlign: 'center' }} />
                    <div style={{ flex: 1 } as any}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{t.label}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{t.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Tip */}
              {(dailyTip?.tip || program.ai_tip?.tip) && (
                <div style={{ ...GLASS, padding: 16, marginBottom: 16 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } as any}>
                    <i className="ri-robot-2-line" style={{ fontSize: 16, color: '#A78BFA' }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#A78BFA' }}>Conseil de Nora</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 8 }}>{dailyTip?.tip || program.ai_tip?.tip}</div>
                  {(dailyTip?.meal_plan || program.ai_tip?.meal_plan) && (
                    <div style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' } as any}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>MENU SUGGERE</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{dailyTip?.meal_plan || program.ai_tip?.meal_plan}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Weigh-in button */}
              {!showWeighIn ? (
                <div onClick={() => setShowWeighIn(true)} data-testid="weigh-in-btn" style={{ ...GLASS, padding: 16, marginBottom: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 } as any}>
                  <i className="ri-scales-3-line" style={{ fontSize: 22, color: '#10B981' }} />
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Enregistrer une pesee</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Pesez-vous le matin a jeun</div>
                  </div>
                  <i className="ri-add-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />
                </div>
              ) : (
                <div style={{ ...GLASS, padding: 16, marginBottom: 16 } as any}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 10 }}>Nouvelle pesee</div>
                  <input type="number" step="0.1" placeholder="Ex: 78.5" value={weighInValue}
                    onChange={(e: any) => setWeighInValue(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 18, fontWeight: 800, textAlign: 'center', outline: 'none', boxSizing: 'border-box' } as any} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 } as any}>
                    <div onClick={submitWeighIn} style={{ flex: 1, padding: '12px', borderRadius: 999, background: '#10B981', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#FFF' } as any}>Enregistrer</div>
                    <div onClick={() => setShowWeighIn(false)} style={{ padding: '12px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' } as any}>Annuler</div>
                  </div>
                </div>
              )}

              {/* Weight history chart */}
              {program.weigh_ins?.length > 1 && (
                <div style={{ ...GLASS, padding: 16, marginBottom: 16 } as any}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', marginBottom: 10 }}>Evolution du poids</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 } as any}>
                    {program.weigh_ins.slice(-10).map((w: any, i: number) => {
                      const min = program.target_kg - 1;
                      const max = program.current_kg + 1;
                      const pct = ((w.weight - min) / (max - min)) * 100;
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 } as any}>
                          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>{w.weight}</div>
                          <div style={{ width: '100%', height: `${Math.max(10, pct)}%`, borderRadius: 4, background: i === program.weigh_ins.length - 1 ? '#F59E0B' : 'rgba(249,115,22,0.3)' } as any} />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 } as any}>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>Debut</span>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>Aujourd'hui</span>
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
