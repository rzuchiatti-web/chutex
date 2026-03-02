import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { I18nProvider } from '../src/context/I18nContext';
import { View, ActivityIndicator, StyleSheet, Platform, Image } from 'react-native';
import { PastelMistBackground } from '../src/components/PastelMistBackground';

/**
 * On iOS: render the entire app as a single full-screen WebView
 * This ensures 100% parity with the web preview
 */
function NativeFullApp() {
  const WebView = require('react-native-webview').default;
  const { SafeAreaView } = require('react-native-safe-area-context');
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A1A' }}>
      <StatusBar style="light" translucent={true} />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A1A' }} edges={['top']}>
        <WebView
          source={{ uri: backendUrl }}
          style={{ flex: 1, backgroundColor: 'transparent' }}
          startInLoadingState={true}
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
      </SafeAreaView>
    </View>
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
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' }, animation: 'none' }}>
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
        <Stack.Screen name="programs" options={{ presentation: 'card' }} />
        <Stack.Screen name="program-detail" options={{ presentation: 'card' }} />
        <Stack.Screen name="chat-ia" options={{ presentation: 'card', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="morning-briefing" options={{ presentation: 'card', animation: 'fade' }} />
        <Stack.Screen name="nora-welcome" options={{ presentation: 'card', animation: 'fade' }} />
        <Stack.Screen name="company-agency" options={{ presentation: 'card' }} />
        <Stack.Screen name="register" options={{ animation: 'none' }} />
      </Stack>
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
        <AuthProvider>
          <PastelMistBackground />
          <RootNav />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}

const st = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
});
