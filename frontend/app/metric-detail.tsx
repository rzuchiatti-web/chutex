import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const BG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';

export default function MetricDetailScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30j');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calFrom, setCalFrom] = useState('');
  const [calTo, setCalTo] = useState('');

  useEffect(() => {
    (async () => {
      try { setData(await apiFetch(`/api/health/metric-history/${key}`, {}, token)); } catch {} finally { setLoading(false); }
    })();
  }, [key, token]);

  if (Platform.OS !== 'web') return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#FFF' }}>Web uniquement</Text></View>;
  if (loading) return <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0f1a' } as any}><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Chargement...</div></div>;

  const m = data?.meta || {};
  const history = data?.history || [];
  const stats = data?.stats || {};
  const color = m.color || '#A78BFA';
  const ranges = { '7j': 7, '30j': 30, '90j': 90, 'custom': 0 } as any;
  const sliced = range === 'custom' && calFrom && calTo
    ? history.filter((h: any) => h.date >= calFrom && h.date <= calTo)
    : history.slice(-(ranges[range] || 30));
  const vals = sliced.map((h: any) => h.value);
  const mn = vals.length ? Math.min(...vals) : 0;
  const mx = vals.length ? Math.max(...vals) : 1;
  const rg = mx - mn || 1;
  const sel = selectedDay !== null ? sliced[selectedDay] : null;
  const rangeAvg = vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1) : '--';
  const rangeMin = vals.length ? Math.min(...vals) : '--';
  const rangeMax = vals.length ? Math.max(...vals) : '--';

  const W = 700, H = 180, pad = 10;

  const renderGraph = () => {
    const gw = W - pad * 2, gh = H - pad * 2;
    const toX = (i: number) => pad + (i / (sliced.length - 1 || 1)) * gw;
    const toY = (v: number) => pad + gh - ((v - mn) / rg) * gh;

    // ECG style — continuous sharp line
    if (m.graph_type === 'ecg') {
      const pts = sliced.map((h: any, i: number) => `${toX(i)},${toY(h.value)}`).join(' ');
      return <svg width={W} height={H}><rect x={pad} y={toY(m.normal_max || mx)} width={gw} height={Math.abs(toY(m.normal_min || mn) - toY(m.normal_max || mx))} fill={`${color}08`} rx="4" /><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />{selectedDay !== null && <circle cx={toX(selectedDay)} cy={toY(sliced[selectedDay]?.value)} r="5" fill={color} stroke="#FFF" strokeWidth="2" />}</svg>;
    }
    // Bars
    if (m.graph_type === 'bars') {
      const bw = Math.max(4, gw / sliced.length - 2);
      return <svg width={W} height={H}>{sliced.map((h: any, i: number) => { const bh = Math.max(2, ((h.value - mn) / rg) * gh); return <rect key={i} x={pad + (i / sliced.length) * gw} y={pad + gh - bh} width={bw} height={bh} rx="2" fill={selectedDay === i ? '#FFF' : color} opacity={selectedDay === i ? 1 : 0.5} onClick={() => setSelectedDay(selectedDay === i ? null : i)} style={{ cursor: 'pointer' }} />; })}</svg>;
    }
    // Hypnogram (sleep)
    if (m.graph_type === 'hypnogram') {
      const bw = Math.max(6, gw / sliced.length - 2);
      return <svg width={W} height={H}>{sliced.map((h: any, i: number) => { const x = pad + (i / sliced.length) * gw; const deep = h.deep || 0, light = h.light || 0, rem = h.rem || 0; const total = deep + light + rem || 1; const dh = (deep / total) * gh, lh = (light / total) * gh, rh = (rem / total) * gh; return <g key={i} onClick={() => setSelectedDay(selectedDay === i ? null : i)} style={{ cursor: 'pointer' } as any}><rect x={x} y={pad + gh - dh - lh - rh} width={bw} height={rh} rx="1" fill="#C4B5FD" opacity={selectedDay === i ? 1 : 0.6} /><rect x={x} y={pad + gh - dh - lh} width={bw} height={lh} rx="1" fill="#A78BFA" opacity={selectedDay === i ? 1 : 0.6} /><rect x={x} y={pad + gh - dh} width={bw} height={dh} rx="1" fill="#6D28D9" opacity={selectedDay === i ? 1 : 0.6} /></g>; })}</svg>;
    }
    // Scatter
    if (m.graph_type === 'scatter') {
      return <svg width={W} height={H}>{sliced.map((h: any, i: number) => <circle key={i} cx={toX(i)} cy={toY(h.value)} r={selectedDay === i ? 6 : 3.5} fill={selectedDay === i ? '#FFF' : color} opacity={selectedDay === i ? 1 : 0.6} onClick={() => setSelectedDay(selectedDay === i ? null : i)} style={{ cursor: 'pointer' }} />)}</svg>;
    }
    // Area with threshold
    if (m.graph_type === 'area_threshold' || m.graph_type === 'bars_threshold') {
      const pts = sliced.map((h: any, i: number) => `${toX(i)},${toY(h.value)}`).join(' ');
      const area = `${pad},${pad + gh} ${pts} ${pad + gw},${pad + gh}`;
      return <svg width={W} height={H}>{m.normal_min && <rect x={pad} y={toY(m.normal_max || mx)} width={gw} height={Math.abs(toY(m.normal_min) - toY(m.normal_max || mx))} fill="rgba(16,185,129,0.06)" rx="4" />}<polygon points={area} fill={`${color}15`} /><polyline points={pts} fill="none" stroke={color} strokeWidth="2" />{selectedDay !== null && <circle cx={toX(selectedDay)} cy={toY(sliced[selectedDay]?.value)} r="5" fill={color} stroke="#FFF" strokeWidth="2" />}</svg>;
    }
    // Area gradient (stress, recovery, sleep quality)
    if (m.graph_type === 'area_gradient') {
      const pts = sliced.map((h: any, i: number) => `${toX(i)},${toY(h.value)}`).join(' ');
      const area = `${pad},${pad + gh} ${pts} ${pad + gw},${pad + gh}`;
      return <svg width={W} height={H}><defs><linearGradient id={`g-${key}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3" /><stop offset="100%" stopColor={color} stopOpacity="0.02" /></linearGradient></defs><polygon points={area} fill={`url(#g-${key})`} /><polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />{selectedDay !== null && <circle cx={toX(selectedDay)} cy={toY(sliced[selectedDay]?.value)} r="5" fill={color} stroke="#FFF" strokeWidth="2" />}</svg>;
    }
    // Default: smooth curve
    const pts = sliced.map((h: any, i: number) => `${toX(i)},${toY(h.value)}`).join(' ');
    const area = `${pad},${pad + gh} ${pts} ${pad + gw},${pad + gh}`;
    return <svg width={W} height={H}><defs><linearGradient id={`gc-${key}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.2" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs><polygon points={area} fill={`url(#gc-${key})`} /><polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />{selectedDay !== null && <circle cx={toX(selectedDay)} cy={toY(sliced[selectedDay]?.value)} r="5" fill={color} stroke="#FFF" strokeWidth="2" />}</svg>;
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>

        {/* Back */}
        <div onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', marginBottom: 16 } as any}>
          <i className="ri-arrow-left-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }} /><span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Retour</span>
        </div>

        {/* Title + current value */}
        <div style={{ marginBottom: 20 } as any}>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>{m.title || key}</div>
          <div style={{ fontSize: 40, fontWeight: 900, color }}>
            {sliced.length ? sliced[sliced.length - 1].value : '--'}
            <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginLeft: 6 }}>{m.unit}</span>
          </div>
          {stats.trend != null && <div style={{ fontSize: 13, fontWeight: 700, color: stats.trend <= 0 ? '#10B981' : '#F59E0B', marginTop: 4 }}>{stats.trend > 0 ? '+' : ''}{stats.trend} sur 30j</div>}
        </div>

        {/* Range selector + Calendar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 } as any}>
          {['7j', '30j', '90j'].map(r => (
            <div key={r} onClick={() => { setRange(r); setSelectedDay(null); setShowCalendar(false); }} style={{ padding: '8px 18px', borderRadius: 999, background: range === r ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${range === r ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: range === r ? '#FFF' : 'rgba(255,255,255,0.3)' } as any}>{r}</div>
          ))}
          <div onClick={() => setShowCalendar(!showCalendar)} style={{ padding: '8px 14px', borderRadius: 999, background: range === 'custom' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${range === 'custom' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 } as any}>
            <i className="ri-calendar-line" style={{ fontSize: 13, color: range === 'custom' ? '#FFF' : 'rgba(255,255,255,0.3)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: range === 'custom' ? '#FFF' : 'rgba(255,255,255,0.3)' }}>Periode</span>
          </div>
        </div>
        {/* Calendar picker */}
        {showCalendar && (
          <div style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14 } as any}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF', marginBottom: 10 }}>Selectionner une periode</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 } as any}>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Du</div>
                <input type="date" value={calFrom} onChange={(e: any) => setCalFrom(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', colorScheme: 'dark' } as any} />
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>Au</div>
                <input type="date" value={calTo} onChange={(e: any) => setCalTo(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', colorScheme: 'dark' } as any} />
              </div>
            </div>
            <div onClick={() => { if (calFrom && calTo) { setRange('custom'); setSelectedDay(null); setShowCalendar(false); } }} style={{ padding: '10px', borderRadius: 999, background: calFrom && calTo ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', cursor: calFrom && calTo ? 'pointer' : 'not-allowed', textAlign: 'center', fontSize: 13, fontWeight: 700, color: calFrom && calTo ? '#FFF' : 'rgba(255,255,255,0.2)' } as any}>Appliquer</div>
          </div>
        )}

        {/* Graph */}
        <div style={{ borderRadius: 22, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '16px', marginBottom: 14, overflow: 'hidden' } as any}>
          <div style={{ overflowX: 'auto' } as any} onClick={(e: any) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left - pad;
            const idx = Math.round((x / (W - pad * 2)) * (sliced.length - 1));
            if (idx >= 0 && idx < sliced.length) setSelectedDay(selectedDay === idx ? null : idx);
          }}>
            {renderGraph()}
          </div>
          {/* X-axis labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6 } as any}>
            {[sliced[0], sliced[Math.floor(sliced.length / 2)], sliced[sliced.length - 1]].filter(Boolean).map((h: any, i: number) => (
              <span key={i} style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{new Date(h.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
            ))}
          </div>
        </div>

        {/* Selected day detail */}
        {sel && (
          <div style={{ padding: '14px 16px', borderRadius: 18, background: `${color}10`, border: `1px solid ${color}25`, marginBottom: 14 } as any}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{new Date(sel.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF' }}>{sel.value} <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>{m.unit}</span></div>
            {sel.deep != null && (
              <div style={{ display: 'flex', gap: 10, marginTop: 8 } as any}>
                <span style={{ fontSize: 11, color: '#6D28D9' }}>Profond {sel.deep}min</span>
                <span style={{ fontSize: 11, color: '#A78BFA' }}>Leger {sel.light}min</span>
                <span style={{ fontSize: 11, color: '#C4B5FD' }}>REM {sel.rem}min</span>
              </div>
            )}
          </div>
        )}

        {/* Stats on range */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 } as any}>
          {[
            { label: 'Moyenne', value: rangeAvg, icon: 'ri-bar-chart-box-line' },
            { label: 'Min', value: rangeMin, icon: 'ri-arrow-down-line' },
            { label: 'Max', value: rangeMax, icon: 'ri-arrow-up-line' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '12px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' } as any}>
              <i className={s.icon} style={{ fontSize: 14, color: 'rgba(255,255,255,0.25)', marginBottom: 4, display: 'block' }} />
              <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{s.value}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{s.label} ({range})</div>
            </div>
          ))}
        </div>

        {/* Explanation */}
        <div style={{ padding: '16px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 14 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } as any}><i className="ri-information-line" style={{ fontSize: 14, color }} /><span style={{ fontSize: 10, fontWeight: 700, color: `${color}99`, textTransform: 'uppercase', letterSpacing: 0.5 }}>Comprendre cette donnee</span></div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{m.explain || ''}</div>
          {m.normal_min != null && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 } as any}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Zone normale :</span>
              <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', fontSize: 11, fontWeight: 700, color: '#10B981' }}>{m.normal_min} - {m.normal_max} {m.unit}</span>
            </div>
          )}
        </div>

        {/* Hypnogram legend */}
        {m.graph_type === 'hypnogram' && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 14, justifyContent: 'center' } as any}>
            {[{ l: 'Profond', c: '#6D28D9' }, { l: 'Leger', c: '#A78BFA' }, { l: 'REM', c: '#C4B5FD' }].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 } as any}><span style={{ width: 8, height: 8, borderRadius: 2, background: s.c } as any} /><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{s.l}</span></div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
