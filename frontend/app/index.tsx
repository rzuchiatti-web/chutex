import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
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
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/(tabs)');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    if (!isLogin && !name) {
      setError('Veuillez entrer votre nom');
      return;
    }
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email.trim().toLowerCase(), password);
      } else {
        await register({ email: email.trim().toLowerCase(), password, name: name.trim(), phone: phone.trim(), role });
      }
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message || 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="heart-circle" size={56} color={Colors.primary} />
            </View>
            <Text style={styles.appName}>VitalLink AI</Text>
            <Text style={styles.subtitle}>Votre santé connectée, protégée par l'IA</Text>
          </View>

          {/* Tab Toggle */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              testID="auth-tab-login"
              style={[styles.tab, isLogin && styles.tabActive]}
              onPress={() => { setIsLogin(true); setError(''); }}
            >
              <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Connexion</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="auth-tab-register"
              style={[styles.tab, !isLogin && styles.tabActive]}
              onPress={() => { setIsLogin(false); setError(''); }}
            >
              <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Inscription</Text>
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={Colors.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {!isLogin && (
              <>
                <Text style={styles.label}>Nom complet</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    testID="auth-input-name"
                    style={styles.input}
                    placeholder="Jean Dupont"
                    placeholderTextColor={Colors.textMuted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>

                <Text style={styles.label}>Téléphone</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    testID="auth-input-phone"
                    style={styles.input}
                    placeholder="06 12 34 56 78"
                    placeholderTextColor={Colors.textMuted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </>
            )}

            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                testID="auth-input-email"
                style={styles.input}
                placeholder="email@exemple.com"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                testID="auth-input-password"
                style={[styles.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                testID="auth-toggle-password"
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Role Selection (Register only) */}
            {!isLogin && (
              <>
                <Text style={styles.label}>Je suis un(e)</Text>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    testID="auth-role-beneficiary"
                    style={[styles.roleCard, role === 'beneficiary' && styles.roleCardActive]}
                    onPress={() => setRole('beneficiary')}
                  >
                    <Ionicons
                      name="heart"
                      size={28}
                      color={role === 'beneficiary' ? Colors.primary : Colors.textMuted}
                    />
                    <Text style={[styles.roleTitle, role === 'beneficiary' && styles.roleTitleActive]}>
                      Bénéficiaire
                    </Text>
                    <Text style={styles.roleDesc}>Je porte un bracelet</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    testID="auth-role-guardian"
                    style={[styles.roleCard, role === 'guardian' && styles.roleCardActive]}
                    onPress={() => setRole('guardian')}
                  >
                    <Ionicons
                      name="shield-checkmark"
                      size={28}
                      color={role === 'guardian' ? Colors.primary : Colors.textMuted}
                    />
                    <Text style={[styles.roleTitle, role === 'guardian' && styles.roleTitleActive]}>
                      Gardien
                    </Text>
                    <Text style={styles.roleDesc}>Je surveille un proche</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Submit */}
            <TouchableOpacity
              testID="auth-submit-btn"
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitText}>{isLogin ? 'Se connecter' : "S'inscrire"}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { marginTop: 12, fontSize: 16, color: Colors.textSecondary },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 32 },
  logoContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  appName: { fontSize: 32, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  tabContainer: {
    flexDirection: 'row', backgroundColor: Colors.subtle,
    borderRadius: 16, padding: 4, marginBottom: 24,
  },
  tab: {
    flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12,
  },
  tabActive: { backgroundColor: Colors.paper, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 16, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.destructive + '10',
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginBottom: 16, gap: 8,
  },
  errorText: { fontSize: 14, color: Colors.destructive, flex: 1 },
  form: {},
  label: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginLeft: 4 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.paper,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 14, marginBottom: 16, minHeight: 54,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: Colors.textPrimary, paddingVertical: 14 },
  eyeBtn: { padding: 8 },
  roleContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  roleCard: {
    flex: 1, paddingVertical: 20, paddingHorizontal: 12, alignItems: 'center',
    backgroundColor: Colors.paper, borderRadius: 16,
    borderWidth: 2, borderColor: Colors.border,
  },
  roleCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  roleTitle: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary, marginTop: 8 },
  roleTitleActive: { color: Colors.primary },
  roleDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2, textAlign: 'center' },
  submitBtn: {
    backgroundColor: Colors.primary, paddingVertical: 16,
    borderRadius: 16, alignItems: 'center', marginTop: 8,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});
