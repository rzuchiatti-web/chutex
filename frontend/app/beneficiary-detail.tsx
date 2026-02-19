import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const BG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';
const BG_AI = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/v6obzpez_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_28_20.png';

/* ── Minimal bar chart using CSS ── */
const MiniBar = ({ values, color }: { values: number[], color: string }) => {
  if (!values || values.length === 0) return null;
  const max = Math.max(...values, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 40 } as any}>
      {values.slice(-12).map((v, i) => (
        <div key={i} style={{ flex: 1, borderRadius: '3px 3px 0 0', background: `${color}${i === values.length - 1 ? 'ff' : '60'}`, height: `${Math.max(8, (v / max) * 100)}%`, minWidth: 6 } as any} />
      ))}
    </div>
  );
};

/* ── Section header ── */
const SectionTitle = ({ icon, title, sub }: { icon: string; title: string; sub?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 6 } as any}>
    <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
      <i className={icon} style={{ fontSize: 18, color: '#FFF' }} />
    </div>
    <div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{sub}</div>}
    </div>
  </div>
);

/* ── Glass card ── */
const GCard = ({ children, style }: any) => (
  <div style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', marginBottom: 10, ...style } as any}>
    {children}
  </div>
);

export default function BeneficiaryDetailScreen() {
  const { beneficiaryId } = useLocalSearchParams<{ beneficiaryId: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
  const [aiReport, setAiReport] = useState<any>(null);
  const [devices, setDevices] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [alertsTab, setAlertsTab] = useState<'active' | 'history'>('active');

  const fetchAll = useCallback(async () => {
    try {
      const [bens, alts, hist, report, devs] = await Promise.all([
        apiFetch('/api/guardian/beneficiaries', {}, token).catch(() => []),
        apiFetch(`/api/guardian/beneficiary/${beneficiaryId}/alerts`, {}, token).catch(() => []),
        apiFetch(`/api/guardian/beneficiary/${beneficiaryId}/vitals-history`, {}, token).catch(() => []),
        apiFetch(`/api/guardian/beneficiary/${beneficiaryId}/ai-report`, {}, token).catch(() => null),
        apiFetch(`/api/guardian/beneficiary/${beneficiaryId}/devices`, {}, token).catch(() => null),
      ]);
      setData((bens || []).find((b: any) => b.id === beneficiaryId) || null);
      setAlerts(Array.isArray(alts) ? alts : []);
      setVitalsHistory(Array.isArray(hist) ? hist : []);
      setAiReport(report);
      setDevices(devs);
    } catch {} finally { setLoading(false); }
  }, [beneficiaryId, token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#FFF" /></SafeAreaView>;
  if (!data) return <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,0.5)' }}>Bénéficiaire non trouvé</Text></SafeAreaView>;
  if (Platform.OS !== 'web') return <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}><Text style={{ color: '#FFF', padding: 20 }}>{data.name}</Text></SafeAreaView>;

  const v = data.latest_vitals || {};
  const activeAlerts = alerts.filter((a: any) => a.status === 'active' || a.status === 'pending');
  const historyAlerts = alerts.filter((a: any) => a.status !== 'active' && a.status !== 'pending');
  const displayedAlerts = alertsTab === 'active' ? activeAlerts : historyAlerts;

  // Vitals history by type
  const hrHistory = vitalsHistory.map((h: any) => h.heart_rate || 0).filter(Boolean);
  const spo2History = vitalsHistory.map((h: any) => h.spo2 || 0).filter(Boolean);
  const stepsHistory = vitalsHistory.map((h: any) => h.steps || 0).filter(Boolean);

  const age = data.date_of_birth ? Math.floor((Date.now() - new Date(data.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365)) : null;

  // Alert color
  const alertColor = (type: string) => ({ fall: '#EF4444', sos: '#EF4444', heart_rate: '#F59E0B', spo2: '#3B82F6', inactivity: '#A78BFA', default: '#6B7280' }[type] || '#6B7280');
  const alertIcon = (type: string) => ({ fall: 'ri-run-line', sos: 'ri-alarm-warning-line', heart_rate: 'ri-heart-pulse-line', spo2: 'ri-drop-line', inactivity: 'ri-time-line', default: 'ri-alert-line' }[type] || 'ri-alert-line');

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 } as any} />

      {/* ── Header ── */}
      <div style={{ position: 'relative', zIndex: 10, padding: '16px 20px 0' } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
          <div onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}>
            <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} />
          </div>
          <div style={{ flex: 1 } as any}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF' }}>{data.name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
              {age ? `${age} ans` : ''}{data.address ? (age ? ` · ${data.address}` : data.address) : ''}
            </div>
          </div>
          {/* Call button */}
          {data.phone && (
            <a href={`tel:${data.phone}`} style={{ textDecoration: 'none' }}>
              <div style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                <i className="ri-phone-line" style={{ fontSize: 20, color: '#10B981' }} />
              </div>
            </a>
          )}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>

        {/* ── 1. VITAUX RAPIDES ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 } as any}>
          {[
            { icon: 'ri-heart-pulse-line', label: 'Fréq. cardiaque', val: v.heart_rate ? `${v.heart_rate} bpm` : '--', color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
            { icon: 'ri-drop-line', label: 'SpO2', val: v.spo2 ? `${v.spo2}%` : '--', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
            { icon: 'ri-footprint-line', label: 'Pas aujourd\'hui', val: v.steps ? v.steps.toLocaleString('fr-FR') : '--', color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
            { icon: 'ri-temp-hot-line', label: 'Température', val: v.temperature ? `${v.temperature}°C` : '--', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
          ].map((kpi, i) => (
            <div key={i} style={{ padding: '12px 14px', borderRadius: 18, background: kpi.bg, border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 } as any}>
                <i className={kpi.icon} style={{ fontSize: 14, color: kpi.color }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{kpi.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: kpi.color }}>{kpi.val}</div>
            </div>
          ))}
        </div>

        {/* Tension artérielle */}
        {(v.blood_pressure_systolic || v.blood_pressure_diastolic) && (
          <GCard style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
              <i className="ri-pulse-line" style={{ fontSize: 18, color: '#A78BFA' }} />
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Tension artérielle</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#A78BFA' }}>{v.blood_pressure_systolic || '--'}/{v.blood_pressure_diastolic || '--'} <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>mmHg</span></div>
              </div>
            </div>
          </GCard>
        )}

        {/* ── 2. ALERTES ── */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0 16px' } as any} />
        <SectionTitle icon="ri-alarm-warning-line" title="Alertes" sub={`${activeAlerts.length} active${activeAlerts.length > 1 ? 's' : ''} · ${historyAlerts.length} dans l'historique`} />

        {/* Tabs */}
        <div style={{ display: 'inline-flex', borderRadius: 999, padding: 3, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 12 } as any}>
          {[{ k: 'active', label: `Actives (${activeAlerts.length})` }, { k: 'history', label: `Historique (${historyAlerts.length})` }].map(t => (
            <div key={t.k} onClick={() => setAlertsTab(t.k as any)} style={{ padding: '7px 16px', borderRadius: 999, cursor: 'pointer', fontSize: 11, fontWeight: 700, background: alertsTab === t.k ? '#FFF' : 'transparent', color: alertsTab === t.k ? '#111' : 'rgba(255,255,255,0.7)', transition: 'all 0.2s', whiteSpace: 'nowrap' } as any}>
              {t.label}
            </div>
          ))}
        </div>

        {displayedAlerts.length === 0 && (
          <GCard><div style={{ textAlign: 'center', padding: '10px 0', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{alertsTab === 'active' ? 'Aucune alerte active' : 'Aucun historique'}</div></GCard>
        )}

        {displayedAlerts.map((alert: any) => (
          <div key={alert.id} onClick={() => setSelectedAlert(selectedAlert?.id === alert.id ? null : alert)} style={{ padding: '14px 16px', borderRadius: 18, background: `${alertColor(alert.alert_type)}12`, border: `1px solid ${alertColor(alert.alert_type)}30`, marginBottom: 8, cursor: 'pointer', backdropFilter: 'blur(8px)' } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: `${alertColor(alert.alert_type)}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className={alertIcon(alert.alert_type)} style={{ fontSize: 18, color: alertColor(alert.alert_type) }} />
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{alert.message || alert.alert_type || 'Alerte'}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{new Date(alert.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 99, background: `${alertColor(alert.alert_type)}20`, flexShrink: 0 } as any}>
                <span style={{ width: 5, height: 5, borderRadius: 99, background: alertColor(alert.alert_type) } as any} />
                <span style={{ fontSize: 10, fontWeight: 700, color: alertColor(alert.alert_type) }}>{alert.status === 'active' ? 'Active' : alert.status === 'resolved' ? 'Résolue' : 'Clôturée'}</span>
              </div>
            </div>
            {/* Detail expandable */}
            {selectedAlert?.id === alert.id && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' } as any}>
                {alert.teleassistance_status && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}><i className="ri-headphone-line" style={{ marginRight: 6 }} />Téléassistance : {alert.teleassistance_status}</div>}
                {alert.care_provider && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}><i className="ri-user-star-line" style={{ marginRight: 6 }} />Intervenant : {alert.care_provider}</div>}
                {alert.vital_data && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' } as any}>
                    {Object.entries(alert.vital_data).slice(0, 4).map(([k, vl]: any) => (
                      <div key={k} style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(255,255,255,0.08)', fontSize: 11, color: '#FFF' } as any}>{k}: {vl}</div>
                    ))}
                  </div>
                )}
                <div onClick={(e: any) => { e.stopPropagation(); router.push({ pathname: '/alert-detail', params: { alertId: alert.id } }); }} style={{ marginTop: 10, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 } as any}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>Voir la fiche alerte complète</span>
                  <i className="ri-arrow-right-s-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* ── 3. SANTÉ & RAPPORT IA ── */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0 16px' } as any} />
        <SectionTitle icon="ri-heart-pulse-line" title="Santé" sub="Données en temps réel" />

        {/* Graphs vitaux */}
        {hrHistory.length > 0 && (
          <GCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } as any}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>Fréquence cardiaque</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#EF4444' }}>{hrHistory[hrHistory.length - 1]} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>bpm</span></div>
            </div>
            <MiniBar values={hrHistory} color="#EF4444" />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9, color: 'rgba(255,255,255,0.3)' } as any}>
              <span>Min: {Math.min(...hrHistory)}</span><span>Moy: {Math.round(hrHistory.reduce((a, b) => a + b, 0) / hrHistory.length)}</span><span>Max: {Math.max(...hrHistory)}</span>
            </div>
          </GCard>
        )}

        {spo2History.length > 0 && (
          <GCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } as any}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>Saturation O₂ (SpO2)</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#3B82F6' }}>{spo2History[spo2History.length - 1]}<span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>%</span></div>
            </div>
            <MiniBar values={spo2History} color="#3B82F6" />
          </GCard>
        )}

        {stepsHistory.length > 0 && (
          <GCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } as any}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>Activité (Pas)</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#10B981' }}>{stepsHistory[stepsHistory.length - 1].toLocaleString('fr-FR')} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>pas</span></div>
            </div>
            <MiniBar values={stepsHistory} color="#10B981" />
          </GCard>
        )}

        {/* Rapport IA — carte fond abstrait */}
        {aiReport?.recommendation && (
          <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', padding: '18px', marginBottom: 10 } as any}>
            <img src={BG_AI} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, filter: 'hue-rotate(180deg) saturate(1.2)' } as any} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,10,30,0.5)', zIndex: 1 } as any} />
            <div style={{ position: 'relative', zIndex: 2 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } as any}>
                <i className="ri-brain-line" style={{ fontSize: 18, color: '#A78BFA' }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: 0.8 }}>Rapport IA</div>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}>{aiReport.recommendation}</div>
              {aiReport.generated_at && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>Généré le {new Date(aiReport.generated_at).toLocaleDateString('fr-FR')}</div>}
            </div>
          </div>
        )}

        {/* Fallback if no vitals */}
        {hrHistory.length === 0 && !aiReport && (
          <GCard><div style={{ textAlign: 'center', padding: '10px 0', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Aucune donnée de santé disponible</div></GCard>
        )}

        {/* ── 4. DOSSIER MÉDICAL ── */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0 16px' } as any} />
        <SectionTitle icon="ri-file-medical-line" title="Dossier médical" />

        <GCard>
          {[
            data.blood_type && { icon: 'ri-drop-fill', label: 'Groupe sanguin', value: data.blood_type, color: '#EF4444' },
            data.date_of_birth && { icon: 'ri-calendar-line', label: 'Date de naissance', value: `${data.date_of_birth}${age ? ` (${age} ans)` : ''}` },
            data.gender && { icon: 'ri-user-line', label: 'Genre', value: data.gender },
            data.height_cm && { icon: 'ri-ruler-line', label: 'Taille / Poids', value: [data.height_cm && `${data.height_cm} cm`, data.weight_kg && `${data.weight_kg} kg`].filter(Boolean).join(' — ') || '--' },
          ].filter(Boolean).map((item: any, i: number, arr: any[]) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' } as any}>
              <i className={item.icon} style={{ fontSize: 14, color: item.color || 'rgba(255,255,255,0.4)', marginTop: 2, flexShrink: 0 }} />
              <div><div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{item.label}</div><div style={{ fontSize: 13, color: '#FFF' }}>{item.value}</div></div>
            </div>
          ))}
          {!data.blood_type && !data.date_of_birth && !data.gender && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '6px 0' }}>Informations générales non renseignées</div>}
        </GCard>

        {/* Pathologies & Allergies */}
        {data.medical_conditions && (
          <div style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 10 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 } as any}><i className="ri-heart-pulse-line" style={{ fontSize: 16, color: '#F59E0B' }} /><span style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 0.5 }}>Pathologies</span></div>
            <div style={{ fontSize: 13, color: '#FFF', lineHeight: 1.6 }}>{data.medical_conditions}</div>
          </div>
        )}
        {data.allergies && (
          <div style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 10 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 } as any}><i className="ri-alarm-warning-line" style={{ fontSize: 16, color: '#EF4444' }} /><span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: 0.5 }}>Allergies</span></div>
            <div style={{ fontSize: 13, color: '#FFF', lineHeight: 1.6 }}>{data.allergies}</div>
          </div>
        )}

        {/* Contacts médicaux */}
        {(data.doctor_name || data.emergency_contact_name) && (
          <GCard>
            {data.doctor_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: data.emergency_contact_name ? 12 : 0, borderBottom: data.emergency_contact_name ? '1px solid rgba(255,255,255,0.06)' : 'none' } as any}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(124,92,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-stethoscope-line" style={{ fontSize: 16, color: '#A78BFA' }} /></div>
                <div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>Médecin traitant</div><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{data.doctor_name}</div>{data.doctor_phone && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{data.doctor_phone}</div>}</div>
                {data.doctor_phone && <a href={`tel:${data.doctor_phone}`} style={{ textDecoration: 'none' }}><div style={{ width: 34, height: 34, borderRadius: 999, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-phone-line" style={{ fontSize: 15, color: '#10B981' }} /></div></a>}
              </div>
            )}
            {data.emergency_contact_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: data.doctor_name ? 12 : 0 } as any}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-shield-user-line" style={{ fontSize: 16, color: '#EF4444' }} /></div>
                <div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>Contact d'urgence</div><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{data.emergency_contact_name}</div>{data.emergency_contact_phone && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{data.emergency_contact_phone}</div>}</div>
                {data.emergency_contact_phone && <a href={`tel:${data.emergency_contact_phone}`} style={{ textDecoration: 'none' }}><div style={{ width: 34, height: 34, borderRadius: 999, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-phone-line" style={{ fontSize: 15, color: '#10B981' }} /></div></a>}
              </div>
            )}
          </GCard>
        )}

        {/* ── 5. APPAREILS ── */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0 16px' } as any} />
        <SectionTitle icon="ri-device-line" title="Appareils" sub="État et connectivité" />

        {[
          { key: 'bracelet', label: 'Bracelet Elio', icon: 'ri-pulse-line', color: '#10B981', data: devices?.bracelet || data.bracelet_data },
          { key: 'vest', label: 'Gilet Anti-Chute', icon: 'ri-shield-check-line', color: '#A78BFA', data: devices?.vest || data.vest_data },
        ].map((dev, i) => (
          <GCard key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 } as any}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: `${dev.color}15`, border: `1px solid ${dev.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className={dev.icon} style={{ fontSize: 20, color: dev.color }} />
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{dev.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 } as any}>
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: dev.data?.connected ? '#10B981' : 'rgba(255,255,255,0.25)' } as any} />
                  <span style={{ fontSize: 11, color: dev.data?.connected ? '#10B981' : 'rgba(255,255,255,0.4)' }}>{dev.data?.connected ? 'Connecté' : 'Non connecté'}</span>
                  {dev.data?.last_sync && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>· Synchro {new Date(dev.data.last_sync).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
                </div>
              </div>
              {/* Battery indicator */}
              {dev.data?.battery_level != null && (
                <div style={{ textAlign: 'right', flexShrink: 0 } as any}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: dev.data.battery_level > 30 ? '#10B981' : '#EF4444' }}>{dev.data.battery_level}%</div>
                  <div style={{ width: 40, height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginTop: 4 } as any}>
                    <div style={{ height: '100%', borderRadius: 99, background: dev.data.battery_level > 30 ? '#10B981' : '#EF4444', width: `${dev.data.battery_level}%` } as any} />
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2, textAlign: 'center' }}>Batterie</div>
                </div>
              )}
              {dev.data?.battery_level == null && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>-- %</div>}
            </div>
            {/* Extra device data */}
            {dev.data?.heart_rate > 0 && dev.key === 'bracelet' && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' } as any}>
                {dev.data.heart_rate > 0 && <div style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(239,68,68,0.1)', fontSize: 11, fontWeight: 700, color: '#EF4444' } as any}>{dev.data.heart_rate} bpm</div>}
                {dev.data.spo2 > 0 && <div style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(59,130,246,0.1)', fontSize: 11, fontWeight: 700, color: '#3B82F6' } as any}>SpO2 {dev.data.spo2}%</div>}
                {dev.data.steps > 0 && <div style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(16,185,129,0.1)', fontSize: 11, fontWeight: 700, color: '#10B981' } as any}>{dev.data.steps.toLocaleString('fr-FR')} pas</div>}
              </div>
            )}
          </GCard>
        ))}

        {/* ── 6. LOCALISATION ── */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0 16px' } as any} />
        <SectionTitle icon="ri-map-pin-line" title="Localisation" sub={data.address || 'Dernière position connue'} />

        {data.latitude && data.longitude ? (
          <div style={{ borderRadius: 20, overflow: 'hidden', marginBottom: 10, position: 'relative', height: 200 } as any}>
            <iframe
              title="map"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${data.longitude - 0.01},${data.latitude - 0.01},${data.longitude + 0.01},${data.latitude + 0.01}&layer=mapnik&marker=${data.latitude},${data.longitude}`}
              style={{ width: '100%', height: '100%', border: 'none' } as any}
            />
            <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, padding: '8px 12px', borderRadius: 12, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' } as any}>
              <div style={{ fontSize: 11, color: '#FFF', fontWeight: 600 }}>
                <i className="ri-map-pin-fill" style={{ color: '#EF4444', marginRight: 5 }} />
                {data.address || `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`}
              </div>
            </div>
          </div>
        ) : (
          <GCard><div style={{ textAlign: 'center', padding: '20px 0' } as any}><i className="ri-map-pin-off-line" style={{ fontSize: 32, color: 'rgba(255,255,255,0.15)' }} /><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>Localisation non disponible</div></div></GCard>
        )}

        {/* Zones */}
        {data.safe_zones && data.safe_zones.length > 0 && (
          <GCard>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Zones de confort</div>
            {data.safe_zones.map((z: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: i > 0 ? '8px 0 0' : '0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' } as any}>
                <i className="ri-map-pin-2-line" style={{ fontSize: 14, color: '#10B981' }} />
                <span style={{ fontSize: 13, color: '#FFF' }}>{z.name || z}</span>
              </div>
            ))}
          </GCard>
        )}

        {/* ── 7. ABONNEMENT ── */}
        {data.subscription_type && (
          <>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0 16px' } as any} />
            <SectionTitle icon="ri-vip-crown-line" title="Abonnement" />
            <GCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                <i className="ri-award-line" style={{ fontSize: 20, color: '#FFD700' }} />
                <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{data.subscription_type}</div>{data.subscription_start && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Depuis le {new Date(data.subscription_start).toLocaleDateString('fr-FR')}</div>}</div>
                <div style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(16,185,129,0.15)', fontSize: 10, fontWeight: 700, color: '#10B981' } as any}>Actif</div>
              </div>
            </GCard>
          </>
        )}
      </div>
    </div>
  );
}
