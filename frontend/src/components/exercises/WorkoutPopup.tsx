import React from 'react';

export function WorkoutPopup({ ex, totalSets, currentSet, setCurrentSet, resting, setResting, restTime, setRestTime, restRef, accent, isDark, painLevel, setPainLevel, notes, setNotes, completing, handleComplete, onClose, startRest }: any) {
  const steps = (ex?.steps || []).filter((s: string) => s?.trim());
  const reps = ex?.repetitions || ex?.reps || 12;
  const restSec = ex?.rest_seconds || 60;
  const finished = currentSet > totalSets;

  const WBG = isDark ? '#0A0A0F' : '#FFF';
  const WT = isDark ? '#FFF' : '#111';
  const WT2 = isDark ? 'rgba(255,255,255,0.5)' : '#6B7280';
  const WT3 = isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF';
  const WT4 = isDark ? 'rgba(255,255,255,0.25)' : '#D1D5DB';
  const WCARD = isDark ? 'rgba(255,255,255,0.04)' : '#F4F4F5';
  const WBORDER = isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB';
  const WBTN = isDark ? 'rgba(255,255,255,0.08)' : '#F4F4F5';
  const WBTN_BORDER = isDark ? 'rgba(255,255,255,0.12)' : '#E5E7EB';
  const RING_BG = isDark ? 'rgba(255,255,255,0.06)' : '#E5E7EB';
  const CLOSE_BG = isDark ? 'rgba(255,255,255,0.08)' : '#F4F4F5';
  const DOT_INACTIVE = isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB';

  const ringSize = 180, ringStroke = 8;
  const ringR = (ringSize - ringStroke) / 2;
  const ringCirc = 2 * Math.PI * ringR;
  const ringPct = restSec > 0 ? restTime / restSec : 0;

  return (
    <div data-testid="workout-popup" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: WBG, fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', flexDirection: 'column', overflow: 'hidden' } as any}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes wp-fade-in { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes wp-pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.04); } }
        @keyframes wp-ring-glow { 0%,100% { filter: drop-shadow(0 0 8px ${accent}40); } 50% { filter: drop-shadow(0 0 20px ${accent}60); } }
      `}} />

      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 } as any}>
        <div data-testid="workout-close-btn" onClick={onClose} style={{ width: 40, height: 40, borderRadius: 999, background: CLOSE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-close-line" style={{ fontSize: 18, color: WT }} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: WT3 }}>{ex.title}</div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', padding: '0 20px 16px' } as any}>
        {Array.from({ length: totalSets }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, maxWidth: 32, background: i < currentSet - (resting ? 0 : 1) ? accent : i === currentSet - 1 && !resting ? `${accent}60` : DOT_INACTIVE, transition: 'background 0.4s' } as any} />
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', overflow: 'auto' } as any}>

        {resting && !finished && (
          <div data-testid="workout-rest-screen" style={{ textAlign: 'center', animation: 'wp-fade-in 0.4s ease' } as any}>
            <div style={{ fontSize: 11, fontWeight: 700, color: WT3, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 24 }}>Temps de repos</div>
            <div style={{ position: 'relative', width: ringSize, height: ringSize, margin: '0 auto 24px', animation: 'wp-ring-glow 2s ease-in-out infinite' } as any}>
              <svg width={ringSize} height={ringSize} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={ringSize/2} cy={ringSize/2} r={ringR} fill="none" stroke={RING_BG} strokeWidth={ringStroke} />
                <circle cx={ringSize/2} cy={ringSize/2} r={ringR} fill="none" stroke={accent} strokeWidth={ringStroke} strokeDasharray={`${ringPct * ringCirc} ${ringCirc}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s linear' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } as any}>
                <div style={{ fontSize: 52, fontWeight: 900, color: WT, fontVariantNumeric: 'tabular-nums', lineHeight: 1 } as any}>{Math.floor(restTime / 60)}:{String(restTime % 60).padStart(2, '0')}</div>
              </div>
            </div>
            <div style={{ fontSize: 14, color: WT2, marginBottom: 6 }}>Prochaine serie : <strong style={{ color: WT }}>{currentSet + 1}/{totalSets}</strong></div>
            <div style={{ fontSize: 13, color: WT3 }}>{reps} reps</div>
            <div data-testid="skip-rest-btn" onClick={() => { clearInterval(restRef.current); setResting(false); setCurrentSet((s: number) => s + 1); }} style={{ marginTop: 32, padding: '14px 32px', borderRadius: 999, background: WBTN, border: `1px solid ${WBTN_BORDER}`, cursor: 'pointer', fontSize: 14, fontWeight: 700, color: WT, display: 'inline-block' } as any}>
              Passer le repos
            </div>
          </div>
        )}

        {!resting && !finished && (
          <div data-testid="workout-set-screen" style={{ textAlign: 'center', width: '100%', maxWidth: 380, animation: 'wp-fade-in 0.4s ease' } as any}>
            <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Serie {currentSet} sur {totalSets}</div>
            <div style={{ fontSize: 64, fontWeight: 900, color: WT, lineHeight: 1, marginBottom: 4, animation: 'wp-pulse 2s ease-in-out infinite' } as any}>{reps}</div>
            <div style={{ fontSize: 16, color: WT2, fontWeight: 600, marginBottom: 32 }}>repetitions</div>

            {steps.length > 0 && (
              <div style={{ textAlign: 'left', marginBottom: 32, padding: '16px', borderRadius: 16, background: WCARD, border: `1px solid ${WBORDER}` } as any}>
                <div style={{ fontSize: 10, fontWeight: 700, color: WT4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Rappel des etapes</div>
                {steps.map((step: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: i < steps.length - 1 ? `1px solid ${WBORDER}` : 'none' } as any}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: accent, minWidth: 18, flexShrink: 0 }}>{i + 1}.</span>
                    <span style={{ fontSize: 12, color: WT2, lineHeight: 1.5 }}>{step}</span>
                  </div>
                ))}
              </div>
            )}

            <div data-testid="set-done-btn" onClick={() => { if (currentSet >= totalSets) { setCurrentSet((s: number) => s + 1); } else { startRest(); } }} style={{ padding: '18px', borderRadius: 999, background: currentSet >= totalSets ? '#10B981' : accent, textAlign: 'center', cursor: 'pointer', fontSize: 16, fontWeight: 800, color: '#FFF', transition: 'transform 0.12s' } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
              {currentSet >= totalSets ? 'Terminer l\'exercice' : 'Serie terminee'}
            </div>
          </div>
        )}

        {finished && (
          <div data-testid="workout-finished-screen" style={{ textAlign: 'center', animation: 'wp-fade-in 0.5s ease', width: '100%', maxWidth: 380 } as any}>
            <div style={{ width: 80, height: 80, borderRadius: 999, background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' } as any}>
              <i className="ri-check-line" style={{ fontSize: 40, color: '#10B981' }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: WT, marginBottom: 8 }}>Bravo !</div>
            <div style={{ fontSize: 15, color: WT2, marginBottom: 4 }}>{ex.title} termine</div>
            <div style={{ fontSize: 13, color: WT3, marginBottom: 28 }}>{totalSets} series x {reps} reps</div>

            <div style={{ textAlign: 'left', marginBottom: 14 } as any}>
              <div style={{ fontSize: 11, color: WT2, marginBottom: 6, fontWeight: 600 }}>Niveau de douleur</div>
              <div style={{ display: 'flex', gap: 3 } as any}>
                {[1,2,3,4,5,6,7,8,9,10].map((n: number) => (
                  <div key={n} onClick={() => setPainLevel(n)} style={{ flex: 1, height: 32, borderRadius: 8, background: n <= painLevel ? (n <= 3 ? '#10B981' : n <= 6 ? '#F59E0B' : '#EF4444') : WCARD, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: n <= painLevel ? '#FFF' : WT3, transition: 'all 0.15s' } as any}>{n}</div>
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'left', marginBottom: 20 } as any}>
              <div style={{ fontSize: 11, color: WT2, marginBottom: 6, fontWeight: 600 }}>Notes</div>
              <input value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder="Comment ca s'est passe ?" style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: WCARD, border: `1px solid ${WBORDER}`, color: WT, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' } as any} />
            </div>
            <div data-testid="workout-validate-btn" onClick={async () => { await handleComplete('done'); onClose(); }} style={{ padding: '16px', borderRadius: 999, background: '#10B981', textAlign: 'center', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: '#FFF', opacity: completing ? 0.5 : 1 } as any}>
              {completing ? 'Validation...' : 'Valider l\'exercice'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
