import React from 'react';
import { View, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import NoraPresentationStep from '../src/components/register/NoraPresentationStep';

export default function NoraWelcomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  if (Platform.OS !== 'web') return <View style={{ flex: 1, backgroundColor: '#000' }}><Text style={{ color: '#FFF' }}>Nora</Text></View>;

  const role = user?.role || 'beneficiary';
  const name = user?.name || '';

  return (
    <NoraPresentationStep
      role={role}
      userName={name}
      onContinue={() => {
        sessionStorage.setItem('briefing_seen', '1');
        sessionStorage.setItem('nora_welcome_done', '1');
        router.replace('/(tabs)' as any);
      }}
    />
  );
}
