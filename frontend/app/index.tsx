import React, { useRef, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/context/AuthContext';

/* JS Typewriter hook */
function useTypewriter(text: string, speed = 50, delay = 600) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++; }
        else { clearInterval(interval); setDone(true); }
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [text]);
  return { displayed, done };
}

export default function AuthScreen() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<any>(null);
  const title = useTypewriter('Connexion a votre espace.', 45, 800);

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
      return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A' }}>
        <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#FFF', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>;
    }
    const { View, ActivityIndicator } = require('react-native');
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' }}><ActivityIndicator size="large" color="#FFF" /></View>;
  }

  /* ─── WEB ─── */
  if (Platform.OS === 'web') {
    return (
      <div data-testid="login-screen" className="clinic-grid-dark" style={{
        minHeight: '100vh', minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden',
      } as any}>

        {/* ── Logo CHUTEX ── */}
        <div className="anim-up" style={{ marginBottom: 28 } as any}>
          <img src="https://cdn.shopify.com/s/files/1/0886/1918/8558/files/Logo_chutex_1.png?v=1737551429" alt="Chutex" style={{ height: 26, width: 'auto' } as any} />
        </div>

        {/* ── Glass pill badge ── */}
        <div className="glass-pill anim-up d1" style={{ marginBottom: 36, color: 'rgba(255,255,255,0.65)' } as any}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FFF', display: 'inline-block', flexShrink: 0, animation: 'pulse-dot 2s ease-in-out infinite' } as any} />
          CARE WATCH — ESPACE SECURISE
        </div>

        {/* ── Typewriter title (JS) ── */}
        <div className="anim-up d2" style={{ textAlign: 'center', marginBottom: 14, width: '100%', padding: '0 12px' } as any}>
          <h1 style={{ fontSize: 'clamp(22px, 6.5vw, 36px)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.25, margin: 0 } as any}>
            {title.displayed}<span style={{ borderRight: '2.5px solid #FFF', marginLeft: 2, animation: title.done ? 'blink-caret 0.8s step-end infinite' : 'none' } as any}>&nbsp;</span>
          </h1>
        </div>

        <p className="anim-up d3" style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', maxWidth: 340, lineHeight: 1.7, margin: '0 0 48px' } as any}>
          Teleassistance, suivi de sante et prevention —{' '}une interface clinique premium.
        </p>

        {/* ── Form — NO card, merged into background ── */}
        <form ref={formRef} onSubmit={handleSubmit} data-testid="login-form"
          style={{ width: '100%', maxWidth: 380, padding: '0 4px' } as any}>

          {error && (
            <div data-testid="login-error" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 14, padding: '11px 16px', marginBottom: 20, fontSize: 13, color: '#F87171', fontWeight: 500 }}>{error}</div>
          )}

          <div className="anim-up d4" style={{ marginBottom: 18 } as any}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 8, letterSpacing: 1.2, textTransform: 'uppercase' } as any}>Email</label>
            <input name="email" type="email" autoComplete="email" data-testid="login-email-input" placeholder="votre@email.com"
              style={{
                display: 'block', width: '100%', fontSize: 15, padding: '16px 0',
                borderRadius: 0, border: 'none', borderBottom: '1px solid rgba(255,255,255,0.12)',
                background: 'transparent', color: '#FFF', outline: 'none', boxSizing: 'border-box',
                fontFamily: 'inherit', WebkitAppearance: 'none', transition: 'border-color 0.3s',
              } as any} />
          </div>

          <div className="anim-up d5" style={{ marginBottom: 36 } as any}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', marginBottom: 8, letterSpacing: 1.2, textTransform: 'uppercase' } as any}>Mot de passe</label>
            <input name="password" type="password" autoComplete="current-password" data-testid="login-password-input" placeholder="..."
              style={{
                display: 'block', width: '100%', fontSize: 15, padding: '16px 0',
                borderRadius: 0, border: 'none', borderBottom: '1px solid rgba(255,255,255,0.12)',
                background: 'transparent', color: '#FFF', outline: 'none', boxSizing: 'border-box',
                fontFamily: 'inherit', WebkitAppearance: 'none', transition: 'border-color 0.3s',
              } as any} />
          </div>

          <div className="anim-up d6">
            <button type="submit" disabled={submitting} data-testid="login-form-submit-button" className="btn-scan"
              style={{ width: '100%', padding: '16px', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', opacity: submitting ? 0.6 : 1 } as any}>
              {submitting ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 } as any}>
                  <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#111', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' } as any} />
                  Connexion...
                </span>
              ) : 'Se connecter'}
            </button>
          </div>

          <div className="anim-up d7" style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.3)' } as any}>Mot de passe oublie ?</div>

          <div className="anim-up d7" style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: 'rgba(255,255,255,0.4)' } as any}>
            Pas encore de compte ?{' '}
            <a href="#" data-testid="register-link" onClick={(e: any) => { e.preventDefault(); router.push('/activate-beneficiary'); }}
              style={{ fontWeight: 700, color: '#FFF', textDecoration: 'none' }}>S'inscrire</a>
          </div>
        </form>

        {/* ── Footer ── */}
        <div className="anim-up d7" style={{ marginTop: 48, fontSize: 10, color: 'rgba(255,255,255,0.15)', letterSpacing: 1.2, textAlign: 'center' } as any}>
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
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF', textAlign: 'center', letterSpacing: 6, marginBottom: 28 }}>CHUTEX</Text>
          <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)', textAlign: 'center', letterSpacing: 2, marginBottom: 32 }}>CARE WATCH</Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFF', textAlign: 'center', marginBottom: 8 }}>Connexion a votre espace.</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 40 }}>Interface clinique premium</Text>

          {error ? <View style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 14, padding: 12, marginBottom: 20 }}><Text style={{ fontSize: 13, color: '#F87171' }}>{error}</Text></View> : null}

          <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.35)', marginBottom: 8, letterSpacing: 1.2 }}>EMAIL</Text>
          <TextInput defaultValue="" onChangeText={(t: string) => emailRef.current = t} placeholder="votre@email.com" placeholderTextColor="rgba(255,255,255,0.2)" autoCapitalize="none" keyboardType="email-address"
            style={{ fontSize: 15, paddingVertical: 16, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'transparent', color: '#FFF', marginBottom: 18 }} />

          <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.35)', marginBottom: 8, letterSpacing: 1.2 }}>MOT DE PASSE</Text>
          <TextInput defaultValue="" onChangeText={(t: string) => passwordRef.current = t} placeholder="..." placeholderTextColor="rgba(255,255,255,0.2)" secureTextEntry autoCapitalize="none"
            style={{ fontSize: 15, paddingVertical: 16, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'transparent', color: '#FFF', marginBottom: 36 }} />

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
