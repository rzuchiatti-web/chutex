import React, { useState, useEffect } from 'react';
import FullScreenLoader from '../src/components/FullScreenLoader';
import { View, Text, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const BG = 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/iklovqya_background_beneficiary.svg';

const DATA_GROUPS = [
  { title: 'Composition globale', keys: [
    { k: 'body_fat_pct', l: 'Graisse corporelle', u: '%', icon: 'ri-droplet-line', c: '#F59E0B' },
    { k: 'fat_mass_kg', l: 'Masse grasse', u: 'kg', icon: 'ri-droplet-line', c: '#F59E0B' },
    { k: 'muscle_pct', l: 'Masse musculaire', u: '%', icon: 'ri-heart-pulse-line', c: '#10B981' },
    { k: 'muscle_mass_kg', l: 'Masse musculaire', u: 'kg', icon: 'ri-heart-pulse-line', c: '#10B981' },
    { k: 'bmi', l: 'IMC', u: '', icon: 'ri-bar-chart-box-line', c: '#38BDF8' },
    { k: 'bone_mass_kg', l: 'Masse osseuse', u: 'kg', icon: 'ri-shield-line', c: '#A78BFA' },
  ]},
  { title: 'Hydratation', keys: [
    { k: 'water_pct', l: 'Taux d\'hydratation', u: '%', icon: 'ri-drop-line', c: '#38BDF8' },
    { k: 'total_body_water_kg', l: 'Eau corporelle totale', u: 'kg', icon: 'ri-drop-line', c: '#38BDF8' },
    { k: 'intracellular_water_kg', l: 'Eau intracellulaire', u: 'kg', icon: 'ri-drop-line', c: '#22D3EE' },
    { k: 'extracellular_water_kg', l: 'Eau extracellulaire', u: 'kg', icon: 'ri-drop-line', c: '#0EA5E9' },
  ]},
  { title: 'Graisse detaillee', keys: [
    { k: 'visceral_fat', l: 'Graisse viscerale', u: '', icon: 'ri-fire-line', c: '#EF4444' },
    { k: 'subcutaneous_fat_pct', l: 'Graisse sous-cutanee', u: '%', icon: 'ri-droplet-line', c: '#F59E0B' },
    { k: 'trunk_fat_kg', l: 'Graisse du tronc', u: 'kg', icon: 'ri-body-scan-line', c: '#F97316' },
  ]},
  { title: 'Muscles & Proteines', keys: [
    { k: 'protein_pct', l: 'Taux de proteine', u: '%', icon: 'ri-flask-line', c: '#10B981' },
    { k: 'skeletal_muscle_pct', l: 'Muscle squelettique', u: '%', icon: 'ri-shield-check-line', c: '#10B981' },
    { k: 'skeletal_muscle_quality', l: 'Qualite musculaire', u: '/100', icon: 'ri-award-line', c: '#22D3EE' },
  ]},
  { title: 'Metabolisme', keys: [
    { k: 'basal_metabolism', l: 'Metabolisme de base', u: 'kcal', icon: 'ri-fire-line', c: '#F59E0B' },
    { k: 'recommended_calories', l: 'Apport recommande', u: 'kcal', icon: 'ri-restaurant-line', c: '#F97316' },
    { k: 'body_age', l: 'Age corporel', u: 'ans', icon: 'ri-timer-line', c: '#A78BFA' },
    { k: 'body_type', l: 'Type corporel', u: '', icon: 'ri-body-scan-line', c: '#38BDF8' },
    { k: 'waist_hip_ratio', l: 'Ratio taille-hanche', u: '', icon: 'ri-ruler-line', c: '#EF4444' },
    { k: 'minerals_kg', l: 'Mineraux', u: 'kg', icon: 'ri-contrast-2-line', c: '#A78BFA' },
  ]},
  { title: 'Segmentaire — Bras', keys: [
    { k: 'left_arm_fat_pct', l: 'Graisse bras G', u: '%', icon: 'ri-hand-heart-line', c: '#F59E0B' },
    { k: 'right_arm_fat_pct', l: 'Graisse bras D', u: '%', icon: 'ri-hand-heart-line', c: '#F59E0B' },
    { k: 'left_arm_muscle_pct', l: 'Muscle bras G', u: '%', icon: 'ri-hand-heart-line', c: '#10B981' },
    { k: 'right_arm_muscle_pct', l: 'Muscle bras D', u: '%', icon: 'ri-hand-heart-line', c: '#10B981' },
  ]},
  { title: 'Segmentaire — Jambes', keys: [
    { k: 'left_leg_fat_pct', l: 'Graisse jambe G', u: '%', icon: 'ri-footprint-line', c: '#F59E0B' },
    { k: 'right_leg_fat_pct', l: 'Graisse jambe D', u: '%', icon: 'ri-footprint-line', c: '#F59E0B' },
    { k: 'left_leg_muscle_kg', l: 'Muscle jambe G', u: 'kg', icon: 'ri-footprint-line', c: '#10B981' },
    { k: 'right_leg_muscle_kg', l: 'Muscle jambe D', u: 'kg', icon: 'ri-footprint-line', c: '#10B981' },
  ]},
];

export default function WeighingReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await apiFetch('/api/health/daily-report', {}, token);
        const w = (r?.weighings || []).find((w: any) => w.id === id) || r?.weighings?.[0];
        setReport(w);
      } catch {} finally { setLoading(false); }
    })();
  }, [id, token]);

  if (Platform.OS !== 'web') return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#FFF' }}>Web uniquement</Text></View>;
  if (loading) return <FullScreenLoader />;
  if (!report) return <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0f1a' } as any}><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Pesee introuvable</div></div>;

  const w = report;
  const dt = new Date(w.date);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>

        {/* Back */}
        <div onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', marginBottom: 16 } as any}>
          <i className="ri-arrow-left-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }} /><span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Retour</span>
        </div>

        {/* Hero weight */}
        <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>{dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} a {dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
          <div style={{ fontSize: 64, fontWeight: 900, color: '#FFF', letterSpacing: -2, lineHeight: 1 }}>{w.weight}<span style={{ fontSize: 24, color: 'rgba(255,255,255,0.3)' }}> kg</span></div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 999, background: w.status === 'Bonne' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', border: `1px solid ${w.status === 'Bonne' ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`, marginTop: 12 } as any}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: w.status === 'Bonne' ? '#10B981' : '#F59E0B' } as any} />
            <span style={{ fontSize: 12, fontWeight: 700, color: w.status === 'Bonne' ? '#10B981' : '#F59E0B' }}>{w.status} · {w.score}/100</span>
          </div>
        </div>

        {/* Data groups */}
        {DATA_GROUPS.map((group) => {
          const hasData = group.keys.some(k => w[k.k] !== undefined && w[k.k] !== null);
          if (!hasData) return null;
          return (
            <div key={group.title} style={{ marginBottom: 14 } as any}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 } as any}>
                {group.title}<div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' } as any} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } as any}>
                {group.keys.map(k => {
                  const val = w[k.k];
                  if (val === undefined || val === null) return null;
                  return (
                    <div key={k.k} onClick={() => router.push({ pathname: '/metric-detail' as any, params: { key: k.k } })} style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', cursor: 'pointer', transition: 'transform 0.2s' } as any}
                      onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 } as any}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${k.c}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                          <i className={k.icon} style={{ fontSize: 13, color: k.c }} />
                        </div>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{k.l}</span>
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{typeof val === 'number' ? (val % 1 === 0 ? val.toLocaleString() : val.toFixed(1)) : val}<span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginLeft: 4 }}>{k.u}</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}
