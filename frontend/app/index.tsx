import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { Colors } from '../src/constants/colors';

export default function AuthScreen() {
  const { user, loading, login, register } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('beneficiary');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!loading && user && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace('/(tabs)');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={s.loadingC}><ActivityIndicator size="large" color={Colors.primary} /><Text style={s.loadingT}>Chargement...</Text></View>
    );
  }

  if (user) return <View style={s.loadingC}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) return setError('Veuillez remplir tous les champs');
    if (!isLogin && !name) return setError('Veuillez entrer votre nom');
    setSubmitting(true);
    try {
      if (isLogin) await login(email.trim().toLowerCase(), password);
      else await register({ email: email.trim().toLowerCase(), password, name: name.trim(), phone: phone.trim(), role });
      hasRedirected.current = true;
      router.replace('/(tabs)');
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setSubmitting(false); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.flex}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.header}>
            <View style={s.logoBg}><Ionicons name="heart-circle" size={52} color={Colors.primary} /></View>
            <Text style={s.appName}>VitalLink AI</Text>
            <Text style={s.subtitle}>Votre santé connectée, protégée par l'IA</Text>
          </View>
          <View style={s.tabs}>
            <TouchableOpacity testID="auth-tab-login" style={[s.tab, isLogin && s.tabA]} onPress={() => { setIsLogin(true); setError(''); }}>
              <Text style={[s.tabT, isLogin && s.tabTA]}>Connexion</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="auth-tab-register" style={[s.tab, !isLogin && s.tabA]} onPress={() => { setIsLogin(false); setError(''); }}>
              <Text style={[s.tabT, !isLogin && s.tabTA]}>Inscription</Text>
            </TouchableOpacity>
          </View>
          {error ? <View style={s.errBox}><Ionicons name="alert-circle" size={16} color={Colors.destructive} /><Text style={s.errT}>{error}</Text></View> : null}
          {!isLogin && (
            <>
              <Text style={s.label}>Nom complet</Text>
              <View style={s.inputC}><Ionicons name="person-outline" size={18} color={Colors.textMuted} style={s.ic} />
                <TextInput testID="auth-input-name" style={s.input} placeholder="Jean Dupont" placeholderTextColor={Colors.textMuted} value={name} onChangeText={setName} autoCapitalize="words" /></View>
              <Text style={s.label}>Téléphone</Text>
              <View style={s.inputC}><Ionicons name="call-outline" size={18} color={Colors.textMuted} style={s.ic} />
                <TextInput testID="auth-input-phone" style={s.input} placeholder="06 12 34 56 78" placeholderTextColor={Colors.textMuted} value={phone} onChangeText={setPhone} keyboardType="phone-pad" /></View>
            </>
          )}
          <Text style={s.label}>Email</Text>
          <View style={s.inputC}><Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={s.ic} />
            <TextInput testID="auth-input-email" style={s.input} placeholder="email@exemple.com" placeholderTextColor={Colors.textMuted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" /></View>
          <Text style={s.label}>Mot de passe</Text>
          <View style={s.inputC}><Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={s.ic} />
            <TextInput testID="auth-input-password" style={[s.input, { flex: 1 }]} placeholder="••••••••" placeholderTextColor={Colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry={!showPw} />
            <TouchableOpacity testID="auth-toggle-pw" onPress={() => setShowPw(!showPw)} style={s.eye}><Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.textMuted} /></TouchableOpacity></View>
          {!isLogin && (
            <>
              <Text style={s.label}>Je suis un(e)</Text>
              <View style={s.roles}>
                <TouchableOpacity testID="auth-role-beneficiary" style={[s.roleC, role === 'beneficiary' && s.roleCA]} onPress={() => setRole('beneficiary')}>
                  <Ionicons name="heart" size={26} color={role === 'beneficiary' ? Colors.primary : Colors.textMuted} />
                  <Text style={[s.roleT, role === 'beneficiary' && s.roleTA]}>Bénéficiaire</Text>
                  <Text style={s.roleD}>Je porte un bracelet</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="auth-role-guardian" style={[s.roleC, role === 'guardian' && s.roleCA]} onPress={() => setRole('guardian')}>
                  <Ionicons name="shield-checkmark" size={26} color={role === 'guardian' ? Colors.primary : Colors.textMuted} />
                  <Text style={[s.roleT, role === 'guardian' && s.roleTA]}>Gardien</Text>
                  <Text style={s.roleD}>Je surveille un proche</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          <TouchableOpacity testID="auth-submit-btn" style={[s.submitBtn, submitting && s.submitD]} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={s.submitT}>{isLogin ? 'Se connecter' : "S'inscrire"}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 }, safe: { flex: 1, backgroundColor: Colors.background },
  loadingC: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingT: { marginTop: 12, fontSize: 16, color: Colors.textSecondary },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  header: { alignItems: 'center', marginTop: 36, marginBottom: 28 },
  logoBg: { width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  appName: { fontSize: 30, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: Colors.subtle, borderRadius: 14, padding: 3, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 11 },
  tabA: { backgroundColor: Colors.paper, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 2 },
  tabT: { fontSize: 15, fontWeight: '600', color: Colors.textMuted },
  tabTA: { color: Colors.primary },
  errBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.destructive + '10', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, marginBottom: 14, gap: 8 },
  errT: { fontSize: 13, color: Colors.destructive, flex: 1 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 5, marginLeft: 2 },
  inputC: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.paper, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 12, marginBottom: 14, minHeight: 50 },
  ic: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: Colors.textPrimary, paddingVertical: 12 },
  eye: { padding: 6 },
  roles: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  roleC: { flex: 1, paddingVertical: 16, paddingHorizontal: 10, alignItems: 'center', backgroundColor: Colors.paper, borderRadius: 14, borderWidth: 2, borderColor: Colors.border },
  roleCA: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  roleT: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginTop: 6 },
  roleTA: { color: Colors.primary },
  roleD: { fontSize: 11, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  submitBtn: { backgroundColor: Colors.primary, paddingVertical: 15, borderRadius: 14, alignItems: 'center', marginTop: 6, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  submitD: { opacity: 0.7 },
  submitT: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
