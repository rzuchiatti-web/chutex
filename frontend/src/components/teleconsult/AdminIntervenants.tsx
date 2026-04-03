import { Icon } from '../WebIcon';
import FullScreenLoader from '../FullScreenLoader';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { apiFetch } from '../../services/api';
import { s, confirmAction, BG_VIOLET as BG_ADM_IV } from './teleconsultStyles';

export function AdminIntervenants({ token }: { token: string }) {
  const router = useRouter();
  const [codes, setCodes] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCode, setEditCode] = useState<any>(null);
  const [form, setForm] = useState({ structure_name: '', raison_sociale: '', siret: '', tva: '', adresse: '', telephone: '', email_contact: '', radius_km: '30' });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'codes'|'providers'|'interventions'>('codes');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [c, p, iv] = await Promise.all([
        apiFetch('/api/admin/intervention-codes', {}, token).catch(() => []),
        apiFetch('/api/admin/intervention-providers', {}, token).catch(() => []),
        apiFetch('/api/backoffice/interventions', {}, token).catch(() => []),
      ]);
      setCodes(c); setProviders(p); setInterventions(iv);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveCode = async () => {
    if (!form.structure_name) return Alert.alert('Erreur', 'Nom de structure requis');
    setSaving(true);
    try {
      if (editCode) {
        await apiFetch(`/api/admin/intervention-codes/${editCode.id}`, { method: 'PUT', body: JSON.stringify(form) }, token);
        setCodes(codes.map(c => c.id === editCode.id ? { ...c, ...form } : c));
      } else {
        const r = await apiFetch('/api/admin/intervention-codes', { method: 'POST', body: JSON.stringify({ ...form, radius_km: parseFloat(form.radius_km) || 30 }) }, token);
        setCodes([r, ...codes]);
      }
      setShowModal(false); setEditCode(null);
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSaving(false); }
  };

  const toggleCode = async (id: string) => {
    try {
      const r = await apiFetch(`/api/admin/intervention-codes/${id}/toggle`, { method: 'PUT' }, token);
      setCodes(codes.map(c => c.id === id ? { ...c, active: r.active } : c));
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  const deleteCode = (id: string) => {
    confirmAction('Supprimer', 'Supprimer définitivement ce code intervenant ?', async () => {
      await apiFetch(`/api/admin/intervention-codes/${id}`, { method: 'DELETE' }, token);
      setCodes(codes.filter(c => c.id !== id));
    });
  };

  const openEdit = (c: any) => {
    setEditCode(c);
    setForm({ structure_name: c.structure_name || '', raison_sociale: c.raison_sociale || '', siret: c.siret || '', tva: c.tva || '', adresse: c.adresse || '', telephone: c.telephone || '', email_contact: c.email_contact || '', radius_km: String(c.default_radius_km || 30) });
    setShowModal(true);
  };

  if (loading) return <FullScreenLoader />;

  if (Platform.OS === 'web') {
    const activeIvsAdm = interventions.filter((iv: any) => ['pending_acceptance','in_progress','en_route'].includes(iv.status));
    return (
      <div data-testid="admin-intervenants" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_ADM_IV} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', padding: '24px 20px 14px', zIndex: 5, textAlign: 'center' } as any}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>Intervenants Care</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{codes.length} codes · {providers.length} actifs · {interventions.length} missions</div>
          <div style={{ display: 'inline-flex', borderRadius: 999, padding: 4, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', marginTop: 14 } as any}>
            {([['codes', `Codes (${codes.length})`], ['providers', `Actifs (${providers.length})`], ['interventions', `Missions (${interventions.length})`]] as const).map(([k, l]) => (
              <div key={k} onClick={() => setTab(k)} style={{ padding: '10px 18px', borderRadius: 999, cursor: 'pointer', background: tab === k ? '#FFF' : 'transparent', color: tab === k ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700 } as any}>{l}</div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '0 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
          {tab === 'codes' && (<>
            <div onClick={() => { setEditCode(null); setForm({ structure_name: '', raison_sociale: '', siret: '', tva: '', adresse: '', telephone: '', email_contact: '', radius_km: '30' }); setShowModal(true); }} style={{ padding: '14px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}><i className="ri-add-circle-line" style={{ fontSize: 16 }} />Creer un code</div>
            {codes.map((c: any) => (<div key={c.id} style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 } as any}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}><div><div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', letterSpacing: 2 }}>{c.code}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{c.structure_name}</div></div><div style={{ display: 'flex', gap: 6 } as any}><div onClick={() => openEdit(c)} style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-edit-line" style={{ fontSize: 14, color: '#FFF' }} /></div><div onClick={() => toggleCode(c.id)} style={{ width: 32, height: 32, borderRadius: 999, background: c.active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className={c.active ? 'ri-toggle-line' : 'ri-toggle-fill'} style={{ fontSize: 14, color: c.active ? '#10B981' : '#EF4444' }} /></div></div></div><div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' } as any} /><div style={{ display: 'flex', gap: 12 } as any}><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Rayon: {c.default_radius_km || 30}km</span><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{c.uses_count || 0}/{c.max_uses} uses</span><span style={{ fontSize: 11, color: c.active ? '#10B981' : '#EF4444' }}>{c.active ? 'Actif' : 'Desactive'}</span></div></div>))}
          </>)}
          {tab === 'providers' && providers.map((p: any) => (<div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 } as any}><div style={{ width: 44, height: 44, borderRadius: 999, background: 'linear-gradient(135deg, #7C5CFF, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{p.name?.charAt(0)}</span></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{p.name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{p.intervention_structure || p.structure_name || ''}</div></div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{p.total_interventions || 0} missions</div></div>))}
          {tab === 'interventions' && interventions.map((iv: any) => { const isAct = ['pending_acceptance','in_progress','en_route'].includes(iv.status); return (<div key={iv.id} style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 } as any}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}><div><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{iv.beneficiary_name || 'Intervention'}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{iv.assigned_name || 'En attente'}</div></div><div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: isAct ? 'rgba(124,92,255,0.2)' : 'rgba(16,185,129,0.2)' } as any}><span style={{ width: 5, height: 5, borderRadius: 3, background: isAct ? '#A78BFA' : '#10B981' } as any} /><span style={{ fontSize: 9, fontWeight: 600, color: '#FFF' }}>{isAct ? 'En cours' : 'Terminee'}</span></div></div></div>); })}
        </div>
        {showModal && (<div onClick={() => setShowModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}><div onClick={(e: any) => e.stopPropagation()} className="anim-up" style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '70px 28px 120px', boxSizing: 'border-box' } as any}><div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}><div onClick={() => setShowModal(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div></div><div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Intervenants Care</div><div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 20 }}>{editCode ? 'Modifier' : 'Nouveau code'}</div>{['structure_name','raison_sociale','siret','adresse','telephone','email_contact','radius_km'].map(k => (<div key={k} style={{ marginBottom: 12 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{k.replace(/_/g, ' ')}</div><input value={(form as any)[k]} onChange={(e: any) => setForm({...form, [k]: e.target.value})} style={{ width: '100%', padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 15, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} /></div>))}<div style={{ display: 'flex', gap: 10, marginTop: 16 } as any}><div onClick={() => setShowModal(false)} style={{ flex: 1, padding: '14px', borderRadius: 999, textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 700, cursor: 'pointer' } as any}>Annuler</div><div onClick={saveCode} style={{ flex: 1, padding: '14px', borderRadius: 999, textAlign: 'center', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', fontWeight: 700, cursor: 'pointer' } as any}>{saving ? '...' : 'Enregistrer'}</div></div></div></div>)}
      </div>
    );
  }

  /* NATIVE FALLBACK */
  return (
    <ScrollView contentContainerStyle={[s.sc, { paddingBottom: 80 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} />}>
      <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 3, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
        {([['codes', `Codes (${codes.length})`], ['providers', `Actifs (${providers.length})`], ['interventions', `Missions (${interventions.length})`]] as const).map(([k, l]) => (
          <TouchableOpacity key={k} style={[{ flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 }, tab === k && { backgroundColor: '#FFFFFF' }]}
            onPress={() => setTab(k)}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: tab === k ? '#FFF' : '#888' }}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'codes' && <>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>{codes.length} structure(s)</Text>
          <TouchableOpacity testID="add-intervenant-btn" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
            onPress={() => { setEditCode(null); setForm({ structure_name: '', raison_sociale: '', siret: '', tva: '', adresse: '', telephone: '', email_contact: '', radius_km: '30' }); setShowModal(true); }}>
            <Icon name="add" size={16} color="#111827" /><Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Nouveau code</Text>
          </TouchableOpacity>
        </View>

        {codes.map(c => (
          <View key={c.id} style={[s.ivCard, !c.active && { opacity: 0.5 }]}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={s.ivName}>{c.structure_name}</Text>
                <View style={{ backgroundColor: Colors.subtle, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', letterSpacing: 1, color: Colors.primary }}>{c.code}</Text>
                </View>
              </View>
              {c.raison_sociale ? <Text style={{ fontSize: 11, color: Colors.textMuted }}>{c.raison_sociale}</Text> : null}
              {c.siret ? <Text style={{ fontSize: 10, color: Colors.textMuted }}>SIRET: {c.siret} {c.tva ? `· TVA: ${c.tva}` : ''}</Text> : null}
              <Text style={s.ivSt}>Rayon: {c.default_radius_km || 30}km · {c.uses_count}/{c.max_uses} util. · {c.active ? 'Actif' : 'Desactive'}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <TouchableOpacity onPress={() => openEdit(c)} style={{ padding: 6 }}><Icon name="create-outline" size={16} color={Colors.primary} /></TouchableOpacity>
              <TouchableOpacity onPress={() => toggleCode(c.id)} style={{ padding: 6 }}><Icon name={c.active ? 'pause-circle-outline' : 'play-circle-outline'} size={16} color={c.active ? Colors.textMuted : Colors.success} /></TouchableOpacity>
              <TouchableOpacity onPress={() => deleteCode(c.id)} style={{ padding: 6 }}><Icon name="trash-outline" size={16} color={Colors.destructive} /></TouchableOpacity>
            </View>
          </View>
        ))}
      </>}

      {tab === 'providers' && <>
        {providers.map((p: any) => (
          <TouchableOpacity key={p.user_id || p.id} onPress={() => router.push({ pathname: '/admin-client-detail', params: { clientId: p.user_id || p.id } })} activeOpacity={0.7}>
            <View style={s.ivCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFF' }}>{p.name?.charAt(0)?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.ivName}>{p.name}</Text>
                  <Text style={s.ivSt}>{p.structure_name || p.intervention_structure} · {p.radius_km || p.intervention_radius_km || 30}km</Text>
                  {p.email && <Text style={{ fontSize: 10, color: Colors.textMuted }}>{p.email}</Text>}
                  {p.phone && <Text style={{ fontSize: 10, color: Colors.textMuted }}>{p.phone}</Text>}
                </View>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: '#4CAF5015' }}>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: '#10B981' }}>ACTIF</Text>
                </View>
                <Icon name="chevron-forward" size={16} color="#888" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {providers.length === 0 && <View style={{ alignItems: 'center', paddingVertical: 36 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(76,175,80,0.06)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
            <Icon name="medkit-outline" size={28} color="#A5D6A7" />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Aucun intervenant inscrit</Text>
          <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'center', paddingHorizontal: 20, lineHeight: 18 }}>Creez un code d'intervention dans l'onglet "Codes" pour permettre aux intervenants de s'inscrire.</Text>
        </View>}
      </>}

      {tab === 'interventions' && <>
        {interventions.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {[
              { val: interventions.filter((i: any) => ['pending_acceptance', 'dispatched'].includes(i.status)).length, label: 'En attente', color: '#FF9800' },
              { val: interventions.filter((i: any) => ['in_progress', 'en_route'].includes(i.status)).length, label: 'En cours', color: '#2196F3' },
              { val: interventions.filter((i: any) => i.status === 'completed').length, label: 'Terminees', color: '#10B981' },
            ].map((s, i) => (
              <View key={i} style={{ flex: 1, backgroundColor: '#F0F1F3', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: s.color }}>{s.val}</Text>
                <Text style={{ fontSize: 8, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}
        {interventions.map((iv: any) => {
          const sc: any = { pending_acceptance: '#FF9800', in_progress: '#2196F3', en_route: '#009688', completed: '#4CAF50', dispatched: '#FF5722' };
          const sl: any = { pending_acceptance: 'En attente', in_progress: 'En cours', en_route: 'En route', completed: 'Terminee', dispatched: 'Dispatchee' };
          const statusIcon: any = { pending_acceptance: 'time', in_progress: 'navigate', en_route: 'car', completed: 'checkmark-circle', dispatched: 'send' };
          const isActive = ['pending_acceptance', 'in_progress', 'en_route', 'dispatched'].includes(iv.status);
          return (
            <TouchableOpacity key={iv.id} onPress={() => router.push({ pathname: '/company-intervention-detail', params: { interventionId: iv.id } })} activeOpacity={0.7}
              data-testid={`admin-intervention-${iv.id}`}>
              <View style={{ backgroundColor: '#F0F1F3', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', marginBottom: 12, overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: sc[iv.status] || '#888' }}>
                <View style={{ padding: 16 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 24, backgroundColor: (sc[iv.status] || '#888') + '12', justifyContent: 'center', alignItems: 'center' }}>
                      <Icon name={(statusIcon[iv.status] || 'medical') as any} size={20} color={sc[iv.status] || '#888'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>{iv.beneficiary_name}</Text>
                      <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }} numberOfLines={1}>{iv.alert_message || iv.notes || 'Intervention'}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={{ backgroundColor: (sc[iv.status] || '#888') + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: sc[iv.status] || '#888' }}>{(sl[iv.status] || iv.status).toUpperCase()}</Text>
                      </View>
                    </View>
                  </View>
                  {iv.assigned_name && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, backgroundColor: 'rgba(76,175,80,0.04)', borderRadius: 10, padding: 8 }}>
                      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFF' }}>{iv.assigned_name?.charAt(0)?.toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#2E7D32' }}>{iv.assigned_name}</Text>
                        <Text style={{ fontSize: 10, color: '#6B7280' }}>{iv.structure_name || 'Intervenant'}</Text>
                      </View>
                      {isActive && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />}
                    </View>
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.04)', backgroundColor: 'rgba(0,0,0,0.015)' }}>
                  <Icon name="time-outline" size={12} color="#AAA" />
                  <Text style={{ fontSize: 11, color: '#6B7280', flex: 1 }}>{new Date(iv.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#2196F3' }}>Voir le detail</Text>
                  <Icon name="chevron-forward" size={14} color="#2196F3" />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
        {interventions.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 24 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(33,150,243,0.06)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
              <Icon name="medkit-outline" size={28} color="#90CAF9" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827' }}>Aucune intervention</Text>
            <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'center', paddingHorizontal: 20, lineHeight: 18 }}>
              Les interventions apparaitront ici quand une alerte sera dispatchee a un SAAD partenaire.
            </Text>
          </View>
        )}
      </>}

      <Modal visible={showModal} transparent animationType="slide">
        <View style={s.modalO}><View style={s.modalC}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={s.modalTitle}>{editCode ? 'Modifier la structure' : 'Nouvelle structure d\'intervention'}</Text>
            {[
              { k: 'structure_name', l: 'Nom commercial', p: 'Ex: Ambulances du Sud' },
              { k: 'raison_sociale', l: 'Raison sociale', p: 'Ex: SARL Ambulances du Sud' },
              { k: 'siret', l: 'SIRET', p: '12345678900000' },
              { k: 'tva', l: 'N° TVA', p: 'FR12345678900' },
              { k: 'adresse', l: 'Adresse', p: '12 rue des Chênes, 75001 Paris' },
              { k: 'telephone', l: 'Téléphone', p: '+33 1 23 45 67 89' },
              { k: 'email_contact', l: 'Email contact', p: 'contact@structure.fr' },
              { k: 'radius_km', l: 'Rayon d\'intervention (km)', p: '30' },
            ].map(f => (
              <View key={f.k}>
                <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 8, marginBottom: 2 }}>{f.l}</Text>
                <TextInput style={s.modalInput} placeholder={f.p} placeholderTextColor={Colors.textMuted}
                  value={(form as any)[f.k]} onChangeText={(v: string) => setForm({ ...form, [f.k]: v })} keyboardType={f.k === 'radius_km' ? 'numeric' : 'default'} />
              </View>
            ))}
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}><Text style={{ color: Colors.textMuted, fontWeight: '600' }}>Annuler</Text></TouchableOpacity>
              <TouchableOpacity style={s.confirmBtn} onPress={saveCode} disabled={saving}>
                {saving ? <ActivityIndicator color="#111827" /> : <Text style={{ color: '#FFF', fontWeight: '700' }}>{editCode ? 'Modifier' : 'Créer'}</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View></View>
      </Modal>
    </ScrollView>
  );
}
