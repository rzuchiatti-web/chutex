import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Animated, Platform } from 'react-native';

interface PageTitleProps {
  kicker?: string;
  title: string;
  subtitle?: string;
}

export function PageTitle({ kicker, title, subtitle }: PageTitleProps) {
  const [displayed, setDisplayed] = useState('');
  const [showCaret, setShowCaret] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    // Typewriter effect
    let i = 0;
    setDisplayed('');
    const interval = setInterval(() => {
      if (i < title.length) {
        setDisplayed(title.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setShowCaret(false), 2000);
      }
    }, 25);

    // Fade in
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();

    return () => clearInterval(interval);
  }, [title]);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], paddingHorizontal: 4, marginBottom: 20 }}>
      {kicker && (
        <Text style={{ fontSize: 10, fontWeight: '700', color: '#9BA3AD', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
          {kicker}
        </Text>
      )}
      <Text style={{ fontSize: 30, fontWeight: '800', color: '#1A1D21', letterSpacing: -0.8, lineHeight: 34 }}>
        {displayed}
        {showCaret && (
          <Text style={{
            color: '#1A1D21',
            opacity: 0.6,
            ...(Platform.OS === 'web' ? { animation: 'blink 1.1s steps(2,end) infinite' } as any : {}),
          }}>|</Text>
        )}
      </Text>
      {subtitle && (
        <Text style={{ fontSize: 14, color: '#5A6068', marginTop: 6, lineHeight: 20 }}>{subtitle}</Text>
      )}
    </Animated.View>
  );
}

// Inject blink animation on web
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const s = document.createElement('style');
  s.textContent = `@keyframes blink{0%,49%{opacity:1}50%,100%{opacity:.12}}`;
  document.head.appendChild(s);
}
