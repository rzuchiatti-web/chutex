import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const BG = 'https://customer-assets.emergentagent.com/job_19f6c899-022d-4e6d-bcf0-8571d24b1fb2/artifacts/xjd4c8ks_ChatGPT%20Image%2019%20f%C3%A9vr.%202026%2C%2017_54_27.png';
const BG_RED = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
const BG_GREEN = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/uvntv6me_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2008_31_33.png';

const IMG_HEART  = 'https://customer-assets.emergentagent.com/job_19f6c899-022d-4e6d-bcf0-8571d24b1fb2/artifacts/4os5ruyj_hearth%20red%20app%20healthbeat%20Chutex.png';
const IMG_SPO2   = 'https://customer-assets.emergentagent.com/job_19f6c899-022d-4e6d-bcf0-8571d24b1fb2/artifacts/byji5pya_spo2.png';
const IMG_TENS   = 'https://customer-assets.emergentagent.com/job_19f6c899-022d-4e6d-bcf0-8571d24b1fb2/artifacts/zsw7vqfm_tension.png';
const IMG_TEMP   = 'https://customer-assets.emergentagent.com/job_19f6c899-022d-4e6d-bcf0-8571d24b1fb2/artifacts/yw3z379s_physical%20health%20analys%20app%20health%20Chutex.png';

const IMG_BRACELET = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg';
const IMG_SCALE    = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/dwmw2i8r_Balance_connecte_Vita_chutex.svg';
const IMG_VEST     = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/ljh1zzu3_Gilet_Elder_airbag_Chutex.svg';

/* ── Animated ECG with CSS ── */
const AnimatedEcg = ({ bpm }: { bpm?: number }) => {
  const duration = bpm ? (60 / bpm).toFixed(2) : '0.8';
  return (
    <div style={{ width: '100%', height: 64, position: 'relative', overflow: 'hidden', margin: '8px 0' } as any}>
      <style>{`
        @keyframes ecg-slide {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .ecg-line {
          animation: ecg-slide ${duration}s linear infinite;
          display: flex;
          width: 200%;
        }
      `}</style>
      <div className="ecg-line">
        {[0, 1].map(k => (
          <svg key={k} viewBox="0 0 400 64" style={{ width: '50%', height: 64, flexShrink: 0 }}>
            <polyline
              points="0,32 30,32 40,32 48,12 54,52 58,6 64,58 68,32 90,32 100,32 108,20 114,44 118,28 122,32 150,32 158,16 164,48 168,8 174,56 178,32 200,32 210,32 218,22 224,42 228,26 232,32 260,32 268,14 274,50 278,10 284,54 288,32 310,32 320,32 328,20 334,44 338,28 342,32 370,32 380,32 388,22 394,42 398,32 400,32"
              fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        ))}
      </div>
    </div>
  );
};

/* Vital status pill */
const VitalStatus = ({ status }: { status: 'normal' | 'warning' | 'critical' }) => {
  const cfg = { normal: { color: '#10B981', bg: 'rgba(16,185,129,0.2)', label: 'Normal' }, warning: { color: '#F59E0B', bg: 'rgba(245,158,11,0.2)', label: 'À surveiller' }, critical: { color: '#EF4444', bg: 'rgba(239,68,68,0.2)', label: 'Anormal' } }[status];
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 99, background: cfg.bg, marginTop: 5 } as any}>
      <span style={{ width: 5, height: 5, borderRadius: 99, background: cfg.color } as any} />
      <span style={{ fontSize: 9, fontWeight: 700, color: cfg.color }}>{cfg.label}</span>
    </div>
  );
};

/* Battery bar */
const Battery = ({ level, label }: { level: number | null | undefined, label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', minWidth: 60 }}>{label}</span>
    <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' } as any}>
      {level != null && <div style={{ height: '100%', borderRadius: 99, background: level > 30 ? '#10B981' : '#EF4444', width: `${Math.min(level, 100)}%` } as any} />}
    </div>
    <span style={{ fontSize: 11, fontWeight: 700, color: level == null ? 'rgba(255,255,255,0.3)' : level > 30 ? '#10B981' : '#EF4444', minWidth: 34, textAlign: 'right' } as any}>{level != null ? `${level}%` : '--'}</span>
  </div>
);

const getAlertLabel = (type: string) => ({ fall: 'Chute détectée', sos: 'SOS déclenché', heart_rate: 'Anomalie cardiaque', spo2: 'SpO2 anormale', inactivity: 'Inactivité détectée', health: 'Anomalie santé' }[type] || type || 'Alerte');

const getVitalStatus = (type: string, val: any): 'normal' | 'warning' | 'critical' => {
  if (!val) return 'normal';
  if (type === 'hr') { if (val < 50 || val > 100) return 'critical'; if (val < 60 || val > 90) return 'warning'; return 'normal'; }
  if (type === 'spo2') { if (val < 90) return 'critical'; if (val < 95) return 'warning'; return 'normal'; }
  if (type === 'temp') { if (val > 38.5 || val < 35.5) return 'critical'; if (val > 37.5 || val < 36) return 'warning'; return 'normal'; }
  if (type === 'bp_sys') { if (val > 160 || val < 90) return 'critical'; if (val > 140 || val < 100) return 'warning'; return 'normal'; }
  return 'normal';
};

export default function BeneficiaryDetailScreen() {
  const { beneficiaryId } = useLocalSearchParams<{ beneficiaryId: string }>();
  const { token, user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [devices, setDevices] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [bens, alts, devs] = await Promise.all([
        apiFetch('/api/guardian/beneficiaries', {}, token).catch(() => []),
        apiFetch(`/api/guardian/beneficiary/${beneficiaryId}/alerts`, {}, token).catch(() => []),
        apiFetch(`/api/guardian/beneficiary/${beneficiaryId}/devices`, {}, token).catch(() => null),
      ]);
      setData((bens || []).find((b: any) => b.id === beneficiaryId) || null);
      setAlerts(Array.isArray(alts) ? alts : []);
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
  const bracelet = devices?.bracelet;
  const vest = devices?.vest;
  const scale = data.scale_data || null;
  const age = data.date_of_birth && !isNaN(new Date(data.date_of_birth).getTime()) ? Math.floor((Date.now() - new Date(data.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365)) : null;
  const r = user?.role || '';

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.52)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, WebkitOverflowScrolling: 'touch' } as any}>

        {/* ── HERO HEADER ── */}
        <div style={{ padding: '20px 20px 0', textAlign: 'center' } as any}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } as any}>
            <div onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 22, color: '#FFF' }} /></div>
            <div style={{ flex: 1, padding: '0 12px' } as any}>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', letterSpacing: -0.5 }}>{data.name}</div>
              {data.address && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 3, lineHeight: 1.4 }}>{data.address}</div>}
            </div>
            {data.phone ? (
              <a href={`tel:${data.phone}`} style={{ textDecoration: 'none' }}>
                <div style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-phone-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
              </a>
            ) : <div style={{ width: 44 }} />}
          </div>
          {/* BPM géant */}
          {v.heart_rate && <div style={{ fontSize: 88, fontWeight: 900, color: '#FFF', lineHeight: 1, letterSpacing: -4 }}>{v.heart_rate}</div>}
          {v.heart_rate && <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', fontWeight: 500, marginTop: 2 }}>bpm</div>}
          {/* ECG animé pleine largeur */}
          <AnimatedEcg bpm={v.heart_rate} />
        </div>

        {/* ── ALERTE ACTIVE — carte identique à la page alertes ── */}
        {activeAlerts.length > 0 && (
          <div style={{ padding: '4px 16px 0' } as any}>
            {activeAlerts.slice(0, 1).map((alert: any) => {
              const hasIntervention = !!(alert.intervention?.id);
              const hasAssigned = !!(alert.intervener_info || alert.care_provider || alert.intervention?.assigned_to);
              const iAmAssigned = alert.intervention?.assigned_to === (user as any)?.id;
              return (
                <div key={alert.id} style={{ borderRadius: 20, position: 'relative', padding: '18px 16px', marginBottom: 0, overflow: 'hidden', minHeight: 100 } as any}>
                  <img src={BG_RED} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1 } as any} />
                  <div style={{ position: 'relative', zIndex: 2 } as any}>
                    <div onClick={() => router.push({ pathname: '/alert-detail', params: { alertId: alert.id } })} style={{ cursor: 'pointer' } as any}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 } as any}>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{alert.care_provider || data.name}</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>Le {new Date(alert.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.3)', flexShrink: 0 } as any}>
                          <span style={{ width: 6, height: 6, borderRadius: 3, background: '#EF4444' } as any} />
                          <span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>Alerte active</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } as any}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>{getAlertLabel(alert.alert_type)}</div>
                        {alert.intervention?.distance_km && <div style={{ padding: '4px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' } as any}><span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{alert.intervention.distance_km} Km</span></div>}
                      </div>
                    </div>
                    {/* Slide suivre/intervenir */}
                    {hasIntervention && hasAssigned ? (
                      <div style={{ width: '100%', height: 48, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', touchAction: 'none' } as any}
                        onMouseDown={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb2]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 44; const startX = e.clientX; const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); router.push({ pathname: '/intervention-map', params: { interventionId: alert.intervention.id } }); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }}>
                        <div data-thumb2 style={{ position: 'absolute', top: 3, left: 3, width: 42, height: 42, borderRadius: 999, background: iAmAssigned ? '#FFF' : 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', willChange: 'transform', touchAction: 'none' } as any}><i className={iAmAssigned ? 'ri-navigation-line' : 'ri-heart-line'} style={{ fontSize: 18, color: iAmAssigned ? '#111' : '#FFF' }} /></div>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700, pointerEvents: 'none', paddingLeft: 30 } as any}>{iAmAssigned ? 'Lancer la navigation' : "Suivre l'intervention"}</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' } as any} onClick={() => router.push({ pathname: '/alert-detail', params: { alertId: alert.id } })}>
                        <div style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-heart-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
                        <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#FFF', textAlign: 'center' }}>Voir la fiche alerte</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── CONTENU ── */}
        <div style={{ padding: '12px 16px 100px' } as any}>

          {/* ── 1. DOSSIER MÉDICAL ── */}
          <div style={{ padding: '16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', marginBottom: 12 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 } as any}>
              <i className="ri-file-medical-line" style={{ fontSize: 18, color: '#A78BFA' }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>Dossier médical</span>
              {age && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{age} ans</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 } as any}>
              {[
                data.blood_type && { label: 'Groupe sang.', val: data.blood_type, color: '#EF4444' },
                data.date_of_birth && { label: 'Né(e) le', val: (() => { try { const d = new Date(data.date_of_birth); return isNaN(d.getTime()) ? data.date_of_birth : d.toLocaleDateString('fr-FR'); } catch { return data.date_of_birth; } })(), color: '#FFF' },
                data.gender && { label: 'Genre', val: data.gender, color: '#FFF' },
                (data.height_cm || data.weight_kg) && { label: 'Taille / Poids', val: [data.height_cm && `${data.height_cm}cm`, data.weight_kg && `${data.weight_kg}kg`].filter(Boolean).join(' · '), color: '#FFF' },
              ].filter(Boolean).map((item: any, i: number) => (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' } as any}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.val}</div>
                </div>
              ))}
            </div>
            {data.medical_conditions && <div style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 8 } as any}><div style={{ fontSize: 9, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Pathologies</div><div style={{ fontSize: 13, color: '#FFF', lineHeight: 1.5 }}>{data.medical_conditions}</div></div>}
            {data.allergies && <div style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 8 } as any}><div style={{ fontSize: 9, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Allergies</div><div style={{ fontSize: 13, color: '#FFF', lineHeight: 1.5 }}>{data.allergies}</div></div>}
            {(data.doctor_name || data.emergency_contact_name) && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 } as any}>
                {data.doctor_name && <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: data.emergency_contact_name ? 10 : 0 } as any}><i className="ri-stethoscope-line" style={{ fontSize: 14, color: '#A78BFA', flexShrink: 0 }} /><div style={{ flex: 1 } as any}><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Médecin traitant</span><span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{data.doctor_name}</span></div>{data.doctor_phone && <a href={`tel:${data.doctor_phone}`} style={{ textDecoration: 'none' }}><div style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981' }} /></div></a>}</div>}
                {data.emergency_contact_name && <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}><i className="ri-shield-user-line" style={{ fontSize: 14, color: '#EF4444', flexShrink: 0 }} /><div style={{ flex: 1 } as any}><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Contact urgence</span><span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{data.emergency_contact_name}</span></div>{data.emergency_contact_phone && <a href={`tel:${data.emergency_contact_phone}`} style={{ textDecoration: 'none' }}><div style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981' }} /></div></a>}</div>}
              </div>
            )}
          </div>

          {/* ── 2. 4 DONNÉES DE SANTÉ — sur le fond directement, pas dans des cartes ── */}
          <div style={{ marginBottom: 12 } as any}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Données de santé</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } as any}>
              {[
                { img: IMG_HEART, label: 'Pouls', val: v.heart_rate, unit: 'bpm', statusKey: 'hr', statusVal: v.heart_rate },
                { img: IMG_SPO2, label: 'SpO2', val: v.spo2, unit: '%', statusKey: 'spo2', statusVal: v.spo2 },
                { img: IMG_TENS, label: 'Tension', val: v.blood_pressure_systolic ? `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}` : null, unit: 'mmHg', statusKey: 'bp_sys', statusVal: v.blood_pressure_systolic },
                { img: IMG_TEMP, label: 'Température', val: v.temperature, unit: '°C', statusKey: 'temp', statusVal: v.temperature },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 } as any}>
                  <img src={item.img} alt={item.label} style={{ width: 52, height: 52, objectFit: 'contain', mixBlendMode: 'screen' } as any} />
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{item.val || '--'}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{item.val ? item.unit : item.label}</div>
                  {item.val && <VitalStatus status={getVitalStatus(item.statusKey, item.statusVal)} />}
                </div>
              ))}
            </div>
          </div>

          {/* ── 3. APPAREILS ── */}
          <div style={{ padding: '16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', marginBottom: 12 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 } as any}>
              <i className="ri-device-line" style={{ fontSize: 18, color: '#10B981' }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>Appareils connectés</span>
            </div>
            {[
              { label: 'Bracelet Elio', img: IMG_BRACELET, color: '#10B981', connected: bracelet?.connected, battery: bracelet?.battery_level, sub: bracelet ? `${bracelet.heart_rate ? bracelet.heart_rate + ' bpm · ' : ''}${bracelet.spo2 ? 'SpO2 ' + bracelet.spo2 + '% · ' : ''}${bracelet.steps ? bracelet.steps.toLocaleString('fr-FR') + ' pas' : ''}`.replace(/ · $/, '') : null, sync: bracelet?.last_sync },
              { label: 'Balance Vita', img: IMG_SCALE, color: '#3B82F6', connected: scale?.connected, battery: scale?.battery_level, sub: scale?.weight_kg ? `${scale.weight_kg} kg` : null, sync: scale?.last_sync },
              { label: 'Gilet Elder', img: IMG_VEST, color: '#A78BFA', connected: vest?.connected, battery: vest?.battery_level, sub: vest?.connected ? 'Airbag prêt' : null, sync: vest?.last_sync },
            ].map((dev, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, paddingBottom: i < 2 ? 14 : 0, borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none', marginBottom: i < 2 ? 14 : 0 } as any}>
                {/* Device image */}
                <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' } as any}>
                  <img src={dev.img} alt={dev.label} style={{ width: 48, height: 48, objectFit: 'contain' } as any} />
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 } as any}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{dev.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, background: dev.connected ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)' } as any}>
                      <span style={{ width: 5, height: 5, borderRadius: 99, background: dev.connected ? '#10B981' : '#6B7280' } as any} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: dev.connected ? '#10B981' : 'rgba(255,255,255,0.35)' }}>{dev.connected ? 'Connecté' : 'Hors ligne'}</span>
                    </div>
                  </div>
                  {dev.sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>{dev.sub}</div>}
                  {dev.sync && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>Synchro : {new Date(dev.sync).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>}
                  <Battery level={dev.battery} label="Batterie" />
                </div>
              </div>
            ))}
          </div>

          {/* ── 4. LOCALISATION ── */}
          <div style={{ borderRadius: 20, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 12 } as any}>
            <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 } as any}>
              <i className="ri-map-pin-line" style={{ fontSize: 18, color: '#F59E0B' }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>Localisation</span>
              {data.address && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{data.address.split(',')[0]}</span>}
            </div>
            {data.latitude && data.longitude ? (
              <div style={{ height: 180, position: 'relative' } as any}>
                <iframe title="map" src={`https://www.openstreetmap.org/export/embed.html?bbox=${data.longitude - 0.01},${data.latitude - 0.01},${data.longitude + 0.01},${data.latitude + 0.01}&layer=mapnik&marker=${data.latitude},${data.longitude}`} style={{ width: '100%', height: '100%', border: 'none' } as any} />
                <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, padding: '7px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', fontSize: 11, color: '#FFF', fontWeight: 600 } as any}><i className="ri-map-pin-fill" style={{ color: '#EF4444', marginRight: 5 }} />{data.address}</div>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center' } as any}><i className="ri-map-pin-off-line" style={{ fontSize: 30, color: 'rgba(255,255,255,0.15)' }} /><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>Localisation non disponible</div></div>
            )}
          </div>

          {/* ── 5. HISTORIQUE ALERTES — cartes identiques à la page alertes onglet "clôturé" ── */}
          <div style={{ padding: '16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: historyAlerts.length > 0 ? 14 : 0 } as any}>
              <i className="ri-history-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>Historique des alertes</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 99 } as any}>{historyAlerts.length}</span>
            </div>
            {historyAlerts.length === 0 && <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Aucun historique</div>}
            {historyAlerts.slice(0, 10).map((alert: any) => (
              <div key={alert.id} style={{ borderRadius: 20, position: 'relative', padding: '18px 16px', marginBottom: 10, overflow: 'hidden', minHeight: 80 } as any}
                onClick={() => router.push({ pathname: '/alert-detail', params: { alertId: alert.id } })}>
                <img src={BG_GREEN} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
                <div style={{ position: 'relative', zIndex: 2, cursor: 'pointer' } as any}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 } as any}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{alert.care_provider || data.name}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>Le {new Date(alert.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.25)', flexShrink: 0 } as any}>
                      <span style={{ width: 6, height: 6, borderRadius: 3, background: '#10B981' } as any} />
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>{alert.status === 'resolved' ? 'Résolue' : 'Clôturée'}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>{getAlertLabel(alert.alert_type)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
