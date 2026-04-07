import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import NativePageView from '../src/components/NativePageView';
import FullScreenLoader from '../src/components/FullScreenLoader';
import { useI18n } from '../src/context/I18nContext';

export default function AlertDétailScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const { alertId } = useLocalSearchParams<{ alertId: string }>();

  // Native: keep the native page view
  if (Platform.OS !== 'web') return <NativePageView path="/alert-detail" />;

  // Web: redirect to alerts tab with preselect param
  useEffect(() => {
    if (alertId) {
      router.replace({ pathname: '/(tabs)/alerts', params: { preselect: alertId } });
    }
  }, [alertId]);

  return <FullScreenLoader />;
}
