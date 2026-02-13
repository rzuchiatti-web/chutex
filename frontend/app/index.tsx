import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';

const ROLES = [
  { id: 'beneficiary', label: 'Beneficiaire', icon: 'heart-outline', desc: 'Je porte un bracelet ou gilet connecte' },
  { id: 'guardian', label: 'Gardien', icon: 'shield-checkmark-outline', desc: 'Je surveille un proche ou un patient' },
];

const FormInput = React.memo(({ testID, label, placeholder, value, onChangeText, keyboardType, secureTextEntry, autoCapitalize, multiline, rightElement, colors }: any) => {
  if (Platform.OS === 'web') {
    const inputType = secureTextEntry ? 'password' : keyboardType === 'email-address' ? 'email' : keyboardType === 'phone-pad' ? 'tel' : 'text';
    return (
      <div style={{ marginBottom: 16 }}>
        {label ? <div style={{ fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 6, marginLeft: 2, textTransform: 'uppercase' as any, letterSpacing: 1 }}>{label}</div> : null}
        <div style={{ display: 'flex', flexDirection: 'row' as any, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.65)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.8)', paddingLeft: 16, paddingRight: 16, minHeight: 52, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
          <input data-testid={testID} type={inputType}
            style={{ flex: 1, fontSize: 15, color: '#000', border: 'none', outline: 'none', background: 'transparent', padding: '14px 0', fontFamily: 'system-ui, -apple-system, sans-serif', width: '100%' }}
            placeholder={placeholder || label} value={value || ''} onChange={(e: any) => onChangeText(e.target.value)} />
          {rightElement}
        </div>
      </div>
    );
  }
  return (
    <View style={{ marginBottom: 16 }}>
      {label ? <Text style={{ fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 6, marginLeft: 2, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.65)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', paddingHorizontal: 16, minHeight: 52 }}>
        <TextInput testID={testID} style={{ flex: 1, fontSize: 15, color: '#000', paddingVertical: 14 }} placeholder={placeholder || label} placeholderTextColor="#999" value={value} onChangeText={onChangeText} keyboardType={keyboardType || 'default'} secureTextEntry={secureTextEntry} autoCapitalize={autoCapitalize || 'sentences'} multiline={multiline} />
        {rightElement}
      </View>
    </View>
  );
});

export default function AuthScreen() {
  const { user, loading, login, register } = useAuth();
  const { colors } = useTheme();
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
    if (!loading && user && !hasRedirected.current) { hasRedirected.current = true; router.replace('/(tabs)'); }
    if (!loading && !user) hasRedirected.current = false;
  }, [user, loading]);

  if (loading || user) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}><ActivityIndicator size="large" color="#000" /></View>;

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
      if (isLogin) { await login(loginId.toLowerCase(), password); }
      else {
        await register({ email: email.trim().toLowerCase(), password, name, phone, role, date_of_birth: dateOfBirth, gender, address, height_cm: heightCm ? parseFloat(heightCm) : undefined, weight_kg: weightKg ? parseFloat(weightKg) : undefined, blood_type: bloodType, allergies, medical_conditions: medicalConditions, emergency_contact_name: emergencyContactName, emergency_contact_phone: emergencyContactPhone, doctor_name: doctorName, guardian_type: guardianType, structure_name: structureName, siret, profession, relationship, prescriber_code: prescriberCode });
      }
      hasRedirected.current = true; router.replace('/(tabs)');
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setSubmitting(false); }
  };

  const totalSteps = role === 'beneficiary' ? 3 : 3;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1, maxWidth: 480, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ alignItems: 'center', marginTop: 40, marginBottom: 36 }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000', marginBottom: 16, ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)' } : {}) }}>
            <Ionicons name="shield-checkmark" size={28} color="#000" />
          </View>
          <Text style={{ fontSize: 36, fontWeight: '900', color: '#000', letterSpacing: 6 }}>CHUTEX</Text>
          <Text style={{ fontSize: 13, color: '#888', marginTop: 6, letterSpacing: 1 }}>Teleassistance intelligente</Text>
          <View style={{ width: 40, height: 2, backgroundColor: '#000', borderRadius: 1, marginTop: 12 }} />
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 14, padding: 4, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)', ...(Platform.OS === 'web' ? { backdropFilter: 'blur(16px)' } : {}) }}>
          <TouchableOpacity testID="auth-tab-login" style={[{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 11 }, isLogin && { backgroundColor: '#000' }]} onPress={() => setIsLogin(true)}>
            <Text style={[{ fontSize: 14, fontWeight: '700' }, isLogin ? { color: '#FFF' } : { color: '#888' }]}>Connexion</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="auth-tab-register" style={[{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 11 }, !isLogin && { backgroundColor: '#000' }]} onPress={() => { setIsLogin(false); setStep(0); }}>
            <Text style={[{ fontSize: 14, fontWeight: '700' }, !isLogin ? { color: '#FFF' } : { color: '#888' }]}>Inscription</Text>
          </TouchableOpacity>
        </View>

        {error ? <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEBEE', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginBottom: 16, gap: 8, borderWidth: 1, borderColor: 'rgba(229,57,53,0.2)' }}><Ionicons name="alert-circle" size={16} color="#E53935" /><Text style={{ fontSize: 13, color: '#E53935', flex: 1 }}>{error}</Text></View> : null}

        {isLogin ? (
          <>
            <FormInput testID="reg-email" label="Email ou telephone" placeholder="email@exemple.com ou 06 12 34 56 78" value={email} onChangeText={setEmail} autoCapitalize="none" colors={colors} />
            <FormInput testID="auth-input-password" label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry={!showPw} colors={colors} rightElement={<TouchableOpacity onPress={() => setShowPw(!showPw)} style={{ padding: 6 }}><Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color="#888" /></TouchableOpacity>} />
            <TouchableOpacity testID="auth-submit-btn" style={{ backgroundColor: '#000', paddingVertical: 16, borderRadius: 9999, alignItems: 'center', marginTop: 8 }} onPress={handleSubmit} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>Se connecter</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 6 }}>{Array.from({ length: totalSteps }).map((_, i) => <View key={i} style={{ width: 32, height: 3, borderRadius: 2, backgroundColor: i <= step ? '#000' : '#DDD' }} />)}</View>
            <Text style={{ fontSize: 11, color: '#888', textAlign: 'center', marginBottom: 20 }}>Etape {step + 1} / {totalSteps}</Text>

            {step === 0 && (
              <>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#000', marginBottom: 16 }}>Choisissez votre profil</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                  {ROLES.map(r => (
                    <TouchableOpacity key={r.id} testID={`role-${r.id}`} style={[{ width: '47%', paddingVertical: 16, paddingHorizontal: 10, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 14, borderWidth: 2, borderColor: role === r.id ? '#000' : 'rgba(255,255,255,0.8)' }, role === r.id && { backgroundColor: 'rgba(0,0,0,0.05)' }]} onPress={() => setRole(r.id)}>
                      <Ionicons name={r.icon as any} size={22} color={role === r.id ? '#000' : '#888'} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: role === r.id ? '#000' : '#888', marginTop: 6 }}>{r.label}</Text>
                      <Text style={{ fontSize: 10, color: '#888', marginTop: 2, textAlign: 'center' }}>{r.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <FormInput testID="reg-name" label="Nom complet" placeholder="Jean Dupont" value={name} onChangeText={setName} colors={colors} />
                <FormInput testID="reg-email" label="Email" placeholder="email@exemple.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" colors={colors} />
                <FormInput testID="reg-phone" label="Telephone" placeholder="06 12 34 56 78" value={phone} onChangeText={setPhone} keyboardType="phone-pad" colors={colors} />
                <FormInput testID="reg-password" label="Mot de passe" placeholder="Min. 6 caracteres" value={password} onChangeText={setPassword} secureTextEntry={!showPw} colors={colors} rightElement={<TouchableOpacity onPress={() => setShowPw(!showPw)} style={{ padding: 6 }}><Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color="#888" /></TouchableOpacity>} />
              </>
            )}

            {step === 1 && role === 'beneficiary' && (
              <>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#000', marginBottom: 16 }}>Informations personnelles</Text>
                <FormInput testID="reg-dob" label="Date de naissance" placeholder="JJ/MM/AAAA" value={dateOfBirth} onChangeText={setDateOfBirth} colors={colors} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Genre</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  {['Homme', 'Femme', 'Autre'].map(g => <TouchableOpacity key={g} testID={`gender-${g}`} style={{ paddingVertical: 10, paddingHorizontal: 18, borderRadius: 9999, borderWidth: 2, borderColor: gender === g ? '#000' : '#DDD', backgroundColor: gender === g ? 'rgba(0,0,0,0.05)' : 'transparent' }} onPress={() => setGender(g)}><Text style={{ fontSize: 14, fontWeight: '600', color: gender === g ? '#000' : '#888' }}>{g}</Text></TouchableOpacity>)}
                </View>
                <FormInput testID="reg-address" label="Adresse" value={address} onChangeText={setAddress} colors={colors} />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}><FormInput testID="reg-height" label="Taille (cm)" placeholder="170" value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" colors={colors} /></View>
                  <View style={{ flex: 1 }}><FormInput testID="reg-weight" label="Poids (kg)" placeholder="70" value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" colors={colors} /></View>
                </View>
              </>
            )}

            {step === 2 && role === 'beneficiary' && (
              <>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#000', marginBottom: 16 }}>Informations medicales</Text>
                <FormInput testID="reg-allergies" label="Allergies connues" value={allergies} onChangeText={setAllergies} multiline colors={colors} />
                <FormInput testID="reg-conditions" label="Pathologies" value={medicalConditions} onChangeText={setMedicalConditions} multiline colors={colors} />
                <FormInput testID="reg-doctor" label="Medecin traitant" value={doctorName} onChangeText={setDoctorName} colors={colors} />
                <FormInput testID="reg-ec-name" label="Contact d'urgence - Nom" value={emergencyContactName} onChangeText={setEmergencyContactName} colors={colors} />
                <FormInput testID="reg-ec-phone" label="Contact d'urgence - Tel" value={emergencyContactPhone} onChangeText={setEmergencyContactPhone} keyboardType="phone-pad" colors={colors} />
              </>
            )}

            {step === 1 && role === 'guardian' && (
              <>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#000', marginBottom: 16 }}>Type de gardien</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                  {[{ id: 'particular', l: 'Particulier' }, { id: 'professional', l: 'Professionnel' }].map(t => (
                    <TouchableOpacity key={t.id} testID={`gtype-${t.id}`} style={{ flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: guardianType === t.id ? '#000' : '#DDD', backgroundColor: guardianType === t.id ? 'rgba(0,0,0,0.05)' : 'transparent', alignItems: 'center' }} onPress={() => setGuardianType(t.id)}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: guardianType === t.id ? '#000' : '#888' }}>{t.l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {guardianType === 'particular' && <FormInput testID="reg-relationship" label="Lien" placeholder="Fils, fille..." value={relationship} onChangeText={setRelationship} colors={colors} />}
                {guardianType === 'professional' && (<><FormInput testID="reg-structure" label="Structure" value={structureName} onChangeText={setStructureName} colors={colors} /><FormInput testID="reg-siret" label="SIRET" value={siret} onChangeText={setSiret} keyboardType="numeric" colors={colors} /><FormInput testID="reg-profession" label="Profession" value={profession} onChangeText={setProfession} colors={colors} /></>)}
              </>
            )}
            {step === 2 && role === 'guardian' && (<><Text style={{ fontSize: 18, fontWeight: '800', color: '#000', marginBottom: 16 }}>Mode prescripteur</Text><FormInput testID="reg-presc-code" label="Code d'activation" placeholder="SAAD1234" value={prescriberCode} onChangeText={setPrescriberCode} autoCapitalize="characters" colors={colors} /></>)}


            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
              {step > 0 && <TouchableOpacity testID="prev-step" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: '#DDD' }} onPress={() => setStep(step - 1)}><Ionicons name="chevron-back" size={16} color="#000" /><Text style={{ fontSize: 14, fontWeight: '600', color: '#000' }}>Retour</Text></TouchableOpacity>}
              <View style={{ flex: 1 }} />
              {step < totalSteps - 1 ? (
                <TouchableOpacity testID="next-step" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 9999, backgroundColor: '#000' }} onPress={() => { if (step === 0 && (!name || !email || !password)) return setError('Remplissez les champs requis'); setError(''); setStep(step + 1); }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF' }}>Suivant</Text><Ionicons name="chevron-forward" size={16} color="#FFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity testID="auth-submit-btn" style={{ backgroundColor: '#000', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 9999 }} onPress={handleSubmit} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800', textTransform: 'uppercase' }}>S'inscrire</Text>}
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
