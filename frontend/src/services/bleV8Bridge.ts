/**
 * BLE V8 Bridge — Native iOS BLE protocol for V8/2208A bracelet.
 * Extracted from _layout.tsx during pre-production audit refactoring.
 * 
 * Handles: command building, binary parsing, device scanning,
 * polling, vibration, and WebView communication.
 */
import { Platform } from 'react-native';

// ── BLE Service/Characteristic UUIDs ──
const SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
const WRITE_UUID   = '0000fff6-0000-1000-8000-00805f9b34fb';
const NOTIFY_UUID  = '0000fff7-0000-1000-8000-00805f9b34fb';

// ── Device name filters ──
export const BLE_NAME_FILTERS = {
  bracelet: ['2208', 'J22', 'JStyle', 'Elio', 'V8', 'JCV8', 'HB8', '2301'],
  scale: ['QN-Scale', 'Lefu', 'CF586', 'Health Scale', 'SWAN', 'BF600'],
  vest: ['Elder', 'AIRBAG', 'Gilet', 'Airbag'],
};

// ── V8 Command codes ──
export const V8_CMD = {
  TIME_SYNC: 0x01,
  VIBRATE: 0x08,
  STEPS: 0x09,
  BATTERY: 0x0D,
  VITALS: 0x28,
  GLUCOSE: 0x50,
  SLEEP: 0x52,
  ECG: 0x53,
} as const;


/** Build a 16-byte command packet for V8/2208A bracelet */
export function buildCmd(cmd: number, payload: number[] = []): string {
  const pkt = [cmd, ...payload, ...new Array(14 - payload.length).fill(0)];
  pkt.push(pkt.reduce((s: number, b: number) => s + b, 0) & 0xFF);
  const bytes = new Uint8Array(pkt);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return typeof btoa !== 'undefined' ? btoa(binary) : '';
}


/** Write a command to the BLE device */
export async function writeToDevice(device: any, cmd: number, payload: number[] = []) {
  try {
    const b64 = buildCmd(cmd, payload);
    await device.writeCharacteristicWithResponseForService(SERVICE_UUID, WRITE_UUID, b64)
      .catch(() => device.writeCharacteristicWithoutResponseForService(SERVICE_UUID, WRITE_UUID, b64));
  } catch {}
}


/** Parse a V8 binary response from the bracelet */
export function parseV8Response(bytes: number[]): { cmd: number; [key: string]: any } | null {
  if (bytes.length < 1) return null;
  const cmd = bytes[0];
  const parsed: any = { cmd };

  if (cmd === V8_CMD.BATTERY && bytes.length >= 2) {
    parsed.battery = bytes[1];
  }
  if (cmd === V8_CMD.STEPS && bytes.length >= 14) {
    parsed.steps = bytes[1] | (bytes[2] << 8) | (bytes[3] << 16) | (bytes[4] << 24);
    parsed.calories = ((bytes[5] | (bytes[6] << 8) | (bytes[7] << 16) | (bytes[8] << 24)) / 100);
    parsed.heart_rate = bytes[13];
  }
  if (cmd === V8_CMD.VITALS && bytes.length >= 10) {
    parsed.heart_rate = bytes[2];
    parsed.spo2 = bytes[3];
    parsed.hrv = bytes[4];
    parsed.stress = bytes[5];
    parsed.systolic = bytes[6];
    parsed.diastolic = bytes[7];
    parsed.temperature = (bytes[8] | (bytes[9] << 8)) / 10;
  }
  if (cmd === V8_CMD.GLUCOSE && bytes.length >= 4 && bytes[1] >= 100) {
    const gRaw = bytes[2] | (bytes[3] << 8);
    parsed.blood_glucose_mgdl = Math.round((gRaw / 10.0) * 18.0);
  }
  if (cmd === V8_CMD.SLEEP && bytes.length >= 3) {
    // 0x52 sleep response: bytes after cmd are per-minute sleep stages
    // 0=awake, 1=deep, 2=light, 3=REM
    const stages: number[] = [];
    for (let i = 1; i < bytes.length - 1; i++) {
      if (bytes[i] <= 3) stages.push(bytes[i]);
    }
    if (stages.length > 0) {
      const total = stages.length;
      const deep = stages.filter(s => s === 1).length;
      const light = stages.filter(s => s === 2).length;
      const rem = stages.filter(s => s === 3).length;
      const awake = stages.filter(s => s === 0).length;
      parsed.sleep_stages = stages;
      parsed.sleep_duration_min = total;
      parsed.deep_sleep_min = deep;
      parsed.light_sleep_min = light;
      parsed.rem_sleep_min = rem;
      parsed.awake_minutes = awake;
      parsed.sleep_quality = total > 0 ? Math.min(100, Math.round((deep * 2 + rem * 1.5 + light) / total * 50)) : 0;
    }
  }
  if (cmd === V8_CMD.ECG && bytes.length >= 6) {
    // 0x53 ECG result: HR, HRV, breath rate, stress, mood, BP
    parsed.ecg_hr = bytes[1];
    parsed.ecg_hrv = bytes[2];
    parsed.ecg_breath_rate = bytes[3];
    parsed.ecg_stress = bytes[4];
    parsed.ecg_mood = bytes[5];
    if (bytes.length >= 8) {
      parsed.ecg_systolic = bytes[6];
      parsed.ecg_diastolic = bytes[7];
    }
  }

  return parsed;
}


/** Decode base64 to byte array */
export function decodeBase64ToBytes(raw: string): number[] {
  try {
    const bin = typeof atob !== 'undefined' ? atob(raw) : '';
    const bytes: number[] = [];
    for (let i = 0; i < bin.length; i++) bytes.push(bin.charCodeAt(i));
    return bytes;
  } catch {
    return [];
  }
}


/** Map V8 command code to data_type string for the API */
export function cmdToDataType(cmd: number): string {
  switch (cmd) {
    case V8_CMD.BATTERY: return 'battery';
    case V8_CMD.STEPS: return 'steps';
    case V8_CMD.VITALS: return 'heart_rate';
    case V8_CMD.GLUCOSE: return 'blood_glucose';
    case V8_CMD.SLEEP: return 'sleep';
    case V8_CMD.ECG: return 'ecg_result';
    default: return 'realtime';
  }
}


/** Inject JavaScript into WebView to push data to backend API */
export function injectPushToBackend(
  webViewRef: any,
  dataType: string,
  dataJson: string,
  deviceId: string
) {
  webViewRef.current?.injectJavaScript(`
    (function(){
      var t = localStorage.getItem('vl_token') || localStorage.getItem('@AsyncStorage:vl_token') || '';
      if(t) fetch('/api/bracelet/v8/push',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify({data_type:'${dataType}',data:${dataJson},device_id:'${deviceId}',source:'ble'})}).catch(function(){});
    })(); true;
  `);
}


/** Inject JavaScript to dispatch BLE data event to WebView */
export function injectBleDataEvent(webViewRef: any, dataJson: string) {
  webViewRef.current?.injectJavaScript(`
    window.dispatchEvent(new CustomEvent('ble_data',{detail:${dataJson}})); true;
  `);
}


/** Send initial commands after connection (time sync + metric requests) */
export async function sendInitialCommands(device: any) {
  const now = new Date();
  await writeToDevice(device, V8_CMD.TIME_SYNC, [
    now.getFullYear() & 0xFF, (now.getFullYear() >> 8) & 0xFF,
    now.getMonth() + 1, now.getDate(),
    now.getHours(), now.getMinutes(), now.getSeconds()
  ]);
  setTimeout(() => writeToDevice(device, V8_CMD.BATTERY), 500);
  setTimeout(() => writeToDevice(device, V8_CMD.SLEEP, [0]), 1000);
  setTimeout(() => writeToDevice(device, V8_CMD.VITALS, [2, 1]), 1500);
  setTimeout(() => writeToDevice(device, V8_CMD.VITALS, [3, 1]), 2000);
  setTimeout(() => writeToDevice(device, V8_CMD.VITALS, [1, 1]), 2500);
  setTimeout(() => writeToDevice(device, V8_CMD.STEPS, [1, 1]), 3000);
  setTimeout(() => writeToDevice(device, V8_CMD.GLUCOSE), 3500);
}


/** Associate device + sync to backend via WebView injection */
export function injectDeviceAssociation(webViewRef: any, deviceId: string) {
  webViewRef.current?.injectJavaScript(`
    (function(){
      var t = localStorage.getItem('vl_token') || localStorage.getItem('@AsyncStorage:vl_token') || '';
      if(t){
        fetch('/api/devices/associate',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify({device_type:'bracelet',mac_address:'${deviceId}'})}).catch(function(){});
        fetch('/api/devices/sync',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify({device_type:'bracelet',data:{connected:true}})}).catch(function(){});
      }
    })(); true;
  `);
}


/** Check for pending vibration commands via WebView injection */
export function injectPendingCommandsCheck(webViewRef: any) {
  webViewRef.current?.injectJavaScript(`
    (function(){
      var t = localStorage.getItem('vl_token') || localStorage.getItem('@AsyncStorage:vl_token') || '';
      if(t) fetch('/api/bracelet/v8/pending-commands',{headers:{'Authorization':'Bearer '+t}}).then(function(r){return r.json()}).then(function(d){
        if(d&&d.commands) d.commands.forEach(function(c){ if(c.ble_cmd===8) window.ReactNativeWebView.postMessage(JSON.stringify({action:'ble_vibrate',payload:c.ble_payload||[1,3]})); });
      }).catch(function(){});
    })(); true;
  `);
}


/** Start monitoring BLE notifications and set up polling */
export function startBleMonitoring(
  device: any,
  webViewRef: React.RefObject<any>,
  blePollRef: React.MutableRefObject<any>,
  bleDeviceRef: React.MutableRefObject<any>,
) {
  // Monitor FFF7 notifications
  try {
    device.monitorCharacteristicForService(SERVICE_UUID, NOTIFY_UUID, (err: any, char: any) => {
      if (err || !char?.value) return;
      const bytes = decodeBase64ToBytes(char.value);
      const parsed = parseV8Response(bytes);
      if (!parsed) return;

      const safeId = (device.id || '').replace(/'/g, '');
      const dataJson = JSON.stringify(parsed).replace(/'/g, '');

      // Dispatch to WebView for UI
      injectBleDataEvent(webViewRef, dataJson);

      // Push to backend
      injectPushToBackend(webViewRef, cmdToDataType(parsed.cmd), dataJson, safeId);
    });
  } catch {}

  // Periodic step polling every 10s
  if (blePollRef.current) clearInterval(blePollRef.current);
  blePollRef.current = setInterval(async () => {
    if (!bleDeviceRef.current) { clearInterval(blePollRef.current); return; }
    try {
      const isConn = await device.isConnected();
      if (!isConn) { clearInterval(blePollRef.current); bleDeviceRef.current = null; return; }
      writeToDevice(device, V8_CMD.STEPS, [1, 1]);
    } catch { clearInterval(blePollRef.current); bleDeviceRef.current = null; }
  }, 10000);

  // Full vitals polling every 30s
  const fullPollId = setInterval(async () => {
    if (!bleDeviceRef.current) { clearInterval(fullPollId); return; }
    try {
      const isConn = await device.isConnected();
      if (!isConn) { clearInterval(fullPollId); return; }
      writeToDevice(device, V8_CMD.BATTERY);
      setTimeout(() => writeToDevice(device, V8_CMD.VITALS, [2, 1]), 200);
      setTimeout(() => writeToDevice(device, V8_CMD.VITALS, [3, 1]), 400);
      setTimeout(() => writeToDevice(device, V8_CMD.VITALS, [1, 1]), 600);
      setTimeout(() => writeToDevice(device, V8_CMD.GLUCOSE), 800);
      injectPendingCommandsCheck(webViewRef);
    } catch { clearInterval(fullPollId); }
  }, 30000);
}


/** Start the full V8 bracelet protocol after BLE connection */
export async function startBraceletProtocol(
  device: any,
  webViewRef: React.RefObject<any>,
  bleDeviceRef: React.MutableRefObject<any>,
  blePollRef: React.MutableRefObject<any>,
) {
  bleDeviceRef.current = device;
  const safeId = (device.id || '').replace(/'/g, '');

  // Start notification monitoring + polling
  startBleMonitoring(device, webViewRef, blePollRef, bleDeviceRef);

  // Send initial commands
  await sendInitialCommands(device);

  // Associate device after initial commands settle
  setTimeout(() => injectDeviceAssociation(webViewRef, safeId), 4000);
}


/** Scan for a BLE device and connect */
export function scanAndConnect(
  manager: any,
  deviceType: 'bracelet' | 'scale' | 'vest',
  webViewRef: React.RefObject<any>,
  bleDeviceRef: React.MutableRefObject<any>,
  blePollRef: React.MutableRefObject<any>,
) {
  let found = false;
  const nameFilter = BLE_NAME_FILTERS[deviceType];
  const isBracelet = deviceType === 'bracelet';

  const startScan = () => {
    manager.startDeviceScan(null, null, async (error: any, device: any) => {
      if (error) {
        webViewRef.current?.injectJavaScript(
          `window.dispatchEvent(new CustomEvent('ble_result',{detail:{error:'${error.message?.replace(/'/g, '')}'}}));true;`
        );
        return;
      }
      if (!device) return;
      const name = device.name || device.localName || '';
      if (nameFilter.some((f: string) => name.includes(f))) {
        if (found) return;
        found = true;
        manager.stopDeviceScan();
        try {
          const connected = await device.connect();
          await connected.discoverAllServicesAndCharacteristics();
          webViewRef.current?.injectJavaScript(
            `window.dispatchEvent(new CustomEvent('ble_result',{detail:{success:true,name:'${name.replace(/'/g, '')}',id:'${(device.id || '').replace(/'/g, '')}'}}));true;`
          );
          if (isBracelet) {
            await startBraceletProtocol(connected, webViewRef, bleDeviceRef, blePollRef);
          }
        } catch (e: any) {
          webViewRef.current?.injectJavaScript(
            `window.dispatchEvent(new CustomEvent('ble_result',{detail:{error:'Connexion echouee: ${(e.message || '').replace(/'/g, '')}'}}));true;`
          );
        }
      }
    });
    // Timeout after 20s
    setTimeout(() => {
      if (!found) {
        manager.stopDeviceScan();
        webViewRef.current?.injectJavaScript(
          `window.dispatchEvent(new CustomEvent('ble_result',{detail:{error:'Appareil non trouve. Verifiez qu\\'il est allume et a proximite.'}}));true;`
        );
      }
    }, 20000);
  };

  // Wait for Bluetooth to be powered on
  const sub = manager.onStateChange((state: string) => {
    if (state === 'PoweredOn') { sub.remove(); startScan(); }
  }, true);

  // Fallback if state is already PoweredOn
  setTimeout(() => {
    sub.remove();
    if (!found) {
      manager.state().then((s: string) => {
        if (s === 'PoweredOn') startScan();
        else webViewRef.current?.injectJavaScript(
          `window.dispatchEvent(new CustomEvent('ble_result',{detail:{error:'Bluetooth desactive. Activez-le dans les Reglages.'}}));true;`
        );
      }).catch(() => {});
    }
  }, 3000);
}
