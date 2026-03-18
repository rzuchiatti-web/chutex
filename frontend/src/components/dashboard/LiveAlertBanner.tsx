import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';

// Stage configuration
const STAGES = [
  { key: 'alert_triggered', label: 'Alerte', icon: 'ri-alarm-warning-line', color: '#EF4444' },
  { key: 'notifying_guardians', label: 'Notification', icon: 'ri-notification-3-line', color: '#F59E0B' },
  { key: 'ai_calling', label: 'Appel IA', icon: 'ri-phone-line', color: '#A78BFA' },
  { key: 'guardian_responding', label: 'Gardien', icon: 'ri-user-heart-line', color: '#38BDF8' },
  { key: 'intervention_active', label: 'Intervention', icon: 'ri-run-line', color: '#10B981' },
  { key: 'resolved', label: 'Resolue', icon: 'ri-check-double-line', color: '#10B981' },
];

const ALERT_TYPE_LABELS: Record<string, string> = {
  sos: 'SOS - URGENCE',
  fall: 'Chute detectee',
  health_anomaly: 'Anomalie sante',
  threshold: 'Seuil depasse',
  geofence: 'Sortie safe zone',
  geofence_exit: 'Sortie safe zone',
  manual_app: 'SOS Application',
  manual_bracelet: 'SOS Bracelet',
};

const STAGE_MESSAGES: Record<string, string> = {
  alert_triggered: 'Alerte en cours de traitement...',
  notifying_guardians: 'Les gardiens sont notifies',
  ai_calling: 'Appel IA au beneficiaire...',
  guardian_responding: 'Un gardien a pris en charge',
  intervention_active: 'Intervention en cours',
  resolved: 'Alerte resolue',
};

interface LiveStatus {
  alert_id: string;
  beneficiary_name: string;
  alert_type: string;
  current_stage: string;
  stages_completed: string[];
  timeline: Array<{ stage: string; timestamp: string; detail: string }>;
  eta_minutes?: number;
  intervenant_name?: string;
  intervenant_phone?: string;
}

export default function LiveAlertBanner({ token }: { token: string }) {
  const router = useRouter();
  const [liveStatuses, setLiveStatuses] = useState<LiveStatus[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pulse, setPulse] = useState(false);
  const pollRef = useRef<any>(null);

  const fetchLive = useCallback(async () => {
    try {
      const data = await apiFetch('/api/alerts/live-active', {}, token);
      if (Array.isArray(data)) setLiveStatuses(data);
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchLive();
    pollRef.current = setInterval(fetchLive, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchLive]);

  // Pulse animation
  useEffect(() => {
    const iv = setInterval(() => setPulse(p => !p), 1500);
    return () => clearInterval(iv);
  }, []);

  if (Platform.OS !== 'web' || liveStatuses.length === 0) return null;

  const getStageIndex = (key: string) => STAGES.findIndex(s => s.key === key);
  const timeSince = (iso: string) => {
    const ms = Date.now() - new Date(iso).getTime();
    const m = Math.floor(ms / 60000);
    if (m < 1) return "A l'instant";
    if (m < 60) return `Il y a ${m}min`;
    return `Il y a ${Math.floor(m / 60)}h${m % 60 > 0 ? `${m % 60}m` : ''}`;
  };

  return (
    <div data-testid="live-alert-banners" style={{ marginBottom: 14 }}>
      <style>{`
        @keyframes laPulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes laSlideIn { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes laGlow { 0%,100% { box-shadow: 0 0 12px rgba(239,68,68,0.3); } 50% { box-shadow: 0 0 24px rgba(239,68,68,0.6); } }
        @keyframes laProgressPulse { 0%,100% { opacity:0.7; } 50% { opacity:1; } }
        .la-banner { animation: laSlideIn 0.4s ease-out, laGlow 3s ease-in-out infinite; }
        .la-pulse-dot { animation: laPulse 1.5s ease-in-out infinite; }
        .la-progress-active { animation: laProgressPulse 2s ease-in-out infinite; }
      `}</style>

      {liveStatuses.map((ls) => {
        const currentIdx = getStageIndex(ls.current_stage);
        const isExpanded = expanded === ls.alert_id;
        const alertLabel = ALERT_TYPE_LABELS[ls.alert_type] || 'Alerte';
        const stageMsg = STAGE_MESSAGES[ls.current_stage] || ls.current_stage;
        const stageColor = STAGES[currentIdx]?.color || '#EF4444';
        const firstEvent = ls.timeline?.[0];
        const timeStr = firstEvent ? timeSince(firstEvent.timestamp) : '';

        return (
          <div key={ls.alert_id} className="la-banner" data-testid={`live-alert-${ls.alert_id}`} style={{
            borderRadius: 22,
            overflow: 'hidden',
            marginBottom: 10,
            background: 'linear-gradient(145deg, rgba(20,20,35,0.97), rgba(10,10,20,0.98))',
            border: `1px solid ${stageColor}30`,
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          }}>
            {/* Main bar - always visible */}
            <div onClick={() => setExpanded(isExpanded ? null : ls.alert_id)} style={{
              padding: '14px 16px 12px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 12,
            } as any}>
              {/* Icon with pulse ring */}
              <div style={{ position: 'relative', flexShrink: 0 } as any}>
                <div style={{
                  width: 44, height: 44, borderRadius: 14,
                  background: `${stageColor}20`,
                  border: `2px solid ${stageColor}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                } as any}>
                  <i className={STAGES[currentIdx]?.icon || 'ri-alarm-warning-line'} style={{ fontSize: 20, color: stageColor }} />
                </div>
                <div className="la-pulse-dot" style={{
                  position: 'absolute', top: -2, right: -2,
                  width: 12, height: 12, borderRadius: 6,
                  background: stageColor,
                  border: '2px solid rgba(10,10,20,0.95)',
                } as any} />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 } as any}>
                  <span style={{ fontSize: 9, fontWeight: 800, color: stageColor, letterSpacing: 1.2, textTransform: 'uppercase' }}>{alertLabel}</span>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>{timeStr}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', lineHeight: 1.2, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } as any}>
                  {ls.beneficiary_name}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
                  {stageMsg}
                </div>
              </div>

              {/* Right side: ETA or arrow */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 } as any}>
                {ls.intervenant_name && (
                  <div style={{ padding: '3px 8px', borderRadius: 99, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' } as any}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#10B981' }}>{ls.intervenant_name}</span>
                  </div>
                )}
                <i className={isExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: 18, color: 'rgba(255,255,255,0.35)' }} />
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ padding: '0 16px 10px', display: 'flex', gap: 3 } as any}>
              {STAGES.map((stage, idx) => {
                const isCompleted = ls.stages_completed?.includes(stage.key);
                const isCurrent = ls.current_stage === stage.key;
                return (
                  <div key={stage.key} style={{
                    flex: 1, height: 4, borderRadius: 2,
                    background: isCompleted ? stageColor : 'rgba(255,255,255,0.08)',
                    opacity: isCurrent ? 1 : (isCompleted ? 0.8 : 0.3),
                    transition: 'all 0.5s ease',
                  } as any} className={isCurrent ? 'la-progress-active' : ''} />
                );
              })}
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div style={{
                padding: '0 16px 14px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                animation: 'laSlideIn 0.3s ease-out',
              }}>
                {/* Stage detail chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px 0 10px' } as any}>
                  {STAGES.map((stage, idx) => {
                    const isCompleted = ls.stages_completed?.includes(stage.key);
                    const isCurrent = ls.current_stage === stage.key;
                    return (
                      <div key={stage.key} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '5px 10px', borderRadius: 99,
                        background: isCurrent ? `${stage.color}20` : isCompleted ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isCurrent ? `${stage.color}40` : isCompleted ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}`,
                        opacity: isCompleted || isCurrent ? 1 : 0.4,
                      } as any}>
                        <i className={stage.icon} style={{ fontSize: 11, color: isCompleted || isCurrent ? stage.color : 'rgba(255,255,255,0.3)' }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: isCompleted || isCurrent ? '#FFF' : 'rgba(255,255,255,0.3)' }}>{stage.label}</span>
                        {isCompleted && !isCurrent && <i className="ri-check-line" style={{ fontSize: 10, color: '#10B981' }} />}
                      </div>
                    );
                  })}
                </div>

                {/* Timeline */}
                {ls.timeline && ls.timeline.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Chronologie</div>
                    {ls.timeline.slice(-4).map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 } as any}>
                        <div style={{ width: 6, height: 6, borderRadius: 3, background: stageColor, marginTop: 5, flexShrink: 0 } as any} />
                        <div style={{ flex: 1 } as any}>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>{t.detail}</span>
                          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginLeft: 8 }}>
                            {new Date(t.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8 } as any}>
                  <div
                    data-testid={`live-alert-follow-${ls.alert_id}`}
                    onClick={(e: any) => { e.stopPropagation(); router.push({ pathname: '/alert-detail', params: { alertId: ls.alert_id } }); }}
                    style={{
                      flex: 1, padding: '11px 12px', borderRadius: 14,
                      background: `${stageColor}15`,
                      border: `1px solid ${stageColor}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      cursor: 'pointer',
                    } as any}
                  >
                    <i className="ri-route-line" style={{ fontSize: 15, color: stageColor }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>Suivre</span>
                  </div>
                  {ls.intervenant_phone && (
                    <div
                      data-testid={`live-alert-call-${ls.alert_id}`}
                      onClick={(e: any) => { e.stopPropagation(); Linking.openURL(`tel:${ls.intervenant_phone}`); }}
                      style={{
                        flex: 1, padding: '11px 12px', borderRadius: 14,
                        background: 'rgba(16,185,129,0.12)',
                        border: '1px solid rgba(16,185,129,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        cursor: 'pointer',
                      } as any}
                    >
                      <i className="ri-phone-line" style={{ fontSize: 15, color: '#10B981' }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>Appeler</span>
                    </div>
                  )}
                  <div
                    data-testid={`live-alert-accept-${ls.alert_id}`}
                    onClick={async (e: any) => {
                      e.stopPropagation();
                      try {
                        await apiFetch('/api/interventions/accept-as-guardian', {
                          method: 'POST',
                          body: JSON.stringify({ alert_id: ls.alert_id }),
                        }, token);
                        fetchLive();
                      } catch {}
                    }}
                    style={{
                      flex: 1, padding: '11px 12px', borderRadius: 14,
                      background: 'rgba(239,68,68,0.12)',
                      border: '1px solid rgba(239,68,68,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      cursor: 'pointer',
                    } as any}
                  >
                    <i className="ri-alarm-warning-line" style={{ fontSize: 15, color: '#EF4444' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>Intervenir</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
