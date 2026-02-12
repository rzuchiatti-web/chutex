import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { Colors } from '../src/constants/colors';

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
    apiFetch('/api/bracelet/status', {}, token).then(d => {
      setBraceletData(d);
      if (d) setVitals(v => ({ ...v, battery: d.battery || 0, heart_rate: d.heart_rate || 0, spo2: d.spo2 || 0, temperature: d.temperature || 0, steps: d.steps || 0, systolic: d.systolic || 0, diastolic: d.diastolic || 0 }));
    }).catch(() => {}).finally(() => setLoading(false));
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
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
    // Request battery + start realtime mode immediately
    sendCommand(0x0D); // battery
    setTimeout(() => sendCommand(0x09, [1, 1]), 500); // start realtime steps + HR
    // Poll every 30s
    pollRef.current = setInterval(() => {
      sendCommand(0x0D);
      setTimeout(() => sendCommand(0x09, [1, 1]), 500);
    }, 30000);
  }, [sendCommand]);

  const connectBracelet = async () => {
    if (Platform.OS !== 'web' || !('bluetooth' in navigator)) return;
    setBleStatus('scanning');
    setErrorMsg('');
    try {
      const nav = navigator as any;
      const bd = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [BLE_SERVICE_UUID],
      });
      setDevice(bd);
      setBleStatus('connecting');
      setErrorMsg('Appareil selectionne, connexion GATT...');
      bd.addEventListener('gattserverdisconnected', () => {
        setBleStatus('idle');
        if (pollRef.current) clearInterval(pollRef.current);
      });
      const server = await bd.gatt.connect();
      setErrorMsg('GATT connecte, recherche service fff0...');
      try {
        const svcErr_msg = '';
        let service: any = null;
        try {
          service = await server.getPrimaryService(BLE_SERVICE_UUID);
        } catch {
          const services = await server.getPrimaryServices();
          for (const svc of services) {
            if (svc.uuid === BLE_SERVICE_UUID || svc.uuid.includes('fff0')) {
              service = svc;
              break;
            }
          }
        }
        if (!service) {
          setErrorMsg('Service BLE fff0 non accessible');
          setBleStatus('idle');
          return;
        }
        setErrorMsg('Service trouve, acces caracteristiques...');
        let notifyChar: any = null;
        let wChar: any = null;
        try {
          notifyChar = await service.getCharacteristic(BLE_NOTIFY_UUID);
        } catch {
          // Try to find notify characteristic by scanning all
          const chars = await service.getCharacteristics();
          for (const c of chars) {
            if (c.properties.notify || c.properties.indicate) notifyChar = c;
            if (c.properties.write || c.properties.writeWithoutResponse) wChar = c;
          }
        }
        if (!wChar) {
          try { wChar = await service.getCharacteristic(BLE_WRITE_UUID); } catch {}
        }
        if (notifyChar) {
          await notifyChar.startNotifications();
          notifyChar.addEventListener('characteristicvaluechanged', handleBleData);
          writeCharRef.current = wChar;
          setBleStatus('connected');
          setErrorMsg('');
          startPolling();
        } else {
          setErrorMsg('Caracteristique notify non trouvee dans service fff0');
          setBleStatus('idle');
        }
      } catch (innerErr: any) {
        setErrorMsg(`Erreur service: ${innerErr?.message || String(innerErr)}`);
        setBleStatus('idle');
      }
    } catch (e: any) {
      setErrorMsg(`Erreur BLE: ${e?.message || e?.name || 'inconnue'} - ${String(e)}`);
      setBleStatus('idle');
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
  if (!isPaired && bleStatus !== 'connecting' && bleStatus !== 'scanning') return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="chevron-back" size={22} color={Colors.textPrimary} /></TouchableOpacity>
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
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="chevron-back" size={22} color={Colors.textPrimary} /></TouchableOpacity>
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
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="chevron-back" size={22} color={Colors.textPrimary} /></TouchableOpacity>
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
          <Text style={s.sectionTitle}>Constantes</Text>
          <View style={s.vitalsGrid}>
            <VitalCard icon="heart" label="Pouls" value={vitals.heart_rate || '-'} unit="bpm" color="#E53935" />
            <VitalCard icon="water" label="SpO2" value={vitals.spo2 || '-'} unit="%" color="#1E88E5" />
            <VitalCard icon="thermometer" label="Temp." value={vitals.temperature || '-'} unit="°C" color="#FB8C00" />
            <VitalCard icon="pulse" label="Tension" value={vitals.systolic ? `${vitals.systolic}/${vitals.diastolic}` : '-'} unit="mmHg" color="#8E24AA" />
            <VitalCard icon="footsteps" label="Pas" value={vitals.steps || '-'} unit="" color={Colors.success} />
            <VitalCard icon="flash" label="Stress" value={vitals.stress || '-'} unit="" color="#F4511E" />
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
});
