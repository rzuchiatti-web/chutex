import React, { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { I18nProvider } from '../src/context/I18nContext';
import { DorsiBLEProvider } from '../src/context/DorsiBLEContext';
import { View, ActivityIndicator, StyleSheet, Platform, Image, Text, TouchableOpacity } from 'react-native';
import { PastelMistBackground } from '../src/components/PastelMistBackground';
import { ensureFirstLaunchLocationPermission, openSystemLocationSettings, requestLocationPermission } from '../src/services/locationPermissions';
import TeamActivityToast from '../src/components/programs/TeamActivityToast';

/**
 * On iOS: render the entire app as a single full-screen WebView
 * This ensures 100% parity with the web preview
 */
function NativeFullApp() {
  const WebView = require('react-native-webview').default;
  const { SafeAreaView } = require('react-native-safe-area-context');
  const { PermissionsAndroid } = require('react-native');
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
  const webViewRef = useRef<any>(null);
  const [showLocationGuide, setShowLocationGuide] = useState(false);
  const [locationGuideMsg, setLocationGuideMsg] = useState('');
  const [locationRetrying, setLocationRetrying] = useState(false);

  useEffect(() => {
    const bootstrapLocationPermission = async () => {
      const result = await ensureFirstLaunchLocationPermission();
      if (!result.granted) {
        setLocationGuideMsg(result.message);
        setShowLocationGuide(true);
      }
    };
    bootstrapLocationPermission();
  }, []);

  const retryLocationPermission = async () => {
    setLocationRetrying(true);
    const result = await requestLocationPermission();
    setLocationGuideMsg(result.message);
    setShowLocationGuide(!result.granted);
    setLocationRetrying(false);
  };

  // ── Persistent BLE manager + connected device ──
  const bleManagerRef = useRef<any>(null);
  const bleDeviceRef = useRef<any>(null);
  const blePollRef = useRef<any>(null);

  const getBleManager = () => {
    if (!bleManagerRef.current) {
      try {
        const { BleManager } = require('react-native-ble-plx');
        bleManagerRef.current = new BleManager();
      } catch {}
    }
    return bleManagerRef.current;
  };

  // Build 16-byte command packet for V8/2208A bracelet
  const buildCmd = (cmd: number, payload: number[] = []): string => {
    const pkt = [cmd, ...payload, ...new Array(14 - payload.length).fill(0)];
    pkt.push(pkt.reduce((s: number, b: number) => s + b, 0) & 0xFF);
    // Convert to base64 for react-native-ble-plx
    const bytes = new Uint8Array(pkt);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return typeof btoa !== 'undefined' ? btoa(binary) : require('react-native').Buffer?.from(pkt)?.toString('base64') || '';
  };

  // Write a command to the bracelet
  const writeToDevice = async (device: any, cmd: number, payload: number[] = []) => {
    try {
      const b64 = buildCmd(cmd, payload);
      await device.writeCharacteristicWithResponseForService(
        '0000fff0-0000-1000-8000-00805f9b34fb',
        '0000fff6-0000-1000-8000-00805f9b34fb',
        b64
      ).catch(() =>
        device.writeCharacteristicWithoutResponseForService(
          '0000fff0-0000-1000-8000-00805f9b34fb',
          '0000fff6-0000-1000-8000-00805f9b34fb',
          b64
        )
      );
    } catch {}
  };

  // Start full V8 protocol after connection
  const startBraceletProtocol = async (device: any) => {
    bleDeviceRef.current = device;
    const apiUrl = backendUrl;

    // Get auth token from WebView
    let authToken = '';
    try {
      const tokenResult = await new Promise<string>((resolve) => {
        webViewRef.current?.injectJavaScript(`
          (function(){
            try { window.ReactNativeWebView.postMessage(JSON.stringify({action:'get_token',token:localStorage.getItem('vl_token')||localStorage.getItem('@AsyncStorage:vl_token')||''})); }
            catch(e){}
          })(); true;
        `);
        // We'll get it via onMessage - for now use a stored ref
        setTimeout(() => resolve(''), 500);
      });
    } catch {}

    // Monitor notifications on FFF7 (V8 notify characteristic)
    try {
      device.monitorCharacteristicForService(
        '0000fff0-0000-1000-8000-00805f9b34fb',
        '0000fff7-0000-1000-8000-00805f9b34fb',
        (err: any, char: any) => {
          if (err || !char?.value) return;
          // Decode base64 to bytes
          const raw = char.value;
          let bytes: number[] = [];
          try {
            const bin = typeof atob !== 'undefined' ? atob(raw) : '';
            for (let i = 0; i < bin.length; i++) bytes.push(bin.charCodeAt(i));
          } catch { return; }
          if (bytes.length < 1) return;
          const cmd = bytes[0];
          const parsed: any = { cmd };

          // Parse response
          if (cmd === 0x0D && bytes.length >= 2) parsed.battery = bytes[1];
          if (cmd === 0x09 && bytes.length >= 14) {
            parsed.steps = bytes[1] | (bytes[2] << 8) | (bytes[3] << 16) | (bytes[4] << 24);
            parsed.calories = ((bytes[5] | (bytes[6] << 8) | (bytes[7] << 16) | (bytes[8] << 24)) / 100);
            parsed.heart_rate = bytes[13];
          }
          if (cmd === 0x28 && bytes.length >= 10) {
            parsed.heart_rate = bytes[2]; parsed.spo2 = bytes[3]; parsed.hrv = bytes[4];
            parsed.stress = bytes[5]; parsed.systolic = bytes[6]; parsed.diastolic = bytes[7];
            parsed.temperature = (bytes[8] | (bytes[9] << 8)) / 10;
          }
          if (cmd === 0x50 && bytes.length >= 4 && bytes[1] >= 100) {
            const gRaw = bytes[2] | (bytes[3] << 8);
            parsed.blood_glucose_mgdl = Math.round((gRaw / 10.0) * 18.0);
          }

          // Send parsed data to WebView for display
          const dataJson = JSON.stringify(parsed).replace(/'/g, '');
          webViewRef.current?.injectJavaScript(`
            window.dispatchEvent(new CustomEvent('ble_data',{detail:${dataJson}})); true;
          `);

          // Push to backend via fetch from native side
          const pushData = async () => {
            try {
              let dataType = 'realtime';
              if (cmd === 0x0D) dataType = 'battery';
              else if (cmd === 0x09) dataType = 'steps';
              else if (cmd === 0x28) dataType = 'heart_rate';
              else if (cmd === 0x50) dataType = 'blood_glucose';
              await fetch(`${apiUrl}/api/bracelet/v8/push`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data_type: dataType, data: parsed, device_id: device.id || '', source: 'ble' }),
              });
            } catch {}
          };
          // We need the token - inject it from webview
          webViewRef.current?.injectJavaScript(`
            (function(){
              var t = localStorage.getItem('vl_token') || localStorage.getItem('@AsyncStorage:vl_token') || '';
              if(t) fetch('/api/bracelet/v8/push',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify({data_type:'${cmd===0x0D?'battery':cmd===0x09?'steps':cmd===0x28?'heart_rate':cmd===0x50?'blood_glucose':'realtime'}',data:${dataJson},device_id:'${(device.id||'').replace(/'/g,'')}',source:'ble'})}).catch(function(){});
            })(); true;
          `);
        }
      );
    } catch {}

    // Time sync
    const now = new Date();
    await writeToDevice(device, 0x01, [now.getFullYear() & 0xFF, (now.getFullYear() >> 8) & 0xFF, now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()]);

    // Initial commands
    setTimeout(() => writeToDevice(device, 0x0D), 500);
    setTimeout(() => writeToDevice(device, 0x52, [0]), 1000);
    setTimeout(() => writeToDevice(device, 0x28, [2, 1]), 1500);
    setTimeout(() => writeToDevice(device, 0x28, [3, 1]), 2000);
    setTimeout(() => writeToDevice(device, 0x28, [1, 1]), 2500);
    setTimeout(() => writeToDevice(device, 0x09, [1, 1]), 3000);
    setTimeout(() => writeToDevice(device, 0x50), 3500);

    // Sync to backend (associate + sync)
    setTimeout(() => {
      webViewRef.current?.injectJavaScript(`
        (function(){
          var t = localStorage.getItem('vl_token') || localStorage.getItem('@AsyncStorage:vl_token') || '';
          if(t){
            fetch('/api/devices/associate',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify({device_type:'bracelet',mac_address:'${(device.id||'').replace(/'/g,'')}'})}).catch(function(){});
            fetch('/api/devices/sync',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify({device_type:'bracelet',data:{connected:true}})}).catch(function(){});
          }
        })(); true;
      `);
    }, 4000);

    // Periodic polling every 10s
    if (blePollRef.current) clearInterval(blePollRef.current);
    blePollRef.current = setInterval(async () => {
      if (!bleDeviceRef.current) { clearInterval(blePollRef.current); return; }
      try {
        const isConn = await device.isConnected();
        if (!isConn) { clearInterval(blePollRef.current); bleDeviceRef.current = null; return; }
        writeToDevice(device, 0x09, [1, 1]);
      } catch { clearInterval(blePollRef.current); bleDeviceRef.current = null; }
    }, 10000);

    // Full poll every 30s
    const fullPoll = setInterval(async () => {
      if (!bleDeviceRef.current) { clearInterval(fullPoll); return; }
      try {
        const isConn = await device.isConnected();
        if (!isConn) { clearInterval(fullPoll); return; }
        writeToDevice(device, 0x0D);
        setTimeout(() => writeToDevice(device, 0x28, [2, 1]), 200);
        setTimeout(() => writeToDevice(device, 0x28, [3, 1]), 400);
        setTimeout(() => writeToDevice(device, 0x28, [1, 1]), 600);
        setTimeout(() => writeToDevice(device, 0x50), 800);
        // Check pending vibration commands
        webViewRef.current?.injectJavaScript(`
          (function(){
            var t = localStorage.getItem('vl_token') || localStorage.getItem('@AsyncStorage:vl_token') || '';
            if(t) fetch('/api/bracelet/v8/pending-commands',{headers:{'Authorization':'Bearer '+t}}).then(function(r){return r.json()}).then(function(d){
              if(d&&d.commands) d.commands.forEach(function(c){ if(c.ble_cmd===8) window.ReactNativeWebView.postMessage(JSON.stringify({action:'ble_vibrate',payload:c.ble_payload||[1,3]})); });
            }).catch(function(){});
          })(); true;
        `);
      } catch { clearInterval(fullPoll); }
    }, 30000);
  };

  const handleMessage = async (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);

      // Handle vibration command from webview
      if (msg.action === 'ble_vibrate' && bleDeviceRef.current) {
        const payload = msg.payload || [1, 3];
        writeToDevice(bleDeviceRef.current, 0x08, payload);
        return;
      }

      // Handle token retrieval (ignore)
      if (msg.action === 'get_token') return;

      if (msg.action === 'ble_scan_bracelet' || msg.action === 'ble_scan_vest' || msg.action === 'ble_scan_scale') {
        const isBracelet = msg.action === 'ble_scan_bracelet';
        const isScale = msg.action === 'ble_scan_scale';
        if (Platform.OS === 'android') {
          try {
            await PermissionsAndroid.requestMultiple([
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ]);
          } catch {}
        }
        const manager = getBleManager();
        if (!manager) {
          webViewRef.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('ble_result',{detail:{error:'BLE non disponible'}}));true;`);
          return;
        }
        let found = false;
        const nameFilter = isBracelet
          ? ['2208', 'J22', 'JStyle', 'Elio', 'V8', 'JCV8', 'HB8', '2301']
          : isScale
          ? ['QN-Scale', 'Lefu', 'CF586', 'Health Scale', 'SWAN', 'BF600']
          : ['Elder', 'AIRBAG', 'Gilet', 'Airbag'];

        const startScan = () => {
          manager.startDeviceScan(null, null, async (error: any, device: any) => {
            if (error) {
              webViewRef.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('ble_result',{detail:{error:'${error.message?.replace(/'/g, '')}'}}));true;`);
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
                webViewRef.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('ble_result',{detail:{success:true,name:'${(name || '').replace(/'/g, '')}',id:'${(device.id || '').replace(/'/g, '')}'}}));true;`);
                // Start full V8 protocol for bracelet
                if (isBracelet) {
                  await startBraceletProtocol(connected);
                }
              } catch (e: any) {
                webViewRef.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('ble_result',{detail:{error:'Connexion echouee: ${(e.message || '').replace(/'/g, '')}'}}));true;`);
              }
            }
          });
          setTimeout(() => {
            if (!found) {
              manager.stopDeviceScan();
              webViewRef.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('ble_result',{detail:{error:'Appareil non trouve. Verifiez qu\\'il est allume et a proximite.'}}));true;`);
            }
          }, 20000);
        };

        const sub = manager.onStateChange((state: string) => {
          if (state === 'PoweredOn') { sub.remove(); startScan(); }
        }, true);
        setTimeout(() => {
          sub.remove();
          if (!found) {
            manager.state().then((s: string) => {
              if (s === 'PoweredOn') startScan();
              else webViewRef.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('ble_result',{detail:{error:'Bluetooth desactive. Activez-le dans les Reglages.'}}));true;`);
            }).catch(() => {});
          }
        }, 3000);
      }
    } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A1A' }}>
      <StatusBar style="light" translucent={true} />
        <WebView
          ref={webViewRef}
          source={{ uri: backendUrl }}
          style={{ flex: 1, backgroundColor: '#0A0A1A' }}
          startInLoadingState={true}
          onMessage={handleMessage}
          renderLoading={() => (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A1A' }}>
              <Image
                source={{ uri: 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/Logo_chutex_1.png?v=1737551429' }}
                style={{ width: 120, height: 40, resizeMode: 'contain', marginBottom: 20 }}
              />
              <ActivityIndicator size="large" color="#A78BFA" />
            </View>
          )}
          allowsBackForwardNavigationGestures={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          decelerationRate="normal"
          contentMode="mobile"
          allowsFullscreenVideo={true}
        />

        {showLocationGuide && (
          <View style={st.locationGuideOverlay}>
            <View style={st.locationGuideCard}>
              <Text style={st.locationGuideTitle} testID="native-location-guide-title">Activer la localisation</Text>
              <Text style={st.locationGuideText} testID="native-location-guide-text">
                {locationGuideMsg || 'Choisissez "Toujours" pour que les safe zones fonctionnent en continu.'}
              </Text>
              <View style={st.locationGuideActions}>
                <TouchableOpacity testID="native-location-open-settings-button" style={st.locationGuideSecondaryBtn} onPress={() => openSystemLocationSettings()}>
                  <Text style={st.locationGuideSecondaryBtnText}>Ouvrir Reglages</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="native-location-retry-button" style={st.locationGuidePrimaryBtn} onPress={retryLocationPermission}>
                  <Text style={st.locationGuidePrimaryBtnText}>{locationRetrying ? 'Verification...' : 'Reessayer'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
    </View>
  );
}

function WebLocationPermissionGate() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const checkWebPermission = async () => {
      const result = await ensureFirstLaunchLocationPermission();
      if (!result.granted) {
        setMessage(result.message);
        setVisible(true);
      }
    };
    checkWebPermission();
  }, []);

  const retry = async () => {
    setRetrying(true);
    const result = await requestLocationPermission();
    setMessage(result.message);
    setVisible(!result.granted);
    setRetrying(false);
  };

  if (!visible) return null;

  return (
    <div data-testid="web-location-permission-guide" style={{ position: 'fixed', right: 16, bottom: 80, zIndex: 9999, width: 300, maxWidth: 'calc(100vw - 32px)', maxHeight: 140, overflow: 'hidden', borderRadius: 14, background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', padding: '12px 14px', fontFamily: "'Inter', system-ui, sans-serif" } as any}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } as any}>
        <div style={{ fontSize: 12, fontWeight: 800, color: '#FFF' }} data-testid="web-location-permission-guide-title">Localisation</div>
        <div data-testid="web-location-dismiss" onClick={() => setVisible(false)} style={{ width: 22, height: 22, borderRadius: 999, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-close-line" style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }} />
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 8 }} data-testid="web-location-permission-guide-text">
        {message || 'Pour les safe zones et le suivi SOS.'}
      </div>
      <div style={{ display: 'flex', gap: 6 } as any}>
        <div data-testid="web-location-retry-button" onClick={retry} style={{ textAlign: 'center', borderRadius: 999, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', color: '#34D399', fontSize: 11, fontWeight: 700, padding: '7px 10px', cursor: 'pointer', opacity: retrying ? 0.6 : 1 } as any}>
          {retrying ? '...' : 'Autoriser'}
        </div>
      </div>
    </div>
  );
}

function RootNav() {
  // On native (iOS), render full-screen WebView — same as web preview
  if (Platform.OS !== 'web') {
    return <NativeFullApp />;
  }

  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={st.loading}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#111827" />
      </View>
    );
  }

  if (!user) {
    return (
      <>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' }, animation: 'none' }}>
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="onboarding" options={{ animation: 'none' }} />
          <Stack.Screen name="register" options={{ animation: 'none' }} />
          <Stack.Screen name="subscription" options={{ animation: 'none' }} />
        </Stack>
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' }, animation: 'none' }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="health-detail" options={{ presentation: 'card' }} />
        <Stack.Screen name="backoffice" options={{ presentation: 'card' }} />
        <Stack.Screen name="intervention-detail" options={{ presentation: 'card' }} />
        <Stack.Screen name="subscriber-detail" options={{ presentation: 'card' }} />
        <Stack.Screen name="alert-detail" options={{ presentation: 'card' }} />
        <Stack.Screen name="beneficiary-detail" options={{ presentation: 'card' }} />
        <Stack.Screen name="reminders" options={{ presentation: 'card' }} />
        <Stack.Screen name="data-sharing" options={{ presentation: 'card' }} />
        <Stack.Screen name="ecg" options={{ presentation: 'card' }} />
        <Stack.Screen name="ecg-detail" options={{ presentation: 'card' }} />
        <Stack.Screen name="geofencing" options={{ presentation: 'card' }} />
        <Stack.Screen name="vest-connect" options={{ presentation: 'card' }} />
        <Stack.Screen name="sleep" options={{ presentation: 'card' }} />
        <Stack.Screen name="subscription" options={{ presentation: 'card' }} />
        <Stack.Screen name="link-code" options={{ presentation: 'modal' }} />
        <Stack.Screen name="guardian-detail" options={{ presentation: 'card' }} />
        <Stack.Screen name="edit-thresholds" options={{ presentation: 'card' }} />
        <Stack.Screen name="activate-beneficiary" options={{ presentation: 'card' }} />
        <Stack.Screen name="activate-guardian" options={{ presentation: 'card' }} />
        <Stack.Screen name="program-detail" options={{ presentation: 'card' }} />
        <Stack.Screen name="pro-program-detail" options={{ presentation: 'card' }} />
        <Stack.Screen name="pro-exercise-detail" options={{ presentation: 'card' }} />
        <Stack.Screen name="exercise-detail" options={{ presentation: 'card' }} />
        <Stack.Screen name="minceur" options={{ presentation: 'card' }} />
        <Stack.Screen name="chat-ia" options={{ presentation: 'card', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="morning-briefing" options={{ presentation: 'card', animation: 'fade' }} />
        <Stack.Screen name="company-agency" options={{ presentation: 'card' }} />
        <Stack.Screen name="nora-history" options={{ presentation: 'card' }} />
        <Stack.Screen name="register" options={{ animation: 'none' }} />
      </Stack>
      <TeamActivityOverlay />
    </>
  );
}

export default function RootLayout() {
  // On native, no need for providers — WebView handles everything
  if (Platform.OS !== 'web') {
    return <NativeFullApp />;
  }

  return (
    <ThemeProvider>
      <I18nProvider>
        <DorsiBLEProvider>
          <AuthProvider>
            <PastelMistBackground />
            <RootNav />
          </AuthProvider>
        </DorsiBLEProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

function TeamActivityOverlay() {
  const { token, user } = useAuth();
  if (!token || !user) return null;
  return <TeamActivityToast token={token} />;
}

const st = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  locationGuideOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  locationGuideCard: {
    borderRadius: 18,
    backgroundColor: 'rgba(15,23,42,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    padding: 14,
  },
  locationGuideTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  locationGuideText: {
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 10,
  },
  locationGuideActions: {
    flexDirection: 'row',
    gap: 8,
  },
  locationGuideSecondaryBtn: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  locationGuideSecondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  locationGuidePrimaryBtn: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    backgroundColor: 'rgba(16,185,129,0.2)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  locationGuidePrimaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34D399',
  },
});
