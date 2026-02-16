import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Animated, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';

const BG = 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/banner_login_mobile.jpg?v=1771242072';

// ─── GLASS TOKENS (reference-accurate) ───
const T = {
  // Glass card fill: very translucent, multi-layer gradient
  glassBg: 'linear-gradient(145deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04))',
  glassBgSolid: 'rgba(255,255,255,0.09)',
  // Borders: extremely subtle, almost invisible
  stroke: 'rgba(255,255,255,0.12)',
  strokeFocus: 'rgba(255,255,255,0.28)',
  // Inner highlight (top edge reflet)
  innerHighlight: 'inset 0 1px 0 rgba(255,255,255,0.12)',
  // Shadows: large, diffuse, multi-layer
  shadow: '0 24px 80px rgba(0,0,0,0.35), 0 8px 32px rgba(0,0,0,0.18)',
  shadowFull: '0 24px 80px rgba(0,0,0,0.35), 0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.12)',
  // Blur: heavy for true glassmorphism
  blur: 'blur(28px) saturate(140%)',
  // Text
  text: 'rgba(255,255,255,0.95)',
  textMid: 'rgba(255,255,255,0.72)',
  textSoft: 'rgba(255,255,255,0.48)',
  // Radius
  rCard: 22,
  rPill: 999,
};

const web = (s: any) => Platform.OS === 'web' ? s : {};

const GlassInput = ({ testID, label, val, onChange, placeholder, type }: any) => {
  if (Platform.OS === 'web') {
    return (
      <div style={{ marginBottom: 20 }}>
        {label && <div style={{ fontSize: 12, fontWeight: '600', color: T.textMid, marginBottom: 8, letterSpacing: 0.8, fontFamily: 'Inter, system-ui' }}>{label}</div>}
        <input data-testid={testID} type={type || 'text'} value={val} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
          style={{
            width: '100%', fontSize: 16, fontFamily: 'Inter, system-ui', fontWeight: '500',
            padding: '17px 24px', borderRadius: T.rPill,
            border: `1px solid ${T.stroke}`,
            background: T.glassBg,
            backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
            boxShadow: T.shadowFull,
            color: T.text, boxSizing: 'border-box' as any, outline: 'none',
            transition: 'border-color 0.3s cubic-bezier(0.22,1,0.36,1), background 0.3s cubic-bezier(0.22,1,0.36,1)',
          } as any}
          onFocus={(e: any) => { e.target.style.borderColor = T.strokeFocus; e.target.style.background = 'linear-gradient(145deg, rgba(255,255,255,0.20), rgba(255,255,255,0.08))'; }}
          onBlur={(e: any) => { e.target.style.borderColor = T.stroke; e.target.style.background = T.glassBg; }}
        />
      </div>
    );
  }
  const { TextInput: RNTextInput } = require('react-native');
  return (
    <View style={{ marginBottom: 20 }}>
      {label && <Text style={{ fontSize: 12, fontWeight: '600', color: T.textMid, marginBottom: 8, letterSpacing: 0.8 }}>{label}</Text>}
      <RNTextInput testID={testID} value={val} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor={T.textSoft} secureTextEntry={type === 'password'}
        autoCapitalize="none" keyboardType={type === 'email' ? 'email-address' : type === 'tel' ? 'phone-pad' : 'default'}
        style={{ fontSize: 16, paddingVertical: 17, paddingHorizontal: 24, borderRadius: T.rPill, backgroundColor: T.glassBgSolid, color: T.text, borderWidth: 0.5, borderColor: T.stroke }} />
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

  // Stagger animations
  const fadeMain = useRef(new Animated.Value(0)).current;
  const slideLogo = useRef(new Animated.Value(20)).current;
  const slideForm = useRef(new Animated.Value(30)).current;
  const fadeForm = useRef(new Animated.Value(0)).current;

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
      // Staggered premium entrance
      Animated.sequence([
        Animated.parallel([
          Animated.timing(fadeMain, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(slideLogo, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(fadeForm, { toValue: 1, duration: 420, useNativeDriver: true }),
          Animated.timing(slideForm, { toValue: 0, duration: 380, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [ready]);

  if (loading || user || !ready) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1318' }}><ActivityIndicator size="large" color="rgba(255,255,255,0.6)" /></View>;
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
      await register({ email: email.trim().toLowerCase(), password, name, phone, role, date_of_birth: dob, gender, address, allergies, emergency_contact_name: ecName, emergency_contact_phone: ecPhone, doctor_name: doctorName, guardian_type: guardianType, structure_name: structureName, siret, profession, relationship } as any);
      hasRedirected.current = true; router.replace('/(tabs)');
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setSubmitting(false); }
  };

  const ErrorBanner = () => error ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 16, padding: 14, marginBottom: 18, borderWidth: 0.5, borderColor: 'rgba(239,68,68,0.18)' }}>
      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#EF4444' }} />
      <Text style={{ fontSize: 13, color: 'rgba(255,200,200,0.90)', flex: 1 }}>{error}</Text>
    </View>
  ) : null;

  // ─── CTA BUTTON ───
  const PillCTA = ({ testID, label, onPress, loading: ld, ghost }: any) => (
    <TouchableOpacity testID={testID} disabled={ld} onPress={onPress} activeOpacity={0.85}
      style={{
        paddingVertical: 18, borderRadius: T.rPill, alignItems: 'center',
        ...(ghost ? { borderWidth: 0.5, borderColor: T.stroke, backgroundColor: 'transparent' }
          : { backgroundColor: 'rgba(255,255,255,0.95)', ...web({ boxShadow: '0 12px 40px rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.12)' }) }),
      }}>
      {ld ? <ActivityIndicator color={ghost ? '#FFF' : '#0f1318'} />
        : <Text style={{ color: ghost ? T.text : '#0f1318', fontSize: 15, fontWeight: '800', letterSpacing: ghost ? 0.3 : 1.8, textTransform: 'uppercase' }}>{label}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0f1318' }} data-testid="auth-screen">
      {/* BG Image — dimmed + desaturated */}
      {Platform.OS === 'web' ? (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${BG})`, backgroundSize: 'cover', backgroundPosition: 'center 40%', filter: 'brightness(0.38) saturate(0.8)' } as any} />
      ) : (
        <Image source={{ uri: BG }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.38 }} resizeMode="cover" />
      )}
      {/* Multi-stop gradient overlay */}
      {Platform.OS === 'web' && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,19,24,0.15) 0%, rgba(15,19,24,0.35) 35%, rgba(15,19,24,0.7) 70%, rgba(15,19,24,0.92) 100%)' } as any} />
      )}

      <Animated.View style={{ flex: 1, opacity: fadeMain }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 30, maxWidth: 440, width: '100%', alignSelf: 'center', paddingBottom: 44 }}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* ─── LOGO AREA with stagger ─── */}
          <Animated.View style={{ alignItems: 'center', marginBottom: 40, opacity: fadeMain, transform: [{ translateY: slideLogo }] }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, overflow: 'hidden', marginBottom: 22, flexDirection: 'row', borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.20)' }}>
              <View style={{ flex: 1, backgroundColor: '#002395' }} /><View style={{ flex: 1, backgroundColor: '#FFF' }} /><View style={{ flex: 1, backgroundColor: '#ED2939' }} />
            </View>
            <Image source={require('../assets/images/logo_black.png')} style={{ width: 175, height: 54 }} resizeMode="contain" />
            <Text style={{ fontSize: 10, fontWeight: '500', color: T.textSoft, marginTop: 12, letterSpacing: 3, textTransform: 'uppercase' }}>
              L'innovation au service de la sante
            </Text>
          </Animated.View>

          {/* ─── FORM with delayed stagger ─── */}
          <Animated.View style={{ opacity: fadeForm, transform: [{ translateY: slideForm }] }}>
            {isLogin ? (
              <>
                {/* Title with subtle glass header */}
                <View style={{ alignItems: 'center', marginBottom: 30 }}>
                  <Text style={{ fontSize: 24, fontWeight: '800', color: T.text, letterSpacing: 2, textTransform: 'uppercase' }}>Connexion</Text>
                </View>

                <ErrorBanner />
                <GlassInput testID="reg-email" label="Email" val={email} onChange={setEmail} placeholder="votre@email.com" />
                <GlassInput testID="auth-input-password" label="Mot de passe" val={password} onChange={setPassword} placeholder="..." type={showPw ? 'text' : 'password'} />
                <View style={{ height: 8 }} />
                <PillCTA testID="auth-submit-btn" label="Connexion" onPress={handleLogin} loading={submitting} />
                <TouchableOpacity style={{ alignItems: 'center', marginTop: 20 }}>
                  <Text style={{ color: T.textMid, fontSize: 14, fontWeight: '500', fontStyle: 'italic' }}>Mot de passe oublie ?</Text>
                </TouchableOpacity>
                <View style={{ alignItems: 'center', marginTop: 30 }}>
                  <Text style={{ color: T.textSoft, fontSize: 14 }}>
                    Pas encore de compte ?{' '}
                    <Text style={{ fontWeight: '700', color: T.text, textDecorationLine: 'underline' }} onPress={() => { setIsLogin(false); setStep(0); setError(''); }}>S'inscrire ici.</Text>
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: T.text, letterSpacing: 1.5, textTransform: 'uppercase' }}>Inscription</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
                  {[0,1,2].map(i => <View key={i} style={{ width: i <= step ? 20 : 5, height: 3, borderRadius: 1.5, backgroundColor: i <= step ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.15)' }} />)}
                </View>
                <ErrorBanner />
                {step === 0 && (<>
                  <GlassInput testID="reg-name" label="Nom complet" val={name} onChange={setName} placeholder="Jean Dupont" />
                  <GlassInput testID="reg-email" label="Email" val={email} onChange={setEmail} placeholder="email@exemple.com" type="email" />
                  <GlassInput testID="reg-phone" label="Telephone" val={phone} onChange={setPhone} placeholder="06 12 34 56 78" type="tel" />
                  <GlassInput testID="reg-password" label="Mot de passe" val={password} onChange={setPassword} placeholder="Min. 6 caracteres" type="password" />
                  <PillCTA testID="next-step" label="Suivant" onPress={() => { if (!name || !email || !password) return setError('Remplissez tous les champs'); setError(''); setStep(1); }} />
                  <View style={{ alignItems: 'center', marginTop: 22 }}>
                    <Text style={{ color: T.textSoft, fontSize: 14 }}>Deja un compte ? <Text style={{ fontWeight: '700', color: T.text, textDecorationLine: 'underline' }} onPress={() => { setIsLogin(true); setStep(0); setError(''); }}>Se connecter.</Text></Text>
                  </View>
                </>)}
                {step === 1 && (<>
                  <Text style={{ fontSize: 13, color: T.textMid, textAlign: 'center', marginBottom: 22 }}>Selectionnez votre usage</Text>
                  {[{ r: 'beneficiary', icon: 'person-outline', t: 'Beneficiaire', d: 'Porteur de dispositifs de sante' },
                    { r: 'guardian', icon: 'people-outline', t: 'Gardien', d: 'Aidant ou professionnel' }].map(o => (
                    <TouchableOpacity key={o.r} activeOpacity={0.75} onPress={() => { setRole(o.r); setStep(2); }}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: T.rCard, marginBottom: 12,
                        backgroundColor: role === o.r ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)',
                        borderWidth: 0.5, borderColor: role === o.r ? 'rgba(255,255,255,0.25)' : T.stroke,
                        ...web({ backdropFilter: T.blur, WebkitBackdropFilter: T.blur, boxShadow: T.shadowFull }) }}>
                      <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.10)', justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name={o.icon as any} size={20} color="rgba(255,255,255,0.85)" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: T.text }}>{o.t}</Text>
                        <Text style={{ fontSize: 12, color: T.textSoft, marginTop: 3 }}>{o.d}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={T.textSoft} />
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 14 }} onPress={() => setStep(0)}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: T.textSoft }}>Retour</Text>
                  </TouchableOpacity>
                </>)}
                {step === 2 && role === 'beneficiary' && (<>
                  <GlassInput label="Date de naissance" val={dob} onChange={setDob} placeholder="JJ/MM/AAAA" />
                  <GlassInput label="Adresse" val={address} onChange={setAddress} placeholder="14 rue de la Republique" />
                  <GlassInput label="Allergies" val={allergies} onChange={setAllergies} placeholder="Penicilline..." />
                  <GlassInput label="Contact urgence" val={ecName} onChange={setEcName} placeholder="Marie Dupont" />
                </>)}
                {step === 2 && role === 'guardian' && (<>
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
                    {[{id:'particular',l:'Particulier'},{id:'professional',l:'Professionnel'}].map(t => (
                      <TouchableOpacity key={t.id} style={{ flex: 1, paddingVertical: 15, borderRadius: T.rPill, alignItems: 'center',
                        backgroundColor: guardianType===t.id ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.05)',
                        borderWidth: 0.5, borderColor: guardianType===t.id ? T.strokeFocus : T.stroke }} onPress={() => setGuardianType(t.id)}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: T.text }}>{t.l}</Text>
                      </TouchableOpacity>))}
                  </View>
                  {guardianType === 'particular' && <GlassInput label="Lien" val={relationship} onChange={setRelationship} placeholder="Fils, fille..." />}
                  {guardianType === 'professional' && (<><GlassInput label="Structure" val={structureName} onChange={setStructureName} placeholder="SAAD..." /><GlassInput label="SIRET" val={siret} onChange={setSiret} placeholder="123 456 789 00001" /></>)}
                </>)}
                {step === 2 && (
                  <View style={{ flexDirection: 'row', gap: 14, marginTop: 10 }}>
                    <View style={{ flex: 0.38 }}><PillCTA label="Retour" onPress={() => setStep(1)} ghost /></View>
                    <View style={{ flex: 0.62 }}><PillCTA testID="auth-submit-btn" label="S'inscrire" onPress={handleRegister} loading={submitting} /></View>
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
