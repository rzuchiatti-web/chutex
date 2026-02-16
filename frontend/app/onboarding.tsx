import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, Dimensions, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/59sf9nvw_Logo_chutex_Noir.png';

function Typewriter({ text, speed = 40, delay = 400 }: { text: string; speed?: number; delay?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(''); setDone(false);
    let i = 0;
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++; }
        else { clearInterval(iv); setDone(true); }
      }, speed);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [text]);
  if (Platform.OS !== 'web') return <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFF', textAlign: 'center' }}>{text}</Text>;
  return (
    <span style={{ fontSize: 'clamp(18px, 5.5vw, 26px)', fontWeight: 800, color: '#FFF', lineHeight: 1.25 } as any}>
      {displayed}<span style={{ borderRight: '2px solid #FFF', marginLeft: 2, animation: done ? 'blink-caret 0.8s step-end infinite' : 'none', opacity: done ? 1 : 0 } as any}>&nbsp;</span>
    </span>
  );
}

const SLIDES = [
  {
    img: 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/diagnsotick_sante_connecte_chutex.svg?v=1769015947',
    pill: 'VISION 360°', title: 'Vision de sante complete.',
    subtitle: 'Tendances, signaux faibles, priorites et recommandations.',
  },
  {
    img: 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/analyse_sante_connecte_glycemique_chutex_1.svg?v=1769087565',
    pill: 'GLYCEMIE', title: 'Estimation glycemique.', imgSize: '140%',
    subtitle: "Estimation au quotidien — sans geste invasif.",
  },
  {
    img: 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/teleconsultation_medical_chutex_1.svg?v=1769087585',
    pill: '24/7', title: 'Teleconsultation 24/7.', imgSize: '135%',
    subtitle: 'Acces continu a des medecins diplomes.',
  },
  {
    img: 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme.svg?v=1770109412',
    pill: 'BRACELET ELIO', title: 'Vivre en meilleure sante.',
    subtitle: 'Mesures essentielles, detection intelligente.',
  },
  {
    img: 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/Balance_connecte_Vita_chutex.svg?v=1769005281',
    pill: 'ECOSYSTEME', title: "L'innovation au service de la sante.",
    subtitle: 'Trois dispositifs, un ecosysteme de sante.',
  },
  {
    video: 'https://cdn.shopify.com/videos/c/o/v/9ece2e3b8dd449f2bfbe21695ff47dd8.webm',
    pill: 'CLINIC MODE', title: 'Experience clinique ultra premium.',
    subtitle: 'Interface futuriste, cockpit medical.',
    chips: ['Diagnostic', 'Prevention', 'Analyse', 'Suivi'],
    hud: true,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  const finish = async () => { await AsyncStorage.setItem('chutex_onboarding_done', 'true'); router.replace('/'); };
  const next = () => { if (isLast) finish(); else setCurrent(c => c + 1); };

  if (Platform.OS !== 'web') {
    const { SafeAreaView } = require('react-native-safe-area-context');
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, justifyContent: 'center' }}>
          <Image source={require('../assets/images/logo_white.png')} style={{ width: 100, height: 26, resizeMode: 'contain', alignSelf: 'center', marginBottom: 20 }} />
          {slide.img && <Image source={{ uri: slide.img }} style={{ width: '100%', height: 200, resizeMode: 'contain', marginBottom: 14, borderRadius: 16, backgroundColor: '#111' }} />}
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFF', textAlign: 'center', marginBottom: 8 }}>{slide.title}</Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>{slide.subtitle}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, marginBottom: 16 }}>
            {SLIDES.map((_, i) => <View key={i} style={{ width: i === current ? 18 : 5, height: 5, borderRadius: 3, backgroundColor: i === current ? '#FFF' : 'rgba(255,255,255,0.12)' }} />)}
          </View>
          <TouchableOpacity onPress={next} style={{ backgroundColor: '#FFF', borderRadius: 9999, paddingVertical: 14, alignItems: 'center' }}>
            <Text style={{ color: '#111', fontSize: 14, fontWeight: '600' }}>{isLast ? 'Commencer' : 'Suivant'}</Text>
          </TouchableOpacity>
          {!isLast && <TouchableOpacity onPress={finish} style={{ marginTop: 12, alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Passer</Text></TouchableOpacity>}
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ─── WEB — tout tient en 1 page, pas de scroll ─── */
  return (
    <div className="clinic-grid-dark" style={{
      height: '100vh', height: '100dvh', display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden',
    } as any}>

      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 50% 25%, rgba(255,255,255,0.04), transparent 55%)', zIndex: 0 } as any} />

      {/* Top: logo + passer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', position: 'relative', zIndex: 10, flexShrink: 0 } as any}>
        <img src={LOGO_URL} alt="Chutex" style={{ height: 20, width: 'auto', filter: 'invert(1)' } as any} />
        {!isLast && <button onClick={finish} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', padding: '6px 10px' } as any}>Passer</button>}
      </div>

      {/* Middle: media + text — takes remaining space */}
      <div key={current} className="anim-up" style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0 18px', position: 'relative', zIndex: 5, gap: 12, minHeight: 0,
      } as any}>

        {/* Media */}
        <div style={{
          width: '100%', maxWidth: 260, flex: '0 1 auto', maxHeight: '42vh',
          aspectRatio: '3/4', borderRadius: 18, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.07)', background: '#000', position: 'relative',
        } as any}>
          {/* HUD corners */}
          {[
            { top: 8, left: 8, borderTop: '1px solid rgba(255,255,255,0.18)', borderLeft: '1px solid rgba(255,255,255,0.18)' },
            { top: 8, right: 8, borderTop: '1px solid rgba(255,255,255,0.18)', borderRight: '1px solid rgba(255,255,255,0.18)' },
            { bottom: 8, left: 8, borderBottom: '1px solid rgba(255,255,255,0.18)', borderLeft: '1px solid rgba(255,255,255,0.18)' },
            { bottom: 8, right: 8, borderBottom: '1px solid rgba(255,255,255,0.18)', borderRight: '1px solid rgba(255,255,255,0.18)' },
          ].map((s, i) => <div key={i} style={{ position: 'absolute', width: 14, height: 14, zIndex: 5, pointerEvents: 'none', ...s } as any} />)}

          {/* Scan line */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none', mixBlendMode: 'screen',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.04) 55%, transparent 100%)',
            animation: 'scan-line 4.5s ease-in-out infinite',
          } as any} />

          {slide.video ? (
            <video autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' } as any}>
              <source src={slide.video} type="video/webm" />
            </video>
          ) : (
            <div style={{ width: '100%', height: '100%', backgroundImage: `url(${slide.img})`, backgroundSize: slide.imgSize || '95%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' } as any} />
          )}

          {/* HUD overlay (video slide) */}
          {slide.hud && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 8, pointerEvents: 'none', zIndex: 6 } as any}>
              <div style={{ display: 'flex', gap: 4 } as any}>
                {['BIOMETRIC', 'CLINIC'].map(t => (
                  <span key={t} style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.55)', borderRadius: 999, padding: '3px 6px', fontSize: 8, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 600 } as any}>{t}</span>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.5)', borderRadius: 8, padding: '5px 8px', fontSize: 8, letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 600 } as any}>
                <span style={{ width: 5, height: 5, borderRadius: 99, background: '#FFF', animation: 'pulse-dot 1.8s ease-in-out infinite', flexShrink: 0 } as any} />
                SCAN EN COURS
              </div>
            </div>
          )}
        </div>

        {/* Pill */}
        <div className="glass-pill" style={{ color: 'rgba(255,255,255,0.55)', padding: '6px 14px', fontSize: 10 } as any}>
          <span style={{ width: 5, height: 5, borderRadius: 99, background: '#FFF', display: 'inline-block', flexShrink: 0, animation: 'pulse-dot 2s ease-in-out infinite' } as any} />
          {slide.pill}
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', maxWidth: 340, padding: '0 4px' } as any}>
          <Typewriter text={slide.title} speed={30} delay={300} />
        </div>

        {/* Subtitle */}
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', maxWidth: 300, lineHeight: 1.6, margin: 0 } as any}>
          {slide.subtitle}
        </p>

        {/* Chips */}
        {slide.chips && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, justifyContent: 'center' } as any}>
            {slide.chips.map(c => (
              <span key={c} style={{ padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', fontSize: 10 } as any}>{c}</span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom: dots + button — NO fixed, in flow */}
      <div style={{ padding: '10px 18px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, flexShrink: 0, zIndex: 10 } as any}>
        <div style={{ display: 'flex', gap: 4 } as any}>
          {SLIDES.map((_, i) => (
            <div key={i} style={{ width: i === current ? 18 : 5, height: 5, borderRadius: 3, backgroundColor: i === current ? '#FFF' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s ease' }} />
          ))}
        </div>

        {/* White scan button */}
        <button onClick={next} data-testid="onboarding-next-btn" className="btn-scan" style={{
          width: '100%', maxWidth: 340, padding: '15px', fontSize: 14, fontWeight: 600,
          fontFamily: 'inherit', cursor: 'pointer',
        } as any}>
          {isLast ? 'Commencer' : 'Suivant'}
        </button>
      </div>

      <style>{`
        @keyframes scan-line {
          0% { transform: translateY(-60%); opacity: 0; }
          15% { opacity: 0.25; }
          50% { opacity: 0.4; }
          85% { opacity: 0.25; }
          100% { transform: translateY(60%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
