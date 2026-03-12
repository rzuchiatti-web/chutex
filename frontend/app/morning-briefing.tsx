import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import NativePageView from '../src/components/NativePageView';
import Loader from '../src/components/Loader';

const NORA_VIDEO = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4';

export default function MorningBriefingScreen() {
  const { user, token } = useAuth();
  const [displayText, setDisplayText] = useState('');
  const [fullMessage, setFullMessage] = useState('');
  const [visibleObjs, setVisibleObjs] = useState(0);
  const [done, setDone] = useState(false);
  const [objectives, setObjectives] = useState<any[]>([]);
  const [videoUp, setVideoUp] = useState(false);
  const started = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const NORA_CONTENT: Record<string, { greeting: string; features: { icon: string; color: string; label: string; value: string; detail: string }[] }> = {
    beneficiary: {
      greeting: `Je suis Nora, votre assistante sante personnelle.\n\nMon objectif est de vous accompagner chaque jour pour ameliorer votre longevite, preserver votre sante et optimiser votre bien-etre. Grace a vos appareils connectes et a l'intelligence artificielle, je vais analyser vos donnees pour vous offrir un suivi personnalise. Voici ce que je peux faire pour vous :`,
      features: [
        { icon: 'ri-heart-pulse-line', color: '#EF4444', label: 'Suivi sante', value: 'Surveillance continue', detail: 'Frequence cardiaque, tension, SpO2, sommeil en temps reel' },
        { icon: 'ri-alarm-warning-line', color: '#F59E0B', label: 'Alertes preventives', value: 'Surveillance intelligente', detail: 'Detection automatique des anomalies et alerte de vos proches' },
        { icon: 'ri-chat-smile-3-line', color: '#10B981', label: 'Chat IA', value: 'Disponible 24h/24', detail: 'Posez-moi vos questions sante, je suis toujours la pour vous' },
        { icon: 'ri-calendar-check-line', color: '#A78BFA', label: 'Briefing quotidien', value: 'Chaque matin', detail: 'Un resume personnalise de votre etat et vos objectifs du jour' },
      ],
    },
    guardian: {
      greeting: `Je suis Nora, l'assistante sante de Chutex Care.\n\nEn tant que gardien, vous avez un role essentiel dans le suivi de vos proches. Je vous tiendrai informe en temps reel et vous alerterai en cas de besoin. Voici vos outils :`,
      features: [
        { icon: 'ri-group-line', color: '#38BDF8', label: 'Suivi de vos proches', value: 'Tableau de bord', detail: 'Visualisez les donnees sante de vos beneficiaires en un coup d\'oeil' },
        { icon: 'ri-notification-3-line', color: '#EF4444', label: 'Alertes en direct', value: 'Notifications push', detail: 'Soyez prevenu immediatement en cas de chute ou anomalie' },
        { icon: 'ri-line-chart-line', color: '#10B981', label: 'Rapports sante', value: 'Historique complet', detail: 'Suivez les tendances et partagez avec les professionnels de sante' },
        { icon: 'ri-chat-smile-3-line', color: '#A78BFA', label: 'Chat avec Nora', value: 'Conseils personnalises', detail: 'Des recommandations adaptees pour accompagner vos proches' },
      ],
    },
    prescriber_company: {
      greeting: `Je suis Nora, l'IA integree a la plateforme Chutex Care.\n\nVotre structure SAAD dispose maintenant d'un outil puissant pour suivre et proteger vos beneficiaires. Voici les fonctionnalites a votre disposition :`,
      features: [
        { icon: 'ri-building-2-line', color: '#38BDF8', label: 'Gestion structure', value: 'Back-office complet', detail: 'Gerez vos equipes, beneficiaires et intervenants depuis un seul endroit' },
        { icon: 'ri-shield-check-line', color: '#10B981', label: 'Teleassistance', value: 'Centre d\'alertes', detail: 'Recevez et gerez les alertes de tous vos beneficiaires' },
        { icon: 'ri-bar-chart-grouped-line', color: '#F59E0B', label: 'Statistiques', value: 'Rapports detailles', detail: 'Analysez les donnees sante de votre parc de beneficiaires' },
        { icon: 'ri-robot-2-line', color: '#A78BFA', label: 'IA Nora', value: 'Assistance intelligente', detail: 'Analyses predictives et recommandations pour vos equipes' },
      ],
    },
  };

  // Fetch data
  useEffect(() => {
    if (started.current || !user) return;
    started.current = true;
    const name = user?.name?.split(' ')[0] || '';
    const role = user?.active_role || user?.role || 'beneficiary';

    Promise.all([
      apiFetch('/api/health/daily-report', {}, token).catch(() => null),
      apiFetch('/api/nora/morning-briefing', {}, token).catch(() => null),
    ]).then(([report, briefing]) => {
      const introSeen = typeof localStorage !== 'undefined' && localStorage.getItem('nora_intro_seen');
      const hasAnyData = report && !report.no_data;

      let msg = '';
      let objs: any[] = [];

      if (!introSeen && !hasAnyData) {
        const nora = NORA_CONTENT[role] || NORA_CONTENT.beneficiary;
        msg = `Bonjour ${name},\n\n${nora.greeting}`;
        objs = nora.features;
        if (typeof localStorage !== 'undefined') localStorage.setItem('nora_intro_seen', 'true');
      } else {
        if (typeof localStorage !== 'undefined') localStorage.setItem('nora_intro_seen', 'true');
        msg = briefing?.nora_message || `Bonjour ${name}, bienvenue dans votre journee.`;
        objs = briefing?.objectives || report?.daily_plan || [];
      }

      setFullMessage(msg);
      setObjectives(objs);
    }).catch(() => {});
  }, [user]);

  // Typewriter effect - triggered when fullMessage is set
  useEffect(() => {
    if (!fullMessage) return;
    setVideoUp(true); // Move video up when text starts
    let idx = 0;
    setDisplayText('');
    const iv = setInterval(() => {
      if (idx <= fullMessage.length) { setDisplayText(fullMessage.slice(0, idx)); idx++; }
      else {
        clearInterval(iv);
        objectives.forEach((_, i) => {
          setTimeout(() => { setVisibleObjs(i + 1); if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 500 + i * 700);
        });
        setTimeout(() => setDone(true), 500 + objectives.length * 700 + 400);
      }
    }, 22);
    return () => clearInterval(iv);
  }, [fullMessage]);

  // Safety timeout
  useEffect(() => {
    const timeout = setTimeout(() => { if (!done) setDone(true); }, 30000);
    return () => clearTimeout(timeout);
  }, [done]);

  const goToDashboard = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('briefing_seen', '1');
      localStorage.setItem('briefing_last_date', new Date().toISOString().split('T')[0]);
      window.location.href = '/';
    }
  };

  if (Platform.OS !== 'web') return <NativePageView path="/morning-briefing" />;

  return (
    <div data-testid="morning-briefing" style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", background: '#000' } as any}>
      {/* Nora video - starts centered, moves up when text arrives */}
      <video autoPlay loop muted playsInline style={{
        position: 'absolute', left: '50%', transform: `translate(-50%, -50%)`,
        top: videoUp ? '18%' : '45%',
        width: 120, height: 120, objectFit: 'contain', opacity: 0.6, zIndex: 0,
        transition: 'top 1.2s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.8s',
        borderRadius: 60,
      } as any} src={NORA_VIDEO} />

      <div ref={scrollRef as any} style={{ flex: 1, position: 'relative', zIndex: 5, overflowY: 'auto', padding: '0 24px', WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' } as any}>
        <div style={{ height: videoUp ? '28vh' : '50vh', flexShrink: 0, transition: 'height 1s ease' } as any} />

        <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#FFF', lineHeight: 1.55, whiteSpace: 'pre-wrap', maxWidth: 300, margin: '0 auto' }}>
            {displayText}<span style={{ opacity: done ? 0 : 1, transition: 'opacity 0.3s', color: 'rgba(255,255,255,0.3)' }}>|</span>
          </div>
        </div>

        {visibleObjs >= 1 && (
          <div style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>Vos objectifs du jour</div>
        )}

        {objectives.slice(0, visibleObjs).map((o, i) => (
          <div key={i} style={{ padding: '14px 16px', borderRadius: 16, marginBottom: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', animation: 'slideUp 0.45s cubic-bezier(.22,.61,.36,1) forwards' } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 } as any}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `${o.color}15`, border: `1px solid ${o.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className={o.icon} style={{ fontSize: 16, color: o.color }} />
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{o.label}</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#FFF' }}>{o.value}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4, paddingLeft: 44 }}>{o.detail}</div>
          </div>
        ))}
        <div style={{ height: 20 } as any} />
      </div>

      {/* Bottom actions */}
      <div style={{ position: 'relative', zIndex: 10, padding: '8px 24px 28px', flexShrink: 0 } as any}>
        {done ? (
          <div data-testid="briefing-slide" style={{ position: 'relative', height: 56, borderRadius: 999, overflow: 'hidden', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', animation: 'fadeIn 0.5s ease' } as any}>
            <div id="slide-fill" style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '56px', background: 'rgba(255,255,255,0.06)', borderRadius: 999 } as any} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' } as any}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.4)', userSelect: 'none' }}>Glisser pour continuer</span>
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
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', marginBottom: 8 }}>Analyse en cours...</div>
            <div data-testid="skip-briefing" onClick={goToDashboard} style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 6 } as any}>Passer</div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: '@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}' }} />
    </div>
  );
}
