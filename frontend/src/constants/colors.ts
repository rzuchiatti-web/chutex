// CARE WATCH — Ultra-Premium Soft Glass Design System
// Soft glassmorphism + subtle neumorphism, light neutral, warm gradients
import { Platform } from 'react-native';

// ─── PREMIUM PALETTE ───
export const Palette = {
  bg: '#F5F6F8',
  bgSubtle: '#EDEEF1',
  surface: '#FFFFFF',
  surfaceGlass: 'rgba(255,255,255,0.72)',
  glassBorder: 'rgba(255,255,255,0.65)',
  text: '#1E1F24',
  textSecondary: '#6B7084',
  textMuted: '#9CA3B0',
  accent: '#D4845A',
  accentLight: '#E8A87C',
  accentPeach: '#F5CBA7',
  accentWarmBeige: '#FAE5CD',
  care: '#7C5CFF',
  danger: '#EF4444',
  dangerLight: 'rgba(239,68,68,0.08)',
  success: '#10B981',
  successLight: 'rgba(16,185,129,0.08)',
  warning: '#F59E0B',
  warningLight: 'rgba(245,158,11,0.08)',
} as const;

// ─── DESIGN TOKENS ───
export const Token = {
  frameRadius: 34,
  cardLg: 24,
  cardSm: 20,
  pill: 999,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.65)',
  borderSubtle: 'rgba(20,20,30,0.06)',
  shadow: '0 10px 30px rgba(20,20,30,0.08)',
  shadowHover: '0 16px 40px rgba(20,20,30,0.12)',
  shadowSoft: '0 4px 16px rgba(20,20,30,0.05)',
  glass: 'blur(12px) saturate(120%)',
  glassHeavy: 'blur(20px) saturate(140%)',
} as const;

// ─── LIGHT THEME (single theme) ───
export const LightTheme = {
  background: Palette.bg,
  backgroundSecondary: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceHighlight: Palette.bgSubtle,
  surfaceGlass: Palette.surfaceGlass,
  glassBorder: Token.borderSubtle,
  textPrimary: Palette.text,
  textSecondary: Palette.textSecondary,
  textMuted: Palette.textMuted,
  textInverse: '#FFFFFF',
  primary: Palette.text,
  primaryDark: '#0C0A09',
  primaryLight: 'rgba(30,31,36,0.04)',
  primaryGlow: 'rgba(30,31,36,0.06)',
  accent: Palette.accent,
  accentDark: '#B56A3F',
  accentLight: 'rgba(212,132,90,0.10)',
  care: Palette.care,
  careLight: 'rgba(124,92,255,0.10)',
  careGlow: 'rgba(124,92,255,0.08)',
  danger: Palette.danger,
  dangerLight: Palette.dangerLight,
  dangerGlow: 'rgba(239,68,68,0.10)',
  warning: Palette.warning,
  warningLight: Palette.warningLight,
  success: Palette.success,
  successLight: Palette.successLight,
  successBadge: 'rgba(16,185,129,0.12)',
  info: '#6B7280',
  infoLight: 'rgba(107,114,128,0.08)',
  border: Token.borderSubtle,
  borderLight: 'rgba(20,20,30,0.03)',
  standard: Palette.text,
  tabBar: 'rgba(255,255,255,0.82)',
  tabBarBorder: 'rgba(20,20,30,0.04)',
  cardShadow: 'rgba(20,20,30,0.06)',
  overlay: 'rgba(20,20,30,0.4)',
  skeleton: Palette.bgSubtle,
  subtle: Palette.bg,
  paper: '#FFFFFF',
  elevated: '#FFFFFF',
  card: '#FFFFFF',
  destructive: Palette.danger,
  destructiveLight: Palette.dangerLight,
  text: Palette.text,
  secondary: Palette.bgSubtle,
  secondaryDark: '#D4D6DC',
  accentLight2: 'rgba(212,132,90,0.06)',
  inputBg: 'rgba(20,20,30,0.03)',
  inputBorder: 'rgba(20,20,30,0.08)',
  buttonBg: Palette.text,
  buttonText: '#FFFFFF',
  badgeBg: 'rgba(212,132,90,0.08)',
  iconColor: Palette.textSecondary,
  heroGradientStart: Palette.accent,
  heroGradientMid: Palette.accentLight,
  heroGradientEnd: Palette.accentPeach,
  warmBg: Palette.bg,
  warmCard: 'rgba(212,132,90,0.04)',
};

export const DarkTheme = { ...LightTheme };
export type ThemeColors = typeof LightTheme;
export const Colors = LightTheme;

// ─── SPACING ───
export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;
export const Radius = { sm: 14, md: Token.cardSm, lg: Token.cardLg, xl: Token.frameRadius, full: Token.pill } as const;

// ─── TYPOGRAPHY ───
export const Type = {
  h1: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.8, lineHeight: 38 },
  h2: { fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.4, lineHeight: 28 },
  h3: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },
  micro: { fontSize: 9, fontWeight: '700' as const, letterSpacing: 1.0, textTransform: 'uppercase' as const },
  button: { fontSize: 15, fontWeight: '600' as const },
  buttonSmall: { fontSize: 13, fontWeight: '600' as const },
  stat: { fontSize: 40, fontWeight: '700' as const, letterSpacing: -1.5 },
  statMd: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.8 },
} as const;

export const Glass = Platform.OS === 'web'
  ? { backdropFilter: Token.glass, WebkitBackdropFilter: Token.glass } : {};

export const GlassHeavy = Platform.OS === 'web'
  ? { backdropFilter: Token.glassHeavy, WebkitBackdropFilter: Token.glassHeavy } : {};

export const Motion = {
  fast: 150, normal: 280, slow: 420, reveal: 700,
  pageEnter: { duration: 380, ease: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  stagger: 55,
  spring: { damping: 18, stiffness: 120, mass: 1 },
  easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

export const StatusColors: Record<string, string> = {
  active: '#EF4444', pending: '#F59E0B', in_progress: '#7C5CFF', en_route: '#3478F6',
  completed: '#10B981', resolved: '#10B981', dispatched: '#F59E0B', pending_acceptance: '#F59E0B',
  connected: '#10B981', disconnected: '#9CA3B0',
};

export function cardStyle(_isDark: boolean) {
  return {
    backgroundColor: '#FFFFFF',
    borderRadius: Token.cardLg,
    borderWidth: Token.borderWidth,
    borderColor: Token.borderSubtle,
    ...(Platform.OS === 'web'
      ? { boxShadow: Token.shadow }
      : { shadowColor: '#14141E', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 30, elevation: 3 }),
  } as const;
}

export const CardStyle = cardStyle(false);
export const GlassCard = cardStyle(false);

export function resolveAccent(isCareContext: boolean) {
  return isCareContext ? Palette.care : Palette.accent;
}
