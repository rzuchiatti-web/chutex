import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { Colors } from '../src/constants/colors';

export default function InterventionDetailScreen() {
  const { interventionId } = useLocalSearchParams<{ interventionId: string }>();
  const { token, user } = useAuth();
  const router = useRouter();
  const [iv, setIv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchIntervention(); }, [interventionId]);

  const fetchIntervention = async () => {
    try {
      const data = await apiFetch(`/api/interventions/${interventionId}`, {}, token);
      setIv(data);
    } catch (e) {} finally { setLoading(false); }
  };

  const updateStatus = async (status: string) => {
    setSubmitting(true);
    try {
      await apiFetch(`/api/interventions/${interventionId}`, {
        method: 'PUT', body: JSON.stringify({ status, report: status === 'completed' ? report : undefined }),
      }, token);
      fetchIntervention();
      if (status === 'completed') Alert.alert('Terminé', 'Intervention terminée avec succès');
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSubmitting(false); }
  };

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View></SafeAreaView>;
  if (!iv) return <SafeAreaView style={s.safe}><Text style={s.err}>Intervention non trouvée</Text></SafeAreaView>;

  const benLoc = iv.beneficiary_location || {};
  const intLoc = iv.intervener_location || {};
  const mapHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>body{margin:0}#map{height:100vh;width:100%}</style></head><body>
    <div id="map"></div><script>
    var map=L.map('map').setView([${benLoc.latitude||48.8566},${benLoc.longitude||2.3522}],14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
    L.marker([${benLoc.latitude||48.8566},${benLoc.longitude||2.3522}]).addTo(map).bindPopup('<b>${iv.beneficiary_name}</b><br>Bénéficiaire').openPopup();
    L.marker([${intLoc.latitude||48.86},${intLoc.longitude||2.35}],{}).addTo(map).bindPopup('<b>Intervenant</b><br>En route');
    L.polyline([[${intLoc.latitude||48.86},${intLoc.longitude||2.35}],[${benLoc.latitude||48.8566},${benLoc.longitude||2.3522}]],{color:'#4A7C59',dashArray:'8'}).addTo(map);
    </script></body></html>`;

  return (
    <SafeAreaView style={s.safe} testID="intervention-detail-screen">
      <View style={s.topBar}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Intervention</Text>
        <View style={[s.stBadge, { backgroundColor: iv.status === 'completed' ? Colors.success + '15' : Colors.accent + '15' }]}>
          <Text style={[s.stBadgeT, { color: iv.status === 'completed' ? Colors.success : Colors.accent }]}>
            {iv.status === 'en_route' ? 'En route' : iv.status === 'on_site' ? 'Sur place' : iv.status === 'completed' ? 'Terminé' : iv.status}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}>
        {/* Map */}
        <View style={s.mapContainer}>
          <WebView source={{ html: mapHtml }} style={s.map} scrollEnabled={false} />
        </View>

        {/* Info */}
        <View style={s.infoCard}>
          <View style={s.infoRow}><Ionicons name="person" size={16} color={Colors.textMuted} /><Text style={s.infoLabel}>Bénéficiaire</Text><Text style={s.infoVal}>{iv.beneficiary_name}</Text></View>
          <View style={s.infoRow}><Ionicons name="person" size={16} color={Colors.textMuted} /><Text style={s.infoLabel}>Intervenant</Text><Text style={s.infoVal}>{iv.assigned_name}</Text></View>
          <View style={s.infoRow}><Ionicons name="calendar" size={16} color={Colors.textMuted} /><Text style={s.infoLabel}>Créé le</Text><Text style={s.infoVal}>{new Date(iv.created_at).toLocaleString('fr-FR')}</Text></View>
        </View>

        {/* Timeline */}
        {iv.timeline?.length > 0 && (
          <View style={s.timelineCard}>
            <Text style={s.timelineTitle}>Chronologie</Text>
            {iv.timeline.map((t: any, i: number) => (
              <View key={i} style={s.tlRow}>
                <View style={[s.tlDot, { backgroundColor: i === 0 ? Colors.primary : Colors.border }]} />
                <View style={s.tlInfo}><Text style={s.tlSt}>{t.note}</Text><Text style={s.tlTime}>{new Date(t.time).toLocaleTimeString('fr-FR')}</Text></View>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        {iv.status !== 'completed' && user?.id === iv.assigned_to && (
          <View style={s.actionsCard}>
            {iv.status === 'en_route' && (
              <TouchableOpacity testID="arrive-btn" style={[s.actionBtn, { backgroundColor: Colors.info }]} onPress={() => updateStatus('on_site')} disabled={submitting}>
                <Ionicons name="location" size={18} color="#FFF" /><Text style={s.actionBtnT}>Arrivé sur place</Text>
              </TouchableOpacity>
            )}
            <TextInput testID="report-input" style={s.reportInput} placeholder="Rapport d'intervention..." placeholderTextColor={Colors.textMuted}
              value={report} onChangeText={setReport} multiline />
            <TouchableOpacity testID="complete-btn" style={[s.actionBtn, { backgroundColor: Colors.success }]} onPress={() => updateStatus('completed')} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFF" /> : <><Ionicons name="checkmark-circle" size={18} color="#FFF" /><Text style={s.actionBtnT}>Terminer l'intervention</Text></>}
            </TouchableOpacity>
          </View>
        )}

        {iv.report && (
          <View style={s.reportCard}>
            <Text style={s.reportTitle}>Rapport</Text>
            <Text style={s.reportText}>{iv.report}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.subtle, justifyContent: 'center', alignItems: 'center' },
  topTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  stBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  stBadgeT: { fontSize: 12, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sc: { paddingHorizontal: 18, paddingBottom: 30 },
  err: { fontSize: 16, color: Colors.destructive, textAlign: 'center', marginTop: 40 },
  mapContainer: { height: 240, borderRadius: 16, overflow: 'hidden', marginBottom: 14, borderWidth: 1, borderColor: Colors.border },
  map: { flex: 1 },
  infoCard: { backgroundColor: Colors.paper, borderRadius: 14, padding: 14, marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: Colors.subtle },
  infoLabel: { flex: 1, fontSize: 13, color: Colors.textMuted }, infoVal: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  timelineCard: { backgroundColor: Colors.paper, borderRadius: 14, padding: 14, marginBottom: 14 },
  timelineTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  tlRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  tlDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  tlInfo: { flex: 1 }, tlSt: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary }, tlTime: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  actionsCard: { backgroundColor: Colors.paper, borderRadius: 14, padding: 14, marginBottom: 14 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 12, marginBottom: 8 },
  actionBtnT: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  reportInput: { backgroundColor: Colors.subtle, borderRadius: 12, padding: 12, fontSize: 14, color: Colors.textPrimary, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: Colors.border, marginBottom: 8 },
  reportCard: { backgroundColor: Colors.paper, borderRadius: 14, padding: 14 },
  reportTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  reportText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19 },
});
