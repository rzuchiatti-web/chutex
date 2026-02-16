// CHUTEX HEALTH — Clinical Futurist Premium Design System
// Dark B&W dominant. Violet ONLY for Care context.
import { Platform } from 'react-native';

// ─── CORE PALETTE ───
export const Palette = {
  black: '#000000',
  white: '#FFFFFF',
  text: 'rgba(255,255,255,0.92)',
  textMuted: 'rgba(255,255,255,0.62)',
  textDim: 'rgba(255,255,255,0.38)',
  surface: 'rgba(255,255,255,0.03)',
  surfaceElevated: 'rgba(255,255,255,0.06)',
  surfaceHover: 'rgba(255,255,255,0.08)',
  line: 'rgba(255,255,255,0.10)',
  lineFaint: 'rgba(255,255,255,0.05)',
  // Care-only violet
  careViolet: '#7C5CFF',
  careVioletWeak: 'rgba(124,92,255,0.22)',
  careVioletGlow: 'rgba(124,92,255,0.12)',
  // Status
  success: '#10B981',
  successWeak: 'rgba(16,185,129,0.15)',
  danger: '#EF4444',
  dangerWeak: 'rgba(239,68,68,0.15)',
  warning: '#F59E0B',
  warningWeak: 'rgba(245,158,11,0.15)',
  info: 'rgba(255,255,255,0.70)',
} as const;

// ─── THEMES ───
export const DarkTheme = {
  background: '#000000',
  backgroundSecondary: '#0A0A0A',
  surface: Palette.surface,
  surfaceHighlight: Palette.surfaceElevated,
  surfaceGlass: 'rgba(255,255,255,0.04)',
  glassBorder: Palette.line,
  textPrimary: Palette.text,
  textSecondary: Palette.textMuted,
  textMuted: Palette.textDim,
  textInverse: '#000000',
  // Default accent = white (NOT violet)
  primary: '#FFFFFF',
  primaryDark: 'rgba(255,255,255,0.85)',
  primaryLight: 'rgba(255,255,255,0.08)',
  primaryGlow: 'rgba(255,255,255,0.06)',
  accent: '#FFFFFF',
  accentDark: 'rgba(255,255,255,0.85)',
  accentLight: 'rgba(255,255,255,0.08)',
  // Care-specific
  care: Palette.careViolet,
  careLight: Palette.careVioletWeak,
  careGlow: Palette.careVioletGlow,
  // Status colors
  danger: Palette.danger,
  dangerLight: Palette.dangerWeak,
  dangerGlow: 'rgba(239,68,68,0.10)',
  warning: Palette.warning,
  warningLight: Palette.warningWeak,
  success: Palette.success,
  successLight: Palette.successWeak,
  successBadge: 'rgba(16,185,129,0.20)',
  info: Palette.info,
  infoLight: 'rgba(255,255,255,0.06)',
  // Structural
  border: Palette.line,
  borderLight: Palette.lineFaint,
  standard: '#FFFFFF',
  tabBar: 'rgba(0,0,0,0.85)',
  tabBarBorder: Palette.line,
  cardShadow: 'rgba(0,0,0,0.50)',
  overlay: 'rgba(0,0,0,0.70)',
  skeleton: 'rgba(255,255,255,0.06)',
  subtle: 'rgba(255,255,255,0.03)',
  paper: '#0A0A0A',
  elevated: 'rgba(255,255,255,0.04)',
  card: 'rgba(255,255,255,0.03)',
  destructive: Palette.danger,
  destructiveLight: Palette.dangerWeak,
  text: Palette.text,
  secondary: 'rgba(255,255,255,0.06)',
  secondaryDark: 'rgba(255,255,255,0.10)',
  accentLight2: 'rgba(255,255,255,0.08)',
  backgroundGradientStart: '#000000',
  backgroundGradientMid: '#050505',
  backgroundGradientEnd: '#000000',
};

export const LightTheme = { ...DarkTheme };
export type ThemeColors = typeof DarkTheme;
export const Colors = DarkTheme;

// ─── SPACING ───
export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

// ─── RADII ───
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

// ─── GLASS EFFECT ───
export const Glass = Platform.OS === 'web'
  ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } : {};

// ─── CARD STYLES ───
export const CardStyle = {
  backgroundColor: Palette.surface,
  borderRadius: Radius.lg,
  borderWidth: 1,
  borderColor: Palette.line,
  ...(Platform.OS === 'web'
    ? { boxShadow: '0 14px 40px rgba(0,0,0,0.35)' }
    : { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 8 }),
} as const;

export const GlassCard = {
  ...CardStyle,
  ...Glass,
  backgroundColor: 'rgba(255,255,255,0.04)',
} as const;

// ─── MOTION ───
export const Motion = {
  fast: 150,
  normal: 250,
  slow: 400,
  reveal: 700,
  spring: { damping: 18, stiffness: 120, mass: 1 },
  easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  scanDuration: 4800,
} as const;

// ─── STATUS COLORS ───
export const StatusColors: Record<string, string> = {
  active: Palette.danger,
  pending: Palette.warning,
  in_progress: Palette.careViolet,
  en_route: '#3478F6',
  completed: Palette.success,
  resolved: Palette.success,
  dispatched: Palette.warning,
  pending_acceptance: Palette.warning,
  connected: Palette.success,
  disconnected: Palette.textDim,
};

// ─── CARE CONTEXT HELPER ───
export function resolveAccent(isCareContext: boolean) {
  return isCareContext ? Palette.careViolet : '#FFFFFF';
}
export function resolveAccentWeak(isCareContext: boolean) {
  return isCareContext ? Palette.careVioletWeak : 'rgba(255,255,255,0.18)';
}
