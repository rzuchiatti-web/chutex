import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { apiFetch } from '../src/services/api';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 18, marginBottom: 12, ...glass }, style]}>{children}</View>
);

export default function InterventionDetailScreen() {
  const { colors } = useTheme();
  const { interventionId } = useLocalSearchParams<{ interventionId: string }>();
  const { token, user } = useAuth();
  const router = useRouter();
  const [iv, setIv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [showQCM, setShowQCM] = useState(false);
  const [qcmQuestions, setQcmQuestions] = useState<any[]>([]);
  const [qcmAnswers, setQcmAnswers] = useState<Record<string, string>>({});
  const [closeNotes, setCloseNotes] = useState('');
  const [closing, setClosing] = useState(false);

  const fetchIntervention = useCallback(async () => {
    try { setIv(await apiFetch(`/api/intervention/${interventionId}`, {}, token)); }
    catch {} finally { setLoading(false); }
  }, [interventionId, token]);

  useEffect(() => { fetchIntervention(); }, [fetchIntervention]);
  useEffect(() => { const t = setInterval(fetchIntervention, 5000); return () => clearInterval(t); }, [fetchIntervention]);

  const acceptIntervention = async () => {
    setAccepting(true);
    try {
      await apiFetch('/api/intervention/accept', { method: 'POST', body: JSON.stringify({ intervention_id: interventionId }) }, token);
      fetchIntervention();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setAccepting(false); }
  };

  const openCloseQCM = async () => {
    try {
      const qs = await apiFetch('/api/intervention/close-qcm', {}, token);
      setQcmQuestions(qs);
      setShowQCM(true);
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  const closeIntervention = async () => {
    const unanswered = qcmQuestions.filter(q => !qcmAnswers[q.id]);
    if (unanswered.length > 0) return Alert.alert('Incomplet', `Veuillez repondre a toutes les questions (${unanswered.length} manquante(s))`);
    setClosing(true);
    try {
      const answers = qcmQuestions.map(q => ({ question_id: q.id, question: q.question, answer: qcmAnswers[q.id] }));
      await apiFetch('/api/intervention/close', { method: 'POST', body: JSON.stringify({ intervention_id: interventionId, answers, notes: closeNotes }) }, token);
      Alert.alert('Intervention cloturee', 'Le compte-rendu a ete enregistre.');
      setShowQCM(false);
      fetchIntervention();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setClosing(false); }
  };

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#FFF" /></SafeAreaView>;
  if (!iv) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,0.50)' }}>Intervention non trouvee</Text></SafeAreaView>;

  const isRecipient = iv.recipients?.some((r: any) => r.id === user?.id) || iv.assigned_to === user?.id;
  const isAssigned = iv.assigned_to === user?.id;
  const ben = iv.beneficiary_info || {};
  const statusLabel = iv.status === 'pending_acceptance' ? 'En attente' : iv.status === 'in_progress' ? 'En cours' : iv.status === 'completed' ? 'Terminee' : iv.status;
  const statusColor = iv.status === 'pending_acceptance' ? '#FF9800' : iv.status === 'in_progress' ? '#4CAF50' : iv.status === 'completed' ? '#000' : '#888';

  // QCM View
  if (showQCM) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
          <TouchableOpacity onPress={() => setShowQCM(false)} style={{ padding: 4, marginRight: 12 }}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 20, fontWeight: '900', color: 'rgba(255,255,255,0.92)' }}>Compte-rendu</Text>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          {qcmQuestions.map((q, qi) => (
            <GlassCard key={q.id}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: 'rgba(255,255,255,0.92)', marginBottom: 10 }}>{qi + 1}. {q.question}</Text>
              {q.options.map((opt: string) => (
                <TouchableOpacity key={opt} style={[{ paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, marginBottom: 6, borderWidth: 1.5, borderColor: qcmAnswers[q.id] === opt ? '#000' : 'rgba(0,0,0,0.08)', backgroundColor: qcmAnswers[q.id] === opt ? 'rgba(0,0,0,0.06)' : 'transparent' }]}
                  onPress={() => setQcmAnswers({ ...qcmAnswers, [q.id]: opt })}>
                  <Text style={{ fontSize: 14, fontWeight: qcmAnswers[q.id] === opt ? '700' : '500', color: qcmAnswers[q.id] === opt ? '#000' : '#555' }}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </GlassCard>
          ))}

          <GlassCard>
            <Text style={{ fontSize: 15, fontWeight: '800', color: 'rgba(255,255,255,0.92)', marginBottom: 10 }}>Notes personnalisees</Text>
            {Platform.OS === 'web' ? (
              <div><textarea value={closeNotes} onChange={(e: any) => setCloseNotes(e.target.value)} placeholder="Decrivez ce qui s'est passe..." rows={4}
                style={{ width: '100%', fontSize: 14, padding: '12px', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.5)', fontFamily: 'system-ui', resize: 'none' as any, boxSizing: 'border-box' as any }} /></div>
            ) : (
              <TextInput value={closeNotes} onChangeText={setCloseNotes} placeholder="Decrivez ce qui s'est passe..." multiline numberOfLines={4}
                style={{ backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 14, padding: 12, fontSize: 14, color: 'rgba(255,255,255,0.92)', minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }} placeholderTextColor="#999" />
            )}
          </GlassCard>

          <TouchableOpacity style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 16, alignItems: 'center', marginTop: 8, ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(0,0,0,0.15)' } : {}) }} onPress={closeIntervention} disabled={closing}>
            {closing ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>FINALISER L'INTERVENTION</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 20, fontWeight: '900', color: 'rgba(255,255,255,0.92)' }}>Intervention</Text>
        <View style={{ backgroundColor: statusColor + '20', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 9999 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: statusColor, textTransform: 'uppercase' }}>{statusLabel}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {/* Alert Info */}
        <GlassCard style={{ borderLeftWidth: 4, borderLeftColor: '#E53935' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#E53935', textTransform: 'uppercase', letterSpacing: 1 }}>ALERTE</Text>
          <Text style={{ fontSize: 18, fontWeight: '900', color: 'rgba(255,255,255,0.92)', marginTop: 4 }}>{iv.alert_message || iv.notes || 'SOS'}</Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)', marginTop: 4 }}>{new Date(iv.created_at).toLocaleString('fr-FR')}</Text>
          {iv.distance_km && <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.92)', marginTop: 6 }}>Distance : {iv.distance_km} km</Text>}
        </GlassCard>

        {/* Beneficiary Info */}
        <GlassCard>
          <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>BENEFICIAIRE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '800' }}>{ben.name?.charAt(0) || '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: 'rgba(255,255,255,0.92)' }}>{ben.name || iv.beneficiary_name}</Text>
              {ben.phone ? <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', marginTop: 2 }}>{ben.phone}</Text> : null}
            </View>
          </View>
          {ben.address ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}><Ionicons name="location-outline" size={16} color="#FFF" /><Text style={{ fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.92)', flex: 1 }}>{ben.address}</Text></View> : null}
          {ben.medical_conditions ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}><Ionicons name="medkit-outline" size={16} color="#E53935" /><Text style={{ fontSize: 13, color: '#555' }}>{ben.medical_conditions}</Text></View> : null}
          {ben.allergies ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}><Ionicons name="warning-outline" size={16} color="#FF9800" /><Text style={{ fontSize: 13, color: '#555' }}>Allergies: {ben.allergies}</Text></View> : null}
          {ben.emergency_contact_name ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Ionicons name="call-outline" size={16} color="#FFF" /><Text style={{ fontSize: 13, color: '#555' }}>Contact urgence: {ben.emergency_contact_name} ({ben.emergency_contact_phone})</Text></View> : null}
        </GlassCard>

        {/* Coordinates */}
        {iv.beneficiary_location && (
          <GlassCard>
            <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>COORDONNEES GPS</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.92)' }}>{iv.beneficiary_location.latitude?.toFixed(4)}, {iv.beneficiary_location.longitude?.toFixed(4)}</Text>
            {iv.beneficiary_location.address ? <Text style={{ fontSize: 13, color: '#555', marginTop: 2 }}>{iv.beneficiary_location.address}</Text> : null}
          </GlassCard>
        )}

        {/* Intervener Info */}
        {iv.assigned_name && (
          <GlassCard>
            <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>INTERVENANT</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#10B981', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }}>{iv.assigned_name?.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: 'rgba(255,255,255,0.92)' }}>{iv.assigned_name}</Text>
                {iv.structure_name ? <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)' }}>{iv.structure_name}</Text> : null}
              </View>
            </View>
            {iv.intervener_location?.address ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}><Ionicons name="location-outline" size={16} color="#FFF" /><Text style={{ fontSize: 13, color: '#555', flex: 1 }}>{iv.intervener_location.address}</Text></View> : null}
            {iv.distance_km ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}><Ionicons name="navigate-outline" size={16} color="#FFF" /><Text style={{ fontSize: 13, color: '#555' }}>Distance : {iv.distance_km} km</Text></View> : null}
          </GlassCard>
        )}

        {/* Timeline */}
        <GlassCard>
          <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.50)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>TIMELINE</Text>
          {(iv.timeline || []).map((t: any, i: number) => (
            <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#000', marginTop: 6 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.92)' }}>{t.note}</Text>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)' }}>{new Date(t.time).toLocaleString('fr-FR')}</Text>
              </View>
            </View>
          ))}
        </GlassCard>

        {/* Report (if completed) */}
        {iv.report && (
          <GlassCard style={{ backgroundColor: 'rgba(200,230,201,0.5)' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#2E7D32', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>COMPTE-RENDU</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.92)', marginBottom: 6 }}>Par {iv.report.closed_by_name}</Text>
            {(iv.report.answers || iv.report_answers || []).map((a: any, i: number) => (
              <View key={i} style={{ marginBottom: 6 }}>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)' }}>{a.question || `Question ${i + 1}`}</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.92)' }}>{a.answer}</Text>
              </View>
            ))}
            {iv.report.notes ? <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)', paddingTop: 8 }}><Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.92)' }}>Notes:</Text><Text style={{ fontSize: 13, color: '#555', marginTop: 2 }}>{iv.report.notes}</Text></View> : null}
          </GlassCard>
        )}

        {/* Actions */}
        {iv.status === 'pending_acceptance' && isRecipient && (
          <TouchableOpacity style={{ backgroundColor: '#10B981', borderRadius: 9999, paddingVertical: 18, alignItems: 'center', marginTop: 8, ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(76,175,80,0.3)' } : {}) }} onPress={acceptIntervention} disabled={accepting}>
            {accepting ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 17, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>J'INTERVIENS</Text>}
          </TouchableOpacity>
        )}

        {iv.status === 'in_progress' && isAssigned && (
          <TouchableOpacity style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 16, alignItems: 'center', marginTop: 8, ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(0,0,0,0.15)' } : {}) }} onPress={openCloseQCM}>
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>CLOTURER L'INTERVENTION</Text>
          </TouchableOpacity>
        )}

        {iv.status === 'in_progress' && !isAssigned && iv.assigned_name && (
          <GlassCard style={{ alignItems: 'center' }}>
            <Ionicons name="person-circle" size={32} color="#4CAF50" />
            <Text style={{ fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.92)', marginTop: 6 }}>{iv.assigned_name} intervient</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.50)', marginTop: 2 }}>Intervention en cours...</Text>
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
