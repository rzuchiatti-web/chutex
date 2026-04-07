import { Icon, MCIcon } from '../src/components/WebIcon';
import FullScreenLoader from '../src/components/FullScreenLoader';
import { useTheme } from '../src/context/ThemeContext';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useI18n } from '../src/context/I18nContext';
import { apiFetch } from '../src/services/api';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 18, marginBottom: 12, ...glass }, style]}>{children}</View>
);
const InfoRow = ({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) => (
  value ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
      <Icon name={icon as any} size={16} color={color || '#888'} />
      <Text style={{ fontSize: 12, color: '#6B7280', width: 110 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827', flex: 1 }}>{value}</Text>
    </View>
  ) : null
);
const Badge = ({ label, color, bg }: { label: string; color: string; bg: string }) => (
  <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
    <Text style={{ fontSize: 10, fontWeight: '800', color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
  </View>
);
const PersonCard = ({ name, subtitle, color, onPress }: { name: string; subtitle: string; color: string; onPress?: () => void }) => (
  <TouchableOpacity onPress={onPress} disabled={!onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 }}>
    <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: color, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }}>{name?.charAt(0)?.toUpperCase()}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{name}</Text>
      <Text style={{ fontSize: 11, color: '#6B7280' }}>{subtitle}</Text>
    </View>
    {onPress && <Icon name="chevron-forward" size={16} color="#888" />}
  </TouchableOpacity>
);

export default function AdminPrescriptionDétail() {
  const { colors, isDark } = useTheme();
  const { prescriptionId } = useLocalSearchParams<{ prescriptionId: string }>();
  const { token } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try { setData(await apiFetch(`/api/backoffice/prescription/${prescriptionId}`, {}, token)); }
    catch {} finally { setLoading(false); }
  }, [prescriptionId, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <FullScreenLoader />;
  if (!data?.prescription) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}><Text style={{ color: '#6B7280' }}>Prescription non trouvee</Text></View>;

  const p = data.prescription;
  const g = data.guardian;
  const b = data.beneficiary;
  const sub = data.subscription;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}><Icon name="chevron-back" size={24} color="#111827" /></TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '900', color: '#111827' }}>Fiche Prescription</Text>
        <Badge label={p.status === 'subscribed' ? 'Souscrit' : 'En attente'} color={p.status === 'subscribed' ? '#2E7D32' : '#FF9800'} bg={p.status === 'subscribed' ? '#E8F5E9' : '#FFF3E0'} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}>
        <GlassCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3E5F5', justifyContent: 'center', alignItems: 'center' }}>
              <Icon name="document-text" size={18} color="#7B1FA2" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>Détails Prescription</Text>
          </View>
          <InfoRow icon="person-outline" label="Bénéficiaire" value={p.beneficiary_name} />
          <InfoRow icon="mail-outline" label="Email" value={p.beneficiary_email} />
          <InfoRow icon="call-outline" label="Telephone" value={p.beneficiary_phone} />
          <InfoRow icon="pricetag-outline" label="Type abonnement" value={p.subscription_type === 'standard' ? 'Standard (15EUR/mois)' : 'Téléassistance (25EUR/mois)'} />
          <InfoRow icon="cash-outline" label="Commission" value={`${p.commission || 0} EUR`} color="#4CAF50" />
          <InfoRow icon="business-outline" label="Structure" value={p.prescriber_structure} color="#7B1FA2" />
          <InfoRow icon="calendar-outline" label="Date création" value={p.created_at ? new Date(p.created_at).toLocaleString('fr-FR') : ''} />
          {p.subscribed_at && <InfoRow icon="checkmark-circle-outline" label="Date souscription" value={new Date(p.subscribed_at).toLocaleString('fr-FR')} color="#4CAF50" />}
          {p.notes && <InfoRow icon="chatbox-outline" label="Notes" value={p.notes} />}
        </GlassCard>

        {p.email_content && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="mail" size={18} color="#1565C0" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>Email envoye</Text>
            </View>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#6B7280', marginBottom: 4 }}>Objet: {p.email_content.subject}</Text>
            <Text style={{ fontSize: 12, color: '#111827', lineHeight: 18 }}>{p.email_content.body}</Text>
          </GlassCard>
        )}

        {g && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF8E1', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="person" size={18} color="#F57F17" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>{t('prescriber')}</Text>
            </View>
            <PersonCard name={g.name} subtitle={`${g.email} - ${g.prescriber_structure || g.structure_name || ''}`} color="#FFD54F"
              onPress={() => router.push({ pathname: '/admin-client-detail', params: { clientId: g.id } })} />
          </GlassCard>
        )}

        {b && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E1F5FE', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="heart" size={18} color="#0288D1" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>Bénéficiaire inscrit</Text>
            </View>
            <PersonCard name={b.name} subtitle={`${b.email} - ${b.phone || ''}`} color="#4FC3F7"
              onPress={() => router.push({ pathname: '/admin-client-detail', params: { clientId: b.id } })} />
            {sub && (
              <View style={{ backgroundColor: 'rgba(76,175,80,0.06)', borderRadius: 12, padding: 12, marginTop: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981', textTransform: 'uppercase', marginBottom: 6 }}>Abonnement actif</Text>
                <InfoRow icon="pricetag-outline" label="Type" value={sub.subscription_type?.toUpperCase()} />
                <InfoRow icon="storefront-outline" label="Source" value={sub.source === 'shopify' ? 'Shopify' : 'Manuel'} />
              </View>
            )}
          </GlassCard>
        )}
      </ScrollView>
    </View>
  );
}
