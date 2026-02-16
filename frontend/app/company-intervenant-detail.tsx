import { Icon, MCIcon } from '../src/components/WebIcon';
import { useTheme } from '../src/context/ThemeContext';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 18, marginBottom: 12, ...glass }, style]}>{children}</View>
);
const InfoRow = ({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) => (
  value ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
      <Icon name={icon as any} size={16} color={color || '#888'} />
      <Text style={{ fontSize: 12, color: '#78716C', width: 100 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#1C1917', flex: 1 }}>{value}</Text>
    </View>
  ) : null
);
const Badge = ({ label, color, bg }: { label: string; color: string; bg: string }) => (
  <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
    <Text style={{ fontSize: 10, fontWeight: '800', color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
  </View>
);

const statusColor = (st: string) => ({ pending_acceptance: '#FF9800', in_progress: '#2196F3', en_route: '#009688', completed: '#4CAF50', dispatched: '#FF5722' }[st] || '#888');
const statusLabel = (st: string) => ({ pending_acceptance: 'En attente', in_progress: 'En cours', en_route: 'En route', completed: 'Terminee', dispatched: 'Dispatchee' }[st] || st);

export default function CompanyIntervenantDetail() {
  const { colors, isDark } = useTheme();
  const { intervenantId } = useLocalSearchParams<{ intervenantId: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try { setData(await apiFetch(`/api/company/intervenant/${intervenantId}`, {}, token)); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, [intervenantId, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF8F5' }}><ActivityIndicator size="large" color="#1C1917" /></View>;
  if (!data?.intervenant) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF8F5' }}><Text style={{ color: '#78716C' }}>Intervenant non trouve</Text></View>;

  const iv = data.intervenant;
  const interventions = data.interventions || [];
  const active = interventions.filter((i: any) => ['pending_acceptance', 'in_progress', 'en_route', 'dispatched'].includes(i.status));
  const completed = interventions.filter((i: any) => i.status === 'completed');

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF8F5' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }} data-testid="intervenant-detail-back">
          <Icon name="chevron-back" size={24} color="#1C1917" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '900', color: '#1C1917' }}>Fiche Intervenant</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#1C1917" />}>

        {/* Identity Card */}
        <GlassCard style={{ padding: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#9C27B0', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)' }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#FFF' }}>{iv.name?.charAt(0)?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#1C1917' }}>{iv.name}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                <Badge label="Intervenant Care" color="#7B1FA2" bg="#F3E5F5" />
                {data.agency && <Badge label={data.agency.name} color="#E65100" bg="#FFF3E0" />}
                {!data.agency && <Badge label="Non assigne" color="#888" bg="#F5F5F5" />}
              </View>
            </View>
          </View>
          <InfoRow icon="mail-outline" label="Email" value={iv.email} />
          <InfoRow icon="call-outline" label="Telephone" value={iv.phone} />
          <InfoRow icon="location-outline" label="Adresse" value={iv.address} />
          <InfoRow icon="briefcase-outline" label="Profession" value={iv.profession} />
          <InfoRow icon="business-outline" label="Structure" value={iv.intervention_structure || iv.structure_name} color="#9C27B0" />
          <InfoRow icon="navigate-outline" label="Rayon" value={`${iv.intervention_radius_km || 30} km`} color="#9C27B0" />
          <InfoRow icon="calendar-outline" label="Inscription" value={iv.created_at ? new Date(iv.created_at).toLocaleDateString('fr-FR') : ''} />
        </GlassCard>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <GlassCard style={{ flex: 1, alignItems: 'center', padding: 16, marginBottom: 0 }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#2196F3' }}>{data.total_interventions}</Text>
            <Text style={{ fontSize: 9, color: '#78716C', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>Total missions</Text>
          </GlassCard>
          <GlassCard style={{ flex: 1, alignItems: 'center', padding: 16, marginBottom: 0, borderLeftWidth: 4, borderLeftColor: '#FF9800' }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#FF9800' }}>{data.active_interventions}</Text>
            <Text style={{ fontSize: 9, color: '#FF9800', letterSpacing: 0.5, marginTop: 2 }}>En cours</Text>
          </GlassCard>
          <GlassCard style={{ flex: 1, alignItems: 'center', padding: 16, marginBottom: 0, borderLeftWidth: 4, borderLeftColor: '#4CAF50' }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#10B981' }}>{data.completed_interventions}</Text>
            <Text style={{ fontSize: 9, color: '#10B981', letterSpacing: 0.5, marginTop: 2 }}>Terminees</Text>
          </GlassCard>
        </View>

        {/* Agency Info */}
        {data.agency && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="business" size={18} color="#FF9800" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1C1917' }}>Agence</Text>
            </View>
            <InfoRow icon="business-outline" label="Nom" value={data.agency.name} color="#FF9800" />
            <InfoRow icon="location-outline" label="Adresse" value={data.agency.address} />
          </GlassCard>
        )}

        {/* Active Interventions */}
        <GlassCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' }}>
              <Icon name="navigate" size={18} color="#FF9800" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#1C1917' }}>En cours ({active.length})</Text>
          </View>
          {active.length === 0 ? (
            <Text style={{ fontSize: 12, color: '#78716C', textAlign: 'center', paddingVertical: 12 }}>Aucune intervention en cours</Text>
          ) : active.map((i: any) => (
            <View key={i.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: statusColor(i.status) + '15', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="navigate" size={14} color={statusColor(i.status)} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1C1917' }}>{i.beneficiary_name}</Text>
                <Text style={{ fontSize: 10, color: '#78716C' }}>{i.alert_message || 'Intervention'}</Text>
              </View>
              <View style={{ backgroundColor: statusColor(i.status) + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: statusColor(i.status) }}>{statusLabel(i.status).toUpperCase()}</Text>
              </View>
            </View>
          ))}
        </GlassCard>

        {/* Completed Interventions */}
        <GlassCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' }}>
              <Icon name="checkmark-circle" size={18} color="#4CAF50" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#1C1917' }}>Terminees ({completed.length})</Text>
          </View>
          {completed.length === 0 ? (
            <Text style={{ fontSize: 12, color: '#78716C', textAlign: 'center', paddingVertical: 12 }}>Aucune intervention terminee</Text>
          ) : completed.map((i: any) => (
            <View key={i.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="checkmark-circle" size={14} color="#4CAF50" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#1C1917' }}>{i.beneficiary_name}</Text>
                <Text style={{ fontSize: 10, color: '#78716C' }}>{i.created_at ? new Date(i.created_at).toLocaleDateString('fr-FR') : ''}</Text>
              </View>
              <View style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#10B981' }}>TERMINEE</Text>
              </View>
            </View>
          ))}
        </GlassCard>
      </ScrollView>
    </View>
  );
}
