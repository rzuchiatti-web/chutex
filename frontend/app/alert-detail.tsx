import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import FullScreenLoader from '../src/components/FullScreenLoader';
import MapEmbed from '../src/components/alert/MapEmbed';
import VitalsGrid from '../src/components/alert/VitalsGrid';
import BeneficiaryCard from '../src/components/alert/BeneficiaryCard';
import GuardiansCard from '../src/components/alert/GuardiansCard';
import IntervenantCard from '../src/components/alert/IntervenantCard';
import AlertTimeline from '../src/components/alert/AlertTimeline';
import ReportModal from '../src/components/alert/ReportModal';
import NativePageView from '../src/components/NativePageView';

const BG_RED = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
const G: any = { borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };
const TYPE_LABELS: any = { manual_app: 'Bouton SOS (application)', manual_bracelet: 'Pression manuelle (bracelet)', health_anomaly: 'Anomalie de sante', fall: 'Chute detectee (gilet)', sos: 'Bouton SOS', threshold: 'Depassement de seuil', geofence: 'Sortie de safe zone', geofence_exit: 'Sortie de safe zone' };
const TYPE_ICONS: any = { manual_app: 'ri-hand-heart-line', manual_bracelet: 'ri-remote-control-line', health_anomaly: 'ri-pulse-line', fall: 'ri-walk-line', sos: 'ri-hand-heart-line', threshold: 'ri-alert-line', geofence: 'ri-map-pin-range-line', geofence_exit: 'ri-map-pin-range-line' };
const STATUS_LABELS: any = { active: 'Active', intervention: 'En cours d\'intervention', resolved: 'Resolue' };
const STATUS_COLORS: any = { active: '#EF4444', intervention: '#F59E0B', resolved: '#10B981' };

export default function AlertDetailScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);

  const load = useCallback(async () => {
    try { setData(await apiFetch(`/api/alerts/${alertId}/detail`, {}, token)); }
    catch {} finally { setLoading(false); }
  }, [alertId, token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 8000); return () => clearInterval(t); }, [load]);

  if (Platform.OS !== 'web') return <NativePageView path="/alert-detail" />;
  if (!data || !data.alert) return loading ? <FullScreenLoader /> : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, system-ui, sans-serif' } as any}>Alerte introuvable</div>;

  const a = data.alert;
  const ben = data.beneficiary || {};
  const guards = data.guardians || [];
  const ivs = data.interventions || [];
  const timeline = data.timeline || [];
  const loc = a.location || data.location || {};
  const incident = data.incident || {};
  const status = (ivs.length > 0 || incident.assigned_guardian) && a.status === 'active' ? 'intervention' : a.status;
  const sc = STATUS_COLORS[status] || '#EF4444';
  const assignedIv = ivs.find((iv: any) => iv.status === 'accepted' || iv.status === 'en_route' || iv.status === 'on_site' || iv.status === 'pending_acceptance')
    || (incident.assigned_guardian ? { intervenant_name: incident.assigned_guardian.name, intervenant_id: incident.assigned_guardian.id, intervenant_phone: incident.assigned_guardian.phone, status: 'accepted', id: incident.id } : null);

  return (
    <div data-testid="alert-detail-page" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG_RED} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 16px 100px', WebkitOverflowScrolling: 'touch' } as any}>
        {/* Back + Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 } as any}>
          <div data-testid="alert-detail-back" onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, ...G, cursor: 'pointer' } as any}>
            <i className="ri-arrow-left-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Retour</span>
          </div>
          <div style={{ padding: '6px 14px', borderRadius: 999, background: `${sc}18`, border: `1px solid ${sc}35` } as any}>
            <span style={{ fontSize: 11, fontWeight: 700, color: sc }}>{STATUS_LABELS[status] || status}</span>
          </div>
        </div>

        {/* Alert Header */}
        <div style={{ ...G, padding: '18px', marginBottom: 12 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 } as any}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: `${sc}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
              <i className={TYPE_ICONS[a.alert_type] || 'ri-alarm-warning-line'} style={{ fontSize: 22, color: sc }} />
            </div>
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{TYPE_LABELS[a.alert_type] || a.alert_type}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                {new Date(a.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} a {new Date(a.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
          {a.alert_type === 'health_anomaly' && a.threshold_data && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)' } as any}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#EF4444' }}>Donnee declencheur</div>
              <div style={{ fontSize: 14, color: '#FFF', fontWeight: 700, marginTop: 4 }}>{a.threshold_data.metric} : {a.threshold_data.value} {a.threshold_data.unit || ''}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Seuil configure : {a.threshold_data.threshold_max || a.threshold_data.threshold_min}</div>
            </div>
          )}
        </div>

        <VitalsGrid ben={ben} />
        <BeneficiaryCard ben={ben} />
        <GuardiansCard guards={guards} />
        <IntervenantCard assignedIv={assignedIv} alertId={a.id} />

        {/* Teleassistance search state */}
        {!assignedIv && a.teleassistance_status === 'CARE_DISPATCHED' && (
          <div style={{ ...G, padding: '16px', marginBottom: 12, borderColor: 'rgba(245,158,11,0.15)' } as any}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Recherche d'intervenant</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <div style={{ width: 20, height: 20, borderRadius: 999, border: '2px solid #F59E0B', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' } as any} />
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>En cours de recherche</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Aucun gardien disponible. Recherche d'un intervenant professionnel dans la SAAD la plus proche.</div>
              </div>
            </div>
          </div>
        )}

        {/* No Care subscription */}
        {a.teleassistance_status === 'no_care_subscription' && (
          <div style={{ ...G, padding: '14px 16px', marginBottom: 12 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
              <i className="ri-information-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} />
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Pas d'abonnement Chutex Care actif. La teleassistance vocale IA n'est pas disponible. Seuls les gardiens ont ete notifies par SMS et push.</div>
            </div>
          </div>
        )}

        {/* Resolution report */}
        {a.status === 'resolved' && (a.resolution_report || a.report) && (
          <div style={{ ...G, padding: '16px', marginBottom: 12 } as any}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#10B981', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 } as any}>
              <i className="ri-file-text-line" style={{ fontSize: 16 }} />Rapport de cloture
            </div>
            {Object.entries(a.resolution_report || a.report || {}).filter(([k]) => k !== 'closed_at').map(([k, v]: any) => (
              <div key={k} style={{ padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.04)' } as any}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: 2 }}>{k === 'reason' ? 'Raison' : k === 'situation' ? 'Situation' : k === 'actions' ? 'Actions' : k === 'condition' ? 'Etat du beneficiaire' : k === 'notes' ? 'Notes' : k === 'closed_by' ? 'Cloturee par' : k === 'closed_by_role' ? 'Role' : k}</div>
                <div style={{ fontSize: 13, color: '#FFF', fontWeight: 500 }}>{String(v)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Close button */}
        {a.status === 'active' && !showReport && (
          <div data-testid="close-alert-btn" onClick={() => setShowReport(true)} style={{ padding: '16px', borderRadius: 14, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#10B981', marginBottom: 12 } as any}>Cloturer l'alerte</div>
        )}

        {/* Map */}
        {loc.latitude && (
          <div style={{ marginBottom: 12 } as any}>
            <MapEmbed lat={loc.latitude} lng={loc.longitude} ivLat={assignedIv?.location?.latitude} ivLng={assignedIv?.location?.longitude} benName={ben.name} ivName={assignedIv?.intervenant_name} />
          </div>
        )}

        <AlertTimeline timeline={timeline} />

        {showReport && <ReportModal alertId={alertId!} user={user} token={token!} onClose={() => setShowReport(false)} onReload={load} />}
      </div>
    </div>
  );
}
