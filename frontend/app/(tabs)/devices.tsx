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
    <ScrollView style={d.sv} contentContainerStyle={[d.sc, { paddingBottom: 80 }]} showsVerticalScrollIndicator={false}>
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

/* ===== ADMIN: PRESCRIPTEURS MANAGEMENT ===== */
function AdminPrescripteurs({ token }: { token: string }) {
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
    <ScrollView style={d.sv} contentContainerStyle={d.sc}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>{codes.length} structure(s) prescriptrice(s)</Text>
        <TouchableOpacity testID="add-prescripteur-btn" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
          onPress={() => { setEditCode(null); setForm({ structure_name: '', raison_sociale: '', siret: '', tva: '', adresse: '', telephone: '', email_contact: '', max_uses: '50' }); setShowModal(true); }}>
          <Ionicons name="add" size={16} color="#FFF" /><Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Nouveau code</Text>
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

      {prescriptions.length > 0 && (
        <>
          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 20, marginBottom: 8 }}>Prescriptions ({prescriptions.length})</Text>
          {prescriptions.map((p: any) => (
            <View key={p.id} style={d.deviceCard}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.textPrimary }}>{p.beneficiary_name}</Text>
              <Text style={{ fontSize: 12, color: Colors.textMuted }}>{p.beneficiary_email} · {p.subscription_type} · {p.status}</Text>
              <Text style={{ fontSize: 11, color: Colors.success, marginTop: 4 }}>Commission: {p.commission}€ · Structure: {p.prescriber_structure}</Text>
            </View>
          ))}
        </>
      )}

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

/* ===== MAIN ===== */
export default function DevicesScreen() {
  const { user, token } = useAuth();
  const { colors } = useTheme();
  if (!user || !token) return null;
  const r = user.active_role || user.role;
  // key={r} forces complete remount when role changes (Expo Router tab caching fix)
  return (
    <View key={r} style={[d.safeArea, { backgroundColor: colors.background }]} testID="devices-screen">
      <View style={d.header}>
        <Text style={[d.title, { color: colors.textPrimary }]}>{r === 'admin' ? 'Prescripteurs' : r === 'guardian' ? 'Prescriptions' : r === 'teleassistance' ? 'Abonnes' : 'Mes Appareils'}</Text>
      </View>
      {r === 'admin' ? <AdminPrescripteurs token={token} />
        : r === 'guardian' ? <PrescriptionManagement token={token} user={user} />
        : r === 'teleassistance' ? <SubscribersList token={token} />
        : <DeviceManagement token={token} />}
    </View>
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
  // Prescriber activation
  activateCard: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 24, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  activateTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginTop: 12 },
  activateDesc: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19, marginTop: 8, marginBottom: 16 },
  activateRow: { flexDirection: 'row', gap: 8, width: '100%' },
  activateInput: { flex: 1, backgroundColor: Colors.paper, borderRadius: 10, padding: 14, fontSize: 15, fontWeight: '600', color: Colors.text, borderWidth: 1, borderColor: Colors.border, textAlign: 'center', letterSpacing: 2 },
  activateBtn: { paddingHorizontal: 20, borderRadius: 10, backgroundColor: Colors.primary, justifyContent: 'center' },
  activateBtnT: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginVertical: 14 },
  divLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  divText: { fontSize: 12, color: Colors.textMuted },
  chutexLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chutexLinkT: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
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
