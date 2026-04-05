import React from 'react';

interface Props {
  nightDuration: number;
  nightAwakeMin: number;
  sleepData: any[] | null;
  sleepNeedMin: number;
  onExplain: (key: string) => void;
}

export default function SleepDebtCard({ nightDuration, nightAwakeMin, sleepData, sleepNeedMin, onExplain }: Props) {
  const NEED_MIN = sleepNeedMin;
  const tonightEffective = nightDuration - nightAwakeMin;
  const needH = Math.floor(NEED_MIN / 60), needM = NEED_MIN % 60;
  const effH = Math.floor(tonightEffective / 60), effM = tonightEffective % 60;
  const tonightPct = Math.min(100, Math.round((tonightEffective / NEED_MIN) * 100));
  const tonightColor = tonightPct >= 90 ? '#10B981' : tonightPct >= 75 ? '#F59E0B' : '#EF4444';
  const last7 = (sleepData && Array.isArray(sleepData)) ? sleepData.slice(-7) : [];
  let totalDebt = 0;
  const bars = last7.map((day: any) => {
    const eff = (day.deep || 0) + (day.light || 0) + (day.rem || 0);
    const debt = Math.max(0, NEED_MIN - eff);
    totalDebt += debt;
    const dt = new Date(day.date + 'T12:00:00');
    return { dateLabel: `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`, debt, eff, slept: eff };
  });
  const maxBar = Math.max(NEED_MIN, ...bars.map(b => b.slept));
  const totalH = Math.floor(totalDebt / 60), totalM = totalDebt % 60;
  const totalColor = totalDebt <= 60 ? '#10B981' : totalDebt <= 180 ? '#F59E0B' : '#EF4444';
  const circ = 2 * Math.PI * 42;
  const dashLen = (tonightPct / 100) * circ;

  return (
    <div data-testid="sleep-debt-card" style={{ borderRadius: 18, background: '#F4F4F5', padding: '16px 18px', marginBottom: 12 } as any}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 } as any}>
        <i className="ri-moon-line" style={{ fontSize: 14, color: '#A78BFA' }} />
        <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Besoin & dette de sommeil</span>
        <div onClick={() => onExplain('debt')} style={{ width: 28, height: 28, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginLeft: 'auto' } as any}>
          <i className="ri-information-line" style={{ fontSize: 14, color: '#A78BFA' }} />
        </div>
      </div>
      {/* Gauge: tonight vs need */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 18 } as any}>
        <svg width="100" height="100" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
          <circle cx="50" cy="50" r="42" fill="none" stroke="#E5E7EB" strokeWidth="6" />
          <circle cx="50" cy="50" r="42" fill="none" stroke={tonightColor} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${dashLen} ${circ}`} transform="rotate(-90 50 50)" style={{ transition: 'stroke-dasharray 1s ease' } as any} />
          <text x="50" y="45" textAnchor="middle" fill="#111" fontSize="18" fontWeight="900" fontFamily="Inter, system-ui, sans-serif">{effH}h{String(effM).padStart(2, '0')}</text>
          <text x="50" y="62" textAnchor="middle" fill="#9CA3AF" fontSize="9" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">sur {needH}h{String(needM).padStart(2, '0')}</text>
        </svg>
        <div style={{ flex: 1 } as any}>
          <div style={{ fontSize: 12, fontWeight: 700, color: tonightColor, marginBottom: 4 }}>{tonightPct >= 90 ? 'Objectif atteint' : tonightPct >= 75 ? 'Presque suffisant' : 'Sommeil insuffisant'}</div>
          <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>Votre besoin est de <strong style={{ color: '#111' }}>{needH}h{String(needM).padStart(2, '0')}</strong> par nuit. Cette nuit, vous avez dormi {tonightPct}% de votre besoin.</div>
        </div>
      </div>
      {/* 7-day SVG chart */}
      {bars.length >= 2 ? (() => {
        const W = 360, H = 120, LM = 4, RM = 4, TM = 10, BM = 22;
        const gW = W - LM - RM, gH = H - TM - BM;
        const bW = Math.min(28, (gW / bars.length) - 6);
        const step = gW / bars.length;
        const needY = TM + gH - (NEED_MIN / maxBar) * gH;
        return (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 } as any}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>Dette cumulee 7 jours</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: totalColor }}>{totalH}h{String(totalM).padStart(2, '0')}</span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 120, display: 'block' }}>
              <line x1={LM} x2={W - RM} y1={needY} y2={needY} stroke="#A78BFA" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.5" />
              <text x={W - RM} y={needY - 4} textAnchor="end" fill="#A78BFA" fontSize="8" fontWeight="700">besoin</text>
              {bars.map((b, i) => {
                const x = LM + i * step + (step - bW) / 2;
                const barH = Math.max(3, (b.slept / maxBar) * gH);
                const y = TM + gH - barH;
                const col = b.debt <= 15 ? '#10B981' : b.debt <= 45 ? '#F59E0B' : '#EF4444';
                return (
                  <g key={i}>
                    <rect x={x} y={y} width={bW} height={barH} rx={4} fill={col} opacity={0.8} />
                    <text x={x + bW / 2} y={H - 4} textAnchor="middle" fill="#9CA3AF" fontSize="8" fontWeight="600" fontFamily="Inter, system-ui, sans-serif">{b.dateLabel}</text>
                  </g>
                );
              })}
            </svg>
          </>
        );
      })() : (
        <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 11, color: '#9CA3AF', lineHeight: 1.6 }}>
          Pas assez de donnees pour le suivi hebdomadaire. Portez votre bracelet chaque nuit pour voir l'evolution.
        </div>
      )}
    </div>
  );
}
