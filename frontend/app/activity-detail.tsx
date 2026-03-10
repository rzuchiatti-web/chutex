import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const G = '#10B981', A = '#F59E0B', B = '#38BDF8', R = '#EF4444', P = '#A78BFA', CY = '#22D3EE';
const GL: any = { borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };
const BG_GREEN = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/uvntv6me_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2008_31_33.png';
const SHOE_IMG = 'https://customer-assets.emergentagent.com/job_e5e873d0-c3a6-4073-8807-5b369c712c84/artifacts/ei43qs8n_img_activity.png';

function GaugeRing({ pct, color, size = 48, strokeW = 4, children }: { pct: number; color: string; size?: number; strokeW?: number; children?: any }) {
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ width: size, height: size, position: 'relative' } as any}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeW} /><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeW} strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} /></svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>{children}</div>
    </div>
  );
}

export default function ActivityDetailPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [d, setD] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      apiFetch('/api/health/daily-report', {}, token).catch(() => ({})),
      apiFetch('/api/health/activity-streak', {}, token).catch(() => ({})),
    ]).then(([report, st]) => { setD(report); setStreak(st); }).finally(() => setLoading(false));
  }, [token]);

  if (Platform.OS !== 'web') return null;

  const steps = d?.steps || 0, cal = d?.calories || 0, dist = d?.distance_km || 0;
  const hr = d?.heart_rate || 0, hrv = d?.hrv || 0, spo2 = d?.spo2 || 0;
  const vo2 = d?.vo2_max || 0, stress = d?.stress_level || 0, recovery = d?.recovery_score || 0;
  const slQ = d?.sleep_quality || 0, temp = d?.temperature || 0;

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
  const vo2Label = vo2 >= 40 ? 'Excellent' : vo2 >= 30 ? 'Bon' : vo2 >= 20 ? 'Moyen' : vo2 > 0 ? 'Faible' : '--';
  const vo2Col = vo2 >= 40 ? G : vo2 >= 30 ? CY : vo2 >= 20 ? A : R;
  const stressLabel = stress <= 30 ? 'Faible' : stress <= 60 ? 'Modere' : 'Eleve';
  const stressCol = stress <= 30 ? G : stress <= 60 ? A : R;
  const st = streak || {};

  return (
    <div data-testid="activity-detail-page" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG_GREEN} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'calc(env(safe-area-inset-top, 20px) + 12px) 20px 120px' } as any}>

          <div style={{ marginBottom: 8 } as any}>
            <div data-testid="back-button" onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: '80px 0' } as any}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: G, animation: 'spin 0.8s linear infinite', margin: '0 auto' } as any} /></div>}

          {!loading && (
            <>
              {/* Hero */}
              <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 } as any}>
                <img src={SHOE_IMG} alt="" style={{ width: 200, height: 200, objectFit: 'contain', margin: '0 auto', display: 'block', filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.5))', position: 'relative', zIndex: 3, marginBottom: -50 } as any} />
              </div>

              {/* ══ CARTE 1: Activité du jour ══ */}
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
                        <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', marginTop: 6 } as any}><div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: m.color, opacity: 0.7, transition: 'width 0.8s' } as any} /></div>
                        <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', fontWeight: 700, marginTop: 2 }}>{pct}% obj.</div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ height: 1, background: 'rgba(255,255,255,0.04)' } as any} />

                {/* Recovery */}
                <div style={{ padding: '14px 0' } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}><i className="ri-battery-charge-line" style={{ fontSize: 14, color: recCol }} /><span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Recuperation</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}><span style={{ fontSize: 16, fontWeight: 900, color: recCol }}>{recPct}%</span><span style={{ padding: '2px 8px', borderRadius: 999, background: `${recCol}15`, fontSize: 9, fontWeight: 700, color: recCol }}>{recLabel}</span></div>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' } as any}><div style={{ height: '100%', borderRadius: 4, width: `${recPct}%`, background: `linear-gradient(90deg, ${recCol}80, ${recCol})`, transition: 'width 0.8s' } as any} /></div>
                </div>
              </div>

              {/* ══ CARTE 2: Performance physiologique ══ */}
              <div style={{ ...GL, padding: 20, marginBottom: 14 } as any}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Performance physiologique</div>

                {/* VO2 Max + HRV + Stress in rings */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 16, justifyContent: 'center' } as any}>
                  {/* VO2 Max */}
                  <div style={{ flex: 1, textAlign: 'center', padding: '12px 4px', borderRadius: 16, background: 'rgba(255,255,255,0.02)' } as any}>
                    <GaugeRing pct={vo2 > 0 ? Math.min(100, (vo2 / 50) * 100) : 0} color={vo2Col} size={56}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: vo2 > 0 ? vo2Col : 'rgba(255,255,255,0.15)' }}>{vo2 > 0 ? vo2 : '--'}</span>
                    </GaugeRing>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#FFF', marginTop: 6 }}>VO2 Max</div>
                    <div style={{ fontSize: 8, color: vo2Col, fontWeight: 700, marginTop: 1 }}>{vo2Label}</div>
                    <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.15)', marginTop: 2 }}>ml/kg/min</div>
                  </div>
                  {/* HRV */}
                  <div style={{ flex: 1, textAlign: 'center', padding: '12px 4px', borderRadius: 16, background: 'rgba(255,255,255,0.02)' } as any}>
                    <GaugeRing pct={hrv > 0 ? Math.min(100, (hrv / 80) * 100) : 0} color={hrv >= 40 ? G : hrv >= 25 ? A : R} size={56}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: hrv > 0 ? (hrv >= 40 ? G : hrv >= 25 ? A : R) : 'rgba(255,255,255,0.15)' }}>{hrv > 0 ? hrv : '--'}</span>
                    </GaugeRing>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#FFF', marginTop: 6 }}>HRV</div>
                    <div style={{ fontSize: 8, color: hrv >= 40 ? G : hrv >= 25 ? A : R, fontWeight: 700, marginTop: 1 }}>{hrv >= 40 ? 'Bon' : hrv >= 25 ? 'Moyen' : hrv > 0 ? 'Bas' : '--'}</div>
                    <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.15)', marginTop: 2 }}>ms</div>
                  </div>
                  {/* Stress */}
                  <div style={{ flex: 1, textAlign: 'center', padding: '12px 4px', borderRadius: 16, background: 'rgba(255,255,255,0.02)' } as any}>
                    <GaugeRing pct={stress > 0 ? stress : 0} color={stressCol} size={56}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: stress > 0 ? stressCol : 'rgba(255,255,255,0.15)' }}>{stress > 0 ? stress : '--'}</span>
                    </GaugeRing>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#FFF', marginTop: 6 }}>Stress</div>
                    <div style={{ fontSize: 8, color: stressCol, fontWeight: 700, marginTop: 1 }}>{stress > 0 ? stressLabel : '--'}</div>
                    <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.15)', marginTop: 2 }}>/100</div>
                  </div>
                </div>

                <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '0 0 14px' } as any} />

                {/* Vitals grid */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 } as any}>
                  {[
                    { label: 'Frequence cardiaque', value: hr, unit: 'bpm', icon: 'ri-heart-pulse-line', color: R, explain: 'Repos: 60-80 bpm' },
                    { label: 'SpO2', value: spo2, unit: '%', icon: 'ri-lungs-line', color: B, explain: 'Normal: >95%' },
                    { label: 'Temperature', value: temp, unit: '°C', icon: 'ri-temp-cold-line', color: A, explain: 'Normal: 36.5-37.5', decimal: true },
                    { label: 'Sommeil', value: slQ, unit: '%', icon: 'ri-moon-line', color: P, explain: 'Qualite nuit' },
                  ].map((v, i) => (
                    <div key={i} style={{ width: 'calc(50% - 4px)', padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 } as any}>
                        <i className={v.icon} style={{ fontSize: 12, color: v.color }} />
                        <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{v.label}</span>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: v.value > 0 ? '#FFF' : 'rgba(255,255,255,0.12)', lineHeight: 1 }}>{v.value > 0 ? (v.decimal ? v.value.toFixed(1) : v.value) : '--'}<span style={{ fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.2)' }}> {v.unit}</span></div>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)', marginTop: 2 }}>{v.explain}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ══ CARTE 3: Explications VO2/HRV ══ */}
              <div style={{ ...GL, padding: 16, marginBottom: 14 } as any}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Comprendre vos indicateurs</div>
                {[
                  { title: 'VO2 Max', color: G, desc: 'Capacite maximale d\'utilisation de l\'oxygene. Plus elle est elevee, meilleure est votre endurance cardiovasculaire. Se mesure en ml/kg/min.' },
                  { title: 'HRV (Variabilite cardiaque)', color: CY, desc: 'Variation entre chaque battement du coeur. Un HRV eleve indique une bonne capacite d\'adaptation au stress et une bonne recuperation.' },
                  { title: 'Score de stress', color: A, desc: 'Mesure par la variabilite cardiaque. Un score bas indique un etat de calme. Un score eleve necessite du repos.' },
                  { title: 'Recuperation', color: recCol, desc: 'Indique si votre corps est pret pour l\'effort. Se base sur le sommeil, le stress et la frequence cardiaque.' },
                ].map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none' } as any}>
                    <div style={{ width: 3, borderRadius: 2, background: e.color, flexShrink: 0 } as any} />
                    <div><span style={{ fontSize: 11, fontWeight: 800, color: e.color }}>{e.title}</span><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1, lineHeight: 1.5 }}>{e.desc}</div></div>
                  </div>
                ))}
              </div>

              {/* Nora */}
              <div style={{ ...GL, padding: 16, marginBottom: 14 } as any}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' } as any}>
                  <div style={{ width: 28, height: 28, borderRadius: 9, flexShrink: 0, background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 10, fontWeight: 900, color: P }}>N</span></div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: P, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Conseil de Nora</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                      {recPct >= 80 ? 'Excellente recuperation ! Votre corps est pret pour une activite soutenue. Profitez-en pour une marche rapide, du renforcement musculaire ou une seance de gymnastique douce.' :
                       recPct >= 60 ? 'Bonne recuperation. Privilegiez une activite moderee : marche en exterieur, yoga doux ou etirements. Restez a l\'ecoute de votre corps et hydratez-vous regulierement.' :
                       recPct >= 40 ? 'Recuperation moyenne. Optez pour du repos actif : stretching leger, mobilite articulaire, respiration profonde. Hydratez-vous bien tout au long de la journee.' :
                       'Recuperation insuffisante. Accordez-vous du repos aujourd\'hui. Hydratez-vous, privilegiez des repas legers et couchez-vous tot ce soir. Votre corps a besoin de recuperer.'}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
    </div>
  );
}
