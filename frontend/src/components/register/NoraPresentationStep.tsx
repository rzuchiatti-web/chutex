import React, { useState, useEffect, useRef } from 'react';

const VIDEO = 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/ufilgqml_banner_mobile_chat_ia_bakcground.mp4';

const ROLE_CONTENT: Record<string, { lines: string[]; features: { icon: string; color: string; label: string; value: string; detail: string }[] }> = {
  beneficiary: {
    lines: [
      'Je suis Nora.',
      'Votre intelligence sante.',
      'Analyse en temps reel.\nSuivi personnalisé.\nAlertes preventives.',
      'Je veille sur vous, en continu.',
    ],
    features: [
      { icon: 'ri-heart-pulse-line', color: '#EF4444', label: 'Suivi santé', value: 'Surveillance continue', detail: 'Fréquence cardiaque, tension, SpO2, sommeil en temps reel' },
      { icon: 'ri-alarm-warning-line', color: '#F59E0B', label: 'Alertes', value: 'Detection intelligente', detail: 'Anomalies détectées automatiquement, vos proches alertes' },
      { icon: 'ri-chat-smile-3-line', color: '#10B981', label: 'Chat IA', value: 'Disponible 24h/24', detail: 'Posez vos questions sante, je suis toujours la' },
      { icon: 'ri-calendar-check-line', color: '#A78BFA', label: 'Briefing', value: 'Chaque matin', detail: 'Un resume personnalisé de votre etat et vos objectifs' },
    ],
  },
  guardian: {
    lines: [
      'Je suis Nora.',
      'L\'assistante sante de Chutex Care.',
      'Suivi en temps reel.\nAlertes instantanees.\nRapports détaillés.',
      'Gardez un oeil sur vos proches.',
    ],
    features: [
      { icon: 'ri-group-line', color: '#38BDF8', label: 'Suivi', value: 'Tableau de bord', detail: 'Donnees sante de vos bénéficiaires en un coup d\'oeil' },
      { icon: 'ri-notification-3-line', color: '#EF4444', label: 'Alertes', value: 'Notifications push', detail: 'Prevenu immédiatement en cas de chute ou anomalie' },
      { icon: 'ri-line-chart-line', color: '#10B981', label: 'Rapports', value: 'Historique complet', detail: 'Tendances et partage avec les professionnels de sante' },
      { icon: 'ri-chat-smile-3-line', color: '#A78BFA', label: 'Chat Nora', value: 'Conseils adaptes', detail: 'Recommandations personnalisées pour vos proches' },
    ],
  },
  prescriber_company: {
    lines: [
      'Je suis Nora.',
      'L\'IA integree a Chutex Care.',
      'Gestion centralisee.\nTéléassistance.\nAnalyses predictives.',
      'Un outil puissant pour votre structure.',
    ],
    features: [
      { icon: 'ri-building-2-line', color: '#38BDF8', label: 'Gestion', value: 'Back-office complet', detail: 'Equipes, bénéficiaires et intervenants en un seul endroit' },
      { icon: 'ri-shield-check-line', color: '#10B981', label: 'Téléassistance', value: 'Centre d\'alertes', detail: 'Recevez et gerez les alertes de tous vos bénéficiaires' },
      { icon: 'ri-bar-chart-grouped-line', color: '#F59E0B', label: 'Statistiques', value: 'Rapports détaillés', detail: 'Donnees sante de votre parc de bénéficiaires' },
      { icon: 'ri-robot-2-line', color: '#A78BFA', label: 'IA Nora', value: 'Assistance IA', detail: 'Analyses predictives et recommandations pour vos equipes' },
    ],
  },
};

export default function NoraPresentationStep({ role, userName, onContinue }: { role: string; userName: string; onContinue: () => void }) {
  const [phase, setPhase] = useState(0); // 0=greeting, 1..N=lines, N+1..=cards, final=done
  const [visibleCards, setVisibleCards] = useState(0);
  const [done, setDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const content = ROLE_CONTENT[role] || ROLE_CONTENT.beneficiary;
  const firstName = userName?.split(' ')[0] || '';
  const totalLines = content.lines.length;

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // Phase 0: greeting name visible immediately
    // Phase 1..totalLines: each line appears
    // Then cards appear
    let currentPhase = 0;
    const lineDelay = 1400;
    const cardDelay = 600;

    // Start showing lines after a brief pause
    const showNextLine = () => {
      currentPhase++;
      setPhase(currentPhase);
      smoothScroll();

      if (currentPhase <= totalLines) {
        setTimeout(showNextLine, lineDelay);
      } else {
        // Start showing cards
        let cardIdx = 0;
        const showNextCard = () => {
          cardIdx++;
          setVisibleCards(cardIdx);
          smoothScroll();
          if (cardIdx < content.features.length) {
            setTimeout(showNextCard, cardDelay);
          } else {
            setTimeout(() => setDone(true), 400);
          }
        };
        setTimeout(showNextCard, 500);
      }
    };

    setTimeout(showNextLine, 800);
  }, []);

  const smoothScroll = () => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 80);
  };

  return (
    <div data-testid="nora-presentation" style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", background: '#000' } as any}>
      <video autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, opacity: 0.6 } as any} src={VIDEO} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.88) 100%)', zIndex: 1 } as any} />

      <div ref={scrollRef as any} style={{ flex: 1, position: 'relative', zIndex: 5, overflowY: 'auto', padding: '0 28px', WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' } as any}>
        <div style={{ height: '28vh', flexShrink: 0 } as any} />

        {/* Nora avatar badge */}
        <div className="nora-badge" style={{ textAlign: 'center', marginBottom: 24, opacity: 0, animation: 'noraBadgeIn 0.8s cubic-bezier(.22,.61,.36,1) 0.2s forwards' } as any}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any}>
            <div style={{ width: 22, height: 22, borderRadius: 11, background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <i className="ri-robot-2-line" style={{ fontSize: 12, color: '#FFF' }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 }}>Nora</span>
            <div style={{ width: 5, height: 5, borderRadius: 3, background: '#10B981', boxShadow: '0 0 6px #10B981' } as any} />
          </div>
        </div>

        {/* Greeting */}
        <div style={{ textAlign: 'center', marginBottom: 32 } as any}>
          <div className="nora-greeting" style={{ fontSize: 28, fontWeight: 900, color: '#FFF', letterSpacing: -0.5, opacity: 0, animation: 'noraTextIn 1s cubic-bezier(.22,.61,.36,1) 0.4s forwards' } as any}>
            Bonjour{firstName ? ` ${firstName}` : ''}
          </div>
        </div>

        {/* Lines - each appears with staggered animation */}
        <div style={{ textAlign: 'center', marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 16 } as any}>
          {content.lines.map((line, i) => {
            const isVisible = phase > i;
            const isHighlight = i === 0;
            return (
              <div key={i} style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(14px)',
                filter: isVisible ? 'blur(0px)' : 'blur(6px)',
                transition: 'all 0.9s cubic-bezier(.22,.61,.36,1)',
                fontSize: isHighlight ? 18 : 14,
                fontWeight: isHighlight ? 800 : 500,
                color: isHighlight ? '#FFF' : 'rgba(255,255,255,0.55)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                maxWidth: 300,
                margin: '0 auto',
                letterSpacing: isHighlight ? -0.3 : 0,
              } as any}>
                {line}
              </div>
            );
          })}
        </div>

        {/* Feature cards */}
        {visibleCards >= 1 && (
          <div style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12, opacity: 0, animation: 'noraFadeIn 0.6s ease forwards' } as any}>Ce que je fais pour vous</div>
        )}

        {content.features.slice(0, visibleCards).map((f, i) => (
          <div key={i} style={{
            padding: '14px 16px',
            borderRadius: 16,
            marginBottom: 8,
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.06)',
            opacity: 0,
            animation: 'noraCardIn 0.6s cubic-bezier(.22,.61,.36,1) forwards',
          } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 } as any}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `${f.color}10`, border: `1px solid ${f.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <i className={f.icon} style={{ fontSize: 16, color: f.color }} />
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{f.value}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4, paddingLeft: 44 }}>{f.detail}</div>
          </div>
        ))}
        <div style={{ height: 20 } as any} />
      </div>

      {/* Slide to continue */}
      <div style={{ position: 'relative', zIndex: 10, padding: '8px 28px 32px', flexShrink: 0 } as any}>
        {done ? (
          <div data-testid="nora-slide" style={{ position: 'relative', height: 56, borderRadius: 999, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', opacity: 0, animation: 'noraFadeIn 0.6s ease 0.1s forwards' } as any}>
            <div id="nora-fill" style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '56px', background: 'rgba(255,255,255,0.04)', borderRadius: 999, transition: 'none' } as any} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' } as any}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.3)', userSelect: 'none', letterSpacing: 0.3 }}>Glisser pour commencer</span>
            </div>
            <div id="nora-thumb"
              onMouseDown={(e: any) => {
                e.preventDefault();
                const track = e.currentTarget.parentElement;
                const fill = document.getElementById('nora-fill');
                const thumb = e.currentTarget;
                const rect = track.getBoundingClientRect();
                const max = rect.width - 56;
                const sx = e.clientX;
                const move = (ev: any) => {
                  const dx = Math.max(0, Math.min(max, ev.clientX - sx));
                  thumb.style.transform = `translateX(${dx}px)`;
                  if (fill) fill.style.width = `${56 + dx}px`;
                  if (dx >= max * 0.8) { end(); thumb.style.transform = `translateX(${max}px)`; if (fill) fill.style.width = '100%'; setTimeout(onContinue, 200); }
                };
                const end = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); };
                const up = () => { end(); thumb.style.transition = 'transform 0.3s'; thumb.style.transform = 'translateX(0)'; if (fill) { fill.style.transition = 'width 0.3s'; fill.style.width = '56px'; } setTimeout(() => { thumb.style.transition = ''; if (fill) fill.style.transition = ''; }, 300); };
                document.addEventListener('mousemove', move);
                document.addEventListener('mouseup', up);
              }}
              onTouchStart={(e: any) => {
                const track = e.currentTarget.parentElement;
                const fill = document.getElementById('nora-fill');
                const thumb = e.currentTarget;
                const rect = track.getBoundingClientRect();
                const max = rect.width - 56;
                const sx = e.touches[0].clientX;
                const move = (ev: any) => {
                  const dx = Math.max(0, Math.min(max, ev.touches[0].clientX - sx));
                  thumb.style.transform = `translateX(${dx}px)`;
                  if (fill) fill.style.width = `${56 + dx}px`;
                  if (dx >= max * 0.8) { end(); thumb.style.transform = `translateX(${max}px)`; if (fill) fill.style.width = '100%'; setTimeout(onContinue, 200); }
                };
                const end = () => { document.removeEventListener('touchmove', move); document.removeEventListener('touchend', up); };
                const up = () => { end(); thumb.style.transition = 'transform 0.3s'; thumb.style.transform = 'translateX(0)'; if (fill) { fill.style.transition = 'width 0.3s'; fill.style.width = '56px'; } setTimeout(() => { thumb.style.transition = ''; if (fill) fill.style.transition = ''; }, 300); };
                document.addEventListener('touchmove', move, { passive: true });
                document.addEventListener('touchend', up);
              }}
              style={{ position: 'absolute', top: 4, left: 4, width: 48, height: 48, borderRadius: '50%', background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'grab', zIndex: 2, boxShadow: '0 2px 16px rgba(0,0,0,0.4)', touchAction: 'none', userSelect: 'none' } as any}>
              <i className="ri-arrow-right-double-line" style={{ fontSize: 20, color: '#111' }} />
            </div>
          </div>
        ) : (
          <div style={{ padding: '14px', textAlign: 'center' } as any}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 } as any}>
              <div className="nora-pulse" style={{ width: 6, height: 6, borderRadius: 3, background: '#10B981' } as any} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.2)', letterSpacing: 0.3 }}>Nora s'adresse a vous</span>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes noraBadgeIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes noraTextIn {
          from { opacity: 0; transform: translateY(10px); filter: blur(8px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0px); }
        }
        @keyframes noraCardIn {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes noraFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes noraPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        .nora-pulse { animation: noraPulse 1.8s ease-in-out infinite; }
      ` }} />
    </div>
  );
}
