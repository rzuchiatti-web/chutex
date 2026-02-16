import { Icon, MCIcon } from '../src/components/WebIcon';
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Share, Platform, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 20, marginBottom: 12, ...glass }, style]}>{children}</View>
);

// ─── RELATIONSHIP LISTS ───
const GUARDIAN_RELATIONSHIPS = [
  { id: 'conjoint', label: 'Conjoint(e)' },
  { id: 'fils_fille', label: 'Fils / Fille' },
  { id: 'pere_mere', label: 'Pere / Mere' },
  { id: 'frere_soeur', label: 'Frere / Soeur' },
  { id: 'petit_enfant', label: 'Petit-fils / Petite-fille' },
  { id: 'neveu_niece', label: 'Neveu / Niece' },
  { id: 'ami', label: 'Ami(e) proche' },
  { id: 'voisin', label: 'Voisin(e)' },
  { id: 'aide_soignant', label: 'Aide-soignant(e)' },
  { id: 'infirmier', label: 'Infirmier(ere)' },
  { id: 'auxiliaire_vie', label: 'Auxiliaire de vie' },
  { id: 'kine_osteo', label: 'Kine / Osteopathe' },
  { id: 'coach', label: 'Coach sportif' },
  { id: 'preparateur_physique', label: 'Preparateur physique' },
  { id: 'pro_sante', label: 'Autre professionnel de sante' },
  { id: 'autre', label: 'Autre' },
];

const BENEFICIARY_RELATIONSHIPS = [
  { id: 'conjoint', label: 'Conjoint(e)' },
  { id: 'mamie', label: 'Mamie' },
  { id: 'papy', label: 'Papy' },
  { id: 'pere_mere', label: 'Pere / Mere' },
  { id: 'fils_fille', label: 'Fils / Fille' },
  { id: 'frere_soeur', label: 'Frere / Soeur' },
  { id: 'oncle_tante', label: 'Oncle / Tante' },
  { id: 'ami', label: 'Ami(e)' },
  { id: 'voisin', label: 'Voisin(e)' },
  { id: 'patient', label: 'Patient(e)' },
  { id: 'autre', label: 'Autre' },
];

// ─── RELATIONSHIP PICKER COMPONENT ───
const RelationshipPicker = ({ value, onChange, relationships, label }: any) => {
  const [open, setOpen] = useState(false);
  const selected = relationships.find((r: any) => r.id === value);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</Text>
      <TouchableOpacity
        data-testid="relationship-picker"
        onPress={() => setOpen(true)}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: value ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.06)' }}>
        <Text style={{ fontSize: 15, color: value ? '#111827' : '#9CA3AF', fontWeight: value ? '600' : '400' }}>
          {selected ? selected.label : 'Choisir...'}
        </Text>
        <Icon name="chevron-down" size={18} color="#9CA3AF" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide">
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={{ flex: 1 }} />
          <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '60%', paddingBottom: 40 }}>
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', paddingHorizontal: 20, marginBottom: 12 }}>{label}</Text>
            <ScrollView style={{ paddingHorizontal: 20 }}>
              {relationships.map((r: any) => (
                <TouchableOpacity
                  key={r.id}
                  data-testid={`rel-option-${r.id}`}
                  onPress={() => { onChange(r.id); setOpen(false); }}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' }}>
                  <Text style={{ flex: 1, fontSize: 16, fontWeight: value === r.id ? '700' : '400', color: '#111827' }}>{r.label}</Text>
                  {value === r.id && <Icon name="checkmark-circle" size={22} color="#10B981" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default function LinkScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const isBeneficiary = user?.role === 'beneficiary' || user?.active_role === 'beneficiary';

  const [myCode, setMyCode] = useState('');
  const [loadingCode, setLoadingCode] = useState(true);
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRelationship, setInviteRelationship] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<any>(null);

  const [mode, setMode] = useState<'choose' | 'enter_code' | 'enter_phone'>('choose');
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

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
    if (!inviteRelationship) return Alert.alert('Erreur', 'Selectionnez qui est cette personne pour vous');
    setInviting(true); setInviteResult(null);
    try {
      const r = await apiFetch('/api/guardians/invite', { method: 'POST', body: JSON.stringify({ phone: invitePhone.trim(), relationship: inviteRelationship }) }, token);
      setInviteResult(r);
    } catch (e: any) { setInviteResult({ error: e.message }); } finally { setInviting(false); }
  };

  const linkWithCode = async () => {
    if (!code.trim()) return Alert.alert('Erreur', 'Entrez un code');
    if (!guardianRelationship) return Alert.alert('Erreur', 'Selectionnez qui vous etes pour ce beneficiaire');
    setLoading(true); setResult(null);
    try {
      const r = await apiFetch('/api/guardian/link-with-code', { method: 'POST', body: JSON.stringify({ link_code: code.trim().toUpperCase(), relationship: guardianRelationship }) }, token);
      setResult(r);
      if (r.status === 'pending') Alert.alert('Demande envoyee', r.message);
    } catch (e: any) { setResult({ error: e.message }); } finally { setLoading(false); }
  };

  const linkWithPhone = async () => {
    if (!phone.trim()) return Alert.alert('Erreur', 'Entrez un numero');
    if (!guardianRelationship) return Alert.alert('Erreur', 'Selectionnez qui vous etes pour ce beneficiaire');
    setLoading(true); setResult(null);
    try {
      const r = await apiFetch('/api/guardian/link-with-phone', { method: 'POST', body: JSON.stringify({ phone: phone.trim(), relationship: guardianRelationship }) }, token);
      setResult(r);
      if (r.status === 'pending') Alert.alert('Demande envoyee', r.message);
    } catch (e: any) { setResult({ error: e.message }); } finally { setLoading(false); }
  };

  const ResultBanner = ({ r }: any) => r ? (
    <View style={{ backgroundColor: r.error ? '#FEF2F2' : '#ECFDF5', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: r.error ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)' }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: r.error ? '#DC2626' : '#059669' }}>{r.error || r.message}</Text>
    </View>
  ) : null;

  const InputField = ({ testID, placeholder, value, onChangeText, type, maxLength, style: s }: any) => {
    if (Platform.OS === 'web') {
      return (
        <div style={{ marginBottom: 14 }}>
          <input data-testid={testID} type={type || 'text'} placeholder={placeholder} value={value}
            onChange={(e: any) => onChangeText(e.target.value)} maxLength={maxLength}
            style={{ width: '100%', fontSize: s?.fontSize || 16, fontWeight: s?.fontWeight || '500', padding: '14px 16px', borderRadius: 14, border: '1px solid rgba(0,0,0,0.08)', background: '#FFFFFF', fontFamily: 'Inter, system-ui', boxSizing: 'border-box' as any, textAlign: s?.textAlign || 'left', letterSpacing: s?.letterSpacing || 0, outline: 'none' } as any}
          />
        </div>
      );
    }
    return null;
  };

  // ===== BENEFICIARY VIEW =====
  if (isBeneficiary) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
            <Icon name="chevron-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: '#111827' }}>Mes gardiens</Text>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          {/* Code permanent */}
          <GlassCard style={{ alignItems: 'center', padding: 28 }}>
            <Icon name="qr-code-outline" size={36} color="#111827" />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginTop: 12 }}>Votre code permanent</Text>
            {loadingCode ? <ActivityIndicator color="#111827" style={{ marginTop: 12 }} /> : (
              <Text style={{ fontSize: 38, fontWeight: '900', color: '#111827', letterSpacing: 6, marginTop: 6 }}>{myCode}</Text>
            )}
            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 8, textAlign: 'center', lineHeight: 18 }}>Communiquez ce code a vos proches pour qu'ils deviennent vos gardiens.</Text>
            <TouchableOpacity style={{ backgroundColor: '#111827', borderRadius: 9999, paddingVertical: 14, paddingHorizontal: 32, marginTop: 16, flexDirection: 'row', gap: 8, alignItems: 'center' }} onPress={shareCode}>
              <Icon name="share-outline" size={18} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>Partager</Text>
            </TouchableOpacity>
          </GlassCard>

          {/* Inviter par telephone */}
          <GlassCard>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 4 }}>Inviter par telephone</Text>
            <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 14, lineHeight: 17 }}>Envoyez une invitation et precisez qui est cette personne pour vous.</Text>

            <RelationshipPicker
              value={inviteRelationship}
              onChange={setInviteRelationship}
              relationships={BENEFICIARY_RELATIONSHIPS}
              label="Qui est cette personne pour vous ?"
            />

            <InputField testID="invite-phone-input" type="tel" placeholder="06 12 34 56 78" value={invitePhone} onChangeText={setInvitePhone} />

            <ResultBanner r={inviteResult} />

            <TouchableOpacity
              data-testid="send-invite-btn"
              style={{ backgroundColor: '#111827', borderRadius: 9999, paddingVertical: 14, alignItems: 'center' }}
              onPress={inviteByPhone} disabled={inviting}>
              {inviting ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>Envoyer l'invitation</Text>}
            </TouchableOpacity>
          </GlassCard>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ===== GUARDIAN VIEW =====
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => { if (mode !== 'choose') setMode('choose'); else router.back(); }} style={{ padding: 4, marginRight: 12 }}>
          <Icon name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: '#111827' }}>Ajouter un beneficiaire</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {mode === 'choose' && (
          <>
            <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 20, lineHeight: 20 }}>Choisissez une methode. Le beneficiaire devra valider votre demande.</Text>
            {[
              { key: 'enter_code', icon: 'keypad-outline', title: 'Saisir un code', desc: 'Entrez le code du beneficiaire' },
              { key: 'enter_phone', icon: 'call-outline', title: 'Numero de telephone', desc: 'Envoyez une demande par telephone' },
            ].map((opt, i) => (
              <TouchableOpacity key={i} onPress={() => setMode(opt.key as any)} activeOpacity={0.7}>
                <GlassCard style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: '#F0F1F3', justifyContent: 'center', alignItems: 'center' }}>
                    <Icon name={opt.icon as any} size={24} color="#111827" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>{opt.title}</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{opt.desc}</Text>
                  </View>
                  <Icon name="chevron-forward" size={20} color="#9CA3AF" />
                </GlassCard>
              </TouchableOpacity>
            ))}
          </>
        )}

        {mode === 'enter_code' && (
          <GlassCard style={{ padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 8 }}>Saisir le code</Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Entrez le code a 6 caracteres du beneficiaire</Text>

            <InputField testID="link-code-input" placeholder="EX: A1B2C3" value={code} onChangeText={(v: string) => setCode(v.toUpperCase())} maxLength={6}
              style={{ fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: 8 }} />

            <RelationshipPicker
              value={guardianRelationship}
              onChange={setGuardianRelationship}
              relationships={GUARDIAN_RELATIONSHIPS}
              label="Qui etes-vous pour ce beneficiaire ?"
            />

            <ResultBanner r={result} />

            <TouchableOpacity
              data-testid="send-code-link"
              style={{ backgroundColor: '#111827', borderRadius: 9999, paddingVertical: 16, alignItems: 'center' }}
              onPress={linkWithCode} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>Envoyer la demande</Text>}
            </TouchableOpacity>
          </GlassCard>
        )}

        {mode === 'enter_phone' && (
          <GlassCard style={{ padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 8 }}>Numero de telephone</Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Entrez le numero du beneficiaire</Text>

            <InputField testID="link-phone-input" type="tel" placeholder="06 12 34 56 78" value={phone} onChangeText={setPhone} />

            <RelationshipPicker
              value={guardianRelationship}
              onChange={setGuardianRelationship}
              relationships={GUARDIAN_RELATIONSHIPS}
              label="Qui etes-vous pour ce beneficiaire ?"
            />

            <ResultBanner r={result} />

            <TouchableOpacity
              data-testid="send-phone-link"
              style={{ backgroundColor: '#111827', borderRadius: 9999, paddingVertical: 16, alignItems: 'center' }}
              onPress={linkWithPhone} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>Envoyer la demande</Text>}
            </TouchableOpacity>
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
