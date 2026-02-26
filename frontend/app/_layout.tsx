import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Error Boundary to catch JS errors and display them instead of crashing
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string; stack: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: '', stack: '' };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: String(error), stack: error?.stack || '' };
  }
  componentDidCatch(error: any, info: any) {
    console.error('ErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={eb.root}>
          <StatusBar style="light" />
          <Text style={eb.title}>Erreur attrapee</Text>
          <Text style={eb.label}>Build 42 — Error Boundary</Text>
          <ScrollView style={eb.scroll}>
            <Text style={eb.err}>{this.state.error}</Text>
            <Text style={eb.stack}>{this.state.stack}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const eb = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1a0000', paddingTop: 60, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#ff6b6b' },
  label: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 20 },
  scroll: { flex: 1 },
  err: { fontSize: 16, color: '#FFF', marginBottom: 12, fontWeight: '600' },
  stack: { fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 16 },
});

// ─── Now import the real app ───
import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { I18nProvider } from '../src/context/I18nContext';
import { ActivityIndicator } from 'react-native';
import { PastelMistBackground } from '../src/components/PastelMistBackground';

function RootNav() {
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
        </Stack>
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FFFFFF' }, animation: 'none' }}>
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
        <Stack.Screen name="register" options={{ animation: 'none' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <PastelMistBackground />
            <RootNav />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const st = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
});
