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

  const handleMessage = async (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.action === 'ble_scan_bracelet' || msg.action === 'ble_scan_vest') {
        const isBracelet = msg.action === 'ble_scan_bracelet';
        // Request permissions on Android
        if (Platform.OS === 'android') {
          try {
            await PermissionsAndroid.requestMultiple([
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ]);
          } catch {}
        }
        // Import BLE
        let BleManager: any;
        try { BleManager = require('react-native-ble-plx').BleManager; } catch { 
          webViewRef.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('ble_result',{detail:{error:'BLE non disponible sur cet appareil'}}));true;`);
          return;
        }
        const manager = new BleManager();
        let found = false;
        const nameFilter = isBracelet ? ['2208', 'J22', 'JStyle', 'Elio'] : ['Elder', 'AIRBAG', 'Gilet', 'Airbag'];
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
            } catch (e: any) {
              webViewRef.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('ble_result',{detail:{error:'Connexion echouee: ${(e.message || '').replace(/'/g, '')}'}}));true;`);
            }
          }
        });
        // Timeout 20s
        setTimeout(() => {
          if (!found) {
            manager.stopDeviceScan();
            webViewRef.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('ble_result',{detail:{error:'Appareil non trouve. Verifiez qu\\'il est allume et a proximite.'}}));true;`);
          }
        }, 20000);
      }
    } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A1A' }}>
      <StatusBar style="light" translucent={true} />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A1A' }} edges={['top']}>
        <WebView
          ref={webViewRef}
          source={{ uri: backendUrl }}
          style={{ flex: 1, backgroundColor: 'transparent' }}
          startInLoadingState={true}
          onMessage={handleMessage}
          renderLoading={() => (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
              <Image
                source={{ uri: 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/Logo_chutex_1.png?v=1737551429' }}
                style={{ width: 120, height: 40, resizeMode: 'contain', marginBottom: 20 }}
              />
              <ActivityIndicator size="large" color="#A78BFA" />
            </View>
          )}
          allowsBackForwardNavigationGestures={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          sharedCookiesEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          scrollEnabled={true}
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
      </SafeAreaView>
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
        <Stack.Screen name="geofencing" options={{ presentation: 'card' }} />
        <Stack.Screen name="vest-connect" options={{ presentation: 'card' }} />
        <Stack.Screen name="sleep" options={{ presentation: 'card' }} />
        <Stack.Screen name="bracelet-connect" options={{ presentation: 'card' }} />
        <Stack.Screen name="subscription" options={{ presentation: 'card' }} />
        <Stack.Screen name="link-code" options={{ presentation: 'modal' }} />
        <Stack.Screen name="guardian-detail" options={{ presentation: 'card' }} />
        <Stack.Screen name="edit-thresholds" options={{ presentation: 'card' }} />
        <Stack.Screen name="activate-beneficiary" options={{ presentation: 'card' }} />
        <Stack.Screen name="activate-guardian" options={{ presentation: 'card' }} />
        <Stack.Screen name="program-detail" options={{ presentation: 'card' }} />
        <Stack.Screen name="minceur" options={{ presentation: 'card' }} />
        <Stack.Screen name="chat-ia" options={{ presentation: 'card', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="morning-briefing" options={{ presentation: 'card', animation: 'fade' }} />
        <Stack.Screen name="company-agency" options={{ presentation: 'card' }} />
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
