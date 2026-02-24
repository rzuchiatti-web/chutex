import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOGO = 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/Logo_chutex_1.png?v=1737551429';

function Typewriter({ text, speed = 30, delay = 300, color = '#FFF' }: any) {
  const [d, setD] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => { setD(''); setDone(false); let i=0; const t=setTimeout(()=>{ const iv=setInterval(()=>{ if(i<text.length){setD(text.slice(0,i+1));i++}else{clearInterval(iv);setDone(true)} },speed); },delay); return ()=>clearTimeout(t); }, [text]);
  if (Platform.OS !== 'web') return <Text style={{ fontSize: 22, fontWeight: '800', color, textAlign: 'center' }}>{text}</Text>;
  return <span style={{ fontSize: 'clamp(18px,5.5vw,26px)', fontWeight: 800, color, lineHeight: 1.25, transition: 'color 0.3s' } as any}>{d}<span style={{ borderRight: `2px solid ${color}`, marginLeft: 2, animation: done ? 'blink-caret 0.8s step-end infinite' : 'none', opacity: done ? 1 : 0 } as any}>&nbsp;</span></span>;
}

const SLIDES = [
  {
    hero: true,
    heroImg: 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/banner_login_mobile.jpg?v=1771242072',
    title: "Construire un avenir ou la longevite, la vitalite et la sante sont portees par la prevention.",
    btnLabel: 'Commencer',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [dark, setDark] = useState(true);
  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;
  const fg = dark ? '#FFF' : '#111';
  const fgSub = dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)';
  const fgMuted = dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)';
  const border = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const hud = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)';

  const finish = async () => { await AsyncStorage.setItem('chutex_onboarding_done', 'true'); router.replace('/'); };
  const next = () => { if (isLast) finish(); else setCurrent(c => c + 1); };

  if (Platform.OS !== 'web') {
    const { SafeAreaView } = require('react-native-safe-area-context');
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, justifyContent: 'center' }}>
          <Image source={{ uri: LOGO }} style={{ width: 100, height: 26, resizeMode: 'contain', alignSelf: 'center', marginBottom: 20 }} />
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

  /* ─── HERO SLIDE (fullscreen image + logo + typewriter) ─── */
  if (Platform.OS === 'web' && slide.hero) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', position: 'relative' } as any}>
        {/* Background image */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: `url(${slide.heroImg})`, backgroundSize: 'cover', backgroundPosition: 'center 30%' } as any} />
        {/* Dark overlay for text readability */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.55) 100%)' } as any} />

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', position: 'relative', zIndex: 10 } as any}>
          <button onClick={finish} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0' } as any}>Passer</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
            <button onClick={() => setDark(!dark)} style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 999, padding: '6px 14px', color: '#FFF', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.3s' } as any}>
              {dark ? 'Light' : 'Dark'}
            </button>
            <div style={{ width: 28, height: 20, borderRadius: 4, overflow: 'hidden', display: 'flex', border: '1px solid rgba(255,255,255,0.2)' } as any}>
              <div style={{ flex: 1, background: '#002395' }} /><div style={{ flex: 1, background: '#FFF' }} /><div style={{ flex: 1, background: '#ED2939' }} />
            </div>
          </div>
        </div>

        {/* Center content — pushed higher */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', position: 'relative', zIndex: 5, padding: '0 24px', paddingTop: '4vh' } as any}>
          <img src={LOGO} alt="Chutex" className="anim-up" style={{ height: 70, width: 'auto', marginBottom: 28, filter: 'drop-shadow(0 0 40px rgba(255,255,255,0.2)) drop-shadow(0 0 80px rgba(255,255,255,0.08))' } as any} />
          <div className="anim-up d2" style={{ textAlign: 'center', maxWidth: 340 } as any}>
            <Typewriter text={slide.title} speed={28} delay={600} color="#FFF" />
          </div>
        </div>

        {/* Bottom: slide-to-confirm button */}
        <div style={{ padding: '16px 24px 36px', position: 'relative', zIndex: 10 } as any}>
          <div data-testid="onboarding-next-btn" style={{
            width: '100%', height: 62, borderRadius: 999, position: 'relative', overflow: 'hidden', cursor: 'pointer',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
            boxShadow: '0 0 50px rgba(255,255,255,0.05), 0 0 100px rgba(255,255,255,0.02), inset 0 0 0 1px rgba(255,255,255,0.04)',
          } as any}
            onMouseDown={(e: any) => {
              const bar = e.currentTarget;
              const thumb = bar.querySelector('[data-thumb]') as HTMLElement;
              if (!thumb) return;
              const rect = bar.getBoundingClientRect();
              const maxX = rect.width - 56;
              let startX = e.clientX;
              const onMove = (ev: any) => {
                const dx = Math.max(0, Math.min(ev.clientX - startX, maxX));
                thumb.style.transform = `translateX(${dx}px)`;
                if (dx > maxX * 0.85) { thumb.style.transform = `translateX(${maxX}px)`; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); next(); }
              };
              const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s ease'; setTimeout(() => { thumb.style.transition = ''; }, 300); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
              document.addEventListener('mousemove', onMove);
              document.addEventListener('mouseup', onUp);
            }}
            onTouchStart={(e: any) => {
              const bar = e.currentTarget;
              const thumb = bar.querySelector('[data-thumb]') as HTMLElement;
              if (!thumb) return;
              const rect = bar.getBoundingClientRect();
              const maxX = rect.width - 56;
              const startX = e.touches[0].clientX;
              const onMove = (ev: any) => {
                const dx = Math.max(0, Math.min(ev.touches[0].clientX - startX, maxX));
                thumb.style.transform = `translateX(${dx}px)`;
                if (dx > maxX * 0.85) { thumb.style.transform = `translateX(${maxX}px)`; bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); next(); }
              };
              const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s ease'; setTimeout(() => { thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); };
              bar.addEventListener('touchmove', onMove, { passive: true });
              bar.addEventListener('touchend', onUp);
            }}
          >
            {/* Thumb */}
            <div data-thumb style={{
              position: 'absolute', top: 4, left: 4, width: 54, height: 54, borderRadius: 999,
              background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              willChange: 'transform', touchAction: 'none',
            } as any}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            {/* Label */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: 600, pointerEvents: 'none', paddingLeft: 40 } as any}>
              Glisser pour commencer
            </div>
          </div>
        </div>

        <style>{`@keyframes scan-line { 0%{transform:translateY(-60%);opacity:0} 15%{opacity:0.25} 50%{opacity:0.4} 85%{opacity:0.25} 100%{transform:translateY(60%);opacity:0} }`}</style>
      </div>
    );
  }

  return (
    <div className={dark ? 'clinic-grid-dark' : 'clinic-grid-light'} style={{ height: '100dvh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', transition: 'background-color 0.4s' } as any}>

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(circle at 50% 25%, ${dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'}, transparent 55%)`, zIndex: 0 } as any} />

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', position: 'relative', zIndex: 10, flexShrink: 0 } as any}>
        <img src={LOGO} alt="Chutex" style={{ height: 20, width: 'auto', filter: dark ? 'none' : 'invert(1)', transition: 'filter 0.3s' } as any} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
          <button onClick={() => setDark(!dark)} data-testid="theme-toggle" style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', border: `1px solid ${border}`, borderRadius: 999, padding: '5px 11px', color: fgSub, fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 0.5, transition: 'all 0.3s' } as any}>
            LIGHT / DARK
          </button>
          {!isLast && <button onClick={finish} style={{ background: 'none', border: 'none', color: fgMuted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: '5px 8px' } as any}>Passer</button>}
        </div>
      </div>

      {/* Content */}
      <div key={`${current}-${dark}`} className="anim-up" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 18px', position: 'relative', zIndex: 5, gap: 12, minHeight: 0 } as any}>

        {/* Media frame */}
        <div style={{ width: '100%', maxWidth: 260, flex: '0 1 auto', maxHeight: '42vh', aspectRatio: '3/4', borderRadius: 18, overflow: 'hidden', border: `1px solid ${border}`, background: dark ? '#000' : '#F0F0F0', position: 'relative' } as any}>
          {[{ top:8,left:8,borderTop:`1px solid ${hud}`,borderLeft:`1px solid ${hud}` },{ top:8,right:8,borderTop:`1px solid ${hud}`,borderRight:`1px solid ${hud}` },{ bottom:8,left:8,borderBottom:`1px solid ${hud}`,borderLeft:`1px solid ${hud}` },{ bottom:8,right:8,borderBottom:`1px solid ${hud}`,borderRight:`1px solid ${hud}` }].map((s,i) =>
            <div key={i} style={{ position:'absolute', width:14, height:14, zIndex:5, pointerEvents:'none', ...s } as any} />
          )}
          <div style={{ position:'absolute', inset:0, zIndex:4, pointerEvents:'none', mixBlendMode:'screen', background:`linear-gradient(to bottom, transparent 0%, ${dark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.02)'} 45%, ${dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.03)'} 50%, ${dark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.02)'} 55%, transparent 100%)`, animation:'scan-line 4.5s ease-in-out infinite' } as any} />

          {slide.video ? (
            <video autoPlay muted loop playsInline style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' } as any}><source src={slide.video} type="video/webm" /></video>
          ) : (
            <div style={{ width:'100%', height:'100%', backgroundImage:`url(${slide.img})`, backgroundSize:slide.imgSize||'95%', backgroundPosition:'center', backgroundRepeat:'no-repeat' } as any} />
          )}

          {slide.hud && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'space-between', padding:8, pointerEvents:'none', zIndex:6 } as any}>
              <div style={{ display:'flex', gap:4 } as any}>
                {['BIOMETRIC','CLINIC'].map(t => <span key={t} style={{ border:`1px solid ${border}`, background:'rgba(0,0,0,0.5)', color:'rgba(255,255,255,0.55)', borderRadius:999, padding:'3px 6px', fontSize:8, letterSpacing:1, textTransform:'uppercase', fontWeight:600 } as any}>{t}</span>)}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(0,0,0,0.5)', borderRadius:8, padding:'5px 8px', fontSize:8, letterSpacing:0.8, textTransform:'uppercase', color:'rgba(255,255,255,0.4)', fontWeight:600 } as any}>
                <span style={{ width:5, height:5, borderRadius:99, background:'#FFF', animation:'pulse-dot 1.8s ease-in-out infinite', flexShrink:0 } as any} />
                SCAN EN COURS
              </div>
            </div>
          )}
        </div>

        {/* Pill */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'6px 14px', borderRadius:999, fontSize:10, fontWeight:600, letterSpacing:1.2, textTransform:'uppercase', background: dark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)', border:`1px solid ${border}`, color:fgSub, animation:'glow-breathe 3s ease-in-out infinite', transition:'all 0.3s' } as any}>
          <span style={{ width:5, height:5, borderRadius:99, background:fg, display:'inline-block', flexShrink:0, animation:'pulse-dot 2s ease-in-out infinite', transition:'background 0.3s' } as any} />
          {slide.pill}
        </div>

        <div style={{ textAlign:'center', maxWidth:340, padding:'0 4px' } as any}>
          <Typewriter text={slide.title} color={fg} />
        </div>

        <p style={{ fontSize:12, color:fgSub, textAlign:'center', maxWidth:300, lineHeight:1.6, margin:0, transition:'color 0.3s' } as any}>{slide.subtitle}</p>

        {slide.chips && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:5, justifyContent:'center' } as any}>
            {slide.chips.map(c => <span key={c} style={{ padding:'4px 10px', borderRadius:999, border:`1px solid ${border}`, color:fgMuted, fontSize:10, transition:'all 0.3s' } as any}>{c}</span>)}
          </div>
        )}
      </div>

      {/* Bottom */}
      <div style={{ padding:'10px 18px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:12, flexShrink:0, zIndex:10 } as any}>
        <div style={{ display:'flex', gap:4 } as any}>
          {SLIDES.map((_,i) => <div key={i} style={{ width:i===current?18:5, height:5, borderRadius:3, backgroundColor:i===current?fg:fgMuted, transition:'all 0.3s' }} />)}
        </div>
        <button onClick={next} data-testid="onboarding-next-btn" className="btn-scan" style={{
          width:'100%', maxWidth:340, padding:'15px', fontSize:14, fontWeight:600, fontFamily:'inherit', cursor:'pointer', borderRadius:999, border:'none',
          background: dark ? '#FFF' : '#111', color: dark ? '#111' : '#FFF',
          boxShadow: dark ? '0 0 24px rgba(255,255,255,0.1), inset 0 0 0 1px rgba(255,255,255,0.3)' : '0 0 24px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(0,0,0,0.1)',
          position:'relative', overflow:'hidden', transition:'all 0.3s',
        } as any}>{isLast ? 'Commencer' : 'Suivant'}</button>
      </div>

      <style>{`
        @keyframes scan-line { 0%{transform:translateY(-60%);opacity:0} 15%{opacity:0.25} 50%{opacity:0.4} 85%{opacity:0.25} 100%{transform:translateY(60%);opacity:0} }
      `}</style>
    </div>
  );
}
