import React, { useState, useEffect } from 'react';
import FullScreenLoader from '../src/components/FullScreenLoader';
import { View, Text, ActivityIndicator, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const BG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';

export default function GuardianDetailScreen() {
  const { guardianId } = useLocalSearchParams<{ guardianId: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [guardian, setGuardian] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const guards = await apiFetch('/api/guardians/my', {}, token);
        setGuardian((guards || []).find((g: any) => g.id === guardianId) || null);
      } catch {} finally { setLoading(false); }
    })();
  }, [guardianId, token]);

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#FFF" /></SafeAreaView>;
  if (!guardian) return <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,0.5)' }}>Gardien non trouve</Text></SafeAreaView>;

  const isPro = guardian.guardian_type === 'professional';
  const rows = [
    guardian.phone && { icon: 'ri-phone-line', label: 'Telephone', value: guardian.phone, phone: true },
    guardian.email && { icon: 'ri-mail-line', label: 'Email', value: guardian.email },
    guardian.address && { icon: 'ri-map-pin-line', label: 'Adresse', value: guardian.address },
    guardian.relationship && { icon: 'ri-heart-line', label: 'Lien', value: guardian.relationship },
    guardian.profession && { icon: 'ri-stethoscope-line', label: 'Profession', value: guardian.profession },
    guardian.structure_name && { icon: 'ri-building-line', label: 'Structure', value: guardian.structure_name },
    { icon: 'ri-shield-check-line', label: 'Type', value: isPro ? 'Professionnel' : 'Particulier' },
  ].filter(Boolean);

  if (Platform.OS !== 'web') return <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}><Text style={{ color: '#FFF', padding: 20 }}>{guardian.name}</Text></SafeAreaView>;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 10 } as any}>
        <div onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Fiche gardien</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
        {/* Avatar + name */}
        <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
          <div style={{ width: 72, height: 72, borderRadius: 999, background: isPro ? 'linear-gradient(135deg, #7C5CFF, #A78BFA)' : 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, border: '3px solid rgba(255,255,255,0.2)' } as any}><span style={{ fontSize: 30, fontWeight: 800, color: '#FFF' }}>{guardian.name?.charAt(0)}</span></div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF' }}>{guardian.name}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 } as any}>
            {isPro && <div style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(124,92,255,0.2)', border: '1px solid rgba(124,92,255,0.3)' } as any}><span style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA' }}>Professionnel</span></div>}
            {!isPro && <div style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' } as any}><span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Particulier</span></div>}
          </div>
        </div>
        {/* Info card */}
        <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14 } as any}>
          {rows.map((item: any, i: number) => (
            <div key={i}>
              {i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' } as any} />}
              <div onClick={() => item.phone && (window.location.href = `tel:${item.value}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: item.phone ? 'pointer' : 'default' } as any}>
                <i className={item.icon} style={{ fontSize: 14, color: item.phone ? '#10B981' : 'rgba(255,255,255,0.35)', flexShrink: 0 }} />
                <div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div><div style={{ fontSize: 14, color: '#FFF', fontWeight: item.phone ? 700 : 500 }}>{item.value}</div></div>
                {item.phone && <i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981' }} />}
              </div>
            </div>
          ))}
        </div>
        {/* Delete */}
        <div onClick={() => { if (window.confirm(`Supprimer ${guardian.name} comme gardien ?`)) { apiFetch(`/api/guardians/${guardian.id}/unlink`, { method: 'POST' }, token).then(() => router.back()).catch(() => {}); } }} style={{ padding: '14px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}><i className="ri-delete-bin-line" style={{ fontSize: 14 }} />Supprimer ce gardien</div>
      </div>
    </div>
  );
}
