import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', padding: 18, marginBottom: 12, ...glass }, style]}>{children}</View>
);
const InfoRow = ({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) => (
  value ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
      <Ionicons name={icon as any} size={16} color={color || '#888'} />
      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)', width: 100 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.92)', flex: 1 }}>{value}</Text>
    </View>
  ) : null
);
const Badge = ({ label, color, bg }: { label: string; color: string; bg: string }) => (
  <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
    <Text style={{ fontSize: 10, fontWeight: '800', color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
  </View>
);

export default function CompanyPrescriberDetail() {
  const { prescriberId } = useLocalSearchParams<{ prescriberId: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try { setData(await apiFetch(`/api/company/prescriber/${prescriberId}`, {}, token)); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, [prescriberId, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}><ActivityIndicator size="large" color="#FFF" /></View>;
  if (!data?.prescriber) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}><Text style={{ color: 'rgba(255,255,255,0.50)' }}>Prescripteur non trouve</Text></View>;

  const pr = data.prescriber;
  const prescriptions = data.prescriptions || [];
  const pending = prescriptions.filter((p: any) => p.status === 'pending');
  const subscribed = prescriptions.filter((p: any) => p.status === 'subscribed');

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }} data-testid="prescriber-detail-back">
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '900', color: 'rgba(255,255,255,0.92)' }}>Fiche Prescripteur</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#FFF" />}>

        {/* Identity Card */}
        <GlassCard style={{ padding: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)' }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#FFF' }}>{pr.name?.charAt(0)?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: 'rgba(255,255,255,0.92)' }}>{pr.name}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                <Badge label="Prescripteur" color="#2E7D32" bg="#E8F5E9" />
                {data.agency && <Badge label={data.agency.name} color="#E65100" bg="#FFF3E0" />}
                {!data.agency && <Badge label="Non assigne" color="#888" bg="#F5F5F5" />}
              </View>
            </View>
          </View>
          <InfoRow icon="mail-outline" label="Email" value={pr.email} />
          <InfoRow icon="call-outline" label="Telephone" value={pr.phone} />
          <InfoRow icon="location-outline" label="Adresse" value={pr.address} />
          <InfoRow icon="business-outline" label="Structure" value={pr.prescriber_structure || pr.structure_name} />
          <InfoRow icon="calendar-outline" label="Inscription" value={pr.created_at ? new Date(pr.created_at).toLocaleDateString('fr-FR') : ''} />
        </GlassCard>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
          <GlassCard style={{ flex: 1, alignItems: 'center', padding: 16, marginBottom: 0 }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#2196F3' }}>{data.total_prescriptions}</Text>
            <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>Prescriptions</Text>
          </GlassCard>
          <GlassCard style={{ flex: 1, alignItems: 'center', padding: 16, marginBottom: 0, borderLeftWidth: 4, borderLeftColor: '#4CAF50' }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#10B981' }}>{data.comm_validated}</Text>
            <Text style={{ fontSize: 9, color: '#10B981', letterSpacing: 0.5, marginTop: 2 }}>EUR validees</Text>
          </GlassCard>
          <GlassCard style={{ flex: 1, alignItems: 'center', padding: 16, marginBottom: 0, borderLeftWidth: 4, borderLeftColor: '#FF9800' }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#FF9800' }}>{data.comm_pending}</Text>
            <Text style={{ fontSize: 9, color: '#FF9800', letterSpacing: 0.5, marginTop: 2 }}>EUR en att.</Text>
          </GlassCard>
        </View>

        {/* Agency Info */}
        {data.agency && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="business" size={18} color="#FF9800" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: 'rgba(255,255,255,0.92)' }}>Agence</Text>
            </View>
            <InfoRow icon="business-outline" label="Nom" value={data.agency.name} color="#FF9800" />
            <InfoRow icon="location-outline" label="Adresse" value={data.agency.address} />
          </GlassCard>
        )}

        {/* Prescriptions - Validated */}
        <GlassCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: 'rgba(255,255,255,0.92)' }}>Validees ({subscribed.length})</Text>
            <View style={{ flex: 1 }} />
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#10B981' }}>{data.comm_validated} EUR</Text>
          </View>
          {subscribed.length === 0 ? (
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)', textAlign: 'center', paddingVertical: 12 }}>Aucune prescription validee</Text>
          ) : subscribed.map((p: any) => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#10B981' }}>{p.beneficiary_name?.charAt(0)?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.92)' }}>{p.beneficiary_name}</Text>
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.50)' }}>{p.subscription_type} - {p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : ''}</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#10B981' }}>+{p.commission} EUR</Text>
            </View>
          ))}
        </GlassCard>

        {/* Prescriptions - Pending */}
        <GlassCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="time" size={18} color="#FF9800" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: 'rgba(255,255,255,0.92)' }}>En cours ({pending.length})</Text>
            <View style={{ flex: 1 }} />
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#FF9800' }}>{data.comm_pending} EUR</Text>
          </View>
          {pending.length === 0 ? (
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)', textAlign: 'center', paddingVertical: 12 }}>Aucune prescription en cours</Text>
          ) : pending.map((p: any) => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#FF9800' }}>{p.beneficiary_name?.charAt(0)?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.92)' }}>{p.beneficiary_name}</Text>
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.50)' }}>{p.subscription_type} - {p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : ''}</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#FF9800' }}>+{p.commission} EUR</Text>
            </View>
          ))}
        </GlassCard>
      </ScrollView>
    </View>
  );
}
