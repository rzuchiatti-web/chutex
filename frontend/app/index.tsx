import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Animated, Image, ImageBackground, StyleSheet, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';

const BG_URL = 'https://customer-assets.emergentagent.com/job_237132d4-a477-4487-91a8-3e2e50160498/artifacts/fxnu9p7b_banner_mobile%281%29.jpg';

// Inject Inter font + body bg on web
const injectCSS = () => {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById('login-css')) return;
  const s = document.createElement('style');
  s.id = 'login-css';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { font-family: 'Inter', system-ui, -apple-system, sans-serif !important; }
    body { background: url('${BG_URL}') center/cover no-repeat fixed !important; }
  `;
  document.head.appendChild(s);
};
const cleanupCSS = () => { if (Platform.OS === 'web') document.getElementById('login-css')?.remove(); };

// Glass styles for web (backdrop-filter via RN style)
const glassPanel = Platform.OS === 'web' ? {
  backgroundColor: 'rgba(255,255,255,0.25)',
  backdropFilter: 'blur(20px) saturate(140%)',
  WebkitBackdropFilter: 'blur(20px) saturate(140%)',
  borderColor: 'rgba(255,255,255,0.50)',
  borderWidth: 1,
  boxShadow: '0 8px 32px rgba(100,80,140,0.10), inset 0 1px 0 rgba(255,255,255,0.50)',
} : {
  backgroundColor: 'rgba(255,255,255,0.22)',
  borderColor: 'rgba(255,255,255,0.35)',
  borderWidth: 1,
};

const glassInput = Platform.OS === 'web' ? {
  backgroundColor: 'rgba(255,255,255,0.35)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  borderColor: 'rgba(255,255,255,0.50)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.20)',
} : {
  backgroundColor: 'rgba(255,255,255,0.30)',
  borderColor: 'rgba(255,255,255,0.40)',
};

const C = {
  text: 'rgba(30,20,60,0.90)',
  textMid: 'rgba(30,20,60,0.55)',
  textSoft: 'rgba(30,20,60,0.40)',
  placeholder: 'rgba(30,20,60,0.30)',
};

// IMPORTANT: Defined OUTSIDE component to prevent re-mount on each keystroke
// Uses defaultValue + ref pattern (uncontrolled) to avoid re-renders
const GInput = ({ testID, label, inputRef, defaultValue, placeholder, secure }: any) => (
  <View style={{ marginBottom: 18 }}>
    {label && <Text style={{ fontSize: 12, fontWeight: '600', color: C.textMid, marginBottom: 7, letterSpacing: 0.5 }}>{label}</Text>}
    <TextInput testID={testID} defaultValue={defaultValue} onChangeText={(t: string) => { if (inputRef) inputRef.current = t; }}
      placeholder={placeholder} placeholderTextColor={C.placeholder} secureTextEntry={secure} autoCapitalize="none"
      style={[{ fontSize: 16, paddingVertical: 16, paddingHorizontal: 22, borderRadius: 999, color: C.text, borderWidth: 1 }, glassInput] as any} />
  </View>
);

const CTA = ({ testID, label, onPress, ld, ghost }: any) => (
  <TouchableOpacity testID={testID} disabled={ld} onPress={onPress} activeOpacity={0.8}
    style={[{ paddingVertical: 18, borderRadius: 999, alignItems: 'center' },
      ghost ? { borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)', backgroundColor: 'transparent' }
           : { backgroundColor: 'rgba(255,255,255,0.40)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
               ...(Platform.OS === 'web' ? { backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.30)' } : {}) }
    ] as any}>
    {ld ? <ActivityIndicator color={C.text} /> : <Text style={{ color: C.text, fontSize: 15, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</Text>}
  </TouchableOpacity>
);

export default function AuthScreen() {
  const { user, loading, login, register } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const hasRedirected = useRef(false);
  const [ready, setReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  // Use refs for input values to avoid re-renders on each keystroke
  const emailRef = useRef('');
  const passwordRef = useRef('');
  const nameRef = useRef('');
  const phoneRef = useRef('');
  const [role, setRole] = useState('');
  const dobRef = useRef('');
  const addressRef = useRef('');
  const allergiesRef = useRef('');
  const ecNameRef = useRef('');
  const [guardianType, setGuardianType] = useState('particular');
  const relationshipRef = useRef('');
  const structureRef = useRef('');
  const professionRef = useRef('');
  const siretRef = useRef('');

  useEffect(() => { injectCSS(); return cleanupCSS; }, []);

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
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 450, delay: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [ready]);

  if (loading || user || !ready) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6F8' }}><ActivityIndicator size="large" color={C.text} /></View>;
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
      await register({ email: email.trim().toLowerCase(), password, name, phone, role, date_of_birth: dob, gender, address, allergies, emergency_contact_name: ecName, doctor_name: doctorName, guardian_type: guardianType, structure_name: structureName, siret, profession, relationship } as any);
      hasRedirected.current = true; router.replace('/(tabs)');
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setSubmitting(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }} data-testid="auth-screen">
      {Platform.OS !== 'web' && <Image source={{ uri: BG_URL }} style={StyleSheet.absoluteFill} resizeMode="cover" />}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 40, maxWidth: 440, width: '100%', alignSelf: 'center' }}
            keyboardShouldPersistTaps="always"
            keyboardDismissMode="none"
            showsVerticalScrollIndicator={false}
          >

          {/* Logo */}
          <Animated.View style={{ alignItems: 'center', marginBottom: 28, transform: [{ translateY: slideAnim }] }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, overflow: 'hidden', marginBottom: 18, flexDirection: 'row', borderWidth: 0.5, borderColor: 'rgba(100,80,140,0.20)' }}>
              <View style={{ flex: 1, backgroundColor: '#002395' }} /><View style={{ flex: 1, backgroundColor: '#FFF' }} /><View style={{ flex: 1, backgroundColor: '#ED2939' }} />
            </View>
            <Image source={require('../assets/images/logo_white.png')} style={{ width: 160, height: 50 }} resizeMode="contain" />
            <Text style={{ fontSize: 10, fontWeight: '600', color: C.textMid, marginTop: 10, letterSpacing: 2.5, textTransform: 'uppercase' }}>L'innovation au service de la sante</Text>
          </Animated.View>

          {/* Glass panel - no transform to avoid keyboard layout issues */}
          <View style={[{ borderRadius: 30, padding: 28, overflow: 'hidden' }, glassPanel] as any}>

            {error ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 14, padding: 12, marginBottom: 16, borderWidth: 0.5, borderColor: 'rgba(239,68,68,0.20)' }}>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#EF4444' }} />
                <Text style={{ fontSize: 13, color: '#DC2626', flex: 1 }}>{error}</Text>
              </View>
            ) : null}

            {isLogin ? (<>
              <Text style={{ fontSize: 26, fontWeight: '900', color: C.text, textAlign: 'center', letterSpacing: 1.5, marginBottom: 28, textTransform: 'uppercase' }}>Connexion</Text>
              <GInput testID="reg-email" label="Email" val={email} onChange={setEmail} placeholder="votre@email.com" />
              <GInput testID="auth-input-password" label="Mot de passe" val={password} onChange={setPassword} placeholder="..." secure />
              <View style={{ height: 8 }} />
              <CTA testID="auth-submit-btn" label="Connexion" onPress={handleLogin} ld={submitting} />
              <TouchableOpacity style={{ alignItems: 'center', marginTop: 18 }}>
                <Text style={{ color: C.textMid, fontSize: 14, fontWeight: '500', fontStyle: 'italic' }}>Mot de passe oublie ?</Text>
              </TouchableOpacity>
              <View style={{ alignItems: 'center', marginTop: 28 }}>
                <Text style={{ color: C.textSoft, fontSize: 14 }}>Pas encore de compte ? <Text style={{ fontWeight: '700', color: C.text, textDecorationLine: 'underline' }} onPress={() => { setIsLogin(false); setStep(0); setError(''); }}>S'inscrire ici.</Text></Text>
              </View>
            </>) : (<>
              <Text style={{ fontSize: 22, fontWeight: '900', color: C.text, textAlign: 'center', letterSpacing: 1, marginBottom: 20, textTransform: 'uppercase' }}>Inscription</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 22 }}>
                {[0,1,2].map(i => <View key={i} style={{ width: i <= step ? 20 : 5, height: 3, borderRadius: 1.5, backgroundColor: i <= step ? C.text : 'rgba(30,20,60,0.12)' }} />)}
              </View>
              {step === 0 && (<>
                <GInput testID="reg-name" label="Nom complet" val={name} onChange={setName} placeholder="Jean Dupont" />
                <GInput testID="reg-email" label="Email" val={email} onChange={setEmail} placeholder="email@exemple.com" />
                <GInput testID="reg-phone" label="Telephone" val={phone} onChange={setPhone} placeholder="06 12 34 56 78" />
                <GInput testID="reg-password" label="Mot de passe" val={password} onChange={setPassword} placeholder="Min. 6 caracteres" secure />
                <CTA testID="next-step" label="Suivant" onPress={() => { if (!name || !email || !password) return setError('Remplissez tous les champs'); setError(''); setStep(1); }} />
                <View style={{ alignItems: 'center', marginTop: 20 }}>
                  <Text style={{ color: C.textSoft, fontSize: 14 }}>Deja un compte ? <Text style={{ fontWeight: '700', color: C.text, textDecorationLine: 'underline' }} onPress={() => { setIsLogin(true); setStep(0); setError(''); }}>Se connecter.</Text></Text>
                </View>
              </>)}
              {step === 1 && (<>
                <Text style={{ fontSize: 13, color: C.textMid, textAlign: 'center', marginBottom: 20 }}>Selectionnez votre usage</Text>
                {[{ r: 'beneficiary', icon: 'person-outline', t: 'Beneficiaire', d: 'Porteur de dispositifs de sante' },
                  { r: 'guardian', icon: 'people-outline', t: 'Gardien', d: 'Aidant ou professionnel' }].map(o => (
                  <TouchableOpacity key={o.r} activeOpacity={0.75} onPress={() => { setRole(o.r); setStep(2); }}
                    style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 22, marginBottom: 12, borderWidth: 1 },
                      role === o.r ? { backgroundColor: 'rgba(255,255,255,0.35)', borderColor: 'rgba(255,255,255,0.55)' }
                                   : { backgroundColor: 'rgba(255,255,255,0.18)', borderColor: 'rgba(255,255,255,0.30)' }]}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name={o.icon as any} size={20} color={C.text} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: C.text }}>{o.t}</Text>
                      <Text style={{ fontSize: 12, color: C.textMid, marginTop: 3 }}>{o.d}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={C.textSoft} />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 14 }} onPress={() => setStep(0)}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: C.textSoft }}>Retour</Text>
                </TouchableOpacity>
              </>)}
              {step === 2 && (<>
                <GInput label="Date de naissance" val={dob} onChange={setDob} placeholder="JJ/MM/AAAA" />
                <GInput label="Adresse" val={address} onChange={setAddress} placeholder="14 rue de la Republique" />
                <GInput label="Allergies" val={allergies} onChange={setAllergies} placeholder="Penicilline..." />
                <GInput label="Contact urgence" val={ecName} onChange={setEcName} placeholder="Marie Dupont" />
                <View style={{ flexDirection: 'row', gap: 14, marginTop: 10 }}>
                  <View style={{ flex: 0.38 }}><CTA label="Retour" onPress={() => setStep(1)} ghost /></View>
                  <View style={{ flex: 0.62 }}><CTA testID="auth-submit-btn" label="S'inscrire" onPress={handleRegister} ld={submitting} /></View>
                </View>
              </>)}
            </>)}
          </View>
        </ScrollView>
      </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}
