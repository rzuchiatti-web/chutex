import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import FullScreenLoader from '../src/components/FullScreenLoader';

const BG_RED = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
const glass: any = { borderRadius: 20, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };

export default function MetricDetailScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { token, user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('7j');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calFrom, setCalFrom] = useState('');
  const [calTo, setCalTo] = useState('');
  const [threshold, setThreshold] = useState<any>(null);
  const [thEdit, setThEdit] = useState(false);
  const [thMin, setThMin] = useState('');
  const [thMax, setThMax] = useState('');
  const [thSaving, setThSaving] = useState(false);
  const [showExplain, setShowExplain] = useState(false);

  const loadData = async (r: string) => {
    setLoading(true);
    try {
      const [d, th] = await Promise.all([
        apiFetch(`/api/health/metric-history/${key}?period=${r}`, {}, token),
        apiFetch(`/api/health/thresholds/${key}`, {}, token).catch(() => null),
      ]);
      setData(d);
      if (th) { setThreshold(th); setThMin(th.min_val != null ? String(th.min_val) : ''); setThMax(th.max_val != null ? String(th.max_val) : ''); }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { loadData(range); }, [key, token]);

  const changeRange = (r: string) => { setRange(r); setSelectedDay(null); loadData(r); };

  if (Platform.OS !== 'web') return <View style={{ flex: 1, backgroundColor: '#000' }}><Text style={{ color: '#FFF' }}>Web uniquement</Text></View>;
  if (loading) return <FullScreenLoader />;

  const m = data?.meta || {};
  const history = data?.history || [];
  const stats = data?.stats || {};
  const color = m.color || '#A78BFA';
  const ranges: any = { '24h': 1, '7j': 7, '30j': 30, '90j': 90, 'custom': 0 };
  const sliced = range === 'custom' && calFrom && calTo
    ? history.filter((h: any) => h.date >= calFrom && h.date <= calTo)
    : range === '24h' ? history.slice(-24) : history.slice(-(ranges[range] || 7));
  const vals = sliced.map((h: any) => h.value);
  const mn = vals.length ? Math.min(...vals) : 0;
  const mx = vals.length ? Math.max(...vals) : 1;
  const rg = mx - mn || 1;
  const sel = selectedDay !== null ? sliced[selectedDay] : null;
  const rangeAvg = vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1) : '--';
  const rangeMin = vals.length ? Math.min(...vals).toFixed(1) : '--';
  const rangeMax = vals.length ? Math.max(...vals).toFixed(1) : '--';
  const currentVal = sliced.length ? sliced[sliced.length - 1].value : '--';
  const normalMin = m.normal_min;
  const normalMax = m.normal_max;
  const isNormal = normalMin != null ? (currentVal >= normalMin && currentVal <= normalMax) : true;

  const W = 380, H = 200, pad = 0;
  const gw = W, gh = H;
  const marginV = 10;
  const drawMn = mn - (rg * 0.05);
  const drawMx = mx + (rg * 0.05);
  const drawRg = drawMx - drawMn || 1;
  const toX = (i: number) => (i / (sliced.length - 1 || 1)) * gw;
  const toY = (v: number) => marginV + (gh - marginV * 2) - ((v - drawMn) / drawRg) * (gh - marginV * 2);
  const isBP = m.graph_type === 'bp_dual';
  const isBars = m.graph_type === 'bars';
  const isScatter = m.graph_type === 'scatter';

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG_RED} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>

        {/* Back */}
        <div onClick={() => router.push('/(tabs)/health' as any)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, ...glass, cursor: 'pointer', marginBottom: 16 } as any}>
          <i className="ri-arrow-left-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)' }} /><span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Retour</span>
        </div>

        {/* Hero: Title + current value + status */}
        <div style={{ marginBottom: 20 } as any}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{m.title || key}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 } as any}>
            <span style={{ fontSize: 48, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{currentVal}</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>{m.unit}</span>
            {normalMin != null && (
              <span style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 99, background: isNormal ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${isNormal ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, fontSize: 11, fontWeight: 700, color: isNormal ? '#10B981' : '#EF4444' }}>{isNormal ? 'Normal' : currentVal < normalMin ? 'Bas' : 'Eleve'}</span>
            )}
          </div>
          {stats.trend != null && <div style={{ fontSize: 13, fontWeight: 700, color: stats.trend <= 0 ? '#10B981' : '#F59E0B', marginTop: 6 }}>{stats.trend > 0 ? '+' : ''}{stats.trend} sur {range}</div>}
        </div>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 } as any}>
          {['24h', '7j', '30j', '90j'].map(r => (
            <div key={r} onClick={() => changeRange(r)} style={{ padding: '8px 14px', borderRadius: 10, background: range === r ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${range === r ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: range === r ? '#FFF' : 'rgba(255,255,255,0.3)' } as any}>{r}</div>
          ))}
          <div onClick={() => setShowCalendar(!showCalendar)} style={{ padding: '8px 12px', borderRadius: 10, background: range === 'custom' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${range === 'custom' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer' } as any}>
            <i className="ri-calendar-line" style={{ fontSize: 14, color: range === 'custom' ? '#FFF' : 'rgba(255,255,255,0.3)' }} />
          </div>
        </div>

        {showCalendar && (
          <div style={{ ...glass, padding: '14px 16px', marginBottom: 14 } as any}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 } as any}>
              <div style={{ flex: 1 } as any}><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Du</div><input type="date" value={calFrom} onChange={(e: any) => setCalFrom(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', colorScheme: 'dark' } as any} /></div>
              <div style={{ flex: 1 } as any}><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Au</div><input type="date" value={calTo} onChange={(e: any) => setCalTo(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', colorScheme: 'dark' } as any} /></div>
            </div>
            <div onClick={() => { if (calFrom && calTo) { setRange('custom'); setSelectedDay(null); setShowCalendar(false); } }} style={{ padding: '10px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#FFF' } as any}>Appliquer</div>
          </div>
        )}

        {/* Graph card — full width */}
        <div style={{ ...glass, padding: '12px 0', marginBottom: 14, overflow: 'hidden' } as any}>
          <div onClick={(e: any) => { const rect = e.currentTarget.getBoundingClientRect(); const x = e.clientX - rect.left; const idx = Math.round((x / rect.width) * (sliced.length - 1)); if (idx >= 0 && idx < sliced.length) setSelectedDay(selectedDay === idx ? null : idx); }}>
            <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
              {/* Grid */}
              {[0.25, 0.5, 0.75].map((p, i) => <line key={i} x1={0} y1={marginV + (gh - marginV * 2) * p} x2={gw} y2={marginV + (gh - marginV * 2) * p} stroke="rgba(255,255,255,0.04)" />)}
              {/* Normal zone band */}
              {normalMin != null && <rect x={0} y={toY(normalMax)} width={gw} height={Math.max(1, Math.abs(toY(normalMin) - toY(normalMax)))} fill="rgba(16,185,129,0.08)" />}

              {isBP ? (
                /* Blood Pressure: side-by-side bars systolic (dark) + diastolic (light) */
                sliced.map((h: any, i: number) => {
                  const bw = Math.max(6, gw / sliced.length * 0.35);
                  const sys = h.systolic || h.value;
                  const dia = h.diastolic || h.value * 0.62;
                  const sH = Math.max(2, ((sys - drawMn) / drawRg) * (gh - marginV * 2));
                  const dH = Math.max(2, ((dia - drawMn) / drawRg) * (gh - marginV * 2));
                  const isSel = selectedDay === i;
                  return <g key={i}>
                    <rect x={toX(i) - bw - 1} y={gh - marginV - sH} width={bw} height={sH} rx={3} fill="#8B5CF6" opacity={isSel ? 0.9 : 0.5} />
                    <rect x={toX(i) + 1} y={gh - marginV - dH} width={bw} height={dH} rx={3} fill="#C4B5FD" opacity={isSel ? 0.9 : 0.5} />
                    {isSel && <text x={toX(i)} y={gh - marginV - sH - 6} fill="#FFF" fontSize="10" fontWeight="800" textAnchor="middle">{sys}/{dia}</text>}
                  </g>;
                })
              ) : isBars ? (
                /* Steps/Calories: filled bars */
                sliced.map((h: any, i: number) => {
                  const bw = Math.max(6, gw / sliced.length * 0.65);
                  const bh = Math.max(2, ((h.value - drawMn) / drawRg) * (gh - marginV * 2));
                  const isSel = selectedDay === i;
                  return <g key={i}>
                    <rect x={toX(i) - bw / 2} y={gh - marginV - bh} width={bw} height={bh} rx={3} fill={color} opacity={isSel ? 0.9 : 0.4} />
                    {isSel && <text x={toX(i)} y={gh - marginV - bh - 6} fill="#FFF" fontSize="10" fontWeight="800" textAnchor="middle">{h.value}</text>}
                  </g>;
                })
              ) : isScatter ? (
                /* HRV: scatter dots */
                <>
                  {sliced.map((h: any, i: number) => {
                    const isSel = selectedDay === i;
                    return <g key={i}>
                      <circle cx={toX(i)} cy={toY(h.value)} r={isSel ? 7 : 4} fill={color} opacity={isSel ? 1 : 0.5} stroke={isSel ? '#FFF' : 'none'} strokeWidth={2} />
                      {isSel && <text x={toX(i)} y={toY(h.value) - 12} fill="#FFF" fontSize="10" fontWeight="800" textAnchor="middle">{h.value}</text>}
                    </g>;
                  })}
                </>
              ) : (
                /* Default: area + line + dots */
                <>
                  <defs><linearGradient id={`gm-${key}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.25" /><stop offset="100%" stopColor={color} stopOpacity="0.02" /></linearGradient></defs>
                  <polygon points={`0,${gh} ${sliced.map((h: any, i: number) => `${toX(i)},${toY(h.value)}`).join(' ')} ${gw},${gh}`} fill={`url(#gm-${key})`} />
                  <polyline points={sliced.map((h: any, i: number) => `${toX(i)},${toY(h.value)}`).join(' ')} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
                  {sliced.length <= 31 && sliced.map((h: any, i: number) => {
                    const isSel = selectedDay === i;
                    return <g key={i}>
                      <circle cx={toX(i)} cy={toY(h.value)} r={isSel ? 6 : 3} fill={isSel ? '#FFF' : color} stroke={isSel ? color : 'none'} strokeWidth={2} />
                      {isSel && <text x={toX(i)} y={toY(h.value) - 12} fill="#FFF" fontSize="11" fontWeight="800" textAnchor="middle">{h.value}</text>}
                    </g>;
                  })}
                </>
              )}
            </svg>
          </div>
          {/* X-axis labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px 0' } as any}>
            {sliced.filter((_: any, i: number) => {
              const step = Math.max(1, Math.floor(sliced.length / 5));
              return i === 0 || i === sliced.length - 1 || i % step === 0;
            }).map((h: any, i: number) => <span key={i} style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{h.label}</span>)}
          </div>
          {/* BP Legend */}
          {isBP && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, padding: '8px 0 2px' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 } as any}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#8B5CF6' } as any} /><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Systolique</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 } as any}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#C4B5FD' } as any} /><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Diastolique</span></div>
            </div>
          )}
        </div>

        {/* Selected point detail */}
        {sel && (
          <div style={{ ...glass, padding: '14px 18px', marginBottom: 14, borderColor: `${color}30` } as any}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{sel.label || new Date(sel.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 } as any}>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#FFF' }}>{m.graph_type === 'bp_dual' ? `${sel.systolic}/${sel.diastolic}` : sel.value}</span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>{m.unit}</span>
              {normalMin != null && (
                <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: sel.value >= normalMin && sel.value <= normalMax ? '#10B981' : '#EF4444' }}>
                  {sel.value >= normalMin && sel.value <= normalMax ? 'Dans la norme' : sel.value < normalMin ? 'Sous la norme' : 'Au dessus'}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stats: avg, min, max */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 } as any}>
          {[
            { label: 'Moyenne', value: rangeAvg, icon: 'ri-bar-chart-box-line', c: color },
            { label: 'Plus bas', value: rangeMin, icon: 'ri-arrow-down-line', c: '#38BDF8' },
            { label: 'Plus haut', value: rangeMax, icon: 'ri-arrow-up-line', c: '#EF4444' },
          ].map((s, i) => (
            <div key={i} style={{ ...glass, padding: '14px 10px', textAlign: 'center' } as any}>
              <i className={s.icon} style={{ fontSize: 16, color: s.c, display: 'block', marginBottom: 6 }} />
              <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Nora analysis */}
        <div style={{ ...glass, padding: '18px', marginBottom: 14 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 } as any}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 12, fontWeight: 900, color: '#A78BFA' }}>N</span></div>
            <div><div style={{ fontSize: 15, fontWeight: 900, color: '#FFF' }}>Nora</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{m.title}</div></div>
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 12 }}>
            {isNormal
              ? `Votre ${(m.title || '').toLowerCase()} de ${currentVal} ${m.unit} se situe dans la zone normale (${normalMin}-${normalMax} ${m.unit}). La moyenne sur la periode est de ${rangeAvg} ${m.unit}. C'est un bon signe de stabilite, continuez ainsi.`
              : `Votre ${(m.title || '').toLowerCase()} de ${currentVal} ${m.unit} est ${currentVal < normalMin ? 'en dessous' : 'au dessus'} de la zone normale (${normalMin}-${normalMax} ${m.unit}). ${currentVal < normalMin ? 'Je vous conseille de surveiller cette valeur. ' + (key === 'heart_rate' ? 'Une frequence basse peut indiquer une bonne condition physique ou une bradycardie selon le contexte.' : key === 'spo2' ? 'En dessous de 92%, consultez rapidement votre medecin.' : 'Parlez-en a votre medecin si cela persiste.') : 'Je vous recommande d\'en parler a votre medecin. ' + (key === 'heart_rate' ? 'Le stress, la deshydratation ou un manque de sommeil peuvent expliquer cette elevation.' : key === 'temperature' ? 'Cela peut indiquer une infection ou une inflammation.' : 'Une valeur elevee necessite une surveillance rapprochee.')}`
            }
          </div>
          {stats.trend != null && (
            <div style={{ padding: '10px 14px', borderRadius: 12, background: stats.trend <= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${stats.trend <= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)'}`, marginBottom: 10 } as any}>
              <div style={{ fontSize: 12, fontWeight: 700, color: stats.trend <= 0 ? '#10B981' : '#F59E0B' }}>Tendance : {stats.trend > 0 ? '+' : ''}{stats.trend} sur la periode</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{stats.trend <= 0 ? 'Evolution stable ou en amelioration.' : 'Legere augmentation, a suivre sur les prochaines mesures.'}</div>
            </div>
          )}
        </div>

        {/* What is this metric? */}
        <div onClick={() => setShowExplain(!showExplain)} style={{ ...glass, padding: '16px 18px', marginBottom: 14, cursor: 'pointer' } as any}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
              <i className="ri-book-open-line" style={{ fontSize: 16, color }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Qu'est-ce que {(m.title || '').toLowerCase()} ?</span>
            </div>
            <i className={showExplain ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />
          </div>
          {showExplain && (
            <div style={{ marginTop: 12 } as any}>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 10 }}>{m.explain || ''}</div>
              {normalMin != null && (
                <div style={{ display: 'flex', gap: 8 } as any}>
                  <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', textAlign: 'center' } as any}><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Min normal</div><div style={{ fontSize: 16, fontWeight: 900, color: '#38BDF8' }}>{normalMin} <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{m.unit}</span></div></div>
                  <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', textAlign: 'center' } as any}><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Zone ideale</div><div style={{ fontSize: 16, fontWeight: 900, color: '#10B981' }}>{normalMin}-{normalMax}</div></div>
                  <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', textAlign: 'center' } as any}><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Max normal</div><div style={{ fontSize: 16, fontWeight: 900, color: '#EF4444' }}>{normalMax} <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{m.unit}</span></div></div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Alert thresholds */}
        <div style={{ ...glass, padding: '16px 18px', marginBottom: 14 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
              <i className="ri-alarm-warning-line" style={{ fontSize: 16, color: '#F59E0B' }} />
              <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Seuils d'alerte</span>
            </div>
            {!thEdit && <div onClick={() => { setThEdit(true); if (!thMin && normalMin != null) setThMin(String(Math.round(normalMin * 0.9))); if (!thMax && normalMax != null) setThMax(String(Math.round(normalMax * 1.15))); }} style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#FFF' } as any}>{threshold?.min_val != null ? 'Modifier' : 'Configurer'}</div>}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12, lineHeight: 1.5 }}>Vos gardiens seront alertes si cette donnee depasse les seuils definis.</div>
          {/* Nora threshold suggestion — 1st person, pre-filled */}
          {normalMin != null && !thEdit && !(threshold?.min_val != null) && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 12, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.12)', marginBottom: 12 } as any}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 } as any}><span style={{ fontSize: 8, fontWeight: 900, color: '#A78BFA' }}>N</span></div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                D'apres vos donnees, je vous suggere un seuil bas a <strong style={{ color: '#38BDF8' }}>{Math.round(normalMin * 0.9)} {m.unit}</strong> et un seuil haut a <strong style={{ color: '#EF4444' }}>{Math.round(normalMax * 1.15)} {m.unit}</strong>. Cliquez sur Configurer pour appliquer ou ajuster.
              </div>
            </div>
          )}
          {!thEdit ? (
            threshold?.min_val != null || threshold?.max_val != null ? (
              <div style={{ display: 'flex', gap: 10 } as any}>
                {threshold.min_val != null && <div style={{ flex: 1, padding: '12px', borderRadius: 14, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', textAlign: 'center' } as any}><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Seuil bas</div><div style={{ fontSize: 22, fontWeight: 900, color: '#38BDF8' }}>{threshold.min_val} <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{m.unit}</span></div></div>}
                {threshold.max_val != null && <div style={{ flex: 1, padding: '12px', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', textAlign: 'center' } as any}><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Seuil haut</div><div style={{ fontSize: 22, fontWeight: 900, color: '#EF4444' }}>{threshold.max_val} <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{m.unit}</span></div></div>}
              </div>
            ) : <div style={{ textAlign: 'center', padding: '10px 0', fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>Aucun seuil configure</div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 } as any}>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(56,189,248,0.7)', textTransform: 'uppercase', marginBottom: 4 }}>Seuil bas</div>
                  <input type="number" step="0.1" value={thMin} onChange={(e: any) => setThMin(e.target.value)} placeholder="Min" style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(56,189,248,0.2)', color: '#FFF', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(239,68,68,0.7)', textTransform: 'uppercase', marginBottom: 4 }}>Seuil haut</div>
                  <input type="number" step="0.1" value={thMax} onChange={(e: any) => setThMax(e.target.value)} placeholder="Max" style={{ width: '100%', padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(239,68,68,0.2)', color: '#FFF', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 } as any}>
                <div onClick={async () => { setThSaving(true); try { await apiFetch('/api/health/thresholds', { method: 'POST', body: JSON.stringify({ metric_id: key, min_val: thMin ? parseFloat(thMin) : null, max_val: thMax ? parseFloat(thMax) : null }) }, token); setThreshold({ metric_id: key, min_val: thMin ? parseFloat(thMin) : null, max_val: thMax ? parseFloat(thMax) : null }); setThEdit(false); } catch {} finally { setThSaving(false); } }} style={{ flex: 1, padding: '12px', borderRadius: 12, background: color, cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 800, color: '#FFF' } as any}>{thSaving ? '...' : 'Sauvegarder'}</div>
                <div onClick={() => setThEdit(false)} style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' } as any}>Annuler</div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
