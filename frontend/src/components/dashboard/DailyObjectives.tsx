import React from 'react';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';

const OBJECTIVE_IMAGES: Record<string, string> = {
  steps: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/h37k6apj_physical%20health%20analys%20app%20health%20Chutex.png',
  hydration: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/7s8stuxi_hydratation.png',
  sleep: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/tide9bdl_Moon%20sleep%20analys%20app%20health%20Chutex.png',
  calories_intake: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/y3xje768_traitement.png',
};

interface ObjectiveCardProps {
  objKey: string;
  value: string;
  unit: string;
  label: string;
  pct?: number;
  isDark: boolean;
  onClick: () => void;
}

function ObjectiveCard({ objKey, value, unit, label, pct, isDark, onClick }: ObjectiveCardProps) {
  const cardBg = isDark ? 'rgba(60,60,70,0.7)' : 'rgba(255,255,255,0.82)';
  const cardBorder = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)';
  const textColor = isDark ? '#FFF' : '#1A1A2E';
  const subColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';
  const sepColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';
  const imgSrc = OBJECTIVE_IMAGES[objKey];

  return (
    <div data-testid={`objective-card-${objKey}`} className="dash-slide-up" onClick={onClick}
      style={{
        padding: '18px 20px', borderRadius: 18, cursor: 'pointer',
        background: cardBg,
        border: cardBorder,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', gap: 16,
        transition: 'transform 0.2s, background 0.3s',
        marginBottom: 10,
        position: 'relative',
      } as any}
      onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>

      {imgSrc && (
        <img src={imgSrc} alt="" style={{ width: 44, height: 44, objectFit: 'contain', flexShrink: 0 } as any} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 } as any}>
        <span style={{ fontSize: 26, fontWeight: 900, color: textColor, letterSpacing: -0.5, lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 13, fontWeight: 600, color: subColor, marginTop: 4 }}>{unit}</span>}
      </div>

      <div style={{ width: 1, height: 32, background: sepColor, flexShrink: 0 } as any} />

      <div style={{ flex: 1, textAlign: 'right' } as any}>
        <div style={{ fontSize: 15, fontWeight: 700, color: textColor }}>{label}</div>
        {typeof pct === 'number' && (
          <div style={{ fontSize: 22, fontWeight: 900, color: textColor, marginTop: 2 }}>{Math.round(pct)}%</div>
        )}
      </div>

      {typeof pct === 'number' && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderRadius: '0 0 18px 18px', overflow: 'hidden' } as any}>
          <div style={{ height: '100%', width: `${pct}%`, background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', transition: 'width 1s ease' } as any} />
        </div>
      )}
    </div>
  );
}

/* Main export */
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

  const titleColor = isDark ? '#FFF' : '#1A1A2E';
  const subTitleColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';

  const objectiveConfigs: Record<string, { label: string; unit: string; route: string }> = {
    steps: { label: 'Activite physique', unit: 'Pas', route: '/metric-detail' },
    hydration: { label: 'Hydratation', unit: 'Litre', route: '/minceur' },
    sleep: { label: 'Endormissement', unit: 'Heure', route: '/sleep' },
    calories_intake: { label: 'Apport calorique', unit: 'Kcal', route: '/minceur' },
  };

  return (
    <div data-testid="dashboard-objectives" style={{ marginBottom: 20 } as any}>
      <div className="dash-slide-up" style={{ marginBottom: 16 } as any}>
        <div style={{ fontSize: 18, fontWeight: 900, color: titleColor, letterSpacing: -0.3, transition: 'color 0.3s' }}>Objectifs journalier</div>
        <div style={{ fontSize: 12, color: subTitleColor, marginTop: 4, transition: 'color 0.3s' }}>Voici vos objectifs du jour</div>
      </div>

      {plan.filter(p => p.key !== 'connect' && p.key !== 'stress').map((p, i) => {
        const cfg = objectiveConfigs[p.key];
        if (!cfg) return null;

        let displayValue = p.value;
        let pct: number | undefined;

        if (p.key === 'steps') {
          const target = parseInt(p.value) || 6000;
          displayValue = String(measuredSteps > 0 ? measuredSteps.toLocaleString('fr-FR') : p.value);
          pct = target > 0 ? Math.min(100, (measuredSteps / target) * 100) : undefined;
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
