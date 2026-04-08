import React from 'react';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';

export function GlycemiaCard({ token }: { token: string | null }) {
  const router = useRouter();
  const [data, setData] = React.useState<any>(null);
  React.useEffect(() => { if (token) apiFetch('/api/glycemia/estimate', {}, token).then(setData).catch(() => {}); }, [token]);
  if (!data) return null;
  const insufficient = data.status === 'insufficient_data';
  const zc: Record<string, string> = { normal: '#10B981', normal_high: '#84CC16', vigilance: '#F59E0B', pre_alert: '#F97316', alert: '#EF4444' };
  const col = insufficient ? '#6366F1' : (zc[data.zone] || '#F59E0B');
  const META_IMG = 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/5vzwu43l_m%C3%A9tabolique.png';
  const BG_RED = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
  return (
    <div data-testid="glycemia-card" onClick={() => router.push('/glycemia-detail' as any)}
      style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 14, cursor: 'pointer', position: 'relative', transition: 'transform 0.15s', border: '1.5px solid rgba(255,255,255,0.25)', boxShadow: '0 0 30px rgba(255,255,255,0.08), 0 0 60px rgba(167,139,250,0.06), 0 8px 40px rgba(0,0,0,0.5)' } as any}
      onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
      <img src={BG_RED} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', zIndex: 2 } as any}>
        <div style={{ textAlign: 'center', paddingTop: 16 } as any}>
          <img src={META_IMG} alt="" style={{ width: 80, height: 80, objectFit: 'contain', display: 'block', margin: '0 auto', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.4))' } as any} />
        </div>
        <div style={{ padding: '10px 16px 14px' } as any}>
          <div style={{ textAlign: 'center', marginBottom: 10 } as any}>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>Glycemie Estimee</div>
            {insufficient ? (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 6 }}>En attente de donnees suffisantes. Portez votre bracelet et realisez une calibration capillaire.</div>
            ) : data.estimated_glycemia ? (
              <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', lineHeight: 1, marginBottom: 6 }}>{Number(data.estimated_glycemia).toFixed(2)} <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>g/L</span></div>
            ) : null}
            {insufficient ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' } as any}>
                <i className="ri-time-line" style={{ fontSize: 12, color: '#6366F1' }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#6366F1' }}>Calibration requise</span>
              </div>
            ) : (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: `${col}20`, border: `1px solid ${col}30` } as any}>
              <span style={{ width: 7, height: 7, borderRadius: 4, background: col, boxShadow: `0 0 6px ${col}60` } as any} />
              <span style={{ fontSize: 12, fontWeight: 800, color: col }}>{data.zone_label}</span>
            </div>
            )}
          </div>
          <svg viewBox="0 0 300 28" style={{ width: '100%', height: 24, display: 'block', marginBottom: 8 }}>
            <defs><linearGradient id="glycGradMini" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#10B981" stopOpacity="0.4" /><stop offset="25%" stopColor="#84CC16" stopOpacity="0.3" /><stop offset="45%" stopColor="#F59E0B" stopOpacity="0.35" /><stop offset="70%" stopColor="#F97316" stopOpacity="0.35" /><stop offset="100%" stopColor="#EF4444" stopOpacity="0.4" /></linearGradient></defs>
            <rect x="0" y="6" width="300" height="10" rx="5" fill="url(#glycGradMini)" />
            {(() => { const s = data.risk_score||50; const cx = Math.max(8,Math.min(292,(s/100)*300)); return <><circle cx={cx} cy="11" r="6" fill={col} opacity="0.2"><animate attributeName="r" values="6;9;6" dur="2s" repeatCount="indefinite" /></circle><circle cx={cx} cy="11" r="4" fill={col} stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" /></>; })()}
          </svg>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4, textAlign: 'center' }}>{data.estimated_range}</div>
        </div>
        <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>Estimation en evolution continue</span>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#FFF' }}>Voir le detail <i className="ri-arrow-right-s-line" style={{ fontSize: 10 }} /></span>
        </div>
      </div>
    </div>
  );
}
