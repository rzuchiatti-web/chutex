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

/* ──── Segmented bar progress indicator ──── */
function SegmentedBar({ progress, accentColor, totalBars = 30 }: { progress: number; accentColor: string; totalBars?: number }) {
  const filled = Math.round(Math.min(1, Math.max(0, progress / 100)) * totalBars);
  return (
    <div data-testid="segmented-bar" style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 24, width: '100%' } as any}>
      {Array.from({ length: totalBars }).map((_, i) => {
        const isFilled = i < filled;
        const h = 18 + Math.sin(i * 0.3) * 4;
        return (
          <div key={i} style={{
            flex: 1, height: h, borderRadius: 2,
            background: isFilled ? accentColor : 'rgba(255,255,255,0.12)',
            opacity: isFilled ? (0.7 + (i / totalBars) * 0.3) : 0.5,
            transition: 'background 0.3s, opacity 0.3s',
          } as any} />
        );
      })}
    </div>
  );
}

/* ──── Objective card config ──── */
const CARD_CONFIG: Record<string, {
  icon: string; label: string; unit: string; target: number; targetUnit: string;
  accent: string; gradientFrom: string; gradientTo: string;
  secondaryLabel: string;
}> = {
  calories_intake: {
    icon: 'fa-solid fa-fire-flame-curved', label: 'Calories', unit: 'kcal', target: 2230, targetUnit: '/Kcal',
    accent: '#C8D84C', gradientFrom: 'rgba(180,200,50,0.15)', gradientTo: 'transparent',
    secondaryLabel: 'Dose journaliere',
  },
  hydration: {
    icon: 'fa-solid fa-droplet', label: 'Hydratation', unit: 'L', target: 2.0, targetUnit: 'L',
    accent: '#22D3EE', gradientFrom: 'rgba(34,211,238,0.12)', gradientTo: 'transparent',
    secondaryLabel: 'Objectif quotidien',
  },
  steps: {
    icon: 'fa-solid fa-shoe-prints', label: 'Pas', unit: 'pas', target: 10000, targetUnit: 'pas',
    accent: '#10B981', gradientFrom: 'rgba(16,185,129,0.12)', gradientTo: 'transparent',
    secondaryLabel: 'Objectif quotidien',
  },
  sleep: {
    icon: 'fa-solid fa-moon', label: 'Coucher', unit: '', target: 8, targetUnit: 'h',
    accent: '#A78BFA', gradientFrom: 'rgba(167,139,250,0.12)', gradientTo: 'transparent',
    secondaryLabel: 'Recommande',
  },
};

/* ──── Single objective card ──── */
function ObjectiveCard({ data, config, idx, onClick }: { data: any; config: typeof CARD_CONFIG[string]; idx: number; onClick: () => void }) {
  const isSleep = data.key === 'sleep';
  const rawValue = data.key === 'hydration' ? parseFloat(String(data.value).replace(/L$/i, '').trim()) : (isSleep ? 0 : (parseFloat(data.value) || 0));
  const progress = isSleep ? (data.progress || 75) : (config.target > 0 ? (rawValue / config.target) * 100 : (data.progress || 0));
  const displayValue = isSleep ? data.value : (data.key === 'hydration' ? rawValue.toFixed(1) : Math.round(rawValue).toLocaleString('fr-FR'));

  return (
    <div data-testid={`objective-card-${data.key}`} className="dash-slide-up" onClick={onClick}
      style={{
        padding: '18px 16px 14px', borderRadius: 20,
        background: `linear-gradient(135deg, ${config.gradientFrom}, rgba(30,30,48,0.85))`,
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
        cursor: 'pointer', transition: 'transform 0.18s',
        animationDelay: `${idx * 0.08}s`,
        display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden', position: 'relative',
      } as any}
      onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
      {/* Header: icon + label + target */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
          <i className={config.icon} style={{ fontSize: 14, color: config.accent, opacity: 0.8 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.3 }}>{config.label}</span>
        </div>
        <div style={{ textAlign: 'right' } as any}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>{config.target.toLocaleString('fr-FR')}{config.targetUnit}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{config.secondaryLabel}</div>
        </div>
      </div>

      {/* Large value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 } as any}>
        <span style={{ fontSize: 32, fontWeight: 900, color: '#FFF', letterSpacing: -1, lineHeight: 1 }}>{displayValue}</span>
        {config.unit && <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>{config.unit}</span>}
      </div>

      {/* Range labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: -4 } as any}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>0</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{config.target.toLocaleString('fr-FR')}</span>
      </div>

      {/* Segmented progress bar */}
      <SegmentedBar progress={Math.min(100, progress)} accentColor={config.accent} />
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
  const navMap: Record<string, () => void> = {
    steps: () => router.push({ pathname: '/metric-detail' as any, params: { key: 'steps' } }),
    sleep: () => router.push('/sleep' as any),
    calories_intake: () => router.push('/minceur' as any),
    hydration: () => router.push('/minceur' as any),
  };

  return (
    <div data-testid="dashboard-objectives" style={{ marginBottom: 20 } as any}>
      <NoraPill />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } as any}>
        {items.map((p: any, idx: number) => {
          const config = CARD_CONFIG[p.key];
          if (!config) return null;
          return <ObjectiveCard key={p.key} data={p} config={config} idx={idx} onClick={navMap[p.key] || (() => {})} />;
        })}
      </div>
    </div>
  );
}
