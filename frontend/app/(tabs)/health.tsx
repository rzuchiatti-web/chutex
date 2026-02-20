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
  const { user } = useAuth();
  const [dashData, setDashData] = useState<any>(null);
  const [intervenants, setIntervenants] = useState<any[]>([]);
  const [guardianLinks, setGuardianLinks] = useState<any[]>([]);
  const [allPrescribers, setAllPrescribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'agencies' | 'guardians'>('agencies');
  const [search, setSearch] = useState('');

  // Member detail panel
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberDetail, setMemberDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Agency CRUD
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddr, setNewAddr] = useState('');
  const [creating, setCreating] = useState(false);
  const [editAgency, setEditAgency] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editAddr, setEditAddr] = useState('');
  const [assignModal, setAssignModal] = useState<any>(null);

  // Guardian invite
  const [showInvite, setShowInvite] = useState(false);
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');
  const [inviting, setInviting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [dash, iv, gl, pr] = await Promise.all([
        apiFetch('/api/company/dashboard', {}, token).catch(() => ({})),
        apiFetch('/api/company/intervenants', {}, token).catch(() => []),
        apiFetch('/api/company/guardians', {}, token).catch(() => []),
        apiFetch('/api/company/prescribers', {}, token).catch(() => []),
      ]);
      setDashData(dash);
      setIntervenants(Array.isArray(iv) ? iv : []);
      setGuardianLinks(Array.isArray(gl) ? gl : []);
      setAllPrescribers(Array.isArray(pr) ? pr : []);
    } catch {} finally { setLoading(false); }
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

  const inviteGuardian = async () => {
    if (!invitePhone.trim()) return;
    setInviting(true); setInviteMsg('');
    try {
      const res = await apiFetch('/api/company/invite-guardian', { method: 'POST', body: JSON.stringify({ phone: invitePhone.trim() }) }, token);
      setInviteMsg(res.message || 'Invitation envoyee !');
      if (res.status !== 'error') { fetchData(); setTimeout(() => { setShowInvite(false); setInvitePhone(''); setInviteMsg(''); }, 2500); }
    } catch (e: any) { setInviteMsg(`Erreur : ${e.message}`); } finally { setInviting(false); }
  };

  const removeGuardian = async (linkId: string) => {
    await apiFetch(`/api/company/guardians/${linkId}`, { method: 'DELETE' }, token).catch(() => {});
    fetchData();
  };

  const openMemberDetail = async (member: any) => {
    if (!member.id) return; // Non inscrit (SMS envoyé)
    setSelectedMember(member);
    setMemberDetail(null);
    setLoadingDetail(true);
    try {
      const details: any = { member };
      const [ivDetail, prDetail, spaceStatus] = await Promise.all([
        member.is_intervention_provider
          ? apiFetch(`/api/company/intervenant/${member.id}`, {}, token).catch(() => null)
          : Promise.resolve(null),
        member.is_prescriber
          ? apiFetch(`/api/company/prescriber/${member.id}`, {}, token).catch(() => null)
          : Promise.resolve(null),
        apiFetch(`/api/company/member/${member.id}/space-status`, {}, token).catch(() => ({
          intervenant_active: true, prescripteur_active: true
        })),
      ]);
      details.intervenant = ivDetail;
      details.prescriber = prDetail;
      details.spaceStatus = spaceStatus;
      setMemberDetail(details);
    } catch {} finally { setLoadingDetail(false); }
  };

  const toggleSpace = async (spaceType: 'intervenant' | 'prescripteur', active: boolean) => {
    if (!selectedMember) return;
    try {
      await apiFetch(`/api/company/member/${selectedMember.id}/toggle-space`, {
        method: 'POST', body: JSON.stringify({ space_type: spaceType, active })
      }, token);
      await openMemberDetail(selectedMember);
    } catch (e: any) { window.alert(`Erreur : ${(e as any).message}`); }
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}><ActivityIndicator size="large" color="#FFF" /></View>;

  const BG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';
  const agencies = dashData?.agencies || [];
  // Utiliser la liste complète des prescripteurs (pas le ranking tronqué du dashboard)
  const prescribers = allPrescribers.length > 0 ? allPrescribers : (dashData?.prescriber_ranking || []);
  const u = user as any;

  const STATUS_COLOR: any = { accepted: '#10B981', pending: '#F59E0B', sms_sent: '#A78BFA', member: '#3B82F6', removed: '#6B7280', rejected: '#EF4444' };
  const STATUS_LABEL: any = { accepted: 'Rattache', pending: 'En attente', sms_sent: 'SMS envoye', member: 'Membre', removed: 'Retire', rejected: 'Refuse' };

  // ── Fusion dédupliquée : gardiens + intervenants + prescripteurs ──
  // Chaque personne = 1 seule fiche avec toutes ses pilules
  const mergedMap = new Map<string, any>();

  // 1. Ajouter les gardiens liés (ont un link_id pour le retrait)
  guardianLinks.forEach((g: any) => {
    if (g.id) {
      mergedMap.set(g.id, {
        id: g.id, link_id: g.link_id, name: g.name, phone: g.phone,
        profession: g.profession, status: g.status,
        is_intervention_provider: g.is_intervention_provider || false,
        is_prescriber: g.is_prescriber || false,
        is_guardian_link: true,
        agency_id: null,
        professional_beneficiaries: g.professional_beneficiaries || 0,
      });
    } else {
      // Non inscrits (SMS envoyés) — garder tels quels
      mergedMap.set(`sms_${g.link_id}`, { ...g, id: null, is_guardian_link: true });
    }
  });

  // 2. Ajouter/enrichir avec les intervenants
  intervenants.forEach((iv: any) => {
    if (mergedMap.has(iv.id)) {
      const existing = mergedMap.get(iv.id);
      existing.is_intervention_provider = true;
      existing.agency_id = existing.agency_id || iv.agency_id;
      existing.agency_name = existing.agency_name || iv.agency_name;
      if (!existing.status || existing.status === 'removed') existing.status = 'member';
    } else {
      mergedMap.set(iv.id, {
        id: iv.id, link_id: null, name: iv.name, phone: iv.phone || '',
        profession: iv.profession, status: 'member',
        is_intervention_provider: true, is_prescriber: false,
        is_guardian_link: false, agency_id: iv.agency_id,
        agency_name: iv.agency_name, professional_beneficiaries: 0,
      });
    }
  });

  // 3. Ajouter/enrichir avec les prescripteurs
  prescribers.forEach((p: any) => {
    if (mergedMap.has(p.id)) {
      const existing = mergedMap.get(p.id);
      existing.is_prescriber = true;
      existing.agency_id = existing.agency_id || p.agency_id;
      existing.prescriptions_count = p.prescription_count || 0;
      if (!existing.status || existing.status === 'removed') existing.status = 'member';
    } else {
      mergedMap.set(p.id, {
        id: p.id, link_id: null, name: p.name, phone: '',
        profession: '', status: 'member',
        is_intervention_provider: false, is_prescriber: true,
        is_guardian_link: false, agency_id: p.agency_id,
        prescriptions_count: p.prescription_count || 0,
        professional_beneficiaries: 0,
      });
    }
  });

  const allMembers = Array.from(mergedMap.values()).filter((m: any) => m.status !== 'removed');
  const pendingGuardians = allMembers.filter((m: any) => m.status === 'pending').length;

  // Guardian card component (shared) - clickable opens detail
  const GuardianCard = ({ gl }: { gl: any }) => (
    <div onClick={() => gl.id && openMemberDetail(gl)} style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8, backdropFilter: 'blur(8px)', cursor: gl.id ? 'pointer' : 'default' } as any}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
        <div style={{ width: 46, height: 46, borderRadius: 999, background: gl.status === 'accepted' || gl.status === 'member' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: gl.status === 'accepted' || gl.status === 'member' ? '1px solid rgba(16,185,129,0.3)' : 'none' } as any}>
          {gl.id ? <span style={{ fontSize: 18, fontWeight: 800, color: (gl.status === 'accepted' || gl.status === 'member') ? '#10B981' : '#FFF' }}>{gl.name?.charAt(0)}</span> : <i className="ri-user-unfollow-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.35)' }} />}
        </div>
        <div style={{ flex: 1 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginBottom: 3 } as any}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{gl.name || 'Non inscrit'}</span>
            {gl.is_intervention_provider && <span style={{ fontSize: 9, fontWeight: 700, color: '#A78BFA', background: 'rgba(124,92,255,0.2)', padding: '2px 7px', borderRadius: 99 } as any}>Care</span>}
            {gl.is_prescriber && <span style={{ fontSize: 9, fontWeight: 700, color: '#F59E0B', background: 'rgba(245,158,11,0.15)', padding: '2px 7px', borderRadius: 99 } as any}>Prescripteur</span>}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{gl.phone}{gl.profession ? ` · ${gl.profession}` : ''}{gl.agency_name && gl.agency_name !== 'Non assigne' ? ` · ${gl.agency_name}` : ''}</div>
          {gl.professional_beneficiaries > 0 && <div style={{ fontSize: 10, color: '#10B981', marginTop: 2 }}>{gl.professional_beneficiaries} beneficiaire(s) professionnel(s)</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5, flexShrink: 0 } as any}>
          {/* Statut — sauf "member" qui a juste le bouton suppression */}
          {gl.status !== 'member' && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 99, background: `${STATUS_COLOR[gl.status] || '#6B7280'}20`, fontSize: 9, fontWeight: 700, color: STATUS_COLOR[gl.status] || '#6B7280' } as any}>
              <span style={{ width: 4, height: 4, borderRadius: 99, background: STATUS_COLOR[gl.status] || '#6B7280', display: 'inline-block' } as any} />{STATUS_LABEL[gl.status] || gl.status}
            </div>
          )}
          {/* Bouton suppression pour gardiens liés OU membres */}
          {(gl.is_guardian_link && gl.link_id && gl.status !== 'removed') && (
            <div onClick={() => { if (window.confirm(`Retirer ${gl.name || gl.phone} ?`)) removeGuardian(gl.link_id); }} style={{ width: 26, height: 26, borderRadius: 999, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 12, color: '#EF4444' }} /></div>
          )}
          {/* Bouton suppression pour membres sans link_id (intervenants/prescripteurs purs) */}
          {!gl.is_guardian_link && gl.status === 'member' && (
            <div onClick={() => window.alert(`${gl.name} est lié(e) à la structure via son espace Care / Prescripteur. Pour le retirer, désactivez son code d'accès dans la gestion des codes.`)} style={{ width: 26, height: 26, borderRadius: 999, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0.5 } as any}><i className="ri-close-line" style={{ fontSize: 12, color: '#EF4444' }} /></div>
          )}
        </div>
      </div>
    </div>
  );

  if (Platform.OS === 'web') {
    // Filtered guardians for search
    const filteredGuardians = allMembers.filter((g: any) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (g.name || '').toLowerCase().includes(q) || (g.phone || '').includes(q) || (g.profession || '').toLowerCase().includes(q);
    });

    return (
      <div data-testid="company-agences" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1 } as any} />

        {/* Tout dans le scroll */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '22px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>

          {/* Header — dans le scroll */}
          <div style={{ textAlign: 'center', marginBottom: 14 } as any}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(212,132,90,0.2)', border: '2px solid rgba(212,132,90,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' } as any}>
              <i className="ri-building-line" style={{ fontSize: 24, color: '#D4845A' }} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 2 }}>{u?.structure_name || u?.name || 'Structure'}</div>
            {u?.address && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{u.address}</div>}
            {u?.siret && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>SIRET : {u.siret}</div>}

            {/* Stats */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 } as any}>
              {[
                { val: agencies.length, label: 'Agences', color: '#D4845A' },
                { val: allMembers.length, label: 'Membres', color: '#10B981' },
                { val: allMembers.filter((m: any) => m.is_intervention_provider).length, label: 'Care', color: '#A78BFA' },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, padding: '9px 6px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' } as any}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* 2 Tabs */}
            <div style={{ display: 'inline-flex', borderRadius: 999, padding: 3, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)' } as any}>
              {([
                { k: 'agencies', label: `Agences (${agencies.length})`, icon: 'ri-building-line' },
                { k: 'guardians', label: `Membres (${allMembers.length})`, icon: 'ri-shield-user-line', badge: pendingGuardians },
              ] as const).map(t => (
                <div key={t.k} onClick={() => setTab(t.k)} style={{ padding: '8px 18px', borderRadius: 999, cursor: 'pointer', fontSize: 12, fontWeight: 700, background: tab === t.k ? '#FFF' : 'transparent', color: tab === t.k ? '#111' : 'rgba(255,255,255,0.7)', transition: 'all 0.2s', position: 'relative', whiteSpace: 'nowrap' } as any}>
                  <i className={t.icon} style={{ marginRight: 5 }} />{t.label}
                  {(t as any).badge > 0 && <span style={{ position: 'absolute', top: 1, right: 1, width: 14, height: 14, borderRadius: 999, background: '#F59E0B', fontSize: 8, fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>{(t as any).badge}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* ── TAB AGENCES ── */}
          {tab === 'agencies' && (<>
            <div onClick={() => setShowCreate(true)} style={{ padding: '12px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
              <i className="ri-add-circle-line" style={{ fontSize: 16 }} />Creer une agence
            </div>

            {agencies.map((ag: any) => {
              // Membres de cette agence depuis allMembers (dédupliqués, avec toutes les pilules)
              const agMembers = allMembers.filter((m: any) =>
                m.agency_id === ag.agency.id ||
                intervenants.some((iv: any) => iv.id === m.id && (iv.agency_id === ag.agency.id || iv.agency_name === ag.agency.name)) ||
                prescribers.some((p: any) => p.id === m.id && p.agency_id === ag.agency.id)
              );

              return (
                <div key={ag.agency.id} style={{ padding: '16px 18px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 10, backdropFilter: 'blur(8px)' } as any}>
                  {/* Agency header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 } as any}>
                    <div style={{ width: 46, height: 46, borderRadius: 14, background: 'rgba(212,132,90,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-building-line" style={{ fontSize: 22, color: '#D4845A' }} /></div>
                    <div style={{ flex: 1 } as any}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{ag.agency.name}</div>
                      {ag.agency.address && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{ag.agency.address}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 6 } as any}>
                      <div onClick={() => { setEditAgency(ag.agency); setEditName(ag.agency.name); setEditAddr(ag.agency.address || ''); }} style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-edit-line" style={{ fontSize: 14, color: '#FFF' }} /></div>
                      <div onClick={() => { if (window.confirm(`Supprimer "${ag.agency.name}" ?`)) apiFetch(`/api/company/agencies/${ag.agency.id}`, { method: 'DELETE' }, token).then(fetchData); }} style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-delete-bin-line" style={{ fontSize: 14, color: '#EF4444' }} /></div>
                    </div>
                  </div>

                  {/* Membres de l'agence (1 fiche par personne, toutes pilules) */}
                  {agMembers.length > 0 && (<>
                    <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Membres ({agMembers.length})</div>
                    {agMembers.map((m: any, i: number) => (
                      <div key={m.id || m.link_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' } as any}>
                        <div style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 12, fontWeight: 800, color: '#10B981' }}>{m.name?.charAt(0)}</span></div>
                        <div style={{ flex: 1 } as any}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' } as any}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{m.name}</span>
                            {m.is_intervention_provider && <span style={{ fontSize: 8, fontWeight: 700, color: '#A78BFA', background: 'rgba(124,92,255,0.2)', padding: '1px 6px', borderRadius: 99 } as any}>Care</span>}
                            {m.is_prescriber && <span style={{ fontSize: 8, fontWeight: 700, color: '#F59E0B', background: 'rgba(245,158,11,0.15)', padding: '1px 6px', borderRadius: 99 } as any}>Prescripteur</span>}
                          </div>
                          {m.profession && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{m.profession}</div>}
                        </div>
                      </div>
                    ))}
                  </>)}
                  {agMembers.length === 0 && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '8px 0' }}>Aucun membre</div>}

                  {/* Assign prescriber */}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' } as any} />
                  <div onClick={() => setAssignModal({ targetAgencyId: ag.agency.id, targetAgencyName: ag.agency.name })} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 0', cursor: 'pointer' } as any}>
                    <i className="ri-user-add-line" style={{ fontSize: 13, color: dashData?.unassigned_prescribers > 0 ? '#3B82F6' : 'rgba(255,255,255,0.3)' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: dashData?.unassigned_prescribers > 0 ? '#3B82F6' : 'rgba(255,255,255,0.3)' }}>{dashData?.unassigned_prescribers > 0 ? `Assigner un prescripteur (${dashData.unassigned_prescribers} dispo.)` : 'Gerer les prescripteurs'}</span>
                  </div>
                </div>
              );
            })}
            {agencies.length === 0 && <div style={{ textAlign: 'center', padding: '50px 20px' } as any}><i className="ri-building-line" style={{ fontSize: 40, color: 'rgba(255,255,255,0.1)' }} /><div style={{ fontSize: 15, fontWeight: 700, color: '#FFF', marginTop: 12 }}>Aucune agence</div></div>}
          </>)}

          {/* ── TAB GARDIENS ── */}
          {tab === 'guardians' && (<>
            {/* Search + Add button */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 } as any}>
              <div style={{ flex: 1, position: 'relative' } as any}>
                <i className="ri-search-line" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' } as any} />
                <input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Rechercher un gardien..." style={{ width: '100%', padding: '11px 14px 11px 36px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
              </div>
              <div onClick={() => setShowInvite(true)} style={{ width: 44, height: 44, borderRadius: 14, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' } as any}>
                <i className="ri-add-line" style={{ fontSize: 22, color: '#111' }} />
              </div>
            </div>

            {filteredGuardians.length === 0 && search && <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Aucun gardien correspondant</div>}
            {filteredGuardians.map((gl: any) => <GuardianCard key={gl.link_id} gl={gl} />)}
            {guardianLinks.length === 0 && !search && <div style={{ textAlign: 'center', padding: '50px 20px' } as any}><i className="ri-shield-user-line" style={{ fontSize: 40, color: 'rgba(255,255,255,0.1)' }} /><div style={{ fontSize: 15, fontWeight: 700, color: '#FFF', marginTop: 12 }}>Aucun gardien rattache</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>Les gardiens professionnels rattaches font remonter les alertes de leurs beneficiaires</div></div>}
          </>)}
        </div>

        {/* ── MODALS ── */}
        {/* Fiche détail membre */}
        {selectedMember && (
          <div onClick={() => { setSelectedMember(null); setMemberDetail(null); }} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.3)', overflowY: 'auto' } as any}>
            <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
              {/* Close */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
                <div onClick={() => { setSelectedMember(null); setMemberDetail(null); }} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
              </div>

              {/* Identity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 } as any}>
                <div style={{ width: 64, height: 64, borderRadius: 999, background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <span style={{ fontSize: 26, fontWeight: 900, color: '#10B981' }}>{selectedMember.name?.charAt(0)}</span>
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 } as any}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#FFF' }}>{selectedMember.name}</span>
                    {selectedMember.is_intervention_provider && <span style={{ fontSize: 10, fontWeight: 700, color: '#A78BFA', background: 'rgba(124,92,255,0.2)', padding: '3px 8px', borderRadius: 99 } as any}>Care</span>}
                    {selectedMember.is_prescriber && <span style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', background: 'rgba(245,158,11,0.15)', padding: '3px 8px', borderRadius: 99 } as any}>Prescripteur</span>}
                  </div>
                  {selectedMember.profession && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{selectedMember.profession}</div>}
                  {selectedMember.phone && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}><i className="ri-phone-line" style={{ marginRight: 4 }} />{selectedMember.phone}</div>}
                  {selectedMember.agency_name && selectedMember.agency_name !== 'Non assigne' && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}><i className="ri-building-line" style={{ marginRight: 4 }} />{selectedMember.agency_name}</div>}
                </div>
              </div>

              {loadingDetail && <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(255,255,255,0.4)', fontSize: 13 } as any}><i className="ri-loader-4-line" style={{ fontSize: 20 }} /></div>}

              {memberDetail && (<>
                {/* Espace Intervenant Care */}
                {memberDetail.intervenant && (() => {
                  const ivActive = memberDetail.spaceStatus?.intervenant_active !== false;
                  return (
                    <div style={{ padding: '16px', borderRadius: 18, background: ivActive ? 'rgba(124,92,255,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${ivActive ? 'rgba(124,92,255,0.2)' : 'rgba(255,255,255,0.08)'}`, marginBottom: 12 } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 } as any}>
                        <div style={{ width: 36, height: 36, borderRadius: 12, background: ivActive ? 'rgba(124,92,255,0.2)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-stethoscope-line" style={{ fontSize: 18, color: ivActive ? '#A78BFA' : 'rgba(255,255,255,0.3)' }} /></div>
                        <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: ivActive ? '#A78BFA' : 'rgba(255,255,255,0.4)' }}>Espace Intervenant Care{!ivActive && ' (désactivé)'}</div>
                        {/* Toggle */}
                        <div onClick={() => toggleSpace('intervenant', !ivActive)} style={{ padding: '6px 12px', borderRadius: 999, cursor: 'pointer', background: ivActive ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', border: `1px solid ${ivActive ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`, fontSize: 11, fontWeight: 700, color: ivActive ? '#EF4444' : '#10B981', display: 'flex', alignItems: 'center', gap: 4 } as any}>
                          <i className={ivActive ? 'ri-forbid-line' : 'ri-checkbox-circle-line'} style={{ fontSize: 13 }} />
                          {ivActive ? 'Désactiver' : 'Réactiver'}
                        </div>
                      </div>
                      {ivActive && (<>
                        <div style={{ display: 'flex', gap: 8, marginBottom: 10 } as any}>
                          {[
                            { val: memberDetail.intervenant.total_interventions || 0, label: 'Total missions', color: '#FFF' },
                            { val: memberDetail.intervenant.active_interventions || 0, label: 'En cours', color: '#A78BFA' },
                            { val: memberDetail.intervenant.completed_interventions || 0, label: 'Terminées', color: '#10B981' },
                          ].map((s, i) => (
                            <div key={i} style={{ flex: 1, padding: '8px 6px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', textAlign: 'center' } as any}>
                              <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.val}</div>
                              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>{s.label}</div>
                            </div>
                          ))}
                        </div>
                        {memberDetail.intervenant.agency && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}><i className="ri-building-line" style={{ marginRight: 4 }} />{memberDetail.intervenant.agency.name}</div>}
                        {memberDetail.intervenant.intervenant?.intervention_radius_km && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}><i className="ri-map-pin-range-line" style={{ marginRight: 4 }} />Rayon : {memberDetail.intervenant.intervenant.intervention_radius_km} km</div>}
                        <div onClick={() => { setSelectedMember(null); setMemberDetail(null); router.push({ pathname: '/company-intervenant-detail', params: { intervenantId: selectedMember.id } }); }} style={{ marginTop: 10, padding: '8px 14px', borderRadius: 999, background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 } as any}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#A78BFA' }}>Voir la fiche complète</span><i className="ri-arrow-right-s-line" style={{ fontSize: 14, color: '#A78BFA' }} />
                        </div>
                      </>)}
                    </div>
                  );
                })()}

                {/* Espace Prescripteur */}
                {memberDetail.prescriber && (() => {
                  const prActive = memberDetail.spaceStatus?.prescripteur_active !== false;
                  return (
                    <div style={{ padding: '16px', borderRadius: 18, background: prActive ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${prActive ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.08)'}`, marginBottom: 12 } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 } as any}>
                        <div style={{ width: 36, height: 36, borderRadius: 12, background: prActive ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-file-text-line" style={{ fontSize: 18, color: prActive ? '#F59E0B' : 'rgba(255,255,255,0.3)' }} /></div>
                        <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: prActive ? '#F59E0B' : 'rgba(255,255,255,0.4)' }}>Espace Prescripteur{!prActive && ' (désactivé)'}</div>
                        {/* Toggle */}
                        <div onClick={() => toggleSpace('prescripteur', !prActive)} style={{ padding: '6px 12px', borderRadius: 999, cursor: 'pointer', background: prActive ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', border: `1px solid ${prActive ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`, fontSize: 11, fontWeight: 700, color: prActive ? '#EF4444' : '#10B981', display: 'flex', alignItems: 'center', gap: 4 } as any}>
                          <i className={prActive ? 'ri-forbid-line' : 'ri-checkbox-circle-line'} style={{ fontSize: 13 }} />
                          {prActive ? 'Désactiver' : 'Réactiver'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10 } as any}>
                        {[
                          { val: memberDetail.prescriber.total_prescriptions || 0, label: 'Prescriptions', color: '#FFF' },
                          { val: Math.round(memberDetail.prescriber.comm_validated || 0), label: 'EUR validés', color: '#10B981' },
                          { val: Math.round(memberDetail.prescriber.comm_pending || 0), label: 'EUR en att.', color: '#F59E0B' },
                        ].map((s, i) => (
                          <div key={i} style={{ flex: 1, padding: '8px 6px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', textAlign: 'center' } as any}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.val}</div>
                            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                      {memberDetail.prescriber.agency && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}><i className="ri-building-line" style={{ marginRight: 4 }} />{memberDetail.prescriber.agency.name}</div>}
                      <div onClick={() => { setSelectedMember(null); setMemberDetail(null); router.push({ pathname: '/company-prescriber-detail', params: { prescriberId: selectedMember.id } }); }} style={{ marginTop: 10, padding: '8px 14px', borderRadius: 999, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 } as any}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>Voir la fiche complète</span><i className="ri-arrow-right-s-line" style={{ fontSize: 14, color: '#F59E0B' }} />
                      </div>
                    </div>
                  );
                })()}

                {/* Espace Gardien SAAD */}
                {selectedMember.is_guardian_link && (
                  <div style={{ padding: '16px', borderRadius: 18, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', marginBottom: 12 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 } as any}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-shield-user-line" style={{ fontSize: 18, color: '#10B981' }} /></div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#10B981' }}>Espace Gardien</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                      Rattaché à la structure SAAD · {selectedMember.professional_beneficiaries || 0} bénéficiaire(s) professionnel(s)
                    </div>
                  </div>
                )}

                {!memberDetail.intervenant && !memberDetail.prescriber && !selectedMember.is_guardian_link && (
                  <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Aucun espace activé détecté</div>
                )}
              </>)}
            </div>
          </div>
        )}

        {/* ── MODALS ── */}
        {showCreate && (<div onClick={() => setShowCreate(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'auto' } as any}><div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}><div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}><div onClick={() => setShowCreate(false)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div></div><div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 20 }}>Nouvelle agence</div>{[{ k: 'name', label: 'Nom', val: newName, set: setNewName, ph: 'Agence Lyon Centre' }, { k: 'addr', label: 'Adresse', val: newAddr, set: setNewAddr, ph: '45 rue de la Part-Dieu' }].map(({ k, label, val, set, ph }) => (<div key={k} style={{ marginBottom: 12 } as any}><div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{label}</div><input value={val} onChange={(e: any) => set(e.target.value)} placeholder={ph} style={{ width: '100%', padding: '13px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} /></div>))}<div style={{ display: 'flex', gap: 10, marginTop: 16 } as any}><div onClick={() => setShowCreate(false)} style={{ flex: 1, padding: '13px', borderRadius: 999, textAlign: 'center', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontWeight: 700, cursor: 'pointer' } as any}>Annuler</div><div onClick={createAgency} style={{ flex: 1, padding: '13px', borderRadius: 999, textAlign: 'center', background: '#FFF', color: '#111', fontWeight: 700, cursor: 'pointer' } as any}>{creating ? '...' : 'Creer'}</div></div></div></div>)}
        {editAgency && (<div onClick={() => setEditAgency(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'auto' } as any}><div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}><div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}><div onClick={() => setEditAgency(null)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div></div><div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 20 }}>Modifier l'agence</div>{[{ label: 'Nom', val: editName, set: setEditName }, { label: 'Adresse', val: editAddr, set: setEditAddr }].map(({ label, val, set }) => (<div key={label} style={{ marginBottom: 12 } as any}><div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{label}</div><input value={val} onChange={(e: any) => set(e.target.value)} style={{ width: '100%', padding: '13px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} /></div>))}<div style={{ display: 'flex', gap: 10, marginTop: 16 } as any}><div onClick={() => setEditAgency(null)} style={{ flex: 1, padding: '13px', borderRadius: 999, textAlign: 'center', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontWeight: 700, cursor: 'pointer' } as any}>Annuler</div><div onClick={async () => { await apiFetch(`/api/company/agencies/${editAgency.id}`, { method: 'PUT', body: JSON.stringify({ name: editName.trim(), address: editAddr.trim() }) }, token); setEditAgency(null); fetchData(); }} style={{ flex: 1, padding: '13px', borderRadius: 999, textAlign: 'center', background: '#FFF', color: '#111', fontWeight: 700, cursor: 'pointer' } as any}>Enregistrer</div></div></div></div>)}
        {assignModal && (<div onClick={() => setAssignModal(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'auto' } as any}><div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}><div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}><div onClick={() => setAssignModal(null)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div></div>{assignModal.targetAgencyId ? (<><div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>Gerer {assignModal.targetAgencyName}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>Prescripteurs non assignes</div>{prescribers.filter((p: any) => !p.agency_id).map((pr: any) => (<div key={pr.id} onClick={() => assignToAgency(pr.id, assignModal.targetAgencyId)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' } as any}><i className="ri-user-line" style={{ fontSize: 14, color: '#10B981' }} /><span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#FFF' }}>{pr.name}</span><i className="ri-add-circle-line" style={{ fontSize: 16, color: '#3B82F6' }} /></div>))}{prescribers.filter((p: any) => !p.agency_id).length === 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 12 }}>Tous assignes</div>}{prescribers.filter((p: any) => p.agency_id === assignModal.targetAgencyId).length > 0 && (<><div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '12px 0' } as any} /><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Dans cette agence</div>{prescribers.filter((p: any) => p.agency_id === assignModal.targetAgencyId).map((pr: any) => (<div key={pr.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' } as any}><span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#FFF' }}>{pr.name}</span><div onClick={() => assignToAgency(pr.id, null)} style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.15)', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: '#EF4444' } as any}>Retirer</div></div>))}</>)}</>) : (<><div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>Assigner {assignModal.name}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>Choisissez une agence</div>{agencies.map((ag: any) => (<div key={ag.agency.id} onClick={() => assignToAgency(assignModal.id, ag.agency.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' } as any}><i className="ri-building-line" style={{ fontSize: 14, color: '#D4845A' }} /><span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#FFF' }}>{ag.agency.name}</span><i className="ri-arrow-right-s-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} /></div>))}</>)}<div onClick={() => setAssignModal(null)} style={{ padding: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontWeight: 600, cursor: 'pointer', marginTop: 10 } as any}>Fermer</div></div></div>)}
        {showInvite && (<div onClick={() => { setShowInvite(false); setInvitePhone(''); setInviteMsg(''); }} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.25)', overflowY: 'auto' } as any}><div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}><div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}><div onClick={() => { setShowInvite(false); setInvitePhone(''); setInviteMsg(''); }} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div></div><div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Ajouter un gardien</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 24, lineHeight: 1.6 }}>Entrez le numero du gardien. S'il a un compte, il recoit une notification. Sinon, un SMS l'invite a s'inscrire.</div><div style={{ marginBottom: 20 } as any}><div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Numero de telephone</div><div style={{ position: 'relative' } as any}><i className="ri-phone-line" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' } as any} /><input value={invitePhone} onChange={(e: any) => setInvitePhone(e.target.value)} placeholder="06 12 34 56 78" type="tel" onKeyDown={(e: any) => { if (e.key === 'Enter') inviteGuardian(); }} style={{ width: '100%', padding: '14px 16px 14px 42px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', fontSize: 16, fontWeight: 600, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} /></div></div>{inviteMsg && (<div style={{ padding: '13px 16px', borderRadius: 14, marginBottom: 16, background: inviteMsg.startsWith('Erreur') ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', border: `1px solid ${inviteMsg.startsWith('Erreur') ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}` } as any}><div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' } as any}><i className={inviteMsg.startsWith('Erreur') ? 'ri-error-warning-line' : 'ri-checkbox-circle-line'} style={{ fontSize: 17, color: inviteMsg.startsWith('Erreur') ? '#EF4444' : '#10B981', flexShrink: 0 }} /><span style={{ fontSize: 13, color: '#FFF', lineHeight: 1.5 }}>{inviteMsg}</span></div></div>)}<div onClick={inviteGuardian} style={{ padding: '16px', borderRadius: 999, textAlign: 'center', cursor: invitePhone.trim() && !inviting ? 'pointer' : 'not-allowed', background: invitePhone.trim() && !inviting ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${invitePhone.trim() ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`, color: invitePhone.trim() ? '#10B981' : 'rgba(255,255,255,0.3)', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>{inviting ? <><i className="ri-loader-4-line" style={{ fontSize: 16 }} />Envoi...</> : <><i className="ri-send-plane-line" style={{ fontSize: 16 }} />Envoyer l'invitation</>}</div></div></div>)}
      </div>
    );
  }

  // Native fallback
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827' }}>Structure</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}>
        {agencies.map((ag: any) => (
          <GlassCard key={ag.agency.id} style={{ padding: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>{ag.agency.name}</Text>
          </GlassCard>
        ))}
      </ScrollView>
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
  const [dashData, setDashData] = useState<any>(null);

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

  const fetchDashData = useCallback(async () => {
    try {
      const dd = await apiFetch('/api/devices/dashboard-summary', {}, token);
      setDashData(dd);
    } catch {}
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetchDashData(); }, [fetchDashData]);

  const effectiveRole = user?.active_role || user?.role;
  if (effectiveRole === 'admin' && token) {
    return <AdminClients token={token} />;
  }
  if (effectiveRole === 'prescriber_company' && token) {
    return <CompanyAgences token={token} />;
  }

  const BG_DARK = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';

  // Fetch daily health report with AI
  const [report, setReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(true);
  const fetchReport = useCallback(async () => {
    try {
      const r = await apiFetch('/api/health/daily-report', {}, token);
      setReport(r);
    } catch {} finally { setReportLoading(false); }
  }, [token]);
  useEffect(() => { fetchReport(); }, [fetchReport]);

  const d = report?.data || {};
  const ai = report?.ai || {};
  const sparks = report?.sparklines || {};
  const score = report?.score ?? 0;
  const status = report?.status || 'Chargement...';
  const statusColor = report?.status_color || 'rgba(255,255,255,0.3)';
  const userName = user?.name?.split(' ')[0] || 'vous';

  /* Mini sparkline SVG */
  const Spark = ({ data, color }: { data: number[]; color: string }) => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data); const max = Math.max(...data); const range = max - min || 1;
    const w = 80; const h = 24;
    const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
    return <svg width={w} height={h} style={{ display: 'block' }}><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  };

  /* Trend arrow */
  const Trend = ({ current, prev, inverse }: { current: number; prev: number; inverse?: boolean }) => {
    const diff = current - prev;
    const better = inverse ? diff < 0 : diff > 0;
    const same = Math.abs(diff) < 0.1;
    if (same) return <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>= stable</span>;
    return <span style={{ fontSize: 10, fontWeight: 700, color: better ? '#10B981' : '#F59E0B' }}>{better ? '↗' : '↘'} {Math.abs(diff).toFixed(1)}</span>;
  };

  /* ─── WEB: Coach Sante Intelligent ─── */
  if (Platform.OS === 'web' && effectiveRole === 'beneficiary') {
    if (reportLoading) return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0f1a' } as any}>
        <div style={{ textAlign: 'center' } as any}>
          <i className="ri-heart-pulse-line" style={{ fontSize: 40, color: 'rgba(255,255,255,0.15)', display: 'block', marginBottom: 12 }} />
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>Analyse en cours...</div>
        </div>
      </div>
    );
    return (
      <div data-testid="health-screen" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", overflow: 'hidden' } as any}>
        <img src={BG_DARK} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />

        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '24px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>

          {/* ── 1. Message du jour ── */}
          <div style={{ marginBottom: 24 } as any}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Bonjour {userName},</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', lineHeight: 1.3 }}>{ai.summary || 'Vos constantes sont dans les normes.'}</div>
          </div>

          {/* ── 2. Score Vitalite ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px', borderRadius: 24, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', marginBottom: 16 } as any}>
            {/* Circle score */}
            <div style={{ position: 'relative', width: 90, height: 90, flexShrink: 0 } as any}>
              <svg width="90" height="90" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <circle cx="45" cy="45" r="38" fill="none" stroke={statusColor} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(score / 100) * 239} 239`} style={{ transition: 'stroke-dasharray 1s ease' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } as any}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{score}</div>
                <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>/100</div>
              </div>
            </div>
            <div style={{ flex: 1 } as any}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: `${statusColor}20`, border: `1px solid ${statusColor}40`, marginBottom: 8 } as any}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: statusColor } as any} />
                <span style={{ fontSize: 12, fontWeight: 700, color: statusColor }}>{status}</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Score base sur vos constantes cardiaques, composition corporelle, sommeil et activite.</div>
            </div>
          </div>

          {/* ── 3. Conseil prioritaire du jour ── */}
          {ai.primary_recommendation && (
            <div style={{ padding: '16px 18px', borderRadius: 18, background: 'linear-gradient(135deg, rgba(14,116,144,0.15), rgba(34,211,238,0.08))', border: '1px solid rgba(34,211,238,0.2)', marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 14 } as any}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(34,211,238,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 } as any}>
                <i className="ri-lightbulb-line" style={{ fontSize: 18, color: '#22D3EE' }} />
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(34,211,238,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Conseil du jour</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#FFF', lineHeight: 1.5 }}>{ai.primary_recommendation}</div>
              </div>
            </div>
          )}

          {/* ── 4. Correlations IA ── */}
          {ai.correlations && ai.correlations.length > 0 && (
            <div style={{ padding: '16px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
                <i className="ri-brain-line" style={{ fontSize: 16, color: '#A78BFA' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(167,139,250,0.6)', textTransform: 'uppercase', letterSpacing: 1 }}>Analyse IA</span>
              </div>
              {ai.correlations.map((c: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                  <i className="ri-links-line" style={{ fontSize: 14, color: 'rgba(167,139,250,0.5)', marginTop: 2, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{c}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── 5. Indicateurs par theme sante ── */}

          {/* COEUR & CIRCULATION */}
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(239,68,68,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 } as any}>
            <i className="ri-heart-pulse-line" style={{ fontSize: 12 }} />Coeur & Circulation
            <div style={{ flex: 1, height: 1, background: 'rgba(239,68,68,0.12)' } as any} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 } as any}>
            {[
              { label: 'Frequence cardiaque', value: d.heart_rate || 72, unit: 'bpm', color: '#EF4444', explain: d.heart_rate >= 60 && d.heart_rate <= 80 ? 'Rythme sain au repos' : 'A surveiller', spark: sparks.heart_rate, route: '/health-detail', params: { metricId: 'heart_rate' } },
              { label: 'Saturation O2', value: d.spo2 || 97, unit: '%', color: '#38BDF8', explain: (d.spo2 || 97) >= 95 ? 'Oxygenation normale' : 'Oxygenation a surveiller', spark: sparks.heart_rate, route: '/health-detail', params: { metricId: 'spo2' } },
              { label: 'Tension', value: `${d.blood_pressure?.systolic || 125}/${d.blood_pressure?.diastolic || 78}`, unit: 'mmHg', color: '#A78BFA', explain: (d.blood_pressure?.systolic || 125) <= 130 ? 'Tension normale' : 'Tension a surveiller', route: '/health-detail', params: { metricId: 'blood_pressure' } },
              { label: 'Temperature', value: d.temperature || 36.6, unit: '°C', color: '#F59E0B', explain: 'Stable', route: '/health-detail', params: { metricId: 'temperature' } },
            ].map((m, i) => (
              <div key={i} data-testid={`health-card-${i}`} onClick={() => router.push({ pathname: m.route as any, params: m.params })} style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'transform 0.2s' } as any}
                onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 } as any}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{m.label}</div>
                  {m.spark && <Spark data={m.spark} color={m.color} />}
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>{m.value}<span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>{m.unit}</span></div>
                <div style={{ fontSize: 11, color: m.explain.includes('surveiller') ? '#F59E0B' : 'rgba(16,185,129,0.7)', fontWeight: 600 }}>{m.explain}</div>
              </div>
            ))}
          </div>

          {/* CORPS & COMPOSITION */}
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(167,139,250,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 } as any}>
            <i className="ri-body-scan-line" style={{ fontSize: 12 }} />Corps & Composition
            <div style={{ flex: 1, height: 1, background: 'rgba(167,139,250,0.12)' } as any} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 } as any}>
            {[
              { label: 'Poids', value: d.weight || 72.4, unit: 'kg', color: '#A78BFA', prev: d.weight_prev, spark: sparks.weight, explain: '' },
              { label: 'IMC', value: d.bmi || 24.1, unit: '', color: '#38BDF8', explain: (d.bmi || 24.1) < 25 ? 'Normal' : 'Surpoids' },
              { label: 'Masse grasse', value: d.body_fat || 22.3, unit: '%', color: '#F59E0B', prev: d.body_fat_prev, spark: sparks.body_fat, explain: '' },
              { label: 'Masse musculaire', value: d.muscle_mass || 33.8, unit: '%', color: '#10B981', prev: d.muscle_mass_prev, spark: sparks.muscle_mass, explain: '' },
              { label: 'Hydratation', value: d.water_pct || 55.2, unit: '%', color: '#38BDF8', spark: sparks.water_pct, explain: (d.water_pct || 55) >= 55 ? 'Bien hydrate' : 'Hydratation basse' },
              { label: 'Age metabolique', value: d.metabolic_age || 63, unit: 'ans', color: '#A78BFA', explain: '' },
            ].map((m, i) => (
              <div key={i} onClick={() => router.push('/scale-detail' as any)} style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', transition: 'transform 0.2s' } as any}
                onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 } as any}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>{m.label}</div>
                  {m.spark && <Spark data={m.spark} color={m.color} />}
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 } as any}>
                  <span style={{ fontSize: 26, fontWeight: 900, color: '#FFF' }}>{m.value}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>{m.unit}</span>
                  {m.prev && <Trend current={m.value as number} prev={m.prev as number} inverse={m.label === 'Masse grasse'} />}
                </div>
                {m.explain && <div style={{ fontSize: 11, color: m.explain.includes('basse') || m.explain.includes('Surpoids') ? '#F59E0B' : 'rgba(16,185,129,0.7)', fontWeight: 600, marginTop: 4 }}>{m.explain}</div>}
              </div>
            ))}
          </div>

          {/* CTA Nouvelle pesee */}
          <div data-testid="new-weighing-btn" onClick={() => router.push('/scale-detail' as any)} style={{ padding: '16px', borderRadius: 999, background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(139,92,246,0.08))', border: '1px solid rgba(167,139,250,0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 } as any}>
            <i className="ri-scales-3-line" style={{ fontSize: 18, color: '#A78BFA' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Nouvelle pesee</span>
          </div>

          {/* SOMMEIL & RECUPERATION */}
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(124,92,255,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 } as any}>
            <i className="ri-moon-line" style={{ fontSize: 12 }} />Sommeil & Recuperation
            <div style={{ flex: 1, height: 1, background: 'rgba(124,92,255,0.12)' } as any} />
          </div>
          <div style={{ padding: '16px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 10 } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } as any}>
              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 2 }}>Duree</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF' }}>{Math.floor((d.sleep_duration_min || 443) / 60)}h {String((d.sleep_duration_min || 443) % 60).padStart(2, '0')}min</div>
              </div>
              <div style={{ textAlign: 'right' } as any}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 2 }}>Qualite</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#A78BFA' }}>{d.sleep_quality || 82}%</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 3, height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 10 } as any}>
              <div style={{ flex: d.deep_sleep_min || 130, background: '#6D28D9', borderRadius: '4px 0 0 4px' } as any} />
              <div style={{ flex: d.light_sleep_min || 245, background: '#A78BFA' } as any} />
              <div style={{ flex: d.rem_sleep_min || 68, background: '#C4B5FD', borderRadius: '0 4px 4px 0' } as any} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' } as any}>
              {[
                { l: 'Profond', v: `${Math.floor((d.deep_sleep_min || 130) / 60)}h${String((d.deep_sleep_min || 130) % 60).padStart(2, '0')}`, c: '#6D28D9' },
                { l: 'Leger', v: `${Math.floor((d.light_sleep_min || 245) / 60)}h${String((d.light_sleep_min || 245) % 60).padStart(2, '0')}`, c: '#A78BFA' },
                { l: 'REM', v: `${Math.floor((d.rem_sleep_min || 68) / 60)}h${String((d.rem_sleep_min || 68) % 60).padStart(2, '0')}`, c: '#C4B5FD' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: s.c } as any} /><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{s.l}</span><span style={{ fontSize: 11, fontWeight: 700, color: '#FFF' }}>{s.v}</span></div>
              ))}
            </div>
          </div>

          {/* Stress & Recuperation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 } as any}>
            <div style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' } as any}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 8 }}>Stress</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF' }}>{d.stress_level || 35}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>/100</span></div>
              <div style={{ fontSize: 11, color: (d.stress_level || 35) <= 40 ? 'rgba(16,185,129,0.7)' : '#F59E0B', fontWeight: 600, marginTop: 4 }}>{(d.stress_level || 35) <= 40 ? 'Detendu' : 'Un peu eleve'}</div>
              {sparks.stress_level && <div style={{ marginTop: 6 } as any}><Spark data={sparks.stress_level} color="#F59E0B" /></div>}
            </div>
            <div style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' } as any}>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, marginBottom: 8 }}>Recuperation</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF' }}>{d.recovery_score || 85}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>/100</span></div>
              <div style={{ fontSize: 11, color: (d.recovery_score || 85) >= 70 ? 'rgba(16,185,129,0.7)' : '#F59E0B', fontWeight: 600, marginTop: 4 }}>{(d.recovery_score || 85) >= 70 ? 'Bonne recuperation' : 'Repos recommande'}</div>
            </div>
          </div>

          {/* ACTIVITE & VITALITE */}
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(16,185,129,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 } as any}>
            <i className="ri-footprint-line" style={{ fontSize: 12 }} />Activite & Vitalite
            <div style={{ flex: 1, height: 1, background: 'rgba(16,185,129,0.12)' } as any} />
          </div>
          <div style={{ padding: '16px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 } as any}>
            <div style={{ display: 'flex', gap: 16 } as any}>
              {[
                { val: (d.steps || 3842).toLocaleString(), label: 'Pas', color: '#10B981', pct: Math.min(100, ((d.steps || 3842) / 8000) * 100) },
                { val: d.calories || 154, label: 'Kcal', color: '#F59E0B', pct: Math.min(100, ((d.calories || 154) / 400) * 100) },
                { val: d.distance_km || 2.7, label: 'Km', color: '#38BDF8', pct: Math.min(100, ((d.distance_km || 2.7) / 5) * 100) },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center' } as any}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{s.val}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>{s.label}</div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
                    <div style={{ height: 4, borderRadius: 2, width: `${s.pct}%`, background: s.color, transition: 'width 1s', boxShadow: `0 0 6px ${s.color}40` } as any} />
                  </div>
                </div>
              ))}
            </div>
            {sparks.steps && <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 } as any}><span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>7 jours</span><Spark data={sparks.steps} color="#10B981" /></div>}
          </div>

          {/* ── 6. Recommandations secondaires ── */}
          {ai.secondary_recommendations && ai.secondary_recommendations.length > 0 && (
            <div style={{ padding: '16px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 } as any}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Autres conseils</div>
              {ai.secondary_recommendations.map((r: string, i: number) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(34,211,238,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 } as any}>
                    <i className="ri-arrow-right-line" style={{ fontSize: 11, color: '#22D3EE' }} />
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{r}</div>
                </div>
              ))}
            </div>
          )}

          {/* Quick actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as any}>
            {[
              { label: 'ECG', icon: 'ri-pulse-line', route: '/ecg', color: '#EF4444' },
              { label: 'Seuils d\'alerte', icon: 'ri-alarm-warning-line', route: '/edit-thresholds', color: '#F59E0B' },
            ].map((a, i) => (
              <div key={i} onClick={() => router.push(a.route as any)} style={{ padding: '14px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer' } as any}>
                <i className={a.icon} style={{ fontSize: 16, color: a.color }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{a.label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    );
  }

  /* Native metrics fallback */
  const nativeVitals = vitals || { heart_rate: 72, spo2: 97, systolic: 125, diastolic: 78, temperature: 36.6, steps: 3842 };
  const metrics = [
    { id: 'heart_rate', label: 'Frequence cardiaque', value: nativeVitals.heart_rate, unit: 'bpm', icon: 'ri-heart-pulse-line', color: '#EF4444', range: '60-100', status: nativeVitals.heart_rate >= 60 && nativeVitals.heart_rate <= 100 ? 'normal' : 'alerte' },
    { id: 'spo2', label: 'Saturation O2', value: nativeVitals.spo2, unit: '%', icon: 'ri-drop-line', color: '#38BDF8', range: '95-100', status: nativeVitals.spo2 >= 95 ? 'normal' : 'alerte' },
    { id: 'blood_pressure', label: 'Tension arterielle', value: `${nativeVitals.systolic || 125}/${nativeVitals.diastolic || 78}`, unit: 'mmHg', icon: 'ri-pulse-line', color: '#A78BFA', range: '120/80', status: 'normal' },
    { id: 'temperature', label: 'Temperature', value: nativeVitals.temperature || 36.6, unit: 'C', icon: 'ri-temp-hot-line', color: '#F59E0B', range: '36.5-37.5', status: 'normal' },
  ];

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
