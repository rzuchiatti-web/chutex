import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch, API_URL } from '../src/services/api';
import NoraOverlay, { NoraButton } from '../src/components/dashboard/NoraOverlay';

const G = '#10B981', A = '#F59E0B', B = '#38BDF8', R = '#EF4444', P = '#A78BFA', CY = '#22D3EE';
const BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/1lq6xl58_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2008_54_55.png';

const DAYS_SHORT = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const MONTHS_FR = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];
const toDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const EX_IMG: Record<string, string> = {
  cardio: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/05d45697f644e6b656496155421c6e39c60b73d67f7fb18522a76692b56fa394.png',
  renforcement: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/b50d815f482c848c380f0e911d719876a2f9f0ff00967feef900297d858f39ef.png',
};

function GaugeRing({ pct, color, size = 56, children }: { pct: number; color: string; size?: number; children?: any }) {
  const r = (size - 5) / 2, circ = 2 * Math.PI * r;
  return (
    <div style={{ width: size, height: size, position: 'relative' } as any}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E5E7EB" strokeWidth="5" /><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5" strokeDasharray={`${(pct/100)*circ} ${circ}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} /></svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>{children}</div>
    </div>
  );
}

/* ── Horizontal Calendar (same as ProCalendar) ── */
function HorizontalCalendar({ selectedDate, onSelect }: { selectedDate: Date; onSelect: (d: Date) => void }) {
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());
  const [viewYear, setViewYear] = useState(selectedDate.getFullYear());
  const dates = useMemo(() => {
    const arr: Date[] = [];
    const dim = new Date(viewYear, viewMonth + 1, 0).getDate();
    for (let i = 1; i <= dim; i++) arr.push(new Date(viewYear, viewMonth, i));
    return arr;
  }, [viewMonth, viewYear]);
  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); };
  const todayStr = toDateStr(new Date());
  const selStr = toDateStr(selectedDate);

  // Auto-scroll to selected day (centered)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const container = document.getElementById('activity-cal-scroll');
        const el = document.getElementById(`cal-item-${selStr}`);
        if (container && el) {
          const scrollLeft = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2;
          container.scrollLeft = Math.max(0, scrollLeft);
        }
      } catch {}
    }, 200);
    return () => clearTimeout(timer);
  }, [selStr, viewMonth, viewYear]);

  return (
    <div data-testid="horizontal-calendar" style={{ width: '100%', marginTop: 16 } as any}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 } as any}>
        <div data-testid="cal-prev-month" onClick={prevMonth} style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-arrow-left-s-line" style={{ fontSize: 16, color: '#FFF' }} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', textTransform: 'capitalize', letterSpacing: 0.5, minWidth: 140, textAlign: 'center' }}>{MONTHS_FR[viewMonth]} {viewYear}</div>
        <div data-testid="cal-next-month" onClick={nextMonth} style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: '#FFF' }} />
        </div>
      </div>
      <div id="activity-cal-scroll" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' } as any}>
        {dates.map(d => {
          const ds = toDateStr(d);
          const isToday = ds === todayStr;
          const isSel = ds === selStr;
          const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
          return (
            <div key={ds} id={`cal-item-${ds}`} data-testid={`cal-day-${ds}`} onClick={() => onSelect(d)} style={{
              minWidth: 48, padding: '8px 4px 10px', borderRadius: 14, textAlign: 'center', cursor: 'pointer', flexShrink: 0,
              background: isSel ? 'rgba(255,255,255,0.18)' : isToday ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
              border: isSel ? '1.5px solid rgba(255,255,255,0.35)' : isToday ? '1.5px solid rgba(255,255,255,0.15)' : '1.5px solid transparent',
              boxShadow: isSel ? '0 4px 16px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.25s ease',
            } as any}>
              <div style={{ fontSize: 9, fontWeight: 700, color: isSel ? '#FFF' : 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{DAYS_SHORT[dayIdx]}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: isSel ? '#FFF' : isToday ? '#FFF' : 'rgba(255,255,255,0.6)', lineHeight: 1 }}>{d.getDate()}</div>
              {isToday && !isSel && <div style={{ width: 4, height: 4, borderRadius: 2, background: A, margin: '4px auto 0' } as any} />}
            </div>
          );
        })}
      </div>
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
  const [proPrograms, setProPrograms] = useState<any[]>([]);
  const [hasProPrograms, setHasProPrograms] = useState(false);
  const [proExercises, setProExercises] = useState<any[]>([]);
  const [completingSession, setCompletingSession] = useState<string | null>(null);
  const [painLevel, setPainLevel] = useState(0);
  const [patientNotes, setPatientNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const fetchData = useCallback(() => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    // Fast APIs first — show content quickly
    Promise.all([
      apiFetch('/api/health/activity-streak', {}, token).catch(() => ({})),
      apiFetch('/api/pro/has-active-programs', {}, token).catch(() => ({ has_programs: false })),
      apiFetch('/api/pro/my-programs', {}, token).catch(() => []),
      apiFetch('/api/minceur/today-tracking', {}, token).catch(() => ({})),
      apiFetch('/api/pro/beneficiary-today-exercises', {}, token).catch(() => []),
    ]).then(([st, proCheck, myProgs, trk, proEx]) => {
      setStreak(st);
      const hasPro = proCheck?.has_programs || false;
      setHasProPrograms(hasPro);
      setProPrograms(Array.isArray(myProgs) ? myProgs : []);
      setProExercises(Array.isArray(proEx) ? proEx : []);
      if (trk?.completed) setTracked(trk.completed);
      if (!hasPro) {
        apiFetch('/api/minceur/exercises', {}, token).catch(() => ({})).then((exData: any) => {
          if (exData?.exercises) setExercises(exData.exercises);
        });
      }
    }).finally(() => setLoading(false));
    // Slow API — load health report in background (doesn't block UI)
    apiFetch('/api/health/daily-report', {}, token).catch(() => ({})).then((report: any) => {
      if (report) setD(report);
    });
  }, [token]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const toggleTrack = async (index: number) => {
    const k = `exercise_${index}`, was = tracked[k];
    setTracked(p => ({ ...p, [k]: !was }));
    try { await apiFetch('/api/minceur/track', { method: 'POST', body: JSON.stringify({ type: 'exercise', index }) }, token); } catch { setTracked(p => ({ ...p, [k]: was })); }
  };

  const completeProSession = async (programId: string, sessionId: string, status: string) => {
    try {
      await apiFetch(`/api/pro/sessions/${programId}/${sessionId}/complete`, { method: 'POST', body: JSON.stringify({ status, pain_level: painLevel > 0 ? painLevel : null, patient_notes: patientNotes }) }, token);
      setCompletingSession(null); setPainLevel(0); setPatientNotes(''); fetchData();
    } catch {}
  };

  if (Platform.OS !== 'web') return null;

  const steps = d?.steps || 0, cal = d?.calories || 0, dist = d?.distance_km || 0;
  const hr = d?.heart_rate || 0, stress = d?.stress_level || 0, recovery = d?.recovery_score || 0;
  const slQ = d?.sleep_quality || 0, vo2 = d?.vo2_max || 0;
  const st = streak || {};

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
  const recMinutes = Math.round((100 - recPct) * 14.4);
  const recH = Math.floor(recMinutes / 60);
  const recM = recMinutes % 60;
  const recTimeStr = recMinutes <= 0 ? 'Pret' : recH > 0 ? `${recH}h${recM > 0 ? String(recM).padStart(2, '0') : ''}` : `${recM}min`;
  const vo2Label = vo2 >= 40 ? 'Excellent' : vo2 >= 30 ? 'Bon' : vo2 >= 20 ? 'Moyen' : vo2 > 0 ? 'Faible' : '--';
  const vo2Col = vo2 >= 40 ? G : vo2 >= 30 ? CY : vo2 >= 20 ? A : R;

  return (
    <div data-testid="activity-detail-page" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#FFF' } as any}>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>

        {/* HEADER with BG image */}
        <div style={{ position: 'relative', zIndex: 1, minHeight: 220 } as any}>
          <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />
          <div style={{ position: 'relative', zIndex: 2, padding: 'calc(env(safe-area-inset-top, 20px) + 12px) 20px 60px', maxWidth: 480, margin: '0 auto' } as any}>
            <div data-testid="back-button" onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
            <div style={{ textAlign: 'center', marginTop: 8 } as any}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>Activite du jour</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Suivi de votre activite physique</div>
            </div>
            {/* Calendar — identical to ProCalendar */}
            <HorizontalCalendar selectedDate={selectedDate} onSelect={setSelectedDate} />
          </div>
        </div>

        {/* WHITE CONTENT CARD */}
        <div style={{ padding: '24px 16px 120px', marginTop: -24, borderRadius: '24px 24px 0 0', background: '#FFF', position: 'relative', zIndex: 10, maxWidth: 480, margin: '-24px auto 0', width: '100%' } as any}>

          {loading && <div style={{ textAlign: 'center', padding: '80px 0' } as any}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: A, animation: 'spin 0.8s linear infinite', margin: '0 auto' } as any} /></div>}

          {!loading && (
            <>
              {/* Nora Activity Analysis */}
              <NoraButton label="Analyse de l'activite" sublabel="Analyse par Nora de votre activite physique" onClick={() => setShowNoraActivity(true)} />

              {/* ── CARTE 1: Activité + Récupération + VO2 ── */}
              <div style={{ padding: 20, borderRadius: 18, background: '#F4F4F5', marginBottom: 14 } as any}>
                <div style={{ textAlign: 'center', marginBottom: 14 } as any}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1.5 }}>Activite du jour</div>
                  {st.current_streak > 0 && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 999, background: 'rgba(245,158,11,0.1)', marginTop: 6 } as any}><i className="ri-fire-fill" style={{ fontSize: 11, color: A }} /><span style={{ fontSize: 11, fontWeight: 900, color: A }}>{st.current_streak}j consecutifs</span></div>}
                </div>

                {/* Steps + Calories + Distance */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 } as any}>
                  {[
                    { label: 'Pas', value: steps, goal: 6000, icon: 'ri-footprint-line', color: G, key: 'steps' },
                    { label: 'Calories', value: cal, goal: 300, icon: 'ri-fire-line', color: A, key: 'calories' },
                    { label: 'Distance', value: dist, goal: 4, icon: 'ri-route-line', color: B, decimal: true, key: 'distance_km' },
                  ].map((m, i) => {
                    const pct = m.goal > 0 ? Math.min(100, Math.round((m.value / m.goal) * 100)) : 0;
                    const has = m.value > 0;
                    return (
                      <div key={i} onClick={(e) => { e.stopPropagation(); router.push({ pathname: '/metric-detail' as any, params: { key: m.key } }); }} style={{ flex: 1, padding: '12px 8px', borderRadius: 14, background: '#FFF', textAlign: 'center', cursor: 'pointer' } as any}>
                        <i className={m.icon} style={{ fontSize: 14, color: m.color, display: 'block', marginBottom: 4 }} />
                        <div style={{ fontSize: 20, fontWeight: 900, color: has ? '#111' : '#D1D5DB', lineHeight: 1 }}>{has ? (m.decimal ? m.value.toFixed(1) : m.value.toLocaleString()) : '--'}</div>
                        <div style={{ fontSize: 8, color: m.color, fontWeight: 700, marginTop: 2, textTransform: 'uppercase' }}>{m.label}</div>
                        <div style={{ height: 3, borderRadius: 2, background: '#E5E7EB', overflow: 'hidden', marginTop: 6 } as any}><div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: m.color } as any} /></div>
                      </div>
                    );
                  })}
                </div>

                {/* Récupération */}
                <div style={{ padding: '14px 0', borderTop: '1px solid #E5E7EB' } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}><i className="ri-battery-charge-line" style={{ fontSize: 14, color: recCol }} /><span style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>Recuperation</span></div>
                    <span style={{ fontSize: 16, fontWeight: 900, color: recCol }}>{recPct}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: '#E5E7EB', overflow: 'hidden', marginBottom: 8 } as any}><div style={{ height: '100%', borderRadius: 4, width: `${recPct}%`, background: `linear-gradient(90deg, ${recCol}80, ${recCol})`, transition: 'width 0.8s' } as any} /></div>
                  <div style={{ display: 'flex', gap: 8 } as any}>
                    <div style={{ flex: 1, padding: '8px 10px', borderRadius: 10, background: '#FFF', textAlign: 'center' } as any}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: recCol }}>{recLabel}</div>
                      <div style={{ fontSize: 8, color: '#9CA3AF', fontWeight: 700 }}>NIVEAU</div>
                    </div>
                    <div style={{ flex: 1, padding: '8px 10px', borderRadius: 10, background: '#FFF', textAlign: 'center' } as any}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#111' }}>{recTimeStr}</div>
                      <div style={{ fontSize: 8, color: '#9CA3AF', fontWeight: 700 }}>TEMPS ESTIME</div>
                    </div>
                  </div>
                </div>

                {/* VO2 Max */}
                <div style={{ padding: '14px 0', display: 'flex', alignItems: 'center', gap: 16, borderTop: '1px solid #E5E7EB' } as any}>
                  <GaugeRing pct={vo2 > 0 ? Math.min(100, (vo2 / 50) * 100) : 0} color={vo2Col}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: vo2 > 0 ? vo2Col : '#D1D5DB' }}>{vo2 > 0 ? vo2 : '--'}</span>
                  </GaugeRing>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>VO2 Max</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>Capacite aerobique maximale</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: `${vo2Col}15`, marginTop: 4 } as any}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: vo2Col }}>{vo2Label}</span>
                      <span style={{ fontSize: 8, color: '#9CA3AF' }}>ml/kg/min</span>
                    </div>
                  </div>
                </div>

                {/* Comprendre mes indicateurs */}
                <div onClick={() => setShowExplain(true)} style={{ textAlign: 'center', padding: 10, borderRadius: 12, background: '#FFF', cursor: 'pointer', marginTop: 4 } as any}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: P }}><i className="ri-information-line" style={{ fontSize: 12, marginRight: 4 }} />Comprendre mes indicateurs</span>
                </div>
              </div>

              {/* ── EXERCICES PRESCRITS PAR LE PRO ── */}
              {hasProPrograms && proPrograms.length > 0 && (
                <div style={{ borderRadius: 18, background: '#F4F4F5', padding: 16, marginBottom: 14 } as any}>
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
                          <span style={{ fontSize: 10, color: '#9CA3AF' }}>{prog.professional_name}</span>
                        </div>
                        {sessions.map((session: any) => {
                          const completions = session.completions || [];
                          const todayStr = new Date().toISOString().split('T')[0];
                          const todayDone = completions.find((c: any) => c.date?.startsWith(todayStr));
                          const isDone = todayDone?.status === 'done';
                          const isPartial = todayDone?.status === 'partial';
                          const isCompleting = completingSession === `${prog.id}_${session.id}`;
                          return (
                            <div key={session.id} data-testid={`pro-session-${session.id}`} style={{ borderRadius: 14, background: '#FFF', border: `1px solid ${isDone ? G + '25' : '#E5E7EB'}`, padding: '12px 14px', marginBottom: 6, opacity: isDone ? 0.65 : 1 } as any}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${pColor}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                                  <i className="ri-heart-pulse-line" style={{ fontSize: 18, color: pColor }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 800, color: '#111', textDecoration: isDone ? 'line-through' : 'none' }}>{session.title}</div>
                                  {session.description && <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2, lineHeight: 1.4 }}>{session.description}</div>}
                                  <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' } as any}>
                                    {session.sets > 0 && <span style={{ fontSize: 9, color: '#9CA3AF', background: '#F4F4F5', padding: '2px 6px', borderRadius: 4 }}>{session.sets}x{session.repetitions || 0}</span>}
                                    {session.duration_min > 0 && <span style={{ fontSize: 9, color: '#9CA3AF', background: '#F4F4F5', padding: '2px 6px', borderRadius: 4 }}>{session.duration_min} min</span>}
                                  </div>
                                </div>
                                {todayDone ? (
                                  <div style={{ padding: '4px 10px', borderRadius: 8, background: isDone ? `${G}12` : `${A}12` }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, color: isDone ? G : A }}>{isDone ? 'Fait' : isPartial ? 'Partiel' : 'Passe'}</span>
                                  </div>
                                ) : (
                                  <div onClick={() => setCompletingSession(`${prog.id}_${session.id}`)} style={{ padding: '8px 14px', borderRadius: 999, background: '#111', cursor: 'pointer' } as any}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#FFF' }}>Valider</span>
                                  </div>
                                )}
                              </div>
                              {isCompleting && (
                                <div style={{ marginTop: 10, padding: 12, borderRadius: 12, background: '#F4F4F5' } as any}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', marginBottom: 8 }}>Comment s'est passe l'exercice ?</div>
                                  <div style={{ fontSize: 10, color: '#9CA3AF', marginBottom: 4 }}>Niveau de douleur (optionnel)</div>
                                  <div style={{ display: 'flex', gap: 4, marginBottom: 10 } as any}>
                                    {[0,1,2,3,4,5,6,7,8,9,10].map(lvl => (
                                      <div key={lvl} onClick={() => setPainLevel(lvl)} style={{ width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 10, fontWeight: 700,
                                        background: painLevel === lvl ? (lvl <= 3 ? `${G}20` : lvl <= 6 ? `${A}20` : `${R}20`) : '#FFF',
                                        border: `1px solid ${painLevel === lvl ? (lvl <= 3 ? G : lvl <= 6 ? A : R) : '#E5E7EB'}`,
                                        color: painLevel === lvl ? '#111' : '#9CA3AF',
                                      } as any}>{lvl}</div>
                                    ))}
                                  </div>
                                  <textarea value={patientNotes} onChange={(e: any) => setPatientNotes(e.target.value)} placeholder="Notes (optionnel)" style={{ width: '100%', padding: '8px 10px', borderRadius: 10, background: '#FFF', border: '1px solid #E5E7EB', color: '#111', fontSize: 12, outline: 'none', minHeight: 36, resize: 'vertical', marginBottom: 10 } as any} />
                                  <div style={{ display: 'flex', gap: 6 } as any}>
                                    <div onClick={() => completeProSession(prog.id, session.id, 'done')} style={{ flex: 1, padding: 10, borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: '#111', fontSize: 12, fontWeight: 700, color: '#FFF' } as any}>Fait</div>
                                    <div onClick={() => completeProSession(prog.id, session.id, 'partial')} style={{ flex: 1, padding: 10, borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: `${A}15`, fontSize: 12, fontWeight: 700, color: A } as any}>Partiel</div>
                                    <div onClick={() => completeProSession(prog.id, session.id, 'skipped')} style={{ flex: 1, padding: 10, borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: '#FFF', border: '1px solid #E5E7EB', fontSize: 12, fontWeight: 700, color: '#9CA3AF' } as any}>Passe</div>
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

              {/* ── EXERCICES DU JOUR (Coach) — cartes individuelles, image réelle ── */}
              {proExercises.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 4 } as any}>
                    <i className="ri-run-line" style={{ fontSize: 14, color: R }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Exercices du jour</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', background: '#E5E7EB', padding: '2px 8px', borderRadius: 999 }}>{proExercises.length}</span>
                  </div>
                  {proExercises.map((ex: any, i: number) => {
                    const exImg = ex.image ? (ex.image.startsWith('http') ? ex.image : `${API_URL}${ex.image}`) : EX_IMG[(ex.category || 'cardio').toLowerCase()] || EX_IMG.cardio;
                    return (
                      <div key={ex.id || i} data-testid={`pro-exercise-${i}`}
                        onClick={() => router.push({ pathname: '/pro-exercise-detail' as any, params: { id: ex.exercise_template_id || ex.id, mode: 'assigned', assignmentId: ex.id } })}
                        style={{ borderRadius: 14, background: ex.completed_today ? `${G}08` : '#F4F4F5', overflow: 'hidden', cursor: 'pointer', display: 'flex', minHeight: 80, marginBottom: 8 } as any}>
                        <div style={{ width: 88, flexShrink: 0, position: 'relative', overflow: 'hidden' } as any}>
                          <img src={exImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' } as any}>
                          <span style={{ fontSize: 8, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6 }}>{ex.category || 'Exercice'}</span>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#111', textDecoration: ex.completed_today ? 'line-through' : 'none', marginTop: 2 }}>{ex.title}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 } as any}>
                            {ex.sets > 0 && <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 700 }}>{ex.sets}x{ex.repetitions} reps</span>}
                            {ex.rest_seconds > 0 && <span style={{ fontSize: 10, color: '#9CA3AF' }}>{ex.rest_seconds}s repos</span>}
                          </div>
                          <span style={{ fontSize: 9, color: R, fontWeight: 700, marginTop: 3 }}>Voir le detail <i className="ri-arrow-right-s-line" style={{ fontSize: 8 }} /></span>
                        </div>
                        {ex.completed_today && <div style={{ width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-checkbox-circle-fill" style={{ fontSize: 18, color: G }} /></div>}
                      </div>
                    );
                  })}
                </>
              )}

              {/* ── EXERCICES MINCEUR (Nora) — cartes individuelles ── */}
              {!hasProPrograms && exercises.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 4 } as any}>
                    <i className="ri-heart-pulse-line" style={{ fontSize: 14, color: G }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Vos exercices du jour</span>
                  </div>
                  {exercises.map((ex: any, i: number) => {
                    const int = ex.intensity || 'modere';
                    const intC = int === 'leger' ? G : int === 'modere' ? A : R;
                    const dn = tracked[`exercise_${i}`];
                    const catKey = (ex.category || 'cardio').toLowerCase();
                    const img = EX_IMG[catKey] || EX_IMG.cardio;
                    return (
                      <div key={i} onClick={() => router.push({ pathname: '/exercise-detail' as any, params: { index: i } })}
                        style={{ borderRadius: 14, background: dn ? `${G}08` : '#F4F4F5', overflow: 'hidden', cursor: 'pointer', opacity: dn ? 0.65 : 1, display: 'flex', minHeight: 80, marginBottom: 8 } as any}>
                        <div style={{ width: 88, flexShrink: 0, position: 'relative', overflow: 'hidden' } as any}>
                          <img src={img} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, padding: '10px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center' } as any}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
                            <span style={{ fontSize: 8, fontWeight: 700, color: intC, textTransform: 'uppercase', letterSpacing: 0.6 }}>{int} {ex.duration ? `· ${ex.duration}` : ''}</span>
                            {ex.calories_burned > 0 && <span style={{ fontSize: 12, fontWeight: 900, color: '#9CA3AF' }}>{ex.calories_burned}<span style={{ fontSize: 7 }}>kcal</span></span>}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#111', textDecoration: dn ? 'line-through' : 'none', marginTop: 2 }}>{ex.name}</div>
                          <span style={{ fontSize: 9, color: G, fontWeight: 700, marginTop: 3 }}>Voir le detail <i className="ri-arrow-right-s-line" style={{ fontSize: 8 }} /></span>
                        </div>
                        <div data-testid={`track-ex-${i}`} onClick={(e) => { e.stopPropagation(); toggleTrack(i); }} style={{ width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}>
                          <i className="ri-check-line" style={{ fontSize: 16, color: dn ? G : '#D1D5DB' }} />
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}

          {/* ── POPUP EXPLICATIVE ── */}
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
                  { title: 'VO2 Max', icon: 'ri-lungs-line', color: G, desc: 'La quantite maximale d\'oxygene que votre corps peut utiliser pendant l\'effort.', ranges: 'Faible: <20 · Moyen: 20-30 · Bon: 30-40 · Excellent: >40 ml/kg/min' },
                  { title: 'Recuperation', icon: 'ri-battery-charge-line', color: CY, desc: 'Indique si votre corps a suffisamment recupere pour un nouvel effort.', ranges: 'Faible: <40% · Moderee: 40-60% · Bonne: 60-80% · Optimale: >80%' },
                  { title: 'Temps de recuperation', icon: 'ri-time-line', color: A, desc: 'Estimation du temps necessaire avant un effort intense.', ranges: 'Optimale: 4-6h · Bonne: 8-12h · Moderee: 12-18h · Faible: 18-24h' },
                  { title: 'Nombre de pas', icon: 'ri-footprint-line', color: G, desc: 'Objectif recommande pour les seniors : 6000 pas par jour.', ranges: 'Sedentaire: <3000 · Actif: 3000-6000 · Tres actif: >6000 pas' },
                  { title: 'Calories brulees', icon: 'ri-fire-line', color: A, desc: 'Calories depensees par votre activite physique (hors metabolisme de base).', ranges: 'Faible: <150 · Modere: 150-300 · Actif: >300 kcal' },
                ].map((e, i) => (
                  <div key={i} style={{ marginBottom: 20 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 } as any}>
                      <i className={e.icon} style={{ fontSize: 16, color: e.color }} />
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>{e.title}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 6 }}>{e.desc}</div>
                    <div style={{ fontSize: 10, color: e.color, fontWeight: 600 }}>{e.ranges}</div>
                    {i < 4 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginTop: 16 } as any} />}
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
