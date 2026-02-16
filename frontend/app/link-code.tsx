import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Share, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { apiFetch } from '../src/services/api';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 20, marginBottom: 12, ...glass }, style]}>{children}</View>
);

export default function LinkScreen() {
  const { colors } = useTheme();
  const { user, token } = useAuth();
  const router = useRouter();
  const isBeneficiary = user?.role === 'beneficiary';

  // Beneficiary state
  const [myCode, setMyCode] = useState('');
  const [loadingCode, setLoadingCode] = useState(true);
  const [invitePhone, setInvitePhone] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<any>(null);

  // Guardian state
  const [mode, setMode] = useState<'choose' | 'enter_code' | 'enter_phone'>('choose');
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Auto-load code for beneficiary
  useEffect(() => {
    if (isBeneficiary && token) {
      (async () => {
        try {
          const r = await apiFetch('/api/beneficiary/generate-link-code', { method: 'POST' }, token);
          setMyCode(r.code);
        } catch {} finally { setLoadingCode(false); }
      })();
    } else { setLoadingCode(false); }
  }, [isBeneficiary, token]);

  const shareCode = async () => {
    try { await Share.share({ message: `Rejoignez-moi sur Chutex ! Mon code : ${myCode}` }); } catch {}
  };

  const inviteByPhone = async () => {
    if (!invitePhone.trim()) return Alert.alert('Erreur', 'Entrez un numero');
    setInviting(true); setInviteResult(null);
    try {
      const r = await apiFetch('/api/guardians/invite', { method: 'POST', body: JSON.stringify({ phone: invitePhone.trim() }) }, token);
      setInviteResult(r);
    } catch (e: any) { setInviteResult({ error: e.message }); } finally { setInviting(false); }
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

  // ===== BENEFICIARY =====
  if (isBeneficiary) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F6F8' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
            <Ionicons name="chevron-back" size={24} color="#1A1D21" />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: '#1A1D21' }}>Mes gardiens</Text>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          {/* My permanent code */}
          <GlassCard style={{ alignItems: 'center', padding: 28 }}>
            <Ionicons name="qr-code-outline" size={36} color="#1A1D21" />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#5A6068', textTransform: 'uppercase', letterSpacing: 1, marginTop: 12 }}>VOTRE CODE PERMANENT</Text>
            {loadingCode ? <ActivityIndicator color="#1A1D21" style={{ marginTop: 12 }} /> : (
              <Text style={{ fontSize: 38, fontWeight: '900', color: '#1A1D21', letterSpacing: 6, marginTop: 6 }}>{myCode}</Text>
            )}
            <Text style={{ fontSize: 12, color: '#5A6068', marginTop: 8, textAlign: 'center', lineHeight: 18 }}>Communiquez ce code a vos proches pour qu'ils deviennent vos gardiens. Ils devront le saisir dans leur application.</Text>
            <TouchableOpacity style={{ backgroundColor: '#F5F6F8', borderRadius: 9999, paddingVertical: 14, paddingHorizontal: 32, marginTop: 16, flexDirection: 'row', gap: 8, alignItems: 'center', ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(0,0,0,0.15)' } : {}) }} onPress={shareCode}>
              <Ionicons name="share-outline" size={18} color="#1A1D21" />
              <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>PARTAGER</Text>
            </TouchableOpacity>
          </GlassCard>

          {/* Invite by phone */}
          <GlassCard>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1D21', marginBottom: 4 }}>Inviter par telephone</Text>
            <Text style={{ fontSize: 12, color: '#5A6068', marginBottom: 14, lineHeight: 17 }}>Envoyez une invitation a un proche par son numero. Il recevra une notification.</Text>
            {Platform.OS === 'web' ? (
              <div style={{ marginBottom: 12 }}>
                <input data-testid="invite-phone-input" type="tel" placeholder="06 12 34 56 78" value={invitePhone}
                  onChange={(e: any) => setInvitePhone(e.target.value)}
                  style={{ width: '100%', fontSize: 16, padding: '14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)', fontFamily: 'system-ui', boxSizing: 'border-box' as any }} />
              </div>
            ) : (
              <View style={{ marginBottom: 12 }}>
                <View style={{ backgroundColor: '#F0F1F3', borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.06)', paddingHorizontal: 14 }}>
                  <Text>Phone input placeholder</Text>
                </View>
              </View>
            )}
            {inviteResult && <View style={{ backgroundColor: inviteResult.error ? '#FFEBEE' : '#E8F5E9', borderRadius: 12, padding: 12, marginBottom: 12 }}><Text style={{ fontSize: 13, fontWeight: '600', color: inviteResult.error ? '#C62828' : '#2E7D32' }}>{inviteResult.error || inviteResult.message}</Text></View>}
            <TouchableOpacity style={{ backgroundColor: '#F5F6F8', borderRadius: 9999, paddingVertical: 14, alignItems: 'center', ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(0,0,0,0.15)' } : {}) }} onPress={inviteByPhone} disabled={inviting}>
              {inviting ? <ActivityIndicator color="#1A1D21" /> : <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800', textTransform: 'uppercase' }}>ENVOYER L'INVITATION</Text>}
            </TouchableOpacity>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ===== GUARDIAN =====
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F6F8' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => { if (mode !== 'choose') setMode('choose'); else router.back(); }} style={{ padding: 4, marginRight: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#1A1D21" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: '#1A1D21' }}>Ajouter un beneficiaire</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {mode === 'choose' && (
          <>
            <Text style={{ fontSize: 14, color: '#5A6068', marginBottom: 20, lineHeight: 20 }}>Choisissez une methode. Le beneficiaire devra valider votre demande.</Text>
            {[
              { key: 'enter_code', icon: 'keypad-outline', title: 'Saisir un code', desc: 'Entrez le code du beneficiaire' },
              { key: 'enter_code', icon: 'qr-code-outline', title: 'Scanner un QR code', desc: 'Scannez le code QR' },
              { key: 'enter_phone', icon: 'call-outline', title: 'Numero de telephone', desc: 'Envoyez une demande par telephone' },
            ].map((opt, i) => (
              <TouchableOpacity key={i} onPress={() => setMode(opt.key as any)} activeOpacity={0.7}>
                <GlassCard style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name={opt.icon as any} size={24} color="#1A1D21" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1D21' }}>{opt.title}</Text>
                    <Text style={{ fontSize: 12, color: '#5A6068', marginTop: 2 }}>{opt.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#888" />
                </GlassCard>
              </TouchableOpacity>
            ))}
          </>
        )}
        {mode === 'enter_code' && (
          <GlassCard style={{ padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A1D21', marginBottom: 8 }}>Saisir le code</Text>
            <Text style={{ fontSize: 13, color: '#5A6068', marginBottom: 16 }}>Entrez le code a 6 caracteres du beneficiaire</Text>
            {Platform.OS === 'web' ? (
              <div style={{ marginBottom: 16 }}><input data-testid="link-code-input" type="text" placeholder="EX: A1B2C3" value={code} onChange={(e: any) => setCode(e.target.value.toUpperCase())} maxLength={6} style={{ width: '100%', fontSize: 24, fontWeight: '800', padding: '16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)', fontFamily: 'system-ui', textAlign: 'center', letterSpacing: 8, boxSizing: 'border-box' as any }} /></div>
            ) : null}
            {result && <View style={{ backgroundColor: result.error ? '#FFEBEE' : '#E8F5E9', borderRadius: 12, padding: 12, marginBottom: 12 }}><Text style={{ fontSize: 13, fontWeight: '600', color: result.error ? '#C62828' : '#2E7D32' }}>{result.error || result.message}</Text></View>}
            <TouchableOpacity style={{ backgroundColor: '#F5F6F8', borderRadius: 9999, paddingVertical: 16, alignItems: 'center' }} onPress={linkWithCode} disabled={loading}>
              {loading ? <ActivityIndicator color="#1A1D21" /> : <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800', textTransform: 'uppercase' }}>ENVOYER LA DEMANDE</Text>}
            </TouchableOpacity>
          </GlassCard>
        )}
        {mode === 'enter_phone' && (
          <GlassCard style={{ padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A1D21', marginBottom: 8 }}>Numero de telephone</Text>
            <Text style={{ fontSize: 13, color: '#5A6068', marginBottom: 16 }}>Le beneficiaire recevra une demande sur son compte</Text>
            {Platform.OS === 'web' ? (
              <div style={{ marginBottom: 16 }}><input data-testid="link-phone-input" type="tel" placeholder="06 12 34 56 78" value={phone} onChange={(e: any) => setPhone(e.target.value)} style={{ width: '100%', fontSize: 18, padding: '16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)', fontFamily: 'system-ui', boxSizing: 'border-box' as any }} /></div>
            ) : null}
            {result && <View style={{ backgroundColor: result.error ? '#FFEBEE' : '#E8F5E9', borderRadius: 12, padding: 12, marginBottom: 12 }}><Text style={{ fontSize: 13, fontWeight: '600', color: result.error ? '#C62828' : '#2E7D32' }}>{result.error || result.message}</Text></View>}
            <TouchableOpacity style={{ backgroundColor: '#F5F6F8', borderRadius: 9999, paddingVertical: 16, alignItems: 'center' }} onPress={linkWithPhone} disabled={loading}>
              {loading ? <ActivityIndicator color="#1A1D21" /> : <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800', textTransform: 'uppercase' }}>ENVOYER LA DEMANDE</Text>}
            </TouchableOpacity>
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
