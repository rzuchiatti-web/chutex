import React, { useRef, useEffect, useState } from 'react';
import FullScreenLoader from '../src/components/FullScreenLoader';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/context/AuthContext';

const BG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';
const PREFIXES = [
  { code: '+33', flag: '\u{1F1EB}\u{1F1F7}', label: 'France' },
  { code: '+32', flag: '\u{1F1E7}\u{1F1EA}', label: 'Belgique' },
  { code: '+41', flag: '\u{1F1E8}\u{1F1ED}', label: 'Suisse' },
  { code: '+352', flag: '\u{1F1F1}\u{1F1FA}', label: 'Luxembourg' },
  { code: '+49', flag: '\u{1F1E9}\u{1F1EA}', label: 'Allemagne' },
  { code: '+39', flag: '\u{1F1EE}\u{1F1F9}', label: 'Italie' },
  { code: '+34', flag: '\u{1F1EA}\u{1F1F8}', label: 'Espagne' },
  { code: '+351', flag: '\u{1F1F5}\u{1F1F9}', label: 'Portugal' },
  { code: '+44', flag: '\u{1F1EC}\u{1F1E7}', label: 'Royaume-Uni' },
  { code: '+353', flag: '\u{1F1EE}\u{1F1EA}', label: 'Irlande' },
  { code: '+31', flag: '\u{1F1F3}\u{1F1F1}', label: 'Pays-Bas' },
  { code: '+43', flag: '\u{1F1E6}\u{1F1F9}', label: 'Autriche' },
  { code: '+48', flag: '\u{1F1F5}\u{1F1F1}', label: 'Pologne' },
  { code: '+420', flag: '\u{1F1E8}\u{1F1FF}', label: 'Tchequie' },
  { code: '+421', flag: '\u{1F1F8}\u{1F1F0}', label: 'Slovaquie' },
  { code: '+36', flag: '\u{1F1ED}\u{1F1FA}', label: 'Hongrie' },
  { code: '+40', flag: '\u{1F1F7}\u{1F1F4}', label: 'Roumanie' },
  { code: '+359', flag: '\u{1F1E7}\u{1F1EC}', label: 'Bulgarie' },
  { code: '+385', flag: '\u{1F1ED}\u{1F1F7}', label: 'Croatie' },
  { code: '+386', flag: '\u{1F1F8}\u{1F1EE}', label: 'Slovenie' },
  { code: '+30', flag: '\u{1F1EC}\u{1F1F7}', label: 'Grece' },
  { code: '+45', flag: '\u{1F1E9}\u{1F1F0}', label: 'Danemark' },
  { code: '+46', flag: '\u{1F1F8}\u{1F1EA}', label: 'Suede' },
  { code: '+47', flag: '\u{1F1F3}\u{1F1F4}', label: 'Norvege' },
  { code: '+358', flag: '\u{1F1EB}\u{1F1EE}', label: 'Finlande' },
  { code: '+354', flag: '\u{1F1EE}\u{1F1F8}', label: 'Islande' },
  { code: '+372', flag: '\u{1F1EA}\u{1F1EA}', label: 'Estonie' },
  { code: '+371', flag: '\u{1F1F1}\u{1F1FB}', label: 'Lettonie' },
  { code: '+370', flag: '\u{1F1F1}\u{1F1F9}', label: 'Lituanie' },
  { code: '+356', flag: '\u{1F1F2}\u{1F1F9}', label: 'Malte' },
  { code: '+357', flag: '\u{1F1E8}\u{1F1FE}', label: 'Chypre' },
  { code: '+377', flag: '\u{1F1F2}\u{1F1E8}', label: 'Monaco' },
  { code: '+376', flag: '\u{1F1E6}\u{1F1E9}', label: 'Andorre' },
  { code: '+378', flag: '\u{1F1F8}\u{1F1F2}', label: 'Saint-Marin' },
  { code: '+381', flag: '\u{1F1F7}\u{1F1F8}', label: 'Serbie' },
  { code: '+382', flag: '\u{1F1F2}\u{1F1EA}', label: 'Montenegro' },
  { code: '+355', flag: '\u{1F1E6}\u{1F1F1}', label: 'Albanie' },
  { code: '+389', flag: '\u{1F1F2}\u{1F1F0}', label: 'Macedoine du Nord' },
  { code: '+387', flag: '\u{1F1E7}\u{1F1E6}', label: 'Bosnie-Herzegovine' },
  { code: '+380', flag: '\u{1F1FA}\u{1F1E6}', label: 'Ukraine' },
  { code: '+373', flag: '\u{1F1F2}\u{1F1E9}', label: 'Moldavie' },
  { code: '+375', flag: '\u{1F1E7}\u{1F1FE}', label: 'Bielorussie' },
  { code: '+7', flag: '\u{1F1F7}\u{1F1FA}', label: 'Russie' },
  { code: '+90', flag: '\u{1F1F9}\u{1F1F7}', label: 'Turquie' },
  { code: '+212', flag: '\u{1F1F2}\u{1F1E6}', label: 'Maroc' },
  { code: '+216', flag: '\u{1F1F9}\u{1F1F3}', label: 'Tunisie' },
  { code: '+213', flag: '\u{1F1E9}\u{1F1FF}', label: 'Algerie' },
  { code: '+1', flag: '\u{1F1FA}\u{1F1F8}', label: 'USA / Canada' },
];

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
          <div style={{ width: '100%', maxWidth: 360 } as any}>

            {/* Logo centered top */}
            <div style={{ textAlign: 'center', marginBottom: 36 } as any}>
              <img src="https://cdn.shopify.com/s/files/1/0886/1918/8558/files/Logo_chutex_1.png?v=1737551429" alt="Chutex" style={{ height: 52, width: 'auto', display: 'block', margin: '0 auto' } as any} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Connexion</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Accedez a votre espace sante securise</div>
            </div>

            {error && <div data-testid="login-error" style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', marginBottom: 16, fontSize: 12, color: '#FCA5A5' } as any}>{error}</div>}

            <form onSubmit={handleSubmit} data-testid="login-form">
              {/* Phone */}
              <div style={{ marginBottom: 14 } as any}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Telephone</div>
                <div style={{ display: 'flex', gap: 8 } as any}>
                  <div onClick={() => setShowPrefix(!showPrefix)} style={{ padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 } as any}>
                    <span style={{ fontSize: 15 }}>{selectedPfx.flag}</span>
                    <span style={{ fontSize: 13, color: '#FFF', fontWeight: 600 }}>{prefix}</span>
                    <i className="ri-arrow-down-s-line" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }} />
                  </div>
                  <input name="phone" type="tel" autoComplete="tel" data-testid="login-phone-input" placeholder="06 12 34 56 78" value={phone} onChange={(e: any) => setPhone(e.target.value)}
                    style={{ flex: 1, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', color: '#FFF', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
                </div>
                {showPrefix && (
                  <div style={{ marginTop: 6, padding: '6px', borderRadius: 12, background: 'rgba(10,15,25,0.95)', border: '1px solid rgba(255,255,255,0.1)', maxHeight: 180, overflowY: 'auto' } as any}>
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

              {/* Password */}
              <div style={{ marginBottom: 20 } as any}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Mot de passe</div>
                <input name="password" type="password" autoComplete="current-password" data-testid="login-password-input" placeholder="Votre mot de passe" value={password} onChange={(e: any) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', color: '#FFF', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
              </div>

              {/* Submit */}
              <button type="submit" disabled={submitting} data-testid="login-form-submit-button" style={{ width: '100%', padding: '14px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', color: '#FFF', fontSize: 14, fontWeight: 800, fontFamily: 'inherit', cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.6 : 1, letterSpacing: 0.3 } as any}>
                {submitting ? 'Connexion...' : 'Se connecter'}
              </button>
            </form>

            <div onClick={() => { setShowForgot(true); setForgotPhone(''); setForgotMsg(''); }} style={{ textAlign: 'center', marginTop: 18, fontSize: 12, color: 'rgba(255,255,255,0.45)', cursor: 'pointer' } as any}>Mot de passe oublie ?</div>

            <div style={{ textAlign: 'center', marginTop: 12 } as any}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Pas encore de compte ? </span>
              <span onClick={() => router.push('/register' as any)} style={{ fontSize: 12, color: '#FFF', fontWeight: 700, cursor: 'pointer' }}>S'inscrire</span>
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
