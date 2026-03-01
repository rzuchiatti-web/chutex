import React from 'react';
import { View, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import NoraPresentationStep from '../src/components/register/NoraPresentationStep';
import NativePageView from '../src/components/NativePageView';

export default function NoraWelcomeScreen() {
  const router = useRouter();
  const { user, token } = useAuth();

  if (Platform.OS !== 'web') return <NativePageView path="/nora-welcome" />;

  const role = user?.role || 'beneficiary';
  const name = user?.name || '';

  return (
    <NoraPresentationStep
      role={role}
      userName={name}
      onContinue={() => {
        // Mark that Nora welcome has been seen
        apiFetch('/api/auth/update-profile', { method: 'PUT', body: JSON.stringify({ nora_welcome_seen: true }) }, token).catch(() => {});
        sessionStorage.setItem('briefing_seen', '1');
        sessionStorage.setItem('nora_welcome_done', '1');
        router.replace('/(tabs)' as any);
      }}
    />
  );
}
