import React, { useState, useEffect, useCallback } from 'react';
import FullScreenLoader from '../src/components/FullScreenLoader';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const BG   = 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/iklovqya_background_beneficiary.svg';
const BG_GREEN = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/uvntv6me_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2008_31_33.png';

const IMG_HEART = 'https://customer-assets.emergentagent.com/job_19f6c899-022d-4e6d-bcf0-8571d24b1fb2/artifacts/4os5ruyj_hearth%20red%20app%20healthbeat%20Chutex.png';
const IMG_SPO2  = 'https://customer-assets.emergentagent.com/job_19f6c899-022d-4e6d-bcf0-8571d24b1fb2/artifacts/byji5pya_spo2.png';
const IMG_TENS  = 'https://customer-assets.emergentagent.com/job_19f6c899-022d-4e6d-bcf0-8571d24b1fb2/artifacts/zsw7vqfm_tension.png';
const IMG_TEMP  = 'https://customer-assets.emergentagent.com/job_19f6c899-022d-4e6d-bcf0-8571d24b1fb2/artifacts/yw3z379s_physical%20health%20analys%20app%20health%20Chutex.png';

const IMG_BRACELET = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg';
const IMG_SCALE    = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/dwmw2i8r_Balance_connecte_Vita_chutex.svg';
const IMG_VEST     = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/ljh1zzu3_Gilet_Elder_airbag_Chutex.svg';

/* ── ECG réaliste : dashoffset animation ── */
const ECG_PATH = "M0,40 L15,40 L22,40 L26,8 L30,72 L33,2 L37,78 L40,40 L55,40 L62,40 L66,8 L70,72 L73,2 L77,78 L80,40 L95,40 L102,40 L106,8 L110,72 L113,2 L117,78 L120,40 L135,40";
const ECG_PATH_LEN = 320;

const AnimatedECG = ({ bpm }: { bpm?: number }) => {
  const speed = bpm ? (60 / bpm * 1.2).toFixed(2) : '1.0';
  return (
    <div style={{ width: '100%', overflow: 'hidden', position: 'relative', margin: '10px 0 4px' } as any}>
      <style>{`
        @keyframes ecg-draw {
          0%   { stroke-dashoffset: ${ECG_PATH_LEN * 3}; }
          60%  { stroke-dashoffset: 0; opacity: 1; }
          80%  { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: -${ECG_PATH_LEN * 3}; opacity: 0.2; }
        }
        @keyframes ecg-fade { 0%,80%{opacity:1} 100%{opacity:0} }
      `}</style>
      <svg viewBox="0 0 360 80" style={{ width: '100%', height: 60 }} preserveAspectRatio="none">
        {/* 3 copies décalées pour l'effet traversée */}
        {[0, 120, 240].map((offset, i) => (
          <path
            key={i}
            d={`M${offset},40 L${offset+15},40 L${offset+22},40 L${offset+26},8 L${offset+30},72 L${offset+33},2 L${offset+37},78 L${offset+40},40 L${offset+55},40 L${offset+62},40 L${offset+66},8 L${offset+70},72 L${offset+73},2 L${offset+77},78 L${offset+80},40 L${offset+110},40`}
            fill="none"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${ECG_PATH_LEN} ${ECG_PATH_LEN * 4}`}
            style={{
              animation: `ecg-draw ${speed}s linear ${(i * parseFloat(speed) / 3).toFixed(2)}s infinite`,
            }}
          />
        ))}
        {/* Ligne de base */}
        <line x1="0" y1="40" x2="360" y2="40" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      </svg>
    </div>
  );
};

/* Vital status pill */
const VitalPill = ({ type, val }: { type: string; val: any }) => {
  if (!val) return null;
  let status: 'normal' | 'warning' | 'critical' = 'normal';
  if (type === 'hr') { if (val < 50 || val > 100) status = 'critical'; else if (val < 60 || val > 90) status = 'warning'; }
  else if (type === 'spo2') { if (val < 90) status = 'critical'; else if (val < 95) status = 'warning'; }
  else if (type === 'temp') { if (val > 38.5 || val < 35.5) status = 'critical'; else if (val > 37.5 || val < 36) status = 'warning'; }
  else if (type === 'bp') { if (val > 160 || val < 90) status = 'critical'; else if (val > 140 || val < 100) status = 'warning'; }
  const cfg = { normal: { c: '#10B981', bg: 'rgba(16,185,129,0.18)', label: 'Normal' }, warning: { c: '#F59E0B', bg: 'rgba(245,158,11,0.18)', label: 'À surveiller' }, critical: { c: '#EF4444', bg: 'rgba(239,68,68,0.18)', label: 'Anormal' } }[status];
  return <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 99, background: cfg.bg, marginTop: 6 } as any}><span style={{ width: 5, height: 5, borderRadius: 99, background: cfg.c } as any} /><span style={{ fontSize: 9, fontWeight: 700, color: cfg.c }}>{cfg.label}</span></div>;
};

/* Exact slide button from alerts.tsx */
const SlideButton = ({ label, icon, onSlide, white = false }: any) => (
  <div style={{ width: '100%', height: 48, borderRadius: 999, position: 'relative', overflow: 'hidden', background: white ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)', border: `1px solid ${white ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.1)'}`, touchAction: 'none' } as any}
    onMouseDown={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-slide-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 44; const startX = e.clientX; const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); onSlide(); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }; document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); }}
    onTouchStart={(e: any) => { e.stopPropagation(); const bar = e.currentTarget; const thumb = bar.querySelector('[data-slide-thumb]') as HTMLElement; if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 44; const startX = e.touches[0].clientX; const onMove = (ev: any) => { ev.preventDefault(); const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); onSlide(); } }; const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { if (thumb) thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); }; bar.addEventListener('touchmove', onMove, { passive: false }); bar.addEventListener('touchend', onUp); }}>
    <div data-slide-thumb style={{ position: 'absolute', top: 3, left: 3, width: 42, height: 42, borderRadius: 999, background: white ? '#FFF' : 'rgba(255,255,255,0.15)', border: white ? 'none' : '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', willChange: 'transform', touchAction: 'none', boxShadow: white ? '0 2px 8px rgba(0,0,0,0.15)' : 'none' } as any}>
      <i className={icon} style={{ fontSize: 18, color: white ? '#111' : '#FFF' }} />
    </div>
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 700, pointerEvents: 'none', paddingLeft: 30 } as any}>{label}</div>
  </div>
);

const getAlertLabel = (t: string) => ({ fall: 'Chute détectée', sos: 'SOS déclenché', heart_rate: 'Anomalie cardiaque', spo2: 'SpO2 anormale', inactivity: 'Inactivité détectée', health: 'Anomalie santé' }[t] || t || 'Alerte');

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

  if (loading) return <FullScreenLoader />;
  if (!data) return <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,0.5)' }}>Bénéficiaire non trouvé</Text></SafeAreaView>;
  if (Platform.OS !== 'web') return <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}><Text style={{ color: '#FFF', padding: 20 }}>{data.name}</Text></SafeAreaView>;

  const v = data.latest_vitals || {};
  const activeAlerts = alerts.filter((a: any) => a.status === 'active' || a.status === 'pending');
  const historyAlerts = alerts.filter((a: any) => a.status !== 'active' && a.status !== 'pending');

  // Simulate battery if not provided (for demo)
  const bracelet = devices?.bracelet || { battery_level: 78, connected: true, heart_rate: v.heart_rate, spo2: v.spo2 };
  const scale    = { battery_level: 45, connected: false };
  const vest     = { battery_level: 91, connected: true };

  const age = data.date_of_birth && !isNaN(new Date(data.date_of_birth).getTime())
    ? Math.floor((Date.now() - new Date(data.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365)) : null;

  const r = (user as any)?.role || '';

  /* Section separator */
  const Sep = () => <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '16px 0' } as any} />;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.52)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, WebkitOverflowScrolling: 'touch' } as any}>

        {/* ── HERO ── */}
        <div style={{ padding: '20px 20px 0', textAlign: 'center' } as any}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } as any}>
            <div onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 22, color: '#FFF' }} /></div>
            <div style={{ flex: 1, padding: '0 12px' } as any}>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', letterSpacing: -0.5 }}>{data.name}</div>
              {data.address && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3, lineHeight: 1.4 }}>{data.address}</div>}
            </div>
            {data.phone ? (
              <a href={`tel:${data.phone}`} style={{ textDecoration: 'none' }}>
                <div style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-phone-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
              </a>
            ) : <div style={{ width: 44 }} />}
          </div>
          {v.heart_rate && <><div style={{ fontSize: 88, fontWeight: 900, color: '#FFF', lineHeight: 1, letterSpacing: -4 }}>{v.heart_rate}</div><div style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginTop: 2 }}>bpm</div></>}
          <AnimatedECG bpm={v.heart_rate} />
        </div>

        {/* ── ALERTE ACTIVE — même carte que alerts.tsx ── */}
        {activeAlerts.length > 0 && (
          <div style={{ padding: '4px 16px 0' } as any}>
            {activeAlerts.slice(0, 1).map((alert: any) => {
              const hasIntervention = !!(alert.intervention?.id);
              const hasAssigned = !!(alert.intervener_info || alert.care_provider || alert.intervention?.assigned_to);
              const iAmAssigned = alert.intervention?.assigned_to === (user as any)?.id;
              return (
                <div key={alert.id} style={{ borderRadius: 20, position: 'relative', padding: '18px 16px', marginBottom: 0, minHeight: 100, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}>
                  <div onClick={() => router.push({ pathname: '/(tabs)/alerts', params: { preselect: alert.id } })} style={{ cursor: 'pointer' } as any}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 } as any}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{alert.beneficiary_name || data.name}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>Le {new Date(alert.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.25)', flexShrink: 0 } as any}>
                        <span style={{ width: 6, height: 6, borderRadius: 3, background: '#EF4444' } as any} />
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>Alerte active</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } as any}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>{getAlertLabel(alert.alert_type)}</div>
                      {alert.intervention?.distance_km && <div style={{ padding: '4px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' } as any}><span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{alert.intervention.distance_km} Km</span></div>}
                    </div>
                  </div>
                  {/* Slide — Suivre si assigné */}
                  {hasIntervention && hasAssigned && (
                    <SlideButton
                      label={iAmAssigned ? 'Lancer la navigation' : "Suivre l'intervention"}
                      icon={iAmAssigned ? 'ri-navigation-line' : 'ri-heart-line'}
                      white={iAmAssigned}
                      onSlide={() => router.push({ pathname: '/intervention-map', params: { interventionId: alert.intervention.id } })}
                    />
                  )}
                  {/* Slide — Intervenir si gardien sans intervenant */}
                  {r === 'guardian' && !hasAssigned && (
                    <SlideButton
                      label="Intervenir"
                      icon="ri-shield-check-line"
                      white={true}
                      onSlide={() => apiFetch('/api/interventions/accept-as-guardian', { method: 'POST', body: JSON.stringify({ alert_id: alert.id }) }, token).then((res: any) => router.push({ pathname: '/intervention-map', params: { interventionId: res?.intervention_id || '' } })).catch(() => {})}
                    />
                  )}
                  {/* Slide — Voir fiche si pas d'action disponible */}
                  {!hasIntervention && !hasAssigned && r !== 'guardian' && (
                    <SlideButton label="Voir la fiche alerte" icon="ri-arrow-right-line" white={false} onSlide={() => router.push({ pathname: '/(tabs)/alerts', params: { preselect: alert.id } })} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── CONTENU ── */}
        <div style={{ padding: '12px 16px 100px' } as any}>

          {/* 1. DOSSIER MÉDICAL */}
          <div style={{ padding: '16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', marginBottom: 12 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 } as any}>
              <i className="ri-file-medical-line" style={{ fontSize: 18, color: '#A78BFA' }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>Dossier médical</span>
              {age && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{age} ans</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 } as any}>
              {[
                data.blood_type && { label: 'Groupe sanguin', val: data.blood_type, color: '#EF4444' },
                data.date_of_birth && { label: 'Né(e) le', val: (() => { try { const d = new Date(data.date_of_birth); return isNaN(d.getTime()) ? data.date_of_birth : d.toLocaleDateString('fr-FR'); } catch { return data.date_of_birth; } })(), color: '#FFF' },
                data.gender && { label: 'Genre', val: data.gender, color: '#FFF' },
                (data.height_cm || data.weight_kg) && { label: 'Taille / Poids', val: [data.height_cm && `${data.height_cm} cm`, data.weight_kg && `${data.weight_kg} kg`].filter(Boolean).join(' · '), color: '#FFF' },
              ].filter(Boolean).map((item: any, i: number) => (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.val}</div>
                </div>
              ))}
            </div>
            {data.medical_conditions && <div style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 8 } as any}><div style={{ fontSize: 9, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', marginBottom: 4 }}>Pathologies</div><div style={{ fontSize: 13, color: '#FFF', lineHeight: 1.5 }}>{data.medical_conditions}</div></div>}
            {data.allergies && <div style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 8 } as any}><div style={{ fontSize: 9, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', marginBottom: 4 }}>Allergies</div><div style={{ fontSize: 13, color: '#FFF', lineHeight: 1.5 }}>{data.allergies}</div></div>}
            {(data.doctor_name || data.emergency_contact_name) && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 } as any}>
                {data.doctor_name && <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: data.emergency_contact_name ? 10 : 0 } as any}><i className="ri-stethoscope-line" style={{ fontSize: 14, color: '#A78BFA', flexShrink: 0 }} /><div style={{ flex: 1 } as any}><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Médecin traitant</span><span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{data.doctor_name}</span></div>{data.doctor_phone && <a href={`tel:${data.doctor_phone}`} style={{ textDecoration: 'none' }}><div style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981' }} /></div></a>}</div>}
                {data.emergency_contact_name && <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}><i className="ri-shield-user-line" style={{ fontSize: 14, color: '#EF4444', flexShrink: 0 }} /><div style={{ flex: 1 } as any}><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Contact urgence</span><span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{data.emergency_contact_name}</span></div>{data.emergency_contact_phone && <a href={`tel:${data.emergency_contact_phone}`} style={{ textDecoration: 'none' }}><div style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981' }} /></div></a>}</div>}
              </div>
            )}
          </div>

          {/* 2. DONNÉES DE SANTÉ — grille glassmorphism */}
          <Sep />
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Données de santé</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 4 } as any}>
            {[
              { label: 'Fréq. cardiaque', val: v.heart_rate, unit: 'bpm', icon: 'ri-heart-pulse-line', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', statusKey: 'hr' },
              { label: 'SpO2', val: v.spo2, unit: '%', icon: 'ri-drop-line', color: '#60A5FA', bg: 'rgba(96,165,250,0.1)', border: 'rgba(59,130,246,0.2)', statusKey: 'spo2' },
              { label: 'Tension', val: v.blood_pressure_systolic ? `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}` : null, unit: 'mmHg', icon: 'ri-pulse-line', color: '#C084FC', bg: 'rgba(192,132,252,0.1)', border: 'rgba(167,139,250,0.2)', statusKey: 'bp' },
              { label: 'Température', val: v.temperature, unit: '°C', icon: 'ri-temp-hot-line', color: '#FB923C', bg: 'rgba(251,146,60,0.1)', border: 'rgba(245,158,11,0.2)', statusKey: 'temp' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '14px 14px 12px', borderRadius: 18, background: item.bg, border: `1px solid ${item.border}`, backdropFilter: 'blur(8px)' } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 } as any}>
                  <i className={item.icon} style={{ fontSize: 14, color: item.color }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: item.val ? item.color : 'rgba(255,255,255,0.2)', lineHeight: 1, letterSpacing: -0.5 }}>{item.val || '--'}</div>
                <div style={{ fontSize: 10, color: item.val ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)', marginTop: 3, fontWeight: 600 }}>{item.unit}</div>
                {item.val && <VitalPill type={item.statusKey} val={item.val} />}
              </div>
            ))}
          </div>

          {/* 3. APPAREILS — sans carte, séparés par traits */}
          <Sep />
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Appareils connectés</div>
          {[
            { label: 'Bracelet Elio', img: IMG_BRACELET, color: '#10B981', d: bracelet },
            { label: 'Balance Vita', img: IMG_SCALE, color: '#3B82F6', d: scale },
            { label: 'Elder', img: IMG_VEST, color: '#A78BFA', d: vest },
          ].map((dev, i) => (
            <div key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 } as any}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid rgba(255,255,255,0.08)' } as any}>
                  <img src={dev.img} alt={dev.label} style={{ width: 42, height: 42, objectFit: 'contain' } as any} />
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 } as any}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{dev.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, background: dev.d?.connected ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)' } as any}>
                      <span style={{ width: 5, height: 5, borderRadius: 99, background: dev.d?.connected ? '#10B981' : '#6B7280' } as any} />
                      <span style={{ fontSize: 9, fontWeight: 700, color: dev.d?.connected ? '#10B981' : 'rgba(255,255,255,0.35)' }}>{dev.d?.connected ? 'Connecté' : 'Hors ligne'}</span>
                    </div>
                  </div>
                  {/* Battery */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                    <i className="ri-battery-2-line" style={{ fontSize: 13, color: (dev.d?.battery_level ?? 0) > 30 ? '#10B981' : '#EF4444', flexShrink: 0 }} />
                    <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' } as any}>
                      <div style={{ height: '100%', borderRadius: 99, background: (dev.d?.battery_level ?? 0) > 30 ? `linear-gradient(90deg, #10B981, #34D399)` : `linear-gradient(90deg, #EF4444, #F87171)`, width: `${dev.d?.battery_level ?? 0}%`, transition: 'width 1s' } as any} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: (dev.d?.battery_level ?? 0) > 30 ? '#10B981' : '#EF4444', minWidth: 34, textAlign: 'right' } as any}>{dev.d?.battery_level != null ? `${dev.d.battery_level}%` : '--'}</span>
                  </div>
                </div>
              </div>
              {i < 2 && <Sep />}
            </div>
          ))}

          {/* 4. LOCALISATION */}
          <Sep />
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Localisation</div>
          {data.latitude && data.longitude ? (
            <div style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', height: 180, marginBottom: 4 } as any}>
              <iframe title="map" src={`https://www.openstreetmap.org/export/embed.html?bbox=${data.longitude - 0.01},${data.latitude - 0.01},${data.longitude + 0.01},${data.latitude + 0.01}&layer=mapnik&marker=${data.latitude},${data.longitude}`} style={{ width: '100%', height: '100%', border: 'none' } as any} />
              <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, padding: '7px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', fontSize: 11, color: '#FFF', fontWeight: 600 } as any}><i className="ri-map-pin-fill" style={{ color: '#EF4444', marginRight: 5 }} />{data.address}</div>
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 16, marginBottom: 4 } as any}><i className="ri-map-pin-off-line" style={{ fontSize: 28, color: 'rgba(255,255,255,0.15)' }} /><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>Localisation non disponible</div></div>
          )}

          {/* 5. HISTORIQUE ALERTES — cartes identiques à page alertes "clôturé" + bonne navigation */}
          {historyAlerts.length > 0 && (
            <>
              <Sep />
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Historique des alertes ({historyAlerts.length})</div>
              {historyAlerts.slice(0, 10).map((alert: any) => (
                <div key={alert.id} style={{ borderRadius: 20, position: 'relative', padding: '18px 16px', marginBottom: 10, overflow: 'hidden', minHeight: 80, cursor: 'pointer' } as any}
                  onClick={() => router.push({ pathname: '/(tabs)/alerts', params: { preselect: alert.id } })}>
                  <img src={BG_GREEN} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
                  <div style={{ position: 'relative', zIndex: 2 } as any}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 } as any}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{alert.beneficiary_name || data.name}</div>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
