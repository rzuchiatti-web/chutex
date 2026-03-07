import React, { useState, useEffect } from 'react';
import FullScreenLoader from '../src/components/FullScreenLoader';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import NativePageView from '../src/components/NativePageView';

const BG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';

export default function SubscriberDetailScreen() {
  const { subscriberId } = useLocalSearchParams<{ subscriberId: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const subs = await apiFetch('/api/teleassistance/subscribers', {}, token);
        setData((subs || []).find((s: any) => s.id === subscriberId) || null);
      } catch {} finally { setLoading(false); }
    })();
  }, [subscriberId, token]);

  if (loading) return <FullScreenLoader />;
  if (!data) return <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,0.5)' }}>Abonne non trouve</Text></SafeAreaView>;
  if (Platform.OS !== 'web') return <NativePageView path="/subscriber-detail" />;

  const rows = [
    data.phone && { icon: 'ri-phone-line', label: 'Telephone', value: data.phone, phone: true },
    data.email && { icon: 'ri-mail-line', label: 'Email', value: data.email },
    data.address && { icon: 'ri-map-pin-line', label: 'Adresse', value: data.address },
    data.subscription_type && { icon: 'ri-vip-crown-line', label: 'Abonnement', value: data.subscription_type },
    data.blood_type && { icon: 'ri-drop-line', label: 'Groupe sanguin', value: data.blood_type },
    data.medical_conditions && { icon: 'ri-heart-pulse-line', label: 'Pathologies', value: data.medical_conditions },
    data.allergies && { icon: 'ri-alarm-warning-line', label: 'Allergies', value: data.allergies },
    data.doctor_name && { icon: 'ri-stethoscope-line', label: 'Medecin', value: data.doctor_name },
    data.emergency_contact_name && { icon: 'ri-shield-user-line', label: 'Contact urgence', value: `${data.emergency_contact_name}${data.emergency_contact_phone ? ` — ${data.emergency_contact_phone}` : ''}` },
  ].filter(Boolean);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 10 } as any}>
        <div onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Fiche abonne</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
          <div style={{ width: 72, height: 72, borderRadius: 999, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, border: '3px solid rgba(255,255,255,0.2)' } as any}><span style={{ fontSize: 30, fontWeight: 800, color: '#FFF' }}>{data.name?.charAt(0)}</span></div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF' }}>{data.name}</div>
          {data.active_alerts > 0 && <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 999, background: 'rgba(239,68,68,0.2)', marginTop: 8 } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: '#EF4444' } as any} /><span style={{ fontSize: 11, fontWeight: 700, color: '#EF4444' }}>{data.active_alerts} alerte(s)</span></div>}
          {data.latest_vitals && <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 10 } as any}>{data.latest_vitals.heart_rate && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{data.latest_vitals.heart_rate} bpm</div>}{data.latest_vitals.spo2 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>SpO2 {data.latest_vitals.spo2}%</div>}</div>}
        </div>
        <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } as any}>
          {rows.map((item: any, i: number) => (
            <div key={i}>{i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' } as any} />}<div onClick={() => item.phone && (window.location.href = `tel:${item.value}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: item.phone ? 'pointer' : 'default' } as any}><i className={item.icon} style={{ fontSize: 14, color: item.phone ? '#10B981' : 'rgba(255,255,255,0.35)' }} /><div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div><div style={{ fontSize: 14, color: '#FFF', fontWeight: item.phone ? 700 : 500 }}>{item.value}</div></div></div></div>
          ))}
        </div>
      </div>
    </div>
  );
}
