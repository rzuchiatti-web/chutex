import React, { useState, useEffect, useCallback } from 'react';
import FullScreenLoader from '../src/components/FullScreenLoader';
import { View, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import NativePageView from '../src/components/NativePageView';

const BG = 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/iklovqya_background_beneficiary.svg';
const IMG_BRACELET = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg';
const IMG_SCALE = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/dwmw2i8r_Balance_connecte_Vita_chutex.svg';
const IMG_VEST = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/ljh1zzu3_Gilet_Elder_airbag_Chutex.svg';

export default function BeneficiaryDetailScreen() {
  const { beneficiaryId } = useLocalSearchParams<{ beneficiaryId: string }>();
  const { token, user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [devices, setDevices] = useState<any>(null);
  const [noraAnalysis, setNoraAnalysis] = useState('');
  const [subInfo, setSubInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [bens, alts, devs] = await Promise.all([
        apiFetch('/api/guardian/beneficiaries', {}, token).catch(() => []),
        apiFetch(`/api/guardian/beneficiary/${beneficiaryId}/alerts`, {}, token).catch(() => []),
        apiFetch(`/api/guardian/beneficiary/${beneficiaryId}/devices`, {}, token).catch(() => null),
      ]);
      const ben = (bens || []).find((b: any) => b.id === beneficiaryId) || null;
      setData(ben);
      setAlerts(Array.isArray(alts) ? alts : []);
      setDevices(devs);
      // Fetch Nora analysis + subscription
      if (ben) {
        apiFetch(`/api/guardian/beneficiary/${beneficiaryId}/ai-report`, {}, token)
          .then((r: any) => setNoraAnalysis(r?.summary || r?.report || ''))
          .catch(() => setNoraAnalysis(''));
        apiFetch(`/api/guardian/beneficiary/${beneficiaryId}/subscription`, {}, token)
          .then((r: any) => setSubInfo(r))
          .catch(() => {});
      }
    } catch {} finally { setLoading(false); }
  }, [beneficiaryId, token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return <FullScreenLoader />;
  if (!data) return <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,0.5)' }}>Beneficiaire non trouve</Text></SafeAreaView>;
  if (Platform.OS !== 'web') return <NativePageView path="/beneficiary-detail" />;

  const v = data.latest_vitals || {};
  const activeAlerts = alerts.filter((a: any) => a.status === 'active' || a.status === 'pending');
  const historyAlerts = alerts.filter((a: any) => a.status !== 'active' && a.status !== 'pending');
  const bracelet = devices?.bracelet || null;
  const scale = devices?.scale || null;
  const vest = devices?.vest || null;
  const age = data.date_of_birth && !isNaN(new Date(data.date_of_birth).getTime())
    ? Math.floor((Date.now() - new Date(data.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365)) : null;

  const Sep = () => <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '18px 0' } as any} />;

  const GlassCard = ({ children, style }: any) => (
    <div style={{ padding: '16px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', marginBottom: 12, ...style } as any}>{children}</div>
  );

  const SectionTitle = ({ icon, label, color }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 } as any}>
      <i className={icon} style={{ fontSize: 15, color }} />
      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</span>
    </div>
  );

  const devList = [
    { label: 'Bracelet Elio', img: IMG_BRACELET, d: bracelet, type: 'bracelet' },
    { label: 'Balance Vita', img: IMG_SCALE, d: scale, type: 'scale' },
    { label: 'Gilet Elder', img: IMG_VEST, d: vest, type: 'vest' },
  ];

  // All health metrics
  const metrics = [
    { label: 'Freq. cardiaque', val: v.heart_rate, unit: 'bpm', icon: 'ri-heart-pulse-line', color: '#EF4444' },
    { label: 'SpO2', val: v.spo2, unit: '%', icon: 'ri-drop-line', color: '#60A5FA' },
    { label: 'Tension', val: v.blood_pressure_systolic ? `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}` : null, unit: 'mmHg', icon: 'ri-pulse-line', color: '#C084FC' },
    { label: 'Temperature', val: v.temperature && v.temperature > 30 ? v.temperature : null, unit: '°C', icon: 'ri-temp-hot-line', color: '#FB923C' },
    { label: 'Pas', val: v.steps, unit: 'pas', icon: 'ri-footprint-line', color: '#10B981' },
    { label: 'Calories', val: v.calories, unit: 'kcal', icon: 'ri-fire-line', color: '#F59E0B' },
    { label: 'Stress', val: v.stress_level, unit: '/100', icon: 'ri-mental-health-line', color: '#A78BFA' },
    { label: 'Recuperation', val: v.recovery_score, unit: '/100', icon: 'ri-heart-add-line', color: '#22D3EE' },
    { label: 'HRV', val: v.hrv, unit: 'ms', icon: 'ri-rhythm-line', color: '#818CF8' },
    { label: 'Poids', val: v.weight, unit: 'kg', icon: 'ri-scales-3-line', color: '#3B82F6' },
    { label: 'Sommeil', val: v.sleep_quality, unit: '%', icon: 'ri-moon-line', color: '#A78BFA' },
  ].filter(m => m.val && m.val !== 0);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 } as any}>
          <div onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}>
            <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} />
          </div>
          <div style={{ width: 52, height: 52, borderRadius: 999, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid rgba(255,255,255,0.15)' } as any}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{data.name?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div style={{ flex: 1 } as any}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{data.name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{[age && `${age} ans`, data.gender === 'male' ? 'Homme' : data.gender === 'female' ? 'Femme' : data.gender].filter(Boolean).join(' · ')}</div>
            {data.address && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}><i className="ri-map-pin-line" style={{ fontSize: 11, marginRight: 4 }} />{data.address}{data.city ? `, ${data.city}` : ''}{data.postal_code ? ` ${data.postal_code}` : ''}</div>}
          </div>
          {data.phone && (
            <a href={`tel:${data.phone}`} style={{ textDecoration: 'none' }}>
              <div style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                <i className="ri-phone-line" style={{ fontSize: 18, color: '#10B981' }} />
              </div>
            </a>
          )}
        </div>

        {/* ── ALERTE ACTIVE ── */}
        {activeAlerts.length > 0 && (
          <div onClick={() => router.push({ pathname: '/(tabs)/alerts', params: { preselect: activeAlerts[0].id } })} style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', marginBottom: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 } as any}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
              <i className="ri-alarm-warning-line" style={{ fontSize: 18, color: '#EF4444' }} />
            </div>
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Alerte active</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{activeAlerts[0].message || 'Intervention en cours'}</div>
            </div>
            <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />
          </div>
        )}

        {/* ── NORA ANALYSE ── */}
        {noraAnalysis && (
          <GlassCard style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.08), rgba(139,92,246,0.03))', border: '1px solid rgba(167,139,250,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } as any}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                <i className="ri-sparkling-2-line" style={{ fontSize: 14, color: '#A78BFA' }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA' }}>Analyse Nora</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{noraAnalysis}</div>
          </GlassCard>
        )}

        {/* ── DISPOSITIFS ── */}
        <SectionTitle icon="ri-bluetooth-connect-line" label="Dispositifs" color="#22D3EE" />
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 } as any}>
          {devList.map((dev, i) => {
            const isVest = dev.type === 'vest';
            const vestAct = isVest && dev.d?.last_sync && (Date.now() - new Date(dev.d.last_sync).getTime()) < 30000;
            const isActive = isVest ? vestAct : dev.d?.connected;
            const statusLabel = !dev.d ? 'Non associe' : isVest ? (vestAct ? 'Actif' : 'Veille') : (dev.d?.connected ? 'OK' : 'Off');
            const statusColor = !dev.d ? '#6B7280' : isVest ? (vestAct ? '#10B981' : '#F59E0B') : (dev.d?.connected ? '#10B981' : '#6B7280');
            const bat = dev.d?.battery_level ?? 0;
            return (
              <div key={i} style={{ flex: 1, padding: '12px 8px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' } as any}>
                <img src={dev.img} alt="" style={{ width: 36, height: 36, objectFit: 'contain', margin: '0 auto 6px', display: 'block', opacity: dev.d ? 1 : 0.25 } as any} />
                <div style={{ fontSize: 10, fontWeight: 700, color: '#FFF', marginBottom: 4 }}>{dev.label}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 99, background: `${statusColor}18` } as any}>
                  <span style={{ width: 4, height: 4, borderRadius: 99, background: statusColor } as any} />
                  <span style={{ fontSize: 8, fontWeight: 700, color: statusColor }}>{statusLabel}</span>
                </div>
                {bat > 0 && <div style={{ fontSize: 10, fontWeight: 700, color: bat > 30 ? '#10B981' : '#EF4444', marginTop: 4 }}>{bat}%</div>}
              </div>
            );
          })}
        </div>

        {/* ── ABONNEMENT + GARDIENS ── */}
        {subInfo?.subscription && (<>
          <Sep />
          <SectionTitle icon="ri-shield-star-line" label="Abonnement Care" color="#7C3AED" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 } as any}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className="ri-shield-star-line" style={{ fontSize: 20, color: '#A78BFA' }} />
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{subInfo.contract?.plan_label || (subInfo.subscription?.subscription_type === 'care' ? 'Chutex Care' : 'Standard')}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{subInfo.contract?.contract_number || ''}</div>
              </div>
              <div style={{ padding: '4px 10px', borderRadius: 99, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.2)' } as any}>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#10B981' }}>Actif</span>
              </div>
            </div>
            {subInfo.contract?.price_monthly && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 } as any}>
                <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', textAlign: 'center' } as any}>
                  <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>Mensuel</div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{subInfo.contract.price_monthly} EUR</div>
                </div>
                {subInfo.contract.price_after_credit && (
                  <div style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(16,185,129,0.06)', textAlign: 'center' } as any}>
                    <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(16,185,129,0.5)', textTransform: 'uppercase', marginBottom: 2 }}>Apres credit impot</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#10B981' }}>{subInfo.contract.price_after_credit} EUR</div>
                  </div>
                )}
              </div>
            )}
            {subInfo.guardians && subInfo.guardians.length > 0 && (<>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 4 }}>Gardiens ({subInfo.guardians.length})</div>
              {subInfo.guardians.map((g: any, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < subInfo.guardians.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' } as any}>
                  <div style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#10B981' }}>{g.name?.charAt(0)}</span>
                  </div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{g.name}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{g.relationship || g.guardian_type || 'Gardien'}{g.phone ? ` · ${g.phone}` : ''}</div>
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#A78BFA', padding: '2px 8px', borderRadius: 99, background: 'rgba(167,139,250,0.1)' }}>#{i + 1}</div>
                </div>
              ))}
            </>)}
        </>)}

        {/* ── DONNEES DE SANTE ── */}
        {metrics.length > 0 && (<>
          <SectionTitle icon="ri-heart-pulse-line" label="Donnees de sante" color="#EF4444" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 4 } as any}>
            {metrics.map((m, i) => (
              <div key={i} style={{ padding: '12px 10px', borderRadius: 16, background: `${m.color}08`, border: `1px solid ${m.color}18` } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 } as any}>
                  <i className={m.icon} style={{ fontSize: 12, color: m.color }} />
                  <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.3 }}>{m.label}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.val}</div>
                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontWeight: 600 }}>{m.unit}</div>
              </div>
            ))}
          </div>
          {metrics.length === 0 && <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Aucune donnee de sante disponible</div>}
        </>)}

        {/* ── DOSSIER MEDICAL ── */}
        <Sep />
        <SectionTitle icon="ri-file-medical-line" label="Dossier medical" color="#A78BFA" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 } as any}>
            {[
              data.blood_type && { label: 'Groupe sanguin', val: data.blood_type, color: '#EF4444' },
              data.date_of_birth && { label: 'Date de naissance', val: (() => { try { const d = new Date(data.date_of_birth); return isNaN(d.getTime()) ? data.date_of_birth : d.toLocaleDateString('fr-FR'); } catch { return data.date_of_birth; } })(), color: '#FFF' },
              data.gender && { label: 'Genre', val: data.gender === 'male' ? 'Homme' : data.gender === 'female' ? 'Femme' : data.gender, color: '#FFF' },
              (data.height_cm || data.weight_kg) && { label: 'Taille / Poids', val: [data.height_cm && `${data.height_cm} cm`, data.weight_kg && `${data.weight_kg} kg`].filter(Boolean).join(' · '), color: '#FFF' },
            ].filter(Boolean).map((item: any, i: number) => (
              <div key={i} style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' } as any}>
                <div style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.val}</div>
              </div>
            ))}
          </div>
          {data.medical_conditions && <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', marginBottom: 6 } as any}><div style={{ fontSize: 8, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', marginBottom: 3 }}>Pathologies</div><div style={{ fontSize: 12, color: '#FFF', lineHeight: 1.5 }}>{data.medical_conditions}</div></div>}
          {data.allergies && <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: 6 } as any}><div style={{ fontSize: 8, fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', marginBottom: 3 }}>Allergies</div><div style={{ fontSize: 12, color: '#FFF', lineHeight: 1.5 }}>{data.allergies}</div></div>}
          {(data.doctor_name || data.emergency_contact_name) && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, marginTop: 6 } as any}>
              {data.doctor_name && <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 } as any}><i className="ri-stethoscope-line" style={{ fontSize: 14, color: '#A78BFA', flexShrink: 0 }} /><div style={{ flex: 1 } as any}><div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase' }}>Medecin traitant</div><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{data.doctor_name}</div></div></div>}
              {data.emergency_contact_name && <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}><i className="ri-shield-user-line" style={{ fontSize: 14, color: '#EF4444', flexShrink: 0 }} /><div style={{ flex: 1 } as any}><div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase' }}>Contact urgence</div><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{data.emergency_contact_name}</div></div>{data.emergency_contact_phone && <a href={`tel:${data.emergency_contact_phone}`} style={{ textDecoration: 'none' }}><div style={{ width: 30, height: 30, borderRadius: 999, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-phone-line" style={{ fontSize: 13, color: '#10B981' }} /></div></a>}</div>}
            </div>
          )}

        {/* ── LOCALISATION ── */}
        <Sep />
        <SectionTitle icon="ri-map-pin-line" label="Localisation" color="#F59E0B" />
        {data.latitude && data.longitude ? (
          <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', height: 160, marginBottom: 4 } as any}>
            <iframe title="map" src={`https://www.openstreetmap.org/export/embed.html?bbox=${data.longitude - 0.01},${data.latitude - 0.01},${data.longitude + 0.01},${data.latitude + 0.01}&layer=mapnik&marker=${data.latitude},${data.longitude}`} style={{ width: '100%', height: '100%', border: 'none' } as any} />
            {data.address && <div style={{ position: 'absolute', bottom: 6, left: 6, right: 6, padding: '6px 10px', borderRadius: 8, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', fontSize: 10, color: '#FFF', fontWeight: 600 } as any}><i className="ri-map-pin-fill" style={{ color: '#EF4444', marginRight: 4, fontSize: 11 }} />{data.address}</div>}
          </div>
        ) : (
          <div style={{ padding: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.03)', borderRadius: 14 } as any}><i className="ri-map-pin-off-line" style={{ fontSize: 24, color: 'rgba(255,255,255,0.12)' }} /><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>Localisation non disponible</div></div>
        )}

        {/* ── HISTORIQUE ALERTES ── */}
        {historyAlerts.length > 0 && (<>
          <Sep />
          <SectionTitle icon="ri-alarm-line" label={`Historique alertes (${historyAlerts.length})`} color="#F59E0B" />
          {historyAlerts.slice(0, 8).map((alert: any) => (
            <div key={alert.id} onClick={() => router.push({ pathname: '/(tabs)/alerts', params: { preselect: alert.id } })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 6, cursor: 'pointer' } as any}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: alert.status === 'resolved' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className={alert.status === 'resolved' ? 'ri-checkbox-circle-line' : 'ri-alarm-warning-line'} style={{ fontSize: 15, color: alert.status === 'resolved' ? '#10B981' : '#F59E0B' }} />
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{alert.message || alert.alert_type}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{new Date(alert.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div style={{ padding: '3px 8px', borderRadius: 99, background: alert.status === 'resolved' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)' } as any}>
                <span style={{ fontSize: 9, fontWeight: 700, color: alert.status === 'resolved' ? '#10B981' : '#F59E0B' }}>{alert.status === 'resolved' ? 'Resolue' : 'Cloturee'}</span>
              </div>
            </div>
          ))}
        </>)}

      </div>
    </div>
  );
}
