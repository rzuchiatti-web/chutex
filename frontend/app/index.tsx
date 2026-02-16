import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { Palette, Radius, Space, Type, GlassCard } from '../src/constants/colors';

const webShadow = Platform.OS === 'web' ? { boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};
const webGlow = Platform.OS === 'web' ? { boxShadow: '0 4px 20px rgba(255,255,255,0.08)' } : {};

const HudCorner = ({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) => {
  const s = 12;
  const c = 'rgba(255,255,255,0.12)';
  const map: Record<string, any> = {
    tl: { top: 6, left: 6, borderTopWidth: 1, borderLeftWidth: 1 },
    tr: { top: 6, right: 6, borderTopWidth: 1, borderRightWidth: 1 },
    bl: { bottom: 6, left: 6, borderBottomWidth: 1, borderLeftWidth: 1 },
    br: { bottom: 6, right: 6, borderBottomWidth: 1, borderRightWidth: 1 },
  };
  return <View style={[{ position: 'absolute', width: s, height: s, borderColor: c }, map[pos]]} />;
};

const ClinicInput = ({ testID, label, val, onChange, placeholder, type }: any) => {
  if (Platform.OS === 'web') {
    return (
      <div style={{ marginBottom: 14 }}>
        {label && <div style={{ fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.03)', marginBottom: 7, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>}
        <input data-testid={testID} type={type || 'text'} value={val} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
          style={{
            width: '100%', fontSize: 15, fontFamily: 'system-ui, Inter, sans-serif', fontWeight: '500',
            padding: '14px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.10)',
            background: 'rgba(255,255,255,0.04)', color: colors.textPrimary,
            boxSizing: 'border-box' as any, outline: 'none', transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          } as any}
          onFocus={(e: any) => { e.target.style.borderColor = 'rgba(255,255,255,0.25)'; e.target.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.04)'; }}
          onBlur={(e: any) => { e.target.style.borderColor = 'rgba(255,255,255,0.10)'; e.target.style.boxShadow = 'none'; }}
        />
      </div>
    );
  }
  const { TextInput: RNTextInput } = require('react-native');
  return (
    <View style={{ marginBottom: 14 }}>
      {label && <Text style={{ fontSize: 10, fontWeight: '700', color: Palette.textDim, marginBottom: 7, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</Text>}
      <RNTextInput testID={testID} value={val} onChangeText={onChange} placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.25)" secureTextEntry={type === 'password'}
        autoCapitalize="none" keyboardType={type === 'email' ? 'email-address' : type === 'tel' ? 'phone-pad' : 'default'}
        style={{ fontSize: 15, padding: 14, borderRadius: 14, backgroundColor: colors.surface, color: Palette.text, borderWidth: 1, borderColor: Palette.line }} />
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
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Check onboarding status
  useEffect(() => {
    AsyncStorage.getItem('chutex_onboarding_done').then(val => {
      if (!val) {
        router.replace('/onboarding');
      } else {
        setOnboardingChecked(true);
      }
    }).catch(() => setOnboardingChecked(true));
  }, []);

  useEffect(() => {
    if (!loading && user && !hasRedirected.current) { hasRedirected.current = true; router.replace('/(tabs)'); }
    if (!loading && !user) hasRedirected.current = false;
  }, [user, loading]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
  }, []);

  if (loading || user || !onboardingChecked) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}><ActivityIndicator size="large" color={colors.textPrimary} /></View>;
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

  const PillBtn = ({ testID, label, onPress, loading: ld, outline }: any) => (
    <TouchableOpacity testID={testID} disabled={ld} onPress={onPress} activeOpacity={0.8}
      style={[{
        paddingVertical: 16, borderRadius: Radius.full, alignItems: 'center',
      }, outline
        ? { backgroundColor: colors.surface, flex: 1, borderWidth: 1, borderColor: Palette.line }
        : { backgroundColor: '#FFFFFF', ...webGlow }
      ]}>
      {ld ? <ActivityIndicator color={outline ? Palette.textMuted : '#000'} />
        : <Text style={{ color: outline ? Palette.textMuted : '#000000', fontSize: 15, fontWeight: '700' }}>{label}</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} data-testid="auth-screen">
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1, maxWidth: 420, width: '100%', alignSelf: 'center' }}
          keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <View style={{ alignItems: 'center', marginTop: 48, marginBottom: 40 }}>
            <Image source={require('../assets/images/logo_white.png')} style={{ width: 140, height: 46 }} resizeMode="contain" />
            <Text style={{ fontSize: 10, fontWeight: '700', color: Palette.textDim, marginTop: 8, letterSpacing: 3, textTransform: 'uppercase' }}>
              Sante connectee
            </Text>
          </View>

          {/* Glass card container */}
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: Radius.lg,
            borderWidth: 1,
            borderColor: Palette.line,
            padding: 24,
            marginBottom: 20,
            position: 'relative' as const,
            overflow: 'hidden' as const,
            ...webShadow,
          }}>
            <HudCorner pos="tl" /><HudCorner pos="tr" /><HudCorner pos="bl" /><HudCorner pos="br" />

            {/* Tab selector */}
            <View style={{ flexDirection: 'row', marginBottom: 24, backgroundColor: colors.surface, borderRadius: Radius.full, padding: 3, borderWidth: 1, borderColor: Palette.lineFaint }}>
              <TouchableOpacity testID="auth-tab-login"
                style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.full },
                  isLogin && { backgroundColor: colors.secondary }]}
                onPress={() => { setIsLogin(true); setStep(0); setError(''); }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: isLogin ? Palette.text : Palette.textDim }}>Connexion</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="auth-tab-register"
                style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.full },
                  !isLogin && { backgroundColor: colors.secondary }]}
                onPress={() => { setIsLogin(false); setStep(0); setError(''); }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: !isLogin ? Palette.text : Palette.textDim }}>Inscription</Text>
              </TouchableOpacity>
            </View>

            {/* Error */}
            {error ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Palette.dangerWeak, borderRadius: 14, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Palette.danger }} />
                <Text style={{ fontSize: 12, color: '#EF4444', flex: 1 }}>{error}</Text>
              </View>
            ) : null}

            {/* LOGIN FORM */}
            {isLogin && (<>
              <ClinicInput testID="reg-email" label="Email ou telephone" val={email} onChange={setEmail} placeholder="email@exemple.com" />
              <ClinicInput testID="auth-input-password" label="Mot de passe" val={password} onChange={setPassword} placeholder="Mot de passe" type={showPw ? 'text' : 'password'} />
              <View style={{ height: 6 }} />
              <PillBtn testID="auth-submit-btn" label="Se connecter" onPress={handleLogin} loading={submitting} />
            </>)}

            {/* REGISTER FORM */}
            {!isLogin && (<>
              {/* Progress */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
                {[0, 1, 2].map(i => (
                  <View key={i} style={{ width: i <= step ? 24 : 6, height: 4, borderRadius: 2, backgroundColor: i <= step ? '#FFFFFF' : 'rgba(255,255,255,0.12)' }} />
                ))}
              </View>

              {step === 0 && (<>
                <Text style={{ fontSize: 20, fontWeight: '800', color: Palette.text, marginBottom: 18, letterSpacing: -0.3 }}>Informations generales</Text>
                <ClinicInput testID="reg-name" label="Nom complet" val={name} onChange={setName} placeholder="Jean Dupont" />
                <ClinicInput testID="reg-email" label="Email" val={email} onChange={setEmail} placeholder="email@exemple.com" type="email" />
                <ClinicInput testID="reg-phone" label="Telephone" val={phone} onChange={setPhone} placeholder="06 12 34 56 78" type="tel" />
                <ClinicInput testID="reg-password" label="Mot de passe" val={password} onChange={setPassword} placeholder="Min. 6 caracteres" type={showPw ? 'text' : 'password'} />
                <PillBtn testID="next-step" label="Suivant" onPress={() => { if (!name || !email || !password) return setError('Remplissez tous les champs'); setError(''); setStep(1); }} />
              </>)}

              {step === 1 && (<>
                <Text style={{ fontSize: 20, fontWeight: '800', color: Palette.text, textAlign: 'center', marginBottom: 4 }}>Votre profil</Text>
                <Text style={{ fontSize: 13, color: Palette.textMuted, textAlign: 'center', marginBottom: 20 }}>Selectionnez votre usage</Text>
                {[
                  { r: 'beneficiary', icon: 'person-outline', t: 'Beneficiaire', d: 'Porteur de dispositifs de sante Chutex' },
                  { r: 'guardian', icon: 'people-outline', t: 'Gardien', d: 'Aidant ou professionnel accompagnant un proche' },
                ].map(o => (
                  <TouchableOpacity key={o.r} activeOpacity={0.7} onPress={() => { setRole(o.r); setStep(2); }}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: Radius.lg, marginBottom: 10,
                      backgroundColor: role === o.r ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                      borderWidth: 1, borderColor: role === o.r ? 'rgba(255,255,255,0.20)' : Palette.lineFaint,
                    }}>
                    <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: role === o.r ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name={o.icon as any} size={20} color={role === o.r ? '#FFF' : Palette.textDim} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: Palette.text }}>{o.t}</Text>
                      <Text style={{ fontSize: 11, color: Palette.textMuted, marginTop: 2 }}>{o.d}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Palette.textDim} />
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 12 }} onPress={() => setStep(0)}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: Palette.textDim }}>Retour</Text>
                </TouchableOpacity>
              </>)}

              {step === 2 && role === 'beneficiary' && (<>
                <Text style={{ fontSize: 20, fontWeight: '800', color: Palette.text, marginBottom: 18 }}>Profil beneficiaire</Text>
                <ClinicInput label="Date de naissance" val={dob} onChange={setDob} placeholder="JJ/MM/AAAA" />
                <Text style={{ fontSize: 10, fontWeight: '700', color: Palette.textDim, marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>Genre</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                  {['Homme', 'Femme', 'Autre'].map(g => (
                    <TouchableOpacity key={g} style={{
                      paddingVertical: 9, paddingHorizontal: 16, borderRadius: Radius.full,
                      backgroundColor: gender === g ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
                      borderWidth: 1, borderColor: gender === g ? 'rgba(255,255,255,0.25)' : Palette.lineFaint,
                    }} onPress={() => setGender(g)}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: gender === g ? Palette.text : Palette.textDim }}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <ClinicInput label="Adresse" val={address} onChange={setAddress} placeholder="14 rue de la Republique" />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}><ClinicInput label="Taille (cm)" val={heightCm} onChange={setHeightCm} placeholder="170" /></View>
                  <View style={{ flex: 1 }}><ClinicInput label="Poids (kg)" val={weightKg} onChange={setWeightKg} placeholder="70" /></View>
                </View>
                <ClinicInput label="Allergies" val={allergies} onChange={setAllergies} placeholder="Penicilline, arachides..." />
                <ClinicInput label="Pathologies" val={medConditions} onChange={setMedConditions} placeholder="Diabete, hypertension..." />
                <ClinicInput label="Medecin" val={doctorName} onChange={setDoctorName} placeholder="Dr. Dupont" />
                <ClinicInput label="Contact urgence" val={ecName} onChange={setEcName} placeholder="Marie Dupont" />
                <ClinicInput label="Tel. urgence" val={ecPhone} onChange={setEcPhone} placeholder="06 98 76 54 32" type="tel" />
              </>)}

              {step === 2 && role === 'guardian' && (<>
                <Text style={{ fontSize: 20, fontWeight: '800', color: Palette.text, marginBottom: 18 }}>Profil gardien</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                  {[{ id: 'particular', l: 'Particulier' }, { id: 'professional', l: 'Professionnel' }].map(t => (
                    <TouchableOpacity key={t.id} style={{
                      flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center',
                      backgroundColor: guardianType === t.id ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                      borderWidth: 1, borderColor: guardianType === t.id ? 'rgba(255,255,255,0.20)' : Palette.lineFaint,
                    }} onPress={() => setGuardianType(t.id)}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: guardianType === t.id ? Palette.text : Palette.textDim }}>{t.l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {guardianType === 'particular' && <ClinicInput label="Lien" val={relationship} onChange={setRelationship} placeholder="Fils, fille, voisin..." />}
                {guardianType === 'professional' && (<>
                  <ClinicInput label="Structure" val={structureName} onChange={setStructureName} placeholder="SAAD Exemple" />
                  <ClinicInput label="SIRET" val={siret} onChange={setSiret} placeholder="123 456 789 00001" />
                  <ClinicInput label="Profession" val={profession} onChange={setProfession} placeholder="Aide-soignant..." />
                </>)}
              </>)}

              {step === 2 && (
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                  <PillBtn label="Retour" onPress={() => setStep(1)} outline />
                  <View style={{ flex: 2 }}><PillBtn testID="auth-submit-btn" label="S'inscrire" onPress={handleRegister} loading={submitting} /></View>
                </View>
              )}
            </>)}
          </View>

          <Text style={{ fontSize: 10, color: Palette.textDim, textAlign: 'center', marginTop: 12, letterSpacing: 0.5 }}>
            Chutex Innovation — v2.0
          </Text>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}
