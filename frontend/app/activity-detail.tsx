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
    const scroll = () => {
      try {
        const container = document.getElementById('activity-cal-scroll');
        const el = document.getElementById(`cal-item-${selStr}`);
        if (container && el) {
          container.scrollTo({ left: Math.max(0, el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2), behavior: 'smooth' });
        }
      } catch {}
    };
    scroll();
    const t1 = setTimeout(scroll, 100);
    const t2 = setTimeout(scroll, 400);
    const t3 = setTimeout(scroll, 800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
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
  const [showNoraActivity, setShowNoraActivity] = useState(false);
  const [explainMetric, setExplainMetric] = useState<string | null>(null);
  const [hasProPrograms, setHasProPrograms] = useState(false);
  const [proExercises, setProExercises] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [avgs, setAvgs] = useState<Record<string, any>>({});
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [exerciseLibrary, setExerciseLibrary] = useState<any[]>([]);
  const [libLoading, setLibLoading] = useState(false);

  const fetchData = useCallback(() => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = dateStr === todayStr;
    // Fast APIs first — show content quickly
    Promise.all([
      apiFetch('/api/health/activity-streak', {}, token).catch(() => ({})),
      apiFetch('/api/pro/has-active-programs', {}, token).catch(() => ({ has_programs: false })),
      apiFetch(`/api/minceur/today-tracking?date=${dateStr}`, {}, token).catch(() => ({})),
      apiFetch(`/api/pro/beneficiary-today-exercises?date=${dateStr}`, {}, token).catch(() => []),
    ]).then(([st, proCheck, trk, proEx]) => {
      setStreak(st);
      const hasPro = proCheck?.has_programs || false;
      setHasProPrograms(hasPro);
      setProExercises(Array.isArray(proEx) ? proEx : []);
      if (trk?.completed) setTracked(trk.completed);
      else setTracked({});
      if (!hasPro) {
        apiFetch('/api/minceur/exercises', {}, token).catch(() => ({})).then((exData: any) => {
          if (exData?.exercises) setExercises(exData.exercises);
        });
      }
    }).finally(() => setLoading(false));
    // Load health data: for today use daily-report, for past dates use metric-history
    if (isToday) {
      apiFetch('/api/health/daily-report', {}, token).catch(() => ({})).then((report: any) => {
        if (report) setD(report?.data || report);
      });
    } else {
      // Fetch multiple metrics for the selected date
      Promise.all([
        apiFetch(`/api/health/metric-history/steps?period=24h&date=${dateStr}`, {}, token).catch(() => ({})),
        apiFetch(`/api/health/metric-history/calories?period=24h&date=${dateStr}`, {}, token).catch(() => ({})),
        apiFetch(`/api/health/metric-history/heart_rate?period=24h&date=${dateStr}`, {}, token).catch(() => ({})),
        apiFetch(`/api/health/metric-history/stress_level?period=24h&date=${dateStr}`, {}, token).catch(() => ({})),
        apiFetch(`/api/health/metric-history/distance_km?period=24h&date=${dateStr}`, {}, token).catch(() => ({})),
      ]).then(([stepsData, calData, hrData, stressData, distData]) => {
        const getMax = (d: any) => d?.history?.length ? Math.max(...d.history.map((h: any) => h.value || 0)) : 0;
        const getAvg = (d: any) => d?.stats?.avg || 0;
        setD((prev: any) => ({
          ...(prev || {}),
          steps: getMax(stepsData),
          calories: getMax(calData),
          distance_km: getMax(distData),
          heart_rate: getAvg(hrData),
          stress_level: getAvg(stressData),
        }));
      });
    }
    // Fetch metric averages
    apiFetch('/api/health/metric-averages?keys=steps,calories,distance_km,vo2_max', {}, token).catch(() => ({})).then((a: any) => {
      if (a && typeof a === 'object') setAvgs(a);
    });
  }, [token, selectedDate]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const toggleTrack = async (index: number) => {
    const k = `exercise_${index}`, was = tracked[k];
    setTracked(p => ({ ...p, [k]: !was }));
    try { await apiFetch('/api/minceur/track', { method: 'POST', body: JSON.stringify({ type: 'exercise', index }) }, token); } catch { setTracked(p => ({ ...p, [k]: was })); }
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
          <div style={{ position: 'relative', zIndex: 2, padding: '70px 20px 60px', maxWidth: 480, margin: '0 auto' } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 } as any}>
              <div data-testid="back-button" onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}><i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
              <div style={{ flex: 1, textAlign: 'center' } as any}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Activite du jour</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Suivi de votre activite physique</div>
              </div>
              <div style={{ width: 44 } as any} />
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

              {/* ── STREAK ── */}
              {st.current_streak > 0 && <div style={{ textAlign: 'center', marginBottom: 14 } as any}><div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 999, background: 'rgba(245,158,11,0.1)' } as any}><i className="ri-fire-fill" style={{ fontSize: 11, color: A }} /><span style={{ fontSize: 11, fontWeight: 900, color: A }}>{st.current_streak}j consecutifs</span></div></div>}

              {/* ── 3 CARTES: Pas, Calories, Distance — cliquables vers metric-detail ── */}
              {[
                { label: 'Pas', value: steps, goal: 6000, icon: 'ri-footprint-line', color: G, key: 'steps', unit: '', decimal: false },
                { label: 'Calories', value: cal, goal: 300, icon: 'ri-fire-line', color: A, key: 'calories', unit: 'kcal', decimal: false },
                { label: 'Distance', value: dist, goal: 4, icon: 'ri-route-line', color: B, key: 'distance_km', unit: 'km', decimal: true },
              ].map((m, i) => {
                const pct = m.goal > 0 ? Math.min(100, Math.round((m.value / m.goal) * 100)) : 0;
                const has = m.value > 0;
                const mAvg = avgs[m.key]?.['7j'];
                return (
                  <div key={i} data-testid={`card-${m.key}`} onClick={() => router.push({ pathname: '/metric-detail' as any, params: { key: m.key } })} style={{ borderRadius: 18, background: '#F4F4F5', padding: '16px 18px', marginBottom: 10, cursor: 'pointer', transition: 'transform 0.12s' } as any}
                    onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } as any}>
                      <i className={m.icon} style={{ fontSize: 14, color: m.color }} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>{m.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 900, color: m.color, marginLeft: 'auto' }}>{has ? (m.decimal ? m.value.toFixed(1) : m.value.toLocaleString()) : '--'}{m.unit && has ? m.unit : ''}</span>
                      <div onClick={(e: any) => { e.stopPropagation(); setExplainMetric(m.key); }} style={{ width: 28, height: 28, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}><i className="ri-information-line" style={{ fontSize: 14, color: m.color }} /></div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                      <div style={{ fontSize: 32, fontWeight: 900, color: has ? '#111' : '#D1D5DB', lineHeight: 1 }}>{has ? (m.decimal ? m.value.toFixed(1) : m.value.toLocaleString()) : '--'}</div>
                      <div style={{ flex: 1 } as any}>
                        <div style={{ height: 6, borderRadius: 3, background: '#E5E7EB', overflow: 'hidden' } as any}><div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: m.color, transition: 'width 0.8s' } as any} /></div>
                        <div style={{ fontSize: 9, color: '#9CA3AF', marginTop: 3, textAlign: 'right' }}>{pct}% de {m.goal.toLocaleString()}{m.unit || ''}</div>
                      </div>
                    </div>
                    {/* Average badge */}
                    {mAvg != null && (
                      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 10, background: '#FFF' } as any}>
                        <i className="ri-line-chart-line" style={{ fontSize: 12, color: m.color }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280' }}>Moy. {'7j'}</span>
                        <span style={{ fontSize: 13, fontWeight: 900, color: m.color, marginLeft: 'auto' }}>{m.decimal ? mAvg.toFixed(1) : Math.round(mAvg).toLocaleString()}{m.unit ? ` ${m.unit}` : ''}</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ── CARTE RECUPERATION ── */}
              <div data-testid="card-recovery" style={{ borderRadius: 18, background: '#F4F4F5', padding: '16px 18px', marginBottom: 10 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 } as any}>
                  <i className="ri-battery-charge-line" style={{ fontSize: 14, color: recCol }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Recuperation</span>
                  <div onClick={() => setExplainMetric('recovery')} style={{ width: 28, height: 28, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginLeft: 'auto' } as any}><i className="ri-information-line" style={{ fontSize: 14, color: recCol }} /></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 } as any}>
                  <GaugeRing pct={recPct} color={recCol} size={72}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: recCol }}>{recPct}%</span>
                  </GaugeRing>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, background: `${recCol}15`, marginBottom: 8 } as any}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: recCol }}>{recLabel}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>
                      {recPct >= 80 ? 'Votre corps est bien repose. Vous pouvez vous entrainer intensement.' : recPct >= 60 ? 'Recuperation correcte. Activite moderee conseillee.' : recPct >= 40 ? 'Recuperation en cours. Privilegiez la marche douce.' : 'Repos necessaire. Evitez les efforts intenses.'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 } as any}>
                  <div style={{ flex: 1, padding: '8px 10px', borderRadius: 10, background: '#FFF', textAlign: 'center' } as any}><div style={{ fontSize: 8, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase' }}>Temps estime</div><div style={{ fontSize: 14, fontWeight: 900, color: '#111', marginTop: 2 }}>{recTimeStr}</div></div>
                  <div style={{ flex: 1, padding: '8px 10px', borderRadius: 10, background: '#FFF', textAlign: 'center' } as any}><div style={{ fontSize: 8, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase' }}>FC repos</div><div style={{ fontSize: 14, fontWeight: 900, color: '#111', marginTop: 2 }}>{hr > 0 ? `${hr} bpm` : '--'}</div></div>
                  <div style={{ flex: 1, padding: '8px 10px', borderRadius: 10, background: '#FFF', textAlign: 'center' } as any}><div style={{ fontSize: 8, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase' }}>Stress</div><div style={{ fontSize: 14, fontWeight: 900, color: stress > 60 ? '#EF4444' : stress > 40 ? A : G, marginTop: 2 }}>{stress > 0 ? `${stress}/100` : '--'}</div></div>
                </div>
              </div>

              {/* ── CARTE VO2 MAX ── */}
              <div data-testid="card-vo2" style={{ borderRadius: 18, background: '#F4F4F5', padding: '16px 18px', marginBottom: 14 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 } as any}>
                  <i className="ri-lungs-line" style={{ fontSize: 14, color: vo2Col }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>VO2 Max</span>
                  <div onClick={() => setExplainMetric('vo2')} style={{ width: 28, height: 28, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginLeft: 'auto' } as any}><i className="ri-information-line" style={{ fontSize: 14, color: vo2Col }} /></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 } as any}>
                  <GaugeRing pct={vo2 > 0 ? Math.min(100, (vo2 / 60) * 100) : 0} color={vo2Col} size={72}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: vo2 > 0 ? vo2Col : '#D1D5DB' }}>{vo2 > 0 ? vo2 : '--'}</span>
                  </GaugeRing>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, background: `${vo2Col}15`, marginBottom: 8 } as any}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: vo2Col }}>{vo2Label}</span>
                      <span style={{ fontSize: 10, color: '#9CA3AF' }}>ml/kg/min</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>
                      {vo2 >= 40 ? 'Votre capacite aerobique est excellente pour votre age.' : vo2 >= 30 ? 'Bonne capacite aerobique. Continuez vos efforts.' : vo2 >= 20 ? 'Capacite aerobique moyenne. L\'exercice regulier l\'ameliorera.' : vo2 > 0 ? 'Capacite aerobique a ameliorer. La marche quotidienne vous aidera.' : 'Mesure en attente de donnees suffisantes.'}
                    </div>
                  </div>
                </div>
                {/* VO2 scale visualization */}
                <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 12, background: '#FFF' } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 6 } as any}>
                    {[
                      { label: 'Faible', max: 20, color: R },
                      { label: 'Moyen', max: 30, color: A },
                      { label: 'Bon', max: 40, color: CY },
                      { label: 'Excellent', max: 60, color: G },
                    ].map((zone, i) => (
                      <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: `${zone.color}30`, position: 'relative', overflow: 'hidden' } as any}>
                        {vo2 > 0 && vo2 >= (i === 0 ? 0 : [0, 20, 30, 40][i]) && vo2 <= zone.max && (
                          <div style={{ position: 'absolute', left: `${((vo2 - (i === 0 ? 0 : [0, 20, 30, 40][i])) / (zone.max - (i === 0 ? 0 : [0, 20, 30, 40][i]))) * 100}%`, top: -3, width: 12, height: 12, borderRadius: 6, background: zone.color, border: '2px solid #FFF', transform: 'translateX(-50%)' } as any} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' } as any}>
                    {['Faible', 'Moyen', 'Bon', 'Excellent'].map((l, i) => (
                      <span key={i} style={{ fontSize: 8, color: '#9CA3AF', fontWeight: 600 }}>{l}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── EXERCICES DU JOUR — Section avec titre/sous-titre/bouton + ── */}
              <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '14px 0 24px' } as any} />
              <div data-testid="exercises-section" style={{ marginBottom: 14 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } as any}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#111', letterSpacing: '-0.3px' }}>Mes exercices</div>
                  <div data-testid="add-exercise-btn" onClick={() => {
                    setShowAddExercise(true);
                    if (exerciseLibrary.length === 0) {
                      setLibLoading(true);
                      apiFetch('/api/pro/exercise-library', {}, token).then((lib: any) => {
                        setExerciseLibrary(Array.isArray(lib) ? lib : []);
                      }).catch(() => {}).finally(() => setLibLoading(false));
                    }
                  }} style={{ width: 34, height: 34, borderRadius: 999, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.15s' } as any}
                    onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                    onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                    <i className="ri-add-line" style={{ fontSize: 18, color: '#FFF' }} />
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', marginBottom: 16, lineHeight: '1.45' }}>Exercices prescrits par votre coach ou ajoutes par vous-meme.</div>

                {/* Exercices du coach */}
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

                {/* Exercices Nora (minceur) */}
                {!hasProPrograms && exercises.map((ex: any, i: number) => {
                  const int = ex.intensity || 'modere';
                  const intC = int === 'leger' ? G : int === 'modere' ? A : R;
                  const dn = tracked[`exercise_${i}`];
                  const catKey = (ex.category || 'cardio').toLowerCase();
                  const img = EX_IMG[catKey] || EX_IMG.cardio;
                  return (
                    <div key={`nora-${i}`} onClick={() => router.push({ pathname: '/exercise-detail' as any, params: { index: i } })}
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

                {proExercises.length === 0 && exercises.length === 0 && (
                  <div style={{ padding: '24px 16px', borderRadius: 16, background: '#F4F4F5', textAlign: 'center' } as any}>
                    <i className="ri-run-line" style={{ fontSize: 28, color: '#D1D5DB', display: 'block', marginBottom: 8 }} />
                    <div style={{ fontSize: 13, color: '#9CA3AF' }}>Aucun exercice pour aujourd'hui</div>
                    <div style={{ fontSize: 11, color: '#D1D5DB', marginTop: 4 }}>Appuyez sur + pour en ajouter</div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── POPUP EXPLICATIVE (clean dark style) ── */}
          {explainMetric && (() => {
            const explanations: Record<string, { icon: string; color: string; title: string; desc: string; ranges: { label: string; value: string; color: string }[]; tip: string }> = {
              steps: { icon: 'ri-footprint-line', color: G, title: 'Nombre de pas', desc: "Le nombre de pas quotidien est un indicateur cle de votre activite physique. L'objectif recommande pour les seniors est de 6000 pas par jour.", ranges: [{ label: 'Sedentaire', value: '< 3 000', color: R }, { label: 'Actif', value: '3 000 - 6 000', color: A }, { label: 'Tres actif', value: '> 6 000', color: G }], tip: 'Essayez d\'augmenter progressivement de 500 pas par semaine. Chaque pas compte !' },
              calories: { icon: 'ri-fire-line', color: A, title: 'Calories brulees', desc: "Les calories depensees par votre activite physique, hors metabolisme de base. Un objectif de 300 kcal/jour est recommande.", ranges: [{ label: 'Faible', value: '< 150 kcal', color: R }, { label: 'Modere', value: '150 - 300 kcal', color: A }, { label: 'Actif', value: '> 300 kcal', color: G }], tip: '30 minutes de marche rapide brulent environ 150 kcal. La regularite compte plus que l\'intensite.' },
              distance_km: { icon: 'ri-route-line', color: B, title: 'Distance parcourue', desc: "La distance quotidienne reflete votre mobilite globale. Un objectif de 4 km/jour est adapte aux seniors actifs.", ranges: [{ label: 'Faible', value: '< 2 km', color: R }, { label: 'Modere', value: '2 - 4 km', color: A }, { label: 'Actif', value: '> 4 km', color: G }], tip: 'Variez vos itineraires pour maintenir la motivation. La marche en exterieur est benefique pour le moral.' },
              recovery: { icon: 'ri-battery-charge-line', color: CY, title: 'Recuperation', desc: "Indique si votre corps a suffisamment recupere pour un nouvel effort. Base sur le sommeil, le stress et la frequence cardiaque.", ranges: [{ label: 'Faible', value: '< 40%', color: R }, { label: 'Moderee', value: '40 - 60%', color: A }, { label: 'Bonne', value: '60 - 80%', color: CY }, { label: 'Optimale', value: '> 80%', color: G }], tip: 'Un bon sommeil et une hydratation suffisante sont les cles d\'une recuperation optimale.' },
              vo2: { icon: 'ri-lungs-line', color: G, title: 'VO2 Max', desc: "La quantite maximale d'oxygene que votre corps peut utiliser pendant l'effort. C'est le meilleur indicateur de votre forme cardiovasculaire.", ranges: [{ label: 'Faible', value: '< 20', color: R }, { label: 'Moyen', value: '20 - 30', color: A }, { label: 'Bon', value: '30 - 40', color: CY }, { label: 'Excellent', value: '> 40', color: G }], tip: 'Le VO2 Max peut s\'ameliorer a tout age avec un entrainement regulier en endurance (marche rapide, velo, natation).' },
            };
            const e = explanations[explainMetric] || explanations.steps;
            return (
              <div data-testid="explain-popup" onClick={() => setExplainMetric(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(48px)', WebkitBackdropFilter: 'blur(48px)', background: 'rgba(0,0,0,0.82)', overflowY: 'auto', animation: 'popIn 0.3s ease' } as any}>
                <div onClick={(ev: any) => ev.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '70px 28px 120px', boxSizing: 'border-box' } as any}>
                  <div onClick={() => setExplainMetric(null)} style={{ position: 'absolute', top: 70, right: 20, width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 22, color: '#FFF' }} /></div>
                  <div style={{ textAlign: 'center', marginBottom: 32, animation: 'slideUp 0.4s ease 0.1s both' } as any}>
                    <i className={e.icon} style={{ fontSize: 44, color: e.color }} />
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', marginTop: 14 }}>{e.title}</div>
                  </div>
                  <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.9, marginBottom: 32, animation: 'slideUp 0.4s ease 0.2s both' } as any}>{e.desc}</div>
                  <div style={{ marginBottom: 32, animation: 'slideUp 0.4s ease 0.3s both' } as any}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: e.color, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>Valeurs de reference</div>
                    {e.ranges.map((r, ri) => (
                      <div key={ri} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: ri < e.ranges.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' } as any}>
                        <span style={{ fontSize: 14, color: '#FFF', fontWeight: 600 }}>{r.label}</span>
                        <span style={{ fontSize: 14, color: r.color, fontWeight: 800 }}>{r.value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', animation: 'slideUp 0.4s ease 0.4s both' } as any}>
                    <i className="ri-lightbulb-line" style={{ fontSize: 20, color: A, flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8 }}>{e.tip}</div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes popIn{from{opacity:0;transform:scale(0.95) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}` }} />
      {showNoraActivity && <NoraOverlay token={token} endpoint="/api/nora/page-analysis?context=activity" title="Analyse activite" subtitle="Analyse par Nora de votre activite physique" onClose={() => setShowNoraActivity(false)} />}

      {/* ── POPUP AJOUT EXERCICE ── */}
      {showAddExercise && (
        <div data-testid="add-exercise-popup" onClick={() => setShowAddExercise(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', overflowY: 'auto', animation: 'popIn 0.25s ease' } as any}>
          <div onClick={(ev: any) => ev.stopPropagation()} style={{ width: '100%', maxWidth: 440, margin: '0 auto', padding: '70px 20px 120px', boxSizing: 'border-box' } as any}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 } as any}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Ajouter un exercice</div>
              <div onClick={() => setShowAddExercise(false)} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                <i className="ri-close-line" style={{ fontSize: 20, color: '#FFF' }} />
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24, lineHeight: 1.5 }}>Choisissez dans la bibliotheque ou creez le votre.</div>

            {/* Bouton creer un exercice personnalise */}
            <div data-testid="create-custom-exercise-btn" onClick={() => { setShowAddExercise(false); router.push({ pathname: '/pro-exercise-detail' as any, params: { mode: 'create-self' } }); }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 18, background: 'rgba(239,68,68,0.12)', border: '1.5px solid rgba(239,68,68,0.25)', marginBottom: 20, cursor: 'pointer', transition: 'background 0.15s' } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className="ri-add-line" style={{ fontSize: 22, color: '#EF4444' }} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>Creer un exercice</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Exercice personnalise</div>
              </div>
              <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }} />
            </div>

            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>Bibliotheque</div>

            {libLoading && <div style={{ textAlign: 'center', padding: '40px 0' }}><i className="ri-loader-4-line" style={{ fontSize: 24, color: '#FFF', animation: 'spin 0.8s linear infinite', display: 'block' }} /></div>}

            {!libLoading && exerciseLibrary.map((tpl: any, i: number) => (
              <div key={tpl.id || i} data-testid={`lib-exercise-${i}`}
                onClick={async () => {
                  try {
                    const DAYS_ALL = ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
                    await apiFetch('/api/pro/self-assign-exercise', { method: 'POST', body: JSON.stringify({ exercise_template_id: tpl.id, days: DAYS_ALL }) }, token);
                    setShowAddExercise(false);
                    fetchData();
                  } catch {}
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 8, cursor: 'pointer', transition: 'background 0.15s' } as any}
                onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}>
                {tpl.image ? (
                  <img src={tpl.image.startsWith('http') ? tpl.image : `${API_URL}${tpl.image}`} alt="" style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover', flexShrink: 0 } as any} />
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                    <i className={tpl.icon || 'ri-run-line'} style={{ fontSize: 22, color: '#EF4444' }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 } as any}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{tpl.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{tpl.category || 'Exercice'}{tpl.sets ? ` · ${tpl.sets}x${tpl.repetitions}` : ''}{tpl.muscle_group ? ` · ${tpl.muscle_group}` : ''}</div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <i className="ri-add-line" style={{ fontSize: 18, color: '#10B981' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
