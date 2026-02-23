import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

export default function MorningBriefingScreen() {
  const { user, token } = useAuth();
  const [text, setText] = useState('');
  const [visibleObjs, setVisibleObjs] = useState(0);
  const [done, setDone] = useState(false);
  const [objectives, setObjectives] = useState<any[]>([]);
  const started = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (started.current || !user) return;
    started.current = true;
    const name = user?.name?.split(' ')[0] || '';

    Promise.all([
      apiFetch('/api/health/summary', {}, token).catch(() => null),
      apiFetch('/api/devices/dashboard-summary', {}, token).catch(() => null),
    ]).then(([hs, dash]) => {
      const summary = hs?.summary || 'Vos constantes sont stables.';
      const reco = hs?.recommendation || '';
      const fullText = `Bonjour ${name},\n${summary}${reco ? ' ' + reco : ''}`;

      const br = dash?.bracelet || {};
      const sc = dash?.scale || {};
      const steps = br.steps || 3800;
      const targetSteps = steps < 4000 ? 6000 : steps < 6000 ? 8000 : 10000;
      const water = sc.water_pct || 55;
      const targetWater = water < 50 ? '2L' : water < 55 ? '1.8L' : '1.5L';
      const bp = br.blood_pressure || {};
      const sys = bp.systolic || 125;
      const sleepQ = br.sleep_quality || 82;
      const bedtime = sleepQ < 70 ? '22h00' : sleepQ < 85 ? '22h30' : '23h00';

      setObjectives([
        { icon: 'ri-footprint-line', color: '#10B981', label: 'Activite', value: `${targetSteps.toLocaleString()} pas`, detail: `Hier ${steps.toLocaleString()} pas. +${(targetSteps - steps).toLocaleString()} pour l'objectif.`, pct: Math.min(100, Math.round((steps / targetSteps) * 100)) },
        { icon: 'ri-drop-line', color: '#38BDF8', label: 'Hydratation', value: targetWater, detail: `Taux hydrique : ${water}%. ${water < 55 ? 'Sous le seuil optimal.' : 'Niveau correct.'}`, pct: Math.min(100, Math.round((water / 60) * 100)) },
        { icon: 'ri-moon-line', color: '#A78BFA', label: 'Sommeil', value: `Coucher ${bedtime}`, detail: `Qualite : ${sleepQ}%. ${sleepQ < 80 ? 'A ameliorer.' : 'Stabiliser.'}`, pct: sleepQ },
        { icon: 'ri-heart-pulse-line', color: '#EF4444', label: 'Tension', value: `${sys}/${bp.diastolic || 78}`, detail: `${sys > 130 ? 'Au-dessus de la normale.' : sys > 120 ? 'Legerement elevee.' : 'Dans les normes.'}`, pct: Math.min(100, Math.max(0, 100 - Math.abs(120 - sys) * 2)) },
      ]);

      // Typewriter
      let i = 0;
      const iv = setInterval(() => {
        if (i <= fullText.length) { setText(fullText.slice(0, i)); i++; }
        else {
          clearInterval(iv);
          // Objectives appear one by one with delay
          setTimeout(() => { setVisibleObjs(1); smoothScroll(); }, 500);
          setTimeout(() => { setVisibleObjs(2); smoothScroll(); }, 1200);
          setTimeout(() => { setVisibleObjs(3); smoothScroll(); }, 1900);
          setTimeout(() => { setVisibleObjs(4); smoothScroll(); setTimeout(() => setDone(true), 400); }, 2600);
        }
      }, 22);
    });
  }, [user]);

  const smoothScroll = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 50);
  };

  const goToDashboard = () => {
    // Use window.location for reliable navigation in static export
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  if (Platform.OS !== 'web') return <View style={{ flex: 1, backgroundColor: '#000' }}><Text style={{ color: '#FFF' }}>Briefing</Text></View>;

  const VIDEO = 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/ufilgqml_banner_mobile_chat_ia_bakcground.mp4';

  return (
    <div data-testid="morning-briefing" style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", background: '#000' } as any}>
      <video autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} src={VIDEO} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.25) 30%, rgba(0,0,0,0.8) 100%)', zIndex: 1 } as any} />

      {/* Scrollable content — NO flex-end, natural flow top-down */}
      <div ref={scrollRef as any} style={{ flex: 1, position: 'relative', zIndex: 5, overflowY: 'auto', padding: '0 24px', WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' } as any}>

        {/* Spacer to push text to ~40% of screen */}
        <div style={{ height: '38vh', flexShrink: 0 } as any} />

        {/* AI message — centered */}
        <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#FFF', lineHeight: 1.55, whiteSpace: 'pre-wrap', maxWidth: 300, margin: '0 auto' }}>
            {text}<span style={{ opacity: done ? 0 : 1, transition: 'opacity 0.3s', color: 'rgba(255,255,255,0.3)' }}>|</span>
          </div>
        </div>

        {/* Objectives title */}
        {visibleObjs >= 1 && (
          <div style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, opacity: 1, transition: 'opacity 0.5s' }}>Vos objectifs du jour</div>
        )}

        {/* Objectives — each appears independently */}
        {objectives.slice(0, visibleObjs).map((o, i) => (
          <div key={i} style={{
            padding: '14px 16px', borderRadius: 16, marginBottom: 8,
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            animation: 'slideUp 0.45s cubic-bezier(.22,.61,.36,1) forwards',
          } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 } as any}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `${o.color}15`, border: `1px solid ${o.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className={o.icon} style={{ fontSize: 16, color: o.color }} />
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{o.label}</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#FFF' }}>{o.value}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: 8 }}>{o.detail}</div>
            <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
              <div style={{ height: 3, borderRadius: 2, width: `${o.pct}%`, background: o.color, transition: 'width 1s ease 0.3s' } as any} />
            </div>
          </div>
        ))}

        {/* Bottom padding */}
        <div style={{ height: 30 } as any} />
      </div>

      {/* Bottom CTA — always visible */}
      <div style={{ position: 'relative', zIndex: 10, padding: '8px 24px 28px', flexShrink: 0 } as any}>
        {done ? (
          <div data-testid="briefing-continue" onClick={goToDashboard} onTouchEnd={goToDashboard} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '6px', borderRadius: 999,
            background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            animation: 'fadeIn 0.5s ease',
          } as any}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
              <i className="ri-arrow-right-s-line" style={{ fontSize: 24, color: '#111' }} />
            </div>
            <span style={{ flex: 1, textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)', paddingRight: 20, userSelect: 'none' }}>Continuer</span>
          </div>
        ) : (
          <div style={{ padding: '14px', textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.12)' } as any}>
            Analyse en cours...
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      ` }} />
    </div>
  );
}
