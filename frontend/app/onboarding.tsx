import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SW } = Dimensions.get('window');

/* ─── JS Typewriter ─── */
function Typewriter({ text, speed = 40, delay = 500, onDone }: { text: string; speed?: number; delay?: number; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed(''); setDone(false);
    let i = 0;
    const t = setTimeout(() => {
      const iv = setInterval(() => {
        if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++; }
        else { clearInterval(iv); setDone(true); onDone?.(); }
      }, speed);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [text]);
  if (Platform.OS !== 'web') return <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFF' }}>{text}</Text>;
  return (
    <span style={{ fontSize: 'clamp(24px, 7vw, 34px)', fontWeight: 800, color: '#FFF', lineHeight: 1.2 } as any}>
      {displayed}<span style={{ borderRight: '2.5px solid #FFF', marginLeft: 2, animation: done ? 'blink-caret 0.8s step-end infinite' : 'none', opacity: done ? 1 : 0 } as any}>&nbsp;</span>
    </span>
  );
}

/* ─── Slide data ─── */
const SLIDES = [
  {
    img: 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/diagnsotick_sante_connecte_chutex.svg?v=1769015947',
    pill: 'VISION 360°', pillDot: true,
    title: 'Vision de sante complete.',
    subtitle: 'Une lecture globale, structuree et actionnable : tendances, signaux faibles, priorites et recommandations.',
  },
  {
    img: 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/analyse_sante_connecte_glycemique_chutex_1.svg?v=1769087565',
    pill: 'GLYCEMIE', pillDot: true,
    title: 'Estimation glycemique.',
    subtitle: "Suivez l'evolution et obtenez une estimation au quotidien — sans geste invasif, orientee prevention.",
    imgSize: '140%',
  },
  {
    img: 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/teleconsultation_medical_chutex_1.svg?v=1769087585',
    pill: '24/7', pillDot: true,
    title: 'Teleconsultation 24/7.',
    subtitle: 'Acces continu a des medecins diplomes : orientation, conseil, suivi — quand vous en avez besoin.',
    imgSize: '135%',
  },
  {
    img: 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme.svg?v=1770109412',
    pill: 'BRACELET ELIO', pillDot: true,
    title: 'Vivre en meilleure sante.',
    subtitle: 'Mesures essentielles, detection intelligente, assistance integree — au poignet.',
  },
  {
    img: 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/Balance_connecte_Vita_chutex.svg?v=1769005281',
    pill: 'ECOSYSTEME', pillDot: true,
    title: "L'innovation au service de la sante.",
    subtitle: 'Trois dispositifs medicaux connectes, un seul ecosysteme de sante. Diagnostic, prevention et suivi.',
  },
  {
    video: 'https://cdn.shopify.com/videos/c/o/v/9ece2e3b8dd449f2bfbe21695ff47dd8.webm',
    pill: 'CLINIC MODE', pillDot: true,
    title: 'Une experience clinique ultra premium.',
    subtitle: 'Diagnostic, prevention, analyse et suivi continu — une interface futuriste pensee comme un cockpit medical.',
    chips: ['Diagnostic', 'Prevention', 'Analyse', 'Suivi', 'Longevite'],
    hud: true,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [entering, setEntering] = useState(true);
  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  useEffect(() => {
    setEntering(true);
    const t = setTimeout(() => setEntering(false), 50);
    return () => clearTimeout(t);
  }, [current]);

  const finish = async () => {
    await AsyncStorage.setItem('chutex_onboarding_done', 'true');
    router.replace('/');
  };

  const next = () => {
    if (isLast) { finish(); return; }
    setCurrent(c => c + 1);
  };

  if (Platform.OS !== 'web') {
    const { SafeAreaView } = require('react-native-safe-area-context');
    const { Image, ScrollView } = require('react-native');
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)', textAlign: 'center', letterSpacing: 2, marginBottom: 20 }}>CARE WATCH</Text>
          {slide.img && <Image source={{ uri: slide.img }} style={{ width: '100%', height: 280, resizeMode: 'contain', marginBottom: 20, borderRadius: 18, backgroundColor: '#111' }} />}
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#FFF', textAlign: 'center', marginBottom: 12 }}>{slide.title}</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>{slide.subtitle}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
            {SLIDES.map((_, i) => <View key={i} style={{ width: i === current ? 24 : 6, height: 6, borderRadius: 3, backgroundColor: i === current ? '#FFF' : 'rgba(255,255,255,0.2)' }} />)}
          </View>
          <TouchableOpacity onPress={next} style={{ backgroundColor: '#FFF', borderRadius: 9999, paddingVertical: 16, alignItems: 'center' }}>
            <Text style={{ color: '#111', fontSize: 15, fontWeight: '600' }}>{isLast ? 'Commencer' : 'Suivant'}</Text>
          </TouchableOpacity>
          {!isLast && <TouchableOpacity onPress={finish} style={{ marginTop: 16, alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Passer</Text></TouchableOpacity>}
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ─── WEB ─── */
  return (
    <div className="clinic-grid-dark" style={{
      minHeight: '100vh', minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', position: 'relative',
    } as any}>

      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.06), transparent 60%)', zIndex: 0 } as any} />

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', position: 'relative', zIndex: 10 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 } as any}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF', letterSpacing: 5 }}>CHUTE</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#FFF', letterSpacing: 5, fontStyle: 'italic' }}>X</span>
        </div>
        {!isLast && (
          <button onClick={finish} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', padding: '8px 12px' } as any}>
            Passer
          </button>
        )}
      </div>

      {/* Main content */}
      <div key={current} style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '0 20px 20px', position: 'relative', zIndex: 5, gap: 20,
        animation: entering ? 'none' : 'enterUp 0.6s cubic-bezier(.4,0,.15,1) both',
      } as any}>

        {/* Media zone */}
        <div style={{
          width: '100%', maxWidth: 340, aspectRatio: '4/5', borderRadius: 22, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)', background: '#000', position: 'relative',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        } as any}>
          {/* HUD corners */}
          <div style={{ position: 'absolute', inset: 10, pointerEvents: 'none', zIndex: 5 } as any}>
            {['top:0;left:0;border-top:1px solid rgba(255,255,255,0.2);border-left:1px solid rgba(255,255,255,0.2);border-radius:8px 0 0 0',
              'top:0;right:0;border-top:1px solid rgba(255,255,255,0.2);border-right:1px solid rgba(255,255,255,0.2);border-radius:0 8px 0 0',
              'bottom:0;left:0;border-bottom:1px solid rgba(255,255,255,0.2);border-left:1px solid rgba(255,255,255,0.2);border-radius:0 0 0 8px',
              'bottom:0;right:0;border-bottom:1px solid rgba(255,255,255,0.2);border-right:1px solid rgba(255,255,255,0.2);border-radius:0 0 8px 0',
            ].map((s, i) => <div key={i} style={{ position: 'absolute', width: 18, height: 18, ...Object.fromEntries(s.split(';').map(p => { const [k,v] = p.split(':'); return [k.trim().replace(/-([a-z])/g, (_:any,c:string)=>c.toUpperCase()), v?.trim()]; })) } as any} />)}
          </div>

          {/* Scan line */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none', mixBlendMode: 'screen',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.05) 55%, transparent 100%)',
            animation: 'scan-line 4s ease-in-out infinite',
          } as any} />

          {/* Glow */}
          <div style={{
            position: 'absolute', inset: -1, borderRadius: 24, pointerEvents: 'none', zIndex: 1,
            background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.12), transparent 55%), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.08), transparent 55%)',
            filter: 'blur(16px)', opacity: 0.5,
          } as any} />

          {/* Content: image or video */}
          {slide.video ? (
            <video autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: 'contrast(1.08)' } as any}>
              <source src={slide.video} type="video/webm" />
            </video>
          ) : (
            <div style={{
              width: '100%', height: '100%',
              backgroundImage: `url(${slide.img})`,
              backgroundSize: slide.imgSize || '100%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            } as any} />
          )}

          {/* HUD overlay for video slide */}
          {slide.hud && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 12, pointerEvents: 'none', zIndex: 6 } as any}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' } as any}>
                {['BIOMETRIC', 'CLINIC', 'B/W'].map(t => (
                  <span key={t} style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.65)', borderRadius: 999, padding: '5px 8px', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 } as any}>{t}</span>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: '8px 12px', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', flexWrap: 'wrap', fontWeight: 600 } as any}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: '#FFF', boxShadow: '0 0 8px rgba(255,255,255,0.3)', animation: 'pulse-dot 1.8s ease-in-out infinite', flexShrink: 0 } as any} />
                <span>SCAN EN COURS</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>ANALYSE MULTI-DIMENSIONNELLE</span>
              </div>
            </div>
          )}
        </div>

        {/* Pill badge */}
        <div className="glass-pill" style={{ color: 'rgba(255,255,255,0.65)', animationDelay: '0.2s' } as any}>
          {slide.pillDot && <span style={{ width: 7, height: 7, borderRadius: 99, background: '#FFF', display: 'inline-block', flexShrink: 0, animation: 'pulse-dot 2s ease-in-out infinite' } as any} />}
          {slide.pill}
        </div>

        {/* Typewriter title */}
        <div style={{ textAlign: 'center', maxWidth: 380, padding: '0 8px' } as any}>
          <Typewriter text={slide.title} speed={35} delay={400} />
        </div>

        {/* Subtitle */}
        <p className="anim-up d3" style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center', maxWidth: 340, lineHeight: 1.7, margin: 0 } as any}>
          {slide.subtitle}
        </p>

        {/* Chips for video slide */}
        {slide.chips && (
          <div className="anim-up d4" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' } as any}>
            {slide.chips.map(c => (
              <span key={c} style={{ padding: '8px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 500 } as any}>{c}</span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom: dots + button */}
      <div style={{ padding: '0 20px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, position: 'relative', zIndex: 10 } as any}>
        {/* Dots */}
        <div style={{ display: 'flex', gap: 6 } as any}>
          {SLIDES.map((_, i) => (
            <div key={i} style={{
              width: i === current ? 24 : 6, height: 6, borderRadius: 3,
              backgroundColor: i === current ? '#FFF' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.35s cubic-bezier(.4,0,.15,1)',
            }} />
          ))}
        </div>

        {/* Glass blur button (Apple iOS style) */}
        <button onClick={next} className="btn-scan" data-testid="onboarding-next-btn" style={{
          width: '100%', maxWidth: 380, padding: '18px 32px', fontSize: 16, fontWeight: 600,
          fontFamily: 'inherit', cursor: 'pointer',
          background: 'rgba(255,255,255,0.12)',
          backdropFilter: 'blur(20px) saturate(150%)',
          WebkitBackdropFilter: 'blur(20px) saturate(150%)',
          color: '#FFF',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 999,
          boxShadow: '0 0 30px rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.08)',
          transition: 'all 0.3s cubic-bezier(.4,0,.15,1)',
          position: 'relative', overflow: 'hidden',
        } as any}>
          {isLast ? 'Commencer' : 'Suivant'}
        </button>
      </div>

      {/* Extra CSS for this page */}
      <style>{`
        @keyframes scan-line {
          0% { transform: translateY(-60%); opacity: 0; }
          20% { opacity: 0.3; }
          50% { opacity: 0.5; }
          80% { opacity: 0.3; }
          100% { transform: translateY(60%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
