import { useTheme } from '../src/context/ThemeContext';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, RefreshControl, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 18, marginBottom: 12, ...glass }, style]}>{children}</View>
);
const InfoRow = ({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) => (
  value ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
      <Ionicons name={icon as any} size={16} color={color || '#888'} />
      <Text style={{ fontSize: 12, color: '#5A6068', width: 100 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '600', color: '#1A1D21', flex: 1 }}>{value}</Text>
    </View>
  ) : null
);

function MapEmbed({ benLat, benLng, ivLat, ivLng, benName, ivName }: any) {
  if (Platform.OS !== 'web' || !benLat) return null;
  const markers = ivLat && ivLng
    ? `var benM=L.marker([${benLat},${benLng}],{icon:L.divIcon({className:'',html:'<div style="background:#E53935;color:#FFF;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;border:3px solid #FFF;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${(benName||'B').charAt(0)}</div>'})}).addTo(map);var ivM=L.marker([${ivLat},${ivLng}],{icon:L.divIcon({className:'',html:'<div style="background:#9C27B0;color:#FFF;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;border:3px solid #FFF;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${(ivName||'I').charAt(0)}</div>'})}).addTo(map);L.polyline([[${ivLat},${ivLng}],[${benLat},${benLng}]],{color:'#9C27B0',weight:3,dashArray:'8,8'}).addTo(map);map.fitBounds([[${benLat},${benLng}],[${ivLat},${ivLng}]],{padding:[40,40]});`
    : `L.marker([${benLat},${benLng}],{icon:L.divIcon({className:'',html:'<div style="background:#E53935;color:#FFF;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;border:3px solid #FFF;box-shadow:0 2px 8px rgba(0,0,0,0.3)">${(benName||'B').charAt(0)}</div>'})}).addTo(map);map.setView([${benLat},${benLng}],14);`;
  const html = `<!DOCTYPE html><html><head><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>body{margin:0}#map{width:100%;height:100%}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false});L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{attribution:'CartoDB'}).addTo(map);${markers}</script></body></html>`;
  return (
    <View style={{ height: 200, borderRadius: 18, overflow: 'hidden', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
      <iframe srcDoc={html} style={{ width: '100%', height: '100%', border: 'none' } as any} />
    </View>
  );
}

export default function AlertDetailScreen() {
  const { colors, isDark } = useTheme();
  const { token, user } = useAuth();
  const router = useRouter();
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [callLoading, setCallLoading] = useState('');
  const [escalating, setEscalating] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportForm, setReportForm] = useState({ description: '', actions_taken: '', patient_condition: 'stable', follow_up_needed: false, follow_up_notes: '' });
  const [submittingReport, setSubmittingReport] = useState(false);

  const fetchData = useCallback(async () => {
    try { setData(await apiFetch(`/api/alerts/${alertId}/detail`, {}, token)); }
    catch {} finally { setLoading(false); setRefreshing(false); }
  }, [alertId, token]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const t = setInterval(fetchData, 5000); return () => clearInterval(t); }, [fetchData]);

  const handleIntervene = async (interventionId: string) => {
    setAccepting(true);
    try {
      await apiFetch(`/api/interventions/${interventionId}/accept`, { method: 'POST' }, token);
      Alert.alert('Intervention acceptee', 'Vous etes maintenant en charge de cette intervention.');
      fetchData();
    } catch (e: any) {
      if (e.message?.includes('409') || e.message?.includes('deja')) {
        Alert.alert('Deja prise', 'Un autre intervenant a deja accepte cette intervention.');
      } else {
        Alert.alert('Erreur', e.message);
      }
    } finally { setAccepting(false); }
  };

  const resolveAlert = async () => {
    try {
      await apiFetch(`/api/alerts/${alertId}/resolve`, { method: 'PUT' }, token);
      Alert.alert('Alerte resolue');
      fetchData();
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  const handleCompleteWithReport = async () => {
    setSubmittingReport(true);
    try {
      await apiFetch(`/api/alerts/${alertId}/complete-with-report`, { method: 'POST', body: JSON.stringify(reportForm) }, token);
      Alert.alert('Alerte cloturee', 'Le rapport a ete enregistre.');
      setShowReport(false);
      fetchData();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSubmittingReport(false); }
  };

  const startEscalation = async () => {
    setEscalating(true);
    try {
      await apiFetch('/api/teleassistance/escalation/start', { method: 'POST', body: JSON.stringify({ alert_id: alertId }) }, token);
      fetchData();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setEscalating(false); }
  };

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F6F8', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#1A1D21" /></SafeAreaView>;
  if (!data) return <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F6F8', justifyContent: 'center', alignItems: 'center' }}><Text>Erreur de chargement</Text></SafeAreaView>;

  const a = data.alert;
  const ben = data.beneficiary;
  const isOperator = user?.role === 'teleassistance' || user?.role === 'admin' || user?.active_role === 'admin';
  const isGuardian = user?.role === 'guardian' || user?.active_role === 'guardian';
  const isActive = a.status === 'active';

  // Find intervention linked to this alert
  const intervention = data.interventions?.[0];
  const hasIntervenant = intervention?.assigned_to && intervention?.status !== 'pending_acceptance';
  const isPending = intervention?.status === 'pending_acceptance';
  const isEnRoute = intervention?.status === 'en_route' || intervention?.status === 'in_progress';
  const isCompleted = intervention?.status === 'completed';

  // Can this guardian intervene? (is recipient or is a guardian of the beneficiary)
  const canIntervene = isGuardian && isPending && intervention?.recipients?.some((r: any) => r.id === user?.id);
  const canSelfIntervene = isGuardian && isActive && !intervention; // No intervention yet (Cas 1)
  const iAmIntervenant = intervention?.assigned_to === user?.id;

  // Status message for the alert
  let statusMessage = '';
  let statusColor = '#FF9800';
  let statusIcon = 'time' as any;
  if (a.status === 'resolved') {
    statusMessage = 'Alerte resolue';
    statusColor = '#4CAF50';
    statusIcon = 'checkmark-circle';
  } else if (isCompleted) {
    statusMessage = 'Intervention terminee';
    statusColor = '#4CAF50';
    statusIcon = 'checkmark-circle';
  } else if (isEnRoute && intervention?.assigned_name) {
    statusMessage = `${intervention.assigned_name} en route`;
    statusColor = '#009688';
    statusIcon = 'navigate';
  } else if (isPending) {
    statusMessage = 'En attente d\'un intervenant';
    statusColor = '#FF9800';
    statusIcon = 'time';
  } else if (a.teleassistance_status === 'CALLING_PATIENT') {
    statusMessage = 'Teleassistance IA : appel du patient en cours';
    statusColor = '#9C27B0';
    statusIcon = 'call';
  } else if (a.teleassistance_status?.includes('CALLING_GUARDIAN')) {
    statusMessage = 'Teleassistance IA : appel des gardiens en cours';
    statusColor = '#2196F3';
    statusIcon = 'call';
  } else if (a.teleassistance_status === 'GUARDIAN_INTERVENTION_ACCEPTED') {
    statusMessage = 'Un gardien a accepte d\'intervenir';
    statusColor = '#4CAF50';
    statusIcon = 'person';
  } else {
    statusMessage = 'Alerte en cours de traitement';
    statusColor = '#E53935';
    statusIcon = 'alert-circle';
  }

  const alertTypeLabel = a.alert_type === 'sos' ? 'SOS - Urgence' : a.alert_type === 'fall' ? 'Chute detectee' : a.alert_type === 'heart_rate' ? 'Anomalie cardiaque' : a.alert_type === 'spo2' ? 'SpO2 anormale' : a.alert_type === 'inactivity' ? 'Inactivite' : 'Alerte';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F6F8' }} testID="alert-detail-screen">
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={24} color="#1A1D21" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '900', color: '#1A1D21' }}>Fiche Alerte</Text>
        <View style={{ backgroundColor: (isActive ? '#E53935' : '#4CAF50') + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 }}>
          <Text style={{ fontSize: 10, fontWeight: '800', color: isActive ? '#E53935' : '#4CAF50', textTransform: 'uppercase' }}>{isActive ? 'Active' : 'Resolue'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />} showsVerticalScrollIndicator={false}>

        {/* Status Banner - clear and simple */}
        <GlassCard style={{ borderLeftWidth: 4, borderLeftColor: statusColor, padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: statusColor + '15', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name={statusIcon} size={24} color={statusColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: statusColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>{statusMessage}</Text>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#1A1D21', marginTop: 4 }}>{alertTypeLabel}</Text>
              <Text style={{ fontSize: 12, color: '#5A6068', marginTop: 2 }}>{a.message}</Text>
            </View>
          </View>
        </GlassCard>

        {/* MAP - show if intervention en route */}
        {isEnRoute && intervention?.beneficiary_location && (
          <MapEmbed
            benLat={intervention.beneficiary_location?.latitude} benLng={intervention.beneficiary_location?.longitude}
            ivLat={intervention.intervenant_location?.latitude} ivLng={intervention.intervenant_location?.longitude}
            benName={ben?.name} ivName={intervention.assigned_name}
          />
        )}

        {/* GUARDIAN ACTIONS - contextual */}
        {isGuardian && isActive && (
          <GlassCard style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
            {iAmIntervenant ? (
              <View style={{ backgroundColor: '#10B981', borderRadius: 16, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
                <Ionicons name="shield-checkmark" size={22} color="#1A1D21" />
                <View>
                  <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '900' }}>VOUS GEREZ CETTE INTERVENTION</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 }}>Les gardiens peuvent suivre votre position</Text>
                </View>
              </View>
            ) : (canIntervene || canSelfIntervene) ? (
              <TouchableOpacity testID="intervene-btn"
                style={{ backgroundColor: '#E53935', borderRadius: 16, paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 }}
                onPress={() => {
                  if (intervention?.id) {
                    handleIntervene(intervention.id);
                  } else {
                    Alert.alert('Info', 'Le processus de teleassistance est en cours. Vous serez notifie si votre intervention est necessaire.');
                  }
                }}
                disabled={accepting}>
                {accepting ? <ActivityIndicator color="#1A1D21" /> : (
                  <>
                    <Ionicons name="shield-checkmark" size={22} color="#1A1D21" />
                    <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 }}>J'INTERVIENS</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : hasIntervenant && isEnRoute ? (
              <TouchableOpacity testID="follow-btn"
                style={{ backgroundColor: '#009688', borderRadius: 16, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 }}
                onPress={() => router.push({ pathname: '/company-intervention-detail', params: { interventionId: intervention.id } })}>
                <Ionicons name="navigate" size={20} color="#1A1D21" />
                <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '800' }}>SUIVRE {intervention.assigned_name?.split(' ')[0]?.toUpperCase()} SUR LA CARTE</Text>
              </TouchableOpacity>
            ) : hasIntervenant ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 4 }}>
                <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#10B981' }}>{intervention?.assigned_name} gere l'intervention</Text>
              </View>
            ) : null}
          </GlassCard>
        )}

        {/* Operator Actions */}
        {isOperator && isActive && (
          <GlassCard style={{ backgroundColor: 'rgba(0,0,0,0.03)' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#5A6068', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>ACTIONS OPERATEUR</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <TouchableOpacity style={{ flex: 1, backgroundColor: '#E53935', borderRadius: 14, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }} onPress={startEscalation} disabled={escalating}>
                {escalating ? <ActivityIndicator color="#1A1D21" size="small" /> : (
                  <><Ionicons name="git-branch" size={16} color="#1A1D21" /><Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>LANCER CARE WATCH</Text></>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6, borderWidth: 2, borderColor: '#4CAF50' }} onPress={resolveAlert}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '800' }}>CLOTURER</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        )}

        {/* Beneficiary Info */}
        {ben && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E1F5FE', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="person" size={18} color="#0288D1" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1D21' }}>Beneficiaire</Text>
            </View>
            <InfoRow icon="person-outline" label="Nom" value={ben.name} color="#0288D1" />
            <InfoRow icon="call-outline" label="Telephone" value={ben.phone} />
            <InfoRow icon="location-outline" label="Adresse" value={ben.address} />
            <InfoRow icon="fitness-outline" label="Pathologies" value={ben.medical_conditions} color="#E53935" />
            <InfoRow icon="warning-outline" label="Allergies" value={ben.allergies} color="#FF9800" />
            <InfoRow icon="water-outline" label="Gr. sanguin" value={ben.blood_type} />
            <InfoRow icon="person-circle-outline" label="Medecin" value={ben.doctor_name} />
            <InfoRow icon="call-outline" label="Contact urgence" value={ben.emergency_contact_name ? `${ben.emergency_contact_name} (${ben.emergency_contact_phone || ''})` : ''} color="#E53935" />
          </GlassCard>
        )}

        {/* Intervention Info */}
        {intervention && hasIntervenant && (
          <GlassCard>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3E5F5', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="shield-checkmark" size={18} color="#9C27B0" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1D21' }}>Intervenant</Text>
              <View style={{ backgroundColor: '#009688' + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#009688', textTransform: 'uppercase' }}>{intervention.status === 'en_route' ? 'En route' : intervention.status === 'completed' ? 'Termine' : 'Actif'}</Text>
              </View>
            </View>
            <InfoRow icon="person-outline" label="Nom" value={intervention.assigned_name} color="#9C27B0" />
            <InfoRow icon="business-outline" label="Structure" value={intervention.structure_name} />
            {intervention.distance_km && <InfoRow icon="navigate-outline" label="Distance" value={`${intervention.distance_km} km`} />}
          </GlassCard>
        )}

        {/* Intervention Report */}
        {intervention?.report && (
          <GlassCard style={{ borderLeftWidth: 4, borderLeftColor: '#4CAF50' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="document-text" size={18} color="#4CAF50" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1D21' }}>Rapport d'intervention</Text>
            </View>
            {intervention.report.patient_condition && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, backgroundColor: '#E8F5E9', borderRadius: 10, padding: 10 }}>
                <Ionicons name="heart" size={16} color="#4CAF50" />
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#2E7D32' }}>Etat du patient: {intervention.report.patient_condition === 'stable' ? 'Stable' : intervention.report.patient_condition === 'improved' ? 'Ameliore' : intervention.report.patient_condition === 'needs_care' ? 'Soins necessaires' : intervention.report.patient_condition}</Text>
              </View>
            )}
            {intervention.report.description && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#5A6068', marginBottom: 4 }}>Description</Text>
                <Text style={{ fontSize: 13, color: '#1A1D21', lineHeight: 20 }}>{intervention.report.description}</Text>
              </View>
            )}
            {intervention.report.actions_taken && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#5A6068', marginBottom: 4 }}>Actions effectuees</Text>
                <Text style={{ fontSize: 13, color: '#1A1D21', lineHeight: 20 }}>{intervention.report.actions_taken}</Text>
              </View>
            )}
            {intervention.report.follow_up_needed && (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#FFF3E0', borderRadius: 10, padding: 10 }}>
                <Ionicons name="flag" size={14} color="#FF9800" />
                <Text style={{ fontSize: 12, color: '#E65100', flex: 1 }}><Text style={{ fontWeight: '700' }}>Suivi necessaire:</Text> {intervention.report.follow_up_notes}</Text>
              </View>
            )}
            {intervention.report.completed_by && (
              <Text style={{ fontSize: 10, color: '#5A6068', marginTop: 8 }}>Rapport par {intervention.report.completed_by} - {intervention.report.completed_at ? new Date(intervention.report.completed_at).toLocaleString('fr-FR') : ''}</Text>
            )}
          </GlassCard>
        )}

        {/* Alert-level report (from resolution) */}
        {!intervention?.report && a.intervention_report && (
          <GlassCard style={{ borderLeftWidth: 4, borderLeftColor: '#4CAF50' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="document-text" size={18} color="#4CAF50" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1D21' }}>Rapport d'intervention</Text>
            </View>
            {a.intervention_report.patient_condition && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, backgroundColor: '#E8F5E9', borderRadius: 10, padding: 10 }}>
                <Ionicons name="heart" size={16} color="#4CAF50" />
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#2E7D32' }}>Etat: {a.intervention_report.patient_condition === 'stable' ? 'Stable' : a.intervention_report.patient_condition}</Text>
              </View>
            )}
            {a.intervention_report.description && <Text style={{ fontSize: 13, color: '#1A1D21', lineHeight: 20, marginBottom: 6 }}>{a.intervention_report.description}</Text>}
            {a.intervention_report.actions_taken && <Text style={{ fontSize: 13, color: '#1A1D21', lineHeight: 20, marginBottom: 6 }}><Text style={{ fontWeight: '700' }}>Actions:</Text> {a.intervention_report.actions_taken}</Text>}
            {a.intervention_report.follow_up_needed && (
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#FFF3E0', borderRadius: 10, padding: 10 }}>
                <Ionicons name="flag" size={14} color="#FF9800" />
                <Text style={{ fontSize: 12, color: '#E65100', flex: 1 }}>Suivi: {a.intervention_report.follow_up_notes}</Text>
              </View>
            )}
          </GlassCard>
        )}

        {/* Pending - list of notified intervenants */}
        {intervention && isPending && (
          <GlassCard style={{ borderLeftWidth: 4, borderLeftColor: '#FF9800' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <Ionicons name="time" size={18} color="#FF9800" />
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#FF9800' }}>En attente d'un intervenant</Text>
            </View>
            <Text style={{ fontSize: 12, color: '#5A6068', marginBottom: 8 }}>{intervention.recipients?.length || 0} intervenants notifies</Text>
            {(intervention.recipients || []).map((r: any) => (
              <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#9C27B015', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="person" size={14} color="#9C27B0" />
                </View>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#1A1D21', flex: 1 }}>{r.name}</Text>
                {r.distance_km && <Text style={{ fontSize: 10, color: '#5A6068' }}>{r.distance_km} km</Text>}
              </View>
            ))}
          </GlassCard>
        )}

        {/* Timeline */}
        {data.timeline?.length > 0 && (
          <GlassCard>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#5A6068', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>CHRONOLOGIE</Text>
            {data.timeline.map((t: any, i: number) => {
              const evColor = t.event === 'resolved' ? '#4CAF50' : t.event === 'alert_created' ? '#E53935' : t.event?.includes('call') ? '#2196F3' : t.event === 'intervention' ? '#9C27B0' : '#000';
              return (
                <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ alignItems: 'center', width: 24 }}>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: i === 0 ? evColor : '#DDD', marginTop: 4 }} />
                    {i < data.timeline.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: 'rgba(0,0,0,0.06)', minHeight: 16 }} />}
                  </View>
                  <View style={{ flex: 1, paddingBottom: 10 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#1A1D21' }}>{t.detail}</Text>
                    <Text style={{ fontSize: 10, color: '#9BA3AD', marginTop: 1 }}>{new Date(t.time).toLocaleString('fr-FR')}</Text>
                  </View>
                </View>
              );
            })}
          </GlassCard>
        )}

        {/* Alert Details */}
        <GlassCard>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#5A6068', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>DETAILS</Text>
          <InfoRow icon="alert-circle-outline" label="Type" value={alertTypeLabel} color="#E53935" />
          <InfoRow icon="speedometer-outline" label="Severite" value={a.severity === 'critical' ? 'Critique' : a.severity === 'high' ? 'Eleve' : 'Moyen'} color="#E53935" />
          <InfoRow icon="watch-outline" label="Appareil" value={a.device_type || 'bracelet'} />
          <InfoRow icon="calendar-outline" label="Date" value={new Date(a.created_at).toLocaleString('fr-FR')} />
          {a.resolved_at && <InfoRow icon="checkmark-circle-outline" label="Resolu le" value={new Date(a.resolved_at).toLocaleString('fr-FR')} color="#4CAF50" />}
        </GlassCard>

        {/* Close with report button - for guardians on active alerts */}
        {(isGuardian || isOperator) && isActive && (
          <TouchableOpacity onPress={() => setShowReport(true)}
            style={{ backgroundColor: '#10B981', borderRadius: 16, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
            <Ionicons name="document-text" size={20} color="#1A1D21" />
            <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '900' }}>CLOTURER AVEC RAPPORT</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Report Modal */}
      <Modal visible={showReport} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#1A1D21' }}>Rapport de cloture</Text>
              <TouchableOpacity onPress={() => setShowReport(false)}><Ionicons name="close" size={24} color="#888" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 12, color: '#5A6068', marginBottom: 4 }}>Etat du patient</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {[{k: 'stable', l: 'Stable', c: '#4CAF50'}, {k: 'improved', l: 'Ameliore', c: '#2196F3'}, {k: 'needs_care', l: 'Soins necessaires', c: '#FF9800'}].map(o => (
                  <TouchableOpacity key={o.k} style={[{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 2, borderColor: reportForm.patient_condition === o.k ? o.c : '#E0E0E0' }, reportForm.patient_condition === o.k && { backgroundColor: o.c + '15' }]}
                    onPress={() => setReportForm({...reportForm, patient_condition: o.k})}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: reportForm.patient_condition === o.k ? o.c : '#888' }}>{o.l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={{ fontSize: 12, color: '#5A6068', marginBottom: 4 }}>Description de la situation</Text>
              <TextInput style={{ borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: 12 }}
                placeholder="Decrivez ce que vous avez constate..." multiline value={reportForm.description} onChangeText={v => setReportForm({...reportForm, description: v})} />
              <Text style={{ fontSize: 12, color: '#5A6068', marginBottom: 4 }}>Actions effectuees</Text>
              <TextInput style={{ borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 12, fontSize: 14, minHeight: 60, textAlignVertical: 'top', marginBottom: 12 }}
                placeholder="Ex: Aide au relevage, appel medecin..." multiline value={reportForm.actions_taken} onChangeText={v => setReportForm({...reportForm, actions_taken: v})} />
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}
                onPress={() => setReportForm({...reportForm, follow_up_needed: !reportForm.follow_up_needed})}>
                <Ionicons name={reportForm.follow_up_needed ? 'checkbox' : 'square-outline'} size={22} color={reportForm.follow_up_needed ? '#FF9800' : '#888'} />
                <Text style={{ fontSize: 14, color: '#1A1D21' }}>Suivi necessaire</Text>
              </TouchableOpacity>
              {reportForm.follow_up_needed && (
                <TextInput style={{ borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 12 }}
                  placeholder="Precisions sur le suivi a prevoir..." value={reportForm.follow_up_notes} onChangeText={v => setReportForm({...reportForm, follow_up_notes: v})} />
              )}
              <TouchableOpacity style={{ backgroundColor: '#10B981', borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                onPress={handleCompleteWithReport} disabled={submittingReport}>
                {submittingReport ? <ActivityIndicator color="#1A1D21" /> : (
                  <><Ionicons name="checkmark-circle" size={20} color="#1A1D21" /><Text style={{ color: '#FFF', fontSize: 15, fontWeight: '900' }}>VALIDER ET CLOTURER</Text></>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
