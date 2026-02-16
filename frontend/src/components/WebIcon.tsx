import React from 'react';
import { Text, Platform } from 'react-native';

// Web: Unicode emoji icons (always render perfectly)
// Native: Ionicons (render correctly on native)
const ICON_MAP: Record<string, string> = {
  'home-outline': '🏠',
  'home': '🏠',
  'heart-pulse': '💓',
  'heart': '❤️',
  'notifications-outline': '🔔',
  'alert-circle': '🚨',
  'alert-circle-outline': '🚨',
  'warning-outline': '⚠️',
  'warning': '⚠️',
  'chevron-forward': '›',
  'chevron-back': '‹',
  'chevron-down': '⌄',
  'close': '✕',
  'checkmark': '✓',
  'checkmark-circle': '✅',
  'checkmark-done-outline': '✅',
  'add-circle-outline': '+',
  'person-outline': '👤',
  'person': '👤',
  'person-add': '👤+',
  'people-outline': '👥',
  'people': '👥',
  'shield-checkmark': '🛡️',
  'shield-outline': '🛡️',
  'watch-outline': '⌚',
  'bluetooth-connect': '📶',
  'medkit-outline': '🏥',
  'medkit': '🏥',
  'videocam-outline': '📹',
  'videocam': '📹',
  'headset-outline': '🎧',
  'stats-chart-outline': '📊',
  'document-text-outline': '📄',
  'document-text': '📄',
  'business-outline': '🏢',
  'business': '🏢',
  'map-marker-radius-outline': '📍',
  'navigate': '📍',
  'share-outline': '↗',
  'qr-code-outline': '⬜',
  'call-outline': '📞',
  'keypad-outline': '🔢',
  'time': '🕐',
  'timer-outline': '⏱️',
  'hourglass-outline': '⏳',
  'trophy': '🏆',
  'sparkles': '✨',
  'battery-dead': '🪫',
  'lock-closed': '🔒',
  'finger-print': '👆',
  'notifications': '🔔',
  'analytics': '📈',
  'pulse-outline': '💓',
  'moon-outline': '🌙',
  'fitness-outline': '🏃',
  'thermometer-outline': '🌡️',
  'water-outline': '💧',
  'cafe-outline': '☕',
  'restaurant-outline': '🍽️',
  'settings-outline': '⚙️',
  'log-out-outline': '🚪',
  'sunny-outline': '☀️',
  'moon': '🌙',
  'trending-down': '📉',
  'trending-up': '📈',
  'location-outline': '📍',
  'ellipsis-horizontal': '···',
  'star': '⭐',
  'star-outline': '☆',
  'information-circle-outline': 'ℹ️',
  'help-circle-outline': '❓',
};

interface WebIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

export function Icon({ name, size = 20, color = '#1A1D21', style }: WebIconProps) {
  if (Platform.OS !== 'web') {
    // On native, use real Ionicons
    const { Ionicons } = require('@expo/vector-icons');
    return <Ionicons name={name} size={size} color={color} style={style} />;
  }

  const emoji = ICON_MAP[name] || '•';
  const isSymbol = emoji.length === 1 && !emoji.match(/[\u{1F000}-\u{1FFFF}]/u);

  return (
    <Text style={[{
      fontSize: isSymbol ? size * 1.2 : size * 0.85,
      lineHeight: size * 1.3,
      color: isSymbol ? color : undefined,
      textAlign: 'center',
      width: size,
      height: size,
    }, style]}>
      {emoji}
    </Text>
  );
}

// MaterialCommunityIcons replacement
export function MCIcon({ name, size = 20, color = '#1A1D21', style }: WebIconProps) {
  if (Platform.OS !== 'web') {
    const { MaterialCommunityIcons } = require('@expo/vector-icons');
    return <MaterialCommunityIcons name={name} size={size} color={color} style={style} />;
  }
  return <Icon name={name} size={size} color={color} style={style} />;
}
