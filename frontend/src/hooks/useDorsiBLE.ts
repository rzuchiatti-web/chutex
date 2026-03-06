import { useState, useRef, useCallback, useEffect } from 'react';

// HeloKine BLE UUIDs from CDC spec
const ANGULAR_SERVICE_UUID = '00001101-0000-1000-8000-00805f9b34fb';
const ANGLE_X_CHAR_UUID = '00002101-0000-1000-8000-00805f9b34fb';
const ANGLE_Y_CHAR_UUID = '00002102-0000-1000-8000-00805f9b34fb';
const ANGLE_Z_CHAR_UUID = '00002103-0000-1000-8000-00805f9b34fb';
const BATTERY_SERVICE_UUID = 0x180F;
const BATTERY_LEVEL_CHAR_UUID = 0x2A19;

export interface DorsiAngles {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export interface DorsiBLEState {
  connected: boolean;
  connecting: boolean;
  deviceName: string;
  battery: number;
  angles: DorsiAngles;
  error: string;
  supported: boolean;
}

export function useDorsiBLE() {
  const [state, setState] = useState<DorsiBLEState>({
    connected: false,
    connecting: false,
    deviceName: '',
    battery: 0,
    angles: { x: 0, y: 0, z: 0, timestamp: 0 },
    error: '',
    supported: typeof navigator !== 'undefined' && 'bluetooth' in navigator,
  });

  const deviceRef = useRef<any>(null);
  const serverRef = useRef<any>(null);
  const charXRef = useRef<any>(null);
  const charYRef = useRef<any>(null);
  const charZRef = useRef<any>(null);
  const anglesRef = useRef<DorsiAngles>({ x: 0, y: 0, z: 0, timestamp: 0 });
  const listenersRef = useRef<Set<(angles: DorsiAngles) => void>>(new Set());

  // Parse BLE characteristic value (UTF-8 string like "45.1")
  const parseAngle = (value: DataView): number => {
    const decoder = new TextDecoder('utf-8');
    const str = decoder.decode(value.buffer);
    return parseFloat(str) || 0;
  };

  // Notify all listeners of angle update
  const notifyListeners = useCallback(() => {
    listenersRef.current.forEach(cb => cb(anglesRef.current));
  }, []);

  // Handle angle X notification
  const handleAngleX = useCallback((event: any) => {
    const val = parseAngle(event.target.value);
    anglesRef.current = { ...anglesRef.current, x: val, timestamp: Date.now() };
    setState(s => ({ ...s, angles: { ...anglesRef.current } }));
    notifyListeners();
  }, [notifyListeners]);

  // Handle angle Y notification
  const handleAngleY = useCallback((event: any) => {
    const val = parseAngle(event.target.value);
    anglesRef.current = { ...anglesRef.current, y: val, timestamp: Date.now() };
    setState(s => ({ ...s, angles: { ...anglesRef.current } }));
    notifyListeners();
  }, [notifyListeners]);

  // Handle angle Z notification
  const handleAngleZ = useCallback((event: any) => {
    const val = parseAngle(event.target.value);
    anglesRef.current = { ...anglesRef.current, z: val, timestamp: Date.now() };
    setState(s => ({ ...s, angles: { ...anglesRef.current } }));
    notifyListeners();
  }, [notifyListeners]);

  // Connect to HeloKine cushion
  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      setState(s => ({ ...s, error: 'Web Bluetooth non supporte par ce navigateur. Utilisez Chrome.' }));
      return false;
    }

    setState(s => ({ ...s, connecting: true, error: '' }));

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'HeloKine' }],
        optionalServices: [ANGULAR_SERVICE_UUID, BATTERY_SERVICE_UUID],
      });

      deviceRef.current = device;
      device.addEventListener('gattserverdisconnected', () => {
        setState(s => ({ ...s, connected: false, deviceName: '' }));
        charXRef.current = null;
        charYRef.current = null;
        charZRef.current = null;
      });

      const server = await device.gatt!.connect();
      serverRef.current = server;

      // Get angular service
      const angularService = await server.getPrimaryService(ANGULAR_SERVICE_UUID);

      // Subscribe to angle characteristics
      const charX = await angularService.getCharacteristic(ANGLE_X_CHAR_UUID);
      charX.addEventListener('characteristicvaluechanged', handleAngleX);
      await charX.startNotifications();
      charXRef.current = charX;

      const charY = await angularService.getCharacteristic(ANGLE_Y_CHAR_UUID);
      charY.addEventListener('characteristicvaluechanged', handleAngleY);
      await charY.startNotifications();
      charYRef.current = charY;

      try {
        const charZ = await angularService.getCharacteristic(ANGLE_Z_CHAR_UUID);
        charZ.addEventListener('characteristicvaluechanged', handleAngleZ);
        await charZ.startNotifications();
        charZRef.current = charZ;
      } catch {
        // Z axis is optional per CDC spec
        console.log('Axe Z non disponible');
      }

      // Read battery
      let battery = 100;
      try {
        const batteryService = await server.getPrimaryService(BATTERY_SERVICE_UUID);
        const batteryChar = await batteryService.getCharacteristic(BATTERY_LEVEL_CHAR_UUID);
        const batteryValue = await batteryChar.readValue();
        battery = batteryValue.getUint8(0);
      } catch {
        console.log('Service batterie non disponible');
      }

      setState(s => ({
        ...s,
        connected: true,
        connecting: false,
        deviceName: device.name || 'HeloKine',
        battery,
        error: '',
      }));

      return true;
    } catch (e: any) {
      const msg = e.message?.includes('cancelled') || e.message?.includes('User cancelled')
        ? '' // User cancelled picker - not an error
        : e.message || 'Erreur de connexion BLE';
      setState(s => ({ ...s, connecting: false, error: msg }));
      return false;
    }
  }, [handleAngleX, handleAngleY, handleAngleZ]);

  // Disconnect
  const disconnect = useCallback(() => {
    try {
      if (charXRef.current) {
        charXRef.current.removeEventListener('characteristicvaluechanged', handleAngleX);
        charXRef.current.stopNotifications().catch(() => {});
      }
      if (charYRef.current) {
        charYRef.current.removeEventListener('characteristicvaluechanged', handleAngleY);
        charYRef.current.stopNotifications().catch(() => {});
      }
      if (charZRef.current) {
        charZRef.current.removeEventListener('characteristicvaluechanged', handleAngleZ);
        charZRef.current.stopNotifications().catch(() => {});
      }
      if (serverRef.current?.connected) {
        serverRef.current.disconnect();
      }
    } catch {}
    deviceRef.current = null;
    serverRef.current = null;
    charXRef.current = null;
    charYRef.current = null;
    charZRef.current = null;
    setState(s => ({ ...s, connected: false, deviceName: '' }));
  }, [handleAngleX, handleAngleY, handleAngleZ]);

  // Subscribe to real-time angle updates (for games)
  const onAngleUpdate = useCallback((cb: (angles: DorsiAngles) => void) => {
    listenersRef.current.add(cb);
    return () => { listenersRef.current.delete(cb); };
  }, []);

  // Tare / zero calibration
  const tare = useCallback(() => {
    // Store current angles as zero reference
    const offset = { ...anglesRef.current };
    return offset;
  }, []);

  // Read current angles once (polling mode)
  const readAngles = useCallback(async (): Promise<DorsiAngles> => {
    if (!charXRef.current || !charYRef.current) {
      return anglesRef.current;
    }
    try {
      const xVal = await charXRef.current.readValue();
      const yVal = await charYRef.current.readValue();
      let z = anglesRef.current.z;
      if (charZRef.current) {
        const zVal = await charZRef.current.readValue();
        z = parseAngle(zVal);
      }
      const angles = { x: parseAngle(xVal), y: parseAngle(yVal), z, timestamp: Date.now() };
      anglesRef.current = angles;
      return angles;
    } catch {
      return anglesRef.current;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { disconnect(); };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    onAngleUpdate,
    tare,
    readAngles,
    anglesRef,
  };
}
