import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import FullScreenLoader from '../src/components/FullScreenLoader';

const BG_RED = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
const G: any = { borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };
const TYPE_LABELS: any = { manual_app: 'Bouton SOS (application)', manual_bracelet: 'Pression manuelle (bracelet)', health_anomaly: 'Anomalie de sante', fall: 'Chute detectee (gilet)', sos: 'Bouton SOS', threshold: 'Depassement de seuil' };
const TYPE_ICONS: any = { manual_app: 'ri-hand-heart-line', manual_bracelet: 'ri-remote-control-line', health_anomaly: 'ri-pulse-line', fall: 'ri-walk-line', sos: 'ri-hand-heart-line', threshold: 'ri-alert-line' };
const STATUS_LABELS: any = { active: 'Active', intervention: 'En cours d\'intervention', resolved: 'Resolue' };
const STATUS_COLORS: any = { active: '#EF4444', intervention: '#F59E0B', resolved: '#10B981' };

function MapEmbed({ lat, lng, ivLat, ivLng, benName, ivName }: any) {
  if (Platform.OS !== 'web' || !lat) return null;
  const markers = ivLat && ivLng
    ? `L.marker([${lat},${lng}],{icon:L.divIcon({className:'',html:'<div style="background:#EF4444;color:#FFF;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;border:2px solid #FFF;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${(benName||'B').charAt(0)}</div>'})}).addTo(map);L.marker([${ivLat},${ivLng}],{icon:L.divIcon({className:'',html:'<div style="background:#7C3AED;color:#FFF;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;border:2px solid #FFF;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${(ivName||'I').charAt(0)}</div>'})}).addTo(map);L.polyline([[${ivLat},${ivLng}],[${lat},${lng}]],{color:'#7C3AED',weight:3,dashArray:'8,8'}).addTo(map);map.fitBounds([[${lat},${lng}],[${ivLat},${ivLng}]],{padding:[30,30]});`
    : `L.marker([${lat},${lng}],{icon:L.divIcon({className:'',html:'<div style="background:#EF4444;color:#FFF;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;border:2px solid #FFF;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${(benName||'B').charAt(0)}</div>'})}).addTo(map);map.setView([${lat},${lng}],14);`;
  const html = `<!DOCTYPE html><html><head><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script><style>body{margin:0}#map{width:100%;height:100%}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false});L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{attribution:''}).addTo(map);${markers}<\/script></body></html>`;
  return <div style={{ height: 180, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' } as any}><iframe srcDoc={html} style={{ width: '100%', height: '100%', border: 'none' } as any} /></div>;
}

export default function AlertDetailScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showReport, setShowReport] = useState(false);
  const [reportAnswers, setReportAnswers] = useState<Record<string, string>>({});
  const [reportText, setReportText] = useState('');

  const load = useCallback(async () => {
    try { setData(await apiFetch(`/api/alerts/${alertId}/detail`, {}, token)); }
    catch {} finally { setLoading(false); }
  }, [alertId, token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 8000); return () => clearInterval(t); }, [load]);

  if (Platform.OS !== 'web') return <View style={{ flex: 1, backgroundColor: '#000' }}><Text style={{ color: '#FFF', padding: 20 }}>Web uniquement</Text></View>;
  if (loading) return <FullScreenLoader />;
  if (!data?.alert) return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,0.3)' }}>Alerte non trouvee</Text></View>;

  const a = data.alert;
  const ben = data.beneficiary || {};
  const guards = data.guardians || [];
  const ivs = data.interventions || [];
  const timeline = data.timeline || [];
  const loc = a.location || data.location || {};
  const incident = data.incident || {};
  const status = (ivs.length > 0 || incident.assigned_guardian) && a.status === 'active' ? 'intervention' : a.status;
  const sc = STATUS_COLORS[status] || '#EF4444';
  // Find assigned intervenant from interventions OR incident
  const assignedIv = ivs.find((iv: any) => iv.status === 'accepted' || iv.status === 'en_route' || iv.status === 'on_site' || iv.status === 'pending_acceptance')
    || (incident.assigned_guardian ? { intervenant_name: incident.assigned_guardian.name, intervenant_id: incident.assigned_guardian.id, intervenant_phone: incident.assigned_guardian.phone, status: 'accepted', id: incident.id } : null);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG_RED} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 16px 100px', WebkitOverflowScrolling: 'touch' } as any}>

        {/* Back + Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 } as any}>
          <div onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, ...G, cursor: 'pointer' } as any}>
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
          {/* Anomaly data */}
          {a.alert_type === 'health_anomaly' && a.threshold_data && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.12)' } as any}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#EF4444' }}>Donnee declencheur</div>
              <div style={{ fontSize: 14, color: '#FFF', fontWeight: 700, marginTop: 4 }}>{a.threshold_data.metric} : {a.threshold_data.value} {a.threshold_data.unit || ''}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Seuil configure : {a.threshold_data.threshold_max || a.threshold_data.threshold_min}</div>
            </div>
          )}
        </div>

        {/* Vitals - 2x2 grid same as dashboard */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 } as any}>
          {[
            { val: ben.heart_rate || '72', unit: 'bpm', label: 'Rythme cardiaque', icon: 'ri-heart-pulse-line', color: '#EF4444' },
            { val: ben.spo2 || '97', unit: '%', label: 'Saturation O2', icon: 'ri-drop-line', color: '#6366F1' },
            { val: ben.blood_pressure ? `${ben.blood_pressure.systolic}/${ben.blood_pressure.diastolic}` : '125/78', unit: 'mmHg', label: 'Tension', icon: 'ri-water-flash-line', color: '#8B5CF6' },
            { val: ben.temperature || '36.6', unit: '°C', label: 'Temperature', icon: 'ri-temp-hot-line', color: '#F59E0B' },
          ].map((v, i) => (
            <div key={i} style={{ ...G, padding: '12px 14px' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 } as any}>
                <i className={v.icon} style={{ fontSize: 12, color: v.color }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>{v.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 } as any}>
                <span style={{ fontSize: 24, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{v.val}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{v.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Beneficiary info */}
        <div style={{ ...G, padding: '16px', marginBottom: 12 } as any}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Beneficiaire</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 } as any}>
            <div style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#38BDF8' }}>{ben.name?.charAt(0)}</span></div>
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{ben.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{ben.date_of_birth} - {ben.gender}</div>
            </div>
            {ben.phone && <a href={`tel:${ben.phone}`} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', cursor: 'pointer' } as any}><i className="ri-phone-line" style={{ fontSize: 18, color: '#10B981' }} /></a>}
          </div>
          {[
            ben.phone && { icon: 'ri-phone-line', label: 'Telephone', value: ben.phone },
            ben.address && { icon: 'ri-map-pin-line', label: 'Adresse', value: ben.address },
            ben.blood_type && { icon: 'ri-drop-line', label: 'Groupe sanguin', value: ben.blood_type },
            ben.medical_conditions && { icon: 'ri-heart-pulse-line', label: 'Pathologies', value: ben.medical_conditions },
            ben.allergies && { icon: 'ri-alert-line', label: 'Allergies', value: ben.allergies },
            ben.emergency_contact_name && { icon: 'ri-phone-line', label: 'Contact urgence', value: `${ben.emergency_contact_name} (${ben.emergency_contact_phone})` },
          ].filter(Boolean).map((item: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderTop: '1px solid rgba(255,255,255,0.04)' } as any}>
              <i className={item.icon} style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }} />
              <div style={{ flex: 1 } as any}><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>{item.label}</div><div style={{ fontSize: 12, color: '#FFF', fontWeight: 500 }}>{item.value}</div></div>
            </div>
          ))}
        </div>

        {/* Guardians - clickable cards */}
        <div style={{ ...G, padding: '16px', marginBottom: 12 } as any}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Gardiens ({guards.length})</div>
          {guards.map((g: any, i: number) => (
            <div key={g.id || i} onClick={() => router.push({ pathname: '/guardian-detail' as any, params: { guardianId: g.id } })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 6, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' } as any}>
              <div style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 14, fontWeight: 800, color: '#10B981' }}>{g.name?.charAt(0)}</span></div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{g.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{g.relationship || g.guardian_type} - {g.phone}</div>
              </div>
              <div style={{ display: 'flex', gap: 6 } as any}>
                {g.phone && <a href={`tel:${g.phone}`} onClick={(e: any) => e.stopPropagation()} style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' } as any}><i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981' }} /></a>}
                <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.15)' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Assigned Intervenant - clickable card */}
        {assignedIv && (
          <div onClick={() => { if (assignedIv.intervenant_id || assignedIv.assigned_to) router.push({ pathname: '/guardian-detail' as any, params: { guardianId: assignedIv.intervenant_id || assignedIv.assigned_to } }); }} style={{ ...G, padding: '16px', marginBottom: 12, borderColor: 'rgba(124,92,255,0.2)', cursor: 'pointer' } as any}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Intervenant assigne</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
              <div style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(124,92,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#A78BFA' }}>{(assignedIv.intervenant_name || 'I').charAt(0)}</span></div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>{assignedIv.intervenant_name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{assignedIv.status === 'accepted' ? 'Intervention acceptee' : assignedIv.status === 'en_route' ? 'En route' : assignedIv.status === 'on_site' ? 'Sur place' : assignedIv.status}</div>
                {assignedIv.intervenant_profile?.structure_name && <div style={{ fontSize: 10, color: 'rgba(167,139,250,0.6)', marginTop: 2 }}>{assignedIv.intervenant_profile.structure_name}</div>}
              </div>
              {(assignedIv.intervenant_phone || assignedIv.intervenant_profile?.phone) && <a href={`tel:${assignedIv.intervenant_phone || assignedIv.intervenant_profile?.phone}`} onClick={(e: any) => e.stopPropagation()} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' } as any}><i className="ri-phone-line" style={{ fontSize: 16, color: '#10B981' }} /></a>}
              <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.15)' }} />
            </div>
          </div>
        )}

        {/* Teleassistance status - when CARE_DISPATCHED but no intervention yet */}
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

        {/* No Care subscription info */}
        {a.teleassistance_status === 'no_care_subscription' && (
          <div style={{ ...G, padding: '14px 16px', marginBottom: 12 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
              <i className="ri-information-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} />
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Pas d'abonnement Chutex Care actif. La teleassistance vocale IA n'est pas disponible. Seuls les gardiens ont ete notifies par SMS et push.</div>
            </div>
          </div>
        )}

        {/* Carte de localisation - au dessus de la chronologie */}
        {loc.latitude && (
          <div style={{ marginBottom: 12 } as any}>
            <MapEmbed lat={loc.latitude} lng={loc.longitude} ivLat={assignedIv?.location?.latitude} ivLng={assignedIv?.location?.longitude} benName={ben.name} ivName={assignedIv?.intervenant_name} />
          </div>
        )}

        {/* Timeline - redesigned */}
        <div style={{ ...G, padding: '18px', marginBottom: 12 } as any}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 } as any}>
            <i className="ri-time-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />Chronologie
          </div>
          {timeline.map((ev: any, i: number) => {
            const evIcon = ev.icon || 'ri-checkbox-blank-circle-line';
            const evColor = ev.color || 'rgba(255,255,255,0.3)';
            const time = ev.time ? new Date(ev.time) : null;
            return (
              <div key={i} style={{ display: 'flex', gap: 14 } as any}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28 } as any}>
                  <div style={{ width: 28, height: 28, borderRadius: 10, background: `${evColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                    <i className={evIcon} style={{ fontSize: 13, color: evColor }} />
                  </div>
                  {i < timeline.length - 1 && <div style={{ width: 2, flex: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0', borderRadius: 1 } as any} />}
                </div>
                <div style={{ flex: 1, paddingBottom: i < timeline.length - 1 ? 16 : 0 } as any}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#FFF', lineHeight: 1.4 }}>{ev.detail}</div>
                  {time && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>{time.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} a {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Slide to track intervention */}
        {assignedIv && a.status === 'active' && (
          <div onClick={() => router.push({ pathname: '/intervention-map' as any, params: { interventionId: assignedIv.id || '', alertId: a.id } })} style={{ ...G, padding: '16px', marginBottom: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 } as any}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(124,92,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-map-pin-range-line" style={{ fontSize: 20, color: '#A78BFA' }} /></div>
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Suivre l'intervention</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{assignedIv.intervenant_name} - {assignedIv.status === 'en_route' ? 'En route' : 'Sur place'}</div>
            </div>
            <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: 'rgba(255,255,255,0.3)' }} />
          </div>
        )}

        {/* Resolution report (if closed) */}
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

        {/* Actions - Clôture avec rapport */}
        {a.status === 'active' && !showReport && (
          <div onClick={() => setShowReport(true)} style={{ padding: '16px', borderRadius: 14, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#10B981', marginBottom: 12 } as any}>Cloturer l'alerte</div>
        )}

        {/* Report form */}
        {showReport && (() => {
          const isBen = user?.role === 'beneficiary' || user?.active_role === 'beneficiary';
          const questions = isBen ? [
            { id: 'reason', label: 'Pourquoi cloturez-vous cette alerte ?', options: ['Fausse alerte / Erreur de manipulation', 'Je vais bien, pas besoin d\'aide', 'L\'aide est deja arrivee', 'Autre raison'] },
          ] : [
            { id: 'situation', label: 'La situation est-elle maitrisee ?', options: ['Oui, situation resolue', 'Partiellement, surveillance necessaire', 'Non, necessite un suivi'] },
            { id: 'actions', label: 'Actions realisees', options: ['Levee de doute telephonique', 'Intervention physique au domicile', 'Contact avec les secours (SAMU/Pompiers)', 'Contact avec le medecin traitant', 'Aucune action necessaire'] },
            { id: 'condition', label: 'Etat du beneficiaire', options: ['Stable - pas de blessure', 'Blessure legere - soins apportes', 'Necessitant un suivi medical', 'Hospitalisation necessaire'] },
          ];
          const allAnswered = questions.every(q => reportAnswers[q.id]);
          return (
            <div style={{ ...G, padding: '18px', marginBottom: 12 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as any}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{isBen ? 'Cloturer l\'alerte' : 'Rapport de cloture'}</div>
                <div onClick={() => setShowReport(false)} style={{ width: 28, height: 28, borderRadius: 999, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} /></div>
              </div>
              {questions.map((q, qi) => (
                <div key={q.id} style={{ marginBottom: 14 } as any}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 8 }}>{qi + 1}. {q.label} <span style={{ color: '#EF4444' }}>*</span></div>
                  {q.options.map((opt, oi) => (
                    <div key={oi} onClick={() => setReportAnswers({ ...reportAnswers, [q.id]: opt })} style={{ padding: '11px 14px', borderRadius: 12, marginBottom: 5, cursor: 'pointer', background: reportAnswers[q.id] === opt ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${reportAnswers[q.id] === opt ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', gap: 10 } as any}>
                      <div style={{ width: 18, height: 18, borderRadius: 999, border: `2px solid ${reportAnswers[q.id] === opt ? '#FFF' : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>{reportAnswers[q.id] === opt && <div style={{ width: 9, height: 9, borderRadius: 999, background: '#FFF' }} />}</div>
                      <span style={{ fontSize: 13, color: '#FFF' }}>{opt}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ marginBottom: 14 } as any}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 6 }}>{isBen ? 'Un commentaire ?' : 'Notes supplementaires'}</div>
                <textarea value={reportText} onChange={(e: any) => setReportText(e.target.value)} placeholder="Optionnel..." rows={3} style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box' } as any} />
              </div>
              <div onClick={async () => {
                if (!allAnswered) return;
                try {
                  await apiFetch(`/api/alerts/${alertId}/resolve`, { method: 'PUT', body: JSON.stringify({ answers: { ...reportAnswers, notes: reportText, closed_by: user?.name, closed_at: new Date().toISOString() }, notes: reportText }) }, token);
                  setShowReport(false); load();
                } catch (e: any) { Alert.alert('Erreur', e.message); }
              }} style={{ padding: '14px', borderRadius: 999, cursor: allAnswered ? 'pointer' : 'not-allowed', background: allAnswered ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${allAnswered ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}`, textAlign: 'center', fontSize: 14, fontWeight: 700, color: allAnswered ? '#10B981' : 'rgba(255,255,255,0.2)' } as any}>
                {allAnswered ? 'Confirmer la cloture' : 'Repondez aux questions'}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
