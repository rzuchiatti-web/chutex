import React, { useState, useEffect } from 'react';
import FullScreenLoader from '../src/components/FullScreenLoader';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import NativePageView from '../src/components/NativePageView';

const BG_VIOLET = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/v6obzpez_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_28_20.png';

export default function CompanyIntervenantDétailScreen() {
  const { intervenantId } = useLocalSearchParams<{ intervenantId: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setData(await apiFetch(`/api/company/intervenant/${intervenantId}`, {}, token)); }
      catch {} finally { setLoading(false); }
    })();
  }, [intervenantId, token]);

  if (loading) return <FullScreenLoader />;
  if (!data) return <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,0.5)' }}>Intervenant non trouve</Text></SafeAreaView>;
  if (Platform.OS !== 'web') return <NativePageView path="/company-intervenant-detail" />;

  const p = data.intervenant || data;
  const interventions = data.interventions || [];
  const agency = data.agency;
  const activeCount = data.active_interventions || 0;
  const completedCount = data.completed_interventions || 0;
  const totalCount = data.total_interventions || interventions.length;

  const profileRows = [
    p.phone && { icon: 'ri-phone-line', label: 'Telephone', value: p.phone, phone: true },
    p.email && { icon: 'ri-mail-line', label: 'Email', value: p.email },
    p.profession && { icon: 'ri-stethoscope-line', label: 'Profession', value: p.profession },
    p.structure_name && { icon: 'ri-building-line', label: 'Structure', value: p.structure_name },
    p.address && { icon: 'ri-map-pin-line', label: 'Adresse', value: p.address },
    agency?.name && { icon: 'ri-community-line', label: 'Agence', value: agency.name },
    p.intervention_radius_km && { icon: 'ri-compass-3-line', label: 'Rayon d\'intervention', value: `${p.intervention_radius_km} km` },
    p.guardian_type && { icon: 'ri-user-star-line', label: 'Type', value: p.guardian_type === 'professional' ? 'Professionnel' : 'Particulier' },
    p.is_prescriber && { icon: 'ri-file-text-line', label: 'Prescripteur', value: 'Oui' },
    p.prescriber_structure && { icon: 'ri-hospital-line', label: 'Structure prescripteur', value: p.prescriber_structure },
  ].filter(Boolean);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
      <img src={BG_VIOLET} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 10 } as any}>
        <div onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Fiche intervenant</div>
        <div style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(124,92,255,0.2)', border: '1px solid rgba(124,92,255,0.3)', marginLeft: 'auto' } as any}><span style={{ fontSize: 10, fontWeight: 700, color: '#A78BFA' }}>Care</span></div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
          <div style={{ width: 72, height: 72, borderRadius: 999, background: 'linear-gradient(135deg, #7C5CFF, #A78BFA)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, border: '3px solid rgba(255,255,255,0.2)' } as any}><span style={{ fontSize: 30, fontWeight: 800, color: '#FFF' }}>{p.name?.charAt(0)}</span></div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#FFF' }}>{p.name}</div>
          {p.profession && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{p.profession}</div>}
        </div>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 } as any}>
          <div style={{ padding: '14px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' } as any}><div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{totalCount}</div><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginTop: 2 }}>Missions</div></div>
          <div style={{ padding: '14px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' } as any}><div style={{ fontSize: 22, fontWeight: 900, color: '#10B981' }}>{completedCount}</div><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginTop: 2 }}>Terminees</div></div>
          <div style={{ padding: '14px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' } as any}><div style={{ fontSize: 22, fontWeight: 900, color: '#F59E0B' }}>{activeCount}</div><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginTop: 2 }}>Actives</div></div>
        </div>
        {/* Profile */}
        <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 14 } as any}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Profil</div>
          {profileRows.map((item: any, i: number, arr: any[]) => (
            <div key={i}>
              <div onClick={() => item.phone && (window.location.href = `tel:${item.value}`)} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: item.phone ? 'pointer' : 'default', padding: '10px 0' } as any}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: item.phone ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.08)', border: `1px solid ${item.phone ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className={item.icon} style={{ fontSize: 15, color: item.phone ? '#10B981' : 'rgba(255,255,255,0.5)' }} /></div>
                <div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{item.label}</div><div style={{ fontSize: 14, color: '#FFF', fontWeight: item.phone ? 700 : 500 }}>{item.value}</div></div>
              </div>
              {i < arr.length - 1 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' } as any} />}
            </div>
          ))}
        </div>
        {/* Interventions list */}
        {interventions.length > 0 && (
          <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' } as any}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Interventions ({interventions.length})</div>
            {interventions.map((iv: any, i: number) => (
              <div key={iv.id || i}>
                {i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' } as any} />}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{iv.beneficiary_name || 'Intervention'}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{iv.alert_message || iv.alert_type || ''}</div>
                    {iv.created_at && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{new Date(iv.created_at).toLocaleDateString('fr-FR')}</div>}
                  </div>
                  <div style={{ padding: '4px 10px', borderRadius: 999, background: iv.status === 'completed' ? 'rgba(16,185,129,0.2)' : 'rgba(124,92,255,0.2)' } as any}><span style={{ fontSize: 10, fontWeight: 700, color: iv.status === 'completed' ? '#10B981' : '#A78BFA' }}>{iv.status === 'completed' ? 'Terminee' : 'En cours'}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
