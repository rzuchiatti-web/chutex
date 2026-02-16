// CHUTEX HEALTH — Clinical Premium Design System
// Light silver background, white cards, orange/amber accent
import { Platform } from 'react-native';

export const LightTheme = {
  background: '#EDF0F4',
  backgroundSecondary: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceHighlight: '#F7F8FA',
  surfaceGlass: 'rgba(255,255,255,0.92)',
  glassBorder: 'rgba(0,0,0,0.03)',
  textPrimary: '#1A1D21',
  textSecondary: '#5A6068',
  textMuted: '#9BA3AD',
  textInverse: '#FFFFFF',
  primary: '#E8773A',
  primaryDark: '#D4652E',
  primaryLight: '#FFF3EC',
  primaryGlow: 'rgba(232,119,58,0.12)',
  accent: '#3478F6',
  accentDark: '#2563EB',
  accentLight: '#EBF2FF',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  dangerGlow: 'rgba(239,68,68,0.10)',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  success: '#22C55E',
  successLight: '#ECFDF5',
  successBadge: '#D1FAE5',
  info: '#8B5CF6',
  infoLight: '#F5F3FF',
  border: 'rgba(0,0,0,0.04)',
  borderLight: 'rgba(0,0,0,0.02)',
  care: '#E8773A',
  careLight: '#FFF3EC',
  standard: '#1A1D21',
  tabBar: 'rgba(255,255,255,0.95)',
  tabBarBorder: 'rgba(0,0,0,0.04)',
  cardShadow: 'rgba(0,0,0,0.06)',
  overlay: 'rgba(0,0,0,0.4)',
  skeleton: '#E8EAEE',
  subtle: '#F7F8FA',
  paper: '#FFFFFF',
  elevated: '#FFFFFF',
  card: '#FFFFFF',
  destructive: '#EF4444',
  destructiveLight: '#FEF2F2',
  text: '#1A1D21',
  secondary: '#F2F4F7',
  secondaryDark: '#E5E7EB',
  accentLight2: '#EBF2FF',
  backgroundGradientStart: '#EDF0F4',
  backgroundGradientMid: '#F5F6F8',
  backgroundGradientEnd: '#EDF0F4',
};

export const DarkTheme = { ...LightTheme };
export type ThemeColors = typeof LightTheme;
export const Colors = LightTheme;

export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const Radius = { sm: 12, md: 18, lg: 24, xl: 32, full: 9999 } as const;
export const Type = {
  h1: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.8 },
  h2: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.4 },
  h3: { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.3 },
  micro: { fontSize: 9, fontWeight: '600' as const, letterSpacing: 0.5 },
  button: { fontSize: 15, fontWeight: '700' as const },
  buttonSmall: { fontSize: 13, fontWeight: '600' as const },
  stat: { fontSize: 42, fontWeight: '800' as const, letterSpacing: -1.5 },
  statMd: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.8 },
} as const;

export const Glass = Platform.OS === 'web'
  ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' } : {};

export const CardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: Radius.lg,
  ...(Platform.OS === 'web' ? { boxShadow: '0 2px 16px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)' } : { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2 }),
} as const;

export const GlassCard = CardStyle;

export const Motion = { fast: 150, normal: 250, slow: 400, spring: { damping: 15, stiffness: 150, mass: 1 }, easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)' } as const;

export const StatusColors: Record<string, string> = {
  active: '#EF4444', pending: '#F59E0B', in_progress: '#8B5CF6', en_route: '#3478F6',
  completed: '#22C55E', resolved: '#22C55E', dispatched: '#F59E0B', pending_acceptance: '#F59E0B',
  connected: '#22C55E', disconnected: '#9BA3AD',
};
