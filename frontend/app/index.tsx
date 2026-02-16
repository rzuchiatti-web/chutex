import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { Radius, Space, Type, CardStyle } from '../src/constants/colors';

const C = '#E8773A'; // Primary orange
const BG = '#EDF0F4';
const shadow = Platform.OS === 'web' ? { boxShadow: '0 2px 20px rgba(0,0,0,0.05)' } : {};

const WebInput = ({ testID, label, val, onChange, placeholder, type }: any) => {
  if (Platform.OS === 'web') {
    return (
      <div style={{ marginBottom: 16 }}>
        {label && <div style={{ fontSize: 12, fontWeight: '600', color: '#9BA3AD', marginBottom: 8, letterSpacing: 0.2 }}>{label}</div>}
        <input data-testid={testID} type={type || 'text'} value={val} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: '100%', fontSize: 16, fontFamily: 'system-ui', fontWeight: '400', padding: '16px 18px', borderRadius: 18, border: 'none', background: '#FFFFFF', color: '#1A1D21', boxSizing: 'border-box' as any, boxShadow: '0 1px 8px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.04)', outline: 'none', transition: 'box-shadow 0.2s ease' } as any}
          onFocus={(e: any) => e.target.style.boxShadow = '0 2px 16px rgba(232,119,58,0.12), inset 0 0 0 1.5px rgba(232,119,58,0.3)'}
          onBlur={(e: any) => e.target.style.boxShadow = '0 1px 8px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.04)'} />
      </div>
    );
  }
  const { TextInput: RNTextInput } = require('react-native');
  return (
    <View style={{ marginBottom: 16 }}>
      {label && <Text style={{ fontSize: 12, fontWeight: '600', color: '#9BA3AD', marginBottom: 8 }}>{label}</Text>}
      <RNTextInput testID={testID} value={val} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#C5CAD0"
        secureTextEntry={type === 'password'} autoCapitalize="none" keyboardType={type === 'email' ? 'email-address' : type === 'tel' ? 'phone-pad' : 'default'}
        style={{ fontSize: 16, padding: 16, borderRadius: 18, backgroundColor: '#FFF', color: '#1A1D21', ...CardStyle }} />
    </View>
  );
};

export default function AuthScreen() {
  const { user, loading, login, register } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medConditions, setMedConditions] = useState('');
  const [ecName, setEcName] = useState('');
  const [ecPhone, setEcPhone] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [guardianType, setGuardianType] = useState('particular');
  const [relationship, setRelationship] = useState('');
  const [structureName, setStructureName] = useState('');
  const [profession, setProfession] = useState('');
  const [siret, setSiret] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const hasRedirected = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    if (!loading && user && !hasRedirected.current) { hasRedirected.current = true; router.replace('/(tabs)'); }
    if (!loading && !user) hasRedirected.current = false;
  }, [user, loading]);
  useEffect(() => { Animated.parallel([
    Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
    Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
  ]).start(); }, []);

  if (loading || user) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG }}><ActivityIndicator size="large" color={C} /></View>;

  const handleLogin = async () => {
    setError('');
    if (!email || !password) return setError('Identifiant et mot de passe requis');
    setSubmitting(true);
    try {
      let id = email.trim();
      if (!id.includes('@') && !id.startsWith('+') && id.startsWith('0') && id.length >= 10) id = '+33' + id.substring(1).replace(/\s/g, '');
      await login(id.toLowerCase(), password);
      hasRedirected.current = true; router.replace('/(tabs)');
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setSubmitting(false); }
  };
  const handleRegister = async () => {
    setError('');
    if (!name || !email || !password) return setError('Remplissez tous les champs');
    if (!role) return setError('Choisissez un espace');
    setSubmitting(true);
    try {
      await register({ email: email.trim().toLowerCase(), password, name, phone, role, date_of_birth: dob, gender, address, height_cm: heightCm ? parseFloat(heightCm) : undefined, weight_kg: weightKg ? parseFloat(weightKg) : undefined, blood_type: bloodType, allergies, medical_conditions: medConditions, emergency_contact_name: ecName, emergency_contact_phone: ecPhone, doctor_name: doctorName, guardian_type: guardianType, structure_name: structureName, siret, profession, relationship });
      hasRedirected.current = true; router.replace('/(tabs)');
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setSubmitting(false); }
  };

  const Btn = ({ testID, label, onPress, loading: ld, outline }: any) => (
    <TouchableOpacity testID={testID} disabled={ld} onPress={onPress} activeOpacity={0.8}
      style={[{ paddingVertical: 17, borderRadius: Radius.full, alignItems: 'center' }, outline ? { backgroundColor: '#F2F4F7', flex: 1 } : { backgroundColor: C, ...(Platform.OS === 'web' ? { boxShadow: '0 4px 20px rgba(232,119,58,0.3)' } : {}) }]}>
      {ld ? <ActivityIndicator color={outline ? '#9BA3AD' : '#FFF'} /> : <Text style={{ color: outline ? '#5A6068' : '#FFF', fontSize: 16, fontWeight: '700' }}>{label}</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1, maxWidth: 420, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          <View style={{ alignItems: 'center', marginTop: 52, marginBottom: 44 }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: C, justifyContent: 'center', alignItems: 'center', marginBottom: 18, ...(Platform.OS === 'web' ? { boxShadow: '0 6px 28px rgba(232,119,58,0.25)' } : {}) }}>
              <Ionicons name="shield-checkmark" size={28} color="#FFF" />
            </View>
            <Text style={{ fontSize: 30, fontWeight: '800', color: '#1A1D21', letterSpacing: 5 }}>CHUTEX</Text>
            <Text style={{ fontSize: 12, fontWeight: '500', color: C, marginTop: 4, letterSpacing: 3 }}>HEALTH</Text>
          </View>

          {/* Card container */}
          <View style={{ ...CardStyle, padding: 24, marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', marginBottom: 24, backgroundColor: '#F2F4F7', borderRadius: Radius.full, padding: 3 }}>
              <TouchableOpacity testID="auth-tab-login" style={[{ flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: Radius.full }, isLogin && { backgroundColor: '#FFF', ...shadow }]} onPress={() => { setIsLogin(true); setStep(0); }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: isLogin ? '#1A1D21' : '#9BA3AD' }}>Connexion</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="auth-tab-register" style={[{ flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: Radius.full }, !isLogin && { backgroundColor: '#FFF', ...shadow }]} onPress={() => { setIsLogin(false); setStep(0); }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: !isLogin ? '#1A1D21' : '#9BA3AD' }}>Inscription</Text>
              </TouchableOpacity>
            </View>

            {error ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: Radius.md, padding: 14, marginBottom: 16 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' }} />
              <Text style={{ fontSize: 13, color: '#EF4444', flex: 1 }}>{error}</Text>
            </View> : null}

            {isLogin && (<>
              <WebInput testID="reg-email" label="Email ou telephone" val={email} onChange={setEmail} placeholder="email@exemple.com" />
              <WebInput testID="auth-input-password" label="Mot de passe" val={password} onChange={setPassword} placeholder="Mot de passe" type={showPw ? 'text' : 'password'} />
              <View style={{ height: 4 }} />
              <Btn testID="auth-submit-btn" label="Se connecter" onPress={handleLogin} loading={submitting} />
            </>)}

            {!isLogin && (<>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
                {[0, 1, 2].map(i => <View key={i} style={{ width: i <= step ? 28 : 8, height: 4, borderRadius: 2, backgroundColor: i <= step ? C : '#E5E7EB' }} />)}
              </View>
              {step === 0 && (<>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#1A1D21', marginBottom: 20 }}>Informations generales</Text>
                <WebInput testID="reg-name" label="Nom complet" val={name} onChange={setName} placeholder="Jean Dupont" />
                <WebInput testID="reg-email" label="Email" val={email} onChange={setEmail} placeholder="email@exemple.com" type="email" />
                <WebInput testID="reg-phone" label="Telephone" val={phone} onChange={setPhone} placeholder="06 12 34 56 78" type="tel" />
                <WebInput testID="reg-password" label="Mot de passe" val={password} onChange={setPassword} placeholder="Min. 6 caracteres" type={showPw ? 'text' : 'password'} />
                <Btn testID="next-step" label="Suivant" onPress={() => { if (!name || !email || !password) return setError('Remplissez tous les champs'); setError(''); setStep(1); }} />
              </>)}
              {step === 1 && (<>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#1A1D21', textAlign: 'center', marginBottom: 4 }}>Votre profil</Text>
                <Text style={{ fontSize: 13, color: '#9BA3AD', textAlign: 'center', marginBottom: 20 }}>Selectionnez votre usage</Text>
                {[{ r: 'beneficiary', icon: 'person-outline', t: 'Beneficiaire', d: 'Porteur de dispositifs de sante Chutex' },
                  { r: 'guardian', icon: 'people-outline', t: 'Gardien', d: 'Aidant ou professionnel accompagnant un proche' }].map(o => (
                  <TouchableOpacity key={o.r} activeOpacity={0.7} onPress={() => { setRole(o.r); setStep(2); }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18, borderRadius: Radius.lg, marginBottom: 10, backgroundColor: role === o.r ? '#FFF3EC' : '#F7F8FA', borderWidth: 1.5, borderColor: role === o.r ? C : 'transparent' }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: role === o.r ? C : '#E5E7EB', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name={o.icon as any} size={22} color={role === o.r ? '#FFF' : '#9BA3AD'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1D21' }}>{o.t}</Text>
                      <Text style={{ fontSize: 12, color: '#9BA3AD', marginTop: 2 }}>{o.d}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#C5CAD0" />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 12 }} onPress={() => setStep(0)}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#9BA3AD' }}>Retour</Text>
                </TouchableOpacity>
              </>)}
              {step === 2 && role === 'beneficiary' && (<>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#1A1D21', marginBottom: 20 }}>Profil beneficiaire</Text>
                <WebInput label="Date de naissance" val={dob} onChange={setDob} placeholder="JJ/MM/AAAA" />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#9BA3AD', marginBottom: 8 }}>Genre</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  {['Homme', 'Femme', 'Autre'].map(g => <TouchableOpacity key={g} style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: Radius.full, backgroundColor: gender === g ? C : '#F2F4F7' }} onPress={() => setGender(g)}><Text style={{ fontSize: 13, fontWeight: '600', color: gender === g ? '#FFF' : '#9BA3AD' }}>{g}</Text></TouchableOpacity>)}
                </View>
                <WebInput label="Adresse" val={address} onChange={setAddress} placeholder="14 rue de la Republique" />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}><WebInput label="Taille (cm)" val={heightCm} onChange={setHeightCm} placeholder="170" /></View>
                  <View style={{ flex: 1 }}><WebInput label="Poids (kg)" val={weightKg} onChange={setWeightKg} placeholder="70" /></View>
                </View>
                <WebInput label="Allergies" val={allergies} onChange={setAllergies} placeholder="Penicilline, arachides..." />
                <WebInput label="Pathologies" val={medConditions} onChange={setMedConditions} placeholder="Diabete, hypertension..." />
                <WebInput label="Medecin" val={doctorName} onChange={setDoctorName} placeholder="Dr. Dupont" />
                <WebInput label="Contact urgence" val={ecName} onChange={setEcName} placeholder="Marie Dupont" />
                <WebInput label="Tel. urgence" val={ecPhone} onChange={setEcPhone} placeholder="06 98 76 54 32" type="tel" />
              </>)}
              {step === 2 && role === 'guardian' && (<>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#1A1D21', marginBottom: 20 }}>Profil gardien</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                  {[{ id: 'particular', l: 'Particulier' }, { id: 'professional', l: 'Professionnel' }].map(t => (
                    <TouchableOpacity key={t.id} style={{ flex: 1, paddingVertical: 13, borderRadius: Radius.md, backgroundColor: guardianType === t.id ? C : '#F2F4F7', alignItems: 'center' }} onPress={() => setGuardianType(t.id)}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: guardianType === t.id ? '#FFF' : '#9BA3AD' }}>{t.l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {guardianType === 'particular' && <WebInput label="Lien" val={relationship} onChange={setRelationship} placeholder="Fils, fille, voisin..." />}
                {guardianType === 'professional' && (<>
                  <WebInput label="Structure" val={structureName} onChange={setStructureName} placeholder="SAAD Exemple" />
                  <WebInput label="SIRET" val={siret} onChange={setSiret} placeholder="123 456 789 00001" />
                  <WebInput label="Profession" val={profession} onChange={setProfession} placeholder="Aide-soignant..." />
                </>)}
              </>)}
              {step === 2 && (
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                  <Btn label="Retour" onPress={() => setStep(1)} outline />
                  <View style={{ flex: 2 }}><Btn testID="auth-submit-btn" label="S'inscrire" onPress={handleRegister} loading={submitting} /></View>
                </View>
              )}
            </>)}
          </View>

          <Text style={{ fontSize: 11, color: '#C5CAD0', textAlign: 'center', marginTop: 12 }}>Chutex Innovation - v1.0.5</Text>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}
