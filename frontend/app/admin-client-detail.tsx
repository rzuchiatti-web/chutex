import { Icon, MCIcon } from '../src/components/WebIcon';
import { useTheme } from '../src/context/ThemeContext';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 18, marginBottom: 12, ...glass }, style]}>{children}</View>
);
const InfoRow = ({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) => (
  value ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
      <Icon name={icon as any} size={16} color={color || '#888'} />
      <Text style={{ fontSize: 12, color: '#5A6068', width: 100 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#1A1D21', flex: 1 }}>{value}</Text>
    </View>
  ) : null
);
const Badge = ({ label, color, bg }: { label: string; color: string; bg: string }) => (
  <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
    <Text style={{ fontSize: 10, fontWeight: '800', color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
  </View>
);

export default function AdminClientDetail() {
  const { colors, isDark } = useTheme();
  const { clientId, viewAs } = useLocalSearchParams<{ clientId: string; viewAs?: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try { setData(await apiFetch(`/api/backoffice/user/${clientId}`, {}, token)); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, [clientId, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6F8' }}><ActivityIndicator size="large" color="#1A1D21" /></View>;
  if (!data?.user) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6F8' }}><Text style={{ color: '#5A6068' }}>Client non trouve</Text></View>;

  const u = data.user;
  // viewAs determines which "face" of the user to show
  const showAsBen = viewAs === 'beneficiary' || (!viewAs && u.role === 'beneficiary');
  const showAsGuard = viewAs === 'guardian' || (!viewAs && u.role === 'guardian');
  const roleColor = showAsBen ? '#4FC3F7' : '#FFD54F';
  const roleLabel = showAsBen ? 'Beneficiaire' : 'Gardien';

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F6F8' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
          <Icon name="chevron-back" size={24} color="#1A1D21" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '900', color: '#1A1D21' }}>Fiche {roleLabel}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#1A1D21" />}>

        {/* Identity Card */}
        <GlassCard style={{ padding: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: roleColor, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)' }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#FFF' }}>{u.name?.charAt(0)?.toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#1A1D21' }}>{u.name}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                <Badge label={roleLabel} color={showAsBen ? '#0288D1' : '#F57F17'} bg={showAsBen ? '#E1F5FE' : '#FFF8E1'} />
                {showAsGuard && u.is_prescriber && <Badge label="Prescripteur" color="#7B1FA2" bg="#F3E5F5" />}
                {showAsGuard && u.is_intervention_provider && <Badge label="Intervenant Care" color="#2E7D32" bg="#E8F5E9" />}
                {showAsBen && u.has_subscription && <Badge label={`Abon. ${u.subscription_type?.toUpperCase()}`} color={u.subscription_type === 'care' ? '#7B1FA2' : '#1565C0'} bg={u.subscription_type === 'care' ? '#F3E5F5' : '#E3F2FD'} />}
                {(showAsBen && u.has_guardian_space) && <Badge label="Aussi gardien" color="#888" bg="#F5F5F5" />}
                {(showAsGuard && u.has_beneficiary_space) && <Badge label="Aussi beneficiaire" color="#888" bg="#F5F5F5" />}
              </View>
            </View>
          </View>
          <InfoRow icon="mail-outline" label="Email" value={u.email} />
          <InfoRow icon="call-outline" label="Telephone" value={u.phone} />
          <InfoRow icon="location-outline" label="Adresse" value={u.address} />
          <InfoRow icon="calendar-outline" label="Inscription" value={u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : ''} />
        </GlassCard>

        {/* Beneficiary: Medical Info */}
        {showAsBen && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="medkit" size={18} color="#E53935" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1D21' }}>Informations Medicales</Text>
            </View>
            <InfoRow icon="calendar-outline" label="Naissance" value={u.date_of_birth} />
            <InfoRow icon="person-outline" label="Genre" value={u.gender} />
            <InfoRow icon="resize-outline" label="Taille" value={u.height_cm ? `${u.height_cm} cm` : ''} />
            <InfoRow icon="barbell-outline" label="Poids" value={u.weight_kg ? `${u.weight_kg} kg` : ''} />
            <InfoRow icon="water-outline" label="Groupe sanguin" value={u.blood_type} color="#E53935" />
            <InfoRow icon="warning-outline" label="Allergies" value={u.allergies} color="#FF9800" />
            <InfoRow icon="fitness-outline" label="Pathologies" value={u.medical_conditions} color="#E53935" />
            <InfoRow icon="person-circle-outline" label="Medecin" value={u.doctor_name} />
            <InfoRow icon="call-outline" label="Contact urgence" value={u.emergency_contact_name ? `${u.emergency_contact_name} (${u.emergency_contact_phone || ''})` : ''} color="#E53935" />
          </GlassCard>
        )}

        {/* Beneficiary: Subscription */}
        {showAsBen && data.subscription && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8EAF6', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="card-outline" size={18} color="#3F51B5" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1D21' }}>Abonnement</Text>
            </View>
            <InfoRow icon="pricetag-outline" label="Type" value={data.subscription.subscription_type?.toUpperCase()} />
            <InfoRow icon="checkmark-circle-outline" label="Statut" value={data.subscription.status === 'active' ? 'Actif' : data.subscription.status} color="#4CAF50" />
            <InfoRow icon="calendar-outline" label="Depuis" value={data.subscription.created_at ? new Date(data.subscription.created_at).toLocaleDateString('fr-FR') : ''} />
            <InfoRow icon="storefront-outline" label="Source" value={data.subscription.source === 'shopify' ? 'Shopify' : 'Manuel'} />
          </GlassCard>
        )}

        {/* Guardian: Professional Info */}
        {showAsGuard && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="briefcase-outline" size={18} color="#FF9800" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1D21' }}>Informations Professionnelles</Text>
            </View>
            <InfoRow icon="shield-outline" label="Type gardien" value={u.guardian_type === 'professional' ? 'Professionnel' : 'Particulier'} />
            <InfoRow icon="heart-outline" label="Relation" value={u.relationship} />
            <InfoRow icon="business-outline" label="Structure" value={u.structure_name} />
            <InfoRow icon="briefcase-outline" label="Profession" value={u.profession} />
            {u.is_prescriber && <>
              <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: 10 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon name="medical" size={16} color="#7B1FA2" />
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#7B1FA2' }}>PRESCRIPTEUR</Text>
              </View>
              <InfoRow icon="business-outline" label="Structure" value={u.prescriber_structure} color="#7B1FA2" />
            </>}
            {u.is_intervention_provider && <>
              <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: 10 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon name="shield-checkmark" size={16} color="#2E7D32" />
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#2E7D32' }}>INTERVENANT CARE</Text>
              </View>
              <InfoRow icon="navigate-outline" label="Rayon" value={`${u.intervention_radius_km || 30} km`} color="#2E7D32" />
              <InfoRow icon="location-outline" label="Position" value={u.latitude ? `${u.latitude?.toFixed(4)}, ${u.longitude?.toFixed(4)}` : ''} color="#2E7D32" />
            </>}
          </GlassCard>
        )}

        {/* Linked Guardians (for beneficiary) */}
        {showAsBen && data.guardians?.length > 0 && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF8E1', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="people" size={18} color="#F57F17" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1D21' }}>Gardiens ({data.guardians.length})</Text>
            </View>
            {data.guardians.map((g: any) => (
              <TouchableOpacity key={g.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}
                onPress={() => router.push({ pathname: '/admin-client-detail', params: { clientId: g.id } })}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFD54F', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFF' }}>{g.name?.charAt(0)?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A1D21' }}>{g.name}</Text>
                  <Text style={{ fontSize: 11, color: '#5A6068' }}>{g.relationship || g.guardian_type || 'Gardien'}{g.profession ? ` - ${g.profession}` : ''}{g.structure_name ? ` (${g.structure_name})` : ''}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {g.is_prescriber && <Badge label="Presc." color="#7B1FA2" bg="#F3E5F5" />}
                  {g.is_intervention_provider && <Badge label="Care" color="#2E7D32" bg="#E8F5E9" />}
                </View>
                <Icon name="chevron-forward" size={16} color="#888" />
              </TouchableOpacity>
            ))}
          </GlassCard>
        )}

        {/* Linked Beneficiaries (for guardian) */}
        {showAsGuard && data.beneficiaries?.length > 0 && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E1F5FE', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="heart" size={18} color="#0288D1" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1D21' }}>Beneficiaires ({data.beneficiaries.length})</Text>
            </View>
            {data.beneficiaries.map((b: any) => (
              <TouchableOpacity key={b.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}
                onPress={() => router.push({ pathname: '/admin-client-detail', params: { clientId: b.id } })}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#4FC3F7', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFF' }}>{b.name?.charAt(0)?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A1D21' }}>{b.name}</Text>
                  <Text style={{ fontSize: 11, color: '#5A6068' }}>{b.email} {b.date_of_birth ? `- Ne(e) le ${b.date_of_birth}` : ''}</Text>
                </View>
                {b.has_subscription && <Badge label={b.subscription_type?.toUpperCase() || 'ABON.'} color="#7B1FA2" bg="#F3E5F5" />}
                <Icon name="chevron-forward" size={16} color="#888" />
              </TouchableOpacity>
            ))}
          </GlassCard>
        )}

        {/* Devices (beneficiary) */}
        {showAsBen && data.devices?.length > 0 && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' }}>
                <MCIcon name="bluetooth-connect" size={18} color="#4CAF50" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1D21' }}>Appareils ({data.devices.length})</Text>
            </View>
            {data.devices.map((d: any) => {
              const names: any = { bracelet: 'Bracelet Elio', vest: 'Gilet Anti-Chute', scale: 'Balance Connectee' };
              const icons: any = { bracelet: 'watch', vest: 'tshirt-crew', scale: 'scale-bathroom' };
              return (
                <View key={d.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
                  <MCIcon name={icons[d.device_type] || 'devices'} size={20} color="#1A1D21" />
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#1A1D21', flex: 1 }}>{names[d.device_type] || d.device_type}</Text>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: d.connected ? '#4CAF50' : '#E0E0E0' }} />
                  <Text style={{ fontSize: 12, color: '#5A6068' }}>{d.battery || 0}%</Text>
                </View>
              );
            })}
          </GlassCard>
        )}

        {/* Prescriptions (for prescriber guardian) */}
        {data.prescriptions?.length > 0 && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3E5F5', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="document-text" size={18} color="#7B1FA2" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1D21' }}>Prescriptions ({data.prescriptions.length})</Text>
            </View>
            {data.prescriptions.map((p: any) => (
              <View key={p.id} style={{ paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A1D21' }}>{p.beneficiary_name}</Text>
                  <Badge label={p.status === 'subscribed' ? 'Actif' : 'En attente'} color={p.status === 'subscribed' ? '#2E7D32' : '#FF9800'} bg={p.status === 'subscribed' ? '#E8F5E9' : '#FFF3E0'} />
                </View>
                <Text style={{ fontSize: 11, color: '#5A6068', marginTop: 2 }}>{p.subscription_type} - Commission: {p.commission}EUR</Text>
              </View>
            ))}
          </GlassCard>
        )}

        {/* Alerts History */}
        {data.alerts?.length > 0 && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFEBEE', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="warning" size={18} color="#E53935" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1D21' }}>Historique Alertes ({data.alerts.length})</Text>
            </View>
            {data.alerts.slice(0, 10).map((a: any) => {
              const tc: any = { sos: '#E53935', fall: '#FF9800', anomaly: '#9C27B0', inactivity: '#607D8B', heart_rate: '#E91E63', spo2: '#2196F3' };
              return (
                <View key={a.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tc[a.alert_type] || '#888' }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#1A1D21' }}>{a.message?.slice(0, 60)}</Text>
                    <Text style={{ fontSize: 10, color: '#5A6068' }}>{a.alert_type?.toUpperCase()} - {new Date(a.created_at).toLocaleString('fr-FR')}</Text>
                  </View>
                  <Badge label={a.status === 'active' ? 'Active' : 'Resolue'} color={a.status === 'active' ? '#E53935' : '#4CAF50'} bg={a.status === 'active' ? '#FFEBEE' : '#E8F5E9'} />
                </View>
              );
            })}
          </GlassCard>
        )}

        {/* Interventions History */}
        {data.interventions?.length > 0 && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="medkit" size={18} color="#4CAF50" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1D21' }}>Interventions ({data.interventions.length})</Text>
            </View>
            {data.interventions.map((iv: any) => {
              const sc: any = { pending_acceptance: '#FF9800', in_progress: '#2196F3', completed: '#4CAF50', dispatched: '#FF5722' };
              return (
                <View key={iv.id} style={{ paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#1A1D21' }}>{iv.beneficiary_name || iv.alert_message || 'Intervention'}</Text>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: sc[iv.status] || '#888' }} />
                  </View>
                  <Text style={{ fontSize: 10, color: '#5A6068', marginTop: 2 }}>{iv.status} - {new Date(iv.created_at).toLocaleString('fr-FR')}</Text>
                </View>
              );
            })}
          </GlassCard>
        )}

        {/* Location Info */}
        {(u.latitude || u.longitude) && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="navigate" size={18} color="#1565C0" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1D21' }}>Localisation</Text>
            </View>
            <InfoRow icon="location-outline" label="Coordonnees" value={`${u.latitude?.toFixed(4)}, ${u.longitude?.toFixed(4)}`} color="#1565C0" />
            <InfoRow icon="share-outline" label="Partage" value={u.location_sharing === 'always' ? 'Toujours' : u.location_sharing === 'alert_only' ? 'Alertes uniquement' : 'Desactive'} />
          </GlassCard>
        )}

        {/* No data placeholders */}
        {data.alerts?.length === 0 && showAsBen && (
          <GlassCard style={{ alignItems: 'center', padding: 24 }}>
            <Icon name="checkmark-circle-outline" size={32} color="#4CAF50" />
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#10B981', marginTop: 8 }}>Aucune alerte</Text>
            <Text style={{ fontSize: 11, color: '#5A6068', marginTop: 2 }}>Ce beneficiaire n'a pas d'historique d'alertes</Text>
          </GlassCard>
        )}
      </ScrollView>
    </View>
  );
}
