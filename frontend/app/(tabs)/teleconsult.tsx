import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { apiFetch } from '../../src/services/api';
import { s, BG_BLUE } from '../../src/components/teleconsult/teleconsultStyles';

/* Sub-components */
import { BeneficiaryTeleconsult } from '../../src/components/teleconsult/BeneficiaryTeleconsult';
import { TeleassistanceDashboard } from '../../src/components/teleconsult/TeleassistanceDashboard';
import { GuardianInterventions } from '../../src/components/teleconsult/GuardianInterventions';
import { AdminIntervenants } from '../../src/components/teleconsult/AdminIntervenants';
import { CompanyInterventionsTab } from '../../src/components/teleconsult/CompanyInterventionsTab';
import ProSpace from '../../src/components/dashboard/ProSpace';

/* ── Beneficiary Messages Content (embedded pro-chat with header rouge style) ── */
function BeneficiaryMessagesContent({ token, user, router }: { token: string; user: any; router: any }) {
  const [convos, setConvos] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!token) return;
    apiFetch('/api/pro/conversations', {}, token).then((c: any) => {
      setConvos(Array.isArray(c) ? c : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF' }}><i className="ri-loader-4-line" style={{ fontSize: 24, animation: 'spin 0.8s linear infinite', display: 'block', marginBottom: 8 }} />Chargement...</div>;

  if (convos.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px 20px' } as any}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: '#F4F4F5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' } as any}>
        <i className="ri-chat-3-line" style={{ fontSize: 28, color: '#9CA3AF' }} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#111', marginBottom: 6 }}>Aucune conversation</div>
      <div style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.5 }}>Lorsqu'un professionnel vous prendra en charge, vos messages apparaitront ici.</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 } as any}>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}' }} />
      {convos.map((c: any) => (
        <div key={c.id || c.professional_id} data-testid={`convo-${c.professional_id}`}
          onClick={() => router.push({ pathname: '/pro-chat', params: { proId: c.professional_id } })}
          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 18, background: '#F4F4F5', cursor: 'pointer', transition: 'transform 0.15s' } as any}
          onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
          <div style={{ width: 48, height: 48, borderRadius: 999, background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{(c.professional_name || '?').charAt(0)}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 } as any}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>{c.professional_name || 'Professionnel'}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{c.last_message || 'Commencer la conversation'}</div>
          </div>
          {c.unread_count > 0 && (
            <div style={{ width: 22, height: 22, borderRadius: 999, background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#FFF' }}>{c.unread_count}</span>
            </div>
          )}
          <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: '#D1D5DB' }} />
        </div>
      ))}
    </div>
  );
}

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

  // Professional: show ProSpace (programs management)
  if (r === 'professional') {
    return <ProSpace token={token} user={user} />;
  }

  // Company sees interventions with intervenants
  if (r === 'prescriber_company') {
    return <CompanyInterventionsTab token={token} />;
  }

  // Guardian: full screen
  if (r === 'guardian') {
    return <GuardianInterventions token={token} user={user} />;
  }

  // Beneficiary: show Messages page (pro-chat) with guardian-style layout
  if (r === 'beneficiary') {
    if (Platform.OS === 'web') {
      const BG_RED_MSG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
      return (
        <div data-testid="beneficiary-messages-tab" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#FFF' } as any}>
          <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
            {/* RED HEADER */}
            <div style={{ position: 'relative', zIndex: 1, minHeight: 140 } as any}>
              <img src={BG_RED_MSG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
              <div style={{ position: 'relative', zIndex: 2, padding: '28px 20px 40px' } as any}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', letterSpacing: -0.5, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>Messages</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>Echangez avec votre professionnel de sante</div>
              </div>
            </div>
            {/* WHITE CONTENT */}
            <div style={{ padding: '24px 20px 120px', marginTop: -20, borderRadius: '24px 24px 0 0', background: '#FFF', position: 'relative', zIndex: 10 } as any}>
              <BeneficiaryMessagesContent token={token} user={user} router={router} />
            </div>
          </div>
        </div>
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
