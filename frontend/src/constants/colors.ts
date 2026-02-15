// CHUTEX HEALTH — Ultra Clinical Design System
// Direction: Black & White dominant, colors ONLY on micro-elements
// Font: Inter (Regular body, ExtraBold titles/buttons)
// Glass cards, generous spacing, fluid motion

// ─── COLOR TOKENS ───
export const LightTheme = {
  // Backgrounds
  background: '#F8F8F8',
  backgroundSecondary: '#FFFFFF',

  // Surfaces — Glass
  surface: 'rgba(255, 255, 255, 0.72)',
  surfaceHighlight: 'rgba(255, 255, 255, 0.50)',
  surfaceGlass: 'rgba(255, 255, 255, 0.60)',
  glassBorder: 'rgba(0, 0, 0, 0.06)',

  // Text
  textPrimary: '#000000',
  textSecondary: '#3A3A3A',
  textMuted: '#999999',
  textInverse: '#FFFFFF',

  // Primary — Black
  primary: '#000000',
  primaryDark: '#000000',
  primaryLight: '#F2F2F2',
  primaryGlow: 'rgba(0, 0, 0, 0.04)',

  // Accent — micro-elements only
  accent: '#34C759',
  accentDark: '#28A745',
  accentLight: '#E8F8ED',

  // Semantic — micro-elements only
  danger: '#FF3B30',
  dangerLight: '#FFF0EF',
  dangerGlow: 'rgba(255, 59, 48, 0.10)',
  warning: '#FF9500',
  warningLight: '#FFF8EC',
  success: '#34C759',
  successLight: '#E8F8ED',
  successBadge: '#D4F5DD',
  info: '#5856D6',
  infoLight: '#F0F0FF',

  // Borders
  border: 'rgba(0, 0, 0, 0.06)',
  borderLight: 'rgba(0, 0, 0, 0.03)',

  // Backward-compat aliases
  care: '#000000',
  careLight: '#F2F2F2',
  standard: '#000000',
  tabBar: 'rgba(255, 255, 255, 0.80)',
  tabBarBorder: 'rgba(0, 0, 0, 0.05)',
  cardShadow: 'rgba(0, 0, 0, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.50)',
  skeleton: '#EFEFEF',
  subtle: 'rgba(255, 255, 255, 0.60)',
  paper: '#FFFFFF',
  elevated: '#FFFFFF',
  card: 'rgba(255, 255, 255, 0.72)',
  destructive: '#FF3B30',
  destructiveLight: '#FFF0EF',
  text: '#000000',
  secondary: '#F2F2F2',
  secondaryDark: '#E5E5E5',
  accentLight2: '#E8F8ED',
  backgroundGradientStart: '#F8F8F8',
  backgroundGradientMid: '#F4F4F4',
  backgroundGradientEnd: '#F8F8F8',
};

export const DarkTheme = {
  background: '#000000',
  backgroundSecondary: '#0A0A0A',

  surface: 'rgba(28, 28, 30, 0.80)',
  surfaceHighlight: 'rgba(44, 44, 46, 0.60)',
  surfaceGlass: 'rgba(28, 28, 30, 0.72)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',

  textPrimary: '#FFFFFF',
  textSecondary: '#BBBBBB',
  textMuted: '#666666',
  textInverse: '#000000',

  primary: '#FFFFFF',
  primaryDark: '#E0E0E0',
  primaryLight: '#1C1C1E',
  primaryGlow: 'rgba(255, 255, 255, 0.06)',

  accent: '#30D158',
  accentDark: '#28A745',
  accentLight: '#0D2818',

  danger: '#FF453A',
  dangerLight: '#2C1215',
  dangerGlow: 'rgba(255, 69, 58, 0.12)',
  warning: '#FF9F0A',
  warningLight: '#2C1F0A',
  success: '#30D158',
  successLight: '#0D2818',
  successBadge: '#0D2818',
  info: '#5E5CE6',
  infoLight: '#1C1C2E',

  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.04)',

  care: '#FFFFFF',
  careLight: '#1C1C1E',
  standard: '#FFFFFF',
  tabBar: 'rgba(0, 0, 0, 0.90)',
  tabBarBorder: 'rgba(255, 255, 255, 0.06)',
  cardShadow: 'rgba(0, 0, 0, 0.40)',
  overlay: 'rgba(0, 0, 0, 0.70)',
  skeleton: '#1C1C1E',
  subtle: 'rgba(28, 28, 30, 0.72)',
  paper: '#1C1C1E',
  elevated: '#2C2C2E',
  card: 'rgba(28, 28, 30, 0.80)',
  destructive: '#FF453A',
  destructiveLight: '#2C1215',
  text: '#FFFFFF',
  secondary: '#1C1C1E',
  secondaryDark: '#2C2C2E',
  accentLight2: '#0D2818',
  backgroundGradientStart: '#000000',
  backgroundGradientMid: '#0A0A0A',
  backgroundGradientEnd: '#000000',
};

export type ThemeColors = typeof LightTheme;
export const Colors = LightTheme;

// ─── SPACING ───
export const Space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

// ─── RADIUS ───
export const Radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
} as const;

// ─── TYPOGRAPHY ───
export const Type = {
  h1: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.8 },
  h2: { fontSize: 22, fontWeight: '800' as const, letterSpacing: -0.4 },
  h3: { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.2 },
  micro: { fontSize: 9, fontWeight: '600' as const, letterSpacing: 0.4 },
  button: { fontSize: 15, fontWeight: '800' as const },
  buttonSmall: { fontSize: 13, fontWeight: '700' as const },
  stat: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.5 },
} as const;

// ─── GLASS STYLE (Platform-aware) ───
import { Platform } from 'react-native';

export const Glass = Platform.OS === 'web'
  ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' }
  : {};

export const GlassCard = {
  backgroundColor: LightTheme.surface,
  borderRadius: Radius.lg,
  borderWidth: 1,
  borderColor: LightTheme.glassBorder,
  ...Glass,
} as const;

// ─── MOTION TOKENS ───
export const Motion = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: { damping: 15, stiffness: 150, mass: 1 },
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

// ─── STATUS COLORS (micro-elements only) ───
export const StatusColors: Record<string, string> = {
  active: '#FF3B30',
  pending: '#FF9500',
  in_progress: '#5856D6',
  en_route: '#007AFF',
  completed: '#34C759',
  resolved: '#34C759',
  dispatched: '#FF9500',
  pending_acceptance: '#FF9500',
  connected: '#34C759',
  disconnected: '#999999',
};
