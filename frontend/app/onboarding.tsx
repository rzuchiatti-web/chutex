import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LanguagePicker from '../src/components/LanguagePicker';
import NativePageView from '../src/components/NativePageView';
import { useI18n } from '../src/context/I18nContext';

const LOGO = 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/Logo_chutex_1.png?v=1737551429';
const NORA_VIDEO = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4';

function Typewriter({ text, speed = 30, delay = 300, color = '#FFF' }: any) {
  const [d, setD] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => { setD(''); setDone(false); let i=0; const t=setTimeout(()=>{ const iv=setInterval(()=>{ if(i<text.length){setD(text.slice(0,i+1));i++}else{clearInterval(iv);setDone(true)} },speed); },delay); return ()=>clearTimeout(t); }, [text]);
  if (Platform.OS !== 'web') return <Text style={{ fontSize: 22, fontWeight: '800', color, textAlign: 'center' }}>{text}</Text>;
  return <span style={{ fontSize: 'clamp(18px,5.5vw,26px)', fontWeight: 800, color, lineHeight: 1.25 } as any}>{d}<span style={{ borderRight: `2px solid ${color}`, marginLeft: 2, animation: done ? 'blink-caret 0.8s step-end infinite' : 'none', opacity: done ? 1 : 0 } as any}>&nbsp;</span></span>;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { lang, setLang, t } = useI18n();
  const [step, setStep] = useState(0); // 0=slide, 1=nora intro

  const finish = async () => { await AsyncStorage.setItem('chutex_onboarding_done', 'true'); router.replace('/'); };
  const goToNora = () => setStep(1);

  if (Platform.OS !== 'web') return <NativePageView path="/onboarding" />;

  if (step === 1) return <NoraIntroSlide onContinue={finish} />;

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', position: 'relative' } as any}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: 'url(https://cdn.shopify.com/s/files/1/0886/1918/8558/files/banner_login_mobile.jpg?v=1771242072)', backgroundSize: 'cover', backgroundPosition: 'center 30%' } as any} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.55) 100%)' } as any} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', position: 'relative', zIndex: 5, padding: '0 24px', paddingTop: '6vh' } as any}>
        <div style={{ marginBottom: 20 } as any}><LanguagePicker lang={lang} setLang={setLang} /></div>
        <img src={LOGO} alt="Chutex" style={{ height: 70, width: 'auto', marginBottom: 28, filter: 'drop-shadow(0 0 40px rgba(255,255,255,0.2))' } as any} />
        <div style={{ textAlign: 'center', maxWidth: 340 } as any}>
          <Typewriter text={t('onboarding_tagline')} speed={28} delay={600} color="#FFF" />
        </div>
      </div>
      <div style={{ padding: '16px 24px 36px', position: 'relative', zIndex: 10 } as any}>
        <div data-testid="onboarding-next-btn" style={{ width: '100%', height: 62, borderRadius: 999, position: 'relative', overflow: 'hidden', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' } as any}
          onMouseDown={(e: any) => { const bar=e.currentTarget; const thumb=bar.querySelector('[data-thumb]') as HTMLElement; if(!thumb) return; const rect=bar.getBoundingClientRect(); const maxX=rect.width-56; let startX=e.clientX; const onMove=(ev: any)=>{ const dx=Math.max(0,Math.min(ev.clientX-startX,maxX)); thumb.style.transform=`translateX(${dx}px)`; if(dx>maxX*0.85){thumb.style.transform=`translateX(${maxX}px)`;document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp);goToNora();}}; const onUp=()=>{thumb.style.transform='translateX(0)';thumb.style.transition='transform 0.3s ease';setTimeout(()=>{thumb.style.transition='';},300);document.removeEventListener('mousemove',onMove);document.removeEventListener('mouseup',onUp);}; document.addEventListener('mousemove',onMove); document.addEventListener('mouseup',onUp); }}
          onTouchStart={(e: any) => { const bar=e.currentTarget; const thumb=bar.querySelector('[data-thumb]') as HTMLElement; if(!thumb) return; const rect=bar.getBoundingClientRect(); const maxX=rect.width-56; const startX=e.touches[0].clientX; const onMove=(ev: any)=>{ const dx=Math.max(0,Math.min(ev.touches[0].clientX-startX,maxX)); thumb.style.transform=`translateX(${dx}px)`; if(dx>maxX*0.85){thumb.style.transform=`translateX(${maxX}px)`;bar.removeEventListener('touchmove',onMove);bar.removeEventListener('touchend',onUp);goToNora();}}; const onUp=()=>{thumb.style.transform='translateX(0)';thumb.style.transition='transform 0.3s ease';setTimeout(()=>{thumb.style.transition='';},300);bar.removeEventListener('touchmove',onMove);bar.removeEventListener('touchend',onUp);}; bar.addEventListener('touchmove',onMove,{passive:true}); bar.addEventListener('touchend',onUp); }}>
          <div data-thumb style={{ position: 'absolute', top: 4, left: 4, width: 54, height: 54, borderRadius: 999, background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', willChange: 'transform', touchAction: 'none' } as any}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 5l7 7-7 7" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: 600, pointerEvents: 'none', paddingLeft: 40 } as any}>{t('slide_start')}</div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════ */
/*  NORA INTRO SLIDE — fond noir, video premium   */
/* ═══════════════════════════════════════════════ */
function NoraIntroSlide({ onContinue }: { onContinue: () => void }) {
  const [entered, setEntered] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const [showBtn, setShowBtn] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const lines = [
    'Je suis Nora.',
    '',
    'Votre intelligence sante\npersonnelle.',
    '',
    'Je surveille votre sante\nen temps reel.',
    '',
    'Frequence cardiaque.\nSommeil. Activite.',
    '',
    'Vos proches restent\ninformes et rassures.',
    '',
    'Bienvenue.',
  ];

  useEffect(() => {
    setTimeout(() => setEntered(true), 50);
    let lineIdx = 0;
    const startDelay = setTimeout(() => {
      const iv = setInterval(() => {
        lineIdx++;
        if (lineIdx <= lines.length) {
          setVisibleLines(lineIdx);
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        } else {
          clearInterval(iv);
          setTimeout(() => setShowBtn(true), 600);
        }
      }, 800);
    }, 2000);
    // Safety: show button after 25s regardless
    const safety = setTimeout(() => setShowBtn(true), 25000);
    return () => { clearTimeout(startDelay); clearTimeout(safety); };
  }, []);

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', background: '#000', position: 'relative', overflow: 'hidden' } as any}>

      {/* Nora video — stays big at top */}
      <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: '70px', paddingBottom: 16 } as any}>
        <video autoPlay loop muted playsInline style={{
          width: 160, height: 160,
          objectFit: 'contain', borderRadius: 50,
          opacity: entered ? 1 : 0,
          filter: entered ? 'none' : 'blur(20px)',
          transition: 'opacity 1.4s ease 0.1s, filter 1.4s ease 0.1s',
        } as any} src={NORA_VIDEO} />
      </div>

      {/* Scrolling text content */}
      <div ref={scrollRef as any} style={{ flex: 1, overflowY: 'auto', padding: '0 32px', WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth', position: 'relative', zIndex: 5 } as any}>
        <div style={{ textAlign: 'center', paddingBottom: 40 } as any}>
          {lines.slice(0, visibleLines).map((line, i) => {
            if (line === '') return <div key={i} style={{ height: 24 } as any} />;
            return (
              <div key={i} style={{
                fontSize: 17, fontWeight: 700, color: '#FFF', lineHeight: 1.5,
                whiteSpace: 'pre-wrap', marginBottom: 4,
                opacity: 0, animation: 'noraLineIn 0.8s cubic-bezier(0.22,0.61,0.36,1) forwards',
              } as any}>
                {line}
              </div>
            );
          })}
        </div>
      </div>

      {/* Continue button */}
      <div style={{ padding: '16px 32px calc(env(safe-area-inset-bottom, 20px) + 16px)', position: 'relative', zIndex: 10, flexShrink: 0 } as any}>
        {showBtn ? (
          <div data-testid="nora-continue-btn" onClick={onContinue} style={{
            padding: '18px', borderRadius: 999, background: '#FFF', color: '#000',
            textAlign: 'center', fontSize: 16, fontWeight: 800, cursor: 'pointer',
            animation: 'noraLineIn 0.6s cubic-bezier(0.22,0.61,0.36,1) both',
            transition: 'transform 0.2s',
          } as any}
            onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
            Continuer
          </div>
        ) : (
          <div data-testid="nora-skip-btn" onClick={onContinue} style={{ textAlign: 'center', padding: 12, cursor: 'pointer' } as any}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.25)' }}>Passer</span>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: '@keyframes noraLineIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}' }} />
    </div>
  );
}
