import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, PermissionsAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { Colors } from '../src/constants/colors';
import { isBleAvailable, getBleManager, bytesToBase64, base64ToBytes } from '../src/services/ble';

// BLE UUIDs extracted from J-Style 2208A SDK APK
const BLE_SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
const BLE_NOTIFY_UUID = '0000fff6-0000-1000-8000-00805f9b34fb';
const BLE_WRITE_UUID = '0000fff7-0000-1000-8000-00805f9b34fb';

function calcCrc(data: number[]) { return data.reduce((s, b) => s + b, 0) & 0xFF; }

function buildCmd(cmd: number, payload: number[] = []) {
  const pkt = [cmd, ...payload, ...new Array(14 - payload.length).fill(0)];
  pkt.push(calcCrc(pkt));
  return new Uint8Array(pkt);
}

function parseResponse(data: DataView) {
  const cmd = data.getUint8(0);
  const result: Record<string, any> = { cmd };
  if (cmd === 0x09) {
    result.steps = data.getUint8(1) | (data.getUint8(2) << 8) | (data.getUint8(3) << 16) | (data.getUint8(4) << 24);
    result.calories = ((data.getUint8(5) | (data.getUint8(6) << 8) | (data.getUint8(7) << 16) | (data.getUint8(8) << 24)) / 100);
    result.heart_rate = data.getUint8(13);
  } else if (cmd === 0x28) {
    result.measurement_type = data.getUint8(1);
    result.heart_rate = data.getUint8(2);
    result.spo2 = data.getUint8(3);
    result.hrv = data.getUint8(4);
    result.stress = data.getUint8(5);
    result.systolic = data.getUint8(6);
    result.diastolic = data.getUint8(7);
    result.temperature = (data.getUint8(8) | (data.getUint8(9) << 8)) / 10;
  } else if (cmd === 0x0D) {
    result.battery = data.getUint8(1);
  }
  return result;
}

export default function BraceletConnectScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [bleStatus, setBleStatus] = useState<'idle'|'scanning'|'connecting'|'connected'>('idle');
  const [device, setDevice] = useState<any>(null);
  const [braceletData, setBraceletData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [vitals, setVitals] = useState({ battery: 0, heart_rate: 0, spo2: 0, temperature: 0, steps: 0, systolic: 0, diastolic: 0, stress: 0 });
  const writeCharRef = useRef<any>(null);
  const pollRef = useRef<any>(null);

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadStatus = () => {
      apiFetch('/api/bracelet/status', {}, token).then(d => {
        setBraceletData(d);
        if (d) setVitals(v => ({
          ...v,
          battery: d.battery || v.battery,
          heart_rate: d.heart_rate || v.heart_rate,
          spo2: d.spo2 || v.spo2,
          temperature: d.temperature || v.temperature,
          steps: d.steps || v.steps,
          systolic: d.systolic || v.systolic,
          diastolic: d.diastolic || v.diastolic,
        }));
      }).catch(() => {}).finally(() => setLoading(false));
    };
    loadStatus();
    const iv = setInterval(loadStatus, 5000);
    if (Platform.OS === 'web' && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    return () => { clearInterval(iv); if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const isPaired = braceletData?.paired || braceletData?.connected || vitals.steps > 0 || vitals.heart_rate > 0;
  const isActive = braceletData?.connected || bleStatus === 'connected';

  const sendToBackend = useCallback(async (parsed: Record<string, any>, rawHex: string) => {
    try {
      await apiFetch('/api/bracelet/push', { method: 'POST', body: JSON.stringify({ parsed, raw_hex: rawHex, device_id: device?.id || '' }) }, token);
    } catch {}
  }, [token, device]);

  const handleBleData = useCallback((event: any) => {
    const dv = event.target.value as DataView;
    const bytes = new Uint8Array(dv.buffer);
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const parsed = parseResponse(dv);

    if (parsed.battery) setVitals(v => ({ ...v, battery: parsed.battery }));
    if (parsed.heart_rate && parsed.heart_rate > 0 && parsed.heart_rate < 255) setVitals(v => ({ ...v, heart_rate: parsed.heart_rate }));
    if (parsed.spo2 && parsed.spo2 > 0) setVitals(v => ({ ...v, spo2: parsed.spo2 }));
    if (parsed.temperature && parsed.temperature > 30) setVitals(v => ({ ...v, temperature: parsed.temperature }));
    if (parsed.steps) setVitals(v => ({ ...v, steps: parsed.steps }));
    if (parsed.systolic) setVitals(v => ({ ...v, systolic: parsed.systolic, diastolic: parsed.diastolic || 0 }));
    if (parsed.stress) setVitals(v => ({ ...v, stress: parsed.stress }));

    sendToBackend(parsed, hex);
  }, [sendToBackend]);

  const sendCommand = useCallback(async (cmd: number, payload: number[] = []) => {
    if (!writeCharRef.current) return;
    try { await writeCharRef.current.writeValue(buildCmd(cmd, payload)); } catch {}
  }, []);

  const startPolling = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    // STEP 1: Set device time (required handshake - bracelet ignores commands without this)
    const now = new Date();
    const year = now.getFullYear();
    sendCommand(0x01, [year & 0xFF, (year >> 8) & 0xFF, now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()]);
    // STEP 2: After time sync, request all data
    setTimeout(() => sendCommand(0x0D), 500); // battery
    setTimeout(() => sendCommand(0x52, [0]), 1000); // today's steps
    setTimeout(() => sendCommand(0x55, [0]), 1500); // today's heart rate
    setTimeout(() => sendCommand(0x53, [0]), 2000); // sleep data
    setTimeout(() => sendCommand(0x28, [1, 1]), 2500); // start HRV (HR, temp, then BP, stress)
    setTimeout(() => sendCommand(0x28, [3, 1]), 3000); // start SpO2
    setTimeout(() => sendCommand(0x09, [1, 1]), 3500); // realtime mode
    // Every 10s: realtime + read stored data
    let tick = 0;
    pollRef.current = setInterval(() => {
      tick++;
      sendCommand(0x09, [1, 1]); // realtime
      if (tick % 3 === 0) { // every 30s
        sendCommand(0x0D); // battery
        sendCommand(0x52, [0]); // today's steps
        sendCommand(0x55, [0]); // today's HR
        setTimeout(() => sendCommand(0x28, [1, 1]), 200); // HRV
        setTimeout(() => sendCommand(0x28, [3, 1]), 400); // SpO2
      }
    }, 10000);
  }, [sendCommand]);

  const [measuring, setMeasuring] = useState(false);

  const measureNow = useCallback(async () => {
    setMeasuring(true);
    // Send all measurement commands
    await sendCommand(0x0D); // battery
    await new Promise(r => setTimeout(r, 200));
    await sendCommand(0x09, [1, 1]); // realtime steps + HR
    await new Promise(r => setTimeout(r, 200));
    await sendCommand(0x28, [2, 1]); // HR continu
    await new Promise(r => setTimeout(r, 200));
    await sendCommand(0x28, [3, 1]); // SpO2
    await new Promise(r => setTimeout(r, 200));
    await sendCommand(0x28, [1, 1]); // HRV / tension
    await new Promise(r => setTimeout(r, 200));
    await sendCommand(0x53, [0]); // sleep
    // Wait 5s for responses
    setTimeout(() => setMeasuring(false), 5000);
  }, [sendCommand]);

  // Native BLE polling
  const startNativePolling = useCallback((dev: any) => {
    if (pollRef.current) clearInterval(pollRef.current);
    const writeNative = async (cmd: number, payload: number[] = []) => {
      try {
        const pkt = buildCmd(cmd, payload);
        const b64 = bytesToBase64(Array.from(pkt));
        await dev.writeCharacteristicWithResponseForService(BLE_SERVICE_UUID, BLE_WRITE_UUID, b64);
      } catch {}
    };
    // Time sync first
    const now = new Date();
    writeNative(0x01, [now.getFullYear() & 0xFF, (now.getFullYear() >> 8) & 0xFF, now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()]);
    setTimeout(() => writeNative(0x0D), 500);
    setTimeout(() => writeNative(0x09, [1, 1]), 1000);
    setTimeout(() => writeNative(0x28, [1, 1]), 1500);
    setTimeout(() => writeNative(0x28, [3, 1]), 2000);
    let tick = 0;
    pollRef.current = setInterval(() => {
      tick++;
      writeNative(0x09, [1, 1]);
      if (tick % 3 === 0) {
        writeNative(0x0D);
        setTimeout(() => writeNative(0x28, [1, 1]), 200);
        setTimeout(() => writeNative(0x28, [3, 1]), 400);
      }
    }, 10000);
  }, []);

  const connectBracelet = async () => {
    setBleStatus('scanning');
    setErrorMsg('Recherche du bracelet...');

    if (Platform.OS === 'web') {
      if (!('bluetooth' in navigator)) { setErrorMsg('Web Bluetooth non disponible'); setBleStatus('idle'); return; }
      try {
        const nav = navigator as any;
        const bd = await nav.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [BLE_SERVICE_UUID, 'generic_access', 'heart_rate', 'battery_service', '0000ffe0-0000-1000-8000-00805f9b34fb', '0000fee7-0000-1000-8000-00805f9b34fb', '0000ffc0-0000-1000-8000-00805f9b34fb', '6e400001-b5a3-f393-e0a9-e50e24dcca9e', '0000180d-0000-1000-8000-00805f9b34fb', '0000180f-0000-1000-8000-00805f9b34fb', '0000180a-0000-1000-8000-00805f9b34fb', '00001809-0000-1000-8000-00805f9b34fb'],
        });
        setDevice(bd);
        setBleStatus('connecting');
        bd.addEventListener('gattserverdisconnected', () => { setBleStatus('idle'); if (pollRef.current) clearInterval(pollRef.current); });
        const server = await bd.gatt.connect();
        let notifyChar: any = null, wChar: any = null;
        for (const uuid of [BLE_SERVICE_UUID, '0000ffe0-0000-1000-8000-00805f9b34fb', '0000ffc0-0000-1000-8000-00805f9b34fb', '6e400001-b5a3-f393-e0a9-e50e24dcca9e', '0000180d-0000-1000-8000-00805f9b34fb']) {
          try { const svc = await server.getPrimaryService(uuid); const chars = await svc.getCharacteristics(); for (const c of chars) { if ((c.properties.notify || c.properties.indicate) && !notifyChar) notifyChar = c; if ((c.properties.write || c.properties.writeWithoutResponse) && !wChar) wChar = c; } if (notifyChar) break; } catch {}
        }
        if (notifyChar) { await notifyChar.startNotifications(); notifyChar.addEventListener('characteristicvaluechanged', handleBleData); writeCharRef.current = wChar; setBleStatus('connected'); setErrorMsg(''); startPolling(); }
        else { setErrorMsg('Aucun service BLE compatible'); setBleStatus('idle'); }
      } catch (e: any) { setErrorMsg(`Erreur: ${e?.message || String(e)}`); setBleStatus('idle'); }
    } else {
      // Native BLE via react-native-ble-plx
      const manager = getBleManager();
      if (!manager) { setErrorMsg('BLE non disponible'); setBleStatus('idle'); return; }
      try {
        if (Platform.OS === 'android') {
          await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);
        }
        setErrorMsg('Scan BLE...');
        let found = false;
        manager.startDeviceScan(null, null, async (error: any, dev: any) => {
          if (error) { setErrorMsg(`Scan: ${error.message}`); setBleStatus('idle'); return; }
          if (!dev) return;
          const name = dev.name || dev.localName || '';
          if (name.includes('2208') || name.includes('J22') || name.includes('JStyle')) {
            if (found) return;
            found = true;
            manager.stopDeviceScan();
            setErrorMsg(`Trouve: ${name}`);
            setBleStatus('connecting');
            try {
              const connected = await dev.connect();
              const discovered = await connected.discoverAllServicesAndCharacteristics();
              setDevice(discovered);
              discovered.monitorCharacteristicForService(BLE_SERVICE_UUID, BLE_NOTIFY_UUID, (err: any, char: any) => {
                if (err || !char?.value) return;
                const bytes = base64ToBytes(char.value);
                const parsed = parseResponse(new DataView(bytes.buffer));
                const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
                if (parsed.battery) setVitals(v => ({ ...v, battery: parsed.battery }));
                if (parsed.heart_rate > 0 && parsed.heart_rate < 255) setVitals(v => ({ ...v, heart_rate: parsed.heart_rate }));
                if (parsed.spo2 > 0) setVitals(v => ({ ...v, spo2: parsed.spo2 }));
                if (parsed.temperature > 30) setVitals(v => ({ ...v, temperature: parsed.temperature }));
                if (parsed.steps) setVitals(v => ({ ...v, steps: parsed.steps }));
                if (parsed.systolic) setVitals(v => ({ ...v, systolic: parsed.systolic, diastolic: parsed.diastolic || 0 }));
                sendToBackend(parsed, hex);
              });
              writeCharRef.current = discovered;
              setBleStatus('connected');
              setErrorMsg('');
              startNativePolling(discovered);
            } catch (e: any) { setErrorMsg(`Connexion: ${e.message}`); setBleStatus('idle'); }
          }
        });
        setTimeout(() => { if (!found) { manager.stopDeviceScan(); setErrorMsg('Bracelet non trouve'); setBleStatus('idle'); } }, 15000);
      } catch (e: any) { setErrorMsg(`Erreur: ${e?.message}`); setBleStatus('idle'); }
    }
  };

  const unpairBracelet = async () => {
    try {
      if (device?.gatt?.connected) device.gatt.disconnect();
      if (pollRef.current) clearInterval(pollRef.current);
      await apiFetch('/api/bracelet/unpair', { method: 'POST' }, token);
      setBraceletData(null);
      setVitals({ battery: 0, heart_rate: 0, spo2: 0, temperature: 0, steps: 0, systolic: 0, diastolic: 0, stress: 0 });
      setBleStatus('idle');
      setDevice(null);
    } catch {}
  };

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color={Colors.primary} /></View></SafeAreaView>;

  const stColor = isActive || bleStatus === 'connected' ? Colors.success : Colors.textMuted;

  // NOT PAIRED
  if (!isPaired && bleStatus !== 'connecting' && bleStatus !== 'scanning' && bleStatus !== 'connected') return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => { try { router.back(); } catch { if (Platform.OS === 'web') window.location.href = '/'; } }} style={s.backBtn}><Ionicons name="chevron-back" size={22} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={s.topTitle}>Bracelet Elio</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={s.center}>
        {errorMsg ? (
          <View style={{ backgroundColor: '#FFE0E0', padding: 16, borderRadius: 12, marginBottom: 20, width: '100%' }}>
            <Text style={{ fontSize: 13, color: Colors.destructive, fontWeight: '600' }}>{errorMsg}</Text>
          </View>
        ) : null}
        <Ionicons name="watch-outline" size={80} color={Colors.textMuted} />
        <Text style={s.emptyTitle}>Aucun bracelet connecte</Text>
        <Text style={s.emptyDesc}>Connectez votre bracelet Elio via Bluetooth pour suivre vos constantes de sante.</Text>
        <TouchableOpacity style={s.pairBtn} onPress={connectBracelet}>
          <Ionicons name="bluetooth" size={20} color="#FFF" /><Text style={s.pairBtnT}>Appairer le bracelet</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // SCANNING/CONNECTING
  if (bleStatus === 'scanning' || bleStatus === 'connecting') return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => { try { router.back(); } catch { if (Platform.OS === 'web') window.location.href = '/'; } }} style={s.backBtn}><Ionicons name="chevron-back" size={22} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={s.topTitle}>Bracelet Elio</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={s.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginTop: 16 }}>Connexion en cours...</Text>
        {errorMsg ? <Text style={{ fontSize: 12, color: '#FF9800', textAlign: 'center', marginTop: 8 }}>{errorMsg}</Text> : null}
      </View>
    </SafeAreaView>
  );

  // PAIRED
  const cardBg = isActive || bleStatus === 'connected' ? '#E8F5E9' : Colors.subtle;
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => { try { router.back(); } catch { if (Platform.OS === 'web') window.location.href = '/'; } }} style={s.backBtn}><Ionicons name="chevron-back" size={22} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={s.topTitle}>Bracelet Elio</Text>
        <View style={[s.dot, { backgroundColor: stColor }]} />
      </View>
      <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}>
        {/* Status */}
        <View style={[s.card, { backgroundColor: cardBg, borderColor: stColor, borderWidth: 1.5 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Ionicons name="watch" size={32} color={stColor} />
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Bracelet Elio</Text>
              <Text style={[s.cardStatus, { color: stColor }]}>{isActive || bleStatus === 'connected' ? 'Actif' : 'Eteint'}</Text>
            </View>
            {vitals.battery > 0 && <View style={{ alignItems: 'center' }}>
              <Ionicons name={vitals.battery > 50 ? "battery-full" : vitals.battery > 20 ? "battery-half" : "battery-dead"} size={24} color={vitals.battery > 20 ? Colors.success : Colors.destructive} />
              <Text style={{ fontSize: 14, fontWeight: '800' }}>{vitals.battery}%</Text>
            </View>}
          </View>
        </View>

        {/* Vitals Grid */}
        <View style={s.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={s.sectionTitle}>Constantes en temps reel</Text>
          </View>
          <View style={s.vitalsGrid}>
            <VitalCard icon="heart" label="Pouls" value={vitals.heart_rate || '-'} unit="bpm" color="#E53935" />
            <VitalCard icon="thermometer" label="Temp." value={vitals.temperature || '-'} unit="°C" color="#FB8C00" />
            <VitalCard icon="footsteps" label="Pas" value={vitals.steps || '-'} unit="" color={Colors.success} />
          </View>
        </View>

        {/* Sleep link */}
        <TouchableOpacity style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 10 }]} onPress={() => router.push('/sleep')}>
          <Ionicons name="moon" size={22} color="#1565C0" />
          <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>Voir le sommeil</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Unpair */}
        <TouchableOpacity style={s.unpairBtn} onPress={unpairBracelet}>
          <Ionicons name="trash-outline" size={16} color={Colors.destructive} />
          <Text style={s.unpairBtnT}>Deconnecter le bracelet</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function VitalCard({ icon, label, value, unit, color }: { icon: string; label: string; value: any; unit: string; color: string }) {
  return (
    <View style={s.vitalCard}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={s.vitalLabel}>{label}</Text>
      <Text style={[s.vitalVal, { color }]}>{value}</Text>
      {unit ? <Text style={s.vitalUnit}>{unit}</Text> : null}
    </View>
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
  emptyTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary, marginTop: 20 },
  emptyDesc: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, marginTop: 8, marginBottom: 28 },
  pairBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary, paddingVertical: 16, paddingHorizontal: 40, borderRadius: 14 },
  pairBtnT: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  card: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 16 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
  cardStatus: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vitalCard: { width: '31%', alignItems: 'center', backgroundColor: Colors.paper, borderRadius: 12, paddingVertical: 14, gap: 2 },
  vitalLabel: { fontSize: 10, color: Colors.textMuted },
  vitalVal: { fontSize: 20, fontWeight: '800' },
  vitalUnit: { fontSize: 10, color: Colors.textMuted },
  unpairBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  unpairBtnT: { fontSize: 14, fontWeight: '600', color: Colors.destructive },
  measureBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primary, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  measureBtnT: { fontSize: 12, fontWeight: '700', color: '#FFF' },
});
