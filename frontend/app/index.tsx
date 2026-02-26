import React, { useRef, useEffect, useState } from 'react';
import FullScreenLoader from '../src/components/FullScreenLoader';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/context/AuthContext';
import { PREFIXES } from '../src/components/register/RegisterUI';

export default function AuthScreen() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [phone, setPhone] = useState('');
  const [prefix, setPrefix] = useState('+33');
  const [password, setPassword] = useState('');
  const [showPrefix, setShowPrefix] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

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
    if (!phone.trim() || !password) return setError('Telephone et mot de passe requis');
    setSubmitting(true);
    try {
      let id = phone.trim().replace(/\s/g, '');
      if (id.startsWith('0') && id.length >= 9) id = prefix + id.substring(1);
      else if (!id.startsWith('+')) id = prefix + id;
      await login(id, password);
      hasRedirected.current = true;
      router.replace('/(tabs)');
    } catch (err: any) { setError(err.message || 'Erreur de connexion'); } finally { setSubmitting(false); }
  };

  if (loading || user || !ready) {
    if (Platform.OS === 'web') return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A' } as any}><div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#FFF', borderRadius: '50%', animation: 'spin 0.7s linear infinite' } as any} /></div>;
    const { View, ActivityIndicator } = require('react-native');
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' }}><ActivityIndicator size="large" color="#FFF" /></View>;
  }

  const selectedPfx = PREFIXES.find(p => p.code === prefix) || PREFIXES[0];

  if (Platform.OS === 'web') {
    return (
      <div data-testid="login-screen" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: 'url(https://cdn.shopify.com/s/files/1/0886/1918/8558/files/banner_login_mobile.jpg?v=1771242072)', backgroundSize: 'cover', backgroundPosition: 'center 30%' } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)', zIndex: 1 } as any} />

        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' } as any}>
          <div style={{ width: '100%', maxWidth: 340 } as any}>

            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: 40 } as any}>
              <img src="https://cdn.shopify.com/s/files/1/0886/1918/8558/files/Logo_chutex_1.png?v=1737551429" alt="Chutex" style={{ height: 48, width: 'auto', display: 'block', margin: '0 auto' } as any} />
            </div>

            {/* Title */}
            <div style={{ marginBottom: 24 } as any}>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Connexion</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Accedez a votre espace sante</div>
            </div>

            {error && <div data-testid="login-error" style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: 16, fontSize: 12, color: '#FCA5A5' } as any}>{error}</div>}

            <form onSubmit={handleSubmit} data-testid="login-form">
              <div style={{ marginBottom: 16 } as any}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>Telephone</div>
                <div style={{ display: 'flex', gap: 8 } as any}>
                  <div onClick={() => setShowPrefix(!showPrefix)} style={{ padding: '13px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 } as any}>
                    <span style={{ fontSize: 16 }}>{selectedPfx.flag}</span>
                    <span style={{ fontSize: 14, color: '#FFF', fontWeight: 600 }}>{prefix}</span>
                    <i className="ri-arrow-down-s-line" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }} />
                  </div>
                  <input name="phone" type="tel" autoComplete="tel" data-testid="login-phone-input" placeholder="06 12 34 56 78" value={phone} onChange={(e: any) => setPhone(e.target.value)}
                    style={{ flex: 1, padding: '13px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', color: '#FFF', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
                </div>
                {showPrefix && (
                  <div style={{ marginTop: 6, padding: '6px', borderRadius: 12, background: 'rgba(10,15,25,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', maxHeight: 160, overflowY: 'auto' } as any}>
                    {PREFIXES.map(p => (
                      <div key={p.code} onClick={() => { setPrefix(p.code); setShowPrefix(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', background: prefix === p.code ? 'rgba(255,255,255,0.06)' : 'transparent' } as any}>
                        <span style={{ fontSize: 14 }}>{p.flag}</span>
                        <span style={{ fontSize: 12, color: '#FFF', flex: 1 }}>{p.label}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{p.code}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 24 } as any}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>Mot de passe</div>
                <input name="password" type="password" autoComplete="current-password" data-testid="login-password-input" placeholder="Votre mot de passe" value={password} onChange={(e: any) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '13px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', color: '#FFF', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
              </div>

              <button type="submit" disabled={submitting} data-testid="login-form-submit-button" style={{ width: '100%', padding: '15px', borderRadius: 999, background: '#FFF', border: 'none', color: '#111', fontSize: 15, fontWeight: 800, fontFamily: 'inherit', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.6 : 1 } as any}>
                {submitting ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            <div onClick={() => { setShowForgot(true); setForgotPhone(''); setForgotMsg(''); }} style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' } as any}>Mot de passe oublie ?</div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '24px 0 20px' } as any} />

            <div style={{ textAlign: 'center' } as any}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>Pas encore de compte ? </span>
              <span data-testid="register-link" onClick={() => router.push('/register' as any)} style={{ fontSize: 13, color: '#FFF', fontWeight: 700, cursor: 'pointer' }}>S'inscrire</span>
            </div>

            {/* Forgot password popup */}
            {showForgot && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                <div style={{ width: '100%', maxWidth: 380, padding: '32px 28px', boxSizing: 'border-box' } as any}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 } as any}>
                    <div onClick={() => setShowForgot(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
                  </div>
                  <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}>
                      <i className="ri-lock-unlock-line" style={{ fontSize: 28, color: '#F59E0B' }} />
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Mot de passe oublie</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>Entrez votre numero de telephone pour recevoir un lien de reinitialisation par SMS.</div>
                  </div>
                  <div style={{ marginBottom: 16 } as any}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Telephone</div>
                    <div style={{ display: 'flex', gap: 8 } as any}>
                      <div style={{ padding: '13px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 } as any}>
                        <span style={{ fontSize: 16 }}>{selectedPfx.flag}</span>
                        <span style={{ fontSize: 13, color: '#FFF', fontWeight: 600 }}>{prefix}</span>
                      </div>
                      <input type="tel" placeholder="06 12 34 56 78" value={forgotPhone} onChange={(e: any) => setForgotPhone(e.target.value)}
                        style={{ flex: 1, padding: '13px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
                    </div>
                  </div>
                  {forgotMsg && (
                    <div style={{ padding: '12px 16px', borderRadius: 14, background: forgotMsg.includes('envoye') ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${forgotMsg.includes('envoye') ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`, marginBottom: 14, fontSize: 13, color: forgotMsg.includes('envoye') ? '#10B981' : '#F87171' } as any}>{forgotMsg}</div>
                  )}
                  <div onClick={() => {
                    if (!forgotPhone.trim()) return setForgotMsg('Veuillez entrer votre numero de telephone.');
                    setForgotMsg('Un SMS de reinitialisation a ete envoye a votre numero.');
                  }} style={{ padding: '16px', borderRadius: 999, background: forgotPhone.trim() ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${forgotPhone.trim() ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, cursor: forgotPhone.trim() ? 'pointer' : 'not-allowed', textAlign: 'center', fontSize: 14, fontWeight: 700, color: forgotPhone.trim() ? '#FFF' : 'rgba(255,255,255,0.2)' } as any}>Envoyer le lien</div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  /* NATIVE */
  const { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView } = require('react-native');
  const { SafeAreaView } = require('react-native-safe-area-context');
  const phoneRef = useRef('');
  const passwordRef = useRef('');
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="always">
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFF', textAlign: 'center', marginBottom: 40 }}>Connexion</Text>
          {error ? <View style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 14, padding: 12, marginBottom: 20 }}><Text style={{ fontSize: 13, color: '#F87171' }}>{error}</Text></View> : null}
          <TextInput defaultValue="" onChangeText={(t: string) => phoneRef.current = t} placeholder="06 12 34 56 78" placeholderTextColor="rgba(255,255,255,0.2)" keyboardType="phone-pad"
            style={{ fontSize: 15, padding: 16, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', color: '#FFF', marginBottom: 16 }} />
          <TextInput defaultValue="" onChangeText={(t: string) => passwordRef.current = t} placeholder="Mot de passe" placeholderTextColor="rgba(255,255,255,0.2)" secureTextEntry
            style={{ fontSize: 15, padding: 16, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', color: '#FFF', marginBottom: 24 }} />
          <TouchableOpacity disabled={submitting} onPress={async () => {
            setError(''); const ph = phoneRef.current.trim(); const pw = passwordRef.current;
            if (!ph || !pw) return setError('Telephone et mot de passe requis'); setSubmitting(true);
            try { let id = ph.replace(/\s/g, ''); if (id.startsWith('0')) id = '+33' + id.substring(1); await login(id, pw); router.replace('/(tabs)'); } catch (e: any) { setError(e.message); } finally { setSubmitting(false); }
          }} style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 9999, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
            {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>Se connecter</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
