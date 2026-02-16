import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Animated, Image, ImageBackground, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { Radius } from '../src/constants/colors';

const { height: SCREEN_H } = Dimensions.get('window');
const BG_IMAGE = 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/banner_login_mobile.jpg?v=1771242072';

const GlassInput = ({ testID, label, val, onChange, placeholder, type }: any) => {
  if (Platform.OS === 'web') {
    return (
      <div style={{ marginBottom: 16 }}>
        {label && <div style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginBottom: 8, letterSpacing: 0.3 }}>{label}</div>}
        <input data-testid={testID} type={type || 'text'} value={val} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
          style={{
            width: '100%', fontSize: 16, fontFamily: 'system-ui, -apple-system, sans-serif', fontWeight: '500',
            padding: '16px 20px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.25)',
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            color: '#FFFFFF', boxSizing: 'border-box' as any, outline: 'none',
            transition: 'border-color 0.2s ease, background 0.2s ease',
          } as any}
          onFocus={(e: any) => { e.target.style.borderColor = 'rgba(255,255,255,0.5)'; e.target.style.background = 'rgba(255,255,255,0.22)'; }}
          onBlur={(e: any) => { e.target.style.borderColor = 'rgba(255,255,255,0.25)'; e.target.style.background = 'rgba(255,255,255,0.15)'; }}
        />
      </div>
    );
  }
  const { TextInput: RNTextInput } = require('react-native');
  return (
    <View style={{ marginBottom: 16 }}>
      {label && <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFF', marginBottom: 8, letterSpacing: 0.3 }}>{label}</Text>}
      <RNTextInput testID={testID} value={val} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.50)" secureTextEntry={type === 'password'}
        autoCapitalize="none" keyboardType={type === 'email' ? 'email-address' : type === 'tel' ? 'phone-pad' : 'default'}
        style={{ fontSize: 16, paddingVertical: 16, paddingHorizontal: 20, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.15)', color: '#FFF', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }} />
    </View>
  );
};

export default function AuthScreen() {
  const { user, loading, login, register } = useAuth();
  const { colors, isDark } = useTheme();
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
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem('chutex_onboarding_done').then(val => {
      if (!val) { router.replace('/onboarding'); } else { setOnboardingChecked(true); }
    }).catch(() => setOnboardingChecked(true));
  }, []);

  useEffect(() => {
    if (!loading && user && !hasRedirected.current) { hasRedirected.current = true; router.replace('/(tabs)'); }
    if (!loading && !user) hasRedirected.current = false;
  }, [user, loading]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  if (loading || user || !onboardingChecked) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}><ActivityIndicator size="large" color="#FFF" /></View>;
  }

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
      await register({ email: email.trim().toLowerCase(), password, name, phone, role, date_of_birth: dob, gender, address, height_cm: heightCm ? parseFloat(heightCm) : undefined, weight_kg: weightKg ? parseFloat(weightKg) : undefined, blood_type: bloodType, allergies, medical_conditions: medConditions, emergency_contact_name: ecName, emergency_contact_phone: ecPhone, doctor_name: doctorName, guardian_type: guardianType, structure_name: structureName, siret, profession, relationship } as any);
      hasRedirected.current = true; router.replace('/(tabs)');
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setSubmitting(false); }
  };

  // ─── LOGIN VIEW ───
  const LoginView = () => (
    <>
      <Text style={{ fontSize: 28, fontWeight: '900', color: '#FFF', textAlign: 'center', letterSpacing: 2, marginBottom: 32, textTransform: 'uppercase' }}>
        Connexion
      </Text>

      {error ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.20)', borderRadius: 14, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' }} />
          <Text style={{ fontSize: 13, color: '#FFF', flex: 1 }}>{error}</Text>
        </View>
      ) : null}

      <GlassInput testID="reg-email" label="Email" val={email} onChange={setEmail} placeholder="..." />
      <GlassInput testID="auth-input-password" label="Mot de passe" val={password} onChange={setPassword} placeholder="..." type={showPw ? 'text' : 'password'} />

      <TouchableOpacity testID="auth-submit-btn" disabled={submitting} onPress={handleLogin} activeOpacity={0.85}
        style={{ backgroundColor: '#FFF', borderRadius: 999, paddingVertical: 18, alignItems: 'center', marginTop: 8, ...(Platform.OS === 'web' ? { boxShadow: '0 4px 20px rgba(0,0,0,0.15)' } : {}) }}>
        {submitting ? <ActivityIndicator color="#1A1D21" /> : <Text style={{ color: '#1A1D21', fontSize: 16, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' }}>Connexion</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={{ alignItems: 'center', marginTop: 16 }}>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '600', fontStyle: 'italic' }}>Mot de passe oublie ?</Text>
      </TouchableOpacity>

      <View style={{ alignItems: 'center', marginTop: 32 }}>
        <Text style={{ color: 'rgba(255,255,255,0.70)', fontSize: 14, fontStyle: 'italic' }}>
          Pas encore de compte ?{' '}
          <Text style={{ fontWeight: '800', color: '#FFF', textDecorationLine: 'underline' }} onPress={() => { setIsLogin(false); setStep(0); setError(''); }}>
            S'inscrire ici.
          </Text>
        </Text>
      </View>
    </>
  );

  // ─── REGISTER VIEW ───
  const RegisterView = () => (
    <>
      <Text style={{ fontSize: 24, fontWeight: '900', color: '#FFF', textAlign: 'center', letterSpacing: 1, marginBottom: 24, textTransform: 'uppercase' }}>
        Inscription
      </Text>

      {/* Progress */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
        {[0, 1, 2].map(i => <View key={i} style={{ width: i <= step ? 24 : 6, height: 4, borderRadius: 2, backgroundColor: i <= step ? '#FFF' : 'rgba(255,255,255,0.25)' }} />)}
      </View>

      {error ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.20)', borderRadius: 14, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' }} />
          <Text style={{ fontSize: 13, color: '#FFF', flex: 1 }}>{error}</Text>
        </View>
      ) : null}

      {step === 0 && (<>
        <GlassInput testID="reg-name" label="Nom complet" val={name} onChange={setName} placeholder="Jean Dupont" />
        <GlassInput testID="reg-email" label="Email" val={email} onChange={setEmail} placeholder="email@exemple.com" type="email" />
        <GlassInput testID="reg-phone" label="Telephone" val={phone} onChange={setPhone} placeholder="06 12 34 56 78" type="tel" />
        <GlassInput testID="reg-password" label="Mot de passe" val={password} onChange={setPassword} placeholder="Min. 6 caracteres" type="password" />
        <TouchableOpacity testID="next-step" style={{ backgroundColor: '#FFF', borderRadius: 999, paddingVertical: 18, alignItems: 'center', marginTop: 8 }}
          onPress={() => { if (!name || !email || !password) return setError('Remplissez tous les champs'); setError(''); setStep(1); }}>
          <Text style={{ color: '#1A1D21', fontSize: 15, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>Suivant</Text>
        </TouchableOpacity>
      </>)}

      {step === 1 && (<>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 20 }}>Selectionnez votre usage</Text>
        {[{ r: 'beneficiary', icon: 'person-outline', t: 'Beneficiaire', d: 'Porteur de dispositifs de sante' },
          { r: 'guardian', icon: 'people-outline', t: 'Gardien', d: 'Aidant ou professionnel' }].map(o => (
          <TouchableOpacity key={o.r} activeOpacity={0.7} onPress={() => { setRole(o.r); setStep(2); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 22, marginBottom: 10,
              backgroundColor: role === o.r ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.10)', borderWidth: 1,
              borderColor: role === o.r ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)' }}>
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name={o.icon as any} size={20} color="#FFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFF' }}>{o.t}</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{o.d}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 12 }} onPress={() => setStep(0)}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)' }}>Retour</Text>
        </TouchableOpacity>
      </>)}

      {step === 2 && role === 'beneficiary' && (<>
        <GlassInput label="Date de naissance" val={dob} onChange={setDob} placeholder="JJ/MM/AAAA" />
        <Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>Genre</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {['Homme', 'Femme', 'Autre'].map(g => <TouchableOpacity key={g} style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, backgroundColor: gender === g ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: gender === g ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)' }} onPress={() => setGender(g)}><Text style={{ fontSize: 12, fontWeight: '600', color: '#FFF' }}>{g}</Text></TouchableOpacity>)}
        </View>
        <GlassInput label="Adresse" val={address} onChange={setAddress} placeholder="14 rue de la Republique" />
        <GlassInput label="Allergies" val={allergies} onChange={setAllergies} placeholder="Penicilline, arachides..." />
        <GlassInput label="Medecin" val={doctorName} onChange={setDoctorName} placeholder="Dr. Dupont" />
        <GlassInput label="Contact urgence" val={ecName} onChange={setEcName} placeholder="Marie Dupont" />
      </>)}

      {step === 2 && role === 'guardian' && (<>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          {[{ id: 'particular', l: 'Particulier' }, { id: 'professional', l: 'Professionnel' }].map(t => (
            <TouchableOpacity key={t.id} style={{ flex: 1, paddingVertical: 14, borderRadius: 999, alignItems: 'center', backgroundColor: guardianType === t.id ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: guardianType === t.id ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)' }} onPress={() => setGuardianType(t.id)}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFF' }}>{t.l}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {guardianType === 'particular' && <GlassInput label="Lien" val={relationship} onChange={setRelationship} placeholder="Fils, fille, voisin..." />}
        {guardianType === 'professional' && (<>
          <GlassInput label="Structure" val={structureName} onChange={setStructureName} placeholder="SAAD Exemple" />
          <GlassInput label="SIRET" val={siret} onChange={setSiret} placeholder="123 456 789 00001" />
          <GlassInput label="Profession" val={profession} onChange={setProfession} placeholder="Aide-soignant..." />
        </>)}
      </>)}

      {step === 2 && (
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <TouchableOpacity style={{ flex: 0.5, paddingVertical: 16, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center' }} onPress={() => setStep(1)}>
            <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '600' }}>Retour</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="auth-submit-btn" disabled={submitting} style={{ flex: 1, backgroundColor: '#FFF', borderRadius: 999, paddingVertical: 16, alignItems: 'center' }} onPress={handleRegister}>
            {submitting ? <ActivityIndicator color="#1A1D21" /> : <Text style={{ color: '#1A1D21', fontSize: 15, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>S'inscrire</Text>}
          </TouchableOpacity>
        </View>
      )}

      {step === 0 && (
        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontStyle: 'italic' }}>
            Deja un compte ?{' '}
            <Text style={{ fontWeight: '800', color: '#FFF', textDecorationLine: 'underline' }} onPress={() => { setIsLogin(true); setStep(0); setError(''); }}>
              Se connecter.
            </Text>
          </Text>
        </View>
      )}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }} data-testid="auth-screen">
      {/* Background Image */}
      {Platform.OS === 'web' ? (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `url(${BG_IMAGE})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'brightness(0.6)',
        } as any} />
      ) : (
        <Image source={{ uri: BG_IMAGE }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }} resizeMode="cover" />
      )}

      {/* Overlay gradient */}
      {Platform.OS === 'web' && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.6) 100%)',
        } as any} />
      )}

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28, maxWidth: 440, width: '100%', alignSelf: 'center' }}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Logo area */}
          <View style={{ alignItems: 'center', marginTop: 60, marginBottom: 40 }}>
            {/* Flag */}
            <View style={{ width: 32, height: 32, borderRadius: 16, overflow: 'hidden', marginBottom: 20, flexDirection: 'row' }}>
              <View style={{ flex: 1, backgroundColor: '#002395' }} />
              <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
              <View style={{ flex: 1, backgroundColor: '#ED2939' }} />
            </View>

            <Image source={require('../assets/images/logo_black.png')} style={{ width: 160, height: 50 }} resizeMode="contain" />
            <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.75)', marginTop: 8, letterSpacing: 2.5, textTransform: 'uppercase' }}>
              L'innovation au service de la sante
            </Text>
          </View>

          {/* Form */}
          {isLogin ? <LoginView /> : <RegisterView />}

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}
