import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { Colors } from '../src/constants/colors';

const BLE_SERVICES = [
  { uuid: '0000ffe0-0000-1000-8000-00805f9b34fb', notify: '0000ffe4-0000-1000-8000-00805f9b34fb' },
  { uuid: '6e400001-b5a3-f393-e0a9-e50e24dcca9e', notify: '6e400003-b5a3-f393-e0a9-e50e24dcca9e', write: '6e400002-b5a3-f393-e0a9-e50e24dcca9e' },
];

function parseVestData(raw: string) {
  const data: Record<string, any> = {};
  let cleaned = raw.trim();
  if (cleaned.startsWith('@')) cleaned = cleaned.substring(1);
  if (cleaned.endsWith('#')) cleaned = cleaned.substring(0, cleaned.length - 1);
  cleaned.split('&').forEach(part => {
    if (part.includes('=')) {
      const [key, val] = part.split('=');
      const k = key.trim();
      if (!k) return;
      const intKeys = ['bat', 'csq', 'step', 'no', 'sos', 'fault', 'type', 'mod'];
      if (intKeys.includes(k)) data[k] = parseInt(val) || 0;
      else data[k] = val;
    }
  });
  return data;
}

export default function VestConnectScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [bleStatus, setBleStatus] = useState<'idle'|'scanning'|'connecting'|'connected'>('idle');
  const [device, setDevice] = useState<any>(null);
  const [battery, setBattery] = useState(0);
  const [vestData, setVestData] = useState<any>(null);
  const [dataLog, setDataLog] = useState<string[]>([]);
  const [sosTriggered, setSosTriggered] = useState(false);

  // Load stored vest data on mount
  useEffect(() => {
    apiFetch('/api/vest/status', {}, token).then(v => {
      setVestData(v);
      if (v?.battery) setBattery(v.battery);
    }).catch(() => {});
    if (Platform.OS === 'web' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const isPaired = vestData?.device?.ble_device_id;
  const isActive = vestData?.connected;

  const addLog = useCallback((msg: string) => {
    setDataLog(prev => [`${new Date().toLocaleTimeString('fr-FR')} - ${msg}`, ...prev].slice(0, 20));
  }, []);

  const sendToBackend = useCallback(async (raw: string, parsed: Record<string, any>) => {
    try {
      const r = await apiFetch('/api/vest/push', {
        method: 'POST',
        body: JSON.stringify({ raw, parsed, device_id: parsed.id || '' }),
      }, token);
      if (r?.alert === 'sos') {
        setSosTriggered(true);
        addLog('ALERTE CHUTE DETECTEE !');
        if (Platform.OS === 'web' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('CHUTEX - Chute detectee !', { body: 'Une chute a ete detectee par le gilet.' });
        }
      }
    } catch (e: any) {
      addLog(`Erreur: ${e.message}`);
    }
  }, [token, addLog]);

  const handleBleData = useCallback((event: any) => {
    const decoder = new TextDecoder('utf-8');
    const raw = decoder.decode(event.target.value);
    const parsed = parseVestData(raw);
    if (parsed.type === 1) {
      setBattery(parsed.bat || 0);
      addLog(`Batterie: ${parsed.bat}%`);
    } else if (parsed.type === 2) {
      if (parsed.sos === 1) addLog('CHUTE DETECTEE - SOS !');
      if (parsed.fault === 1) addLog('Panne gilet detectee');
    }
    sendToBackend(raw, parsed);
  }, [addLog, sendToBackend]);

  const connectVest = async () => {
    if (Platform.OS !== 'web' || !('bluetooth' in navigator)) {
      Alert.alert('Bluetooth', 'Ouvrez l\'app dans Chrome (Android) ou Bluefy (iPhone).');
      return;
    }
    setBleStatus('scanning');
    addLog('Recherche du gilet...');
    try {
      const nav = navigator as any;
      const bleDevice = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: BLE_SERVICES.map(s => s.uuid),
      });
      setDevice(bleDevice);
      addLog(`Trouve: ${bleDevice.name || bleDevice.id}`);
      setBleStatus('connecting');

      bleDevice.addEventListener('gattserverdisconnected', () => {
        setBleStatus('idle');
        addLog('BLE deconnecte');
      });

      const server = await bleDevice.gatt.connect();
      let subscribed = false;
      for (const svc of BLE_SERVICES) {
        try {
          const service = await server.getPrimaryService(svc.uuid);
          const notifyChar = await service.getCharacteristic(svc.notify);
          await notifyChar.startNotifications();
          notifyChar.addEventListener('characteristicvaluechanged', handleBleData);
          subscribed = true;
          addLog('Gilet appaire et en ecoute');
          if (svc.write) {
            try {
              const writeChar = await service.getCharacteristic(svc.write);
              const now = new Date();
              const timeStr = `time&${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}-${String(now.getSeconds()).padStart(2,'0')}`;
              await writeChar.writeValue(new TextEncoder().encode(timeStr));
            } catch {}
          }
          break;
        } catch { continue; }
      }
      setBleStatus(subscribed ? 'connected' : 'idle');
      if (!subscribed) addLog('Service BLE non trouve');
    } catch (e: any) {
      if (e.name === 'NotFoundError') addLog('Aucun appareil selectionne');
      else addLog(`Erreur: ${e.message}`);
      setBleStatus('idle');
    }
  };

  const stColor = isActive || bleStatus === 'connected' ? Colors.success : Colors.textMuted;

  return (
    <SafeAreaView style={s.safe} data-testid="vest-connect-screen">
      <View style={s.topBar}>
        <TouchableOpacity data-testid="vest-back-btn" onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Gilet Anti-Chute</Text>
        <View style={[s.statusDot, { backgroundColor: stColor }]} />
      </View>

      <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}>

        {/* Main Status Card */}
        <View style={[s.card, { borderColor: stColor, borderWidth: 1.5 }]}>
          <View style={s.cardRow}>
            <Ionicons name="shield-checkmark" size={32} color={stColor} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.cardTitle}>{vestData?.device?.ble_device_id ? 'Gilet Anti-Chute' : 'Gilet non appaire'}</Text>
              <Text style={[s.cardStatus, { color: stColor }]}>
                {isActive || bleStatus === 'connected' ? 'Actif' : isPaired ? 'Eteint' : 'Non configure'}
              </Text>
              {vestData?.last_sync && (
                <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }}>
                  Derniere activite: {new Date(vestData.last_sync).toLocaleString('fr-FR', {hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'})}
                </Text>
              )}
            </View>
            {battery > 0 && (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name={battery > 50 ? "battery-full" : battery > 20 ? "battery-half" : "battery-dead"} size={28} color={battery > 20 ? Colors.success : Colors.destructive} />
                <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.textPrimary }}>{battery}%</Text>
              </View>
            )}
          </View>

          {/* Show BLE connect only if never paired */}
          {!isPaired && bleStatus !== 'connected' && (
            <TouchableOpacity data-testid="connect-vest-btn" style={s.connectBtn} onPress={connectVest}
              disabled={bleStatus === 'scanning' || bleStatus === 'connecting'}>
              {bleStatus === 'scanning' || bleStatus === 'connecting' ? (
                <><ActivityIndicator color="#FFF" size="small" /><Text style={s.connectBtnT}>Recherche...</Text></>
              ) : (
                <><Ionicons name="bluetooth" size={18} color="#FFF" /><Text style={s.connectBtnT}>Appairer le gilet</Text></>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* SOS Alert Banner */}
        {sosTriggered && (
          <View style={s.sosCard} data-testid="sos-alert">
            <Ionicons name="warning" size={24} color="#FFF" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.sosTitle}>CHUTE DETECTEE</Text>
              <Text style={s.sosDesc}>Les gardiens et le plateau d'ecoute ont ete alertes.</Text>
            </View>
          </View>
        )}

        {/* Info when paired */}
        {isPaired && (
          <View style={s.card}>
            <View style={s.infoRow}>
              <Ionicons name="hardware-chip" size={18} color={Colors.textMuted} />
              <Text style={s.infoLabel}>Identifiant</Text>
              <Text style={s.infoValue}>{vestData?.device?.ble_device_id}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.infoRow}>
              <Ionicons name="radio" size={18} color={isActive || bleStatus === 'connected' ? Colors.success : Colors.textMuted} />
              <Text style={s.infoLabel}>Statut</Text>
              <Text style={[s.infoValue, { color: isActive || bleStatus === 'connected' ? Colors.success : Colors.textMuted }]}>
                {isActive || bleStatus === 'connected' ? 'Actif - En fonctionnement' : 'Eteint'}
              </Text>
            </View>
            <View style={s.divider} />
            <View style={s.infoRow}>
              <Ionicons name="battery-half" size={18} color={battery > 20 ? Colors.success : Colors.destructive} />
              <Text style={s.infoLabel}>Batterie</Text>
              <Text style={[s.infoValue, { color: battery > 20 ? Colors.textPrimary : Colors.destructive }]}>{battery}%</Text>
            </View>

            {/* BLE reconnect button (small, secondary) */}
            {bleStatus !== 'connected' && (
              <>
                <View style={s.divider} />
                <TouchableOpacity style={s.reconnectBtn} onPress={connectVest}
                  disabled={bleStatus === 'scanning' || bleStatus === 'connecting'}>
                  {bleStatus === 'scanning' || bleStatus === 'connecting' ? (
                    <ActivityIndicator color={Colors.primary} size="small" />
                  ) : (
                    <><Ionicons name="bluetooth" size={14} color={Colors.primary} /><Text style={s.reconnectBtnT}>Reconnecter en Bluetooth</Text></>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Journal */}
        {dataLog.length > 0 && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Journal</Text>
            {dataLog.map((log, i) => (
              <Text key={i} style={[s.logItem, log.includes('CHUTE') || log.includes('SOS') ? { color: Colors.destructive, fontWeight: '700' } : {}]}>{log}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.subtle, justifyContent: 'center', alignItems: 'center' },
  topTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  sc: { paddingHorizontal: 16, paddingBottom: 40, gap: 12 },
  card: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 16 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  cardStatus: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  connectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12, marginTop: 14 },
  connectBtnT: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  sosCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.destructive, borderRadius: 14, padding: 16 },
  sosTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  sosDesc: { color: '#FFF', fontSize: 12, marginTop: 2, opacity: 0.9 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  infoLabel: { flex: 1, fontSize: 14, color: Colors.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1, backgroundColor: Colors.border },
  reconnectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, marginTop: 4 },
  reconnectBtnT: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  logItem: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});
