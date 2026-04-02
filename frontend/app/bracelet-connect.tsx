import { Icon, MCIcon } from '../src/components/WebIcon';
import FullScreenLoader from '../src/components/FullScreenLoader';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, PermissionsAndroid } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { Colors } from '../src/constants/colors';
import { useTheme } from '../src/context/ThemeContext';
import { isBleAvailable, getBleManager, bytesToBase64, base64ToBytes } from '../src/services/ble';
import { useBraceletBLE } from '../src/context/BraceletBLEContext';

// BLE UUIDs extracted from J-Style 2208A SDK APK
const BLE_SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
const BLE_NOTIFY_UUID = '0000fff7-0000-1000-8000-00805f9b34fb';
const BLE_WRITE_UUID = '0000fff6-0000-1000-8000-00805f9b34fb';

// V6 BLE Standard GATT Services
const V6_SERVICES = {
  heart_rate: { uuid: '0000180d-0000-1000-8000-00805f9b34fb', char: '00002a37-0000-1000-8000-00805f9b34fb' },
  blood_pressure: { uuid: '00001810-0000-1000-8000-00805f9b34fb', char: '00002a35-0000-1000-8000-00805f9b34fb' },
  spo2: { uuid: '00001822-0000-1000-8000-00805f9b34fb', char: '00002a5e-0000-1000-8000-00805f9b34fb' },
  temperature: { uuid: '00001809-0000-1000-8000-00805f9b34fb', char: '00002a1c-0000-1000-8000-00805f9b34fb' },
  battery: { uuid: '0000180f-0000-1000-8000-00805f9b34fb', char: '00002a19-0000-1000-8000-00805f9b34fb' },
  ppg: { uuid: '0000ffe0-0000-1000-8000-00805f9b34fb', char_data: '0000ffe1-0000-1000-8000-00805f9b34fb', char_ctrl: '0000ffe2-0000-1000-8000-00805f9b34fb' },
  ecg: { uuid: '0000fff0-0000-1000-8000-00805f9b34fb', char_data: '0000fff1-0000-1000-8000-00805f9b34fb', char_ctrl: '0000fff2-0000-1000-8000-00805f9b34fb' },
};

const V6_NAME_PREFIXES: string[] = []; // Not used — auto-detect by services

// V8 Name prefixes for detection
const V8_NAME_PREFIXES = ['V8', 'JCV8', 'Elio-V8', 'HB8', '2301'];

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
  const { colors: themeColors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const braceletBLE = useBraceletBLE();
  const [bleStatus, setBleStatus] = useState<'idle'|'scanning'|'connecting'|'connected'>('idle');
  const [device, setDevice] = useState<any>(null);
  const [braceletData, setBraceletData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [vitals, setVitals] = useState({ battery: 0, heart_rate: 0, spo2: 0, temperature: 0, steps: 0, systolic: 0, diastolic: 0, stress: 0, hrv: 0 });
  const writeCharRef = useRef<any>(null);
  const pollRef = useRef<any>(null);
  const [braceletModel, setBraceletModel] = useState<'2208a'|'v6'|'v8'|null>(null);

  const [errorMsg, setErrorMsg] = useState('');
  // V8-specific state
  const [v8Vitals, setV8Vitals] = useState({ blood_glucose: 0, ecg_hr: 0, ecg_hrv: 0, ecg_breath_rate: 0, ecg_stress: 0, ecg_mood: 0, ecg_systolic: 0, ecg_diastolic: 0, ecg_vascular_aging: 0, vo2max: 0, vo2max_level: '' });
  const [v8Measuring, setV8Measuring] = useState<string|null>(null);

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

  const sendV6ToBackend = useCallback(async (dataType: string, data: Record<string, any>) => {
    try {
      await apiFetch('/api/bracelet/v6/push', { method: 'POST', body: JSON.stringify({ data_type: dataType, data, device_id: device?.id || device?.name || '', source: 'ble' }) }, token);
    } catch {}
  }, [token, device]);

  const sendV8ToBackend = useCallback(async (dataType: string, data: Record<string, any>) => {
    try {
      await apiFetch('/api/bracelet/v8/push', { method: 'POST', body: JSON.stringify({ data_type: dataType, data, device_id: device?.id || device?.name || 'v8-ble', source: 'ble' }) }, token);
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
        const allServices = [
          BLE_SERVICE_UUID, 'generic_access', 'heart_rate', 'battery_service',
          '0000ffe0-0000-1000-8000-00805f9b34fb', '0000fee7-0000-1000-8000-00805f9b34fb',
          '0000ffc0-0000-1000-8000-00805f9b34fb', '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
          '0000180d-0000-1000-8000-00805f9b34fb', '0000180f-0000-1000-8000-00805f9b34fb',
          '0000180a-0000-1000-8000-00805f9b34fb', '00001809-0000-1000-8000-00805f9b34fb',
          '00001810-0000-1000-8000-00805f9b34fb', '00001822-0000-1000-8000-00805f9b34fb',
        ];
        const bd = await nav.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: allServices,
        });
        setDevice(bd);
        setBleStatus('connecting');
        // Store device globally for ECG page
        if (typeof window !== 'undefined') (window as any).__bleBraceletDevice = bd;
        // Store in global BLE context for cross-page sharing
        braceletBLE.setConnection(bd, null, null);

        // Auto-detect device type by trying standard GATT health services first
        bd.addEventListener('gattserverdisconnected', () => { setBleStatus('idle'); if (pollRef.current) clearInterval(pollRef.current); });
        const server = await bd.gatt.connect();

        // Try standard GATT health services (V6 / modern bracelets)
        let hasStandardServices = false;
        setErrorMsg('Detection des services...');

        const subscribeToService = async (serviceUuid: string, charUuid: string, dataType: string) => {
          try {
            const svc = await server.getPrimaryService(serviceUuid);
            const char = await svc.getCharacteristic(charUuid);
            if (char.properties.notify || char.properties.indicate) {
              await char.startNotifications();
              char.addEventListener('characteristicvaluechanged', (event: any) => {
                const dv = event.target.value as DataView;
                const bytes = new Uint8Array(dv.buffer);
                let parsed: any = {};

                if (dataType === 'heart_rate') {
                  const flags = bytes[0];
                  parsed.heart_rate = (flags & 0x01) ? (bytes[1] | (bytes[2] << 8)) : bytes[1];
                  if ((flags >> 4) & 0x01) {
                    const rrOffset = (flags & 0x01) ? 3 : 2;
                    const rrs: number[] = [];
                    for (let i = rrOffset; i + 1 < bytes.length; i += 2) {
                      rrs.push(Math.round((bytes[i] | (bytes[i+1] << 8)) / 1024 * 1000));
                    }
                    parsed.rr_intervals = rrs;
                    if (rrs.length >= 2) {
                      const diffs = rrs.slice(1).map((v, i) => Math.abs(v - rrs[i]));
                      parsed.hrv = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
                    }
                  }
                  if (parsed.heart_rate > 0 && parsed.heart_rate < 255) setVitals(v => ({ ...v, heart_rate: parsed.heart_rate, hrv: parsed.hrv || v.hrv }));
                } else if (dataType === 'spo2') {
                  parsed.spo2 = Math.round((bytes[0] | (bytes[1] << 8)) / 10);
                  if (parsed.spo2 > 0) setVitals(v => ({ ...v, spo2: parsed.spo2 }));
                } else if (dataType === 'temperature') {
                  const mantissa = bytes[1] | (bytes[2] << 8) | (bytes[3] << 16);
                  parsed.temperature = Math.round(mantissa * Math.pow(10, new Int8Array([bytes[4]])[0]) * 10) / 10;
                  if (parsed.temperature > 30) setVitals(v => ({ ...v, temperature: parsed.temperature }));
                } else if (dataType === 'blood_pressure') {
                  parsed.systolic = Math.round((bytes[1] | (bytes[2] << 8)) / 10);
                  parsed.diastolic = Math.round((bytes[3] | (bytes[4] << 8)) / 10);
                  if (parsed.systolic > 0) setVitals(v => ({ ...v, systolic: parsed.systolic, diastolic: parsed.diastolic }));
                } else if (dataType === 'battery') {
                  parsed.battery = bytes[0];
                  if (parsed.battery > 0) setVitals(v => ({ ...v, battery: parsed.battery }));
                }

                sendV6ToBackend(dataType, parsed);
              });
              return true;
            }
          } catch (e) {
            // Service not available
          }
          return false;
        };

        // Try Heart Rate service — if available, it's a standard GATT device
        const hrOk = await subscribeToService(V6_SERVICES.heart_rate.uuid, V6_SERVICES.heart_rate.char, 'heart_rate');
        if (hrOk) {
          hasStandardServices = true;
          setBraceletModel('v6');
          // Store in global BLE context
          braceletBLE.setConnection(bd, null, 'v6');
          // Subscribe to other standard services
          await subscribeToService(V6_SERVICES.spo2.uuid, V6_SERVICES.spo2.char, 'spo2');
          await subscribeToService(V6_SERVICES.temperature.uuid, V6_SERVICES.temperature.char, 'temperature');
          await subscribeToService(V6_SERVICES.blood_pressure.uuid, V6_SERVICES.blood_pressure.char, 'blood_pressure');
          await subscribeToService(V6_SERVICES.battery.uuid, V6_SERVICES.battery.char, 'battery');

          // Try PPG custom service
          try {
            const ppgSvc = await server.getPrimaryService(V6_SERVICES.ppg.uuid);
            const ppgData = await ppgSvc.getCharacteristic(V6_SERVICES.ppg.char_data);
            if (ppgData.properties.notify) {
              await ppgData.startNotifications();
              ppgData.addEventListener('characteristicvaluechanged', (event: any) => {
                const dv = event.target.value as DataView;
                const samples: number[] = [];
                for (let i = 0; i < dv.byteLength; i += 2) {
                  if (i + 1 < dv.byteLength) samples.push(dv.getUint16(i, true));
                }
                sendV6ToBackend('ppg', { samples, timestamp: new Date().toISOString() });
              });
            }
          } catch {}

          setBleStatus('connected');
          setErrorMsg('');
        }

        if (!hasStandardServices) {
          // Fallback: 2208A proprietary protocol
          setBraceletModel('2208a');
          let notifyChar: any = null, wChar: any = null;
          for (const uuid of [BLE_SERVICE_UUID, '0000ffe0-0000-1000-8000-00805f9b34fb', '0000ffc0-0000-1000-8000-00805f9b34fb', '6e400001-b5a3-f393-e0a9-e50e24dcca9e', '0000180d-0000-1000-8000-00805f9b34fb']) {
            try { const svc = await server.getPrimaryService(uuid); const chars = await svc.getCharacteristics(); for (const c of chars) { if ((c.properties.notify || c.properties.indicate) && !notifyChar) notifyChar = c; if ((c.properties.write || c.properties.writeWithoutResponse) && !wChar) wChar = c; } if (notifyChar) break; } catch {}
          }
          if (notifyChar) { await notifyChar.startNotifications(); notifyChar.addEventListener('characteristicvaluechanged', handleBleData); writeCharRef.current = wChar; setBleStatus('connected'); setErrorMsg(''); braceletBLE.setConnection(bd, wChar, '2208a'); startPolling(); }
          else { setErrorMsg('Aucun service BLE compatible'); setBleStatus('idle'); }
        }
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

  // ══ V8 Simulation ══
  const [simulating, setSimulating] = useState(false);
  const simRef = useRef<any>(null);
  const startSimulation = async (model: 'v6' | 'v8' = 'v8') => {
    setSimulating(true);
    setBraceletModel(model);
    setBleStatus('connected');
    setErrorMsg('');
    // Store simulated connection in context
    braceletBLE.setConnection({ gatt: { connected: true }, id: `sim-${model}` }, null, model);
    const push = async () => {
      const hr = 62 + Math.round(Math.random() * 20);
      const hrv = 30 + Math.round(Math.random() * 25);
      const spo2Val = 95 + Math.round(Math.random() * 4);
      const temp = +(36.2 + Math.random() * 0.8).toFixed(1);
      const stepsVal = 3000 + Math.round(Math.random() * 5000);
      const bat = 70 + Math.round(Math.random() * 25);
      const sys = 110 + Math.round(Math.random() * 20);
      const dia = 68 + Math.round(Math.random() * 12);
      const stress = 20 + Math.round(Math.random() * 30);
      setVitals({ battery: bat, heart_rate: hr, spo2: spo2Val, temperature: temp, steps: stepsVal, systolic: sys, diastolic: dia, stress, hrv });
      const pushFn = model === 'v8' ? sendV8ToBackend : sendV6ToBackend;
      try {
        await pushFn('heart_rate', { heart_rate: hr, hrv, rr_intervals: [800 + Math.round(Math.random()*100)] });
        await pushFn('spo2', { spo2: spo2Val });
        await pushFn('temperature', { temperature: temp, axillary_temperature: +(temp - 0.3).toFixed(1) });
        await pushFn('steps', { steps: stepsVal, calories: Math.round(stepsVal * 0.04), distance: Math.round(stepsVal * 0.7) });
        await pushFn('blood_pressure', { systolic: sys, diastolic: dia });
      } catch {}
      if (model === 'v8') {
        const glucose_mgdl = 85 + Math.round(Math.random() * 30);
        const ecg_breath = 14 + Math.round(Math.random() * 6);
        const ecg_mood = 60 + Math.round(Math.random() * 35);
        const ecg_vasc = 38 + Math.round(Math.random() * 12);
        setV8Vitals({ blood_glucose: glucose_mgdl, ecg_hr: hr, ecg_hrv: hrv, ecg_breath_rate: ecg_breath, ecg_stress: stress, ecg_mood, ecg_systolic: sys, ecg_diastolic: dia, ecg_vascular_aging: ecg_vasc, vo2max: 0, vo2max_level: '' });
        try {
          await sendV8ToBackend('blood_glucose', { blood_glucose_mmol: +(glucose_mgdl / 18).toFixed(1), blood_glucose_mgdl: glucose_mgdl, glucose_progress: 100 });
          await sendV8ToBackend('ecg_result', { ecg_hr: hr, ecg_hrv: hrv, ecg_breath_rate: ecg_breath, ecg_stress: stress, ecg_mood, ecg_systolic: sys, ecg_diastolic: dia, ecg_vascular_aging: ecg_vasc });
          await sendV8ToBackend('ppg', { samples: Array.from({length: 50}, () => 450 + Math.round(Math.random()*150)), timestamp: new Date().toISOString() });
          const vo2 = await apiFetch('/api/bracelet/v8/vo2max', {}, token);
          if (vo2?.vo2max) setV8Vitals(v => ({ ...v, vo2max: vo2.vo2max, vo2max_level: vo2.level }));
        } catch {}
      }
    };
    await push();
    simRef.current = setInterval(push, 8000);
  };
  const stopSimulation = () => {
    if (simRef.current) clearInterval(simRef.current);
    setSimulating(false);
    setBleStatus('idle');
    setBraceletModel(null);
    setVitals({ battery: 0, heart_rate: 0, spo2: 0, temperature: 0, steps: 0, systolic: 0, diastolic: 0, stress: 0, hrv: 0 });
    braceletBLE.disconnect();
  };

  const unpairBracelet = async () => {
    try {
      if (device?.gatt?.connected) device.gatt.disconnect();
      if (pollRef.current) clearInterval(pollRef.current);
      braceletBLE.disconnect();
      await apiFetch('/api/bracelet/unpair', { method: 'POST' }, token);
      setBraceletData(null);
      setVitals({ battery: 0, heart_rate: 0, spo2: 0, temperature: 0, steps: 0, systolic: 0, diastolic: 0, stress: 0, hrv: 0 });
      setBleStatus('idle');
      setDevice(null);
    } catch {}
  };

  if (loading) return <FullScreenLoader />;

  const stColor = isActive || bleStatus === 'connected' ? Colors.success : Colors.textMuted;

  // NOT PAIRED
  if (!isPaired && bleStatus !== 'connecting' && bleStatus !== 'scanning' && bleStatus !== 'connected') return (
    <SafeAreaView style={[s.safe, { backgroundColor: themeColors.background }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => { try { router.back(); } catch { if (Platform.OS === 'web') window.location.href = '/'; } }} style={s.backBtn}><Icon name="chevron-back" size={22} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={s.topTitle}>Bracelet Elio</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={s.center}>
        {errorMsg ? (
          <View style={{ backgroundColor: '#FFE0E0', padding: 16, borderRadius: 12, marginBottom: 20, width: '100%' }}>
            <Text style={{ fontSize: 13, color: Colors.destructive, fontWeight: '600' }}>{errorMsg}</Text>
          </View>
        ) : null}
        <Icon name="watch-outline" size={80} color={Colors.textMuted} />
        <Text style={s.emptyTitle}>Aucun bracelet connecte</Text>
        <Text style={s.emptyDesc}>Connectez votre bracelet Elio via Bluetooth pour suivre vos constantes de sante.</Text>
        <TouchableOpacity style={s.pairBtn} onPress={connectBracelet}>
          <Icon name="bluetooth" size={20} color="#111827" /><Text style={s.pairBtnT}>Appairer le bracelet</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => startSimulation('v8')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)', backgroundColor: 'rgba(167,139,250,0.08)', marginTop: 14 }}>
          <Icon name="pulse" size={18} color="#A78BFA" /><Text style={{ color: '#A78BFA', fontSize: 14, fontWeight: '600' }}>Demo V8 (ECG + Glycemie + PPG)</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => startSimulation('v6')} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 28, borderRadius: 14, marginTop: 8 }}>
          <Text style={{ color: 'rgba(167,139,250,0.5)', fontSize: 12, fontWeight: '600' }}>Demo V6 (basique)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // SCANNING/CONNECTING
  if (bleStatus === 'scanning' || bleStatus === 'connecting') return (
    <SafeAreaView style={[s.safe, { backgroundColor: themeColors.background }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => { try { router.back(); } catch { if (Platform.OS === 'web') window.location.href = '/'; } }} style={s.backBtn}><Icon name="chevron-back" size={22} color={Colors.textPrimary} /></TouchableOpacity>
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
  const isV8 = braceletModel === 'v8';
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: themeColors.background }]}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => { try { router.back(); } catch { if (Platform.OS === 'web') window.location.href = '/'; } }} style={s.backBtn}><Icon name="chevron-back" size={22} color={Colors.textPrimary} /></TouchableOpacity>
        <Text style={s.topTitle}>Bracelet Elio {isV8 ? 'V8' : braceletModel === 'v6' ? 'V6' : ''}</Text>
        <View style={[s.dot, { backgroundColor: stColor }]} />
      </View>
      <ScrollView contentContainerStyle={s.sc} showsVerticalScrollIndicator={false}>
        {/* Status */}
        <View style={[s.card, { backgroundColor: cardBg, borderColor: stColor, borderWidth: 1.5 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Icon name="watch" size={32} color={stColor} />
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>Bracelet Elio {isV8 ? 'V8' : braceletModel === 'v6' ? 'V6' : ''}</Text>
              <Text style={[s.cardStatus, { color: stColor }]}>{isActive || bleStatus === 'connected' ? 'Actif' : 'Eteint'}{isV8 ? ' — ECG + PPG + Glycemie' : braceletModel === 'v6' ? ' — PPG + HRV' : ''}</Text>
            </View>
            {vitals.battery > 0 && <View style={{ alignItems: 'center' }}>
              <Icon name={vitals.battery > 50 ? "battery-full" : vitals.battery > 20 ? "battery-half" : "battery-dead"} size={24} color={vitals.battery > 20 ? Colors.success : Colors.destructive} />
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
            <VitalCard icon="thermometer" label="Temp." value={vitals.temperature || '-'} unit="C" color="#FB8C00" />
            <VitalCard icon="footsteps" label="Pas" value={vitals.steps || '-'} unit="" color={Colors.success} />
            {vitals.hrv > 0 && <VitalCard icon="pulse" label="HRV" value={vitals.hrv} unit="ms" color="#A78BFA" />}
            {vitals.spo2 > 0 && <VitalCard icon="water" label="SpO2" value={vitals.spo2} unit="%" color="#38BDF8" />}
            {vitals.systolic > 0 && <VitalCard icon="pulse" label="Tension" value={`${vitals.systolic}/${vitals.diastolic}`} unit="mmHg" color="#8B5CF6" />}
          </View>
        </View>

        {/* ══ V8-SPECIFIC: Blood Glucose ══ */}
        {isV8 && v8Vitals.blood_glucose > 0 && (
          <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: '#F59E0B' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <MCIcon name="water" size={20} color="#F59E0B" />
              <Text style={s.sectionTitle}>Glycemie estimee (PPG)</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
              <Text style={{ fontSize: 36, fontWeight: '900', color: v8Vitals.blood_glucose > 140 ? Colors.destructive : v8Vitals.blood_glucose < 70 ? '#F59E0B' : Colors.success }}>{v8Vitals.blood_glucose}</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.textMuted, paddingBottom: 6 }}>mg/dL</Text>
            </View>
            <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 4 }}>
              {v8Vitals.blood_glucose > 140 ? 'Elevee — consultez votre medecin' : v8Vitals.blood_glucose < 70 ? 'Basse — prenez une collation' : 'Normale'}
            </Text>
          </View>
        )}

        {/* ══ V8-SPECIFIC: ECG Results ══ */}
        {isV8 && v8Vitals.ecg_hr > 0 && (
          <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: '#EF4444' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <MCIcon name="heart-pulse" size={20} color="#EF4444" />
              <Text style={s.sectionTitle}>Analyse ECG</Text>
            </View>
            <View style={s.vitalsGrid}>
              <VitalCard icon="heart" label="FC ECG" value={v8Vitals.ecg_hr} unit="bpm" color="#EF4444" />
              <VitalCard icon="pulse" label="HRV ECG" value={v8Vitals.ecg_hrv} unit="ms" color="#A78BFA" />
              <VitalCard icon="cloud" label="Respir." value={v8Vitals.ecg_breath_rate} unit="/min" color="#38BDF8" />
              <VitalCard icon="flash" label="Stress" value={v8Vitals.ecg_stress} unit="%" color="#F59E0B" />
              <VitalCard icon="happy" label="Humeur" value={v8Vitals.ecg_mood} unit="%" color={Colors.success} />
              <VitalCard icon="body" label="Age vasc." value={v8Vitals.ecg_vascular_aging} unit="ans" color="#8B5CF6" />
            </View>
            {v8Vitals.ecg_systolic > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' }}>
                <MCIcon name="stethoscope" size={16} color="#8B5CF6" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.textPrimary }}>Tension ECG: {v8Vitals.ecg_systolic}/{v8Vitals.ecg_diastolic} mmHg</Text>
              </View>
            )}
          </View>
        )}

        {/* ══ V8-SPECIFIC: VO2max ══ */}
        {isV8 && v8Vitals.vo2max > 0 && (
          <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: Colors.success }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <MCIcon name="run-fast" size={20} color={Colors.success} />
              <Text style={s.sectionTitle}>VO2max</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
              <Text style={{ fontSize: 36, fontWeight: '900', color: Colors.success }}>{v8Vitals.vo2max}</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.textMuted, paddingBottom: 6 }}>mL/kg/min</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: v8Vitals.vo2max_level === 'excellent' ? '#D1FAE5' : v8Vitals.vo2max_level === 'bon' ? '#E0F2FE' : '#FEF3C7' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: v8Vitals.vo2max_level === 'excellent' ? Colors.success : v8Vitals.vo2max_level === 'bon' ? '#2563EB' : '#D97706', textTransform: 'capitalize' }}>{v8Vitals.vo2max_level}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Sleep link */}
        <TouchableOpacity style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 10 }]} onPress={() => router.push('/sleep')}>
          <Icon name="moon" size={22} color="#1565C0" />
          <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: Colors.textPrimary }}>Voir le sommeil</Text>
          <Icon name="chevron-forward" size={16} color={Colors.textMuted} />
        </TouchableOpacity>

        {/* Simulation controls */}
        {simulating && (
          <TouchableOpacity onPress={stopSimulation} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, marginBottom: 6, borderRadius: 12, backgroundColor: 'rgba(167,139,250,0.08)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' }}>
            <Icon name="stop-circle" size={16} color="#A78BFA" />
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#A78BFA' }}>Arreter la simulation</Text>
          </TouchableOpacity>
        )}

        {/* Unpair */}
        <TouchableOpacity style={s.unpairBtn} onPress={unpairBracelet}>
          <Icon name="trash-outline" size={16} color={Colors.destructive} />
          <Text style={s.unpairBtnT}>Deconnecter le bracelet</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function VitalCard({ icon, label, value, unit, color }: { icon: string; label: string; value: any; unit: string; color: string }) {
  return (
    <View style={s.vitalCard}>
      <Icon name={icon as any} size={18} color={color} />
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
