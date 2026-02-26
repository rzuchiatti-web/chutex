import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <View style={st.root}>
      <StatusBar style="light" />
      <Text style={st.title}>Chutex Health</Text>
      <Text style={st.sub}>Build 41 — Diagnostic</Text>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b0f16' },
  title: { fontSize: 28, fontWeight: '700', color: '#FFF' },
  sub: { fontSize: 16, color: 'rgba(255,255,255,0.5)', marginTop: 8 },
});
