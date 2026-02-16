// CHUTEX HEALTH — Clinical Premium Design System (Dual Theme)
// Light: #F5F6F8 bg, white cards, dark text  |  Dark: #000 bg, glass cards, white text
// Violet (#7C5CFF) ONLY for Care teleassistance context
import { Platform } from 'react-native';

// ─── LIGHT THEME (DEFAULT — Style Site CHUTEX) ───
export const LightTheme = {
  background: '#F5F6F8',
  backgroundSecondary: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceHighlight: '#F0F1F3',
  surfaceGlass: 'rgba(255,255,255,0.92)',
  glassBorder: 'rgba(0,0,0,0.06)',
  textPrimary: '#1A1D21',
  textSecondary: '#5A6068',
  textMuted: '#9BA3AD',
  textInverse: '#FFFFFF',
  primary: '#1A1D21',
  primaryDark: '#000000',
  primaryLight: 'rgba(0,0,0,0.04)',
  primaryGlow: 'rgba(0,0,0,0.06)',
  accent: '#1A1D21',
  accentDark: '#000000',
  accentLight: 'rgba(0,0,0,0.04)',
  care: '#7C5CFF',
  careLight: 'rgba(124,92,255,0.10)',
  careGlow: 'rgba(124,92,255,0.08)',
  danger: '#EF4444',
  dangerLight: 'rgba(239,68,68,0.08)',
  dangerGlow: 'rgba(239,68,68,0.10)',
  warning: '#F59E0B',
  warningLight: 'rgba(245,158,11,0.08)',
  success: '#10B981',
  successLight: 'rgba(16,185,129,0.08)',
  successBadge: 'rgba(16,185,129,0.12)',
  info: '#6B7280',
  infoLight: 'rgba(107,114,128,0.08)',
  border: 'rgba(0,0,0,0.06)',
  borderLight: 'rgba(0,0,0,0.03)',
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
  destructiveLight: 'rgba(239,68,68,0.08)',
  text: '#1A1D21',
  secondary: '#F2F4F7',
  secondaryDark: '#E5E7EB',
  accentLight2: 'rgba(0,0,0,0.04)',
  inputBg: 'rgba(0,0,0,0.02)',
  inputBorder: 'rgba(0,0,0,0.08)',
  buttonBg: '#1A1D21',
  buttonText: '#FFFFFF',
  badgeBg: 'rgba(0,0,0,0.04)',
  iconColor: '#5A6068',
};

// ─── DARK THEME (Clinical Futurist) ───
export const DarkTheme = {
  background: '#000000',
  backgroundSecondary: '#0A0A0A',
  surface: 'rgba(255,255,255,0.03)',
  surfaceHighlight: 'rgba(255,255,255,0.06)',
  surfaceGlass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.10)',
  textPrimary: 'rgba(255,255,255,0.92)',
  textSecondary: 'rgba(255,255,255,0.62)',
  textMuted: 'rgba(255,255,255,0.38)',
  textInverse: '#000000',
  primary: '#FFFFFF',
  primaryDark: 'rgba(255,255,255,0.85)',
  primaryLight: 'rgba(255,255,255,0.08)',
  primaryGlow: 'rgba(255,255,255,0.06)',
  accent: '#FFFFFF',
  accentDark: 'rgba(255,255,255,0.85)',
  accentLight: 'rgba(255,255,255,0.08)',
  care: '#7C5CFF',
  careLight: 'rgba(124,92,255,0.22)',
  careGlow: 'rgba(124,92,255,0.12)',
  danger: '#EF4444',
  dangerLight: 'rgba(239,68,68,0.15)',
  dangerGlow: 'rgba(239,68,68,0.10)',
  warning: '#F59E0B',
  warningLight: 'rgba(245,158,11,0.15)',
  success: '#10B981',
  successLight: 'rgba(16,185,129,0.15)',
  successBadge: 'rgba(16,185,129,0.20)',
  info: 'rgba(255,255,255,0.70)',
  infoLight: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.10)',
  borderLight: 'rgba(255,255,255,0.05)',
  standard: '#FFFFFF',
  tabBar: 'rgba(10,10,10,0.88)',
  tabBarBorder: 'rgba(255,255,255,0.10)',
  cardShadow: 'rgba(0,0,0,0.50)',
  overlay: 'rgba(0,0,0,0.70)',
  skeleton: 'rgba(255,255,255,0.06)',
  subtle: 'rgba(255,255,255,0.03)',
  paper: '#0A0A0A',
  elevated: 'rgba(255,255,255,0.04)',
  card: 'rgba(255,255,255,0.03)',
  destructive: '#EF4444',
  destructiveLight: 'rgba(239,68,68,0.15)',
  text: 'rgba(255,255,255,0.92)',
  secondary: 'rgba(255,255,255,0.06)',
  secondaryDark: 'rgba(255,255,255,0.10)',
  accentLight2: 'rgba(255,255,255,0.08)',
  inputBg: 'rgba(255,255,255,0.04)',
  inputBorder: 'rgba(255,255,255,0.10)',
  buttonBg: '#FFFFFF',
  buttonText: '#000000',
  badgeBg: 'rgba(255,255,255,0.06)',
  iconColor: 'rgba(255,255,255,0.62)',
};

export type ThemeColors = typeof LightTheme;
export const Colors = LightTheme;

// ─── SPACING ───
export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const Radius = { sm: 12, md: 18, lg: 22, xl: 32, full: 9999 } as const;

// ─── TYPOGRAPHY ───
export const Type = {
  h1: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -1.2 },
  h2: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.6 },
  h3: { fontSize: 17, fontWeight: '700' as const, letterSpacing: -0.3 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },
  micro: { fontSize: 9, fontWeight: '700' as const, letterSpacing: 1.0, textTransform: 'uppercase' as const },
  button: { fontSize: 15, fontWeight: '700' as const },
  buttonSmall: { fontSize: 13, fontWeight: '600' as const },
  stat: { fontSize: 42, fontWeight: '800' as const, letterSpacing: -1.5 },
  statMd: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.8 },
} as const;

export const Glass = Platform.OS === 'web'
  ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } : {};

export const Motion = { fast: 150, normal: 250, slow: 400, reveal: 700, spring: { damping: 18, stiffness: 120, mass: 1 }, easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)', scanDuration: 4800 } as const;

export const StatusColors: Record<string, string> = {
  active: '#EF4444', pending: '#F59E0B', in_progress: '#7C5CFF', en_route: '#3478F6',
  completed: '#10B981', resolved: '#10B981', dispatched: '#F59E0B', pending_acceptance: '#F59E0B',
  connected: '#10B981', disconnected: '#9BA3AD',
};

// Helper: card style depends on theme
export function cardStyle(isDark: boolean) {
  return {
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
    ...(Platform.OS === 'web'
      ? { boxShadow: isDark ? '0 14px 40px rgba(0,0,0,0.35)' : '0 2px 16px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)' }
      : { shadowColor: '#000', shadowOffset: { width: 0, height: isDark ? 8 : 2 }, shadowOpacity: isDark ? 0.35 : 0.04, shadowRadius: isDark ? 20 : 16, elevation: isDark ? 8 : 2 }),
  } as const;
}

export const CardStyle = cardStyle(false);
export const GlassCard = cardStyle(false);

export function resolveAccent(isCareContext: boolean) {
  return isCareContext ? '#7C5CFF' : '#1A1D21';
}
