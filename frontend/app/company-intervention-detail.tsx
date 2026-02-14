import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Dimensions, TextInput, Alert, Linking, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const { height: SCREEN_H } = Dimensions.get('window');
const MAP_H = SCREEN_H * 0.50;
const stColor = (st: string) => ({ pending_acceptance: '#FF9800', in_progress: '#2196F3', en_route: '#009688', completed: '#4CAF50', dispatched: '#FF5722' }[st] || '#888');
const stLabel = (st: string) => ({ pending_acceptance: 'En attente', in_progress: 'En cours', en_route: 'En route', completed: 'Terminee', dispatched: 'Dispatchee' }[st] || st);

function FullMap({ benLat, benLng, ivLat, ivLng, benName, ivName }: any) {
  if (Platform.OS !== 'web' || !benLat) return <View style={{ flex: 1, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' }}><Ionicons name="map-outline" size={48} color="#BBB" /></View>;
  const bi = (benName || 'B').charAt(0), ii = (ivName || 'I').charAt(0);
  const m = ivLat && ivLng
    ? `var b=L.marker([${benLat},${benLng}],{icon:L.divIcon({className:'',html:'<div style="background:#E53935;color:#FFF;width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;border:3px solid #FFF;box-shadow:0 4px 16px rgba(0,0,0,0.3)">${bi}</div>'})}).addTo(map);var i=L.marker([${ivLat},${ivLng}],{icon:L.divIcon({className:'',html:'<div style="background:#009688;color:#FFF;width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;border:3px solid #FFF;box-shadow:0 4px 16px rgba(0,0,0,0.3);animation:p 2s infinite"><style>@keyframes p{0%,100%{box-shadow:0 0 0 0 rgba(0,150,136,0.4)}70%{box-shadow:0 0 0 20px rgba(0,150,136,0)}}</style>${ii}</div>'})}).addTo(map);L.polyline([[${ivLat},${ivLng}],[${benLat},${benLng}]],{color:'#009688',weight:4,dashArray:'10,8',opacity:0.7}).addTo(map);map.fitBounds([[${benLat},${benLng}],[${ivLat},${ivLng}]],{padding:[50,50]});`
    : `L.marker([${benLat},${benLng}],{icon:L.divIcon({className:'',html:'<div style="background:#E53935;color:#FFF;width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;border:3px solid #FFF;box-shadow:0 4px 16px rgba(0,0,0,0.3)">${bi}</div>'})}).addTo(map);map.setView([${benLat},${benLng}],15);`;
  const h = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>*{margin:0;padding:0}html,body,#map{width:100%;height:100%}.leaflet-control-attribution{display:none!important}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false,attributionControl:false});L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);${m}</script></body></html>`;
  return <iframe srcDoc={h} style={{ width: '100%', height: '100%', border: 'none' } as any} />;
}

const makeCall = (phone: string) => { if (phone) Linking.openURL(`tel:${phone}`); };

export default function CompanyInterventionDetail() {
  const { interventionId } = useLocalSearchParams<{ interventionId: string }>();
  const { token, user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState({ description: '', actions_taken: '', patient_condition: 'stable', follow_up_needed: false, follow_up_notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try { setData(await apiFetch(`/api/interventions/${interventionId}/detail`, {}, token)); }
    catch {} finally { setLoading(false); }
  }, [interventionId, token]);

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 5000); return () => clearInterval(t); }, [fetchData]);

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await apiFetch(`/api/interventions/${interventionId}/complete`, { method: 'POST', body: JSON.stringify(report) }, token);
      Alert.alert('Intervention terminee', 'Le rapport a ete enregistre et l\'alerte est resolue.');
      fetchData();
      setShowReport(false);
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSubmitting(false); }
  };

  if (loading) return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#FFF" /></View>;
  if (!data?.intervention) return <View style={{ flex: 1, backgroundColor: '#F5F0EB', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#888' }}>Intervention non trouvee</Text></View>;

  const iv = data.intervention;
  const ben = data.beneficiary || iv.beneficiary_info || {};
  const intervenant = data.intervenant;
  const alert_data = data.alert;
  const sc = stColor(iv.status);
  const benLoc = iv.beneficiary_location || {};
  const ivLoc = iv.intervenant_location;
  const iAmIntervenant = iv.assigned_to === user?.id;
  const isCompleted = iv.status === 'completed';
  const rpt = iv.report;

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F0EB' }}>
      {/* MAP */}
      <View style={{ height: MAP_H, position: 'relative' }}>
        <FullMap benLat={benLoc.latitude} benLng={benLoc.longitude} ivLat={ivLoc?.latitude} ivLng={ivLoc?.longitude} benName={ben.name || iv.beneficiary_name} ivName={iv.assigned_name} />
        <TouchableOpacity onPress={() => router.back()} style={{ position: 'absolute', top: 50, left: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', ...(Platform.OS === 'web' ? { boxShadow: '0 2px 12px rgba(0,0,0,0.15)' } : {}) }}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={{ position: 'absolute', top: 50, right: 16, backgroundColor: sc, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6, ...(Platform.OS === 'web' ? { boxShadow: '0 2px 12px rgba(0,0,0,0.2)' } : {}) }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' }} />
          <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>{stLabel(iv.status).toUpperCase()}</Text>
        </View>
        {iv.distance_km && !isCompleted && (
          <View style={{ position: 'absolute', bottom: 16, alignSelf: 'center', backgroundColor: '#000', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 8, ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(0,0,0,0.3)', left: '50%', transform: 'translateX(-50%)' as any } : {}) }}>
            <Ionicons name="navigate" size={16} color="#FFF" />
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '900' }}>{iv.distance_km} km</Text>
          </View>
        )}
      </View>

      {/* SLIDE-UP CARD */}
      <View style={{ flex: 1, backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, ...(Platform.OS === 'web' ? { boxShadow: '0 -4px 24px rgba(0,0,0,0.1)' } : {}) }}>
        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 6 }}><View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD' }} /></View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Intervenant header */}
          {iv.assigned_name ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: iAmIntervenant ? '#4CAF50' : '#009688', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#FFF' }}>{iv.assigned_name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#000' }}>{iAmIntervenant ? 'Vous intervenez' : iv.assigned_name}</Text>
                <Text style={{ fontSize: 12, color: '#888' }}>{iv.structure_name || ''}{iv.distance_km ? ` - ${iv.distance_km} km` : ''}</Text>
              </View>
              {iAmIntervenant && !isCompleted && (
                <TouchableOpacity onPress={() => setShowReport(true)} style={{ backgroundColor: '#4CAF50', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 }}>
                  <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>TERMINER</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, backgroundColor: '#FFF3E0', borderRadius: 14, padding: 14 }}>
              <Ionicons name="time" size={24} color="#FF9800" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#E65100', flex: 1 }}>En attente d'un intervenant</Text>
            </View>
          )}

          {/* Alert banner */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFEBEE', borderRadius: 14, padding: 14, marginBottom: 14 }}>
            <Ionicons name={alert_data?.alert_type === 'fall' ? 'trending-down' : 'alert-circle'} size={20} color="#E53935" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#E53935' }}>{alert_data?.alert_type === 'sos' ? 'SOS - Urgence' : alert_data?.alert_type === 'fall' ? 'Chute detectee' : 'Alerte'}</Text>
              <Text style={{ fontSize: 11, color: '#C62828' }}>{iv.alert_message || alert_data?.message}</Text>
            </View>
          </View>

          {/* Patient info */}
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#888', letterSpacing: 1, marginBottom: 8 }}>PATIENT</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#E1F5FE', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#0288D1' }}>{(ben.name || '?').charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#000' }}>{ben.name || iv.beneficiary_name}</Text>
              {ben.address && <Text style={{ fontSize: 12, color: '#555' }}>{ben.address}</Text>}
            </View>
          </View>

          {/* Call buttons */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {ben.phone && (
              <TouchableOpacity onPress={() => makeCall(ben.phone)} style={{ flex: 1, backgroundColor: '#E3F2FD', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Ionicons name="call" size={16} color="#1565C0" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#1565C0' }}>Appeler patient</Text>
              </TouchableOpacity>
            )}
            {ben.emergency_contact_phone && (
              <TouchableOpacity onPress={() => makeCall(ben.emergency_contact_phone)} style={{ flex: 1, backgroundColor: '#FFEBEE', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Ionicons name="call" size={16} color="#E53935" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#E53935' }}>Urgence</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Medical info */}
          {(ben.medical_conditions || ben.allergies || ben.blood_type) && (
            <View style={{ backgroundColor: '#FFF8E1', borderRadius: 12, padding: 12, marginBottom: 14, gap: 4 }}>
              {ben.medical_conditions && <Text style={{ fontSize: 12, color: '#333' }}><Text style={{ fontWeight: '700' }}>Pathologies:</Text> {ben.medical_conditions}</Text>}
              {ben.allergies && <Text style={{ fontSize: 12, color: '#333' }}><Text style={{ fontWeight: '700' }}>Allergies:</Text> {ben.allergies}</Text>}
              {ben.blood_type && <Text style={{ fontSize: 12, color: '#333' }}><Text style={{ fontWeight: '700' }}>Groupe:</Text> {ben.blood_type}</Text>}
              {ben.doctor_name && <Text style={{ fontSize: 12, color: '#333' }}><Text style={{ fontWeight: '700' }}>Medecin:</Text> {ben.doctor_name}</Text>}
            </View>
          )}

          {/* Report section if completed */}
          {isCompleted && rpt && (
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#888', letterSpacing: 1, marginBottom: 8 }}>RAPPORT D'INTERVENTION</Text>
              <View style={{ backgroundColor: '#E8F5E9', borderRadius: 14, padding: 14, borderLeftWidth: 4, borderLeftColor: '#4CAF50' }}>
                {rpt.patient_condition && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Ionicons name="heart" size={14} color="#4CAF50" />
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#2E7D32' }}>Etat: {rpt.patient_condition === 'stable' ? 'Stable' : rpt.patient_condition === 'improved' ? 'Ameliore' : rpt.patient_condition === 'needs_care' ? 'Necessite des soins' : rpt.patient_condition}</Text>
                  </View>
                )}
                {rpt.description && <Text style={{ fontSize: 12, color: '#333', marginBottom: 4 }}>{rpt.description}</Text>}
                {rpt.actions_taken && <Text style={{ fontSize: 12, color: '#333', marginBottom: 4 }}><Text style={{ fontWeight: '700' }}>Actions:</Text> {rpt.actions_taken}</Text>}
                {rpt.follow_up_needed && <Text style={{ fontSize: 12, color: '#E65100', fontWeight: '600' }}>Suivi necessaire: {rpt.follow_up_notes}</Text>}
                {rpt.completed_by && <Text style={{ fontSize: 10, color: '#888', marginTop: 6 }}>Par {rpt.completed_by} - {rpt.completed_at ? new Date(rpt.completed_at).toLocaleString('fr-FR') : ''}</Text>}
              </View>
            </View>
          )}

          {/* Timeline */}
          {(iv.timeline || []).length > 0 && (
            <View>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#888', letterSpacing: 1, marginBottom: 8 }}>CHRONOLOGIE</Text>
              {iv.timeline.map((t: any, i: number) => (
                <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: i === iv.timeline.length - 1 ? sc : '#DDD', marginTop: 5 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: '#333' }}>{t.note || t.status}</Text>
                    <Text style={{ fontSize: 10, color: '#AAA' }}>{t.time ? new Date(t.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Completion Report Modal */}
      <Modal visible={showReport} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '85%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#000' }}>Rapport d'intervention</Text>
              <TouchableOpacity onPress={() => setShowReport(false)}><Ionicons name="close" size={24} color="#888" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Etat du patient</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {[{k: 'stable', l: 'Stable', c: '#4CAF50'}, {k: 'improved', l: 'Ameliore', c: '#2196F3'}, {k: 'needs_care', l: 'Soins necessaires', c: '#FF9800'}].map(o => (
                  <TouchableOpacity key={o.k} style={[{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 2, borderColor: report.patient_condition === o.k ? o.c : '#E0E0E0' }, report.patient_condition === o.k && { backgroundColor: o.c + '15' }]}
                    onPress={() => setReport({...report, patient_condition: o.k})}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: report.patient_condition === o.k ? o.c : '#888' }}>{o.l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Description</Text>
              <TextInput style={{ borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top', marginBottom: 12 }}
                placeholder="Decrivez la situation a votre arrivee..." multiline value={report.description} onChangeText={v => setReport({...report, description: v})} />
              <Text style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Actions effectuees</Text>
              <TextInput style={{ borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 12, fontSize: 14, minHeight: 60, textAlignVertical: 'top', marginBottom: 12 }}
                placeholder="Ex: Aide au relevage, verification constantes..." multiline value={report.actions_taken} onChangeText={v => setReport({...report, actions_taken: v})} />
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}
                onPress={() => setReport({...report, follow_up_needed: !report.follow_up_needed})}>
                <Ionicons name={report.follow_up_needed ? 'checkbox' : 'square-outline'} size={22} color={report.follow_up_needed ? '#FF9800' : '#888'} />
                <Text style={{ fontSize: 14, color: '#000' }}>Suivi necessaire</Text>
              </TouchableOpacity>
              {report.follow_up_needed && (
                <TextInput style={{ borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 12 }}
                  placeholder="Precisions sur le suivi..." value={report.follow_up_notes} onChangeText={v => setReport({...report, follow_up_notes: v})} />
              )}
              <TouchableOpacity style={{ backgroundColor: '#4CAF50', borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
                onPress={handleComplete} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#FFF" /> : (
                  <><Ionicons name="checkmark-circle" size={20} color="#FFF" /><Text style={{ color: '#FFF', fontSize: 15, fontWeight: '900' }}>TERMINER L'INTERVENTION</Text></>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
