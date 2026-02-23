import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'expo-router';
import { apiFetch } from '../src/services/api';

export default function MorningBriefingScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [text, setText] = useState('');
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !user) return;
    started.current = true;

    const name = user?.name?.split(' ')[0] || '';

    // Fetch health summary then start typewriter
    apiFetch('/api/health/summary', {}, token).then((hs: any) => {
      const summary = hs?.summary || 'Votre etat de sante general est stable.';
      const reco = hs?.recommendation || '';
      const fullText = `Bonjour ${name},\n${summary}${reco ? ' ' + reco : ''}`;
      let i = 0;
      const iv = setInterval(() => {
        if (i <= fullText.length) { setText(fullText.slice(0, i)); i++; }
        else {
          clearInterval(iv);
          setTimeout(() => setStep(1), 400);
          setTimeout(() => setStep(2), 1000);
          setTimeout(() => setStep(3), 1600);
          setTimeout(() => { setStep(4); setDone(true); }, 2200);
        }
      }, 28);
    }).catch(() => {
      const fallback = `Bonjour ${name},\nVotre etat de sante est stable. Maintenez vos habitudes.`;
      let i = 0;
      const iv = setInterval(() => {
        if (i <= fallback.length) { setText(fallback.slice(0, i)); i++; }
        else {
          clearInterval(iv);
          setTimeout(() => setStep(1), 400);
          setTimeout(() => setStep(2), 1000);
          setTimeout(() => setStep(3), 1600);
          setTimeout(() => { setStep(4); setDone(true); }, 2200);
        }
      }, 28);
    });
  }, [user]);

  if (Platform.OS !== 'web') return <View style={{ flex: 1, backgroundColor: '#000' }}><Text style={{ color: '#FFF' }}>Briefing</Text></View>;

  const VIDEO = 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/ufilgqml_banner_mobile_chat_ia_bakcground.mp4';
  const objectives = [
    { icon: 'ri-footprint-line', color: '#10B981', t: 'Activite : atteindre 6500 pas aujourd\'hui' },
    { icon: 'ri-drop-line', color: '#38BDF8', t: 'Hydratation : boire au moins 1.5L d\'eau' },
    { icon: 'ri-moon-line', color: '#A78BFA', t: 'Sommeil : coucher avant 23h ce soir' },
    { icon: 'ri-heart-pulse-line', color: '#EF4444', t: 'Tension : controler votre pression arterielle' },
  ];

  return (
    <div data-testid="morning-briefing" style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", background: '#000' } as any}>
      <video autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} src={VIDEO} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.75) 100%)', zIndex: 1 } as any} />

      {/* Content */}
      <div style={{ flex: 1, position: 'relative', zIndex: 5, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 24px 0' } as any}>
        {/* Typewriter */}
        <div style={{ marginBottom: 24 } as any}>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', lineHeight: 1.35, whiteSpace: 'pre-wrap' }}>
            {text}<span style={{ opacity: done ? 0 : 1, transition: 'opacity 0.3s' }}>|</span>
          </div>
        </div>

        {/* Objectives slide in */}
        {step >= 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 } as any}>
            {objectives.map((o, i) => (
              <div key={i} style={{
                padding: '12px 16px', borderRadius: 14,
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)',
                opacity: step > i ? 1 : 0,
                transform: step > i ? 'translateY(0)' : 'translateY(16px)',
                transition: `all 0.5s cubic-bezier(.22,.61,.36,1) ${i * 0.05}s`,
                display: 'flex', alignItems: 'center', gap: 10,
              } as any}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <i className={o.icon} style={{ fontSize: 14, color: o.color }} />
                </div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{o.t}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div style={{ position: 'relative', zIndex: 10, padding: '0 24px 32px' } as any}>
        {done ? (
          <div onClick={() => router.replace('/(tabs)' as any)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.18)', cursor: 'pointer' } as any}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
              <i className="ri-arrow-right-s-line" style={{ fontSize: 24, color: '#111' }} />
            </div>
            <span style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.7)', paddingRight: 20 }}>Glisser pour continuer</span>
          </div>
        ) : (
          <div style={{ padding: '16px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.15)' } as any}>
            Analyse en cours...
          </div>
        )}
      </div>
    </div>
  );
}
