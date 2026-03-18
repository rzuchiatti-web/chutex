import React from 'react';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';

const WEIGHT_BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/v5t9l2mb_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_10_07.png';
const TAPE_MEASURE_IMG = 'https://customer-assets.emergentagent.com/job_e5e873d0-c3a6-4073-8807-5b369c712c84/artifacts/d7demq52_img_objectif_poids.png';

export default function WeightGoalDashCard({ token }: { token: string }) {
  const router = useRouter();
  const [goal, setGoal] = React.useState<any>(null);
  React.useEffect(() => {
    Promise.all([
      apiFetch('/api/minceur/weight-goal-status', {}, token).catch(() => null),
    ]).then(([g]) => { if (g && g.target_kg) setGoal(g); });
  }, [token]);

  if (!goal) return null;

  const diff = (goal.current || 0) - goal.target_kg;
  const remaining = Math.abs(diff).toFixed(1);
  const progressPct = diff > 0 ? Math.max(5, Math.min(95, 100 - (diff / (diff + 2)) * 100)) : 50;

  return (
    <div data-testid="weight-goal-dash-card" className="dash-slide-up cl-press" onClick={() => router.push('/minceur' as any)}
      style={{ borderRadius: 18, overflow: 'hidden', marginBottom: 14, cursor: 'pointer', position: 'relative', height: 100, transition: 'transform 0.15s', border: '1.5px solid rgba(255,255,255,0.25)', boxShadow: '0 0 30px rgba(255,255,255,0.08), 0 0 60px rgba(167,139,250,0.06), 0 8px 40px rgba(0,0,0,0.5)' } as any}
      onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
      <img src={WEIGHT_BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
      <img src={TAPE_MEASURE_IMG} alt="" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 80, height: 80, objectFit: 'contain', zIndex: 2 } as any} />
      <div style={{ position: 'relative', zIndex: 3, padding: '16px 18px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' } as any}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Objectif poids en cours</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 } as any}>
          <span style={{ fontSize: 26, fontWeight: 900, color: '#FFF' }}>{goal.current > 0 ? goal.current : '--'}</span>
          <i className="ri-arrow-right-line" style={{ fontSize: 14, color: '#60A5FA' }} />
          <span style={{ fontSize: 26, fontWeight: 900, color: '#60A5FA' }}>{goal.target_kg}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>kg</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginLeft: 4 }}>· {goal.weeks} sem</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, maxWidth: 200 } as any}>
          {Array.from({ length: 12 }, (_, i) => {
            const filled = i < Math.round(progressPct / 100 * 12);
            return <div key={i} style={{ width: 6, height: 6, borderRadius: 3, background: filled ? '#60A5FA' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' } as any} />;
          })}
          <span style={{ fontSize: 9, fontWeight: 700, color: '#60A5FA', marginLeft: 6 }}>{diff > 0 ? `-${remaining}` : `+${remaining}`}kg</span>
        </div>
      </div>
    </div>
  );
}
