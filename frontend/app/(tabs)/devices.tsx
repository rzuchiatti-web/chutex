import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { apiFetch } from '../../src/services/api';
import { Colors } from '../../src/constants/colors';

/* ===== BENEFICIARY: DEVICE MANAGEMENT ===== */
function DeviceManagement({ token }: { token: string }) {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingDevice, setSyncingDevice] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try { setDevices(await apiFetch('/api/devices', {}, token)); } catch (e) { console.error(e); } finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  const syncDevice = async (deviceType: string) => {
    setSyncingDevice(deviceType);
    try {
      const res = await apiFetch('/api/devices/sync', { method: 'POST', body: JSON.stringify({ device_type: deviceType, data: {} }) }, token);
      Alert.alert('Synchronisé', `${deviceType === 'bracelet' ? 'Bracelet' : deviceType === 'scale' ? 'Balance' : 'Gilet'} synchronisé.${res.anomalies?.length ? `\n⚠️ ${res.anomalies.length} anomalie(s)` : ''}`);
      fetchDevices();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSyncingDevice(null); }
  };

  const getDeviceName = (type: string) => type === 'bracelet' ? 'Bracelet Santé' : type === 'scale' ? 'Balance Connectée' : 'Gilet Anti-Chute';
  const getDeviceIcon = (type: string) => type === 'bracelet' ? 'watch' : type === 'scale' ? 'scale-bathroom' : 'tshirt-crew';

  if (loading) return <View style={d.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={d.sv} contentContainerStyle={d.sc}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDevices(); }} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}>
      <Text style={d.infoText}>Appuyez sur «Synchroniser» pour simuler la connexion Bluetooth.</Text>
      {devices.map((device) => (
        <View key={device.id} style={d.deviceCard} testID={`device-card-${device.device_type}`}>
          <View style={d.deviceHeader}>
            <View style={d.deviceIconBg}><MaterialCommunityIcons name={getDeviceIcon(device.device_type) as any} size={24} color={Colors.textPrimary} /></View>
            <View style={d.deviceInfo}>
              <Text style={d.deviceName}>{getDeviceName(device.device_type)}</Text>
              <View style={d.deviceMeta}><View style={[d.connDot, { backgroundColor: device.connected ? Colors.success : Colors.textMuted }]} />
                <Text style={[d.connText, { color: device.connected ? Colors.success : Colors.textMuted }]}>{device.connected ? 'Connecté' : 'Déconnecté'}</Text></View>
            </View>
            <Text style={d.batteryT}>{device.battery}%</Text>
          </View>
          <TouchableOpacity testID={`sync-${device.device_type}-btn`} style={d.syncBtn}
            onPress={() => syncDevice(device.device_type)} disabled={syncingDevice === device.device_type}>
            {syncingDevice === device.device_type ? <ActivityIndicator color={Colors.primary} size="small" /> : (
              <><MaterialCommunityIcons name="bluetooth-connect" size={16} color={Colors.primary} /><Text style={d.syncBtnText}>Synchroniser</Text></>)}
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

/* ===== GUARDIAN: PRESCRIPTIONS ===== */
function PrescriptionManagement({ token, user }: { token: string; user: any }) {
  const { refreshUser } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', type: 'standard', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [actCode, setActCode] = useState('');
  const [activating, setActivating] = useState(false);

  const fetchPrescriptions = useCallback(async () => {
    try { setPrescriptions(await apiFetch('/api/guardian/prescriptions', {}, token)); } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { if (user?.is_prescriber) fetchPrescriptions(); else setLoading(false); }, [fetchPrescriptions, user]);

  const activatePrescriber = async () => {
    if (!actCode.trim()) return Alert.alert('Erreur', 'Entrez un code prescripteur');
    setActivating(true);
    try {
      await apiFetch('/api/guardian/activate-prescriber', { method: 'POST', body: JSON.stringify({ code: actCode.trim().toUpperCase() }) }, token);
      Alert.alert('Activé', 'Votre espace prescripteur est maintenant actif !');
      setActCode(''); await refreshUser();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setActivating(false); }
  };

  const submitPrescription = async () => {
    if (!formData.name || !formData.email) return Alert.alert('Erreur', 'Nom et email requis');
    setSubmitting(true);
    try {
      await apiFetch('/api/guardian/prescriptions', { method: 'POST', body: JSON.stringify({
        beneficiary_name: formData.name, beneficiary_email: formData.email, beneficiary_phone: formData.phone,
        subscription_type: formData.type, notes: formData.notes,
      }) }, token);
      setShowForm(false); setFormData({ name: '', email: '', phone: '', type: 'standard', notes: '' }); fetchPrescriptions();
      Alert.alert('Succès', 'Prescription créée');
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSubmitting(false); }
  };

  const totalComm = prescriptions.reduce((sum, p) => sum + (p.commission || 0), 0);

  return (
    <ScrollView style={d.sv} contentContainerStyle={d.sc} showsVerticalScrollIndicator={false}>
      {/* Prescriber activation - show prominently if not yet a prescriber */}
      {!user?.is_prescriber ? (
        <View style={d.activateCard}>
          <Ionicons name="medical-outline" size={40} color={Colors.primary} />
          <Text style={d.activateTitle}>Espace Prescripteur</Text>
          <Text style={d.activateDesc}>
            Activez votre espace prescripteur avec le code fourni par votre structure partenaire Chutex pour prescrire des abonnements à vos bénéficiaires.
          </Text>
          <View style={d.activateRow}>
            <TextInput testID="prescriber-code-input" style={d.activateInput} placeholder="CODE PRESCRIPTEUR"
              placeholderTextColor={Colors.textMuted} value={actCode} onChangeText={setActCode} autoCapitalize="characters" />
            <TouchableOpacity testID="activate-prescriber-btn" style={d.activateBtn} onPress={activatePrescriber} disabled={activating}>
              {activating ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={d.activateBtnT}>Activer</Text>}
            </TouchableOpacity>
          </View>
          <View style={d.divider}><View style={d.divLine} /><Text style={d.divText}>ou</Text><View style={d.divLine} /></View>
          <TouchableOpacity style={d.chutexLink} onPress={() => Linking.openURL('https://chutex-innovation.com')}>
            <Text style={d.chutexLinkT}>Devenir prescripteur sur chutex-innovation.com</Text>
            <Ionicons name="open-outline" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={d.commCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={{ fontSize: 12, color: Colors.success, fontWeight: '700' }}>Prescripteur actif — {user.prescriber_structure}</Text>
            </View>
            <Text style={d.commLabel}>Total Commissions</Text>
            <Text style={d.commVal}>{totalComm.toFixed(2)} €</Text>
            <Text style={d.commCount}>{prescriptions.length} prescription(s)</Text>
          </View>

      <TouchableOpacity testID="new-prescription-btn" style={d.newPrescBtn} onPress={() => setShowForm(true)}>
        <Ionicons name="add" size={18} color="#FFF" /><Text style={d.newPrescBtnText}>Nouvelle Prescription</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator size="large" color={Colors.primary} /> : prescriptions.length > 0 ? (
        prescriptions.map((p) => (
          <View key={p.id} style={d.prescCard} testID={`prescription-${p.id}`}>
            <View style={d.prescHeader}><Text style={d.prescName}>{p.beneficiary_name}</Text>
              <View style={[d.prescStatus, p.status === 'subscribed' && { backgroundColor: Colors.success + '12' }]}>
                <Text style={[d.prescStatusText, p.status === 'subscribed' && { color: Colors.success }]}>{p.status === 'pending' ? 'En attente' : 'Actif'}</Text></View></View>
            <Text style={d.prescEmail}>{p.beneficiary_email}</Text>
            <View style={d.prescFooter}><Text style={d.prescType}>{p.subscription_type === 'standard' ? 'Standard (15€)' : 'Téléassistance (25€)'}</Text>
              <Text style={d.prescComm}>+{p.commission}€</Text></View>
          </View>
        ))
      ) : <View style={d.emptyC}><Ionicons name="document-text-outline" size={28} color={Colors.textMuted} /><Text style={d.emptyT}>Aucune prescription</Text></View>}

      <Modal visible={showForm} transparent animationType="slide">
        <View style={d.modalO}><View style={d.modalC}>
          <Text style={d.modalT}>Nouvelle Prescription</Text>
          <Text style={d.inputL}>Nom du bénéficiaire</Text>
          <TextInput testID="presc-name-input" style={d.modalInp} placeholder="Nom complet" placeholderTextColor={Colors.textMuted}
            value={formData.name} onChangeText={(v) => setFormData({ ...formData, name: v })} />
          <Text style={d.inputL}>Email</Text>
          <TextInput testID="presc-email-input" style={d.modalInp} placeholder="email@exemple.com" placeholderTextColor={Colors.textMuted}
            value={formData.email} onChangeText={(v) => setFormData({ ...formData, email: v })} keyboardType="email-address" autoCapitalize="none" />
          <Text style={d.inputL}>Téléphone</Text>
          <TextInput testID="presc-phone-input" style={d.modalInp} placeholder="06 12 34 56 78" placeholderTextColor={Colors.textMuted}
            value={formData.phone} onChangeText={(v) => setFormData({ ...formData, phone: v })} keyboardType="phone-pad" />
          <Text style={d.inputL}>Type d'abonnement</Text>
          <View style={d.typeSelector}>
            {[{id:'standard',l:'Standard (15€)'},{id:'teleassistance',l:'Téléassist. (25€)'}].map(t => (
              <TouchableOpacity key={t.id} testID={`presc-type-${t.id}`} style={[d.typeBtn, formData.type === t.id && d.typeBtnA]} onPress={() => setFormData({ ...formData, type: t.id })}>
                <Text style={[d.typeBtnT, formData.type === t.id && d.typeBtnTA]}>{t.l}</Text></TouchableOpacity>
            ))}
          </View>
          <View style={d.modalBtns}>
            <TouchableOpacity style={d.cancelBtn} onPress={() => setShowForm(false)}><Text style={d.cancelBtnT}>Annuler</Text></TouchableOpacity>
            <TouchableOpacity testID="presc-submit-btn" style={d.submitBtn} onPress={submitPrescription} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={d.submitBtnT}>Créer</Text>}</TouchableOpacity>
          </View>
        </View></View>
      </Modal>
        </>
      )}
    </ScrollView>
  );
}

/* ===== TELEASSISTANCE: SUBSCRIBERS ===== */
function SubscribersList({ token }: { token: string }) {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { setSubs(await apiFetch('/api/teleassistance/subscribers', {}, token)); } catch {} finally { setLoading(false); } })(); }, []);
  if (loading) return <View style={d.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  return (
    <ScrollView style={d.sv} contentContainerStyle={d.sc}>
      <Text style={d.subCount}>{subs.length} abonné(s)</Text>
      {subs.map(su => (
        <View key={su.id} style={d.subCard}>
          <View style={d.subAv}><Text style={d.subAvT}>{su.name?.charAt(0)?.toUpperCase()}</Text></View>
          <View style={d.subInfo}><Text style={d.subName}>{su.name}</Text><Text style={d.subEmail}>{su.email}</Text></View>
          {su.active_alerts > 0 && <View style={d.alertBdg}><Text style={d.alertBdgT}>{su.active_alerts}</Text></View>}
        </View>
      ))}
      {subs.length === 0 && <View style={d.emptyC}><Text style={d.emptyT}>Aucun abonné</Text></View>}
    </ScrollView>
  );
}

/* ===== MAIN ===== */
export default function DevicesScreen() {
  const { user, token } = useAuth();
  if (!user || !token) return null;
  return (
    <SafeAreaView style={d.safeArea} testID="devices-screen">
      <View style={d.header}>
        <Text style={d.title}>{user.role === 'guardian' ? 'Prescriptions' : (user.role === 'teleassistance' || user.role === 'admin') ? 'Abonnés' : 'Mes Appareils'}</Text>
      </View>
      {user.role === 'guardian' ? <PrescriptionManagement token={token} user={user} />
        : (user.role === 'teleassistance' || user.role === 'admin') ? <SubscribersList token={token} />
        : <DeviceManagement token={token} />}
    </SafeAreaView>
  );
}

const d = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  sv: { flex: 1 }, sc: { paddingHorizontal: 20, paddingBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginBottom: 14, backgroundColor: Colors.subtle, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  // Device Card
  deviceCard: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 16, marginBottom: 10 },
  deviceHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  deviceIconBg: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.border },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  deviceMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  connDot: { width: 6, height: 6, borderRadius: 3 },
  connText: { fontSize: 12, fontWeight: '600' },
  batteryT: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  syncBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.paper },
  syncBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  // Prescriptions
  commCard: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 16, marginBottom: 14, alignItems: 'center' },
  commLabel: { fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  commVal: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  commCount: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  newPrescBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12, marginBottom: 16 },
  newPrescBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  prescCard: { backgroundColor: Colors.subtle, borderRadius: 12, padding: 14, marginBottom: 6 },
  prescHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  prescName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  prescStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: Colors.subtle, borderWidth: 1, borderColor: Colors.border },
  prescStatusText: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  prescEmail: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  prescFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prescType: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  prescComm: { fontSize: 14, fontWeight: '700', color: Colors.success },
  // Subscribers
  subCount: { fontSize: 12, color: Colors.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  subCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.subtle, borderRadius: 10, padding: 12, marginBottom: 6, gap: 10 },
  subAv: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  subAvT: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  subInfo: { flex: 1 },
  subName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  subEmail: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  alertBdg: { backgroundColor: Colors.destructive, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  alertBdgT: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  // Empty & Modal
  emptyC: { alignItems: 'center', paddingVertical: 36 },
  emptyT: { fontSize: 13, color: Colors.textMuted, marginTop: 8 },
  modalO: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalC: { backgroundColor: Colors.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalT: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  inputL: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalInp: { backgroundColor: Colors.subtle, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: Colors.textPrimary, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  typeSelector: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  typeBtnA: { borderColor: Colors.primary },
  typeBtnT: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  typeBtnTA: { color: Colors.textPrimary },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.subtle, alignItems: 'center' },
  cancelBtnT: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  submitBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' },
  submitBtnT: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
