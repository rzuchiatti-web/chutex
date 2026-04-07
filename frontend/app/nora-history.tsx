import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import NoraOverlay from '../src/components/dashboard/NoraOverlay';

const P = '#A78BFA', G = '#10B981', A = '#F59E0B', R = '#EF4444', B = '#38BDF8', CY = '#22D3EE';
const NORA_VIDEO = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4';

const CONTEXT_META: Record<string, { label: string; icon: string; color: string }> = {
  health: { label: 'Sante globale', icon: 'ri-heart-pulse-line', color: R },
  aging: { label: 'Age biologique', icon: 'ri-seedling-line', color: G },
  minceur: { label: 'Minceur', icon: 'ri-scales-3-line', color: A },
  activity: { label: 'Activite', icon: 'ri-run-line', color: CY },
  sleep: { label: 'Sommeil', icon: 'ri-moon-line', color: P },
  glycemia: { label: 'Glycémie', icon: 'ri-drop-line', color: R },
  heart_rate: { label: 'Rythme cardiaque', icon: 'ri-heart-line', color: R },
  spo2: { label: 'Oxygene', icon: 'ri-lungs-line', color: B },
  blood_pressure: { label: 'Tension', icon: 'ri-stethoscope-line', color: P },
  temperature: { label: 'Température', icon: 'ri-temp-hot-line', color: A },
  general: { label: 'Analyse generale', icon: 'ri-brain-line', color: P },
};

export default function NoraHistoryPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replayCtx, setReplayCtx] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    apiFetch('/api/nora/analysis-history?limit=30', {}, token)
      .then((data: any) => setAnalyses(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (Platform.OS !== 'web') return null;

  const groupedByDate: Record<string, any[]> = {};
  for (const a of analyses) {
    const d = a.date || 'Inconnu';
    if (!groupedByDate[d]) groupedByDate[d] = [];
    groupedByDate[d].push(a);
  }
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const formatDate = (d: string) => {
    try {
      const dt = new Date(d + 'T00:00:00');
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (d === todayStr) return "Aujourd'hui";
      if (d === yesterdayStr) return 'Hier';
      return dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch { return d; }
  };

  return (
    <div data-testid="nora-history-page" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#FFF' } as any}>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>

        {/* HEADER */}
        <div style={{ position: 'relative', zIndex: 1, minHeight: 160, background: '#000' } as any}>
          <div style={{ position: 'relative', zIndex: 2, padding: '70px 20px 50px', maxWidth: 480, margin: '0 auto' } as any}>
            <div data-testid="back-button" onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 } as any}>
              <video autoPlay loop muted playsInline style={{ width: 52, height: 52, borderRadius: 18, objectFit: 'contain', flexShrink: 0 } as any} src={NORA_VIDEO} />
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>Historique Nora</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{analyses.length} analyse{analyses.length !== 1 ? 's' : ''} sauvegardee{analyses.length !== 1 ? 's' : ''}</div>
              </div>
            </div>
          </div>
        </div>

        {/* WHITE CONTENT CARD */}
        <div style={{ padding: '24px 16px 120px', marginTop: -20, borderRadius: '24px 24px 0 0', background: '#FFF', position: 'relative', zIndex: 10, maxWidth: 480, margin: '-20px auto 0', width: '100%' } as any}>

          {loading && <div style={{ textAlign: 'center', padding: '60px 0' } as any}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: P, animation: 'spin 0.8s linear infinite', margin: '0 auto' } as any} /></div>}

          {!loading && analyses.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' } as any}>
              <i className="ri-brain-line" style={{ fontSize: 40, color: '#E5E7EB', display: 'block', marginBottom: 14 }} />
              <div style={{ fontSize: 16, fontWeight: 800, color: '#374151', marginBottom: 6 }}>Aucune analyse</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>Utilisez le bouton "Voir l'analyse de Nora" sur vos pages sante pour generer vos premieres analyses.</div>
            </div>
          )}

          {!loading && sortedDates.map(date => (
            <div key={date} style={{ marginBottom: 20 } as any}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, padding: '0 4px' }}>{formatDate(date)}</div>
              {groupedByDate[date].map((a: any, i: number) => {
                const meta = CONTEXT_META[a.context] || CONTEXT_META.general;
                const uid = `${a.context}_${a.date}_${i}`;
                const isExpanded = expanded === uid;
                return (
                  <div key={uid} data-testid={`analysis-card-${a.context}`} onClick={() => setExpanded(isExpanded ? null : uid)} style={{ padding: '14px 16px', borderRadius: 16, background: '#F4F4F5', marginBottom: 8, cursor: 'pointer', transition: 'background 0.15s' } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${meta.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                        <i className={meta.icon} style={{ fontSize: 18, color: meta.color }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 } as any}>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{meta.label}</div>
                        {!isExpanded && (
                          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{a.analysis?.slice(0, 80)}...</div>
                        )}
                      </div>
                      <i className={isExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: 18, color: '#9CA3AF', flexShrink: 0 }} />
                    </div>
                    {isExpanded && (
                      <div style={{ marginTop: 12 } as any}>
                        <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.75 }}>{a.analysis}</div>
                        <div data-testid={`replay-${a.context}`} onClick={(e: any) => { e.stopPropagation(); setReplayCtx(a.context); }} style={{ marginTop: 12, padding: '10px', borderRadius: 999, background: '#000', textAlign: 'center', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
                          <i className="ri-refresh-line" style={{ fontSize: 14, color: '#FFF' }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>Relancer l'analyse</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
      {replayCtx && <NoraOverlay token={token} endpoint={`/api/nora/analysis?context=${replayCtx}`} title={CONTEXT_META[replayCtx]?.label || 'Analyse'} subtitle="Analyse mise a jour par Nora" onClose={() => setReplayCtx(null)} />}
    </div>
  );
}
