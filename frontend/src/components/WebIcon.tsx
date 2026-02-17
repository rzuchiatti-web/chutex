import React from 'react';
import { Platform, View } from 'react-native';

/* ─── Remix Icon mapping: app icon name → ri class ─── */
const REMIX_MAP: Record<string, string> = {
  'home-outline': 'ri-home-4-line',
  'heart-pulse': 'ri-heart-pulse-line',
  'notifications-outline': 'ri-notification-3-line',
  'notifications': 'ri-notification-3-fill',
  'alert-circle': 'ri-alarm-warning-line',
  'warning-outline': 'ri-error-warning-line',
  'warning': 'ri-error-warning-fill',
  'chevron-forward': 'ri-arrow-right-s-line',
  'chevron-back': 'ri-arrow-left-s-line',
  'chevron-down': 'ri-arrow-down-s-line',
  'close': 'ri-close-line',
  'checkmark': 'ri-check-line',
  'checkmark-circle': 'ri-checkbox-circle-line',
  'add-circle-outline': 'ri-add-circle-line',
  'person-outline': 'ri-user-line',
  'person': 'ri-user-fill',
  'people-outline': 'ri-group-line',
  'shield-checkmark': 'ri-shield-check-line',
  'shield-outline': 'ri-shield-line',
  'watch-outline': 'ri-time-line',
  'medkit-outline': 'ri-first-aid-kit-line',
  'videocam-outline': 'ri-video-chat-line',
  'headset-outline': 'ri-headphone-line',
  'stats-chart-outline': 'ri-bar-chart-box-line',
  'document-text-outline': 'ri-file-text-line',
  'business-outline': 'ri-building-line',
  'navigate': 'ri-map-pin-line',
  'bluetooth-connect': 'ri-bluetooth-connect-line',
  'bluetooth': 'ri-bluetooth-line',
  'share-outline': 'ri-share-line',
  'qr-code-outline': 'ri-qr-code-line',
  'call-outline': 'ri-phone-line',
  'keypad-outline': 'ri-keypad-line',
  'time': 'ri-time-line',
  'timer-outline': 'ri-timer-line',
  'hourglass-outline': 'ri-hourglass-line',
  'trophy': 'ri-trophy-line',
  'sparkles': 'ri-magic-line',
  'battery-dead': 'ri-battery-line',
  'battery-full': 'ri-battery-fill',
  'battery-half': 'ri-battery-low-line',
  'lock-closed': 'ri-lock-line',
  'finger-print': 'ri-fingerprint-line',
  'analytics': 'ri-line-chart-line',
  'pulse-outline': 'ri-pulse-line',
  'moon-outline': 'ri-moon-line',
  'settings-outline': 'ri-settings-3-line',
  'log-out-outline': 'ri-logout-box-r-line',
  'information-circle-outline': 'ri-information-line',
  'help-circle-outline': 'ri-question-line',
  'map-marker-radius-outline': 'ri-map-pin-range-line',
  'trending-down': 'ri-arrow-down-line',
  'person-add': 'ri-user-add-line',
  'flame': 'ri-fire-line',
  'medal': 'ri-medal-line',
  'ribbon': 'ri-award-line',
  'heart-outline': 'ri-heart-line',
  'locate-outline': 'ri-focus-3-line',
  'water-outline': 'ri-drop-line',
  'thermometer-outline': 'ri-temp-hot-line',
  'scale-outline': 'ri-scales-3-line',
  'book-outline': 'ri-book-open-line',
  'gift-outline': 'ri-gift-line',
  'sun-outline': 'ri-sun-line',
  'eye-outline': 'ri-eye-line',
  'eye-off-outline': 'ri-eye-off-line',
  'mail-outline': 'ri-mail-line',
  'refresh-outline': 'ri-refresh-line',
  'arrow-back': 'ri-arrow-left-line',
  'arrow-forward': 'ri-arrow-right-line',
  'search-outline': 'ri-search-line',
  'filter-outline': 'ri-filter-line',
  'camera-outline': 'ri-camera-line',
  'image-outline': 'ri-image-line',
  'download-outline': 'ri-download-line',
  'upload-outline': 'ri-upload-line',
  'star-outline': 'ri-star-line',
  'star': 'ri-star-fill',
  'clipboard-outline': 'ri-clipboard-line',
  'create-outline': 'ri-edit-line',
  'trash-outline': 'ri-delete-bin-line',
  'map-outline': 'ri-map-2-line',
  'calendar-outline': 'ri-calendar-line',
  'alert-circle-outline': 'ri-alarm-warning-line',
  'heart': 'ri-heart-fill',
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

export function Icon({ name, size = 20, color = '#1A1D21', style }: IconProps) {
  if (Platform.OS !== 'web') {
    const { Ionicons } = require('@expo/vector-icons');
    return <Ionicons name={name} size={size} color={color} style={style} />;
  }

  const riClass = REMIX_MAP[name];
  if (riClass) {
    return (
      <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
        <i className={riClass} style={{ fontSize: size, lineHeight: 1, color }} />
      </View>
    );
  }

  return <View style={[{ width: size, height: size }, style]} />;
}

export function MCIcon({ name, size = 20, color = '#1A1D21', style }: IconProps) {
  if (Platform.OS !== 'web') {
    const { MaterialCommunityIcons } = require('@expo/vector-icons');
    return <MaterialCommunityIcons name={name} size={size} color={color} style={style} />;
  }

  const mcMap: Record<string, string> = {
    'heart-pulse': 'ri-heart-pulse-line',
    'watch': 'ri-time-line',
    'scale-bathroom': 'ri-scales-3-line',
    'tshirt-crew': 'ri-t-shirt-line',
    'bluetooth-connect': 'ri-bluetooth-connect-line',
    'map-marker-radius-outline': 'ri-map-pin-range-line',
  };

  const riClass = mcMap[name] || REMIX_MAP[name];
  if (riClass) {
    return (
      <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
        <i className={riClass} style={{ fontSize: size, lineHeight: 1, color }} />
      </View>
    );
  }

  return <View style={[{ width: size, height: size }, style]} />;
}

/* ─── Direct Remix Icon component ─── */
export function RiIcon({ name, size = 20, color = '#1A1D21', style }: IconProps) {
  if (Platform.OS !== 'web') {
    return <View style={[{ width: size, height: size }, style]} />;
  }
  return (
    <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
      <i className={name} style={{ fontSize: size, lineHeight: 1, color }} />
    </View>
  );
}
