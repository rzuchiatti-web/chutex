// CARE WATCH — Premium Warm Design System
// Inspired by: Oura Ring / MoniPay / Prakthis reference UIs
// Warm amber/copper gradients, white cards, soft shadows, premium feel
import { Platform } from 'react-native';

// ─── PREMIUM WARM PALETTE ───
export const Warm = {
  amber50: '#FFF8F0',
  amber100: '#FFECD6',
  amber200: '#F5CBA7',
  amber300: '#E8A87C',
  amber400: '#D4845A',
  amber500: '#C67A4F',
  amber600: '#B56A3F',
  amber700: '#9A5533',
  copper: '#C67A4F',
  terracotta: '#B56A3F',
  peach: '#F5CBA7',
  cream: '#FAF8F5',
  sand: '#F3EDE6',
} as const;

// ─── LIGHT THEME (Single theme — premium warm) ───
export const LightTheme = {
  background: '#FAF8F5',
  backgroundSecondary: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceHighlight: '#F3EDE6',
  surfaceGlass: 'rgba(255,255,255,0.85)',
  glassBorder: 'rgba(198,122,79,0.12)',
  textPrimary: '#1C1917',
  textSecondary: '#78716C',
  textMuted: '#A8A29E',
  textInverse: '#FFFFFF',
  primary: '#1C1917',
  primaryDark: '#0C0A09',
  primaryLight: 'rgba(28,25,23,0.04)',
  primaryGlow: 'rgba(28,25,23,0.06)',
  accent: Warm.copper,
  accentDark: Warm.terracotta,
  accentLight: 'rgba(198,122,79,0.10)',
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
  border: 'rgba(28,25,23,0.06)',
  borderLight: 'rgba(28,25,23,0.03)',
  standard: '#1C1917',
  tabBar: 'rgba(255,255,255,0.96)',
  tabBarBorder: 'rgba(28,25,23,0.04)',
  cardShadow: 'rgba(28,25,23,0.06)',
  overlay: 'rgba(28,25,23,0.45)',
  skeleton: '#F3EDE6',
  subtle: '#FAF8F5',
  paper: '#FFFFFF',
  elevated: '#FFFFFF',
  card: '#FFFFFF',
  destructive: '#EF4444',
  destructiveLight: 'rgba(239,68,68,0.08)',
  text: '#1C1917',
  secondary: '#F3EDE6',
  secondaryDark: '#E7DED5',
  accentLight2: 'rgba(198,122,79,0.06)',
  inputBg: 'rgba(28,25,23,0.02)',
  inputBorder: 'rgba(28,25,23,0.08)',
  buttonBg: '#1C1917',
  buttonText: '#FFFFFF',
  badgeBg: 'rgba(198,122,79,0.08)',
  iconColor: '#78716C',
  // Warm-specific tokens
  heroGradientStart: Warm.amber400,
  heroGradientMid: Warm.amber300,
  heroGradientEnd: Warm.amber200,
  warmBg: Warm.cream,
  warmCard: 'rgba(198,122,79,0.06)',
};

// Keep DarkTheme for compatibility but unused
export const DarkTheme = { ...LightTheme };

export type ThemeColors = typeof LightTheme;
export const Colors = LightTheme;

// ─── SPACING ───
export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const Radius = { sm: 14, md: 20, lg: 24, xl: 32, full: 9999 } as const;

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
  connected: '#10B981', disconnected: '#A8A29E',
};

export function cardStyle(isDark: boolean) {
  return {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(28,25,23,0.06)',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 2px 20px rgba(28,25,23,0.05), 0 0 0 1px rgba(28,25,23,0.02)' }
      : { shadowColor: '#1C1917', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2 }),
  } as const;
}

export const CardStyle = cardStyle(false);
export const GlassCard = cardStyle(false);

export function resolveAccent(isCareContext: boolean) {
  return isCareContext ? '#7C5CFF' : Warm.copper;
}
