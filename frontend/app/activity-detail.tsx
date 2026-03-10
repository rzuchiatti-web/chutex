import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const G = '#10B981', A = '#F59E0B', B = '#38BDF8', R = '#EF4444', P = '#A78BFA';
const GL: any = { borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };
const BG_GREEN = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/uvntv6me_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2008_31_33.png';
const SHOE_IMG = 'https://customer-assets.emergentagent.com/job_e5e873d0-c3a6-4073-8807-5b369c712c84/artifacts/ei43qs8n_img_activity.png';

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

  const steps = d?.steps || 0;
  const calories = d?.calories || 0;
  const distance = d?.distance_km || 0;
  const hr = d?.heart_rate || 0;
  const recovery = d?.recovery_score || 0;
  const stress = d?.stress_level || 0;
  const slQ = d?.sleep_quality || 0;

  let recPct = recovery;
  if (recPct === 0 && (slQ > 0 || stress > 0 || hr > 0)) {
    let s = 50;
    if (slQ >= 80) s += 20; else if (slQ >= 60) s += 10; else if (slQ > 0 && slQ < 50) s -= 15;
    if (stress > 70) s -= 25; else if (stress > 50) s -= 10; else if (stress > 0 && stress <= 30) s += 10;
    if (hr > 0 && hr <= 65) s += 15; else if (hr > 85) s -= 10;
    recPct = Math.max(10, Math.min(100, s));
  }
  const recCol = recPct >= 80 ? G : recPct >= 60 ? '#22D3EE' : recPct >= 40 ? A : R;
  const recLabel = recPct >= 80 ? 'Optimale' : recPct >= 60 ? 'Bonne' : recPct >= 40 ? 'Moderee' : 'Faible';

  const metrics = [
    { label: 'Pas', value: steps, goal: 6000, unit: '', icon: 'ri-footprint-line', color: G },
    { label: 'Calories', value: calories, goal: 300, unit: 'kcal', icon: 'ri-fire-line', color: A },
    { label: 'Distance', value: distance, goal: 4, unit: 'km', icon: 'ri-route-line', color: B },
  ];

  const st = streak || {};

  return (
    <div data-testid="activity-detail-page" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG_GREEN} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'calc(env(safe-area-inset-top, 20px) + 12px) 20px 120px' } as any}>

          {/* Back */}
          <div style={{ marginBottom: 8 } as any}>
            <div data-testid="back-button" onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: '80px 0' } as any}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: G, animation: 'spin 0.8s linear infinite', margin: '0 auto' } as any} /></div>}

          {!loading && (
            <>
              {/* Hero image */}
              <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, marginBottom: 0 } as any}>
                <img src={SHOE_IMG} alt="Activite" style={{ width: 200, height: 200, objectFit: 'contain', margin: '0 auto', display: 'block', filter: 'drop-shadow(0 16px 40px rgba(0,0,0,0.5))', position: 'relative', zIndex: 3, marginBottom: -50 } as any} />
              </div>

              {/* Carte principale */}
              <div style={{ ...GL, padding: '60px 20px 20px', position: 'relative', zIndex: 1, marginBottom: 14 } as any}>
                <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Activite physique</div>
                  {st.current_streak > 0 && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)', marginBottom: 8 } as any}>
                      <i className="ri-fire-fill" style={{ fontSize: 12, color: A }} />
                      <span style={{ fontSize: 12, fontWeight: 900, color: A }}>{st.current_streak} jours consecutifs</span>
                    </div>
                  )}
                </div>

                {/* Metrics */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 } as any}>
                  {metrics.map((m, i) => {
                    const pct = m.goal > 0 ? Math.min(100, Math.round((m.value / m.goal) * 100)) : 0;
                    const has = m.value > 0;
                    return (
                      <div key={i} style={{ flex: 1, padding: '12px 8px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' } as any}>
                        <i className={m.icon} style={{ fontSize: 16, color: m.color, display: 'block', marginBottom: 6 }} />
                        <div style={{ fontSize: 22, fontWeight: 900, color: has ? '#FFF' : 'rgba(255,255,255,0.15)', lineHeight: 1 }}>
                          {has ? (typeof m.value === 'number' && m.value % 1 !== 0 ? m.value.toFixed(1) : m.value.toLocaleString()) : '--'}
                        </div>
                        <div style={{ fontSize: 8, color: m.color, fontWeight: 700, marginTop: 3, textTransform: 'uppercase' }}>{m.label}</div>
                        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', marginTop: 6 } as any}>
                          <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: m.color, opacity: 0.7, transition: 'width 0.8s ease' } as any} />
                        </div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontWeight: 700, marginTop: 3 }}>{pct}% de l'objectif</div>
                      </div>
                    );
                  })}
                </div>

                {/* Separator */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '0 0 14px' } as any} />

                {/* Recovery */}
                <div style={{ marginBottom: 14 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                      <i className="ri-battery-charge-line" style={{ fontSize: 14, color: recCol }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Recuperation</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: recCol }}>{recPct > 0 ? recPct : '--'}%</span>
                      <span style={{ padding: '2px 8px', borderRadius: 999, background: `${recCol}15`, fontSize: 9, fontWeight: 700, color: recCol }}>{recLabel}</span>
                    </div>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' } as any}>
                    <div style={{ height: '100%', borderRadius: 4, width: `${recPct}%`, background: `linear-gradient(90deg, ${recCol}80, ${recCol})`, transition: 'width 0.8s ease' } as any} />
                  </div>
                </div>

                {/* Vitals */}
                {(hr > 0 || stress > 0) && (
                  <>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '0 0 14px' } as any} />
                    <div style={{ display: 'flex', gap: 8 } as any}>
                      {hr > 0 && (
                        <div style={{ flex: 1, padding: '10px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', textAlign: 'center' } as any}>
                          <i className="ri-heart-pulse-line" style={{ fontSize: 14, color: R, display: 'block', marginBottom: 4 }} />
                          <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{hr}</div>
                          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>BPM</div>
                        </div>
                      )}
                      {stress > 0 && (
                        <div style={{ flex: 1, padding: '10px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', textAlign: 'center' } as any}>
                          <i className="ri-mental-health-line" style={{ fontSize: 14, color: A, display: 'block', marginBottom: 4 }} />
                          <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{stress}</div>
                          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>STRESS</div>
                        </div>
                      )}
                      {slQ > 0 && (
                        <div style={{ flex: 1, padding: '10px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', textAlign: 'center' } as any}>
                          <i className="ri-moon-line" style={{ fontSize: 14, color: P, display: 'block', marginBottom: 4 }} />
                          <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{slQ}%</div>
                          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>SOMMEIL</div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Nora conseil */}
              <div style={{ ...GL, padding: 16, marginBottom: 14 } as any}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' } as any}>
                  <div style={{ width: 28, height: 28, borderRadius: 9, flexShrink: 0, background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 10, fontWeight: 900, color: P }}>N</span></div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: P, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Conseil de Nora</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
                      {recPct >= 80 ? 'Excellente recuperation ! Votre corps est pret pour une activite soutenue. Profitez-en pour une marche rapide ou du renforcement musculaire.' :
                       recPct >= 60 ? 'Bonne recuperation. Privilegiez une activite moderee : marche, yoga doux ou etirements. Restez a l\'ecoute de votre corps.' :
                       recPct >= 40 ? 'Recuperation moyenne. Optez pour du repos actif : stretching leger, mobilite articulaire. Hydratez-vous bien.' :
                       'Recuperation insuffisante. Accordez-vous du repos. Hydratez-vous et couchez-vous tot ce soir.'}
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
