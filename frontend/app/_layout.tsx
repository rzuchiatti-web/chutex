import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../src/constants/colors';
import { Redirect } from 'expo-router';

function RootNav() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={st.loading}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
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
        <Stack.Screen name="link-code" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNav />
    </AuthProvider>
  );
}

const st = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
});
