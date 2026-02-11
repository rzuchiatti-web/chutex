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
  const [status, setStatus] = useState<'idle'|'scanning'|'connecting'|'connected'|'error'>('idle');
  const [device, setDevice] = useState<any>(null);
  const [battery, setBattery] = useState(0);
  const [dataLog, setDataLog] = useState<string[]>([]);
  const [sosTriggered, setSosTriggered] = useState(false);

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
          new Notification('CHUTEX - Chute detectee !', { body: 'Une chute a ete detectee par le gilet. Les gardiens sont alertes.' });
        }
      }
    } catch (e: any) {
      addLog(`Erreur envoi: ${e.message}`);
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

  // Request notification permission on mount
  useEffect(() => {
    if (Platform.OS === 'web' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const connectVest = async () => {
    if (Platform.OS !== 'web' || !('bluetooth' in navigator)) {
      Alert.alert('Bluetooth', 'Ouvrez l\'app dans Chrome (Android) ou Bluefy (iPhone) pour connecter le gilet.');
      return;
    }
    setStatus('scanning');
    addLog('Recherche du gilet...');
    try {
      const nav = navigator as any;
      const bleDevice = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: BLE_SERVICES.map(s => s.uuid),
      });
      setDevice(bleDevice);
      addLog(`Gilet trouve: ${bleDevice.name || bleDevice.id}`);
      setStatus('connecting');

      bleDevice.addEventListener('gattserverdisconnected', () => {
        setStatus('idle');
        addLog('Gilet deconnecte');
      });

      const server = await bleDevice.gatt.connect();
      addLog('Connecte');

      let subscribed = false;
      for (const svc of BLE_SERVICES) {
        try {
          const service = await server.getPrimaryService(svc.uuid);
          const notifyChar = await service.getCharacteristic(svc.notify);
          await notifyChar.startNotifications();
          notifyChar.addEventListener('characteristicvaluechanged', handleBleData);
          subscribed = true;
          addLog('En ecoute des donnees...');

          if (svc.write) {
            try {
              const writeChar = await service.getCharacteristic(svc.write);
              const now = new Date();
              const timeStr = `time&${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}-${String(now.getSeconds()).padStart(2,'0')}`;
              await writeChar.writeValue(new TextEncoder().encode(timeStr));
              addLog('Heure synchronisee');
            } catch {}
          }
          break;
        } catch { continue; }
      }
      if (subscribed) {
        setStatus('connected');
        addLog('Gilet connecte et pret !');
      } else {
        setStatus('error');
        addLog('Service BLE non trouve');
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
    if (device?.gatt?.connected) device.gatt.disconnect();
    setStatus('idle');
    setDevice(null);
    addLog('Deconnecte');
  };

  const stColor = status === 'connected' ? Colors.success : status === 'error' ? Colors.destructive : status === 'scanning' || status === 'connecting' ? '#FF9800' : Colors.textMuted;
  const stText = { idle: 'Non connecte', scanning: 'Recherche...', connecting: 'Connexion...', connected: 'Connecte', error: 'Erreur' }[status];

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
        {/* Connection Card */}
        <View style={[s.card, { borderColor: stColor, borderWidth: 1.5 }]}>
          <View style={s.cardRow}>
            <Ionicons name="shield-checkmark" size={32} color={stColor} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.cardTitle}>{device?.name || 'Gilet Anti-Chute'}</Text>
              <Text style={[s.cardStatus, { color: stColor }]}>{stText}</Text>
            </View>
            {status === 'connected' && (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name={battery > 50 ? "battery-full" : battery > 20 ? "battery-half" : "battery-dead"} size={28} color={battery > 20 ? Colors.success : Colors.destructive} />
                <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.textPrimary }}>{battery}%</Text>
              </View>
            )}
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
            <ActivityIndicator color={stColor} style={{ marginTop: 12 }} />
          )}
        </View>

        {/* SOS Alert Banner */}
        {sosTriggered && (
          <View style={s.sosCard} data-testid="sos-alert">
            <Ionicons name="warning" size={24} color="#FFF" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.sosTitle}>CHUTE DETECTEE</Text>
              <Text style={s.sosDesc}>Les gardiens et le plateau d'ecoute ont ete alertes automatiquement.</Text>
            </View>
          </View>
        )}

        {/* Status Info */}
        {status === 'connected' && (
          <View style={s.card}>
            <View style={s.infoRow}>
              <Ionicons name="bluetooth" size={18} color={Colors.success} />
              <Text style={s.infoLabel}>Connectivite</Text>
              <Text style={[s.infoValue, { color: Colors.success }]}>Connecte</Text>
            </View>
            <View style={s.divider} />
            <View style={s.infoRow}>
              <Ionicons name="battery-half" size={18} color={battery > 20 ? Colors.success : Colors.destructive} />
              <Text style={s.infoLabel}>Batterie</Text>
              <Text style={[s.infoValue, { color: battery > 20 ? Colors.textPrimary : Colors.destructive }]}>{battery}%</Text>
            </View>
          </View>
        )}

        {/* Journal */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Journal</Text>
          {dataLog.length === 0 && <Text style={s.logEmpty}>En attente de connexion...</Text>}
          {dataLog.map((log, i) => (
            <Text key={i} style={[s.logItem, log.includes('CHUTE') || log.includes('SOS') ? { color: Colors.destructive, fontWeight: '700' } : {}]}>{log}</Text>
          ))}
        </View>
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
  cardStatus: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  connectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12, marginTop: 14 },
  connectBtnT: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  sosCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.destructive, borderRadius: 14, padding: 16 },
  sosTitle: { color: '#FFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  sosDesc: { color: '#FFF', fontSize: 12, marginTop: 2, opacity: 0.9 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  infoLabel: { flex: 1, fontSize: 14, color: Colors.textSecondary },
  infoValue: { fontSize: 16, fontWeight: '700' },
  divider: { height: 1, backgroundColor: Colors.border },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  logEmpty: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: 12 },
  logItem: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});
