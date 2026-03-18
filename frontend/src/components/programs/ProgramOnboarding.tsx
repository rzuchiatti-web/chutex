import React from 'react';

interface ProgramOnboardingProps {
  program: any;
  clr: string;
  onboarding: any;
  setOnboarding: (val: any) => void;
  hasActiveConflict: boolean;
  onNext: () => void;
  onBack: () => void;
}

export const ProgramOnboarding = ({
  program, clr, onboarding, setOnboarding, hasActiveConflict, onNext, onBack,
}: ProgramOnboardingProps) => (
  <div style={{ maxWidth: 480, margin: '0 auto', padding: 'calc(env(safe-area-inset-top, 44px) + 10px) 20px 120px', animation: 'pd-fade-up 400ms ease both' } as any}>
    <div data-testid="program-detail-back-button" onClick={onBack} style={{
      width: 42, height: 42, borderRadius: 999, background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', marginBottom: 24,
    } as any}>
      <i className="ri-arrow-left-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }} />
    </div>

    <div style={{ textAlign: 'center', marginBottom: 32 } as any}>
      <div style={{
        width: 56, height: 56, borderRadius: 18, background: `${clr}12`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
      } as any}>
        <i className="ri-settings-4-line" style={{ fontSize: 26, color: clr }} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Personnalisation</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Nora adaptera le programme a vos reponses</div>
    </div>

    {(program.onboarding_fields || []).map((f: any) => (
      <div key={f.key} style={{ marginBottom: 20 } as any}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 10 }}>{f.label}</div>
        {f.type === 'time' && (
          <input type="time" value={onboarding[f.key] || ''} onChange={(e: any) => setOnboarding({ ...onboarding, [f.key]: e.target.value })}
            style={{ width: '100%', padding: '14px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', colorScheme: 'dark' } as any} />
        )}
        {f.type === 'choice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 } as any}>
            {(f.options || []).map((o: string) => (
              <div key={o} onClick={() => setOnboarding({ ...onboarding, [f.key]: o })} style={{
                padding: '14px 18px', borderRadius: 999,
                background: onboarding[f.key] === o ? `${clr}12` : 'rgba(255,255,255,0.03)',
                border: `1.5px solid ${onboarding[f.key] === o ? `${clr}30` : 'rgba(255,255,255,0.06)'}`,
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
                color: onboarding[f.key] === o ? '#FFF' : 'rgba(255,255,255,0.4)',
                transition: 'all 200ms ease',
              } as any}>{o}</div>
            ))}
          </div>
        )}
        {f.type === 'yesno' && (
          <div style={{ display: 'flex', gap: 10 } as any}>
            {['Oui', 'Non'].map(v => (
              <div key={v} onClick={() => setOnboarding({ ...onboarding, [f.key]: v.toLowerCase() })} style={{
                flex: 1, padding: '14px', borderRadius: 999, textAlign: 'center',
                background: onboarding[f.key] === v.toLowerCase() ? `${clr}12` : 'rgba(255,255,255,0.03)',
                border: `1.5px solid ${onboarding[f.key] === v.toLowerCase() ? `${clr}30` : 'rgba(255,255,255,0.06)'}`,
                cursor: 'pointer', fontSize: 14, fontWeight: 700,
                color: onboarding[f.key] === v.toLowerCase() ? '#FFF' : 'rgba(255,255,255,0.3)',
                transition: 'all 200ms ease',
              } as any}>{v}</div>
            ))}
          </div>
        )}
        {f.type === 'rating' && (
          <div style={{ display: 'flex', gap: 8 } as any}>
            {Array.from({ length: f.max || 5 }, (_, i) => i + 1).map(n => (
              <div key={n} onClick={() => setOnboarding({ ...onboarding, [f.key]: n })} style={{
                flex: 1, height: 48, borderRadius: 999,
                background: (onboarding[f.key] || 0) >= n ? `${clr}18` : 'rgba(255,255,255,0.03)',
                border: `1.5px solid ${(onboarding[f.key] || 0) >= n ? `${clr}35` : 'rgba(255,255,255,0.06)'}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800, color: (onboarding[f.key] || 0) >= n ? clr : 'rgba(255,255,255,0.2)',
                transition: 'all 200ms ease',
              } as any}>{n}</div>
            ))}
          </div>
        )}
      </div>
    ))}

    <div onClick={onNext} className="pd-btn-primary"
      style={{
        marginTop: 16, padding: '18px', borderRadius: 999, textAlign: 'center',
        cursor: 'pointer', background: clr, fontSize: 15, fontWeight: 900, color: '#FFF',
        boxShadow: `0 4px 24px ${clr}35`, transition: 'all 200ms ease',
        opacity: hasActiveConflict ? 0.4 : 1,
      } as any}>Suivant</div>
  </div>
);
