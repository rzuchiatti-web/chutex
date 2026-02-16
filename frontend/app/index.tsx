import React, { useRef, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/context/AuthContext';

export default function AuthScreen() {
  const { user, loading, login } = useAuth();
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
      return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#FFF' }}>
        <div style={{ width: 28, height: 28, border: '3px solid #E5E7EB', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>;
    }
    const { View, ActivityIndicator } = require('react-native');
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>;
  }

  /* ─── WEB: Pure HTML (Safari keyboard fix preserved) ─── */
  if (Platform.OS === 'web') {
    return (
      <div data-testid="login-screen" className="clinic-grid-dark" style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: 24, fontFamily: 'Inter, system-ui, sans-serif',
      } as any}>

        {/* Glass pill badge */}
        <div className="glass-pill anim-up" style={{ marginBottom: 40, color: 'rgba(255,255,255,0.7)' } as any}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FFF', display: 'inline-block', flexShrink: 0, animation: 'pulse-dot 2s ease-in-out infinite' } as any}></span>
          CARE WATCH — ESPACE SECURISE
        </div>

        {/* Typewriter title */}
        <div className="anim-up d1" style={{ textAlign: 'center', marginBottom: 12, width: '100%', maxWidth: 420, padding: '0 8px' } as any}>
          <h1 style={{ fontSize: 'clamp(24px, 7vw, 34px)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, margin: 0, wordBreak: 'break-word' } as any}>
            <span className="typewriter" style={{ whiteSpace: 'normal', display: 'inline' } as any}>Connexion a votre espace.</span>
          </h1>
        </div>

        <p className="anim-up d2" style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 40, maxWidth: 360, lineHeight: 1.6, margin: '0 0 40px' } as any}>
          Teleassistance, suivi de sante et prevention — une interface clinique premium.
        </p>

        {/* Form card */}
        <form ref={formRef} onSubmit={handleSubmit} data-testid="login-form"
          style={{ width: '100%', maxWidth: 400, padding: '32px 28px', borderRadius: 24,
            background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px) saturate(120%)', WebkitBackdropFilter: 'blur(16px) saturate(120%)',
            border: '1px solid rgba(255,255,255,0.08)',
          } as any}>

          {error && (
            <div data-testid="login-error" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '11px 16px', marginBottom: 20, fontSize: 13, color: '#F87171', fontWeight: 500 }}>{error}</div>
          )}

          <div className="anim-up d3">
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 7, letterSpacing: 1, textTransform: 'uppercase' } as any}>Email</label>
            <input name="email" type="email" autoComplete="email" data-testid="login-email-input" placeholder="votre@email.com"
              style={{ display: 'block', width: '100%', fontSize: 15, padding: '15px 18px', borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
                color: '#FFF', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', WebkitAppearance: 'none',
                transition: 'border-color 0.2s', marginBottom: 16,
              } as any} />
          </div>

          <div className="anim-up d4">
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 7, letterSpacing: 1, textTransform: 'uppercase' } as any}>Mot de passe</label>
            <input name="password" type="password" autoComplete="current-password" data-testid="login-password-input" placeholder="..."
              style={{ display: 'block', width: '100%', fontSize: 15, padding: '15px 18px', borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
                color: '#FFF', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', WebkitAppearance: 'none',
                transition: 'border-color 0.2s', marginBottom: 28,
              } as any} />
          </div>

          <div className="anim-up d5">
            <button type="submit" disabled={submitting} data-testid="login-form-submit-button" className="btn-scan"
              style={{ width: '100%', padding: '16px', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', opacity: submitting ? 0.6 : 1 } as any}>
              {submitting ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 } as any}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFF', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' } as any} />
                  Connexion...
                </span>
              ) : 'Se connecter'}
            </button>
          </div>

          <div className="anim-up d6" style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.35)' } as any}>Mot de passe oublie ?</div>

          <div className="anim-up d7" style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 14, color: 'rgba(255,255,255,0.45)' } as any}>
            Pas encore de compte ?{' '}
            <a href="#" data-testid="register-link" onClick={(e: any) => { e.preventDefault(); router.push('/activate-beneficiary'); }}
              style={{ fontWeight: 700, color: '#FFF', textDecoration: 'none' }}>S'inscrire</a>
          </div>
        </form>

        {/* Footer */}
        <div className="anim-up d7" style={{ marginTop: 32, fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: 1 } as any}>
          Donnees confidentielles · Analyse en temps reel · Interface clinique premium
        </div>
      </div>
    );
  }

  /* ─── NATIVE ─── */
  const { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView } = require('react-native');
  const { SafeAreaView } = require('react-native-safe-area-context');
  const emailRef = useRef('');
  const passwordRef = useRef('');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="always" keyboardDismissMode="none">
          <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)', textAlign: 'center', letterSpacing: 2, marginBottom: 32 }}>CARE WATCH</Text>
          <Text style={{ fontSize: 30, fontWeight: '800', color: '#FFF', textAlign: 'center', marginBottom: 8 }}>Connexion</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginBottom: 36 }}>Interface clinique premium</Text>

          {error ? <View style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 14, padding: 12, marginBottom: 20 }}><Text style={{ fontSize: 13, color: '#F87171' }}>{error}</Text></View> : null}

          <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.4)', marginBottom: 7, letterSpacing: 1 }}>EMAIL</Text>
          <TextInput defaultValue="" onChangeText={(t: string) => emailRef.current = t} placeholder="votre@email.com" placeholderTextColor="rgba(255,255,255,0.25)" autoCapitalize="none" keyboardType="email-address"
            style={{ fontSize: 15, padding: 15, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', color: '#FFF', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} />

          <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.4)', marginBottom: 7, letterSpacing: 1 }}>MOT DE PASSE</Text>
          <TextInput defaultValue="" onChangeText={(t: string) => passwordRef.current = t} placeholder="..." placeholderTextColor="rgba(255,255,255,0.25)" secureTextEntry autoCapitalize="none"
            style={{ fontSize: 15, padding: 15, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', color: '#FFF', marginBottom: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} />

          <TouchableOpacity disabled={submitting} onPress={async () => {
            setError('');
            const em = emailRef.current.trim(); const pw = passwordRef.current;
            if (!em || !pw) return setError('Email et mot de passe requis');
            setSubmitting(true);
            try {
              let id = em;
              if (!id.includes('@') && !id.startsWith('+') && id.startsWith('0') && id.length >= 10) id = '+33' + id.substring(1).replace(/\s/g, '');
              await login(id.toLowerCase(), pw);
              hasRedirected.current = true; router.replace('/(tabs)');
            } catch (e: any) { setError(e.message || 'Erreur'); } finally { setSubmitting(false); }
          }} style={{ backgroundColor: '#FFF', borderRadius: 9999, paddingVertical: 16, alignItems: 'center' }}>
            {submitting ? <ActivityIndicator color="#111" /> : <Text style={{ color: '#111', fontSize: 15, fontWeight: '600' }}>Se connecter</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
