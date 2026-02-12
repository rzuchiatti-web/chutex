import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert as RNAlert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { Colors } from '../src/constants/colors';
import { useTheme } from '../src/context/ThemeContext';

export default function SubscriberDetailScreen() {
  const { colors: themeColors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const { subscriberId } = useLocalSearchParams<{ subscriberId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview'|'alerts'|'escalations'|'calls'>('overview');

  useEffect(() => {
    (async () => {
      try { setData(await apiFetch(`/api/teleassistance/subscriber/${subscriberId}`, {}, token)); }
      catch (e: any) { RNAlert.alert('Erreur', e.message); }
      finally { setLoading(false); }
    })();
  }, [subscriberId]);

  if (loading) return <SafeAreaView style={[s.safe, { backgroundColor: themeColors.background }]}><View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View></SafeAreaView>;
  if (!data) return <SafeAreaView style={[s.safe, { backgroundColor: themeColors.background }]}><View style={s.center}><Text>Erreur</Text></View></SafeAreaView>;

  const u = data.user;
  const TABS = [{id:'overview',l:'Aperçu'},{id:'alerts',l:`Alertes (${data.stats.total_alerts})`},{id:'escalations',l:`Escalades (${data.escalations.length})`},{id:'calls',l:`Appels (${data.calls.length})`}] as const;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: themeColors.background }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="chevron-back" size={22} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={s.topTitle}>Fiche abonné</Text>
        <View style={{width:36}} />
      </View>

      <View style={s.userCard}>
        <View style={s.avatar}><Text style={s.avatarT}>{u.name?.charAt(0)?.toUpperCase()}</Text></View>
        <View style={s.userInfo}>
          <Text style={s.userName}>{u.name}</Text>
          <Text style={s.userMeta}>{u.email} · {u.phone || 'Pas de tél.'}</Text>
          {u.address ? <Text style={s.userMeta}>{u.address}</Text> : null}
        </View>
      </View>

      <View style={s.statsRow}>
        <View style={[s.stat, data.stats.active_alerts > 0 && {backgroundColor: Colors.destructive+'08'}]}>
          <Text style={[s.statV, data.stats.active_alerts > 0 && {color: Colors.destructive}]}>{data.stats.active_alerts}</Text>
          <Text style={s.statL}>Actives</Text></View>
        <View style={s.stat}><Text style={s.statV}>{data.stats.total_alerts}</Text><Text style={s.statL}>Total alertes</Text></View>
        <View style={s.stat}><Text style={s.statV}>{data.stats.total_escalations}</Text><Text style={s.statL}>Escalades</Text></View>
        <View style={s.stat}><Text style={s.statV}>{data.stats.total_interventions}</Text><Text style={s.statL}>Interv.</Text></View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll} contentContainerStyle={s.tabScrollC}>
        {TABS.map(t => <TouchableOpacity key={t.id} style={[s.tabBtn, tab===t.id && s.tabBtnA]} onPress={() => setTab(t.id)}>
          <Text style={[s.tabBtnT, tab===t.id && s.tabBtnTA]}>{t.l}</Text></TouchableOpacity>)}
      </ScrollView>

      <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}>
        {tab === 'overview' && (
          <>
            {u.blood_type || u.allergies || u.medical_conditions ? (
              <View style={s.card}>
                <Text style={s.cardTitle}>Infos médicales</Text>
                {u.blood_type ? <Row l="Groupe sanguin" v={u.blood_type} /> : null}
                {u.allergies ? <Row l="Allergies" v={u.allergies} /> : null}
                {u.medical_conditions ? <Row l="Pathologies" v={u.medical_conditions} /> : null}
                {u.doctor_name ? <Row l="Médecin" v={u.doctor_name} /> : null}
                {u.emergency_contact_name ? <Row l="Contact urgence" v={`${u.emergency_contact_name} ${u.emergency_contact_phone||''}`} /> : null}
              </View>
            ) : null}
            <View style={s.card}>
              <Text style={s.cardTitle}>Gardiens ({data.guardians.length})</Text>
              {data.guardians.map((g: any) => (
                <View key={g.id} style={s.gRow}>
                  <View style={s.gAv}><Text style={s.gAvT}>{g.name?.charAt(0)}</Text></View>
                  <View style={{flex:1}}><Text style={s.gName}>{g.name}</Text><Text style={s.gPhone}>{g.phone || 'Pas de tél.'}</Text></View>
                </View>
              ))}
              {data.guardians.length === 0 && <Text style={s.emptyT}>Aucun gardien lié</Text>}
            </View>
            {data.latest_readings.length > 0 && (
              <View style={s.card}>
                <Text style={s.cardTitle}>Dernières mesures</Text>
                {data.latest_readings.slice(0,3).map((r: any, i: number) => (
                  <View key={i} style={s.readRow}>
                    <Text style={s.readDevice}>{r.device_type}</Text>
                    <Text style={s.readTime}>{new Date(r.timestamp).toLocaleString('fr-FR')}</Text>
                    <View style={s.readData}>
                      {Object.entries(r.data || {}).slice(0,4).map(([k,v]: any) => <Text key={k} style={s.readVal}>{k}: {typeof v === 'number' ? (Number.isInteger(v) ? v : v.toFixed(1)) : v}</Text>)}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {tab === 'alerts' && data.alerts.map((a: any) => (
          <TouchableOpacity key={a.id} style={[s.alertCard, a.severity==='critical' && {borderLeftColor: Colors.destructive}]}
            onPress={() => router.push({pathname: '/alert-detail', params: {alertId: a.id}})}>
            <View style={s.alertTop}>
              <Ionicons name={a.alert_type==='sos' ? 'alert-circle' : 'warning'} size={16} color={a.severity==='critical' ? Colors.destructive : Colors.textMuted} />
              <Text style={s.alertType}>{a.alert_type}</Text>
              <View style={[s.badge, a.status==='active' && {backgroundColor: Colors.destructive+'12'}]}>
                <Text style={[s.badgeT, a.status==='active' && {color: Colors.destructive}]}>{a.status}</Text></View>
            </View>
            <Text style={s.alertMsg}>{a.message}</Text>
            <Text style={s.alertDate}>{new Date(a.created_at).toLocaleString('fr-FR')}</Text>
          </TouchableOpacity>
        ))}

        {tab === 'escalations' && data.escalations.map((e: any) => (
          <View key={e.id} style={s.escCard}>
            <View style={s.escTop}>
              <View style={[s.escDot, {backgroundColor: e.status==='resolved' ? Colors.success : e.status==='dispatched' ? Colors.destructive : Colors.primary}]} />
              <Text style={s.escStatus}>{e.status==='resolved' ? 'Résolu' : e.status==='dispatched' ? 'Intervention' : 'En cours'}</Text>
              <Text style={s.escDate}>{new Date(e.created_at).toLocaleString('fr-FR')}</Text>
            </View>
            {e.timeline?.map((t: any, i: number) => (
              <View key={i} style={s.tlRow}><View style={s.tlDot} /><Text style={s.tlText}>{t.note}</Text></View>
            ))}
            {e.intervention_id && <TouchableOpacity style={s.viewIvBtn} onPress={() => router.push({pathname:'/intervention-detail', params:{interventionId: e.intervention_id}})}>
              <Ionicons name="map-outline" size={14} color={Colors.primary} /><Text style={s.viewIvBtnT}>Voir intervention</Text></TouchableOpacity>}
          </View>
        ))}

        {tab === 'calls' && data.calls.map((c: any) => (
          <View key={c.id} style={s.callCard}>
            <Ionicons name="call" size={16} color={c.answered ? Colors.success : Colors.textMuted} />
            <View style={{flex:1}}>
              <Text style={s.callTarget}>{c.target_name} ({c.target_type})</Text>
              <Text style={s.callPhone}>{c.target_phone} · {c.status}</Text>
              <Text style={s.callDate}>{new Date(c.created_at).toLocaleString('fr-FR')}</Text>
            </View>
          </View>
        ))}

        {((tab==='alerts' && data.alerts.length===0) || (tab==='escalations' && data.escalations.length===0) || (tab==='calls' && data.calls.length===0)) &&
          <View style={s.emptyC}><Ionicons name="checkmark-circle" size={28} color={Colors.textMuted} /><Text style={s.emptyT}>Aucun élément</Text></View>}
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
  userInfo:{flex:1},
  userName:{fontSize:18,fontWeight:'700',color:Colors.textPrimary},
  userMeta:{fontSize:12,color:Colors.textMuted,marginTop:1},
  statsRow:{flexDirection:'row',marginHorizontal:20,gap:6,marginBottom:10},
  stat:{flex:1,borderRadius:10,padding:10,alignItems:'center',backgroundColor:Colors.subtle},
  statV:{fontSize:20,fontWeight:'800',color:Colors.textPrimary},
  statL:{fontSize:9,color:Colors.textMuted,textTransform:'uppercase',letterSpacing:0.3},
  tabScroll:{maxHeight:40,marginBottom:8},
  tabScrollC:{paddingHorizontal:16,gap:6},
  tabBtn:{paddingVertical:8,paddingHorizontal:14,borderRadius:8,backgroundColor:Colors.subtle},
  tabBtnA:{backgroundColor:Colors.primary},
  tabBtnT:{fontSize:12,fontWeight:'600',color:Colors.textMuted},
  tabBtnTA:{color:'#FFF'},
  sc:{paddingHorizontal:20,paddingBottom:30},
  card:{backgroundColor:Colors.subtle,borderRadius:14,padding:14,marginBottom:10},
  cardTitle:{fontSize:14,fontWeight:'700',color:Colors.textPrimary,marginBottom:10,textTransform:'uppercase',letterSpacing:0.3},
  row:{flexDirection:'row',justifyContent:'space-between',paddingVertical:6,borderBottomWidth:0.5,borderBottomColor:Colors.border},
  rowL:{fontSize:12,color:Colors.textMuted},
  rowV:{fontSize:12,fontWeight:'600',color:Colors.textPrimary,flex:1,textAlign:'right'},
  gRow:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:6},
  gAv:{width:30,height:30,borderRadius:15,backgroundColor:Colors.primary,justifyContent:'center',alignItems:'center'},
  gAvT:{fontSize:12,fontWeight:'700',color:'#FFF'},
  gName:{fontSize:13,fontWeight:'600',color:Colors.textPrimary},
  gPhone:{fontSize:11,color:Colors.textMuted},
  readRow:{marginBottom:8,paddingBottom:8,borderBottomWidth:0.5,borderBottomColor:Colors.border},
  readDevice:{fontSize:12,fontWeight:'700',color:Colors.textPrimary,textTransform:'uppercase'},
  readTime:{fontSize:10,color:Colors.textMuted,marginTop:1},
  readData:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:4},
  readVal:{fontSize:11,color:Colors.textSecondary,backgroundColor:Colors.paper,paddingHorizontal:6,paddingVertical:2,borderRadius:4,borderWidth:0.5,borderColor:Colors.border},
  alertCard:{backgroundColor:Colors.subtle,borderRadius:10,padding:12,marginBottom:6,borderLeftWidth:3,borderLeftColor:Colors.border},
  alertTop:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:4},
  alertType:{flex:1,fontSize:13,fontWeight:'700',color:Colors.textPrimary,textTransform:'uppercase'},
  badge:{paddingHorizontal:6,paddingVertical:2,borderRadius:4,backgroundColor:Colors.subtle,borderWidth:1,borderColor:Colors.border},
  badgeT:{fontSize:9,fontWeight:'700',color:Colors.textMuted,textTransform:'uppercase'},
  alertMsg:{fontSize:12,color:Colors.textSecondary},
  alertDate:{fontSize:10,color:Colors.textMuted,marginTop:4},
  escCard:{backgroundColor:Colors.subtle,borderRadius:12,padding:12,marginBottom:8},
  escTop:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:8},
  escDot:{width:10,height:10,borderRadius:5},
  escStatus:{flex:1,fontSize:13,fontWeight:'600',color:Colors.textPrimary},
  escDate:{fontSize:10,color:Colors.textMuted},
  tlRow:{flexDirection:'row',alignItems:'flex-start',gap:6,marginBottom:4,marginLeft:4},
  tlDot:{width:6,height:6,borderRadius:3,marginTop:4,backgroundColor:Colors.border},
  tlText:{flex:1,fontSize:11,color:Colors.textSecondary,lineHeight:16},
  viewIvBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:4,marginTop:8,paddingVertical:8,borderRadius:8,borderWidth:1,borderColor:Colors.border},
  viewIvBtnT:{fontSize:12,fontWeight:'600',color:Colors.primary},
  callCard:{flexDirection:'row',alignItems:'center',backgroundColor:Colors.subtle,borderRadius:10,padding:10,marginBottom:4,gap:8},
  callTarget:{fontSize:13,fontWeight:'600',color:Colors.textPrimary},
  callPhone:{fontSize:11,color:Colors.textMuted},
  callDate:{fontSize:10,color:Colors.textMuted},
  emptyC:{alignItems:'center',paddingVertical:30},
  emptyT:{fontSize:13,color:Colors.textMuted,marginTop:6},
});
