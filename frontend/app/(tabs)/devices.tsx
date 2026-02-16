import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal, Linking, Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

const confirmAction = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [{ text: 'Annuler', style: 'cancel' }, { text: 'Confirmer', style: 'destructive', onPress: onConfirm }]);
  }
};
import { apiFetch } from '../../src/services/api';
import { Colors } from '../../src/constants/colors';
import { useTheme } from '../../src/context/ThemeContext';
import { PageExplainer } from '../../src/components/HelpSystem';

/* ===== BENEFICIARY: DEVICE MANAGEMENT ===== */
function DeviceManagement({ token }: { token: string }) {
  const router = useRouter();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingDevice, setSyncingDevice] = useState<string | null>(null);
  const [vestStatus, setVestStatus] = useState<any>(null);
  const [braceletStatus, setBraceletStatus] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);

  const fetchDevices = useCallback(async () => {
    try {
      const [devs, vs, bs, sub] = await Promise.all([
        apiFetch('/api/devices', {}, token),
        apiFetch('/api/vest/status', {}, token).catch(() => null),
        apiFetch('/api/bracelet/status', {}, token).catch(() => null),
        apiFetch('/api/subscriptions/my', {}, token).catch(() => null),
      ]);
      setDevices(devs);
      setVestStatus(vs);
      setBraceletStatus(bs);
      setSubscription(sub);
    } catch (e) { console.error(e); } finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  const syncDevice = async (deviceType: string) => {
    if (deviceType === 'vest') {
      router.push('/vest-connect');
      return;
    }
    if (deviceType === 'bracelet') {
      if (!subscription?.can_use_bracelet) {
        Alert.alert('Abonnement requis', 'Un abonnement Standard ou Care est necessaire pour utiliser le bracelet Elio.');
        return;
      }
      router.push('/bracelet-connect');
      return;
    }
    setSyncingDevice(deviceType);
    try {
      const res = await apiFetch('/api/devices/sync', { method: 'POST', body: JSON.stringify({ device_type: deviceType, data: {} }) }, token);
      Alert.alert('Synchronise', `${deviceType === 'bracelet' ? 'Bracelet' : 'Balance'} synchronise.${res.anomalies?.length ? `\n${res.anomalies.length} anomalie(s)` : ''}`);
      fetchDevices();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSyncingDevice(null); }
  };

  const getDeviceName = (type: string) => type === 'bracelet' ? 'Bracelet Elio' : type === 'scale' ? 'Balance Connectee' : 'Gilet Anti-Chute S-AIRBAG';
  const getDeviceIcon = (type: string) => type === 'bracelet' ? 'watch' : type === 'scale' ? 'scale-bathroom' : 'tshirt-crew';

  if (loading) return <View style={d.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={d.sv} contentContainerStyle={d.sc}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDevices(); }} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}>

      <PageExplainer pageId="devices" title="Vos appareils connectes" sections={[
        { icon: 'watch-outline', heading: 'Bracelet Elio', text: 'Mesure en continu votre rythme cardiaque, SpO2, temperature et detecte les chutes. Necessite un abonnement Standard ou Care.' },
        { icon: 'shield-outline', heading: 'Gilet Anti-Chute', text: 'Le S-AIRBAG se gonfle automatiquement en cas de chute pour proteger vos hanches. Connexion Bluetooth.' },
        { icon: 'scale-outline', heading: 'Balance connectee', text: 'Mesurez votre poids et composition corporelle (30+ metriques). Connectez-la en Bluetooth ou WiFi.' },
      ]} />

      {/* Subscription Status */}
      {subscription && (
        <View style={[d.infoText, { flexDirection: 'row', alignItems: 'center', gap: 8, borderColor: subscription.has_subscription ? Colors.success : Colors.border }]}>
          <Ionicons name={subscription.has_subscription ? "checkmark-circle" : "alert-circle"} size={16} color={subscription.has_subscription ? Colors.success : Colors.textMuted} />
          <Text style={{ fontSize: 12, color: subscription.has_subscription ? Colors.success : Colors.textSecondary, flex: 1, fontWeight: '600' }}>
            {subscription.has_subscription
              ? `Abonnement ${subscription.subscription_type?.toUpperCase()} actif${subscription.has_teleassistance ? ' - Teleassistance incluse' : ''}`
              : 'Pas d\'abonnement - Gilet et balance disponibles'}
          </Text>
        </View>
      )}

      {devices.map((device) => {
        const isVest = device.device_type === 'vest';
        const isBracelet = device.device_type === 'bracelet';
        const vestConnected = isVest && vestStatus?.connected;
        const braceletConnected = isBracelet && braceletStatus?.connected;
        const realBattery = isVest ? (vestStatus?.battery || device.battery) : isBracelet ? (braceletStatus?.battery || device.battery) : device.battery;
        const realConnected = isVest ? vestConnected : isBracelet ? braceletConnected : device.connected;
        const needsSub = isBracelet && !subscription?.can_use_bracelet;

        return (
          <View key={device.id} style={[d.deviceCard, needsSub && { opacity: 0.6 }]} testID={`device-card-${device.device_type}`}>
            <View style={d.deviceHeader}>
              <View style={d.deviceIconBg}><MaterialCommunityIcons name={getDeviceIcon(device.device_type) as any} size={24} color={Colors.textPrimary} /></View>
              <View style={d.deviceInfo}>
                <Text style={d.deviceName}>{getDeviceName(device.device_type)}</Text>
                <View style={d.deviceMeta}>
                  <View style={[d.connDot, { backgroundColor: realConnected ? Colors.success : Colors.textMuted }]} />
                  <Text style={[d.connText, { color: realConnected ? Colors.success : Colors.textMuted }]}>
                    {realConnected ? 'Actif' : (isVest || isBracelet) && realBattery > 0 ? 'Eteint' : 'Deconnecte'}
                  </Text>
                  {needsSub && <Text style={{ fontSize: 10, color: Colors.destructive, marginLeft: 6 }}>Abonnement requis</Text>}
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={d.batteryT}>{realBattery}%</Text>
                <Ionicons name={(realBattery > 50) ? "battery-full" : (realBattery > 20) ? "battery-half" : "battery-dead"} size={16} color={(realBattery > 20) ? Colors.success : Colors.destructive} />
              </View>
            </View>

            {isVest ? (
              <TouchableOpacity testID="connect-vest-ble-btn" style={[d.syncBtn, vestConnected && { borderColor: Colors.success }]}
                onPress={() => router.push('/vest-connect')}>
                <Ionicons name="bluetooth" size={16} color={vestConnected ? Colors.success : Colors.primary} />
                <Text style={[d.syncBtnText, vestConnected && { color: Colors.success }]}>
                  {vestConnected ? 'Gilet actif - Voir details' : 'Connecter via Bluetooth'}
                </Text>
              </TouchableOpacity>
            ) : isBracelet ? (
              <TouchableOpacity testID="connect-bracelet-ble-btn" style={[d.syncBtn, braceletConnected && { borderColor: Colors.success }, needsSub && { opacity: 0.5 }]}
                onPress={() => syncDevice('bracelet')} disabled={needsSub}>
                <Ionicons name="bluetooth" size={16} color={braceletConnected ? Colors.success : Colors.primary} />
                <Text style={[d.syncBtnText, braceletConnected && { color: Colors.success }]}>
                  {braceletConnected ? 'Bracelet actif - Voir details' : needsSub ? 'Abonnement requis' : 'Connecter via Bluetooth'}
                </Text>
              </TouchableOpacity>
            ) : device.device_type === 'scale' ? (
              <TouchableOpacity testID="scale-detail-btn" style={[d.syncBtn, { borderColor: '#4CAF50' }]}
                onPress={() => router.push('/scale-detail')}>
                <Ionicons name="analytics" size={16} color="#4CAF50" />
                <Text style={[d.syncBtnText, { color: '#10B981' }]}>Voir mes mesures</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity testID={`sync-${device.device_type}-btn`} style={[d.syncBtn, needsSub && { opacity: 0.5 }]}
                onPress={() => syncDevice(device.device_type)} disabled={syncingDevice === device.device_type || needsSub}>
                {syncingDevice === device.device_type ? <ActivityIndicator color={Colors.primary} size="small" /> : (
                  <><MaterialCommunityIcons name="bluetooth-connect" size={16} color={Colors.primary} /><Text style={d.syncBtnText}>Synchroniser</Text></>)}
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

/* ===== REWARDS CARD FOR PRESCRIBERS ===== */
function RewardsCard({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  useEffect(() => { apiFetch('/api/rewards/ranking', {}, token).then(setData).catch(() => {}); }, [token]);
  if (!data) return null;
  const posColor = data.my_position === 1 ? '#FFD700' : data.my_position === 2 ? '#C0C0C0' : data.my_position === 3 ? '#CD7F32' : '#000';
  const myPrize = data.my_position === 1 ? data.prizes?.['1'] : data.my_position === 2 ? data.prizes?.['2'] : data.my_position === 3 ? data.prizes?.['3'] : 0;
  return (
    <>
      <TouchableOpacity onPress={() => setShowDetail(true)} activeOpacity={0.8}>
        <View style={{ backgroundColor: '#FFF8E1', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#FFD54F', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="trophy" size={24} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '900', color: 'rgba(255,255,255,0.92)' }}>Challenge du mois</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)' }}>1er: {data.prizes?.['1']}EUR - 2e: {data.prizes?.['2']}EUR - 3e: {data.prizes?.['3']}EUR</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: posColor }}>{data.my_position}<Text style={{ fontSize: 11 }}>e</Text></Text>
            <Text style={{ fontSize: 9, color: 'rgba(255,255,255,0.50)' }}>position</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#FFB300" />
        </View>
      </TouchableOpacity>
      {data.prescriptions_to_next > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, marginTop: -8, paddingHorizontal: 4 }}>
          <Ionicons name="flame" size={14} color="#FF9800" />
          <Text style={{ fontSize: 12, color: '#E65100', fontWeight: '700' }}>Plus que {data.prescriptions_to_next} prescription{data.prescriptions_to_next > 1 ? 's' : ''} pour monter !</Text>
        </View>
      )}
      <Modal visible={showDetail} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: 'rgba(255,255,255,0.92)' }}>Challenge Prescripteurs</Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}><Ionicons name="close" size={24} color="#888" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ backgroundColor: '#FFF8E1', borderRadius: 16, padding: 16, marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#F57F17', textAlign: 'center', marginBottom: 12 }}>Recompenses du mois</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  {[{pos: '1er', prize: data.prizes?.['1'], color: '#FFD700', icon: 'trophy'}, {pos: '2e', prize: data.prizes?.['2'], color: '#C0C0C0', icon: 'medal'}, {pos: '3e', prize: data.prizes?.['3'], color: '#CD7F32', icon: 'ribbon'}].map(t => (
                    <View key={t.pos} style={{ alignItems: 'center' }}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.color, justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                        <Ionicons name={t.icon as any} size={22} color="#FFF" />
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: 'rgba(255,255,255,0.92)' }}>{t.prize}EUR</Text>
                      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)' }}>{t.pos}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={{ backgroundColor: posColor + '15', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: posColor }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.50)', textAlign: 'center', marginBottom: 4 }}>VOTRE POSITION</Text>
                <Text style={{ fontSize: 36, fontWeight: '900', color: posColor, textAlign: 'center' }}>{data.my_position}<Text style={{ fontSize: 16 }}>e</Text></Text>
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.92)', textAlign: 'center', fontWeight: '600' }}>{data.my_prescriptions} prescription{data.my_prescriptions !== 1 ? 's' : ''} ce mois</Text>
                {myPrize > 0 && <Text style={{ fontSize: 13, color: '#10B981', textAlign: 'center', fontWeight: '800', marginTop: 4 }}>Vous gagnez {myPrize}EUR !</Text>}
                {data.prescriptions_to_next > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
                    <Ionicons name="flame" size={16} color="#FF9800" />
                    <Text style={{ fontSize: 13, color: '#E65100', fontWeight: '700' }}>Plus que {data.prescriptions_to_next} pour monter !</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.92)', marginBottom: 10 }}>Classement anonyme</Text>
              {(data.ranking || []).map((r: any) => (
                <View key={r.position} style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }, r.is_me && { backgroundColor: '#FFF8E1', borderRadius: 10, paddingHorizontal: 8 }]}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: r.position === 1 ? '#FFD700' : r.position === 2 ? '#C0C0C0' : r.position === 3 ? '#CD7F32' : 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: r.position <= 3 ? '#FFF' : '#888' }}>{r.position}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: r.is_me ? '900' : '600', color: 'rgba(255,255,255,0.92)', flex: 1 }}>{r.is_me ? 'Vous' : `Prescripteur #${r.position}`}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: r.position <= 3 ? '#4CAF50' : '#888' }}>{r.prescriptions} presc.</Text>
                </View>
              ))}
              <View style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 14, padding: 14, marginTop: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: 'rgba(255,255,255,0.92)', marginBottom: 6 }}>Regles du programme</Text>
                <Text style={{ fontSize: 12, color: '#555', lineHeight: 18 }}>Les 3 meilleurs prescripteurs du mois recoivent une prime versee debut du mois suivant. Le classement est base sur le nombre de prescriptions validees. Seules les prescriptions du mois en cours comptent.</Text>
              </View>
              {data.history?.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.92)', marginBottom: 10 }}>Historique</Text>
                  {data.history.map((h: any, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
                      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)', width: 60 }}>{h.month}</Text>
                      <Ionicons name="trophy" size={14} color="#FFD700" />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.92)' }}>{h.winner_name || 'Prescripteur #1'}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
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
  const [showPrescModal, setShowPrescModal] = useState(false);
  const [selectedPresc, setSelectedPresc] = useState<any>(null);

  const fetchPrescriptions = useCallback(async () => {
    try { setPrescriptions(await apiFetch('/api/guardian/prescriptions', {}, token)); } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { if (user?.is_prescriber) fetchPrescriptions(); else setLoading(false); }, [fetchPrescriptions, user]);

  const activatePrescriber = async () => {
    if (!actCode.trim()) return Alert.alert('Erreur', 'Entrez un code prescripteur');
    setActivating(true);
    try {
      await apiFetch('/api/guardian/activate-prescriber', { method: 'POST', body: JSON.stringify({ code: actCode.trim().toUpperCase() }) }, token);
      Alert.alert('Active', 'Votre espace prescripteur est maintenant actif !');
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
      Alert.alert('Prescription creee');
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSubmitting(false); }
  };

  const validated = prescriptions.filter((p: any) => p.status === 'subscribed');
  const pending = prescriptions.filter((p: any) => p.status === 'pending');
  const [prescTab, setPrescTab] = useState<'pending'|'validated'>('pending');
  const displayedPresc = prescTab === 'pending' ? pending : validated;

  const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};

  return (
    <ScrollView style={d.sv} contentContainerStyle={[d.sc, { paddingBottom: 80 }]} showsVerticalScrollIndicator={false}>
      {!user?.is_prescriber ? (
        <View style={{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 28, alignItems: 'center', ...glass }}>
          <Ionicons name="medical-outline" size={40} color={Colors.primary} />
          <Text style={{ fontSize: 20, fontWeight: '800', color: 'rgba(255,255,255,0.92)', marginTop: 12 }}>Espace Prescripteur</Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', textAlign: 'center', lineHeight: 19, marginTop: 8, marginBottom: 20 }}>
            Activez votre espace prescripteur avec le code fourni par votre structure partenaire Chutex.
          </Text>
          <TextInput testID="prescriber-code-input" style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12, padding: 14, fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.92)', borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.08)', textAlign: 'center', letterSpacing: 3, marginBottom: 10 }}
            placeholder="CODE PRESCRIPTEUR" placeholderTextColor="#BBB" value={actCode} onChangeText={setActCode} autoCapitalize="characters" />
          <TouchableOpacity testID="activate-prescriber-btn" style={{ width: '100%', backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' }} onPress={activatePrescriber} disabled={activating}>
            {activating ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{ color: '#000', fontSize: 15, fontWeight: '700' }}>Activer mon espace</Text>}
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginVertical: 16 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' }} />
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)' }}>ou</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.08)' }} />
          </View>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => Linking.openURL('https://chutex-innovation.com')}>
            <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: '600' }}>Devenir prescripteur sur chutex-innovation.com</Text>
            <Ionicons name="open-outline" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Prescripteur card - clean, green */}
          <TouchableOpacity onPress={() => setShowPrescModal(true)} activeOpacity={0.7}>
            <View style={{ backgroundColor: 'rgba(76,175,80,0.06)', borderRadius: 20, padding: 20, marginBottom: 12, borderWidth: 1.5, borderColor: 'rgba(76,175,80,0.15)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(76,175,80,0.12)', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="medical" size={24} color="#4CAF50" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 17, fontWeight: '800', color: 'rgba(255,255,255,0.92)' }}>Prescripteur</Text>
                    <View style={{ backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: '#000' }}>Actif</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 12, color: '#555', marginTop: 3 }}>{user.prescriber_structure}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#4CAF50" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Rewards Card - golden */}
          <RewardsCard token={token} />
          <Modal visible={showPrescModal} transparent animationType="fade" onRequestClose={() => setShowPrescModal(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#2E7D32' }}>Espace Prescripteur</Text>
                  <TouchableOpacity onPress={() => setShowPrescModal(false)}><Ionicons name="close" size={24} color="#FFF" /></TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(76,175,80,0.12)', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="medical" size={24} color="#4CAF50" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: 'rgba(255,255,255,0.92)' }}>{user.name}</Text>
                      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)', marginTop: 2 }}>{user.prescriber_structure}</Text>
                    </View>
                  </View>
                  {[
                    { icon: 'business-outline', label: 'Structure', value: user.prescriber_structure || '-' },
                    { icon: 'key-outline', label: 'Code utilise', value: user.prescriber_code_used || '-' },
                    { icon: 'call-outline', label: 'Telephone', value: user.phone || '-' },
                    { icon: 'mail-outline', label: 'Email', value: user.email || '-' },
                  ].map(({ icon, label, value }) => value !== '-' ? (
                    <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
                      <Ionicons name={icon as any} size={16} color="#4CAF50" />
                      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)', width: 90 }}>{label}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.92)', flex: 1 }}>{value}</Text>
                    </View>
                  ) : null)}
                  <TouchableOpacity style={{ borderWidth: 1.5, borderColor: '#E53935', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24, flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                    onPress={() => { setShowPrescModal(false); confirmAction('Desactiver', 'Vous ne pourrez plus prescrire. Vos prescriptions existantes restent actives.', async () => {
                      try { await apiFetch('/api/auth/update-profile', { method: 'PUT', body: JSON.stringify({ is_prescriber: false }) }, token); await refreshUser(); } catch {}
                    }); }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#E53935' }}>Desactiver mon espace prescripteur</Text>
                    <Ionicons name="close-circle-outline" size={16} color="#E53935" />
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Tabs En cours / Validees */}
          <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 14, padding: 4, marginBottom: 0, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', ...glass }}>
            <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, prescTab === 'pending' && { backgroundColor: '#FF9800' }]} onPress={() => setPrescTab('pending')}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: prescTab === 'pending' ? '#FFF' : '#888' }}>En cours ({pending.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, prescTab === 'validated' && { backgroundColor: '#10B981' }]} onPress={() => setPrescTab('validated')}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: prescTab === 'validated' ? '#FFF' : '#888' }}>Validees ({validated.length})</Text>
            </TouchableOpacity>
          </View>

          {/* Commission total for current tab */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 4, marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)' }}>Total commissions {prescTab === 'pending' ? 'en attente' : 'validees'}</Text>
            <Text style={{ fontSize: 18, fontWeight: '900', color: prescTab === 'pending' ? '#FF9800' : '#4CAF50' }}>
              {displayedPresc.reduce((s: number, p: any) => s + (p.commission || 0), 0).toFixed(0)} EUR
            </Text>
          </View>

          {/* New prescription button */}
          <TouchableOpacity testID="new-prescription-btn" style={{ backgroundColor: '#000', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 16, flexDirection: 'row', justifyContent: 'center', gap: 8 }} onPress={() => setShowForm(true)}>
            <Text style={{ color: '#000', fontSize: 14, fontWeight: '700' }}>Nouvelle prescription</Text>
            <Ionicons name="add-circle-outline" size={18} color="#FFF" />
          </TouchableOpacity>

          {/* Prescription list filtered by tab - clickable with detail modal */}
          {loading ? <ActivityIndicator size="large" color={Colors.primary} /> : displayedPresc.length > 0 ? (
            displayedPresc.map((p: any) => (
              <TouchableOpacity key={p.id} testID={`prescription-${p.id}`} activeOpacity={0.7}
                onPress={() => setSelectedPresc(p)}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 16, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: p.status === 'subscribed' ? '#4CAF50' : '#FF9800', ...glass }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: p.status === 'subscribed' ? '#E8F5E9' : '#FFF3E0', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name={p.status === 'subscribed' ? 'checkmark-circle' : 'time'} size={18} color={p.status === 'subscribed' ? '#4CAF50' : '#FF9800'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.92)' }}>{p.beneficiary_name}</Text>
                      <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)' }}>{p.beneficiary_email}</Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: p.status === 'subscribed' ? '#4CAF50' : '#FF9800' }}>+{p.commission}EUR</Text>
                    <Ionicons name="chevron-forward" size={16} color="#888" />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.04)' }}>
                    <Ionicons name="pricetag-outline" size={14} color="#888" />
                    <Text style={{ fontSize: 12, color: '#555', flex: 1 }}>{p.subscription_type === 'standard' ? 'Standard' : 'Teleassistance'}</Text>
                    {p.beneficiary_phone && <><Ionicons name="call-outline" size={12} color="#888" /><Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)' }}>{p.beneficiary_phone}</Text></>}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 18, padding: 32, alignItems: 'center' }}>
              <Ionicons name={prescTab === 'pending' ? 'time-outline' : 'checkmark-circle-outline'} size={36} color="#CCC" />
              <Text style={{ fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.50)', marginTop: 10 }}>{prescTab === 'pending' ? 'Aucune prescription en cours' : 'Aucune prescription validee'}</Text>
            </View>
          )}

          <Modal visible={showForm} transparent animationType="slide">
            <View style={d.modalO}><View style={d.modalC}>
              <Text style={d.modalT}>Nouvelle Prescription</Text>
              <Text style={d.inputL}>Nom du beneficiaire</Text>
              <TextInput testID="presc-name-input" style={d.modalInp} placeholder="Nom complet" placeholderTextColor={Colors.textMuted}
                value={formData.name} onChangeText={(v) => setFormData({ ...formData, name: v })} />
              <Text style={d.inputL}>Email</Text>
              <TextInput testID="presc-email-input" style={d.modalInp} placeholder="email@exemple.com" placeholderTextColor={Colors.textMuted}
                value={formData.email} onChangeText={(v) => setFormData({ ...formData, email: v })} keyboardType="email-address" autoCapitalize="none" />
              <Text style={d.inputL}>Telephone</Text>
              <TextInput testID="presc-phone-input" style={d.modalInp} placeholder="06 12 34 56 78" placeholderTextColor={Colors.textMuted}
                value={formData.phone} onChangeText={(v) => setFormData({ ...formData, phone: v })} keyboardType="phone-pad" />
              <Text style={d.inputL}>Type d'abonnement</Text>
              <View style={d.typeSelector}>
                {[{id:'standard',l:'Standard (15EUR)'},{id:'teleassistance',l:'Teleassist. (25EUR)'}].map(t => (
                  <TouchableOpacity key={t.id} testID={`presc-type-${t.id}`} style={[d.typeBtn, formData.type === t.id && d.typeBtnA]} onPress={() => setFormData({ ...formData, type: t.id })}>
                    <Text style={[d.typeBtnT, formData.type === t.id && d.typeBtnTA]}>{t.l}</Text></TouchableOpacity>
                ))}
              </View>
              <View style={d.modalBtns}>
                <TouchableOpacity style={d.cancelBtn} onPress={() => setShowForm(false)}><Text style={d.cancelBtnT}>Annuler</Text></TouchableOpacity>
                <TouchableOpacity testID="presc-submit-btn" style={d.submitBtn} onPress={submitPrescription} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={d.submitBtnT}>Creer</Text>}</TouchableOpacity>
              </View>
            </View></View>
          </Modal>

          {/* Prescription Detail Modal - Premium Design */}
          <Modal visible={!!selectedPresc} transparent animationType="fade" onRequestClose={() => setSelectedPresc(null)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: '#000', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' }}>
                {selectedPresc && <>
                  {/* Header */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
                    <TouchableOpacity onPress={() => setSelectedPresc(null)} style={{ padding: 4, marginRight: 12 }}>
                      <Ionicons name="chevron-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={{ flex: 1, fontSize: 18, fontWeight: '900', color: 'rgba(255,255,255,0.92)' }}>Fiche Prescription</Text>
                    <TouchableOpacity onPress={() => setSelectedPresc(null)}><Ionicons name="close" size={22} color="#888" /></TouchableOpacity>
                  </View>

                  <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                    {/* Identity Card */}
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 24, marginBottom: 12, ...glass }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: selectedPresc.status === 'subscribed' ? '#4CAF50' : '#FF9800', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)' }}>
                          <Text style={{ fontSize: 24, fontWeight: '900', color: '#000' }}>{selectedPresc.beneficiary_name?.charAt(0)?.toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 20, fontWeight: '900', color: 'rgba(255,255,255,0.92)' }}>{selectedPresc.beneficiary_name}</Text>
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                            <View style={{ backgroundColor: selectedPresc.status === 'subscribed' ? '#E8F5E9' : '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                              <Text style={{ fontSize: 10, fontWeight: '800', color: selectedPresc.status === 'subscribed' ? '#2E7D32' : '#E65100', textTransform: 'uppercase', letterSpacing: 0.5 }}>{selectedPresc.status === 'subscribed' ? 'Souscrit' : 'En attente'}</Text>
                            </View>
                            <View style={{ backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                              <Text style={{ fontSize: 10, fontWeight: '800', color: '#1565C0', textTransform: 'uppercase', letterSpacing: 0.5 }}>{selectedPresc.subscription_type === 'standard' ? 'Standard' : 'Teleassistance'}</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                      {[
                        { icon: 'mail-outline', label: 'Email', value: selectedPresc.beneficiary_email },
                        { icon: 'call-outline', label: 'Telephone', value: selectedPresc.beneficiary_phone },
                        { icon: 'calendar-outline', label: 'Date', value: selectedPresc.created_at ? new Date(selectedPresc.created_at).toLocaleDateString('fr-FR') : '' },
                      ].map(({ icon, label, value }) => value ? (
                        <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
                          <Ionicons name={icon as any} size={16} color="#888" />
                          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)', width: 100 }}>{label}</Text>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.92)', flex: 1 }}>{value}</Text>
                        </View>
                      ) : null)}
                    </View>

                    {/* Commission Card */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                      <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 16, alignItems: 'center', borderLeftWidth: 4, borderLeftColor: selectedPresc.status === 'subscribed' ? '#4CAF50' : '#FF9800', ...glass }}>
                        <Text style={{ fontSize: 28, fontWeight: '900', color: selectedPresc.status === 'subscribed' ? '#4CAF50' : '#FF9800' }}>+{selectedPresc.commission}</Text>
                        <Text style={{ fontSize: 10, color: selectedPresc.status === 'subscribed' ? '#4CAF50' : '#FF9800', fontWeight: '700', letterSpacing: 0.5, marginTop: 2 }}>EUR COMMISSION</Text>
                      </View>
                      <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 16, alignItems: 'center', ...glass }}>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: 'rgba(255,255,255,0.92)' }}>{selectedPresc.subscription_type === 'standard' ? '15' : '25'}</Text>
                        <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.50)', fontWeight: '700', letterSpacing: 0.5, marginTop: 2 }}>EUR/MOIS</Text>
                      </View>
                    </View>

                    {/* Prescriber Info */}
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 18, marginBottom: 12, ...glass }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3E5F5', justifyContent: 'center', alignItems: 'center' }}>
                          <Ionicons name="medical" size={18} color="#7B1FA2" />
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: 'rgba(255,255,255,0.92)' }}>Prescripteur</Text>
                      </View>
                      {[
                        { icon: 'person-outline', label: 'Nom', value: user.name, color: '#7B1FA2' },
                        { icon: 'business-outline', label: 'Structure', value: selectedPresc.prescriber_structure || user.prescriber_structure, color: '#7B1FA2' },
                      ].map(({ icon, label, value, color }) => value ? (
                        <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
                          <Ionicons name={icon as any} size={16} color={color || '#888'} />
                          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)', width: 100 }}>{label}</Text>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.92)', flex: 1 }}>{value}</Text>
                        </View>
                      ) : null)}
                    </View>
                  </ScrollView>
                </>}
              </View>
            </View>
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

/* ===== ADMIN: PRESCRIPTEURS MANAGEMENT ===== */
function AdminPrescripteurs({ token }: { token: string }) {
  const router = useRouter();
  const [codes, setCodes] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [prescribers, setPrescribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCode, setEditCode] = useState<any>(null);
  const [form, setForm] = useState({ structure_name: '', raison_sociale: '', siret: '', tva: '', adresse: '', telephone: '', email_contact: '', max_uses: '50' });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'codes'|'prescribers'|'prescriptions'>('codes');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [c, p, u] = await Promise.all([
        apiFetch('/api/admin/activation-codes', {}, token).catch(() => []),
        apiFetch('/api/backoffice/prescriptions', {}, token).catch(() => []),
        apiFetch('/api/backoffice/users', {}, token).catch(() => []),
      ]);
      setCodes(c); setPrescriptions(p);
      setPrescribers((u || []).filter((usr: any) => usr.is_prescriber));
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveCode = async () => {
    if (!form.structure_name) return Alert.alert('Erreur', 'Nom de structure requis');
    setSaving(true);
    try {
      if (editCode) {
        await apiFetch(`/api/admin/activation-codes/${editCode.id}`, { method: 'PUT', body: JSON.stringify(form) }, token);
        setCodes(codes.map(c => c.id === editCode.id ? { ...c, ...form } : c));
      } else {
        const r = await apiFetch('/api/admin/activation-codes', { method: 'POST', body: JSON.stringify({ ...form, max_uses: parseInt(form.max_uses) || 50 }) }, token);
        setCodes([r, ...codes]);
      }
      setShowModal(false); setEditCode(null);
      setForm({ structure_name: '', raison_sociale: '', siret: '', tva: '', adresse: '', telephone: '', email_contact: '', max_uses: '50' });
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSaving(false); }
  };

  const toggleCode = async (id: string) => {
    try {
      const r = await apiFetch(`/api/admin/activation-codes/${id}/toggle`, { method: 'PUT' }, token);
      setCodes(codes.map(c => c.id === id ? { ...c, active: r.active } : c));
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  const deleteCode = (id: string) => {
    confirmAction('Supprimer', 'Supprimer définitivement ce code prescripteur ?', async () => {
      await apiFetch(`/api/admin/activation-codes/${id}`, { method: 'DELETE' }, token);
      setCodes(codes.filter(c => c.id !== id));
    });
  };

  const openEdit = (c: any) => {
    setEditCode(c);
    setForm({ structure_name: c.structure_name || '', raison_sociale: c.raison_sociale || '', siret: c.siret || '', tva: c.tva || '', adresse: c.adresse || '', telephone: c.telephone || '', email_contact: c.email_contact || '', max_uses: String(c.max_uses || 50) });
    setShowModal(true);
  };

  if (loading) return <View style={d.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={d.sv} contentContainerStyle={[d.sc, { paddingBottom: 80 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} />}>
      {/* Tabs */}
      <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 12, padding: 3, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' }}>
        {([['codes', `Codes (${codes.length})`], ['prescribers', `Prescripteurs (${prescribers.length})`], ['prescriptions', `Souscriptions (${prescriptions.length})`]] as const).map(([k, l]) => (
          <TouchableOpacity key={k} style={[{ flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 }, tab === k && { backgroundColor: '#000' }]}
            onPress={() => setTab(k)}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: tab === k ? '#FFF' : '#888' }}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CODES TAB */}
      {tab === 'codes' && <>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>{codes.length} structure(s) prescriptrice(s)</Text>
          <TouchableOpacity testID="add-prescripteur-btn" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
            onPress={() => { setEditCode(null); setForm({ structure_name: '', raison_sociale: '', siret: '', tva: '', adresse: '', telephone: '', email_contact: '', max_uses: '50' }); setShowModal(true); }}>
            <Ionicons name="add" size={16} color="#FFF" /><Text style={{ color: '#000', fontSize: 12, fontWeight: '700' }}>Nouveau code</Text>
          </TouchableOpacity>
        </View>

      {codes.map(c => (
        <View key={c.id} style={[d.deviceCard, !c.active && { opacity: 0.5 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>{c.structure_name}</Text>
              {c.raison_sociale ? <Text style={{ fontSize: 11, color: Colors.textMuted }}>{c.raison_sociale}</Text> : null}
            </View>
            <View style={{ backgroundColor: Colors.subtle, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', letterSpacing: 1, color: Colors.primary }}>{c.code}</Text>
            </View>
          </View>
          {(c.siret || c.tva || c.adresse) && (
            <View style={{ marginTop: 8, gap: 2 }}>
              {c.siret ? <Text style={{ fontSize: 11, color: Colors.textMuted }}>SIRET: {c.siret}</Text> : null}
              {c.tva ? <Text style={{ fontSize: 11, color: Colors.textMuted }}>TVA: {c.tva}</Text> : null}
              {c.adresse ? <Text style={{ fontSize: 11, color: Colors.textMuted }}>{c.adresse}</Text> : null}
              {c.telephone ? <Text style={{ fontSize: 11, color: Colors.textMuted }}>Tél: {c.telephone}</Text> : null}
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 }}>
            <Text style={{ fontSize: 11, color: Colors.textMuted, flex: 1 }}>Utilisations: {c.uses_count}/{c.max_uses} · {c.active ? 'Actif' : 'Désactivé'}</Text>
            <TouchableOpacity onPress={() => openEdit(c)} style={{ padding: 6 }}><Ionicons name="create-outline" size={16} color={Colors.primary} /></TouchableOpacity>
            <TouchableOpacity onPress={() => toggleCode(c.id)} style={{ padding: 6 }}><Ionicons name={c.active ? 'pause-circle-outline' : 'play-circle-outline'} size={16} color={c.active ? Colors.textMuted : Colors.success} /></TouchableOpacity>
            <TouchableOpacity onPress={() => deleteCode(c.id)} style={{ padding: 6 }}><Ionicons name="trash-outline" size={16} color={Colors.destructive} /></TouchableOpacity>
          </View>
        </View>
      ))}
      </>}

      {/* PRESCRIBERS TAB */}
      {tab === 'prescribers' && <>
        {prescribers.map((p: any) => (
          <TouchableOpacity key={p.id} onPress={() => router.push({ pathname: '/admin-client-detail', params: { clientId: p.id } })} activeOpacity={0.7}>
            <View style={d.deviceCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#CE93D8', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#000' }}>{p.name?.charAt(0)?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>{p.name}</Text>
                  <Text style={{ fontSize: 12, color: Colors.textMuted }}>{p.email}</Text>
                  <Text style={{ fontSize: 11, color: '#9C27B0', fontWeight: '600', marginTop: 2 }}>{p.prescriber_structure}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#888" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {prescribers.length === 0 && <View style={d.emptyC}><Ionicons name="medical-outline" size={28} color={Colors.textMuted} /><Text style={d.emptyT}>Aucun prescripteur</Text></View>}
      </>}

      {/* PRESCRIPTIONS TAB */}
      {tab === 'prescriptions' && <>
        {prescriptions.map((p: any) => (
          <TouchableOpacity key={p.id} onPress={() => router.push({ pathname: '/admin-prescription-detail', params: { prescriptionId: p.id } })} activeOpacity={0.7}>
            <View style={d.deviceCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>{p.beneficiary_name}</Text>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: p.status === 'subscribed' ? '#4CAF5015' : '#FF980015' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: p.status === 'subscribed' ? '#4CAF50' : '#FF9800' }}>{p.status === 'subscribed' ? 'ACTIF' : 'EN ATTENTE'}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: Colors.textMuted }}>{p.beneficiary_email} · {p.beneficiary_phone}</Text>
              <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>Par: {p.guardian_name} ({p.prescriber_structure})</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: Colors.textSecondary }}>{p.subscription_type}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.success }}>+{p.commission}EUR</Text>
                  <Ionicons name="chevron-forward" size={14} color="#888" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {prescriptions.length === 0 && <View style={d.emptyC}><Ionicons name="document-text-outline" size={28} color={Colors.textMuted} /><Text style={d.emptyT}>Aucune souscription</Text></View>}
      </>}

      <Modal visible={showModal} transparent animationType="slide">
        <View style={d.modalO}><View style={d.modalC}>
          <Text style={d.modalT}>{editCode ? 'Modifier la structure' : 'Nouvelle structure prescriptrice'}</Text>
          {[
            { k: 'structure_name', l: 'Nom commercial', p: 'Ex: Résidence Les Oliviers' },
            { k: 'raison_sociale', l: 'Raison sociale', p: 'Ex: SAS Les Oliviers' },
            { k: 'siret', l: 'SIRET', p: '12345678900000' },
            { k: 'tva', l: 'N° TVA', p: 'FR12345678900' },
            { k: 'adresse', l: 'Adresse', p: '12 rue des Chênes, 75001 Paris' },
            { k: 'telephone', l: 'Téléphone', p: '+33 1 23 45 67 89' },
            { k: 'email_contact', l: 'Email contact', p: 'contact@structure.fr' },
          ].map(f => (
            <View key={f.k}>
              <Text style={d.inputL}>{f.l}</Text>
              <TextInput style={d.modalInp} placeholder={f.p} placeholderTextColor={Colors.textMuted}
                value={(form as any)[f.k]} onChangeText={(v) => setForm({ ...form, [f.k]: v })} />
            </View>
          ))}
          <View style={d.modalBtns}>
            <TouchableOpacity style={d.cancelBtn} onPress={() => setShowModal(false)}><Text style={d.cancelBtnT}>Annuler</Text></TouchableOpacity>
            <TouchableOpacity style={d.submitBtn} onPress={saveCode} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={d.submitBtnT}>{editCode ? 'Modifier' : 'Créer'}</Text>}
            </TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </ScrollView>
  );
}

/* ===== COMPANY: PRESCRIPTIONS TAB ===== */
function CompanyPrescriptionsTab({ token }: { token: string }) {
  const [dashData, setDashData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPresc, setSelectedPresc] = useState<any>(null);
  const [prescTab, setPrescTab] = useState<'pending' | 'subscribed'>('pending');

  const fetchData = useCallback(async () => {
    try { setDashData(await apiFetch('/api/company/dashboard', {}, token)); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);
  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <View style={d.center}><ActivityIndicator size="large" color="#FFF" /></View>;

  const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};

  const allPrescs = dashData?.prescriptions || [];
  const pendingPrescs = allPrescs.filter((p: any) => p.status === 'pending');
  const subscribedPrescs = allPrescs.filter((p: any) => p.status === 'subscribed');
  const displayedPrescs = prescTab === 'pending' ? pendingPrescs : subscribedPrescs;
  const prescTotal = displayedPrescs.reduce((s: number, p: any) => s + (p.commission || 0), 0);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: 'rgba(255,255,255,0.92)', letterSpacing: -0.5 }}>Prescriptions</Text>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)' }}>{allPrescs.length} prescriptions au total</Text>
      </View>

      <View style={{ flexDirection: 'row', marginHorizontal: 16, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 14, padding: 4, marginBottom: 0, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', ...glass }}>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, prescTab === 'pending' && { backgroundColor: '#FF9800' }]} onPress={() => setPrescTab('pending')}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: prescTab === 'pending' ? '#FFF' : '#888' }}>En cours ({pendingPrescs.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, prescTab === 'subscribed' && { backgroundColor: '#10B981' }]} onPress={() => setPrescTab('subscribed')}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: prescTab === 'subscribed' ? '#FFF' : '#888' }}>Validees ({subscribedPrescs.length})</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 }}>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)' }}>Total commissions</Text>
        <Text style={{ fontSize: 16, fontWeight: '900', color: prescTab === 'pending' ? '#FF9800' : '#4CAF50' }}>{prescTotal} EUR</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#FFF" />}>
        {displayedPrescs.map((p: any) => (
          <TouchableOpacity key={p.id} activeOpacity={0.7} onPress={() => setSelectedPresc(p)}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 14, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: p.status === 'subscribed' ? '#4CAF50' : '#FF9800', ...glass }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: p.status === 'subscribed' ? '#E8F5E9' : '#FFF3E0', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name={p.status === 'subscribed' ? 'checkmark-circle' : 'time'} size={16} color={p.status === 'subscribed' ? '#4CAF50' : '#FF9800'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.92)' }}>{p.beneficiary_name}</Text>
                  <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.50)' }}>Par: {p.guardian_name}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '800', color: p.status === 'subscribed' ? '#4CAF50' : '#FF9800' }}>+{p.commission}EUR</Text>
                <Ionicons name="chevron-forward" size={14} color="#888" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {displayedPrescs.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name={prescTab === 'pending' ? 'time-outline' : 'checkmark-circle-outline'} size={36} color="#CCC" />
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.50)', marginTop: 8 }}>Aucune prescription {prescTab === 'pending' ? 'en cours' : 'validee'}</Text>
          </View>
        )}
      </ScrollView>

      {/* Prescription Detail Modal */}
      <Modal visible={!!selectedPresc} transparent animationType="fade" onRequestClose={() => setSelectedPresc(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#000', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' }}>
            {selectedPresc && <>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
                <TouchableOpacity onPress={() => setSelectedPresc(null)} style={{ padding: 4, marginRight: 12 }}>
                  <Ionicons name="chevron-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={{ flex: 1, fontSize: 18, fontWeight: '900', color: 'rgba(255,255,255,0.92)' }}>Fiche Prescription</Text>
                <TouchableOpacity onPress={() => setSelectedPresc(null)}><Ionicons name="close" size={22} color="#888" /></TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 24, marginBottom: 12, ...glass }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: selectedPresc.status === 'subscribed' ? '#4CAF50' : '#FF9800', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)' }}>
                      <Text style={{ fontSize: 24, fontWeight: '900', color: '#000' }}>{selectedPresc.beneficiary_name?.charAt(0)?.toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 20, fontWeight: '900', color: 'rgba(255,255,255,0.92)' }}>{selectedPresc.beneficiary_name}</Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                        <View style={{ backgroundColor: selectedPresc.status === 'subscribed' ? '#E8F5E9' : '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: selectedPresc.status === 'subscribed' ? '#2E7D32' : '#E65100' }}>{selectedPresc.status === 'subscribed' ? 'SOUSCRIT' : 'EN ATTENTE'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  {[
                    { icon: 'mail-outline', label: 'Email', value: selectedPresc.beneficiary_email },
                    { icon: 'call-outline', label: 'Telephone', value: selectedPresc.beneficiary_phone },
                    { icon: 'person-circle-outline', label: 'Prescripteur', value: selectedPresc.guardian_name },
                    { icon: 'cash-outline', label: 'Commission', value: `${selectedPresc.commission} EUR` },
                    { icon: 'calendar-outline', label: 'Date', value: selectedPresc.created_at ? new Date(selectedPresc.created_at).toLocaleDateString('fr-FR') : '' },
                  ].map(({ icon, label, value }) => value ? (
                    <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
                      <Ionicons name={icon as any} size={16} color="#888" />
                      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)', width: 100 }}>{label}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.92)', flex: 1 }}>{value}</Text>
                    </View>
                  ) : null)}
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, padding: 18, borderLeftWidth: 4, borderLeftColor: selectedPresc.status === 'subscribed' ? '#4CAF50' : '#FF9800', alignItems: 'center', ...glass }}>
                  <Text style={{ fontSize: 32, fontWeight: '900', color: selectedPresc.status === 'subscribed' ? '#4CAF50' : '#FF9800' }}>+{selectedPresc.commission} EUR</Text>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)', fontWeight: '600', marginTop: 4 }}>Commission {selectedPresc.status === 'subscribed' ? 'validee' : 'en attente'}</Text>
                </View>
              </ScrollView>
            </>}
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ===== MAIN ===== */
export default function DevicesScreen() {
  const { user, token } = useAuth();
  const { colors } = useTheme();
  if (!user || !token) return null;
  const r = user.active_role || user.role;
  return (
    <View key={r} style={[d.safeArea, { backgroundColor: '#000' }]} testID="devices-screen">
      <View style={d.header}>
        <Text style={[d.title, { color: colors.textPrimary }]}>{r === 'admin' ? 'Prescripteurs' : r === 'prescriber_company' ? 'Prescriptions' : r === 'guardian' ? 'Prescriptions' : r === 'teleassistance' ? 'Abonnes' : 'Mes Appareils'}</Text>
      </View>
      {r === 'admin' ? <AdminPrescripteurs token={token} />
        : r === 'prescriber_company' ? <CompanyPrescriptionsTab token={token} />
        : r === 'guardian' ? <PrescriptionManagement token={token} user={user} />
        : r === 'teleassistance' ? <SubscribersList token={token} />
        : <DeviceManagement token={token} />}
    </View>
  );
}

const d = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
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
  newPrescBtnText: { color: '#000', fontSize: 14, fontWeight: '600' },
  prescCard: { backgroundColor: Colors.subtle, borderRadius: 12, padding: 14, marginBottom: 6 },
  prescHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  prescName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  prescStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: Colors.subtle, borderWidth: 1, borderColor: Colors.border },
  prescStatusText: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  prescEmail: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  prescFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prescType: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  prescComm: { fontSize: 14, fontWeight: '700', color: Colors.success },
  // Prescriber activation
  activateCard: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 24, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  activateTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginTop: 12 },
  activateDesc: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19, marginTop: 8, marginBottom: 16 },
  activateRow: { flexDirection: 'row', gap: 8, width: '100%' },
  activateInput: { flex: 1, backgroundColor: Colors.paper, borderRadius: 10, padding: 14, fontSize: 15, fontWeight: '600', color: Colors.text, borderWidth: 1, borderColor: Colors.border, textAlign: 'center', letterSpacing: 2 },
  activateBtn: { paddingHorizontal: 20, borderRadius: 10, backgroundColor: Colors.primary, justifyContent: 'center' },
  activateBtnT: { fontSize: 14, fontWeight: '700', color: '#000' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginVertical: 14 },
  divLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  divText: { fontSize: 12, color: Colors.textMuted },
  chutexLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chutexLinkT: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  // Subscribers
  subCount: { fontSize: 12, color: Colors.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  subCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.subtle, borderRadius: 10, padding: 12, marginBottom: 6, gap: 10 },
  subAv: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  subAvT: { fontSize: 14, fontWeight: '700', color: '#000' },
  subInfo: { flex: 1 },
  subName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  subEmail: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  alertBdg: { backgroundColor: Colors.destructive, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  alertBdgT: { color: '#000', fontSize: 10, fontWeight: '700' },
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
  submitBtnT: { fontSize: 15, fontWeight: '600', color: '#000' },
});
