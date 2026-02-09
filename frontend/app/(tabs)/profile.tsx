import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { apiFetch } from '../../src/services/api';
import { Colors } from '../../src/constants/colors';

export default function ProfileScreen() {
  const { user, token, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [linkEmail, setLinkEmail] = useState('');
  const [linking, setLinking] = useState(false);
  const [locMode, setLocMode] = useState(user?.location_sharing || 'alert_only');
  const [savingLoc, setSavingLoc] = useState(false);
  const [actCode, setActCode] = useState('');
  const [activating, setActivating] = useState(false);
  const [ivCode, setIvCode] = useState('');
  const [ivActivating, setIvActivating] = useState(false);

  if (!user || !token) return null;

  const handleLogout = async () => { await logout(); };

  const handleLink = async () => {
    if (!linkEmail.trim()) return Alert.alert('Erreur', 'Entrez un email');
    setLinking(true);
    try {
      const r = await apiFetch('/api/guardian/link', { method: 'POST', body: JSON.stringify({ beneficiary_email: linkEmail.trim().toLowerCase() }) }, token);
      Alert.alert('Succès', `${r.beneficiary.name} lié`); setLinkEmail(''); await refreshUser();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setLinking(false); }
  };

  const updateLocSharing = async (mode: string) => {
    setSavingLoc(true);
    try {
      await apiFetch('/api/location/sharing', { method: 'PUT', body: JSON.stringify({ mode }) }, token);
      setLocMode(mode);
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSavingLoc(false); }
  };

  const activatePrescriber = async () => {
    if (!actCode.trim()) return Alert.alert('Erreur', 'Entrez un code');
    setActivating(true);
    try {
      const r = await apiFetch('/api/guardian/activate-prescriber', { method: 'POST', body: JSON.stringify({ code: actCode.trim().toUpperCase() }) }, token);
      Alert.alert('Activé', `Mode prescripteur activé pour ${r.structure}`);
      setActCode(''); await refreshUser();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setActivating(false); }
  };

  const activateIntervention = async () => {
    if (!ivCode.trim()) return Alert.alert('Erreur', 'Entrez un code');
    setIvActivating(true);
    try {
      const r = await apiFetch('/api/guardian/activate-intervention-provider', { method: 'POST', body: JSON.stringify({ code: ivCode.trim().toUpperCase() }) }, token);
      Alert.alert('Activé', `Rôle intervenant activé. Rayon: ${r.radius_km || 30}km`);
      setIvCode(''); await refreshUser();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setIvActivating(false); }
  };

  const roleName = user.role === 'beneficiary' ? 'Bénéficiaire' : user.role === 'guardian' ? (user.is_prescriber ? 'Prescripteur' : 'Gardien') : user.role === 'teleassistance' ? 'Téléassistance' : 'Administrateur';

  return (
    <SafeAreaView style={st.safe} testID="profile-screen">
      <ScrollView contentContainerStyle={st.sc} showsVerticalScrollIndicator={false}>
        <Text style={st.pageTitle}>Profil</Text>

        <View style={st.userCard}>
          <View style={st.avatar}><Text style={st.avatarT}>{user.name?.charAt(0)?.toUpperCase()}</Text></View>
          <Text style={st.userName}>{user.name}</Text>
          <View style={st.roleBadge}><Text style={st.roleT}>{roleName}</Text></View>
          {user.is_prescriber && user.prescriber_structure ? <Text style={st.structureT}>{user.prescriber_structure}</Text> : null}
        </View>

        <View style={st.section}>
          <Text style={st.secTitle}>Informations</Text>
          {[
            { icon: 'mail-outline', label: 'Email', val: user.email },
            { icon: 'call-outline', label: 'Téléphone', val: user.phone || '—' },
            { icon: 'calendar-outline', label: 'Inscrit le', val: new Date(user.created_at).toLocaleDateString('fr-FR') },
          ].map((r, i) => (
            <View key={i} style={st.infoRow}>
              <Ionicons name={r.icon as any} size={16} color={Colors.textMuted} />
              <View style={st.infoC}><Text style={st.infoL}>{r.label}</Text><Text style={st.infoV}>{r.val}</Text></View>
            </View>
          ))}
        </View>

        {/* Beneficiary: Location Sharing */}
        {user.role === 'beneficiary' && (
          <View style={st.section}>
            <Text style={st.secTitle}>Partage de localisation</Text>
            {[
              { mode: 'always', label: 'Toujours', icon: 'location-outline' },
              { mode: 'alert_only', label: 'En cas d\'alerte', icon: 'alert-circle-outline' },
              { mode: 'never', label: 'Jamais', icon: 'lock-closed-outline' },
            ].map(opt => (
              <TouchableOpacity key={opt.mode} testID={`loc-${opt.mode}`}
                style={[st.locOpt, locMode === opt.mode && st.locOptA]}
                onPress={() => updateLocSharing(opt.mode)} disabled={savingLoc}>
                <Ionicons name={opt.icon as any} size={18} color={locMode === opt.mode ? Colors.primary : Colors.textMuted} />
                <Text style={[st.locLabel, locMode === opt.mode && st.locLabelA]}>{opt.label}</Text>
                <View style={[st.radio, locMode === opt.mode && st.radioA]}>
                  {locMode === opt.mode && <View style={st.radioInner} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Guardian: Link Beneficiary */}
        {user.role === 'guardian' && (
          <View style={st.section}>
            <Text style={st.secTitle}>Lier un bénéficiaire</Text>
            <View style={st.linkRow}>
              <TextInput testID="link-email-input" style={st.linkInput} placeholder="email@beneficiaire.com" placeholderTextColor={Colors.textMuted}
                value={linkEmail} onChangeText={setLinkEmail} keyboardType="email-address" autoCapitalize="none" blurOnSubmit={false} />
              <TouchableOpacity testID="link-btn" style={st.linkBtn} onPress={handleLink} disabled={linking}>
                {linking ? <ActivityIndicator color="#FFF" size="small" /> : <Ionicons name="link" size={18} color="#FFF" />}
              </TouchableOpacity>
            </View>
            {user.beneficiaries?.length > 0 && <Text style={st.linkedC}>{user.beneficiaries.length} bénéficiaire(s) lié(s)</Text>}
          </View>
        )}

        {/* Guardian: Activate Prescriber Mode */}
        {user.role === 'guardian' && !user.is_prescriber && (
          <View style={st.section}>
            <Text style={st.secTitle}>Mode prescripteur</Text>
            <Text style={st.secDesc}>Entrez votre code d'activation de structure pour activer le mode prescripteur et envoyer des prescriptions.</Text>
            <View style={st.linkRow}>
              <TextInput testID="act-code-input" style={st.linkInput} placeholder="Code (ex: SAAD1234)" placeholderTextColor={Colors.textMuted}
                value={actCode} onChangeText={setActCode} autoCapitalize="characters" blurOnSubmit={false} />
              <TouchableOpacity testID="activate-btn" style={st.linkBtn} onPress={activatePrescriber} disabled={activating}>
                {activating ? <ActivityIndicator color="#FFF" size="small" /> : <Ionicons name="key" size={18} color="#FFF" />}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Guardian: Prescriber active badge */}
        {user.role === 'guardian' && user.is_prescriber && (
          <View style={[st.section, { backgroundColor: Colors.subtle }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={st.secTitle}>Mode prescripteur actif</Text>
                <Text style={st.secDesc}>Structure : {user.prescriber_structure}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Activate Intervention Provider - Only for guardians */}
        {user.role === 'guardian' && !user.is_intervention_provider && (
          <View style={st.section}>
            <Text style={st.secTitle}>Devenir intervenant</Text>
            <Text style={st.secDesc}>Entrez votre code d'activation pour devenir prestataire d'intervention sur site.</Text>
            <View style={st.linkRow}>
              <TextInput testID="iv-code-input" style={st.linkInput} placeholder="Code intervenant" placeholderTextColor={Colors.textMuted}
                value={ivCode} onChangeText={setIvCode} autoCapitalize="characters" blurOnSubmit={false} />
              <TouchableOpacity testID="iv-activate-btn" style={st.linkBtn} onPress={activateIntervention} disabled={ivActivating}>
                {ivActivating ? <ActivityIndicator color="#FFF" size="small" /> : <Ionicons name="shield-checkmark" size={18} color="#FFF" />}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {user.role === 'guardian' && user.is_intervention_provider && (
          <View style={[st.section, { backgroundColor: Colors.subtle }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={st.secTitle}>Intervenant actif</Text>
                <Text style={st.secDesc}>Rayon: {user.intervention_radius_km || 30}km</Text>
              </View>
            </View>
          </View>
        )}

        {/* Back Office link */}
        {(user.role === 'admin') && (
          <TouchableOpacity testID="backoffice-btn" style={st.shortcutBtn} onPress={() => router.push('/backoffice')}>
            <Ionicons name="settings-outline" size={18} color={Colors.primary} />
            <Text style={st.shortcutT}>Back Office</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}

        {user.role === 'beneficiary' && (
          <TouchableOpacity testID="share-link" style={st.shortcutBtn} onPress={() => router.push('/link-code')}>
            <Ionicons name="qr-code-outline" size={18} color={Colors.primary} />
            <Text style={st.shortcutT}>Partager mon profil (Code / QR)</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}

        {user.role === 'beneficiary' && (
          <TouchableOpacity testID="devices-shortcut" style={st.shortcutBtn} onPress={() => router.push('/(tabs)/devices')}>
            <Ionicons name="bluetooth-outline" size={18} color={Colors.primary} />
            <Text style={st.shortcutT}>Gérer mes appareils</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}

        {user.role === 'beneficiary' && (
          <TouchableOpacity testID="data-sharing-link" style={st.shortcutBtn} onPress={() => router.push('/data-sharing')}>
            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary} />
            <Text style={st.shortcutT}>Gérer le partage de données</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}

        {user.role === 'beneficiary' && (
          <TouchableOpacity testID="reminders-link" style={st.shortcutBtn} onPress={() => router.push('/reminders')}>
            <Ionicons name="alarm-outline" size={18} color={Colors.primary} />
            <Text style={st.shortcutT}>Mes rappels quotidiens</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}

        <TouchableOpacity testID="logout-btn" style={st.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={16} color={Colors.destructive} />
          <Text style={st.logoutT}>Se déconnecter</Text>
        </TouchableOpacity>
        <Text style={st.ver}>Chutex AI v3.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  sc: { paddingHorizontal: 20, paddingBottom: 40 },
  pageTitle: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginTop: 16, marginBottom: 20, letterSpacing: -0.5 },
  userCard: { backgroundColor: Colors.subtle, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarT: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  userName: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  roleBadge: { marginTop: 6, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  roleT: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  structureT: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  section: { backgroundColor: Colors.paper, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  secTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  secDesc: { fontSize: 12, color: Colors.textMuted, marginBottom: 10, lineHeight: 17 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  infoC: { flex: 1 },
  infoL: { fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoV: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary, marginTop: 1 },
  locOpt: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, marginBottom: 6 },
  locOptA: { borderColor: Colors.primary },
  locLabel: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  locLabelA: { color: Colors.primary },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  radioA: { borderColor: Colors.primary },
  radioInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.primary },
  linkRow: { flexDirection: 'row', gap: 8 },
  linkInput: { flex: 1, backgroundColor: Colors.subtle, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  linkBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  linkedC: { fontSize: 12, color: Colors.textMuted, marginTop: 8 },
  shortcutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.subtle, borderRadius: 12, padding: 14, marginBottom: 8 },
  shortcutT: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.destructive + '30', marginBottom: 16, marginTop: 8 },
  logoutT: { fontSize: 14, fontWeight: '600', color: Colors.destructive },
  ver: { textAlign: 'center', fontSize: 11, color: Colors.textMuted, letterSpacing: 0.5 },
});
