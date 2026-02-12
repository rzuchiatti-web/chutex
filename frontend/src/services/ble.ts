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
