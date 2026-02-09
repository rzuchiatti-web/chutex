import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { Colors } from '../src/constants/colors';

const ROLES = [
  { id: 'beneficiary', label: 'Bénéficiaire', icon: 'heart-outline', desc: 'Patient / porteur bracelet' },
  { id: 'guardian', label: 'Gardien', icon: 'shield-checkmark-outline', desc: 'Proche ou professionnel' },
  { id: 'teleassistance', label: 'Téléassistance', icon: 'headset-outline', desc: 'Opérateur plateau' },
  { id: 'admin', label: 'Admin', icon: 'settings-outline', desc: 'Back-office' },
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

  if (loading) return <View style={a.loadC}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  if (user) return <View style={a.loadC}><ActivityIndicator size="large" color={Colors.primary} /></View>;

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
      <Text style={a.label}>{label}</Text>
      <View style={a.inpC}>
        <TextInput testID={`reg-${k}`} style={a.inp} placeholder={ph || label} placeholderTextColor={Colors.textMuted}
          value={(form as any)[k]} onChangeText={v => u(k, v)} keyboardType={kb || 'default'}
          secureTextEntry={sec} autoCapitalize={k === 'email' ? 'none' : 'sentences'} multiline={ml} />
      </View>
    </>
  );

  if (isLogin) return (
    <SafeAreaView style={a.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={a.flex}>
        <ScrollView contentContainerStyle={a.sc} keyboardShouldPersistTaps="handled">
          <View style={a.header}>
            <Text style={a.appName}>VITALLINK</Text>
            <Text style={a.subtitle}>Santé connectée, protégée par l'IA</Text>
          </View>
          <View style={a.tabs}>
            <TouchableOpacity testID="auth-tab-login" style={[a.tab, a.tabA]} onPress={() => setIsLogin(true)}><Text style={[a.tabT, a.tabTA]}>Connexion</Text></TouchableOpacity>
            <TouchableOpacity testID="auth-tab-register" style={a.tab} onPress={() => { setIsLogin(false); setStep(0); }}><Text style={a.tabT}>Inscription</Text></TouchableOpacity>
          </View>
          {error ? <View style={a.err}><Ionicons name="alert-circle" size={14} color={Colors.destructive} /><Text style={a.errT}>{error}</Text></View> : null}
          <Input k="email" label="Email" ph="email@exemple.com" kb="email-address" />
          <Text style={a.label}>Mot de passe</Text>
          <View style={a.inpC}><TextInput testID="auth-input-password" style={[a.inp, {flex:1}]} placeholder="••••••••" placeholderTextColor={Colors.textMuted}
            value={form.password} onChangeText={v => u('password', v)} secureTextEntry={!showPw} />
            <TouchableOpacity onPress={() => setShowPw(!showPw)} style={a.eye}><Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} /></TouchableOpacity></View>
          <TouchableOpacity testID="auth-submit-btn" style={[a.btn, submitting && a.btnD]} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={a.btnT}>Se connecter</Text>}</TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  const totalSteps = form.role === 'beneficiary' ? 3 : form.role === 'guardian' ? 3 : 2;

  return (
    <SafeAreaView style={a.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={a.flex}>
        <ScrollView contentContainerStyle={a.sc} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={a.header}>
            <Text style={a.appName}>VITALLINK</Text>
          </View>
          <View style={a.tabs}>
            <TouchableOpacity testID="auth-tab-login" style={a.tab} onPress={() => setIsLogin(true)}><Text style={a.tabT}>Connexion</Text></TouchableOpacity>
            <TouchableOpacity testID="auth-tab-register" style={[a.tab, a.tabA]}><Text style={[a.tabT, a.tabTA]}>Inscription</Text></TouchableOpacity>
          </View>

          <View style={a.prog}>{Array.from({length: totalSteps}).map((_, i) => <View key={i} style={[a.progDot, i <= step && {backgroundColor: Colors.primary}]} />)}</View>
          <Text style={a.stepL}>Étape {step + 1} / {totalSteps}</Text>

          {error ? <View style={a.err}><Ionicons name="alert-circle" size={14} color={Colors.destructive} /><Text style={a.errT}>{error}</Text></View> : null}

          {step === 0 && (
            <>
              <Text style={a.secTitle}>Choisissez votre profil</Text>
              <View style={a.rolesGrid}>
                {ROLES.map(r => (
                  <TouchableOpacity key={r.id} testID={`role-${r.id}`} style={[a.roleC, form.role === r.id && a.roleCA]} onPress={() => u('role', r.id)}>
                    <Ionicons name={r.icon as any} size={20} color={form.role === r.id ? Colors.primary : Colors.textMuted} />
                    <Text style={[a.roleT, form.role === r.id && a.roleTA]}>{r.label}</Text>
                    <Text style={a.roleD}>{r.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input k="name" label="Nom complet" ph="Jean Dupont" />
              <Input k="email" label="Email" ph="email@exemple.com" kb="email-address" />
              <Input k="phone" label="Téléphone" ph="06 12 34 56 78" kb="phone-pad" />
              <Text style={a.label}>Mot de passe</Text>
              <View style={a.inpC}><TextInput testID="reg-password" style={[a.inp, {flex:1}]} placeholder="Min. 6 caractères" placeholderTextColor={Colors.textMuted}
                value={form.password} onChangeText={v => u('password', v)} secureTextEntry={!showPw} />
                <TouchableOpacity onPress={() => setShowPw(!showPw)} style={a.eye}><Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} /></TouchableOpacity></View>
            </>
          )}

          {step === 1 && form.role === 'beneficiary' && (
            <>
              <Text style={a.secTitle}>Informations personnelles</Text>
              <Input k="date_of_birth" label="Date de naissance" ph="JJ/MM/AAAA" />
              <Text style={a.label}>Genre</Text>
              <View style={a.optRow}>
                {['Homme','Femme','Autre'].map(g => <TouchableOpacity key={g} testID={`gender-${g}`} style={[a.optBtn, form.gender === g && a.optBtnA]} onPress={() => u('gender', g)}><Text style={[a.optBtnT, form.gender === g && a.optBtnTA]}>{g}</Text></TouchableOpacity>)}
              </View>
              <Input k="address" label="Adresse" ph="123 rue de la Santé, 75014 Paris" />
              <View style={a.row}><View style={a.half}><Input k="height_cm" label="Taille (cm)" ph="170" kb="numeric" /></View>
                <View style={a.half}><Input k="weight_kg" label="Poids (kg)" ph="70" kb="numeric" /></View></View>
              <Text style={a.label}>Groupe sanguin</Text>
              <View style={a.optRow}>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <TouchableOpacity key={b} testID={`blood-${b}`} style={[a.optBtnS, form.blood_type === b && a.optBtnA]} onPress={() => u('blood_type', b)}><Text style={[a.optBtnST, form.blood_type === b && a.optBtnTA]}>{b}</Text></TouchableOpacity>)}
              </View>
            </>
          )}

          {step === 2 && form.role === 'beneficiary' && (
            <>
              <Text style={a.secTitle}>Informations médicales</Text>
              <Input k="allergies" label="Allergies connues" ph="Ex: pénicilline, arachides..." ml />
              <Input k="medical_conditions" label="Pathologies" ph="Ex: diabète, hypertension..." ml />
              <Input k="doctor_name" label="Médecin traitant" ph="Dr. Dupont" />
              <Text style={a.secTitle}>Contact d'urgence</Text>
              <Input k="emergency_contact_name" label="Nom du contact" ph="Marie Dupont" />
              <Input k="emergency_contact_phone" label="Téléphone urgence" ph="06 98 76 54 32" kb="phone-pad" />
            </>
          )}

          {step === 1 && form.role === 'guardian' && (
            <>
              <Text style={a.secTitle}>Type de gardien</Text>
              <View style={a.optRow}>
                {[{id:'particular',l:'Particulier'},{id:'professional',l:'Professionnel'}].map(t => (
                  <TouchableOpacity key={t.id} testID={`gtype-${t.id}`} style={[a.optBtn, form.guardian_type === t.id && a.optBtnA]} onPress={() => u('guardian_type', t.id)}>
                    <Text style={[a.optBtnT, form.guardian_type === t.id && a.optBtnTA]}>{t.l}</Text></TouchableOpacity>
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
              <Text style={a.secTitle}>Mode prescripteur (optionnel)</Text>
              <Text style={a.desc}>Si vous avez un code d'activation, entrez-le pour activer le mode prescripteur.</Text>
              <Input k="prescriber_code" label="Code d'activation" ph="Ex: SAAD1234" />
            </>
          )}

          {step === 1 && (form.role === 'teleassistance' || form.role === 'admin') && (
            <>
              <Text style={a.secTitle}>Informations complémentaires</Text>
              <Input k="address" label="Adresse / Lieu de travail" ph="Siège social" />
            </>
          )}

          <View style={a.navRow}>
            {step > 0 && <TouchableOpacity testID="prev-step" style={a.prevBtn} onPress={() => setStep(step - 1)}>
              <Ionicons name="chevron-back" size={16} color={Colors.textSecondary} /><Text style={a.prevT}>Retour</Text></TouchableOpacity>}
            <View style={{flex:1}} />
            {step < totalSteps - 1 ? (
              <TouchableOpacity testID="next-step" style={a.nextBtn} onPress={() => {
                if (step === 0 && (!form.name || !form.email || !form.password)) return setError('Remplissez les champs requis');
                setError(''); setStep(step + 1);
              }}><Text style={a.nextT}>Suivant</Text><Ionicons name="chevron-forward" size={16} color="#FFF" /></TouchableOpacity>
            ) : (
              <TouchableOpacity testID="auth-submit-btn" style={[a.btn, submitting && a.btnD]} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={a.btnT}>S'inscrire</Text>}</TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const a = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: Colors.background },
  loadC: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  sc: { paddingHorizontal: 24, paddingBottom: 40 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 24 },
  appName: { fontSize: 32, fontWeight: '900', color: Colors.textPrimary, letterSpacing: 4 },
  subtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 4, letterSpacing: 0.5 },
  tabs: { flexDirection: 'row', backgroundColor: Colors.subtle, borderRadius: 12, padding: 3, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabA: { backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.border },
  tabT: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  tabTA: { color: Colors.textPrimary },
  prog: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginBottom: 4 },
  progDot: { width: 28, height: 3, borderRadius: 2, backgroundColor: Colors.border },
  stepL: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginBottom: 16 },
  err: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.destructive + '08', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 12, gap: 6 },
  errT: { fontSize: 12, color: Colors.destructive, flex: 1 },
  secTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12, letterSpacing: -0.3 },
  desc: { fontSize: 12, color: Colors.textMuted, marginBottom: 12, lineHeight: 17 },
  label: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, marginBottom: 4, marginLeft: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  inpC: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.subtle, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, marginBottom: 14, minHeight: 46 },
  inp: { flex: 1, fontSize: 14, color: Colors.textPrimary, paddingVertical: 10 },
  eye: { padding: 5 },
  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  roleC: { width: '47%', paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', backgroundColor: Colors.subtle, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border },
  roleCA: { borderColor: Colors.primary, backgroundColor: Colors.primary + '05' },
  roleT: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, marginTop: 4 },
  roleTA: { color: Colors.textPrimary },
  roleD: { fontSize: 10, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  optRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  optBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.subtle },
  optBtnS: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.subtle },
  optBtnA: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  optBtnT: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  optBtnST: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  optBtnTA: { color: Colors.textPrimary },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  navRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  prevBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, backgroundColor: Colors.subtle },
  prevT: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, backgroundColor: Colors.primary },
  nextT: { fontSize: 14, fontWeight: '600', color: '#FFF' },
  btn: { backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center' },
  btnD: { opacity: 0.7 },
  btnT: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
