import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { apiFetch } from '../../src/services/api';
import { useRouter } from 'expo-router';
import { ContextualTip, HelpBubble, PageExplainer, MiniTuto } from '../../src/components/HelpSystem';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 8px 32px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(255,255,255,0.6)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 18, marginBottom: 12, ...glass }, style]}>{children}</View>
);

/* ===== COMPANY: PRESCRIBERS LIST ===== */
function CompanyPrescribers({ token }: { token: string }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    try { setData(await apiFetch('/api/company/dashboard', {}, token)); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);
  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0EB' }}><ActivityIndicator size="large" color="#000" /></View>;
  if (!data) return null;

  const allPrescribers = data.prescriber_ranking || [];
  const prescribers = search.trim()
    ? allPrescribers.filter((pr: any) => pr.name?.toLowerCase().includes(search.toLowerCase()) || pr.email?.toLowerCase().includes(search.toLowerCase()))
    : allPrescribers;

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F0EB' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#000', letterSpacing: -0.5 }}>Prescripteurs</Text>
        <Text style={{ fontSize: 12, color: '#888' }}>{allPrescribers.length} prescripteurs actifs</Text>
      </View>
      {/* Search */}
      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 14, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', ...glass }}>
          <Ionicons name="search-outline" size={16} color="#888" />
          <TextInput style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: '#000' }}
            placeholder="Rechercher un prescripteur..." placeholderTextColor="#AAA" value={search} onChangeText={setSearch} />
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color="#AAA" /></TouchableOpacity>}
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#000" />}>
        {prescribers.map((pr: any, idx: number) => (
          <TouchableOpacity key={pr.id} activeOpacity={0.7} data-testid={`prescriber-card-${pr.id}`}
            onPress={() => router.push({ pathname: '/company-prescriber-detail', params: { prescriberId: pr.id } })}>
            <GlassCard style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }}>{pr.name?.charAt(0)?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#000' }}>{pr.name}</Text>
                <Text style={{ fontSize: 11, color: '#888' }}>{pr.email}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  <Ionicons name="business-outline" size={11} color="#FF9800" />
                  <Text style={{ fontSize: 10, color: '#FF9800', fontWeight: '600' }}>{pr.agency_name}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, color: '#888' }}>{pr.prescription_count} presc.</Text>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#4CAF50' }}>{pr.comm_validated}EUR</Text>
                  {pr.comm_pending > 0 && <Text style={{ fontSize: 12, fontWeight: '700', color: '#FF9800' }}>+{pr.comm_pending}</Text>}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#888" />
            </GlassCard>
          </TouchableOpacity>
        ))}
        {prescribers.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="people-outline" size={36} color="#CCC" />
            <Text style={{ fontSize: 14, color: '#888', marginTop: 8 }}>{search ? 'Aucun resultat' : 'Aucun prescripteur'}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const SEV = { critical: { label: 'CRITIQUE', color: '#E53935' }, high: { label: 'ELEVE', color: '#FF6F00' }, medium: { label: 'MOYEN', color: '#FF9800' }, low: { label: 'FAIBLE', color: '#888' } };
const TYPE_CFG: Record<string, { icon: string; label: string; color: string }> = {
  sos: { icon: 'alert-circle', label: 'SOS - Urgence', color: '#E53935' },
  fall: { icon: 'trending-down', label: 'Chute detectee', color: '#FF6F00' },
  heart_rate: { icon: 'heart', label: 'Anomalie cardiaque', color: '#E91E63' },
  spo2: { icon: 'water', label: 'SpO2 anormale', color: '#2196F3' },
  inactivity: { icon: 'moon', label: 'Inactivite', color: '#9C27B0' },
};
const STATE_LABEL: Record<string, string> = {
  CALLING_PATIENT: 'Appel patient', PATIENT_CONFIRMED_OK: 'Patient OK', PATIENT_NEEDS_HELP: 'Patient en detresse',
  PATIENT_NO_RESPONSE: 'Pas de reponse', CALLING_GUARDIAN_1: 'Appel gardien 1', CALLING_GUARDIAN_2: 'Appel gardien 2',
  GUARDIAN_INTERVENTION_ACCEPTED: 'Gardien intervient', CARE_DISPATCHED: 'Intervenant dispatche', RESOLVED: 'Resolue',
};

export default function AlertsScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const effectiveRole = user?.active_role || user?.role || '';

  // Company sees prescripteurs list
  if (effectiveRole === 'prescriber_company' && token) {
    return <CompanyPrescribers token={token} />;
  }

  const [alerts, setAlerts] = useState<any[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'active' | 'resolved'>('active');

  const fetchAlerts = useCallback(async () => {
    try {
      const isAdmin = effectiveRole === 'admin';
      const [all, active, incidents] = await Promise.all([
        apiFetch(isAdmin ? '/api/backoffice/alerts' : '/api/alerts', {}, token).catch(() => []),
        apiFetch('/api/alerts/active-with-interventions', {}, token).catch(() => []),
        isAdmin ? apiFetch('/api/carewatch/incidents', {}, token).catch(() => []) : Promise.resolve([]),
      ]);
      setAlerts(Array.isArray(all) ? all : []);
      // Merge active alerts with CARE WATCH incident info
      const activeArr = Array.isArray(active) ? active : [];
      const incArr = Array.isArray(incidents) ? incidents : [];
      // Enrich active alerts with incident state if available
      const enriched = activeArr.map((a: any) => {
        const inc = incArr.find((i: any) => i.alert_id === a.id);
        return inc ? { ...a, incident_state: inc.state, care_provider: inc.care_provider, assigned_guardian: inc.assigned_guardian } : a;
      });
      setActiveAlerts(enriched);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token, effectiveRole]);

  useEffect(() => { fetchAlerts(); const t = setInterval(fetchAlerts, 10000); return () => clearInterval(t); }, [fetchAlerts]);

  const resolveAlert = async (alertId: string) => {
    try { await apiFetch(`/api/alerts/${alertId}/resolve`, { method: 'PUT' }, token); fetchAlerts(); } catch {}
  };

  const resolved = alerts.filter(a => a.status === 'resolved');
  const filtered = tab === 'active' ? activeAlerts : resolved;

  const renderAlert = ({ item }: { item: any }) => {
    const cfg = TYPE_CFG[item.alert_type] || TYPE_CFG.sos;
    const sev = (SEV as any)[item.severity] || SEV.medium;
    const isActive = item.status === 'active';
    const incState = item.incident_state;
    const stateLabel = incState ? STATE_LABEL[incState] || incState : item.teleassistance_status || '';

    return (
      <TouchableOpacity testID={`alert-card-${item.id}`}
        style={[{ backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', marginBottom: 12, overflow: 'hidden', ...glass },
          isActive && { borderLeftWidth: 4, borderLeftColor: cfg.color }]}
        onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: item.id } })}>

        {/* Header */}
        <View style={{ padding: 16, paddingBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: cfg.color + '15', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#000' }}>{cfg.label}</Text>
              <Text style={{ fontSize: 11, color: '#888', marginTop: 1 }}>
                {new Date(item.created_at).toLocaleDateString('fr-FR')} a {new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: sev.color + '15' }}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: sev.color }}>{sev.label}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 13, color: '#333', lineHeight: 18, marginTop: 8 }}>{item.message}</Text>
        </View>

        {/* Beneficiary info */}
        {item.beneficiary_name && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 8 }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#E1F5FE', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 10, fontWeight: '800' }}>{item.beneficiary_name?.charAt(0)}</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#555', fontWeight: '600' }}>{item.beneficiary_name}</Text>
          </View>
        )}

        {/* Protocol Status */}
        {isActive && stateLabel && (
          <View style={{ backgroundColor: 'rgba(0,0,0,0.03)', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.04)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: incState === 'RESOLVED' ? '#4CAF50' : incState === 'CARE_DISPATCHED' ? '#FF5722' : '#FF9800' }} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#555' }}>{stateLabel}</Text>
            </View>
            {item.intervener_info && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <Ionicons name="person" size={12} color="#4CAF50" />
                <Text style={{ fontSize: 11, color: '#2E7D32', fontWeight: '600' }}>{item.intervener_info.name} - {item.intervener_info.structure}</Text>
              </View>
            )}
            {item.care_provider && !item.intervener_info && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <Ionicons name="navigate" size={12} color="#FF9800" />
                <Text style={{ fontSize: 11, color: '#E65100', fontWeight: '600' }}>Intervenant: {item.care_provider}</Text>
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        {isActive && (
          <View style={{ flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.04)' }}>
            <TouchableOpacity testID={`resolve-${item.id}`} style={{ flex: 1, backgroundColor: '#000', borderRadius: 9999, paddingVertical: 10, alignItems: 'center' }}
              onPress={(e) => { e.stopPropagation(); resolveAlert(item.id); }}>
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>RESOUDRE</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1, backgroundColor: cfg.color, borderRadius: 9999, paddingVertical: 10, alignItems: 'center' }}
              onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: item.id } })}>
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>VOIR DETAILS</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Resolved */}
        {!isActive && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingBottom: 12 }}>
            <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#4CAF50' }}>Resolue {item.resolved_at ? `le ${new Date(item.resolved_at).toLocaleDateString('fr-FR')}` : ''}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View key={effectiveRole} style={{ flex: 1, backgroundColor: '#F5F0EB' }} testID="alerts-screen">
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: '#000', letterSpacing: -0.5 }}>Alertes</Text>
      </View>
      <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 14, padding: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', ...glass }}>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, tab === 'active' && { backgroundColor: '#000' }]} onPress={() => setTab('active')}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'active' ? '#FFF' : '#888' }}>Actives ({activeAlerts.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, tab === 'resolved' && { backgroundColor: '#000' }]} onPress={() => setTab('resolved')}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'resolved' ? '#FFF' : '#888' }}>Resolues ({resolved.length})</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#000" /></View>
      ) : (
        <FlatList data={filtered} renderItem={renderAlert} keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlerts(); }} tintColor="#000" />}
          ListEmptyComponent={
            <View style={[{ alignItems: 'center', paddingVertical: 48, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', ...glass }]}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(76,175,80,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name={tab === 'active' ? 'checkmark-circle' : 'archive-outline'} size={28} color="#4CAF50" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#000' }}>{tab === 'active' ? 'Tout va bien !' : 'Aucun historique'}</Text>
              <Text style={{ fontSize: 12, color: '#888', marginTop: 4, textAlign: 'center', paddingHorizontal: 20 }}>{tab === 'active' ? 'Aucune alerte active pour le moment. Nous veillons sur vous en continu.' : 'Les alertes resolues apparaitront ici pour garder un historique complet.'}</Text>
              <Text style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{tab === 'active' ? 'Tout va bien !' : 'Les alertes resolues apparaitront ici'}</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
