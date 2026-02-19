import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const BG = 'https://customer-assets.emergentagent.com/job_19f6c899-022d-4e6d-bcf0-8571d24b1fb2/artifacts/xjd4c8ks_ChatGPT%20Image%2019%20f%C3%A9vr.%202026%2C%2017_54_27.png';
const BG_ALERT = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/uvntv6me_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2008_31_33.png';

const IMG_HEART = 'https://customer-assets.emergentagent.com/job_19f6c899-022d-4e6d-bcf0-8571d24b1fb2/artifacts/4os5ruyj_hearth%20red%20app%20healthbeat%20Chutex.png';
const IMG_SPO2  = 'https://customer-assets.emergentagent.com/job_19f6c899-022d-4e6d-bcf0-8571d24b1fb2/artifacts/byji5pya_spo2.png';
const IMG_TENS  = 'https://customer-assets.emergentagent.com/job_19f6c899-022d-4e6d-bcf0-8571d24b1fb2/artifacts/zsw7vqfm_tension.png';
const IMG_TEMP  = 'https://customer-assets.emergentagent.com/job_19f6c899-022d-4e6d-bcf0-8571d24b1fb2/artifacts/yw3z379s_physical%20health%20analys%20app%20health%20Chutex.png';

/* ECG wave SVG */
const EcgWave = () => (
  <svg viewBox="0 0 300 60" style={{ width: '100%', height: 60, opacity: 0.35 }}>
    <polyline
      points="0,30 20,30 30,30 35,10 40,50 45,5 50,55 55,30 70,30 80,30 85,20 90,40 95,25 100,30 120,30 125,15 130,45 135,8 140,52 145,30 160,30 170,30 175,18 180,42 185,22 190,30 210,30 215,12 220,48 225,6 230,54 235,30 250,30 260,30 265,20 270,40 275,25 280,30 300,30"
      fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
    />
  </svg>
);

/* GCard */
const GCard = ({ children, style }: any) => (
  <div style={{ padding: '16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', marginBottom: 12, ...style } as any}>
    {children}
  </div>
);

export default function BeneficiaryDetailScreen() {
  const { beneficiaryId } = useLocalSearchParams<{ beneficiaryId: string }>();
  const { token } = useAuth();
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

  const alertColor = (type: string) => ({ fall: '#EF4444', sos: '#EF4444', heart_rate: '#F59E0B', spo2: '#3B82F6', inactivity: '#A78BFA' }[type] || '#EF4444');
  const alertLabel = (type: string) => ({ fall: 'Chute détectée', sos: 'SOS déclenché', heart_rate: 'Anomalie cardiaque', spo2: 'SpO2 anormale', inactivity: 'Inactivité détectée' }[type] || type || 'Alerte');
  const age = data.date_of_birth && !isNaN(new Date(data.date_of_birth).getTime()) ? Math.floor((Date.now() - new Date(data.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365)) : null;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, WebkitOverflowScrolling: 'touch' } as any}>

        {/* ── HEADER HERO ── */}
        <div style={{ position: 'relative', padding: '20px 20px 0', textAlign: 'center' } as any}>
          {/* Nav */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } as any}>
            <div onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
              <i className="ri-arrow-left-s-line" style={{ fontSize: 22, color: '#FFF' }} />
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '0 12px' } as any}>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', letterSpacing: -0.5 }}>{data.name}</div>
              {data.address && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 3, lineHeight: 1.4 }}>{data.address}</div>}
            </div>
            {data.phone ? (
              <a href={`tel:${data.phone}`} style={{ textDecoration: 'none' }}>
                <div style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                  <i className="ri-phone-line" style={{ fontSize: 20, color: '#FFF' }} />
                </div>
              </a>
            ) : <div style={{ width: 44 }} />}
          </div>

          {/* BPM géant */}
          {v.heart_rate && (
            <div style={{ marginBottom: 0 } as any}>
              <div style={{ fontSize: 88, fontWeight: 900, color: '#FFF', lineHeight: 1, letterSpacing: -4 }}>{v.heart_rate}</div>
              <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginTop: 2, marginBottom: 10 }}>bpm</div>
            </div>
          )}

          {/* ECG Wave */}
          <EcgWave />
        </div>

        {/* ── ALERTE ACTIVE (seulement si alerte en cours) ── */}
        {activeAlerts.length > 0 && (
          <div style={{ padding: '0 16px', marginTop: 8, marginBottom: 4 } as any}>
            {activeAlerts.slice(0, 1).map((alert: any) => (
              <div key={alert.id} style={{ borderRadius: 22, overflow: 'hidden', position: 'relative', padding: '16px 18px' } as any}>
                <img src={BG_ALERT} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,0,0,0.5)', zIndex: 1 } as any} />
                <div style={{ position: 'relative', zIndex: 2 } as any}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 } as any}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{alert.care_provider || data.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                        {new Date(alert.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 999, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(239,68,68,0.4)' } as any}>
                      <span style={{ width: 6, height: 6, borderRadius: 99, background: '#EF4444' } as any} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#FFF' }}>Alerte active</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF', marginBottom: 14 }}>{alertLabel(alert.alert_type)}</div>
                  <div onClick={() => router.push({ pathname: '/alert-detail', params: { alertId: alert.id } })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' } as any}>
                    <div style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-heart-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
                    <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#FFF', textAlign: 'center' }}>Voir la fiche alerte</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── CONTENU (cartes) ── */}
        <div style={{ padding: '12px 16px 100px' } as any}>

          {/* ── 1. DOSSIER MÉDICAL ── */}
          <GCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 } as any}>
              <i className="ri-file-medical-line" style={{ fontSize: 18, color: '#A78BFA' }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>Dossier médical</span>
              {age && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{age} ans</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: data.medical_conditions || data.allergies || data.doctor_name ? 12 : 0 } as any}>
              {[
                data.blood_type && { label: 'Groupe sang.', val: data.blood_type, color: '#EF4444' },
                data.date_of_birth && { label: 'Né(e) le', val: new Date(data.date_of_birth).toLocaleDateString('fr-FR'), color: '#FFF' },
                data.gender && { label: 'Genre', val: data.gender, color: '#FFF' },
                (data.height_cm || data.weight_kg) && { label: 'Taille / Poids', val: [data.height_cm && `${data.height_cm}cm`, data.weight_kg && `${data.weight_kg}kg`].filter(Boolean).join(' · '), color: '#FFF' },
              ].filter(Boolean).map((item: any, i: number) => (
                <div key={i} style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' } as any}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: item.color }}>{item.val}</div>
                </div>
              ))}
            </div>
            {data.medical_conditions && (
              <div style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 8 } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Pathologies</div>
                <div style={{ fontSize: 13, color: '#FFF', lineHeight: 1.5 }}>{data.medical_conditions}</div>
              </div>
            )}
            {data.allergies && (
              <div style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: 8 } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Allergies</div>
                <div style={{ fontSize: 13, color: '#FFF', lineHeight: 1.5 }}>{data.allergies}</div>
              </div>
            )}
            {(data.doctor_name || data.emergency_contact_name) && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, marginTop: 4 } as any}>
                {data.doctor_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: data.emergency_contact_name ? 10 : 0 } as any}>
                    <i className="ri-stethoscope-line" style={{ fontSize: 14, color: '#A78BFA', flexShrink: 0 }} />
                    <div style={{ flex: 1 } as any}><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Médecin traitant</span><span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{data.doctor_name}</span>{data.doctor_phone && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>{data.doctor_phone}</span>}</div>
                    {data.doctor_phone && <a href={`tel:${data.doctor_phone}`} style={{ textDecoration: 'none' }}><div style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981' }} /></div></a>}
                  </div>
                )}
                {data.emergency_contact_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                    <i className="ri-shield-user-line" style={{ fontSize: 14, color: '#EF4444', flexShrink: 0 }} />
                    <div style={{ flex: 1 } as any}><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Contact urgence</span><span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{data.emergency_contact_name}</span>{data.emergency_contact_phone && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>{data.emergency_contact_phone}</span>}</div>
                    {data.emergency_contact_phone && <a href={`tel:${data.emergency_contact_phone}`} style={{ textDecoration: 'none' }}><div style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981' }} /></div></a>}
                  </div>
                )}
              </div>
            )}
          </GCard>

          {/* ── 2. 4 DONNÉES DE SANTÉ ── */}
          <GCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 } as any}>
              <i className="ri-heart-pulse-line" style={{ fontSize: 18, color: '#EF4444' }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>Données de santé</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Temps réel</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as any}>
              {[
                { img: IMG_HEART, label: 'Pouls', val: v.heart_rate, unit: 'bpm', color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
                { img: IMG_SPO2, label: 'SpO2', val: v.spo2, unit: '%', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
                { img: IMG_TENS, label: 'Tension', val: v.blood_pressure_systolic ? `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}` : null, unit: 'mmHg', color: '#A78BFA', bg: 'rgba(124,92,255,0.08)' },
                { img: IMG_TEMP, label: 'Température', val: v.temperature, unit: '°C', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
              ].map((item, i) => (
                <div key={i} style={{ padding: '14px 12px', borderRadius: 16, background: item.bg, border: `1px solid ${item.color}20`, textAlign: 'center' } as any}>
                  <img src={item.img} alt={item.label} style={{ width: 40, height: 40, objectFit: 'contain', display: 'block', margin: '0 auto 10px', mixBlendMode: 'screen' } as any} />
                  <div style={{ fontSize: 22, fontWeight: 900, color: item.color, lineHeight: 1 }}>{item.val || '--'}</div>
                  <div style={{ fontSize: 10, color: item.color, opacity: 0.7, marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.val ? item.unit : item.label}</div>
                </div>
              ))}
            </div>
          </GCard>

          {/* ── 3. APPAREILS ── */}
          <GCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 } as any}>
              <i className="ri-device-line" style={{ fontSize: 18, color: '#10B981' }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>Appareils connectés</span>
            </div>
            {[
              { key: 'bracelet', label: 'Bracelet Elio', icon: 'ri-watch-line', color: '#10B981', data: bracelet },
              { key: 'vest', label: 'Gilet Anti-Chute', icon: 'ri-shield-check-line', color: '#A78BFA', data: vest },
            ].map((dev, i) => (
              <div key={i} style={{ padding: '14px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: i === 0 ? 10 : 0 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: `${dev.color}15`, border: `1px solid ${dev.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                    <i className={dev.icon} style={{ fontSize: 22, color: dev.color }} />
                  </div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{dev.label}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 } as any}>
                      <span style={{ width: 6, height: 6, borderRadius: 99, background: dev.data?.connected ? '#10B981' : '#6B7280' } as any} />
                      <span style={{ fontSize: 11, color: dev.data?.connected ? '#10B981' : 'rgba(255,255,255,0.4)' }}>{dev.data?.connected ? 'Connecté' : 'Hors ligne'}</span>
                      {dev.data?.last_sync && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>· {new Date(dev.data.last_sync).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
                    </div>
                  </div>
                  {/* Batterie */}
                  <div style={{ textAlign: 'right', flexShrink: 0 } as any}>
                    {dev.data?.battery_level != null ? (
                      <>
                        <div style={{ fontSize: 18, fontWeight: 900, color: dev.data.battery_level > 30 ? '#10B981' : '#EF4444' }}>{dev.data.battery_level}%</div>
                        <div style={{ width: 48, height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginTop: 4 } as any}>
                          <div style={{ height: '100%', borderRadius: 99, background: dev.data.battery_level > 30 ? '#10B981' : '#EF4444', width: `${dev.data.battery_level}%` } as any} />
                        </div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 2, textAlign: 'center', textTransform: 'uppercase' }}>Batterie</div>
                      </>
                    ) : <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>N/A</span>}
                  </div>
                </div>
                {/* Données live si bracelet */}
                {dev.key === 'bracelet' && dev.data && (dev.data.heart_rate > 0 || dev.data.spo2 > 0 || dev.data.steps > 0) && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' } as any}>
                    {dev.data.heart_rate > 0 && <span style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(239,68,68,0.1)', fontSize: 11, fontWeight: 700, color: '#EF4444' } as any}>{dev.data.heart_rate} bpm</span>}
                    {dev.data.spo2 > 0 && <span style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(59,130,246,0.1)', fontSize: 11, fontWeight: 700, color: '#3B82F6' } as any}>SpO2 {dev.data.spo2}%</span>}
                    {dev.data.steps > 0 && <span style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(16,185,129,0.1)', fontSize: 11, fontWeight: 700, color: '#10B981' } as any}>{dev.data.steps.toLocaleString('fr-FR')} pas</span>}
                  </div>
                )}
              </div>
            ))}
          </GCard>

          {/* ── 4. LOCALISATION ── */}
          <GCard style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 } as any}>
              <i className="ri-map-pin-line" style={{ fontSize: 18, color: '#F59E0B' }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>Localisation</span>
              {data.address && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{data.address.split(',')[0]}</span>}
            </div>
            {data.latitude && data.longitude ? (
              <div style={{ height: 180, position: 'relative' } as any}>
                <iframe title="map" src={`https://www.openstreetmap.org/export/embed.html?bbox=${data.longitude - 0.01},${data.latitude - 0.01},${data.longitude + 0.01},${data.latitude + 0.01}&layer=mapnik&marker=${data.latitude},${data.longitude}`} style={{ width: '100%', height: '100%', border: 'none' } as any} />
                <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, padding: '7px 12px', borderRadius: 10, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', fontSize: 11, color: '#FFF', fontWeight: 600 } as any}>
                  <i className="ri-map-pin-fill" style={{ color: '#EF4444', marginRight: 5 }} />{data.address || `${data.latitude.toFixed(4)}, ${data.longitude.toFixed(4)}`}
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center' } as any}>
                <i className="ri-map-pin-off-line" style={{ fontSize: 30, color: 'rgba(255,255,255,0.15)' }} />
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>Localisation non disponible</div>
              </div>
            )}
          </GCard>

          {/* ── 5. HISTORIQUE ALERTES ── */}
          {historyAlerts.length > 0 && (
            <GCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 } as any}>
                <i className="ri-history-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }} />
                <span style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>Historique des alertes</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 99 } as any}>{historyAlerts.length}</span>
              </div>
              {historyAlerts.slice(0, 10).map((alert: any, i: number) => (
                <div key={alert.id} onClick={() => router.push({ pathname: '/alert-detail', params: { alertId: alert.id } })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none', cursor: 'pointer' } as any}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: `${alertColor(alert.alert_type)}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                    <i className={alert.alert_type === 'fall' ? 'ri-run-line' : alert.alert_type === 'sos' ? 'ri-alarm-warning-line' : 'ri-heart-pulse-line'} style={{ fontSize: 16, color: alertColor(alert.alert_type) }} />
                  </div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{alertLabel(alert.alert_type)}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{new Date(alert.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div style={{ padding: '3px 9px', borderRadius: 99, background: 'rgba(16,185,129,0.12)', fontSize: 9, fontWeight: 700, color: '#10B981', flexShrink: 0 } as any}>{alert.status === 'resolved' ? 'Résolue' : 'Clôturée'}</div>
                  <i className="ri-arrow-right-s-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.2)' }} />
                </div>
              ))}
            </GCard>
          )}

          {historyAlerts.length === 0 && (
            <GCard>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 } as any}>
                <i className="ri-history-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)' }} />
                <span style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>Historique des alertes</span>
              </div>
              <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Aucune alerte dans l'historique</div>
            </GCard>
          )}
        </div>
      </div>
    </div>
  );
}
