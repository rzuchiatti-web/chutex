import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { Colors } from '../src/constants/colors';
import { useTheme } from '../src/context/ThemeContext';

const STEPS = [
  { key: 'dispatched', label: 'Dispatchée', icon: 'send' },
  { key: 'en_route', label: 'En route', icon: 'car' },
  { key: 'on_site', label: 'Sur place', icon: 'location' },
  { key: 'completed', label: 'Terminée', icon: 'checkmark-circle' },
];

export default function InterventionDetailScreen() {
  const { colors: themeColors } = useTheme();
  const { interventionId } = useLocalSearchParams<{ interventionId: string }>();
  const { token, user } = useAuth();
  const router = useRouter();
  const [iv, setIv] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchIntervention = useCallback(async () => {
    try { setIv(await apiFetch(`/api/interventions/${interventionId}`, {}, token)); }
    catch (e) {} finally { setLoading(false); }
  }, [interventionId, token]);

  useEffect(() => { fetchIntervention(); }, [fetchIntervention]);
  // Auto-refresh every 5 seconds for live tracking
  useEffect(() => { const iv = setInterval(fetchIntervention, 5000); return () => clearInterval(iv); }, [fetchIntervention]);

  const updateStatus = async (status: string) => {
    setSubmitting(true);
    try {
      await apiFetch(`/api/interventions/${interventionId}`, {
        method: 'PUT', body: JSON.stringify({ status, report: status === 'completed' ? report : undefined }),
      }, token);
      fetchIntervention();
      if (status === 'completed') Alert.alert('Terminé', 'Intervention terminée');
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSubmitting(false); }
  };

  if (loading) return <SafeAreaView style={[s.safe, { backgroundColor: themeColors.background }]}><View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View></SafeAreaView>;
  if (!iv) return <SafeAreaView style={[s.safe, { backgroundColor: themeColors.background }]}><View style={s.center}><Text style={{color: Colors.textMuted}}>Intervention non trouvée</Text></View></SafeAreaView>;

  const benLoc = iv.beneficiary_location || {};
  const intLoc = iv.intervener_location || {};
  const currentStepIdx = STEPS.findIndex(st => st.key === iv.status);
  const eta = iv.status === 'en_route' ? '~12 min' : iv.status === 'dispatched' ? '~18 min' : iv.status === 'on_site' ? 'Sur place' : 'Terminé';

  const mapHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>body{margin:0;font-family:system-ui}#map{height:100vh;width:100%}
    .pulse{width:14px;height:14px;border-radius:50%;background:#000;box-shadow:0 0 0 0 rgba(0,0,0,.4);animation:pulse 2s infinite}
    @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(0,0,0,.4)}70%{box-shadow:0 0 0 15px rgba(0,0,0,0)}100%{box-shadow:0 0 0 0 rgba(0,0,0,0)}}
    .ben-marker{background:#000;color:#fff;padding:4px 8px;border-radius:8px;font-weight:700;font-size:11px;white-space:nowrap}
    .int-marker{background:#fff;border:2px solid #000;color:#000;padding:4px 8px;border-radius:8px;font-weight:700;font-size:11px;white-space:nowrap}
    </style></head><body>
    <div id="map"></div><script>
    var map=L.map('map',{zoomControl:false}).setView([${benLoc.latitude||48.8566},${benLoc.longitude||2.3522}],14);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{maxZoom:19}).addTo(map);
    var benIcon=L.divIcon({html:'<div class="pulse"></div>',className:'',iconSize:[14,14],iconAnchor:[7,7]});
    var intIcon=L.divIcon({html:'<div class="int-marker">🚗 Intervenant</div>',className:'',iconSize:[120,28],iconAnchor:[60,14]});
    L.marker([${benLoc.latitude||48.8566},${benLoc.longitude||2.3522}],{icon:benIcon}).addTo(map);
    L.marker([${benLoc.latitude||48.8566},${benLoc.longitude||2.3522}]).addTo(map).bindPopup('<b>${iv.beneficiary_name}</b><br>Bénéficiaire');
    ${iv.status !== 'completed' ? `
    L.marker([${intLoc.latitude||48.86},${intLoc.longitude||2.35}],{icon:intIcon}).addTo(map);
    L.polyline([[${intLoc.latitude||48.86},${intLoc.longitude||2.35}],[${benLoc.latitude||48.8566},${benLoc.longitude||2.3522}]],{color:'#000',weight:3,dashArray:'8,8',opacity:0.6}).addTo(map);
    map.fitBounds([[${benLoc.latitude||48.8566},${benLoc.longitude||2.3522}],[${intLoc.latitude||48.86},${intLoc.longitude||2.35}]],{padding:[40,40]});
    ` : ''}
    </script></body></html>`;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: themeColors.background }]} testID="intervention-detail-screen">
      <View style={s.topBar}>
        <TouchableOpacity testID="back-btn" onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Intervention</Text>
        <View style={{width:36}} />
      </View>

      <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}>
        {/* UberEats-style ETA card */}
        <View style={s.etaCard}>
          <Text style={s.etaLabel}>{iv.status === 'completed' ? 'Intervention terminée' : 'Arrivée estimée'}</Text>
          <Text style={s.etaValue}>{eta}</Text>
          <Text style={s.etaName}>{iv.beneficiary_name}</Text>
        </View>

        {/* Progress steps - UberEats style */}
        <View style={s.progressCard}>
          <View style={s.progressRow}>
            {STEPS.map((step, i) => {
              const isActive = i <= currentStepIdx;
              const isCurrent = i === currentStepIdx;
              return (
                <React.Fragment key={step.key}>
                  <View style={s.stepItem}>
                    <View style={[s.stepCircle, isActive && s.stepCircleActive, isCurrent && s.stepCircleCurrent]}>
                      <Ionicons name={step.icon as any} size={14} color={isActive ? '#FFF' : Colors.textMuted} />
                    </View>
                    <Text style={[s.stepLabel, isActive && s.stepLabelActive]}>{step.label}</Text>
                  </View>
                  {i < STEPS.length - 1 && <View style={[s.stepLine, isActive && s.stepLineActive]} />}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Map */}
        <View style={s.mapContainer}>
          <WebView source={{ html: mapHtml }} style={s.map} scrollEnabled={false} />
        </View>

        {/* Info */}
        <View style={s.infoCard}>
          <Text style={s.cardTitle}>Détails</Text>
          <InfoRow icon="person" label="Bénéficiaire" value={iv.beneficiary_name} />
          <InfoRow icon="car" label="Intervenant" value={iv.assigned_name} />
          <InfoRow icon="calendar" label="Créé le" value={new Date(iv.created_at).toLocaleString('fr-FR')} />
          {iv.notes && <InfoRow icon="document-text" label="Notes" value={iv.notes} />}
        </View>

        {/* Timeline */}
        {iv.timeline?.length > 0 && (
          <View style={s.tlCard}>
            <Text style={s.cardTitle}>Suivi en direct</Text>
            {iv.timeline.map((t: any, i: number) => (
              <View key={i} style={s.tlRow}>
                <View style={[s.tlDot, i === 0 && { backgroundColor: Colors.primary }]} />
                <View style={s.tlInfo}>
                  <Text style={s.tlNote}>{t.note || t.status}</Text>
                  <Text style={s.tlTime}>{new Date(t.time).toLocaleTimeString('fr-FR')}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Actions for assigned intervener */}
        {iv.status !== 'completed' && (
          <View style={s.actionsCard}>
            {iv.status === 'dispatched' && (
              <TouchableOpacity style={s.actionBtn} onPress={() => updateStatus('en_route')} disabled={submitting}>
                <Ionicons name="car" size={16} color="#FFF" /><Text style={s.actionBtnT}>Je suis en route</Text>
              </TouchableOpacity>
            )}
            {iv.status === 'en_route' && (
              <TouchableOpacity style={s.actionBtn} onPress={() => updateStatus('on_site')} disabled={submitting}>
                <Ionicons name="location" size={16} color="#FFF" /><Text style={s.actionBtnT}>Arrivé sur place</Text>
              </TouchableOpacity>
            )}
            <TextInput style={s.reportInput} placeholder="Rapport d'intervention..." placeholderTextColor={Colors.textMuted}
              value={report} onChangeText={setReport} multiline blurOnSubmit={false} />
            <TouchableOpacity style={[s.actionBtn, {backgroundColor: Colors.success}]} onPress={() => updateStatus('completed')} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFF" /> : <><Ionicons name="checkmark-circle" size={16} color="#FFF" /><Text style={s.actionBtnT}>Terminer l'intervention</Text></>}
            </TouchableOpacity>
          </View>
        )}

        {iv.report && (
          <View style={s.reportCard}><Text style={s.cardTitle}>Rapport</Text><Text style={s.reportText}>{iv.report}</Text></View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({icon, label, value}: {icon: string; label: string; value: string}) {
  return <View style={s.infoRow}><Ionicons name={icon as any} size={14} color={Colors.textMuted} /><Text style={s.infoLabel}>{label}</Text><Text style={s.infoVal}>{value}</Text></View>;
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:Colors.background},
  center:{flex:1,justifyContent:'center',alignItems:'center'},
  topBar:{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:10,gap:8},
  backBtn:{width:36,height:36,borderRadius:10,backgroundColor:Colors.subtle,justifyContent:'center',alignItems:'center'},
  topTitle:{flex:1,fontSize:18,fontWeight:'700',color:Colors.textPrimary,textAlign:'center'},
  sc:{paddingHorizontal:20,paddingBottom:30},
  // ETA Card
  etaCard:{backgroundColor:Colors.primary,borderRadius:16,padding:20,marginBottom:12,alignItems:'center'},
  etaLabel:{fontSize:11,color:'rgba(255,255,255,0.7)',textTransform:'uppercase',letterSpacing:1},
  etaValue:{fontSize:36,fontWeight:'900',color:'#FFF',marginVertical:4},
  etaName:{fontSize:13,color:'rgba(255,255,255,0.8)'},
  // Progress
  progressCard:{backgroundColor:Colors.subtle,borderRadius:14,padding:16,marginBottom:12},
  progressRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  stepItem:{alignItems:'center',flex:1},
  stepCircle:{width:32,height:32,borderRadius:16,backgroundColor:Colors.border,justifyContent:'center',alignItems:'center',marginBottom:4},
  stepCircleActive:{backgroundColor:Colors.primary},
  stepCircleCurrent:{backgroundColor:Colors.primary,borderWidth:2,borderColor:Colors.textPrimary},
  stepLabel:{fontSize:9,color:Colors.textMuted,textAlign:'center',textTransform:'uppercase',letterSpacing:0.3},
  stepLabelActive:{color:Colors.textPrimary,fontWeight:'600'},
  stepLine:{flex:0.5,height:2,backgroundColor:Colors.border,marginBottom:16},
  stepLineActive:{backgroundColor:Colors.primary},
  // Map
  mapContainer:{height:250,borderRadius:14,overflow:'hidden',marginBottom:12,borderWidth:1,borderColor:Colors.border},
  map:{flex:1},
  // Info
  infoCard:{backgroundColor:Colors.subtle,borderRadius:14,padding:14,marginBottom:10},
  cardTitle:{fontSize:12,fontWeight:'700',color:Colors.textMuted,marginBottom:10,textTransform:'uppercase',letterSpacing:0.5},
  infoRow:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:6,borderBottomWidth:0.5,borderBottomColor:Colors.border},
  infoLabel:{fontSize:12,color:Colors.textMuted,width:80},
  infoVal:{flex:1,fontSize:12,fontWeight:'600',color:Colors.textPrimary},
  // Timeline
  tlCard:{backgroundColor:Colors.subtle,borderRadius:14,padding:14,marginBottom:10},
  tlRow:{flexDirection:'row',alignItems:'flex-start',gap:8,marginBottom:8},
  tlDot:{width:8,height:8,borderRadius:4,marginTop:4,backgroundColor:Colors.border},
  tlInfo:{flex:1},
  tlNote:{fontSize:12,color:Colors.textSecondary,lineHeight:17},
  tlTime:{fontSize:10,color:Colors.textMuted},
  // Actions
  actionsCard:{marginBottom:10},
  actionBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,backgroundColor:Colors.primary,paddingVertical:14,borderRadius:12,marginBottom:8},
  actionBtnT:{color:'#FFF',fontSize:14,fontWeight:'600'},
  reportInput:{backgroundColor:Colors.subtle,borderRadius:10,padding:12,fontSize:13,color:Colors.textPrimary,minHeight:60,textAlignVertical:'top',borderWidth:1,borderColor:Colors.border,marginBottom:8},
  reportCard:{backgroundColor:Colors.subtle,borderRadius:14,padding:14},
  reportText:{fontSize:13,color:Colors.textSecondary,lineHeight:19},
});
