import React, { useEffect, useRef } from 'react';
import { View, Animated, Platform, StyleSheet } from 'react-native';
import { Palette, Radius } from '../constants/colors';

interface ClinicCardProps {
  children: React.ReactNode;
  style?: any;
  hudCorners?: boolean;
  scanline?: boolean;
  care?: boolean;
}

/** HUD corner marks for clinical aesthetic */
const HudCorner = ({ position }: { position: 'tl' | 'tr' | 'bl' | 'br' }) => {
  const size = 14;
  const color = 'rgba(255,255,255,0.18)';
  const base: any = { position: 'absolute', width: size, height: size };
  const border = { borderColor: color, borderWidth: 1 };
  const pos = {
    tl: { top: 8, left: 8, borderTopWidth: 1, borderLeftWidth: 1, borderBottomWidth: 0, borderRightWidth: 0 },
    tr: { top: 8, right: 8, borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 0, borderLeftWidth: 0 },
    bl: { bottom: 8, left: 8, borderBottomWidth: 1, borderLeftWidth: 1, borderTopWidth: 0, borderRightWidth: 0 },
    br: { bottom: 8, right: 8, borderBottomWidth: 1, borderRightWidth: 1, borderTopWidth: 0, borderLeftWidth: 0 },
  };
  return <View style={[base, { borderColor: color }, pos[position]]} />;
};

export function ClinicCard({ children, style, hudCorners = true, scanline = false, care = false }: ClinicCardProps) {
  const scanAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    if (scanline && Platform.OS === 'web') {
      Animated.loop(
        Animated.timing(scanAnim, { toValue: 1, duration: 4800, useNativeDriver: true })
      ).start();
    }
  }, [scanline]);

  const borderColor = care ? Palette.careVioletWeak : Palette.line;

  return (
    <View style={[styles.card, { borderColor }, style]}>
      {hudCorners && (
        <>
          <HudCorner position="tl" />
          <HudCorner position="tr" />
          <HudCorner position="bl" />
          <HudCorner position="br" />
        </>
      )}
      {children}
      {/* Scanline overlay for web */}
      {scanline && Platform.OS === 'web' && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0, bottom: 0, left: 0, right: 0,
            opacity: 0.3,
            transform: [{ translateX: scanAnim.interpolate({ inputRange: [-1, 1], outputRange: [-300, 300] }) }],
          }}
          pointerEvents="none"
        >
          <View style={{ width: 80, height: '100%', backgroundColor: 'transparent', ...(Platform.OS === 'web' ? { background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' } as any : {}) }} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } as any
      : { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 8 }),
  },
});
