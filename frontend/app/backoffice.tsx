import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Modal, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { Colors } from '../src/constants/colors';
import { useTheme } from '../src/context/ThemeContext';

const confirmAction = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

export default function BackofficeScreen() {
  const { colors: themeColors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [codes, setCodes] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'stats'|'kpi'|'users'|'alerts'|'codes'|'prescriptions'|'interventions'|'subscriptions'>('stats');
  const [interventionCodes, setInterventionCodes] = useState<any[]>([]);
  const [kpi, setKpi] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

  // Code modal state
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [editingCode, setEditingCode] = useState<any>(null);
  const [codeForm, setCodeForm] = useState({ structure_name: '', max_uses: '50', raison_sociale: '', siret: '', tva: '', adresse: '', telephone: '', email_contact: '' });
  const [creating, setCreating] = useState(false);

  // Intervention code modal state
  const [showIvCodeModal, setShowIvCodeModal] = useState(false);
  const [editingIvCode, setEditingIvCode] = useState<any>(null);
  const [ivForm, setIvForm] = useState({ structure_name: '', max_uses: '50', raison_sociale: '', siret: '', tva: '', adresse: '', telephone: '', email_contact: '', radius_km: '30' });

  // Subscription modal state
  const [showSubModal, setShowSubModal] = useState(false);
  const [subForm, setSubForm] = useState({ beneficiary_phone: '', subscription_type: 'standard', notes: '' });
  const [syncing, setSyncing] = useState(false);
  const [shopifyConnected, setShopifyConnected] = useState(false);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [s, u, a, c, p, ic, k, subs] = await Promise.all([
          apiFetch('/api/backoffice/stats', {}, token).catch(() => null),
          apiFetch('/api/backoffice/users', {}, token).catch(() => []),
          apiFetch('/api/backoffice/alerts', {}, token).catch(() => []),
          apiFetch('/api/admin/activation-codes', {}, token).catch(() => []),
          apiFetch('/api/backoffice/prescriptions', {}, token).catch(() => []),
          apiFetch('/api/admin/intervention-codes', {}, token).catch(() => []),
          apiFetch('/api/backoffice/kpi', {}, token).catch(() => null),
          apiFetch('/api/admin/subscriptions', {}, token).catch(() => []),
        ]);
        setStats(s); setUsers(u); setAlerts(a); setCodes(c); setPrescriptions(p); setInterventionCodes(ic); setKpi(k); setSubscriptions(subs);
        apiFetch('/api/admin/shopify/status', {}, token).then(r => setShopifyConnected(r?.connected)).catch(() => {});
      } catch {} finally { setLoading(false); }
    })();
  }, [token]);

  const resetCodeForm = () => setCodeForm({ structure_name: '', max_uses: '50', raison_sociale: '', siret: '', tva: '', adresse: '', telephone: '', email_contact: '' });
  const resetIvForm = () => setIvForm({ structure_name: '', max_uses: '50', raison_sociale: '', siret: '', tva: '', adresse: '', telephone: '', email_contact: '', radius_km: '30' });

  // ===== Subscription CRUD =====
  const saveSub = async () => {
    if (!subForm.beneficiary_phone) return Alert.alert('Erreur', 'Telephone du beneficiaire requis');
    setCreating(true);
    try {
      const r = await apiFetch('/api/admin/subscriptions', {
        method: 'POST', body: JSON.stringify(subForm),
      }, token);
      setSubscriptions([r, ...subscriptions]);
      setShowSubModal(false);
      Alert.alert('Abonnement cree', `Type: ${r.subscription_type}\nTel: ${r.beneficiary_phone}`);
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setCreating(false); }
  };

  const deleteSub = (id: string) => {
    confirmAction('Confirmer', 'Supprimer cet abonnement ?', async () => {
      try {
        await apiFetch(`/api/admin/subscriptions/${id}`, { method: 'DELETE' }, token);
        setSubscriptions(subscriptions.filter(s => s.id !== id));
      } catch (e: any) { Alert.alert('Erreur', e.message); }
    });
  };

  const syncShopify = async () => {
    if (!shopifyConnected) {
      connectShopify();
      return;
    }
    setSyncing(true);
    try {
      const r = await apiFetch('/api/admin/shopify/sync', { method: 'POST' }, token);
      const msg = `Synchronises: ${r.synced}\nIgnores: ${r.skipped}${r.errors?.length ? `\nErreurs: ${r.errors.join(', ')}` : ''}`;
      Alert.alert('Sync Shopify', msg);
      if (r.synced > 0) {
        const fresh = await apiFetch('/api/admin/subscriptions', {}, token).catch(() => []);
        setSubscriptions(fresh);
      }
    } catch (e: any) { Alert.alert('Erreur Shopify', e.message); } finally { setSyncing(false); }
  };

  const connectShopify = async () => {
    try {
      const r = await apiFetch('/api/admin/shopify/auth-url', {}, token);
      if (r?.auth_url && Platform.OS === 'web') {
        window.open(r.auth_url, '_blank');
        Alert.alert('Shopify', 'Une fenetre Shopify s\'est ouverte. Autorisez l\'acces puis revenez ici et cliquez sur "Sync Shopify".');
      } else {
        Alert.alert('Shopify', `Ouvrez ce lien dans votre navigateur:\n${r?.auth_url}`);
      }
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  // ===== Activation Codes CRUD =====
  const openCreateCode = () => { setEditingCode(null); resetCodeForm(); setShowCodeModal(true); };
  const openEditCode = (c: any) => {
    setEditingCode(c);
    setCodeForm({
      structure_name: c.structure_name || '', max_uses: String(c.max_uses || 50),
      raison_sociale: c.raison_sociale || '', siret: c.siret || '', tva: c.tva || '',
      adresse: c.adresse || '', telephone: c.telephone || '', email_contact: c.email_contact || '',
    });
    setShowCodeModal(true);
  };

  const saveCode = async () => {
    if (!codeForm.structure_name) return Alert.alert('Erreur', 'Nom de structure requis');
    setCreating(true);
    try {
      if (editingCode) {
        await apiFetch(`/api/admin/activation-codes/${editingCode.id}`, {
          method: 'PUT', body: JSON.stringify({ ...codeForm, max_uses: parseInt(codeForm.max_uses) || 50 }),
        }, token);
        setCodes(codes.map(c => c.id === editingCode.id ? { ...c, ...codeForm, max_uses: parseInt(codeForm.max_uses) || 50 } : c));
        Alert.alert('Code modifie');
      } else {
        const r = await apiFetch('/api/admin/activation-codes', {
          method: 'POST', body: JSON.stringify({ ...codeForm, max_uses: parseInt(codeForm.max_uses) || 50 }),
        }, token);
        setCodes([r, ...codes]);
        Alert.alert('Code cree', `Code: ${r.code}\nStructure: ${r.structure_name}`);
      }
      setShowCodeModal(false);
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setCreating(false); }
  };

  const toggleCode = async (id: string) => {
    try {
      const r = await apiFetch(`/api/admin/activation-codes/${id}/toggle`, { method: 'PUT' }, token);
      setCodes(codes.map(c => (c.id === id || c.code === id) ? { ...c, active: r.active } : c));
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  const deleteCode = (id: string) => {
    confirmAction('Confirmer', 'Supprimer ce code ?', async () => {
      try {
        await apiFetch(`/api/admin/activation-codes/${id}`, { method: 'DELETE' }, token);
        setCodes(codes.filter(c => c.id !== id && c.code !== id));
      } catch (e: any) { Alert.alert('Erreur', e.message); }
    });
  };

  // ===== Intervention Codes CRUD =====
  const openCreateIvCode = () => { setEditingIvCode(null); resetIvForm(); setShowIvCodeModal(true); };
  const openEditIvCode = (c: any) => {
    setEditingIvCode(c);
    setIvForm({
      structure_name: c.structure_name || '', max_uses: String(c.max_uses || 50),
      raison_sociale: c.raison_sociale || '', siret: c.siret || '', tva: c.tva || '',
      adresse: c.adresse || '', telephone: c.telephone || '', email_contact: c.email_contact || '',
      radius_km: String(c.default_radius_km || 30),
    });
    setShowIvCodeModal(true);
  };

  const saveIvCode = async () => {
    if (!ivForm.structure_name) return Alert.alert('Erreur', 'Nom de structure requis');
    setCreating(true);
    try {
      if (editingIvCode) {
        await apiFetch(`/api/admin/intervention-codes/${editingIvCode.id}`, {
          method: 'PUT', body: JSON.stringify({ ...ivForm, max_uses: parseInt(ivForm.max_uses) || 50 }),
        }, token);
        setInterventionCodes(interventionCodes.map(c => c.id === editingIvCode.id ? { ...c, ...ivForm, max_uses: parseInt(ivForm.max_uses) || 50, default_radius_km: parseFloat(ivForm.radius_km) || 30 } : c));
        Alert.alert('Code modifie');
      } else {
        const body: any = { ...ivForm, max_uses: parseInt(ivForm.max_uses) || 50, radius_km: parseFloat(ivForm.radius_km) || 30 };
        delete body.radius_km;
        const r = await apiFetch('/api/admin/intervention-codes', {
          method: 'POST', body: JSON.stringify({ structure_name: ivForm.structure_name, max_uses: parseInt(ivForm.max_uses) || 50, radius_km: parseFloat(ivForm.radius_km) || 30, raison_sociale: ivForm.raison_sociale, siret: ivForm.siret, tva: ivForm.tva, adresse: ivForm.adresse, telephone: ivForm.telephone, email_contact: ivForm.email_contact }),
        }, token);
        setInterventionCodes([r, ...interventionCodes]);
        Alert.alert('Code cree', `Code intervenant: ${r.code}`);
      }
      setShowIvCodeModal(false);
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setCreating(false); }
  };

  const toggleIvCode = async (id: string) => {
    try {
      const r = await apiFetch(`/api/admin/intervention-codes/${id}/toggle`, { method: 'PUT' }, token);
      setInterventionCodes(interventionCodes.map(c => (c.id === id || c.code === id) ? { ...c, active: r.active } : c));
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  const deleteIvCode = (id: string) => {
    confirmAction('Confirmer', 'Supprimer ce code intervenant ?', async () => {
      try {
        await apiFetch(`/api/admin/intervention-codes/${id}`, { method: 'DELETE' }, token);
        setInterventionCodes(interventionCodes.filter(c => c.id !== id && c.code !== id));
      } catch (e: any) { Alert.alert('Erreur', e.message); }
    });
  };

  const TABS = [
    { id: 'stats', label: 'Stats' },
    { id: 'subscriptions', label: 'Abonnements' },
    { id: 'users', label: 'Utilisateurs' },
    { id: 'alerts', label: 'Alertes' },
    { id: 'codes', label: 'Codes' },
    { id: 'prescriptions', label: 'Prescriptions' },
    { id: 'interventions', label: 'Intervenants' },
    { id: 'kpi', label: 'KPI' },
  ] as const;

  return (
    <SafeAreaView style={[bs.safe, { backgroundColor: themeColors.background }]} testID="backoffice-screen">
      <View style={bs.topBar}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={bs.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={bs.topTitle}>Back Office</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={bs.tabScroll} contentContainerStyle={bs.tabScrollC}>
        {TABS.map(t => (
          <TouchableOpacity key={t.id} testID={`bo-${t.id}`} style={[bs.tabBtn, tab === t.id && bs.tabBtnA]} onPress={() => setTab(t.id)}>
            <Text style={[bs.tabBtnT, tab === t.id && bs.tabBtnTA]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? <View style={bs.center}><ActivityIndicator size="large" color={Colors.primary} /></View> : (
        <ScrollView contentContainerStyle={bs.sc} showsVerticalScrollIndicator={false}>

          {/* STATS */}
          {tab === 'stats' && stats && (
            <View style={bs.grid}>
              {[
                { l: 'Utilisateurs', v: stats.total_users }, { l: 'Beneficiaires', v: stats.beneficiaries },
                { l: 'Gardiens', v: stats.guardians }, { l: 'Prescripteurs', v: stats.prescribers },
                { l: 'Alertes actives', v: stats.active_alerts }, { l: 'Total alertes', v: stats.total_alerts },
                { l: 'Abon. Standard', v: stats.subscriptions_standard || 0 }, { l: 'Abon. Care', v: stats.subscriptions_care || 0 },
                { l: 'Interventions', v: stats.interventions }, { l: 'Teleconsults', v: stats.teleconsults },
                { l: 'Appels TA', v: stats.teleassistance_calls }, { l: 'Codes actifs', v: stats.activation_codes },
              ].map(st => (
                <View key={st.l} style={bs.statC}><Text style={bs.statV}>{st.v}</Text><Text style={bs.statL}>{st.l}</Text></View>
              ))}
            </View>
          )}

          {/* USERS */}
          {tab === 'users' && users.map(u => (
            <View key={u.id} style={bs.userR}>
              <View style={bs.userAv}><Text style={bs.userAvT}>{u.name?.charAt(0)?.toUpperCase()}</Text></View>
              <View style={bs.userInfo}>
                <Text style={bs.userName}>{u.name}</Text>
                <Text style={bs.userEmail}>{u.email}</Text>
                {u.is_prescriber && <Text style={bs.prescTag}>Prescripteur - {u.prescriber_structure}</Text>}
                {u.subscription_type && u.subscription_type !== 'none' && <Text style={[bs.prescTag, { color: u.subscription_type === 'care' ? '#9C27B0' : Colors.primary }]}>Abonnement {u.subscription_type.toUpperCase()}</Text>}
              </View>
              <View style={bs.roleBdg}><Text style={bs.roleBdgT}>{u.role}</Text></View>
            </View>
          ))}

          {/* SUBSCRIPTIONS */}
          {tab === 'subscriptions' && (
            <>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <TouchableOpacity testID="create-sub-btn" style={[bs.createBtn, { flex: 1, marginBottom: 0 }]} onPress={() => { setSubForm({ beneficiary_phone: '', subscription_type: 'standard', notes: '' }); setShowSubModal(true); }}>
                  <Ionicons name="add" size={18} color={colors.textPrimary} /><Text style={bs.createBtnT}>Nouvel abonnement</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="sync-shopify-btn" style={[bs.createBtn, { flex: 1, marginBottom: 0, backgroundColor: shopifyConnected ? '#96BF48' : '#FF9800' }]} onPress={syncShopify} disabled={syncing}>
                  {syncing ? <ActivityIndicator color={colors.textPrimary} size="small" /> : <><Ionicons name={shopifyConnected ? "sync" : "link"} size={18} color={colors.textPrimary} /><Text style={bs.createBtnT}>{shopifyConnected ? 'Sync Shopify' : 'Connecter Shopify'}</Text></>}
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
                <View style={[bs.miniStat, { backgroundColor: Colors.primary + '10' }]}>
                  <Text style={[bs.miniStatV, { color: Colors.primary }]}>{subscriptions.length}</Text>
                  <Text style={bs.miniStatL}>Total</Text>
                </View>
                <View style={[bs.miniStat, { backgroundColor: Colors.success + '10' }]}>
                  <Text style={[bs.miniStatV, { color: Colors.success }]}>{subscriptions.filter(s => s.subscription_type === 'standard').length}</Text>
                  <Text style={bs.miniStatL}>Standard</Text>
                </View>
                <View style={[bs.miniStat, { backgroundColor: '#9C27B0' + '10' }]}>
                  <Text style={[bs.miniStatV, { color: '#9C27B0' }]}>{subscriptions.filter(s => s.subscription_type === 'care').length}</Text>
                  <Text style={bs.miniStatL}>Care</Text>
                </View>
              </View>
              {subscriptions.map(s => (
                <View key={s.id} style={bs.codeC} testID={`sub-card-${s.id}`}>
                  <View style={bs.codeTop}>
                    <Text style={[bs.codeVal, { fontSize: 14 }]}>{s.beneficiary_name || s.beneficiary_phone}</Text>
                    <View style={[bs.codeBdg, { backgroundColor: s.subscription_type === 'care' ? '#9C27B0' + '15' : Colors.success + '15' }]}>
                      <Text style={[bs.codeBdgT, { color: s.subscription_type === 'care' ? '#9C27B0' : Colors.success }]}>{s.subscription_type?.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Text style={bs.codeMeta}>Tel: {s.beneficiary_phone}</Text>
                  {s.beneficiary_email && <Text style={bs.codeMeta}>Email: {s.beneficiary_email}</Text>}
                  {s.buyer_name && <Text style={bs.codeMeta}>Acheteur: {s.buyer_name} ({s.buyer_email})</Text>}
                  <Text style={bs.codeMeta}>Source: {s.source === 'shopify' || s.source === 'shopify_webhook' ? 'Shopify' : 'Manuel'}{s.shopify_order_number ? ` #${s.shopify_order_number}` : ''} - {new Date(s.created_at).toLocaleDateString('fr-FR')}</Text>
                  {s.notes ? <Text style={[bs.codeMeta, { fontStyle: 'italic' }]}>{s.notes}</Text> : null}
                  <View style={bs.codeActions}>
                    <TouchableOpacity testID={`delete-sub-${s.id}`} style={bs.actionBtn} onPress={() => deleteSub(s.id)}>
                      <Ionicons name="trash-outline" size={14} color={Colors.destructive} /><Text style={[bs.actionBtnT, { color: Colors.destructive }]}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {subscriptions.length === 0 && <View style={{ alignItems: 'center', paddingVertical: 20 }}><Text style={{ color: Colors.textMuted, fontSize: 13 }}>Aucun abonnement</Text></View>}
            </>
          )}

          {/* ALERTS */}
          {tab === 'alerts' && alerts.slice(0, 30).map(a => (
            <View key={a.id} style={[bs.alertR, a.severity === 'critical' && { borderLeftColor: Colors.destructive }]}>
              <View style={bs.alertI}>
                <Text style={bs.alertM}>{a.message}</Text>
                <Text style={bs.alertMt}>{a.beneficiary_name} - {a.alert_type} - {new Date(a.created_at).toLocaleString('fr-FR')}</Text>
              </View>
              <View style={[bs.stBdg, a.status === 'active' && { backgroundColor: Colors.destructive + '12' }]}>
                <Text style={[bs.stBdgT, a.status === 'active' && { color: Colors.destructive }]}>{a.status}</Text>
              </View>
            </View>
          ))}

          {/* ACTIVATION CODES */}
          {tab === 'codes' && (
            <>
              <TouchableOpacity testID="create-code-btn" style={bs.createBtn} onPress={openCreateCode}>
                <Ionicons name="add" size={18} color={colors.textPrimary} /><Text style={bs.createBtnT}>Creer un code d'activation</Text>
              </TouchableOpacity>
              {codes.map(c => (
                <View key={c.id || c.code} style={[bs.codeC, !c.active && { opacity: 0.5 }]} testID={`code-card-${c.id || c.code}`}>
                  <View style={bs.codeTop}>
                    <Text style={bs.codeVal}>{c.code}</Text>
                    <View style={[bs.codeBdg, c.active && { backgroundColor: Colors.success + '15' }]}>
                      <Text style={[bs.codeBdgT, c.active && { color: Colors.success }]}>{c.active ? 'Actif' : 'Desactive'}</Text>
                    </View>
                  </View>
                  <Text style={bs.codeSt}>{c.structure_name}</Text>
                  {c.raison_sociale ? <Text style={bs.codeMeta}>{c.raison_sociale}{c.siret ? ` - SIRET: ${c.siret}` : ''}</Text> : null}
                  <Text style={bs.codeMeta}>Utilisations: {c.uses_count}/{c.max_uses} - {new Date(c.created_at).toLocaleDateString('fr-FR')}</Text>
                  <View style={bs.codeActions}>
                    <TouchableOpacity testID={`edit-code-${c.id || c.code}`} style={bs.actionBtn} onPress={() => openEditCode(c)}>
                      <Ionicons name="create-outline" size={14} color={Colors.primary} /><Text style={[bs.actionBtnT, { color: Colors.primary }]}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity testID={`toggle-code-${c.id || c.code}`} style={bs.actionBtn} onPress={() => toggleCode(c.id || c.code)}>
                      <Ionicons name={c.active ? 'pause-circle-outline' : 'play-circle-outline'} size={14} color={c.active ? '#FF9800' : Colors.success} />
                      <Text style={[bs.actionBtnT, { color: c.active ? '#FF9800' : Colors.success }]}>{c.active ? 'Desactiver' : 'Activer'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity testID={`delete-code-${c.id || c.code}`} style={bs.actionBtn} onPress={() => deleteCode(c.id || c.code)}>
                      <Ionicons name="trash-outline" size={14} color={Colors.destructive} /><Text style={[bs.actionBtnT, { color: Colors.destructive }]}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* PRESCRIPTIONS */}
          {tab === 'prescriptions' && prescriptions.map(p => (
            <View key={p.id} style={bs.prescC}>
              <View style={bs.prescTop}>
                <Text style={bs.prescName}>{p.beneficiary_name}</Text>
                <View style={[bs.stBdg, p.status === 'subscribed' && { backgroundColor: Colors.success + '12' }]}>
                  <Text style={[bs.stBdgT, p.status === 'subscribed' && { color: Colors.success }]}>{p.status === 'subscribed' ? 'Souscrit' : 'En attente'}</Text>
                </View>
              </View>
              <Text style={bs.prescMeta}>{p.beneficiary_email} - {p.beneficiary_phone}</Text>
              <Text style={bs.prescMeta}>Par: {p.guardian_name} ({p.prescriber_structure})</Text>
              {p.email_content && (
                <View style={{ marginTop: 6, padding: 8, backgroundColor: Colors.paper, borderRadius: 8, borderWidth: 0.5, borderColor: Colors.border }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: Colors.textMuted, marginBottom: 2 }}>EMAIL ENVOYE</Text>
                  <Text style={{ fontSize: 11, color: Colors.textSecondary }} numberOfLines={3}>{p.email_content.body?.slice(0, 150)}...</Text>
                </View>
              )}
              <View style={bs.prescFoot}>
                <Text style={bs.prescType}>{p.subscription_type}</Text>
                <Text style={bs.prescComm}>+{p.commission}EUR</Text>
              </View>
            </View>
          ))}

          {/* INTERVENTION CODES */}
          {tab === 'interventions' && (
            <>
              <TouchableOpacity testID="create-iv-code-btn" style={bs.createBtn} onPress={openCreateIvCode}>
                <Ionicons name="add" size={18} color={colors.textPrimary} /><Text style={bs.createBtnT}>Creer un code intervenant</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 11, color: Colors.textMuted, marginBottom: 10 }}>Les intervenants activent ce code dans leur profil gardien pour recevoir les interventions d'urgence dans un rayon defini.</Text>
              {interventionCodes.map(c => (
                <View key={c.id || c.code} style={[bs.codeC, !c.active && { opacity: 0.5 }]} testID={`iv-code-card-${c.id || c.code}`}>
                  <View style={bs.codeTop}>
                    <Text style={bs.codeVal}>{c.code}</Text>
                    <View style={[bs.codeBdg, c.active && { backgroundColor: Colors.success + '15' }]}>
                      <Text style={[bs.codeBdgT, c.active && { color: Colors.success }]}>{c.active ? 'Actif' : 'Desactive'}</Text>
                    </View>
                  </View>
                  <Text style={bs.codeSt}>{c.structure_name}</Text>
                  {c.raison_sociale ? <Text style={bs.codeMeta}>{c.raison_sociale}{c.siret ? ` - SIRET: ${c.siret}` : ''}</Text> : null}
                  <Text style={bs.codeMeta}>Rayon: {c.default_radius_km || 30} km - Utilisations: {c.uses_count}/{c.max_uses}</Text>
                  <View style={bs.codeActions}>
                    <TouchableOpacity testID={`edit-iv-code-${c.id || c.code}`} style={bs.actionBtn} onPress={() => openEditIvCode(c)}>
                      <Ionicons name="create-outline" size={14} color={Colors.primary} /><Text style={[bs.actionBtnT, { color: Colors.primary }]}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity testID={`toggle-iv-code-${c.id || c.code}`} style={bs.actionBtn} onPress={() => toggleIvCode(c.id || c.code)}>
                      <Ionicons name={c.active ? 'pause-circle-outline' : 'play-circle-outline'} size={14} color={c.active ? '#FF9800' : Colors.success} />
                      <Text style={[bs.actionBtnT, { color: c.active ? '#FF9800' : Colors.success }]}>{c.active ? 'Desactiver' : 'Activer'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity testID={`delete-iv-code-${c.id || c.code}`} style={bs.actionBtn} onPress={() => deleteIvCode(c.id || c.code)}>
                      <Ionicons name="trash-outline" size={14} color={Colors.destructive} /><Text style={[bs.actionBtnT, { color: Colors.destructive }]}>Supprimer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {interventionCodes.length === 0 && <View style={{ alignItems: 'center', paddingVertical: 20 }}><Text style={{ color: Colors.textMuted, fontSize: 13 }}>Aucun code intervenant</Text></View>}

              <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 16, marginBottom: 8 }}>Intervenants actifs</Text>
              {users.filter((u: any) => u.is_intervention_provider).length > 0 ? users.filter((u: any) => u.is_intervention_provider).map((u: any) => (
                <View key={u.id} style={bs.userR}>
                  <View style={bs.userAv}><Text style={bs.userAvT}>{u.name?.charAt(0)?.toUpperCase()}</Text></View>
                  <View style={bs.userInfo}>
                    <Text style={bs.userName}>{u.name}</Text>
                    <Text style={bs.userEmail}>{u.intervention_structure} - {u.intervention_radius_km || 30}km</Text>
                  </View>
                  <View style={[bs.roleBdg, { borderColor: Colors.success }]}><Text style={[bs.roleBdgT, { color: Colors.success }]}>ACTIF</Text></View>
                </View>
              )) : <Text style={{ color: Colors.textMuted, fontSize: 12 }}>Aucun intervenant inscrit</Text>}
            </>
          )}

          {/* KPI DASHBOARD */}
          {tab === 'kpi' && kpi && (
            <>
              <View style={bs.grid}>
                {[
                  { l: 'Utilisateurs', v: kpi.total_users, c: Colors.primary },
                  { l: 'Alertes totales', v: kpi.total_alerts, c: Colors.destructive },
                  { l: 'Interventions', v: kpi.total_interventions, c: '#FF9800' },
                  { l: 'Abonnes actifs', v: kpi.active_subscriptions, c: Colors.success },
                  { l: 'En attente', v: kpi.pending_subscriptions, c: Colors.textMuted },
                  { l: 'Resolution moy.', v: `${kpi.avg_resolution_minutes}min`, c: Colors.primary },
                ].map(x => (
                  <View key={x.l} style={bs.miniStat}><Text style={[bs.miniStatV, { color: x.c }]}>{x.v}</Text><Text style={bs.miniStatL}>{x.l}</Text></View>
                ))}
              </View>
              <Text style={bs.kpiTitle}>Repartition utilisateurs</Text>
              <View style={bs.kpiChart}>
                {Object.entries(kpi.users_by_role || {}).map(([role, count]: [string, any]) => {
                  const maxVal = Math.max(...Object.values(kpi.users_by_role).map(Number));
                  const pct = maxVal > 0 ? (count / maxVal) * 100 : 0;
                  const roleLabels: any = { beneficiary: 'Beneficiaires', guardian: 'Gardiens', admin: 'Admins', teleassistance: 'Teleassistance' };
                  return (
                    <View key={role} style={bs.kpiBarRow}>
                      <Text style={bs.kpiBarLabel}>{roleLabels[role] || role}</Text>
                      <View style={bs.kpiBarBg}><View style={[bs.kpiBar, { width: `${pct}%`, backgroundColor: Colors.primary }]} /></View>
                      <Text style={bs.kpiBarVal}>{count}</Text>
                    </View>
                  );
                })}
              </View>
              <Text style={bs.kpiTitle}>Types d'alertes</Text>
              <View style={bs.kpiChart}>
                {Object.entries(kpi.alert_types || {}).map(([type, count]: [string, any]) => {
                  const maxVal = Math.max(...Object.values(kpi.alert_types).map(Number));
                  const pct = maxVal > 0 ? (count / maxVal) * 100 : 0;
                  const colors: any = { sos: Colors.destructive, fall: '#FF9800', anomaly: '#9C27B0', inactivity: '#607D8B' };
                  return (
                    <View key={type} style={bs.kpiBarRow}>
                      <Text style={bs.kpiBarLabel}>{type}</Text>
                      <View style={bs.kpiBarBg}><View style={[bs.kpiBar, { width: `${pct}%`, backgroundColor: colors[type] || Colors.primary }]} /></View>
                      <Text style={bs.kpiBarVal}>{count}</Text>
                    </View>
                  );
                })}
              </View>
              <Text style={bs.kpiTitle}>Alertes (7 derniers jours)</Text>
              <View style={bs.miniChart}>
                {(kpi.alerts_by_day || []).slice(-7).map((d: any, i: number) => {
                  const maxD = Math.max(...(kpi.alerts_by_day || []).slice(-7).map((x: any) => x.count), 1);
                  const h = Math.max((d.count / maxD) * 60, 2);
                  return (
                    <View key={i} style={bs.miniChartCol}>
                      <View style={[bs.miniChartBar, { height: h, backgroundColor: d.count > 0 ? Colors.primary : Colors.border }]} />
                      <Text style={bs.miniChartLabel}>{d.date.slice(8)}</Text>
                      <Text style={bs.miniChartVal}>{d.count}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}

        </ScrollView>
      )}

      {/* ===== Activation Code Modal ===== */}
      <Modal visible={showCodeModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={bs.modalO}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={bs.modalO}>
              <TouchableWithoutFeedback>
                <View style={bs.modalC}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={bs.modalT}>{editingCode ? 'Modifier le code' : "Nouveau code d'activation"}</Text>
                    <FormField label="Nom de structure *" value={codeForm.structure_name} onChange={(v) => setCodeForm({ ...codeForm, structure_name: v })} placeholder="Ex: SAAD Aide a Domicile" testId="code-structure" />
                    <FormField label="Max utilisations" value={codeForm.max_uses} onChange={(v) => setCodeForm({ ...codeForm, max_uses: v })} placeholder="50" keyboard="numeric" testId="code-max" />
                    <FormField label="Raison sociale" value={codeForm.raison_sociale} onChange={(v) => setCodeForm({ ...codeForm, raison_sociale: v })} placeholder="Raison sociale" testId="code-raison" />
                    <FormField label="SIRET" value={codeForm.siret} onChange={(v) => setCodeForm({ ...codeForm, siret: v })} placeholder="123 456 789 00012" testId="code-siret" />
                    <FormField label="TVA" value={codeForm.tva} onChange={(v) => setCodeForm({ ...codeForm, tva: v })} placeholder="FR00123456789" testId="code-tva" />
                    <FormField label="Adresse" value={codeForm.adresse} onChange={(v) => setCodeForm({ ...codeForm, adresse: v })} placeholder="Adresse" testId="code-adresse" />
                    <FormField label="Telephone" value={codeForm.telephone} onChange={(v) => setCodeForm({ ...codeForm, telephone: v })} placeholder="+33..." testId="code-phone" />
                    <FormField label="Email contact" value={codeForm.email_contact} onChange={(v) => setCodeForm({ ...codeForm, email_contact: v })} placeholder="contact@..." testId="code-email" />
                    <View style={bs.modalBtns}>
                      <TouchableOpacity style={bs.cancelBtn} onPress={() => setShowCodeModal(false)}><Text style={bs.cancelBtnT}>Annuler</Text></TouchableOpacity>
                      <TouchableOpacity testID="confirm-code-btn" style={bs.confirmBtn} onPress={saveCode} disabled={creating}>
                        {creating ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={bs.confirmBtnT}>{editingCode ? 'Enregistrer' : 'Creer'}</Text>}
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===== Intervention Code Modal ===== */}
      <Modal visible={showIvCodeModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={bs.modalO}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={bs.modalO}>
              <TouchableWithoutFeedback>
                <View style={bs.modalC}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={bs.modalT}>{editingIvCode ? 'Modifier le code' : 'Nouveau code intervenant'}</Text>
                    <FormField label="Nom de structure *" value={ivForm.structure_name} onChange={(v) => setIvForm({ ...ivForm, structure_name: v })} placeholder="Ex: Ambulances du Sud" testId="iv-structure" />
                    <FormField label="Rayon d'intervention (km)" value={ivForm.radius_km} onChange={(v) => setIvForm({ ...ivForm, radius_km: v })} placeholder="30" keyboard="numeric" testId="iv-radius" />
                    <FormField label="Max utilisations" value={ivForm.max_uses} onChange={(v) => setIvForm({ ...ivForm, max_uses: v })} placeholder="50" keyboard="numeric" testId="iv-max" />
                    <FormField label="Raison sociale" value={ivForm.raison_sociale} onChange={(v) => setIvForm({ ...ivForm, raison_sociale: v })} placeholder="Raison sociale" testId="iv-raison" />
                    <FormField label="SIRET" value={ivForm.siret} onChange={(v) => setIvForm({ ...ivForm, siret: v })} placeholder="123 456 789 00012" testId="iv-siret" />
                    <FormField label="Adresse" value={ivForm.adresse} onChange={(v) => setIvForm({ ...ivForm, adresse: v })} placeholder="Adresse" testId="iv-adresse" />
                    <FormField label="Telephone" value={ivForm.telephone} onChange={(v) => setIvForm({ ...ivForm, telephone: v })} placeholder="+33..." testId="iv-phone" />
                    <FormField label="Email contact" value={ivForm.email_contact} onChange={(v) => setIvForm({ ...ivForm, email_contact: v })} placeholder="contact@..." testId="iv-email" />
                    <View style={bs.modalBtns}>
                      <TouchableOpacity style={bs.cancelBtn} onPress={() => setShowIvCodeModal(false)}><Text style={bs.cancelBtnT}>Annuler</Text></TouchableOpacity>
                      <TouchableOpacity testID="confirm-iv-code-btn" style={bs.confirmBtn} onPress={saveIvCode} disabled={creating}>
                        {creating ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={bs.confirmBtnT}>{editingIvCode ? 'Enregistrer' : 'Creer'}</Text>}
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

      {/* ===== Subscription Modal ===== */}
      <Modal visible={showSubModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={bs.modalO}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={bs.modalO}>
              <TouchableWithoutFeedback>
                <View style={bs.modalC}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={bs.modalT}>Nouvel abonnement</Text>
                    <FormField label="Telephone du beneficiaire *" value={subForm.beneficiary_phone} onChange={(v) => setSubForm({ ...subForm, beneficiary_phone: v })} placeholder="+33 6 12 34 56 78" keyboard="phone-pad" testId="sub-phone" />
                    <Text style={bs.inputL}>Type d'abonnement</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                      {[{ id: 'standard', label: 'Standard', desc: 'Bracelet + App' }, { id: 'care', label: 'Care', desc: 'Standard + Teleassistance' }].map(t => (
                        <TouchableOpacity key={t.id} testID={`sub-type-${t.id}`}
                          style={[{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: subForm.subscription_type === t.id ? (t.id === 'care' ? '#9C27B0' : Colors.primary) : Colors.border, backgroundColor: subForm.subscription_type === t.id ? (t.id === 'care' ? '#9C27B0' + '08' : Colors.primary + '08') : Colors.subtle, alignItems: 'center' }]}
                          onPress={() => setSubForm({ ...subForm, subscription_type: t.id })}>
                          <Text style={{ fontSize: 16, fontWeight: '700', color: subForm.subscription_type === t.id ? (t.id === 'care' ? '#9C27B0' : Colors.primary) : Colors.textSecondary }}>{t.label}</Text>
                          <Text style={{ fontSize: 10, color: Colors.textMuted, marginTop: 2 }}>{t.desc}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <FormField label="Notes" value={subForm.notes} onChange={(v) => setSubForm({ ...subForm, notes: v })} placeholder="Notes optionnelles" testId="sub-notes" />
                    <View style={bs.modalBtns}>
                      <TouchableOpacity style={bs.cancelBtn} onPress={() => setShowSubModal(false)}><Text style={bs.cancelBtnT}>Annuler</Text></TouchableOpacity>
                      <TouchableOpacity testID="confirm-sub-btn" style={bs.confirmBtn} onPress={saveSub} disabled={creating}>
                        {creating ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={bs.confirmBtnT}>Creer</Text>}
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function FormField({ label, value, onChange, placeholder, keyboard, testId }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; keyboard?: string; testId?: string }) {
  return (
    <>
      <Text style={bs.inputL}>{label}</Text>
      <TextInput testID={testId} style={bs.modalInp} placeholder={placeholder} placeholderTextColor={Colors.textMuted}
        value={value} onChangeText={onChange} keyboardType={keyboard as any || 'default'} blurOnSubmit={false} />
    </>
  );
}

const bs = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.subtle, justifyContent: 'center', alignItems: 'center' },
  topTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  tabScroll: { maxHeight: 40, marginBottom: 8 },
  tabScrollC: { paddingHorizontal: 16, gap: 6 },
  tabBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: Colors.subtle },
  tabBtnA: { backgroundColor: Colors.primary },
  tabBtnT: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  tabBtnTA: { color: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sc: { paddingHorizontal: 20, paddingBottom: 30 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statC: { width: '47%', backgroundColor: Colors.subtle, borderRadius: 12, padding: 14, alignItems: 'center', gap: 2 },
  statV: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
  statL: { fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 },
  userR: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.subtle, borderRadius: 10, padding: 10, marginBottom: 5, gap: 8 },
  userAv: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  userAvT: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  userInfo: { flex: 1 },
  userName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  userEmail: { fontSize: 11, color: Colors.textMuted },
  prescTag: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary, marginTop: 2 },
  roleBdg: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: Colors.border },
  roleBdgT: { fontSize: 9, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase' },
  alertR: { backgroundColor: Colors.subtle, borderRadius: 10, padding: 10, marginBottom: 5, borderLeftWidth: 3, borderLeftColor: Colors.border, flexDirection: 'row', alignItems: 'center', gap: 6 },
  alertI: { flex: 1 },
  alertM: { fontSize: 12, fontWeight: '500', color: Colors.textPrimary },
  alertMt: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },
  stBdg: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: Colors.subtle },
  stBdgT: { fontSize: 9, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12, marginBottom: 16 },
  createBtnT: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  codeC: { backgroundColor: Colors.subtle, borderRadius: 12, padding: 14, marginBottom: 8 },
  codeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  codeVal: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  codeBdg: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: Colors.subtle },
  codeBdgT: { fontSize: 10, fontWeight: '700', color: Colors.textMuted },
  codeSt: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  codeMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  codeActions: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: Colors.border },
  actionBtnT: { fontSize: 11, fontWeight: '600' },
  prescC: { backgroundColor: Colors.subtle, borderRadius: 12, padding: 12, marginBottom: 6 },
  prescTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  prescName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  prescMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  prescFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  prescType: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  prescComm: { fontSize: 14, fontWeight: '700', color: Colors.success },
  modalO: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalC: { backgroundColor: Colors.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, maxHeight: '85%' },
  modalT: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  inputL: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalInp: { backgroundColor: Colors.subtle, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.textPrimary, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.subtle, alignItems: 'center' },
  cancelBtnT: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  confirmBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' },
  confirmBtnT: { fontSize: 15, fontWeight: '600', color: '#FFF' },
  miniStat: { width: '31%', backgroundColor: Colors.subtle, borderRadius: 10, padding: 12, alignItems: 'center' },
  miniStatV: { fontSize: 22, fontWeight: '800' },
  miniStatL: { fontSize: 9, color: Colors.textMuted, marginTop: 2, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.3 },
  kpiTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 20, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  kpiChart: { backgroundColor: Colors.subtle, borderRadius: 12, padding: 14, gap: 10 },
  kpiBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kpiBarLabel: { width: 90, fontSize: 11, color: Colors.textSecondary, textAlign: 'right' },
  kpiBarBg: { flex: 1, height: 14, backgroundColor: Colors.border, borderRadius: 7, overflow: 'hidden' },
  kpiBar: { height: '100%', borderRadius: 7 },
  kpiBarVal: { width: 30, fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  miniChart: { flexDirection: 'row', backgroundColor: Colors.subtle, borderRadius: 12, padding: 14, gap: 4, alignItems: 'flex-end', justifyContent: 'space-between', height: 120 },
  miniChartCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  miniChartBar: { width: '80%', borderRadius: 4 },
  miniChartLabel: { fontSize: 9, color: Colors.textMuted },
  miniChartVal: { fontSize: 10, fontWeight: '700', color: Colors.textPrimary },
});
