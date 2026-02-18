import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const BG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';

export default function BeneficiaryDetailScreen() {
  const { beneficiaryId } = useLocalSearchParams<{ beneficiaryId: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const bens = await apiFetch('/api/guardian/beneficiaries', {}, token);
        setData((bens || []).find((b: any) => b.id === beneficiaryId) || null);
      } catch {} finally { setLoading(false); }
    })();
  }, [beneficiaryId, token]);

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#FFF" /></SafeAreaView>;
  if (!data) return <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,0.5)' }}>Beneficiaire non trouve</Text></SafeAreaView>;
  if (Platform.OS !== 'web') return <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}><Text style={{ color: '#FFF', padding: 20 }}>{data.name}</Text></SafeAreaView>;

  const rows = [
    data.phone && { icon: 'ri-phone-line', label: 'Telephone', value: data.phone, phone: true },
    data.email && { icon: 'ri-mail-line', label: 'Email', value: data.email },
    data.address && { icon: 'ri-map-pin-line', label: 'Adresse', value: data.address },
    data.date_of_birth && { icon: 'ri-calendar-line', label: 'Date de naissance', value: data.date_of_birth },
    data.blood_type && { icon: 'ri-drop-line', label: 'Groupe sanguin', value: data.blood_type, color: '#EF4444' },
    data.medical_conditions && { icon: 'ri-heart-pulse-line', label: 'Pathologies', value: data.medical_conditions, highlight: true, color: '#F59E0B' },
    data.allergies && { icon: 'ri-alarm-warning-line', label: 'Allergies', value: data.allergies, highlight: true, color: '#EF4444' },
    data.doctor_name && { icon: 'ri-stethoscope-line', label: 'Medecin traitant', value: data.doctor_name + (data.doctor_phone ? ` — ${data.doctor_phone}` : ''), phone: data.doctor_phone },
    data.emergency_contact_name && { icon: 'ri-shield-user-line', label: 'Contact urgence', value: data.emergency_contact_name + (data.emergency_contact_phone ? ` — ${data.emergency_contact_phone}` : ''), phone: data.emergency_contact_phone },
    data.subscription_type && { icon: 'ri-vip-crown-line', label: 'Abonnement', value: data.subscription_type },
  ].filter(Boolean);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 10 } as any}>
        <div onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Fiche beneficiaire</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
          <div style={{ width: 72, height: 72, borderRadius: 999, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, border: '3px solid rgba(255,255,255,0.2)' } as any}><span style={{ fontSize: 30, fontWeight: 800, color: '#FFF' }}>{data.name?.charAt(0)}</span></div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF' }}>{data.name}</div>
          {data.active_alerts > 0 && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 999, background: 'rgba(239,68,68,0.2)', marginTop: 8 } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: '#EF4444' } as any} /><span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444' }}>{data.active_alerts} alerte(s)</span></div>}
          {data.latest_vitals && <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 10 } as any}>{data.latest_vitals.heart_rate && <div style={{ padding: '6px 12px', borderRadius: 999, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' } as any}><span style={{ fontSize: 13, fontWeight: 700, color: '#EF4444' }}>{data.latest_vitals.heart_rate} bpm</span></div>}{data.latest_vitals.spo2 && <div style={{ padding: '6px 12px', borderRadius: 999, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' } as any}><span style={{ fontSize: 13, fontWeight: 700, color: '#3B82F6' }}>SpO2 {data.latest_vitals.spo2}%</span></div>}</div>}
        </div>
        <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } as any}>
          {rows.map((item: any, i: number) => (
            <div key={i}>
              {i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' } as any} />}
              {item.highlight ? (
                <div style={{ padding: '10px 12px', borderRadius: 12, background: `${item.color}12`, border: `1px solid ${item.color}25` } as any}><div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}><i className={item.icon} style={{ fontSize: 14, color: item.color }} /><div style={{ fontSize: 9, fontWeight: 600, color: item.color, textTransform: 'uppercase' }}>{item.label}</div></div><div style={{ fontSize: 13, color: '#FFF', marginTop: 4, lineHeight: 1.4 }}>{item.value}</div></div>
              ) : (
                <div onClick={() => item.phone && (window.location.href = `tel:${item.phone === true ? item.value : item.phone}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: item.phone ? 'pointer' : 'default' } as any}><i className={item.icon} style={{ fontSize: 14, color: item.phone ? '#10B981' : (item.color || 'rgba(255,255,255,0.35)') }} /><div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div><div style={{ fontSize: 14, color: '#FFF', fontWeight: item.phone ? 700 : 500 }}>{item.value}</div></div>{item.phone && <i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981' }} />}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
