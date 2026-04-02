import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { apiFetch } from '../services/api';

const BLE_SVC = '0000fff0-0000-1000-8000-00805f9b34fb';

const buildCmd = (cmd: number, payload: number[] = []) => {
  const pkt = [cmd, ...payload, ...new Array(14 - payload.length).fill(0)];
  pkt.push(pkt.reduce((s, b) => s + b, 0) & 0xFF);
  return new Uint8Array(pkt);
};

/**
 * Auto-reconnects to a previously paired bracelet at app launch.
 * Uses navigator.bluetooth.getDevices() (Chrome 100+) to find the device
 * without showing a pairing popup.
 */
export function useAutoReconnect(token: string | null) {
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!token || Platform.OS !== 'web' || attemptedRef.current) return;
    attemptedRef.current = true;

    // Already connected?
    if (typeof window !== 'undefined' && (window as any).__bleBraceletDevice?.gatt?.connected) return;

    const tryReconnect = async () => {
      try {
        // Check if bracelet is paired in DB
        const status = await apiFetch('/api/bracelet/status', {}, token);
        if (!status?.paired) return;

        // Check if getDevices is available (Chrome 100+)
        const nav = navigator as any;
        if (!nav.bluetooth?.getDevices) return;

        const devices = await nav.bluetooth.getDevices();
        if (!devices || devices.length === 0) return;

        // Find a bracelet-like device
        for (const bd of devices) {
          try {
            // watchAdvertisements helps Chrome re-discover the device
            if (bd.watchAdvertisements) {
              await bd.watchAdvertisements({ signal: AbortSignal.timeout(5000) }).catch(() => {});
            }
            
            const server = await bd.gatt.connect();
            if (!server) continue;

            // Store globally
            if (typeof window !== 'undefined') (window as any).__bleBraceletDevice = bd;

            // Find write characteristic and send initial commands
            let writeChar: any = null;
            try {
              const svc = await server.getPrimaryService(BLE_SVC);
              const chars = await svc.getCharacteristics();
              for (const c of chars) {
                if (c.properties.notify || c.properties.indicate) {
                  await c.startNotifications().catch(() => {});
                }
                if ((c.properties.write || c.properties.writeWithoutResponse) && !writeChar) {
                  writeChar = c;
                }
              }
            } catch {}

            if (writeChar) {
              const send = async (cmd: number, payload: number[] = []) => {
                try { await writeChar.writeValue(buildCmd(cmd, payload)); } catch {}
              };
              // Time sync + initial data requests
              const now = new Date();
              await send(0x01, [now.getFullYear() & 0xFF, (now.getFullYear() >> 8) & 0xFF, now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()]);
              setTimeout(() => send(0x0D), 500);
              setTimeout(() => send(0x09, [1, 1]), 1000);
            }

            // Sync to backend
            await apiFetch('/api/devices/sync', {
              method: 'POST',
              body: JSON.stringify({ device_type: 'bracelet', data: { auto_reconnected: true } }),
            }, token).catch(() => {});

            // Disconnect listener
            bd.addEventListener('gattserverdisconnected', () => {
              if (typeof window !== 'undefined') (window as any).__bleBraceletDevice = null;
            });

            break; // Connected successfully
          } catch {
            // This device didn't work, try next
          }
        }
      } catch {}
    };

    // Delay to let the app initialize first
    const timer = setTimeout(tryReconnect, 2000);
    return () => clearTimeout(timer);
  }, [token]);
}
