import React, { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { I18nProvider } from '../src/context/I18nContext';
import { DorsiBLEProvider } from '../src/context/DorsiBLEContext';
import { View, ActivityIndicator, StyleSheet, Platform, Text, TouchableOpacity, Animated } from 'react-native';
import { PastelMistBackground } from '../src/components/PastelMistBackground';
import { ensureFirstLaunchLocationPermission, openSystemLocationSettings, requestLocationPermission } from '../src/services/locationPermissions';
import TeamActivityToast from '../src/components/programs/TeamActivityToast';

/**
 * On iOS: render the entire app as a single full-screen WebView.
 * BLE V8 protocol is handled natively via bleV8Bridge module.
 */
function NativeFullApp() {
  const WebView = require('react-native-webview').default;
  const { PermissionsAndroid } = require('react-native');
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
  const webViewRef = useRef<any>(null);
  const [showLocationGuide, setShowLocationGuide] = useState(false);
  const [locationGuideMsg, setLocationGuideMsg] = useState('');
  const [locationRetrying, setLocationRetrying] = useState(false);
  const [webViewReady, setWebViewReady] = useState(false);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const autoReconnectAttempted = useRef(false);

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

  // ── BLE refs (persistent across renders) ──
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

  // ── Auto-reconnect BLE on app start ──
  const attemptAutoReconnect = () => {
    if (autoReconnectAttempted.current || bleDeviceRef.current) return;
    autoReconnectAttempted.current = true;

    // Inject JS into WebView to check if user has a paired bracelet
    webViewRef.current?.injectJavaScript(`
      (function(){
        var t = localStorage.getItem('vl_token') || localStorage.getItem('@AsyncStorage:vl_token') || '';
        if(!t) return;
        fetch('/api/bracelet/status',{headers:{'Authorization':'Bearer '+t}})
          .then(function(r){return r.json()})
          .then(function(d){
            if(d && d.paired && d.connected !== false){
              window.ReactNativeWebView.postMessage(JSON.stringify({action:'ble_auto_reconnect'}));
            }
          }).catch(function(){});
      })(); true;
    `);
  };

  // ── Handle WebView loaded: fade out native splash + trigger auto-reconnect ──
  const onWebViewLoaded = () => {
    // Fade out the native splash overlay
    Animated.timing(splashOpacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => setWebViewReady(true));

    // Attempt BLE auto-reconnect after a short delay
    setTimeout(attemptAutoReconnect, 3000);
  };

  // ── WebView message handler ──
  const handleMessage = async (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);

      // Handle vibration command from webview
      if (msg.action === 'ble_vibrate' && bleDeviceRef.current) {
        const { writeToDevice, V8_CMD } = require('../src/services/bleV8Bridge');
        writeToDevice(bleDeviceRef.current, V8_CMD.VIBRATE, msg.payload || [3]);
        return;
      }

      if (msg.action === 'get_token') return;

      // Handle BLE auto-reconnect request
      if (msg.action === 'ble_auto_reconnect') {
        const manager = getBleManager();
        if (manager && !bleDeviceRef.current) {
          const { scanAndConnect } = require('../src/services/bleV8Bridge');
          scanAndConnect(manager, 'bracelet', webViewRef, bleDeviceRef, blePollRef);
        }
        return;
      }

      // Handle BLE scan requests
      if (msg.action === 'ble_scan_bracelet' || msg.action === 'ble_scan_vest' || msg.action === 'ble_scan_scale') {
        const deviceType = msg.action === 'ble_scan_bracelet' ? 'bracelet'
          : msg.action === 'ble_scan_scale' ? 'scale' : 'vest';

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
          webViewRef.current?.injectJavaScript(
            `window.dispatchEvent(new CustomEvent('ble_result',{detail:{error:'BLE non disponible'}}));true;`
          );
          return;
        }

        // Delegate to BLE bridge module
        const { scanAndConnect } = require('../src/services/bleV8Bridge');
        scanAndConnect(manager, deviceType, webViewRef, bleDeviceRef, blePollRef);
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
          onMessage={handleMessage}
          onLoadEnd={onWebViewLoaded}
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
          cacheEnabled={true}
        />

        {/* Native splash overlay — dark screen until WebView is ready (eliminates white/black loader flash) */}
        {!webViewReady && (
          <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0A0A1A', justifyContent: 'center', alignItems: 'center', opacity: splashOpacity }} pointerEvents="none">
            <Text style={{ fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.6)' }}>Chargement...</Text>
          </Animated.View>
        )}

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
        <Stack.Screen name="weighing-report" options={{ presentation: 'card' }} />
      </Stack>
      <TeamActivityOverlay />
    </>
  );
}

export default function RootLayout() {
  if (Platform.OS !== 'web') {
    return <NativeFullApp />;
  }

  return (
    <ThemeProvider>
      <I18nProvider>
        <DorsiBLEProvider>
          <AuthProvider>
            {/* Global iOS Safe Area CSS injection — ensures 70px top padding on all full-screen overlays */}
            {Platform.OS === 'web' && typeof document !== 'undefined' && (
              <SafeAreaCSSInjector />
            )}
            <PastelMistBackground />
            <RootNav />
          </AuthProvider>
        </DorsiBLEProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

function SafeAreaCSSInjector() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const id = 'chutex-safe-area-css';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      :root { --safe-top: 70px; }
    `;
    document.head.appendChild(style);
  }, []);
  return null;
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
