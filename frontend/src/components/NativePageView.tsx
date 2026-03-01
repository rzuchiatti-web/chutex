import React from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';

/**
 * On native (iOS), renders the web version of the current page in a WebView.
 * On web, returns null (the web code renders directly).
 * Usage: if (Platform.OS !== 'web') return <NativePageView path="/register" token={token} />;
 */
export default function NativePageView({ path, token }: { path: string; token?: string }) {
  if (Platform.OS === 'web') return null;

  const WebView = require('react-native-webview').default;
  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
  const url = `${backendUrl}${path}`;

  // Inject token into localStorage so the web app auto-authenticates
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
    <View style={{ flex: 1, backgroundColor: '#0A0A1A' }}>
      <WebView
        source={{ uri: url }}
        injectedJavaScriptBeforeContentLoaded={injectJS}
        style={{ flex: 1, backgroundColor: '#0A0A1A' }}
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
      />
    </View>
  );
}
