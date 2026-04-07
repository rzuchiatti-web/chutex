import React, { useState, useEffect, useRef } from 'react';

const NORA_VIDEO = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4';

interface Props { analysisPhase: any; showInfo: boolean; setShowInfo: (v: boolean) => void; progressBg: string; }

export default function AnalysisPhase({ analysisPhase, showInfo, setShowInfo, progressBg }: Props) {
  if (!analysisPhase) return null;
  const day = analysisPhase.day || 1;
  const total = analysisPhase.total || 7;
  const pct = analysisPhase.progress_pct || Math.round((day / total) * 100);
  const message = analysisPhase.message || 'Analyse en cours';
  const isBodyAge = analysisPhase.type === 'body_age';

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', marginBottom: 10, lineHeight: 1.2, letterSpacing: -0.5 }}>
          {isBodyAge ? <>Nora analyse votre<br/>age biologique.</> : <>Analyse en cours de<br/>votre profil sante.</>}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 20, maxWidth: 320, margin: '0 auto 20px' }}>
          {isBodyAge
            ? `Nora collecte vos données de santé depuis votre inscription pour estimer votre age biologique. Encore ${total - day} jour${total - day > 1 ? 's' : ''} de donnees necessaires.`
            : `Pendant les ${total} premiers jours, nous analysons vos donnees pour comprendre votre rythme, vos habitudes et vos tendances.`
          }
        </div>
        <div onClick={() => setShowInfo(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer', marginBottom: 24 } as any}>
          <i className="ri-question-line" style={{ fontSize: 13, color: '#FFF' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#FFF' }}>Comprendre l'analyse</span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Jour {day}/{total}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 16 }}>{message}</div>
        <div style={{ height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative', maxWidth: 340, margin: '0 auto' } as any}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: `${pct}%`, height: '100%', borderRadius: 16, overflow: 'hidden', transition: 'width 1s ease' } as any}>
            <img src={progressBg} alt="" style={{ width: 340, height: 32, objectFit: 'cover', display: 'block' } as any} />
          </div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#FFF', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{pct}%</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14 } as any}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{ width: i < day ? 10 : 8, height: i < day ? 10 : 8, borderRadius: 999, background: i < day ? '#FFF' : 'rgba(255,255,255,0.12)', border: i === day - 1 ? '2px solid rgba(255,255,255,0.4)' : 'none', transition: 'all 0.3s' } as any} />
          ))}
        </div>
      </div>

      {showInfo && <NoraInfoPopup onClose={() => setShowInfo(false)} />}
    </>
  );
}

/* ═══════════════════════════════════════════════ */
/*  NORA INFO POPUP — fond noir, video premium    */
/* ═══════════════════════════════════════════════ */
function NoraInfoPopup({ onClose }: { onClose: () => void }) {
  const [entered, setEntered] = useState(false);
  const [showText, setShowText] = useState(false);
  const [titleDone, setTitleDone] = useState(false);
  const [typedTitle, setTypedTitle] = useState('');
  const [typedDesc, setTypedDesc] = useState('');
  const [visibleCards, setVisibleCards] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const title = 'Comprendre mon analyse santé';
  const desc = 'Notre intelligence artificielle Nora analyse vos données de santé pour vous offrir un suivi personnalisé et précis.';

  const cards = [
    { title: 'Pourquoi 7 jours ?', text: "Votre corps a un rythme unique. Pour établir un profil santé fiable et personnalisé, Nora a besoin d'observer vos constantes sur un cycle complet.", icon: 'ri-time-line' },
    { title: 'Ce que nous analysons', text: "Nora croise les donnees de votre bracelet Elio (fréquence cardiaque, HRV, SpO2, sommeil, activité, stress) et de votre balance Vita (poids, composition corporelle). Plus de 70 métriques.", icon: 'ri-line-chart-line' },
    { title: 'Votre Score Santé', text: "Un Score Santé personnalisé sur 100, basé sur 5 sous-scores : Cardio, Sommeil, Activité, Métabolisme et Hydratation. Il évolue chaque jour.", icon: 'ri-heart-pulse-line' },
    { title: 'Recommandations', text: "Des recommandations concretes et actionnables : objectif de pas adapte, apport calorique, heure de coucher, hydratation. Chaque conseil base sur VOS donnees.", icon: 'ri-lightbulb-line' },
  ];

  useEffect(() => {
    setTimeout(() => setEntered(true), 50);
    setTimeout(() => setShowText(true), 1200);
  }, []);

  // Typewriter title
  useEffect(() => {
    if (!showText) return;
    let i = 0;
    const iv = setInterval(() => {
      if (i <= title.length) { setTypedTitle(title.slice(0, i)); i++; }
      else { clearInterval(iv); setTitleDone(true); }
    }, 35);
    return () => clearInterval(iv);
  }, [showText]);

  // Typewriter desc then cards
  useEffect(() => {
    if (!titleDone) return;
    let i = 0;
    const iv = setInterval(() => {
      if (i <= desc.length) { setTypedDesc(desc.slice(0, i)); i++; }
      else {
        clearInterval(iv);
        cards.forEach((_, ci) => {
          setTimeout(() => {
            setVisibleCards(ci + 1);
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }, 400 + ci * 500);
        });
      }
    }, 12);
    return () => clearInterval(iv);
  }, [titleDone]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column' } as any}>
      {/* Nora video — recette premium */}
      <video autoPlay loop muted playsInline style={{
        position: 'absolute', zIndex: 1,
        left: showText ? '20px' : '50%',
        top: showText ? '20px' : '35%',
        transform: showText ? 'translate(0, 0) scale(1)' : 'translate(-50%, -50%) scale(1)',
        width: showText ? 50 : 140, height: showText ? 50 : 140,
        objectFit: 'contain', borderRadius: showText ? 16 : 70,
        opacity: entered ? (showText ? 0.7 : 1) : 0,
        filter: entered ? 'none' : 'blur(20px)',
        transition: 'left 1s cubic-bezier(0.22,0.61,0.36,1), top 1s cubic-bezier(0.22,0.61,0.36,1), width 1s ease, height 1s ease, transform 1s ease, border-radius 1s ease, opacity 1.2s ease 0.1s, filter 1.2s ease 0.1s',
      } as any} src={NORA_VIDEO} />

      {/* Close button */}
      <div style={{ position: 'relative', zIndex: 10, padding: '70px 20px 16px', display: 'flex', justifyContent: 'flex-end' } as any}>
        <div onClick={onClose} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} />
        </div>
      </div>

      {/* Content */}
      <div ref={scrollRef as any} style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '60px 28px 100px' } as any}>
        {showText && (
          <>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', marginBottom: 10, lineHeight: 1.2 }}>
              {typedTitle}<span style={{ opacity: titleDone ? 0 : 1, color: 'rgba(255,255,255,0.3)', transition: 'opacity 0.3s' } as any}>|</span>
            </div>
            {titleDone && (
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 28 }}>
                {typedDesc}<span style={{ opacity: typedDesc.length < desc.length ? 1 : 0, color: 'rgba(255,255,255,0.2)', transition: 'opacity 0.3s' } as any}>|</span>
              </div>
            )}
            {cards.slice(0, visibleCards).map((s, i) => (
              <div key={i} style={{ padding: '16px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 10, animation: 'noraCardIn 0.45s cubic-bezier(.22,.61,.36,1) forwards' } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 } as any}>
                  <i className={s.icon} style={{ fontSize: 16, color: '#FFF' }} />
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>{s.title}</div>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>{s.text}</div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Bottom button */}
      <div style={{ padding: '12px 28px 28px', position: 'relative', zIndex: 10 } as any}>
        <div onClick={onClose} style={{ padding: '16px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#FFF' } as any}>Compris</div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: '@keyframes noraCardIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}' }} />
    </div>
  );
}
