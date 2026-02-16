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
        <div style={{ width: 28, height: 28, border: '3px solid #E5E7EB', borderTopColor: '#D97756', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>;
    }
    const { View, ActivityIndicator } = require('react-native');
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>;
  }

  /* ─── WEB: Pure HTML (Safari keyboard fix preserved) ─── */
  if (Platform.OS === 'web') {
    return (
      <div data-testid="login-screen" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', background: '#FFFFFF', overflow: 'hidden' } as any}>

        {/* ── Gradient header zone ── */}
        <div style={{
          background: 'linear-gradient(160deg, #E8956B 0%, #D97756 30%, #C4623D 70%, #B85636 100%)',
          padding: '56px 28px 72px', position: 'relative', flexShrink: 0,
        } as any}>
          {/* Decorative shapes */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' } as any} />
          <div style={{ position: 'absolute', bottom: -20, left: 30, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' } as any} />

          <div className="enter-up" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 } as any}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: 3 }}>CARE WATCH</span>
          </div>

          <div className="enter-up d1" style={{ fontSize: 30, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.15, marginBottom: 8 }}>
            Bienvenue
          </div>
          <div className="enter-up d2" style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', fontWeight: 400, lineHeight: 1.5 }}>
            Votre plateforme de teleassistance<br/>sante intelligente
          </div>
        </div>

        {/* ── Form card overlapping gradient ── */}
        <div style={{
          flex: 1, background: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28,
          marginTop: -32, position: 'relative', zIndex: 2,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
        } as any}>
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            data-testid="login-form"
            style={{ padding: '36px 28px 28px', maxWidth: 440, margin: '0 auto', width: '100%' } as any}
          >
            <div className="enter-up d2" style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 28 }}>Connexion</div>

            {error && (
              <div data-testid="login-error" className="enter-up" style={{
                background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 14,
                padding: '11px 16px', marginBottom: 20, fontSize: 13, color: '#DC2626', fontWeight: 500,
              }}>{error}</div>
            )}

            <div className="enter-up d3">
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 7 }}>Email</label>
              <input name="email" type="email" autoComplete="email" data-testid="login-email-input" placeholder="votre@email.com"
                style={{
                  display: 'block', width: '100%', fontSize: 15, padding: '15px 18px',
                  borderRadius: 14, border: '1.5px solid #E5E7EB', background: '#F9FAFB',
                  color: '#111827', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                  WebkitAppearance: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', marginBottom: 18,
                } as any}
              />
            </div>

            <div className="enter-up d4">
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 7 }}>Mot de passe</label>
              <input name="password" type="password" autoComplete="current-password" data-testid="login-password-input" placeholder="..."
                style={{
                  display: 'block', width: '100%', fontSize: 15, padding: '15px 18px',
                  borderRadius: 14, border: '1.5px solid #E5E7EB', background: '#F9FAFB',
                  color: '#111827', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                  WebkitAppearance: 'none', transition: 'border-color 0.2s, box-shadow 0.2s', marginBottom: 28,
                } as any}
              />
            </div>

            <div className="enter-up d5">
              <button type="submit" disabled={submitting} data-testid="login-form-submit-button"
                style={{
                  display: 'block', width: '100%', padding: '16px', borderRadius: 9999,
                  border: 'none', cursor: 'pointer', background: '#1F2937', color: '#FFFFFF',
                  fontSize: 15, fontWeight: 600, fontFamily: 'inherit', WebkitAppearance: 'none',
                  opacity: submitting ? 0.6 : 1, transition: 'opacity 0.2s, transform 0.15s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                } as any}
              >
                {submitting ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 } as any}>
                    <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFF', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' } as any} />
                    Connexion...
                  </span>
                ) : 'Se connecter'}
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#9CA3AF' } as any}>Mot de passe oublie ?</div>

            <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid #F3F4F6', fontSize: 14, color: '#6B7280' } as any}>
              Pas encore de compte ?{' '}
              <a href="#" data-testid="register-link" onClick={(e: any) => { e.preventDefault(); router.push('/activate-beneficiary'); }}
                style={{ fontWeight: 700, color: '#D97756', textDecoration: 'none' }}>
                S'inscrire
              </a>
            </div>
          </form>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="always" keyboardDismissMode="none">
          {/* Gradient header */}
          <View style={{ backgroundColor: '#D97756', padding: 28, paddingTop: 48, paddingBottom: 60 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: '#FFF' }}>+</Text>
              </View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.75)', letterSpacing: 3 }}>CARE WATCH</Text>
            </View>
            <Text style={{ fontSize: 30, fontWeight: '800', color: '#FFF', marginBottom: 8 }}>Bienvenue</Text>
            <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)' }}>Votre plateforme de teleassistance{'\n'}sante intelligente</Text>
          </View>

          {/* White card */}
          <View style={{ flex: 1, backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -28, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 28 }}>Connexion</Text>

            {error ? <View style={{ backgroundColor: '#FEF2F2', borderRadius: 14, padding: 12, marginBottom: 20 }}><Text style={{ fontSize: 13, color: '#DC2626' }}>{error}</Text></View> : null}

            <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 7 }}>Email</Text>
            <TextInput defaultValue="" onChangeText={(t: string) => emailRef.current = t} placeholder="votre@email.com" placeholderTextColor="#9CA3AF" autoCapitalize="none" keyboardType="email-address"
              style={{ fontSize: 15, padding: 15, paddingHorizontal: 18, borderRadius: 14, backgroundColor: '#F9FAFB', color: '#111827', marginBottom: 18, borderWidth: 1.5, borderColor: '#E5E7EB' }} />

            <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 7 }}>Mot de passe</Text>
            <TextInput defaultValue="" onChangeText={(t: string) => passwordRef.current = t} placeholder="..." placeholderTextColor="#9CA3AF" secureTextEntry autoCapitalize="none"
              style={{ fontSize: 15, padding: 15, paddingHorizontal: 18, borderRadius: 14, backgroundColor: '#F9FAFB', color: '#111827', marginBottom: 28, borderWidth: 1.5, borderColor: '#E5E7EB' }} />

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
            }} style={{ backgroundColor: '#1F2937', borderRadius: 9999, paddingVertical: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 }}>
              {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '600' }}>Se connecter</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
