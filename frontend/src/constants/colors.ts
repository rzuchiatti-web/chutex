// CARE WATCH — Clean Neutral Base (no design personality — waiting for DA)
import { Platform } from 'react-native';

export const LightTheme = {
  background: '#FFFFFF',
  backgroundSecondary: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceHighlight: '#F3F4F6',
  surfaceGlass: '#FFFFFF',
  glassBorder: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',
  primary: '#111827',
  primaryDark: '#000000',
  primaryLight: '#F3F4F6',
  primaryGlow: '#F3F4F6',
  accent: '#6B7280',
  accentDark: '#4B5563',
  accentLight: '#F3F4F6',
  care: '#6B7280',
  careLight: '#F3F4F6',
  careGlow: '#F3F4F6',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  dangerGlow: '#FEF2F2',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  success: '#10B981',
  successLight: '#ECFDF5',
  successBadge: '#ECFDF5',
  info: '#6B7280',
  infoLight: '#F3F4F6',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  standard: '#111827',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
  cardShadow: 'rgba(0,0,0,0.05)',
  overlay: 'rgba(0,0,0,0.4)',
  skeleton: '#F3F4F6',
  subtle: '#F9FAFB',
  paper: '#FFFFFF',
  elevated: '#FFFFFF',
  card: '#FFFFFF',
  destructive: '#EF4444',
  destructiveLight: '#FEF2F2',
  text: '#111827',
  secondary: '#F3F4F6',
  secondaryDark: '#E5E7EB',
  accentLight2: '#F3F4F6',
  inputBg: '#F9FAFB',
  inputBorder: '#E5E7EB',
  buttonBg: '#111827',
  buttonText: '#FFFFFF',
  badgeBg: '#F3F4F6',
  iconColor: '#6B7280',
  heroGradientStart: '#6B7280',
  heroGradientMid: '#9CA3AF',
  heroGradientEnd: '#D1D5DB',
  warmBg: '#F9FAFB',
  warmCard: '#F3F4F6',
};

export const DarkTheme = { ...LightTheme };
export type ThemeColors = typeof LightTheme;
export const Colors = LightTheme;

export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const Radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 } as const;

export const Type = {
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.3 },
  h3: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  micro: { fontSize: 9, fontWeight: '600' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },
  button: { fontSize: 14, fontWeight: '600' as const },
  buttonSmall: { fontSize: 13, fontWeight: '500' as const },
  stat: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -1 },
  statMd: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.5 },
} as const;

export const Glass = Platform.OS === 'web' ? {} : {};
export const Motion = { fast: 150, normal: 250, slow: 400, reveal: 600, spring: { damping: 18, stiffness: 120, mass: 1 }, easeOut: 'ease-out', stagger: 50 } as const;

export const StatusColors: Record<string, string> = {
  active: '#EF4444', pending: '#F59E0B', in_progress: '#3B82F6', en_route: '#3B82F6',
  completed: '#10B981', resolved: '#10B981', dispatched: '#F59E0B', pending_acceptance: '#F59E0B',
  connected: '#10B981', disconnected: '#9CA3AF',
};

export function cardStyle(_isDark: boolean) {
  return {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 1 }),
  } as const;
}

export const CardStyle = cardStyle(false);
export const GlassCard = cardStyle(false);
export function resolveAccent(_isCareContext: boolean) { return '#111827'; }
