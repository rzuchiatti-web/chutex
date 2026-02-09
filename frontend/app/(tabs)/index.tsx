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

// ==================== BENEFICIARY DASHBOARD ====================

function BeneficiaryDashboard({ token, user }: { token: string; user: any }) {
  const [vitals, setVitals] = useState<any>(null);
  const [recommendation, setRecommendation] = useState('');
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showMedModal, setShowMedModal] = useState(false);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medTime, setMedTime] = useState('08:00');

  const fetchData = useCallback(async () => {
    try {
      const [readingsRes, recRes, medsRes] = await Promise.all([
        apiFetch('/api/devices/latest', {}, token).catch(() => ({})),
        apiFetch('/api/ai/recommendations/latest', {}, token).catch(() => ({ recommendation: '' })),
        apiFetch('/api/medications', {}, token).catch(() => []),
      ]);
      if (readingsRes.bracelet) setVitals(readingsRes.bracelet.data);
      if (recRes.recommendation) setRecommendation(recRes.recommendation);
      setMedications(medsRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSOS = async () => {
    setSosLoading(true);
    try {
      await apiFetch('/api/alerts', {
        method: 'POST',
        body: JSON.stringify({ alert_type: 'sos', severity: 'critical', message: 'SOS - Aide requise immédiatement!', device_type: 'bracelet' }),
      }, token);
      Alert.alert('SOS Envoyé', 'Vos gardiens ont été alertés. Aide en route.');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setSosLoading(false);
    }
  };

  const handleAIRecommendation = async () => {
    setAiLoading(true);
    try {
      const res = await apiFetch('/api/ai/recommendations', { method: 'POST' }, token);
      setRecommendation(res.recommendation);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const addMedication = async () => {
    if (!medName || !medDosage) return;
    try {
      await apiFetch('/api/medications', {
        method: 'POST',
        body: JSON.stringify({ name: medName, dosage: medDosage, frequency: 'quotidien', times: [medTime], notes: '' }),
      }, token);
      setShowMedModal(false);
      setMedName('');
      setMedDosage('');
      fetchData();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  };

  const deleteMedication = async (id: string) => {
    try {
      await apiFetch(`/api/medications/${id}`, { method: 'DELETE' }, token);
      fetchData();
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <View>
          <Text style={styles.greetingHi}>Bonjour,</Text>
          <Text style={styles.greetingName}>{user.name} 👋</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.statusText}>Connecté</Text>
        </View>
      </View>

      {/* Vitals Grid */}
      <Text style={styles.sectionTitle}>Mes Constantes</Text>
      {vitals ? (
        <View style={styles.vitalsGrid}>
          <VitalCard icon="heart" label="Fréquence" value={`${vitals.heart_rate}`} unit="bpm" color={Colors.destructive} />
          <VitalCard icon="pulse" label="Tension" value={`${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic}`} unit="mmHg" color={Colors.info} />
          <VitalCard icon="water" label="SpO2" value={`${vitals.spo2}`} unit="%" color={Colors.primary} />
          <VitalCard icon="thermometer" label="Température" value={`${vitals.temperature}`} unit="°C" color={Colors.accent} />
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="bluetooth-off" size={32} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Synchronisez votre bracelet pour voir vos constantes</Text>
        </View>
      )}

      {/* SOS Button */}
      <TouchableOpacity
        testID="sos-button"
        style={styles.sosButton}
        onPress={handleSOS}
        disabled={sosLoading}
        activeOpacity={0.8}
      >
        {sosLoading ? (
          <ActivityIndicator color="#FFF" size="large" />
        ) : (
          <>
            <Ionicons name="alert-circle" size={36} color="#FFF" />
            <Text style={styles.sosText}>SOS</Text>
            <Text style={styles.sosSubtext}>Appuyez en cas d'urgence</Text>
          </>
        )}
      </TouchableOpacity>

      {/* AI Recommendation */}
      <View style={styles.aiCard}>
        <View style={styles.aiHeader}>
          <View style={styles.aiIconBg}>
            <Ionicons name="sparkles" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.aiTitle}>Recommandations IA</Text>
        </View>
        {recommendation ? (
          <Text style={styles.aiText}>{recommendation}</Text>
        ) : (
          <Text style={styles.aiTextEmpty}>Synchronisez vos appareils pour des conseils personnalisés</Text>
        )}
        <TouchableOpacity
          testID="ai-recommend-btn"
          style={styles.aiBtn}
          onPress={handleAIRecommendation}
          disabled={aiLoading}
        >
          {aiLoading ? (
            <ActivityIndicator color={Colors.primary} size="small" />
          ) : (
            <>
              <Ionicons name="refresh" size={16} color={Colors.primary} />
              <Text style={styles.aiBtnText}>Nouvelles recommandations</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Medications */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mes Médicaments</Text>
        <TouchableOpacity testID="add-medication-btn" onPress={() => setShowMedModal(true)} style={styles.addBtn}>
          <Ionicons name="add-circle" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      {medications.length > 0 ? (
        medications.map((med) => (
          <View key={med.id} style={styles.medCard}>
            <View style={styles.medIcon}>
              <MaterialCommunityIcons name="pill" size={22} color={Colors.primary} />
            </View>
            <View style={styles.medInfo}>
              <Text style={styles.medName}>{med.name}</Text>
              <Text style={styles.medDosage}>{med.dosage} - {med.times?.join(', ')}</Text>
            </View>
            <TouchableOpacity testID={`delete-med-${med.id}`} onPress={() => deleteMedication(med.id)}>
              <Ionicons name="trash-outline" size={20} color={Colors.destructive} />
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="pill" size={28} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Aucun médicament ajouté</Text>
        </View>
      )}

      {/* Medication Modal */}
      <Modal visible={showMedModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter un médicament</Text>
            <TextInput
              testID="med-name-input"
              style={styles.modalInput}
              placeholder="Nom du médicament"
              placeholderTextColor={Colors.textMuted}
              value={medName}
              onChangeText={setMedName}
            />
            <TextInput
              testID="med-dosage-input"
              style={styles.modalInput}
              placeholder="Dosage (ex: 500mg)"
              placeholderTextColor={Colors.textMuted}
              value={medDosage}
              onChangeText={setMedDosage}
            />
            <TextInput
              testID="med-time-input"
              style={styles.modalInput}
              placeholder="Heure de prise (ex: 08:00)"
              placeholderTextColor={Colors.textMuted}
              value={medTime}
              onChangeText={setMedTime}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity testID="med-cancel-btn" style={styles.modalCancelBtn} onPress={() => setShowMedModal(false)}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="med-save-btn" style={styles.modalSaveBtn} onPress={addMedication}>
                <Text style={styles.modalSaveText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function VitalCard({ icon, label, value, unit, color }: { icon: string; label: string; value: string; unit: string; color: string }) {
  return (
    <View style={[styles.vitalCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <View style={[styles.vitalIconBg, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.vitalLabel}>{label}</Text>
      <View style={styles.vitalValueRow}>
        <Text style={[styles.vitalValue, { color }]}>{value}</Text>
        <Text style={styles.vitalUnit}>{unit}</Text>
      </View>
    </View>
  );
}

// ==================== GUARDIAN DASHBOARD ====================

function GuardianDashboard({ token, user }: { token: string; user: any }) {
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [bens, alts] = await Promise.all([
        apiFetch('/api/guardian/beneficiaries', {}, token).catch(() => []),
        apiFetch('/api/alerts', {}, token).catch(() => []),
      ]);
      setBeneficiaries(bens);
      setAlerts(alts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  const activeAlerts = alerts.filter((a: any) => a.status === 'active');

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.greeting}>
        <View>
          <Text style={styles.greetingHi}>Bonjour,</Text>
          <Text style={styles.greetingName}>{user.name} 🛡️</Text>
        </View>
        <View style={styles.guardianBadge}>
          <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
          <Text style={styles.guardianBadgeText}>Gardien</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: Colors.primary + '10' }]}>
          <Text style={[styles.statValue, { color: Colors.primary }]}>{beneficiaries.length}</Text>
          <Text style={styles.statLabel}>Bénéficiaires</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: activeAlerts.length > 0 ? Colors.destructive + '10' : Colors.success + '10' }]}>
          <Text style={[styles.statValue, { color: activeAlerts.length > 0 ? Colors.destructive : Colors.success }]}>{activeAlerts.length}</Text>
          <Text style={styles.statLabel}>Alertes actives</Text>
        </View>
      </View>

      {/* Beneficiaries */}
      <Text style={styles.sectionTitle}>Bénéficiaires suivis</Text>
      {beneficiaries.length > 0 ? (
        beneficiaries.map((b: any) => (
          <View key={b.id} style={styles.beneficiaryCard}>
            <View style={styles.benAvatar}>
              <Text style={styles.benAvatarText}>{b.name?.charAt(0)?.toUpperCase()}</Text>
            </View>
            <View style={styles.benInfo}>
              <Text style={styles.benName}>{b.name}</Text>
              <Text style={styles.benStatus}>
                {b.latest_vitals ? `❤️ ${b.latest_vitals.heart_rate} bpm` : 'Pas de données'}
              </Text>
            </View>
            <View style={styles.benRight}>
              {b.active_alerts > 0 && (
                <View style={styles.alertBadge}>
                  <Text style={styles.alertBadgeText}>{b.active_alerts}</Text>
                </View>
              )}
              <View style={[styles.statusDot, { backgroundColor: b.latest_vitals ? Colors.success : Colors.textMuted }]} />
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="people-outline" size={32} color={Colors.textMuted} />
          <Text style={styles.emptyText}>Aucun bénéficiaire lié</Text>
          <Text style={styles.emptySubtext}>Allez dans Profil pour lier un bénéficiaire</Text>
        </View>
      )}

      {/* Recent Alerts */}
      <Text style={styles.sectionTitle}>Alertes récentes</Text>
      {activeAlerts.length > 0 ? (
        activeAlerts.slice(0, 5).map((alert: any) => (
          <View key={alert.id} style={[styles.alertCard, alert.severity === 'critical' && styles.alertCardCritical]}>
            <Ionicons
              name={alert.alert_type === 'sos' ? 'alert-circle' : alert.alert_type === 'fall' ? 'trending-down' : 'warning'}
              size={24}
              color={alert.severity === 'critical' ? Colors.destructive : Colors.accent}
            />
            <View style={styles.alertInfo}>
              <Text style={styles.alertMessage}>{alert.message}</Text>
              <Text style={styles.alertMeta}>{alert.beneficiary_name} • {new Date(alert.created_at).toLocaleString('fr-FR')}</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
          <Text style={styles.emptyText}>Aucune alerte active</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ==================== MAIN DASHBOARD ====================

export default function DashboardScreen() {
  const { user, token } = useAuth();

  if (!user || !token) return null;

  return (
    <SafeAreaView style={styles.safeArea} testID="dashboard-screen">
      {user.role === 'guardian' ? (
        <GuardianDashboard token={token} user={user} />
      ) : (
        <BeneficiaryDashboard token={token} user={user} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  greeting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 24 },
  greetingHi: { fontSize: 16, color: Colors.textSecondary },
  greetingName: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.success + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '600', color: Colors.success },
  guardianBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  guardianBadgeText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  addBtn: { padding: 4 },

  // Vitals
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  vitalCard: {
    width: '47%', backgroundColor: Colors.paper, borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  vitalIconBg: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  vitalLabel: { fontSize: 13, color: Colors.textMuted, marginBottom: 4 },
  vitalValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  vitalValue: { fontSize: 24, fontWeight: '800' },
  vitalUnit: { fontSize: 13, color: Colors.textMuted },

  // SOS
  sosButton: {
    backgroundColor: Colors.destructive, borderRadius: 20, paddingVertical: 24,
    alignItems: 'center', marginBottom: 20,
    shadowColor: Colors.destructive, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  sosText: { color: '#FFF', fontSize: 28, fontWeight: '900', marginTop: 4 },
  sosSubtext: { color: '#FFF', fontSize: 13, opacity: 0.8, marginTop: 4 },

  // AI
  aiCard: {
    backgroundColor: Colors.paper, borderRadius: 16, padding: 18, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.primary + '20',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  aiHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  aiIconBg: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
  aiTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  aiText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  aiTextEmpty: { fontSize: 14, color: Colors.textMuted, fontStyle: 'italic' },
  aiBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.primary + '10' },
  aiBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  // Medications
  medCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.paper,
    borderRadius: 14, padding: 14, marginBottom: 10, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  medIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
  medInfo: { flex: 1 },
  medName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  medDosage: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 20 },
  modalInput: { backgroundColor: Colors.subtle, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: Colors.textPrimary, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.subtle, alignItems: 'center' },
  modalCancelText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  modalSaveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' },
  modalSaveText: { fontSize: 16, fontWeight: '600', color: '#FFF' },

  // Empty State
  emptyCard: {
    backgroundColor: Colors.paper, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
  },
  emptyText: { fontSize: 15, color: Colors.textMuted, marginTop: 8, textAlign: 'center' },
  emptySubtext: { fontSize: 13, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },

  // Guardian - Stats
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, borderRadius: 16, padding: 18, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },

  // Guardian - Beneficiaries
  beneficiaryCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.paper,
    borderRadius: 16, padding: 14, marginBottom: 10, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  benAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary + '15',
    justifyContent: 'center', alignItems: 'center',
  },
  benAvatarText: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  benInfo: { flex: 1 },
  benName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  benStatus: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  benRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertBadge: { backgroundColor: Colors.destructive, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  alertBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  // Guardian - Alerts
  alertCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.paper,
    borderRadius: 14, padding: 14, marginBottom: 10, gap: 12,
    borderLeftWidth: 3, borderLeftColor: Colors.accent,
  },
  alertCardCritical: { borderLeftColor: Colors.destructive, backgroundColor: Colors.destructive + '05' },
  alertInfo: { flex: 1 },
  alertMessage: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  alertMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
});
