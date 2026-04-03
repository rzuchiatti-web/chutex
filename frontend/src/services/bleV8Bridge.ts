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

// ── V8 Command codes (per J-Style 2208A BLE API) ──
export const V8_CMD = {
  TIME_SYNC: 0x01,
  STEPS: 0x09,
  BATTERY: 0x13,
  VITALS: 0x28,
  VIBRATE: 0x36,
  GLUCOSE: 0x50,
  STEP_DETAIL: 0x52,
  SLEEP: 0x53,
  HR_HISTORY: 0x54,
  HR_SINGLE: 0x55,
  HRV_DATA: 0x56,
  SPO2_AUTO: 0x66,
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


/** Parse a V8 binary response from the bracelet (per 2208A BLE API) */
export function parseV8Response(bytes: number[]): { cmd: number; raw_hex?: string; [key: string]: any } | null {
  if (bytes.length < 2) return null;
  const cmd = bytes[0];
  // Store raw hex for backend diagnostics
  const raw_hex = bytes.map(b => ('0' + b.toString(16)).slice(-2)).join(':');
  const parsed: any = { cmd, raw_hex };

  // 0x13: Battery level (AA = 0-100%)
  if (cmd === V8_CMD.BATTERY && bytes.length >= 2) {
    parsed.battery = bytes[1];
  }

  // 0x09: Real-time step data (little-endian 4-byte fields)
  if (cmd === V8_CMD.STEPS && bytes.length >= 14) {
    parsed.steps = bytes[1] | (bytes[2] << 8) | (bytes[3] << 16) | (bytes[4] << 24);
    parsed.calories = ((bytes[5] | (bytes[6] << 8) | (bytes[7] << 16) | (bytes[8] << 24)) / 100);
    parsed.distance_m = bytes[9] | (bytes[10] << 8) | (bytes[11] << 16) | (bytes[12] << 24);
    parsed.heart_rate = bytes[13];
  }

  // 0x28: Health measurement response
  // Sub-types: 1=HRV+BP, 2=HR, 3=SpO2
  // Layout depends on sub-type — byte positions differ
  if (cmd === V8_CMD.VITALS && bytes.length >= 4) {
    const subType = bytes[1];
    parsed.measurement_type = subType;
    parsed.heart_rate = bytes[2];

    if (subType === 1 && bytes.length >= 10) {
      // HRV+BP: [cmd, sub, HR, HRV, stress, systolic, diastolic, tempLo, tempHi, SpO2?]
      parsed.hrv = bytes[3];
      parsed.stress = bytes[4];
      parsed.systolic = bytes[5];
      parsed.diastolic = bytes[6];
      parsed.temperature = (bytes[7] | (bytes[8] << 8)) / 10;
      // Some V8 firmwares put SpO2 at byte 9 for sub-type 1
      if (bytes.length > 9 && bytes[9] >= 60 && bytes[9] <= 100) {
        parsed.spo2 = bytes[9];
      }
    } else if (subType === 2 && bytes.length >= 3) {
      // HR only: [cmd, sub, HR, ...]
      // No SpO2 in this sub-type
    } else if (subType === 3 && bytes.length >= 4) {
      // SpO2: [cmd, sub, SpO2, PR]
      const rawSpo2 = bytes[2];
      if (rawSpo2 >= 60 && rawSpo2 <= 100) {
        parsed.spo2 = rawSpo2;
      }
      parsed.heart_rate = bytes[3] > 0 ? bytes[3] : 0; // Pulse rate
    } else if (bytes.length >= 10) {
      // Fallback: try original layout with validation
      if (bytes[3] >= 60 && bytes[3] <= 100) parsed.spo2 = bytes[3];
      if (bytes[4] >= 1 && bytes[4] <= 200) parsed.hrv = bytes[4];
      if (bytes[5] >= 1 && bytes[5] <= 100) parsed.stress = bytes[5];
      if (bytes[6] >= 70 && bytes[6] <= 200) parsed.systolic = bytes[6];
      if (bytes[7] >= 40 && bytes[7] <= 130) parsed.diastolic = bytes[7];
      const t = (bytes[8] | (bytes[9] << 8)) / 10;
      if (t >= 34 && t <= 42) parsed.temperature = t;
    }
  }

  // 0x50: Blood glucose estimation from PPG
  if (cmd === V8_CMD.GLUCOSE && bytes.length >= 4 && bytes[1] >= 100) {
    const gRaw = bytes[2] | (bytes[3] << 8);
    parsed.blood_glucose_mgdl = Math.round((gRaw / 10.0) * 18.0);
  }

  // 0x53: Detailed sleep data
  // Per V8 protocol: first 8 bytes are metadata [segment_id, year, month, day, hour, min, type, count]
  // Valid stages: 01=Deep, 02=Light, 03=REM, 04=Awake
  if (cmd === V8_CMD.SLEEP && bytes.length >= 3) {
    const rawStages = bytes.slice(1, -1); // Exclude cmd byte and CRC
    // Strip 8-byte metadata header if present (detect by values > 10 in first 8 bytes)
    let dataStart = 0;
    if (rawStages.length > 8 && rawStages.slice(0, 8).some(b => b > 10)) {
      dataStart = 8;
    }
    const stages: number[] = [];
    for (let i = dataStart; i < rawStages.length; i++) {
      if (rawStages[i] >= 1 && rawStages[i] <= 4) stages.push(rawStages[i]);
    }
    if (stages.length > 0) {
      const deep = stages.filter(s => s === 1).length;
      const light = stages.filter(s => s === 2).length;
      const rem = stages.filter(s => s === 3).length;
      const awake = stages.filter(s => s === 4).length;
      const sleepMin = deep + light + rem; // Awake doesn't count as sleep
      parsed.sleep_stages = stages;
      parsed.sleep_duration_min = sleepMin;
      parsed.deep_sleep_min = deep;
      parsed.light_sleep_min = light;
      parsed.rem_sleep_min = rem;
      parsed.awake_minutes = awake;
      parsed.sleep_quality = sleepMin > 0 ? Math.min(100, Math.round((deep * 2 + rem * 1.5 + light) / sleepMin * 50)) : 0;
    }
  }

  // 0x54: Heart rate history data
  if (cmd === V8_CMD.HR_HISTORY && bytes.length >= 4) {
    parsed.heart_rate = bytes[3]; // HR value after ID+timestamp bytes
  }

  // 0x55: Single heart rate data
  if (cmd === V8_CMD.HR_SINGLE && bytes.length >= 2) {
    parsed.heart_rate = bytes[1];
    if (bytes.length >= 3 && bytes[2] > 0) parsed.heart_rate_min = bytes[2];
    if (bytes.length >= 4 && bytes[3] > 0) parsed.heart_rate_max = bytes[3];
  }

  // 0x56: HRV data (includes fatigue/stress, BP)
  if (cmd === V8_CMD.HRV_DATA && bytes.length >= 4) {
    parsed.hrv = bytes[1];
    if (bytes.length >= 5) parsed.stress = bytes[4]; // fatigue level
    if (bytes.length >= 7) {
      parsed.systolic = bytes[5];
      parsed.diastolic = bytes[6];
    }
  }

  // 0x66: Automatic SpO2 data
  if (cmd === V8_CMD.SPO2_AUTO && bytes.length >= 2) {
    const rawSpo2 = bytes[1];
    if (rawSpo2 >= 60 && rawSpo2 <= 100) {
      parsed.spo2 = rawSpo2;
    }
  }

  // 0x52: Detailed step data (historical)
  if (cmd === V8_CMD.STEP_DETAIL && bytes.length >= 6) {
    parsed.steps = bytes[1] | (bytes[2] << 8) | (bytes[3] << 16);
    parsed.calories = bytes[4] | (bytes[5] << 8);
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
    case V8_CMD.STEP_DETAIL: return 'steps';
    case V8_CMD.VITALS: return 'heart_rate';
    case V8_CMD.GLUCOSE: return 'blood_glucose';
    case V8_CMD.SLEEP: return 'sleep';
    case V8_CMD.HR_HISTORY: return 'heart_rate';
    case V8_CMD.HR_SINGLE: return 'heart_rate';
    case V8_CMD.HRV_DATA: return 'heart_rate';
    case V8_CMD.SPO2_AUTO: return 'spo2';
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
  // Time sync
  await writeToDevice(device, V8_CMD.TIME_SYNC, [
    now.getFullYear() & 0xFF, (now.getFullYear() >> 8) & 0xFF,
    now.getMonth() + 1, now.getDate(),
    now.getHours(), now.getMinutes(), now.getSeconds()
  ]);
  // Battery (0x13 per 2208A API)
  setTimeout(() => writeToDevice(device, V8_CMD.BATTERY), 500);
  // Request sleep history (0x53, mode 0 = recent)
  setTimeout(() => writeToDevice(device, V8_CMD.SLEEP, [0]), 1000);
  // Start HRV measurement (AA=1, BB=1)
  setTimeout(() => writeToDevice(device, V8_CMD.VITALS, [1, 1]), 1500);
  // Start HR measurement (AA=2, BB=1)
  setTimeout(() => writeToDevice(device, V8_CMD.VITALS, [2, 1]), 2000);
  // Start SpO2 measurement (AA=3, BB=1)
  setTimeout(() => writeToDevice(device, V8_CMD.VITALS, [3, 1]), 2500);
  // Real-time steps (0x09, start=1)
  setTimeout(() => writeToDevice(device, V8_CMD.STEPS, [1, 1]), 3000);
  // Blood glucose
  setTimeout(() => writeToDevice(device, V8_CMD.GLUCOSE), 3500);
  // HR history (0x54, mode 0 = recent)
  setTimeout(() => writeToDevice(device, V8_CMD.HR_HISTORY, [0]), 4000);
  // HRV history (0x56, mode 0 = recent)
  setTimeout(() => writeToDevice(device, V8_CMD.HRV_DATA, [0]), 4500);
  // SpO2 history (0x66, mode 0 = recent)
  setTimeout(() => writeToDevice(device, V8_CMD.SPO2_AUTO, [0]), 5000);
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
        if(d&&d.commands) d.commands.forEach(function(c){ if(c.ble_cmd===54) window.ReactNativeWebView.postMessage(JSON.stringify({action:'ble_vibrate',payload:c.ble_payload||[3]})); });
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
      setTimeout(() => writeToDevice(device, V8_CMD.VITALS, [1, 1]), 200);
      setTimeout(() => writeToDevice(device, V8_CMD.VITALS, [2, 1]), 400);
      setTimeout(() => writeToDevice(device, V8_CMD.VITALS, [3, 1]), 600);
      setTimeout(() => writeToDevice(device, V8_CMD.GLUCOSE), 800);
      setTimeout(() => writeToDevice(device, V8_CMD.SLEEP, [0]), 1000);
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
