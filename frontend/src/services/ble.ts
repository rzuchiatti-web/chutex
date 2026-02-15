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

// Parse Lefu scale BLE data packets
function parseScaleData(bytes: Uint8Array, deviceId: string, deviceName: string, mac: string): ScaleMeasurement | null {
  if (bytes.length < 4) return null;
  
  // Lefu protocol: various packet formats
  // Common format: [header, flags, weight_high, weight_low, impedance_high, impedance_low, ...]
  const header = bytes[0];
  
  let weight = 0;
  let impedance = 0;
  let stable = false;
  let unit = 'kg';
  
  // Format 1: CF-series scales (header 0xCF or 0xCE)
  if (header === 0xCF || header === 0xCE) {
    const flags = bytes[1];
    stable = (flags & 0x20) !== 0;
    weight = ((bytes[2] << 8) | bytes[3]) / 100; // Weight in 0.01 kg
    if (bytes.length >= 6) {
      impedance = (bytes[4] << 8) | bytes[5];
    }
  }
  // Format 2: Generic BLE scale (header 0x10 or 0xA5)
  else if (header === 0x10 || header === 0xA5) {
    stable = (bytes[1] & 0x01) !== 0;
    weight = ((bytes[2] << 8) | bytes[3]) / 10; // Weight in 0.1 kg
    if (bytes.length >= 8) {
      impedance = (bytes[6] << 8) | bytes[7];
    }
  }
  // Format 3: Try generic 2-byte weight at offset 2-3
  else if (bytes.length >= 4) {
    weight = ((bytes[bytes.length - 4] << 8) | bytes[bytes.length - 3]) / 100;
    if (bytes.length >= 6) {
      impedance = (bytes[bytes.length - 2] << 8) | bytes[bytes.length - 1];
    }
    stable = weight > 0;
  }
  
  // Sanity check
  if (weight < 2 || weight > 300) return null;
  
  return { weight: Math.round(weight * 10) / 10, impedance, unit, stable, deviceId, deviceName, mac };
}

