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
  <View style={[{ backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 18, marginBottom: 12, ...glass }, style]}>{children}</View>
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

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#1A1D21" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F6F8' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#1A1D21', letterSpacing: -0.5 }}>Clients</Text>
        <Text style={{ fontSize: 12, color: '#5A6068' }}>{users.length} utilisateurs au total</Text>
      </View>
      <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', ...glass }}>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, tab === 'beneficiary' && { backgroundColor: '#F5F6F8' }]} onPress={() => setTab('beneficiary')}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'beneficiary' ? '#FFF' : '#888' }}>Beneficiaires ({bens.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, tab === 'guardian' && { backgroundColor: '#F5F6F8' }]} onPress={() => setTab('guardian')}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: tab === 'guardian' ? '#FFF' : '#888' }}>Gardiens ({guards.length})</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} tintColor="#1A1D21" />}>
        {displayed.map(u => (
          <TouchableOpacity key={u.id} onPress={() => router.push({ pathname: '/admin-client-detail', params: { clientId: u.id, viewAs: tab } })} activeOpacity={0.7}>
            <GlassCard style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: tab === 'beneficiary' ? '#4FC3F7' : '#FFD54F', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }}>{u.name?.charAt(0)?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#1A1D21' }}>{u.name}</Text>
                <Text style={{ fontSize: 12, color: '#5A6068' }}>{u.email}</Text>
                {u.phone && <Text style={{ fontSize: 11, color: '#9BA3AD' }}>{u.phone}</Text>}
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
            <Text style={{ fontSize: 14, color: '#5A6068', marginTop: 8 }}>Aucun {tab === 'beneficiary' ? 'beneficiaire' : 'gardien'}</Text>
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

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#1A1D21" /></View>;
  if (!data) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F6F8' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#1A1D21', letterSpacing: -0.5 }}>Agences</Text>
        <Text style={{ fontSize: 12, color: '#5A6068' }}>{(data.agencies || []).length} agences · {data.total_prescribers} prescripteurs</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#1A1D21" />}>

        <TouchableOpacity style={{ backgroundColor: '#F5F6F8', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 16, flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          onPress={() => setShowCreate(true)}>
          <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>Nouvelle agence</Text>
          <Icon name="add-circle-outline" size={18} color="#1A1D21" />
        </TouchableOpacity>

        {(data.agencies || []).map((ag: any) => (
          <GlassCard key={ag.agency.id} style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF980015', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="business" size={20} color="#FF9800" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1D21' }}>{ag.agency.name}</Text>
                {ag.agency.address ? <Text style={{ fontSize: 11, color: '#5A6068' }}>{ag.agency.address}</Text> : null}
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
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A1D21' }}>{ag.prescriber_count}</Text>
                <Text style={{ fontSize: 9, color: '#5A6068' }}>prescripteurs</Text>
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
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#1A1D21', flex: 1 }}>{pr.name}</Text>
                <Text style={{ fontSize: 11, color: '#5A6068' }}>{pr.prescription_count} presc.</Text>
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
                <Text style={{ fontSize: 12, color: '#1A1D21', flex: 1 }}>{pr.name}</Text>
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
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A1D21', marginBottom: 16 }}>Nouvelle agence</Text>
            <Text style={{ fontSize: 12, color: '#5A6068', marginBottom: 4 }}>Nom de l'agence</Text>
            <TextInput style={{ borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 12, fontSize: 15, marginBottom: 12 }}
              placeholder="Ex: Agence Paris Nord" value={newName} onChangeText={setNewName} />
            <Text style={{ fontSize: 12, color: '#5A6068', marginBottom: 4 }}>Adresse</Text>
            <TextInput style={{ borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 12, fontSize: 15, marginBottom: 16 }}
              placeholder="Ex: 12 rue de la Paix, 75001 Paris" value={newAddr} onChangeText={setNewAddr} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={{ flex: 1, padding: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0' }} onPress={() => setShowCreate(false)}>
                <Text style={{ color: '#5A6068', fontWeight: '600' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#F5F6F8', padding: 14, alignItems: 'center', borderRadius: 12 }} onPress={createAgency} disabled={creating}>
                {creating ? <ActivityIndicator color="#1A1D21" /> : <Text style={{ color: '#FFF', fontWeight: '700' }}>Creer</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Edit agency modal */}
      {editAgency && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A1D21', marginBottom: 16 }}>Modifier l'agence</Text>
            <Text style={{ fontSize: 12, color: '#5A6068', marginBottom: 4 }}>Nom</Text>
            <TextInput style={{ borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 12, fontSize: 15, marginBottom: 12 }}
              value={editName} onChangeText={setEditName} />
            <Text style={{ fontSize: 12, color: '#5A6068', marginBottom: 4 }}>Adresse</Text>
            <TextInput style={{ borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 12, fontSize: 15, marginBottom: 16 }}
              value={editAddr} onChangeText={setEditAddr} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={{ flex: 1, padding: 14, alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#E0E0E0' }} onPress={() => setEditAgency(null)}>
                <Text style={{ color: '#5A6068', fontWeight: '600' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#F5F6F8', padding: 14, alignItems: 'center', borderRadius: 12 }} onPress={async () => {
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
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A1D21', marginBottom: 4 }}>Gerer {assignModal.targetAgencyName}</Text>
                <Text style={{ fontSize: 12, color: '#5A6068', marginBottom: 16 }}>Prescripteurs non assignes</Text>
                {(data.prescriber_ranking || []).filter((p: any) => !p.agency_id).map((pr: any) => (
                  <TouchableOpacity key={pr.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' }}
                    onPress={() => assignToAgency(pr.id, assignModal.targetAgencyId)}>
                    <Icon name="person-outline" size={18} color="#4CAF50" />
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1D21', flex: 1 }}>{pr.name}</Text>
                    <Icon name="add-circle-outline" size={18} color="#2196F3" />
                  </TouchableOpacity>
                ))}
                {(data.prescriber_ranking || []).filter((p: any) => !p.agency_id).length === 0 && (
                  <Text style={{ fontSize: 13, color: '#5A6068', textAlign: 'center', paddingVertical: 12 }}>Tous les prescripteurs sont deja assignes</Text>
                )}
                {/* Show currently assigned prescribers with remove option */}
                {(data.prescriber_ranking || []).filter((p: any) => p.agency_id === assignModal.targetAgencyId).length > 0 && (
                  <>
                    <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.08)', marginVertical: 12 }} />
                    <Text style={{ fontSize: 12, color: '#5A6068', marginBottom: 8 }}>Prescripteurs dans cette agence</Text>
                    {(data.prescriber_ranking || []).filter((p: any) => p.agency_id === assignModal.targetAgencyId).map((pr: any) => (
                      <View key={pr.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' }}>
                        <Icon name="person" size={18} color="#4CAF50" />
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1D21', flex: 1 }}>{pr.name}</Text>
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
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#1A1D21', marginBottom: 4 }}>Assigner {assignModal.name}</Text>
                <Text style={{ fontSize: 12, color: '#5A6068', marginBottom: 16 }}>Choisissez une agence</Text>
                {(data.agencies || []).map((ag: any) => (
                  <TouchableOpacity key={ag.agency.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' }}
                    onPress={() => assignToAgency(assignModal.id, ag.agency.id)}>
                    <Icon name="business-outline" size={18} color="#FF9800" />
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#1A1D21', flex: 1 }}>{ag.agency.name}</Text>
                    <Icon name="chevron-forward" size={16} color="#888" />
                  </TouchableOpacity>
                ))}
              </>
            )}
            <TouchableOpacity style={{ padding: 14, alignItems: 'center', marginTop: 10 }} onPress={() => setAssignModal(null)}>
              <Text style={{ color: '#5A6068', fontWeight: '600' }}>Fermer</Text>
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

  const metrics = vitals ? [
    { id: 'heart_rate', label: 'Frequence cardiaque', value: vitals.heart_rate, unit: 'bpm', icon: 'heart', color: '#EF4444', range: '60-100' },
    { id: 'spo2', label: 'Saturation O2', value: vitals.spo2, unit: '%', icon: 'water', color: '#3B82F6', range: '95-100' },
    { id: 'blood_pressure', label: 'Tension arterielle', value: `${vitals.systolic || vitals.blood_pressure_systolic || 0}/${vitals.diastolic || vitals.blood_pressure_diastolic || 0}`, unit: 'mmHg', icon: 'pulse', color: '#8B5CF6', range: '120/80' },
    { id: 'temperature', label: 'Temperature', value: vitals.temperature, unit: 'C', icon: 'thermometer', color: '#F59E0B', range: '36.5-37.5' },
    { id: 'steps', label: 'Pas aujourd\'hui', value: vitals.steps, unit: 'pas', icon: 'footsteps', color: '#10B981', range: '> 6000' },
  ] : [];

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F6F8' }} testID="health-screen">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#1A1D21" />} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#1A1D21', marginTop: 16, marginBottom: 8, letterSpacing: -0.5 }}>Sante</Text>
        <Text style={{ fontSize: 13, color: '#9BA3AD', marginBottom: 16 }}>Suivi de vos constantes en temps reel</Text>
        <PageExplainer pageId="health" title="Comprendre vos donnees de sante" sections={[
          { icon: 'heart-outline', heading: 'Constantes vitales', text: 'Votre rythme cardiaque, SpO2, tension et temperature sont mesures par vos appareils connectes (bracelet, gilet) et mis a jour automatiquement.' },
          { icon: 'trending-up-outline', heading: 'Seuils d\'alerte', text: 'Des seuils sont definis pour chaque constante. Si une valeur depasse le seuil, une alerte est declenchee et vos gardiens sont prevenus.' },
          { icon: 'fitness-outline', heading: 'Activite physique', text: 'Le nombre de pas, les calories brulees et la distance parcourue sont comptabilises tout au long de la journee.' },
        ]} />

        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}><ActivityIndicator size="large" color="#1A1D21" /></View>
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
                  <Text style={{ fontSize: 13, color: '#9BA3AD', fontWeight: '500' }}>{m.label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                    <Text style={{ fontSize: 26, fontWeight: '800', color: '#1A1D21' }}>{m.value}</Text>
                    <Text style={{ fontSize: 13, color: '#9BA3AD' }}>{m.unit}</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: '#9BA3AD', marginTop: 2 }}>Normal: {m.range}</Text>
                </View>
                <Icon name="chevron-forward" size={18} color="#9BA3AD" />
              </TouchableOpacity>
            ))}

            {/* Quick links */}
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A1D21', marginTop: 12, marginBottom: 12, letterSpacing: -0.3 }}>Examens</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', alignItems: 'center', gap: 8 }} onPress={() => router.push('/ecg')}>
                <Icon name="pulse-outline" size={28} color="#1A1D21" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1D21' }}>ECG</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', alignItems: 'center', gap: 8 }} onPress={() => router.push('/sleep')}>
                <Icon name="moon-outline" size={28} color="#1A1D21" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#1A1D21' }}>Sommeil</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
            <MCIcon name="bluetooth-off" size={40} color="#9BA3AD" />
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#1A1D21', marginTop: 16 }}>Aucune donnee</Text>
            <Text style={{ fontSize: 13, color: '#9BA3AD', marginTop: 6, textAlign: 'center' }}>Connectez votre bracelet pour suivre vos constantes</Text>
            <TouchableOpacity style={{ marginTop: 20, backgroundColor: '#1A1D21', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 9999 }} onPress={() => router.push('/bracelet-connect')}>
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Connecter le bracelet</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
