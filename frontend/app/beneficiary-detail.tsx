import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { Colors } from '../src/constants/colors';
import { useTheme } from '../src/context/ThemeContext';

export default function BeneficiaryDetailScreen() {
  const { colors: themeColors } = useTheme();
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
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    });
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

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View></SafeAreaView>;
  if (!data) return <SafeAreaView style={s.safe}><View style={s.center}><Text>Erreur de chargement</Text></View></SafeAreaView>;

  const ben = data.beneficiary;
  const latestData: any = {};
  if (data.readings.length > 0) Object.assign(latestData, data.readings[0].data || {});

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity data-testid="back-btn" onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.topTitle}>{ben.name}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={s.userCard} data-testid="beneficiary-user-card">
          <View style={s.avatar}><Text style={s.avatarT}>{ben.name?.charAt(0)?.toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.userName}>{ben.name}</Text>
            <Text style={s.userMeta}>{ben.phone || ben.email}</Text>
          </View>
          <View style={s.statsCol}>
            <Text style={[s.alertCount, data.stats.active_alerts > 0 && { color: Colors.destructive }]}>{data.stats.active_alerts}</Text>
            <Text style={s.alertLabel}>alertes</Text>
          </View>
        </View>

        {/* ===== SECTION: Constantes vitales ===== */}
        <Text style={s.secTitle}>Constantes vitales</Text>
        {Object.keys(latestData).length > 0 ? (
          <View style={s.grid} data-testid="vitals-grid">
            {Object.entries(latestData).map(([key, val]: any) => (
              <View key={key} style={s.vitalCard}>
                <Text style={s.vitalLabel}>{key.replace(/_/g, ' ')}</Text>
                <Text style={s.vitalVal}>{typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(1)) : val}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={s.emptyC}><MaterialCommunityIcons name="bluetooth-off" size={28} color={Colors.textMuted} /><Text style={s.emptyT}>Pas de donnees de sante</Text></View>
        )}

        {/* ===== SECTION: Infos medicales ===== */}
        <View style={s.card} data-testid="medical-info-card">
          <Text style={s.cardTitle}>Informations medicales</Text>
          <Row l="Genre" v={ben.gender || '--'} />
          <Row l="Date de naissance" v={ben.date_of_birth || '--'} />
          <Row l="Taille" v={ben.height_cm ? `${ben.height_cm} cm` : '--'} />
          <Row l="Poids" v={ben.weight_kg ? `${ben.weight_kg} kg` : '--'} />
          <Row l="Groupe sanguin" v={ben.blood_type || '--'} />
          <Row l="Allergies" v={ben.allergies || '--'} />
          <Row l="Pathologies" v={ben.medical_conditions || '--'} />
          <Row l="Medecin" v={ben.doctor_name || '--'} />
          <Row l="Contact urgence" v={ben.emergency_contact_name ? `${ben.emergency_contact_name} (${ben.emergency_contact_phone || ''})` : '--'} />
        </View>

        {/* ===== SECTION: Localisation ===== */}
        <View style={s.card} data-testid="location-card">
          <Text style={s.cardTitle}>Localisation</Text>
          {data.location ? (
            <>
              <Text style={s.locText}>Lat: {data.location.latitude?.toFixed(4)}, Lng: {data.location.longitude?.toFixed(4)}</Text>
              <Text style={s.locTime}>Derniere MAJ: {new Date(data.location.updated_at).toLocaleString('fr-FR')}</Text>
              <TouchableOpacity
                data-testid="get-directions-btn"
                style={s.directionsBtn}
                onPress={() => openDirections(data.location.latitude, data.location.longitude)}
              >
                <Ionicons name="navigate" size={16} color="#FFF" />
                <Text style={s.directionsBtnT}>Lancer l'itineraire</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={s.emptyT}>Localisation non disponible</Text>
          )}
        </View>

        {/* ===== SECTION: Appareils connectes ===== */}
        <Text style={s.secTitle}>Appareils connectes</Text>
        {(data.devices || []).length > 0 ? data.devices.map((d: any) => {
          const batteryColor = (d.battery || 0) > 50 ? Colors.success : (d.battery || 0) > 20 ? '#FF9800' : Colors.destructive;
          const icons: any = { bracelet: 'watch-outline', scale: 'scale-outline', vest: 'shirt-outline' };
          return (
            <View key={d.id} style={s.deviceCard} data-testid={`device-${d.device_type}`}>
              <Ionicons name={icons[d.device_type] || 'hardware-chip-outline'} size={24} color={Colors.textPrimary} />
              <View style={{ flex: 1 }}>
                <Text style={s.deviceName}>{d.name}</Text>
                <Text style={s.deviceMeta}>{d.connected ? 'Connecte' : 'Deconnecte'} - Sync: {d.last_sync ? new Date(d.last_sync).toLocaleString('fr-FR') : 'Jamais'}</Text>
              </View>
              <View style={s.batteryCol}>
                <View style={s.batteryOuter}>
                  <View style={[s.batteryInner, { width: `${d.battery || 0}%`, backgroundColor: batteryColor }]} />
                </View>
                <Text style={[s.batteryText, { color: batteryColor }]}>{d.battery || 0}%</Text>
              </View>
            </View>
          );
        }) : <View style={s.emptyC}><Text style={s.emptyT}>Aucun appareil</Text></View>}

        {/* ===== SECTION: Alertes ===== */}
        <Text style={s.secTitle}>Alertes ({data.alerts.length})</Text>
        {data.alerts.length > 0 ? data.alerts.map((a: any) => (
          <TouchableOpacity key={a.id} style={[s.alertCard, a.severity === 'critical' && { borderLeftColor: Colors.destructive }]}
            data-testid={`alert-card-${a.id}`}
            onPress={() => router.push({ pathname: '/alert-detail', params: { alertId: a.id } })}>
            <View style={s.alertTop}>
              <Ionicons name={a.alert_type === 'sos' ? 'alert-circle' : 'warning'} size={14} color={a.severity === 'critical' ? Colors.destructive : Colors.textMuted} />
              <Text style={s.alertType}>{a.alert_type}</Text>
              <View style={[s.badge, a.status === 'active' && { backgroundColor: Colors.destructive + '12' }]}>
                <Text style={[s.badgeT, a.status === 'active' && { color: Colors.destructive }]}>{a.status}</Text>
              </View>
            </View>
            <Text style={s.alertMsg}>{a.message}</Text>
            <Text style={s.alertDate}>{new Date(a.created_at).toLocaleString('fr-FR')}</Text>
            {a.status === 'active' && (
              <View style={s.alertActions}>
                <TouchableOpacity data-testid={`resolve-alert-${a.id}`} style={s.resolveAlertBtn}
                  onPress={(e) => { e.stopPropagation(); resolveAlert(a.id); }}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                  <Text style={s.resolveAlertBtnT}>Cloturer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.intervBtn}
                  onPress={(e) => { e.stopPropagation(); router.push({ pathname: '/alert-detail', params: { alertId: a.id } }); }}>
                  <Ionicons name="navigate" size={14} color="#FFF" />
                  <Text style={s.intervBtnT}>Intervenir</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        )) : <View style={s.emptyC}><Ionicons name="checkmark-circle" size={28} color={Colors.success} /><Text style={s.emptyT}>Aucune alerte</Text></View>}

        {/* ===== SECTION: Interventions ===== */}
        {(data.interventions || []).length > 0 && (
          <>
            <Text style={s.secTitle}>Interventions</Text>
            {data.interventions.map((iv: any) => (
              <TouchableOpacity key={iv.id} style={s.ivCard}
                data-testid={`intervention-${iv.id}`}
                onPress={() => router.push({ pathname: '/intervention-detail', params: { interventionId: iv.id } })}>
                <Ionicons name="navigate-circle-outline" size={20} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={s.ivStatus}>{iv.status}</Text>
                  <Text style={s.ivDate}>{new Date(iv.created_at).toLocaleString('fr-FR')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* ===== SECTION: Rapport IA ===== */}
        <View style={s.reportSection} data-testid="report-section">
          <TouchableOpacity style={s.reportBtn} onPress={generateReport} disabled={reportLoading}>
            {reportLoading ? <ActivityIndicator color="#FFF" /> : (
              <><Ionicons name="sparkles" size={16} color="#FFF" /><Text style={s.reportBtnT}>{report ? 'Regenerer le rapport IA' : 'Generer un rapport de sante IA'}</Text></>
            )}
          </TouchableOpacity>
          {report ? (
            <View style={s.reportCard}>
              <View style={s.reportHeader}>
                <Ionicons name="sparkles" size={16} color={Colors.textPrimary} />
                <Text style={s.reportTitle}>Rapport de sante IA</Text>
              </View>
              <Text style={s.reportText}>{report}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return <View style={s.row}><Text style={s.rowL}>{l}</Text><Text style={s.rowV}>{v}</Text></View>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.subtle, justifyContent: 'center', alignItems: 'center' },
  topTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  sc: { paddingHorizontal: 20, paddingBottom: 40 },
  userCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarT: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  userName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  userMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  statsCol: { alignItems: 'center' },
  alertCount: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  alertLabel: { fontSize: 9, color: Colors.textMuted, textTransform: 'uppercase' },
  secTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10, marginTop: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  vitalCard: { width: '31%', backgroundColor: Colors.subtle, borderRadius: 10, padding: 10, alignItems: 'center' },
  vitalLabel: { fontSize: 9, color: Colors.textMuted, textTransform: 'uppercase', textAlign: 'center' },
  vitalVal: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  card: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 14, marginBottom: 10, marginTop: 6 },
  cardTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  rowL: { fontSize: 12, color: Colors.textMuted },
  rowV: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  locText: { fontSize: 13, color: Colors.textPrimary },
  locTime: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  directionsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 10, marginTop: 12 },
  directionsBtnT: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  deviceCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.subtle, borderRadius: 10, padding: 14, marginBottom: 6 },
  deviceName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  deviceMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  batteryCol: { alignItems: 'flex-end', gap: 4 },
  batteryOuter: { width: 50, height: 10, backgroundColor: Colors.border, borderRadius: 5, overflow: 'hidden' },
  batteryInner: { height: '100%', borderRadius: 5 },
  batteryText: { fontSize: 11, fontWeight: '700' },
  alertCard: { backgroundColor: Colors.subtle, borderRadius: 10, padding: 10, marginBottom: 5, borderLeftWidth: 3, borderLeftColor: Colors.border },
  alertTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  alertType: { flex: 1, fontSize: 12, fontWeight: '700', color: Colors.textPrimary, textTransform: 'uppercase' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: Colors.border },
  badgeT: { fontSize: 9, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  alertMsg: { fontSize: 12, color: Colors.textSecondary },
  alertDate: { fontSize: 10, color: Colors.textMuted, marginTop: 3 },
  alertActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  resolveAlertBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.success + '30' },
  resolveAlertBtnT: { fontSize: 12, fontWeight: '600', color: Colors.success },
  intervBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.primary },
  intervBtnT: { fontSize: 12, fontWeight: '600', color: '#FFF' },
  ivCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.subtle, borderRadius: 10, padding: 14, marginBottom: 6 },
  ivStatus: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, textTransform: 'capitalize' },
  ivDate: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  reportSection: { marginTop: 20, marginBottom: 20 },
  reportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12 },
  reportBtnT: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  reportCard: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 16, marginTop: 12 },
  reportHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  reportTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  reportText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  emptyC: { alignItems: 'center', paddingVertical: 20 },
  emptyT: { fontSize: 13, color: Colors.textMuted, marginTop: 6 },
});
