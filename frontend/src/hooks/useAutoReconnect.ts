import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { apiFetch, clearApiCache } from '../services/api';

const BLE_SVC = '0000fff0-0000-1000-8000-00805f9b34fb';
const ALL_OPTIONAL_SVCS = [BLE_SVC, 'generic_access', 'heart_rate', 'battery_service', '0000ffe0-0000-1000-8000-00805f9b34fb', '0000ffc0-0000-1000-8000-00805f9b34fb', '0000180d-0000-1000-8000-00805f9b34fb', '0000180f-0000-1000-8000-00805f9b34fb'];

const buildCmd = (cmd: number, payload: number[] = []) => {
  const pkt = [cmd, ...payload, ...new Array(14 - payload.length).fill(0)];
  pkt.push(pkt.reduce((s, b) => s + b, 0) & 0xFF);
  return new Uint8Array(pkt);
};

const parseBraceletResponse = (dv: DataView) => {
  const cmd = dv.getUint8(0);
  const len = dv.byteLength;
  const result: Record<string, any> = { cmd };
  if (cmd === 0x09 && len >= 22) {
    result.steps = dv.getUint8(1) | (dv.getUint8(2) << 8) | (dv.getUint8(3) << 16) | (dv.getUint8(4) << 24);
    const calRaw = dv.getUint8(5) | (dv.getUint8(6) << 8) | (dv.getUint8(7) << 16) | (dv.getUint8(8) << 24);
    result.calories = Math.round(calRaw / 100 * 10) / 10;
    result.distance_m = dv.getUint8(9) | (dv.getUint8(10) << 8) | (dv.getUint8(11) << 16) | (dv.getUint8(12) << 24);
    const hr = dv.getUint8(21);
    if (hr >= 30 && hr <= 200) result.heart_rate = hr;
  } else if (cmd === 0x28 && len >= 8) {
    result.measurement_type = dv.getUint8(1);
    result.heart_rate = dv.getUint8(2);
    result.spo2 = dv.getUint8(3);
    result.hrv = dv.getUint8(4);
    result.stress = dv.getUint8(5);
    result.systolic = dv.getUint8(6);
    result.diastolic = dv.getUint8(7);
    if (len >= 10) result.temperature = (dv.getUint8(8) | (dv.getUint8(9) << 8)) / 10;
  } else if (cmd === 0x0D && len >= 2) {
    result.battery = dv.getUint8(1);
  } else if (cmd === 0x26 && len >= 3) {
    const tRaw = dv.getUint8(1) | (dv.getUint8(2) << 8);
    const wrist = tRaw / 10.0;
    if (wrist >= 28 && wrist <= 38) result.temperature = Math.round((wrist + 3.3) * 10) / 10;
  } else if (cmd === 0x53 && len >= 2) {
    const stages: number[] = [];
    for (let i = 1; i < len; i++) { if (dv.getUint8(i) !== 0xFF) stages.push(dv.getUint8(i)); }
    result.sleep_stages = stages;
  } else if ((cmd === 0x51 || cmd === 0x52) && len >= 8) {
    result.steps = dv.getUint8(1) | (dv.getUint8(2) << 8) | (dv.getUint8(3) << 16);
    result.calories = dv.getUint8(4) | (dv.getUint8(5) << 8);
    result.distance = dv.getUint8(6) | (dv.getUint8(7) << 8);
  } else if ((cmd === 0x54 || cmd === 0x55) && len >= 2) {
    result.heart_rate = dv.getUint8(1);
  } else if (cmd === 0x50 && len >= 4) {
    result.glucose_progress = dv.getUint8(1);
    if (result.glucose_progress >= 100) {
      const raw = dv.getUint8(2) | (dv.getUint8(3) << 8);
      result.blood_glucose_mmol = raw / 10.0;
      result.blood_glucose_mgdl = Math.round(result.blood_glucose_mmol * 18.0);
    }
  }
  return result;
};

/**
 * Auto-reconnects to a previously paired V8 bracelet at app launch.
 * Uses navigator.bluetooth.getDevices() (Chrome 100+) for silent reconnection.
 * Sets up full data monitoring + polling after connection.
 */
export function useAutoReconnect(token: string | null) {
  const attemptedRef = useRef(false);
  const pollRef = useRef<any>(null);
  const fullPollRef = useRef<any>(null);
  const syncRef = useRef<any>(null);

  useEffect(() => {
    if (!token || Platform.OS !== 'web' || attemptedRef.current) return;
    attemptedRef.current = true;

    if (typeof window !== 'undefined' && (window as any).__bleBraceletDevice?.gatt?.connected) return;

    const tryReconnect = async () => {
      try {
        const status = await apiFetch('/api/bracelet/status', {}, token);
        if (!status?.device?.ble_device_id) return;

        const nav = navigator as any;
        if (!nav.bluetooth?.getDevices) return;

        const devices = await nav.bluetooth.getDevices();
        if (!devices || devices.length === 0) return;

        for (const bd of devices) {
          try {
            if (bd.watchAdvertisements) {
              await bd.watchAdvertisements({ signal: AbortSignal.timeout(8000) }).catch(() => {});
            }

            const server = await bd.gatt.connect();
            if (!server) continue;

            if (typeof window !== 'undefined') (window as any).__bleBraceletDevice = bd;

            // Read battery
            try {
              const battSvc = await server.getPrimaryService('battery_service');
              const battChar = await battSvc.getCharacteristic('battery_level');
              const val = await battChar.readValue();
              const bat = val.getUint8(0);
              if (bat > 0) {
                await apiFetch('/api/devices/sync', { method: 'POST', body: JSON.stringify({ device_type: 'bracelet', data: { battery: bat } }) }, token).catch(() => {});
              }
            } catch {}

            // Find notify + write characteristics
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

            const collectedData: Record<string, any> = {};

            if (notifyChar) {
              await notifyChar.startNotifications();
              notifyChar.addEventListener('characteristicvaluechanged', (event: any) => {
                const dv = event.target.value as DataView;
                const parsed = parseBraceletResponse(dv);

                if (parsed.battery && parsed.battery > 0 && parsed.battery <= 100) collectedData.battery = parsed.battery;
                if (parsed.heart_rate && parsed.heart_rate > 0 && parsed.heart_rate < 255) collectedData.heart_rate = parsed.heart_rate;
                if (parsed.spo2 && parsed.spo2 > 0 && parsed.spo2 <= 100) collectedData.spo2 = parsed.spo2;
                if (parsed.temperature && parsed.temperature > 30) collectedData.temperature = parsed.temperature;
                if (parsed.steps && parsed.steps > 0 && parsed.steps < 200000) collectedData.steps = parsed.steps;
                if (parsed.systolic && parsed.systolic > 0) collectedData.blood_pressure = { systolic: parsed.systolic, diastolic: parsed.diastolic || 0 };
                if (parsed.hrv && parsed.hrv > 0) collectedData.hrv = parsed.hrv;
                if (parsed.calories && parsed.calories > 0) collectedData.calories = parsed.calories;
                if (parsed.stress && parsed.stress > 0) collectedData.stress = parsed.stress;

                // Push each reading to backend
                const cmd = parsed.cmd;
                let dataType = 'realtime';
                if (cmd === 0x0D) dataType = 'battery';
                else if (cmd === 0x09 || cmd === 0x51 || cmd === 0x52) dataType = 'steps';
                else if (cmd === 0x28) dataType = 'heart_rate';
                else if (cmd === 0x50) dataType = 'blood_glucose';
                else if (cmd === 0x26) dataType = 'temperature';
                else if (cmd === 0x53) dataType = 'sleep';
                apiFetch('/api/bracelet/v8/push', { method: 'POST', body: JSON.stringify({
                  data_type: dataType, data: parsed, device_id: bd.id || '', source: 'ble',
                }) }, token).catch(() => {});
              });
            }

            if (writeChar) {
              const send = async (cmd: number, payload: number[] = []) => {
                try { await writeChar.writeValue(buildCmd(cmd, payload)); } catch {}
              };

              // Time sync
              const now = new Date();
              await send(0x01, [now.getFullYear() & 0xFF, (now.getFullYear() >> 8) & 0xFF, now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()]);
              setTimeout(() => send(0x0D), 500);           // battery
              setTimeout(() => send(0x52, [0]), 1000);      // today's steps
              setTimeout(() => send(0x55, [0]), 1500);      // today's HR
              setTimeout(() => send(0x28, [2, 1]), 2000);   // continuous HR
              setTimeout(() => send(0x28, [3, 1]), 2500);   // SpO2
              setTimeout(() => send(0x28, [1, 1]), 3000);   // HRV + BP
              setTimeout(() => send(0x09, [1, 1]), 3500);   // realtime mode
              setTimeout(() => send(0x50), 4000);            // glucose
              setTimeout(() => send(0x26), 4500);            // temperature
              setTimeout(() => send(0x53, [0]), 5000);       // sleep

              // Polling every 10s: realtime steps + HR
              pollRef.current = setInterval(() => {
                if (!bd.gatt?.connected) { clearInterval(pollRef.current); return; }
                send(0x09, [1, 1]);
              }, 10000);

              // Full vitals every 30s
              fullPollRef.current = setInterval(() => {
                if (!bd.gatt?.connected) { clearInterval(fullPollRef.current); return; }
                send(0x0D);
                send(0x52, [0]);
                setTimeout(() => send(0x28, [2, 1]), 200);
                setTimeout(() => send(0x28, [3, 1]), 400);
                setTimeout(() => send(0x28, [1, 1]), 600);
                setTimeout(() => send(0x50), 800);
                setTimeout(() => send(0x26), 1000);
              }, 30000);

              // Sync to backend every 60s + check pending commands (vibration)
              syncRef.current = setInterval(async () => {
                if (!bd.gatt?.connected) { clearInterval(syncRef.current); return; }
                if (Object.keys(collectedData).length > 0) {
                  clearApiCache();
                  await apiFetch('/api/devices/sync', { method: 'POST', body: JSON.stringify({ device_type: 'bracelet', data: collectedData }) }, token).catch(() => {});
                }
                try {
                  const cmds = await apiFetch('/api/bracelet/v8/pending-commands', {}, token);
                  if (cmds?.commands && writeChar) {
                    for (const c of cmds.commands) {
                      if (c.ble_cmd === 0x08) await writeChar.writeValue(buildCmd(0x08, c.ble_payload || [1, 3])).catch(() => {});
                    }
                  }
                } catch {}
              }, 60000);
            }

            // Mark connected
            await apiFetch('/api/devices/sync', { method: 'POST', body: JSON.stringify({ device_type: 'bracelet', data: { auto_reconnected: true } }) }, token).catch(() => {});

            // Cleanup on disconnect
            bd.addEventListener('gattserverdisconnected', () => {
              if (pollRef.current) clearInterval(pollRef.current);
              if (fullPollRef.current) clearInterval(fullPollRef.current);
              if (syncRef.current) clearInterval(syncRef.current);
              if (typeof window !== 'undefined') (window as any).__bleBraceletDevice = null;
            });

            break;
          } catch { continue; }
        }
      } catch {}
    };

    const timer = setTimeout(tryReconnect, 3000);
    return () => {
      clearTimeout(timer);
      if (pollRef.current) clearInterval(pollRef.current);
      if (fullPollRef.current) clearInterval(fullPollRef.current);
      if (syncRef.current) clearInterval(syncRef.current);
    };
  }, [token]);
}
