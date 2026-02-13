import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 8px 32px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(255,255,255,0.6)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 18, marginBottom: 12, ...glass }, style]}>{children}</View>
);

export default function BeneficiaryDetailScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const { beneficiaryId } = useLocalSearchParams<{ beneficiaryId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<string>('');
  const [reportLoading, setReportLoading] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

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
    Linking.openURL(url).catch(() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`));
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await apiFetch(`/api/alerts/${alertId}/resolve`, { method: 'PUT' }, token);
      setData((prev: any) => ({
        ...prev,
        alerts: prev.alerts.map((a: any) => a.id === alertId ? { ...a, status: 'resolved' } : a),
        stats: { ...prev.stats, active_alerts: prev.stats.active_alerts - 1 },
      }));
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  const unlinkBeneficiary = () => {
    Alert.alert(
      'Retirer le beneficiaire',
      `Voulez-vous vraiment retirer ${data?.beneficiary?.name} de votre liste ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Retirer', style: 'destructive', onPress: async () => {
          setUnlinking(true);
          try {
            await apiFetch(`/api/guardian/beneficiary/${beneficiaryId}/unlink`, { method: 'DELETE' }, token);
            Alert.alert('Beneficiaire retire', 'Ce beneficiaire a ete retire de votre liste.');
            router.back();
          } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setUnlinking(false); }
        }},
      ]
    );
  };

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0EB', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#000" /></SafeAreaView>;
  if (!data) return <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0EB', justifyContent: 'center', alignItems: 'center' }}><Text>Erreur de chargement</Text></SafeAreaView>;

  const ben = data.beneficiary;
  const latestData: any = {};
  if (data.readings.length > 0) Object.assign(latestData, data.readings[0].data || {});

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0EB' }} testID="beneficiary-detail-screen">
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.5)', justifyContent: 'center', alignItems: 'center', ...glass }}>
          <Ionicons name="chevron-back" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: '#000', textAlign: 'center' }}>{ben.name}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <GlassCard style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20 }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#E1F5FE', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.7)' }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#000' }}>{ben.name?.charAt(0)?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#000' }}>{ben.name}</Text>
            <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{ben.phone || ben.email}</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: data.stats.active_alerts > 0 ? '#E53935' : '#000' }}>{data.stats.active_alerts}</Text>
            <Text style={{ fontSize: 9, color: '#888', textTransform: 'uppercase' }}>alertes</Text>
          </View>
        </GlassCard>

        {/* Vitals */}
        <Text style={{ fontSize: 14, fontWeight: '800', color: '#000', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Constantes vitales</Text>
        {Object.keys(latestData).length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {Object.entries(latestData).map(([key, val]: any) => (
              <GlassCard key={key} style={{ width: '31%', alignItems: 'center', padding: 12, marginBottom: 4 }}>
                <Text style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', textAlign: 'center' }}>{key.replace(/_/g, ' ')}</Text>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#000', marginTop: 2 }}>{typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(1)) : val}</Text>
              </GlassCard>
            ))}
          </View>
        ) : (
          <GlassCard style={{ alignItems: 'center', padding: 20 }}>
            <MaterialCommunityIcons name="bluetooth-off" size={28} color="#888" />
            <Text style={{ fontSize: 13, color: '#888', marginTop: 6 }}>Pas de donnees de sante</Text>
          </GlassCard>
        )}

        {/* Medical Info */}
        <GlassCard>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Informations medicales</Text>
          {[
            ['Genre', ben.gender], ['Date de naissance', ben.date_of_birth], ['Taille', ben.height_cm ? `${ben.height_cm} cm` : null],
            ['Poids', ben.weight_kg ? `${ben.weight_kg} kg` : null], ['Groupe sanguin', ben.blood_type],
            ['Allergies', ben.allergies], ['Pathologies', ben.medical_conditions], ['Medecin', ben.doctor_name],
            ['Contact urgence', ben.emergency_contact_name ? `${ben.emergency_contact_name} (${ben.emergency_contact_phone || ''})` : null],
          ].map(([l, v]) => (
            <View key={l as string} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
              <Text style={{ fontSize: 12, color: '#888' }}>{l}</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#000', flex: 1, textAlign: 'right' }}>{v || '--'}</Text>
            </View>
          ))}
        </GlassCard>

        {/* Location */}
        <GlassCard>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Localisation</Text>
          {data.location ? (
            <>
              <Text style={{ fontSize: 13, color: '#000' }}>Lat: {data.location.latitude?.toFixed(4)}, Lng: {data.location.longitude?.toFixed(4)}</Text>
              <Text style={{ fontSize: 10, color: '#888', marginTop: 2 }}>MAJ: {new Date(data.location.updated_at).toLocaleString('fr-FR')}</Text>
              <TouchableOpacity testID="directions-btn" style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 }}
                onPress={() => openDirections(data.location.latitude, data.location.longitude)}>
                <Ionicons name="navigate" size={16} color="#FFF" />
                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>LANCER L'ITINERAIRE</Text>
              </TouchableOpacity>
            </>
          ) : <Text style={{ fontSize: 13, color: '#888' }}>Localisation non disponible</Text>}
        </GlassCard>

        {/* Devices */}
        <Text style={{ fontSize: 14, fontWeight: '800', color: '#000', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Appareils connectes</Text>
        {(data.devices || []).length > 0 ? data.devices.map((d: any) => {
          const batteryColor = (d.battery || 0) > 50 ? '#4CAF50' : (d.battery || 0) > 20 ? '#FF9800' : '#E53935';
          const icons: any = { bracelet: 'watch-outline', scale: 'scale-outline', vest: 'shield-outline' };
          return (
            <GlassCard key={d.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
              <Ionicons name={icons[d.device_type] || 'hardware-chip-outline'} size={24} color="#000" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#000' }}>{d.name}</Text>
                <Text style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{d.connected ? 'Connecte' : 'Deconnecte'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <View style={{ width: 50, height: 10, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 5, overflow: 'hidden' }}>
                  <View style={{ height: '100%', backgroundColor: batteryColor, borderRadius: 5, width: `${d.battery || 0}%` }} />
                </View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: batteryColor }}>{d.battery || 0}%</Text>
              </View>
            </GlassCard>
          );
        }) : <GlassCard style={{ alignItems: 'center', padding: 16 }}><Text style={{ fontSize: 13, color: '#888' }}>Aucun appareil</Text></GlassCard>}

        {/* Alerts */}
        <Text style={{ fontSize: 14, fontWeight: '800', color: '#000', marginBottom: 10, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Alertes ({data.alerts.length})</Text>
        {data.alerts.length > 0 ? data.alerts.slice(0, 10).map((a: any) => (
          <TouchableOpacity key={a.id} testID={`alert-card-${a.id}`} onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: a.id } })}>
            <GlassCard style={{ borderLeftWidth: 3, borderLeftColor: a.severity === 'critical' ? '#E53935' : a.status === 'active' ? '#FF9800' : 'rgba(0,0,0,0.1)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name={a.alert_type === 'sos' ? 'alert-circle' : 'warning'} size={14} color={a.severity === 'critical' ? '#E53935' : '#888'} />
                <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: '#000', textTransform: 'uppercase' }}>{a.alert_type}</Text>
                <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: a.status === 'active' ? 'rgba(229,57,53,0.1)' : 'rgba(0,0,0,0.04)' }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: a.status === 'active' ? '#E53935' : '#888', textTransform: 'uppercase' }}>{a.status}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: '#555' }}>{a.message}</Text>
              <Text style={{ fontSize: 10, color: '#888', marginTop: 3 }}>{new Date(a.created_at).toLocaleString('fr-FR')}</Text>
              {a.status === 'active' && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <TouchableOpacity testID={`resolve-alert-${a.id}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(76,175,80,0.3)' }}
                    onPress={(e) => { e.stopPropagation(); resolveAlert(a.id); }}>
                    <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#4CAF50' }}>Cloturer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#000' }}
                    onPress={(e) => { e.stopPropagation(); router.push({ pathname: '/alert-detail', params: { alertId: a.id } }); }}>
                    <Ionicons name="navigate" size={14} color="#FFF" />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#FFF' }}>Intervenir</Text>
                  </TouchableOpacity>
                </View>
              )}
            </GlassCard>
          </TouchableOpacity>
        )) : (
          <GlassCard style={{ alignItems: 'center', padding: 20 }}>
            <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
            <Text style={{ fontSize: 13, color: '#888', marginTop: 6 }}>Aucune alerte</Text>
          </GlassCard>
        )}

        {/* AI Report */}
        <View style={{ marginTop: 12 }}>
          <TouchableOpacity testID="generate-report-btn" style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }} onPress={generateReport} disabled={reportLoading}>
            {reportLoading ? <ActivityIndicator color="#FFF" /> : (
              <><Ionicons name="sparkles" size={16} color="#FFF" /><Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>{report ? 'Regenerer le rapport IA' : 'Generer un rapport de sante IA'}</Text></>
            )}
          </TouchableOpacity>
          {report ? (
            <GlassCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Ionicons name="sparkles" size={16} color="#000" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#000' }}>Rapport de sante IA</Text>
              </View>
              <Text style={{ fontSize: 13, color: '#555', lineHeight: 20 }}>{report}</Text>
            </GlassCard>
          ) : null}
        </View>

        {/* Unlink Button */}
        <TouchableOpacity
          testID="unlink-beneficiary-btn"
          style={{ borderRadius: 9999, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, borderWidth: 2, borderColor: '#E53935' }}
          onPress={unlinkBeneficiary}
          disabled={unlinking}>
          {unlinking ? <ActivityIndicator color="#E53935" /> : (
            <>
              <Ionicons name="person-remove-outline" size={16} color="#E53935" />
              <Text style={{ color: '#E53935', fontSize: 14, fontWeight: '800', textTransform: 'uppercase' }}>RETIRER CE BENEFICIAIRE</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
