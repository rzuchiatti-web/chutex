import React, { useState } from 'react';

export function StatEditor({ label, value, onChange, min = 0, max = 999, step = 1, suffix = '', accent = '#3B82F6' }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string; accent?: string }) {
  return (
    <div data-testid={`stat-editor-${label.toLowerCase()}`} style={{ flex: 1, padding: '10px 4px', textAlign: 'center', borderRight: '1px solid #E5E7EB' } as any}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 } as any}>
        <div onClick={() => onChange(Math.max(min, value - step))} style={{ width: 26, height: 26, borderRadius: 8, background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 900, color: '#6B7280', userSelect: 'none' } as any}>-</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#111', minWidth: 30, textAlign: 'center' }}>{value}{suffix && <span style={{ fontSize: 9, color: '#9CA3AF' }}>{suffix}</span>}</div>
        <div onClick={() => onChange(Math.min(max, value + step))} style={{ width: 26, height: 26, borderRadius: 8, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 900, color: '#FFF', userSelect: 'none' } as any}>+</div>
      </div>
    </div>
  );
}

export function WeightChart({ data, accent }: { data: any[]; accent: string }) {
  const [selected, setSelected] = useState<number | null>(null);
  const entries = data.slice(-12);
  if (entries.length < 2) return null;
  const weights = entries.map((w: any) => w.weight_kg);
  const minW = Math.min(...weights) - 2;
  const maxW = Math.max(...weights) + 2;
  const range = maxW - minW || 1;
  const W = 320, H = 110, padX = 10, padY = 12;
  const chartW = W - padX * 2, chartH = H - padY * 2;
  const points = entries.map((w: any, i: number) => ({
    x: padX + (i / (entries.length - 1)) * chartW,
    y: padY + chartH - ((w.weight_kg - minW) / range) * chartH,
    weight: w.weight_kg,
    date: w.date ? new Date(w.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
    dateShort: w.date ? new Date(w.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '',
  }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const sel = selected !== null ? points[selected] : null;

  return (
    <div data-testid="weight-chart" style={{ marginTop: 12 } as any}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Evolution du poids</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H + 16}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        {[0, 0.5, 1].map((p, i) => (
          <line key={i} x1={padX} y1={padY + chartH * (1 - p)} x2={W - padX} y2={padY + chartH * (1 - p)} stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="4,4" />
        ))}
        <path d={`${linePath} L${points[points.length - 1].x},${padY + chartH} L${points[0].x},${padY + chartH} Z`} fill={`${accent}10`} />
        <path d={linePath} fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={selected === i ? 6 : 3.5} fill={selected === i ? accent : '#FFF'} stroke={accent} strokeWidth="2" onClick={() => setSelected(selected === i ? null : i)} style={{ cursor: 'pointer' }} />
        ))}
        {points.filter((_, i) => i === 0 || i === points.length - 1).map((p, i) => (
          <text key={`l-${i}`} x={p.x} y={H + 12} textAnchor={i === 0 ? 'start' : 'end'} fill="#9CA3AF" fontSize="8" fontWeight="600">{p.dateShort}</text>
        ))}
      </svg>
      {sel && (
        <div data-testid="weight-detail-card" style={{ marginTop: 8, padding: '10px 14px', borderRadius: 12, background: '#FFF', border: `1.5px solid ${accent}20`, display: 'flex', alignItems: 'center', gap: 12 } as any}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: accent, flexShrink: 0 } as any} />
          <div style={{ flex: 1 } as any}>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>{sel.date}</div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#111' }}>{sel.weight}<span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 2 }}>kg</span></div>
        </div>
      )}
    </div>
  );
}
