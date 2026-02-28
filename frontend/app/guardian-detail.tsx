import React, { useState, useEffect } from 'react';
import FullScreenLoader from '../src/components/FullScreenLoader';
import { View, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const BG = 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/iklovqya_background_beneficiary.svg';
const G: any = { borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };

export default function GuardianDetailScreen() {
  const { guardianId } = useLocalSearchParams<{ guardianId: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [guardian, setGuardian] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Try beneficiary's guardians first
        const guards = await apiFetch('/api/guardians/my', {}, token).catch(() => []);
        let found = (guards || []).find((g: any) => g.id === guardianId);
        // If not found, try company prescriber endpoint (SAAD view)
        if (!found) {
          const res = await apiFetch(`/api/company/prescriber/${guardianId}`, {}, token).catch(() => null);
          // The company endpoint returns { prescriber: {...}, agency: {...}, ... }
          if (res?.prescriber) {
            found = { ...res.prescriber, agency: res.agency, prescriptions: res.prescriptions };
          } else if (res?.id || res?.name) {
            found = res;
          }
        }
        setGuardian(found || null);
      } catch {} finally { setLoading(false); }
    })();
  }, [guardianId, token]);

  if (loading) return <FullScreenLoader />;
  if (!guardian) return <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,0.5)' }}>Gardien non trouve</Text></SafeAreaView>;

  const isPro = guardian.guardian_type === 'professional';

  if (Platform.OS !== 'web') return <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}><Text style={{ color: '#FFF', padding: 20 }}>{guardian.name}</Text></SafeAreaView>;

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>

        {/* Back */}
        <div onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, ...G, cursor: 'pointer', marginBottom: 20 } as any}>
          <i className="ri-arrow-left-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Retour</span>
        </div>

        {/* Avatar + name hero */}
        <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
          <div style={{ width: 88, height: 88, borderRadius: 999, background: isPro ? 'linear-gradient(135deg, #7C5CFF, #A78BFA)' : 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, border: '3px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' } as any}>
            <span style={{ fontSize: 36, fontWeight: 800, color: '#FFF' }}>{guardian.name?.charAt(0)}</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>{guardian.name}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 } as any}>
            <div style={{ padding: '5px 14px', borderRadius: 999, background: isPro ? 'rgba(124,92,255,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${isPro ? 'rgba(124,92,255,0.25)' : 'rgba(255,255,255,0.1)'}` } as any}>
              <span style={{ fontSize: 11, fontWeight: 700, color: isPro ? '#A78BFA' : 'rgba(255,255,255,0.5)' }}>{isPro ? 'Professionnel' : 'Particulier'}</span>
            </div>
            {guardian.relationship && (
              <div style={{ padding: '5px 14px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' } as any}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>{guardian.relationship}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick action buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 } as any}>
          {guardian.phone && (
            <div onClick={() => window.location.href = `tel:${guardian.phone}`} style={{ flex: 1, ...G, padding: '14px', textAlign: 'center', cursor: 'pointer' } as any}>
              <i className="ri-phone-line" style={{ fontSize: 20, color: '#10B981', display: 'block', marginBottom: 6 }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>Appeler</div>
            </div>
          )}
          {guardian.email && (
            <div onClick={() => window.location.href = `mailto:${guardian.email}`} style={{ flex: 1, ...G, padding: '14px', textAlign: 'center', cursor: 'pointer' } as any}>
              <i className="ri-mail-line" style={{ fontSize: 20, color: '#38BDF8', display: 'block', marginBottom: 6 }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: '#38BDF8' }}>Email</div>
            </div>
          )}
        </div>

        {/* Contact info card */}
        <div style={{ ...G, padding: '16px 18px', marginBottom: 14 } as any}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Coordonnees</div>
          {[
            guardian.phone && { icon: 'ri-phone-line', label: 'Telephone', value: guardian.phone, color: '#10B981' },
            guardian.email && { icon: 'ri-mail-line', label: 'Email', value: guardian.email, color: '#38BDF8' },
            guardian.address && { icon: 'ri-map-pin-line', label: 'Adresse', value: guardian.address, color: '#F59E0B' },
          ].filter(Boolean).map((item: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className={item.icon} style={{ fontSize: 16, color: item.color }} />
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 14, color: '#FFF', fontWeight: 600 }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Professional info (if pro) */}
        {isPro && (
          <div style={{ ...G, padding: '16px 18px', marginBottom: 14 } as any}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Informations professionnelles</div>
            {[
              guardian.profession && { icon: 'ri-stethoscope-line', label: 'Profession', value: guardian.profession },
              guardian.structure_name && { icon: 'ri-building-line', label: 'Structure', value: guardian.structure_name },
              guardian.is_intervention_provider && { icon: 'ri-run-line', label: 'Intervenant Care', value: `Rayon ${guardian.intervention_radius_km || 30} km` },
            ].filter(Boolean).map((item: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                <i className={item.icon} style={{ fontSize: 16, color: '#A78BFA', flexShrink: 0 }} />
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 14, color: '#FFF', fontWeight: 600 }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notifications & permissions */}
        <div style={{ ...G, padding: '16px 18px', marginBottom: 14 } as any}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Autorisations</div>
          {[
            { icon: 'ri-alarm-warning-line', label: 'Alertes SOS', desc: 'Recoit les alertes en cas d\'urgence', active: true },
            { icon: 'ri-heart-pulse-line', label: 'Donnees de sante', desc: 'Acces aux constantes vitales', active: true },
            { icon: 'ri-map-pin-line', label: 'Localisation', desc: 'Position en cas d\'alerte uniquement', active: true },
          ].map((perm, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
              <i className={perm.icon} style={{ fontSize: 16, color: perm.active ? '#10B981' : 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{perm.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{perm.desc}</div>
              </div>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: perm.active ? '#10B981' : 'rgba(255,255,255,0.1)' } as any} />
            </div>
          ))}
        </div>

        {/* Lien depuis */}
        <div style={{ ...G, padding: '14px 18px', marginBottom: 14 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
            <i className="ri-links-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} />
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Gardien depuis le <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
          </div>
        </div>

        {/* Delete */}
        <div onClick={() => { if (window.confirm(`Supprimer ${guardian.name} comme gardien ?`)) { apiFetch(`/api/guardians/${guardian.id}/unlink`, { method: 'POST' }, token).then(() => router.back()).catch(() => {}); } }}
          style={{ padding: '16px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
          <i className="ri-delete-bin-line" style={{ fontSize: 14 }} />Supprimer ce gardien
        </div>
      </div>
    </div>
  );
}
