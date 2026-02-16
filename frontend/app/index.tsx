import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Animated, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';

const BG = 'https://customer-assets.emergentagent.com/job_237132d4-a477-4487-91a8-3e2e50160498/artifacts/fxnu9p7b_banner_mobile%281%29.jpg';
const web = (s: any) => Platform.OS === 'web' ? s : {};

// ─── GLASS CSS (injected once) ───
const injectGlassCSS = () => {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById('glass-login')) return;
  const s = document.createElement('style');
  s.id = 'glass-login';
  s.textContent = `
    body { background: transparent !important; }
    .glass-panel {
      background: rgba(255,255,255,0.10);
      backdrop-filter: blur(16px) saturate(130%);
      -webkit-backdrop-filter: blur(16px) saturate(130%);
      border: 1px solid rgba(255,255,255,0.30);
      border-radius: 30px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.25);
    }
    .glass-input {
      width: 100%;
      font-size: 16px;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-weight: 500;
      padding: 16px 22px;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.25);
      background: rgba(255,255,255,0.12);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: rgba(255,255,255,0.95);
      box-sizing: border-box;
      outline: none;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.15);
      transition: border-color 0.25s ease, background 0.25s ease;
    }
    .glass-input:focus {
      border-color: rgba(255,255,255,0.50);
      background: rgba(255,255,255,0.18);
    }
    .glass-input::placeholder { color: rgba(255,255,255,0.40); }
    .glass-chip {
      padding: 10px 20px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.20);
      background: rgba(255,255,255,0.08);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: rgba(255,255,255,0.90);
      font-family: 'Inter', system-ui;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
    }
    .glass-chip:hover, .glass-chip.active { background: rgba(255,255,255,0.20); border-color: rgba(255,255,255,0.40); }
    .glass-cta {
      width: 100%;
      padding: 18px;
      border-radius: 16px;
      border: 1px solid rgba(255,255,255,0.30);
      background: rgba(255,255,255,0.18);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      color: rgba(255,255,255,0.95);
      font-family: 'Inter', system-ui;
      font-weight: 800;
      font-size: 15px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      cursor: pointer;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.25);
      transition: all 0.2s ease;
    }
    .glass-cta:hover { background: rgba(255,255,255,0.28); border-color: rgba(255,255,255,0.45); }
  `;
  document.head.appendChild(s);
};

const GlassInput = ({ testID, label, val, onChange, placeholder, type }: any) => {
  if (Platform.OS === 'web') {
    return (
      <div style={{ marginBottom: 18 }}>
        {label && <div style={{ fontSize: 12, fontWeight: '600', color: 'rgba(30,20,60,0.55)', marginBottom: 7, letterSpacing: 0.5, fontFamily: 'Inter, system-ui' }}>{label}</div>}
        <input data-testid={testID} type={type || 'text'} value={val} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder} className="glass-input" />
      </div>
    );
  }
  const { TextInput: RNTextInput } = require('react-native');
  return (
    <View style={{ marginBottom: 18 }}>
      {label && <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(30,20,60,0.55)', marginBottom: 7, letterSpacing: 0.5 }}>{label}</Text>}
      <RNTextInput testID={testID} value={val} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.40)" secureTextEntry={type === 'password'}
        autoCapitalize="none" keyboardType={type === 'email' ? 'email-address' : type === 'tel' ? 'phone-pad' : 'default'}
        style={{ fontSize: 16, paddingVertical: 16, paddingHorizontal: 22, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.35)', color: 'rgba(30,20,60,0.90)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.50)' }} />
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
  const [allergies, setAllergies] = useState('');
  const [ecName, setEcName] = useState('');
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
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => { injectGlassCSS(); }, []);

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
        Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]).start();
    }
  }, [ready]);

  if (loading || user || !ready) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1318' }}><ActivityIndicator size="large" color="rgba(255,255,255,0.5)" /></View>;
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

  const ErrorBanner = () => error ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 14, padding: 12, marginBottom: 16, borderWidth: 0.5, borderColor: 'rgba(239,68,68,0.25)' }}>
      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#EF4444' }} />
      <Text style={{ fontSize: 13, color: 'rgba(255,200,200,0.90)', flex: 1 }}>{error}</Text>
    </View>
  ) : null;

  const GlassCTA = ({ testID, label, onPress, loading: ld }: any) => {
    if (Platform.OS === 'web') {
      return (
        <button data-testid={testID} className="glass-cta" onClick={onPress} disabled={ld} style={{ opacity: ld ? 0.6 : 1 } as any}>
          {ld ? '...' : label}
        </button>
      );
    }
    return (
      <TouchableOpacity testID={testID} disabled={ld} onPress={onPress} activeOpacity={0.8}
        style={{ paddingVertical: 18, borderRadius: 16, alignItems: 'center', backgroundColor: 'rgba(30,20,60,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.30)' }}>
        {ld ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: 'rgba(30,20,60,0.90)', fontSize: 15, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</Text>}
      </TouchableOpacity>
    );
  };

  const formContent = isLogin ? (
    <>
      <Text style={{ fontSize: 26, fontWeight: '900', color: 'rgba(30,20,60,0.90)', textAlign: 'center', letterSpacing: 2, marginBottom: 28, textTransform: 'uppercase' }}>Connexion</Text>
      <ErrorBanner />
      <GlassInput testID="reg-email" label="Email" val={email} onChange={setEmail} placeholder="votre@email.com" />
      <GlassInput testID="auth-input-password" label="Mot de passe" val={password} onChange={setPassword} placeholder="..." type={showPw ? 'text' : 'password'} />
      <View style={{ height: 8 }} />
      <GlassCTA testID="auth-submit-btn" label="Connexion" onPress={handleLogin} loading={submitting} />
      <TouchableOpacity style={{ alignItems: 'center', marginTop: 18 }}>
        <Text style={{ color: 'rgba(30,20,60,0.55)', fontSize: 14, fontWeight: '500', fontStyle: 'italic' }}>Mot de passe oublie ?</Text>
      </TouchableOpacity>
      <View style={{ alignItems: 'center', marginTop: 28 }}>
        <Text style={{ color: 'rgba(30,20,60,0.45)', fontSize: 14 }}>
          Pas encore de compte ?{' '}
          <Text style={{ fontWeight: '700', color: 'rgba(30,20,60,0.85)', textDecorationLine: 'underline' }} onPress={() => { setIsLogin(false); setStep(0); setError(''); }}>S'inscrire ici.</Text>
        </Text>
      </View>
    </>
  ) : (
    <>
      <Text style={{ fontSize: 22, fontWeight: '900', color: 'rgba(30,20,60,0.90)', textAlign: 'center', letterSpacing: 1, marginBottom: 20, textTransform: 'uppercase' }}>Inscription</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 22 }}>
        {[0,1,2].map(i => <View key={i} style={{ width: i <= step ? 20 : 5, height: 3, borderRadius: 1.5, backgroundColor: i <= step ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.18)' }} />)}
      </View>
      <ErrorBanner />
      {step === 0 && (<>
        <GlassInput testID="reg-name" label="Nom complet" val={name} onChange={setName} placeholder="Jean Dupont" />
        <GlassInput testID="reg-email" label="Email" val={email} onChange={setEmail} placeholder="email@exemple.com" type="email" />
        <GlassInput testID="reg-phone" label="Telephone" val={phone} onChange={setPhone} placeholder="06 12 34 56 78" type="tel" />
        <GlassInput testID="reg-password" label="Mot de passe" val={password} onChange={setPassword} placeholder="Min. 6 caracteres" type="password" />
        <GlassCTA testID="next-step" label="Suivant" onPress={() => { if (!name || !email || !password) return setError('Remplissez tous les champs'); setError(''); setStep(1); }} />
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ color: 'rgba(30,20,60,0.45)', fontSize: 14 }}>Deja un compte ? <Text style={{ fontWeight: '700', color: 'rgba(30,20,60,0.85)', textDecorationLine: 'underline' }} onPress={() => { setIsLogin(true); setStep(0); setError(''); }}>Se connecter.</Text></Text>
        </View>
      </>)}
      {step === 1 && (<>
        <Text style={{ fontSize: 13, color: 'rgba(30,20,60,0.55)', textAlign: 'center', marginBottom: 20 }}>Selectionnez votre usage</Text>
        {[{ r: 'beneficiary', icon: 'person-outline', t: 'Beneficiaire', d: 'Porteur de dispositifs de sante' },
          { r: 'guardian', icon: 'people-outline', t: 'Gardien', d: 'Aidant ou professionnel' }].map(o => (
          <TouchableOpacity key={o.r} activeOpacity={0.75} onPress={() => { setRole(o.r); setStep(2); }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 18, marginBottom: 12,
              backgroundColor: role === o.r ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
              borderWidth: 1, borderColor: role === o.r ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)',
              ...web({ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)' }) }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.22)', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name={o.icon as any} size={20} color="rgba(30,20,60,0.65)" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: 'rgba(30,20,60,0.90)' }}>{o.t}</Text>
              <Text style={{ fontSize: 12, color: 'rgba(30,20,60,0.45)', marginTop: 3 }}>{o.d}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.40)" />
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 14 }} onPress={() => setStep(0)}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(30,20,60,0.40)' }}>Retour</Text>
        </TouchableOpacity>
      </>)}
      {step === 2 && (<>
        <GlassInput label="Date de naissance" val={dob} onChange={setDob} placeholder="JJ/MM/AAAA" />
        <GlassInput label="Adresse" val={address} onChange={setAddress} placeholder="14 rue de la Republique" />
        <GlassInput label="Allergies" val={allergies} onChange={setAllergies} placeholder="Penicilline..." />
        <GlassInput label="Contact urgence" val={ecName} onChange={setEcName} placeholder="Marie Dupont" />
        <View style={{ flexDirection: 'row', gap: 14, marginTop: 10 }}>
          <View style={{ flex: 0.38 }}><GlassCTA label="Retour" onPress={() => setStep(1)} /></View>
          <View style={{ flex: 0.62 }}><GlassCTA testID="auth-submit-btn" label="S'inscrire" onPress={handleRegister} loading={submitting} /></View>
        </View>
      </>)}
    </>
  );

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }} data-testid="auth-screen">
      {/* BG Image — pointerEvents none so it doesn't block clicks */}
      {Platform.OS === 'web' ? (
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', backgroundImage: `url(${BG})`, backgroundSize: 'cover', backgroundPosition: 'center' } as any} />
      ) : (
        <Image source={{ uri: BG }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }} resizeMode="cover" />
      )}

      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }], zIndex: 2 } as any}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 40, maxWidth: 440, width: '100%', alignSelf: 'center' }}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Logo above glass panel */}
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <View style={{ width: 32, height: 32, borderRadius: 16, overflow: 'hidden', marginBottom: 18, flexDirection: 'row', borderWidth: 0.5, borderColor: 'rgba(100,80,140,0.25)' }}>
              <View style={{ flex: 1, backgroundColor: '#002395' }} /><View style={{ flex: 1, backgroundColor: '#FFF' }} /><View style={{ flex: 1, backgroundColor: '#ED2939' }} />
            </View>
            <Image source={require('../assets/images/logo_white.png')} style={{ width: 160, height: 50 }} resizeMode="contain" />
            <Text style={{ fontSize: 10, fontWeight: '600', color: 'rgba(40,30,70,0.55)', marginTop: 10, letterSpacing: 2.5, textTransform: 'uppercase' }}>
              L'innovation au service de la sante
            </Text>
          </View>

          {/* ─── GLASS PANEL ─── */}
          {Platform.OS === 'web' ? (
            <div style={{
              padding: 28, borderRadius: 30,
              background: 'rgba(255,255,255,0.25)',
              backdropFilter: 'blur(20px) saturate(140%)',
              WebkitBackdropFilter: 'blur(20px) saturate(140%)',
              border: '1px solid rgba(255,255,255,0.50)',
              boxShadow: '0 8px 32px rgba(100,80,140,0.10), inset 0 1px 0 rgba(255,255,255,0.50)',
            } as any}>
              {formContent}
            </div>
          ) : (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.30)', padding: 28, overflow: 'hidden' }}>
              {formContent}
            </View>
          )}

        </ScrollView>
      </Animated.View>
    </View>
  );
}
