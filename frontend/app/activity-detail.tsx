import React, { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import NoraCard from '../src/components/shared/NoraCard';
import NoraOverlay, { NoraButton } from '../src/components/dashboard/NoraOverlay';

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
  const [exercises, setExercises] = useState<any[]>([]);
  const [tracked, setTracked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showExplain, setShowExplain] = useState(false);
  const [showNoraActivity, setShowNoraActivity] = useState(false);
  // Pro prescribed programs
  const [proPrograms, setProPrograms] = useState<any[]>([]);
  const [hasProPrograms, setHasProPrograms] = useState(false);
  const [proExercises, setProExercises] = useState<any[]>([]);
  const [completingSession, setCompletingSession] = useState<string | null>(null);
  const [painLevel, setPainLevel] = useState(0);
  const [patientNotes, setPatientNotes] = useState('');

  const fetchData = useCallback(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      apiFetch('/api/health/daily-report', {}, token).catch(() => ({})),
      apiFetch('/api/health/activity-streak', {}, token).catch(() => ({})),
      apiFetch('/api/pro/has-active-programs', {}, token).catch(() => ({ has_programs: false })),
      apiFetch('/api/pro/my-programs', {}, token).catch(() => []),
      apiFetch('/api/minceur/exercises', {}, token).catch(() => ({})),
      apiFetch('/api/minceur/today-tracking', {}, token).catch(() => ({})),
      apiFetch('/api/pro/beneficiary-today-exercises', {}, token).catch(() => []),
    ]).then(([report, st, proCheck, myProgs, exData, trk, proEx]) => {
      setD(report); setStreak(st);
      const hasPro = proCheck?.has_programs || false;
      setHasProPrograms(hasPro);
      setProPrograms(Array.isArray(myProgs) ? myProgs : []);
      setProExercises(Array.isArray(proEx) ? proEx : []);
      // Only load minceur exercises if no pro programs
      if (!hasPro && exData?.exercises) setExercises(exData.exercises);
      else if (hasPro) setExercises([]);
      if (trk?.completed) setTracked(trk.completed);
    }).finally(() => setLoading(false));
  }, [token]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const toggleTrack = async (index: number) => {
    const k = `exercise_${index}`, was = tracked[k];
    setTracked(p => ({ ...p, [k]: !was }));
    try { await apiFetch('/api/minceur/track', { method: 'POST', body: JSON.stringify({ type: 'exercise', index }) }, token); } catch { setTracked(p => ({ ...p, [k]: was })); }
  };

  const completeProSession = async (programId: string, sessionId: string, status: string) => {
    try {
      await apiFetch(`/api/pro/sessions/${programId}/${sessionId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ status, pain_level: painLevel > 0 ? painLevel : null, patient_notes: patientNotes }),
      }, token);
      setCompletingSession(null);
      setPainLevel(0);
      setPatientNotes('');
      fetchData();
    } catch {}
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
    <div data-testid="activity-detail-page" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#FFF' } as any}>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>

        {/* HEADER with BG image */}
        <div style={{ position: 'relative', zIndex: 1, minHeight: 200 } as any}>
          <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />
          <div style={{ position: 'relative', zIndex: 2, padding: 'calc(env(safe-area-inset-top, 20px) + 12px) 20px 60px', maxWidth: 480, margin: '0 auto' } as any}>
            <div data-testid="back-button" onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#111' }} /></div>
            <div style={{ textAlign: 'center', marginTop: 8 } as any}>
              <img src={HERO_IMG} alt="" style={{ width: 160, height: 160, objectFit: 'contain', margin: '0 auto', display: 'block', filter: 'drop-shadow(0 12px 30px rgba(0,0,0,0.4))', position: 'relative', zIndex: 3 } as any} />
            </div>
          </div>
        </div>

        {/* WHITE CONTENT CARD */}
        <div style={{ padding: '24px 16px 120px', marginTop: -24, borderRadius: '24px 24px 0 0', background: '#FFF', position: 'relative', zIndex: 10, maxWidth: 480, margin: '-24px auto 0', width: '100%' } as any}>

          {loading && <div style={{ textAlign: 'center', padding: '80px 0' } as any}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: A, animation: 'spin 0.8s linear infinite', margin: '0 auto' } as any} /></div>}

          {!loading && (
            <>

              {/* ══ CARTE 1: Activité + Récupération + VO2 ══ */}
              <div style={{ padding: '20px', borderRadius: 18, background: '#F4F4F5', position: 'relative', zIndex: 1, marginBottom: 14 } as any}>
                <div style={{ textAlign: 'center', marginBottom: 14 } as any}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.5 }}>Activite du jour</div>
                  {st.current_streak > 0 && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 999, background: 'rgba(245,158,11,0.1)', marginTop: 6 } as any}><i className="ri-fire-fill" style={{ fontSize: 11, color: A }} /><span style={{ fontSize: 11, fontWeight: 900, color: A }}>{st.current_streak}j consecutifs</span></div>}
                </div>

                {/* Steps + Calories + Distance — clickable to metric detail */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 } as any}>
                  {[
                    { label: 'Pas', value: steps, goal: 6000, icon: 'ri-footprint-line', color: G, key: 'steps' },
                    { label: 'Calories', value: cal, goal: 300, icon: 'ri-fire-line', color: A, key: 'calories' },
                    { label: 'Distance', value: dist, goal: 4, icon: 'ri-route-line', color: B, decimal: true, key: 'distance_km' },
                  ].map((m, i) => {
                    const pct = m.goal > 0 ? Math.min(100, Math.round((m.value / m.goal) * 100)) : 0;
                    const has = m.value > 0;
                    return (
                      <div key={i} onClick={(e) => { e.stopPropagation(); router.push({ pathname: '/metric-detail' as any, params: { key: m.key } }); }} style={{ flex: 1, padding: '10px 6px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center', cursor: 'pointer', transition: 'background 0.15s' } as any}
                        onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                        onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}>
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
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#111', fontVariantNumeric: 'tabular-nums' }}>{recTimeStr}</div>
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
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>VO2 Max</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>Capacite aerobique maximale</div>
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

              {/* ══ Nora Activity Analysis ══ */}
              <NoraButton label="Analyse de l'activite" sublabel="Analyse par Nora de votre activite physique" onClick={() => setShowNoraActivity(true)} />

              {/* ══ EXERCICES PRESCRITS PAR LE PRO ══ */}
              {hasProPrograms && proPrograms.length > 0 && (
                <div style={{ padding: '16px', borderRadius: 18, background: '#F4F4F5', padding: 16, marginBottom: 14 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 } as any}>
                    <i className="ri-stethoscope-line" style={{ fontSize: 14, color: P }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Exercices prescrits</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 12 }}>Programmes de votre professionnel de sante</div>

                  {proPrograms.map((prog: any) => {
                    const sessions = prog.sessions || [];
                    if (sessions.length === 0) return null;
                    const catColors: Record<string, string> = { cardio: R, renforcement: A, souplesse: P, equilibre: B, reeducation: G };
                    const pColor = catColors[prog.category] || B;
                    return (
                      <div key={prog.id} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 } as any}>
                          <div style={{ width: 6, height: 6, borderRadius: 3, background: pColor }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: pColor }}>{prog.title}</span>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>· {prog.professional_name}</span>
                        </div>

                        {sessions.map((session: any) => {
                          const completions = session.completions || [];
                          const todayStr = new Date().toISOString().split('T')[0];
                          const todayDone = completions.find((c: any) => c.date?.startsWith(todayStr));
                          const lastDone = completions.length > 0 ? completions[completions.length - 1] : null;
                          const isDone = todayDone?.status === 'done';
                          const isPartial = todayDone?.status === 'partial';
                          const isCompleting = completingSession === `${prog.id}_${session.id}`;

                          return (
                            <div key={session.id} data-testid={`pro-session-${session.id}`} style={{ borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: `1px solid ${isDone ? G + '25' : isPartial ? A + '25' : 'rgba(255,255,255,0.05)'}`, padding: '12px 14px', marginBottom: 6, opacity: isDone ? 0.65 : 1 } as any}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${pColor}10`, border: `1px solid ${pColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                                  <i className="ri-heart-pulse-line" style={{ fontSize: 18, color: pColor }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 800, color: '#111', textDecoration: isDone ? 'line-through' : 'none' }}>{session.title}</div>
                                  {session.description && <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2, lineHeight: 1.4 }}>{session.description}</div>}
                                  <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' } as any}>
                                    {session.sets > 0 && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 4 }}>{session.sets}x{session.repetitions || 0}</span>}
                                    {session.duration_min > 0 && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: 4 }}>{session.duration_min} min</span>}
                                  </div>
                                </div>

                                {/* Status / Action */}
                                {todayDone ? (
                                  <div style={{ padding: '4px 10px', borderRadius: 8, background: isDone ? `${G}12` : `${A}12`, border: `1px solid ${isDone ? `${G}30` : `${A}30`}` }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: isDone ? G : A }}>{isDone ? 'Fait' : isPartial ? 'Partiel' : 'Passe'}</span>
                                  </div>
                                ) : (
                                  <div onClick={() => setCompletingSession(`${prog.id}_${session.id}`)}
                                    style={{ padding: '8px 14px', borderRadius: 999, background: `${G}12`, border: `1px solid ${G}25`, cursor: 'pointer' } as any}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: G }}>Valider</span>
                                  </div>
                                )}
                              </div>

                              {/* Pain level display */}
                              {lastDone && lastDone.pain_level != null && lastDone.pain_level > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '4px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.03)' } as any}>
                                  <i className="ri-emotion-sad-line" style={{ fontSize: 11, color: A }} />
                                  <span style={{ fontSize: 10, color: '#9CA3AF' }}>Douleur: {lastDone.pain_level}/10</span>
                                </div>
                              )}

                              {/* Completion panel */}
                              {isCompleting && (
                                <div style={{ marginTop: 10, padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' } as any}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 8 }}>Comment s'est passe l'exercice ?</div>

                                  {/* Pain level */}
                                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 4 }}>Niveau de douleur (optionnel)</div>
                                  <div style={{ display: 'flex', gap: 4, marginBottom: 10 } as any}>
                                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((lvl) => (
                                      <div key={lvl} onClick={() => setPainLevel(lvl)}
                                        style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 10, fontWeight: 700,
                                          background: painLevel === lvl ? (lvl <= 3 ? `${G}20` : lvl <= 6 ? `${A}20` : `${R}20`) : 'rgba(255,255,255,0.04)',
                                          border: `1px solid ${painLevel === lvl ? (lvl <= 3 ? G : lvl <= 6 ? A : R) : 'transparent'}`,
                                          color: painLevel === lvl ? '#FFF' : 'rgba(255,255,255,0.2)',
                                        } as any}>
                                        {lvl}
                                      </div>
                                    ))}
                                  </div>

                                  <textarea value={patientNotes} onChange={(e: any) => setPatientNotes(e.target.value)}
                                    placeholder="Notes (optionnel)"
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#111', fontSize: 12, outline: 'none', minHeight: 36, resize: 'vertical', marginBottom: 10 } as any} />

                                  <div style={{ display: 'flex', gap: 6 } as any}>
                                    <div onClick={() => completeProSession(prog.id, session.id, 'done')}
                                      style={{ flex: 1, padding: '10px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: `${G}15`, border: `1px solid ${G}30`, fontSize: 12, fontWeight: 700, color: G } as any}>
                                      Fait
                                    </div>
                                    <div onClick={() => completeProSession(prog.id, session.id, 'partial')}
                                      style={{ flex: 1, padding: '10px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: `${A}15`, border: `1px solid ${A}30`, fontSize: 12, fontWeight: 700, color: A } as any}>
                                      Partiel
                                    </div>
                                    <div onClick={() => completeProSession(prog.id, session.id, 'skipped')}
                                      style={{ flex: 1, padding: '10px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, fontWeight: 700, color: '#9CA3AF' } as any}>
                                      Passe
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ══ EXERCICES PRESCRITS PAR LE COACH ══ */}
              {proExercises.length > 0 && (
                <div style={{ padding: '16px', borderRadius: 18, background: '#F4F4F5', padding: 16, marginBottom: 14 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
                    <i className="ri-run-line" style={{ fontSize: 14, color: R }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Exercices du jour</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 999 }}>{proExercises.length}</span>
                  </div>
                  {proExercises.map((ex: any, i: number) => (
                    <div key={ex.id || i} data-testid={`pro-exercise-${i}`}
                      onClick={() => router.push({ pathname: '/pro-exercise-detail' as any, params: { id: ex.exercise_template_id || ex.id, mode: 'assigned', assignmentId: ex.id } })}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 14,
                        background: ex.completed_today ? 'rgba(16,185,129,0.12)' : '#E8E8EA',
                        marginBottom: 6, cursor: 'pointer', transition: 'background 0.15s' } as any}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: ex.completed_today ? 'rgba(16,185,129,0.15)' : 'rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                        <i className={ex.icon || 'ri-run-line'} style={{ fontSize: 20, color: ex.completed_today ? G : '#374151' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 } as any}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: ex.completed_today ? G : '#111', textDecoration: ex.completed_today ? 'line-through' : 'none' }}>{ex.title}</div>
                        <div style={{ fontSize: 10, color: ex.completed_today ? 'rgba(16,185,129,0.6)' : 'rgba(0,0,0,0.4)', marginTop: 2 }}>
                          {ex.sets > 0 && `${ex.sets} series x ${ex.repetitions} reps`}
                          {ex.rest_seconds > 0 && ` · ${ex.rest_seconds}s repos`}
                        </div>
                      </div>
                      {ex.completed_today && <i className="ri-checkbox-circle-fill" style={{ fontSize: 18, color: G, flexShrink: 0 }} />}
                    </div>
                  ))}
                </div>
              )}

              {/* ══ EXERCICES DU JOUR (minceur) — masques si programmes pro actifs ══ */}
              {!hasProPrograms && exercises.length > 0 && (
                <div style={{ padding: '16px', borderRadius: 18, background: '#F4F4F5', padding: 16, marginBottom: 14 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
                    <i className="ri-heart-pulse-line" style={{ fontSize: 14, color: G }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Vos exercices du jour</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 } as any}>
                    {exercises.map((ex: any, i: number) => {
                      const int = ex.intensity || 'modere';
                      const intC = int === 'leger' ? G : int === 'modere' ? A : R;
                      const dn = tracked[`exercise_${i}`];
                      const catKey = (ex.category || 'cardio').toLowerCase();
                      const exImg: Record<string, string> = {
                        cardio: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/05d45697f644e6b656496155421c6e39c60b73d67f7fb18522a76692b56fa394.png',
                        renforcement: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/b50d815f482c848c380f0e911d719876a2f9f0ff00967feef900297d858f39ef.png',
                      };
                      const img = exImg[catKey] || exImg.cardio;
                      return (
                        <div key={i} onClick={() => router.push({ pathname: '/exercise-detail' as any, params: { index: i } })} style={{ borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: `1px solid ${dn ? G + '25' : 'rgba(255,255,255,0.05)'}`, overflow: 'hidden', cursor: 'pointer', opacity: dn ? 0.65 : 1, display: 'flex', alignItems: 'stretch', height: 80 } as any}>
                          {/* Image left */}
                          <div style={{ width: 80, flexShrink: 0, position: 'relative', overflow: 'hidden' } as any}>
                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.4))' } as any} />
                          </div>
                          {/* Content */}
                          <div style={{ flex: 1, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' } as any}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                              <span style={{ fontSize: 13, fontWeight: 800, color: '#111', textDecoration: dn ? 'line-through' : 'none' }}>{ex.name}</span>
                              <span style={{ fontSize: 7, fontWeight: 700, color: intC, padding: '2px 5px', borderRadius: 5, background: `${intC}12`, textTransform: 'uppercase' }}>{int}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 } as any}>
                              <span style={{ fontSize: 10, fontWeight: 700, color: A }}><i className="ri-timer-line" style={{ fontSize: 9 }} /> {ex.duration}</span>
                              {ex.calories_burned > 0 && <span style={{ fontSize: 10, color: '#9CA3AF' }}>{ex.calories_burned}kcal</span>}
                            </div>
                          </div>
                          {/* Check button */}
                          <div onClick={(e) => { e.stopPropagation(); toggleTrack(i); }} style={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: dn ? `${G}08` : 'transparent' } as any}>
                            <i className="ri-check-line" style={{ fontSize: 18, color: dn ? G : 'rgba(255,255,255,0.1)' }} />
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
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#111' }}>Vos indicateurs</div>
                  <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Comprendre votre activite physique</div>
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
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{e.title}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 8 }}>{e.desc}</div>
                    <div style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', fontSize: 9, color: '#9CA3AF' }}>{e.ranges}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
      {showNoraActivity && <NoraOverlay token={token} endpoint="/api/nora/page-analysis?context=activity" title="Analyse activite" subtitle="Analyse par Nora de votre activite physique" onClose={() => setShowNoraActivity(false)} />}
    </div>
  );
}
