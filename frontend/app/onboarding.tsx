import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, Dimensions, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOGO_URL = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/59sf9nvw_Logo_chutex_Noir.png';

/* ─── JS Typewriter (web only) ─── */
function Typewriter({ text, speed = 40, delay = 500 }: { text: string; speed?: number; delay?: number }) {
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
  if (Platform.OS !== 'web') return <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFF', textAlign: 'center' }}>{text}</Text>;
  return (
    <span style={{ fontSize: 'clamp(20px, 6vw, 30px)', fontWeight: 800, color: '#FFF', lineHeight: 1.25 } as any}>
      {displayed}<span style={{ borderRight: '2.5px solid #FFF', marginLeft: 2, animation: done ? 'blink-caret 0.8s step-end infinite' : 'none', opacity: done ? 1 : 0 } as any}>&nbsp;</span>
    </span>
  );
}

const SLIDES = [
  {
    img: 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/diagnsotick_sante_connecte_chutex.svg?v=1769015947',
    pill: 'VISION 360°',
    title: 'Vision de sante complete.',
    subtitle: 'Une lecture globale, structuree et actionnable : tendances, signaux faibles, priorites et recommandations.',
  },
  {
    img: 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/analyse_sante_connecte_glycemique_chutex_1.svg?v=1769087565',
    pill: 'GLYCEMIE',
    title: 'Estimation glycemique.',
    subtitle: "Suivez l'evolution et obtenez une estimation au quotidien — sans geste invasif, orientee prevention.",
    imgSize: '140%',
  },
  {
    img: 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/teleconsultation_medical_chutex_1.svg?v=1769087585',
    pill: '24/7',
    title: 'Teleconsultation 24/7.',
    subtitle: 'Acces continu a des medecins diplomes : orientation, conseil, suivi — quand vous en avez besoin.',
    imgSize: '135%',
  },
  {
    img: 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme.svg?v=1770109412',
    pill: 'BRACELET ELIO',
    title: 'Vivre en meilleure sante.',
    subtitle: 'Mesures essentielles, detection intelligente, assistance integree — au poignet.',
  },
  {
    img: 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/Balance_connecte_Vita_chutex.svg?v=1769005281',
    pill: 'ECOSYSTEME',
    title: "L'innovation au service de la sante.",
    subtitle: 'Trois dispositifs medicaux connectes, un seul ecosysteme. Diagnostic, prevention et suivi.',
  },
  {
    video: 'https://cdn.shopify.com/videos/c/o/v/9ece2e3b8dd449f2bfbe21695ff47dd8.webm',
    pill: 'CLINIC MODE',
    title: 'Une experience clinique ultra premium.',
    subtitle: 'Diagnostic, prevention, analyse et suivi continu — une interface futuriste pensee comme un cockpit medical.',
    chips: ['Diagnostic', 'Prevention', 'Analyse', 'Suivi', 'Longevite'],
    hud: true,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  const finish = async () => {
    await AsyncStorage.setItem('chutex_onboarding_done', 'true');
    router.replace('/');
  };
  const next = () => { if (isLast) finish(); else setCurrent(c => c + 1); };

  /* ─── NATIVE ─── */
  if (Platform.OS !== 'web') {
    const { SafeAreaView } = require('react-native-safe-area-context');
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
          <Image source={{ uri: LOGO_URL }} style={{ width: 120, height: 30, resizeMode: 'contain', alignSelf: 'center', marginBottom: 24 }} />
          {slide.img && <Image source={{ uri: slide.img }} style={{ width: '100%', height: 240, resizeMode: 'contain', marginBottom: 16, borderRadius: 18, backgroundColor: '#111' }} />}
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFF', textAlign: 'center', marginBottom: 10 }}>{slide.title}</Text>
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22, marginBottom: 28 }}>{slide.subtitle}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
            {SLIDES.map((_, i) => <View key={i} style={{ width: i === current ? 20 : 6, height: 6, borderRadius: 3, backgroundColor: i === current ? '#FFF' : 'rgba(255,255,255,0.15)' }} />)}
          </View>
          <TouchableOpacity onPress={next} style={{ backgroundColor: '#FFF', borderRadius: 9999, paddingVertical: 16, alignItems: 'center' }}>
            <Text style={{ color: '#111', fontSize: 15, fontWeight: '600' }}>{isLast ? 'Commencer' : 'Suivant'}</Text>
          </TouchableOpacity>
          {!isLast && <TouchableOpacity onPress={finish} style={{ marginTop: 14, alignItems: 'center' }}><Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Passer</Text></TouchableOpacity>}
        </ScrollView>
      </SafeAreaView>
    );
  }

  /* ─── WEB ─── */
  return (
    <div className="clinic-grid-dark" style={{ minHeight: '100vh', minHeight: '100dvh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>

      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at 50% 25%, rgba(255,255,255,0.05), transparent 60%)', zIndex: 0 } as any} />

      {/* Top bar: logo + passer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', position: 'relative', zIndex: 10, flexShrink: 0 } as any}>
        <img src={LOGO_URL} alt="Chutex" style={{ height: 22, width: 'auto', filter: 'invert(1)' } as any} />
        {!isLast && (
          <button onClick={finish} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', padding: '8px 12px' } as any}>
            Passer
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div key={current} style={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '8px 20px 0', position: 'relative', zIndex: 5, WebkitOverflowScrolling: 'touch',
      } as any}>

        {/* Media frame */}
        <div style={{
          width: '100%', maxWidth: 300, aspectRatio: '3/4', borderRadius: 20, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)', background: '#000', position: 'relative',
          flexShrink: 0, marginBottom: 20,
        } as any}>
          {/* HUD corners */}
          {[{t:'0',l:'0',bt:'1px',bl:'1px',br:'8px 0 0 0'},{t:'0',r:'0',bt:'1px',bri:'1px',brr:'0 8px 0 0'},{b:'0',l:'0',bb:'1px',bl:'1px',brb:'0 0 0 8px'},{b:'0',r:'0',bb:'1px',bri:'1px',brc:'0 0 8px 0'}].map((c,i) => (
            <div key={i} style={{ position:'absolute', width:16, height:16, zIndex:5, pointerEvents:'none',
              top:c.t!==undefined?10:undefined, bottom:c.b!==undefined?10:undefined,
              left:c.l!==undefined?10:undefined, right:c.r!==undefined?10:undefined,
              borderTop:c.bt?`${c.bt} solid rgba(255,255,255,0.2)`:undefined,
              borderBottom:c.bb?`${c.bb} solid rgba(255,255,255,0.2)`:undefined,
              borderLeft:c.bl?`${c.bl} solid rgba(255,255,255,0.2)`:undefined,
              borderRight:c.bri?`${c.bri} solid rgba(255,255,255,0.2)`:undefined,
            } as any} />
          ))}

          {/* Scan line */}
          <div style={{ position:'absolute', inset:0, zIndex:4, pointerEvents:'none', mixBlendMode:'screen',
            background:'linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 55%, transparent 100%)',
            animation:'scan-line 4.5s ease-in-out infinite',
          } as any} />

          {/* Image or video */}
          {slide.video ? (
            <video autoPlay muted loop playsInline style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' } as any}>
              <source src={slide.video} type="video/webm" />
            </video>
          ) : (
            <div style={{ width:'100%', height:'100%', backgroundImage:`url(${slide.img})`, backgroundSize:slide.imgSize||'100%', backgroundPosition:'center', backgroundRepeat:'no-repeat' } as any} />
          )}

          {/* HUD overlay (video slide) */}
          {slide.hud && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'space-between', padding:10, pointerEvents:'none', zIndex:6 } as any}>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' } as any}>
                {['BIOMETRIC','CLINIC','B/W'].map(t => (
                  <span key={t} style={{ border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.45)', color:'rgba(255,255,255,0.6)', borderRadius:999, padding:'4px 7px', fontSize:9, letterSpacing:1.2, textTransform:'uppercase', fontWeight:600 } as any}>{t}</span>
                ))}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.5)', borderRadius:10, padding:'7px 10px', fontSize:9, letterSpacing:1, textTransform:'uppercase', color:'rgba(255,255,255,0.45)', flexWrap:'wrap', fontWeight:600 } as any}>
                <span style={{ width:6, height:6, borderRadius:99, background:'#FFF', boxShadow:'0 0 6px rgba(255,255,255,0.3)', animation:'pulse-dot 1.8s ease-in-out infinite', flexShrink:0 } as any} />
                SCAN EN COURS <span style={{ opacity:0.4 }}>·</span> ANALYSE
              </div>
            </div>
          )}
        </div>

        {/* Pill */}
        <div className="glass-pill" style={{ color:'rgba(255,255,255,0.6)', marginBottom:14 } as any}>
          <span style={{ width:6, height:6, borderRadius:99, background:'#FFF', display:'inline-block', flexShrink:0, animation:'pulse-dot 2s ease-in-out infinite' } as any} />
          {slide.pill}
        </div>

        {/* Typewriter title */}
        <div style={{ textAlign:'center', maxWidth:360, padding:'0 4px', marginBottom:10 } as any}>
          <Typewriter text={slide.title} speed={35} delay={350} />
        </div>

        {/* Subtitle */}
        <p className="anim-up d3" style={{ fontSize:13, color:'rgba(255,255,255,0.4)', textAlign:'center', maxWidth:320, lineHeight:1.7, margin:'0 0 12px' } as any}>
          {slide.subtitle}
        </p>

        {/* Chips (video slide) */}
        {slide.chips && (
          <div className="anim-up d4" style={{ display:'flex', flexWrap:'wrap', gap:6, justifyContent:'center', marginBottom:8 } as any}>
            {slide.chips.map(c => (
              <span key={c} style={{ padding:'6px 12px', borderRadius:999, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.03)', color:'rgba(255,255,255,0.5)', fontSize:11, fontWeight:500 } as any}>{c}</span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom fixed: dots + button */}
      <div style={{ padding:'12px 20px 28px', display:'flex', flexDirection:'column', alignItems:'center', gap:14, flexShrink:0, position:'relative', zIndex:10 } as any}>
        {/* Dots */}
        <div style={{ display:'flex', gap:5 } as any}>
          {SLIDES.map((_,i) => (
            <div key={i} style={{ width:i===current?20:6, height:6, borderRadius:3, backgroundColor:i===current?'#FFF':'rgba(255,255,255,0.12)', transition:'all 0.3s ease' }} />
          ))}
        </div>

        {/* Glass blur button */}
        <button onClick={next} data-testid="onboarding-next-btn" style={{
          width:'100%', maxWidth:360, padding:'16px', fontSize:15, fontWeight:600,
          fontFamily:'inherit', cursor:'pointer', borderRadius:999,
          background:'rgba(255,255,255,0.1)', backdropFilter:'blur(20px) saturate(150%)', WebkitBackdropFilter:'blur(20px) saturate(150%)',
          color:'#FFF', border:'1px solid rgba(255,255,255,0.12)',
          boxShadow:'0 0 24px rgba(255,255,255,0.04), inset 0 0 0 1px rgba(255,255,255,0.06)',
          transition:'all 0.3s ease', position:'relative', overflow:'hidden',
        } as any}>
          {isLast ? 'Commencer' : 'Suivant'}
        </button>
      </div>

      <style>{`
        @keyframes scan-line {
          0% { transform: translateY(-60%); opacity: 0; }
          15% { opacity: 0.3; }
          50% { opacity: 0.5; }
          85% { opacity: 0.3; }
          100% { transform: translateY(60%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
