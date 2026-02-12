// CHUTEX Design System - Futuristic Clinical Theme
// Inspired by Whoop + Withings + Premium Medical Devices

export const LightTheme = {
  background: '#F0F4F8',
  surface: '#FFFFFF',
  surfaceHighlight: '#F7F9FC',
  surfaceGlass: 'rgba(255, 255, 255, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.35)',

  textPrimary: '#0B1426',
  textSecondary: '#4A5568',
  textMuted: '#8896AB',

  primary: '#0891B2',
  primaryDark: '#0E7490',
  primaryLight: '#E0F7FA',
  primaryGlow: 'rgba(8, 145, 178, 0.15)',

  accent: '#06D6A0',
  accentDark: '#05B384',
  accentLight: '#D1FAE5',

  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  dangerGlow: 'rgba(239, 68, 68, 0.20)',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  success: '#10B981',
  successLight: '#D1FAE5',

  info: '#3B82F6',
  infoLight: '#DBEAFE',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  care: '#7C3AED',
  careLight: '#EDE9FE',
  standard: '#0891B2',

  tabBar: '#FFFFFF',
  tabBarBorder: '#E2E8F0',

  cardShadow: 'rgba(0, 0, 0, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.5)',

  skeleton: '#E8EDF2',

  // Backward-compatible aliases
  subtle: '#F7F9FC',
  paper: '#FFFFFF',
  elevated: '#FFFFFF',
  card: '#FFFFFF',
  destructive: '#EF4444',
  destructiveLight: '#FEE2E2',
  text: '#0B1426',
  textPrimary: '#0B1426',
  secondary: '#E2E8F0',
  secondaryDark: '#CBD5E1',
  accent: '#06D6A0',
  accentLight: '#D1FAE5',
};

export const DarkTheme = {
  background: '#0B1120',
  surface: '#151F32',
  surfaceHighlight: '#1C2940',
  surfaceGlass: 'rgba(21, 31, 50, 0.80)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',

  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#5A6B82',

  primary: '#22D3EE',
  primaryDark: '#06B6D4',
  primaryLight: '#164E63',
  primaryGlow: 'rgba(34, 211, 238, 0.15)',

  accent: '#34D399',
  accentDark: '#10B981',
  accentLight: '#064E3B',

  danger: '#F87171',
  dangerLight: '#450A0A',
  dangerGlow: 'rgba(248, 113, 113, 0.20)',

  warning: '#FBBF24',
  warningLight: '#451A03',

  success: '#34D399',
  successLight: '#064E3B',

  info: '#60A5FA',
  infoLight: '#172554',

  border: '#1E2D45',
  borderLight: '#1A2538',

  care: '#A78BFA',
  careLight: '#2E1065',
  standard: '#22D3EE',

  tabBar: '#0F1929',
  tabBarBorder: '#1A2538',

  cardShadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',

  skeleton: '#1C2940',

  // Backward-compatible aliases
  subtle: '#1C2940',
  paper: '#151F32',
  elevated: '#1C2940',
  card: '#151F32',
  destructive: '#F87171',
  destructiveLight: '#450A0A',
  text: '#F1F5F9',
  textPrimary: '#F1F5F9',
  secondary: '#1E293B',
  secondaryDark: '#334155',
  accent: '#34D399',
  accentLight: '#064E3B',
};

export type ThemeColors = typeof LightTheme;

// Legacy export for backward compatibility during migration
export const Colors = LightTheme;
