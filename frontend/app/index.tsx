import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, ActivityIndicator, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 8px 32px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(255,255,255,0.6)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 20, marginBottom: 12, ...glass }, style]}>{children}</View>
);
const WebInput = ({ testID, label, val, onChange, placeholder, type }: any) => Platform.OS === 'web' ? (
  <div style={{ marginBottom: 14 }}>
    {label && <div style={{ fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 6, textTransform: 'uppercase' as any, letterSpacing: 1 }}>{label}</div>}
    <input data-testid={testID} type={type || 'text'} value={val} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', fontSize: 15, padding: '14px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.65)', fontFamily: 'system-ui, -apple-system, sans-serif', boxSizing: 'border-box' as any, backdropFilter: 'blur(20px)' }} />
  </div>
) : null;

export default function AuthScreen() {
  const { user, loading, login, register } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(0); // 0=info, 1=choose role, 2=role-specific
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  // Beneficiary fields
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
  // Guardian fields
  const [guardianType, setGuardianType] = useState('particular');
  const [relationship, setRelationship] = useState('');
  const [structureName, setStructureName] = useState('');
  const [profession, setProfession] = useState('');
  const [siret, setSiret] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!loading && user && !hasRedirected.current) { hasRedirected.current = true; router.replace('/(tabs)'); }
    if (!loading && !user) hasRedirected.current = false;
  }, [user, loading]);

  if (loading || user) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0EB' }}><ActivityIndicator size="large" color="#000" /></View>;

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0EB' }}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1, maxWidth: 480, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ alignItems: 'center', marginTop: 32, marginBottom: 28 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000', marginBottom: 14, ...glass }}>
            <Ionicons name="shield-checkmark" size={26} color="#000" />
          </View>
          <Text style={{ fontSize: 32, fontWeight: '900', color: '#000', letterSpacing: 6 }}>CHUTEX</Text>
          <View style={{ width: 40, height: 2, backgroundColor: '#000', borderRadius: 1, marginTop: 10 }} />
        </View>

        {/* Login/Register tabs */}
        <GlassCard style={{ flexDirection: 'row', padding: 4, marginBottom: 20 }}>
          <TouchableOpacity testID="auth-tab-login" style={[{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 18 }, isLogin && { backgroundColor: '#000' }]} onPress={() => { setIsLogin(true); setStep(0); }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: isLogin ? '#FFF' : '#888' }}>Connexion</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="auth-tab-register" style={[{ flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 18 }, !isLogin && { backgroundColor: '#000' }]} onPress={() => { setIsLogin(false); setStep(0); }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: !isLogin ? '#FFF' : '#888' }}>Inscription</Text>
          </TouchableOpacity>
        </GlassCard>

        {error ? <GlassCard style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(229,57,53,0.08)', borderColor: 'rgba(229,57,53,0.2)' }}><Ionicons name="alert-circle" size={16} color="#E53935" /><Text style={{ fontSize: 13, color: '#E53935', flex: 1 }}>{error}</Text></GlassCard> : null}

        {/* LOGIN */}
        {isLogin && (<>
          <WebInput testID="reg-email" label="Email ou telephone" val={email} onChange={setEmail} placeholder="email@exemple.com ou 06 12 34 56 78" />
          <WebInput testID="auth-input-password" label="Mot de passe" val={password} onChange={setPassword} placeholder="Mot de passe" type={showPw ? 'text' : 'password'} />
          <TouchableOpacity testID="auth-submit-btn" style={{ backgroundColor: '#000', paddingVertical: 16, borderRadius: 9999, alignItems: 'center', marginTop: 8 }} onPress={handleLogin} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>SE CONNECTER</Text>}
          </TouchableOpacity>
        </>)}

        {/* REGISTER */}
        {!isLogin && (<>
          {/* Progress */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
            {[0, 1, 2].map(i => <View key={i} style={{ width: 36, height: 3, borderRadius: 2, backgroundColor: i <= step ? '#000' : '#DDD' }} />)}
          </View>

          {/* Step 0: General info */}
          {step === 0 && (<>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#000', marginBottom: 16 }}>Informations generales</Text>
            <WebInput testID="reg-name" label="Nom complet" val={name} onChange={setName} placeholder="Jean Dupont" />
            <WebInput testID="reg-email" label="Email" val={email} onChange={setEmail} placeholder="email@exemple.com" type="email" />
            <WebInput testID="reg-phone" label="Telephone" val={phone} onChange={setPhone} placeholder="06 12 34 56 78" type="tel" />
            <WebInput testID="reg-password" label="Mot de passe" val={password} onChange={setPassword} placeholder="Min. 6 caracteres" type={showPw ? 'text' : 'password'} />
            <TouchableOpacity testID="next-step" style={{ backgroundColor: '#000', paddingVertical: 14, borderRadius: 9999, alignItems: 'center', marginTop: 8 }} onPress={() => { if (!name || !email || !password) return setError('Remplissez tous les champs'); setError(''); setStep(1); }}>
              <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>SUIVANT</Text>
            </TouchableOpacity>
          </>)}

          {/* Step 1: Choose role - like the screenshot */}
          {step === 1 && (<>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#000', textAlign: 'center', textTransform: 'uppercase', marginBottom: 4 }}>Inscription</Text>
            <Text style={{ fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 }}>Selectionnez votre mode d'utilisation</Text>

            <GlassCard style={{ alignItems: 'center', padding: 24, borderWidth: role === 'beneficiary' ? 2.5 : 1, borderColor: role === 'beneficiary' ? '#000' : 'rgba(255,255,255,0.7)' }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#000' }}>BENEFICIAIRE</Text>
              <Text style={{ fontSize: 12, color: '#888', textAlign: 'center', marginTop: 4, marginBottom: 14 }}>Vous souhaitez utiliser ou porter les dispositifs de sante de Chutex.</Text>
              <TouchableOpacity style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 14, paddingHorizontal: 32 }} onPress={() => { setRole('beneficiary'); setStep(2); }}>
                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800', textTransform: 'uppercase' }}>JE SUIS BENEFICIAIRE</Text>
              </TouchableOpacity>
            </GlassCard>

            <GlassCard style={{ alignItems: 'center', padding: 24, borderWidth: role === 'guardian' ? 2.5 : 1, borderColor: role === 'guardian' ? '#000' : 'rgba(255,255,255,0.7)' }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#000' }}>GARDIEN</Text>
              <Text style={{ fontSize: 12, color: '#888', textAlign: 'center', marginTop: 4, marginBottom: 14 }}>Vous etes un aidant ou professionnel souhaitant accompagner un beneficiaire.</Text>
              <TouchableOpacity style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 14, paddingHorizontal: 32 }} onPress={() => { setRole('guardian'); setStep(2); }}>
                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800', textTransform: 'uppercase' }}>JE SUIS GARDIEN</Text>
              </TouchableOpacity>
            </GlassCard>

            <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 10 }} onPress={() => setStep(0)}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#888' }}>Retour</Text>
            </TouchableOpacity>
          </>)}

          {/* Step 2: Role-specific form */}
          {step === 2 && role === 'beneficiary' && (<>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#000', marginBottom: 14 }}>Informations beneficiaire</Text>
            <WebInput label="Date de naissance" val={dob} onChange={setDob} placeholder="JJ/MM/AAAA" />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Genre</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
              {['Homme', 'Femme', 'Autre'].map(g => <TouchableOpacity key={g} style={{ paddingVertical: 10, paddingHorizontal: 16, borderRadius: 9999, borderWidth: 2, borderColor: gender === g ? '#000' : '#DDD', backgroundColor: gender === g ? 'rgba(0,0,0,0.05)' : 'transparent' }} onPress={() => setGender(g)}><Text style={{ fontSize: 13, fontWeight: '600', color: gender === g ? '#000' : '#888' }}>{g}</Text></TouchableOpacity>)}
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
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#000', marginBottom: 14 }}>Informations gardien</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
              {[{ id: 'particular', l: 'Particulier' }, { id: 'professional', l: 'Professionnel' }].map(t => (
                <TouchableOpacity key={t.id} style={{ flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: guardianType === t.id ? '#000' : '#DDD', backgroundColor: guardianType === t.id ? 'rgba(0,0,0,0.05)' : 'transparent', alignItems: 'center' }} onPress={() => setGuardianType(t.id)}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: guardianType === t.id ? '#000' : '#888' }}>{t.l}</Text>
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
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: 9999, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center' }} onPress={() => setStep(1)}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#888' }}>Retour</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="auth-submit-btn" style={{ flex: 2, backgroundColor: '#000', paddingVertical: 14, borderRadius: 9999, alignItems: 'center' }} onPress={handleRegister} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800', textTransform: 'uppercase' }}>S'INSCRIRE</Text>}
              </TouchableOpacity>
            </View>
          )}
        </>)}
      </ScrollView>
    </SafeAreaView>
  );
}
