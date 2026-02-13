import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, Share, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { apiFetch } from '../src/services/api';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 8px 32px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(255,255,255,0.6)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 20, marginBottom: 12, ...glass }, style]}>{children}</View>
);

export default function LinkScreen() {
  const { colors } = useTheme();
  const { user, token, refreshUser } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'choose' | 'generate' | 'enter_code' | 'enter_phone'>('choose');
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const isBeneficiary = user?.role === 'beneficiary';

  const generateCode = async () => {
    setLoading(true);
    try {
      const r = await apiFetch('/api/beneficiary/generate-link-code', { method: 'POST' }, token);
      setGeneratedCode(r.code); setMode('generate');
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setLoading(false); }
  };

  const linkWithCode = async () => {
    if (!code.trim()) return Alert.alert('Erreur', 'Entrez un code');
    setLoading(true); setResult(null);
    try {
      const r = await apiFetch('/api/guardian/link-with-code', { method: 'POST', body: JSON.stringify({ link_code: code.trim().toUpperCase() }) }, token);
      setResult(r);
      if (r.status === 'pending') Alert.alert('Demande envoyee', r.message);
    } catch (e: any) { setResult({ error: e.message }); } finally { setLoading(false); }
  };

  const linkWithPhone = async () => {
    if (!phone.trim()) return Alert.alert('Erreur', 'Entrez un numero');
    setLoading(true); setResult(null);
    try {
      const r = await apiFetch('/api/guardian/link-with-phone', { method: 'POST', body: JSON.stringify({ phone: phone.trim() }) }, token);
      setResult(r);
      if (r.status === 'pending') Alert.alert('Demande envoyee', r.message);
    } catch (e: any) { setResult({ error: e.message }); } finally { setLoading(false); }
  };

  const shareCode = async () => {
    try { await Share.share({ message: `Rejoignez-moi sur Chutex ! Mon code : ${generatedCode}` }); } catch {}
  };

  // Beneficiary: Generate code / QR
  if (isBeneficiary) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: '#000' }}>Mon code</Text>
        </View>
        <View style={{ paddingHorizontal: 16 }}>
          {!generatedCode ? (
            <GlassCard style={{ alignItems: 'center', padding: 32 }}>
              <Ionicons name="qr-code-outline" size={48} color="#000" />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#000', marginTop: 12 }}>Partagez votre code</Text>
              <Text style={{ fontSize: 13, color: '#888', marginTop: 6, textAlign: 'center', lineHeight: 19 }}>Generez un code que vos gardiens pourront utiliser pour vous ajouter. Ils devront attendre votre validation.</Text>
              <TouchableOpacity style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 14, paddingHorizontal: 32, marginTop: 20 }} onPress={generateCode} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800', textTransform: 'uppercase' }}>GENERER MON CODE</Text>}
              </TouchableOpacity>
            </GlassCard>
          ) : (
            <GlassCard style={{ alignItems: 'center', padding: 32 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>VOTRE CODE</Text>
              <Text style={{ fontSize: 42, fontWeight: '900', color: '#000', letterSpacing: 6, marginTop: 8 }}>{generatedCode}</Text>
              <Text style={{ fontSize: 13, color: '#888', marginTop: 8, textAlign: 'center' }}>Communiquez ce code a votre gardien. Il devra le saisir dans son application.</Text>
              <TouchableOpacity style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 14, paddingHorizontal: 32, marginTop: 20, flexDirection: 'row', gap: 8, alignItems: 'center' }} onPress={shareCode}>
                <Ionicons name="share-outline" size={18} color="#FFF" />
                <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800', textTransform: 'uppercase' }}>PARTAGER</Text>
              </TouchableOpacity>
            </GlassCard>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // Guardian: 3 methods to add beneficiary
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => { if (mode !== 'choose') setMode('choose'); else router.back(); }} style={{ padding: 4, marginRight: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: '#000' }}>Ajouter un beneficiaire</Text>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        {mode === 'choose' && (
          <>
            <Text style={{ fontSize: 14, color: '#888', marginBottom: 20, lineHeight: 20 }}>Choisissez une methode pour ajouter un beneficiaire. Il devra valider votre demande.</Text>

            <TouchableOpacity onPress={() => setMode('enter_code')} activeOpacity={0.7}>
              <GlassCard style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="keypad-outline" size={24} color="#000" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#000' }}>Saisir un code</Text>
                  <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Entrez le code du beneficiaire</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </GlassCard>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setMode('enter_code')} activeOpacity={0.7}>
              <GlassCard style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="qr-code-outline" size={24} color="#000" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#000' }}>Scanner un QR code</Text>
                  <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Scannez le code QR du beneficiaire</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </GlassCard>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setMode('enter_phone')} activeOpacity={0.7}>
              <GlassCard style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="call-outline" size={24} color="#000" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#000' }}>Numero de telephone</Text>
                  <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Envoyez une demande par telephone</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#888" />
              </GlassCard>
            </TouchableOpacity>
          </>
        )}

        {mode === 'enter_code' && (
          <GlassCard style={{ padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#000', marginBottom: 8 }}>Saisir le code</Text>
            <Text style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Entrez le code a 6 caracteres du beneficiaire</Text>
            {Platform.OS === 'web' ? (
              <div style={{ marginBottom: 16 }}>
                <input data-testid="link-code-input" type="text" placeholder="EX: A1B2C3" value={code}
                  onChange={(e: any) => setCode(e.target.value.toUpperCase())} maxLength={6}
                  style={{ width: '100%', fontSize: 24, fontWeight: '800', padding: '16px', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.5)', fontFamily: 'system-ui', textAlign: 'center', letterSpacing: 8, boxSizing: 'border-box' as any }} />
              </div>
            ) : (
              <TextInput testID="link-code-input" value={code} onChangeText={t => setCode(t.toUpperCase())} placeholder="A1B2C3" maxLength={6}
                style={{ fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: 8, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }} autoCapitalize="characters" />
            )}
            {result && <View style={{ backgroundColor: result.error ? '#FFEBEE' : '#E8F5E9', borderRadius: 12, padding: 12, marginBottom: 12 }}><Text style={{ fontSize: 13, fontWeight: '600', color: result.error ? '#C62828' : '#2E7D32' }}>{result.error || result.message}</Text></View>}
            <TouchableOpacity style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 16, alignItems: 'center' }} onPress={linkWithCode} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800', textTransform: 'uppercase' }}>ENVOYER LA DEMANDE</Text>}
            </TouchableOpacity>
          </GlassCard>
        )}

        {mode === 'enter_phone' && (
          <GlassCard style={{ padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#000', marginBottom: 8 }}>Numero de telephone</Text>
            <Text style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Le beneficiaire recevra une demande sur son compte</Text>
            {Platform.OS === 'web' ? (
              <div style={{ marginBottom: 16 }}>
                <input data-testid="link-phone-input" type="tel" placeholder="06 12 34 56 78" value={phone}
                  onChange={(e: any) => setPhone(e.target.value)}
                  style={{ width: '100%', fontSize: 18, padding: '16px', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.5)', fontFamily: 'system-ui', boxSizing: 'border-box' as any }} />
              </div>
            ) : (
              <TextInput testID="link-phone-input" value={phone} onChangeText={setPhone} placeholder="06 12 34 56 78" keyboardType="phone-pad"
                style={{ fontSize: 18, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }} />
            )}
            {result && <View style={{ backgroundColor: result.error ? '#FFEBEE' : '#E8F5E9', borderRadius: 12, padding: 12, marginBottom: 12 }}><Text style={{ fontSize: 13, fontWeight: '600', color: result.error ? '#C62828' : '#2E7D32' }}>{result.error || result.message}</Text></View>}
            <TouchableOpacity style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 16, alignItems: 'center' }} onPress={linkWithPhone} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800', textTransform: 'uppercase' }}>ENVOYER LA DEMANDE</Text>}
            </TouchableOpacity>
          </GlassCard>
        )}
      </View>
    </SafeAreaView>
  );
}
