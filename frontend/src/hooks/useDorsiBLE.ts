import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform, Alert } from 'react-native';

// HeloKine BLE UUIDs from CDC spec
const ANGULAR_SERVICE = '00001101-0000-1000-8000-00805f9b34fb';
const ANGLE_X_CHAR = '00002101-0000-1000-8000-00805f9b34fb';
const ANGLE_Y_CHAR = '00002102-0000-1000-8000-00805f9b34fb';
const ANGLE_Z_CHAR = '00002103-0000-1000-8000-00805f9b34fb';
const BATTERY_SERVICE = '0000180f-0000-1000-8000-00805f9b34fb';
const BATTERY_CHAR = '00002a19-0000-1000-8000-00805f9b34fb';

export interface DorsiAngles {
  x: number; y: number; z: number; timestamp: number;
}

export interface DorsiBLEState {
  connected: boolean; connecting: boolean; deviceName: string; battery: number;
  angles: DorsiAngles; error: string; supported: boolean;
}

// ── Native BLE (iOS/Android) via react-native-ble-plx ──
function useNativeBLE() {
  const [state, setState] = useState<DorsiBLEState>({
    connected: false, connecting: false, deviceName: '', battery: 0,
    angles: { x: 0, y: 0, z: 0, timestamp: 0 }, error: '', supported: true,
  });
  const managerRef = useRef<any>(null);
  const deviceRef = useRef<any>(null);
  const anglesRef = useRef<DorsiAngles>({ x: 0, y: 0, z: 0, timestamp: 0 });
  const subsRef = useRef<any[]>([]);

  useEffect(() => {
    let BleManager: any;
    try { BleManager = require('react-native-ble-plx').BleManager; } catch { setState(s => ({ ...s, supported: false })); return; }
    managerRef.current = new BleManager();
    return () => { managerRef.current?.destroy(); };
  }, []);

  const parseAngle = (base64: string): number => {
    try {
      const decoded = typeof atob !== 'undefined' ? atob(base64) : Buffer.from(base64, 'base64').toString('utf8');
      return parseFloat(decoded) || 0;
    } catch { return 0; }
  };

  const connect = useCallback(async () => {
    const mgr = managerRef.current;
    if (!mgr) { setState(s => ({ ...s, error: 'BLE non disponible' })); return false; }
    setState(s => ({ ...s, connecting: true, error: '' }));

    try {
      // Wait for powered on
      const bleState = await mgr.state();
      if (bleState !== 'PoweredOn') {
        await new Promise<void>((resolve) => {
          const sub = mgr.onStateChange((st: string) => { if (st === 'PoweredOn') { sub.remove(); resolve(); } }, true);
          setTimeout(() => { sub.remove(); resolve(); }, 5000);
        });
      }

      // Scan for HeloKine
      return await new Promise<boolean>((resolve) => {
        let found = false;
        mgr.startDeviceScan(null, null, async (error: any, device: any) => {
          if (error) { setState(s => ({ ...s, connecting: false, error: error.message })); resolve(false); return; }
          if (device && device.name && (device.name.startsWith('HeloKine') || device.name.startsWith('HELOKINE') || device.name.startsWith('Helo') || device.name.startsWith('CDC') || device.name.startsWith('Englab') || device.name.startsWith('Dorsi')) && !found) {
            found = true;
            mgr.stopDeviceScan();
            try {
              const connected = await device.connect({ timeout: 10000 });
              await connected.discoverAllServicesAndCharacteristics();
              deviceRef.current = connected;

              // Read battery
              let battery = -1;
              try {
                const battChar = await connected.readCharacteristicForService(BATTERY_SERVICE, BATTERY_CHAR);
                if (battChar.value) {
                  const decoded = typeof atob !== 'undefined' ? atob(battChar.value) : Buffer.from(battChar.value, 'base64').toString('binary');
                  battery = decoded.charCodeAt(0);
                }
              } catch {}

              // Monitor angle characteristics
              const monX = connected.monitorCharacteristicForService(ANGULAR_SERVICE, ANGLE_X_CHAR, (err: any, char: any) => {
                if (char?.value) { anglesRef.current = { ...anglesRef.current, x: parseAngle(char.value), timestamp: Date.now() }; setState(s => ({ ...s, angles: { ...anglesRef.current } })); }
              });
              const monY = connected.monitorCharacteristicForService(ANGULAR_SERVICE, ANGLE_Y_CHAR, (err: any, char: any) => {
                if (char?.value) { anglesRef.current = { ...anglesRef.current, y: parseAngle(char.value), timestamp: Date.now() }; setState(s => ({ ...s, angles: { ...anglesRef.current } })); }
              });
              let monZ: any = null;
              try {
                monZ = connected.monitorCharacteristicForService(ANGULAR_SERVICE, ANGLE_Z_CHAR, (err: any, char: any) => {
                  if (char?.value) { anglesRef.current = { ...anglesRef.current, z: parseAngle(char.value), timestamp: Date.now() }; setState(s => ({ ...s, angles: { ...anglesRef.current } })); }
                });
              } catch {}
              subsRef.current = [monX, monY, monZ].filter(Boolean);

              // Monitor disconnect
              connected.onDisconnected(() => {
                setState(s => ({ ...s, connected: false, deviceName: '' }));
                deviceRef.current = null;
              });

              setState(s => ({ ...s, connected: true, connecting: false, deviceName: device.name || 'HeloKine', battery, error: '' }));
              resolve(true);
            } catch (e: any) {
              setState(s => ({ ...s, connecting: false, error: e.message || 'Connexion echouee' }));
              resolve(false);
            }
          }
        });
        // Timeout scan after 10s
        setTimeout(() => { if (!found) { mgr.stopDeviceScan(); setState(s => ({ ...s, connecting: false, error: 'Coussin HeloKine non trouve. Verifiez qu\'il est allume.' })); resolve(false); } }, 10000);
      });
    } catch (e: any) {
      setState(s => ({ ...s, connecting: false, error: e.message || 'Erreur BLE' }));
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    subsRef.current.forEach(s => { try { s.remove(); } catch {} });
    subsRef.current = [];
    if (deviceRef.current) { try { deviceRef.current.cancelConnection(); } catch {} }
    deviceRef.current = null;
    setState(s => ({ ...s, connected: false, deviceName: '' }));
  }, []);

  const tare = useCallback(() => ({ ...anglesRef.current }), []);
  const onAngleUpdate = useCallback(() => () => {}, []);
  const readAngles = useCallback(async () => anglesRef.current, []);

  useEffect(() => { return () => { disconnect(); }; }, [disconnect]);

  return { ...state, connect, disconnect, onAngleUpdate, tare, readAngles, anglesRef };
}

// ── Web BLE (Chrome desktop) ──
function useWebBLE() {
  const [state, setState] = useState<DorsiBLEState>({
    connected: false, connecting: false, deviceName: '', battery: 0,
    angles: { x: 0, y: 0, z: 0, timestamp: 0 }, error: '',
    supported: typeof navigator !== 'undefined' && 'bluetooth' in navigator,
  });
  const anglesRef = useRef<DorsiAngles>({ x: 0, y: 0, z: 0, timestamp: 0 });
  const serverRef = useRef<any>(null);

  const parseAngle = (value: DataView): number => {
    const decoder = new TextDecoder('utf-8');
    return parseFloat(decoder.decode(value.buffer)) || 0;
  };

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) { setState(s => ({ ...s, error: 'Web Bluetooth non supporte. Utilisez Chrome.' })); return false; }
    setState(s => ({ ...s, connecting: true, error: '' }));
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [ANGULAR_SERVICE, BATTERY_SERVICE]
      });
      device.addEventListener('gattserverdisconnected', () => setState(s => ({ ...s, connected: false, deviceName: '' })));
      const server = await device.gatt!.connect();
      serverRef.current = server;
      const svc = await server.getPrimaryService(ANGULAR_SERVICE);
      const charX = await svc.getCharacteristic(ANGLE_X_CHAR);
      charX.addEventListener('characteristicvaluechanged', (e: any) => { anglesRef.current = { ...anglesRef.current, x: parseAngle(e.target.value), timestamp: Date.now() }; setState(s => ({ ...s, angles: { ...anglesRef.current } })); });
      await charX.startNotifications();
      const charY = await svc.getCharacteristic(ANGLE_Y_CHAR);
      charY.addEventListener('characteristicvaluechanged', (e: any) => { anglesRef.current = { ...anglesRef.current, y: parseAngle(e.target.value), timestamp: Date.now() }; setState(s => ({ ...s, angles: { ...anglesRef.current } })); });
      await charY.startNotifications();
      try { const charZ = await svc.getCharacteristic(ANGLE_Z_CHAR); charZ.addEventListener('characteristicvaluechanged', (e: any) => { anglesRef.current = { ...anglesRef.current, z: parseAngle(e.target.value), timestamp: Date.now() }; setState(s => ({ ...s, angles: { ...anglesRef.current } })); }); await charZ.startNotifications(); } catch {}
      let battery = -1;
      try { const bs = await server.getPrimaryService(BATTERY_SERVICE); const bc = await bs.getCharacteristic(BATTERY_CHAR); const bv = await bc.readValue(); battery = bv.getUint8(0); } catch {}
      setState(s => ({ ...s, connected: true, connecting: false, deviceName: device.name || 'HeloKine', battery, error: '' }));
      return true;
    } catch (e: any) {
      const msg = e.message?.includes('cancelled') ? '' : e.message || 'Erreur BLE';
      setState(s => ({ ...s, connecting: false, error: msg }));
      return false;
    }
  }, []);

  const disconnect = useCallback(() => { if (serverRef.current?.connected) serverRef.current.disconnect(); setState(s => ({ ...s, connected: false })); }, []);
  const tare = useCallback(() => ({ ...anglesRef.current }), []);
  const onAngleUpdate = useCallback(() => () => {}, []);
  const readAngles = useCallback(async () => anglesRef.current, []);

  return { ...state, connect, disconnect, onAngleUpdate, tare, readAngles, anglesRef };
}

// ── Unified hook — picks native or web automatically ──
export function useDorsiBLE() {
  if (Platform.OS === 'web') {
    return useWebBLE();
  }
  return useNativeBLE();
}
