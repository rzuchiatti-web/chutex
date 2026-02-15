import { Platform } from 'react-native';

let BleManager: any = null;
let bleManagerInstance: any = null;

// Only import react-native-ble-plx on native
if (Platform.OS !== 'web') {
  try {
    BleManager = require('react-native-ble-plx').BleManager;
    bleManagerInstance = new BleManager();
  } catch (e) {
    console.warn('BLE PLX not available:', e);
  }
}

export function isBleAvailable(): boolean {
  if (Platform.OS === 'web') {
    return 'bluetooth' in navigator;
  }
  return !!bleManagerInstance;
}

export function getBleManager() {
  return bleManagerInstance;
}

// Encode bytes to base64 for react-native-ble-plx
export function bytesToBase64(bytes: number[]): string {
  const binary = String.fromCharCode(...bytes);
  if (Platform.OS === 'web') {
    return btoa(binary);
  }
  // Node-style base64
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  for (let i = 0; i < binary.length; i += 3) {
    const a = binary.charCodeAt(i);
    const b = i + 1 < binary.length ? binary.charCodeAt(i + 1) : 0;
    const c = i + 2 < binary.length ? binary.charCodeAt(i + 2) : 0;
    result += chars[a >> 2] + chars[((a & 3) << 4) | (b >> 4)];
    result += i + 1 < binary.length ? chars[((b & 15) << 2) | (c >> 6)] : '=';
    result += i + 2 < binary.length ? chars[c & 63] : '=';
  }
  return result;
}

// Decode base64 to Uint8Array
export function base64ToBytes(b64: string): Uint8Array {
  if (Platform.OS === 'web') {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes: number[] = [];
  for (let i = 0; i < b64.length; i += 4) {
    const a = chars.indexOf(b64[i]);
    const b = chars.indexOf(b64[i + 1]);
    const c = chars.indexOf(b64[i + 2]);
    const d = chars.indexOf(b64[i + 3]);
    bytes.push((a << 2) | (b >> 4));
    if (c !== -1 && b64[i + 2] !== '=') bytes.push(((b & 15) << 4) | (c >> 2));
    if (d !== -1 && b64[i + 3] !== '=') bytes.push(((c & 3) << 6) | d);
  }
  return new Uint8Array(bytes);
}

// ─── LEFU SCALE BLE SERVICE ───

// Lefu scale BLE service UUIDs (common for Lefu body fat scales)
const SCALE_SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
const SCALE_NOTIFY_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';
const SCALE_WRITE_UUID = '0000fff2-0000-1000-8000-00805f9b34fb';

// Alternative UUIDs used by some Lefu models
const ALT_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const ALT_NOTIFY_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

export interface ScaleMeasurement {
  weight: number;
  impedance: number;
  unit: string; // 'kg' | 'lb'
  stable: boolean;
  deviceId: string;
  deviceName: string;
  mac: string;
}

type ScaleCallback = (measurement: ScaleMeasurement) => void;
let scanSubscription: any = null;
let deviceConnection: any = null;

export async function scanForScales(onFound: (device: { id: string; name: string; rssi: number }) => void, timeoutMs = 15000): Promise<void> {
  if (Platform.OS === 'web' || !bleManagerInstance) return;
  
  stopScaleScan();
  
  return new Promise((resolve) => {
    const seen = new Set<string>();
    
    // Scan ALL devices (no service UUID filter) to catch all Lefu models
    bleManagerInstance.startDeviceScan(
      null,
      { allowDuplicates: false },
      (error: any, device: any) => {
        if (error) { console.warn('BLE scan error:', error); return; }
        if (!device) return;
        const name = (device.name || device.localName || '').toLowerCase();
        if (!name) return;
        // Match Lefu / CF586 / QN-Scale and similar scale names
        if ((name.includes('lefu') || name.includes('lf_') || name.includes('lf-') ||
             name.includes('cf5') || name.includes('cf6') || name.includes('cf8') ||
             name.includes('qn-') || name.includes('qn_') || name.includes('scale') || 
             name.includes('adore') || name.includes('health') || name.includes('buzud') ||
             name.includes('pura') || name.includes('icomon') || name.includes('body')) && !seen.has(device.id)) {
          seen.add(device.id);
          onFound({ id: device.id, name: device.name || device.localName || 'Balance', rssi: device.rssi });
        }
      }
    );
    
    setTimeout(() => { stopScaleScan(); resolve(); }, timeoutMs);
  });
}

export function stopScaleScan() {
  if (bleManagerInstance) {
    try { bleManagerInstance.stopDeviceScan(); } catch {}
  }
}

export async function connectToScale(deviceId: string, onMeasurement: ScaleCallback): Promise<boolean> {
  if (!bleManagerInstance) return false;
  
  try {
    const device = await bleManagerInstance.connectToDevice(deviceId, { timeout: 10000 });
    deviceConnection = device;
    await device.discoverAllServicesAndCharacteristics();
    
    // Discover all services and find the right one for weight data
    const services = await device.services();
    let monitorStarted = false;
    
    for (const svc of services) {
      const chars = await svc.characteristics();
      for (const char of chars) {
        // Monitor any characteristic that supports notifications/indications
        if (char.isNotifiable || char.isIndicatable) {
          try {
            device.monitorCharacteristicForService(svc.uuid, char.uuid, (error: any, characteristic: any) => {
              if (error || !characteristic?.value) return;
              const bytes = base64ToBytes(characteristic.value);
              if (bytes.length >= 4) {
                const measurement = parseScaleData(bytes, deviceId, device.name || device.localName || 'Scale', deviceId);
                if (measurement) onMeasurement(measurement);
              }
            });
            monitorStarted = true;
          } catch {}
        }
      }
    }
    
    return monitorStarted;
  } catch (error) {
    console.error('BLE connect error:', error);
    return false;
  }
}

export async function disconnectScale() {
  if (deviceConnection) {
    try { await deviceConnection.cancelConnection(); } catch {}
    deviceConnection = null;
  }
}

// Parse Lefu/QN-Scale BLE data packets
function parseScaleData(bytes: Uint8Array, deviceId: string, deviceName: string, mac: string): ScaleMeasurement | null {
  if (bytes.length < 4) return null;
  
  let weight = 0;
  let impedance = 0;
  let stable = false;
  let unit = 'kg';
  
  // QN-Scale protocol (CF597, CF586, QN-S500, Kamtron, RENPHO, Yolanda, Lefu)
  // Weight is at bytes 15-16 (big-endian, value / 100 = kg)
  if (bytes.length >= 17) {
    weight = ((bytes[15] << 8) | bytes[16]) / 100;
    // Stability flag is often in byte 0 or byte 1
    stable = (bytes[0] & 0x20) !== 0 || (bytes[0] & 0x10) !== 0;
    // Impedance may follow in subsequent packets (bytes 17-18 if present)
    if (bytes.length >= 19) {
      impedance = (bytes[17] << 8) | bytes[18];
      if (impedance > 2000 || impedance < 100) impedance = 0; // sanity check
    }
  }
  // Fallback: try bytes 3-4 (some models)
  else if (bytes.length >= 5) {
    weight = ((bytes[3] << 8) | bytes[4]) / 100;
    stable = (bytes[0] & 0x20) !== 0;
  }
  // Fallback: try bytes 1-2
  else if (bytes.length >= 3) {
    weight = ((bytes[1] << 8) | bytes[2]) / 100;
    stable = true;
  }
  
  // Weight sanity check (2 - 300 kg range)
  if (weight < 2 || weight > 300) {
    // Try alternative byte positions
    for (let i = 0; i <= bytes.length - 2; i++) {
      const candidate = ((bytes[i] << 8) | bytes[i + 1]) / 100;
      if (candidate >= 20 && candidate <= 250) {
        weight = candidate;
        stable = true;
        break;
      }
    }
    if (weight < 2 || weight > 300) return null;
  }
  
  return { weight: Math.round(weight * 100) / 100, impedance, unit, stable, deviceId, deviceName, mac };
}

