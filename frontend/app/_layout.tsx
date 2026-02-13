import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { View, ActivityIndicator, StyleSheet, Platform, ImageBackground } from 'react-native';

const BG_IMAGE = 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/tor5yp57_fond%20couleur%20pastelle.png';

function AppBackground({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  if (Platform.OS === 'web') {
    return (
      <div style={{ flex: 1, minHeight: '100vh', background: `url(${BG_IMAGE}) repeat`, backgroundSize: '600px 600px' }}>
        {children}
      </div>
    );
  }
  return <ImageBackground source={{ uri: BG_IMAGE }} style={{ flex: 1 }} resizeMode="repeat">{children}</ImageBackground>;
}

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
