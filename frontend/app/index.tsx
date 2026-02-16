import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Animated, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';

const { height: SH } = Dimensions.get('window');
const BG = 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/banner_login_mobile.jpg?v=1771242072';

// ─── GLASS TOKENS ───
const G = {
  fill: 'rgba(255,255,255,0.12)',
  fill2: 'rgba(255,255,255,0.06)',
  stroke: 'rgba(255,255,255,0.20)',
  inner: 'rgba(255,255,255,0.15)',
  text: 'rgba(255,255,255,0.95)',
  textMid: 'rgba(255,255,255,0.72)',
  textSoft: 'rgba(255,255,255,0.52)',
  blur: Platform.OS === 'web' ? { backdropFilter: 'blur(18px) saturate(130%)', WebkitBackdropFilter: 'blur(18px) saturate(130%)' } : {},
  shadow: Platform.OS === 'web' ? { boxShadow: '0 20px 60px rgba(0,0,0,0.28), 0 6px 24px rgba(0,0,0,0.20), inset 0 1px 0 rgba(255,255,255,0.18)' } : {},
};

const GlassInput = ({ testID, label, val, onChange, placeholder, type }: any) => {
  if (Platform.OS === 'web') {
    return (
      <div style={{ marginBottom: 18 }}>
        {label && <div style={{ fontSize: 13, fontWeight: '600', color: G.textMid, marginBottom: 8, fontFamily: 'Inter, system-ui' }}>{label}</div>}
        <input data-testid={testID} type={type || 'text'} value={val} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
          style={{
            width: '100%', fontSize: 16, fontFamily: 'Inter, system-ui', fontWeight: '500',
            padding: '16px 22px', borderRadius: 999, 
            border: `1px solid ${G.stroke}`,
            background: `linear-gradient(145deg, ${G.fill}, ${G.fill2})`,
            ...G.blur as any, ...G.shadow as any,
            color: G.text, boxSizing: 'border-box' as any, outline: 'none',
            transition: 'border-color 0.25s ease, background 0.25s ease',
          } as any}
          onFocus={(e: any) => { e.target.style.borderColor = 'rgba(255,255,255,0.45)'; e.target.style.background = `linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0.08))`; }}
          onBlur={(e: any) => { e.target.style.borderColor = G.stroke; e.target.style.background = `linear-gradient(145deg, ${G.fill}, ${G.fill2})`; }}
        />
      </div>
    );
  }
  const { TextInput: RNTextInput } = require('react-native');
  return (
    <View style={{ marginBottom: 18 }}>
      {label && <Text style={{ fontSize: 13, fontWeight: '600', color: G.textMid, marginBottom: 8 }}>{label}</Text>}
      <RNTextInput testID={testID} value={val} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={G.textSoft} secureTextEntry={type === 'password'}
        autoCapitalize="none" keyboardType={type === 'email' ? 'email-address' : type === 'tel' ? 'phone-pad' : 'default'}
        style={{ fontSize: 16, paddingVertical: 16, paddingHorizontal: 22, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)', color: G.text, borderWidth: 1, borderColor: G.stroke }} />
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
  const [ready, setReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    AsyncStorage.getItem('chutex_onboarding_done').then(val => {
      if (!val) { router.replace('/onboarding'); } else { setReady(true); }
    }).catch(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!loading && user && !hasRedirected.current) { hasRedirected.current = true; router.replace('/(tabs)'); }
    if (!loading && !user) hasRedirected.current = false;
  }, [user, loading]);

  useEffect(() => {
    if (ready) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, delay: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [ready]);

  if (loading || user || !ready) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1318' }}><ActivityIndicator size="large" color="#FFF" /></View>;
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
      await register({ email: email.trim().toLowerCase(), password, name, phone, role, date_of_birth: dob, gender, address, height_cm: heightCm ? parseFloat(heightCm) : undefined, weight_kg: weightKg ? parseFloat(weightKg) : undefined, allergies, medical_conditions: medConditions, emergency_contact_name: ecName, emergency_contact_phone: ecPhone, doctor_name: doctorName, guardian_type: guardianType, structure_name: structureName, siret, profession, relationship } as any);
      hasRedirected.current = true; router.replace('/(tabs)');
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setSubmitting(false); }
  };

  const ErrorBanner = () => error ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 16, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)' }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' }} />
      <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.90)', flex: 1 }}>{error}</Text>
    </View>
  ) : null;

  // ─── PRIMARY CTA ───
  const PillCTA = ({ testID, label, onPress, loading: ld, ghost }: any) => (
    <TouchableOpacity testID={testID} disabled={ld} onPress={onPress} activeOpacity={0.85}
      style={{
        paddingVertical: 18, borderRadius: 999, alignItems: 'center',
        ...(ghost
          ? { borderWidth: 1, borderColor: G.stroke, backgroundColor: 'transparent' }
          : { backgroundColor: '#FFFFFF', ...(Platform.OS === 'web' ? { boxShadow: '0 8px 32px rgba(255,255,255,0.08)' } : {}) }
        ),
      }}>
      {ld ? <ActivityIndicator color={ghost ? '#FFF' : '#0f1318'} />
        : <Text style={{ color: ghost ? G.text : '#0f1318', fontSize: 15, fontWeight: '800', letterSpacing: ghost ? 0.5 : 1.5, textTransform: 'uppercase' }}>{label}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0f1318' }} data-testid="auth-screen">
      {/* BG Image */}
      {Platform.OS === 'web' ? (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${BG})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.45) saturate(0.9)' } as any} />
      ) : (
        <Image source={{ uri: BG }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.45 }} resizeMode="cover" />
      )}
      {/* Gradient overlay */}
      {Platform.OS === 'web' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(180deg, rgba(15,19,24,0.2) 0%, rgba(15,19,24,0.5) 50%, rgba(15,19,24,0.85) 100%)' } as any} />
      )}

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 28, maxWidth: 440, width: '100%', alignSelf: 'center', paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <Animated.View style={{ alignItems: 'center', marginBottom: 36, transform: [{ translateY: slideAnim }] }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, overflow: 'hidden', marginBottom: 20, flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}>
              <View style={{ flex: 1, backgroundColor: '#002395' }} /><View style={{ flex: 1, backgroundColor: '#FFF' }} /><View style={{ flex: 1, backgroundColor: '#ED2939' }} />
            </View>
            <Image source={require('../assets/images/logo_black.png')} style={{ width: 170, height: 52 }} resizeMode="contain" />
            <Text style={{ fontSize: 11, fontWeight: '500', color: G.textSoft, marginTop: 10, letterSpacing: 2.5, textTransform: 'uppercase' }}>
              L'innovation au service de la sante
            </Text>
          </Animated.View>

          {/* Form */}
          <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
            {isLogin ? (
              <>
                <Text style={{ fontSize: 26, fontWeight: '800', color: G.text, textAlign: 'center', letterSpacing: 1.5, marginBottom: 28, textTransform: 'uppercase' }}>Connexion</Text>
                <ErrorBanner />
                <GlassInput testID="reg-email" label="Email" val={email} onChange={setEmail} placeholder="votre@email.com" />
                <GlassInput testID="auth-input-password" label="Mot de passe" val={password} onChange={setPassword} placeholder="..." type={showPw ? 'text' : 'password'} />
                <View style={{ height: 6 }} />
                <PillCTA testID="auth-submit-btn" label="Connexion" onPress={handleLogin} loading={submitting} />
                <TouchableOpacity style={{ alignItems: 'center', marginTop: 18 }}>
                  <Text style={{ color: G.textMid, fontSize: 14, fontWeight: '500', fontStyle: 'italic' }}>Mot de passe oublie ?</Text>
                </TouchableOpacity>
                <View style={{ alignItems: 'center', marginTop: 28 }}>
                  <Text style={{ color: G.textSoft, fontSize: 14 }}>
                    Pas encore de compte ?{' '}
                    <Text style={{ fontWeight: '700', color: G.text, textDecorationLine: 'underline' }} onPress={() => { setIsLogin(false); setStep(0); setError(''); }}>S'inscrire ici.</Text>
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 24, fontWeight: '800', color: G.text, textAlign: 'center', letterSpacing: 1, marginBottom: 20, textTransform: 'uppercase' }}>Inscription</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 22 }}>
                  {[0,1,2].map(i => <View key={i} style={{ width: i <= step ? 22 : 6, height: 4, borderRadius: 2, backgroundColor: i <= step ? '#FFF' : 'rgba(255,255,255,0.20)' }} />)}
                </View>
                <ErrorBanner />

                {step === 0 && (<>
                  <GlassInput testID="reg-name" label="Nom complet" val={name} onChange={setName} placeholder="Jean Dupont" />
                  <GlassInput testID="reg-email" label="Email" val={email} onChange={setEmail} placeholder="email@exemple.com" type="email" />
                  <GlassInput testID="reg-phone" label="Telephone" val={phone} onChange={setPhone} placeholder="06 12 34 56 78" type="tel" />
                  <GlassInput testID="reg-password" label="Mot de passe" val={password} onChange={setPassword} placeholder="Min. 6 caracteres" type="password" />
                  <PillCTA testID="next-step" label="Suivant" onPress={() => { if (!name || !email || !password) return setError('Remplissez tous les champs'); setError(''); setStep(1); }} />
                </>)}
                {step === 1 && (<>
                  <Text style={{ fontSize: 14, color: G.textMid, textAlign: 'center', marginBottom: 20 }}>Selectionnez votre usage</Text>
                  {[{ r: 'beneficiary', icon: 'person-outline', t: 'Beneficiaire', d: 'Porteur de dispositifs de sante' },
                    { r: 'guardian', icon: 'people-outline', t: 'Gardien', d: 'Aidant ou professionnel' }].map(o => (
                    <TouchableOpacity key={o.r} activeOpacity={0.7} onPress={() => { setRole(o.r); setStep(2); }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 22, marginBottom: 10,
                        backgroundColor: role === o.r ? 'rgba(255,255,255,0.16)' : G.fill2, borderWidth: 1,
                        borderColor: role === o.r ? 'rgba(255,255,255,0.35)' : G.stroke, ...G.blur as any }}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: G.inner, justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name={o.icon as any} size={20} color="#FFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: G.text }}>{o.t}</Text>
                        <Text style={{ fontSize: 11, color: G.textSoft, marginTop: 2 }}>{o.d}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={G.textSoft} />
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 12 }} onPress={() => setStep(0)}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: G.textSoft }}>Retour</Text>
                  </TouchableOpacity>
                </>)}
                {step === 2 && role === 'beneficiary' && (<>
                  <GlassInput label="Date de naissance" val={dob} onChange={setDob} placeholder="JJ/MM/AAAA" />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: G.textMid, marginBottom: 8 }}>Genre</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                    {['Homme','Femme','Autre'].map(g => (
                      <TouchableOpacity key={g} style={{ paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, backgroundColor: gender===g ? G.inner : G.fill2, borderWidth: 1, borderColor: gender===g ? 'rgba(255,255,255,0.35)' : G.stroke }} onPress={() => setGender(g)}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: G.text }}>{g}</Text>
                      </TouchableOpacity>))}
                  </View>
                  <GlassInput label="Adresse" val={address} onChange={setAddress} placeholder="14 rue de la Republique" />
                  <GlassInput label="Allergies" val={allergies} onChange={setAllergies} placeholder="Penicilline..." />
                  <GlassInput label="Medecin" val={doctorName} onChange={setDoctorName} placeholder="Dr. Dupont" />
                  <GlassInput label="Contact urgence" val={ecName} onChange={setEcName} placeholder="Marie Dupont" />
                </>)}
                {step === 2 && role === 'guardian' && (<>
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                    {[{id:'particular',l:'Particulier'},{id:'professional',l:'Professionnel'}].map(t => (
                      <TouchableOpacity key={t.id} style={{ flex: 1, paddingVertical: 14, borderRadius: 999, alignItems: 'center', backgroundColor: guardianType===t.id ? G.inner : G.fill2, borderWidth: 1, borderColor: guardianType===t.id ? 'rgba(255,255,255,0.35)' : G.stroke }} onPress={() => setGuardianType(t.id)}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: G.text }}>{t.l}</Text>
                      </TouchableOpacity>))}
                  </View>
                  {guardianType === 'particular' && <GlassInput label="Lien" val={relationship} onChange={setRelationship} placeholder="Fils, fille..." />}
                  {guardianType === 'professional' && (<><GlassInput label="Structure" val={structureName} onChange={setStructureName} placeholder="SAAD..." /><GlassInput label="SIRET" val={siret} onChange={setSiret} placeholder="123 456 789 00001" /><GlassInput label="Profession" val={profession} onChange={setProfession} placeholder="Aide-soignant..." /></>)}
                </>)}
                {step === 2 && (
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                    <View style={{ flex: 0.4 }}><PillCTA label="Retour" onPress={() => setStep(1)} ghost /></View>
                    <View style={{ flex: 0.6 }}><PillCTA testID="auth-submit-btn" label="S'inscrire" onPress={handleRegister} loading={submitting} /></View>
                  </View>
                )}
                {step === 0 && (
                  <View style={{ alignItems: 'center', marginTop: 22 }}>
                    <Text style={{ color: G.textSoft, fontSize: 14 }}>Deja un compte ? <Text style={{ fontWeight: '700', color: G.text, textDecorationLine: 'underline' }} onPress={() => { setIsLogin(true); setStep(0); setError(''); }}>Se connecter.</Text></Text>
                  </View>
                )}
              </>
            )}
          </Animated.View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}
