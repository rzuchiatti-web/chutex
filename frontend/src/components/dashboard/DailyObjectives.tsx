import React from 'react';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';

const NORA_VIDEO_URL = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4';

function NoraPill() {
  return (
    <div className="dash-slide-up" style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 } as any}>
      <div data-testid="nora-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.5)', borderRadius: 999, padding: '6px 16px 6px 6px', boxShadow: '0 4px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.18)' } as any}>
        <video src={NORA_VIDEO_URL} autoPlay loop muted playsInline style={{ width: 28, height: 28, borderRadius: 14, objectFit: 'cover' } as any} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#FFF', letterSpacing: -0.2 }}>Nora · Voici vos objectifs journaliers</span>
      </div>
    </div>
  );
}

/* ──── Card config ──── */
const CFG: Record<string, { icon: string; label: string; unit: string; target: number; tUnit: string; accent: string; gFrom: string; gTo: string }> = {
  calories_intake: { icon: 'fa-solid fa-fire-flame-curved', label: 'Calories', unit: '/Kcal', target: 2230, tUnit: '/Kcal', accent: '#C8D84C', gFrom: 'rgba(180,200,50,0.22)', gTo: 'rgba(30,30,30,0.9)' },
  hydration:       { icon: 'fa-solid fa-droplet',           label: 'Hydratation', unit: 'L', target: 2, tUnit: 'L', accent: '#22D3EE', gFrom: 'rgba(34,211,238,0.18)', gTo: 'rgba(30,30,30,0.9)' },
  steps:           { icon: 'fa-solid fa-shoe-prints',       label: 'Pas', unit: 'pas', target: 10000, tUnit: 'pas', accent: '#34D399', gFrom: 'rgba(52,211,153,0.18)', gTo: 'rgba(30,30,30,0.9)' },
  sleep:           { icon: 'fa-solid fa-moon',              label: 'Coucher', unit: '', target: 8, tUnit: 'h', accent: '#A78BFA', gFrom: 'rgba(167,139,250,0.18)', gTo: 'rgba(30,30,30,0.9)' },
};

/* ──── Thick segmented bar ──── */
function ThickBar({ pct, color }: { pct: number; color: string }) {
  const N = 28;
  const filled = Math.round(Math.min(1, Math.max(0, pct / 100)) * N);
  return (
    <div data-testid="segmented-bar" style={{ display: 'flex', gap: 3, width: '100%', height: 28 } as any}>
      {Array.from({ length: N }).map((_, i) => (
        <div key={i} style={{
          flex: 1, borderRadius: 3,
          background: i < filled ? color : 'rgba(255,255,255,0.08)',
          opacity: i < filled ? 1 : 0.6,
          transition: 'background 0.4s',
        } as any} />
      ))}
    </div>
  );
}

/* ──── Single card ──── */
function ObjCard({ d, c, i, go }: { d: any; c: typeof CFG[string]; i: number; go: () => void }) {
  const isSleep = d.key === 'sleep';
  const raw = d.key === 'hydration' ? parseFloat(String(d.value).replace(/L$/i, '').trim()) : (isSleep ? 0 : (parseFloat(d.value) || 0));
  const pct = isSleep ? (d.progress || 75) : (c.target > 0 ? (raw / c.target) * 100 : 0);
  const val = isSleep ? d.value : (d.key === 'hydration' ? raw.toFixed(1) : Math.round(raw).toLocaleString('fr-FR'));

  return (
    <div data-testid={`objective-card-${d.key}`} className="dash-slide-up" onClick={go}
      style={{
        padding: '20px 18px 16px', borderRadius: 22, cursor: 'pointer',
        background: `linear-gradient(145deg, ${c.gFrom}, ${c.gTo})`,
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        display: 'flex', flexDirection: 'column', gap: 6,
        transition: 'transform 0.2s, box-shadow 0.2s',
        animationDelay: `${i * 0.08}s`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      } as any}
      onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.4), 0 0 20px ${c.accent}15`; }}
      onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'; }}>

      {/* Top: icon + label | target */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${c.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
            <i className={c.icon} style={{ fontSize: 13, color: c.accent }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.65)' }}>{c.label}</span>
        </div>
        <div style={{ textAlign: 'right' } as any}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>{c.target.toLocaleString('fr-FR')}<span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}>{c.tUnit}</span></div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Objectif</div>
        </div>
      </div>

      {/* Big value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '4px 0 2px' } as any}>
        <span style={{ fontSize: 36, fontWeight: 900, color: '#FFF', letterSpacing: -1.5, lineHeight: 1 }}>{val}</span>
        {c.unit && <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.4)' }}>{c.unit}</span>}
      </div>

      {/* Range */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: -2 } as any}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>0</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{c.target.toLocaleString('fr-FR')}</span>
      </div>

      {/* Bar */}
      <ThickBar pct={Math.min(100, pct)} color={c.accent} />
    </div>
  );
}

export function DailyObjectivesOnDashboard({ token }: { token: string }) {
  const router = useRouter();
  const [plan, setPlan] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    apiFetch('/api/health/daily-report', {}, token)
      .then(d => setPlan(d?.daily_plan || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div style={{ padding: '12px 0', textAlign: 'center' } as any}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#A78BFA', animation: 'spin 0.8s linear infinite', margin: '0 auto' } as any} />
    </div>
  );
  if (!plan.length) return null;

  const items = plan.filter((p: any) => p.key !== 'connect' && p.key !== 'stress');
  const nav: Record<string, () => void> = {
    steps: () => router.push({ pathname: '/metric-detail' as any, params: { key: 'steps' } }),
    sleep: () => router.push('/sleep' as any),
    calories_intake: () => router.push('/minceur' as any),
    hydration: () => router.push('/minceur' as any),
  };

  return (
    <div data-testid="dashboard-objectives" style={{ marginBottom: 20 } as any}>
      <NoraPill />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 } as any}>
        {items.map((p: any, i: number) => {
          const c = CFG[p.key];
          if (!c) return null;
          return <ObjCard key={p.key} d={p} c={c} i={i} go={nav[p.key] || (() => {})} />;
        })}
      </div>
    </div>
  );
}
