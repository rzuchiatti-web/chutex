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
      const intKeys = ['accx','accy','accz','gyrox','gyroy','gyroz','roll','bat','csq','step','no','sos','fault','type','mod','firstflag','secondflag'];
      const floatKeys = ['latt','lng'];
      if (intKeys.includes(k)) data[k] = parseInt(val) || 0;
      else if (floatKeys.includes(k)) data[k] = parseFloat(val) || 0;
      else data[k] = val;
    }
  });
  return data;
}

export default function VestConnectScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<'idle'|'scanning'|'connecting'|'connected'|'error'>('idle');
  const [device, setDevice] = useState<any>(null);
  const [bleServer, setBleServer] = useState<any>(null);
  const [lastData, setLastData] = useState<Record<string, any>|null>(null);
  const [battery, setBattery] = useState(0);
  const [dataLog, setDataLog] = useState<string[]>([]);
  const [vestStatus, setVestStatus] = useState<any>(null);
  const [sosTriggered, setSosTriggered] = useState(false);
  const charRef = useRef<any>(null);

  useEffect(() => {
    apiFetch('/api/vest/status', {}, token).then(setVestStatus).catch(() => {});
  }, []);

  const addLog = useCallback((msg: string) => {
    setDataLog(prev => [`${new Date().toLocaleTimeString('fr-FR')} - ${msg}`, ...prev].slice(0, 30));
  }, []);

  const sendToBackend = useCallback(async (raw: string, parsed: Record<string, any>) => {
    try {
      const r = await apiFetch('/api/vest/push', {
        method: 'POST',
        body: JSON.stringify({ raw, parsed, device_id: parsed.id || '' }),
      }, token);
      if (r?.alert === 'sos') {
        setSosTriggered(true);
        addLog('ALERTE SOS DECLENCHEE !');
      }
    } catch (e: any) {
      addLog(`Erreur envoi: ${e.message}`);
    }
  }, [token, addLog]);

  const handleBleData = useCallback((event: any) => {
    const decoder = new TextDecoder('utf-8');
    const raw = decoder.decode(event.target.value);
    addLog(`Recu: ${raw.substring(0, 60)}...`);
    const parsed = parseVestData(raw);
    setLastData(parsed);
    if (parsed.bat) setBattery(parsed.bat);
    if (parsed.type === 2 && parsed.sos === 1) setSosTriggered(true);
    sendToBackend(raw, parsed);
  }, [addLog, sendToBackend]);

  const connectVest = async () => {
    if (Platform.OS !== 'web' || !('bluetooth' in navigator)) {
      Alert.alert('Bluetooth', 'Web Bluetooth est disponible uniquement sur Chrome (ordinateur ou Android). Ouvrez l\'app dans Chrome pour connecter le gilet.');
      return;
    }
    setStatus('scanning');
    addLog('Recherche du gilet S-AIRBAG...');
    try {
      const nav = navigator as any;
      const bleDevice = await nav.bluetooth.requestDevice({
        filters: [{ namePrefix: 'S-AIRBAG' }],
        optionalServices: BLE_SERVICES.map(s => s.uuid),
      });
      setDevice(bleDevice);
      addLog(`Appareil trouve: ${bleDevice.name || bleDevice.id}`);
      setStatus('connecting');

      bleDevice.addEventListener('gattserverdisconnected', () => {
        setStatus('idle');
        addLog('Gilet deconnecte');
        setBleServer(null);
      });

      const server = await bleDevice.gatt.connect();
      setBleServer(server);
      addLog('Connecte au GATT server');

      let subscribed = false;
      for (const svc of BLE_SERVICES) {
        try {
          const service = await server.getPrimaryService(svc.uuid);
          addLog(`Service trouve: ${svc.uuid.substring(0, 8)}...`);
          const notifyChar = await service.getCharacteristic(svc.notify);
          await notifyChar.startNotifications();
          notifyChar.addEventListener('characteristicvaluechanged', handleBleData);
          charRef.current = notifyChar;
          subscribed = true;
          addLog('Notifications activees - En ecoute...');

          // Write time sync if write characteristic available
          if (svc.write) {
            try {
              const writeChar = await service.getCharacteristic(svc.write);
              const now = new Date();
              const timeStr = `time&${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}-${String(now.getSeconds()).padStart(2,'0')}`;
              const encoder = new TextEncoder();
              await writeChar.writeValue(encoder.encode(timeStr));
              addLog(`Heure synchronisee: ${timeStr}`);
            } catch { /* write optional */ }
          }
          break;
        } catch {
          continue;
        }
      }
      if (subscribed) {
        setStatus('connected');
        addLog('Gilet connecte et pret !');
      } else {
        setStatus('error');
        addLog('Aucun service BLE compatible trouve');
      }
    } catch (e: any) {
      if (e.name === 'NotFoundError') {
        addLog('Aucun appareil selectionne');
        setStatus('idle');
      } else {
        addLog(`Erreur: ${e.message}`);
        setStatus('error');
      }
    }
  };

  const disconnectVest = () => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
    }
    setStatus('idle');
    setBleServer(null);
    setDevice(null);
    addLog('Deconnecte manuellement');
  };

  const statusColor = status === 'connected' ? Colors.success : status === 'error' ? Colors.destructive : status === 'scanning' || status === 'connecting' ? '#FF9800' : Colors.textMuted;
  const statusText = { idle: 'Non connecte', scanning: 'Recherche...', connecting: 'Connexion...', connected: 'Connecte', error: 'Erreur' }[status];

  return (
    <SafeAreaView style={s.safe} data-testid="vest-connect-screen">
      <View style={s.topBar}>
        <TouchableOpacity data-testid="vest-back-btn" onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Gilet Anti-Chute</Text>
        <View style={[s.statusDot, { backgroundColor: statusColor }]} />
      </View>

      <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}>
        {/* Connection Card */}
        <View style={[s.card, { borderColor: statusColor, borderWidth: 1.5 }]}>
          <View style={s.cardRow}>
            <Ionicons name="shield-checkmark" size={28} color={statusColor} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.cardTitle}>S-AIRBAG {device?.name || 'Gilet'}</Text>
              <Text style={[s.cardStatus, { color: statusColor }]}>{statusText}</Text>
            </View>
            {status === 'connected' && <Text style={s.batteryText}>{battery}%</Text>}
          </View>

          {status === 'idle' || status === 'error' ? (
            <TouchableOpacity data-testid="connect-vest-btn" style={s.connectBtn} onPress={connectVest}>
              <Ionicons name="bluetooth" size={18} color="#FFF" />
              <Text style={s.connectBtnT}>Connecter le gilet</Text>
            </TouchableOpacity>
          ) : status === 'connected' ? (
            <TouchableOpacity data-testid="disconnect-vest-btn" style={[s.connectBtn, { backgroundColor: Colors.destructive }]} onPress={disconnectVest}>
              <Ionicons name="close-circle" size={18} color="#FFF" />
              <Text style={s.connectBtnT}>Deconnecter</Text>
            </TouchableOpacity>
          ) : (
            <ActivityIndicator color={statusColor} style={{ marginTop: 12 }} />
          )}
        </View>

        {/* SOS Alert */}
        {sosTriggered && (
          <View style={s.sosCard} data-testid="sos-alert">
            <Ionicons name="warning" size={24} color="#FFF" />
            <Text style={s.sosText}>ALERTE SOS DECLENCHEE</Text>
          </View>
        )}

        {/* Latest Data */}
        {lastData && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Dernieres donnees</Text>
            <View style={s.dataGrid}>
              {lastData.type === 1 && <>
                <DataItem label="Batterie" value={`${lastData.bat || 0}%`} icon="battery-half" />
                <DataItem label="Pas" value={`${lastData.step || 0}`} icon="footsteps" />
                <DataItem label="Position" value={lastData.no >= 20 ? 'Gilet' : 'Ceinture'} icon="body" />
                <DataItem label="Signal" value={`${lastData.csq || 0}/30`} icon="cellular" />
              </>}
              {lastData.type === 3 && <>
                <DataItem label="Accel X" value={`${lastData.accx || 0}`} icon="speedometer" />
                <DataItem label="Accel Y" value={`${lastData.accy || 0}`} icon="speedometer" />
                <DataItem label="Accel Z" value={`${lastData.accz || 0}`} icon="speedometer" />
                <DataItem label="Gyro X" value={`${lastData.gyrox || 0}`} icon="compass" />
                <DataItem label="Gyro Y" value={`${lastData.gyroy || 0}`} icon="compass" />
                <DataItem label="Gyro Z" value={`${lastData.gyroz || 0}`} icon="compass" />
                <DataItem label="Roll" value={`${lastData.roll || 0}`} icon="sync" />
              </>}
              {lastData.type === 2 && <>
                <DataItem label="SOS" value={lastData.sos === 1 ? 'ACTIF' : 'Non'} icon="alert-circle" color={lastData.sos === 1 ? Colors.destructive : Colors.success} />
                <DataItem label="Panne" value={lastData.fault === 1 ? 'OUI' : 'Non'} icon="construct" color={lastData.fault === 1 ? '#FF9800' : Colors.success} />
              </>}
            </View>
          </View>
        )}

        {/* BLE Info */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Protocole BLE</Text>
          <Text style={s.infoText}>Service: 0000ffe0-... / 6e400001-...</Text>
          <Text style={s.infoText}>Donnees: Accelerometre, Gyroscope, SOS, Batterie</Text>
          <Text style={s.infoText}>Format: @&key=value&...&#</Text>
          {Platform.OS === 'web' && !('bluetooth' in navigator) && (
            <Text style={[s.infoText, { color: Colors.destructive }]}>Web Bluetooth non disponible. Utilisez Chrome sur ordinateur ou Android.</Text>
          )}
        </View>

        {/* Data Log */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Journal ({dataLog.length})</Text>
          {dataLog.length === 0 && <Text style={s.logEmpty}>Aucune donnee recue</Text>}
          {dataLog.map((log, i) => (
            <Text key={i} style={s.logItem}>{log}</Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DataItem({ label, value, icon, color }: { label: string; value: string; icon: string; color?: string }) {
  return (
    <View style={s.dataItem}>
      <Ionicons name={icon as any} size={16} color={color || Colors.primary} />
      <Text style={s.dataLabel}>{label}</Text>
      <Text style={[s.dataValue, color ? { color } : {}]}>{value}</Text>
    </View>
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
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  cardStatus: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  batteryText: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  connectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12, marginTop: 14 },
  connectBtnT: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  sosCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.destructive, borderRadius: 14, padding: 18 },
  sosText: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  dataGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dataItem: { width: '47%', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.paper, borderRadius: 8, padding: 10 },
  dataLabel: { fontSize: 10, color: Colors.textMuted, flex: 1 },
  dataValue: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  infoText: { fontSize: 11, color: Colors.textMuted, marginBottom: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  logEmpty: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', paddingVertical: 10 },
  logItem: { fontSize: 10, color: Colors.textSecondary, marginBottom: 3, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});
