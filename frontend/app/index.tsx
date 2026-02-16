import React, { useRef, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/context/AuthContext';

export default function AuthScreen() {
  const { user, loading, login, register } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<any>(null);

  useEffect(() => {
    AsyncStorage.getItem('chutex_onboarding_done').then(val => {
      if (!val) router.replace('/onboarding'); else setReady(true);
    }).catch(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!loading && user && !hasRedirected.current) { hasRedirected.current = true; router.replace('/(tabs)'); }
    if (!loading && !user) hasRedirected.current = false;
  }, [user, loading]);

  const handleSubmit = async (e: any) => {
    if (e) e.preventDefault();
    setError('');
    const form = formRef.current;
    if (!form) return;
    const email = form.email.value.trim();
    const password = form.password.value;
    if (!email || !password) return setError('Email et mot de passe requis');
    setSubmitting(true);
    try {
      let id = email;
      if (!id.includes('@') && !id.startsWith('+') && id.startsWith('0') && id.length >= 10) id = '+33' + id.substring(1).replace(/\s/g, '');
      await login(id.toLowerCase(), password);
      hasRedirected.current = true;
      router.replace('/(tabs)');
    } catch (err: any) { setError(err.message || 'Erreur de connexion'); } finally { setSubmitting(false); }
  };

  if (loading || user || !ready) {
    if (Platform.OS === 'web') {
      return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#F5F6F8' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(0,0,0,0.1)', borderTopColor: '#1A1D21', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>;
    }
    const { View, ActivityIndicator } = require('react-native');
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>;
  }

  // ─── WEB: Pure HTML form (zero React Native Web, zero keyboard issues) ───
  if (Platform.OS === 'web') {
    return (
      <div style={{
        minHeight: '100vh',
        background: `url('https://customer-assets.emergentagent.com/job_237132d4-a477-4487-91a8-3e2e50160498/artifacts/fxnu9p7b_banner_mobile%281%29.jpg') center/cover no-repeat`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 20, fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      } as any}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
          <div style={{ display: 'inline-flex', width: 32, height: 32, borderRadius: 16, overflow: 'hidden', marginBottom: 16, border: '0.5px solid rgba(100,80,140,0.20)' } as any}>
            <div style={{ flex: 1, background: '#002395' }} />
            <div style={{ flex: 1, background: '#FFF' }} />
            <div style={{ flex: 1, background: '#ED2939' }} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'rgba(30,20,60,0.85)', letterSpacing: 8, marginBottom: 6 }}>CHUTEX</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(30,20,60,0.45)', letterSpacing: 2.5, textTransform: 'uppercase' } as any}>L'innovation au service de la sante</div>
        </div>

        {/* Glass card form */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          style={{
            width: '100%', maxWidth: 400, padding: 28, borderRadius: 30,
            background: 'rgba(255,255,255,0.25)',
            backdropFilter: 'blur(20px) saturate(140%)', WebkitBackdropFilter: 'blur(20px) saturate(140%)',
            border: '1px solid rgba(255,255,255,0.50)',
            boxShadow: '0 8px 32px rgba(100,80,140,0.10), inset 0 1px 0 rgba(255,255,255,0.50)',
          } as any}
        >
          <div style={{ fontSize: 24, fontWeight: 900, color: 'rgba(30,20,60,0.90)', textAlign: 'center', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24 } as any}>Connexion</div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.20)', borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 13, color: '#DC2626' }}>{error}</div>
          )}

          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(30,20,60,0.55)', marginBottom: 6, letterSpacing: 0.5 }}>Email</label>
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="votre@email.com"
            style={{
              display: 'block', width: '100%', fontSize: 16, padding: '16px 20px', marginBottom: 16,
              borderRadius: 999, border: '1px solid rgba(255,255,255,0.50)',
              background: 'rgba(255,255,255,0.35)', color: 'rgba(30,20,60,0.90)',
              outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
              WebkitAppearance: 'none',
            } as any}
          />

          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(30,20,60,0.55)', marginBottom: 6, letterSpacing: 0.5 }}>Mot de passe</label>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="..."
            style={{
              display: 'block', width: '100%', fontSize: 16, padding: '16px 20px', marginBottom: 24,
              borderRadius: 999, border: '1px solid rgba(255,255,255,0.50)',
              background: 'rgba(255,255,255,0.35)', color: 'rgba(30,20,60,0.90)',
              outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
              WebkitAppearance: 'none',
            } as any}
          />

          <button
            type="submit"
            disabled={submitting}
            style={{
              display: 'block', width: '100%', padding: '18px', borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.55)', cursor: 'pointer',
              background: 'rgba(255,255,255,0.40)', color: 'rgba(30,20,60,0.90)',
              fontSize: 15, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase',
              fontFamily: 'inherit', WebkitAppearance: 'none',
              backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
              opacity: submitting ? 0.6 : 1,
            } as any}
          >
            {submitting ? '...' : 'Connexion'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'rgba(30,20,60,0.50)', fontStyle: 'italic' } as any}>Mot de passe oublie ?</div>
          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'rgba(30,20,60,0.45)' } as any}>
            Pas encore de compte ? <a href="#" onClick={(e) => { e.preventDefault(); router.push('/activate-beneficiary'); }} style={{ fontWeight: 700, color: 'rgba(30,20,60,0.85)', textDecoration: 'underline' }}>S'inscrire ici.</a>
          </div>
        </form>

        <div style={{ marginTop: 20, fontSize: 10, color: 'rgba(30,20,60,0.35)', letterSpacing: 0.5 }}>Chutex Innovation — v2.0</div>
      </div>
    );
  }

  // ─── NATIVE: React Native components ───
  const { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, KeyboardAvoidingView, StyleSheet } = require('react-native');
  const { SafeAreaView } = require('react-native-safe-area-context');
  const emailRef = useRef('');
  const passwordRef = useRef('');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F6F8' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 }} keyboardShouldPersistTaps="always" keyboardDismissMode="none">
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Image source={require('../assets/images/logo_white.png')} style={{ width: 160, height: 50 }} resizeMode="contain" />
            <Text style={{ fontSize: 10, fontWeight: '600', color: '#9BA3AD', marginTop: 10, letterSpacing: 2.5, textTransform: 'uppercase' }}>L'innovation au service de la sante</Text>
          </View>

          <View style={{ backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 30, padding: 28, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#1A1D21', textAlign: 'center', letterSpacing: 1.5, marginBottom: 24, textTransform: 'uppercase' }}>Connexion</Text>

            {error ? <View style={{ backgroundColor: 'rgba(239,68,68,0.10)', borderRadius: 12, padding: 12, marginBottom: 16 }}><Text style={{ fontSize: 13, color: '#DC2626' }}>{error}</Text></View> : null}

            <Text style={{ fontSize: 12, fontWeight: '600', color: '#5A6068', marginBottom: 6, letterSpacing: 0.5 }}>Email</Text>
            <TextInput defaultValue="" onChangeText={(t: string) => emailRef.current = t} placeholder="votre@email.com" placeholderTextColor="#9BA3AD" autoCapitalize="none" keyboardType="email-address"
              style={{ fontSize: 16, padding: 16, paddingHorizontal: 20, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.03)', color: '#1A1D21', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }} />

            <Text style={{ fontSize: 12, fontWeight: '600', color: '#5A6068', marginBottom: 6, letterSpacing: 0.5 }}>Mot de passe</Text>
            <TextInput defaultValue="" onChangeText={(t: string) => passwordRef.current = t} placeholder="..." placeholderTextColor="#9BA3AD" secureTextEntry autoCapitalize="none"
              style={{ fontSize: 16, padding: 16, paddingHorizontal: 20, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.03)', color: '#1A1D21', marginBottom: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }} />

            <TouchableOpacity disabled={submitting} onPress={async () => {
              setError('');
              const em = emailRef.current.trim();
              const pw = passwordRef.current;
              if (!em || !pw) return setError('Email et mot de passe requis');
              setSubmitting(true);
              try {
                let id = em;
                if (!id.includes('@') && !id.startsWith('+') && id.startsWith('0') && id.length >= 10) id = '+33' + id.substring(1).replace(/\s/g, '');
                await login(id.toLowerCase(), pw);
                hasRedirected.current = true; router.replace('/(tabs)');
              } catch (e: any) { setError(e.message || 'Erreur'); } finally { setSubmitting(false); }
            }} style={{ backgroundColor: '#1A1D21', borderRadius: 999, paddingVertical: 18, alignItems: 'center' }}>
              {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>Connexion</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
