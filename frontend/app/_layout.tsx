import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '../src/constants/colors';

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

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="health-detail" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="backoffice" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="intervention-detail" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="subscriber-detail" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="alert-detail" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="beneficiary-detail" options={{ headerShown: false, presentation: 'card' }} />
            <Stack.Screen name="link-code" options={{ headerShown: false, presentation: 'modal' }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </>
        )}}
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
