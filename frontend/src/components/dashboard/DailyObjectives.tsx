import React from 'react';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';
import { HEALTH_IMAGES, REMINDER_IMAGES } from './constants';

const NORA_VIDEO_URL = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4';
const IMG_KCAL = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/385muol8_img_kcal.png';

const OBJ_IMAGES: Record<string, string> = {
  calories_intake: IMG_KCAL,
  hydration: REMINDER_IMAGES.hydration,
  steps: HEALTH_IMAGES.physical,
  sleep: HEALTH_IMAGES.sleep,
};

function NoraPill() {
  return (
    <div className="dash-slide-up" style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 } as any}>
      <div data-testid="nora-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#000', borderRadius: 999, padding: '6px 16px 6px 6px', boxShadow: '0 4px 20px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.18)' } as any}>
        <video src={NORA_VIDEO_URL} autoPlay loop muted playsInline style={{ width: 28, height: 28, borderRadius: 14, objectFit: 'cover' } as any} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#FFF', letterSpacing: -0.2 }}>Nora · Voici vos objectifs journaliers</span>
      </div>
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

  if (loading) return <div style={{ padding: '12px 0', textAlign: 'center' } as any}><div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.04)', borderTopColor: '#0F766E', animation: 'spin 0.8s linear infinite', margin: '0 auto' } as any} /></div>;
  if (!plan.length) return null;

  const items = plan.filter((p: any) => p.key !== 'connect' && p.key !== 'stress');
  return (
    <div data-testid="dashboard-objectives" style={{ marginBottom: 20 } as any}>
      <NoraPill />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as any}>
        {items.map((p: any, idx: number) => {
          const objImg = OBJ_IMAGES[p.key];
          const isHydration = p.key === 'hydration';
          const isCalories = p.key === 'calories_intake';
          const isSteps = p.key === 'steps';
          const isSleep = p.key === 'sleep';
          const displayValue = isHydration ? String(p.value).replace(/L$/i, '').trim() : p.value;
          const displayUnit = isHydration ? 'L' : isCalories ? 'kcal' : isSleep ? '' : p.unit;
          const displayLabel = isCalories ? 'Calories' : isHydration ? 'Hydratation' : isSteps ? 'Pas' : isSleep ? 'Coucher' : p.label;
          const accentColor = isSteps ? '#10B981' : isCalories ? '#F59E0B' : isHydration ? '#22D3EE' : isSleep ? '#A78BFA' : (p.color || '#888');
          return (
            <div key={p.key} data-testid={`objective-card-${p.key}`} className="dash-slide-up" onClick={() => {
              if (p.key === 'steps') router.push({ pathname: '/metric-detail' as any, params: { key: 'steps' } });
              else if (p.key === 'sleep') router.push('/sleep' as any);
              else if (p.key === 'calories_intake') router.push('/minceur' as any);
              else if (p.key === 'hydration') router.push('/minceur' as any);
            }} style={{
              padding: '14px 14px 12px', borderRadius: 18,
              background: 'var(--card-bg, #EDEDF0)',
              backdropFilter: 'var(--card-blur, none)', WebkitBackdropFilter: 'var(--card-blur, none)', border: 'var(--card-border, none)',
              cursor: 'pointer', transition: 'transform 0.18s',
              animationDelay: `${idx * 0.08}s`,
              display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', overflow: 'hidden',
            } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: accentColor, opacity: 0.7 } as any} />
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--card-sub, rgba(0,0,0,0.3))', textTransform: 'uppercase', letterSpacing: 0.8 }}>{displayLabel}</div>
              </div>
              {objImg && <img src={objImg} alt="" style={{ width: 44, height: 44, objectFit: 'contain', alignSelf: 'center' } as any} />}
              {!objImg && (
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' } as any}>
                  <i className={p.icon} style={{ fontSize: 22, color: accentColor }} />
                </div>
              )}
              <div style={{ textAlign: 'center' } as any}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 3 } as any}>
                  <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--card-text, #111)', letterSpacing: -0.5 }}>{displayValue}</span>
                  {displayUnit && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--card-sub, rgba(0,0,0,0.35))' }}>{displayUnit}</span>}
                </div>
                {isSteps && p.progress != null && (
                  <div style={{ width: '80%', height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.06)', marginTop: 6, overflow: 'hidden', margin: '6px auto 0' } as any}>
                    <div style={{ height: 4, borderRadius: 2, width: `${Math.min(100, p.progress)}%`, background: accentColor, transition: 'width 1s ease' } as any} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
