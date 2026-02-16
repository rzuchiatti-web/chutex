// CHUTEX HEALTH — Deep Ocean Clinical Design System
// Dark premium medical tech aesthetic with electric blue accents
import { Platform } from 'react-native';

export const LightTheme = {
  background: '#F1F5F9',
  backgroundSecondary: '#FFFFFF',
  surface: 'rgba(255, 255, 255, 0.85)',
  surfaceHighlight: 'rgba(241, 245, 249, 0.8)',
  surfaceGlass: 'rgba(255, 255, 255, 0.7)',
  glassBorder: 'rgba(0, 0, 0, 0.05)',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
  primary: '#3B82F6',
  primaryDark: '#2563EB',
  primaryLight: '#EFF6FF',
  primaryGlow: 'rgba(59, 130, 246, 0.12)',
  accent: '#10B981',
  accentDark: '#059669',
  accentLight: '#ECFDF5',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  dangerGlow: 'rgba(239, 68, 68, 0.12)',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  success: '#10B981',
  successLight: '#ECFDF5',
  successBadge: '#D1FAE5',
  info: '#8B5CF6',
  infoLight: '#F5F3FF',
  border: 'rgba(0, 0, 0, 0.06)',
  borderLight: 'rgba(0, 0, 0, 0.03)',
  care: '#3B82F6',
  careLight: '#EFF6FF',
  standard: '#0F172A',
  tabBar: 'rgba(255, 255, 255, 0.90)',
  tabBarBorder: 'rgba(0, 0, 0, 0.05)',
  cardShadow: 'rgba(59, 130, 246, 0.08)',
  overlay: 'rgba(15, 23, 42, 0.6)',
  skeleton: '#E2E8F0',
  subtle: 'rgba(255, 255, 255, 0.6)',
  paper: '#FFFFFF',
  elevated: '#FFFFFF',
  card: 'rgba(255, 255, 255, 0.85)',
  destructive: '#EF4444',
  destructiveLight: '#FEF2F2',
  text: '#0F172A',
  secondary: '#F1F5F9',
  secondaryDark: '#E2E8F0',
  accentLight2: '#ECFDF5',
  backgroundGradientStart: '#F1F5F9',
  backgroundGradientMid: '#FFFFFF',
  backgroundGradientEnd: '#F1F5F9',
};

export const DarkTheme = {
  background: '#0F172A',
  backgroundSecondary: '#1E293B',
  surface: 'rgba(30, 41, 59, 0.85)',
  surfaceHighlight: 'rgba(51, 65, 85, 0.6)',
  surfaceGlass: 'rgba(30, 41, 59, 0.75)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  textInverse: '#0F172A',
  primary: '#3B82F6',
  primaryDark: '#60A5FA',
  primaryLight: 'rgba(59, 130, 246, 0.15)',
  primaryGlow: 'rgba(59, 130, 246, 0.25)',
  accent: '#10B981',
  accentDark: '#34D399',
  accentLight: 'rgba(16, 185, 129, 0.15)',
  danger: '#EF4444',
  dangerLight: 'rgba(239, 68, 68, 0.15)',
  dangerGlow: 'rgba(239, 68, 68, 0.20)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.15)',
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.15)',
  successBadge: 'rgba(16, 185, 129, 0.2)',
  info: '#8B5CF6',
  infoLight: 'rgba(139, 92, 246, 0.15)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.04)',
  care: '#60A5FA',
  careLight: 'rgba(59, 130, 246, 0.15)',
  standard: '#F8FAFC',
  tabBar: 'rgba(15, 23, 42, 0.95)',
  tabBarBorder: 'rgba(255, 255, 255, 0.06)',
  cardShadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  skeleton: '#1E293B',
  subtle: 'rgba(30, 41, 59, 0.8)',
  paper: '#1E293B',
  elevated: '#334155',
  card: 'rgba(30, 41, 59, 0.85)',
  destructive: '#EF4444',
  destructiveLight: 'rgba(239, 68, 68, 0.15)',
  text: '#F8FAFC',
  secondary: '#1E293B',
  secondaryDark: '#334155',
  accentLight2: 'rgba(16, 185, 129, 0.15)',
  backgroundGradientStart: '#0F172A',
  backgroundGradientMid: '#1E293B',
  backgroundGradientEnd: '#0F172A',
};

export type ThemeColors = typeof LightTheme;
export const Colors = LightTheme;

export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const Radius = { sm: 12, md: 16, lg: 24, xl: 32, full: 9999 } as const;
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
  stat: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -1 },
} as const;

export const Glass = Platform.OS === 'web'
  ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' } : {};

export const GlassCard = {
  borderRadius: Radius.lg,
  borderWidth: 1,
  ...Glass,
} as const;

export const Motion = { fast: 150, normal: 250, slow: 400, spring: { damping: 15, stiffness: 150, mass: 1 }, easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)' } as const;

export const StatusColors: Record<string, string> = {
  active: '#EF4444', pending: '#F59E0B', in_progress: '#8B5CF6', en_route: '#3B82F6',
  completed: '#10B981', resolved: '#10B981', dispatched: '#F59E0B', pending_acceptance: '#F59E0B',
  connected: '#10B981', disconnected: '#64748B',
};
