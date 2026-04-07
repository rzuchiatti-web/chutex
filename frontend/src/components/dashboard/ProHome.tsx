import { useI18n } from '../../context/I18nContext';
import React, { useState, useEffect, useCallback } from 'react';
import { Platform, ScrollView, RefreshControl, TouchableOpacity, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';
import FullScreenLoader from '../FullScreenLoader';

const C = {
  bg: '#0A0A12', card: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.06)',
  text: '#FFF', sub: 'rgba(255,255,255,0.5)', muted: 'rgba(255,255,255,0.25)',
  accent: '#3B82F6', green: '#10B981', amber: '#F59E0B', red: '#EF4444',
};

function StatCard({ icon, value, label, color }: any) {
  const { t } = useI18n();
  return (
    <div style={{ flex: 1, padding: '18px 14px', borderRadius: 18, background: C.card, border: `1px solid ${C.border}`, textAlign: 'center' } as any}>
      <i className={icon} style={{ fontSize: 22, color, marginBottom: 8, display: 'block' }} />
      <div style={{ fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: C.sub, marginTop: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}

function BenCard({ ben, onPress }: any) {
  const v = ben.latest_vitals || {};
  return (
    <div data-testid={`pro-ben-card-${ben.id}`} onClick={onPress} style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 18,
      background: C.card, border: `1px solid ${C.border}`, cursor: 'pointer', marginBottom: 8,
      transition: 'background 0.15s',
    } as any}
      onMouseEnter={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
      onMouseLeave={(e: any) => e.currentTarget.style.background = C.card}>
      <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18, fontWeight: 800, color: C.accent } as any}>
        {(ben.name || '?')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{ben.name || 'Patient'}</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 4 } as any}>
          {v.heart_rate && <span style={{ fontSize: 11, color: C.red }}><i className="ri-heart-pulse-line" style={{ fontSize: 10, marginRight: 3 }} />{v.heart_rate} bpm</span>}
          {v.spo2 && <span style={{ fontSize: 11, color: C.accent }}><i className="ri-drop-line" style={{ fontSize: 10, marginRight: 3 }} />{v.spo2}%</span>}
        </div>
        {ben.active_programs > 0 && (
          <div style={{ fontSize: 10, color: C.green, marginTop: 3, fontWeight: 600 }}>
            <i className="ri-file-list-3-line" style={{ fontSize: 10, marginRight: 3 }} />{ben.active_programs} programme{ben.active_programs > 1 ? 's' : ''} actif{ben.active_programs > 1 ? 's' : ''}
          </div>
        )}
      </div>
      <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: C.muted }} />
    </div>
  );
}

export default function ProHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<any>({});
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);

  const fetch = useCallback(async () => {
    try {
      const [dash, bens] = await Promise.all([
        apiFetch('/api/pro/dashboard', {}, token),
        apiFetch('/api/pro/beneficiaries', {}, token),
      ]);
      setDashboard(dash);
      setBeneficiaries(bens);
    } catch (e) {
      console.error('ProHome fetch error:', e);
    } finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <FullScreenLoader />;
  if (Platform.OS !== 'web') return null;

  const proType = user?.professional_type || dashboard.professional_type || 'coach';
  const isPhysio = proType === 'physio';
  const proLabel = isPhysio ? 'Kine / Osteo' : 'Coach Sport';

  return (
    <div data-testid="pro-home" style={{ position: 'absolute', inset: 0, background: C.bg, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif' } as any}>
      {/* Header */}
      <div style={{ padding: '70px 20px 0', flexShrink: 0 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 } as any}>
          <i className={isPhysio ? 'ri-stethoscope-line' : 'ri-run-line'} style={{ fontSize: 14, color: C.accent }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: 1 }}>{proLabel}</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: C.text }}>Bonjour, {(user?.name || '').split(' ')[0]}</div>
        <div style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>Votre espace professionnel</div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 120px', WebkitOverflowScrolling: 'touch' } as any}>
        {/* Stats */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 } as any}>
          <StatCard icon="ri-user-heart-line" value={dashboard.beneficiary_count || 0} label="Patients" color={C.accent} />
          <StatCard icon="ri-file-list-3-line" value={dashboard.active_programs || 0} label="Programmes actifs" color={C.green} />
          <StatCard icon="ri-calendar-check-line" value={dashboard.total_programs || 0} label="Total" color={C.amber} />
        </div>

        {/* Beneficiaries */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } as any}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 1 }}>Mes patients</div>
          <span style={{ fontSize: 11, color: C.sub }}>{beneficiaries.length} patient{beneficiaries.length > 1 ? 's' : ''}</span>
        </div>

        {beneficiaries.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', borderRadius: 18, background: C.card, border: `1px solid ${C.border}` } as any}>
            <i className="ri-user-add-line" style={{ fontSize: 32, color: C.muted, marginBottom: 10, display: 'block' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: C.sub }}>Aucun patient</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Vos patients rattaches apparaitront ici</div>
          </div>
        ) : (
          beneficiaries.map((ben) => (
            <BenCard key={ben.id} ben={ben} onPress={() => router.push({ pathname: '/beneficiary-detail' as any, params: { id: ben.id } })} />
          ))
        )}
      </div>
    </div>
  );
}
