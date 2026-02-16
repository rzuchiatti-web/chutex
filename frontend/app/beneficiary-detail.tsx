import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 18, marginBottom: 12, ...glass }, style]}>{children}</View>
);
const InfoRow = ({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) => (
  value ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
      <Ionicons name={icon as any} size={16} color={color || '#888'} />
      <Text style={{ fontSize: 12, color: colors.textSecondary, width: 100 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary, flex: 1 }}>{value}</Text>
    </View>
  ) : null
);
const Badge = ({ label, color, bg }: { label: string; color: string; bg: string }) => (
  <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
    <Text style={{ fontSize: 10, fontWeight: '800', color, letterSpacing: 0.5 }}>{label}</Text>
  </View>
);

export default function BeneficiaryDetailScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const { beneficiaryId } = useLocalSearchParams<{ beneficiaryId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<string>('');
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try { setData(await apiFetch(`/api/guardian/beneficiary/${beneficiaryId}/detail`, {}, token)); }
      catch (e: any) { Alert.alert('Erreur', e.message); }
      finally { setLoading(false); }
    })();
  }, [beneficiaryId]);

  const generateReport = async () => {
    setReportLoading(true);
    try {
      const r = await apiFetch(`/api/guardian/beneficiary/${beneficiaryId}/health-report`, {}, token);
      setReport(r.report);
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setReportLoading(false); }
  };

  const openDirections = (lat: number, lng: number) => {
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });
    Linking.openURL(url!).catch(() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`));
  };

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.textPrimary} /></SafeAreaView>;
  if (!data?.beneficiary) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: colors.textSecondary }}>Beneficiaire non trouve</Text></SafeAreaView>;

  const b = data.beneficiary;
  const activeAlerts = (data.alerts || []).filter((a: any) => a.status === 'active');

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '900', color: colors.textPrimary }}>Fiche beneficiaire</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}>
        {/* Identity */}
        <GlassCard style={{ padding: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#4FC3F7', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)' }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#FFF' }}>{b.name?.charAt(0)?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: colors.textPrimary }}>{b.name}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {activeAlerts.length > 0 && <Badge label={`${activeAlerts.length} alerte(s)`} color="#E53935" bg="#FFEBEE" />}
                {b.has_subscription && <Badge label={`Abon. ${b.subscription_type?.toUpperCase()}`} color={b.subscription_type === 'care' ? '#7B1FA2' : '#1565C0'} bg={b.subscription_type === 'care' ? '#F3E5F5' : '#E3F2FD'} />}
              </View>
            </View>
          </View>
          <InfoRow icon="mail-outline" label="Email" value={b.email} />
          <InfoRow icon="call-outline" label="Telephone" value={b.phone} />
          <InfoRow icon="location-outline" label="Adresse" value={b.address} />
        </GlassCard>

        {/* Medical Info */}
        <GlassCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="medkit" size={18} color="#E53935" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>Informations medicales</Text>
          </View>
          <InfoRow icon="calendar-outline" label="Naissance" value={b.date_of_birth} />
          <InfoRow icon="person-outline" label="Genre" value={b.gender} />
          <InfoRow icon="resize-outline" label="Taille" value={b.height_cm ? `${b.height_cm} cm` : ''} />
          <InfoRow icon="barbell-outline" label="Poids" value={b.weight_kg ? `${b.weight_kg} kg` : ''} />
          <InfoRow icon="water-outline" label="Groupe sanguin" value={b.blood_type} color="#E53935" />
          <InfoRow icon="warning-outline" label="Allergies" value={b.allergies} color="#FF9800" />
          <InfoRow icon="fitness-outline" label="Pathologies" value={b.medical_conditions} color="#E53935" />
          <InfoRow icon="person-circle-outline" label="Medecin" value={b.doctor_name} />
          <InfoRow icon="call-outline" label="Contact urgence" value={b.emergency_contact_name ? `${b.emergency_contact_name} (${b.emergency_contact_phone || ''})` : ''} color="#E53935" />
        </GlassCard>

        {/* Devices */}
        {data.devices?.length > 0 && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name="bluetooth-connect" size={18} color="#4CAF50" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>Appareils ({data.devices.length})</Text>
            </View>
            {data.devices.map((d: any) => {
              const names: any = { bracelet: 'Bracelet Elio', vest: 'Gilet Anti-Chute', scale: 'Balance Connectee' };
              const icons: any = { bracelet: 'watch', vest: 'tshirt-crew', scale: 'scale-bathroom' };
              return (
                <View key={d.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
                  <MaterialCommunityIcons name={icons[d.device_type] || 'devices'} size={20} color={colors.textPrimary} />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary, flex: 1 }}>{names[d.device_type] || d.device_type}</Text>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: d.connected ? '#4CAF50' : '#E0E0E0' }} />
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{d.battery || 0}%</Text>
                </View>
              );
            })}
          </GlassCard>
        )}

        {/* Location & Directions */}
        {b.latitude && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="navigate" size={18} color="#1565C0" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary, flex: 1 }}>Localisation</Text>
            </View>
            <InfoRow icon="location-outline" label="Coordonnees" value={`${b.latitude?.toFixed(4)}, ${b.longitude?.toFixed(4)}`} color="#1565C0" />
            <TouchableOpacity style={{ backgroundColor: '#1565C0', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 10, flexDirection: 'row', justifyContent: 'center', gap: 8 }}
              onPress={() => openDirections(b.latitude, b.longitude)}>
              <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>Ouvrir dans Maps</Text>
              <Ionicons name="navigate-outline" size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </GlassCard>
        )}

        {/* Alerts History */}
        {data.alerts?.length > 0 && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="warning" size={18} color="#E53935" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textPrimary }}>Historique alertes ({data.alerts.length})</Text>
            </View>
            {data.alerts.slice(0, 10).map((a: any) => {
              const tc: any = { sos: '#E53935', fall: '#FF9800', anomaly: '#9C27B0', inactivity: '#607D8B' };
              return (
                <TouchableOpacity key={a.id} onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: a.id } })}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tc[a.alert_type] || '#888' }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textPrimary }}>{a.message?.slice(0, 60)}</Text>
                    <Text style={{ fontSize: 10, color: colors.textSecondary }}>{a.alert_type} - {new Date(a.created_at).toLocaleString('fr-FR')}</Text>
                  </View>
                  <Badge label={a.status === 'active' ? 'Active' : 'Resolue'} color={a.status === 'active' ? '#E53935' : '#4CAF50'} bg={a.status === 'active' ? '#FFEBEE' : '#E8F5E9'} />
                  <Ionicons name="chevron-forward" size={14} color="#888" />
                </TouchableOpacity>
              );
            })}
          </GlassCard>
        )}
        {data.alerts?.length === 0 && (
          <GlassCard style={{ alignItems: 'center', padding: 24 }}>
            <Ionicons name="checkmark-circle-outline" size={32} color="#4CAF50" />
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#10B981', marginTop: 8 }}>Aucune alerte</Text>
          </GlassCard>
        )}

        {/* AI Health Report */}
        <TouchableOpacity style={{ backgroundColor: colors.background, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 12, flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          onPress={generateReport} disabled={reportLoading}>
          {reportLoading ? <ActivityIndicator color={colors.textPrimary} /> : <>
            <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>Generer un rapport IA</Text>
            <Ionicons name="sparkles" size={16} color={colors.textPrimary} />
          </>}
        </TouchableOpacity>

        {report ? (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Ionicons name="sparkles" size={16} color={colors.textPrimary} />
              <Text style={{ fontSize: 14, fontWeight: '800', color: colors.textPrimary }}>Rapport IA</Text>
            </View>
            <Text style={{ fontSize: 13, color: colors.textPrimary, lineHeight: 20 }}>{report}</Text>
          </GlassCard>
        ) : null}
      </ScrollView>
    </View>
  );
}
