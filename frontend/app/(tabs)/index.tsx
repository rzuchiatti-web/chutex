import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { apiFetch } from '../../src/services/api';
import { Colors } from '../../src/constants/colors';

/* ───── BENEFICIARY ───── */
function BeneficiaryHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const [vitals, setVitals] = useState<any>(null);
  const [rec, setRec] = useState('');
  const [reminders, setReminders] = useState<any[]>([]);
  const [vestData, setVestData] = useState<any>(null);
  const [braceletData, setBraceletData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [r, rc, rem, vest, brac] = await Promise.all([
        apiFetch('/api/devices/latest', {}, token).catch(() => ({})),
        apiFetch('/api/ai/recommendations/latest', {}, token).catch(() => ({ recommendation: '' })),
        apiFetch('/api/reminders', {}, token).catch(() => []),
        apiFetch('/api/vest/status', {}, token).catch(() => null),
        apiFetch('/api/bracelet/status', {}, token).catch(() => null),
      ]);
      // Use real bracelet data if available, fallback to simulated
      if (brac && (brac.heart_rate > 0 || brac.steps > 0)) {
        setVitals({
          heart_rate: brac.heart_rate || 0,
          spo2: brac.spo2 || 0,
          blood_pressure_systolic: brac.systolic || 0,
          blood_pressure_diastolic: brac.diastolic || 0,
          temperature: brac.temperature || 0,
          steps: brac.steps || 0,
          stress: 0,
        });
      } else if (r.bracelet) {
        setVitals(r.bracelet.data);
      }
      if (rc.recommendation) setRec(rc.recommendation);
      setReminders(rem);
      setVestData(vest);
      setBraceletData(brac);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); const iv = setInterval(fetchData, 30000); return () => clearInterval(iv); }, [fetchData]);

  const handleSOS = async () => {
    setSosLoading(true);
    try {
      await apiFetch('/api/alerts', { method: 'POST', body: JSON.stringify({ alert_type: 'sos', severity: 'critical', message: 'SOS — Aide requise immédiatement!', device_type: 'bracelet' }) }, token);
      Alert.alert('SOS Envoyé', 'Vos gardiens et la téléassistance ont été alertés.');
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSosLoading(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={s.sv} contentContainerStyle={s.sc} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={Colors.primary} />} showsVerticalScrollIndicator={false}>
      <View style={s.greet}>
        <View><Text style={s.hi}>Bonjour,</Text><Text style={s.name}>{user.name}</Text></View>
        <View style={s.badge}><View style={s.dotOnline} /><Text style={s.badgeT}>En ligne</Text></View>
      </View>

      {/* SOS */}
      <TouchableOpacity testID="sos-button" style={s.sos} onPress={handleSOS} disabled={sosLoading} activeOpacity={0.8}>
        {sosLoading ? <ActivityIndicator color="#FFF" size="large" /> : (
          <><Ionicons name="alert-circle" size={32} color="#FFF" /><Text style={s.sosT}>SOS</Text><Text style={s.sosSub}>Appuyez en cas d'urgence</Text></>
        )}
      </TouchableOpacity>

      {/* Vest Status Card */}
      <TouchableOpacity style={[s.vestCard, { borderColor: vestData?.connected ? Colors.success : vestData?.battery > 0 ? Colors.border : Colors.border, backgroundColor: vestData?.connected ? '#E8F5E9' : Colors.subtle }]} onPress={() => router.push('/vest-connect')} data-testid="vest-status-card">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name={vestData?.battery > 0 ? "shield-checkmark" : "shield-outline"} size={24} color={vestData?.connected ? Colors.success : vestData?.battery > 0 ? Colors.textMuted : Colors.textMuted} />
          <View style={{ flex: 1 }}>
            <Text style={s.vestTitle}>Gilet Anti-Chute</Text>
            <Text style={[s.vestStatus, { color: vestData?.connected ? Colors.success : Colors.textMuted }]}>
              {vestData?.connected ? 'Actif' : vestData?.battery > 0 ? 'Eteint' : 'Appuyer pour configurer'}
              {vestData?.last_sync ? ` · ${new Date(vestData.last_sync).toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'})}` : ''}
            </Text>
          </View>
          {vestData?.battery > 0 && (
            <View style={{ alignItems: 'center' }}>
              <Ionicons name={vestData.battery > 50 ? "battery-full" : vestData.battery > 20 ? "battery-half" : "battery-dead"} size={22} color={vestData.battery > 20 ? Colors.success : Colors.destructive} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.textPrimary }}>{vestData.battery}%</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </View>
      </TouchableOpacity>

      {/* Vitals */}
      <View style={s.secRow}><Text style={s.secTitle}>Constantes clés</Text>
        <TouchableOpacity testID="see-all-health" onPress={() => router.push('/(tabs)/health')}><Text style={s.seeAll}>Tout voir →</Text></TouchableOpacity></View>
      {vitals ? (
        <View style={s.grid}>
          {[
            { id: 'heart_rate', label: 'Pouls', val: vitals.heart_rate, unit: 'bpm', icon: 'heart' },
            { id: 'spo2', label: 'SpO2', val: vitals.spo2, unit: '%', icon: 'water' },
            { id: 'blood_pressure_systolic', label: 'Tension', val: `${vitals.blood_pressure_systolic}/${vitals.blood_pressure_diastolic}`, unit: 'mmHg', icon: 'pulse' },
            { id: 'temperature', label: 'Temp.', val: vitals.temperature, unit: '°C', icon: 'thermometer' },
            { id: 'steps', label: 'Pas', val: vitals.steps, unit: 'pas', icon: 'footsteps' },
            { id: 'stress', label: 'Stress', val: vitals.stress, unit: '', icon: 'flash' },
          ].map(v => (
            <TouchableOpacity key={v.id} testID={`vital-${v.id}`} style={s.vCard}
              onPress={() => router.push({ pathname: '/health-detail', params: { metricId: v.id } })}>
              <Ionicons name={v.icon as any} size={16} color={Colors.textMuted} />
              <Text style={s.vLabel}>{v.label}</Text>
              <Text style={s.vVal}>{v.val}</Text>
              <Text style={s.vUnit}>{v.unit}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={s.empty}><MaterialCommunityIcons name="bluetooth-off" size={28} color={Colors.textMuted} /><Text style={s.emptyT}>Synchronisez vos appareils</Text></View>
      )}

      {rec ? (
        <View style={s.aiCard}>
          <View style={s.aiH}><Ionicons name="sparkles" size={16} color={Colors.textPrimary} /><Text style={s.aiTitle}>Recommandation IA</Text></View>
          <Text style={s.aiText} numberOfLines={4}>{rec}</Text>
        </View>
      ) : null}

      {/* Reminders summary */}
      <View style={s.secRow}><Text style={s.secTitle}>Rappels du jour</Text>
        <TouchableOpacity testID="go-reminders" onPress={() => router.push('/reminders')}><Text style={s.seeAll}>Gérer →</Text></TouchableOpacity></View>
      {reminders.length > 0 ? (
        <View style={s.remGrid}>
          {reminders.filter((r: any) => r.active).slice(0, 4).map((r: any) => {
            const today = new Date().toISOString().split('T')[0];
            const done = r.completions?.includes(today);
            const typeColor = r.reminder_type === 'hydration' ? '#2196F3' : r.reminder_type === 'medication' ? '#E91E63' : '#FF9800';
            return (
              <View key={r.id} style={[s.remCard, done && { opacity: 0.5 }]}>
                <View style={[s.remDot, { backgroundColor: typeColor }]} />
                <Text style={[s.remTitle, done && { textDecorationLine: 'line-through' }]} numberOfLines={1}>{r.title}</Text>
                <Text style={s.remTime}>{r.time}{r.dosage ? ` · ${r.dosage}` : ''}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <TouchableOpacity style={s.addRemBtn} onPress={() => router.push('/reminders')}>
          <Ionicons name="alarm-outline" size={18} color={Colors.textMuted} />
          <Text style={s.addRemBtnT}>Configurer vos rappels quotidiens</Text>
        </TouchableOpacity>
      )}

      {/* Quick actions */}
      <View style={s.quickRow}>
        <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/ecg')}>
          <Ionicons name="pulse-outline" size={20} color={Colors.textPrimary} />
          <Text style={s.quickBtnT}>Lancer ECG</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/sleep')}>
          <Ionicons name="moon-outline" size={20} color={Colors.textPrimary} />
          <Text style={s.quickBtnT}>Sommeil</Text>
        </TouchableOpacity>
      </View>
      <View style={s.quickRow}>
        <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/geofencing')}>
          <Ionicons name="locate-outline" size={20} color={Colors.textPrimary} />
          <Text style={s.quickBtnT}>Zones securite</Text>
        </TouchableOpacity>
      </View>
      <View style={s.quickRow}>
        <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/data-sharing')}>
          <Ionicons name="shield-checkmark-outline" size={20} color={Colors.textPrimary} />
          <Text style={s.quickBtnT}>Partage données</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.quickBtn} onPress={() => router.push('/link-code')}>
          <Ionicons name="qr-code-outline" size={20} color={Colors.textPrimary} />
          <Text style={s.quickBtnT}>Partager code</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/* ───── GUARDIAN ───── */
function GuardianHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const [bens, setBens] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [b, a] = await Promise.all([
        apiFetch('/api/guardian/beneficiaries', {}, token).catch(() => []),
        apiFetch('/api/alerts', {}, token).catch(() => []),
      ]);
      setBens(b); setAlerts(a);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);
  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  const active = alerts.filter((a: any) => a.status === 'active');

  return (
    <ScrollView style={s.sv} contentContainerStyle={s.sc} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={Colors.primary} />} showsVerticalScrollIndicator={false}>
      <View style={s.greet}>
        <View><Text style={s.hi}>Bonjour,</Text><Text style={s.name}>{user.name}</Text></View>
        <View style={s.roleBadge}><Ionicons name="shield-checkmark" size={12} color={Colors.primary} />
          <Text style={s.roleBadgeT}>{user.is_prescriber ? 'Prescripteur' : 'Gardien'}</Text></View>
      </View>

      <View style={s.statsRow}>
        <View style={s.stat}><Text style={s.statV}>{bens.length}</Text><Text style={s.statL}>Bénéficiaires</Text></View>
        <View style={s.stat}><Text style={[s.statV, active.length > 0 && { color: Colors.destructive }]}>{active.length}</Text><Text style={s.statL}>Alertes</Text></View>
      </View>

      {/* Add beneficiary button */}
      <TouchableOpacity style={s.addBenBtn} onPress={() => router.push('/link-code')}>
        <Ionicons name="qr-code-outline" size={16} color={Colors.primary} />
        <Text style={s.addBenBtnT}>Ajouter un bénéficiaire (code / QR)</Text>
      </TouchableOpacity>

      <Text style={s.secTitle}>Bénéficiaires</Text>
      {bens.length > 0 ? bens.map((b: any) => (
        <TouchableOpacity key={b.id} style={s.benCard} onPress={() => router.push({pathname: '/beneficiary-detail', params: {beneficiaryId: b.id}})}>
          <View style={s.benAv}><Text style={s.benAvT}>{b.name?.charAt(0)?.toUpperCase()}</Text></View>
          <View style={s.benInfo}><Text style={s.benName}>{b.name}</Text>
            <Text style={s.benSt}>{b.latest_vitals ? `${b.latest_vitals.heart_rate} bpm · ${b.latest_vitals.temperature}°C` : 'Pas de données'}</Text></View>
          <View style={s.benR}>{b.active_alerts > 0 && <View style={s.alertBdg}><Text style={s.alertBdgT}>{b.active_alerts}</Text></View>}
            <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} /></View>
        </TouchableOpacity>
      )) : (
        <View style={s.empty}><Ionicons name="people-outline" size={28} color={Colors.textMuted} /><Text style={s.emptyT}>Aucun bénéficiaire lié</Text>
          <TouchableOpacity style={{marginTop:10}} onPress={() => router.push('/link-code')}><Text style={{color: Colors.primary, fontWeight:'600', fontSize:13}}>Ajouter via code / QR</Text></TouchableOpacity></View>
      )}

      {active.length > 0 && <>
        <Text style={[s.secTitle, { marginTop: 16 }]}>Alertes récentes</Text>
        {active.slice(0, 3).map((a: any) => (
          <View key={a.id} style={[s.alertRow, a.severity === 'critical' && { borderLeftColor: Colors.destructive }]}>
            <Ionicons name={a.alert_type === 'sos' ? 'alert-circle' : 'warning'} size={18} color={a.severity === 'critical' ? Colors.destructive : Colors.textMuted} />
            <View style={s.alertInfo}><Text style={s.alertMsg}>{a.message}</Text><Text style={s.alertMeta}>{a.beneficiary_name}</Text></View>
          </View>
        ))}
      </>}
    </ScrollView>
  );
}

/* ───── TELEASSISTANCE ───── */
function TeleassistanceHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [activeEscalations, setActiveEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [a, su, esc] = await Promise.all([
        apiFetch('/api/alerts', {}, token).catch(() => []),
        apiFetch('/api/teleassistance/subscribers', {}, token).catch(() => []),
        apiFetch('/api/escalation/active', {}, token).catch(() => []),
      ]);
      setAlerts(a); setSubs(su); setActiveEscalations(esc);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);
  // Auto-refresh every 5 seconds
  useEffect(() => { const iv = setInterval(fetchData, 5000); return () => clearInterval(iv); }, [fetchData]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  const active = alerts.filter((a: any) => a.status === 'active');

  return (
    <ScrollView style={s.sv} contentContainerStyle={s.sc} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={Colors.primary} />} showsVerticalScrollIndicator={false}>
      <View style={s.greet}>
        <View><Text style={s.hi}>Plateau d'écoute</Text><Text style={s.name}>{user.name}</Text></View>
        <View style={s.roleBadge}><Ionicons name="headset" size={12} color={Colors.primary} /><Text style={s.roleBadgeT}>Téléassistance</Text></View>
      </View>

      <View style={s.statsRow}>
        <View style={s.stat}><Text style={[s.statV, active.length > 0 && { color: Colors.destructive }]}>{active.length}</Text><Text style={s.statL}>Alertes actives</Text></View>
        <View style={s.stat}><Text style={[s.statV, activeEscalations.length > 0 && { color: Colors.primary }]}>{activeEscalations.length}</Text><Text style={s.statL}>Escalades</Text></View>
        <View style={s.stat}><Text style={s.statV}>{subs.length}</Text><Text style={s.statL}>Abonnés</Text></View>
      </View>

      {/* Active escalations with live status */}
      {activeEscalations.length > 0 && <>
        <Text style={s.secTitle}>🔴 Protocoles IA en cours</Text>
        {activeEscalations.map((esc: any) => (
          <TouchableOpacity key={esc.id} style={s.escLiveCard} onPress={() => router.push({pathname: '/alert-detail', params: {alertId: esc.alert_id}})}>
            <View style={s.escLiveTop}>
              <View style={[s.escPulse, {backgroundColor: esc.status === 'dispatched' ? Colors.destructive : Colors.primary}]} />
              <View style={{flex:1}}>
                <Text style={s.escLiveName}>{esc.beneficiary_name}</Text>
                <Text style={s.escLiveStep}>
                  {esc.current_step === 'calling_beneficiary' ? '📞 Appel bénéficiaire...' :
                   esc.current_step === 'doubt_lifting' ? '🔍 Levée de doute...' :
                   esc.current_step === 'calling_guardian' ? `📞 Appel gardien ${esc.current_target?.name}...` :
                   esc.current_step === 'dispatched' ? '🚨 Intervention dispatchée' :
                   esc.current_step === 'guardian_handling' ? '✅ Gardien prend en charge' :
                   esc.current_step}
                </Text>
              </View>
              {esc.calls?.length > 0 && <Text style={s.escCallCount}>{esc.calls.length} appels</Text>}
            </View>
            {esc.timeline?.slice(-2).map((t: any, i: number) => (
              <Text key={i} style={s.escTlItem}>• {t.note}</Text>
            ))}
          </TouchableOpacity>
        ))}
      </>}

      {active.length > 0 && <>
        <Text style={s.secTitle}>Alertes en attente</Text>
        {active.slice(0, 5).map((a: any) => (
          <TouchableOpacity key={a.id} style={[s.alertRow, a.severity === 'critical' && { borderLeftColor: Colors.destructive }]}
            onPress={() => router.push({pathname: '/alert-detail', params: {alertId: a.id}})}>
            <Ionicons name={a.alert_type === 'sos' ? 'alert-circle' : 'warning'} size={18} color={a.severity === 'critical' ? Colors.destructive : Colors.textMuted} />
            <View style={s.alertInfo}><Text style={s.alertMsg}>{a.message}</Text><Text style={s.alertMeta}>{a.beneficiary_name} · {new Date(a.created_at).toLocaleTimeString('fr-FR')}</Text></View>
            <View style={{alignItems:'flex-end'}}>
              <View style={[s.sevBdg, a.severity === 'critical' && { backgroundColor: Colors.destructive + '12' }]}>
                <Text style={[s.sevBdgT, a.severity === 'critical' && { color: Colors.destructive }]}>{a.severity}</Text></View>
              {a.teleassistance_status && a.teleassistance_status !== 'pending' && (
                <Text style={s.taStatusT}>{a.teleassistance_status === 'ai_calling' ? '📞 IA en appel' : a.teleassistance_status}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </>}

      <Text style={[s.secTitle, { marginTop: 16 }]}>Abonnés</Text>
      {subs.slice(0, 10).map((su: any) => (
        <TouchableOpacity key={su.id} style={s.benCard} onPress={() => router.push({pathname: '/subscriber-detail', params: {subscriberId: su.id}})}>
          <View style={s.benAv}><Text style={s.benAvT}>{su.name?.charAt(0)?.toUpperCase()}</Text></View>
          <View style={s.benInfo}><Text style={s.benName}>{su.name}</Text>
            <Text style={s.benSt}>{su.latest_vitals ? `${su.latest_vitals.heart_rate} bpm` : 'Pas de données'}</Text></View>
          {su.active_alerts > 0 && <View style={s.alertBdg}><Text style={s.alertBdgT}>{su.active_alerts}</Text></View>}
          <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

/* ───── ADMIN ───── */
function AdminHome({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try { setStats(await apiFetch('/api/backoffice/stats', {}, token)); } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);
  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView style={s.sv} contentContainerStyle={s.sc} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={Colors.primary} />} showsVerticalScrollIndicator={false}>
      <View style={s.greet}>
        <View><Text style={s.hi}>Administration</Text><Text style={s.name}>{user.name}</Text></View>
        <View style={s.roleBadge}><Ionicons name="settings" size={12} color={Colors.primary} /><Text style={s.roleBadgeT}>Admin</Text></View>
      </View>

      {stats && <>
        <View style={s.statsRow}>
          <View style={s.stat}><Text style={s.statV}>{stats.total_users}</Text><Text style={s.statL}>Utilisateurs</Text></View>
          <View style={s.stat}><Text style={[s.statV, stats.active_alerts > 0 && { color: Colors.destructive }]}>{stats.active_alerts}</Text><Text style={s.statL}>Alertes</Text></View>
          <View style={s.stat}><Text style={s.statV}>{stats.prescriptions}</Text><Text style={s.statL}>Prescriptions</Text></View>
        </View>

        <View style={s.grid}>
          {[
            { l: 'Bénéficiaires', v: stats.beneficiaries },
            { l: 'Gardiens', v: stats.guardians },
            { l: 'Prescripteurs', v: stats.prescribers },
            { l: 'Codes actifs', v: stats.activation_codes },
            { l: 'Interventions', v: stats.interventions },
            { l: 'Souscrites', v: stats.subscribed_prescriptions },
          ].map(x => (
            <View key={x.l} style={s.miniStat}><Text style={s.miniStatV}>{x.v}</Text><Text style={s.miniStatL}>{x.l}</Text></View>
          ))}
        </View>
      </>}

      <TouchableOpacity style={s.boBtn} onPress={() => router.push('/backoffice')}>
        <Ionicons name="settings-outline" size={18} color={Colors.primary} />
        <Text style={s.boBtnT}>Ouvrir le Back Office complet</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ───── MAIN ───── */
export default function Dashboard() {
  const { user, token } = useAuth();
  if (!user || !token) return null;
  return (
    <SafeAreaView style={s.safe} testID="dashboard-screen">
      {user.role === 'guardian' ? <GuardianHome token={token} user={user} />
      : user.role === 'teleassistance' ? <TeleassistanceHome token={token} user={user} />
      : user.role === 'admin' ? <AdminHome token={token} user={user} />
      : <BeneficiaryHome token={token} user={user} />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background }, sv: { flex: 1 }, sc: { paddingHorizontal: 20, paddingBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  greet: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 20 },
  hi: { fontSize: 13, color: Colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  name: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  dotOnline: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  badgeT: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: Colors.border },
  roleBadgeT: { fontSize: 11, fontWeight: '600', color: Colors.textPrimary },
  sos: { backgroundColor: Colors.destructive, borderRadius: 16, paddingVertical: 20, alignItems: 'center', marginBottom: 12 },
  sosT: { color: '#FFF', fontSize: 24, fontWeight: '900', marginTop: 4 },
  sosSub: { color: '#FFF', fontSize: 11, opacity: 0.8, marginTop: 2 },
  vestCard: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: Colors.border },
  vestTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  vestStatus: { fontSize: 12, fontWeight: '600', marginTop: 1 },
  secRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  secTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12, letterSpacing: -0.3 },
  seeAll: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  vCard: { width: '31%', backgroundColor: Colors.subtle, borderRadius: 12, padding: 12, alignItems: 'center', gap: 2 },
  vLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 4 },
  vVal: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  vUnit: { fontSize: 10, color: Colors.textMuted },
  aiCard: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 16, marginBottom: 16 },
  aiH: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  aiTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  aiText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  empty: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 24, alignItems: 'center', marginBottom: 16 },
  emptyT: { fontSize: 13, color: Colors.textMuted, marginTop: 8 },
  emptySub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  stat: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: Colors.subtle },
  statV: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary },
  statL: { fontSize: 10, color: Colors.textMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  benCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.subtle, borderRadius: 12, padding: 12, marginBottom: 6, gap: 10 },
  benAv: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  benAvT: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  benInfo: { flex: 1 },
  benName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  benSt: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  benR: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alertBdg: { backgroundColor: Colors.destructive, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  alertBdgT: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  alertRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.subtle, borderRadius: 10, padding: 12, marginBottom: 6, gap: 10, borderLeftWidth: 3, borderLeftColor: Colors.border },
  alertInfo: { flex: 1 },
  alertMsg: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  alertMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  sevBdg: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: Colors.subtle },
  sevBdgT: { fontSize: 9, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  miniStat: { width: '31%', backgroundColor: Colors.subtle, borderRadius: 10, padding: 12, alignItems: 'center' },
  miniStatV: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
  miniStatL: { fontSize: 9, color: Colors.textMuted, marginTop: 2, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.3 },
  boBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.subtle, borderRadius: 12, padding: 16, marginTop: 12 },
  boBtnT: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  addBenBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, marginBottom: 14 },
  addBenBtnT: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  escLiveCard: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 14, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  escLiveTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  escPulse: { width: 10, height: 10, borderRadius: 5 },
  escLiveName: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  escLiveStep: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
  escCallCount: { fontSize: 10, color: Colors.textMuted, backgroundColor: Colors.paper, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  escTlItem: { fontSize: 11, color: Colors.textMuted, marginLeft: 18, lineHeight: 16 },
  taStatusT: { fontSize: 9, color: Colors.primary, fontWeight: '600', marginTop: 2 },
  remGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  remCard: { width: '48%', backgroundColor: Colors.subtle, borderRadius: 10, padding: 12, gap: 4 },
  remDot: { width: 8, height: 8, borderRadius: 4 },
  remTitle: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  remTime: { fontSize: 11, color: Colors.textMuted },
  addRemBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', marginBottom: 16 },
  addRemBtnT: { fontSize: 13, color: Colors.textMuted },
  quickRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.subtle, borderRadius: 10, padding: 14 },
  quickBtnT: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
});
