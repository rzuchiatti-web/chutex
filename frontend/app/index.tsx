import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, ActivityIndicator, Keyboard, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';

const ROLES = [
  { id: 'beneficiary', label: 'Beneficiaire', icon: 'heart-outline', desc: 'Patient / porteur bracelet' },
  { id: 'guardian', label: 'Gardien', icon: 'shield-checkmark-outline', desc: 'Proche ou professionnel' },
  { id: 'teleassistance', label: 'Teleassistance', icon: 'headset-outline', desc: 'Operateur plateau' },
  { id: 'admin', label: 'Admin', icon: 'settings-outline', desc: 'Back-office' },
];

const FormInput = React.memo(({ testID, label, placeholder, value, onChangeText, keyboardType, secureTextEntry, autoCapitalize, multiline, rightElement, colors }: any) => {
  if (Platform.OS === 'web') {
    const inputType = secureTextEntry ? 'password' : keyboardType === 'email-address' ? 'email' : keyboardType === 'phone-pad' ? 'tel' : keyboardType === 'numeric' ? 'number' : 'text';
    return (
      <div style={{ marginBottom: 16 }}>
        {label ? <div style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted, marginBottom: 6, marginLeft: 2, textTransform: 'uppercase' as any, letterSpacing: 1 }}>{label}</div> : null}
        <div style={{ display: 'flex', flexDirection: 'row' as any, alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, border: `1.5px solid ${colors.border}`, paddingLeft: 16, paddingRight: 16, minHeight: 52, transition: 'border-color 0.2s, box-shadow 0.2s' }}>
          <input
            data-testid={testID}
            type={inputType}
            style={{ flex: 1, fontSize: 15, color: colors.textPrimary, border: 'none', outline: 'none', background: 'transparent', padding: '14px 0', fontFamily: 'system-ui, -apple-system, sans-serif', width: '100%', letterSpacing: 0.2 }}
            placeholder={placeholder || label}
            value={value || ''}
            onChange={(e: any) => onChangeText(e.target.value)}
          />
          {rightElement}
        </div>
      </div>
    );
  }
  return (
    <View style={{ marginBottom: 16 }}>
      {label ? <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted, marginBottom: 6, marginLeft: 2, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 16, minHeight: 52 }}>
        <TextInput
          testID={testID}
          style={{ flex: 1, fontSize: 15, color: colors.textPrimary, paddingVertical: 14 }}
          placeholder={placeholder || label}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || 'default'}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize || 'sentences'}
          multiline={multiline}
        />
        {rightElement}
      </View>
    </View>
  );
});

export default function AuthScreen() {
  const { user, loading, login, register } = useAuth();
  const { colors, isDark, toggle } = useTheme();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('beneficiary');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [guardianType, setGuardianType] = useState('particular');
  const [structureName, setStructureName] = useState('');
  const [siret, setSiret] = useState('');
  const [profession, setProfession] = useState('');
  const [relationship, setRelationship] = useState('');
  const [prescriberCode, setPrescriberCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const hasRedirected = useRef(false);
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
    ])).start();
  }, []);

  useEffect(() => {
    if (!loading && user && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace('/(tabs)');
    }
    if (!loading && !user) hasRedirected.current = false;
  }, [user, loading]);

  if (loading || user) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}><ActivityIndicator size="large" color={colors.primary} /></View>;

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) return setError('Identifiant et mot de passe requis');
    if (!isLogin && !name) return setError('Nom requis');
    setSubmitting(true);
    try {
      let loginId = email.trim();
      if (!loginId.includes('@') && !loginId.startsWith('+')) {
        if (loginId.startsWith('0') && loginId.length >= 10) loginId = '+33' + loginId.substring(1).replace(/\s/g, '');
      }
      if (isLogin) {
        await login(loginId.toLowerCase(), password);
      } else {
        const regData: any = {
          email: email.trim().toLowerCase(), password, name, phone, role,
          date_of_birth: dateOfBirth, gender, address,
          height_cm: heightCm ? parseFloat(heightCm) : undefined,
          weight_kg: weightKg ? parseFloat(weightKg) : undefined,
          blood_type: bloodType, allergies, medical_conditions: medicalConditions,
          emergency_contact_name: emergencyContactName, emergency_contact_phone: emergencyContactPhone,
          doctor_name: doctorName, guardian_type: guardianType, structure_name: structureName,
          siret, profession, relationship, prescriber_code: prescriberCode,
        };
        await register(regData);
      }
      hasRedirected.current = true;
      router.replace('/(tabs)');
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setSubmitting(false); }
  };

  const totalSteps = role === 'beneficiary' ? 3 : role === 'guardian' ? 3 : 2;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1, maxWidth: 480, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Theme Toggle */}
        <TouchableOpacity data-testid="theme-toggle-login" onPress={toggle} style={{ alignSelf: 'flex-end', marginTop: 12, padding: 8, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
          <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={18} color={colors.primary} />
        </TouchableOpacity>

        {/* Header */}
        <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 32 }}>
          <Animated.View style={{ opacity: pulseAnim, marginBottom: 12 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryGlow, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.primary }}>
              <Ionicons name="shield-checkmark" size={28} color={colors.primary} />
            </View>
          </Animated.View>
          <Text style={{ fontSize: 36, fontWeight: '900', color: colors.textPrimary, letterSpacing: 6 }}>CHUTEX</Text>
          <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 6, letterSpacing: 1 }}>Teleassistance intelligente</Text>
          <View style={{ width: 40, height: 2, backgroundColor: colors.primary, borderRadius: 1, marginTop: 12 }} />
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 14, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: colors.border }}>
          <TouchableOpacity testID="auth-tab-login" style={[{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 11 }, isLogin && { backgroundColor: colors.primary }]} onPress={() => setIsLogin(true)}>
            <Text style={[{ fontSize: 14, fontWeight: '700' }, isLogin ? { color: isDark ? '#000' : '#FFF' } : { color: colors.textMuted }]}>Connexion</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="auth-tab-register" style={[{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 11 }, !isLogin && { backgroundColor: colors.primary }]} onPress={() => { setIsLogin(false); setStep(0); }}>
            <Text style={[{ fontSize: 14, fontWeight: '700' }, !isLogin ? { color: isDark ? '#000' : '#FFF' } : { color: colors.textMuted }]}>Inscription</Text>
          </TouchableOpacity>
        </View>

        {error ? <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.dangerLight, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginBottom: 16, gap: 8, borderWidth: 1, borderColor: colors.danger + '30' }}><Ionicons name="alert-circle" size={16} color={colors.danger} /><Text style={{ fontSize: 13, color: colors.danger, flex: 1 }}>{error}</Text></View> : null}

        {isLogin ? (
          <>
            <FormInput testID="reg-email" label="Email ou telephone" placeholder="email@exemple.com ou 06 12 34 56 78" value={email} onChangeText={setEmail} autoCapitalize="none" colors={colors} />
            <FormInput testID="auth-input-password" label="Mot de passe" value={password} onChangeText={setPassword}
              secureTextEntry={!showPw} colors={colors} rightElement={<TouchableOpacity onPress={() => setShowPw(!showPw)} style={{ padding: 6 }}><Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} /></TouchableOpacity>} />
            <TouchableOpacity testID="auth-submit-btn" style={{ backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 9999, alignItems: 'center', marginTop: 8 }} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color={isDark ? '#000' : '#FFF'} /> : <Text style={{ color: isDark ? '#000' : '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }}>Se connecter</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Progress */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 6 }}>{Array.from({ length: totalSteps }).map((_, i) => <View key={i} style={{ width: 32, height: 3, borderRadius: 2, backgroundColor: i <= step ? colors.primary : colors.border }} />)}</View>
            <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: 'center', marginBottom: 20 }}>Etape {step + 1} / {totalSteps}</Text>

            {step === 0 && (
              <>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 }}>Choisissez votre profil</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                  {ROLES.map(r => (
                    <TouchableOpacity key={r.id} testID={`role-${r.id}`} style={[{ width: '47%', paddingVertical: 16, paddingHorizontal: 10, alignItems: 'center', backgroundColor: colors.surface, borderRadius: 14, borderWidth: 2, borderColor: role === r.id ? colors.primary : colors.border }, role === r.id && { backgroundColor: colors.primaryGlow }]} onPress={() => setRole(r.id)}>
                      <Ionicons name={r.icon as any} size={22} color={role === r.id ? colors.primary : colors.textMuted} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: role === r.id ? colors.primary : colors.textSecondary, marginTop: 6 }}>{r.label}</Text>
                      <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 2, textAlign: 'center' }}>{r.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <FormInput testID="reg-name" label="Nom complet" placeholder="Jean Dupont" value={name} onChangeText={setName} colors={colors} />
                <FormInput testID="reg-email" label="Email" placeholder="email@exemple.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" colors={colors} />
                <FormInput testID="reg-phone" label="Telephone" placeholder="06 12 34 56 78" value={phone} onChangeText={setPhone} keyboardType="phone-pad" colors={colors} />
                <FormInput testID="reg-password" label="Mot de passe" placeholder="Min. 6 caracteres" value={password} onChangeText={setPassword}
                  secureTextEntry={!showPw} colors={colors} rightElement={<TouchableOpacity onPress={() => setShowPw(!showPw)} style={{ padding: 6 }}><Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} /></TouchableOpacity>} />
              </>
            )}

            {step === 1 && role === 'beneficiary' && (
              <>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 }}>Informations personnelles</Text>
                <FormInput testID="reg-dob" label="Date de naissance" placeholder="JJ/MM/AAAA" value={dateOfBirth} onChangeText={setDateOfBirth} colors={colors} />
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Genre</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  {['Homme', 'Femme', 'Autre'].map(g => <TouchableOpacity key={g} testID={`gender-${g}`} style={[{ paddingVertical: 10, paddingHorizontal: 18, borderRadius: 9999, borderWidth: 1.5, borderColor: gender === g ? colors.primary : colors.border, backgroundColor: gender === g ? colors.primaryGlow : colors.surface }]} onPress={() => setGender(g)}><Text style={{ fontSize: 14, fontWeight: '600', color: gender === g ? colors.primary : colors.textSecondary }}>{g}</Text></TouchableOpacity>)}
                </View>
                <FormInput testID="reg-address" label="Adresse" placeholder="123 rue de la Sante, 75014 Paris" value={address} onChangeText={setAddress} colors={colors} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}><FormInput testID="reg-height" label="Taille (cm)" placeholder="170" value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" colors={colors} /></View>
                  <View style={{ flex: 1 }}><FormInput testID="reg-weight" label="Poids (kg)" placeholder="70" value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" colors={colors} /></View>
                </View>
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Groupe sanguin</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <TouchableOpacity key={b} testID={`blood-${b}`} style={[{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 9999, borderWidth: 1.5, borderColor: bloodType === b ? colors.primary : colors.border, backgroundColor: bloodType === b ? colors.primaryGlow : colors.surface }]} onPress={() => setBloodType(b)}><Text style={{ fontSize: 12, fontWeight: '600', color: bloodType === b ? colors.primary : colors.textSecondary }}>{b}</Text></TouchableOpacity>)}
                </View>
              </>
            )}

            {step === 2 && role === 'beneficiary' && (
              <>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 }}>Informations medicales</Text>
                <FormInput testID="reg-allergies" label="Allergies connues" placeholder="Ex: penicilline, arachides..." value={allergies} onChangeText={setAllergies} multiline colors={colors} />
                <FormInput testID="reg-conditions" label="Pathologies" placeholder="Ex: diabete, hypertension..." value={medicalConditions} onChangeText={setMedicalConditions} multiline colors={colors} />
                <FormInput testID="reg-doctor" label="Medecin traitant" placeholder="Dr. Dupont" value={doctorName} onChangeText={setDoctorName} colors={colors} />
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 16, marginTop: 8 }}>Contact d'urgence</Text>
                <FormInput testID="reg-ec-name" label="Nom du contact" placeholder="Marie Dupont" value={emergencyContactName} onChangeText={setEmergencyContactName} colors={colors} />
                <FormInput testID="reg-ec-phone" label="Telephone urgence" placeholder="06 98 76 54 32" value={emergencyContactPhone} onChangeText={setEmergencyContactPhone} keyboardType="phone-pad" colors={colors} />
              </>
            )}

            {step === 1 && role === 'guardian' && (
              <>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 }}>Type de gardien</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                  {[{ id: 'particular', l: 'Particulier' }, { id: 'professional', l: 'Professionnel' }].map(t => (
                    <TouchableOpacity key={t.id} testID={`gtype-${t.id}`} style={[{ flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: guardianType === t.id ? colors.primary : colors.border, backgroundColor: guardianType === t.id ? colors.primaryGlow : colors.surface, alignItems: 'center' }]} onPress={() => setGuardianType(t.id)}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: guardianType === t.id ? colors.primary : colors.textSecondary }}>{t.l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {guardianType === 'particular' && <FormInput testID="reg-relationship" label="Lien avec le beneficiaire" placeholder="Fils, fille, voisin..." value={relationship} onChangeText={setRelationship} colors={colors} />}
                {guardianType === 'professional' && (
                  <>
                    <FormInput testID="reg-structure" label="Nom de la structure" placeholder="SAAD Exemple" value={structureName} onChangeText={setStructureName} colors={colors} />
                    <FormInput testID="reg-siret" label="N SIRET" placeholder="123 456 789 00001" value={siret} onChangeText={setSiret} keyboardType="numeric" colors={colors} />
                    <FormInput testID="reg-profession" label="Profession" placeholder="Aide-soignant, infirmier..." value={profession} onChangeText={setProfession} colors={colors} />
                  </>
                )}
              </>
            )}

            {step === 2 && role === 'guardian' && (
              <>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>Mode prescripteur (optionnel)</Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16, lineHeight: 19 }}>Si vous avez un code d'activation, entrez-le pour activer le mode prescripteur.</Text>
                <FormInput testID="reg-presc-code" label="Code d'activation" placeholder="Ex: SAAD1234" value={prescriberCode} onChangeText={setPrescriberCode} autoCapitalize="characters" colors={colors} />
              </>
            )}

            {step === 1 && (role === 'teleassistance' || role === 'admin') && (
              <>
                <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 }}>Informations complementaires</Text>
                <FormInput testID="reg-address" label="Adresse / Lieu de travail" placeholder="Siege social" value={address} onChangeText={setAddress} colors={colors} />
              </>
            )}

            {/* Navigation */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
              {step > 0 && <TouchableOpacity testID="prev-step" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 9999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} onPress={() => setStep(step - 1)}>
                <Ionicons name="chevron-back" size={16} color={colors.textSecondary} /><Text style={{ fontSize: 14, fontWeight: '600', color: colors.textSecondary }}>Retour</Text></TouchableOpacity>}
              <View style={{ flex: 1 }} />
              {step < totalSteps - 1 ? (
                <TouchableOpacity testID="next-step" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 9999, backgroundColor: colors.primary }} onPress={() => {
                  if (step === 0 && (!name || !email || !password)) return setError('Remplissez les champs requis');
                  setError(''); setStep(step + 1);
                }}><Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#000' : '#FFF' }}>Suivant</Text><Ionicons name="chevron-forward" size={16} color={isDark ? '#000' : '#FFF'} /></TouchableOpacity>
              ) : (
                <TouchableOpacity testID="auth-submit-btn" style={{ backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 9999, alignItems: 'center' }} onPress={handleSubmit} disabled={submitting}>
                  {submitting ? <ActivityIndicator color={isDark ? '#000' : '#FFF'} /> : <Text style={{ color: isDark ? '#000' : '#FFF', fontSize: 15, fontWeight: '800' }}>S'inscrire</Text>}
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
