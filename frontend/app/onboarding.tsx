import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LanguagePicker from '../src/components/LanguagePicker';
import NativePageView from '../src/components/NativePageView';

const LOGO = 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/Logo_chutex_1.png?v=1737551429';

function Typewriter({ text, speed = 30, delay = 300, color = '#FFF' }: any) {
  const [d, setD] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => { setD(''); setDone(false); let i=0; const t=setTimeout(()=>{ const iv=setInterval(()=>{ if(i<text.length){setD(text.slice(0,i+1));i++}else{clearInterval(iv);setDone(true)} },speed); },delay); return ()=>clearTimeout(t); }, [text]);
  if (Platform.OS !== 'web') return <Text style={{ fontSize: 22, fontWeight: '800', color, textAlign: 'center' }}>{text}</Text>;
  return <span style={{ fontSize: 'clamp(18px,5.5vw,26px)', fontWeight: 800, color, lineHeight: 1.25 } as any}>{d}<span style={{ borderRight: `2px solid ${color}`, marginLeft: 2, animation: done ? 'blink-caret 0.8s step-end infinite' : 'none', opacity: done ? 1 : 0 } as any}>&nbsp;</span></span>;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [lang, setLang] = useState('fr');

  useEffect(() => { AsyncStorage.getItem('chutex_lang').then(v => { if (v) setLang(v); }).catch(() => {}); }, []);

  const finish = async () => { await AsyncStorage.setItem('chutex_onboarding_done', 'true'); router.replace('/'); };

  if (Platform.OS !== 'web') {
    return <NativePageView path="/onboarding" />;
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', position: 'relative' } as any}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: 'url(https://cdn.shopify.com/s/files/1/0886/1918/8558/files/banner_login_mobile.jpg?v=1771242072)', backgroundSize: 'cover', backgroundPosition: 'center 30%' } as any} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.55) 100%)' } as any} />

      {/* Center content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', position: 'relative', zIndex: 5, padding: '0 24px', paddingTop: '6vh' } as any}>
        {/* Language picker centered above logo */}
        <div style={{ marginBottom: 20 } as any}>
          <LanguagePicker lang={lang} setLang={setLang} />
        </div>

        <img src={LOGO} alt="Chutex" style={{ height: 70, width: 'auto', marginBottom: 28, filter: 'drop-shadow(0 0 40px rgba(255,255,255,0.2)) drop-shadow(0 0 80px rgba(255,255,255,0.08))' } as any} />
        <div style={{ textAlign: 'center', maxWidth: 340 } as any}>
          <Typewriter text="Construire un avenir ou la longevite, la vitalite et la sante sont portees par la prevention." speed={28} delay={600} color="#FFF" />
        </div>
      </div>

      {/* Bottom: slide-to-confirm */}
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
              if (dx > maxX * 0.85) { thumb.style.transform = `translateX(${maxX}px)`; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); finish(); }
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
              if (dx > maxX * 0.85) { thumb.style.transform = `translateX(${maxX}px)`; bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); finish(); }
            };
            const onUp = () => { thumb.style.transform = 'translateX(0)'; thumb.style.transition = 'transform 0.3s ease'; setTimeout(() => { thumb.style.transition = ''; }, 300); bar.removeEventListener('touchmove', onMove); bar.removeEventListener('touchend', onUp); };
            bar.addEventListener('touchmove', onMove, { passive: true });
            bar.addEventListener('touchend', onUp);
          }}
        >
          <div data-thumb style={{
            position: 'absolute', top: 4, left: 4, width: 54, height: 54, borderRadius: 999,
            background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(0,0,0,0.15)', willChange: 'transform', touchAction: 'none',
          } as any}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: 600, pointerEvents: 'none', paddingLeft: 40 } as any}>
            Glisser pour commencer
          </div>
        </div>
      </div>
    </div>
  );
}
