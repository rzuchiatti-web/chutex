import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { Colors } from '../src/constants/colors';

const ROLES = [
  { id: 'beneficiary', label: 'Bénéficiaire', icon: 'heart-outline', desc: 'Patient / porteur bracelet' },
  { id: 'guardian', label: 'Gardien', icon: 'shield-checkmark-outline', desc: 'Proche ou professionnel' },
  { id: 'teleassistance', label: 'Téléassistance', icon: 'headset-outline', desc: 'Opérateur plateau' },
  { id: 'admin', label: 'Admin', icon: 'settings-outline', desc: 'Back-office' },
];

/* Stable input component — defined OUTSIDE parent to avoid focus loss */
const FormInput = React.memo(({ testID, label, placeholder, value, onChangeText, keyboardType, secureTextEntry, autoCapitalize, multiline, rightElement }: any) => (
  <View style={a.fieldWrap}>
    {label ? <Text style={a.label}>{label}</Text> : null}
    <View style={a.inpC}>
      <TextInput
        testID={testID}
        style={[a.inp, multiline && { minHeight: 70, textAlignVertical: 'top' }]}
        placeholder={placeholder || label}
        placeholderTextColor={Colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize || 'sentences'}
        multiline={multiline}
        blurOnSubmit={!multiline}
      />
      {rightElement}
    </View>
  </View>
));

export default function AuthScreen() {
  const { user, loading, login, register } = useAuth();
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

  useEffect(() => {
    if (!loading && user && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace('/(tabs)');
    }
    if (!loading && !user) {
      hasRedirected.current = false;
    }
  }, [user, loading]);

  if (loading) return <View style={a.loadC}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (user) return <View style={a.loadC}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const dismissKeyboard = () => Keyboard.dismiss();

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) return setError('Email et mot de passe requis');
    if (!isLogin && !name) return setError('Nom requis');
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email.trim().toLowerCase(), password);
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

  /* LOGIN */
  if (isLogin) return (
    <SafeAreaView style={a.safe}>
      <ScrollView contentContainerStyle={a.sc} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={a.header}>
          <Text style={a.appName}>CHUTEX</Text>
          <Text style={a.subtitle}>Téléassistance intelligente par Chutex Innovation</Text>
        </View>
        <View style={a.tabs}>
          <TouchableOpacity testID="auth-tab-login" style={[a.tab, a.tabA]} onPress={() => setIsLogin(true)}><Text style={[a.tabT, a.tabTA]}>Connexion</Text></TouchableOpacity>
          <TouchableOpacity testID="auth-tab-register" style={a.tab} onPress={() => { setIsLogin(false); setStep(0); }}><Text style={a.tabT}>Inscription</Text></TouchableOpacity>
        </View>
        {error ? <View style={a.err}><Ionicons name="alert-circle" size={14} color={Colors.destructive} /><Text style={a.errT}>{error}</Text></View> : null}
        <FormInput testID="reg-email" label="Email" placeholder="email@exemple.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <FormInput testID="auth-input-password" label="Mot de passe" placeholder="••••••••" value={password} onChangeText={setPassword}
          secureTextEntry={!showPw} rightElement={<TouchableOpacity onPress={() => setShowPw(!showPw)} style={a.eye}><Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} /></TouchableOpacity>} />
        <TouchableOpacity testID="auth-submit-btn" style={[a.btn, submitting && a.btnD]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={a.btnT}>Se connecter</Text>}</TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );

  /* REGISTER */
  const totalSteps = role === 'beneficiary' ? 3 : role === 'guardian' ? 3 : 2;

  return (
    <SafeAreaView style={a.safe}>
      <ScrollView contentContainerStyle={a.sc} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={a.header}><Text style={a.appName}>CHUTEX</Text></View>
            <View style={a.tabs}>
              <TouchableOpacity testID="auth-tab-login" style={a.tab} onPress={() => setIsLogin(true)}><Text style={a.tabT}>Connexion</Text></TouchableOpacity>
              <TouchableOpacity testID="auth-tab-register" style={[a.tab, a.tabA]}><Text style={[a.tabT, a.tabTA]}>Inscription</Text></TouchableOpacity>
            </View>

            <View style={a.prog}>{Array.from({length: totalSteps}).map((_, i) => <View key={i} style={[a.progDot, i <= step && {backgroundColor: Colors.primary}]} />)}</View>
            <Text style={a.stepL}>Étape {step + 1} / {totalSteps}</Text>

            {error ? <View style={a.err}><Ionicons name="alert-circle" size={14} color={Colors.destructive} /><Text style={a.errT}>{error}</Text></View> : null}

            {step === 0 && (
              <>
                <Text style={a.secTitle}>Choisissez votre profil</Text>
                <View style={a.rolesGrid}>
                  {ROLES.map(r => (
                    <TouchableOpacity key={r.id} testID={`role-${r.id}`} style={[a.roleC, role === r.id && a.roleCA]} onPress={() => setRole(r.id)}>
                      <Ionicons name={r.icon as any} size={20} color={role === r.id ? Colors.primary : Colors.textMuted} />
                      <Text style={[a.roleT, role === r.id && a.roleTA]}>{r.label}</Text>
                      <Text style={a.roleD}>{r.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <FormInput testID="reg-name" label="Nom complet" placeholder="Jean Dupont" value={name} onChangeText={setName} />
                <FormInput testID="reg-email" label="Email" placeholder="email@exemple.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                <FormInput testID="reg-phone" label="Téléphone" placeholder="06 12 34 56 78" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <FormInput testID="reg-password" label="Mot de passe" placeholder="Min. 6 caractères" value={password} onChangeText={setPassword}
                  secureTextEntry={!showPw} rightElement={<TouchableOpacity onPress={() => setShowPw(!showPw)} style={a.eye}><Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} /></TouchableOpacity>} />
              </>
            )}

            {step === 1 && role === 'beneficiary' && (
              <>
                <Text style={a.secTitle}>Informations personnelles</Text>
                <FormInput testID="reg-dob" label="Date de naissance" placeholder="JJ/MM/AAAA" value={dateOfBirth} onChangeText={setDateOfBirth} />
                <Text style={a.label}>Genre</Text>
                <View style={a.optRow}>
                  {['Homme','Femme','Autre'].map(g => <TouchableOpacity key={g} testID={`gender-${g}`} style={[a.optBtn, gender === g && a.optBtnA]} onPress={() => setGender(g)}><Text style={[a.optBtnT, gender === g && a.optBtnTA]}>{g}</Text></TouchableOpacity>)}
                </View>
                <FormInput testID="reg-address" label="Adresse" placeholder="123 rue de la Santé, 75014 Paris" value={address} onChangeText={setAddress} />
                <View style={a.row}>
                  <View style={a.half}><FormInput testID="reg-height" label="Taille (cm)" placeholder="170" value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" /></View>
                  <View style={a.half}><FormInput testID="reg-weight" label="Poids (kg)" placeholder="70" value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" /></View>
                </View>
                <Text style={a.label}>Groupe sanguin</Text>
                <View style={a.optRow}>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <TouchableOpacity key={b} testID={`blood-${b}`} style={[a.optBtnS, bloodType === b && a.optBtnA]} onPress={() => setBloodType(b)}><Text style={[a.optBtnST, bloodType === b && a.optBtnTA]}>{b}</Text></TouchableOpacity>)}
                </View>
              </>
            )}

            {step === 2 && role === 'beneficiary' && (
              <>
                <Text style={a.secTitle}>Informations médicales</Text>
                <FormInput testID="reg-allergies" label="Allergies connues" placeholder="Ex: pénicilline, arachides..." value={allergies} onChangeText={setAllergies} multiline />
                <FormInput testID="reg-conditions" label="Pathologies" placeholder="Ex: diabète, hypertension..." value={medicalConditions} onChangeText={setMedicalConditions} multiline />
                <FormInput testID="reg-doctor" label="Médecin traitant" placeholder="Dr. Dupont" value={doctorName} onChangeText={setDoctorName} />
                <Text style={a.secTitle}>Contact d'urgence</Text>
                <FormInput testID="reg-ec-name" label="Nom du contact" placeholder="Marie Dupont" value={emergencyContactName} onChangeText={setEmergencyContactName} />
                <FormInput testID="reg-ec-phone" label="Téléphone urgence" placeholder="06 98 76 54 32" value={emergencyContactPhone} onChangeText={setEmergencyContactPhone} keyboardType="phone-pad" />
              </>
            )}

            {step === 1 && role === 'guardian' && (
              <>
                <Text style={a.secTitle}>Type de gardien</Text>
                <View style={a.optRow}>
                  {[{id:'particular',l:'Particulier'},{id:'professional',l:'Professionnel'}].map(t => (
                    <TouchableOpacity key={t.id} testID={`gtype-${t.id}`} style={[a.optBtn, guardianType === t.id && a.optBtnA]} onPress={() => setGuardianType(t.id)}>
                      <Text style={[a.optBtnT, guardianType === t.id && a.optBtnTA]}>{t.l}</Text></TouchableOpacity>
                  ))}
                </View>
                {guardianType === 'particular' && <FormInput testID="reg-relationship" label="Lien avec le bénéficiaire" placeholder="Fils, fille, voisin..." value={relationship} onChangeText={setRelationship} />}
                {guardianType === 'professional' && (
                  <>
                    <FormInput testID="reg-structure" label="Nom de la structure" placeholder="SAAD Exemple" value={structureName} onChangeText={setStructureName} />
                    <FormInput testID="reg-siret" label="N° SIRET" placeholder="123 456 789 00001" value={siret} onChangeText={setSiret} keyboardType="numeric" />
                    <FormInput testID="reg-profession" label="Profession" placeholder="Aide-soignant, infirmier..." value={profession} onChangeText={setProfession} />
                  </>
                )}
              </>
            )}

            {step === 2 && role === 'guardian' && (
              <>
                <Text style={a.secTitle}>Mode prescripteur (optionnel)</Text>
                <Text style={a.desc}>Si vous avez un code d'activation, entrez-le pour activer le mode prescripteur.</Text>
                <FormInput testID="reg-presc-code" label="Code d'activation" placeholder="Ex: SAAD1234" value={prescriberCode} onChangeText={setPrescriberCode} autoCapitalize="characters" />
              </>
            )}

            {step === 1 && (role === 'teleassistance' || role === 'admin') && (
              <>
                <Text style={a.secTitle}>Informations complémentaires</Text>
                <FormInput testID="reg-address" label="Adresse / Lieu de travail" placeholder="Siège social" value={address} onChangeText={setAddress} />
              </>
            )}

            <View style={a.navRow}>
              {step > 0 && <TouchableOpacity testID="prev-step" style={a.prevBtn} onPress={() => setStep(step - 1)}>
                <Ionicons name="chevron-back" size={16} color={Colors.textSecondary} /><Text style={a.prevT}>Retour</Text></TouchableOpacity>}
              <View style={{flex:1}} />
              {step < totalSteps - 1 ? (
                <TouchableOpacity testID="next-step" style={a.nextBtn} onPress={() => {
                  if (step === 0 && (!name || !email || !password)) return setError('Remplissez les champs requis');
                  setError(''); setStep(step + 1);
                }}><Text style={a.nextT}>Suivant</Text><Ionicons name="chevron-forward" size={16} color="#FFF" /></TouchableOpacity>
              ) : (
                <TouchableOpacity testID="auth-submit-btn" style={[a.btn, submitting && a.btnD]} onPress={handleSubmit} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={a.btnT}>S'inscrire</Text>}</TouchableOpacity>
              )}
            </View>
          </ScrollView>
    </SafeAreaView>
  );
}

const a = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: Colors.background },
  loadC: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  sc: { paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 24 },
  appName: { fontSize: 32, fontWeight: '900', color: Colors.textPrimary, letterSpacing: 4 },
  subtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 4, letterSpacing: 0.5 },
  tabs: { flexDirection: 'row', backgroundColor: Colors.subtle, borderRadius: 12, padding: 3, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabA: { backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.border },
  tabT: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  tabTA: { color: Colors.textPrimary },
  prog: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginBottom: 4 },
  progDot: { width: 28, height: 3, borderRadius: 2, backgroundColor: Colors.border },
  stepL: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginBottom: 16 },
  err: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.destructive + '08', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 12, gap: 6 },
  errT: { fontSize: 12, color: Colors.destructive, flex: 1 },
  secTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12, letterSpacing: -0.3 },
  desc: { fontSize: 12, color: Colors.textMuted, marginBottom: 12, lineHeight: 17 },
  fieldWrap: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, marginBottom: 4, marginLeft: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  inpC: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.subtle, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, minHeight: 46 },
  inp: { flex: 1, fontSize: 14, color: Colors.textPrimary, paddingVertical: 10 },
  eye: { padding: 5 },
  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  roleC: { width: '47%', paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', backgroundColor: Colors.subtle, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border },
  roleCA: { borderColor: Colors.primary, backgroundColor: Colors.primary + '05' },
  roleT: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, marginTop: 4 },
  roleTA: { color: Colors.textPrimary },
  roleD: { fontSize: 10, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  optRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  optBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.subtle },
  optBtnS: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.subtle },
  optBtnA: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  optBtnT: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  optBtnST: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  optBtnTA: { color: Colors.textPrimary },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  navRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  prevBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, backgroundColor: Colors.subtle },
  prevT: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, backgroundColor: Colors.primary },
  nextT: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  btn: { backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center' },
  btnD: { opacity: 0.7 },
  btnT: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
