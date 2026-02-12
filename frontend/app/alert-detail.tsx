import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { Colors } from '../src/constants/colors';
import { useTheme } from '../src/context/ThemeContext';

export default function AlertDetailScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const { alertId } = useLocalSearchParams<{ alertId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setData(await apiFetch(`/api/alerts/${alertId}/detail`, {}, token)); }
      catch {} finally { setLoading(false); }
    })();
  }, [alertId]);

  // Auto-refresh for real-time escalation status
  useEffect(() => {
    if (!alertId) return;
    const iv = setInterval(async () => {
      try { setData(await apiFetch(`/api/alerts/${alertId}/detail`, {}, token)); } catch {}
    }, 5000);
    return () => clearInterval(iv);
  }, [alertId, token]);

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View></SafeAreaView>;
  if (!data) return <SafeAreaView style={s.safe}><View style={s.center}><Text>Erreur</Text></View></SafeAreaView>;

  const a = data.alert;
  const ben = data.beneficiary;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="chevron-back" size={22} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={s.topTitle}>Fiche alerte</Text>
        <View style={{width:36}} />
      </View>

      <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}>
        {/* Alert Header */}
        <View style={[s.headerCard, a.severity==='critical' && {borderLeftColor: Colors.destructive}]}>
          <View style={s.headerTop}>
            <Ionicons name={a.alert_type==='sos' ? 'alert-circle' : 'warning'} size={24} color={a.severity==='critical' ? Colors.destructive : Colors.textMuted} />
            <View style={{flex:1}}>
              <Text style={s.alertType}>{a.alert_type === 'sos' ? 'SOS' : a.alert_type === 'fall' ? 'Chute' : 'Anomalie'}</Text>
              <Text style={s.alertSev}>{a.severity === 'critical' ? 'Critique' : a.severity === 'high' ? 'Élevé' : 'Moyen'}</Text>
            </View>
            <View style={[s.statusBdg, a.status==='active' ? {backgroundColor: Colors.destructive+'12'} : {backgroundColor: Colors.success+'12'}]}>
              <Text style={[s.statusBdgT, a.status==='active' ? {color: Colors.destructive} : {color: Colors.success}]}>{a.status==='active' ? 'Active' : 'Résolue'}</Text>
            </View>
          </View>
          <Text style={s.alertMsg}>{a.message}</Text>
        </View>

        {/* Details */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Détails</Text>
          <Row l="Date" v={new Date(a.created_at).toLocaleString('fr-FR')} />
          <Row l="Heure" v={new Date(a.created_at).toLocaleTimeString('fr-FR')} />
          <Row l="Type" v={a.alert_type} />
          <Row l="Sévérité" v={a.severity} />
          <Row l="Appareil" v={a.device_type || 'bracelet'} />
          {a.resolved_at && <Row l="Résolu le" v={new Date(a.resolved_at).toLocaleString('fr-FR')} />}
          {a.teleassistance_status && <Row l="Statut TA" v={a.teleassistance_status} />}
        </View>

        {/* Beneficiary */}
        {ben && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Bénéficiaire</Text>
            <Row l="Nom" v={ben.name} />
            <Row l="Email" v={ben.email} />
            <Row l="Tél." v={ben.phone || '—'} />
            {ben.blood_type && <Row l="Groupe" v={ben.blood_type} />}
            {ben.medical_conditions && <Row l="Pathologies" v={ben.medical_conditions} />}
          </View>
        )}

        {/* Escalations */}
        {data.escalations.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Escalades ({data.escalations.length})</Text>
            {data.escalations.map((e: any) => (
              <View key={e.id} style={s.escBlock}>
                <View style={s.escHeader}>
                  <View style={[s.escDot, {backgroundColor: e.status==='resolved' ? Colors.success : e.status==='dispatched' ? Colors.destructive : Colors.primary}]} />
                  <Text style={s.escStatus}>{e.status}</Text>
                  <Text style={s.escOp}>{e.operator_name}</Text>
                </View>
                {e.timeline?.map((t: any, i: number) => (
                  <View key={i} style={s.tlRow}>
                    <View style={s.tlDot} />
                    <View style={{flex:1}}>
                      <Text style={s.tlNote}>{t.note}</Text>
                      <Text style={s.tlTime}>{new Date(t.time).toLocaleTimeString('fr-FR')}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Calls */}
        {data.calls.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Appels ({data.calls.length})</Text>
            {data.calls.map((c: any) => (
              <View key={c.id} style={s.callRow}>
                <Ionicons name="call" size={14} color={c.answered ? Colors.success : Colors.textMuted} />
                <View style={{flex:1}}>
                  <Text style={s.callName}>{c.target_name} ({c.target_type})</Text>
                  <Text style={s.callMeta}>{c.target_phone} · {c.status} · {new Date(c.created_at).toLocaleTimeString('fr-FR')}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Interventions */}
        {data.interventions.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Interventions ({data.interventions.length})</Text>
            {data.interventions.map((iv: any) => (
              <TouchableOpacity key={iv.id} style={s.ivRow} onPress={() => router.push({pathname:'/intervention-detail', params:{interventionId: iv.id}})}>
                <View style={[s.ivDot, {backgroundColor: iv.status==='completed' ? Colors.success : Colors.primary}]} />
                <View style={{flex:1}}>
                  <Text style={s.ivStatus}>{iv.status}</Text>
                  <Text style={s.ivDate}>{new Date(iv.created_at).toLocaleString('fr-FR')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
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
  sc:{paddingHorizontal:20,paddingBottom:30},
  headerCard:{backgroundColor:Colors.subtle,borderRadius:14,padding:16,marginBottom:12,borderLeftWidth:4,borderLeftColor:Colors.border},
  headerTop:{flexDirection:'row',alignItems:'center',gap:10,marginBottom:8},
  alertType:{fontSize:20,fontWeight:'800',color:Colors.textPrimary},
  alertSev:{fontSize:12,color:Colors.textMuted},
  statusBdg:{paddingHorizontal:10,paddingVertical:4,borderRadius:8},
  statusBdgT:{fontSize:11,fontWeight:'700',textTransform:'uppercase'},
  alertMsg:{fontSize:14,color:Colors.textSecondary,lineHeight:20},
  card:{backgroundColor:Colors.subtle,borderRadius:14,padding:14,marginBottom:10},
  cardTitle:{fontSize:12,fontWeight:'700',color:Colors.textMuted,marginBottom:10,textTransform:'uppercase',letterSpacing:0.5},
  row:{flexDirection:'row',justifyContent:'space-between',paddingVertical:6,borderBottomWidth:0.5,borderBottomColor:Colors.border},
  rowL:{fontSize:12,color:Colors.textMuted},
  rowV:{fontSize:12,fontWeight:'600',color:Colors.textPrimary,flex:1,textAlign:'right'},
  escBlock:{marginBottom:12,paddingBottom:12,borderBottomWidth:0.5,borderBottomColor:Colors.border},
  escHeader:{flexDirection:'row',alignItems:'center',gap:6,marginBottom:6},
  escDot:{width:8,height:8,borderRadius:4},
  escStatus:{fontSize:13,fontWeight:'600',color:Colors.textPrimary,flex:1},
  escOp:{fontSize:11,color:Colors.textMuted},
  tlRow:{flexDirection:'row',alignItems:'flex-start',gap:6,marginBottom:3,marginLeft:4},
  tlDot:{width:5,height:5,borderRadius:3,marginTop:4,backgroundColor:Colors.border},
  tlNote:{fontSize:11,color:Colors.textSecondary,lineHeight:15},
  tlTime:{fontSize:9,color:Colors.textMuted},
  callRow:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:6},
  callName:{fontSize:12,fontWeight:'600',color:Colors.textPrimary},
  callMeta:{fontSize:10,color:Colors.textMuted},
  ivRow:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:6},
  ivDot:{width:8,height:8,borderRadius:4},
  ivStatus:{fontSize:12,fontWeight:'600',color:Colors.textPrimary},
  ivDate:{fontSize:10,color:Colors.textMuted},
});
