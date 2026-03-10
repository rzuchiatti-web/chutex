import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const G = '#10B981', A = '#F59E0B', B = '#38BDF8', R = '#EF4444', P = '#A78BFA', CY = '#22D3EE';
const GL: any = { borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };
const BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/1lq6xl58_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2008_54_55.png';
const HERO_IMG = 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/75gbxosw_physique.png';

function GaugeRing({ pct, color, size = 56, children }: { pct: number; color: string; size?: number; children?: any }) {
  const r = (size - 5) / 2, circ = 2 * Math.PI * r;
  return (
    <div style={{ width: size, height: size, position: 'relative' } as any}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" /><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5" strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} /></svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>{children}</div>
    </div>
  );
}

export default function ActivityDetailPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [d, setD] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [minceur, setMinceur] = useState<any>(null);
  const [tracked, setTracked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showExplain, setShowExplain] = useState(false);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiFetch('/api/health/daily-report', {}, token).catch(() => ({})),
      apiFetch('/api/health/activity-streak', {}, token).catch(() => ({})),
      apiFetch('/api/minceur/weight-details', {}, token).catch(() => ({})),
      apiFetch('/api/minceur/today-tracking', {}, token).catch(() => ({})),
    ]).then(([report, st, minc, trk]) => {
      setD(report); setStreak(st); setMinceur(minc);
      if (trk?.completed) setTracked(trk.completed);
    }).finally(() => setLoading(false));
  }, [token]);

  const toggleTrack = async (index: number) => {
    const k = `exercise_${index}`, was = tracked[k];
    setTracked(p => ({ ...p, [k]: !was }));
    try { await apiFetch('/api/minceur/track', { method: 'POST', body: JSON.stringify({ type: 'exercise', index }) }, token); } catch { setTracked(p => ({ ...p, [k]: was })); }
  };

  if (Platform.OS !== 'web') return null;

  const steps = d?.steps || 0, cal = d?.calories || 0, dist = d?.distance_km || 0;
  const hr = d?.heart_rate || 0, hrv = d?.hrv || 0;
  const vo2 = d?.vo2_max || 0, stress = d?.stress_level || 0, recovery = d?.recovery_score || 0;
  const slQ = d?.sleep_quality || 0;

  let recPct = recovery;
  if (recPct === 0 && (slQ > 0 || stress > 0 || hr > 0)) {
    let s = 50;
    if (slQ >= 80) s += 20; else if (slQ >= 60) s += 10; else if (slQ > 0 && slQ < 50) s -= 15;
    if (stress > 70) s -= 25; else if (stress > 50) s -= 10; else if (stress > 0 && stress <= 30) s += 10;
    if (hr > 0 && hr <= 65) s += 15; else if (hr > 85) s -= 10;
    recPct = Math.max(10, Math.min(100, s));
  }
  const recCol = recPct >= 80 ? G : recPct >= 60 ? CY : recPct >= 40 ? A : R;
  const recLabel = recPct >= 80 ? 'Optimale' : recPct >= 60 ? 'Bonne' : recPct >= 40 ? 'Moderee' : 'Faible';
  // Recovery time correlated with actual recovery percentage
  const recMinutes = Math.round((100 - recPct) * 14.4); // 0% = 24h, 100% = 0h
  const recH = Math.floor(recMinutes / 60);
  const recM = recMinutes % 60;
  const recTimeStr = recMinutes <= 0 ? 'Pret' : recH > 0 ? `${recH}h${recM > 0 ? String(recM).padStart(2, '0') : ''}` : `${recM}min`;
  const vo2Label = vo2 >= 40 ? 'Excellent' : vo2 >= 30 ? 'Bon' : vo2 >= 20 ? 'Moyen' : vo2 > 0 ? 'Faible' : '--';
  const vo2Col = vo2 >= 40 ? G : vo2 >= 30 ? CY : vo2 >= 20 ? A : R;
  const st = streak || {};

  return (
    <div data-testid="activity-detail-page" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'calc(env(safe-area-inset-top, 20px) + 12px) 20px 120px' } as any}>

          <div style={{ marginBottom: 8 } as any}>
            <div data-testid="back-button" onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: '80px 0' } as any}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: A, animation: 'spin 0.8s linear infinite', margin: '0 auto' } as any} /></div>}

          {!loading && (
            <>
              {/* Hero */}
              <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 } as any}>
                <img src={HERO_IMG} alt="" style={{ width: 200, height: 200, objectFit: 'contain', margin: '0 auto', display: 'block', filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.5))', position: 'relative', zIndex: 3, marginBottom: -50 } as any} />
              </div>

              {/* ══ CARTE 1: Activité + Récupération + VO2 ══ */}
              <div style={{ ...GL, padding: '60px 20px 20px', position: 'relative', zIndex: 1, marginBottom: 14 } as any}>
                <div style={{ textAlign: 'center', marginBottom: 14 } as any}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5 }}>Activite du jour</div>
                  {st.current_streak > 0 && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)', marginTop: 6 } as any}><i className="ri-fire-fill" style={{ fontSize: 11, color: A }} /><span style={{ fontSize: 11, fontWeight: 900, color: A }}>{st.current_streak}j consecutifs</span></div>}
                </div>

                {/* Steps + Calories + Distance */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 } as any}>
                  {[
                    { label: 'Pas', value: steps, goal: 6000, icon: 'ri-footprint-line', color: G },
                    { label: 'Calories', value: cal, goal: 300, icon: 'ri-fire-line', color: A },
                    { label: 'Distance', value: dist, goal: 4, icon: 'ri-route-line', color: B, decimal: true },
                  ].map((m, i) => {
                    const pct = m.goal > 0 ? Math.min(100, Math.round((m.value / m.goal) * 100)) : 0;
                    const has = m.value > 0;
                    return (
                      <div key={i} style={{ flex: 1, padding: '10px 6px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' } as any}>
                        <i className={m.icon} style={{ fontSize: 14, color: m.color, display: 'block', marginBottom: 4 }} />
                        <div style={{ fontSize: 20, fontWeight: 900, color: has ? '#FFF' : 'rgba(255,255,255,0.15)', lineHeight: 1 }}>{has ? (m.decimal ? m.value.toFixed(1) : m.value.toLocaleString()) : '--'}</div>
                        <div style={{ fontSize: 8, color: m.color, fontWeight: 700, marginTop: 2, textTransform: 'uppercase' }}>{m.label}</div>
                        <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', marginTop: 6 } as any}><div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: m.color, opacity: 0.7 } as any} /></div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' } as any} />

                {/* Récupération + estimation temps */}
                <div style={{ padding: '14px 0' } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}><i className="ri-battery-charge-line" style={{ fontSize: 14, color: recCol }} /><span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Recuperation</span></div>
                    <span style={{ fontSize: 16, fontWeight: 900, color: recCol }}>{recPct}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', marginBottom: 8 } as any}><div style={{ height: '100%', borderRadius: 4, width: `${recPct}%`, background: `linear-gradient(90deg, ${recCol}80, ${recCol})`, transition: 'width 0.8s' } as any} /></div>
                  <div style={{ display: 'flex', gap: 8 } as any}>
                    <div style={{ flex: 1, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', textAlign: 'center' } as any}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: recCol }}>{recLabel}</div>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>NIVEAU</div>
                    </div>
                    <div style={{ flex: 1, padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', textAlign: 'center', position: 'relative', overflow: 'hidden' } as any}>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, height: `${recPct}%`, width: '100%', background: `${recCol}08`, transition: 'height 1.5s ease', borderRadius: 10 } as any} />
                      <div style={{ position: 'relative' } as any}>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#FFF', fontVariantNumeric: 'tabular-nums' }}>{recTimeStr}</div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>TEMPS ESTIME</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' } as any} />

                {/* VO2 Max */}
                <div style={{ padding: '14px 0', display: 'flex', alignItems: 'center', gap: 16 } as any}>
                  <GaugeRing pct={vo2 > 0 ? Math.min(100, (vo2 / 50) * 100) : 0} color={vo2Col}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: vo2 > 0 ? vo2Col : 'rgba(255,255,255,0.15)' }}>{vo2 > 0 ? vo2 : '--'}</span>
                  </GaugeRing>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>VO2 Max</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Capacite aerobique maximale</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: `${vo2Col}15`, marginTop: 4 } as any}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: vo2Col }}>{vo2Label}</span>
                      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>ml/kg/min</span>
                    </div>
                  </div>
                </div>

                {/* Button explicatif */}
                <div onClick={() => setShowExplain(true)} style={{ textAlign: 'center', padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', marginTop: 4 } as any}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: P }}><i className="ri-information-line" style={{ fontSize: 12, marginRight: 4 }} />Comprendre mes indicateurs</span>
                </div>
              </div>

              {/* ══ Nora ══ */}
              <div style={{ ...GL, padding: 16, marginBottom: 14 } as any}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' } as any}>
                  <div style={{ width: 28, height: 28, borderRadius: 9, flexShrink: 0, background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 10, fontWeight: 900, color: P }}>N</span></div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: P, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Analyse de Nora</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                      {recPct >= 80 ? `Excellente recuperation a ${recPct}% ! Votre corps est pret pour une activite soutenue. Profitez-en pour une marche rapide, du renforcement musculaire ou une seance de gymnastique douce. ${vo2 > 0 ? `Votre VO2 Max de ${vo2} ml/kg/min est ${vo2Label.toLowerCase()}.` : ''} Temps de recuperation estime : ${recTimeStr}.` :
                       recPct >= 60 ? `Bonne recuperation a ${recPct}%. Privilegiez une activite moderee : marche en exterieur, yoga doux ou etirements. ${vo2 > 0 ? `Votre capacite aerobique (VO2 Max ${vo2}) est ${vo2Label.toLowerCase()}.` : ''} Votre corps aura besoin d'environ ${recTimeStr} pour recuperer pleinement.` :
                       recPct >= 40 ? `Recuperation moyenne a ${recPct}%. Optez pour du repos actif : stretching leger, mobilite articulaire, respiration profonde. ${vo2 > 0 ? `VO2 Max: ${vo2} (${vo2Label.toLowerCase()}).` : ''} Estimation de recuperation : ${recTimeStr}. Hydratez-vous bien.` :
                       `Recuperation insuffisante a ${recPct}%. Accordez-vous du repos aujourd'hui. Hydratez-vous, privilegiez des repas legers et couchez-vous tot. ${vo2 > 0 ? `VO2 Max: ${vo2} (${vo2Label.toLowerCase()}).` : ''} Temps necessaire : ${recTimeStr}.`}
                    </div>
                  </div>
                </div>
              </div>

              {/* ══ EXERCICES DU JOUR ══ */}
              {minceur?.recommendations?.exercises && minceur.recommendations.exercises.length > 0 && (
                <div style={{ ...GL, padding: 16, marginBottom: 14 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
                    <i className="ri-heart-pulse-line" style={{ fontSize: 14, color: G }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>Vos exercices du jour</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 } as any}>
                    {minceur.recommendations.exercises.map((ex: any, i: number) => {
                      const int = ex.intensity || 'modere';
                      const intC = int === 'leger' ? G : int === 'modere' ? A : R;
                      const dn = tracked[`exercise_${i}`];
                      return (
                        <div key={i} onClick={() => router.push({ pathname: '/exercise-detail' as any, params: { index: i } })} style={{ borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: `1px solid ${dn ? G + '25' : 'rgba(255,255,255,0.05)'}`, padding: '10px 12px', cursor: 'pointer', opacity: dn ? 0.65 : 1, display: 'flex', alignItems: 'center', gap: 10 } as any}>
                          <div style={{ flex: 1 } as any}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                              <span style={{ fontSize: 12, fontWeight: 800, color: '#FFF', textDecoration: dn ? 'line-through' : 'none' }}>{ex.name}</span>
                              <span style={{ fontSize: 7, fontWeight: 700, color: intC, padding: '2px 5px', borderRadius: 5, background: `${intC}12`, textTransform: 'uppercase' }}>{int}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 } as any}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: G }}><i className="ri-timer-line" style={{ fontSize: 9 }} /> {ex.duration}</span>
                              {ex.calories_burned > 0 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{ex.calories_burned}kcal</span>}
                            </div>
                          </div>
                          <div onClick={(e) => { e.stopPropagation(); toggleTrack(i); }} style={{ width: 36, height: 36, borderRadius: 10, background: dn ? `${G}15` : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                            <i className="ri-check-line" style={{ fontSize: 16, color: dn ? G : 'rgba(255,255,255,0.1)' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ══ POPUP EXPLICATIVE (glass, profile-style) ══ */}
          {showExplain && (
            <div data-testid="explain-popup" onClick={() => setShowExplain(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.4)', overflowY: 'auto' } as any}>
              <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
                  <div onClick={() => setShowExplain(false)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                    <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} />
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}><i className="ri-heart-pulse-fill" style={{ fontSize: 26, color: G }} /></div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Vos indicateurs</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Comprendre votre activite physique</div>
                </div>
                {[
                  { title: 'VO2 Max', icon: 'ri-lungs-line', color: G, desc: 'La quantite maximale d\'oxygene que votre corps peut utiliser pendant l\'effort. C\'est le meilleur indicateur de votre condition cardiovasculaire. Plus il est eleve, meilleure est votre endurance.', ranges: 'Faible: <20 · Moyen: 20-30 · Bon: 30-40 · Excellent: >40 ml/kg/min' },
                  { title: 'Recuperation', icon: 'ri-battery-charge-line', color: CY, desc: 'Indique si votre corps a suffisamment recupere pour un nouvel effort. Se base sur votre sommeil, votre niveau de stress et votre frequence cardiaque au repos.', ranges: 'Faible: <40% · Moderee: 40-60% · Bonne: 60-80% · Optimale: >80%' },
                  { title: 'Temps de recuperation', icon: 'ri-time-line', color: A, desc: 'Estimation du temps necessaire avant que votre corps soit pret pour un effort intense. Varie selon votre recuperation actuelle, votre sommeil et votre activite recente.', ranges: 'Optimale: 4-6h · Bonne: 8-12h · Moderee: 12-18h · Faible: 18-24h' },
                  { title: 'Nombre de pas', icon: 'ri-footprint-line', color: G, desc: 'Le nombre de pas est un indicateur simple mais puissant de votre activite quotidienne. L\'objectif recommande pour les seniors est de 6000 pas par jour.', ranges: 'Sedentaire: <3000 · Actif: 3000-6000 · Tres actif: >6000 pas' },
                  { title: 'Calories brulees', icon: 'ri-fire-line', color: A, desc: 'Les calories depensees par votre activite physique dans la journee (hors metabolisme de base). L\'objectif est d\'en bruler au moins 300 par jour.', ranges: 'Faible: <150 · Modere: 150-300 · Actif: >300 kcal' },
                ].map((e, i) => (
                  <div key={i} style={{ borderRadius: 22, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '16px', marginBottom: 12 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 } as any}>
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: `${e.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className={e.icon} style={{ fontSize: 16, color: e.color }} /></div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{e.title}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 8 }}>{e.desc}</div>
                    <div style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>{e.ranges}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
    </div>
  );
}
