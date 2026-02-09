import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { Colors } from '../src/constants/colors';

const ROLES = [
  { id: 'beneficiary', label: 'Bénéficiaire', icon: 'heart', desc: 'Je porte un bracelet' },
  { id: 'guardian', label: 'Gardien', icon: 'shield-checkmark', desc: 'Proche ou professionnel' },
  { id: 'teleassistance', label: 'Téléassistance', icon: 'headset', desc: 'Opérateur plateau' },
  { id: 'admin', label: 'Admin', icon: 'settings', desc: 'Back-office' },
];

export default function AuthScreen() {
  const { user, loading, login, register } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ email:'', password:'', name:'', phone:'', role:'beneficiary',
    date_of_birth:'', gender:'', address:'', height_cm:'', weight_kg:'', blood_type:'',
    allergies:'', medical_conditions:'', emergency_contact_name:'', emergency_contact_phone:'',
    doctor_name:'', guardian_type:'particular', structure_name:'', siret:'', profession:'',
    relationship:'', prescriber_code:'' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const redir = useRef(false);

  useEffect(() => { if (!loading && user && !redir.current) { redir.current = true; router.replace('/(tabs)'); } }, [user, loading]);

  if (loading) return <View style={s.loadC}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (user) return <View style={s.loadC}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const u = (k: string, v: string) => setForm({ ...form, [k]: v });

  const handleSubmit = async () => {
    setError('');
    if (!form.email || !form.password) return setError('Email et mot de passe requis');
    if (!isLogin && !form.name) return setError('Nom requis');
    setSubmitting(true);
    try {
      if (isLogin) await login(form.email.trim().toLowerCase(), form.password);
      else {
        const regData: any = { ...form, email: form.email.trim().toLowerCase() };
        if (form.height_cm) regData.height_cm = parseFloat(form.height_cm);
        if (form.weight_kg) regData.weight_kg = parseFloat(form.weight_kg);
        await register(regData);
      }
      redir.current = true;
      router.replace('/(tabs)');
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setSubmitting(false); }
  };

  const Input = ({ k, label, ph, kb, sec, ml }: any) => (
    <>
      <Text style={s.label}>{label}</Text>
      <View style={s.inpC}>
        <TextInput testID={`reg-${k}`} style={s.inp} placeholder={ph || label} placeholderTextColor={Colors.textMuted}
          value={(form as any)[k]} onChangeText={v => u(k, v)} keyboardType={kb || 'default'}
          secureTextEntry={sec} autoCapitalize={k === 'email' ? 'none' : 'sentences'} multiline={ml} />
      </View>
    </>
  );

  // Login
  if (isLogin) return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <ScrollView contentContainerStyle={s.sc} keyboardShouldPersistTaps="handled">
          <View style={s.header}>
            <View style={s.logoBg}><Ionicons name="heart-circle" size={48} color={Colors.primary} /></View>
            <Text style={s.appName}>VitalLink AI</Text>
            <Text style={s.subtitle}>Santé connectée, protégée par l'IA</Text>
          </View>
          <View style={s.tabs}><TouchableOpacity testID="auth-tab-login" style={[s.tab, s.tabA]} onPress={() => setIsLogin(true)}><Text style={[s.tabT, s.tabTA]}>Connexion</Text></TouchableOpacity>
            <TouchableOpacity testID="auth-tab-register" style={s.tab} onPress={() => { setIsLogin(false); setStep(0); }}><Text style={s.tabT}>Inscription</Text></TouchableOpacity></View>
          {error ? <View style={s.err}><Ionicons name="alert-circle" size={14} color={Colors.destructive} /><Text style={s.errT}>{error}</Text></View> : null}
          <Input k="email" label="Email" ph="email@exemple.com" kb="email-address" />
          <Text style={s.label}>Mot de passe</Text>
          <View style={s.inpC}><TextInput testID="auth-input-password" style={[s.inp, {flex:1}]} placeholder="••••••••" placeholderTextColor={Colors.textMuted}
            value={form.password} onChangeText={v => u('password', v)} secureTextEntry={!showPw} />
            <TouchableOpacity onPress={() => setShowPw(!showPw)} style={s.eye}><Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} /></TouchableOpacity></View>
          <TouchableOpacity testID="auth-submit-btn" style={[s.btn, submitting && s.btnD]} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnT}>Se connecter</Text>}</TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  // Register - Multi-step
  const totalSteps = form.role === 'beneficiary' ? 3 : form.role === 'guardian' ? 3 : 2;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <ScrollView contentContainerStyle={s.sc} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.header}>
            <View style={s.logoBg}><Ionicons name="heart-circle" size={48} color={Colors.primary} /></View>
            <Text style={s.appName}>VitalLink AI</Text>
          </View>
          <View style={s.tabs}><TouchableOpacity testID="auth-tab-login" style={s.tab} onPress={() => setIsLogin(true)}><Text style={s.tabT}>Connexion</Text></TouchableOpacity>
            <TouchableOpacity testID="auth-tab-register" style={[s.tab, s.tabA]}><Text style={[s.tabT, s.tabTA]}>Inscription</Text></TouchableOpacity></View>

          {/* Progress */}
          <View style={s.prog}>{Array.from({length: totalSteps}).map((_, i) => <View key={i} style={[s.progDot, i <= step && {backgroundColor: Colors.primary}]} />)}</View>
          <Text style={s.stepL}>Étape {step + 1} / {totalSteps}</Text>

          {error ? <View style={s.err}><Ionicons name="alert-circle" size={14} color={Colors.destructive} /><Text style={s.errT}>{error}</Text></View> : null}

          {/* Step 0: Basic info + Role */}
          {step === 0 && (
            <>
              <Text style={s.secTitle}>Choisissez votre profil</Text>
              <View style={s.rolesGrid}>
                {ROLES.map(r => (
                  <TouchableOpacity key={r.id} testID={`role-${r.id}`} style={[s.roleC, form.role === r.id && s.roleCA]} onPress={() => u('role', r.id)}>
                    <Ionicons name={r.icon as any} size={22} color={form.role === r.id ? Colors.primary : Colors.textMuted} />
                    <Text style={[s.roleT, form.role === r.id && s.roleTA]}>{r.label}</Text>
                    <Text style={s.roleD}>{r.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input k="name" label="Nom complet" ph="Jean Dupont" />
              <Input k="email" label="Email" ph="email@exemple.com" kb="email-address" />
              <Input k="phone" label="Téléphone" ph="06 12 34 56 78" kb="phone-pad" />
              <Text style={s.label}>Mot de passe</Text>
              <View style={s.inpC}><TextInput testID="reg-password" style={[s.inp, {flex:1}]} placeholder="Min. 6 caractères" placeholderTextColor={Colors.textMuted}
                value={form.password} onChangeText={v => u('password', v)} secureTextEntry={!showPw} />
                <TouchableOpacity onPress={() => setShowPw(!showPw)} style={s.eye}><Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} /></TouchableOpacity></View>
            </>
          )}

          {/* Step 1: Role-specific */}
          {step === 1 && form.role === 'beneficiary' && (
            <>
              <Text style={s.secTitle}>Informations personnelles</Text>
              <Input k="date_of_birth" label="Date de naissance" ph="JJ/MM/AAAA" />
              <Text style={s.label}>Genre</Text>
              <View style={s.optRow}>
                {['Homme','Femme','Autre'].map(g => <TouchableOpacity key={g} testID={`gender-${g}`} style={[s.optBtn, form.gender === g && s.optBtnA]} onPress={() => u('gender', g)}><Text style={[s.optT, form.gender === g && s.optTA]}>{g}</Text></TouchableOpacity>)}
              </View>
              <Input k="address" label="Adresse" ph="123 rue de la Santé, 75014 Paris" />
              <View style={s.row}><View style={s.half}><Input k="height_cm" label="Taille (cm)" ph="170" kb="numeric" /></View>
                <View style={s.half}><Input k="weight_kg" label="Poids (kg)" ph="70" kb="numeric" /></View></View>
              <Text style={s.label}>Groupe sanguin</Text>
              <View style={s.optRow}>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <TouchableOpacity key={b} testID={`blood-${b}`} style={[s.optBtnS, form.blood_type === b && s.optBtnA]} onPress={() => u('blood_type', b)}><Text style={[s.optTS, form.blood_type === b && s.optTA]}>{b}</Text></TouchableOpacity>)}
              </View>
            </>
          )}

          {step === 2 && form.role === 'beneficiary' && (
            <>
              <Text style={s.secTitle}>Informations médicales</Text>
              <Input k="allergies" label="Allergies connues" ph="Ex: pénicilline, arachides..." ml />
              <Input k="medical_conditions" label="Pathologies / Conditions médicales" ph="Ex: diabète, hypertension..." ml />
              <Input k="doctor_name" label="Médecin traitant" ph="Dr. Dupont" />
              <Text style={s.secTitle}>Contact d'urgence</Text>
              <Input k="emergency_contact_name" label="Nom du contact" ph="Marie Dupont" />
              <Input k="emergency_contact_phone" label="Téléphone urgence" ph="06 98 76 54 32" kb="phone-pad" />
            </>
          )}

          {step === 1 && form.role === 'guardian' && (
            <>
              <Text style={s.secTitle}>Type de gardien</Text>
              <View style={s.optRow}>
                {[{id:'particular',l:'Particulier'},{id:'professional',l:'Professionnel'}].map(t => (
                  <TouchableOpacity key={t.id} testID={`gtype-${t.id}`} style={[s.optBtn, form.guardian_type === t.id && s.optBtnA]} onPress={() => u('guardian_type', t.id)}>
                    <Text style={[s.optT, form.guardian_type === t.id && s.optTA]}>{t.l}</Text></TouchableOpacity>
                ))}
              </View>
              {form.guardian_type === 'particular' && <Input k="relationship" label="Lien avec le bénéficiaire" ph="Fils, fille, voisin..." />}
              {form.guardian_type === 'professional' && (
                <>
                  <Input k="structure_name" label="Nom de la structure" ph="SAAD Exemple" />
                  <Input k="siret" label="N° SIRET" ph="123 456 789 00001" kb="numeric" />
                  <Input k="profession" label="Profession" ph="Aide-soignant, infirmier..." />
                </>
              )}
            </>
          )}

          {step === 2 && form.role === 'guardian' && (
            <>
              <Text style={s.secTitle}>Mode prescripteur (optionnel)</Text>
              <Text style={s.desc}>Si vous avez un code d'activation de structure, entrez-le pour activer le mode prescripteur et toucher des commissions.</Text>
              <Input k="prescriber_code" label="Code d'activation" ph="Ex: SAAD1234" />
            </>
          )}

          {step === 1 && (form.role === 'teleassistance' || form.role === 'admin') && (
            <>
              <Text style={s.secTitle}>Informations complémentaires</Text>
              <Input k="address" label="Adresse / Lieu de travail" ph="Siège social" />
            </>
          )}

          {/* Navigation */}
          <View style={s.navRow}>
            {step > 0 && <TouchableOpacity testID="prev-step" style={s.prevBtn} onPress={() => setStep(step - 1)}>
              <Ionicons name="chevron-back" size={16} color={Colors.textSecondary} /><Text style={s.prevT}>Retour</Text></TouchableOpacity>}
            <View style={{flex:1}} />
            {step < totalSteps - 1 ? (
              <TouchableOpacity testID="next-step" style={s.nextBtn} onPress={() => {
                if (step === 0 && (!form.name || !form.email || !form.password)) return setError('Remplissez les champs requis');
                setError(''); setStep(step + 1);
              }}><Text style={s.nextT}>Suivant</Text><Ionicons name="chevron-forward" size={16} color="#FFF" /></TouchableOpacity>
            ) : (
              <TouchableOpacity testID="auth-submit-btn" style={[s.btn, submitting && s.btnD]} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnT}>S'inscrire</Text>}</TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: Colors.background },
  loadC: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  sc: { paddingHorizontal: 22, paddingBottom: 36 },
  header: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  logoBg: { width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  appName: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  tabs: { flexDirection: 'row', backgroundColor: Colors.subtle, borderRadius: 12, padding: 3, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabA: { backgroundColor: Colors.paper, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  tabT: { fontSize: 14, fontWeight: '600', color: Colors.textMuted }, tabTA: { color: Colors.primary },
  prog: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginBottom: 4 },
  progDot: { width: 28, height: 3, borderRadius: 2, backgroundColor: Colors.border },
  stepL: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginBottom: 12 },
  err: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.destructive + '10', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 12, gap: 6 },
  errT: { fontSize: 12, color: Colors.destructive, flex: 1 },
  secTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10, marginTop: 4 },
  desc: { fontSize: 13, color: Colors.textSecondary, marginBottom: 12, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4, marginLeft: 2 },
  inpC: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.paper, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 10, marginBottom: 12, minHeight: 46 },
  inp: { flex: 1, fontSize: 14, color: Colors.textPrimary, paddingVertical: 10 },
  eye: { padding: 5 },
  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  roleC: { width: '47%', paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', backgroundColor: Colors.paper, borderRadius: 12, borderWidth: 2, borderColor: Colors.border },
  roleCA: { borderColor: Colors.primary, backgroundColor: Colors.primary + '06' },
  roleT: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginTop: 4 }, roleTA: { color: Colors.primary },
  roleD: { fontSize: 10, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  optRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  optBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.paper },
  optBtnS: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.paper },
  optBtnA: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  optT: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary }, optTA: { color: Colors.primary },
  optTS: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  row: { flexDirection: 'row', gap: 10 }, half: { flex: 1 },
  navRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  prevBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, backgroundColor: Colors.subtle },
  prevT: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, backgroundColor: Colors.primary },
  nextT: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  btn: { backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', shadowColor: Colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
  btnD: { opacity: 0.7 }, btnT: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
