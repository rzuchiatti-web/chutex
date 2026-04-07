import React from 'react';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';

const NORA_VIDEO = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4';

const OBJECTIVE_IMAGES: Record<string, string> = {
  steps: 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/75gbxosw_physique.png',
  hydration: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/7s8stuxi_hydratation.png',
  sleep: 'https://customer-assets.emergentagent.com/job_92308143-f99e-4bad-8264-e3775a214313/artifacts/xtzgjs5s_sommeil.png',
  calories_intake: 'https://customer-assets.emergentagent.com/job_f20b5ded-706f-42e2-b747-5a8188991e2d/artifacts/93sgbdqq_kcal_icon.svg',
};

/* ════════ Objectifs journalier header card ════════ */
function ObjectivesHeader({ isDark }: { isDark: boolean }) {
  return (
    <div data-testid="objectives-header-card" className="dash-slide-up" style={{
      padding: '20px', borderRadius: 20, marginBottom: 12,
      background: '#000',
      border: '1px solid rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      overflow: 'hidden', position: 'relative',
    } as any}>
      {/* Subtle glow top-left */}
      <div style={{ position: 'absolute', top: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,160,140,0.15) 0%, transparent 70%)', pointerEvents: 'none' } as any} />
      <div style={{ flex: 1, zIndex: 2 } as any}>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Objectifs journalier</div>
        <div style={{ width: '100%', height: 2, background: '#FFF', marginTop: 12, marginBottom: 14, borderRadius: 1 } as any} />
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, marginBottom: 4 }}>
          Vous etes en excellente sante aujourd'hui, voici vos objectifs journalier.
        </div>
      </div>
      <div style={{ width: 90, height: 90, flexShrink: 0, borderRadius: 16, overflow: 'hidden', position: 'relative', zIndex: 2 } as any}>
        <video src={NORA_VIDEO} autoPlay loop muted playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 } as any} />
      </div>
    </div>
  );
}

/* ════════ Segmented progress bar for steps ════════ */
function SegmentedBar({ pct, isDark }: { pct: number; isDark: boolean }) {
  const segments = 4;
  const filledSegments = Math.ceil((pct / 100) * segments);
  const filledColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
  const emptyColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 } as any}>
      <div style={{ display: 'flex', gap: 4, flex: 1 } as any}>
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i < filledSegments ? filledColor : emptyColor,
            transition: 'background 0.3s',
          } as any} />
        ))}
      </div>
      <span style={{ fontSize: 18, fontWeight: 900, color: isDark ? '#FFF' : '#1A1A2E', flexShrink: 0, minWidth: 45, textAlign: 'right' }}>{Math.round(pct)}%</span>
    </div>
  );
}

/* ════════ Single objective card ════════ */
function ObjectiveCard({ objKey, value, unit, label, pct, isDark, onClick }: {
  objKey: string; value: string; unit: string; label: string; pct?: number; isDark: boolean; onClick: () => void;
}) {
  const cardBg = isDark ? 'rgba(70,70,78,0.85)' : '#E8E8EA';
  const cardBorder = isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.04)';
  const textColor = isDark ? '#FFF' : '#1A1A2E';
  const subColor = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)';
  const sepColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
  const imgSrc = OBJECTIVE_IMAGES[objKey];
  const hasProgress = objKey === 'steps' && typeof pct === 'number';

  return (
    <div data-testid={`objective-card-${objKey}`} className="dash-slide-up" onClick={onClick}
      style={{
        padding: '16px 18px', borderRadius: 16, cursor: 'pointer',
        background: cardBg,
        border: cardBorder,
        display: 'flex', flexDirection: 'column',
        transition: 'transform 0.2s, background 0.3s',
        marginBottom: 8,
      } as any}
      onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>

      <div style={{ display: 'flex', alignItems: 'center' } as any}>
        {imgSrc && (
          <img src={imgSrc} alt="" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0, marginRight: 14 } as any} />
        )}

        <div style={{ display: 'flex', flexDirection: 'column' } as any}>
          <span style={{ fontSize: 28, fontWeight: 900, color: textColor, letterSpacing: -0.5, lineHeight: 1 }}>{value}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: subColor, marginTop: 2 }}>{unit}</span>
        </div>

        <div style={{ width: 1, height: 36, background: sepColor, flexShrink: 0, margin: '0 16px' } as any} />

        <div style={{ flex: 1, textAlign: 'right' } as any}>
          <div style={{ fontSize: 15, fontWeight: 700, color: textColor }}>{label}</div>
        </div>
      </div>

      {hasProgress && <SegmentedBar pct={pct} isDark={isDark} />}
    </div>
  );
}

/* ════════ Main export ════════ */
export function DailyObjectivesOnDashboard({ token, isDark = true }: { token: string; isDark?: boolean }) {
  const router = useRouter();
  const [plan, setPlan] = React.useState<any[]>([]);
  const [measuredSteps, setMeasuredSteps] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    apiFetch('/api/health/daily-report', {}, token).then(d => {
      setPlan(d?.daily_plan || []);
      setMeasuredSteps(d?.data?.steps || 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div style={{ padding: '12px 0', textAlign: 'center' } as any}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderTopColor: '#A78BFA', animation: 'spin 0.8s linear infinite', margin: '0 auto' } as any} />
    </div>
  );
  if (!plan.length) return null;

  const objectiveConfigs: Record<string, { label: string; unit: string; route: string }> = {
    steps: { label: 'Activité physique', unit: 'Pas', route: '/metric-detail' },
    hydration: { label: 'Hydratation', unit: 'Litre', route: '/minceur' },
    sleep: { label: 'Endormissement', unit: 'Heure', route: '/sleep' },
    calories_intake: { label: 'Apport calorique', unit: 'Kcal', route: '/minceur' },
  };

  return (
    <div data-testid="dashboard-objectives" style={{ marginBottom: 16 } as any}>
      <ObjectivesHeader isDark={isDark} />

      {plan.filter(p => p.key !== 'connect' && p.key !== 'stress')
        .sort((a, b) => {
          const order: Record<string, number> = { steps: 0, hydration: 1, sleep: 2, calories_intake: 3 };
          return (order[a.key] ?? 99) - (order[b.key] ?? 99);
        })
        .map((p) => {
        const cfg = objectiveConfigs[p.key];
        if (!cfg) return null;

        let displayValue = p.value;
        let pct: number | undefined;

        if (p.key === 'steps') {
          const target = parseInt(p.value) || 6000;
          displayValue = String(measuredSteps > 0 ? measuredSteps.toLocaleString('fr-FR') : p.value);
          pct = target > 0 ? Math.min(100, (measuredSteps / target) * 100) : 0;
        } else if (p.key === 'hydration') {
          displayValue = String(p.value).replace(/L$/i, '').trim();
        }

        return (
          <ObjectiveCard
            key={p.key}
            objKey={p.key}
            value={displayValue}
            unit={cfg.unit}
            label={cfg.label}
            pct={pct}
            isDark={isDark}
            onClick={() => {
              if (p.key === 'steps') {
                router.push({ pathname: '/metric-detail' as any, params: { key: 'steps' } });
              } else {
                router.push(cfg.route as any);
              }
            }}
          />
        );
      })}
    </div>
  );
}
