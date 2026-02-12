import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { apiFetch } from '../../src/services/api';

export default function ProfileScreen() {
  const { user, token, logout, refreshUser } = useAuth();
  const { colors, isDark, toggle } = useTheme();
  const router = useRouter();
  const [linkEmail, setLinkEmail] = useState('');
  const [linking, setLinking] = useState(false);
  const [locMode, setLocMode] = useState(user?.location_sharing || 'alert_only');
  const [savingLoc, setSavingLoc] = useState(false);
  const [actCode, setActCode] = useState('');
  const [activating, setActivating] = useState(false);
  const [ivCode, setIvCode] = useState('');
  const [ivActivating, setIvActivating] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [guardians, setGuardians] = useState<any[]>([]);
  const [showAddGuardian, setShowAddGuardian] = useState(false);
  const [guardianPhone, setGuardianPhone] = useState('');
  const [addingGuardian, setAddingGuardian] = useState(false);
  const [addResult, setAddResult] = useState<any>(null);

  useEffect(() => {
    if (user?.role === 'beneficiary' && token) {
      apiFetch('/api/subscriptions/my', {}, token).then(s => setSubscription(s)).catch(() => {});
      apiFetch('/api/guardians/my', {}, token).then(g => setGuardians(Array.isArray(g) ? g : [])).catch(() => {});
    }
  }, [user, token]);

  const moveGuardian = async (gid: string, dir: 'up' | 'down') => {
    const idx = guardians.findIndex(g => g.id === gid);
    if (idx < 0 || (dir === 'up' && idx === 0) || (dir === 'down' && idx === guardians.length - 1)) return;
    const newList = [...guardians];
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    [newList[idx], newList[swap]] = [newList[swap], newList[idx]];
    setGuardians(newList);
    await apiFetch('/api/guardians/reorder', { method: 'POST', body: JSON.stringify({ order: newList.map(g => g.id) }) }, token).catch(() => {});
  };

  const removeGuardian = async (gid: string) => {
    await apiFetch(`/api/guardians/${gid}/unlink`, { method: 'POST' }, token).catch(() => {});
    setGuardians(guardians.filter(g => g.id !== gid));
  };

  const addGuardian = async () => {
    if (!guardianPhone.trim()) return;
    setAddingGuardian(true); setAddResult(null);
    try {
      const r = await apiFetch('/api/guardians/invite', { method: 'POST', body: JSON.stringify({ phone: guardianPhone.trim() }) }, token);
      setAddResult(r);
      if (r?.linked) { setGuardians([...guardians, r.guardian]); setGuardianPhone(''); setTimeout(() => { setShowAddGuardian(false); setAddResult(null); }, 2000); }
    } catch (e: any) { setAddResult({ error: e.message }); } finally { setAddingGuardian(false); }
  };

  if (!user || !token) return null;

  const handleLogout = async () => { await logout(); };

  const handleLink = async () => {
    if (!linkEmail.trim()) return Alert.alert('Erreur', 'Entrez un email');
    setLinking(true);
    try {
      const r = await apiFetch('/api/guardian/link', { method: 'POST', body: JSON.stringify({ beneficiary_email: linkEmail.trim().toLowerCase() }) }, token);
      Alert.alert('Succes', `${r.beneficiary.name} lie`); setLinkEmail(''); await refreshUser();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setLinking(false); }
  };

  const updateLocSharing = async (mode: string) => {
    setSavingLoc(true);
    try { await apiFetch('/api/location/sharing', { method: 'PUT', body: JSON.stringify({ mode }) }, token); setLocMode(mode); } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSavingLoc(false); }
  };

  const activatePrescriber = async () => {
    if (!actCode.trim()) return Alert.alert('Erreur', 'Entrez un code');
    setActivating(true);
    try { const r = await apiFetch('/api/guardian/activate-prescriber', { method: 'POST', body: JSON.stringify({ code: actCode.trim().toUpperCase() }) }, token); Alert.alert('Active', `Mode prescripteur active pour ${r.structure}`); setActCode(''); await refreshUser(); } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setActivating(false); }
  };

  const activateIntervention = async () => {
    if (!ivCode.trim()) return Alert.alert('Erreur', 'Entrez un code');
    setIvActivating(true);
    try { const r = await apiFetch('/api/guardian/activate-intervention-provider', { method: 'POST', body: JSON.stringify({ code: ivCode.trim().toUpperCase() }) }, token); Alert.alert('Active', `Role intervenant active. Rayon: ${r.radius_km || 30}km`); setIvCode(''); await refreshUser(); } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setIvActivating(false); }
  };

  const roleName = user.role === 'beneficiary' ? 'Beneficiaire' : user.role === 'guardian' ? (user.is_prescriber ? 'Prescripteur' : 'Gardien') : user.role === 'teleassistance' ? 'Teleassistance' : 'Administrateur';

  const Section = ({ children, style }: any) => (
    <View style={[{ backgroundColor: colors.surface, borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: colors.border }, style]}>{children}</View>
  );

  const InputRow = ({ placeholder, value, onChangeText, btnIcon, onPress, loading: btnLoading, testIDs }: any) => (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      {Platform.OS === 'web' ? (
        <div style={{ flex: 1 }}>
          <input data-testid={testIDs?.[0]} type="text" placeholder={placeholder} value={value}
            onChange={(e: any) => onChangeText(e.target.value)}
            style={{ width: '100%', fontSize: 14, padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${colors.border}`, outline: 'none', backgroundColor: colors.surfaceHighlight, fontFamily: 'system-ui', color: colors.textPrimary, boxSizing: 'border-box' as any }} />
        </div>
      ) : (
        <TextInput testID={testIDs?.[0]} style={{ flex: 1, backgroundColor: colors.surfaceHighlight, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.textPrimary, borderWidth: 1.5, borderColor: colors.border }} placeholder={placeholder} placeholderTextColor={colors.textMuted} value={value} onChangeText={onChangeText} autoCapitalize="none" />
      )}
      <TouchableOpacity testID={testIDs?.[1]} style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }} onPress={onPress} disabled={btnLoading}>
        {btnLoading ? <ActivityIndicator color="#FFF" size="small" /> : <Ionicons name={btnIcon} size={20} color={isDark ? '#000' : '#FFF'} />}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} testID="profile-screen">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginTop: 16, marginBottom: 24, letterSpacing: -0.5 }}>Profil</Text>

        {/* User Card */}
        <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 28, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontSize: 28, fontWeight: '800', color: isDark ? '#000' : '#FFF' }}>{user.name?.charAt(0)?.toUpperCase()}</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.textPrimary }}>{user.name}</Text>
          <View style={{ marginTop: 8, paddingHorizontal: 16, paddingVertical: 5, borderRadius: 9999, borderWidth: 1.5, borderColor: colors.primary + '40', backgroundColor: colors.primaryGlow }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.primary }}>{roleName}</Text>
          </View>
          {user.is_prescriber && user.prescriber_structure ? <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 6 }}>{user.prescriber_structure}</Text> : null}
        </View>

        {/* Theme Toggle */}
        <Section>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={colors.primary} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>Mode {isDark ? 'sombre' : 'clair'}</Text>
            </View>
            <TouchableOpacity data-testid="theme-toggle-profile" onPress={toggle} style={{ width: 52, height: 28, borderRadius: 14, backgroundColor: isDark ? colors.primary : colors.border, justifyContent: 'center', padding: 3 }}>
              <View style={[{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF' }, isDark ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]} />
            </TouchableOpacity>
          </View>
        </Section>

        {/* Info */}
        <Section>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 }}>Informations</Text>
          {[
            { icon: 'mail-outline', label: 'Email', val: user.email },
            { icon: 'call-outline', label: 'Telephone', val: user.phone || '--' },
            { icon: 'calendar-outline', label: 'Inscrit le', val: new Date(user.created_at).toLocaleDateString('fr-FR') },
          ].map((r, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: i < 2 ? 0.5 : 0, borderBottomColor: colors.border }}>
              <Ionicons name={r.icon as any} size={16} color={colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{r.label}</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary, marginTop: 2 }}>{r.val}</Text>
              </View>
            </View>
          ))}
        </Section>

        {/* Beneficiary: Location Sharing */}
        {user.role === 'beneficiary' && (
          <Section>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 }}>Partage de localisation</Text>
            {[
              { mode: 'always', label: 'Toujours', icon: 'location-outline' },
              { mode: 'alert_only', label: 'En cas d\'alerte', icon: 'alert-circle-outline' },
              { mode: 'never', label: 'Jamais', icon: 'lock-closed-outline' },
            ].map(opt => (
              <TouchableOpacity key={opt.mode} testID={`loc-${opt.mode}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1.5, borderColor: locMode === opt.mode ? colors.primary : colors.border, marginBottom: 6, backgroundColor: locMode === opt.mode ? colors.primaryGlow : 'transparent' }}
                onPress={() => updateLocSharing(opt.mode)} disabled={savingLoc}>
                <Ionicons name={opt.icon as any} size={18} color={locMode === opt.mode ? colors.primary : colors.textMuted} />
                <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: locMode === opt.mode ? colors.primary : colors.textSecondary }}>{opt.label}</Text>
                <View style={[{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: locMode === opt.mode ? colors.primary : colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                  {locMode === opt.mode && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />}
                </View>
              </TouchableOpacity>
            ))}
          </Section>
        )}

        {/* Beneficiary: Subscription */}
        {user.role === 'beneficiary' && (
          <Section style={{ backgroundColor: subscription?.subscription_type === 'care' ? colors.care + '12' : subscription?.has_subscription ? colors.primaryGlow : colors.surface }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name="shield-checkmark" size={24} color={subscription?.subscription_type === 'care' ? colors.care : subscription?.has_subscription ? colors.primary : colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>{subscription?.subscription_type === 'care' ? 'Abonnement Care' : subscription?.has_subscription ? 'Abonnement Standard' : 'Aucun abonnement'}</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{subscription?.subscription_type === 'care' ? 'Bracelet + App + Teleassistance IA' : subscription?.has_subscription ? 'Bracelet + App complete' : 'Gilet et balance uniquement'}</Text>
              </View>
            </View>
          </Section>
        )}

        {/* Beneficiary: Guardians */}
        {user.role === 'beneficiary' && (
          <Section>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>Mes gardiens ({guardians.length})</Text>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 9999 }}
                onPress={() => { setShowAddGuardian(true); setAddResult(null); setGuardianPhone(''); }}>
                <Ionicons name="add" size={14} color={isDark ? '#000' : '#FFF'} /><Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#000' : '#FFF' }}>Ajouter</Text>
              </TouchableOpacity>
            </View>
            {guardians.map((g, idx) => (
              <View key={g.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surfaceHighlight, borderRadius: 12, padding: 12, marginBottom: 6, borderWidth: idx === 0 ? 1.5 : 0, borderColor: idx === 0 ? colors.success : 'transparent' }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: idx === 0 ? colors.success : colors.primary, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFF' }}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>{g.name}</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>{g.phone || g.email}</Text>
                </View>
                {idx > 0 && <TouchableOpacity onPress={() => moveGuardian(g.id, 'up')} style={{ padding: 4 }}><Ionicons name="chevron-up" size={16} color={colors.primary} /></TouchableOpacity>}
                {idx < guardians.length - 1 && <TouchableOpacity onPress={() => moveGuardian(g.id, 'down')} style={{ padding: 4 }}><Ionicons name="chevron-down" size={16} color={colors.primary} /></TouchableOpacity>}
                <TouchableOpacity onPress={() => removeGuardian(g.id)} style={{ padding: 4 }}><Ionicons name="close" size={16} color={colors.danger} /></TouchableOpacity>
              </View>
            ))}
            {guardians.length === 0 && <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 12 }}>Aucun gardien. Ajoutez un proche.</Text>}
          </Section>
        )}

        {/* Add Guardian Modal */}
        {showAddGuardian && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay, justifyContent: 'center', padding: 24, zIndex: 100 }}>
            <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: colors.textPrimary }}>Ajouter un gardien</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 6, lineHeight: 19 }}>Renseignez le numero de telephone. S'il a un compte, il sera lie. Sinon, un SMS d'invitation sera envoye.</Text>
              <View style={{ marginTop: 16, marginBottom: 16 }}>
                {Platform.OS === 'web' ? (
                  <div><input data-testid="add-guardian-phone" type="tel" placeholder="+33 6 12 34 56 78" value={guardianPhone}
                    onChange={(e: any) => setGuardianPhone(e.target.value)}
                    style={{ width: '100%', fontSize: 16, padding: '14px 14px', borderRadius: 14, border: `1.5px solid ${colors.border}`, outline: 'none', backgroundColor: colors.surfaceHighlight, fontFamily: 'system-ui', color: colors.textPrimary, boxSizing: 'border-box' as any }} /></div>
                ) : (
                  <TextInput testID="add-guardian-phone" style={{ fontSize: 16, backgroundColor: colors.surfaceHighlight, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 14, color: colors.textPrimary }}
                    placeholder="+33 6 12 34 56 78" placeholderTextColor={colors.textMuted} value={guardianPhone} onChangeText={setGuardianPhone} keyboardType="phone-pad" />
                )}
              </View>
              {addResult && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12, marginBottom: 12, backgroundColor: addResult.error ? colors.dangerLight : addResult.linked ? colors.successLight : colors.warningLight }}>
                  <Ionicons name={addResult.error ? 'alert-circle' : addResult.linked ? 'checkmark-circle' : 'send'} size={16} color={addResult.error ? colors.danger : addResult.linked ? colors.success : colors.warning} />
                  <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: addResult.error ? colors.danger : addResult.linked ? colors.success : colors.warning }}>{addResult.error || addResult.message}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: 9999, backgroundColor: colors.surfaceHighlight, alignItems: 'center' }} onPress={() => setShowAddGuardian(false)}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textSecondary }}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: 9999, backgroundColor: colors.primary, alignItems: 'center' }} onPress={addGuardian} disabled={addingGuardian || !guardianPhone.trim()}>
                  {addingGuardian ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{ fontSize: 15, fontWeight: '700', color: isDark ? '#000' : '#FFF' }}>Ajouter</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Guardian: Link Beneficiary */}
        {user.role === 'guardian' && (
          <Section>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 }}>Lier un beneficiaire</Text>
            <InputRow placeholder="email@beneficiaire.com" value={linkEmail} onChangeText={setLinkEmail} btnIcon="link" onPress={handleLink} loading={linking} testIDs={['link-email-input', 'link-btn']} />
            {user.beneficiaries?.length > 0 && <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 10 }}>{user.beneficiaries.length} beneficiaire(s) lie(s)</Text>}
          </Section>
        )}

        {/* Guardian: Activate Prescriber */}
        {user.role === 'guardian' && !user.is_prescriber && (
          <Section>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 }}>Mode prescripteur</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12, lineHeight: 17 }}>Entrez votre code d'activation pour envoyer des prescriptions.</Text>
            <InputRow placeholder="Code (ex: SAAD1234)" value={actCode} onChangeText={setActCode} btnIcon="key" onPress={activatePrescriber} loading={activating} testIDs={['act-code-input', 'activate-btn']} />
          </Section>
        )}

        {user.role === 'guardian' && user.is_prescriber && (
          <Section style={{ backgroundColor: colors.successLight }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>Mode prescripteur actif</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Structure : {user.prescriber_structure}</Text>
              </View>
            </View>
          </Section>
        )}

        {user.role === 'guardian' && !user.is_intervention_provider && (
          <Section>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 }}>Devenir intervenant</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12, lineHeight: 17 }}>Entrez votre code pour devenir prestataire d'intervention.</Text>
            <InputRow placeholder="Code intervenant" value={ivCode} onChangeText={setIvCode} btnIcon="shield-checkmark" onPress={activateIntervention} loading={ivActivating} testIDs={['iv-code-input', 'iv-activate-btn']} />
          </Section>
        )}

        {user.role === 'guardian' && user.is_intervention_provider && (
          <Section style={{ backgroundColor: colors.successLight }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="shield-checkmark" size={22} color={colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>Intervenant actif</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>Rayon: {user.intervention_radius_km || 30}km</Text>
              </View>
            </View>
          </Section>
        )}

        {/* Shortcuts */}
        {(user.role === 'admin') && (
          <TouchableOpacity testID="backoffice-btn" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: colors.border }} onPress={() => router.push('/backoffice')}>
            <Ionicons name="settings-outline" size={20} color={colors.primary} />
            <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>Back Office</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        {user.role === 'beneficiary' && [
          { testID: 'share-link', icon: 'qr-code-outline', label: 'Partager mon profil (Code / QR)', route: '/link-code' },
          { testID: 'devices-shortcut', icon: 'bluetooth-outline', label: 'Gerer mes appareils', route: '/(tabs)/devices' },
          { testID: 'data-sharing-link', icon: 'shield-checkmark-outline', label: 'Gerer le partage de donnees', route: '/data-sharing' },
          { testID: 'reminders-link', icon: 'alarm-outline', label: 'Mes rappels quotidiens', route: '/reminders' },
          { testID: 'ecg-link', icon: 'pulse-outline', label: 'Electrocardiogramme (ECG)', route: '/ecg' },
          { testID: 'geofence-link', icon: 'locate-outline', label: 'Zones de securite', route: '/geofencing' },
        ].map(s => (
          <TouchableOpacity key={s.testID} testID={s.testID} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: colors.border }} onPress={() => router.push(s.route as any)}>
            <Ionicons name={s.icon as any} size={20} color={colors.primary} />
            <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>{s.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity testID="logout-btn" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 9999, borderWidth: 1.5, borderColor: colors.danger + '30', marginBottom: 16, marginTop: 12 }} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={16} color={colors.danger} />
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.danger }}>Se deconnecter</Text>
        </TouchableOpacity>
        <Text style={{ textAlign: 'center', fontSize: 11, color: colors.textMuted, letterSpacing: 0.5, marginBottom: 8 }}>Chutex AI v3.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
