import { Icon, MCIcon } from '../../src/components/WebIcon';
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal, Linking, Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

const confirmAction = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [{ text: 'Annuler', style: 'cancel' }, { text: 'Confirmer', style: 'destructive', onPress: onConfirm }]);
  }
};
import { apiFetch } from '../../src/services/api';
import { Colors } from '../../src/constants/colors';
import { useTheme } from '../../src/context/ThemeContext';
import { PageExplainer } from '../../src/components/HelpSystem';

/* ===== BENEFICIARY: DEVICE MANAGEMENT ===== */
const BG_BLACK = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';

function DeviceManagement({ token }: { token: string }) {
  const router = useRouter();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingDevice, setSyncingDevice] = useState<string | null>(null);
  const [vestStatus, setVestStatus] = useState<any>(null);
  const [braceletStatus, setBraceletStatus] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);

  const fetchDevices = useCallback(async () => {
    try {
      const [devs, vs, bs, sub] = await Promise.all([
        apiFetch('/api/devices', {}, token),
        apiFetch('/api/vest/status', {}, token).catch(() => null),
        apiFetch('/api/bracelet/status', {}, token).catch(() => null),
        apiFetch('/api/subscriptions/my', {}, token).catch(() => null),
      ]);
      setDevices(devs);
      setVestStatus(vs);
      setBraceletStatus(bs);
      setSubscription(sub);
    } catch (e) { console.error(e); } finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  const syncDevice = async (deviceType: string) => {
    if (deviceType === 'vest') { router.push('/vest-connect'); return; }
    if (deviceType === 'bracelet') {
      if (!subscription?.can_use_bracelet) { Alert.alert('Abonnement requis', 'Un abonnement Standard ou Care est necessaire.'); return; }
      router.push('/bracelet-connect'); return;
    }
    setSyncingDevice(deviceType);
    try {
      await apiFetch('/api/devices/sync', { method: 'POST', body: JSON.stringify({ device_type: deviceType, data: {} }) }, token);
      Alert.alert('Synchronise', `${deviceType} synchronise.`);
      fetchDevices();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSyncingDevice(null); }
  };

  const getDeviceName = (type: string) => type === 'bracelet' ? 'Bracelet Elio' : type === 'scale' ? 'Balance Vita' : 'Gilet Elder S-AIRBAG';
  const getDeviceDesc = (type: string) => type === 'bracelet' ? 'Suivi cardiaque, SpO2, temperature et detection de chute en continu.' : type === 'scale' ? 'Poids et composition corporelle avec plus de 30 metriques de sante.' : 'Protection anti-chute par airbag. Se gonfle automatiquement en cas de chute.';
  const getDeviceImg = (type: string) => type === 'bracelet'
    ? 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg'
    : type === 'scale'
    ? 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/dwmw2i8r_Balance_connecte_Vita_chutex.svg'
    : 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/ljh1zzu3_Gilet_Elder_airbag_Chutex.svg';
  const getDeviceLink = (type: string) => type === 'bracelet' ? 'https://chutex-innovation.com/bracelet-elio' : type === 'scale' ? 'https://chutex-innovation.com/balance-vita' : 'https://chutex-innovation.com/gilet-elder';

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}><ActivityIndicator size="large" color="#FFF" /></View>;

  /* ─── WEB: Full-page black satin design ─── */
  if (Platform.OS === 'web') {
    return (
      <div data-testid="devices-page" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_BLACK} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />

        {/* Header — no subscription pill */}
        <div style={{ position: 'relative', padding: '28px 20px 16px', zIndex: 10, textAlign: 'center' } as any}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>Appareils connectes</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Gerez vos dispositifs de sante Chutex</div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '0 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>

          {/* Product cards — sorted: associated first */}
          {[...devices].sort((a, b) => {
            const aActive = (a.device_type === 'vest' ? vestStatus?.connected : a.device_type === 'bracelet' ? braceletStatus?.connected : a.connected) || a.battery > 0;
            const bActive = (b.device_type === 'vest' ? vestStatus?.connected : b.device_type === 'bracelet' ? braceletStatus?.connected : b.connected) || b.battery > 0;
            return (bActive ? 1 : 0) - (aActive ? 1 : 0);
          }).map((device) => {
            const isVest = device.device_type === 'vest';
            const isBracelet = device.device_type === 'bracelet';
            const vestConnected = isVest && vestStatus?.connected;
            const braceletConnected = isBracelet && braceletStatus?.connected;
            const realBattery = isVest ? (vestStatus?.battery || device.battery) : isBracelet ? (braceletStatus?.battery || device.battery) : device.battery;
            const realConnected = isVest ? vestConnected : isBracelet ? braceletConnected : device.connected;
            const needsSub = isBracelet && !subscription?.can_use_bracelet;
            const isAssociated = realConnected || realBattery > 0;

            return (
              <div key={device.id} data-testid={`device-card-${device.device_type}`} style={{
                borderRadius: 24, marginBottom: 16, overflow: 'hidden',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
              } as any}>

                {/* Product image + status/delete overlays */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', minHeight: 180 } as any}>
                  <img src={getDeviceImg(device.device_type)} alt={getDeviceName(device.device_type)} style={{
                    height: 150, width: 'auto', maxWidth: '80%', objectFit: 'contain',
                    filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))',
                  } as any} />
                  {/* Delete button — top-left (only if associated) */}
                  {isAssociated && (
                    <div data-testid={`remove-${device.device_type}-btn`} onClick={(e: any) => {
                      e.stopPropagation();
                      if (window.confirm(`Dissocier ${getDeviceName(device.device_type)} ?\n\nCette action supprimera le lien avec cet appareil.`)) {
                        apiFetch(`/api/devices/${device.id}/remove`, { method: 'DELETE' }, token).then(() => fetchDevices()).catch(() => fetchDevices());
                      }
                    }} style={{ position: 'absolute', top: 12, left: 12, width: 34, height: 34, borderRadius: 999, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } as any}>
                      <i className="ri-delete-bin-line" style={{ fontSize: 15, color: '#EF4444' }} />
                    </div>
                  )}
                  {/* Status pill — top-right */}
                  {isAssociated && (
                    <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: realConnected ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)', border: `1px solid ${realConnected ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`, backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } as any}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: realConnected ? '#10B981' : 'rgba(255,255,255,0.3)' } as any} />
                      <span style={{ fontSize: 10, fontWeight: 600, color: realConnected ? '#10B981' : 'rgba(255,255,255,0.5)' }}>Connecte</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: '0 20px 20px' } as any}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>{getDeviceName(device.device_type)}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 16 }}>{getDeviceDesc(device.device_type)}</div>

                  {/* Buttons: battery bar if associated, else Associer + Decouvrir */}
                  {isAssociated ? (
                    <div style={{ position: 'relative' } as any}>
                      {/* Battery label */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } as any}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}><i className="ri-battery-line" style={{ fontSize: 14, marginRight: 6 }} />Batterie</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: realBattery > 50 ? '#10B981' : realBattery > 20 ? '#F59E0B' : '#EF4444' }}>{realBattery}%</span>
                      </div>
                      {/* Thick glass animated battery bar */}
                      <div style={{ height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', position: 'relative', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' } as any}>
                        <div style={{
                          height: '100%', borderRadius: 7,
                          width: `${Math.max(4, realBattery)}%`,
                          background: realBattery > 50
                            ? 'linear-gradient(90deg, #059669, #10B981, #34D399)'
                            : realBattery > 20
                            ? 'linear-gradient(90deg, #D97706, #F59E0B, #FBBF24)'
                            : 'linear-gradient(90deg, #DC2626, #EF4444, #F87171)',
                          boxShadow: realBattery > 50 ? '0 0 12px rgba(16,185,129,0.4)' : realBattery > 20 ? '0 0 12px rgba(245,158,11,0.4)' : '0 0 12px rgba(239,68,68,0.4)',
                          transition: 'width 1s cubic-bezier(.22,.61,.36,1)',
                          position: 'relative', overflow: 'hidden',
                        } as any}>
                          {/* Animated shine */}
                          <div style={{ position: 'absolute', top: 0, left: '-100%', width: '200%', height: '100%', background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)', animation: 'batteryShine 2.5s ease-in-out infinite' } as any} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 10 } as any}>
                      <div data-testid={`connect-${device.device_type}-btn`} onClick={() => {
                        if (isVest) router.push('/vest-connect');
                        else if (isBracelet) syncDevice('bracelet');
                        else if (device.device_type === 'scale') router.push('/scale-detail');
                        else syncDevice(device.device_type);
                      }} style={{
                        flex: 1, padding: '13px 16px', borderRadius: 999, cursor: needsSub ? 'not-allowed' : 'pointer',
                        background: '#FFF', color: '#111',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        fontSize: 14, fontWeight: 700, opacity: needsSub ? 0.4 : 1,
                      } as any}>
                        <i className="ri-bluetooth-line" style={{ fontSize: 16 }} />
                        Associer
                      </div>
                      <div onClick={() => { if (typeof window !== 'undefined') window.open(getDeviceLink(device.device_type), '_blank'); }} style={{
                        flex: 1, padding: '13px 16px', borderRadius: 999, cursor: 'pointer',
                        background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
                        color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        fontSize: 14, fontWeight: 600,
                      } as any}
                        onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                        onMouseLeave={(e: any) => { e.currentTarget.style.background = 'transparent'; }}
                      >
                        <i className="ri-external-link-line" style={{ fontSize: 14 }} />
                        Decouvrir
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty state */}
          {devices.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px' } as any}>
              <i className="ri-bluetooth-connect-line" style={{ fontSize: 40, color: 'rgba(255,255,255,0.25)' }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: '#FFF', marginTop: 14 }}>Aucun appareil</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Vos appareils connectes apparaitront ici</div>
            </div>
          )}

        </div>
      </div>
    );
  }

  /* ─── NATIVE FALLBACK ─── */
  return (
    <ScrollView style={d.sv} contentContainerStyle={d.sc}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDevices(); }} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}>

      {subscription && (
        <View style={[d.infoText, { flexDirection: 'row', alignItems: 'center', gap: 8, borderColor: subscription.has_subscription ? Colors.success : Colors.border }]}>
          <Icon name={subscription.has_subscription ? "checkmark-circle" : "alert-circle"} size={16} color={subscription.has_subscription ? Colors.success : Colors.textMuted} />
          <Text style={{ fontSize: 12, color: subscription.has_subscription ? Colors.success : Colors.textSecondary, flex: 1, fontWeight: '600' }}>
            {subscription.has_subscription
              ? `Abonnement ${subscription.subscription_type?.toUpperCase()} actif${subscription.has_teleassistance ? ' - Teleassistance incluse' : ''}`
              : 'Pas d\'abonnement - Gilet et balance disponibles'}
          </Text>
        </View>
      )}

      {devices.map((device) => {
        const isVest = device.device_type === 'vest';
        const isBracelet = device.device_type === 'bracelet';
        const vestConnected = isVest && vestStatus?.connected;
        const braceletConnected = isBracelet && braceletStatus?.connected;
        const realBattery = isVest ? (vestStatus?.battery || device.battery) : isBracelet ? (braceletStatus?.battery || device.battery) : device.battery;
        const realConnected = isVest ? vestConnected : isBracelet ? braceletConnected : device.connected;
        const needsSub = isBracelet && !subscription?.can_use_bracelet;

        return (
          <View key={device.id} style={[d.deviceCard, needsSub && { opacity: 0.6 }]} testID={`device-card-${device.device_type}`}>
            <View style={d.deviceHeader}>
              <View style={d.deviceIconBg}><MCIcon name={(device.device_type === 'bracelet' ? 'watch' : device.device_type === 'scale' ? 'scale-bathroom' : 'tshirt-crew') as any} size={24} color={Colors.textPrimary} /></View>
              <View style={d.deviceInfo}>
                <Text style={d.deviceName}>{getDeviceName(device.device_type)}</Text>
                <View style={d.deviceMeta}>
                  <View style={[d.connDot, { backgroundColor: realConnected ? Colors.success : Colors.textMuted }]} />
                  <Text style={[d.connText, { color: realConnected ? Colors.success : Colors.textMuted }]}>
                    {realConnected ? 'Actif' : 'Deconnecte'}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={d.batteryT}>{realBattery}%</Text>
              </View>
            </View>
            <TouchableOpacity style={d.syncBtn} onPress={() => {
              if (isVest) router.push('/vest-connect');
              else if (isBracelet) syncDevice('bracelet');
              else if (device.device_type === 'scale') router.push('/scale-detail');
              else syncDevice(device.device_type);
            }} disabled={needsSub}>
              <Icon name="bluetooth" size={16} color={realConnected ? Colors.success : Colors.primary} />
              <Text style={d.syncBtnText}>{realConnected ? 'Voir details' : 'Connecter'}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </ScrollView>
  );
}

/* ===== REWARDS CARD FOR PRESCRIBERS ===== */
function RewardsCard({ token }: { token: string }) {
  const [data, setData] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  useEffect(() => { apiFetch('/api/rewards/ranking', {}, token).then(setData).catch(() => {}); }, [token]);
  if (!data) return null;
  const posColor = data.my_position === 1 ? '#FFD700' : data.my_position === 2 ? '#C0C0C0' : data.my_position === 3 ? '#CD7F32' : '#000';
  const myPrize = data.my_position === 1 ? data.prizes?.['1'] : data.my_position === 2 ? data.prizes?.['2'] : data.my_position === 3 ? data.prizes?.['3'] : 0;
  return (
    <>
      <TouchableOpacity onPress={() => setShowDetail(true)} activeOpacity={0.8}>
        <View style={{ backgroundColor: '#FFF8E1', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#FFD54F', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center' }}>
            <Icon name="trophy" size={24} color="#111827" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '900', color: '#111827' }}>Challenge du mois</Text>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>1er: {data.prizes?.['1']}EUR - 2e: {data.prizes?.['2']}EUR - 3e: {data.prizes?.['3']}EUR</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: posColor }}>{data.my_position}<Text style={{ fontSize: 11 }}>e</Text></Text>
            <Text style={{ fontSize: 9, color: '#6B7280' }}>position</Text>
          </View>
          <Icon name="chevron-forward" size={16} color="#FFB300" />
        </View>
      </TouchableOpacity>
      {data.prescriptions_to_next > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, marginTop: -8, paddingHorizontal: 4 }}>
          <Icon name="flame" size={14} color="#FF9800" />
          <Text style={{ fontSize: 12, color: '#E65100', fontWeight: '700' }}>Plus que {data.prescriptions_to_next} prescription{data.prescriptions_to_next > 1 ? 's' : ''} pour monter !</Text>
        </View>
      )}
      <Modal visible={showDetail} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>Challenge Prescripteurs</Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}><Icon name="close" size={24} color="#888" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ backgroundColor: '#FFF8E1', borderRadius: 16, padding: 16, marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#F57F17', textAlign: 'center', marginBottom: 12 }}>Recompenses du mois</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  {[{pos: '1er', prize: data.prizes?.['1'], color: '#FFD700', icon: 'trophy'}, {pos: '2e', prize: data.prizes?.['2'], color: '#C0C0C0', icon: 'medal'}, {pos: '3e', prize: data.prizes?.['3'], color: '#CD7F32', icon: 'ribbon'}].map(t => (
                    <View key={t.pos} style={{ alignItems: 'center' }}>
                      <View style={{ width: 44, height: 44, borderRadius: 24, backgroundColor: t.color, justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
                        <Icon name={t.icon as any} size={22} color="#111827" />
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#111827' }}>{t.prize}EUR</Text>
                      <Text style={{ fontSize: 11, color: '#6B7280' }}>{t.pos}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={{ backgroundColor: posColor + '15', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: posColor }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', textAlign: 'center', marginBottom: 4 }}>VOTRE POSITION</Text>
                <Text style={{ fontSize: 36, fontWeight: '900', color: posColor, textAlign: 'center' }}>{data.my_position}<Text style={{ fontSize: 16 }}>e</Text></Text>
                <Text style={{ fontSize: 14, color: '#111827', textAlign: 'center', fontWeight: '600' }}>{data.my_prescriptions} prescription{data.my_prescriptions !== 1 ? 's' : ''} ce mois</Text>
                {myPrize > 0 && <Text style={{ fontSize: 13, color: '#10B981', textAlign: 'center', fontWeight: '800', marginTop: 4 }}>Vous gagnez {myPrize}EUR !</Text>}
                {data.prescriptions_to_next > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
                    <Icon name="flame" size={16} color="#FF9800" />
                    <Text style={{ fontSize: 13, color: '#E65100', fontWeight: '700' }}>Plus que {data.prescriptions_to_next} pour monter !</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 10 }}>Classement anonyme</Text>
              {(data.ranking || []).map((r: any) => (
                <View key={r.position} style={[{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }, r.is_me && { backgroundColor: '#FFF8E1', borderRadius: 10, paddingHorizontal: 8 }]}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: r.position === 1 ? '#FFD700' : r.position === 2 ? '#C0C0C0' : r.position === 3 ? '#CD7F32' : 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: r.position <= 3 ? '#FFF' : '#888' }}>{r.position}</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: r.is_me ? '900' : '600', color: '#111827', flex: 1 }}>{r.is_me ? 'Vous' : `Prescripteur #${r.position}`}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: r.position <= 3 ? '#4CAF50' : '#888' }}>{r.prescriptions} presc.</Text>
                </View>
              ))}
              <View style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 14, padding: 14, marginTop: 16 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827', marginBottom: 6 }}>Regles du programme</Text>
                <Text style={{ fontSize: 12, color: '#555', lineHeight: 18 }}>Les 3 meilleurs prescripteurs du mois recoivent une prime versee debut du mois suivant. Le classement est base sur le nombre de prescriptions validees. Seules les prescriptions du mois en cours comptent.</Text>
              </View>
              {data.history?.length > 0 && (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 10 }}>Historique</Text>
                  {data.history.map((h: any, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
                      <Text style={{ fontSize: 12, color: '#6B7280', width: 60 }}>{h.month}</Text>
                      <Icon name="trophy" size={14} color="#FFD700" />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#111827' }}>{h.winner_name || 'Prescripteur #1'}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ===== GUARDIAN: PRESCRIPTIONS ===== */
function PrescriptionManagement({ token, user }: { token: string; user: any }) {
  const { refreshUser } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', type: 'standard', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [actCode, setActCode] = useState('');
  const [activating, setActivating] = useState(false);
  const [showPrescModal, setShowPrescModal] = useState(false);
  const [selectedPresc, setSelectedPresc] = useState<any>(null);
  const [showRewardsPage, setShowRewardsPage] = useState(false);
  const [rewardsData, setRewardsData] = useState<any>(null);
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);
  const [anonymize, setAnonymize] = useState(false);
  const [showRewardsExplainer, setShowRewardsExplainer] = useState(false);

  const fetchPrescriptions = useCallback(async () => {
    try { setPrescriptions(await apiFetch('/api/guardian/prescriptions', {}, token)); } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { if (user?.is_prescriber) fetchPrescriptions(); else setLoading(false); }, [fetchPrescriptions, user]);

  const activatePrescriber = async () => {
    if (!actCode.trim()) { setPrescError('Entrez un code prescripteur'); return; }
    setActivating(true); setPrescError('');
    try {
      await apiFetch('/api/guardian/activate-prescriber', { method: 'POST', body: JSON.stringify({ code: actCode.trim().toUpperCase() }) }, token);
      Alert.alert('Active', 'Votre espace prescripteur est maintenant actif !');
      setActCode(''); await refreshUser();
    } catch (e: any) { setPrescError(e.message || 'Code invalide'); } finally { setActivating(false); }
  };

  const submitPrescription = async () => {
    if (!formData.name || !formData.email) return Alert.alert('Erreur', 'Nom et email requis');
    setSubmitting(true);
    try {
      await apiFetch('/api/guardian/prescriptions', { method: 'POST', body: JSON.stringify({
        beneficiary_name: formData.name, beneficiary_email: formData.email, beneficiary_phone: formData.phone,
        subscription_type: formData.type, notes: formData.notes,
      }) }, token);
      setShowForm(false); setFormData({ name: '', email: '', phone: '', type: 'standard', notes: '' }); fetchPrescriptions();
      Alert.alert('Prescription creee');
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSubmitting(false); }
  };

  const validated = prescriptions.filter((p: any) => p.status === 'subscribed');
  const pending = prescriptions.filter((p: any) => p.status === 'pending');
  const [prescTab, setPrescTab] = useState<'pending'|'validated'>('pending');
  const displayedPresc = prescTab === 'pending' ? pending : validated;

  const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};

  const BG_ORANGE = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/1lq6xl58_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2008_54_55.png';
  const BG_GREEN_P = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/uvntv6me_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2008_31_33.png';
  const LOGO_URL_P = 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/Logo_chutex_1.png?v=1737551429';
  const BG_HEADER_P = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/1lq6xl58_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2008_54_55.png';

  const [slideActivatedP, setSlideActivatedP] = useState(false);
  const [prescError, setPrescError] = useState('');

  if (loading) return <View style={d.center}><ActivityIndicator size="large" color="#D4845A" /></View>;

  /* ─── EXPLAINER: Programme recompenses (early return) ─── */
  if (showRewardsExplainer && Platform.OS === 'web') {
    const BG_REWARD_EX = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/4tk4fqvn_background_r%C3%A9compense.jpg';
    return (
      <div data-testid="programme-recompenses-page" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_REWARD_EX} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1 } as any} />

        {/* Top bar */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 16px 0', zIndex: 10 } as any}>
          <div data-testid="back-from-rewards-explainer" onClick={() => setShowRewardsExplainer(false)} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} />
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#FFF' }}>Programme de recompenses</span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '20px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>

          {/* Intro */}
          <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
            <div style={{ width: 64, height: 64, borderRadius: 999, background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}>
              <i className="ri-trophy-line" style={{ fontSize: 32, color: '#FFD700' }} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>Challenges Prescripteurs</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
              Chaque mois, les prescripteurs les plus actifs sont recompenses. Prescrivez des abonnements CARE WATCH et gagnez des primes.
            </div>
          </div>

          {/* How it works */}
          <div style={{ marginBottom: 28 } as any}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Comment ca fonctionne</div>
            {[
              { icon: 'ri-file-text-line', title: 'Prescrivez un abonnement', desc: 'Creez une prescription pour un beneficiaire. Une fois que celui-ci souscrit, la prescription est validee et comptabilisee.', color: '#D4845A' },
              { icon: 'ri-bar-chart-box-line', title: 'Montez dans le classement', desc: 'Chaque prescription validee vous fait monter dans le classement mensuel. Plus vous prescrivez, plus vous montez.', color: '#3B82F6' },
              { icon: 'ri-trophy-line', title: 'Gagnez des primes', desc: 'A la fin du mois, les 3 meilleurs prescripteurs recoivent une prime automatiquement versee. Les montants varient chaque mois.', color: '#FFD700' },
              { icon: 'ri-refresh-line', title: 'Recommencez', desc: 'Le classement est reinitialise chaque 1er du mois. Chaque mois est une nouvelle chance de gagner.', color: '#10B981' },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start' } as any}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: `${s.color}25`, border: `1px solid ${s.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <i className={s.icon} style={{ fontSize: 22, color: s.color }} />
                </div>
                <div style={{ flex: 1, paddingTop: 2 } as any}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF', marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Prizes */}
          <div style={{ marginBottom: 28 } as any}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Grille des primes</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 } as any}>
              {[
                { pos: '1er', amount: '100 EUR', color: '#FFD700', icon: 'ri-medal-line' },
                { pos: '2eme', amount: '70 EUR', color: '#C0C0C0', icon: 'ri-medal-line' },
                { pos: '3eme', amount: '30 EUR', color: '#CD7F32', icon: 'ri-award-line' },
              ].map((p, i) => (
                <div key={i} style={{ padding: '18px 12px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' } as any}>
                  <div style={{ width: 44, height: 44, borderRadius: 999, background: `${p.color}30`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 } as any}>
                    <i className={p.icon} style={{ fontSize: 22, color: p.color }} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', marginBottom: 2 }}>{p.pos}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: p.color }}>{p.amount}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rules */}
          <div style={{ marginBottom: 28 } as any}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Regles du programme</div>
            {[
              'Seules les prescriptions validees (abonnement actif) sont comptabilisees.',
              'Le classement est reinitialise le 1er de chaque mois a 00h00.',
              'Les primes sont versees dans les 5 jours ouvrables suivant la fin du mois.',
              'En cas d\'egalite, le prescripteur ayant atteint le nombre en premier est favorise.',
              'Le programme est reserve aux prescripteurs actifs avec un code structure valide.',
              'Les montants des primes peuvent varier chaque mois selon les conditions du programme.',
            ].map((rule, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 } as any}>
                <div style={{ width: 22, height: 22, borderRadius: 999, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 } as any}>
                  <i className="ri-check-line" style={{ fontSize: 12, color: '#10B981' }} />
                </div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{rule}</span>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div style={{ marginBottom: 20 } as any}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Questions frequentes</div>
            {[
              { q: 'Comment activer mon espace prescripteur ?', a: 'Vous devez entrer le code a 6 chiffres fourni par votre structure. Ce code est unique et vous est attribue lors de votre inscription.' },
              { q: 'Quand serai-je paye ?', a: 'Les primes sont versees debut du mois suivant. Les commissions sur les prescriptions sont payees le 1er de chaque mois.' },
              { q: 'Le classement est-il anonyme ?', a: 'Oui, vous pouvez activer le mode anonyme depuis la page de classement. Les autres prescripteurs ne verront que votre initiale.' },
              { q: 'Puis-je gagner chaque mois ?', a: 'Absolument. Le classement est reinitialise chaque mois, donc chaque mois est une nouvelle opportunite.' },
            ].map((faq, i) => (
              <div key={i} style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 } as any}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 6 }}>{faq.q}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{faq.a}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    );
  }

  /* ─── INACTIF: plein écran orange ─── */
  if (!user?.is_prescriber && Platform.OS === 'web') {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', zIndex: 10 } as any}>
        <img src={BG_ORANGE} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 28px', width: '100%', maxWidth: 400 } as any}>
          {!slideActivatedP ? (
            <>
              <img src={LOGO_URL_P} alt="Chutex" className="anim-up" style={{ height: 60, marginTop: -30, marginBottom: 24, filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.15))' } as any} />
              <div className="anim-up d1" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', marginBottom: 20, backdropFilter: 'blur(8px)' } as any}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' } as any} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Inactif</span>
              </div>
              <h2 className="anim-up d2" style={{ fontSize: 28, fontWeight: 800, color: '#FFF', margin: '0 0 12px', textAlign: 'center' } as any}>Prescription</h2>
              <p className="anim-up d3" style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 1.6, margin: '0 0 40px' } as any}>
                Activer votre espace de prescription et suivez en temps reel vos commissions.
              </p>
              <div className="anim-up d4" style={{ width: '100%' } as any}>
                <div style={{ width: '100%', height: 58, borderRadius: 999, position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)' } as any}
                  onMouseDown={(e: any) => {
                    const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement;
                    if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 52;
                    const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.clientX - e.clientX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { thumb.style.transform = `translateX(${maxX}px)`; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); setSlideActivatedP(true); } };
                    const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
                    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
                  }}
                  onTouchStart={(e: any) => {
                    const bar = e.currentTarget; const thumb = bar.querySelector('[data-thumb]') as HTMLElement;
                    if (!thumb) return; const rect = bar.getBoundingClientRect(); const maxX = rect.width - 52; const startX = e.touches[0].clientX;
                    const onMove = (ev: any) => { const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX)); thumb.style.transform = `translateX(${dx}px)`; if (dx > maxX * 0.8) { bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); setSlideActivatedP(true); } };
                    const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s'; setTimeout(() => { thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); };
                    bar.addEventListener('touchmove', onMove, { passive: true }); bar.addEventListener('touchend', onUp);
                  }}>
                  <div data-thumb style={{ position: 'absolute', top: 4, left: 4, width: 50, height: 50, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', willChange: 'transform', touchAction: 'none' } as any}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, pointerEvents: 'none', paddingLeft: 36 } as any}>Glisser pour commencer</div>
                </div>
              </div>
            </>
          ) : (
            <div className="anim-up" style={{ width: '100%', textAlign: 'center' } as any}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', marginBottom: 20, backdropFilter: 'blur(8px)' } as any}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' } as any} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Inactif</span>
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#FFF', margin: '0 0 8px' }}>Activation</h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 0 28px' } as any}>Renseigner votre code.</p>

              {/* Glass red error */}
              {prescError && (
                <div className="anim-up" style={{ width: '100%', padding: '12px 18px', borderRadius: 999, background: 'rgba(239,68,68,0.15)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(239,68,68,0.25)', marginBottom: 20, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#FCA5A5' } as any} onClick={() => setPrescError('')}>
                  {prescError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 32 } as any}>
                {[0,1,2,3,4,5].map(i => (
                  <input key={i} id={`ppin-${i}`} type="text" inputMode="numeric" maxLength={1}
                    value={actCode[i] || ''}
                    onChange={(e: any) => { const v = e.target.value.replace(/[^0-9]/g, ''); const arr = actCode.split(''); arr[i] = v; const nc = arr.join('').slice(0,6); setActCode(nc); if (v && i < 5) { const n = document.getElementById(`ppin-${i+1}`); if (n) (n as HTMLInputElement).focus(); } }}
                    onKeyDown={(e: any) => { if (e.key === 'Backspace' && !actCode[i] && i > 0) { const p = document.getElementById(`ppin-${i-1}`); if (p) (p as HTMLInputElement).focus(); } }}
                    style={{ width: 48, height: 48, borderRadius: '50%', textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#FFF', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s, box-shadow 0.2s' } as any}
                    onFocus={(e: any) => { e.target.style.borderColor = 'rgba(255,255,255,0.5)'; e.target.style.boxShadow = '0 0 12px rgba(255,255,255,0.15)'; }}
                    onBlur={(e: any) => { e.target.style.borderColor = 'rgba(255,255,255,0.18)'; e.target.style.boxShadow = 'none'; }}
                  />
                ))}
              </div>
              <button onClick={() => activatePrescriber()} disabled={activating || actCode.length < 6}
                style={{ width: '100%', padding: '16px 32px', borderRadius: 999, border: 'none', cursor: 'pointer', background: '#FFF', color: '#111', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', opacity: (activating || actCode.length < 6) ? 0.5 : 1, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', transition: 'all 0.25s ease' } as any}>
                {activating ? 'Activation...' : 'Confirmer le code'}
              </button>
              <button onClick={() => setSlideActivatedP(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginTop: 16, padding: 8 } as any}>Retour</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user?.is_prescriber) {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, backgroundColor: '#1a0a0a' }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 12 }}>Prescription</Text>
        <TextInput testID="prescriber-code-input" style={{ fontSize: 18, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.08)', color: '#FFF', textAlign: 'center', letterSpacing: 4, marginBottom: 16 }}
          placeholder="CODE PRESCRIPTEUR" placeholderTextColor="rgba(255,255,255,0.3)" value={actCode} onChangeText={setActCode} autoCapitalize="characters" />
        <TouchableOpacity testID="activate-prescriber-btn" style={{ backgroundColor: '#FFF', borderRadius: 999, paddingVertical: 16, alignItems: 'center' }} onPress={activatePrescriber} disabled={activating}>
          {activating ? <ActivityIndicator color="#111" /> : <Text style={{ color: '#111', fontSize: 15, fontWeight: '600' }}>Activer</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  /* ─── REWARDS PAGE (replaces entire view) ─── */
  if (showRewardsPage && rewardsData && Platform.OS === 'web') {
    const BG_REWARD = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/4tk4fqvn_background_r%C3%A9compense.jpg';
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_REWARD} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 10 } as any}>
          <div onClick={() => setShowRewardsPage(false)} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' } as any}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' } as any} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Challenge actif</span>
          </div>
          <div onClick={() => setAnonymize(!anonymize)} style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: 999, background: anonymize ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.08)', border: `1px solid ${anonymize ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.12)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 } as any}>
            <span style={{ fontSize: 10, fontWeight: 600, color: anonymize ? '#10B981' : 'rgba(255,255,255,0.6)' }}>{anonymize ? 'Anonyme' : 'Visible'}</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>Recompenses</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Programme de challenge prescripteur</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#FFF', letterSpacing: -2, marginTop: 8 }}>{rewardsData.total_earned}EUR</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Total gagne</div>
          </div>
          <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 12, textAlign: 'center' } as any}>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#FFF' }}>{rewardsData.current_position}<span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>e</span></div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{rewardsData.current_prescriptions} prescription(s) ce mois</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 16 } as any}>
            {[{ pos: '1er', amount: rewardsData.prizes?.prize_1 || 100 }, { pos: '2e', amount: rewardsData.prizes?.prize_2 || 70 }, { pos: '3e', amount: rewardsData.prizes?.prize_3 || 30 }].map(r => (
              <div key={r.pos} style={{ textAlign: 'center' } as any}><div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{r.pos}</div><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginTop: 2 }}>+{r.amount}EUR</div></div>
            ))}
          </div>
          {rewardsData.my_history?.length > 0 && <><div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 10 }}>Mon historique</div>{rewardsData.my_history.map((h: any, i: number) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 8 } as any}><div><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{h.month_label}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>#{h.position} · {h.prescriptions_count} prescriptions</div></div><div style={{ fontSize: 18, fontWeight: 900, color: h.reward > 0 ? '#10B981' : '#FFF' }}>+{h.reward}EUR</div></div>)}</>}
          <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginTop: 16, marginBottom: 10 }}>Tous les challenges</div>
          {(rewardsData.all_history || []).map((ch: any) => <div key={ch.month} style={{ marginBottom: 8 } as any}><div onClick={() => setExpandedChallenge(expandedChallenge === ch.month ? null : ch.month)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: expandedChallenge === ch.month ? '16px 16px 0 0' : 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' } as any}><div><div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>{ch.month_label || ch.month}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{ch.ranking?.length || 0} participant(s)</div></div><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" style={{ transform: expandedChallenge === ch.month ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' } as any}><path d="M6 9l6 6 6-6"/></svg></div>{expandedChallenge === ch.month && ch.ranking?.length > 0 && <div style={{ padding: '0 16px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderTop: 'none', borderRadius: '0 0 16px 16px' } as any}>{ch.ranking.slice(0, 5).map((r: any, j: number) => <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, paddingBottom: 6, borderBottom: j < Math.min(ch.ranking.length, 5) - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' } as any}><div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}><div style={{ width: 28, height: 28, borderRadius: 999, background: j === 0 ? '#FFD700' : j === 1 ? '#C0C0C0' : j === 2 ? '#CD7F32' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 11, fontWeight: 800, color: j < 3 ? '#111' : '#FFF' }}>#{r.position}</span></div><div><div style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{anonymize && r.name !== user.name ? r.name.charAt(0) + '***' : r.name}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{r.prescriptions_count || 0} prescriptions</div></div></div><span style={{ fontSize: 15, fontWeight: 800, color: r.reward > 0 ? '#10B981' : 'rgba(255,255,255,0.3)' }}>{r.reward > 0 ? `+${r.reward}EUR` : '-'}</span></div>)}</div>}{expandedChallenge === ch.month && (!ch.ranking || ch.ranking.length === 0) && <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderTop: 'none', borderRadius: '0 0 16px 16px', textAlign: 'center' } as any}><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Challenge en cours</div></div>}</div>)}
        </div>
      </div>
    );
  }

  /* ─── DETAIL PAGE: prescription (replaces entire view) ─── */
  if (selectedPresc && Platform.OS === 'web') {
    const isValidated = selectedPresc.status === 'subscribed';
    const bgImg = isValidated ? BG_GREEN_P : BG_ORANGE;
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={bgImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 10 } as any}>
          <div onClick={() => setSelectedPresc(null)} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' } as any}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isValidated ? '#10B981' : '#F59E0B' } as any} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{isValidated ? 'Valide' : 'En attente'}</span>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>Prescription</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{selectedPresc.subscription_type === 'teleassistance' ? 'Abonnement Teleassistance' : `Abonnement ${selectedPresc.subscription_type || 'Standard'}`}</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#FFF', letterSpacing: -2, marginTop: 8 }}>+{selectedPresc.commission || 25}EUR</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 } as any}>
            {[
              { label: 'Beneficiaire', value: selectedPresc.beneficiary_name || '-' },
              { label: 'Statut', value: isValidated ? 'Valide' : 'En attente' },
              { label: 'Type', value: selectedPresc.subscription_type === 'teleassistance' ? 'Teleassistance' : 'Standard' },
              { label: 'Paiement', value: isValidated ? 'Au 1er du mois' : 'Apres validation' },
              { label: 'Date', value: selectedPresc.created_at ? new Date(selectedPresc.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-' },
              { label: 'Commission', value: `+${selectedPresc.commission || 25} EUR` },
            ].map((item, i) => (
              <div key={i} style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } as any}>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{item.value}</div>
              </div>
            ))}
          </div>
          {selectedPresc.beneficiary_email && <div onClick={() => window.location.href = `mailto:${selectedPresc.beneficiary_email}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 8, cursor: 'pointer' } as any}><div style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div><div style={{ fontSize: 14, fontWeight: 600, color: '#FFF' }}>{selectedPresc.beneficiary_email}</div></div>}
          {selectedPresc.beneficiary_phone && <div onClick={() => window.location.href = `tel:${selectedPresc.beneficiary_phone}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 8, cursor: 'pointer' } as any}><div style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div><div style={{ fontSize: 14, fontWeight: 600, color: '#FFF' }}>{selectedPresc.beneficiary_phone}</div></div>}
          {selectedPresc.notes && <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>Notes</div><div style={{ fontSize: 14, fontWeight: 600, color: '#FFF', lineHeight: 1.5 }}>{selectedPresc.notes}</div></div>}
          <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>Prescrit par</div><div style={{ fontSize: 14, fontWeight: 600, color: '#FFF' }}>{user.name} — {user.prescriber_structure || 'Structure'}</div></div>
        </div>
      </div>
    );
  }

  /* ─── ACTIF: page prescriptions plein ecran ─── */
  if (Platform.OS === 'web') {
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <div style={{ position: 'absolute', inset: 0 } as any}><img src={BG_HEADER_P} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} /><div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} /></div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '24px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 14 } as any}>
            <div onClick={() => setShowPrescModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', marginBottom: 10 } as any}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' } as any} /><span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Actif - {user.prescription_structure || user.structure_name || 'Structure'}</span></div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Prescription</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#FFF', letterSpacing: -1, marginBottom: 4 }}>+{displayedPresc.reduce((s: number, p: any) => s + (p.commission || 25), 0)}EUR</div>
            <div style={{ display: 'inline-flex', borderRadius: 999, padding: 4, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', marginBottom: 10 } as any}>
              <div onClick={() => setPrescTab('pending')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: prescTab === 'pending' ? '#FFF' : 'transparent', color: prescTab === 'pending' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700 } as any}>En cours ({pending.length})</div>
              <div onClick={() => setPrescTab('validated')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: prescTab === 'validated' ? '#FFF' : 'transparent', color: prescTab === 'validated' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700 } as any}>Validees ({validated.length})</div>
            </div>
          </div>
          {/* Rewards card */}
          <div onClick={() => { apiFetch("/api/rewards/history", {}, token).then((d2: any) => { setRewardsData(d2); setShowRewardsPage(true); }).catch(() => {}); }} style={{ borderRadius: 20, overflow: "hidden", position: "relative", padding: "18px", marginBottom: 14, cursor: "pointer" } as any} data-glass-card>
            <img src="https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/4tk4fqvn_background_r%C3%A9compense.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 1 } as any} />
            <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 14 } as any}><i className="ri-trophy-line" style={{ fontSize: 22, color: '#FFF' }} /><div style={{ flex: 1 } as any}><div style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>Recompenses</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Challenge prescripteurs du mois</div></div><div style={{ display: 'flex', gap: 3 } as any}>{[{ c: '#FFD700' }, { c: '#C0C0C0' }, { c: '#CD7F32' }].map((m, i) => (<div key={i} style={{ width: 18, height: 18, borderRadius: 999, background: m.c, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 7, fontWeight: 800, color: '#FFF' }}>{i+1}</span></div>))}</div><i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} /></div>
          </div>
          {/* Prescription cards — glass */}
          {displayedPresc.map(p => (
            <div key={p.id} onClick={() => setSelectedPresc(p)} style={{ borderRadius: 20, padding: '18px 16px', marginBottom: 12, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any} data-glass-card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 } as any}>
                <div><div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{p.beneficiary_name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{p.subscription_type || 'Standard'}</div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: p.status === 'subscribed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', flexShrink: 0 } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: p.status === 'subscribed' ? '#10B981' : '#F59E0B' } as any} /><span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>{p.status === 'subscribed' ? 'Validee' : 'En cours'}</span></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}><div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>+{p.commission || 25}EUR</div><div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.12)', borderRadius: 999, padding: '8px 16px' } as any}><i className="ri-heart-line" style={{ fontSize: 14, color: '#FFF' }} /><span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Consulter</span></div></div>
            </div>
          ))}
          {displayedPresc.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px' } as any}><i className="ri-file-text-line" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)' }} /><div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>Aucune prescription {prescTab === 'pending' ? 'en cours' : 'validee'}</div></div>}
        </div>
      </div>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#FFFFFF' }} contentContainerStyle={[d.sc, { paddingBottom: 80, paddingHorizontal: 0 }]} showsVerticalScrollIndicator={false}>
      {/* Header orange avec toggle DANS le header */}
      {Platform.OS === 'web' ? (
        <div style={{ position: 'relative', padding: '24px 20px 20px', textAlign: 'center', overflow: 'hidden', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 } as any}>
          <img src={BG_HEADER_P} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 1 } as any} />
          <div style={{ position: 'relative', zIndex: 2 } as any}>
            <div onClick={() => setShowPrescModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', marginBottom: 10, cursor: 'pointer' } as any}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' } as any} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Actif - {user.prescription_structure || user.structure_name || 'Structure'}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 16 }}>Prescription</div>
            <div style={{ display: 'inline-flex', borderRadius: 999, padding: 4, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' } as any}>
              <div onClick={() => setPrescTab('pending')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: prescTab === 'pending' ? '#FFF' : 'transparent', color: prescTab === 'pending' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700, transition: 'all 0.25s', boxShadow: prescTab === 'pending' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' } as any}>En cours</div>
              <div onClick={() => setPrescTab('validated')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: prescTab === 'validated' ? '#FFF' : 'transparent', color: prescTab === 'validated' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700, transition: 'all 0.25s', boxShadow: prescTab === 'validated' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' } as any}>Cloturees</div>
            </div>
            {/* Total */}
            <div style={{ marginTop: 16 } as any}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Total</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#FFF', letterSpacing: -1 }}>+{displayedPresc.reduce((s: number, p: any) => s + (p.commission || 25), 0)}EUR</div>
            </div>
            <div onClick={() => setShowRewardsExplainer(true)} data-testid="programme-recompenses-btn" style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' } as any}>
              <i className="ri-trophy-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Programme de recompenses</span>
            </div>
          </div>
        </div>
      ) : (
        <View style={{ backgroundColor: '#8B4513', padding: 20, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, paddingVertical: 7, paddingHorizontal: 16, marginBottom: 10 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' }} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFF' }}>Actif - {user.prescription_structure || 'Structure'}</Text>
          </View>
          <Text style={{ fontSize: 26, fontWeight: '800', color: '#FFF', marginBottom: 14 }}>Prescription</Text>
          <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, padding: 4 }}>
            <TouchableOpacity style={[{ paddingVertical: 10, paddingHorizontal: 24, borderRadius: 999 }, prescTab === 'pending' && { backgroundColor: '#FFF' }]} onPress={() => setPrescTab('pending')}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: prescTab === 'pending' ? '#111' : 'rgba(255,255,255,0.8)' }}>En cours</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[{ paddingVertical: 10, paddingHorizontal: 24, borderRadius: 999 }, prescTab === 'validated' && { backgroundColor: '#FFF' }]} onPress={() => setPrescTab('validated')}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: prescTab === 'validated' ? '#111' : 'rgba(255,255,255,0.8)' }}>Cloturees</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* White container for cards */}
      <View style={{ padding: 16, paddingTop: 12 }}>

      {/* Récompenses card — dark satin background */}
      {Platform.OS === 'web' ? (
        <div onClick={() => { apiFetch("/api/rewards/history", {}, token).then((d: any) => { setRewardsData(d); setShowRewardsPage(true); }).catch(() => {}); }} style={{ borderRadius: 20, overflow: "hidden", position: "relative", padding: "18px", marginBottom: 14, cursor: "pointer", boxShadow: '0 8px 24px rgba(0,0,0,.15)' } as any}>
          <img src="https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/4tk4fqvn_background_r%C3%A9compense.jpg" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 1 } as any} />
          <div style={{ position: 'relative', zIndex: 2 } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 } as any}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Recompenses</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>01/04/2026 - 30/04/2026</div>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' } as any}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' } as any} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#FFF' }}>Actif</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 10 } as any}>
              {[{ pos: '1er', amount: '+100EUR' }, { pos: '2eme', amount: '+70EUR' }, { pos: '3eme', amount: '+30EUR' }].map(r => (
                <div key={r.pos} style={{ textAlign: 'center' } as any}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{r.pos}</div>
                  <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 700, color: '#FFF', marginTop: 4 } as any}>{r.amount}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Votre position actuelle 26eme</div>
          </div>
        </div>
      ) : (
        <TouchableOpacity onPress={() => setShowPrescModal(true)} style={{ backgroundColor: '#1a1a1a', borderRadius: 20, padding: 18, marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <View><Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }}>Recompenses</Text><Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>01/04/2026 - 30/04/2026</Text></View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} /><Text style={{ fontSize: 11, fontWeight: '600', color: '#FFF' }}>Actif</Text></View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 }}>
            {[{ pos: '1er', amount: '+100EUR' }, { pos: '2eme', amount: '+70EUR' }, { pos: '3eme', amount: '+30EUR' }].map(r => (
              <View key={r.pos} style={{ alignItems: 'center' }}><Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }}>{r.pos}</Text><View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginTop: 4 }}><Text style={{ fontSize: 13, fontWeight: '700', color: '#FFF' }}>{r.amount}</Text></View></View>
            ))}
          </View>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Votre position actuelle 26eme</Text>
        </TouchableOpacity>
      )}

      {/* Prescription cards */}
      <View>
        {displayedPresc.length > 0 ? displayedPresc.map((p: any) => {
          const isValidated = p.status === 'subscribed';
          return Platform.OS === 'web' ? (
            <div key={p.id} onClick={() => { setSelectedPresc(p); }}
              style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', padding: '16px', marginBottom: 12, cursor: 'pointer', minHeight: 90, boxShadow: '0 8px 24px rgba(0,0,0,.12)', transition: 'transform 0.25s ease' } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
              <img src={isValidated ? BG_GREEN_P : BG_ORANGE} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 1 } as any} />
              <div style={{ position: 'relative', zIndex: 2 } as any}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 } as any}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{p.beneficiary_name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{p.subscription_type === 'teleassistance' ? 'Abonnement teleassistance' : `Abonnement ${p.subscription_type || 'Standard'}`}</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,.2)', borderRadius: 12, padding: '6px 12px', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,.2)' } as any}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>+{p.commission || 25}EUR</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#FFF' }}>{isValidated ? 'Valide' : 'En attente'}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.18)', borderRadius: 999, padding: '8px 16px', border: '1px solid rgba(255,255,255,.2)' } as any}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Consulter</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <TouchableOpacity key={p.id} onPress={() => { setSelectedPresc(p); setShowPrescModal(true); }}>
              <View style={{ borderRadius: 20, overflow: 'hidden', padding: 16, marginBottom: 12, backgroundColor: isValidated ? '#0a3a2a' : '#5a2a0a' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <View><Text style={{ fontSize: 18, fontWeight: '800', color: '#FFF' }}>{p.beneficiary_name}</Text><Text style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>{p.subscription_type || 'Standard'}</Text></View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}><Text style={{ fontSize: 15, fontWeight: '800', color: '#FFF' }}>+{p.commission || 25}EUR</Text></View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#FFF' }}>{isValidated ? 'Valide' : 'En attente'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,.18)', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 }}>
                    <Icon name="heart-outline" size={16} color="#FFF" />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFF' }}>Consulter</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }) : (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Icon name="document-text-outline" size={32} color="#9CA3AF" />
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 12 }}>Aucune prescription</Text>
          </View>
        )}
      </View>

      {/* New prescription button */}
      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <TouchableOpacity onPress={() => setShowForm(true)} style={{
          backgroundColor: '#111', borderRadius: 999, paddingVertical: 16, flexDirection: 'row',
          alignItems: 'center', justifyContent: 'center', gap: 10,
        }}>
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>Nouvelle prescription</Text>
          <Icon name="heart-outline" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      </View>{/* End white rounded container */}

      {/* Prescriber Detail Modal — GLASS DARK */}
      <Modal visible={showPrescModal} transparent animationType="fade" onRequestClose={() => setShowPrescModal(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', ...(Platform.OS === 'web' ? { backgroundColor: 'rgba(0,0,0,0.5)' } : { backgroundColor: 'rgba(0,0,0,0.6)' }) } as any}>
          <View style={{
            borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '85%',
            backgroundColor: '#111',
            ...(Platform.OS === 'web' ? { backdropFilter: 'blur(24px) saturate(150%)', WebkitBackdropFilter: 'blur(24px) saturate(150%)', borderTop: '1px solid rgba(255,255,255,0.1)' } : {}),
          } as any}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFF' }}>Espace Prescripteur</Text>
              <TouchableOpacity onPress={() => setShowPrescModal(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="close" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Profile */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon name="medical" size={24} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFF' }}>{user.name}</Text>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{user.prescriber_structure || 'Structure'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(16,185,129,0.15)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' }} />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981' }}>ACTIF</Text>
                </View>
              </View>

              {/* Details */}
              {[
                { icon: 'business-outline', label: 'Structure', value: user.prescriber_structure || '-' },
                { icon: 'key-outline', label: 'Code', value: user.prescriber_code_used || '-' },
                { icon: 'call-outline', label: 'Telephone', value: user.phone || '-' },
                { icon: 'mail-outline', label: 'Email', value: user.email || '-' },
              ].map(({ icon, label, value }) => value !== '-' ? (
                <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' }}>
                    <Icon name={icon as any} size={14} color="rgba(255,255,255,0.5)" />
                  </View>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', width: 80 }}>{label}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#FFF', flex: 1 }}>{value}</Text>
                </View>
              ) : null)}

              {/* Desactiver — glass red button */}
              <TouchableOpacity style={{
                marginTop: 24, borderRadius: 999, paddingVertical: 16, alignItems: 'center',
                backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
                ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } : {}),
              } as any}
                onPress={() => { setShowPrescModal(false); confirmAction('Desactiver', 'Confirmer la desactivation ?', async () => {
                  try { await apiFetch('/api/auth/update-profile', { method: 'PUT', body: JSON.stringify({ is_prescriber: false }) }, token); await refreshUser(); } catch {}
                }); }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#FCA5A5' }}>Desactiver mon espace prescripteur</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* New Prescription Form Modal — GLASS DARK */}
      <Modal visible={showForm} transparent animationType="slide" onRequestClose={() => setShowForm(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', ...(Platform.OS === 'web' ? { backgroundColor: 'rgba(0,0,0,0.5)' } : { backgroundColor: 'rgba(0,0,0,0.6)' }) } as any}>
          <View style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '90%', backgroundColor: '#111', ...(Platform.OS === 'web' ? { backdropFilter: 'blur(24px) saturate(150%)', WebkitBackdropFilter: 'blur(24px) saturate(150%)', borderTop: '1px solid rgba(255,255,255,0.1)' } : {}) } as any}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFF' }}>Nouvelle prescription</Text>
              <TouchableOpacity onPress={() => setShowForm(false)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }}><Icon name="close" size={20} color="#FFF" /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: 'name', label: 'Nom du beneficiaire', placeholder: 'Jean Dupont' },
                { key: 'email', label: 'Email', placeholder: 'jean@email.com' },
                { key: 'phone', label: 'Telephone', placeholder: '06 12 34 56 78' },
                { key: 'notes', label: 'Notes', placeholder: 'Informations supplementaires...' },
              ].map(f => (
                <View key={f.key} style={{ marginBottom: 14 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{f.label}</Text>
                  <TextInput style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14, fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', color: '#FFF' }}
                    placeholder={f.placeholder} placeholderTextColor="#9CA3AF"
                    value={(formData as any)[f.key]} onChangeText={(v: string) => setFormData({ ...formData, [f.key]: v })} />
                </View>
              ))}
              <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Type d'abonnement</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                {['standard', 'teleassistance'].map(t => (
                  <TouchableOpacity key={t} style={{ flex: 1, paddingVertical: 12, borderRadius: 999, alignItems: 'center', borderWidth: 1.5, borderColor: formData.type === t ? '#FFF' : 'rgba(255,255,255,0.1)', backgroundColor: formData.type === t ? 'rgba(255,255,255,0.15)' : 'transparent' }} onPress={() => setFormData({ ...formData, type: t })}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: formData.type === t ? '#FFF' : 'rgba(255,255,255,0.5)' }}>{t === 'standard' ? 'Standard' : 'Teleassistance'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity onPress={submitPrescription} disabled={submitting} style={{ backgroundColor: '#111', borderRadius: 999, paddingVertical: 16, alignItems: 'center' }}>
                {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>Envoyer la prescription</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Native detail */}
      {selectedPresc && Platform.OS !== 'web' && (
        <Modal visible={!!selectedPresc} transparent animationType="fade" onRequestClose={() => setSelectedPresc(null)}>
          <View style={{ flex: 1, backgroundColor: selectedPresc.status === 'subscribed' ? '#0a2a1a' : '#2a1a0a', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <TouchableOpacity onPress={() => setSelectedPresc(null)} style={{ position: 'absolute', top: 50, left: 20 }}><Icon name="chevron-back" size={24} color="#FFF" /></TouchableOpacity>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 6 }}>Prescription</Text>
            <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>{selectedPresc.subscription_type || 'Standard'}</Text>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: 16 }}>{selectedPresc.beneficiary_name}</Text>
            <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>{selectedPresc.beneficiary_email}</Text>
            <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>{selectedPresc.beneficiary_phone}</Text>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Commission</Text>
            <Text style={{ fontSize: 42, fontWeight: '900', color: '#FFF' }}>+{selectedPresc.commission || 25}EUR</Text>
          </View>
        </Modal>
      )}

    </ScrollView>
  );
}
/* ===== TELEASSISTANCE: SUBSCRIBERS ===== */
function SubscribersList({ token }: { token: string }) {
  const router = useRouter();
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { setSubs(await apiFetch('/api/teleassistance/subscribers', {}, token)); } catch {} finally { setLoading(false); } })(); }, []);
  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}><ActivityIndicator size="large" color="#FFF" /></View>;
  const BG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';
  if (Platform.OS === 'web') {
    return (
      <div data-testid="subscribers-list" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', padding: '28px 20px 14px', zIndex: 10, textAlign: 'center' } as any}><div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>Abonnes</div><div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{subs.length} abonne(s) CARE WATCH</div></div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '0 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          {subs.map((su: any) => (<div key={su.id} onClick={() => router.push({ pathname: '/subscriber-detail', params: { subscriberId: su.id } })} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8, cursor: 'pointer' } as any}><div style={{ width: 44, height: 44, borderRadius: 999, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{su.name?.charAt(0)}</span></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{su.name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{su.email || 'Pas d\'email'}</div></div>{su.active_alerts > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, background: 'rgba(239,68,68,0.2)' } as any}><span style={{ width: 5, height: 5, borderRadius: 3, background: '#EF4444' } as any} /><span style={{ fontSize: 10, fontWeight: 600, color: '#EF4444' }}>{su.active_alerts}</span></div>}<i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)' }} /></div>))}
          {subs.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px' } as any}><i className="ri-group-line" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)' }} /><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginTop: 10 }}>Aucun abonne</div></div>}
        </div>
      </div>
    );
  }
  return (
    <ScrollView style={d.sv} contentContainerStyle={d.sc}>
      <Text style={d.subCount}>{subs.length} abonné(s)</Text>
      {subs.map(su => (
        <View key={su.id} style={d.subCard}>
          <View style={d.subAv}><Text style={d.subAvT}>{su.name?.charAt(0)?.toUpperCase()}</Text></View>
          <View style={d.subInfo}><Text style={d.subName}>{su.name}</Text><Text style={d.subEmail}>{su.email}</Text></View>
          {su.active_alerts > 0 && <View style={d.alertBdg}><Text style={d.alertBdgT}>{su.active_alerts}</Text></View>}
        </View>
      ))}
      {subs.length === 0 && <View style={d.emptyC}><Text style={d.emptyT}>Aucun abonné</Text></View>}
    </ScrollView>
  );
}

/* ===== ADMIN: PRESCRIPTEURS MANAGEMENT ===== */
function AdminPrescripteurs({ token }: { token: string }) {
  const router = useRouter();
  const [codes, setCodes] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [prescribers, setPrescribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCode, setEditCode] = useState<any>(null);
  const [form, setForm] = useState({ structure_name: '', raison_sociale: '', siret: '', tva: '', adresse: '', telephone: '', email_contact: '', max_uses: '50' });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'codes'|'prescribers'|'prescriptions'>('codes');
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [c, p, u] = await Promise.all([
        apiFetch('/api/admin/activation-codes', {}, token).catch(() => []),
        apiFetch('/api/backoffice/prescriptions', {}, token).catch(() => []),
        apiFetch('/api/backoffice/users', {}, token).catch(() => []),
      ]);
      setCodes(c); setPrescriptions(p);
      setPrescribers((u || []).filter((usr: any) => usr.is_prescriber));
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const saveCode = async () => {
    if (!form.structure_name) return Alert.alert('Erreur', 'Nom de structure requis');
    setSaving(true);
    try {
      if (editCode) {
        await apiFetch(`/api/admin/activation-codes/${editCode.id}`, { method: 'PUT', body: JSON.stringify(form) }, token);
        setCodes(codes.map(c => c.id === editCode.id ? { ...c, ...form } : c));
      } else {
        const r = await apiFetch('/api/admin/activation-codes', { method: 'POST', body: JSON.stringify({ ...form, max_uses: parseInt(form.max_uses) || 50 }) }, token);
        setCodes([r, ...codes]);
      }
      setShowModal(false); setEditCode(null);
      setForm({ structure_name: '', raison_sociale: '', siret: '', tva: '', adresse: '', telephone: '', email_contact: '', max_uses: '50' });
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSaving(false); }
  };

  const toggleCode = async (id: string) => {
    try {
      const r = await apiFetch(`/api/admin/activation-codes/${id}/toggle`, { method: 'PUT' }, token);
      setCodes(codes.map(c => c.id === id ? { ...c, active: r.active } : c));
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  const deleteCode = (id: string) => {
    confirmAction('Supprimer', 'Supprimer définitivement ce code prescripteur ?', async () => {
      await apiFetch(`/api/admin/activation-codes/${id}`, { method: 'DELETE' }, token);
      setCodes(codes.filter(c => c.id !== id));
    });
  };

  const openEdit = (c: any) => {
    setEditCode(c);
    setForm({ structure_name: c.structure_name || '', raison_sociale: c.raison_sociale || '', siret: c.siret || '', tva: c.tva || '', adresse: c.adresse || '', telephone: c.telephone || '', email_contact: c.email_contact || '', max_uses: String(c.max_uses || 50) });
    setShowModal(true);
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}><ActivityIndicator size="large" color="#FFF" /></View>;

  const BG_ADM = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/1lq6xl58_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2008_54_55.png';
  if (Platform.OS === 'web') {
    return (
      <div data-testid="admin-prescripteurs" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_ADM} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', padding: '24px 20px 12px', zIndex: 10, textAlign: 'center' } as any}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>Prescripteurs</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{codes.length} codes · {prescribers.length} prescripteurs · {prescriptions.length} souscriptions</div>
          <div style={{ display: 'inline-flex', borderRadius: 999, padding: 3, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', marginTop: 14 } as any}>
            {([['codes', `Codes (${codes.length})`], ['prescribers', `Prescripteurs (${prescribers.length})`], ['prescriptions', `Souscriptions (${prescriptions.length})`]] as const).map(([k, l]) => (
              <div key={k} onClick={() => setTab(k)} style={{ padding: '8px 16px', borderRadius: 999, cursor: 'pointer', background: tab === k ? '#FFF' : 'transparent', color: tab === k ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: 700 } as any}>{l}</div>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '8px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
          {tab === 'codes' && (<>
            <div onClick={() => { setEditCode(null); setForm({ structure_name: '', raison_sociale: '', siret: '', tva: '', adresse: '', telephone: '', email_contact: '', max_uses: '50' }); setShowModal(true); }} style={{ padding: '14px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', fontSize: 14, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}><i className="ri-add-circle-line" style={{ fontSize: 16 }} />Creer un code</div>
            {codes.map((c: any) => (<div key={c.id} style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 } as any}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}><div><div style={{ fontSize: 15, fontWeight: 800, color: '#FFF', letterSpacing: 2 }}>{c.code}</div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{c.structure_name}</div></div><div style={{ display: 'flex', gap: 6 } as any}><div onClick={() => openEdit(c)} style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-edit-line" style={{ fontSize: 14, color: '#FFF' }} /></div><div onClick={() => toggleCode(c.id)} style={{ width: 32, height: 32, borderRadius: 999, background: c.active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className={c.active ? 'ri-toggle-line' : 'ri-toggle-fill'} style={{ fontSize: 14, color: c.active ? '#10B981' : '#EF4444' }} /></div></div></div><div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '8px 0' } as any} /><div style={{ display: 'flex', gap: 12 } as any}><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{c.current_uses || 0}/{c.max_uses} uses</span><span style={{ fontSize: 11, color: c.active ? '#10B981' : '#EF4444' }}>{c.active ? 'Actif' : 'Desactive'}</span></div></div>))}
          </>)}
          {tab === 'prescribers' && prescribers.map((p: any) => (<div key={p.id} onClick={() => router.push({ pathname: '/company-prescriber-detail', params: { prescriberId: p.id } })} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8, cursor: 'pointer' } as any}><div style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(212,132,90,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#D4845A' }}>{p.name?.charAt(0)}</span></div><div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{p.name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{p.structure_name || 'Prescripteur'}</div></div><div style={{ fontSize: 12, fontWeight: 700, color: '#D4845A' }}>{p.prescriptions_count || 0} Rx</div><i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)' }} /></div>))}
          {tab === 'prescriptions' && prescriptions.map((p: any) => (<div key={p.id} style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 } as any}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}><div><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{p.beneficiary_name || 'Souscription'}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Par {p.prescriber_name} · {p.subscription_type || 'Standard'}</div></div><div style={{ padding: '3px 10px', borderRadius: 999, background: p.status === 'validated' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)' } as any}><span style={{ fontSize: 10, fontWeight: 600, color: p.status === 'validated' ? '#10B981' : '#F59E0B' }}>{p.status === 'validated' ? 'Validee' : 'En attente'}</span></div></div></div>))}
        </div>
        {/* Modal */}
        {showModal && (<div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 } as any}><div onClick={(e: any) => e.stopPropagation()} style={{ background: '#1a1a2e', borderRadius: 28, padding: 24, width: '100%', maxWidth: 420, border: '1px solid rgba(255,255,255,0.1)', maxHeight: '85vh', overflowY: 'auto' } as any}><div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 14 }}>{editCode ? 'Modifier le code' : 'Nouveau code'}</div>{['structure_name','raison_sociale','siret','adresse','telephone','email_contact','max_uses'].map(k => (<div key={k} style={{ marginBottom: 10 } as any}><div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 4 }}>{k.replace(/_/g, ' ')}</div><input value={(form as any)[k]} onChange={(e: any) => setForm({...form, [k]: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 14 } as any} /></div>))}<div style={{ display: 'flex', gap: 10, marginTop: 8 } as any}><div onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: 999, textAlign: 'center', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', fontWeight: 700, cursor: 'pointer' } as any}>Annuler</div><div onClick={saveCode} style={{ flex: 1, padding: '12px', borderRadius: 999, textAlign: 'center', background: '#FFF', color: '#111', fontWeight: 700, cursor: 'pointer' } as any}>{saving ? '...' : 'Enregistrer'}</div></div></div></div>)}
      </div>
    );
  }

  return (
    <ScrollView style={d.sv} contentContainerStyle={[d.sc, { paddingBottom: 80 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} />}>
      {/* Tabs */}
      <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 3, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)' }}>
        {([['codes', `Codes (${codes.length})`], ['prescribers', `Prescripteurs (${prescribers.length})`], ['prescriptions', `Souscriptions (${prescriptions.length})`]] as const).map(([k, l]) => (
          <TouchableOpacity key={k} style={[{ flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 }, tab === k && { backgroundColor: '#FFFFFF' }]}
            onPress={() => setTab(k)}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: tab === k ? '#FFF' : '#888' }}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CODES TAB */}
      {tab === 'codes' && <>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.textPrimary }}>{codes.length} structure(s) prescriptrice(s)</Text>
          <TouchableOpacity testID="add-prescripteur-btn" style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
            onPress={() => { setEditCode(null); setForm({ structure_name: '', raison_sociale: '', siret: '', tva: '', adresse: '', telephone: '', email_contact: '', max_uses: '50' }); setShowModal(true); }}>
            <Icon name="add" size={16} color="#111827" /><Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Nouveau code</Text>
          </TouchableOpacity>
        </View>

      {codes.map(c => (
        <View key={c.id} style={[d.deviceCard, !c.active && { opacity: 0.5 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>{c.structure_name}</Text>
              {c.raison_sociale ? <Text style={{ fontSize: 11, color: Colors.textMuted }}>{c.raison_sociale}</Text> : null}
            </View>
            <View style={{ backgroundColor: Colors.subtle, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', letterSpacing: 1, color: Colors.primary }}>{c.code}</Text>
            </View>
          </View>
          {(c.siret || c.tva || c.adresse) && (
            <View style={{ marginTop: 8, gap: 2 }}>
              {c.siret ? <Text style={{ fontSize: 11, color: Colors.textMuted }}>SIRET: {c.siret}</Text> : null}
              {c.tva ? <Text style={{ fontSize: 11, color: Colors.textMuted }}>TVA: {c.tva}</Text> : null}
              {c.adresse ? <Text style={{ fontSize: 11, color: Colors.textMuted }}>{c.adresse}</Text> : null}
              {c.telephone ? <Text style={{ fontSize: 11, color: Colors.textMuted }}>Tél: {c.telephone}</Text> : null}
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 }}>
            <Text style={{ fontSize: 11, color: Colors.textMuted, flex: 1 }}>Utilisations: {c.uses_count}/{c.max_uses} · {c.active ? 'Actif' : 'Désactivé'}</Text>
            <TouchableOpacity onPress={() => openEdit(c)} style={{ padding: 6 }}><Icon name="create-outline" size={16} color={Colors.primary} /></TouchableOpacity>
            <TouchableOpacity onPress={() => toggleCode(c.id)} style={{ padding: 6 }}><Icon name={c.active ? 'pause-circle-outline' : 'play-circle-outline'} size={16} color={c.active ? Colors.textMuted : Colors.success} /></TouchableOpacity>
            <TouchableOpacity onPress={() => deleteCode(c.id)} style={{ padding: 6 }}><Icon name="trash-outline" size={16} color={Colors.destructive} /></TouchableOpacity>
          </View>
        </View>
      ))}
      </>}

      {/* PRESCRIBERS TAB */}
      {tab === 'prescribers' && <>
        {prescribers.map((p: any) => (
          <TouchableOpacity key={p.id} onPress={() => router.push({ pathname: '/admin-client-detail', params: { clientId: p.id } })} activeOpacity={0.7}>
            <View style={d.deviceCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#CE93D8', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFF' }}>{p.name?.charAt(0)?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>{p.name}</Text>
                  <Text style={{ fontSize: 12, color: Colors.textMuted }}>{p.email}</Text>
                  <Text style={{ fontSize: 11, color: '#9C27B0', fontWeight: '600', marginTop: 2 }}>{p.prescriber_structure}</Text>
                </View>
                <Icon name="chevron-forward" size={16} color="#888" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {prescribers.length === 0 && <View style={d.emptyC}><Icon name="medical-outline" size={28} color={Colors.textMuted} /><Text style={d.emptyT}>Aucun prescripteur</Text></View>}
      </>}

      {/* PRESCRIPTIONS TAB */}
      {tab === 'prescriptions' && <>
        {prescriptions.map((p: any) => (
          <TouchableOpacity key={p.id} onPress={() => router.push({ pathname: '/admin-prescription-detail', params: { prescriptionId: p.id } })} activeOpacity={0.7}>
            <View style={d.deviceCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>{p.beneficiary_name}</Text>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: p.status === 'subscribed' ? '#4CAF5015' : '#FF980015' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: p.status === 'subscribed' ? '#4CAF50' : '#FF9800' }}>{p.status === 'subscribed' ? 'ACTIF' : 'EN ATTENTE'}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: Colors.textMuted }}>{p.beneficiary_email} · {p.beneficiary_phone}</Text>
              <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 2 }}>Par: {p.guardian_name} ({p.prescriber_structure})</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '500', color: Colors.textSecondary }}>{p.subscription_type}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.success }}>+{p.commission}EUR</Text>
                  <Icon name="chevron-forward" size={14} color="#888" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {prescriptions.length === 0 && <View style={d.emptyC}><Icon name="document-text-outline" size={28} color={Colors.textMuted} /><Text style={d.emptyT}>Aucune souscription</Text></View>}
      </>}

      <Modal visible={showModal} transparent animationType="slide">
        <View style={d.modalO}><View style={d.modalC}>
          <Text style={d.modalT}>{editCode ? 'Modifier la structure' : 'Nouvelle structure prescriptrice'}</Text>
          {[
            { k: 'structure_name', l: 'Nom commercial', p: 'Ex: Résidence Les Oliviers' },
            { k: 'raison_sociale', l: 'Raison sociale', p: 'Ex: SAS Les Oliviers' },
            { k: 'siret', l: 'SIRET', p: '12345678900000' },
            { k: 'tva', l: 'N° TVA', p: 'FR12345678900' },
            { k: 'adresse', l: 'Adresse', p: '12 rue des Chênes, 75001 Paris' },
            { k: 'telephone', l: 'Téléphone', p: '+33 1 23 45 67 89' },
            { k: 'email_contact', l: 'Email contact', p: 'contact@structure.fr' },
          ].map(f => (
            <View key={f.k}>
              <Text style={d.inputL}>{f.l}</Text>
              <TextInput style={d.modalInp} placeholder={f.p} placeholderTextColor={Colors.textMuted}
                value={(form as any)[f.k]} onChangeText={(v) => setForm({ ...form, [f.k]: v })} />
            </View>
          ))}
          <View style={d.modalBtns}>
            <TouchableOpacity style={d.cancelBtn} onPress={() => setShowModal(false)}><Text style={d.cancelBtnT}>Annuler</Text></TouchableOpacity>
            <TouchableOpacity style={d.submitBtn} onPress={saveCode} disabled={saving}>
              {saving ? <ActivityIndicator color="#111827" /> : <Text style={d.submitBtnT}>{editCode ? 'Modifier' : 'Créer'}</Text>}
            </TouchableOpacity>
          </View>
        </View></View>
      </Modal>
    </ScrollView>
  );
}

/* ===== COMPANY: PRESCRIPTIONS TAB ===== */
function CompanyPrescriptionsTab({ token }: { token: string }) {
  const router = useRouter();
  const [dashData, setDashData] = useState<any>(null);
  const [prescribers, setPrescribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPresc, setSelectedPresc] = useState<any>(null);
  const [prescTab, setPrescTab] = useState<'pending' | 'subscribed'>('pending');
  const [showRewardsDetail, setShowRewardsDetail] = useState(false);
  const [showAllPrescribers, setShowAllPrescribers] = useState(false);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [dd, prs, cp] = await Promise.all([
        apiFetch('/api/company/dashboard', {}, token),
        apiFetch('/api/company/prescribers', {}, token).catch(() => []),
        apiFetch('/api/company/prescriptions', {}, token).catch(() => []),
      ]);
      // Use company/prescriptions for accurate data, fallback to dashboard
      const realPrescs = Array.isArray(cp) && cp.length > 0 ? cp : (dd?.prescriptions || []);
      setDashData({ ...dd, prescriptions: realPrescs });
      setPrescribers(Array.isArray(prs) ? prs : []);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, [token]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const [searchPresc, setSearchPresc] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; });

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}><ActivityIndicator size="large" color="#FFF" /></View>;

  const BG_ORANGE = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/1lq6xl58_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2008_54_55.png';
  const BG_GREEN_P = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/uvntv6me_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2008_31_33.png';
  const BG_BLACK = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';
  const allPrescs = dashData?.prescriptions || [];
  const pendingPrescs = allPrescs.filter((p: any) => p.status === 'pending');
  const subscribedPrescs = allPrescs.filter((p: any) => p.status === 'subscribed');
  const displayedPrescs = prescTab === 'pending' ? pendingPrescs : subscribedPrescs;
  const prescTotal = displayedPrescs.reduce((s: number, p: any) => s + (p.commission || 0), 0);

  const BG_GOLD = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/s2281oc6_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_16_35.png';

  /* ─── REWARDS DETAIL: full-screen gold (early return) ─── */
  if (showRewardsDetail && Platform.OS === 'web') {
    const totalComm = allPrescs.reduce((s: number, p: any) => s + (p.commission || 0), 0);
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_GOLD} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 10 } as any}>
          <div onClick={() => setShowRewardsDetail(false)} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Challenge prescripteurs</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
            <i className="ri-trophy-line" style={{ fontSize: 40, color: '#FFF', display: 'block', marginBottom: 8 }} />
            <div style={{ fontSize: 24, fontWeight: 800, color: '#FFF' }}>Challenge du mois</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</div>
            <div style={{ display: 'inline-flex', padding: '6px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', marginTop: 10 } as any}><span style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>Total: {totalComm} EUR</span></div>
          </div>
          {/* Prizes */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 } as any}>
            {[{ pos: '1er', amount: '100 EUR', color: '#FFD700' }, { pos: '2eme', amount: '70 EUR', color: '#C0C0C0' }, { pos: '3eme', amount: '30 EUR', color: '#CD7F32' }].map((p, i) => (
              <div key={i} style={{ flex: 1, padding: '16px 10px', borderRadius: 18, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', textAlign: 'center' } as any}>
                <div style={{ width: 36, height: 36, borderRadius: 999, background: p.color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 } as any}><i className="ri-medal-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{p.pos}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.amount}</div>
              </div>
            ))}
          </div>
          {/* Ranking */}
          <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' } as any}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Classement</div>
            {prescribers.sort((a: any, b: any) => (b.prescriptions_count || 0) - (a.prescriptions_count || 0)).map((p: any, i: number) => (
              <div key={p.id}>
                {i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0' } as any} />}
                <div onClick={() => router.push({ pathname: '/company-prescriber-detail', params: { prescriberId: p.id } })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', cursor: 'pointer' } as any}>
                  <div style={{ width: 30, height: 30, borderRadius: 10, background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><span style={{ fontSize: 12, fontWeight: 800, color: '#FFF' }}>#{i + 1}</span></div>
                  <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{p.name}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{p.structure_name || ''}</div></div>
                  <div style={{ textAlign: 'right' } as any}><div style={{ fontSize: 16, fontWeight: 900, color: '#FFF' }}>{p.prescriptions_count || 0}</div><div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>prescriptions</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ─── ALL PRESCRIBERS ─── */
  if (showAllPrescribers && Platform.OS === 'web') {
    const filtered = search.trim() ? prescribers.filter((p: any) => p.name?.toLowerCase().includes(search.toLowerCase())) : prescribers;
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_ORANGE} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 10 } as any}>
          <div onClick={() => { setShowAllPrescribers(false); setSearch(''); }} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Tous les prescripteurs ({prescribers.length})</div>
        </div>
        <div style={{ position: 'relative', zIndex: 10, padding: '12px 20px 0' } as any}><div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' } as any}><i className="ri-search-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} /><input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Rechercher un prescripteur..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#FFF', fontSize: 14, fontFamily: 'inherit' } as any} /></div></div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '12px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
          {filtered.map((p: any) => (
            <div key={p.id} onClick={() => router.push({ pathname: '/company-prescriber-detail', params: { prescriberId: p.id } })} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8, cursor: 'pointer' } as any}>
              <div style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(212,132,90,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#D4845A' }}>{p.name?.charAt(0)}</span></div>
              <div style={{ flex: 1 } as any}><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{p.name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{p.structure_name || 'Prescripteur'}</div></div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#D4845A' }}>{p.prescriptions_count || 0} Rx</div>
              <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.25)' }} />
            </div>
          ))}
          {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px' } as any}><i className="ri-file-text-line" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)' }} /><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginTop: 10 }}>{search ? 'Aucun resultat' : 'Aucun prescripteur'}</div></div>}
        </div>
      </div>
    );
  }

  /* ─── DETAIL: prescription (early return) ─── */
  if (selectedPresc && Platform.OS === 'web') {
    const isValidated = selectedPresc.status === 'subscribed';
    const pRows = [
      selectedPresc.guardian_name && { icon: 'ri-user-settings-line', label: 'Prescripteur', value: selectedPresc.guardian_name || selectedPresc.prescriber_name },
      selectedPresc.subscription_type && { icon: 'ri-vip-crown-line', label: 'Abonnement', value: selectedPresc.subscription_type },
      selectedPresc.commission && { icon: 'ri-money-euro-circle-line', label: 'Commission', value: `${selectedPresc.commission} EUR` },
      selectedPresc.created_at && { icon: 'ri-calendar-line', label: 'Date', value: new Date(selectedPresc.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) },
      selectedPresc.beneficiary_phone && { icon: 'ri-phone-line', label: 'Telephone beneficiaire', value: selectedPresc.beneficiary_phone, phone: true },
      selectedPresc.beneficiary_email && { icon: 'ri-mail-line', label: 'Email beneficiaire', value: selectedPresc.beneficiary_email },
      selectedPresc.beneficiary_address && { icon: 'ri-map-pin-line', label: 'Adresse', value: selectedPresc.beneficiary_address },
      selectedPresc.structure_name && { icon: 'ri-building-line', label: 'Structure', value: selectedPresc.structure_name },
    ].filter(Boolean);
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={isValidated ? BG_GREEN_P : BG_ORANGE} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 0', zIndex: 10 } as any}>
          <div onClick={() => setSelectedPresc(null)} style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} /></div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' } as any}><span style={{ width: 8, height: 8, borderRadius: '50%', background: isValidated ? '#10B981' : '#F59E0B' } as any} /><span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{isValidated ? 'Validee' : 'En attente'}</span></div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '16px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 16 } as any}>
            <div style={{ width: 56, height: 56, borderRadius: 999, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, border: '3px solid rgba(255,255,255,0.2)' } as any}><span style={{ fontSize: 24, fontWeight: 800, color: '#FFF' }}>{(selectedPresc.beneficiary_name || '?').charAt(0)}</span></div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF' }}>{selectedPresc.beneficiary_name}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>Prescription {selectedPresc.subscription_type || 'Standard'}</div>
            {selectedPresc.commission && <div style={{ fontSize: 36, fontWeight: 900, color: '#FFF', marginTop: 8, letterSpacing: -1 }}>+{selectedPresc.commission} EUR</div>}
          </div>
          {/* Details */}
          <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Details de la prescription</div>
            {pRows.map((item: any, i: number) => (<div key={i}>{i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' } as any} />}<div onClick={() => item.phone && (window.location.href = `tel:${item.value}`)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: item.phone ? 'pointer' : 'default' } as any}><i className={item.icon} style={{ fontSize: 14, color: item.phone ? '#10B981' : 'rgba(255,255,255,0.35)' }} /><div style={{ flex: 1 } as any}><div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 2 }}>{item.label}</div><div style={{ fontSize: 14, color: '#FFF', fontWeight: item.phone ? 700 : 500 }}>{item.value}</div></div>{item.phone && <i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981' }} />}</div></div>))}
          </div>
          {/* Prescriber card */}
          {(selectedPresc.guardian_name || selectedPresc.prescriber_name) && (
            <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Prescripteur</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                <div style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(212,132,90,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#D4845A' }}>{(selectedPresc.guardian_name || selectedPresc.prescriber_name || '?').charAt(0)}</span></div>
                <div style={{ flex: 1 } as any}><div style={{ fontSize: 16, fontWeight: 700, color: '#FFF' }}>{selectedPresc.guardian_name || selectedPresc.prescriber_name}</div>{selectedPresc.structure_name && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{selectedPresc.structure_name}</div>}</div>
              </div>
              {selectedPresc.guardian_phone && (<><div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' } as any} /><div onClick={() => window.location.href = `tel:${selectedPresc.guardian_phone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer' } as any}><i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981' }} /><span style={{ fontSize: 13, fontWeight: 600, color: '#10B981' }}>Appeler le prescripteur</span></div></>)}
            </div>
          )}
          {/* Beneficiary card */}
          <div style={{ padding: '14px 16px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 10 } as any}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Beneficiaire</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
              <div style={{ width: 44, height: 44, borderRadius: 999, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>{(selectedPresc.beneficiary_name || '?').charAt(0)}</span></div>
              <div style={{ flex: 1 } as any}><div style={{ fontSize: 16, fontWeight: 700, color: '#FFF' }}>{selectedPresc.beneficiary_name}</div>{selectedPresc.beneficiary_email && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{selectedPresc.beneficiary_email}</div>}</div>
            </div>
            {selectedPresc.beneficiary_phone && (<><div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' } as any} /><div onClick={() => window.location.href = `tel:${selectedPresc.beneficiary_phone}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', cursor: 'pointer' } as any}><i className="ri-phone-line" style={{ fontSize: 14, color: '#10B981' }} /><span style={{ fontSize: 13, fontWeight: 600, color: '#10B981' }}>Appeler le beneficiaire</span></div></>)}
          </div>
        </div>
      </div>
    );
  }

  /* ─── LIST ─── */
  if (Platform.OS === 'web') {
    const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextPayDate = `01/${String(nextMonth.getMonth() + 1).padStart(2, '0')}/${nextMonth.getFullYear()}`;
    const monthPrescs = prescTab === 'subscribed' ? subscribedPrescs.filter((p: any) => p.created_at && p.created_at.startsWith(selectedMonth)) : displayedPrescs;
    const filteredPrescs = searchPresc.trim() ? monthPrescs.filter((p: any) => p.beneficiary_name?.toLowerCase().includes(searchPresc.toLowerCase()) || p.prescriber_name?.toLowerCase().includes(searchPresc.toLowerCase())) : monthPrescs;
    const monthTotal = monthPrescs.reduce((s: number, p: any) => s + (p.commission || 0), 0);
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <div style={{ position: 'absolute', inset: 0 } as any}><img src={BG_ORANGE} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} /><div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} /></div>
        {/* Everything scrolls together */}
        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '24px 20px 100px', WebkitOverflowScrolling: 'touch' } as any}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 10 } as any}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', borderRadius: 999, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', marginBottom: 10 } as any}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' } as any} /><span style={{ fontSize: 13, fontWeight: 600, color: '#10B981' }}>Actif</span></div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Prescriptions</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#FFF', letterSpacing: -1 }}>+{prescTab === 'subscribed' ? monthTotal : pendingPrescs.reduce((s: number, p: any) => s + (p.commission || 0), 0)} EUR</div>
            {prescTab === 'subscribed' && (<>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 } as any}><i className="ri-calendar-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} /><input type="month" value={selectedMonth} onChange={(e: any) => setSelectedMonth(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#FFF', fontSize: 13, fontWeight: 600, outline: 'none' } as any} /></div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Prochain versement de {subscribedPrescs.reduce((s: number, p: any) => s + (p.commission || 0), 0)} EUR le {nextPayDate}</div>
            </>)}
            {prescTab === 'pending' && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>En cours de validation</div>}
          </div>
          {/* Tabs */}
          <div style={{ textAlign: 'center', marginBottom: 10 } as any}>
            <div style={{ display: 'inline-flex', borderRadius: 999, padding: 4, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' } as any}>
              <div onClick={() => setPrescTab('pending')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: prescTab === 'pending' ? '#FFF' : 'transparent', color: prescTab === 'pending' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700 } as any}>En cours ({pendingPrescs.length})</div>
              <div onClick={() => setPrescTab('subscribed')} style={{ padding: '10px 24px', borderRadius: 999, cursor: 'pointer', background: prescTab === 'subscribed' ? '#FFF' : 'transparent', color: prescTab === 'subscribed' ? '#111' : 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 700 } as any}>Validees ({subscribedPrescs.length})</div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 14 } as any}>
            <div onClick={() => setShowAllPrescribers(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' } as any}>
              <div style={{ display: 'flex' } as any}>{prescribers.slice(0, 3).map((p2: any, i: number) => (<div key={i} style={{ width: 22, height: 22, borderRadius: 999, background: 'rgba(212,132,90,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: i > 0 ? -6 : 0, border: '2px solid rgba(0,0,0,0.2)' } as any}><span style={{ fontSize: 9, fontWeight: 800, color: '#FFF' }}>{p2.name?.charAt(0)}</span></div>))}</div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Voir les {prescribers.length} prescripteurs</span>
            </div>
          </div>
          {/* Challenge */}
          <div onClick={() => setShowRewardsDetail(true)} style={{ borderRadius: 16, overflow: 'hidden', position: 'relative', padding: '12px 16px', cursor: 'pointer', marginBottom: 12 } as any}><img src={BG_GOLD} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} /><div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 1 } as any} /><div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 10 } as any}><i className="ri-trophy-line" style={{ fontSize: 18, color: '#FFF' }} /><span style={{ fontSize: 13, fontWeight: 700, color: '#FFF', flex: 1 }}>Challenge prescripteurs</span><i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} /></div></div>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 12, transition: 'all 0.3s ease' } as any}><i className="ri-search-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} /><input value={searchPresc} onChange={(e: any) => setSearchPresc(e.target.value)} placeholder="Rechercher..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#FFF', fontSize: 14, fontFamily: 'inherit' } as any} /></div>
          {/* Cards */}
          {filteredPrescs.map((p: any) => (
            <div key={p.id} onClick={() => setSelectedPresc(p)} style={{ borderRadius: 20, padding: '18px 16px', marginBottom: 12, cursor: 'pointer', minHeight: 90, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 } as any}>
                <div><div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{p.beneficiary_name}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Par {p.guardian_name || p.prescriber_name}</div></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: p.status === 'subscribed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', flexShrink: 0 } as any}><span style={{ width: 6, height: 6, borderRadius: 3, background: p.status === 'subscribed' ? '#10B981' : '#F59E0B' } as any} /><span style={{ fontSize: 10, fontWeight: 600, color: '#FFF' }}>{p.status === 'subscribed' ? 'Validee' : 'En cours'}</span></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}><div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>+{p.commission || 0} EUR</div><div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.12)', borderRadius: 999, padding: '8px 16px' } as any}><i className="ri-heart-line" style={{ fontSize: 14, color: '#FFF' }} /><span style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>Consulter</span></div></div>
            </div>
          ))}
          {filteredPrescs.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px' } as any}><i className="ri-file-text-line" style={{ fontSize: 36, color: 'rgba(255,255,255,0.15)' }} /><div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>{searchPresc ? 'Aucun resultat' : `Aucune prescription ${prescTab === 'pending' ? 'en cours' : 'validee'}`}</div></div>}
        </div>
      </div>
    );
  }

  const glass = {};
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', letterSpacing: -0.5 }}>Prescriptions</Text>
        <Text style={{ fontSize: 12, color: '#6B7280' }}>{allPrescs.length} prescriptions au total</Text>
      </View>

      <View style={{ flexDirection: 'row', marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 4, marginBottom: 0, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', ...glass }}>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, prescTab === 'pending' && { backgroundColor: '#FF9800' }]} onPress={() => setPrescTab('pending')}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: prescTab === 'pending' ? '#FFF' : '#888' }}>En cours ({pendingPrescs.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 }, prescTab === 'subscribed' && { backgroundColor: '#10B981' }]} onPress={() => setPrescTab('subscribed')}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: prescTab === 'subscribed' ? '#FFF' : '#888' }}>Validees ({subscribedPrescs.length})</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 }}>
        <Text style={{ fontSize: 12, color: '#6B7280' }}>Total commissions</Text>
        <Text style={{ fontSize: 16, fontWeight: '900', color: prescTab === 'pending' ? '#FF9800' : '#4CAF50' }}>{prescTotal} EUR</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#111827" />}>
        {displayedPrescs.map((p: any) => (
          <TouchableOpacity key={p.id} activeOpacity={0.7} onPress={() => setSelectedPresc(p)}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 14, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: p.status === 'subscribed' ? '#4CAF50' : '#FF9800', ...glass }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: p.status === 'subscribed' ? '#E8F5E9' : '#FFF3E0', justifyContent: 'center', alignItems: 'center' }}>
                  <Icon name={p.status === 'subscribed' ? 'checkmark-circle' : 'time'} size={16} color={p.status === 'subscribed' ? '#4CAF50' : '#FF9800'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>{p.beneficiary_name}</Text>
                  <Text style={{ fontSize: 10, color: '#6B7280' }}>Par: {p.guardian_name}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '800', color: p.status === 'subscribed' ? '#4CAF50' : '#FF9800' }}>+{p.commission}EUR</Text>
                <Icon name="chevron-forward" size={14} color="#888" />
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {displayedPrescs.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Icon name={prescTab === 'pending' ? 'time-outline' : 'checkmark-circle-outline'} size={36} color="#CCC" />
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>Aucune prescription {prescTab === 'pending' ? 'en cours' : 'validee'}</Text>
          </View>
        )}
      </ScrollView>

      {/* Prescription Detail Modal */}
      <Modal visible={!!selectedPresc} transparent animationType="fade" onRequestClose={() => setSelectedPresc(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' }}>
            {selectedPresc && <>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 }}>
                <TouchableOpacity onPress={() => setSelectedPresc(null)} style={{ padding: 4, marginRight: 12 }}>
                  <Icon name="chevron-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={{ flex: 1, fontSize: 18, fontWeight: '900', color: '#111827' }}>Fiche Prescription</Text>
                <TouchableOpacity onPress={() => setSelectedPresc(null)}><Icon name="close" size={22} color="#888" /></TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 24, marginBottom: 12, ...glass }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: selectedPresc.status === 'subscribed' ? '#4CAF50' : '#FF9800', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)' }}>
                      <Text style={{ fontSize: 24, fontWeight: '900', color: '#FFF' }}>{selectedPresc.beneficiary_name?.charAt(0)?.toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>{selectedPresc.beneficiary_name}</Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                        <View style={{ backgroundColor: selectedPresc.status === 'subscribed' ? '#E8F5E9' : '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: selectedPresc.status === 'subscribed' ? '#2E7D32' : '#E65100' }}>{selectedPresc.status === 'subscribed' ? 'SOUSCRIT' : 'EN ATTENTE'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  {[
                    { icon: 'mail-outline', label: 'Email', value: selectedPresc.beneficiary_email },
                    { icon: 'call-outline', label: 'Telephone', value: selectedPresc.beneficiary_phone },
                    { icon: 'person-circle-outline', label: 'Prescripteur', value: selectedPresc.guardian_name },
                    { icon: 'cash-outline', label: 'Commission', value: `${selectedPresc.commission} EUR` },
                    { icon: 'calendar-outline', label: 'Date', value: selectedPresc.created_at ? new Date(selectedPresc.created_at).toLocaleDateString('fr-FR') : '' },
                  ].map(({ icon, label, value }) => value ? (
                    <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
                      <Icon name={icon as any} size={16} color="#888" />
                      <Text style={{ fontSize: 12, color: '#6B7280', width: 100 }}>{label}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827', flex: 1 }}>{value}</Text>
                    </View>
                  ) : null)}
                </View>
                <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, borderLeftWidth: 4, borderLeftColor: selectedPresc.status === 'subscribed' ? '#4CAF50' : '#FF9800', alignItems: 'center', ...glass }}>
                  <Text style={{ fontSize: 32, fontWeight: '900', color: selectedPresc.status === 'subscribed' ? '#4CAF50' : '#FF9800' }}>+{selectedPresc.commission} EUR</Text>
                  <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600', marginTop: 4 }}>Commission {selectedPresc.status === 'subscribed' ? 'validee' : 'en attente'}</Text>
                </View>
              </ScrollView>
            </>}
          </View>
        </View>
      </Modal>
    </View>
  );
  // end native
}

/* ===== MAIN ===== */
export default function DevicesScreen() {
  const { user, token } = useAuth();
  const { colors } = useTheme();
  if (!user || !token) return null;
  const r = user.active_role || user.role;
  // Guardian: full screen, no wrapper header
  if (r === 'guardian') {
    return <PrescriptionManagement token={token} user={user} />;
  }
  // Beneficiary: full screen devices page (web)
  if (r === 'beneficiary' && Platform.OS === 'web') {
    return <DeviceManagement token={token} />;
  }
  // Admin, Company, Teleassistance: full screen web
  if (Platform.OS === 'web') {
    if (r === 'admin') return <AdminPrescripteurs token={token} />;
    if (r === 'prescriber_company') return <CompanyPrescriptionsTab token={token} />;
    if (r === 'teleassistance') return <SubscribersList token={token} />;
  }

  return (
    <View key={r} style={[d.safeArea, { backgroundColor: '#FFFFFF' }]} testID="devices-screen">
      <View style={d.header}>
        <Text style={[d.title, { color: '#111827' }]}>{r === 'admin' ? 'Prescripteurs' : r === 'prescriber_company' ? 'Prescriptions' : r === 'teleassistance' ? 'Abonnes' : 'Mes Appareils'}</Text>
      </View>
      {r === 'admin' ? <AdminPrescripteurs token={token} />
        : r === 'prescriber_company' ? <CompanyPrescriptionsTab token={token} />
        : r === 'teleassistance' ? <SubscribersList token={token} />
        : <DeviceManagement token={token} />}
    </View>
  );
}

const d = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  sv: { flex: 1 }, sc: { paddingHorizontal: 20, paddingBottom: 24 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  infoText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, marginBottom: 14, backgroundColor: Colors.subtle, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  // Device Card
  deviceCard: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 16, marginBottom: 10 },
  deviceHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  deviceIconBg: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.border },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  deviceMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  connDot: { width: 6, height: 6, borderRadius: 3 },
  connText: { fontSize: 12, fontWeight: '600' },
  batteryT: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  syncBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.paper },
  syncBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  // Prescriptions
  commCard: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 16, marginBottom: 14, alignItems: 'center' },
  commLabel: { fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  commVal: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  commCount: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  newPrescBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12, marginBottom: 16 },
  newPrescBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  prescCard: { backgroundColor: Colors.subtle, borderRadius: 12, padding: 14, marginBottom: 6 },
  prescHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  prescName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  prescStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: Colors.subtle, borderWidth: 1, borderColor: Colors.border },
  prescStatusText: { fontSize: 10, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  prescEmail: { fontSize: 12, color: Colors.textMuted, marginBottom: 4 },
  prescFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prescType: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  prescComm: { fontSize: 14, fontWeight: '700', color: Colors.success },
  // Prescriber activation
  activateCard: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 24, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  activateTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginTop: 12 },
  activateDesc: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19, marginTop: 8, marginBottom: 16 },
  activateRow: { flexDirection: 'row', gap: 8, width: '100%' },
  activateInput: { flex: 1, backgroundColor: Colors.paper, borderRadius: 10, padding: 14, fontSize: 15, fontWeight: '600', color: Colors.text, borderWidth: 1, borderColor: Colors.border, textAlign: 'center', letterSpacing: 2 },
  activateBtn: { paddingHorizontal: 20, borderRadius: 10, backgroundColor: Colors.primary, justifyContent: 'center' },
  activateBtnT: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginVertical: 14 },
  divLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  divText: { fontSize: 12, color: Colors.textMuted },
  chutexLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chutexLinkT: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  // Subscribers
  subCount: { fontSize: 12, color: Colors.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  subCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.subtle, borderRadius: 10, padding: 12, marginBottom: 6, gap: 10 },
  subAv: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  subAvT: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  subInfo: { flex: 1 },
  subName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  subEmail: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  alertBdg: { backgroundColor: Colors.destructive, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  alertBdgT: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  // Empty & Modal
  emptyC: { alignItems: 'center', paddingVertical: 36 },
  emptyT: { fontSize: 13, color: Colors.textMuted, marginTop: 8 },
  modalO: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalC: { backgroundColor: Colors.paper, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalT: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: 16 },
  inputL: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalInp: { backgroundColor: Colors.subtle, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, fontSize: 15, color: Colors.textPrimary, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  typeSelector: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  typeBtnA: { borderColor: Colors.primary },
  typeBtnT: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  typeBtnTA: { color: Colors.textPrimary },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.subtle, alignItems: 'center' },
  cancelBtnT: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  submitBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center' },
  submitBtnT: { fontSize: 15, fontWeight: '600', color: '#FFF' },
});
