import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';

const BG_IMAGE = 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/tor5yp57_fond%20couleur%20pastelle.png';

function useWebBackground() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.body.style.background = `url(${BG_IMAGE}) repeat`;
      document.body.style.backgroundSize = '600px 600px';
      document.body.style.minHeight = '100vh';
    }
  }, []);
}

function RootNav() {
  const { user, loading } = useAuth();
  const { colors, isDark } = useTheme();
  useWebBackground();

  if (loading) {
    return (
      <View style={[st.loading, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="index" />
        </Stack>
      </>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
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
        </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNav />
      </AuthProvider>
    </ThemeProvider>
  );
}

const st = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
