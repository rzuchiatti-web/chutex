import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 8px 32px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(255,255,255,0.6)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 20, marginBottom: 12, ...glass }, style]}>{children}</View>
);
const WebInput = ({ label, val, onChange, placeholder, type }: any) => Platform.OS === 'web' ? (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.50)', marginBottom: 6, textTransform: 'uppercase' as any, letterSpacing: 1 }}>{label}</div>
    <input type={type || 'text'} value={val} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', fontSize: 15, padding: '14px', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.5)', fontFamily: 'system-ui', boxSizing: 'border-box' as any }} />
  </div>
) : null;

export default function ActivateGuardianScreen() {
  const { token, user, refreshUser } = useAuth();
  const router = useRouter();
  const [guardianType, setGuardianType] = useState(user?.guardian_type || 'particular');
  const [relationship, setRelationship] = useState(user?.relationship || '');
  const [structureName, setStructureName] = useState(user?.structure_name || '');
  const [profession, setProfession] = useState(user?.profession || '');
  const [siret, setSiret] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await apiFetch('/api/auth/activate-guardian', { method: 'POST', body: JSON.stringify({
        guardian_type: guardianType, relationship, structure_name: structureName, profession, siret,
      }) }, token);
      await refreshUser();
      Alert.alert('Espace gardien active', 'Votre espace gardien est maintenant accessible.');
      router.back();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} testID="activate-guardian-screen">
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}><Ionicons name="chevron-back" size={24} color="#FFF" /></TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: 'rgba(255,255,255,0.92)' }}>Espace gardien</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {/* Pre-filled notice */}
        {user?.name && (
          <GlassCard style={{ backgroundColor: 'rgba(76,175,80,0.08)', borderLeftWidth: 4, borderLeftColor: '#4CAF50', padding: 14, marginBottom: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#2E7D32' }}>Vos informations connues ({user.name}, {user.email}) seront conservees.</Text>
          </GlassCard>
        )}

        <GlassCard>
          <Text style={{ fontSize: 18, fontWeight: '800', color: 'rgba(255,255,255,0.92)', marginBottom: 16 }}>Type de gardien</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            {[{ id: 'particular', l: 'Particulier' }, { id: 'professional', l: 'Professionnel' }].map(t => (
              <TouchableOpacity key={t.id} testID={`guardian-type-${t.id}`} style={{ flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 2, borderColor: guardianType === t.id ? '#000' : '#DDD', backgroundColor: guardianType === t.id ? 'rgba(0,0,0,0.05)' : 'transparent', alignItems: 'center' }} onPress={() => setGuardianType(t.id)}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: guardianType === t.id ? '#000' : '#888' }}>{t.l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {guardianType === 'particular' && <WebInput label="Lien avec le beneficiaire" val={relationship} onChange={setRelationship} placeholder="Fils, fille, voisin..." />}
          {guardianType === 'professional' && (
            <>
              <WebInput label="Structure / Societe" val={structureName} onChange={setStructureName} placeholder="SAAD Exemple" />
              <WebInput label="SIRET" val={siret} onChange={setSiret} placeholder="123 456 789 00001" type="number" />
              <WebInput label="Profession" val={profession} onChange={setProfession} placeholder="Aide-soignant, infirmier..." />
            </>
          )}
        </GlassCard>
        <TouchableOpacity testID="activate-guardian-btn" style={{ backgroundColor: '#000', paddingVertical: 16, borderRadius: 9999, alignItems: 'center', ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(0,0,0,0.15)' } : {}) }} onPress={submit} disabled={saving}>
          {saving ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800', textTransform: 'uppercase' }}>ACTIVER</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
