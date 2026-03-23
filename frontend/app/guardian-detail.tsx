import React, { useState, useEffect } from 'react';
import FullScreenLoader from '../src/components/FullScreenLoader';
import { View, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import NativePageView from '../src/components/NativePageView';

export default function GuardianDetailScreen() {
  const { guardianId } = useLocalSearchParams<{ guardianId: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [guardian, setGuardian] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const check = () => setIsDark(localStorage.getItem('chutex_dark') !== '0');
      check();
      const iv = setInterval(check, 400);
      return () => clearInterval(iv);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const guards = await apiFetch('/api/guardians/my', {}, token).catch(() => []);
        let found = (guards || []).find((g: any) => g.id === guardianId);
        if (!found) {
          const res = await apiFetch(`/api/company/prescriber/${guardianId}`, {}, token).catch(() => null);
          if (res?.prescriber) found = { ...res.prescriber, agency: res.agency, prescriptions: res.prescriptions };
          else if (res?.id || res?.name) found = res;
        }
        setGuardian(found || null);
      } catch {} finally { setLoading(false); }
    })();
  }, [guardianId, token]);

  if (loading) return <FullScreenLoader />;
  if (!guardian) return <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#000' : '#F5F5F5', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}>Gardien non trouve</Text></SafeAreaView>;

  const isPro = guardian.guardian_type === 'professional';

  if (Platform.OS !== 'web') return <NativePageView path="/guardian-detail" />;

  const C = isDark
    ? { bg: 'linear-gradient(180deg, #1a1a24 0%, #111118 100%)', card: 'rgba(70,70,78,0.85)', text: '#FFF', sub: 'rgba(255,255,255,0.4)', sep: 'rgba(255,255,255,0.04)', sectionLabel: 'rgba(255,255,255,0.3)' }
    : { bg: '#F5F5F5', card: '#E8E8EA', text: '#1A1A2E', sub: 'rgba(0,0,0,0.4)', sep: 'rgba(0,0,0,0.06)', sectionLabel: 'rgba(0,0,0,0.3)' };
  const glass = { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', background: C.bg } as any}>

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>

        {/* Back */}
        <div onClick={() => router.back()} data-testid="guardian-back-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: C.card, border: `1px solid ${C.sep}`, ...glass, cursor: 'pointer', marginBottom: 20 } as any}>
          <i className="ri-arrow-left-line" style={{ fontSize: 16, color: C.sub }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>Retour</span>
        </div>

        {/* Avatar + name hero */}
        <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
          <div style={{ width: 88, height: 88, borderRadius: 999, background: guardian.avatar_url ? 'transparent' : '#3A3A42', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, border: isDark ? '3px solid rgba(255,255,255,0.12)' : '3px solid rgba(0,0,0,0.06)', overflow: 'hidden' } as any}>
            {guardian.avatar_url
              ? <img src={guardian.avatar_url} style={{ width: 88, height: 88, objectFit: 'cover', borderRadius: 999 } as any} />
              : <span style={{ fontSize: 36, fontWeight: 800, color: '#FFF' }}>{guardian.name?.charAt(0)}</span>
            }
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: C.text, marginBottom: 4 }}>{guardian.name}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 } as any}>
            <div style={{ padding: '5px 14px', borderRadius: 999, background: isPro ? 'rgba(124,92,255,0.12)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'), border: `1px solid ${isPro ? 'rgba(124,92,255,0.2)' : C.sep}` } as any}>
              <span style={{ fontSize: 11, fontWeight: 700, color: isPro ? '#A78BFA' : C.sub }}>{isPro ? 'Professionnel' : 'Particulier'}</span>
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
            <div onClick={() => window.location.href = `tel:${guardian.phone}`} style={{ flex: 1, borderRadius: 20, background: C.card, border: `1px solid ${C.sep}`, ...glass, padding: '14px', textAlign: 'center', cursor: 'pointer' } as any}>
              <i className="ri-phone-line" style={{ fontSize: 20, color: '#10B981', display: 'block', marginBottom: 6 }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>Appeler</div>
            </div>
          )}
          {guardian.email && (
            <div onClick={() => window.location.href = `mailto:${guardian.email}`} style={{ flex: 1, borderRadius: 20, background: C.card, border: `1px solid ${C.sep}`, ...glass, padding: '14px', textAlign: 'center', cursor: 'pointer' } as any}>
              <i className="ri-mail-line" style={{ fontSize: 20, color: '#38BDF8', display: 'block', marginBottom: 6 }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: '#38BDF8' }}>Email</div>
            </div>
          )}
        </div>

        {/* Contact info card */}
        <div style={{ borderRadius: 20, background: C.card, border: `1px solid ${C.sep}`, ...glass, padding: '16px 18px', marginBottom: 14 } as any}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.sectionLabel, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Coordonnees</div>
          {[
            guardian.phone && { icon: 'ri-phone-line', label: 'Telephone', value: guardian.phone, color: '#10B981' },
            guardian.email && { icon: 'ri-mail-line', label: 'Email', value: guardian.email, color: '#38BDF8' },
            guardian.address && { icon: 'ri-map-pin-line', label: 'Adresse', value: guardian.address, color: '#F59E0B' },
          ].filter(Boolean).map((item: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? `1px solid ${C.sep}` : 'none' } as any}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className={item.icon} style={{ fontSize: 16, color: item.color }} />
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 9, fontWeight: 600, color: C.sectionLabel, textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Professional info (if pro) */}
        {isPro && (
          <div style={{ borderRadius: 20, background: C.card, border: `1px solid ${C.sep}`, ...glass, padding: '16px 18px', marginBottom: 14 } as any}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.sectionLabel, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Informations professionnelles</div>
            {[
              guardian.profession && { icon: 'ri-stethoscope-line', label: 'Profession', value: guardian.profession },
              guardian.structure_name && { icon: 'ri-building-line', label: 'Structure', value: guardian.structure_name },
              guardian.is_intervention_provider && { icon: 'ri-run-line', label: 'Intervenant Care', value: `Rayon ${guardian.intervention_radius_km || 30} km` },
            ].filter(Boolean).map((item: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? `1px solid ${C.sep}` : 'none' } as any}>
                <i className={item.icon} style={{ fontSize: 16, color: '#A78BFA', flexShrink: 0 }} />
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: C.sectionLabel, textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notifications & permissions */}
        <div style={{ borderRadius: 20, background: C.card, border: `1px solid ${C.sep}`, ...glass, padding: '16px 18px', marginBottom: 14 } as any}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.sectionLabel, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Autorisations</div>
          {[
            { icon: 'ri-alarm-warning-line', label: 'Alertes SOS', desc: 'Recoit les alertes en cas d\'urgence', active: true },
            { icon: 'ri-heart-pulse-line', label: 'Donnees de sante', desc: 'Acces aux constantes vitales', active: true },
            { icon: 'ri-map-pin-line', label: 'Localisation', desc: 'Position en cas d\'alerte uniquement', active: true },
          ].map((perm, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i > 0 ? `1px solid ${C.sep}` : 'none' } as any}>
              <i className={perm.icon} style={{ fontSize: 16, color: perm.active ? '#10B981' : C.sub, flexShrink: 0 }} />
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{perm.label}</div>
                <div style={{ fontSize: 11, color: C.sub }}>{perm.desc}</div>
              </div>
              <div style={{ width: 10, height: 10, borderRadius: 5, background: perm.active ? '#10B981' : C.sub } as any} />
            </div>
          ))}
        </div>

        {/* Lien depuis */}
        <div style={{ borderRadius: 20, background: C.card, border: `1px solid ${C.sep}`, ...glass, padding: '14px 18px', marginBottom: 14 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
            <i className="ri-links-line" style={{ fontSize: 14, color: C.sub }} />
            <div style={{ fontSize: 12, color: C.sub }}>Gardien depuis le <span style={{ color: C.text, fontWeight: 700 }}>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
          </div>
        </div>

        {/* Delete */}
        <div onClick={() => { if (window.confirm(`Supprimer ${guardian.name} comme gardien ?`)) { apiFetch(`/api/guardians/${guardian.id}/unlink`, { method: 'POST' }, token).then(() => router.back()).catch(() => {}); } }}
          data-testid="guardian-delete-btn"
          style={{ padding: '16px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#EF4444', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
          <i className="ri-delete-bin-line" style={{ fontSize: 14 }} />Supprimer ce gardien
        </div>
      </div>
    </div>
  );
}
