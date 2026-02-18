import React from 'react';
import { Platform, View } from 'react-native';

/* ─── Remix Icon mapping: app icon name → ri class ─── */
const REMIX_MAP: Record<string, string> = {
  'home-outline': 'ri-home-4-line',
  'heart-pulse': 'ri-heart-pulse-line',
  'notifications-outline': 'ri-notification-3-line',
  'notifications': 'ri-notification-3-fill',
  'alert-circle': 'ri-alarm-warning-line',
  'alert-circle-outline': 'ri-alarm-warning-line',
  'alarm-outline': 'ri-alarm-line',
  'warning-outline': 'ri-error-warning-line',
  'warning': 'ri-error-warning-fill',
  'chevron-forward': 'ri-arrow-right-s-line',
  'chevron-back': 'ri-arrow-left-s-line',
  'chevron-down': 'ri-arrow-down-s-line',
  'chevron-up': 'ri-arrow-up-s-line',
  'close': 'ri-close-line',
  'close-circle': 'ri-close-circle-line',
  'checkmark': 'ri-check-line',
  'checkmark-circle': 'ri-checkbox-circle-line',
  'checkmark-circle-outline': 'ri-checkbox-circle-line',
  'add': 'ri-add-line',
  'add-circle-outline': 'ri-add-circle-line',
  'person-outline': 'ri-user-line',
  'person': 'ri-user-fill',
  'person-circle': 'ri-account-circle-line',
  'person-add': 'ri-user-add-line',
  'person-add-outline': 'ri-user-add-line',
  'people-outline': 'ri-group-line',
  'people': 'ri-group-fill',
  'shield-checkmark': 'ri-shield-check-line',
  'shield-checkmark-outline': 'ri-shield-check-line',
  'shield-outline': 'ri-shield-line',
  'watch-outline': 'ri-time-line',
  'watch': 'ri-time-line',
  'medkit-outline': 'ri-first-aid-kit-line',
  'medkit': 'ri-first-aid-kit-fill',
  'medical': 'ri-hospital-line',
  'medical-outline': 'ri-hospital-line',
  'videocam-outline': 'ri-video-chat-line',
  'headset-outline': 'ri-headphone-line',
  'stats-chart-outline': 'ri-bar-chart-box-line',
  'document-text-outline': 'ri-file-text-line',
  'document-text': 'ri-file-text-fill',
  'business-outline': 'ri-building-line',
  'business': 'ri-building-fill',
  'briefcase-outline': 'ri-briefcase-line',
  'navigate': 'ri-map-pin-line',
  'navigate-outline': 'ri-navigation-line',
  'navigate-circle-outline': 'ri-compass-line',
  'bluetooth-connect': 'ri-bluetooth-connect-line',
  'bluetooth': 'ri-bluetooth-line',
  'bluetooth-off': 'ri-bluetooth-off-line',
  'share-outline': 'ri-share-line',
  'qr-code-outline': 'ri-qr-code-line',
  'call-outline': 'ri-phone-line',
  'call': 'ri-phone-fill',
  'keypad-outline': 'ri-keypad-line',
  'time': 'ri-time-line',
  'time-outline': 'ri-time-line',
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
  'pulse': 'ri-pulse-fill',
  'moon-outline': 'ri-moon-line',
  'moon': 'ri-moon-fill',
  'settings-outline': 'ri-settings-3-line',
  'log-out-outline': 'ri-logout-box-r-line',
  'information-circle-outline': 'ri-information-line',
  'information-circle': 'ri-information-fill',
  'help-circle-outline': 'ri-question-line',
  'map-marker-radius-outline': 'ri-map-pin-range-line',
  'trending-down': 'ri-arrow-down-line',
  'flame': 'ri-fire-line',
  'medal': 'ri-medal-line',
  'ribbon': 'ri-award-line',
  'heart-outline': 'ri-heart-line',
  'heart': 'ri-heart-fill',
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
  'mail': 'ri-mail-fill',
  'refresh-outline': 'ri-refresh-line',
  'refresh': 'ri-refresh-line',
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
  'location': 'ri-map-pin-fill',
  'location-outline': 'ri-map-pin-line',
  'flag': 'ri-flag-line',
  'send': 'ri-send-plane-fill',
  'radio': 'ri-radio-line',
  'git-branch': 'ri-git-branch-line',
  'hardware-chip': 'ri-cpu-line',
  'card-outline': 'ri-bank-card-line',
};

/* ─── Custom SVG icons (fill-based, provided by user) ─── */
const CUSTOM_FILL_SVGS: Record<string, string> = {
  'tab-home': 'M21 20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.48907C3 9.18048 3.14247 8.88917 3.38606 8.69972L11.3861 2.47749C11.7472 2.19663 12.2528 2.19663 12.6139 2.47749L20.6139 8.69972C20.8575 8.88917 21 9.18048 21 9.48907V20ZM19 19V9.97815L12 4.53371L5 9.97815V19H19Z',
  'tab-intervention': 'M9.97487 8.97487C11.3417 7.60804 11.3417 5.39196 9.97487 4.02513C8.60804 2.65829 6.39196 2.65829 5.02513 4.02513C3.65829 5.39196 3.65829 7.60804 5.02513 8.97487L7.5 11.4497L9.97487 8.97487ZM7.5 14.2782L3.61091 10.3891C1.46303 8.2412 1.46303 4.7588 3.61091 2.61091C5.7588 0.463029 9.2412 0.463029 11.3891 2.61091C13.537 4.7588 13.537 8.2412 11.3891 10.3891L7.5 14.2782ZM7.5 8C6.67157 8 6 7.32843 6 6.5C6 5.67157 6.67157 5 7.5 5C8.32843 5 9 5.67157 9 6.5C9 7.32843 8.32843 8 7.5 8ZM16.5 20.4497L18.9749 17.9749C20.3417 16.608 20.3417 14.392 18.9749 13.0251C17.608 11.6583 15.392 11.6583 14.0251 13.0251C12.6583 14.392 12.6583 16.608 14.0251 17.9749L16.5 20.4497ZM20.3891 19.3891L16.5 23.2782L12.6109 19.3891C10.463 17.2412 10.463 13.7588 12.6109 11.6109C14.7588 9.46303 18.2412 9.46303 20.3891 11.6109C22.537 13.7588 22.537 17.2412 20.3891 19.3891ZM16.5 17C15.6716 17 15 16.3284 15 15.5C15 14.6716 15.6716 14 16.5 14C17.3284 14 18 14.6716 18 15.5C18 16.3284 17.3284 17 16.5 17Z',
  'tab-subscription': 'M19.0001 14V17H22.0001V19H18.9991L19.0001 22H17.0001L16.9991 19H14.0001V17H17.0001V14H19.0001ZM20.2426 4.75748C22.505 7.02453 22.5829 10.6361 20.4795 12.9921L19.06 11.5741C20.3901 10.05 20.3201 7.66 18.827 6.17022C17.3244 4.67104 14.9076 4.60713 13.337 6.017L12.0019 7.21536L10.6661 6.01793C9.09098 4.60609 6.67506 4.66821 5.17157 6.1717C3.68183 7.66143 3.60704 10.0474 4.97993 11.6233L13.412 20.0691L11.9999 21.4851L3.52138 12.9931C1.41705 10.6371 1.49571 7.01913 3.75736 4.75748C6.02157 2.49327 9.64519 2.41699 12.001 4.52865C14.35 2.42012 17.98 2.49012 20.2426 4.75748Z',
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

  // Custom fill-based SVGs (tab bar icons)
  const fillPath = CUSTOM_FILL_SVGS[name];
  if (fillPath) {
    return (
      <View style={[{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }, style]}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
          <path d={fillPath} />
        </svg>
      </View>
    );
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
