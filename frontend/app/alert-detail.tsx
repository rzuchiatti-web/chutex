import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 8px 32px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(255,255,255,0.6)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 18, marginBottom: 12, ...glass }, style]}>{children}</View>
);

const STATUS_COLORS: Record<string, string> = {
  active: '#E53935', resolved: '#4CAF50', pending: '#FF9800',
  in_progress: '#2196F3', ai_calling: '#9C27B0', dispatched: '#FF5722',
  guardian_handling: '#00BCD4', manual_control: '#FF9800',
  intervention_dispatched: '#E91E63', intervenant_en_route: '#009688',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active', resolved: 'Resolue', pending: 'En attente',
  in_progress: 'En cours', ai_calling: 'Appel IA', dispatched: 'Dispatch',
  guardian_handling: 'Gardien en charge', manual_control: 'Controle manuel',
  intervention_dispatched: 'Intervention envoyee', intervenant_en_route: 'Intervenant en route',
};

export default function AlertDetailScreen() {
  const { token, user } = useAuth();
  const router = useRouter();
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [callLoading, setCallLoading] = useState('');
  const [escalating, setEscalating] = useState(false);

  const fetchData = useCallback(async () => {
    try { setData(await apiFetch(`/api/alerts/${alertId}/detail`, {}, token)); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, [alertId, token]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const t = setInterval(fetchData, 5000); return () => clearInterval(t); }, [fetchData]);

  const generateAISummary = async () => {
    setAiLoading(true);
    try {
      const r = await apiFetch('/api/ai/protocol-summary', { method: 'POST', body: JSON.stringify({ alert_id: alertId }) }, token);
      setAiSummary(r.summary);
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setAiLoading(false); }
  };

  const callBeneficiary = async () => {
    setCallLoading('beneficiary');
    try {
      await apiFetch('/api/twilio/call/beneficiary', { method: 'POST', body: JSON.stringify({ alert_id: alertId }) }, token);
      Alert.alert('Appel lance', 'Appel IA ElevenLabs au beneficiaire avec reconnaissance vocale.');
      fetchData();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setCallLoading(''); }
  };

  const callGuardian = async (guardianId: string, phone: string) => {
    setCallLoading(guardianId);
    try {
      await apiFetch('/api/twilio/call/guardian', { method: 'POST', body: JSON.stringify({ alert_id: alertId, guardian_id: guardianId, phone_number: phone }) }, token);
      Alert.alert('Appel lance', 'Appel ElevenLabs au gardien.');
      fetchData();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setCallLoading(''); }
  };

  const startEscalation = async () => {
    setEscalating(true);
    try {
      await apiFetch('/api/teleassistance/escalation/start', { method: 'POST', body: JSON.stringify({ alert_id: alertId }) }, token);
      Alert.alert('Escalade lancee', 'Le protocole d\'escalade automatique est en cours.');
      fetchData();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setEscalating(false); }
  };

  const resolveAlert = async () => {
    try {
      await apiFetch(`/api/alerts/${alertId}/resolve`, { method: 'PUT' }, token);
      Alert.alert('Alerte resolue');
      fetchData();
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0EB', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#000" /></SafeAreaView>;
  if (!data) return <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0EB', justifyContent: 'center', alignItems: 'center' }}><Text>Erreur</Text></SafeAreaView>;

  const a = data.alert;
  const ben = data.beneficiary;
  const taStatus = a.teleassistance_status || 'pending';
  const taColor = STATUS_COLORS[taStatus] || '#888';
  const isOperator = user?.role === 'teleassistance' || user?.role === 'admin';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0EB' }} testID="alert-detail-screen">
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.5)', justifyContent: 'center', alignItems: 'center', ...glass }}>
          <Ionicons name="chevron-back" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '900', color: '#000', textAlign: 'center' }}>Fiche alerte</Text>
        <View style={{ backgroundColor: (a.status === 'active' ? '#E53935' : '#4CAF50') + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 }}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: a.status === 'active' ? '#E53935' : '#4CAF50', textTransform: 'uppercase' }}>{a.status === 'active' ? 'Active' : 'Resolue'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />} showsVerticalScrollIndicator={false}>
        {/* Alert Header */}
        <GlassCard style={{ borderLeftWidth: 4, borderLeftColor: a.severity === 'critical' ? '#E53935' : a.severity === 'high' ? '#FF9800' : '#000' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: (a.severity === 'critical' ? '#E53935' : '#FF9800') + '15', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name={a.alert_type === 'sos' ? 'alert-circle' : 'warning'} size={24} color={a.severity === 'critical' ? '#E53935' : '#FF9800'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#000' }}>{a.alert_type === 'sos' ? 'SOS' : a.alert_type === 'fall' ? 'Chute' : 'Anomalie'}</Text>
              <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{a.severity === 'critical' ? 'Critique' : a.severity === 'high' ? 'Eleve' : 'Moyen'} - {new Date(a.created_at).toLocaleString('fr-FR')}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 14, color: '#555', lineHeight: 20, marginTop: 10 }}>{a.message}</Text>

          {/* Teleassistance Status */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 10, backgroundColor: taColor + '10', borderRadius: 12 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: taColor }} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: taColor, flex: 1 }}>{STATUS_LABELS[taStatus] || taStatus}</Text>
            <Text style={{ fontSize: 10, color: '#888' }}>Protocole IA</Text>
          </View>
        </GlassCard>

        {/* Beneficiary */}
        {ben && (
          <GlassCard>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>BENEFICIAIRE</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#E1F5FE', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '800' }}>{ben.name?.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#000' }}>{ben.name}</Text>
                <Text style={{ fontSize: 12, color: '#888' }}>{ben.phone || ben.email}</Text>
              </View>
            </View>
            {ben.medical_conditions && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, padding: 8, backgroundColor: 'rgba(229,57,53,0.06)', borderRadius: 10 }}>
                <Ionicons name="medkit" size={14} color="#E53935" />
                <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>{ben.medical_conditions}</Text>
              </View>
            )}
            {ben.allergies && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, padding: 8, backgroundColor: 'rgba(255,152,0,0.06)', borderRadius: 10 }}>
                <Ionicons name="warning" size={14} color="#FF9800" />
                <Text style={{ fontSize: 11, color: '#555', flex: 1 }}>Allergies: {ben.allergies}</Text>
              </View>
            )}
          </GlassCard>
        )}

        {/* Operator Actions */}
        {isOperator && a.status === 'active' && (
          <GlassCard style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>ACTIONS OPERATEUR</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <TouchableOpacity testID="call-beneficiary-btn" style={{ flex: 1, backgroundColor: '#000', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }} onPress={callBeneficiary} disabled={callLoading === 'beneficiary'}>
                {callLoading === 'beneficiary' ? <ActivityIndicator color="#FFF" size="small" /> : (
                  <><Ionicons name="call" size={16} color="#FFF" /><Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>APPELER IA</Text></>
                )}
              </TouchableOpacity>
              <TouchableOpacity testID="start-escalation-btn" style={{ flex: 1, backgroundColor: '#E53935', borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }} onPress={startEscalation} disabled={escalating}>
                {escalating ? <ActivityIndicator color="#FFF" size="small" /> : (
                  <><Ionicons name="git-branch" size={16} color="#FFF" /><Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>ESCALADER</Text></>
                )}
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity testID="resolve-alert-btn" style={{ flex: 1, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 2, borderColor: '#4CAF50' }} onPress={resolveAlert}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={{ color: '#4CAF50', fontSize: 12, fontWeight: '800' }}>CLOTURER</Text>
              </TouchableOpacity>
              <TouchableOpacity testID="ai-summary-btn" style={{ flex: 1, borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 2, borderColor: '#000' }} onPress={generateAISummary} disabled={aiLoading}>
                {aiLoading ? <ActivityIndicator color="#000" size="small" /> : (
                  <><Ionicons name="sparkles" size={16} color="#000" /><Text style={{ color: '#000', fontSize: 12, fontWeight: '800' }}>SYNTHESE IA</Text></>
                )}
              </TouchableOpacity>
            </View>
          </GlassCard>
        )}

        {/* Guardian Quick Calls */}
        {isOperator && a.status === 'active' && data.guardians?.length > 0 && (
          <GlassCard>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>APPELER UN GARDIEN</Text>
            {data.guardians.map((g: any) => (
              <TouchableOpacity key={g.id} testID={`call-guardian-${g.id}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}
                onPress={() => callGuardian(g.id, g.phone)} disabled={callLoading === g.id}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFD54F', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '800' }}>{g.name?.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#000' }}>{g.name}</Text>
                  <Text style={{ fontSize: 11, color: '#888' }}>{g.phone}</Text>
                </View>
                {callLoading === g.id ? <ActivityIndicator size="small" color="#000" /> : (
                  <View style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 6, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="call" size={12} color="#FFF" />
                    <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>APPELER</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </GlassCard>
        )}

        {/* AI Summary */}
        {aiSummary ? (
          <GlassCard style={{ backgroundColor: 'rgba(156,39,176,0.04)', borderLeftWidth: 4, borderLeftColor: '#9C27B0' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Ionicons name="sparkles" size={16} color="#9C27B0" />
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#9C27B0' }}>Synthese IA du protocole</Text>
            </View>
            <Text style={{ fontSize: 13, color: '#333', lineHeight: 20 }}>{aiSummary}</Text>
          </GlassCard>
        ) : null}

        {/* Timeline */}
        {data.timeline?.length > 0 && (
          <GlassCard>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>TIMELINE DU PROTOCOLE</Text>
            {data.timeline.map((t: any, i: number) => {
              const evColor = t.event === 'resolved' ? '#4CAF50' : t.event === 'alert_created' ? '#E53935' : t.event?.includes('call') ? '#2196F3' : t.event === 'intervention' ? '#FF5722' : '#000';
              const evIcon = t.event === 'resolved' ? 'checkmark-circle' : t.event === 'alert_created' ? 'alert-circle' : t.event?.includes('call') ? 'call' : t.event === 'intervention' ? 'navigate' : 'ellipse';
              return (
                <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: i < data.timeline.length - 1 ? 0 : 0 }}>
                  <View style={{ alignItems: 'center', width: 24 }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: evColor + '15', justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name={evIcon as any} size={10} color={evColor} />
                    </View>
                    {i < data.timeline.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: 'rgba(0,0,0,0.06)', minHeight: 20 }} />}
                  </View>
                  <View style={{ flex: 1, paddingBottom: 12 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#000', lineHeight: 18 }}>{t.detail}</Text>
                    <Text style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{new Date(t.time).toLocaleString('fr-FR')}</Text>
                  </View>
                </View>
              );
            })}
          </GlassCard>
        )}

        {/* Escalations */}
        {data.escalations?.length > 0 && data.escalations.map((esc: any) => (
          <GlassCard key={esc.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: STATUS_COLORS[esc.status] || '#888' }} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1, flex: 1 }}>ESCALADE - {esc.operator_name}</Text>
              <Text style={{ fontSize: 10, fontWeight: '700', color: STATUS_COLORS[esc.status] || '#888', textTransform: 'uppercase' }}>{STATUS_LABELS[esc.status] || esc.status}</Text>
            </View>
            {esc.timeline?.map((t: any, i: number) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4, paddingLeft: 4 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, marginTop: 5, backgroundColor: '#000' }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: '#333', lineHeight: 16 }}>{t.note}</Text>
                  <Text style={{ fontSize: 9, color: '#AAA' }}>{new Date(t.time).toLocaleTimeString('fr-FR')}</Text>
                </View>
              </View>
            ))}
          </GlassCard>
        ))}

        {/* Calls */}
        {data.calls?.length > 0 && (
          <GlassCard>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>APPELS ({data.calls.length})</Text>
            {data.calls.map((c: any) => (
              <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: c.answered ? 'rgba(76,175,80,0.1)' : 'rgba(0,0,0,0.04)', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="call" size={14} color={c.answered ? '#4CAF50' : '#888'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#000' }}>{c.target_name}</Text>
                  <Text style={{ fontSize: 10, color: '#888' }}>
                    {c.target_type === 'beneficiary' ? 'Beneficiaire' : 'Gardien'} - {c.status}
                    {c.voice_engine === 'elevenlabs' ? ' - Voix IA' : ''}
                    {c.input_mode === 'speech' ? ' - Reco. vocale' : ''}
                  </Text>
                  {c.response && <Text style={{ fontSize: 11, color: '#2196F3', fontStyle: 'italic', marginTop: 2 }}>"{c.response}"</Text>}
                  {c.ai_analysis?.summary && <Text style={{ fontSize: 10, color: '#9C27B0', marginTop: 2 }}>IA: {c.ai_analysis.summary}</Text>}
                </View>
                <Text style={{ fontSize: 9, color: '#AAA' }}>{new Date(c.created_at).toLocaleTimeString('fr-FR')}</Text>
              </View>
            ))}
          </GlassCard>
        )}

        {/* Interventions */}
        {data.interventions?.length > 0 && (
          <GlassCard>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>INTERVENTIONS ({data.interventions.length})</Text>
            {data.interventions.map((iv: any) => (
              <TouchableOpacity key={iv.id} testID={`intervention-${iv.id}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}
                onPress={() => router.push({ pathname: '/intervention-detail', params: { interventionId: iv.id } })}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: iv.status === 'completed' ? '#4CAF50' : iv.status === 'in_progress' ? '#2196F3' : '#FF9800' }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#000' }}>{iv.assigned_name || 'Non assigne'} - {iv.structure_name || ''}</Text>
                  <Text style={{ fontSize: 10, color: '#888' }}>{iv.status} - {new Date(iv.created_at).toLocaleString('fr-FR')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#888" />
              </TouchableOpacity>
            ))}
          </GlassCard>
        )}

        {/* Details */}
        <GlassCard>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>DETAILS TECHNIQUES</Text>
          {[
            ['Type', a.alert_type], ['Severite', a.severity], ['Appareil', a.device_type || 'bracelet'],
            ['Date', new Date(a.created_at).toLocaleString('fr-FR')],
            ['Statut TA', STATUS_LABELS[taStatus] || taStatus],
            ...(a.resolved_at ? [['Resolu le', new Date(a.resolved_at).toLocaleString('fr-FR')]] : []),
          ].map(([l, v]) => (
            <View key={l as string} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
              <Text style={{ fontSize: 12, color: '#888' }}>{l}</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#000' }}>{v}</Text>
            </View>
          ))}
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}
