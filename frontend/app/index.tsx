import React, { useRef, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/context/AuthContext';

const BG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';

export default function AuthScreen() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('chutex_onboarding_done').then(val => {
      if (!val) router.replace('/onboarding'); else setReady(true);
    }).catch(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!loading && user && !hasRedirected.current) { hasRedirected.current = true; router.replace('/(tabs)'); }
    if (!loading && !user) hasRedirected.current = false;
  }, [user, loading]);

  const handleSubmit = async (e?: any) => {
    if (e) e.preventDefault();
    setError('');
    if (!email.trim() || !password) return setError('Email et mot de passe requis');
    setSubmitting(true);
    try {
      let id = email.trim();
      if (!id.includes('@') && !id.startsWith('+') && id.startsWith('0') && id.length >= 10) id = '+33' + id.substring(1).replace(/\s/g, '');
      await login(id.toLowerCase(), password);
      hasRedirected.current = true;
      router.replace('/(tabs)');
    } catch (err: any) { setError(err.message || 'Erreur de connexion'); } finally { setSubmitting(false); }
  };

  if (loading || user || !ready) {
    if (Platform.OS === 'web') return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A' } as any}><div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#FFF', borderRadius: '50%', animation: 'spin 0.7s linear infinite' } as any} /></div>;
    const { View, ActivityIndicator } = require('react-native');
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' }}><ActivityIndicator size="large" color="#FFF" /></View>;
  }

  if (Platform.OS === 'web') {
    return (
      <div data-testid="login-screen" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
        <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 } as any} />

        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' } as any}>
          <div style={{ width: '100%', maxWidth: 380 } as any}>

            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: 32 } as any}>
              <img src="https://cdn.shopify.com/s/files/1/0886/1918/8558/files/Logo_chutex_1.png?v=1737551429" alt="Chutex" style={{ height: 24, width: 'auto', marginBottom: 16 } as any} />
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 24 } as any}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: '#10B981' } as any} />
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5 }}>CARE WATCH</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Connexion</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Accedez a votre espace sante securise</div>
            </div>

            {error && <div data-testid="login-error" style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: 16, fontSize: 13, color: '#F87171' } as any}>{error}</div>}

            <form onSubmit={handleSubmit} data-testid="login-form">
              <div style={{ marginBottom: 16 } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Email</div>
                <input name="email" type="email" autoComplete="email" data-testid="login-email-input" placeholder="votre@email.com" value={email} onChange={(e: any) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 15, fontWeight: 500, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
              </div>
              <div style={{ marginBottom: 16 } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Mot de passe</div>
                <input name="password" type="password" autoComplete="current-password" data-testid="login-password-input" placeholder="Votre mot de passe" value={password} onChange={(e: any) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 15, fontWeight: 500, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
              </div>

              <button type="submit" disabled={submitting} data-testid="login-form-submit-button" style={{ width: '100%', padding: '16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.6 : 1, marginTop: 8 } as any}>
                {submitting ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.25)', cursor: 'pointer' } as any}>Mot de passe oublie ?</div>

            <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'rgba(255,255,255,0.35)' } as any}>
              Pas encore de compte ?{' '}
              <span data-testid="register-link" onClick={() => router.push('/register' as any)} style={{ fontWeight: 800, color: '#FFF', cursor: 'pointer' }}>S'inscrire</span>
            </div>

            <div style={{ textAlign: 'center', marginTop: 32, fontSize: 9, color: 'rgba(255,255,255,0.12)', letterSpacing: 1 }}>Donnees confidentielles · Interface clinique premium</div>
          </div>
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
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="always">
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF', textAlign: 'center', letterSpacing: 6, marginBottom: 28 }}>CHUTEX</Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFF', textAlign: 'center', marginBottom: 40 }}>Connexion</Text>
          {error ? <View style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 14, padding: 12, marginBottom: 20 }}><Text style={{ fontSize: 13, color: '#F87171' }}>{error}</Text></View> : null}
          <TextInput defaultValue="" onChangeText={(t: string) => emailRef.current = t} placeholder="votre@email.com" placeholderTextColor="rgba(255,255,255,0.2)" autoCapitalize="none" keyboardType="email-address"
            style={{ fontSize: 15, padding: 16, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', color: '#FFF', marginBottom: 16 }} />
          <TextInput defaultValue="" onChangeText={(t: string) => passwordRef.current = t} placeholder="Mot de passe" placeholderTextColor="rgba(255,255,255,0.2)" secureTextEntry
            style={{ fontSize: 15, padding: 16, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', color: '#FFF', marginBottom: 24 }} />
          <TouchableOpacity disabled={submitting} onPress={async () => {
            setError(''); const em = emailRef.current.trim(); const pw = passwordRef.current;
            if (!em || !pw) return setError('Email et mot de passe requis'); setSubmitting(true);
            try { await login(em.toLowerCase(), pw); router.replace('/(tabs)'); } catch (e: any) { setError(e.message); } finally { setSubmitting(false); }
          }} style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 9999, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
            {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>Se connecter</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
