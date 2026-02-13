// CHUTEX Design System - Black & White Glassmorphism
// Premium medical aesthetic - NO blue/cyan

export const LightTheme = {
  background: '#F5F0EB',
  backgroundGradientStart: '#F5F0EB',
  backgroundGradientMid: '#F0E6F6',
  backgroundGradientEnd: '#E8EDF5',

  surface: 'rgba(255, 255, 255, 0.65)',
  surfaceHighlight: 'rgba(255, 255, 255, 0.45)',
  surfaceGlass: 'rgba(255, 255, 255, 0.55)',
  glassBorder: 'rgba(255, 255, 255, 0.8)',

  textPrimary: '#000000',
  textSecondary: '#333333',
  textMuted: '#888888',

  primary: '#000000',
  primaryDark: '#000000',
  primaryLight: '#F5F5F5',
  primaryGlow: 'rgba(0, 0, 0, 0.06)',

  accent: '#4CAF50',
  accentDark: '#388E3C',
  accentLight: '#C8E6C9',

  danger: '#E53935',
  dangerLight: '#FFEBEE',
  dangerGlow: 'rgba(229, 57, 53, 0.12)',

  warning: '#FF9800',
  warningLight: '#FFF3E0',

  success: '#4CAF50',
  successLight: '#E8F5E9',
  successBadge: '#C8E6C9',

  info: '#000000',
  infoLight: '#F5F5F5',

  border: 'rgba(0, 0, 0, 0.08)',
  borderLight: 'rgba(0, 0, 0, 0.04)',

  care: '#000000',
  careLight: '#F5F5F5',
  standard: '#000000',

  tabBar: 'rgba(255, 255, 255, 0.85)',
  tabBarBorder: 'rgba(0, 0, 0, 0.06)',

  cardShadow: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.5)',

  skeleton: '#E8E8E8',

  // Backward-compatible aliases
  subtle: 'rgba(255, 255, 255, 0.55)',
  paper: '#FFFFFF',
  elevated: '#FFFFFF',
  card: 'rgba(255, 255, 255, 0.65)',
  destructive: '#E53935',
  destructiveLight: '#FFEBEE',
  text: '#000000',
  secondary: '#F5F5F5',
  secondaryDark: '#E0E0E0',
  accentLight2: '#E8F5E9',
};

export const DarkTheme = {
  background: '#0A0A0A',
  backgroundGradientStart: '#0A0A0A',
  backgroundGradientMid: '#121212',
  backgroundGradientEnd: '#0A0A0A',

  surface: 'rgba(30, 30, 30, 0.75)',
  surfaceHighlight: 'rgba(40, 40, 40, 0.6)',
  surfaceGlass: 'rgba(30, 30, 30, 0.65)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',

  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textMuted: '#777777',

  primary: '#FFFFFF',
  primaryDark: '#E0E0E0',
  primaryLight: '#1A1A1A',
  primaryGlow: 'rgba(255, 255, 255, 0.08)',

  accent: '#66BB6A',
  accentDark: '#4CAF50',
  accentLight: '#1B5E20',

  danger: '#EF5350',
  dangerLight: '#3E1A1A',
  dangerGlow: 'rgba(239, 83, 80, 0.15)',

  warning: '#FFA726',
  warningLight: '#3E2A0A',

  success: '#66BB6A',
  successLight: '#1B5E20',
  successBadge: '#1B5E20',

  info: '#FFFFFF',
  infoLight: '#1A1A1A',

  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.04)',

  care: '#FFFFFF',
  careLight: '#1A1A1A',
  standard: '#FFFFFF',

  tabBar: 'rgba(15, 15, 15, 0.9)',
  tabBarBorder: 'rgba(255, 255, 255, 0.06)',

  cardShadow: 'rgba(0, 0, 0, 0.4)',
  overlay: 'rgba(0, 0, 0, 0.7)',

  skeleton: '#1A1A1A',

  // Backward-compatible aliases
  subtle: 'rgba(30, 30, 30, 0.65)',
  paper: '#1A1A1A',
  elevated: '#1E1E1E',
  card: 'rgba(30, 30, 30, 0.75)',
  destructive: '#EF5350',
  destructiveLight: '#3E1A1A',
  text: '#FFFFFF',
  secondary: '#1A1A1A',
  secondaryDark: '#2A2A2A',
  accentLight2: '#1B5E20',
};

export type ThemeColors = typeof LightTheme;

// Legacy export for backward compatibility
export const Colors = LightTheme;
