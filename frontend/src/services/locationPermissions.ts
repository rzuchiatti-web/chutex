import { Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const LOCATION_PERMISSION_STATE_KEY = 'chutex_location_permission_state_v1';

type PermissionState = 'unknown' | 'granted' | 'denied';

type PermissionResult = {
  granted: boolean;
  status: PermissionState | 'blocked' | 'unavailable';
  message: string;
  source: 'native' | 'web';
};

const readWebState = (): PermissionState => {
  if (typeof window === 'undefined') return 'unknown';
  const state = window.localStorage.getItem(LOCATION_PERMISSION_STATE_KEY);
  if (state === 'granted' || state === 'denied') return state;
  return 'unknown';
};

const writeWebState = (state: PermissionState) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCATION_PERMISSION_STATE_KEY, state);
};

const readNativeState = async (): Promise<PermissionState> => {
  const state = await AsyncStorage.getItem(LOCATION_PERMISSION_STATE_KEY);
  if (state === 'granted' || state === 'denied') return state;
  return 'unknown';
};

const writeNativeState = async (state: PermissionState) => {
  await AsyncStorage.setItem(LOCATION_PERMISSION_STATE_KEY, state);
};

export const getStoredLocationPermissionState = async (): Promise<PermissionState> => {
  if (Platform.OS === 'web') return readWebState();
  return readNativeState();
};

const requestWebLocationPermission = async (): Promise<PermissionResult> => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    writeWebState('denied');
    return {
      granted: false,
      status: 'unavailable',
      message: 'La geolocalisation n est pas disponible sur ce navigateur.',
      source: 'web',
    };
  }

  try {
    await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      });
    });
    writeWebState('granted');
    return {
      granted: true,
      status: 'granted',
      message: 'Localisation activee.',
      source: 'web',
    };
  } catch {
    writeWebState('denied');
    return {
      granted: false,
      status: 'denied',
      message: 'Autorisation refusee. Activez la localisation dans les reglages du navigateur.',
      source: 'web',
    };
  }
};

const requestNativeLocationPermission = async (): Promise<PermissionResult> => {
  try {
    const foreground = await Location.requestForegroundPermissionsAsync();
    if (foreground.status !== 'granted') {
      await writeNativeState('denied');
      return {
        granted: false,
        status: 'denied',
        message: 'Autorisez la localisation pour suivre les safe zones.',
        source: 'native',
      };
    }

    const background = await Location.requestBackgroundPermissionsAsync();
    if (background.status !== 'granted') {
      await writeNativeState('denied');
      return {
        granted: false,
        status: 'denied',
        message: 'Choisissez "Toujours" pour une protection continue des safe zones.',
        source: 'native',
      };
    }

    await writeNativeState('granted');
    return {
      granted: true,
      status: 'granted',
      message: 'Localisation toujours activee.',
      source: 'native',
    };
  } catch {
    await writeNativeState('denied');
    return {
      granted: false,
      status: 'blocked',
      message: 'Impossible de demander la localisation. Ouvrez les reglages de l app.',
      source: 'native',
    };
  }
};

export const requestLocationPermission = async (): Promise<PermissionResult> => {
  if (Platform.OS === 'web') return requestWebLocationPermission();
  return requestNativeLocationPermission();
};

export const ensureFirstLaunchLocationPermission = async (): Promise<PermissionResult> => {
  const state = await getStoredLocationPermissionState();
  if (state === 'granted') {
    return {
      granted: true,
      status: 'granted',
      message: 'Localisation deja activee.',
      source: Platform.OS === 'web' ? 'web' : 'native',
    };
  }

  if (state === 'denied') {
    return {
      granted: false,
      status: 'denied',
      message: 'Localisation desactivee. Activez-la dans les reglages.',
      source: Platform.OS === 'web' ? 'web' : 'native',
    };
  }

  return requestLocationPermission();
};

export const openSystemLocationSettings = async () => {
  if (Platform.OS !== 'web') {
    await Linking.openSettings();
    return;
  }

  if (typeof window !== 'undefined') {
    window.open('https://support.google.com/chrome/answer/142065', '_blank', 'noopener,noreferrer');
  }
};
