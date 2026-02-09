import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { Colors } from '../src/constants/colors';

export default function BeneficiaryDetailScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const { beneficiaryId } = useLocalSearchParams<{ beneficiaryId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<string>('');
  const [reportLoading, setReportLoading] = useState(false);
  const [tab, setTab] = useState<'health'|'alerts'|'devices'|'report'>('health');

  useEffect(() => {
    (async () => {
      try { setData(await apiFetch(`/api/guardian/beneficiary/${beneficiaryId}/detail`, {}, token)); }
      catch (e: any) { Alert.alert('Erreur', e.message); }
      finally { setLoading(false); }
    })();
  }, [beneficiaryId]);

  const generateReport = async () => {
    setReportLoading(true);
    try {
      const r = await apiFetch(`/api/guardian/beneficiary/${beneficiaryId}/health-report`, {}, token);
      setReport(r.report); setTab('report');
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setReportLoading(false); }
  };

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View></SafeAreaView>;
  if (!data) return <SafeAreaView style={s.safe}><View style={s.center}><Text>Erreur</Text></View></SafeAreaView>;

  const ben = data.beneficiary;
  const latestData: any = {};
  if (data.readings.length > 0) Object.assign(latestData, data.readings[0].data || {});

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="chevron-back" size={22} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={s.topTitle}>{ben.name}</Text>
        <View style={{width:36}} />
      </View>

      <View style={s.userCard}>
        <View style={s.avatar}><Text style={s.avatarT}>{ben.name?.charAt(0)?.toUpperCase()}</Text></View>
        <View style={{flex:1}}>
          <Text style={s.userName}>{ben.name}</Text>
          <Text style={s.userMeta}>{ben.phone || ben.email}</Text>
        </View>
        <View style={s.statsCol}>
          <Text style={[s.alertCount, data.stats.active_alerts > 0 && {color: Colors.destructive}]}>{data.stats.active_alerts}</Text>
          <Text style={s.alertLabel}>alertes</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll} contentContainerStyle={s.tabScrollC}>
        <TouchableOpacity style={[s.tabBtn, tab==='health' && s.tabBtnA]} onPress={() => setTab('health')}><Text style={[s.tabBtnT, tab==='health' && s.tabBtnTA]}>Santé</Text></TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, tab==='alerts' && s.tabBtnA]} onPress={() => setTab('alerts')}><Text style={[s.tabBtnT, tab==='alerts' && s.tabBtnTA]}>Alertes ({data.alerts.length})</Text></TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, tab==='devices' && s.tabBtnA]} onPress={() => setTab('devices')}><Text style={[s.tabBtnT, tab==='devices' && s.tabBtnTA]}>Appareils</Text></TouchableOpacity>
        <TouchableOpacity style={[s.tabBtn, tab==='report' && s.tabBtnA]} onPress={() => { if (!report) generateReport(); else setTab('report'); }}>
          {reportLoading ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={[s.tabBtnT, tab==='report' && s.tabBtnTA]}>Rapport IA</Text>}
        </TouchableOpacity>
      </ScrollView>

      <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}>
        {tab === 'health' && (
          <>
            {/* Vitals grid */}
            {Object.keys(latestData).length > 0 ? (
              <>
                <Text style={s.secTitle}>Dernières constantes</Text>
                <View style={s.grid}>
                  {Object.entries(latestData).map(([key, val]: any) => (
                    <View key={key} style={s.vitalCard}>
                      <Text style={s.vitalLabel}>{key.replace(/_/g, ' ')}</Text>
                      <Text style={s.vitalVal}>{typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(1)) : val}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : <View style={s.emptyC}><MaterialCommunityIcons name="bluetooth-off" size={28} color={Colors.textMuted} /><Text style={s.emptyT}>Pas de données de santé</Text></View>}

            {/* Medical info */}
            <View style={s.card}>
              <Text style={s.cardTitle}>Infos médicales</Text>
              <Row l="Genre" v={ben.gender || '—'} />
              <Row l="Taille" v={ben.height_cm ? `${ben.height_cm} cm` : '—'} />
              <Row l="Poids" v={ben.weight_kg ? `${ben.weight_kg} kg` : '—'} />
              <Row l="Groupe sanguin" v={ben.blood_type || '—'} />
              <Row l="Allergies" v={ben.allergies || '—'} />
              <Row l="Pathologies" v={ben.medical_conditions || '—'} />
              <Row l="Médecin" v={ben.doctor_name || '—'} />
              <Row l="Contact urgence" v={ben.emergency_contact_name ? `${ben.emergency_contact_name} (${ben.emergency_contact_phone||''})` : '—'} />
            </View>

            {/* Location */}
            {data.location && (
              <View style={s.card}>
                <Text style={s.cardTitle}>Localisation</Text>
                <Text style={s.locText}>Lat: {data.location.latitude?.toFixed(4)}, Lng: {data.location.longitude?.toFixed(4)}</Text>
                <Text style={s.locTime}>Dernière MAJ: {new Date(data.location.updated_at).toLocaleString('fr-FR')}</Text>
              </View>
            )}

            <TouchableOpacity style={s.reportBtn} onPress={generateReport} disabled={reportLoading}>
              {reportLoading ? <ActivityIndicator color="#FFF" /> : (
                <><Ionicons name="sparkles" size={16} color="#FFF" /><Text style={s.reportBtnT}>Générer rapport de santé IA</Text></>)}
            </TouchableOpacity>
          </>
        )}

        {tab === 'alerts' && data.alerts.map((a: any) => (
          <TouchableOpacity key={a.id} style={[s.alertCard, a.severity==='critical' && {borderLeftColor: Colors.destructive}]}
            onPress={() => router.push({pathname: '/alert-detail', params: {alertId: a.id}})}>
            <View style={s.alertTop}>
              <Ionicons name={a.alert_type==='sos' ? 'alert-circle' : 'warning'} size={14} color={a.severity==='critical' ? Colors.destructive : Colors.textMuted} />
              <Text style={s.alertType}>{a.alert_type}</Text>
              <View style={[s.badge, a.status==='active' && {backgroundColor: Colors.destructive+'12'}]}>
                <Text style={[s.badgeT, a.status==='active' && {color: Colors.destructive}]}>{a.status}</Text></View>
            </View>
            <Text style={s.alertMsg}>{a.message}</Text>
            <Text style={s.alertDate}>{new Date(a.created_at).toLocaleString('fr-FR')}</Text>
          </TouchableOpacity>
        ))}

        {tab === 'devices' && (
          <>
            <Text style={s.secTitle}>Appareils connectés</Text>
            {(data.devices || []).length > 0 ? data.devices.map((d: any) => {
              const batteryColor = (d.battery || 0) > 50 ? Colors.success : (d.battery || 0) > 20 ? '#FF9800' : Colors.destructive;
              const icons: any = { bracelet: 'watch-outline', scale: 'scale-outline', vest: 'shirt-outline' };
              return (
                <View key={d.id} style={s.deviceCard}>
                  <Ionicons name={icons[d.device_type] || 'hardware-chip-outline'} size={24} color={Colors.textPrimary} />
                  <View style={{flex: 1}}>
                    <Text style={s.deviceName}>{d.name}</Text>
                    <Text style={s.deviceMeta}>{d.connected ? 'Connecté' : 'Déconnecté'} · Sync: {d.last_sync ? new Date(d.last_sync).toLocaleString('fr-FR') : 'Jamais'}</Text>
                  </View>
                  <View style={s.batteryCol}>
                    <View style={s.batteryOuter}>
                      <View style={[s.batteryInner, { width: `${d.battery || 0}%`, backgroundColor: batteryColor }]} />
                    </View>
                    <Text style={[s.batteryText, { color: batteryColor }]}>{d.battery || 0}%</Text>
                  </View>
                </View>
              );
            }) : <View style={s.emptyC}><Text style={s.emptyT}>Aucun appareil</Text></View>}

            {/* Interventions */}
            {(data.interventions || []).length > 0 && (
              <>
                <Text style={[s.secTitle, {marginTop: 20}]}>Interventions</Text>
                {data.interventions.map((iv: any) => (
                  <TouchableOpacity key={iv.id} style={s.ivCard}
                    onPress={() => router.push({pathname: '/intervention-detail', params: {interventionId: iv.id}})}>
                    <Ionicons name="navigate-circle-outline" size={20} color={Colors.primary} />
                    <View style={{flex: 1}}>
                      <Text style={s.ivStatus}>{iv.status}</Text>
                      <Text style={s.ivDate}>{new Date(iv.created_at).toLocaleString('fr-FR')}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        )}

        {tab === 'report' && (
          <View style={s.reportCard}>
            <View style={s.reportHeader}>
              <Ionicons name="sparkles" size={16} color={Colors.textPrimary} />
              <Text style={s.reportTitle}>Rapport de santé IA</Text>
            </View>
            {report ? <Text style={s.reportText}>{report}</Text> : <Text style={s.emptyT}>Cliquez pour générer le rapport</Text>}
            <TouchableOpacity style={s.regenBtn} onPress={generateReport} disabled={reportLoading}>
              {reportLoading ? <ActivityIndicator color={Colors.primary} /> : <Text style={s.regenBtnT}>Régénérer</Text>}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({l,v}: {l:string;v:string}) {
  return <View style={s.row}><Text style={s.rowL}>{l}</Text><Text style={s.rowV}>{v}</Text></View>;
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:Colors.background},
  center:{flex:1,justifyContent:'center',alignItems:'center'},
  topBar:{flexDirection:'row',alignItems:'center',paddingHorizontal:16,paddingVertical:10,gap:8},
  backBtn:{width:36,height:36,borderRadius:10,backgroundColor:Colors.subtle,justifyContent:'center',alignItems:'center'},
  topTitle:{flex:1,fontSize:18,fontWeight:'700',color:Colors.textPrimary,textAlign:'center'},
  userCard:{flexDirection:'row',alignItems:'center',marginHorizontal:20,marginBottom:12,gap:12},
  avatar:{width:48,height:48,borderRadius:24,backgroundColor:Colors.primary,justifyContent:'center',alignItems:'center'},
  avatarT:{fontSize:20,fontWeight:'700',color:'#FFF'},
  userName:{fontSize:18,fontWeight:'700',color:Colors.textPrimary},
  userMeta:{fontSize:12,color:Colors.textMuted,marginTop:1},
  statsCol:{alignItems:'center'},
  alertCount:{fontSize:22,fontWeight:'800',color:Colors.textPrimary},
  alertLabel:{fontSize:9,color:Colors.textMuted,textTransform:'uppercase'},
  tabScroll:{maxHeight:40,marginBottom:8},
  tabScrollC:{paddingHorizontal:16,gap:6},
  tabBtn:{paddingVertical:8,paddingHorizontal:14,borderRadius:8,backgroundColor:Colors.subtle},
  tabBtnA:{backgroundColor:Colors.primary},
  tabBtnT:{fontSize:12,fontWeight:'600',color:Colors.textMuted},
  tabBtnTA:{color:'#FFF'},
  sc:{paddingHorizontal:20,paddingBottom:30},
  secTitle:{fontSize:14,fontWeight:'700',color:Colors.textPrimary,marginBottom:10},
  grid:{flexDirection:'row',flexWrap:'wrap',gap:6,marginBottom:14},
  vitalCard:{width:'31%',backgroundColor:Colors.subtle,borderRadius:10,padding:10,alignItems:'center'},
  vitalLabel:{fontSize:9,color:Colors.textMuted,textTransform:'uppercase',textAlign:'center'},
  vitalVal:{fontSize:18,fontWeight:'800',color:Colors.textPrimary,marginTop:2},
  card:{backgroundColor:Colors.subtle,borderRadius:14,padding:14,marginBottom:10},
  cardTitle:{fontSize:12,fontWeight:'700',color:Colors.textMuted,marginBottom:8,textTransform:'uppercase',letterSpacing:0.5},
  row:{flexDirection:'row',justifyContent:'space-between',paddingVertical:6,borderBottomWidth:0.5,borderBottomColor:Colors.border},
  rowL:{fontSize:12,color:Colors.textMuted},
  rowV:{fontSize:12,fontWeight:'600',color:Colors.textPrimary,flex:1,textAlign:'right'},
  locText:{fontSize:13,color:Colors.textPrimary},
  locTime:{fontSize:10,color:Colors.textMuted,marginTop:2},
  reportBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,backgroundColor:Colors.primary,paddingVertical:14,borderRadius:12,marginTop:8},
  reportBtnT:{color:'#FFF',fontSize:14,fontWeight:'600'},
  alertCard:{backgroundColor:Colors.subtle,borderRadius:10,padding:10,marginBottom:5,borderLeftWidth:3,borderLeftColor:Colors.border},
  alertTop:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4},
  alertType:{flex:1,fontSize:12,fontWeight:'700',color:Colors.textPrimary,textTransform:'uppercase'},
  badge:{paddingHorizontal:6,paddingVertical:2,borderRadius:4,borderWidth:1,borderColor:Colors.border},
  badgeT:{fontSize:9,fontWeight:'700',color:Colors.textMuted,textTransform:'uppercase'},
  alertMsg:{fontSize:12,color:Colors.textSecondary},
  alertDate:{fontSize:10,color:Colors.textMuted,marginTop:3},
  reportCard:{backgroundColor:Colors.subtle,borderRadius:14,padding:16},
  reportHeader:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:12},
  reportTitle:{fontSize:16,fontWeight:'700',color:Colors.textPrimary},
  reportText:{fontSize:13,color:Colors.textSecondary,lineHeight:20},
  regenBtn:{alignSelf:'center',marginTop:14,paddingVertical:8,paddingHorizontal:16,borderRadius:8,borderWidth:1,borderColor:Colors.border},
  regenBtnT:{fontSize:12,fontWeight:'600',color:Colors.primary},
  emptyC:{alignItems:'center',paddingVertical:30},
  emptyT:{fontSize:13,color:Colors.textMuted,marginTop:6},
  deviceCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.subtle, borderRadius: 10, padding: 14, marginBottom: 6 },
  deviceName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  deviceMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  batteryCol: { alignItems: 'flex-end', gap: 4 },
  batteryOuter: { width: 50, height: 10, backgroundColor: Colors.border, borderRadius: 5, overflow: 'hidden' },
  batteryInner: { height: '100%', borderRadius: 5 },
  batteryText: { fontSize: 11, fontWeight: '700' },
  ivCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.subtle, borderRadius: 10, padding: 14, marginBottom: 6 },
  ivStatus: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, textTransform: 'capitalize' },
  ivDate: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
});
