import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { Glass, Radius, Space, Type } from '../src/constants/colors';

const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: Radius.lg, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: Space.xl, marginBottom: Space.md, ...Glass }, style]}>{children}</View>
);
const WebInput = ({ testID, label, val, onChange, placeholder, type }: any) => {
  if (Platform.OS === 'web') {
    return (
      <div style={{ marginBottom: 16 }}>
        {label && <div style={{ fontSize: 11, fontWeight: '600', color: '#999', marginBottom: 8, letterSpacing: 0.3 }}>{label}</div>}
        <input data-testid={testID} type={type || 'text'} value={val} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: '100%', fontSize: 15, fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontWeight: '400', padding: '14px 16px', borderRadius: 14, border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.72)', color: '#000', boxSizing: 'border-box' as any, backdropFilter: 'blur(20px)', outline: 'none', transition: 'border-color 0.2s ease' }} onFocus={(e: any) => e.target.style.borderColor = 'rgba(0,0,0,0.2)'} onBlur={(e: any) => e.target.style.borderColor = 'rgba(0,0,0,0.06)'} />
      </div>
    );
  }
  const { TextInput: RNTextInput } = require('react-native');
  return (
    <View style={{ marginBottom: 16 }}>
      {label && <Text style={{ fontSize: 11, fontWeight: '600', color: '#999', marginBottom: 8, letterSpacing: 0.3 }}>{label}</Text>}
      <RNTextInput testID={testID} value={val} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#BBB"
        secureTextEntry={type === 'password'} autoCapitalize="none" keyboardType={type === 'email' ? 'email-address' : type === 'tel' ? 'phone-pad' : 'default'}
        style={{ fontSize: 15, fontWeight: '400', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', backgroundColor: 'rgba(255,255,255,0.72)', color: '#000' }} />
    </View>
  );
};

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

  useEffect(() => {
    if (!loading && user && !hasRedirected.current) { hasRedirected.current = true; router.replace('/(tabs)'); }
    if (!loading && !user) hasRedirected.current = false;
  }, [user, loading]);

  useEffect(() => { Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start(); }, []);

  if (loading || user) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F8F8' }}><ActivityIndicator size="large" color="#000" /></View>;

  const handleLogin = async () => {
    setError('');
    if (!email || !password) return setError('Identifiant et mot de passe requis');
    setSubmitting(true);
    try {
      let loginId = email.trim();
      if (!loginId.includes('@') && !loginId.startsWith('+')) {
        if (loginId.startsWith('0') && loginId.length >= 10) loginId = '+33' + loginId.substring(1).replace(/\s/g, '');
      }
      await login(loginId.toLowerCase(), password);
      hasRedirected.current = true; router.replace('/(tabs)');
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setSubmitting(false); }
  };

  const handleRegister = async () => {
    setError('');
    if (!name || !email || !password) return setError('Remplissez tous les champs');
    if (!role) return setError('Choisissez un espace');
    setSubmitting(true);
    try {
      await register({
        email: email.trim().toLowerCase(), password, name, phone, role,
        date_of_birth: dob, gender, address, height_cm: heightCm ? parseFloat(heightCm) : undefined,
        weight_kg: weightKg ? parseFloat(weightKg) : undefined, blood_type: bloodType,
        allergies, medical_conditions: medConditions, emergency_contact_name: ecName,
        emergency_contact_phone: ecPhone, doctor_name: doctorName,
        guardian_type: guardianType, structure_name: structureName, siret, profession, relationship,
      });
      hasRedirected.current = true; router.replace('/(tabs)');
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setSubmitting(false); }
  };

  const PillBtn = ({ testID, label, onPress, disabled, loading: ld, secondary }: any) => (
    <TouchableOpacity testID={testID} disabled={disabled || ld}
      style={{ backgroundColor: secondary ? 'rgba(0,0,0,0.04)' : '#000', paddingVertical: 16, borderRadius: Radius.full, alignItems: 'center', flex: secondary ? 1 : undefined }}
      onPress={onPress} activeOpacity={0.7}>
      {ld ? <ActivityIndicator color={secondary ? '#000' : '#FFF'} /> : <Text style={{ color: secondary ? '#999' : '#FFF', ...Type.button }}>{label}</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F8F8' }}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1, maxWidth: 440, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={{ alignItems: 'center', marginTop: 48, marginBottom: 40 }}>
            <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="shield-checkmark" size={24} color="#FFF" />
            </View>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#000', letterSpacing: 4 }}>CHUTEX</Text>
            <Text style={{ fontSize: 11, fontWeight: '400', color: '#999', marginTop: 6, letterSpacing: 2 }}>HEALTH</Text>
          </View>

          {/* Login/Register tabs */}
          <View style={{ flexDirection: 'row', padding: 3, marginBottom: 28, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: Radius.md }}>
            <TouchableOpacity testID="auth-tab-login" style={[{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: Radius.sm }, isLogin && { backgroundColor: '#000' }]} onPress={() => { setIsLogin(true); setStep(0); }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: isLogin ? '#FFF' : '#999' }}>Connexion</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="auth-tab-register" style={[{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: Radius.sm }, !isLogin && { backgroundColor: '#000' }]} onPress={() => { setIsLogin(false); setStep(0); }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: !isLogin ? '#FFF' : '#999' }}>Inscription</Text>
            </TouchableOpacity>
          </View>

          {error ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,59,48,0.06)', borderRadius: Radius.md, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,59,48,0.1)' }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FF3B30' }} />
            <Text style={{ fontSize: 13, color: '#FF3B30', flex: 1, fontWeight: '500' }}>{error}</Text>
          </View> : null}

          {/* LOGIN */}
          {isLogin && (<>
            <WebInput testID="reg-email" label="Email ou telephone" val={email} onChange={setEmail} placeholder="email@exemple.com ou 06 12 34 56 78" />
            <WebInput testID="auth-input-password" label="Mot de passe" val={password} onChange={setPassword} placeholder="Mot de passe" type={showPw ? 'text' : 'password'} />
            <PillBtn testID="auth-submit-btn" label="Se connecter" onPress={handleLogin} loading={submitting} />
          </>)}

          {/* REGISTER */}
          {!isLogin && (<>
            {/* Progress dots */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
              {[0, 1, 2].map(i => <View key={i} style={{ width: i <= step ? 28 : 8, height: 4, borderRadius: 2, backgroundColor: i <= step ? '#000' : 'rgba(0,0,0,0.08)', transition: 'all 0.3s ease' } as any} />)}
            </View>

            {step === 0 && (<>
              <Text style={{ ...Type.h2, color: '#000', marginBottom: 20 }}>Informations generales</Text>
              <WebInput testID="reg-name" label="Nom complet" val={name} onChange={setName} placeholder="Jean Dupont" />
              <WebInput testID="reg-email" label="Email" val={email} onChange={setEmail} placeholder="email@exemple.com" type="email" />
              <WebInput testID="reg-phone" label="Telephone" val={phone} onChange={setPhone} placeholder="06 12 34 56 78" type="tel" />
              <WebInput testID="reg-password" label="Mot de passe" val={password} onChange={setPassword} placeholder="Min. 6 caracteres" type={showPw ? 'text' : 'password'} />
              <PillBtn testID="next-step" label="Suivant" onPress={() => { if (!name || !email || !password) return setError('Remplissez tous les champs'); setError(''); setStep(1); }} />
            </>)}

            {step === 1 && (<>
              <Text style={{ ...Type.h2, color: '#000', textAlign: 'center', marginBottom: 4 }}>Inscription</Text>
              <Text style={{ ...Type.caption, color: '#999', textAlign: 'center', marginBottom: 24 }}>Selectionnez votre mode d'utilisation</Text>

              <TouchableOpacity activeOpacity={0.7} onPress={() => { setRole('beneficiary'); setStep(2); }}>
                <GlassCard style={{ alignItems: 'center', padding: 28, borderWidth: role === 'beneficiary' ? 2 : 1, borderColor: role === 'beneficiary' ? '#000' : 'rgba(0,0,0,0.06)' }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
                    <Ionicons name="person-outline" size={22} color="#FFF" />
                  </View>
                  <Text style={{ ...Type.h3, color: '#000', marginBottom: 6 }}>Beneficiaire</Text>
                  <Text style={{ ...Type.bodySmall, color: '#999', textAlign: 'center' }}>Vous souhaitez utiliser ou porter les dispositifs de sante de Chutex.</Text>
                </GlassCard>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7} onPress={() => { setRole('guardian'); setStep(2); }}>
                <GlassCard style={{ alignItems: 'center', padding: 28, borderWidth: role === 'guardian' ? 2 : 1, borderColor: role === 'guardian' ? '#000' : 'rgba(0,0,0,0.06)' }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
                    <Ionicons name="people-outline" size={22} color="#FFF" />
                  </View>
                  <Text style={{ ...Type.h3, color: '#000', marginBottom: 6 }}>Gardien</Text>
                  <Text style={{ ...Type.bodySmall, color: '#999', textAlign: 'center' }}>Vous etes un aidant ou professionnel souhaitant accompagner un beneficiaire.</Text>
                </GlassCard>
              </TouchableOpacity>

              <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 12 }} onPress={() => setStep(0)}>
                <Text style={{ ...Type.bodySmall, fontWeight: '600', color: '#999' }}>Retour</Text>
              </TouchableOpacity>
            </>)}

            {step === 2 && role === 'beneficiary' && (<>
              <Text style={{ ...Type.h2, color: '#000', marginBottom: 20 }}>Informations beneficiaire</Text>
              <WebInput label="Date de naissance" val={dob} onChange={setDob} placeholder="JJ/MM/AAAA" />
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#999', marginBottom: 8, letterSpacing: 0.3 }}>Genre</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {['Homme', 'Femme', 'Autre'].map(g => <TouchableOpacity key={g} style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: Radius.full, borderWidth: 1.5, borderColor: gender === g ? '#000' : 'rgba(0,0,0,0.08)', backgroundColor: gender === g ? '#000' : 'transparent' }} onPress={() => setGender(g)}><Text style={{ fontSize: 13, fontWeight: '600', color: gender === g ? '#FFF' : '#999' }}>{g}</Text></TouchableOpacity>)}
              </View>
              <WebInput label="Adresse" val={address} onChange={setAddress} placeholder="14 rue de la Republique, Saint-Chamond" />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}><WebInput label="Taille (cm)" val={heightCm} onChange={setHeightCm} placeholder="170" type="number" /></View>
                <View style={{ flex: 1 }}><WebInput label="Poids (kg)" val={weightKg} onChange={setWeightKg} placeholder="70" type="number" /></View>
              </View>
              <WebInput label="Allergies" val={allergies} onChange={setAllergies} placeholder="Penicilline, arachides..." />
              <WebInput label="Pathologies" val={medConditions} onChange={setMedConditions} placeholder="Diabete, hypertension..." />
              <WebInput label="Medecin traitant" val={doctorName} onChange={setDoctorName} placeholder="Dr. Dupont" />
              <WebInput label="Contact urgence - Nom" val={ecName} onChange={setEcName} placeholder="Marie Dupont" />
              <WebInput label="Contact urgence - Tel" val={ecPhone} onChange={setEcPhone} placeholder="06 98 76 54 32" type="tel" />
            </>)}

            {step === 2 && role === 'guardian' && (<>
              <Text style={{ ...Type.h2, color: '#000', marginBottom: 20 }}>Informations gardien</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                {[{ id: 'particular', l: 'Particulier' }, { id: 'professional', l: 'Professionnel' }].map(t => (
                  <TouchableOpacity key={t.id} style={{ flex: 1, paddingVertical: 14, borderRadius: Radius.md, borderWidth: 1.5, borderColor: guardianType === t.id ? '#000' : 'rgba(0,0,0,0.08)', backgroundColor: guardianType === t.id ? '#000' : 'transparent', alignItems: 'center' }} onPress={() => setGuardianType(t.id)}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: guardianType === t.id ? '#FFF' : '#999' }}>{t.l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {guardianType === 'particular' && <WebInput label="Lien" val={relationship} onChange={setRelationship} placeholder="Fils, fille, voisin..." />}
              {guardianType === 'professional' && (<>
                <WebInput label="Structure / Societe" val={structureName} onChange={setStructureName} placeholder="SAAD Exemple" />
                <WebInput label="SIRET" val={siret} onChange={setSiret} placeholder="123 456 789 00001" type="number" />
                <WebInput label="Profession" val={profession} onChange={setProfession} placeholder="Aide-soignant, infirmier..." />
              </>)}
            </>)}

            {step === 2 && (
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                <PillBtn label="Retour" onPress={() => setStep(1)} secondary />
                <TouchableOpacity testID="auth-submit-btn" style={{ flex: 2, backgroundColor: '#000', paddingVertical: 16, borderRadius: Radius.full, alignItems: 'center' }} onPress={handleRegister} disabled={submitting} activeOpacity={0.7}>
                  {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', ...Type.button }}>S'inscrire</Text>}
                </TouchableOpacity>
              </View>
            )}
          </>)}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}
