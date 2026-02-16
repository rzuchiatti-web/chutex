import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { Glass, Radius, Space, Type } from '../src/constants/colors';

const WebInput = ({ testID, label, val, onChange, placeholder, type }: any) => {
  if (Platform.OS === 'web') {
    return (
      <div style={{ marginBottom: 16 }}>
        {label && <div style={{ fontSize: 11, fontWeight: '500', color: '#94A3B8', marginBottom: 8, letterSpacing: 0.5 }}>{label}</div>}
        <input data-testid={testID} type={type || 'text'} value={val} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: '100%', fontSize: 15, fontFamily: 'system-ui', fontWeight: '400', padding: '16px 18px', borderRadius: 16, border: '1px solid rgba(59,130,246,0.15)', background: 'rgba(30,41,59,0.5)', color: '#F8FAFC', boxSizing: 'border-box' as any, backdropFilter: 'blur(20px)', outline: 'none', transition: 'all 0.25s ease' }}
          onFocus={(e: any) => { e.target.style.borderColor = 'rgba(59,130,246,0.5)'; e.target.style.boxShadow = '0 0 20px rgba(59,130,246,0.15)'; }}
          onBlur={(e: any) => { e.target.style.borderColor = 'rgba(59,130,246,0.15)'; e.target.style.boxShadow = 'none'; }} />
      </div>
    );
  }
  const { TextInput: RNTextInput } = require('react-native');
  return (
    <View style={{ marginBottom: 16 }}>
      {label && <Text style={{ fontSize: 11, fontWeight: '500', color: '#94A3B8', marginBottom: 8, letterSpacing: 0.5 }}>{label}</Text>}
      <RNTextInput testID={testID} value={val} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#475569"
        secureTextEntry={type === 'password'} autoCapitalize="none" keyboardType={type === 'email' ? 'email-address' : type === 'tel' ? 'phone-pad' : 'default'}
        style={{ fontSize: 15, fontWeight: '400', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(59,130,246,0.15)', backgroundColor: 'rgba(30,41,59,0.5)', color: '#F8FAFC' }} />
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
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!loading && user && !hasRedirected.current) { hasRedirected.current = true; router.replace('/(tabs)'); }
    if (!loading && !user) hasRedirected.current = false;
  }, [user, loading]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
    // Subtle pulse on logo
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
    ])).start();
  }, []);

  if (loading || user) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}><ActivityIndicator size="large" color="#3B82F6" /></View>;

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
      await register({ email: email.trim().toLowerCase(), password, name, phone, role, date_of_birth: dob, gender, address, height_cm: heightCm ? parseFloat(heightCm) : undefined, weight_kg: weightKg ? parseFloat(weightKg) : undefined, blood_type: bloodType, allergies, medical_conditions: medConditions, emergency_contact_name: ecName, emergency_contact_phone: ecPhone, doctor_name: doctorName, guardian_type: guardianType, structure_name: structureName, siret, profession, relationship });
      hasRedirected.current = true; router.replace('/(tabs)');
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setSubmitting(false); }
  };

  const GlowBtn = ({ testID, label, onPress, disabled, loading: ld, outline }: any) => {
    if (Platform.OS === 'web') {
      return (
        <div data-testid={testID} onClick={disabled || ld ? undefined : onPress}
          style={{ background: outline ? 'transparent' : 'linear-gradient(135deg, #3B82F6, #2563EB)', border: outline ? '1.5px solid rgba(59,130,246,0.3)' : 'none', borderRadius: 9999, padding: '16px 0', textAlign: 'center', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, boxShadow: outline ? 'none' : '0 4px 24px rgba(59,130,246,0.35)', transition: 'all 0.25s ease', flex: outline ? 1 : undefined } as any}
          onMouseEnter={(e: any) => { if (!outline) e.currentTarget.style.boxShadow = '0 6px 32px rgba(59,130,246,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e: any) => { if (!outline) e.currentTarget.style.boxShadow = '0 4px 24px rgba(59,130,246,0.35)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
          {ld ? <span style={{ color: '#FFF' }}>...</span> : <span style={{ color: outline ? '#94A3B8' : '#FFF', fontSize: 15, fontWeight: '700' }}>{label}</span>}
        </div>
      );
    }
    return (
      <TouchableOpacity testID={testID} disabled={disabled || ld} onPress={onPress} activeOpacity={0.8}
        style={[{ paddingVertical: 16, borderRadius: Radius.full, alignItems: 'center' }, outline ? { borderWidth: 1.5, borderColor: 'rgba(59,130,246,0.3)', flex: 1 } : { backgroundColor: '#3B82F6' }]}>
        {ld ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: outline ? '#94A3B8' : '#FFF', ...Type.button }}>{label}</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      {/* Subtle gradient glow */}
      {Platform.OS === 'web' && <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: 9999, background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' } as any} />}

      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1, maxWidth: 420, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <Animated.View style={{ alignItems: 'center', marginTop: 56, marginBottom: 48, transform: [{ scale: pulseAnim }] }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginBottom: 20, ...(Platform.OS === 'web' ? { boxShadow: '0 0 40px rgba(59,130,246,0.4)' } : {}) }}>
              <Ionicons name="shield-checkmark" size={28} color="#FFF" />
            </View>
            <Text style={{ fontSize: 32, fontWeight: '800', color: '#F8FAFC', letterSpacing: 6 }}>CHUTEX</Text>
            <Text style={{ fontSize: 12, fontWeight: '400', color: '#3B82F6', marginTop: 6, letterSpacing: 4 }}>HEALTH</Text>
          </Animated.View>

          {/* Tabs */}
          <View style={{ flexDirection: 'row', padding: 3, marginBottom: 32, backgroundColor: 'rgba(30,41,59,0.6)', borderRadius: Radius.full, borderWidth: 1, borderColor: 'rgba(59,130,246,0.1)' }}>
            <TouchableOpacity testID="auth-tab-login" style={[{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: Radius.full }, isLogin && { backgroundColor: '#3B82F6' }]} onPress={() => { setIsLogin(true); setStep(0); }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: isLogin ? '#FFF' : '#64748B' }}>Connexion</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="auth-tab-register" style={[{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: Radius.full }, !isLogin && { backgroundColor: '#3B82F6' }]} onPress={() => { setIsLogin(false); setStep(0); }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: !isLogin ? '#FFF' : '#64748B' }}>Inscription</Text>
            </TouchableOpacity>
          </View>

          {error ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: Radius.md, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' }} />
            <Text style={{ fontSize: 13, color: '#EF4444', flex: 1, fontWeight: '500' }}>{error}</Text>
          </View> : null}

          {/* LOGIN */}
          {isLogin && (<>
            <WebInput testID="reg-email" label="Email ou telephone" val={email} onChange={setEmail} placeholder="email@exemple.com" />
            <WebInput testID="auth-input-password" label="Mot de passe" val={password} onChange={setPassword} placeholder="Mot de passe" type={showPw ? 'text' : 'password'} />
            <View style={{ height: 8 }} />
            <GlowBtn testID="auth-submit-btn" label="Se connecter" onPress={handleLogin} loading={submitting} />
          </>)}

          {/* REGISTER */}
          {!isLogin && (<>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
              {[0, 1, 2].map(i => <View key={i} style={{ width: i <= step ? 32 : 8, height: 4, borderRadius: 2, backgroundColor: i <= step ? '#3B82F6' : 'rgba(59,130,246,0.15)' }} />)}
            </View>

            {step === 0 && (<>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#F8FAFC', marginBottom: 24 }}>Informations generales</Text>
              <WebInput testID="reg-name" label="Nom complet" val={name} onChange={setName} placeholder="Jean Dupont" />
              <WebInput testID="reg-email" label="Email" val={email} onChange={setEmail} placeholder="email@exemple.com" type="email" />
              <WebInput testID="reg-phone" label="Telephone" val={phone} onChange={setPhone} placeholder="06 12 34 56 78" type="tel" />
              <WebInput testID="reg-password" label="Mot de passe" val={password} onChange={setPassword} placeholder="Min. 6 caracteres" type={showPw ? 'text' : 'password'} />
              <GlowBtn testID="next-step" label="Suivant" onPress={() => { if (!name || !email || !password) return setError('Remplissez tous les champs'); setError(''); setStep(1); }} />
            </>)}

            {step === 1 && (<>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#F8FAFC', textAlign: 'center', marginBottom: 6 }}>Votre profil</Text>
              <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 28 }}>Selectionnez votre mode d'utilisation</Text>

              <TouchableOpacity activeOpacity={0.7} onPress={() => { setRole('beneficiary'); setStep(2); }}>
                <View style={{ backgroundColor: role === 'beneficiary' ? 'rgba(59,130,246,0.15)' : 'rgba(30,41,59,0.6)', borderRadius: Radius.lg, borderWidth: 1.5, borderColor: role === 'beneficiary' ? '#3B82F6' : 'rgba(59,130,246,0.1)', padding: 24, alignItems: 'center', marginBottom: 12, ...Glass }}>
                  <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
                    <Ionicons name="person-outline" size={24} color="#FFF" />
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: '#F8FAFC', marginBottom: 6 }}>Beneficiaire</Text>
                  <Text style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 18 }}>Vous souhaitez utiliser les dispositifs de sante Chutex.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.7} onPress={() => { setRole('guardian'); setStep(2); }}>
                <View style={{ backgroundColor: role === 'guardian' ? 'rgba(16,185,129,0.15)' : 'rgba(30,41,59,0.6)', borderRadius: Radius.lg, borderWidth: 1.5, borderColor: role === 'guardian' ? '#10B981' : 'rgba(59,130,246,0.1)', padding: 24, alignItems: 'center', marginBottom: 12, ...Glass }}>
                  <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
                    <Ionicons name="people-outline" size={24} color="#FFF" />
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: '#F8FAFC', marginBottom: 6 }}>Gardien</Text>
                  <Text style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 18 }}>Vous etes un aidant souhaitant accompagner un beneficiaire.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 14 }} onPress={() => setStep(0)}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748B' }}>Retour</Text>
              </TouchableOpacity>
            </>)}

            {step === 2 && role === 'beneficiary' && (<>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#F8FAFC', marginBottom: 24 }}>Informations beneficiaire</Text>
              <WebInput label="Date de naissance" val={dob} onChange={setDob} placeholder="JJ/MM/AAAA" />
              <Text style={{ fontSize: 11, fontWeight: '500', color: '#94A3B8', marginBottom: 8, letterSpacing: 0.5 }}>Genre</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {['Homme', 'Femme', 'Autre'].map(g => <TouchableOpacity key={g} style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: Radius.full, borderWidth: 1.5, borderColor: gender === g ? '#3B82F6' : 'rgba(59,130,246,0.15)', backgroundColor: gender === g ? 'rgba(59,130,246,0.2)' : 'transparent' }} onPress={() => setGender(g)}><Text style={{ fontSize: 13, fontWeight: '600', color: gender === g ? '#3B82F6' : '#64748B' }}>{g}</Text></TouchableOpacity>)}
              </View>
              <WebInput label="Adresse" val={address} onChange={setAddress} placeholder="14 rue de la Republique" />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}><WebInput label="Taille (cm)" val={heightCm} onChange={setHeightCm} placeholder="170" /></View>
                <View style={{ flex: 1 }}><WebInput label="Poids (kg)" val={weightKg} onChange={setWeightKg} placeholder="70" /></View>
              </View>
              <WebInput label="Allergies" val={allergies} onChange={setAllergies} placeholder="Penicilline, arachides..." />
              <WebInput label="Pathologies" val={medConditions} onChange={setMedConditions} placeholder="Diabete, hypertension..." />
              <WebInput label="Medecin traitant" val={doctorName} onChange={setDoctorName} placeholder="Dr. Dupont" />
              <WebInput label="Contact urgence - Nom" val={ecName} onChange={setEcName} placeholder="Marie Dupont" />
              <WebInput label="Contact urgence - Tel" val={ecPhone} onChange={setEcPhone} placeholder="06 98 76 54 32" type="tel" />
            </>)}

            {step === 2 && role === 'guardian' && (<>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#F8FAFC', marginBottom: 24 }}>Informations gardien</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                {[{ id: 'particular', l: 'Particulier' }, { id: 'professional', l: 'Professionnel' }].map(t => (
                  <TouchableOpacity key={t.id} style={{ flex: 1, paddingVertical: 14, borderRadius: Radius.md, borderWidth: 1.5, borderColor: guardianType === t.id ? '#3B82F6' : 'rgba(59,130,246,0.15)', backgroundColor: guardianType === t.id ? 'rgba(59,130,246,0.2)' : 'transparent', alignItems: 'center' }} onPress={() => setGuardianType(t.id)}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: guardianType === t.id ? '#3B82F6' : '#64748B' }}>{t.l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {guardianType === 'particular' && <WebInput label="Lien" val={relationship} onChange={setRelationship} placeholder="Fils, fille, voisin..." />}
              {guardianType === 'professional' && (<>
                <WebInput label="Structure / Societe" val={structureName} onChange={setStructureName} placeholder="SAAD Exemple" />
                <WebInput label="SIRET" val={siret} onChange={setSiret} placeholder="123 456 789 00001" />
                <WebInput label="Profession" val={profession} onChange={setProfession} placeholder="Aide-soignant, infirmier..." />
              </>)}
            </>)}

            {step === 2 && (
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                <GlowBtn label="Retour" onPress={() => setStep(1)} outline />
                <View style={{ flex: 2 }}>
                  <GlowBtn testID="auth-submit-btn" label="S'inscrire" onPress={handleRegister} loading={submitting} />
                </View>
              </View>
            )}
          </>)}

          {/* Footer */}
          <View style={{ alignItems: 'center', marginTop: 40, paddingBottom: 20 }}>
            <Text style={{ fontSize: 11, color: '#334155' }}>Chutex Innovation - v1.0.5</Text>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}
