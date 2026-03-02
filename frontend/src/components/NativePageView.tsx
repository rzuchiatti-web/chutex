import React from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * On native (iOS), renders the web version of the current page in a WebView.
 * Includes SafeAreaView for proper status bar spacing.
 * On web, returns null (the web code renders directly).
 */
export default function NativePageView({ path, token }: { path: string; token?: string }) {
  if (Platform.OS === 'web') return null;

  const WebView = require('react-native-webview').default;
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
  const url = `${backendUrl}${path}`;

  // Inject token + onboarding flag into localStorage
  const injectJS = token ? `
    try {
      localStorage.setItem('chutex_token', '${token}');
      localStorage.setItem('chutex_onboarding_done', '1');
    } catch(e) {}
    true;
  ` : `
    try { localStorage.setItem('chutex_onboarding_done', '1'); } catch(e) {}
    true;
  `;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A1A' }} edges={['top']}>
      <View style={{ flex: 1, backgroundColor: '#0A0A1A' }}>
        <WebView
          source={{ uri: url }}
          injectedJavaScriptBeforeContentLoaded={injectJS}
          style={{ flex: 1, backgroundColor: 'transparent' }}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A1A' }}>
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
        />
      </View>
    </SafeAreaView>
  );
}
