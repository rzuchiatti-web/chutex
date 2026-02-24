import React from 'react';

interface Props { analysisPhase: any; showInfo: boolean; setShowInfo: (v: boolean) => void; progressBg: string; }

export default function AnalysisPhase({ analysisPhase, showInfo, setShowInfo, progressBg }: Props) {
  if (!analysisPhase) return null;
  const day = analysisPhase.day || 1;
  const total = analysisPhase.total || 7;
  const pct = analysisPhase.progress_pct || Math.round((day / total) * 100);
  const message = analysisPhase.message || 'Analyse en cours';

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
        {/* Title */}
        <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', marginBottom: 10, lineHeight: 1.2, letterSpacing: -0.5 }}>
          Analyse en cours de<br/>votre profil sante.
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 20, maxWidth: 320, margin: '0 auto 20px' }}>
          Pendant les {total} premiers jours, nous analysons vos donnees pour comprendre votre rythme, vos habitudes et vos tendances.
        </div>

        {/* Info button */}
        <div onClick={() => setShowInfo(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', marginBottom: 24 } as any}>
          <i className="ri-question-line" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Comprendre l'analyse</span>
        </div>

        {/* Day indicator + message */}
        <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>
          Jour {day}/{total}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 16 }}>
          {message}
        </div>

        {/* Progress bar with background image */}
        <div style={{ height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', position: 'relative', maxWidth: 340, margin: '0 auto' } as any}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: `${pct}%`, height: '100%', borderRadius: 16, overflow: 'hidden', transition: 'width 1s ease' } as any}>
            <img src={progressBg} alt="" style={{ width: 340, height: 32, objectFit: 'cover', display: 'block' } as any} />
          </div>
          {/* Percentage text on bar */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#FFF', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{pct}%</span>
          </div>
        </div>

        {/* Day dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14 } as any}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{ width: i < day ? 10 : 8, height: i < day ? 10 : 8, borderRadius: 999, background: i < day ? '#FFF' : 'rgba(255,255,255,0.12)', border: i === day - 1 ? '2px solid rgba(255,255,255,0.4)' : 'none', transition: 'all 0.3s' } as any} />
          ))}
        </div>
      </div>

      {showInfo && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
          <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
              <div onClick={() => setShowInfo(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(34,211,238,0.15))', border: '1px solid rgba(167,139,250,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 } as any}>
                <i className="ri-brain-line" style={{ fontSize: 30, color: '#A78BFA' }} />
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Analyse du profil sante</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>Comment fonctionne notre analyse IA personnalisee</div>
            </div>
            {[
              { title: 'Pourquoi 7 jours ?', text: "Votre corps a un rythme unique. Pour etablir un profil sante fiable et personnalise, notre intelligence artificielle a besoin d'observer vos constantes sur un cycle complet.", icon: 'ri-time-line' },
              { title: 'Ce que nous analysons', text: "Notre IA croise les donnees de votre bracelet Elio (frequence cardiaque, HRV, SpO2, sommeil, activite, stress) et de votre balance Vita (poids, composition corporelle). Plus de 70 metriques.", icon: 'ri-line-chart-line' },
              { title: 'Votre Score Sante IA', text: "Un Score Sante personnalise sur 100, base sur 5 sous-scores : Cardio, Sommeil, Activite, Metabolisme et Hydratation. Il evolue chaque jour.", icon: 'ri-heart-pulse-line' },
              { title: 'Recommandations', text: "Des recommandations concretes et actionnables : objectif de pas adapte, apport calorique, heure de coucher, hydratation. Chaque conseil base sur VOS donnees.", icon: 'ri-lightbulb-line' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '16px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 10 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 } as any}>
                  <i className={s.icon} style={{ fontSize: 16, color: '#A78BFA' }} />
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>{s.title}</div>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>{s.text}</div>
              </div>
            ))}
            <div onClick={() => setShowInfo(false)} style={{ padding: '16px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#FFF', marginTop: 10 } as any}>Compris</div>
          </div>
        </div>
      )}
    </>
  );
}
