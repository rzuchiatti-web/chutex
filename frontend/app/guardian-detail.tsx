import { Icon, MCIcon } from '../src/components/WebIcon';
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { apiFetch } from '../src/services/api';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 20, marginBottom: 12, ...glass }, style]}>{children}</View>
);

export default function GuardianDetailScreen() {
  const { colors } = useTheme();
  const { guardianId } = useLocalSearchParams<{ guardianId: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [guardian, setGuardian] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const guards = await apiFetch('/api/guardians/my', {}, token);
        const g = guards.find((g: any) => g.id === guardianId);
        setGuardian(g || null);
      } catch {} finally { setLoading(false); }
    })();
  }, [guardianId, token]);

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF8F5', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#1C1917" /></SafeAreaView>;
  if (!guardian) return <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF8F5', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#78716C' }}>Gardien non trouve</Text></SafeAreaView>;

  const infoRows = [
    { icon: 'call-outline', label: 'Telephone', val: guardian.phone },
    { icon: 'mail-outline', label: 'Email', val: guardian.email },
    { icon: 'location-outline', label: 'Adresse', val: guardian.address },
    { icon: 'people-outline', label: 'Lien', val: guardian.relationship },
    { icon: 'briefcase-outline', label: 'Profession', val: guardian.profession },
    { icon: 'business-outline', label: 'Structure / Societe', val: guardian.structure_name },
    { icon: 'shield-checkmark-outline', label: 'Type', val: guardian.guardian_type === 'professional' ? 'Professionnel' : guardian.guardian_type === 'particular' ? 'Particulier' : guardian.guardian_type },
  ].filter(r => r.val);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF8F5' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
          <Icon name="chevron-back" size={24} color="#1C1917" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: '#1C1917' }}>Fiche Gardien</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {/* Avatar + Name */}
        <GlassCard style={{ alignItems: 'center', padding: 28 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFB74D', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 32, fontWeight: '800', color: '#FFF' }}>{guardian.name?.charAt(0)}</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#1C1917', marginTop: 12 }}>{guardian.name}</Text>
          {guardian.profession && <Text style={{ fontSize: 13, color: '#78716C', marginTop: 4 }}>{guardian.profession}</Text>}
          {guardian.structure_name && <Text style={{ fontSize: 13, color: '#78716C', marginTop: 2 }}>{guardian.structure_name}</Text>}
        </GlassCard>

        {/* Info rows */}
        <GlassCard>
          {infoRows.map((r, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: i < infoRows.length - 1 ? 0.5 : 0, borderBottomColor: 'rgba(0,0,0,0.06)' }}>
              <Icon name={r.icon as any} size={20} color="#888" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: '#78716C', textTransform: 'uppercase', letterSpacing: 0.5 }}>{r.label}</Text>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#1C1917', marginTop: 2 }}>{r.val}</Text>
              </View>
            </View>
          ))}
        </GlassCard>

        {/* Coordinates */}
        {guardian.latitude && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="navigate-outline" size={20} color="#888" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: '#78716C', textTransform: 'uppercase', letterSpacing: 0.5 }}>Coordonnees GPS</Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#1C1917', marginTop: 2 }}>{guardian.latitude?.toFixed(4)}, {guardian.longitude?.toFixed(4)}</Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* Delete guardian button */}
        <TouchableOpacity style={{ backgroundColor: '#E53935', borderRadius: 9999, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(229,57,53,0.2)' } : {}) }}
          onPress={() => Alert.alert('Supprimer ce gardien ?', `${guardian.name} ne sera plus votre gardien.`, [
            { text: 'Annuler' },
            { text: 'Supprimer', style: 'destructive', onPress: async () => {
              try {
                await apiFetch(`/api/guardians/${guardian.id}/unlink`, { method: 'POST' }, token);
                Alert.alert('Gardien supprime');
                router.back();
              } catch (e: any) { Alert.alert('Erreur', e.message); }
            }},
          ])}>
          <Icon name="trash-outline" size={18} color="#1C1917" />
          <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>SUPPRIMER CE GARDIEN</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
