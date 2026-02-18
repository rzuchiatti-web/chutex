import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const BG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';

export default function CompanyPrescriberDetailScreen() {
  const { prescriberId } = useLocalSearchParams<{ prescriberId: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setData(await apiFetch(`/api/company/prescriber/${prescriberId}`, {}, token)); }
      catch {} finally { setLoading(false); }
    })();
  }, [prescriberId, token]);

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#FFF" /></SafeAreaView>;
  if (!data) return <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,0.5)' }}>Prescripteur non trouve</Text></SafeAreaView>;
  if (Platform.OS !== 'web') return <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}><Text style={{ color: '#FFF', padding: 20 }}>{data.name}</Text></SafeAreaView>;

  const rows = [
    data.phone && { icon: 'ri-phone-line', label: 'Telephone', value: data.phone, phone: true },
    data.email && { icon: 'ri-mail-line', label: 'Email', value: data.email },
    data.structure_name && { icon: 'ri-building-line', label: 'Structure', value: data.structure_name },
    data.profession && { icon: 'ri-stethoscope-line', label: 'Profession', value: data.profession },
    data.address && { icon: 'ri-map-pin-line', label: 'Adresse', value: data.address },
    data.prescriptions_count != null && { icon: 'ri-file-text-line', label: 'Prescriptions', value: data.prescriptions_count },
    data.total_commission != null && { icon: 'ri-money-euro-circle-line', label: 'Commission totale', value: `${data.total_commission} EUR` },
  ].filter(Boolean);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 10 } as any}>
        <div onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Fiche prescripteur</div>
        <div style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(212,132,90,0.2)', border: '1px solid rgba(212,132,90,0.3)', marginLeft: 'auto' } as any}><span style={{ fontSize: 10, fontWeight: 700, color: '#D4845A' }}>Prescripteur</span></div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
          <div style={{ width: 72, height: 72, borderRadius: 999, background: 'rgba(212,132,90,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, border: '3px solid rgba(212,132,90,0.3)' } as any}><span style={{ fontSize: 30, fontWeight: 800, color: '#D4845A' }}>{data.name?.charAt(0)}</span></div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF' }}>{data.name}</div>
          {data.structure_name && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{data.structure_name}</div>}
        </div>
        <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14 } as any}>
          {rows.map((item: any, i: number) => (
            <div key={i}>{i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' } as any} />}<div onClick={() => item.phone && (window.location.href = `tel:${item.value}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: item.phone ? 'pointer' : 'default' } as any}><i className={item.icon} style={{ fontSize: 14, color: item.phone ? '#10B981' : 'rgba(255,255,255,0.35)' }} /><div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div><div style={{ fontSize: 14, color: '#FFF', fontWeight: item.phone ? 700 : 500 }}>{item.value}</div></div></div></div>
          ))}
        </div>
        {/* Prescriptions list */}
        {data.prescriptions?.length > 0 && (<div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } as any}><div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Prescriptions ({data.prescriptions.length})</div>{data.prescriptions.map((p: any, i: number) => (<div key={p.id || i}>{i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' } as any} />}<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}><div><div style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{p.beneficiary_name}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{p.subscription_type || 'Standard'}</div></div><div style={{ padding: '2px 8px', borderRadius: 999, background: p.status === 'subscribed' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)' } as any}><span style={{ fontSize: 9, fontWeight: 600, color: p.status === 'subscribed' ? '#10B981' : '#F59E0B' }}>{p.status === 'subscribed' ? 'Validee' : 'En attente'}</span></div></div></div>))}</div>)}
      </div>
    </div>
  );
}
