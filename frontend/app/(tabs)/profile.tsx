import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

  if (!user || !token) return null;

  const handleLogout = async () => { await logout(); router.replace('/'); };

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
      setLocMode(mode); Alert.alert('Sauvegardé', `Partage de localisation: ${mode === 'always' ? 'Toujours' : mode === 'alert_only' ? 'En cas d\'alerte' : 'Jamais'}`);
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSavingLoc(false); }
  };

  return (
    <SafeAreaView style={st.safe} testID="profile-screen">
      <ScrollView contentContainerStyle={st.sc} showsVerticalScrollIndicator={false}>
        <Text style={st.title}>Mon Profil</Text>

        <View style={st.userCard}>
          <View style={st.avatar}><Text style={st.avatarT}>{user.name?.charAt(0)?.toUpperCase()}</Text></View>
          <Text style={st.userName}>{user.name}</Text>
          <View style={st.roleBadge}>
            <Ionicons name={user.role === 'guardian' ? 'shield-checkmark' : 'heart'} size={13} color={Colors.primary} />
            <Text style={st.roleT}>{user.role === 'guardian' ? 'Gardien' : 'Bénéficiaire'}</Text>
          </View>
        </View>

        <View style={st.section}>
          <Text style={st.secTitle}>Informations</Text>
          {[
            { icon: 'mail-outline', label: 'Email', val: user.email },
            { icon: 'call-outline', label: 'Téléphone', val: user.phone || 'Non renseigné' },
            { icon: 'calendar-outline', label: 'Inscrit', val: new Date(user.created_at).toLocaleDateString('fr-FR') },
          ].map((r, i) => (
            <View key={i} style={st.infoRow}>
              <Ionicons name={r.icon as any} size={18} color={Colors.textMuted} />
              <View style={st.infoC}><Text style={st.infoL}>{r.label}</Text><Text style={st.infoV}>{r.val}</Text></View>
            </View>
          ))}
        </View>

        {/* Location Sharing (Beneficiary only) */}
        {user.role === 'beneficiary' && (
          <View style={st.section}>
            <Text style={st.secTitle}>Partage de localisation</Text>
            <Text style={st.secDesc}>Choisissez quand vos gardiens peuvent voir votre position</Text>
            {[
              { mode: 'always', label: 'Toujours', desc: 'Position partagée en permanence', icon: 'location' },
              { mode: 'alert_only', label: 'En cas d\'alerte', desc: 'Uniquement lors d\'une alerte active', icon: 'alert-circle' },
              { mode: 'never', label: 'Jamais', desc: 'Position jamais partagée', icon: 'lock-closed' },
            ].map(opt => (
              <TouchableOpacity key={opt.mode} testID={`loc-${opt.mode}`}
                style={[st.locOpt, locMode === opt.mode && st.locOptA]}
                onPress={() => updateLocSharing(opt.mode)} disabled={savingLoc}>
                <Ionicons name={opt.icon as any} size={20} color={locMode === opt.mode ? Colors.primary : Colors.textMuted} />
                <View style={st.locInfo}>
                  <Text style={[st.locLabel, locMode === opt.mode && st.locLabelA]}>{opt.label}</Text>
                  <Text style={st.locDesc}>{opt.desc}</Text>
                </View>
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
            <Text style={st.secTitle}>Lier un Bénéficiaire</Text>
            <View style={st.linkRow}>
              <TextInput testID="link-email-input" style={st.linkInput} placeholder="email@beneficiaire.com" placeholderTextColor={Colors.textMuted}
                value={linkEmail} onChangeText={setLinkEmail} keyboardType="email-address" autoCapitalize="none" />
              <TouchableOpacity testID="link-btn" style={st.linkBtn} onPress={handleLink} disabled={linking}>
                {linking ? <ActivityIndicator color="#FFF" size="small" /> : <Ionicons name="link" size={18} color="#FFF" />}
              </TouchableOpacity>
            </View>
            {user.beneficiaries?.length > 0 && <Text style={st.linkedC}>{user.beneficiaries.length} bénéficiaire(s) lié(s)</Text>}
          </View>
        )}

        {/* Device Sync */}
        {user.role === 'beneficiary' && (
          <TouchableOpacity testID="devices-shortcut" style={st.shortcutBtn} onPress={() => router.push('/(tabs)/devices')}>
            <MaterialCommunityIcons name="bluetooth-connect" size={20} color={Colors.primary} />
            <Text style={st.shortcutT}>Gérer mes appareils</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* Back Office */}
        <TouchableOpacity testID="backoffice-btn" style={st.shortcutBtn} onPress={() => router.push('/backoffice')}>
          <Ionicons name="settings" size={20} color={Colors.primary} />
          <Text style={st.shortcutT}>Back Office</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity testID="logout-btn" style={st.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={Colors.destructive} />
          <Text style={st.logoutT}>Se déconnecter</Text>
        </TouchableOpacity>
        <Text style={st.ver}>VitalLink AI v2.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background }, sc: { paddingHorizontal: 18, paddingBottom: 36 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, marginTop: 14, marginBottom: 16 },
  userCard: { backgroundColor: Colors.paper, borderRadius: 18, padding: 22, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarT: { fontSize: 26, fontWeight: '800', color: '#FFF' },
  userName: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, backgroundColor: Colors.primary + '10', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16 },
  roleT: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  section: { backgroundColor: Colors.paper, borderRadius: 14, padding: 16, marginBottom: 14 },
  secTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10 },
  secDesc: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12, lineHeight: 18 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.subtle },
  infoC: { flex: 1 }, infoL: { fontSize: 11, color: Colors.textMuted }, infoV: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  locOpt: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, marginBottom: 8 },
  locOptA: { borderColor: Colors.primary, backgroundColor: Colors.primary + '06' },
  locInfo: { flex: 1 },
  locLabel: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary }, locLabelA: { color: Colors.primary },
  locDesc: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  radioA: { borderColor: Colors.primary }, radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  linkRow: { flexDirection: 'row', gap: 8 },
  linkInput: { flex: 1, backgroundColor: Colors.subtle, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border },
  linkBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  linkedC: { fontSize: 13, color: Colors.textSecondary, marginTop: 10, fontWeight: '500' },
  shortcutBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.paper, borderRadius: 14, padding: 14, marginBottom: 10 },
  shortcutT: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.destructive + '08', borderWidth: 1, borderColor: Colors.destructive + '20', marginBottom: 16, marginTop: 6 },
  logoutT: { fontSize: 15, fontWeight: '600', color: Colors.destructive },
  ver: { textAlign: 'center', fontSize: 12, color: Colors.textMuted },
});
