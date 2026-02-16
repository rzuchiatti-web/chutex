import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, Animated, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { Radius, Space, Type } from '../src/constants/colors';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = Math.min(SCREEN_W - 48, 380);

// Theme-aware color helper
function useOnboardingColors() {
  const { colors, isDark } = useTheme();
  return {
    bg: colors.background,
    text: colors.textPrimary,
    textMuted: colors.textSecondary,
    textDim: colors.textMuted,
    line: colors.border,
    lineFaint: colors.borderLight,
    surface: colors.surface,
    careViolet: '#7C5CFF',
    careVioletWeak: 'rgba(124,92,255,0.18)',
    success: colors.success,
    danger: colors.danger,
    warning: colors.warning,
    buttonBg: colors.buttonBg,
    buttonText: colors.buttonText,
    isDark,
    logoSource: isDark ? require('../assets/images/logo_white.png') : require('../assets/images/logo_black.png'),
  };
}

const VIDEO_URL = 'https://cdn.shopify.com/videos/c/o/v/9ece2e3b8dd449f2bfbe21695ff47dd8.webm';
const PRODUCTS = {
  elder: 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/bague_vita_donnees_de_sante_chutex_2.svg?v=1766141409',
  elio: 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme.svg?v=1770109412',
  vita: 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/Balance_connecte_Vita_chutex.svg?v=1769005281',
};

const webShadow = Platform.OS === 'web' ? { boxShadow: '0 14px 40px rgba(0,0,0,0.45)' } : {};
const webGlass = Platform.OS === 'web' ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } : {};

// ─── HUD Corner ───
const HudCorner = ({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) => {
  const s = 12;
  const c = 'rgba(255,255,255,0.15)';
  const positions: Record<string, any> = {
    tl: { top: 6, left: 6, borderTopWidth: 1, borderLeftWidth: 1 },
    tr: { top: 6, right: 6, borderTopWidth: 1, borderRightWidth: 1 },
    bl: { bottom: 6, left: 6, borderBottomWidth: 1, borderLeftWidth: 1 },
    br: { bottom: 6, right: 6, borderBottomWidth: 1, borderRightWidth: 1 },
  };
  return <View style={[{ position: 'absolute', width: s, height: s, borderColor: c }, positions[pos]]} />;
};

// ─── Clinic Card ───
const Card = ({ children, style, care }: any) => (
  <View style={[{
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: care ? C.careVioletWeak : C.line,
    overflow: 'hidden',
    position: 'relative' as const,
    ...webShadow,
  }, style]}>
    <HudCorner pos="tl" /><HudCorner pos="tr" /><HudCorner pos="bl" /><HudCorner pos="br" />
    {children}
  </View>
);

// ─── Chip/Tag ───
const Chip = ({ label, active, care }: { label: string; active?: boolean; care?: boolean }) => (
  <View style={{
    backgroundColor: care ? C.careVioletWeak : active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: care ? 'rgba(124,92,255,0.3)' : 'rgba(255,255,255,0.08)',
  }}>
    <Text style={{ fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: care ? C.careViolet : C.text, textTransform: 'uppercase' }}>{label}</Text>
  </View>
);

// ─── Pulse Dot ───
const PulseDot = ({ color }: { color: string }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.6, duration: 1000, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <View style={{ width: 8, height: 8, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: color, opacity: 0.3, transform: [{ scale: pulse }] }} />
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
    </View>
  );
};

// ─── Product Card for Slide 1 ───
const ProductCard = ({ name, subtitle, features, imageUrl }: any) => (
  <Card style={{ padding: 16, marginBottom: 12, width: '100%' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.lineFaint }}>
        <Image source={{ uri: imageUrl }} style={{ width: 36, height: 36 }} resizeMode="contain" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: C.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 }}>{name}</Text>
        <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>{subtitle}</Text>
      </View>
    </View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {features.map((f: string) => <Chip key={f} label={f} />)}
    </View>
  </Card>
);

// ═══════════════════════════════════════════
// SLIDES
// ═══════════════════════════════════════════

function Slide1() {
  return (
    <View style={{ flex: 1, paddingHorizontal: 24 }}>
      <Text style={{ color: C.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.8, marginBottom: 6 }}>
        Ecosysteme CHUTEX
      </Text>
      <Text style={{ color: C.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 24 }}>
        Trois dispositifs medicaux connectes, un seul ecosysteme de sante.
      </Text>
      <ProductCard
        name="Elder"
        subtitle="Bague connectee"
        imageUrl={PRODUCTS.elder}
        features={['SpO2', 'FC', 'Temperature', 'Sommeil']}
      />
      <ProductCard
        name="Elio"
        subtitle="Bracelet sante"
        imageUrl={PRODUCTS.elio}
        features={['ECG', 'Activite', 'Glycemie est.', 'Care']}
      />
      <ProductCard
        name="Vita"
        subtitle="Balance connectee"
        imageUrl={PRODUCTS.vita}
        features={['IMC', 'Masse grasse', 'Masse musc.', '30+ metriques']}
      />
    </View>
  );
}

function Slide2() {
  return (
    <View style={{ flex: 1, paddingHorizontal: 24 }}>
      <Text style={{ color: C.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.8, marginBottom: 6 }}>
        Donnees & Prevention
      </Text>
      <Text style={{ color: C.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 24 }}>
        Lecture claire de vos donnees. Tendances, signaux faibles, prevention active.
      </Text>
      <Card style={{ padding: 20, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(16,185,129,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="heart" size={20} color={C.success} />
          </View>
          <View>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: '700' }}>Vision sante complete</Text>
            <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>Tous vos indicateurs au meme endroit</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {[{ label: 'FC', value: '72', unit: 'bpm' }, { label: 'SpO2', value: '98', unit: '%' }, { label: 'Temp', value: '36.5', unit: 'C' }].map(m => (
            <View key={m.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.lineFaint }}>
              <Text style={{ color: C.textDim, fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{m.label}</Text>
              <Text style={{ color: C.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 }}>{m.value}<Text style={{ fontSize: 11, color: C.textMuted }}> {m.unit}</Text></Text>
            </View>
          ))}
        </View>
      </Card>
      <Card style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="analytics" size={20} color={C.warning} />
          </View>
          <View>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: '700' }}>Estimation glycemique</Text>
            <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>Analyse non-invasive via votre bracelet</Text>
          </View>
        </View>
        <View style={{ height: 60, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, borderWidth: 1, borderColor: C.lineFaint, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Text style={{ color: C.text, fontSize: 32, fontWeight: '800' }}>5.4</Text>
            <Text style={{ color: C.textMuted, fontSize: 13 }}>mmol/L</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
          <Chip label="Non-invasif" /><Chip label="Estimation" /><Chip label="Continu" />
        </View>
      </Card>
    </View>
  );
}

function Slide3() {
  return (
    <View style={{ flex: 1, paddingHorizontal: 24 }}>
      <Text style={{ color: C.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.8, marginBottom: 6 }}>
        Teleassistance Care
      </Text>
      <Text style={{ color: C.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 24 }}>
        Intervention d'urgence en temps reel. Suivi GPS, equipes de proximite.
      </Text>
      {/* Care-context card with violet */}
      <Card care style={{ padding: 20, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.careVioletWeak, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="shield-checkmark" size={20} color={C.careViolet} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontSize: 16, fontWeight: '700' }}>Care active</Text>
            <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>Protection 24/7 avec equipe dediee</Text>
          </View>
          <PulseDot color={C.careViolet} />
        </View>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <Chip label="SOS" care /><Chip label="Chute" care /><Chip label="GPS" care /><Chip label="24/7" care />
        </View>
      </Card>
      {/* Intervention example */}
      <Card style={{ padding: 20 }}>
        <Text style={{ ...Type.caption, color: C.textDim, marginBottom: 12 }}>Exemple d'intervention</Text>
        {[
          { time: '14:32', label: 'Alerte SOS declenchee', color: C.danger },
          { time: '14:33', label: 'Intervenant dispatche', color: C.careViolet },
          { time: '14:38', label: 'Arrivee sur place', color: C.success },
        ].map((e, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: i < 2 ? 10 : 0 }}>
            <Text style={{ color: C.textDim, fontSize: 11, fontWeight: '600', width: 36 }}>{e.time}</Text>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: e.color }} />
            <Text style={{ color: C.textMuted, fontSize: 13 }}>{e.label}</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

function Slide4() {
  return (
    <View style={{ flex: 1, paddingHorizontal: 24 }}>
      <Text style={{ color: C.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.8, marginBottom: 6 }}>
        Teleconsultation 24/7
      </Text>
      <Text style={{ color: C.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 24 }}>
        Acces medecin, orientation, suivi continu. Partout, a tout moment.
      </Text>
      {/* Video card with HUD overlay */}
      <Card style={{ marginBottom: 16, overflow: 'hidden' }}>
        <View style={{ height: 200, backgroundColor: 'rgba(255,255,255,0.02)', position: 'relative' }}>
          {Platform.OS === 'web' ? (
            <video
              src={VIDEO_URL}
              autoPlay
              muted
              loop
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' } as any}
            />
          ) : (
            <View style={{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="videocam" size={40} color={C.textDim} />
            </View>
          )}
          {/* HUD overlay chips */}
          <View style={{ position: 'absolute', top: 10, left: 10, flexDirection: 'row', gap: 6 }}>
            <Chip label="Biometric" /><Chip label="Clinic" /><Chip label="B/W" />
          </View>
          {/* Bottom HUD banner */}
          <View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            backgroundColor: 'rgba(0,0,0,0.65)', paddingVertical: 8, paddingHorizontal: 12,
            flexDirection: 'row', alignItems: 'center', gap: 6,
            ...webGlass,
          }}>
            <PulseDot color={C.success} />
            <Text style={{ color: C.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Scan en cours  ·  Analyse multi-dimensionnelle
            </Text>
          </View>
        </View>
      </Card>
      <Card style={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Ionicons name="videocam" size={22} color={C.text} />
          <Text style={{ color: C.text, fontSize: 16, fontWeight: '700' }}>Medecin disponible</Text>
        </View>
        <Text style={{ color: C.textMuted, fontSize: 13, lineHeight: 20 }}>
          Consultez un professionnel de sante a distance. Orientation, diagnostic, prescription electronique.
        </Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
          <Chip label="24/7" active /><Chip label="Pro" /><Chip label="Securise" />
        </View>
      </Card>
    </View>
  );
}

function Slide5() {
  return (
    <View style={{ flex: 1, paddingHorizontal: 24 }}>
      <Text style={{ color: C.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.8, marginBottom: 6 }}>
        Securite & Confidentialite
      </Text>
      <Text style={{ color: C.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 24 }}>
        Vos donnees de sante sont protegees. Consentement eclaire, notifications utiles.
      </Text>
      <Card style={{ padding: 20, marginBottom: 16 }}>
        {[
          { icon: 'lock-closed', label: 'Donnees chiffrees de bout en bout', desc: 'Hebergement HDS certifie' },
          { icon: 'finger-print', label: 'Authentification securisee', desc: 'Connexion protegee par mot de passe' },
          { icon: 'notifications', label: 'Notifications intelligentes', desc: 'Alertes sante personnalisees' },
        ].map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: i < 2 ? 18 : 0 }}>
            <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.lineFaint }}>
              <Ionicons name={item.icon as any} size={20} color={C.text} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: C.text, fontSize: 14, fontWeight: '700' }}>{item.label}</Text>
              <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}

// ═══════════════════════════════════════════
// MAIN ONBOARDING SCREEN
// ═══════════════════════════════════════════
const SLIDES = [Slide1, Slide2, Slide3, Slide4, Slide5];
const TOTAL = SLIDES.length;

export default function OnboardingScreen() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [current]);

  const complete = async () => {
    await AsyncStorage.setItem('chutex_onboarding_done', 'true');
    router.replace('/');
  };

  const next = () => {
    if (current < TOTAL - 1) setCurrent(current + 1);
    else complete();
  };

  const SlideComponent = SLIDES[current];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} data-testid="onboarding-screen">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Logo header */}
        <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 24 }}>
          <Image source={require('../assets/images/logo_white.png')} style={{ width: 120, height: 40 }} resizeMode="contain" />
        </View>

        {/* Slide content */}
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <SlideComponent />
        </Animated.View>
      </ScrollView>

      {/* Bottom controls */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingHorizontal: 24, paddingBottom: Platform.OS === 'web' ? 24 : 40, paddingTop: 16,
        backgroundColor: 'rgba(0,0,0,0.9)',
        ...webGlass,
      }}>
        {/* Progress dots */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => setCurrent(i)}>
              <View style={{
                width: i === current ? 24 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === current ? '#FFFFFF' : 'rgba(255,255,255,0.20)',
                transition: 'all 0.3s ease',
              } as any} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Buttons */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {current === TOTAL - 1 ? (
            <>
              <TouchableOpacity
                data-testid="onboarding-skip-care"
                style={{ flex: 1, paddingVertical: 16, borderRadius: Radius.full, borderWidth: 1, borderColor: C.line, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)' }}
                onPress={complete}
              >
                <Text style={{ color: C.textMuted, fontSize: 14, fontWeight: '600' }}>Activer Care plus tard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                data-testid="onboarding-start-btn"
                style={{ flex: 1.5, paddingVertical: 16, borderRadius: Radius.full, backgroundColor: '#FFFFFF', alignItems: 'center', ...(Platform.OS === 'web' ? { boxShadow: '0 4px 20px rgba(255,255,255,0.15)' } : {}) }}
                onPress={complete}
              >
                <Text style={{ color: '#000000', fontSize: 15, fontWeight: '700' }}>Commencer</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                data-testid="onboarding-skip"
                style={{ flex: 0.5, paddingVertical: 16, alignItems: 'center' }}
                onPress={complete}
              >
                <Text style={{ color: C.textDim, fontSize: 13, fontWeight: '600' }}>Passer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                data-testid="onboarding-next-btn"
                style={{ flex: 1, paddingVertical: 16, borderRadius: Radius.full, backgroundColor: '#FFFFFF', alignItems: 'center', ...(Platform.OS === 'web' ? { boxShadow: '0 4px 20px rgba(255,255,255,0.15)' } : {}) }}
                onPress={next}
              >
                <Text style={{ color: '#000000', fontSize: 15, fontWeight: '700' }}>Suivant</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
