import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import NativePageView from '../src/components/NativePageView';

const NORA_VIDEO = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4';

export default function MorningBriefingScreen() {
  const { user, token } = useAuth();
  const [briefing, setBriefing] = useState<any>(null);
  const [displayText, setDisplayText] = useState('');
  const [phase, setPhase] = useState<'loading' | 'typing' | 'cards' | 'done'>('loading');
  const [visibleCards, setVisibleCards] = useState(0);
  const [videoUp, setVideoUp] = useState(false);
  const started = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (started.current || !user || !token) return;
    started.current = true;
    apiFetch('/api/nora/morning-briefing', {}, token).then(b => {
      if (b) setBriefing(b);
    }).catch(() => {});
  }, [user, token]);

  // Typewriter for nora_message
  useEffect(() => {
    if (!briefing) return;
    const msg = briefing.nora_message || `Bonjour ${briefing.user_name || ''}, bienvenue dans votre journee.`;
    setVideoUp(true);
    setPhase('typing');
    let idx = 0;
    const iv = setInterval(() => {
      if (idx <= msg.length) { setDisplayText(msg.slice(0, idx)); idx++; }
      else { clearInterval(iv); setPhase('cards'); }
    }, 20);
    return () => clearInterval(iv);
  }, [briefing]);

  // Staggered card reveal
  useEffect(() => {
    if (phase !== 'cards') return;
    const totalCards = 4; // sleep, exercises, nutrition, reminders
    let count = 0;
    const iv = setInterval(() => {
      count++;
      setVisibleCards(count);
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      if (count >= totalCards) { clearInterval(iv); setTimeout(() => setPhase('done'), 600); }
    }, 500);
    return () => clearInterval(iv);
  }, [phase]);

  // Safety timeout
  useEffect(() => {
    const t = setTimeout(() => { if (phase !== 'done') setPhase('done'); }, 25000);
    return () => clearTimeout(t);
  }, [phase]);

  const goToDashboard = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('briefing_seen', '1');
      localStorage.setItem('briefing_last_date', new Date().toISOString().split('T')[0]);
      window.location.href = '/';
    }
  };

  if (Platform.OS !== 'web') return <NativePageView path="/morning-briefing" />;

  const b = briefing || {};
  const sleep = b.sleep || {};
  const exDone = b.exercises_done || 0;
  const exTotal = b.exercises_total || 0;
  const nutrition = b.nutrition || {};
  const reminders = b.reminders || [];
  const health = b.health || {};

  const cards = [
    // 1. Sleep
    { key: 'sleep', icon: 'ri-moon-clear-fill', color: '#A78BFA', title: 'Sommeil', value: `Coucher ${sleep.bedtime || '22:00'}`, detail: `Reveil ${sleep.wake_time || '07:00'} · ${sleep.sleep_need_hours || 7}h${sleep.sleep_need_minutes || 30 > 0 ? (sleep.sleep_need_minutes || 30) + 'min' : ''} recommandees`, extra: sleep.adjustments?.length > 0 ? sleep.adjustments.join(', ') : '' },
    // 2. Exercises
    { key: 'exercises', icon: 'ri-run-line', color: '#EF4444', title: 'Exercices', value: exTotal > 0 ? `${exDone}/${exTotal} completes` : 'Aucun exercice', detail: exTotal > 0 ? (b.exercises || []).filter((e: any) => !e.done).slice(0, 2).map((e: any) => e.title).join(', ') || 'Tout fait !' : '', extra: '' },
    // 3. Nutrition
    { key: 'nutrition', icon: 'ri-restaurant-line', color: '#F59E0B', title: 'Nutrition', value: nutrition.daily_calories ? `${nutrition.daily_calories} kcal` : 'Pas de plan', detail: nutrition.has_plan ? `${nutrition.meal_count} repas prevus` : 'Demandez a Nora un plan repas', extra: nutrition.meal_names?.slice(0, 2).join(', ') || '' },
    // 4. Reminders
    { key: 'reminders', icon: 'ri-notification-4-line', color: '#38BDF8', title: 'Rappels', value: reminders.length > 0 ? `${reminders.length} actif${reminders.length > 1 ? 's' : ''}` : 'Aucun rappel', detail: reminders.slice(0, 2).map((r: any) => `${r.time} ${r.title || r.type}`).join(' · ') || '', extra: '' },
  ];

  return (
    <div data-testid="morning-briefing" style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", background: '#000' } as any}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes mb-slide{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes mb-fade{from{opacity:0}to{opacity:1}}
        @keyframes mb-glow{0%,100%{box-shadow:0 0 0 0 rgba(167,139,250,0)}50%{box-shadow:0 0 20px 4px rgba(167,139,250,0.15)}}
      `}} />

      {/* Nora video */}
      <video autoPlay loop muted playsInline style={{
        position: 'absolute', left: '50%', transform: 'translate(-50%, -50%)',
        top: videoUp ? '14%' : '40%',
        width: videoUp ? 120 : 180, height: videoUp ? 120 : 180,
        objectFit: 'contain', opacity: 1, zIndex: 0,
        transition: 'all 1.2s cubic-bezier(0.22, 0.61, 0.36, 1)',
        borderRadius: videoUp ? 36 : 60,
      } as any} src={NORA_VIDEO} />

      <div ref={scrollRef as any} style={{ flex: 1, position: 'relative', zIndex: 5, overflowY: 'auto', padding: '0 20px', WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' } as any}>
        <div style={{ height: videoUp ? '22vh' : '48vh', flexShrink: 0, transition: 'height 1s ease' } as any} />

        {/* Nora message */}
        <div style={{ textAlign: 'center', marginBottom: 28, maxWidth: 340, margin: '0 auto 28px' } as any}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.8)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
            {displayText}<span style={{ opacity: phase === 'typing' ? 1 : 0, transition: 'opacity 0.3s', color: 'rgba(255,255,255,0.2)' }}>|</span>
          </div>
        </div>

        {/* Health vitals mini-bar */}
        {phase !== 'loading' && phase !== 'typing' && health.heart_rate > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24, animation: 'mb-fade 0.5s ease' } as any}>
            {health.heart_rate > 0 && <div style={{ textAlign: 'center' } as any}><div style={{ fontSize: 18, fontWeight: 900, color: '#EF4444', lineHeight: 1 }}>{health.heart_rate}</div><div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>bpm</div></div>}
            {health.spo2 > 0 && <div style={{ textAlign: 'center' } as any}><div style={{ fontSize: 18, fontWeight: 900, color: '#38BDF8', lineHeight: 1 }}>{health.spo2}%</div><div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>SpO2</div></div>}
            {health.steps > 0 && <div style={{ textAlign: 'center' } as any}><div style={{ fontSize: 18, fontWeight: 900, color: '#10B981', lineHeight: 1 }}>{health.steps}</div><div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>pas hier</div></div>}
            {health.sleep_quality > 0 && <div style={{ textAlign: 'center' } as any}><div style={{ fontSize: 18, fontWeight: 900, color: '#A78BFA', lineHeight: 1 }}>{health.sleep_quality}%</div><div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>sommeil</div></div>}
          </div>
        )}

        {/* Section title */}
        {visibleCards >= 1 && (
          <div style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, animation: 'mb-fade 0.4s ease' }}>Votre journee</div>
        )}

        {/* Cards */}
        {cards.slice(0, visibleCards).map((c, i) => (
          <div key={c.key} data-testid={`briefing-card-${c.key}`} style={{
            padding: '16px 18px', borderRadius: 18, marginBottom: 10,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            animation: 'mb-slide 0.5s cubic-bezier(.22,.61,.36,1) forwards',
            animationDelay: `${i * 0.08}s`, opacity: 0,
          } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 } as any}>
              <div style={{ width: 40, height: 40, borderRadius: 14, background: `${c.color}12`, border: `1px solid ${c.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className={c.icon} style={{ fontSize: 18, color: c.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{c.title}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', marginTop: 1 }}>{c.value}</div>
              </div>
            </div>
            {(c.detail || c.extra) && (
              <div style={{ paddingLeft: 54, marginTop: 6 } as any}>
                {c.detail && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{c.detail}</div>}
                {c.extra && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', lineHeight: 1.4, marginTop: 2, fontStyle: 'italic' }}>{c.extra}</div>}
              </div>
            )}
          </div>
        ))}

        {/* Program info */}
        {visibleCards >= 4 && b.program && (
          <div style={{ padding: '12px 16px', borderRadius: 14, marginBottom: 10, background: `${b.program.color || '#A78BFA'}08`, border: `1px solid ${b.program.color || '#A78BFA'}15`, animation: 'mb-slide 0.5s ease forwards', opacity: 0, animationDelay: '0.32s' } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
              <i className={b.program.icon || 'ri-calendar-todo-line'} style={{ fontSize: 16, color: b.program.color || '#A78BFA' }} />
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#FFF' }}>{b.program.title}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Jour {b.program.day}/{b.program.total}</div>
              </div>
              {b.streak > 0 && <div style={{ fontSize: 11, fontWeight: 800, color: '#FBBF24' }}>{b.streak} jours</div>}
            </div>
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>

      {/* Bottom slide button */}
      <div style={{ position: 'relative', zIndex: 10, padding: '8px 24px 28px', flexShrink: 0 } as any}>
        {phase === 'done' ? (
          <div data-testid="briefing-slide" style={{ position: 'relative', height: 56, borderRadius: 999, overflow: 'hidden', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', animation: 'mb-fade 0.5s ease' } as any}>
            <div id="slide-fill" style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '56px', background: 'rgba(255,255,255,0.04)', borderRadius: 999 } as any} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' } as any}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.3)', userSelect: 'none' }}>Glisser pour continuer</span>
            </div>
            <div id="slide-thumb"
              onMouseDown={(e: any) => {
                e.preventDefault();
                const track = e.currentTarget.parentElement;
                const fill = document.getElementById('slide-fill');
                const thumb = e.currentTarget;
                const rect = track.getBoundingClientRect();
                const max = rect.width - 56;
                const sx = e.clientX;
                const move = (ev: any) => { const dx = Math.max(0, Math.min(max, ev.clientX - sx)); thumb.style.transform = `translateX(${dx}px)`; if (fill) fill.style.width = `${56 + dx}px`; if (dx >= max * 0.8) { end(); thumb.style.transform = `translateX(${max}px)`; if (fill) fill.style.width = '100%'; setTimeout(goToDashboard, 200); } };
                const end = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
                const up = () => { end(); thumb.style.transition = 'transform 0.3s'; thumb.style.transform = 'translateX(0)'; if (fill) { fill.style.transition = 'width 0.3s'; fill.style.width = '56px'; } setTimeout(() => { thumb.style.transition = ''; if (fill) fill.style.transition = ''; }, 300); };
                document.addEventListener('mousemove', move);
                document.addEventListener('mouseup', up);
              }}
              onTouchStart={(e: any) => {
                const track = e.currentTarget.parentElement;
                const fill = document.getElementById('slide-fill');
                const thumb = e.currentTarget;
                const rect = track.getBoundingClientRect();
                const max = rect.width - 56;
                const sx = e.touches[0].clientX;
                const move = (ev: any) => { const dx = Math.max(0, Math.min(max, ev.touches[0].clientX - sx)); thumb.style.transform = `translateX(${dx}px)`; if (fill) fill.style.width = `${56 + dx}px`; if (dx >= max * 0.8) { end(); thumb.style.transform = `translateX(${max}px)`; if (fill) fill.style.width = '100%'; setTimeout(goToDashboard, 200); } };
                const end = () => { document.removeEventListener('touchmove', move); document.removeEventListener('touchend', up); };
                const up = () => { end(); thumb.style.transition = 'transform 0.3s'; thumb.style.transform = 'translateX(0)'; if (fill) { fill.style.transition = 'width 0.3s'; fill.style.width = '56px'; } setTimeout(() => { thumb.style.transition = ''; if (fill) fill.style.transition = ''; }, 300); };
                document.addEventListener('touchmove', move, { passive: true });
                document.addEventListener('touchend', up);
              }}
              style={{ position: 'absolute', top: 4, left: 4, width: 48, height: 48, borderRadius: '50%', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab', zIndex: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.3)', touchAction: 'none', userSelect: 'none' } as any}>
              <i className="ri-arrow-right-double-line" style={{ fontSize: 22, color: '#111' }} />
            </div>
          </div>
        ) : (
          <div style={{ padding: '14px', textAlign: 'center' } as any}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', marginBottom: 8 }}>{phase === 'loading' ? 'Chargement...' : 'Analyse en cours...'}</div>
            <div data-testid="skip-briefing" onClick={goToDashboard} style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.25)', cursor: 'pointer', padding: 6 } as any}>Passer</div>
          </div>
        )}
      </div>
    </div>
  );
}
