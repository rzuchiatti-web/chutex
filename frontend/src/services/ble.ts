import { Platform } from 'react-native';

let BleManager: any = null;
let bleManagerInstance: any = null;
let bleInitAttempted = false;

function ensureBleManager() {
  if (bleInitAttempted || Platform.OS === 'web') return;
  bleInitAttempted = true;
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
  ensureBleManager();
  return !!bleManagerInstance;
}

export function getBleManager() {
  ensureBleManager();
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

// ─── V6 BRACELET BLE SERVICE (Native via react-native-ble-plx) ───

// V6 GATT service UUIDs
const V6_HEART_RATE_SVC = '0000180d-0000-1000-8000-00805f9b34fb';
const V6_HEART_RATE_CHAR = '00002a37-0000-1000-8000-00805f9b34fb';
const V6_BATTERY_SVC = '0000180f-0000-1000-8000-00805f9b34fb';
const V6_BATTERY_CHAR = '00002a19-0000-1000-8000-00805f9b34fb';
const V6_CUSTOM_PPG_SVC = '0000ffe0-0000-1000-8000-00805f9b34fb';
const V6_CUSTOM_PPG_DATA = '0000ffe1-0000-1000-8000-00805f9b34fb';
const V6_CUSTOM_ECG_SVC = '0000fff0-0000-1000-8000-00805f9b34fb';
const V6_CUSTOM_ECG_DATA = '0000fff1-0000-1000-8000-00805f9b34fb';
const V6_CUSTOM_ECG_CTRL = '0000fff2-0000-1000-8000-00805f9b34fb';

// Known V6 bracelet name patterns
const V6_NAME_PATTERNS = ['v6', 'hb6', 'elio', 'chutex', '2358', 'v8', 'jcv8', 'hb8', '2301'];

export interface BraceletVitals {
  heart_rate?: number;
  spo2?: number;
  hrv?: number;
  temperature?: number;
  steps?: number;
  calories?: number;
  systolic?: number;
  diastolic?: number;
  stress?: number;
  battery?: number;
  rr_intervals?: number[];
}

let braceletConnection: any = null;
let braceletScanSub: any = null;
let braceletMonitorSubs: any[] = [];

function isV6Device(name: string): boolean {
  const n = (name || '').toLowerCase();
  return V6_NAME_PATTERNS.some(p => n.includes(p));
}

export async function scanForBracelet(
  onFound: (device: { id: string; name: string; rssi: number; mac: string }) => void,
  timeoutMs = 20000,
  targetMac?: string
): Promise<void> {
  if (Platform.OS === 'web' || !bleManagerInstance) return;
  stopBraceletScan();

  return new Promise((resolve) => {
    const seen = new Set<string>();
    const normalizedTarget = targetMac?.replace(/[:\-\s]/g, '').toLowerCase();

    braceletScanSub = bleManagerInstance.startDeviceScan(
      null,
      { allowDuplicates: false },
      (error: any, device: any) => {
        if (error) { console.warn('BLE bracelet scan error:', error); return; }
        if (!device) return;
        const name = device.name || device.localName || '';
        const deviceMac = (device.id || '').replace(/[:\-\s]/g, '').toLowerCase();

        // Match by target MAC (from QR code or manual input)
        if (normalizedTarget && deviceMac.includes(normalizedTarget)) {
          if (!seen.has(device.id)) {
            seen.add(device.id);
            onFound({ id: device.id, name: name || 'Bracelet V6', rssi: device.rssi, mac: device.id });
          }
          return;
        }

        // Match by device name patterns
        if (name && isV6Device(name) && !seen.has(device.id)) {
          seen.add(device.id);
          onFound({ id: device.id, name, rssi: device.rssi, mac: device.id });
        }
      }
    );
    setTimeout(() => { stopBraceletScan(); resolve(); }, timeoutMs);
  });
}

export function stopBraceletScan() {
  if (bleManagerInstance) {
    try { bleManagerInstance.stopDeviceScan(); } catch {}
  }
  braceletScanSub = null;
}

export async function connectToBracelet(
  deviceId: string,
  onVitals: (vitals: BraceletVitals) => void
): Promise<{ connected: boolean; name: string; battery: number }> {
  if (!bleManagerInstance) return { connected: false, name: '', battery: 0 };

  try {
    // Stop scanning before connecting
    stopBraceletScan();

    const device = await bleManagerInstance.connectToDevice(deviceId, { timeout: 15000 });
    braceletConnection = device;
    await device.discoverAllServicesAndCharacteristics();

    let battery = 0;
    let deviceName = device.name || device.localName || 'Bracelet V6';

    // Read battery level
    try {
      const battChar = await device.readCharacteristicForService(V6_BATTERY_SVC, V6_BATTERY_CHAR);
      if (battChar?.value) {
        const bytes = base64ToBytes(battChar.value);
        if (bytes.length > 0) battery = bytes[0];
      }
    } catch {}

    // Monitor Heart Rate (standard BLE Heart Rate Measurement)
    try {
      const hrSub = device.monitorCharacteristicForService(V6_HEART_RATE_SVC, V6_HEART_RATE_CHAR, (error: any, char: any) => {
        if (error || !char?.value) return;
        const bytes = base64ToBytes(char.value);
        const vitals: BraceletVitals = {};
        if (bytes.length >= 2) {
          const flags = bytes[0];
          const hr16bit = flags & 0x01;
          const rrPresent = (flags >> 4) & 0x01;
          let offset = 1;
          vitals.heart_rate = hr16bit ? (bytes[offset] | (bytes[offset + 1] << 8)) : bytes[offset];
          offset += hr16bit ? 2 : 1;
          if (rrPresent && offset + 1 < bytes.length) {
            vitals.rr_intervals = [];
            while (offset + 1 < bytes.length) {
              const rr = (bytes[offset] | (bytes[offset + 1] << 8)) / 1024.0 * 1000;
              vitals.rr_intervals.push(Math.round(rr * 10) / 10);
              offset += 2;
            }
            if (vitals.rr_intervals.length >= 2) {
              const diffs = vitals.rr_intervals.slice(1).map((v, i) => Math.abs(v - vitals.rr_intervals![i]));
              vitals.hrv = Math.round(diffs.reduce((s, d) => s + d, 0) / diffs.length * 10) / 10;
            }
          }
        }
        if (vitals.heart_rate && vitals.heart_rate > 0 && vitals.heart_rate < 255) onVitals(vitals);
      });
      braceletMonitorSubs.push(hrSub);
    } catch (e) { console.warn('HR monitor failed:', e); }

    // Monitor custom PPG/ECG service for extended data (SpO2, temperature, BP, steps)
    const customSvcs = [V6_CUSTOM_ECG_SVC, V6_CUSTOM_PPG_SVC];
    for (const svcUuid of customSvcs) {
      try {
        const services = await device.services();
        const svc = services.find((s: any) => s.uuid.toLowerCase() === svcUuid);
        if (!svc) continue;
        const chars = await svc.characteristics();
        for (const char of chars) {
          if (char.isNotifiable || char.isIndicatable) {
            const sub = device.monitorCharacteristicForService(svcUuid, char.uuid, (error: any, c: any) => {
              if (error || !c?.value) return;
              const bytes = base64ToBytes(c.value);
              if (bytes.length < 2) return;
              const vitals = parseV6CustomPacket(bytes);
              if (Object.keys(vitals).length > 0) onVitals(vitals);
            });
            braceletMonitorSubs.push(sub);
          }
          // Try to enable measurements by writing to control characteristics
          if (char.isWritableWithResponse || char.isWritableWithoutResponse) {
            try {
              // Send command to start continuous measurement
              const cmd = buildV6Cmd(0x28, [1, 1]); // Start HR+SpO2+HRV
              await device.writeCharacteristicWithResponseForService(svcUuid, char.uuid, bytesToBase64(Array.from(cmd)));
            } catch {}
          }
        }
      } catch {}
    }

    // Try to send startup commands via ECG control characteristic
    try {
      const now = new Date();
      const timeCmd = buildV6Cmd(0x01, [now.getFullYear() & 0xFF, (now.getFullYear() >> 8) & 0xFF, now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()]);
      await device.writeCharacteristicWithResponseForService(V6_CUSTOM_ECG_SVC, V6_CUSTOM_ECG_CTRL, bytesToBase64(Array.from(timeCmd)));
      setTimeout(async () => {
        try { await device.writeCharacteristicWithResponseForService(V6_CUSTOM_ECG_SVC, V6_CUSTOM_ECG_CTRL, bytesToBase64(Array.from(buildV6Cmd(0x0D)))); } catch {}
      }, 500);
      setTimeout(async () => {
        try { await device.writeCharacteristicWithResponseForService(V6_CUSTOM_ECG_SVC, V6_CUSTOM_ECG_CTRL, bytesToBase64(Array.from(buildV6Cmd(0x28, [1, 1])))); } catch {}
      }, 1000);
      setTimeout(async () => {
        try { await device.writeCharacteristicWithResponseForService(V6_CUSTOM_ECG_SVC, V6_CUSTOM_ECG_CTRL, bytesToBase64(Array.from(buildV6Cmd(0x28, [3, 1])))); } catch {}
      }, 1500);
      setTimeout(async () => {
        try { await device.writeCharacteristicWithResponseForService(V6_CUSTOM_ECG_SVC, V6_CUSTOM_ECG_CTRL, bytesToBase64(Array.from(buildV6Cmd(0x09, [1, 1])))); } catch {}
      }, 2000);
    } catch {}

    return { connected: true, name: deviceName, battery };
  } catch (error) {
    console.error('BLE bracelet connect error:', error);
    return { connected: false, name: '', battery: 0 };
  }
}

function buildV6Cmd(cmd: number, payload: number[] = []): Uint8Array {
  const pkt = [cmd, ...payload, ...new Array(14 - payload.length).fill(0)];
  pkt.push(pkt.reduce((s, b) => s + b, 0) & 0xFF);
  return new Uint8Array(pkt);
}

function parseV6CustomPacket(bytes: Uint8Array): BraceletVitals {
  const vitals: BraceletVitals = {};
  if (bytes.length < 2) return vitals;
  const cmd = bytes[0];

  if (cmd === 0x09 && bytes.length >= 14) {
    // Step data
    vitals.steps = bytes[1] | (bytes[2] << 8) | (bytes[3] << 16) | (bytes[4] << 24);
    vitals.calories = ((bytes[5] | (bytes[6] << 8) | (bytes[7] << 16) | (bytes[8] << 24)) / 100);
    if (bytes[13] > 0 && bytes[13] < 255) vitals.heart_rate = bytes[13];
  } else if (cmd === 0x28 && bytes.length >= 10) {
    // Health measurement
    if (bytes[2] > 0 && bytes[2] < 255) vitals.heart_rate = bytes[2];
    if (bytes[3] > 0 && bytes[3] <= 100) vitals.spo2 = bytes[3];
    if (bytes[4] > 0) vitals.hrv = bytes[4];
    if (bytes[5] > 0) vitals.stress = bytes[5];
    if (bytes[6] > 0) vitals.systolic = bytes[6];
    if (bytes[7] > 0) vitals.diastolic = bytes[7];
    const temp = (bytes[8] | (bytes[9] << 8)) / 10;
    if (temp > 30 && temp < 45) vitals.temperature = temp;
  } else if (cmd === 0x0D && bytes.length >= 2) {
    // Battery
    if (bytes[1] > 0 && bytes[1] <= 100) vitals.battery = bytes[1];
  }
  return vitals;
}

export async function disconnectBracelet() {
  for (const sub of braceletMonitorSubs) {
    try { sub.remove(); } catch {}
  }
  braceletMonitorSubs = [];
  if (braceletConnection) {
    try { await braceletConnection.cancelConnection(); } catch {}
    braceletConnection = null;
  }
}

export function isBraceletConnected(): boolean {
  return !!braceletConnection;
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

// Accumulator for BLE data across multiple packets
let _accWeight = 0;
let _accImpedance = 0;
let _accStable = false;

export async function scanForScales(onFound: (device: { id: string; name: string; rssi: number }) => void, timeoutMs = 15000): Promise<void> {
  // Web Bluetooth support
  if (Platform.OS === 'web') {
    if (!navigator.bluetooth) return;
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'Lefu' }, { namePrefix: 'LF_' }, { namePrefix: 'LF-' },
          { namePrefix: 'CF5' }, { namePrefix: 'CF6' }, { namePrefix: 'CF8' },
          { namePrefix: 'QN-' }, { namePrefix: 'Scale' }, { namePrefix: 'Adore' },
          { namePrefix: 'Health' }, { namePrefix: 'Pura' }, { namePrefix: 'Body' },
        ],
        optionalServices: [SCALE_SERVICE_UUID, ALT_SERVICE_UUID, '0000181d-0000-1000-8000-00805f9b34fb'],
      });
      if (device) {
        (window as any).__bleScaleDevice = device;
        onFound({ id: device.id, name: device.name || 'Balance', rssi: -50 });
      }
    } catch (e) {
      console.warn('Web BLE scan cancelled or failed:', e);
    }
    return;
  }
  
  if (!bleManagerInstance) return;
  
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
  // Web Bluetooth support
  if (Platform.OS === 'web') {
    try {
      // On web, deviceId is actually the device object stored from scan
      const webDevice = (window as any).__bleScaleDevice;
      if (!webDevice) return false;
      const server = await webDevice.gatt.connect();
      deviceConnection = webDevice;
      
      // Try known scale services
      const serviceUuids = [SCALE_SERVICE_UUID, ALT_SERVICE_UUID, '0000181d-0000-1000-8000-00805f9b34fb'];
      for (const svcUuid of serviceUuids) {
        try {
          const service = await server.getPrimaryService(svcUuid);
          const chars = await service.getCharacteristics();
          for (const char of chars) {
            if (char.properties.notify || char.properties.indicate) {
              await char.startNotifications();
              char.addEventListener('characteristicvaluechanged', (event: any) => {
                const value = event.target.value;
                const bytes = new Uint8Array(value.buffer);
                if (bytes.length < 2) return;
                const imp = extractImpedanceFromPacket(bytes);
                if (imp > 0) _accImpedance = imp;
                if (bytes.length >= 4) {
                  const m = parseScaleData(bytes, deviceId, webDevice.name || 'Scale', deviceId);
                  if (m) {
                    if (m.weight >= 20) _accWeight = m.weight;
                    if (m.impedance > 0) _accImpedance = m.impedance;
                    if (m.stable) _accStable = true;
                    onMeasurement({ ...m, weight: _accWeight || m.weight, impedance: _accImpedance, stable: _accStable && _accWeight >= 20 });
                  }
                }
              });
              return true;
            }
          }
        } catch { /* try next service */ }
      }
      return false;
    } catch (e) {
      console.error('Web BLE connect error:', e);
      return false;
    }
  }

  if (!bleManagerInstance) return false;
  
  // Reset accumulator
  _accWeight = 0;
  _accImpedance = 0;
  _accStable = false;
  
  try {
    const device = await bleManagerInstance.connectToDevice(deviceId, { timeout: 10000 });
    deviceConnection = device;
    await device.discoverAllServicesAndCharacteristics();
    
    const services = await device.services();
    let monitorStarted = false;
    const devName = device.name || device.localName || 'Scale';
    
    for (const svc of services) {
      const chars = await svc.characteristics();
      for (const char of chars) {
        if (char.isNotifiable || char.isIndicatable) {
          try {
            device.monitorCharacteristicForService(svc.uuid, char.uuid, (error: any, characteristic: any) => {
              if (error || !characteristic?.value) return;
              const bytes = base64ToBytes(characteristic.value);
              if (bytes.length < 2) return;
              
              // Try to extract impedance from any packet
              const imp = extractImpedanceFromPacket(bytes);
              if (imp > 0) _accImpedance = imp;
              
              // Try to extract weight
              if (bytes.length >= 4) {
                const measurement = parseScaleData(bytes, deviceId, devName, deviceId);
                if (measurement) {
                  // Update accumulated weight
                  if (measurement.weight >= 20) _accWeight = measurement.weight;
                  if (measurement.impedance > 0) _accImpedance = measurement.impedance;
                  if (measurement.stable) _accStable = true;
                  
                  // Always emit with best known data
                  onMeasurement({
                    ...measurement,
                    weight: _accWeight || measurement.weight,
                    impedance: _accImpedance,
                    stable: _accStable && _accWeight >= 20,
                  });
                }
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

// Extract impedance value from BLE packet (Lefu sends impedance in separate notifications)
function extractImpedanceFromPacket(bytes: Uint8Array): number {
  if (bytes.length < 2) return 0;
  
  // Pattern 1: Impedance-only packet (short, 2-6 bytes, value 100-2000 ohms)
  if (bytes.length >= 2 && bytes.length <= 6) {
    const val = (bytes[0] << 8) | bytes[1];
    if (val >= 100 && val <= 2000) return val;
    // Little-endian try
    const valLE = (bytes[1] << 8) | bytes[0];
    if (valLE >= 100 && valLE <= 2000) return valLE;
  }
  
  // Pattern 2: Impedance in bytes 17-18 of a longer packet (after weight data)
  if (bytes.length >= 19) {
    const val = (bytes[17] << 8) | bytes[18];
    if (val >= 100 && val <= 2000) return val;
  }
  
  // Pattern 3: Lefu body composition packet - scan for impedance-range values
  // after the weight bytes (typically position 6+ in extended packets)
  if (bytes.length >= 8) {
    for (let i = 4; i <= bytes.length - 2; i++) {
      const val = (bytes[i] << 8) | bytes[i + 1];
      if (val >= 150 && val <= 1500) {
        // Validate it's likely impedance (not a weight value)
        const asWeight = val / 100;
        if (asWeight < 10 || asWeight > 200) return val; // Not a plausible weight
      }
    }
  }
  
  return 0;
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



// ─── LEFU SCALE WiFi CONFIGURATION ───

/**
 * Configure WiFi on a Lefu scale via BLE.
 * Protocol: connect → discover services → write WiFi config command to FFF2
 * Command format (Lefu proprietary): 
 *   [0xA5] [LEN] [0x20] [SSID_LEN] [SSID_BYTES] [PASS_LEN] [PASS_BYTES] [SERVER_URL_BYTES] [CHECKSUM]
 */
export async function configureScaleWifi(
  deviceId: string,
  ssid: string,
  password: string,
  serverUrl: string,
  onProgress: (step: string) => void
): Promise<{ success: boolean; error?: string }> {
  if (Platform.OS === 'web' || !bleManagerInstance) {
    return { success: false, error: 'La configuration WiFi nécessite l\'app mobile avec Bluetooth.' };
  }

  try {
    onProgress('Connexion à la balance...');
    const device = await bleManagerInstance.connectToDevice(deviceId, { timeout: 10000 });
    await device.discoverAllServicesAndCharacteristics();

    onProgress('Envoi de la configuration WiFi...');

    // Build WiFi config packet
    const encoder = new TextEncoder();
    const ssidBytes = encoder.encode(ssid);
    const passBytes = encoder.encode(password);
    const urlBytes = encoder.encode(serverUrl);

    // Lefu WiFi config command: header(0xA5) + cmd(0x20) + ssid + password + server url
    const packet = new Uint8Array(4 + ssidBytes.length + 1 + passBytes.length + 1 + urlBytes.length + 1);
    let offset = 0;
    packet[offset++] = 0xA5; // header
    packet[offset++] = packet.length - 2; // length
    packet[offset++] = 0x20; // WiFi config command
    packet[offset++] = ssidBytes.length;
    packet.set(ssidBytes, offset); offset += ssidBytes.length;
    packet[offset++] = passBytes.length;
    packet.set(passBytes, offset); offset += passBytes.length;
    packet[offset++] = urlBytes.length;
    packet.set(urlBytes, offset); offset += urlBytes.length;

    // Calculate checksum (XOR of all bytes)
    let checksum = 0;
    for (let i = 0; i < offset; i++) checksum ^= packet[i];
    packet[offset] = checksum;

    // Convert to base64 for BLE write
    const base64Data = btoa(String.fromCharCode(...packet));

    // Try primary service first, then alternative
    const serviceUuids = [SCALE_SERVICE_UUID, ALT_SERVICE_UUID];
    const writeUuids = [SCALE_WRITE_UUID, '0000ffe2-0000-1000-8000-00805f9b34fb'];

    let written = false;
    for (let si = 0; si < serviceUuids.length && !written; si++) {
      try {
        await device.writeCharacteristicWithResponseForService(
          serviceUuids[si], writeUuids[si], base64Data
        );
        written = true;
      } catch {
        // Try without response
        try {
          await device.writeCharacteristicWithoutResponseForService(
            serviceUuids[si], writeUuids[si], base64Data
          );
          written = true;
        } catch { /* try next */ }
      }
    }

    if (!written) {
      // Fallback: try all writable characteristics
      const services = await device.services();
      for (const svc of services) {
        const chars = await svc.characteristics();
        for (const char of chars) {
          if (char.isWritableWithResponse || char.isWritableWithoutResponse) {
            try {
              if (char.isWritableWithResponse) {
                await device.writeCharacteristicWithResponseForService(svc.uuid, char.uuid, base64Data);
              } else {
                await device.writeCharacteristicWithoutResponseForService(svc.uuid, char.uuid, base64Data);
              }
              written = true;
              break;
            } catch { /* continue */ }
          }
        }
        if (written) break;
      }
    }

    // Wait for scale to process
    onProgress('La balance se connecte au WiFi...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Disconnect
    try { await device.cancelConnection(); } catch {}

    if (written) {
      onProgress('Configuration terminée !');
      return { success: true };
    } else {
      return { success: false, error: 'Impossible d\'écrire la configuration WiFi sur la balance.' };
    }
  } catch (error: any) {
    return { success: false, error: error?.message || 'Erreur de connexion Bluetooth' };
  }
}
