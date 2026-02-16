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
      return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#FAF8F5' }}>
        <div style={{ width: 32, height: 32, border: '3px solid rgba(198,122,79,0.15)', borderTopColor: '#C67A4F', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>;
    }
    const { View, ActivityIndicator } = require('react-native');
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>;
  }

  // ─── WEB: Pure HTML form (zero React Native Web, zero keyboard issues) ───
  if (Platform.OS === 'web') {
    return (
      <div data-testid="login-screen" style={{
        minHeight: '100vh',
        background: '#FAF8F5',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 20, fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        position: 'relative', overflow: 'hidden',
      } as any}>

        {/* Background warm gradient blob */}
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%', width: '70vw', height: '70vw', maxWidth: 600, maxHeight: 600,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,132,90,0.15) 0%, rgba(245,203,167,0.08) 50%, transparent 70%)',
          pointerEvents: 'none', animation: 'float 8s ease-in-out infinite',
        } as any} />
        <div style={{
          position: 'absolute', bottom: '-15%', left: '-10%', width: '50vw', height: '50vw', maxWidth: 400, maxHeight: 400,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(198,122,79,0.1) 0%, transparent 60%)',
          pointerEvents: 'none', animation: 'float 10s ease-in-out infinite reverse',
        } as any} />

        {/* Hero card with gradient */}
        <div style={{
          width: '100%', maxWidth: 420, marginBottom: 32, borderRadius: 28,
          background: 'linear-gradient(135deg, #D4845A 0%, #E8A87C 40%, #F5CBA7 100%)',
          backgroundSize: '200% 200%', animation: 'gradientShift 8s ease infinite',
          padding: '40px 28px 32px', position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(198,122,79,0.2), 0 2px 8px rgba(198,122,79,0.1)',
        } as any}>
          {/* Decorative circles */}
          <div style={{
            position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)', pointerEvents: 'none',
          } as any} />
          <div style={{
            position: 'absolute', bottom: -20, left: 40, width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
          } as any} />

          {/* Logo mark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 } as any}>
            <div style={{
              width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.25)',
              backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.3)',
            } as any}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: 3, textTransform: 'uppercase' } as any}>CARE WATCH</div>
          </div>

          <div style={{ fontSize: 28, fontWeight: 900, color: '#FFFFFF', letterSpacing: -0.5, lineHeight: 1.2, marginBottom: 6 }}>
            Bienvenue
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>
            Votre plateforme de teleassistance intelligente
          </div>
        </div>

        {/* Login form card */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          data-testid="login-form"
          style={{
            width: '100%', maxWidth: 420, padding: '32px 28px', borderRadius: 28,
            background: '#FFFFFF',
            border: '1px solid rgba(28,25,23,0.06)',
            boxShadow: '0 2px 20px rgba(28,25,23,0.05), 0 0 0 1px rgba(28,25,23,0.02)',
          } as any}
        >
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1C1917', marginBottom: 24, letterSpacing: -0.3 }}>Connexion</div>

          {error && (
            <div data-testid="login-error" style={{
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: 16, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#DC2626', fontWeight: 500,
            }}>{error}</div>
          )}

          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#78716C', marginBottom: 8, letterSpacing: 0.3 }}>Email</label>
          <input
            name="email"
            type="email"
            autoComplete="email"
            data-testid="login-email-input"
            placeholder="votre@email.com"
            style={{
              display: 'block', width: '100%', fontSize: 16, padding: '16px 20px', marginBottom: 20,
              borderRadius: 16, border: '1.5px solid rgba(28,25,23,0.08)',
              background: '#FAF8F5', color: '#1C1917',
              outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
              WebkitAppearance: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            } as any}
          />

          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#78716C', marginBottom: 8, letterSpacing: 0.3 }}>Mot de passe</label>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            data-testid="login-password-input"
            placeholder="..."
            style={{
              display: 'block', width: '100%', fontSize: 16, padding: '16px 20px', marginBottom: 28,
              borderRadius: 16, border: '1.5px solid rgba(28,25,23,0.08)',
              background: '#FAF8F5', color: '#1C1917',
              outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
              WebkitAppearance: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            } as any}
          />

          <button
            type="submit"
            disabled={submitting}
            data-testid="login-form-submit-button"
            style={{
              display: 'block', width: '100%', padding: '18px', borderRadius: 9999,
              border: 'none', cursor: 'pointer',
              background: '#1C1917', color: '#FFFFFF',
              fontSize: 15, fontWeight: 700, letterSpacing: 0.5,
              fontFamily: 'inherit', WebkitAppearance: 'none',
              opacity: submitting ? 0.6 : 1,
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 4px 16px rgba(28,25,23,0.15)',
            } as any}
          >
            {submitting ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 } as any}>
                <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' } as any} />
                Connexion...
              </span>
            ) : 'Se connecter'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#A8A29E' } as any}>
            Mot de passe oublie ?
          </div>
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#78716C' } as any}>
            Pas encore de compte ?{' '}
            <a href="#" data-testid="register-link" onClick={(e) => { e.preventDefault(); router.push('/activate-beneficiary'); }}
              style={{ fontWeight: 700, color: '#C67A4F', textDecoration: 'none' }}>
              S'inscrire
            </a>
          </div>
        </form>

        <div style={{ marginTop: 24, fontSize: 11, color: '#A8A29E', letterSpacing: 0.5 }}>
          Chutex Innovation — v2.0
        </div>
      </div>
    );
  }

  // ─── NATIVE: React Native components ───
  const { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator, KeyboardAvoidingView, StyleSheet } = require('react-native');
  const { SafeAreaView } = require('react-native-safe-area-context');
  const emailRef = useRef('');
  const passwordRef = useRef('');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF8F5' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 }} keyboardShouldPersistTaps="always" keyboardDismissMode="none">
          {/* Hero gradient card */}
          <View style={{ borderRadius: 28, padding: 32, marginBottom: 28, backgroundColor: '#D4845A', overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, color: '#FFF' }}>+</Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 3 }}>CARE WATCH</Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: -0.5, marginBottom: 6 }}>Bienvenue</Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: '500' }}>Votre plateforme de teleassistance</Text>
          </View>

          {/* Login form */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 28, padding: 28, borderWidth: 1, borderColor: 'rgba(28,25,23,0.06)' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#1C1917', marginBottom: 24 }}>Connexion</Text>

            {error ? <View style={{ backgroundColor: 'rgba(239,68,68,0.06)', borderRadius: 16, padding: 12, marginBottom: 20 }}><Text style={{ fontSize: 13, color: '#DC2626' }}>{error}</Text></View> : null}

            <Text style={{ fontSize: 12, fontWeight: '600', color: '#78716C', marginBottom: 8 }}>Email</Text>
            <TextInput defaultValue="" onChangeText={(t: string) => emailRef.current = t} placeholder="votre@email.com" placeholderTextColor="#A8A29E" autoCapitalize="none" keyboardType="email-address"
              style={{ fontSize: 16, padding: 16, paddingHorizontal: 20, borderRadius: 16, backgroundColor: '#FAF8F5', color: '#1C1917', marginBottom: 20, borderWidth: 1.5, borderColor: 'rgba(28,25,23,0.08)' }} />

            <Text style={{ fontSize: 12, fontWeight: '600', color: '#78716C', marginBottom: 8 }}>Mot de passe</Text>
            <TextInput defaultValue="" onChangeText={(t: string) => passwordRef.current = t} placeholder="..." placeholderTextColor="#A8A29E" secureTextEntry autoCapitalize="none"
              style={{ fontSize: 16, padding: 16, paddingHorizontal: 20, borderRadius: 16, backgroundColor: '#FAF8F5', color: '#1C1917', marginBottom: 28, borderWidth: 1.5, borderColor: 'rgba(28,25,23,0.08)' }} />

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
            }} style={{ backgroundColor: '#1C1917', borderRadius: 9999, paddingVertical: 18, alignItems: 'center', shadowColor: '#1C1917', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 }}>
              {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>Se connecter</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
