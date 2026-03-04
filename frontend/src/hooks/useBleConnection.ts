import { useState } from 'react';
import { Platform } from 'react-native';
import { apiFetch } from '../services/api';
import { DEVICE_META } from '../components/devices/constants';

/* ── BLE helpers ── */
const readBatteryLevel = async (server: any): Promise<number> => {
  try {
    const battSvc = await server.getPrimaryService('battery_service');
    const battChar = await battSvc.getCharacteristic('battery_level');
    const val = await battChar.readValue();
    return val.getUint8(0);
  } catch { return 0; }
};

const parseBraceletResponse = (dv: DataView) => {
  const cmd = dv.getUint8(0);
  const result: Record<string, any> = { cmd };
  if (cmd === 0x09) {
    result.steps = dv.getUint8(1) | (dv.getUint8(2) << 8) | (dv.getUint8(3) << 16) | (dv.getUint8(4) << 24);
    result.calories = ((dv.getUint8(5) | (dv.getUint8(6) << 8) | (dv.getUint8(7) << 16) | (dv.getUint8(8) << 24)) / 100);
    result.heart_rate = dv.getUint8(13);
  } else if (cmd === 0x28) {
    result.heart_rate = dv.getUint8(2);
    result.spo2 = dv.getUint8(3);
    result.hrv = dv.getUint8(4);
    result.stress = dv.getUint8(5);
    result.systolic = dv.getUint8(6);
    result.diastolic = dv.getUint8(7);
    result.temperature = (dv.getUint8(8) | (dv.getUint8(9) << 8)) / 10;
  } else if (cmd === 0x0D) {
    result.battery = dv.getUint8(1);
  }
  return result;
};

const buildBraceletCmd = (cmd: number, payload: number[] = []) => {
  const pkt = [cmd, ...payload, ...new Array(14 - payload.length).fill(0)];
  pkt.push(pkt.reduce((s, b) => s + b, 0) & 0xFF);
  return new Uint8Array(pkt);
};

export function useBleConnection(token: string, fetchDevices: () => Promise<void>) {
  const [pairingDevice, setPairingDevice] = useState<string | null>(null);
  const [pairingStep, setPairingStep] = useState(0);
  const [bleStatus, setBleStatus] = useState<'idle' | 'scanning' | 'connected' | 'error'>('idle');
  const [bleError, setBleError] = useState('');
  const [bleVitals, setBleVitals] = useState<any>({});

  const startPairing = (dt: string) => {
    setPairingDevice(dt);
    setPairingStep(0);
    setBleStatus('idle');
    setBleError('');
  };

  const closePairing = () => {
    setPairingDevice(null);
    setPairingStep(0);
    setBleStatus('idle');
    setBleError('');
  };

  /* ── Real BLE scan: Web Bluetooth OR native bridge ── */
  const launchBleScan = async (deviceType: string) => {
    setBleStatus('scanning');
    setBleError('');

    const hasWebBle = Platform.OS === 'web' && 'bluetooth' in navigator;
    const hasNativeBridge = typeof (window as any).ReactNativeWebView?.postMessage === 'function';

    if (!hasWebBle && !hasNativeBridge) {
      setBleStatus('error');
      setBleError('Bluetooth non disponible. Verifiez que le Bluetooth est active sur votre appareil.');
      return;
    }

    // ── Native WebView bridge ──
    if (hasNativeBridge) {
      setBleError('Recherche de votre appareil...');
      const handler = async (e: any) => {
        window.removeEventListener('ble_result', handler);
        const detail = e.detail || {};
        if (detail.error) {
          setBleStatus('error');
          setBleError(detail.error);
        } else if (detail.success) {
          await apiFetch('/api/devices/associate', { method: 'POST', body: JSON.stringify({ device_type: deviceType, mac_address: detail.id || '' }) }, token).catch(() => {});
          const syncData: any = {};
          if (detail.battery) syncData.battery = detail.battery;
          await apiFetch('/api/devices/sync', { method: 'POST', body: JSON.stringify({ device_type: deviceType, data: syncData }) }, token).catch(() => {});
          setBleStatus('connected');
          setBleError('');
          setBleVitals({ name: detail.name || DEVICE_META[deviceType].name, id: detail.id || '', battery: detail.battery || 0 });
          fetchDevices();
        }
      };
      window.addEventListener('ble_result', handler);
      (window as any).ReactNativeWebView.postMessage(JSON.stringify({ action: `ble_scan_${deviceType}` }));
      setTimeout(() => { window.removeEventListener('ble_result', handler); }, 25000);
      return;
    }

    // ── Web Bluetooth (Chrome) ──
    try {
      const nav = navigator as any;
      const BLE_SVC = '0000fff0-0000-1000-8000-00805f9b34fb';
      const VEST_SVCS = ['0000ffe0-0000-1000-8000-00805f9b34fb', '6e400001-b5a3-f393-e0a9-e50e24dcca9e'];
      const opts = deviceType === 'bracelet'
        ? [BLE_SVC, 'generic_access', 'heart_rate', 'battery_service', '0000ffe0-0000-1000-8000-00805f9b34fb', '0000ffc0-0000-1000-8000-00805f9b34fb', '6e400001-b5a3-f393-e0a9-e50e24dcca9e', '0000180d-0000-1000-8000-00805f9b34fb', '0000180f-0000-1000-8000-00805f9b34fb']
        : VEST_SVCS;
      const bd = await nav.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: opts });
      setBleError(`Connexion a ${bd.name || 'appareil'}...`);
      const server = await bd.gatt.connect();

      const battery = await readBatteryLevel(server);
      const collectedData: Record<string, any> = { battery };

      if (deviceType === 'bracelet') {
        let notifyChar: any = null, writeChar: any = null;
        for (const uuid of [BLE_SVC, '0000ffe0-0000-1000-8000-00805f9b34fb', '0000ffc0-0000-1000-8000-00805f9b34fb']) {
          try {
            const svc = await server.getPrimaryService(uuid);
            const chars = await svc.getCharacteristics();
            for (const c of chars) {
              if ((c.properties.notify || c.properties.indicate) && !notifyChar) notifyChar = c;
              if ((c.properties.write || c.properties.writeWithoutResponse) && !writeChar) writeChar = c;
            }
            if (notifyChar) break;
          } catch {}
        }
        if (notifyChar) {
          await notifyChar.startNotifications();
          notifyChar.addEventListener('characteristicvaluechanged', (event: any) => {
            const parsed = parseBraceletResponse(event.target.value);
            if (parsed.battery && parsed.battery > 0) { collectedData.battery = parsed.battery; setBleVitals((prev: any) => ({ ...prev, battery: parsed.battery })); }
            if (parsed.heart_rate && parsed.heart_rate > 0 && parsed.heart_rate < 255) collectedData.heart_rate = parsed.heart_rate;
            if (parsed.spo2 && parsed.spo2 > 0) collectedData.spo2 = parsed.spo2;
            if (parsed.temperature && parsed.temperature > 30) collectedData.temperature = parsed.temperature;
            if (parsed.steps) collectedData.steps = parsed.steps;
            if (parsed.systolic) { collectedData.blood_pressure = { systolic: parsed.systolic, diastolic: parsed.diastolic || 0 }; }
            if (parsed.stress) collectedData.stress_level = parsed.stress;
            if (parsed.hrv) collectedData.hrv = parsed.hrv;
            if (parsed.calories) collectedData.calories = parsed.calories;
            apiFetch('/api/bracelet/push', { method: 'POST', body: JSON.stringify({ parsed, raw_hex: '', device_id: bd.id || '' }) }, token).catch(() => {});
          });
          if (writeChar) {
            const send = async (cmd: number, payload: number[] = []) => { try { await writeChar.writeValue(buildBraceletCmd(cmd, payload)); } catch {} };
            const now = new Date();
            await send(0x01, [now.getFullYear() & 0xFF, (now.getFullYear() >> 8) & 0xFF, now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()]);
            setTimeout(() => send(0x0D), 500);
            setTimeout(() => send(0x52, [0]), 1000);
            setTimeout(() => send(0x28, [1, 1]), 1500);
            setTimeout(() => send(0x28, [3, 1]), 2000);
            setTimeout(() => send(0x09, [1, 1]), 2500);
          }
        }
      } else {
        // Vest: parse text-based protocol @&key=value&...#
        let vestBuffer = '';
        const parseVestPacket = (raw: string) => {
          const data: Record<string, any> = {};
          let cleaned = raw.trim();
          if (cleaned.startsWith('@')) cleaned = cleaned.substring(1);
          if (cleaned.endsWith('#')) cleaned = cleaned.slice(0, -1);
          cleaned.split('&').forEach(part => {
            if (part.includes('=')) {
              const [key, val] = part.split('=', 2);
              if (!key) return;
              if (['bat', 'csq', 'step', 'no', 'sos', 'fault', 'type', 'mod', 'firstflag', 'secondflag', 'lac', 'cid', 'accx', 'accy', 'accz', 'gyrox', 'gyroy', 'gyroz', 'roll'].includes(key)) {
                data[key] = parseInt(val) || 0;
              } else if (['latt', 'lng'].includes(key)) {
                data[key] = parseFloat(val) || 0;
              } else {
                data[key] = val;
              }
            }
          });
          return data;
        };

        for (const uuid of VEST_SVCS) {
          try {
            const svc = await server.getPrimaryService(uuid);
            const chars = await svc.getCharacteristics();
            for (const c of chars) {
              if (c.properties.notify || c.properties.indicate) {
                await c.startNotifications();
                c.addEventListener('characteristicvaluechanged', (event: any) => {
                  const dv = event.target.value;
                  let text = '';
                  for (let i = 0; i < dv.byteLength; i++) text += String.fromCharCode(dv.getUint8(i));
                  vestBuffer += text;
                  while (vestBuffer.includes('@') && vestBuffer.includes('#')) {
                    const start = vestBuffer.indexOf('@');
                    const end = vestBuffer.indexOf('#', start);
                    if (end === -1) break;
                    const packet = vestBuffer.substring(start, end + 1);
                    vestBuffer = vestBuffer.substring(end + 1);
                    const parsed = parseVestPacket(packet);
                    if (parsed.bat) { collectedData.battery = parsed.bat; setBleVitals((prev: any) => ({ ...prev, battery: parsed.bat })); }
                    apiFetch('/api/vest/push', { method: 'POST', body: JSON.stringify({ raw: packet, parsed, device_id: bd.id || '' }) }, token).then(res => {
                      if (res?.alert === 'sos') setBleError('ALERTE SOS DETECTEE !');
                    }).catch(() => {});
                  }
                });
                break;
              }
            }
            break;
          } catch {}
        }
        try {
          const battSvc = await server.getPrimaryService('battery_service');
          const battChar = await battSvc.getCharacteristic('battery_level');
          const val = await battChar.readValue();
          const bat = val.getUint8(0);
          if (bat > 0) collectedData.battery = bat;
        } catch {}
      }

      // Register + sync with real data
      await apiFetch('/api/devices/associate', { method: 'POST', body: JSON.stringify({ device_type: deviceType, mac_address: bd.id || '' }) }, token);
      await apiFetch('/api/devices/sync', { method: 'POST', body: JSON.stringify({ device_type: deviceType, data: collectedData }) }, token).catch(() => {});
      setBleStatus('connected');
      setBleError('');
      setBleVitals({ name: bd.name || DEVICE_META[deviceType].name, id: bd.id || '', battery });
      fetchDevices();

      // Keep collecting data for 30s after connection
      if (deviceType === 'bracelet') {
        setTimeout(async () => {
          if (Object.keys(collectedData).length > 1) {
            await apiFetch('/api/devices/sync', { method: 'POST', body: JSON.stringify({ device_type: 'bracelet', data: collectedData }) }, token).catch(() => {});
            fetchDevices();
          }
        }, 30000);
      }
    } catch (e: any) {
      if (e.name === 'NotFoundError' || e.message?.includes('cancelled')) {
        setBleStatus('idle');
        setBleError('');
      } else {
        setBleStatus('error');
        setBleError(e.message || 'Erreur Bluetooth');
      }
    }
  };

  /* ── Web Bluetooth Scale (Lefu/QN-Scale) ── */
  const launchScaleWeighing = async () => {
    setBleStatus('scanning');
    setBleError('');
    setPairingDevice('scale');

    const hasWebBle = Platform.OS === 'web' && 'bluetooth' in navigator;
    if (!hasWebBle) {
      setBleStatus('error');
      setBleError('Bluetooth non disponible pour la balance.');
      return;
    }
    try {
      const nav = navigator as any;
      const SCALE_SVCS = ['0000fff0-0000-1000-8000-00805f9b34fb', '0000ffe0-0000-1000-8000-00805f9b34fb'];
      const bd = await nav.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: SCALE_SVCS });
      setBleError(`Connexion a ${bd.name || 'balance'}...`);
      const server = await bd.gatt.connect();

      let weightReceived = false;
      let lastWeight = 0;
      let lastImpedance = 0;

      for (const svcUuid of SCALE_SVCS) {
        try {
          const svc = await server.getPrimaryService(svcUuid);
          const chars = await svc.getCharacteristics();
          for (const c of chars) {
            if (c.properties.notify || c.properties.indicate) {
              await c.startNotifications();
              c.addEventListener('characteristicvaluechanged', (event: any) => {
                const dv = event.target.value as DataView;
                const bytes = new Uint8Array(dv.buffer);
                if (bytes.length < 3) return;
                let weight = 0;
                // Try multiple positions and divisors, pick first in 20-250 range
                const candidates: number[] = [];
                if (bytes.length >= 17) {
                  const raw = (bytes[15] << 8) | bytes[16];
                  candidates.push(raw / 10, raw / 100);
                }
                if (bytes.length >= 5) {
                  const raw = (bytes[3] << 8) | bytes[4];
                  candidates.push(raw / 10, raw / 100);
                }
                if (bytes.length >= 3) {
                  const raw = (bytes[1] << 8) | bytes[2];
                  candidates.push(raw / 10, raw / 100);
                }
                for (const c of candidates) {
                  if (c >= 20 && c <= 250) { weight = Math.round(c * 10) / 10; break; }
                }
                if (weight < 2 || weight > 300) {
                  for (let i = 0; i <= bytes.length - 2; i++) {
                    for (const div of [10, 100]) {
                      const w = ((bytes[i] << 8) | bytes[i + 1]) / div;
                      if (w >= 20 && w <= 250) { weight = Math.round(w * 10) / 10; break; }
                    }
                    if (weight >= 20) break;
                  }
                }
                if (weight >= 2 && weight <= 300) {
                  lastWeight = Math.round(weight * 100) / 100;
                  if (bytes.length >= 19) {
                    const imp = (bytes[17] << 8) | bytes[18];
                    if (imp >= 100 && imp <= 2000) lastImpedance = imp;
                  }
                  weightReceived = true;
                  setBleError(`Poids: ${lastWeight} kg`);
                }
              });
            }
          }
        } catch {}
      }

      await new Promise(r => setTimeout(r, 15000));

      if (weightReceived && lastWeight > 0) {
        const res = await apiFetch('/api/devices/scale/ble-measurement', {
          method: 'POST',
          body: JSON.stringify({ weight: lastWeight, impedance: lastImpedance }),
        }, token);
        await apiFetch('/api/devices/associate', { method: 'POST', body: JSON.stringify({ device_type: 'scale', mac_address: bd.id || '' }) }, token).catch(() => {});
        setBleStatus('connected');
        setBleError('');
        setBleVitals({ name: bd.name || 'Balance Vita', id: bd.id || '', weight: lastWeight, bmi: res?.bmi || 0, body_fat_pct: res?.body_fat_pct || 0 });
        fetchDevices();
      } else {
        setBleStatus('error');
        setBleError('Aucune mesure recue. Montez sur la balance pieds nus.');
      }
      try { bd.gatt.disconnect(); } catch {}
    } catch (e: any) {
      if (e.name === 'NotFoundError' || e.message?.includes('cancelled')) {
        setBleStatus('idle');
        setBleError('');
        setPairingDevice(null);
      } else {
        setBleStatus('error');
        setBleError(e.message || 'Erreur Bluetooth balance');
      }
    }
  };

  return {
    pairingDevice, pairingStep, setPairingStep,
    bleStatus, bleError, bleVitals,
    startPairing, closePairing, launchBleScan, launchScaleWeighing,
  };
}
