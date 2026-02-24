import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useI18n } from '../../context/I18nContext';
import { apiFetch } from '../../services/api';
import FullScreenLoader from '../FullScreenLoader';
import { Card, HeroCard, SectionHeader, LanguageFlagButton } from './SharedUI';
import { Icon } from '../WebIcon';
import { BG_IMAGES } from './constants';

export default function TeleassistanceHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const { t } = useI18n();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [activeEscalations, setActiveEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [a, su, esc] = await Promise.all([
        apiFetch('/api/alerts', {}, token).catch(() => []),
        apiFetch('/api/teleassistance/subscribers', {}, token).catch(() => []),
        apiFetch('/api/escalation/active', {}, token).catch(() => []),
      ]);
      setAlerts(a); setSubs(su); setActiveEscalations(esc);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 5000); return () => clearInterval(iv); }, [fetchData]);

  if (loading) return <FullScreenLoader />;
  const active = alerts.filter((a: any) => a.status === 'active');
  const BG_DASH = BG_IMAGES.dashboard;
  const BG_RED = BG_IMAGES.red;

  if (Platform.OS === 'web') {
    return (
      <div data-testid="teleassistance-dashboard" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_DASH} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1 } as any} />
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}><div style={{ width: 46, height: 46, borderRadius: 999, background: 'rgba(124,92,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(124,92,255,0.3)' } as any}><i className="ri-headphone-line" style={{ fontSize: 20, color: '#A78BFA' }} /></div><div><div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>Plateau d'ecoute</div><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{user.name}</span></div></div>
          </div>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 } as any}>{[{ val: active.length, label: 'Alertes actives', icon: 'ri-alarm-warning-line', color: active.length > 0 ? '#EF4444' : 'rgba(255,255,255,0.4)' }, { val: activeEscalations.length, label: 'Escalades', icon: 'ri-arrow-up-circle-line', color: '#F59E0B' }, { val: subs.length, label: 'Abonnes', icon: 'ri-group-line', color: 'rgba(255,255,255,0.4)' }].map((s, i) => (<div key={i} style={{ flex: 1, padding: '14px 10px', borderRadius: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', textAlign: 'center' } as any}><i className={s.icon} style={{ fontSize: 18, color: s.color, display: 'block', marginBottom: 4 }} /><div style={{ fontSize: 24, fontWeight: 900, color: '#FFF' }}>{s.val}</div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div></div>))}</div>
          {/* Active alerts */}
          {active.map((a: any) => (<div key={a.id} onClick={() => router.push({ pathname: '/alert-detail', params: { alertId: a.id } })} style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', padding: '16px', marginBottom: 10, cursor: 'pointer', minHeight: 80 } as any}><img src={BG_RED} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} /><div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 1 } as any} /><div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 12 } as any}><div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-alarm-warning-line" style={{ fontSize: 20, color: '#FFF' }} /></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>{a.beneficiary_name}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{a.message} - {new Date(a.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div></div><div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.25)' } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: '#EF4444' } as any} /><span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>Active</span></div></div></div>))}
          {/* Subscribers */}
          {subs.length > 0 && <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10, marginTop: 4 }}>Abonnes ({subs.length})</div>}
          {subs.slice(0, 10).map((su: any) => (<div key={su.id} onClick={() => router.push({ pathname: '/subscriber-detail', params: { subscriberId: su.id } })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8, cursor: 'pointer' } as any}><div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(124,92,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 16, fontWeight: 800, color: '#A78BFA' }}>{su.name?.charAt(0)}</span></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{su.name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{su.latest_vitals ? `${su.latest_vitals.heart_rate} bpm` : 'Pas de donnees'}</div></div><i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)' }} /></div>))}
        </div>
      </div>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 96 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#111827" />} showsVerticalScrollIndicator={false}>

      <HeroCard style={{ backgroundColor: '#7C5CFF', ...(Platform.OS === 'web' ? { background: 'linear-gradient(135deg, #6B4FD8 0%, #7C5CFF 40%, #A78BFA 100%)', boxShadow: '0 8px 32px rgba(124,92,255,0.25)' } : {}) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600' }}>Plateau d'ecoute</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>{user.name}</Text>
          </View>
          <LanguageFlagButton />
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[
            { val: active.length, label: 'Alertes' },
            { val: activeEscalations.length, label: 'Escalades' },
            { val: subs.length, label: 'Abonnes' },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827' }}>{s.val}</Text>
              <Text style={{ fontSize: 9, color: '#6B7280', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </HeroCard>

      {active.length > 0 && <>
        <SectionHeader title="Alertes en attente" />
        {active.slice(0, 5).map((a: any) => (
          <TouchableOpacity key={a.id} onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: a.id } })}>
            <Card style={{ borderLeftWidth: 3, borderLeftColor: a.severity === 'critical' ? '#EF4444' : '#111827' }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{a.message}</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{a.beneficiary_name} - {new Date(a.created_at).toLocaleTimeString('fr-FR')}</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </>}

      <SectionHeader title="Abonnes" action="Voir tout" />
      {subs.slice(0, 10).map((su: any) => (
        <TouchableOpacity key={su.id} onPress={() => router.push({ pathname: '/subscriber-detail', params: { subscriberId: su.id } })}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(124,92,255,0.08)', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#7C5CFF' }}>{su.name?.charAt(0)?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{su.name}</Text>
              <Text style={{ fontSize: 11, color: '#6B7280' }}>{su.latest_vitals ? `${su.latest_vitals.heart_rate} bpm` : 'Pas de donnees'}</Text>
            </View>
            <Icon name="chevron-forward" size={16} color="#9CA3AF" />
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
