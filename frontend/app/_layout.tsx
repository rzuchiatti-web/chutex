import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

function RootNav() {
  const { user, loading } = useAuth();
  const { colors, isDark } = useTheme();

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
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
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
