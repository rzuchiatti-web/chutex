import React from 'react';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';

const NORA_VIDEO = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4';

function NoraPill() {
  return (
    <div className="dash-slide-up" style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 } as any}>
      <div data-testid="nora-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.5)', borderRadius: 999, padding: '6px 16px 6px 6px', boxShadow: '0 4px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.18)' } as any}>
        <video src={NORA_VIDEO} autoPlay loop muted playsInline style={{ width: 28, height: 28, borderRadius: 14, objectFit: 'cover' } as any} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#FFF', letterSpacing: -0.2 }}>Nora · Vos objectifs du jour</span>
      </div>
    </div>
  );
}

/* ════════ Steps — main measured card ════════ */
function StepsCard({ data, measured }: { data: any; measured: number }) {
  const router = useRouter();
  const target = parseInt(data.value) || 6000;
  const pct = target > 0 ? Math.min(100, (measured / target) * 100) : 0;
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div data-testid="objective-card-steps" className="dash-slide-up" onClick={() => router.push({ pathname: '/metric-detail' as any, params: { key: 'steps' } })}
      style={{
        padding: '24px', borderRadius: 24, cursor: 'pointer',
        background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(20,20,32,0.92) 60%)',
        border: '1px solid rgba(16,185,129,0.15)',
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        display: 'flex', alignItems: 'center', gap: 28,
        transition: 'transform 0.2s, box-shadow 0.2s',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        marginBottom: 14,
      } as any}
      onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(16,185,129,0.15)'; }}
      onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'; }}>

      {/* Circular progress */}
      <div style={{ position: 'relative', width: 128, height: 128, flexShrink: 0 } as any}>
        <svg width="128" height="128" viewBox="0 0 128 128" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          <circle cx="64" cy="64" r="54" fill="none" stroke="#10B981" strokeWidth="10"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1.5s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } as any}>
          <span style={{ fontSize: 28, fontWeight: 900, color: '#FFF', letterSpacing: -1, lineHeight: 1 }}>{measured.toLocaleString('fr-FR')}</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginTop: 2 }}>/ {target.toLocaleString('fr-FR')}</span>
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
          <i className="fa-solid fa-shoe-prints" style={{ fontSize: 14, color: '#10B981' }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: '#FFF' }}>Pas</span>
          <span style={{ fontSize: 9, fontWeight: 600, color: '#10B981', background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: 6, marginLeft: 4 }}>MESURE</span>
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
          {measured > 0 ? `${Math.round(pct)}% de votre objectif atteint` : 'En attente des donnees du bracelet'}
        </div>

        {/* Mini bar */}
        <div style={{ display: 'flex', gap: 2, height: 6, marginTop: 4 } as any}>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} style={{ flex: 1, borderRadius: 2, background: i < Math.round(pct / 5) ? '#10B981' : 'rgba(255,255,255,0.08)' } as any} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' } as any}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>0</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>{target.toLocaleString('fr-FR')}</span>
        </div>
      </div>
    </div>
  );
}

/* ════════ Recommendation card (small) ════════ */
function RecoCard({ data, icon, accent, label, unit, idx, onClick }: {
  data: any; icon: string; accent: string; label: string; unit: string; idx: number; onClick: () => void;
}) {
  const val = data.key === 'hydration' ? String(data.value).replace(/L$/i, '').trim() : data.value;
  return (
    <div data-testid={`objective-card-${data.key}`} className="dash-slide-up" onClick={onClick}
      style={{
        flex: 1, padding: '16px 14px', borderRadius: 18, cursor: 'pointer',
        background: 'rgba(20,20,32,0.75)',
        border: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        transition: 'transform 0.2s',
        animationDelay: `${idx * 0.08}s`,
      } as any}
      onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>

      {/* Icon */}
      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${accent}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
        <i className={icon} style={{ fontSize: 18, color: accent }} />
      </div>

      {/* Value */}
      <div style={{ textAlign: 'center' } as any}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 3 } as any}>
          <span style={{ fontSize: 24, fontWeight: 900, color: '#FFF', letterSpacing: -0.5, lineHeight: 1 }}>{val}</span>
          {unit && <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>{unit}</span>}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{label}</div>
      </div>

      {/* Tag */}
      <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Recommande</span>
    </div>
  );
}

/* ════════ Main export ════════ */
export function DailyObjectivesOnDashboard({ token }: { token: string }) {
  const router = useRouter();
  const [plan, setPlan] = React.useState<any[]>([]);
  const [measuredSteps, setMeasuredSteps] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([
      apiFetch('/api/health/daily-report', {}, token).then(d => {
        setPlan(d?.daily_plan || []);
        setMeasuredSteps(d?.data?.steps || 0);
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div style={{ padding: '12px 0', textAlign: 'center' } as any}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#A78BFA', animation: 'spin 0.8s linear infinite', margin: '0 auto' } as any} />
    </div>
  );
  if (!plan.length) return null;

  const stepsData = plan.find(p => p.key === 'steps');
  const recos = plan.filter(p => p.key !== 'steps' && p.key !== 'connect' && p.key !== 'stress');

  const recoConfig: Record<string, { icon: string; accent: string; label: string; unit: string; go: () => void }> = {
    calories_intake: { icon: 'fa-solid fa-fire-flame-curved', accent: '#F59E0B', label: 'Calories / jour', unit: 'kcal', go: () => router.push('/minceur' as any) },
    hydration: { icon: 'fa-solid fa-droplet', accent: '#22D3EE', label: 'Eau minimum', unit: 'L', go: () => router.push('/minceur' as any) },
    sleep: { icon: 'fa-solid fa-moon', accent: '#A78BFA', label: 'Heure de coucher', unit: '', go: () => router.push('/sleep' as any) },
  };

  return (
    <div data-testid="dashboard-objectives" style={{ marginBottom: 20 } as any}>
      <NoraPill />

      {/* Steps — measured */}
      {stepsData && <StepsCard data={stepsData} measured={measuredSteps} />}

      {/* Recommendations — 3 in a row */}
      <div style={{ display: 'flex', gap: 10 } as any}>
        {recos.map((p, i) => {
          const cfg = recoConfig[p.key];
          if (!cfg) return null;
          return <RecoCard key={p.key} data={p} icon={cfg.icon} accent={cfg.accent} label={cfg.label} unit={cfg.unit} idx={i} onClick={cfg.go} />;
        })}
      </div>
    </div>
  );
}
