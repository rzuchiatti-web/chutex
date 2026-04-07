import { useI18n } from '../../context/I18nContext';
import { Icon, MCIcon } from '../WebIcon';
import { PhoneInputWithPrefix } from '../PhoneInputWithPrefix';
import FullScreenLoader from '../FullScreenLoader';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal, Linking, Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../services/api';
import { Colors } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';
import { PageExplainer } from '../HelpSystem';
import { confirmAction } from './constants';

function AdminPrescripteurs({ token }: { token: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [codes, setCodes] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [prescribers, setPrescribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCode, setEditCode] = useState<any>(null);
  const [form, setForm] = useState({ structure_name: '', raison_sociale: '', siret: '', tva: '', adresse: '', telephone: '', email_contact: '', max_uses: '50' });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'codes'|'prescribers'|'prescriptions'>('codes');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [c, p, u] = await Promise.all([
        apiFetch('/api/admin/activation-codes', {}, token).catch(() => []),
        apiFetch('/api/backoffice/prescriptions', {}, token).catch(() => []),
        apiFetch('/api/backoffice/users', {}, token).catch(() => []),
      ]);
      setCodes(c); setPrescriptions(p);
      setPrescribers((u || []).filter((usr: any) => usr.is_prescriber));
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveCode = async () => {
    if (!form.structure_name) return Alert.alert(t('error'), 'Nom de structure requis');
    setSaving(true);
    try {
      if (editCode) {
        await apiFetch(`/api/admin/activation-codes/${editCode.id}`, { method: 'PUT', body: JSON.stringify(form) }, token);
        setCodes(codes.map(c => c.id === editCode.id ? { ...c, ...form } : c));
      } else {
        const r = await apiFetch('/api/admin/activation-codes', { method: 'POST', body: JSON.stringify({ ...form, max_uses: parseInt(form.max_uses) || 50 }) }, token);
        setCodes([r, ...codes]);
      }
      setShowModal(false); setEditCode(null);
      setForm({ structure_name: '', raison_sociale: '', siret: '', tva: '', adresse: '', telephone: '', email_contact: '', max_uses: '50' });
    } catch (e: any) { Alert.alert(t('error'), e.message); } finally { setSaving(false); }
  };

  const toggleCode = async (id: string) => {
    try {
      const r = await apiFetch(`/api/admin/activation-codes/${id}/toggle`, { method: 'PUT' }, token);
      setCodes(codes.map(c => c.id === id ? { ...c, active: r.active } : c));
    } catch (e: any) { Alert.alert(t('error'), e.message); }
  };

  const deleteCode = (id: string) => {
    confirmAction(t('delete'), 'Supprimer définitivement ce code prescripteur ?', async () => {
      await apiFetch(`/api/admin/activation-codes/${id}`, { method: 'DELETE' }, token);
      setCodes(codes.filter(c => c.id !== id));
    });
  };

  const openEdit = (c: any) => {
    setEditCode(c);
    setForm({ structure_name: c.structure_name || '', raison_sociale: c.raison_sociale || '', siret: c.siret || '', tva: c.tva || '', adresse: c.adresse || '', telephone: c.telephone || '', email_contact: c.email_contact || '', max_uses: String(c.max_uses || 50) });
    setShowModal(true);
  };

  if (loading) return <FullScreenLoader />;

  const BG_ADM = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/1lq6xl58_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2008_54_55.png';
  if (Platform.OS === 'web') {
    return (
      <div data-testid="admin-prescripteurs" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_ADM} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', padding: '70px 20px 12px', zIndex: 5, textAlign: 'center' } as any}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>Prescripteurs</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{codes.length} codes · {prescribers.length} prescripteurs · {prescriptions.length} souscriptions</div>
          <div style={{ display: 'inline-flex', borderRadius: 999, padding: 3, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', marginTop: 14 } as any}>
            {([['codes', `Codes (${codes.length})`], ['prescribers', `Prescripteurs (${prescribers.length})`], ['prescriptions', `Souscriptions (${prescriptions.length})`]] as const).map(([k, l]) => (
              <div key={k} onClick={() => setTab(k)} style={{ padding: '8px 16px', borderRadius: 999, cursor: 'pointer', background: tab === k ? '#FFF' : 'transparent', color: tab === k ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700 } as any}>{l}</div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '8px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
          {tab === 'codes' && (<>
            <div onClick={() => { setEditCode(null); setForm({ structure_name: '', raison_sociale: '', siret: '', tva: '', adresse: '', telephone: '', email_contact: '', max_uses: '50' }); setShowModal(true); }} style={{ padding: '14px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}><i className="ri-add-circle-line" style={{ fontSize: 16 }} />Créer un code</div>
            {codes.map((c: any) => (<div key={c.id} style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 } as any}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}><div><div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', letterSpacing: 2 }}>{c.code}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{c.structure_name}</div></div><div style={{ display: 'flex', gap: 6 } as any}><div onClick={() => openEdit(c)} style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-edit-line" style={{ fontSize: 14, color: '#FFF' }} /></div><div onClick={() => toggleCode(c.id)} style={{ width: 32, height: 32, borderRadius: 999, background: c.active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className={c.active ? 'ri-toggle-line' : 'ri-toggle-fill'} style={{ fontSize: 14, color: c.active ? '#10B981' : '#EF4444' }} /></div></div></div><div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' } as any} /><div style={{ display: 'flex', gap: 12 } as any}><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{c.current_uses || 0}/{c.max_uses} uses</span><span style={{ fontSize: 11, color: c.active ? '#10B981' : '#EF4444' }}>{c.active ? 'Actif' : 'Désactivé'}</span></div></div>))}
          </>)}
          {tab === 'prescribers' && prescribers.map((p: any) => (<div key={p.id} onClick={() => router.push({ pathname: '/company-prescriber-detail', params: { prescriberId: p.id } })} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8, cursor: 'pointer' } as any}><div style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(212,132,90,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#D4845A' }}>{p.name?.charAt(0)}</span></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{p.name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{p.prescriber_structure || p.structure_name || t('prescriber')}</div></div><i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)' }} /></div>))}
          {tab === 'prescriptions' && prescriptions.map((p: any) => (<div key={p.id} style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 } as any}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}><div><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{p.beneficiary_name || 'Souscription'}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Par {p.prescriber_name} · {p.subscription_type || 'Standard'}</div></div><div style={{ padding: '3px 10px', borderRadius: 999, background: p.status === 'validated' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)' } as any}><span style={{ fontSize: 10, fontWeight: 600, color: p.status === 'validated' ? '#10B981' : '#F59E0B' }}>{p.status === 'validated' ? 'Validee' : t('pending')}</span></div></div></div>))}
        </div>
        {/* Modal */}
        {showModal && (<div onClick={() => setShowModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}><div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '70px 28px 120px', boxSizing: 'border-box' } as any}><div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 14 }}>{editCode ? 'Modifier le code' : 'Nouveau code'}</div>{['structure_name','raison_sociale','siret','adresse','telephone','email_contact','max_uses'].map(k => (<div key={k} style={{ marginBottom: 10 } as any}><div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>{k.replace(/_/g, ' ')}</div><input value={(form as any)[k]} onChange={(e: any) => setForm({...form, [k]: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 14 } as any} /></div>))}<div style={{ display: 'flex', gap: 10, marginTop: 8 } as any}><div onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: 999, textAlign: 'center', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontWeight: 700, cursor: 'pointer' } as any}>Annuler</div><div onClick={saveCode} style={{ flex: 1, padding: '12px', borderRadius: 999, textAlign: 'center', background: '#FFF', color: '#111', fontWeight: 700, cursor: 'pointer' } as any}>{saving ? '...' : t('save')}</div></div></div></div>)}
      </div>
    );
  }

  return (
    <ScrollView style={d.sv} contentContainerStyle={[d.sc, { paddingBottom: 80 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} />}>
      {/* Tabs */}
      <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 3, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
        {([['codes', `Codes (${codes.length})`], ['prescribers', `Prescripteurs (${prescribers.length})`], ['prescriptions', `Souscriptions (${prescriptions.length})`]] as const).map(([k, l]) => (
          <TouchableOpacity key={k} style={[{ flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 }, tab === k && { backgroundColor: '#FFFFFF' }]}
            onPress={() => setTab(k)}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: tab === k ? '#FFF' : '#888' }}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CODES TAB */}
      {tab === 'codes' && <>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>{codes.length} structure(s) prescriptrice(s)</Text>
          <TouchableOpacity testID="add-prescripteur-btn" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
            onPress={() => { setEditCode(null); setForm({ structure_name: '', raison_sociale: '', siret: '', tva: '', adresse: '', telephone: '', email_contact: '', max_uses: '50' }); setShowModal(true); }}>
            <Icon name="add" size={16} color="#111827" /><Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Nouveau code</Text>
          </TouchableOpacity>
        </View>

      {codes.map(c => (
        <View key={c.id} style={[d.deviceCard, !c.active && { opacity: 0.5 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>{c.structure_name}</Text>
              {c.raison_sociale ? <Text style={{ fontSize: 11, color: Colors.textMuted }}>{c.raison_sociale}</Text> : null}
            </View>
            <View style={{ backgroundColor: Colors.subtle, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', letterSpacing: 1, color: Colors.primary }}>{c.code}</Text>
            </View>
          </View>
          {(c.siret || c.tva || c.adresse) && (
            <View style={{ marginTop: 8, gap: 2 }}>
              {c.siret ? <Text style={{ fontSize: 11, color: Colors.textMuted }}>SIRET: {c.siret}</Text> : null}
              {c.tva ? <Text style={{ fontSize: 11, color: Colors.textMuted }}>TVA: {c.tva}</Text> : null}
              {c.adresse ? <Text style={{ fontSize: 11, color: Colors.textMuted }}>{c.adresse}</Text> : null}
              {c.telephone ? <Text style={{ fontSize: 11, color: Colors.textMuted }}>Tél: {c.telephone}</Text> : null}
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 }}>
            <Text style={{ fontSize: 11, color: Colors.textMuted, flex: 1 }}>Utilisations: {c.uses_count}/{c.max_uses} · {c.active ? 'Actif' : 'Désactivé'}</Text>
            <TouchableOpacity onPress={() => openEdit(c)} style={{ padding: 6 }}><Icon name="create-outline" size={16} color={Colors.primary} /></TouchableOpacity>
            <TouchableOpacity onPress={() => toggleCode(c.id)} style={{ padding: 6 }}><Icon name={c.active ? 'pause-circle-outline' : 'play-circle-outline'} size={16} color={c.active ? Colors.textMuted : Colors.success} /></TouchableOpacity>
            <TouchableOpacity onPress={() => deleteCode(c.id)} style={{ padding: 6 }}><Icon name="trash-outline" size={16} color={Colors.destructive} /></TouchableOpacity>
          </View>
        </View>
      ))}
      </>}

      {/* PRESCRIBERS TAB */}
      {tab === 'prescribers' && <>
        {prescribers.map((p: any) => (
          <TouchableOpacity key={p.id} onPress={() => router.push({ pathname: '/admin-client-detail', params: { clientId: p.id } })} activeOpacity={0.7}>
            <View style={d.deviceCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#CE93D8', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFF' }}>{p.name?.charAt(0)?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>{p.name}</Text>
                  <Text style={{ fontSize: 12, color: Colors.textMuted }}>{p.email}</Text>
                  <Text style={{ fontSize: 11, color: '#9C27B0', fontWeight: '600', marginTop: 2 }}>{p.prescriber_structure}</Text>
                </View>
                <Icon name="chevron-forward" size={16} color="#888" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {prescribers.length === 0 && <View style={d.emptyC}><Icon name="medical-outline" size={28} color={Colors.textMuted} /><Text style={d.emptyT}>Aucun prescripteur</Text></View>}
      </>}

      {/* PRESCRIPTIONS TAB */}
      {tab === 'prescriptions' && <>
        {prescriptions.map((p: any) => (
          <TouchableOpacity key={p.id} onPress={() => router.push({ pathname: '/admin-prescription-detail', params: { prescriptionId: p.id } })} activeOpacity={0.7}>
            <View style={d.deviceCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>{p.beneficiary_name}</Text>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: p.status === 'subscribed' ? '#4CAF5015' : '#FF980015' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: p.status === 'subscribed' ? '#4CAF50' : '#FF9800' }}>{p.status === 'subscribed' ? 'ACTIF' : 'EN ATTENTE'}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: Colors.textMuted }}>{p.beneficiary_email} · {p.beneficiary_phone}</Text>
              <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>Par: {p.guardian_name} ({p.prescriber_structure})</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: Colors.textSecondary }}>{p.subscription_type}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.success }}>+{p.commission || getCommission(p)}EUR{commLabel}</Text>
                  <Icon name="chevron-forward" size={14} color="#888" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {prescriptions.length === 0 && <View style={d.emptyC}><Icon name="document-text-outline" size={28} color={Colors.textMuted} /><Text style={d.emptyT}>Aucune souscription</Text></View>}
      </>}

      <Modal visible={showModal} transparent animationType="slide">
        <View style={d.modalO}><View style={d.modalC}>
          <Text style={d.modalT}>{editCode ? 'Modifier la structure' : 'Nouvelle structure prescriptrice'}</Text>
          {[
            { k: 'structure_name', l: 'Nom commercial', p: 'Ex: Résidence Les Oliviers' },
            { k: 'raison_sociale', l: 'Raison sociale', p: 'Ex: SAS Les Oliviers' },
            { k: 'siret', l: t('siret_label'), p: '12345678900000' },
            { k: 'tva', l: 'N° TVA', p: 'FR12345678900' },
            { k: 'adresse', l: t('address'), p: '12 rue des Chênes, 75001 Paris' },
            { k: 'telephone', l: 'Téléphone', p: '+33 1 23 45 67 89' },
            { k: 'email_contact', l: 'Email contact', p: 'contact@structure.fr' },
          ].map(f => (
            <View key={f.k}>
              <Text style={d.inputL}>{f.l}</Text>
              <TextInput style={d.modalInp} placeholder={f.p} placeholderTextColor={Colors.textMuted}
                value={(form as any)[f.k]} onChangeText={(v) => setForm({ ...form, [f.k]: v })} />
            </View>
          ))}
          <View style={d.modalBtns}>
            <TouchableOpacity style={d.cancelBtn} onPress={() => setShowModal(false)}><Text style={d.cancelBtnT}>Annuler</Text></TouchableOpacity>
            <TouchableOpacity style={d.submitBtn} onPress={saveCode} disabled={saving}>
              {saving ? <ActivityIndicator color="#111827" /> : <Text style={d.submitBtnT}>{editCode ? t('modify') : 'Créer'}</Text>}
            </TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </ScrollView>
  );
}


export default AdminPrescripteurs;
