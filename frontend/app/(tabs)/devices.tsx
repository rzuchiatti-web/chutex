import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { apiFetch } from '../../src/services/api';
import { Colors } from '../../src/constants/colors';

// ==================== BENEFICIARY: DEVICE MANAGEMENT ====================

function DeviceManagement({ token }: { token: string }) {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingDevice, setSyncingDevice] = useState<string | null>(null);

  const fetchDevices = useCallback(async () => {
    try {
      const data = await apiFetch('/api/devices', {}, token);
      setDevices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  const syncDevice = async (deviceType: string) => {
    setSyncingDevice(deviceType);
    try {
      const res = await apiFetch('/api/devices/sync', {
        method: 'POST',
        body: JSON.stringify({ device_type: deviceType, data: {} }),
      }, token);
      Alert.alert(
        'Synchronisé',
        `${deviceType === 'bracelet' ? 'Bracelet' : deviceType === 'scale' ? 'Balance' : 'Gilet'} synchronisé avec succès.${res.anomalies?.length ? `\n⚠️ ${res.anomalies.length} anomalie(s) détectée(s)` : ''}`
      );
      fetchDevices();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setSyncingDevice(null);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'bracelet': return 'watch';
      case 'scale': return 'scale-bathroom';
      case 'vest': return 'tshirt-crew';
      default: return 'devices';
    }
  };

  const getDeviceName = (type: string) => {
    switch (type) {
      case 'bracelet': return 'Bracelet Santé';
      case 'scale': return 'Balance Connectée';
      case 'vest': return 'Gilet Anti-Chute';
      default: return type;
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDevices(); }} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.infoText}>
        Appuyez sur "Synchroniser" pour simuler une connexion Bluetooth et récupérer les dernières données de vos appareils.
      </Text>

      {devices.map((device) => (
        <View key={device.id} style={styles.deviceCard} testID={`device-card-${device.device_type}`}>
          <View style={styles.deviceHeader}>
            <View style={[styles.deviceIconBg, { backgroundColor: device.connected ? Colors.primary + '15' : Colors.textMuted + '15' }]}>
              <MaterialCommunityIcons name={getDeviceIcon(device.device_type) as any} size={28} color={device.connected ? Colors.primary : Colors.textMuted} />
            </View>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{getDeviceName(device.device_type)}</Text>
              <View style={styles.deviceMeta}>
                <View style={[styles.connDot, { backgroundColor: device.connected ? Colors.success : Colors.textMuted }]} />
                <Text style={[styles.connText, { color: device.connected ? Colors.success : Colors.textMuted }]}>
                  {device.connected ? 'Connecté' : 'Déconnecté'}
                </Text>
              </View>
            </View>
          </View>

          {/* Battery & Last Sync */}
          <View style={styles.deviceStats}>
            <View style={styles.statItem}>
              <Ionicons name="battery-half" size={16} color={device.battery > 30 ? Colors.success : Colors.destructive} />
              <Text style={styles.statText}>{device.battery}%</Text>
            </View>
            {device.last_sync && (
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={16} color={Colors.textMuted} />
                <Text style={styles.statText}>
                  {new Date(device.last_sync).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )}
          </View>

          {/* Sync Button */}
          <TouchableOpacity
            testID={`sync-${device.device_type}-btn`}
            style={styles.syncBtn}
            onPress={() => syncDevice(device.device_type)}
            disabled={syncingDevice === device.device_type}
          >
            {syncingDevice === device.device_type ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="bluetooth-connect" size={18} color={Colors.primary} />
                <Text style={styles.syncBtnText}>Synchroniser</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

// ==================== GUARDIAN: PRESCRIPTIONS ====================

function PrescriptionManagement({ token }: { token: string }) {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', type: 'standard', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchPrescriptions = useCallback(async () => {
    try {
      const data = await apiFetch('/api/guardian/prescriptions', {}, token);
      setPrescriptions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchPrescriptions(); }, [fetchPrescriptions]);

  const submitPrescription = async () => {
    if (!formData.name || !formData.email) {
      Alert.alert('Erreur', 'Nom et email sont requis');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/api/guardian/prescriptions', {
        method: 'POST',
        body: JSON.stringify({
          beneficiary_name: formData.name,
          beneficiary_email: formData.email,
          beneficiary_phone: formData.phone,
          subscription_type: formData.type,
          notes: formData.notes,
        }),
      }, token);
      setShowForm(false);
      setFormData({ name: '', email: '', phone: '', type: 'standard', notes: '' });
      fetchPrescriptions();
      Alert.alert('Succès', 'Prescription créée avec succès');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalCommission = prescriptions.reduce((sum, p) => sum + (p.commission || 0), 0);

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Commission Summary */}
      <View style={styles.commissionCard}>
        <Ionicons name="cash-outline" size={24} color={Colors.accent} />
        <View style={styles.commissionInfo}>
          <Text style={styles.commissionLabel}>Total Commissions</Text>
          <Text style={styles.commissionValue}>{totalCommission.toFixed(2)} €</Text>
        </View>
        <Text style={styles.commissionCount}>{prescriptions.length} prescription(s)</Text>
      </View>

      {/* New Prescription Button */}
      <TouchableOpacity
        testID="new-prescription-btn"
        style={styles.newPrescBtn}
        onPress={() => setShowForm(true)}
      >
        <Ionicons name="add-circle" size={22} color="#FFF" />
        <Text style={styles.newPrescBtnText}>Nouvelle Prescription</Text>
      </TouchableOpacity>

      {/* Prescriptions List */}
      <Text style={styles.sectionTitle}>Prescriptions</Text>
      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} />
      ) : prescriptions.length > 0 ? (
        prescriptions.map((p) => (
          <View key={p.id} style={styles.prescCard} testID={`prescription-${p.id}`}>
            <View style={styles.prescHeader}>
              <Text style={styles.prescName}>{p.beneficiary_name}</Text>
              <View style={[styles.prescStatus, { backgroundColor: p.status === 'pending' ? Colors.accent + '15' : Colors.success + '15' }]}>
                <Text style={[styles.prescStatusText, { color: p.status === 'pending' ? Colors.accent : Colors.success }]}>
                  {p.status === 'pending' ? 'En attente' : 'Actif'}
                </Text>
              </View>
            </View>
            <Text style={styles.prescEmail}>{p.beneficiary_email}</Text>
            <View style={styles.prescFooter}>
              <Text style={styles.prescType}>
                {p.subscription_type === 'standard' ? 'Standard' : 'Téléassistance'}
              </Text>
              <Text style={styles.prescCommission}>+{p.commission}€</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="document-text-outline" size={32} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Aucune prescription</Text>
        </View>
      )}

      {/* Prescription Form Modal */}
      <Modal visible={showForm} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nouvelle Prescription</Text>

            <Text style={styles.inputLabel}>Nom du bénéficiaire</Text>
            <TextInput
              testID="presc-name-input"
              style={styles.modalInput}
              placeholder="Nom complet"
              placeholderTextColor={Colors.textMuted}
              value={formData.name}
              onChangeText={(v) => setFormData({ ...formData, name: v })}
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              testID="presc-email-input"
              style={styles.modalInput}
              placeholder="email@exemple.com"
              placeholderTextColor={Colors.textMuted}
              value={formData.email}
              onChangeText={(v) => setFormData({ ...formData, email: v })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Téléphone</Text>
            <TextInput
              testID="presc-phone-input"
              style={styles.modalInput}
              placeholder="06 12 34 56 78"
              placeholderTextColor={Colors.textMuted}
              value={formData.phone}
              onChangeText={(v) => setFormData({ ...formData, phone: v })}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Type d'abonnement</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                testID="presc-type-standard"
                style={[styles.typeBtn, formData.type === 'standard' && styles.typeBtnActive]}
                onPress={() => setFormData({ ...formData, type: 'standard' })}
              >
                <Text style={[styles.typeBtnText, formData.type === 'standard' && styles.typeBtnTextActive]}>Standard (15€)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID="presc-type-teleassistance"
                style={[styles.typeBtn, formData.type === 'teleassistance' && styles.typeBtnActive]}
                onPress={() => setFormData({ ...formData, type: 'teleassistance' })}
              >
                <Text style={[styles.typeBtnText, formData.type === 'teleassistance' && styles.typeBtnTextActive]}>Téléassistance (25€)</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              testID="presc-notes-input"
              style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
              placeholder="Notes additionnelles..."
              placeholderTextColor={Colors.textMuted}
              value={formData.notes}
              onChangeText={(v) => setFormData({ ...formData, notes: v })}
              multiline
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity testID="presc-cancel-btn" style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="presc-submit-btn" style={styles.submitBtn} onPress={submitPrescription} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Créer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ==================== MAIN SCREEN ====================

export default function DevicesScreen() {
  const { user, token } = useAuth();

  if (!user || !token) return null;

  return (
    <SafeAreaView style={styles.safeArea} testID="devices-screen">
      <View style={styles.header}>
        <Text style={styles.title}>{user.role === 'guardian' ? 'Prescriptions' : 'Mes Appareils'}</Text>
      </View>
      {user.role === 'guardian' ? (
        <PrescriptionManagement token={token} />
      ) : (
        <DeviceManagement token={token} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 16, backgroundColor: Colors.info + '08', padding: 14, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: Colors.info },

  // Device Card
  deviceCard: {
    backgroundColor: Colors.paper, borderRadius: 18, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  deviceHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  deviceIconBg: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  deviceMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  connDot: { width: 8, height: 8, borderRadius: 4 },
  connText: { fontSize: 13, fontWeight: '600' },
  deviceStats: { flexDirection: 'row', gap: 20, marginBottom: 14 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 13, color: Colors.textSecondary },
  syncBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.primary + '10',
  },
  syncBtnText: { fontSize: 15, fontWeight: '600', color: Colors.primary },

  // Commission
  commissionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.accent + '10',
    borderRadius: 16, padding: 16, marginBottom: 16, gap: 12,
  },
  commissionInfo: { flex: 1 },
  commissionLabel: { fontSize: 13, color: Colors.textSecondary },
  commissionValue: { fontSize: 22, fontWeight: '800', color: Colors.accent },
  commissionCount: { fontSize: 13, color: Colors.textMuted },

  // New Prescription Button
  newPrescBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 14, marginBottom: 20,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  newPrescBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },

  // Prescription Card
  prescCard: {
    backgroundColor: Colors.paper, borderRadius: 14, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  prescHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  prescName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  prescStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  prescStatusText: { fontSize: 12, fontWeight: '700' },
  prescEmail: { fontSize: 13, color: Colors.textMuted, marginBottom: 8 },
  prescFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prescType: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  prescCommission: { fontSize: 15, fontWeight: '700', color: Colors.success },

  // Empty
  emptyCard: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, color: Colors.textMuted, marginTop: 8 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginLeft: 4 },
  modalInput: {
    backgroundColor: Colors.subtle, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: Colors.textPrimary, marginBottom: 14, borderWidth: 1, borderColor: Colors.border,
  },
  typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: Colors.border, alignItems: 'center' },
  typeBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  typeBtnTextActive: { color: Colors.primary },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.subtle, alignItems: 'center' },
  cancelBtnText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  submitBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
