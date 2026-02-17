import { Icon, MCIcon } from '../../src/components/WebIcon';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform, TextInput, Alert, Modal } from 'react-native';

const confirmAction = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [{ text: 'Annuler', style: 'cancel' }, { text: 'Confirmer', style: 'destructive', onPress: onConfirm }]);
  }
};
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { apiFetch } from '../../src/services/api';
import { PageExplainer } from '../../src/components/HelpSystem';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 18, marginBottom: 12, ...glass }, style]}>{children}</View>
);

/* ===== ADMIN: CLIENTS ===== */
function AdminClients({ token }: { token: string }) {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'beneficiary'|'guardian'>('beneficiary');

  const fetchUsers = useCallback(async () => {
    try { setUsers(await apiFetch('/api/backoffice/users', {}, token)); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const bens = users.filter(u => u.role === 'beneficiary' || u.has_beneficiary_space);
  const guards = users.filter(u => u.role === 'guardian' || u.has_guardian_space);
  const displayed = tab === 'beneficiary' ? bens : guards;

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#111827" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', letterSpacing: -0.5 }}>Clients</Text>
        <Text style={{ fontSize: 12, color: '#6B7280' }}>{users.length} utilisateurs au total</Text>
      </View>
      <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', ...glass }}>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, tab === 'beneficiary' && { backgroundColor: '#FFFFFF' }]} onPress={() => setTab('beneficiary')}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'beneficiary' ? '#FFF' : '#888' }}>Beneficiaires ({bens.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, tab === 'guardian' && { backgroundColor: '#FFFFFF' }]} onPress={() => setTab('guardian')}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'guardian' ? '#FFF' : '#888' }}>Gardiens ({guards.length})</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} tintColor="#111827" />}>
        {displayed.map(u => (
          <TouchableOpacity key={u.id} onPress={() => router.push({ pathname: '/admin-client-detail', params: { clientId: u.id, viewAs: tab } })} activeOpacity={0.7}>
            <GlassCard style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
              <View style={{ width: 44, height: 44, borderRadius: 24, backgroundColor: tab === 'beneficiary' ? '#4FC3F7' : '#FFD54F', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }}>{u.name?.charAt(0)?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>{u.name}</Text>
                <Text style={{ fontSize: 12, color: '#6B7280' }}>{u.email}</Text>
                {u.phone && <Text style={{ fontSize: 11, color: '#9CA3AF' }}>{u.phone}</Text>}
                {u.is_prescriber && <Text style={{ fontSize: 10, fontWeight: '700', color: '#9C27B0', marginTop: 2 }}>Prescripteur - {u.prescriber_structure}</Text>}
                {u.is_intervention_provider && <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981', marginTop: 2 }}>Intervenant Care</Text>}
                {u.subscription_type && u.subscription_type !== 'none' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: u.subscription_type === 'care' ? '#9C27B0' : '#2196F3' }} />
                    <Text style={{ fontSize: 10, fontWeight: '600', color: u.subscription_type === 'care' ? '#9C27B0' : '#2196F3' }}>Abonnement {u.subscription_type.toUpperCase()}</Text>
                  </View>
                )}
              </View>
              <Icon name="chevron-forward" size={18} color="#888" />
            </GlassCard>
          </TouchableOpacity>
        ))}
        {displayed.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Icon name="people-outline" size={36} color="#CCC" />
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>Aucun {tab === 'beneficiary' ? 'beneficiaire' : 'gardien'}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* ===== COMPANY: AGENCES ===== */
function CompanyAgences({ token }: { token: string }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddr, setNewAddr] = useState('');
  const [creating, setCreating] = useState(false);
  const [assignModal, setAssignModal] = useState<any>(null);
  const [editAgency, setEditAgency] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editAddr, setEditAddr] = useState('');

  const fetchData = useCallback(async () => {
    try { setData(await apiFetch('/api/company/dashboard', {}, token)); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const createAgency = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await apiFetch('/api/company/agencies', { method: 'POST', body: JSON.stringify({ name: newName.trim(), address: newAddr.trim() }) }, token);
      setShowCreate(false); setNewName(''); setNewAddr(''); fetchData();
    } catch {} finally { setCreating(false); }
  };
  const assignToAgency = async (prescriberId: string, agencyId: string | null) => {
    await apiFetch(`/api/company/prescriber/${prescriberId}/assign`, { method: 'PUT', body: JSON.stringify({ agency_id: agencyId }) }, token);
    setAssignModal(null); fetchData();
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#111827" /></View>;
  if (!data) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', letterSpacing: -0.5 }}>Agences</Text>
        <Text style={{ fontSize: 12, color: '#6B7280' }}>{(data.agencies || []).length} agences · {data.total_prescribers} prescripteurs</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#111827" />}>

        <TouchableOpacity style={{ backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 16, flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          onPress={() => setShowCreate(true)}>
          <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>Nouvelle agence</Text>
          <Icon name="add-circle-outline" size={18} color="#111827" />
        </TouchableOpacity>

        {(data.agencies || []).map((ag: any) => (
          <GlassCard key={ag.agency.id} style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF980015', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="business" size={20} color="#FF9800" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>{ag.agency.name}</Text>
                {ag.agency.address ? <Text style={{ fontSize: 11, color: '#6B7280' }}>{ag.agency.address}</Text> : null}
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity onPress={() => { setEditAgency(ag.agency); setEditName(ag.agency.name); setEditAddr(ag.agency.address || ''); }}
                  style={{ padding: 6 }}><Icon name="create-outline" size={16} color="#888" /></TouchableOpacity>
                <TouchableOpacity onPress={() => confirmAction('Supprimer', `Supprimer l'agence ${ag.agency.name} ? Les prescripteurs seront desassignes.`, async () => {
                  await apiFetch(`/api/company/agencies/${ag.agency.id}`, { method: 'DELETE' }, token); fetchData();
                })} style={{ padding: 6 }}><Icon name="trash-outline" size={16} color="#E53935" /></TouchableOpacity>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827' }}>{ag.prescriber_count}</Text>
                <Text style={{ fontSize: 9, color: '#6B7280' }}>prescripteurs</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: 'rgba(76,175,80,0.06)', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#10B981' }}>{ag.comm_validated}</Text>
                <Text style={{ fontSize: 9, color: '#10B981' }}>EUR validees</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: 'rgba(255,152,0,0.06)', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#FF9800' }}>{ag.comm_pending}</Text>
                <Text style={{ fontSize: 9, color: '#FF9800' }}>EUR en att.</Text>
              </View>
            </View>
            {/* Prescribers in agency */}
            {(data.prescriber_ranking || []).filter((p: any) => p.agency_id === ag.agency.id).map((pr: any) => (
              <TouchableOpacity key={pr.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.04)' }}
                onPress={() => router.push({ pathname: '/company-prescriber-detail', params: { prescriberId: pr.id } })}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#4CAF5015', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon name="person" size={14} color="#4CAF50" />
                </View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#111827', flex: 1 }}>{pr.name}</Text>
                <Text style={{ fontSize: 11, color: '#6B7280' }}>{pr.prescription_count} presc.</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981' }}>{pr.comm_validated + pr.comm_pending} EUR</Text>
                <Icon name="chevron-forward" size={12} color="#CCC" />
              </TouchableOpacity>
            ))}
            {/* Add prescriber button - always visible */}
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginTop: 8, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.06)', backgroundColor: data.unassigned_prescribers > 0 ? 'rgba(33,150,243,0.04)' : 'transparent', borderRadius: 10 }}
              onPress={() => setAssignModal({ ...({} as any), targetAgencyId: ag.agency.id, targetAgencyName: ag.agency.name })}>
              <Icon name="person-add-outline" size={14} color={data.unassigned_prescribers > 0 ? '#2196F3' : '#AAA'} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: data.unassigned_prescribers > 0 ? '#2196F3' : '#AAA' }}>
                {data.unassigned_prescribers > 0 ? `Ajouter un prescripteur (${data.unassigned_prescribers} dispo.)` : 'Gerer les prescripteurs'}
              </Text>
            </TouchableOpacity>
          </GlassCard>
        ))}

        {/* Unassigned prescribers */}
        {data.unassigned_prescribers > 0 && (
          <GlassCard style={{ borderLeftWidth: 4, borderLeftColor: '#E53935' }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#E53935', marginBottom: 8 }}>Non assignes ({data.unassigned_prescribers})</Text>
            {(data.prescriber_ranking || []).filter((p: any) => !p.agency_id).map((pr: any) => (
              <View key={pr.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
                <Icon name="person-outline" size={14} color="#888" />
                <Text style={{ fontSize: 12, color: '#111827', flex: 1 }}>{pr.name}</Text>
                <TouchableOpacity style={{ backgroundColor: '#2196F3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
                  onPress={() => setAssignModal(pr)}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFF' }}>Assigner</Text>
                </TouchableOpacity>
              </View>
            ))}
          </GlassCard>
        )}
      </ScrollView>

      {/* Create agency modal */}
      {showCreate && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 16 }}>Nouvelle agence</Text>
            <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Nom de l'agence</Text>
            <TextInput style={{ borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 12, fontSize: 15, marginBottom: 12 }}
              placeholder="Ex: Agence Paris Nord" value={newName} onChangeText={setNewName} />
            <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Adresse</Text>
            <TextInput style={{ borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 12, fontSize: 15, marginBottom: 16 }}
              placeholder="Ex: 12 rue de la Paix, 75001 Paris" value={newAddr} onChangeText={setNewAddr} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={{ flex: 1, padding: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0' }} onPress={() => setShowCreate(false)}>
                <Text style={{ color: '#6B7280', fontWeight: '600' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 14, alignItems: 'center', borderRadius: 12 }} onPress={createAgency} disabled={creating}>
                {creating ? <ActivityIndicator color="#111827" /> : <Text style={{ color: '#FFF', fontWeight: '700' }}>Creer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Edit agency modal */}
      {editAgency && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 16 }}>Modifier l'agence</Text>
            <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Nom</Text>
            <TextInput style={{ borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 12, fontSize: 15, marginBottom: 12 }}
              value={editName} onChangeText={setEditName} />
            <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 4 }}>Adresse</Text>
            <TextInput style={{ borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 12, fontSize: 15, marginBottom: 16 }}
              value={editAddr} onChangeText={setEditAddr} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={{ flex: 1, padding: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0' }} onPress={() => setEditAgency(null)}>
                <Text style={{ color: '#6B7280', fontWeight: '600' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#FFFFFF', padding: 14, alignItems: 'center', borderRadius: 12 }} onPress={async () => {
                await apiFetch(`/api/company/agencies/${editAgency.id}`, { method: 'PUT', body: JSON.stringify({ name: editName.trim(), address: editAddr.trim() }) }, token);
                setEditAgency(null); fetchData();
              }}>
                <Text style={{ color: '#FFF', fontWeight: '700' }}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Assign modal - for unassigned OR for adding to specific agency */}
      {assignModal && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            {assignModal.targetAgencyId ? (
              <>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 4 }}>Gerer {assignModal.targetAgencyName}</Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>Prescripteurs non assignes</Text>
                {(data.prescriber_ranking || []).filter((p: any) => !p.agency_id).map((pr: any) => (
                  <TouchableOpacity key={pr.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' }}
                    onPress={() => assignToAgency(pr.id, assignModal.targetAgencyId)}>
                    <Icon name="person-outline" size={18} color="#4CAF50" />
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 }}>{pr.name}</Text>
                    <Icon name="add-circle-outline" size={18} color="#2196F3" />
                  </TouchableOpacity>
                ))}
                {(data.prescriber_ranking || []).filter((p: any) => !p.agency_id).length === 0 && (
                  <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', paddingVertical: 12 }}>Tous les prescripteurs sont deja assignes</Text>
                )}
                {/* Show currently assigned prescribers with remove option */}
                {(data.prescriber_ranking || []).filter((p: any) => p.agency_id === assignModal.targetAgencyId).length > 0 && (
                  <>
                    <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.08)', marginVertical: 12 }} />
                    <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>Prescripteurs dans cette agence</Text>
                    {(data.prescriber_ranking || []).filter((p: any) => p.agency_id === assignModal.targetAgencyId).map((pr: any) => (
                      <View key={pr.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' }}>
                        <Icon name="person" size={18} color="#4CAF50" />
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827', flex: 1 }}>{pr.name}</Text>
                        <TouchableOpacity style={{ backgroundColor: '#FFEBEE', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}
                          onPress={() => { assignToAgency(pr.id, null); }}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#E53935' }}>Retirer</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </>
                )}
              </>
            ) : (
              <>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 4 }}>Assigner {assignModal.name}</Text>
                <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>Choisissez une agence</Text>
                {(data.agencies || []).map((ag: any) => (
                  <TouchableOpacity key={ag.agency.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' }}
                    onPress={() => assignToAgency(assignModal.id, ag.agency.id)}>
                    <Icon name="business-outline" size={18} color="#FF9800" />
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827', flex: 1 }}>{ag.agency.name}</Text>
                    <Icon name="chevron-forward" size={16} color="#888" />
                  </TouchableOpacity>
                ))}
              </>
            )}
            <TouchableOpacity style={{ padding: 14, alignItems: 'center', marginTop: 10 }} onPress={() => setAssignModal(null)}>
              <Text style={{ color: '#6B7280', fontWeight: '600' }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

export default function HealthScreen() {
  const { token, user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [vitals, setVitals] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [latest, bracelet] = await Promise.all([
        apiFetch('/api/devices/latest', {}, token).catch(() => ({})),
        apiFetch('/api/bracelet/status', {}, token).catch(() => null),
      ]);
      if (bracelet && (bracelet.heart_rate > 0 || bracelet.steps > 0)) {
        setVitals({
          heart_rate: bracelet.heart_rate || 0, spo2: bracelet.spo2 || 0,
          systolic: bracelet.systolic || 0, diastolic: bracelet.diastolic || 0,
          temperature: bracelet.temperature || 0, steps: bracelet.steps || 0,
        });
      } else if (latest?.heart_rate) {
        setVitals(latest);
      }
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Admin sees Clients page, Company sees Agences
  const effectiveRole = user?.active_role || user?.role;
  if (effectiveRole === 'admin' && token) {
    return <AdminClients token={token} />;
  }
  if (effectiveRole === 'prescriber_company' && token) {
    return <CompanyAgences token={token} />;
  }

const BG_HEALTH = 'https://static.prod-images.emergentagent.com/jobs/8afdc991-0ab2-4687-a2a5-438b9a5f0711/images/93b4240c9303718119c72930976df061406f498e9727712063b57ec6ec698425.png';

  // Simulated data when no real data
  const simVitals = vitals || { heart_rate: 72, spo2: 97, systolic: 128, diastolic: 78, blood_pressure_systolic: 128, blood_pressure_diastolic: 78, temperature: 36.6, steps: 3842 };
  const simHistory = [
    { hour: '08h', hr: 68, spo2: 98 }, { hour: '10h', hr: 74, spo2: 97 }, { hour: '12h', hr: 82, spo2: 96 },
    { hour: '14h', hr: 76, spo2: 97 }, { hour: '16h', hr: 71, spo2: 98 }, { hour: '18h', hr: 78, spo2: 97 },
    { hour: '20h', hr: simVitals.heart_rate, spo2: simVitals.spo2 },
  ];
  const sleepData = { duration: '7h 23min', quality: 82, deep: '2h 10min', light: '4h 05min', rem: '1h 08min' };
  const maxHR = Math.max(...simHistory.map(h => h.hr));

  const metrics = [
    { id: 'heart_rate', label: 'Frequence cardiaque', value: simVitals.heart_rate, unit: 'bpm', icon: 'ri-heart-pulse-line', color: '#EF4444', range: '60-100', status: simVitals.heart_rate >= 60 && simVitals.heart_rate <= 100 ? 'normal' : 'alerte' },
    { id: 'spo2', label: 'Saturation O2', value: simVitals.spo2, unit: '%', icon: 'ri-drop-line', color: '#3B82F6', range: '95-100', status: simVitals.spo2 >= 95 ? 'normal' : 'alerte' },
    { id: 'blood_pressure', label: 'Tension arterielle', value: `${simVitals.systolic || simVitals.blood_pressure_systolic || 128}/${simVitals.diastolic || simVitals.blood_pressure_diastolic || 78}`, unit: 'mmHg', icon: 'ri-pulse-line', color: '#8B5CF6', range: '120/80', status: 'normal' },
    { id: 'temperature', label: 'Temperature', value: simVitals.temperature || 36.6, unit: 'C', icon: 'ri-temp-hot-line', color: '#F59E0B', range: '36.5-37.5', status: 'normal' },
  ];

  /* ─── WEB: Full-page health with midnight blue satin ─── */
  if (Platform.OS === 'web' && effectiveRole === 'beneficiary') {
    return (
      <div data-testid="health-screen" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_HEALTH} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1 } as any} />

        {/* Header */}
        <div style={{ position: 'relative', padding: '28px 20px 14px', zIndex: 10, textAlign: 'center' } as any}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>Ma sante</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Suivi de vos constantes en temps reel</div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '0 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>

          {/* Main vitals — big cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 } as any}>
            {metrics.map(m => (
              <div key={m.id} data-testid={`health-metric-${m.id}`} onClick={() => router.push({ pathname: '/health-detail', params: { metricId: m.id } })}
                style={{ padding: '16px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', cursor: 'pointer', transition: 'transform 0.2s' } as any}
                onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 } as any}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: `${m.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                    <i className={m.icon} style={{ fontSize: 18, color: m.color }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 999, background: m.status === 'normal' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' } as any}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.status === 'normal' ? '#10B981' : '#EF4444' } as any} />
                    <span style={{ fontSize: 9, fontWeight: 600, color: m.status === 'normal' ? '#10B981' : '#EF4444' }}>{m.status === 'normal' ? 'Normal' : 'Alerte'}</span>
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', letterSpacing: -1 }}>{m.value}<span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>{m.unit}</span></div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Activity card — steps + calories */}
          <div style={{ padding: '18px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', marginBottom: 14 } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 } as any}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase' }}>Activite du jour</div>
              <i className="ri-footprint-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} />
            </div>
            <div style={{ display: 'flex', gap: 12 } as any}>
              {[
                { val: simVitals.steps?.toLocaleString() || '3 842', label: 'Pas', icon: 'ri-footprint-line', color: '#10B981', pct: Math.min(100, ((simVitals.steps || 3842) / 8000) * 100) },
                { val: Math.round((simVitals.steps || 3842) * 0.04), label: 'Kcal', icon: 'ri-fire-line', color: '#F59E0B', pct: Math.min(100, ((simVitals.steps || 3842) * 0.04 / 400) * 100) },
                { val: ((simVitals.steps || 3842) * 0.0007).toFixed(1), label: 'Km', icon: 'ri-route-line', color: '#3B82F6', pct: Math.min(100, ((simVitals.steps || 3842) * 0.0007 / 5) * 100) },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' } as any}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{s.label}</div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
                    <div style={{ height: 6, borderRadius: 3, width: `${s.pct}%`, background: s.color, transition: 'width 1s', boxShadow: `0 0 8px ${s.color}50` } as any} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Heart rate graph — mini bar chart */}
          <div style={{ padding: '18px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', marginBottom: 14 } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 } as any}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase' }}>Frequence cardiaque</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Aujourd'hui</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 } as any}>
              {simHistory.map((h, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 } as any}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{h.hr}</div>
                  <div style={{ width: '100%', borderRadius: 4, background: i === simHistory.length - 1 ? 'linear-gradient(180deg, #EF4444, #B91C1C)' : 'rgba(239,68,68,0.25)', height: `${(h.hr / maxHR) * 60}px`, transition: 'height 0.5s', boxShadow: i === simHistory.length - 1 ? '0 0 12px rgba(239,68,68,0.4)' : 'none' } as any} />
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>{h.hour}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sleep card */}
          <div style={{ padding: '18px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', marginBottom: 14 } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(124,92,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                  <i className="ri-moon-line" style={{ fontSize: 18, color: '#A78BFA' }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Sommeil</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{sleepData.duration}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(124,92,255,0.15)' } as any}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#A78BFA' }}>{sleepData.quality}%</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 } as any}>
              {[
                { label: 'Profond', value: sleepData.deep, color: '#6D28D9', pct: 30 },
                { label: 'Leger', value: sleepData.light, color: '#A78BFA', pct: 55 },
                { label: 'REM', value: sleepData.rem, color: '#C4B5FD', pct: 15 },
              ].map((s, i) => (
                <div key={i} style={{ flex: s.pct, height: 8, borderRadius: 4, background: s.color } as any} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12 } as any}>
              {[
                { label: 'Profond', value: sleepData.deep, color: '#6D28D9' },
                { label: 'Leger', value: sleepData.light, color: '#A78BFA' },
                { label: 'REM', value: sleepData.rem, color: '#C4B5FD' },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 } as any}>
                    <span style={{ width: 6, height: 6, borderRadius: 3, background: s.color } as any} />
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginTop: 2 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 } as any}>
            {[
              { label: 'ECG', icon: 'ri-pulse-line', route: '/ecg' },
              { label: 'Sommeil', icon: 'ri-moon-line', route: '/sleep' },
              { label: 'Seuils d\'alerte', icon: 'ri-alarm-warning-line', route: '/edit-thresholds' },
              { label: 'Balance', icon: 'ri-scales-3-line', route: '/scale-detail' },
            ].map((a, i) => (
              <div key={i} onClick={() => router.push(a.route as any)} style={{
                padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              } as any}
                onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}>
                <i className={a.icon} style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)' }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#FFF' }}>{a.label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} testID="health-screen">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#111827" />} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#111827', marginTop: 16, marginBottom: 8, letterSpacing: -0.5 }}>Sante</Text>
        <Text style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 16 }}>Suivi de vos constantes en temps reel</Text>
        <PageExplainer pageId="health" title="Comprendre vos donnees de sante" sections={[
          { icon: 'heart-outline', heading: 'Constantes vitales', text: 'Votre rythme cardiaque, SpO2, tension et temperature sont mesures par vos appareils connectes (bracelet, gilet) et mis a jour automatiquement.' },
          { icon: 'trending-up-outline', heading: 'Seuils d\'alerte', text: 'Des seuils sont definis pour chaque constante. Si une valeur depasse le seuil, une alerte est declenchee et vos gardiens sont prevenus.' },
          { icon: 'fitness-outline', heading: 'Activite physique', text: 'Le nombre de pas, les calories brulees et la distance parcourue sont comptabilises tout au long de la journee.' },
        ]} />

        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}><ActivityIndicator size="large" color="#111827" /></View>
        ) : vitals ? (
          <>
            {metrics.map(m => (
              <TouchableOpacity key={m.id} testID={`health-metric-${m.id}`}
                style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', flexDirection: 'row', alignItems: 'center', gap: 16 }}
                onPress={() => router.push({ pathname: '/health-detail', params: { metricId: m.id } })}>
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: m.color + '15', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon name={m.icon as any} size={22} color={m.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, color: '#9CA3AF', fontWeight: '500' }}>{m.label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                    <Text style={{ fontSize: 26, fontWeight: '800', color: '#111827' }}>{m.value}</Text>
                    <Text style={{ fontSize: 13, color: '#9CA3AF' }}>{m.unit}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>Normal: {m.range}</Text>
                </View>
                <Icon name="chevron-forward" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ))}

            {/* Quick links */}
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827', marginTop: 12, marginBottom: 12, letterSpacing: -0.3 }}>Examens</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', alignItems: 'center', gap: 8 }} onPress={() => router.push('/ecg')}>
                <Icon name="pulse-outline" size={28} color="#111827" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>ECG</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', alignItems: 'center', gap: 8 }} onPress={() => router.push('/sleep')}>
                <Icon name="moon-outline" size={28} color="#111827" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>Sommeil</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
            <MCIcon name="bluetooth-off" size={40} color="#9CA3AF" />
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827', marginTop: 16 }}>Aucune donnee</Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 6, textAlign: 'center' }}>Connectez votre bracelet pour suivre vos constantes</Text>
            <TouchableOpacity style={{ marginTop: 20, backgroundColor: '#111827', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 9999 }} onPress={() => router.push('/bracelet-connect')}>
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Connecter le bracelet</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
