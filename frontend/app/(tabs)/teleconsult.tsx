import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { apiFetch } from '../../src/services/api';
import { s, BG_BLUE } from '../../src/components/teleconsult/teleconsultStyles';

/* ─── Imported sub-components ─── */
import { BeneficiaryTeleconsult } from '../../src/components/teleconsult/BeneficiaryTeleconsult';
import { TeleassistanceDashboard } from '../../src/components/teleconsult/TeleassistanceDashboard';
import { GuardianInterventions } from '../../src/components/teleconsult/GuardianInterventions';
import { AdminIntervenants } from '../../src/components/teleconsult/AdminIntervenants';
import { CompanyInterventionsTab } from '../../src/components/teleconsult/CompanyInterventionsTab';

export default function TeleconsultScreen() {
  const { user, token } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [subData, setSubData] = useState<any>(null);
  const [subLoading, setSubLoading] = useState(true);

  useEffect(() => {
    if (token) {
      apiFetch('/api/subscriptions/my', {}, token).then(d => { setSubData(d); setSubLoading(false); }).catch(() => setSubLoading(false));
    }
  }, [token]);

  if (!user || !token) return null;
  const r = user.active_role || user.role;

  // Company sees interventions with intervenants
  if (r === 'prescriber_company') {
    return <CompanyInterventionsTab token={token} />;
  }

  // Guardian: full screen
  if (r === 'guardian') {
    return <GuardianInterventions token={token} user={user} />;
  }

  // Beneficiary: subscription check + QCM
  if (r === 'beneficiary') {
    const hasSubscription = subData?.has_subscription || user.has_subscription;
    if (subLoading) return null;
    if (!hasSubscription) {
      if (Platform.OS === 'web') {
        return (
          <div data-testid="teleconsult-no-sub" style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', zIndex: 50 } as any}>
            <img src={BG_BLUE} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
            <div style={{ position: 'relative', zIndex: 5, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 30, textAlign: 'center' } as any}>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
                <i className="ri-shield-star-line" style={{ fontSize: 40, color: '#FFF' }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Abonnement requis</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: 340, marginBottom: 28 }}>L'espace teleconsultation necessite un abonnement actif pour beneficier de la teleassistance 24/7.</div>
              <div style={{ padding: '16px 18px', borderRadius: 20, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', marginBottom: 28, width: '100%', maxWidth: 340, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
                {[
                  { icon: 'ri-phone-line', text: 'Plateau d\'ecoute 24h/24, 7j/7' },
                  { icon: 'ri-first-aid-kit-line', text: 'Envoi d\'intervenants a domicile' },
                  { icon: 'ri-map-pin-line', text: 'Suivi GPS en temps reel' },
                  { icon: 'ri-file-text-line', text: 'Rapports d\'intervention' },
                ].map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none' } as any}>
                    <i className={f.icon} style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)' }} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{f.text}</span>
                  </div>
                ))}
              </div>
              <div onClick={() => router.push('/subscription' as any)} style={{ padding: '17px 40px', borderRadius: 999, background: '#FFF', color: '#111', cursor: 'pointer', fontSize: 16, fontWeight: 800, boxShadow: '0 4px 20px rgba(255,255,255,0.2)', marginBottom: 12 } as any}>Souscrire un abonnement</div>
              <div onClick={() => { if (typeof window !== 'undefined') window.open('https://chutex-innovation.com/products/elio-smart-health-bracelet', '_blank'); }} style={{ padding: '15px 40px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', cursor: 'pointer', fontSize: 14, fontWeight: 700 } as any}>Acheter sur chutex-innovation.com</div>
            </div>
          </div>
        );
      }
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 8, textAlign: 'center' }}>Abonnement requis</Text>
          <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22 }}>L'espace teleconsultation necessite un abonnement Chutex Care actif.</Text>
        </View>
      );
    }
    return <BeneficiaryTeleconsult token={token} />;
  }

  // Teleassistance + Admin: full screen web
  if (Platform.OS === 'web') {
    if (r === 'teleassistance') return <TeleassistanceDashboard token={token} />;
    if (r === 'admin') return <AdminIntervenants token={token} />;
  }

  return (
    <View key={r} style={[s.safe, { backgroundColor: '#FFFFFF' }]} testID="teleconsult-screen">
      <View style={s.header}>
        <Text style={[s.title, { color: '#111827' }]}>{r === 'teleassistance' ? 'Teleassistance IA' : r === 'admin' ? 'Intervenants' : 'Teleconsultation'}</Text>
        {r === 'teleassistance' && <Text style={[s.subtitle, { color: '#9CA3AF' }]}>Plateau d'ecoute — Protocole d'escalade</Text>}
      </View>
      {r === 'teleassistance' ? <TeleassistanceDashboard token={token} />
        : r === 'admin' ? <AdminIntervenants token={token} />
        : <BeneficiaryTeleconsult token={token} />}
    </View>
  );
}
