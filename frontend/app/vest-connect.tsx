import { Icon, MCIcon } from '../src/components/WebIcon';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { Colors } from '../src/constants/colors';
import { useTheme } from '../src/context/ThemeContext';
import { isBleAvailable, getBleManager, bytesToBase64, base64ToBytes } from '../src/services/ble';

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
      if (['bat','csq','step','no','sos','fault','type','mod'].includes(k)) data[k] = parseInt(val) || 0;
      else data[k] = val;
    }
  });
  return data;
}

export default function VestConnectScreen() {
  const { colors: themeColors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const [bleStatus, setBleStatus] = useState<'idle'|'scanning'|'connecting'|'connected'>('idle');
  const [device, setDevice] = useState<any>(null);
  const [battery, setBattery] = useState(0);
  const [vestData, setVestData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sosTriggered, setSosTriggered] = useState(false);
  const writeCharRef = useRef<any>(null);
  const pollRef = useRef<any>(null);

  useEffect(() => {
    apiFetch('/api/vest/status', {}, token).then(v => {
      setVestData(v);
      if (v?.battery) setBattery(v.battery);
    }).catch(() => {}).finally(() => setLoading(false));
    if (Platform.OS === 'web' && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const isPaired = vestData?.battery > 0 || !!vestData?.device?.ble_device_id;
  const isActive = vestData?.connected;

  const writeTime = useCallback(async (c?: any) => {
    const char = c || writeCharRef.current;
    if (!char) return;
    try {
      const n = new Date();
      const t = `time&${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}-${String(n.getHours()).padStart(2,'0')}-${String(n.getMinutes()).padStart(2,'0')}-${String(n.getSeconds()).padStart(2,'0')}`;
      await char.writeValue(new TextEncoder().encode(t));
    } catch {}
  }, []);

  const sendToBackend = useCallback(async (raw: string, parsed: Record<string, any>) => {
    try {
      const r = await apiFetch('/api/vest/push', { method: 'POST', body: JSON.stringify({ raw, parsed, device_id: parsed.id || '' }) }, token);
      if (r?.alert === 'sos') {
        setSosTriggered(true);
        if (Platform.OS === 'web' && 'Notification' in window && Notification.permission === 'granted')
          new Notification('CHUTEX - Chute detectee !', { body: 'Alerte envoyee aux gardiens.' });
      }
    } catch {}
  }, [token]);

  const handleBleData = useCallback((event: any) => {
    const raw = new TextDecoder('utf-8').decode(event.target.value);
    const parsed = parseVestData(raw);
    if (parsed.type === 1) setBattery(parsed.bat || 0);
    if (parsed.type === 2 && parsed.sos === 1) setSosTriggered(true);
    sendToBackend(raw, parsed);
  }, [sendToBackend]);

  const connectVest = async () => {
    setBleStatus('scanning');

    if (Platform.OS === 'web') {
      if (!('bluetooth' in navigator)) return;
      try {
        const nav = navigator as any;
        const bd = await nav.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: BLE_SERVICES.map(s => s.uuid) });
        setDevice(bd);
        setBleStatus('connecting');
        bd.addEventListener('gattserverdisconnected', () => { setBleStatus('idle'); if (pollRef.current) clearInterval(pollRef.current); });
        const server = await bd.gatt.connect();
        let ok = false;
        for (const svc of BLE_SERVICES) {
          try {
            const service = await server.getPrimaryService(svc.uuid);
            const nc = await service.getCharacteristic(svc.notify);
            await nc.startNotifications();
            nc.addEventListener('characteristicvaluechanged', handleBleData);
            ok = true;
            if (svc.write) {
              try { const wc = await service.getCharacteristic(svc.write); writeTime(wc); pollRef.current = setInterval(() => writeTime(), 30000); } catch {}
            }
            break;
          } catch { continue; }
        }
        setBleStatus(ok ? 'connected' : 'idle');
      } catch { setBleStatus('idle'); }
    } else {
      // Native BLE
      const manager = getBleManager();
      if (!manager) { setBleStatus('idle'); return; }
      try {
        if (Platform.OS === 'android') {
          const { PermissionsAndroid } = require('react-native');
          await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);
        }
        let found = false;
        manager.startDeviceScan(null, null, async (error: any, dev: any) => {
          if (error || !dev) return;
          const name = dev.name || dev.localName || '';
          if (name.includes('Elder') || name.includes('AIRBAG') || name.includes('Gilet') || name.includes('Airbag')) {
            if (found) return;
            found = true;
            manager.stopDeviceScan();
            setBleStatus('connecting');
            try {
              const connected = await dev.connect();
              const discovered = await connected.discoverAllServicesAndCharacteristics();
              setDevice(discovered);
              for (const svc of BLE_SERVICES) {
                try {
                  discovered.monitorCharacteristicForService(svc.uuid, svc.notify, (err: any, char: any) => {
                    if (err || !char?.value) return;
                    const bytes = base64ToBytes(char.value);
                    const raw = new TextDecoder('utf-8').decode(bytes);
                    handleBleData({ target: { value: new DataView(bytes.buffer) } });
                  });
                  if (svc.write) {
                    const writeNative = async () => {
                      try {
                        const now = new Date();
                        const t = `time&${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}-${String(now.getSeconds()).padStart(2,'0')}`;
                        const encoded = bytesToBase64(Array.from(new TextEncoder().encode(t)));
                        await discovered.writeCharacteristicWithResponseForService(svc.uuid, svc.write, encoded);
                      } catch {}
                    };
                    writeNative();
                    pollRef.current = setInterval(writeNative, 30000);
                  }
                  setBleStatus('connected');
                  break;
                } catch { continue; }
              }
            } catch { setBleStatus('idle'); }
          }
        });
        setTimeout(() => { if (!found) { manager.stopDeviceScan(); setBleStatus('idle'); } }, 15000);
      } catch { setBleStatus('idle'); }
    }
  };

  const unpairVest = async () => {
    try {
      if (device?.gatt?.connected) device.gatt.disconnect();
      if (pollRef.current) clearInterval(pollRef.current);
      await apiFetch('/api/vest/unpair', { method: 'POST' }, token);
      setVestData(null);
      setBattery(0);
      setBleStatus('idle');
      setDevice(null);
      writeCharRef.current = null;
    } catch {}
  };

  if (loading) return <SafeAreaView style={[s.safe, { backgroundColor: themeColors.background }]}><View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View></SafeAreaView>;

  // ========== NOT PAIRED ==========
  if (!isPaired) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: themeColors.background }]}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Icon name="chevron-back" size={22} color={Colors.textPrimary} /></TouchableOpacity>
          <Text style={s.topTitle}>Gilet Anti-Chute</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={s.center}>
          <Icon name="shield-outline" size={80} color={Colors.textMuted} />
          <Text style={s.emptyTitle}>Aucun gilet connecte</Text>
          <Text style={s.emptyDesc}>Connectez votre gilet anti-chute via Bluetooth pour recevoir les alertes en temps reel.</Text>
          <TouchableOpacity style={s.pairBtn} onPress={connectVest}
            disabled={bleStatus === 'scanning' || bleStatus === 'connecting'}>
            {bleStatus === 'scanning' || bleStatus === 'connecting' ? (
              <><ActivityIndicator color="#111827" size="small" /><Text style={s.pairBtnT}>Recherche...</Text></>
            ) : (
              <><Icon name="bluetooth" size={20} color="#111827" /><Text style={s.pairBtnT}>Appairer un gilet</Text></>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ========== PAIRED ==========
  const cardBg = isActive || bleStatus === 'connected' ? '#E8F5E9' : Colors.subtle;
  const cardBorder = isActive || bleStatus === 'connected' ? Colors.success : Colors.border;
  const statusText = isActive || bleStatus === 'connected' ? 'Actif' : 'Eteint';
  const statusColor = isActive || bleStatus === 'connected' ? Colors.success : Colors.textMuted;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: themeColors.background }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Icon name="chevron-back" size={22} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={s.topTitle}>Gilet Anti-Chute</Text>
        <View style={[s.dot, { backgroundColor: statusColor }]} />
      </View>

      <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}>
        {/* SOS Banner */}
        {sosTriggered && (
          <View style={s.sosCard}>
            <Icon name="warning" size={24} color="#111827" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.sosTitle}>CHUTE DETECTEE</Text>
              <Text style={s.sosDesc}>Les gardiens ont ete alertes.</Text>
            </View>
          </View>
        )}

        {/* Main Card */}
        <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: 1.5 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={[s.iconCircle, { backgroundColor: statusColor + '20' }]}>
              <Icon name="shield-checkmark" size={32} color={statusColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Gilet Anti-Chute</Text>
              <Text style={[s.cardStatus, { color: statusColor }]}>{statusText}</Text>
            </View>
          </View>

          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Icon name={battery > 50 ? "battery-full" : battery > 20 ? "battery-half" : "battery-dead"} size={24} color={battery > 20 ? Colors.success : Colors.destructive} />
              <Text style={s.statVal}>{battery}%</Text>
              <Text style={s.statLabel}>Batterie</Text>
            </View>
            <View style={s.statBox}>
              <Icon name="radio" size={24} color={statusColor} />
              <Text style={[s.statVal, { color: statusColor }]}>{statusText}</Text>
              <Text style={s.statLabel}>Statut</Text>
            </View>
            <View style={s.statBox}>
              <Icon name="hardware-chip" size={24} color={Colors.textMuted} />
              <Text style={s.statVal}>{vestData?.device?.ble_device_id?.substring(0, 8) || '-'}</Text>
              <Text style={s.statLabel}>ID</Text>
            </View>
          </View>

          {vestData?.last_sync && (
            <Text style={s.lastSync}>Derniere activite : {new Date(vestData.last_sync).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text>
          )}
        </View>

        {/* Unpair */}
        <TouchableOpacity style={s.unpairBtn} onPress={unpairVest}>
          <Icon name="trash-outline" size={16} color={Colors.destructive} />
          <Text style={s.unpairBtnT}>Deconnecter le gilet</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.subtle, justifyContent: 'center', alignItems: 'center' },
  topTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  sc: { paddingHorizontal: 16, paddingBottom: 40, gap: 14 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  // Not paired
  emptyTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginTop: 20 },
  emptyDesc: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, marginTop: 8, marginBottom: 28 },
  pairBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary, paddingVertical: 16, paddingHorizontal: 40, borderRadius: 14 },
  pairBtnT: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  // Paired card
  card: { borderRadius: 16, padding: 18 },
  iconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  cardStatus: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  statsRow: { flexDirection: 'row', marginTop: 18, gap: 8 },
  statBox: { flex: 1, alignItems: 'center', backgroundColor: '#F2F4F7', borderRadius: 12, paddingVertical: 14, gap: 4 },
  statVal: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  lastSync: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 12 },
  // Buttons
  sosCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.destructive, borderRadius: 14, padding: 16 },
  sosTitle: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  sosDesc: { color: '#FFF', fontSize: 12, opacity: 0.9 },
  reconnectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.subtle, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  reconnectBtnT: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  unpairBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  unpairBtnT: { fontSize: 14, fontWeight: '600', color: Colors.destructive },
});
