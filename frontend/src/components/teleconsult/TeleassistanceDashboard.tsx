import { useI18n } from '../../context/I18nContext';
import { Icon } from '../WebIcon';
import FullScreenLoader from '../FullScreenLoader';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl, Platform } from 'react-native';
import { Colors } from '../../constants/colors';
import { apiFetch } from '../../services/api';
import { s, BG_TA, BG_RED_TA } from './teleconsultStyles';

export function TéléassistanceDashboard({ token }: { token: string }) {
  const { t } = useI18n();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'active'|'all'|'stats'>('active');
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [noteText, setNoteText] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [inc, st] = await Promise.all([
        apiFetch('/api/carewatch/incidents', {}, token).catch(() => []),
        apiFetch('/api/carewatch/stats', {}, token).catch(() => ({})),
      ]);
      setIncidents(Array.isArray(inc) ? inc : []);
      setStats(st);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 5000); return () => clearInterval(t); }, [fetchData]);

  const resolveIncident = async (iid: string) => {
    try {
      await apiFetch(`/api/carewatch/incident/${iid}/resolve`, { method: 'POST', body: JSON.stringify({ motif: 'Cloture operateur' }) }, token);
      Alert.alert('Incident cloture');
      fetchData();
    } catch (e: any) { Alert.alert(t('error'), e.message); }
  };

  const addNote = async (iid: string) => {
    if (!noteText.trim()) return;
    try {
      await apiFetch(`/api/carewatch/incident/${iid}/note`, { method: 'POST', body: JSON.stringify({ note: noteText }) }, token);
      setNoteText(''); fetchData();
    } catch {}
  };

  const activeIncidents = incidents.filter(i => !['RESOLVED', 'FAILED'].includes(i.state));
  const displayed = tab === 'active' ? activeIncidents : tab === 'all' ? incidents : [];

  const stateColor = (st: string) => ({ NEW_ALERT: '#E53935', CALLING_PATIENT: '#FF9800', PATIENT_CONFIRMED_OK: '#4CAF50', PATIENT_NEEDS_HELP: '#E53935', PATIENT_NO_RESPONSE: '#FF5722', CALLING_GUARDIAN_1: '#2196F3', CALLING_GUARDIAN_2: '#2196F3', GUARDIAN_INTERVENTION_ACCEPTED: '#4CAF50', GUARDIAN_UNREACHABLE: '#FF5722', CARE_DISPATCHED: '#9C27B0', RESOLVED: '#4CAF50', FAILED: '#888' }[st] || '#888');
  const stateLabel = (st: string) => ({
    NEW_ALERT: 'Nouvelle alerte', CALLING_PATIENT: 'Appel patient', PATIENT_CONFIRMED_OK: 'Patient OK',
    PATIENT_NEEDS_HELP: 'Patient en detresse', PATIENT_NO_RESPONSE: 'Pas de reponse', PATIENT_AMBIGUOUS: 'Reponse ambigue',
    CALLING_GUARDIAN_1: 'Appel gardien 1', CALLING_GUARDIAN_2: 'Appel gardien 2', CALLING_GUARDIAN_N: 'Appel gardien',
    GUARDIAN_INTERVENTION_ACCEPTED: 'Gardien intervient', GUARDIAN_UNREACHABLE: 'Gardien injoignable',
    CARE_DISPATCHED: 'Care dispatche', RESOLVED: 'Resolu', FAILED: 'Echoue',
  }[st] || st);

  if (loading) return <FullScreenLoader />;

  if (Platform.OS === 'web') {
    return (
      <div data-testid="téléassistance-page" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_TA} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', padding: '70px 20px 14px', zIndex: 5, textAlign: 'center' } as any}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>Téléassistance IA</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Plateau d'ecoute — Protocole d'escalade</div>
          <div style={{ display: 'inline-flex', borderRadius: 999, padding: 4, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', marginTop: 14 } as any}>
            <div onClick={() => setTab('active')} style={{ padding: '10px 20px', borderRadius: 999, cursor: 'pointer', background: tab === 'active' ? '#FFF' : 'transparent', color: tab === 'active' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700 } as any}>En cours ({activeIncidents.length})</div>
            <div onClick={() => setTab('all')} style={{ padding: '10px 20px', borderRadius: 999, cursor: 'pointer', background: tab === 'all' ? '#FFF' : 'transparent', color: tab === 'all' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700 } as any}>Tous ({incidents.length})</div>
            <div onClick={() => setTab('stats')} style={{ padding: '10px 20px', borderRadius: 999, cursor: 'pointer', background: tab === 'stats' ? '#FFF' : 'transparent', color: tab === 'stats' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700 } as any}>Stats</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '0 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
          {stats && <div style={{ display: 'flex', gap: 8, marginBottom: 14 } as any}>{[{ val: activeIncidents.length, label: t('in_progress'), color: activeIncidents.length > 0 ? '#EF4444' : '#10B981' }, { val: stats.resolved_incidents || 0, label: 'Resolus', color: '#10B981' }, { val: stats.care_dispatched || 0, label: 'Dispatches', color: '#A78BFA' }, { val: `${stats.patient_response_rate || 0}%`, label: 'Reponse', color: '#3B82F6' }].map((st2, i) => (<div key={i} style={{ flex: 1, padding: '12px 8px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' } as any}><div style={{ fontSize: 22, fontWeight: 900, color: st2.color }}>{st2.val}</div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>{st2.label}</div></div>))}</div>}
          {tab === 'stats' && stats && <div style={{ padding: '16px 18px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } as any}><div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Statistiques</div>{[{ l: 'Temps moyen resolution', v: stats.avg_resolution_time || '-' }, { l: 'Taux reponse patient', v: `${stats.patient_response_rate || 0}%` }, { l: 'Interventions Care', v: stats.care_dispatched || 0 }, { l: 'Incidents resolus', v: stats.resolved_incidents || 0 }].map((item, i) => (<div key={i}>{i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' } as any} />}<div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{item.l}</div><div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{item.v}</div></div>))}</div>}
          {tab !== 'stats' && displayed.map((inc: any) => { const isAct = !['RESOLVED','FAILED'].includes(inc.state); return (
            <div key={inc.id} onClick={() => setSelectedIncident(selectedIncident?.id === inc.id ? null : inc)} style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', padding: '16px', marginBottom: 10, cursor: 'pointer' } as any}>{isAct && <img src={BG_RED_TA} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />}{!isAct && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.04)', zIndex: 0 } as any} />}<div style={{ position: 'absolute', inset: 0, background: isAct ? 'rgba(0,0,0,0.2)' : 'transparent', zIndex: 1 } as any} /><div style={{ position: 'relative', zIndex: 2 } as any}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 } as any}><div><div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{inc.beneficiary_name || 'Incident'}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{new Date(inc.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</div></div><div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: `${stateColor(inc.state)}30`, flexShrink: 0 } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: stateColor(inc.state) } as any} /><span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>{stateLabel(inc.state)}</span></div></div>{inc.care_provider && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Care: {inc.care_provider}</div>}{selectedIncident?.id === inc.id && (<div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)' } as any}>{inc.timeline?.map((t: any, ti: number) => (<div key={ti} style={{ display: 'flex', gap: 8, marginBottom: 6 } as any}><div style={{ width: 6, height: 6, borderRadius: 3, background: stateColor(t.state || 'RESOLVED'), marginTop: 5, flexShrink: 0 } as any} /><div><div style={{ fontSize: 11, fontWeight: 600, color: '#FFF' }}>{t.note || stateLabel(t.state || '')}</div><div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{new Date(t.time).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div></div></div>))}{isAct && <div onClick={(e: any) => { e.stopPropagation(); resolveIncident(inc.id); }} style={{ padding: '12px', borderRadius: 999, textAlign: 'center', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 8 } as any}>Cloturer</div>}</div>)}</div></div>
          ); })}
          {tab !== 'stats' && displayed.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px' } as any}><i className="ri-headphone-line" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)' }} /><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginTop: 10 }}>Aucun incident</div></div>}
        </div>
      </div>
    );
  }

  /* NATIVE FALLBACK */
  return (
    <ScrollView contentContainerStyle={[s.sc, { paddingBottom: 80 }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}>
      <Text style={{ fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 4 }}>Plateau d'ecoute IA</Text>
      <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>CARE WATCH - Téléassistance automatisee</Text>

      {stats && (
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {[
            { val: activeIncidents.length, label: t('in_progress'), color: activeIncidents.length > 0 ? '#E53935' : '#4CAF50' },
            { val: stats.resolved_incidents || 0, label: 'Resolus', color: '#10B981' },
            { val: stats.care_dispatched || 0, label: 'Dispatches', color: '#9C27B0' },
            { val: `${stats.patient_response_rate || 0}%`, label: 'Reponse', color: '#2196F3' },
          ].map((s, i) => (
            <View key={i} style={{ flex: 1, backgroundColor: '#F0F1F3', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: s.color }}>{s.val}</Text>
              <Text style={{ fontSize: 8, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 3, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
        {[
          { key: 'active', label: `En cours (${activeIncidents.length})` },
          { key: 'all', label: `Historique (${incidents.length})` },
        ].map(t => (
          <TouchableOpacity key={t.key} style={[{ flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 }, tab === t.key && { backgroundColor: '#FFFFFF' }]}
            onPress={() => setTab(t.key as any)}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: tab === t.key ? '#FFF' : '#888' }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedIncident && (
        <View style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: stateColor(selectedIncident.state) + '40' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#111827' }}>Incident #{selectedIncident.id?.slice(0, 8)}</Text>
            <TouchableOpacity onPress={() => setSelectedIncident(null)}><Icon name="close-circle" size={24} color="#888" /></TouchableOpacity>
          </View>
          <View style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Bénéficiaire</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>{selectedIncident.beneficiary_name}</Text>
            <Text style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{selectedIncident.beneficiary_phone}</Text>
            {selectedIncident.beneficiary_address && <Text style={{ fontSize: 11, color: '#555' }}>{selectedIncident.beneficiary_address}</Text>}
            {selectedIncident.beneficiary_medical && <Text style={{ fontSize: 10, color: '#E53935', marginTop: 4 }}>Pathologies: {selectedIncident.beneficiary_medical}</Text>}
          </View>
          {selectedIncident.transcriptions?.length > 0 && (
            <View style={{ marginBottom: 10 }}>
              <Text style={{ fontSize: 9, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Transcriptions</Text>
              {selectedIncident.transcriptions.map((t: any, i: number) => (
                <View key={i} style={{ backgroundColor: t.type === 'patient' ? 'rgba(33,150,243,0.06)' : 'rgba(255,152,0,0.06)', borderRadius: 10, padding: 10, marginBottom: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: t.type === 'patient' ? '#1565C0' : '#E65100' }}>{t.type === 'patient' ? 'Patient' : `Gardien ${t.guardian_name || ''}`}</Text>
                  <Text style={{ fontSize: 12, color: '#111827', fontStyle: 'italic', marginTop: 2 }}>"{t.text}"</Text>
                  {t.classification && <Text style={{ fontSize: 9, color: '#6B7280', marginTop: 2 }}>Intent: {t.classification.intent} ({(t.classification.confidence * 100).toFixed(0)}%)</Text>}
                </View>
              ))}
            </View>
          )}
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Timeline</Text>
            {selectedIncident.timeline?.slice(-8).map((t: any, i: number) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: stateColor(t.state), marginTop: 5 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: '#111827' }}>{t.detail?.slice(0, 100)}</Text>
                  <Text style={{ fontSize: 9, color: '#9CA3AF' }}>{new Date(t.timestamp).toLocaleTimeString('fr-FR')}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            <TextInput style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 10, padding: 10, fontSize: 12 }}
              placeholder="Note operateur..." value={noteText} onChangeText={setNoteText} />
            <TouchableOpacity style={{ backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' }}
              onPress={() => addNote(selectedIncident.id)}>
              <Icon name="send" size={14} color="#111827" />
            </TouchableOpacity>
          </View>
          {!['RESOLVED', 'FAILED'].includes(selectedIncident.state) && (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#10B981', borderRadius: 9999, paddingVertical: 12, alignItems: 'center' }}
                onPress={() => { resolveIncident(selectedIncident.id); setSelectedIncident(null); }}>
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>CLOTURER</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {displayed.length > 0 ? displayed.map(inc => (
        <TouchableOpacity key={inc.id} testID={`incident-${inc.id}`} onPress={() => setSelectedIncident(inc)}>
          <View style={{ backgroundColor: '#F0F1F3', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', marginBottom: 10, overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: stateColor(inc.state) }}>
            <View style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: stateColor(inc.state) + '15', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon name={inc.state.includes('CALLING') ? 'call' : inc.state === 'RESOLVED' ? 'checkmark' : inc.state === 'CARE_DISPATCHED' ? 'navigate' : 'alert-circle'} size={16} color={stateColor(inc.state)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }}>{inc.beneficiary_name}</Text>
                  <Text style={{ fontSize: 10, color: '#6B7280' }}>{inc.alert_type?.toUpperCase()} - {new Date(inc.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={{ backgroundColor: stateColor(inc.state) + '15', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ fontSize: 8, fontWeight: '800', color: stateColor(inc.state), textTransform: 'uppercase' }}>{stateLabel(inc.state)}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: '#555', marginTop: 6 }}>{inc.alert_message?.slice(0, 80)}</Text>
              {inc.care_provider && <Text style={{ fontSize: 10, color: '#9C27B0', fontWeight: '600', marginTop: 4 }}>Care: {inc.care_provider}</Text>}
              {inc.assigned_guardian && <Text style={{ fontSize: 10, color: '#10B981', fontWeight: '600', marginTop: 4 }}>Gardien: {inc.assigned_guardian.name}</Text>}
              {inc.guardians_contacted?.length > 0 && (
                <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
                  {inc.guardians_contacted.map((g: any, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: g.answered ? 'rgba(76,175,80,0.1)' : 'rgba(0,0,0,0.04)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Icon name={g.answered ? 'checkmark-circle' : 'close-circle'} size={10} color={g.answered ? '#4CAF50' : '#888'} />
                      <Text style={{ fontSize: 9, color: g.answered ? '#4CAF50' : '#888' }}>{g.name?.split(' ')[0]}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      )) : (
        <View style={{ alignItems: 'center', paddingVertical: 40, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 18 }}>
          <Icon name="checkmark-circle-outline" size={40} color="#CCC" />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280', marginTop: 10 }}>{tab === 'active' ? 'Aucun incident en cours' : 'Aucun historique'}</Text>
        </View>
      )}
    </ScrollView>);
}
