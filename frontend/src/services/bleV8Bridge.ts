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
  TEMPERATURE: 0x14,
  VITALS: 0x28,
  VIBRATE: 0x36,
  GLUCOSE: 0x78, // V8 SDK: CMD_Get_Bloodsugar (PPG-based, triggers 5-min measurement)
  GLUCOSE_DATA: 0x3a, // V8 SDK: Bloodsugar_data (raw PPG waveform)
  STEP_DETAIL: 0x52,
  SLEEP: 0x53,
  HR_HISTORY: 0x54,
  HR_SINGLE: 0x55,
  HRV_DATA: 0x56,
  TEMP_HISTORY: 0x62,
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

  // 0x14: Real-time temperature (3-NTC sensor)
  // Format: [cmd, tempLo, tempHi, axLo, axHi, ...]
  // temp = (tempLo + tempHi*256) / 10.0 — this is WRIST temperature
  // Body temperature = wrist temp + offset (~3°C for wrist sensors)
  if (cmd === V8_CMD.TEMPERATURE && bytes.length >= 3) {
    const tempRaw = bytes[1] + (bytes[2] << 8);
    const wristTemp = tempRaw / 10.0;
    // V8 bracelet returns wrist/skin temperature (typically 30-35°C)
    // Convert to estimated body temperature using standard medical offset
    const WRIST_TO_BODY_OFFSET = 3.0;
    if (wristTemp >= 28.0 && wristTemp <= 38.0) {
      const bodyTemp = Math.round((wristTemp + WRIST_TO_BODY_OFFSET) * 10) / 10;
      if (bodyTemp >= 35.0 && bodyTemp <= 42.0) {
        parsed.temperature = bodyTemp;
        parsed.wrist_temperature = Math.round(wristTemp * 10) / 10;
      }
    }
    // Axillary temperature (bytes 3-4, if available and valid)
    if (bytes.length >= 5 && bytes[3] > 0) {
      const axRaw = bytes[3] + (bytes[4] << 8);
      const axTemp = axRaw / 10.0;
      if (axTemp >= 28.0 && axTemp <= 38.0) {
        const axBody = Math.round((axTemp + WRIST_TO_BODY_OFFSET) * 10) / 10;
        if (axBody >= 35.0 && axBody <= 42.0) {
          parsed.axillary_temperature = axBody;
        }
      } else if (axTemp >= 35.0 && axTemp <= 42.0) {
        // Direct body temp reading (some V8 firmwares convert internally)
        parsed.axillary_temperature = Math.round(axTemp * 10) / 10;
      }
    }
  }

  // 0x09: Real-time step/activity data — per V8 SDK (ResolveUtil.getActivityData)
  // Format: [cmd, step(4), cal(4), dist(4), time(4), exerciseTime(4), HR, tempLo, tempHi, ...]
  if (cmd === V8_CMD.STEPS && bytes.length >= 22) {
    parsed.steps = bytes[1] | (bytes[2] << 8) | (bytes[3] << 16) | (bytes[4] << 24);
    const calRaw = bytes[5] | (bytes[6] << 8) | (bytes[7] << 16) | (bytes[8] << 24);
    parsed.calories = Math.round(calRaw / 100 * 10) / 10;
    parsed.distance_m = bytes[9] | (bytes[10] << 8) | (bytes[11] << 16) | (bytes[12] << 24);
    parsed.active_minutes = bytes[13] | (bytes[14] << 8) | (bytes[15] << 16) | (bytes[16] << 24);
    parsed.exercise_minutes = bytes[17] | (bytes[18] << 8) | (bytes[19] << 16) | (bytes[20] << 24);
    const hr09 = bytes[21];
    if (hr09 >= 30 && hr09 <= 200) parsed.heart_rate = hr09;
    if (bytes.length >= 24) {
      const tempRaw = bytes[22] | (bytes[23] << 8);
      const temp = tempRaw / 10.0;
      if (temp >= 34.0 && temp <= 42.0) parsed.temperature = Math.round(temp * 10) / 10;
    }
  }

  // 0x07: PPG/ECG real-time data — per V8 SDK (ResolveUtil.getECG + ECGResult)
  // When setECGRealtimeDuringHRVEnabled(true):
  //   - Packets with length > 16: ECG waveform data (24-bit samples)
  //   - Packets with length == 16: ECG analysis result
  if (cmd === 0x07 && bytes.length > 16) {
    // ECG waveform: groups of 3 bytes = 24-bit samples LE
    const packetID = bytes[1];
    const ecgSamples: number[] = [];
    const count = Math.floor((bytes.length - 2) / 3);
    for (let i = 0; i < count; i++) {
      const idx = 2 + 3 * i;
      const value = (bytes[idx] & 0xFF) | ((bytes[idx + 1] & 0xFF) << 8) | ((bytes[idx + 2] & 0xFF) << 16);
      ecgSamples.push(value);
    }
    parsed.ecg_samples = ecgSamples;
    parsed.ecg_packet_id = packetID;
  }
  if (cmd === 0x07 && bytes.length === 16 && bytes[1] > 0) {
    // ECG analysis result — per V8 SDK (ResolveUtil.ECGResult)
    parsed.ecg_result = {
      result_value: bytes[1],  // 0=normal, 1=low, 2=normal, 3=high
      hrv: bytes[2],
      av_block: bytes[3],      // AV block detection (anomaly!)
      heart_rate: bytes[4],
      stress: bytes[5],
      systolic: bytes[6],
      diastolic: bytes[7],
      mood: bytes[8],
      breath_rate: bytes[9],
    };
    if (bytes[4] > 0) parsed.heart_rate = bytes[4];
  }
  // Layout depends on sub-type — byte positions differ
  if (cmd === V8_CMD.VITALS && bytes.length >= 4) {
    const subType = bytes[1];
    parsed.measurement_type = subType;
    parsed.heart_rate = bytes[2];

    if (subType === 1 && bytes.length >= 8) {
      // HRV+BP measurement — per V8 SDK (BleSDK.java line 208-220):
      // value[2]=HeartRate, value[3]=Blood_oxygen, value[4]=HRV, value[5]=Stress, value[6]=HighPressure, value[7]=LowPressure
      parsed.heart_rate = bytes[2];
      const rawSpo2 = bytes[3];
      if (rawSpo2 >= 60 && rawSpo2 <= 100) parsed.spo2 = rawSpo2;
      if (bytes[4] >= 1 && bytes[4] <= 200) parsed.hrv = bytes[4];
      if (bytes[5] >= 1 && bytes[5] <= 100) parsed.stress = bytes[5];
      if (bytes[6] >= 70 && bytes[6] <= 200) parsed.systolic = bytes[6];
      if (bytes[7] >= 40 && bytes[7] <= 130) parsed.diastolic = bytes[7];
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

  // 0x53: Sleep data — per V8 SDK (ResolveUtil.getSleepData)
  // 130-byte packet (1-min resolution): [cmd, idx, pad, year, month, day, hour, min, sec, sleepLength, stages...]
  // 34-byte records (5-min resolution): same header, stages are 5-min intervals
  // stages: 1=Deep, 2=Light, 3=REM, 4=Awake
  if (cmd === V8_CMD.SLEEP && bytes.length >= 11) {
    const segmentIndex = bytes[1];
    parsed.segment_index = segmentIndex;
    
    // End marker: 0xFF
    if (bytes.length <= 3 && bytes[1] === 0xFF) {
      return parsed; // No more data
    }
    
    // Extract BCD date from bytes[3-8] per SDK
    const bcd = (b: number) => `${(b >> 4) & 0xf}${b & 0xf}`;
    const sleepDate = `20${bcd(bytes[3])}-${bcd(bytes[4])}-${bcd(bytes[5])}`;
    const sleepTime = `${bcd(bytes[6])}:${bcd(bytes[7])}`;
    parsed.sleep_date = sleepDate;
    parsed.sleep_start_time = sleepTime;
    
    const sleepLength = bytes[9]; // Number of stage entries
    const isMinuteResolution = bytes.length >= 130; // 130-byte = 1-min, 34-byte = 5-min
    const unitMinutes = isMinuteResolution ? 1 : 5;
    
    const stages: number[] = [];
    for (let i = 0; i < sleepLength && (10 + i) < bytes.length; i++) {
      const val = bytes[10 + i];
      if (val >= 1 && val <= 4) stages.push(val);
    }
    
    if (stages.length > 0) {
      const deep = stages.filter(s => s === 1).length * unitMinutes;
      const light = stages.filter(s => s === 2).length * unitMinutes;
      const rem = stages.filter(s => s === 3).length * unitMinutes;
      const awake = stages.filter(s => s === 4).length * unitMinutes;
      const sleepMin = deep + light + rem;
      parsed.sleep_stages = stages;
      parsed.sleep_duration_min = sleepMin;
      parsed.deep_sleep_min = deep;
      parsed.light_sleep_min = light;
      parsed.rem_sleep_min = rem;
      parsed.awake_minutes = awake;
      parsed.sleep_quality = sleepMin > 0 ? Math.min(100, Math.round((deep * 2 + rem * 1.5 + light) / sleepMin * 50)) : 0;
      
      // Count interruptions (transitions to awake)
      let interruptions = 0;
      for (let i = 1; i < stages.length; i++) {
        if (stages[i] === 4 && stages[i - 1] !== 4) interruptions++;
      }
      parsed.sleep_interruptions = interruptions;
      
      // Count cycles (a cycle = one passage through light→deep→REM)
      let cycles = 0;
      let hadDeep = false;
      for (const s of stages) {
        if (s === 1) hadDeep = true;
        if (s === 3 && hadDeep) { cycles++; hadDeep = false; }
      }
      parsed.sleep_cycles = Math.max(cycles, 1);
    }
  }

  // 0x54: Heart rate history data
  // Format: [cmd, index, padding, year, month, day, hour, minute, count?, HR1, HR2, ...]
  if (cmd === V8_CMD.HR_HISTORY && bytes.length >= 10) {
    // Skip header (8 bytes), extract HR values
    const hrValues = bytes.slice(8, -1).filter(v => v > 30 && v < 200);
    if (hrValues.length > 0) {
      parsed.heart_rate = hrValues[0]; // Most recent HR in this block
      if (hrValues.length > 1) parsed.heart_rate_history = hrValues;
    }
  }

  // 0x55: Single heart rate data
  if (cmd === V8_CMD.HR_SINGLE && bytes.length >= 2) {
    parsed.heart_rate = bytes[1];
    if (bytes.length >= 3 && bytes[2] > 0) parsed.heart_rate_min = bytes[2];
    if (bytes.length >= 4 && bytes[3] > 0) parsed.heart_rate_max = bytes[3];
  }

  // 0x56: HRV history data — per V8 SDK: records of 15 bytes
  // [cmd, idx, pad, year, month, day, hour, min, sec, HRV, VascularAging, HeartRate, Stress, highBP, lowBP]
  if (cmd === V8_CMD.HRV_DATA && bytes.length >= 15) {
    const hrv = bytes[9];
    const vascularAging = bytes[10];
    const hr = bytes[11];
    const stress = bytes[12];
    const sys = bytes[13];
    const dia = bytes[14];
    if (hr >= 30 && hr <= 200) parsed.heart_rate = hr;
    if (hrv >= 1 && hrv <= 200) parsed.hrv = hrv;
    if (stress >= 1 && stress <= 100) parsed.stress = stress;
    if (sys >= 70 && sys <= 200) parsed.systolic = sys;
    if (dia >= 40 && dia <= 130) parsed.diastolic = dia;
    if (vascularAging > 0) parsed.vascular_aging = vascularAging;
  }

  // 0x66: Automatic SpO2 history data
  // Format: [cmd, index, pad, year, month, day, hour, min, HR, SpO2, ...]
  // Can contain multiple 10-byte records concatenated
  if (cmd === V8_CMD.SPO2_AUTO && bytes.length >= 10) {
    // Extract SpO2 from the data portion (byte 9 = SpO2)
    const spo2Val = bytes[9];
    if (spo2Val >= 60 && spo2Val <= 100) {
      parsed.spo2 = spo2Val;
    }
    // HR is at byte 8
    const hrVal = bytes[8];
    if (hrVal >= 30 && hrVal <= 200) {
      parsed.heart_rate = hrVal;
    }
  } else if (cmd === V8_CMD.SPO2_AUTO && bytes.length >= 2 && bytes.length < 10) {
    // Short SpO2 response (real-time, not historical)
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
    case V8_CMD.TEMPERATURE: return 'temperature';
    case V8_CMD.STEPS: return 'steps';
    case V8_CMD.STEP_DETAIL: return 'steps';
    case V8_CMD.VITALS: return 'heart_rate';
    case V8_CMD.GLUCOSE: return 'blood_glucose';
    case V8_CMD.SLEEP: return 'sleep';
    case V8_CMD.HR_HISTORY: return 'heart_rate';
    case V8_CMD.HR_SINGLE: return 'heart_rate';
    case V8_CMD.HRV_DATA: return 'heart_rate';
    case V8_CMD.TEMP_HISTORY: return 'temperature';
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


/** Convert decimal to BCD byte (per V8 SDK: ResolveUtil.getTimeValue) */
function toBCD(val: number): number {
  const str = String(val);
  return parseInt(str, 16);
}

/** Send initial commands after connection (time sync + metric requests) */
export async function sendInitialCommands(device: any) {
  const now = new Date();
  // Time sync — BCD format per V8 SDK (BleSDK.java line 477-483)
  await writeToDevice(device, V8_CMD.TIME_SYNC, [
    toBCD(now.getFullYear() % 100), // year in BCD (26 → 0x26)
    toBCD(now.getMonth() + 1),       // month in BCD
    toBCD(now.getDate()),             // day in BCD
    toBCD(now.getHours()),            // hour in BCD
    toBCD(now.getMinutes()),          // minute in BCD
    toBCD(now.getSeconds()),          // second in BCD
  ]);
  // Battery (0x13 per 2208A API)
  setTimeout(() => writeToDevice(device, V8_CMD.BATTERY), 500);
  // Request ALL sleep segments (0x53, indices 0-9 to cover ~3 days)
  for (let seg = 0; seg < 10; seg++) {
    setTimeout(() => writeToDevice(device, V8_CMD.SLEEP, [seg]), 1000 + seg * 300);
  }
  // Start HRV measurement (AA=1, BB=1)
  setTimeout(() => writeToDevice(device, V8_CMD.VITALS, [1, 1]), 4500);
  // Start HR measurement (AA=2, BB=1)
  setTimeout(() => writeToDevice(device, V8_CMD.VITALS, [2, 1]), 5000);
  // Start SpO2 measurement (AA=3, BB=1)
  setTimeout(() => writeToDevice(device, V8_CMD.VITALS, [3, 1]), 5500);
  // Real-time steps (0x09, start=1)
  setTimeout(() => writeToDevice(device, V8_CMD.STEPS, [1, 1]), 6000);
  // Blood glucose
  setTimeout(() => writeToDevice(device, V8_CMD.GLUCOSE), 6500);
  // Temperature (0x14 — 3-NTC sensor, per V8 SDK)
  setTimeout(() => writeToDevice(device, V8_CMD.TEMPERATURE), 7000);
  // Temperature history (0x62)
  setTimeout(() => writeToDevice(device, V8_CMD.TEMP_HISTORY, [0]), 7200);

  // Historical data: request past 3 days of steps (0x51 with date)
  for (let daysAgo = 0; daysAgo < 3; daysAgo++) {
    const d = new Date(now.getTime() - daysAgo * 86400000);
    setTimeout(() => writeToDevice(device, 0x51, [
      d.getFullYear() & 0xFF, (d.getFullYear() >> 8) & 0xFF,
      d.getMonth() + 1, d.getDate()
    ]), 7500 + daysAgo * 500);
  }

  // HR history indices (0x54, 0-4 to cover recent days)
  for (let i = 0; i < 5; i++) {
    setTimeout(() => writeToDevice(device, V8_CMD.HR_HISTORY, [i]), 8500 + i * 300);
  }
  // HRV history (0x56, indices 0-2)
  for (let i = 0; i < 3; i++) {
    setTimeout(() => writeToDevice(device, V8_CMD.HRV_DATA, [i]), 10000 + i * 300);
  }
  // SpO2 history (0x66, indices 0-2)
  for (let i = 0; i < 3; i++) {
    setTimeout(() => writeToDevice(device, V8_CMD.SPO2_AUTO, [i]), 11000 + i * 300);
  }
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


/** Inject BLE connection status into WebView for UI feedback */
export function injectBleStatus(webViewRef: any, status: 'scanning' | 'connecting' | 'connected' | 'disconnected' | 'error', detail?: string) {
  const msg = JSON.stringify({ status, detail: detail || '' }).replace(/'/g, '');
  webViewRef.current?.injectJavaScript(`
    window.dispatchEvent(new CustomEvent('ble_connection_status',{detail:${msg}}));
    window.__bleStatus = '${status}';
    true;
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

      // Forward ECG samples specifically for the ECG page
      if (parsed.ecg_samples && parsed.ecg_samples.length > 0) {
        const ecgJson = JSON.stringify({ ecg_samples: parsed.ecg_samples, ecg_packet_id: parsed.ecg_packet_id }).replace(/'/g, '');
        webViewRef.current?.injectJavaScript(`
          window.dispatchEvent(new CustomEvent('ble_ecg_data',{detail:${ecgJson}}));true;
        `);
      }
      // Forward ECG result (HR, HRV, BP, stress, etc.) from bracelet analysis
      if (parsed.ecg_result) {
        const resultJson = JSON.stringify({ ecg_result: parsed.ecg_result, ecg_hr: parsed.ecg_result.ecg_hr || parsed.ecg_result.heart_rate || 0 }).replace(/'/g, '');
        webViewRef.current?.injectJavaScript(`
          window.dispatchEvent(new CustomEvent('ble_ecg_data',{detail:${resultJson}}));true;
        `);
      }

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
      setTimeout(() => writeToDevice(device, V8_CMD.TEMPERATURE), 1200);
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

  // Notify WebView: connected
  injectBleStatus(webViewRef, 'connected', device.name || 'Bracelet Elio');

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
  options?: { silent?: boolean; knownDeviceId?: string; scanTimeout?: number },
) {
  let found = false;
  const nameFilter = BLE_NAME_FILTERS[deviceType];
  const isBracelet = deviceType === 'bracelet';
  const silent = options?.silent || false;
  const scanTimeout = options?.scanTimeout || 30000;

  const notifyWebView = (js: string) => {
    if (!silent) webViewRef.current?.injectJavaScript(js);
  };

  // Try direct connection by known device ID first (faster than scanning)
  const tryDirectConnect = async (deviceId: string): Promise<boolean> => {
    try {
      injectBleStatus(webViewRef, 'connecting', 'Connexion directe...');
      const device = await manager.connectToDevice(deviceId, { timeout: 10000 });
      if (device) {
        found = true;
        await device.discoverAllServicesAndCharacteristics();
        injectBleStatus(webViewRef, 'connected', device.name || 'Bracelet Elio');
        notifyWebView(
          `window.dispatchEvent(new CustomEvent('ble_result',{detail:{success:true,name:'${(device.name || 'Bracelet').replace(/'/g, '')}',id:'${deviceId.replace(/'/g, '')}'}}));true;`
        );
        if (isBracelet) {
          await startBraceletProtocol(device, webViewRef, bleDeviceRef, blePollRef);
        }
        return true;
      }
    } catch {}
    return false;
  };

  const startScan = () => {
    injectBleStatus(webViewRef, 'scanning', 'Recherche du bracelet...');
    manager.startDeviceScan(null, null, async (error: any, device: any) => {
      if (error) {
        notifyWebView(
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
          notifyWebView(
            `window.dispatchEvent(new CustomEvent('ble_result',{detail:{success:true,name:'${name.replace(/'/g, '')}',id:'${(device.id || '').replace(/'/g, '')}'}}));true;`
          );
          if (isBracelet) {
            await startBraceletProtocol(connected, webViewRef, bleDeviceRef, blePollRef);
          }
          // Vest: monitor UART service for vest data
          if (deviceType === 'vest') {
            const VEST_SVCS = [
              { uuid: '0000ffe0-0000-1000-8000-00805f9b34fb', notify: '0000ffe4-0000-1000-8000-00805f9b34fb' },
              { uuid: '6e400001-b5a3-f393-e0a9-e50e24dcca9e', notify: '6e400003-b5a3-f393-e0a9-e50e24dcca9e', write: '6e400002-b5a3-f393-e0a9-e50e24dcca9e' },
            ];
            for (const svc of VEST_SVCS) {
              try {
                connected.monitorCharacteristicForService(svc.uuid, svc.notify, (err: any, char: any) => {
                  if (err || !char?.value) return;
                  try {
                    const bytes = require('react-native').Platform.OS === 'web' ? new Uint8Array(0) : (() => { const { base64ToBytes } = require('./ble'); return base64ToBytes(char.value); })();
                    const raw = new TextDecoder('utf-8').decode(bytes);
                    webViewRef.current?.injectJavaScript(
                      `window.dispatchEvent(new CustomEvent('ble_vest_data',{detail:{vest_data:'${raw.replace(/'/g, "\\'")}'}}));true;`
                    );
                  } catch {}
                });
                // Send time sync if write char available
                if (svc.write) {
                  try {
                    const now = new Date();
                    const t = `time&${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}-${String(now.getSeconds()).padStart(2,'0')}`;
                    const { bytesToBase64 } = require('./ble');
                    const encoded = bytesToBase64(Array.from(new TextEncoder().encode(t)));
                    connected.writeCharacteristicWithResponseForService(svc.uuid, svc.write, encoded).catch(() => {});
                  } catch {}
                }
                break;
              } catch { continue; }
            }
          }
        } catch (e: any) {
          notifyWebView(
            `window.dispatchEvent(new CustomEvent('ble_result',{detail:{error:'Connexion echouee: ${(e.message || '').replace(/'/g, '')}'}}));true;`
          );
        }
      }
    });
    // Timeout
    setTimeout(() => {
      if (!found) {
        manager.stopDeviceScan();
        notifyWebView(
          `window.dispatchEvent(new CustomEvent('ble_result',{detail:{error:'Appareil non trouve. Verifiez qu\\'il est allume et a proximite.'}}));true;`
        );
      }
    }, scanTimeout);
  };

  // If we have a known device ID, try direct connection first
  if (options?.knownDeviceId) {
    tryDirectConnect(options.knownDeviceId).then(success => {
      if (!success) {
        // Fall back to scanning
        const sub = manager.onStateChange((state: string) => {
          if (state === 'PoweredOn') { sub.remove(); startScan(); }
        }, true);
        setTimeout(() => { sub.remove(); if (!found) manager.state().then((s: string) => { if (s === 'PoweredOn') startScan(); }).catch(() => {}); }, 3000);
      }
    });
    return;
  }

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
        else notifyWebView(
          `window.dispatchEvent(new CustomEvent('ble_result',{detail:{error:'Bluetooth desactive. Activez-le dans les Reglages.'}}));true;`
        );
      }).catch(() => {});
    }
  }, 3000);
}
