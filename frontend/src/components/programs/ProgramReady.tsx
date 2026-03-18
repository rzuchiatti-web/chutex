import React from 'react';
import { ProgramPill } from './ProgramPill';

interface ProgramReadyProps {
  program: any;
  clr: string;
  mode: string;
  hasOnboarding: boolean;
  hasActiveConflict: boolean;
  starting: boolean;
  error: string;
  onBack: () => void;
  onLaunch: () => void;
}

export const ProgramReady = ({
  program, clr, mode, hasOnboarding, hasActiveConflict, starting, error, onBack, onLaunch,
}: ProgramReadyProps) => (
  <div style={{ maxWidth: 480, margin: '0 auto', padding: 'calc(env(safe-area-inset-top, 44px) + 10px) 20px 120px', animation: 'pd-fade-up 400ms ease both' } as any}>
    <div onClick={onBack} style={{
      width: 42, height: 42, borderRadius: 999, background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', marginBottom: 24,
    } as any}>
      <i className="ri-arrow-left-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }} />
    </div>

    <div style={{ textAlign: 'center', marginBottom: 32 } as any}>
      <div style={{
        width: 64, height: 64, borderRadius: 20, background: `${clr}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 18px', boxShadow: `0 8px 32px ${clr}20`,
      } as any}>
        <i className="ri-rocket-2-line" style={{ fontSize: 30, color: clr }} />
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Pret a commencer !</div>
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 12 } as any}>
        <ProgramPill color={clr} filled>{program.title}</ProgramPill>
        <ProgramPill color={clr}>Mode {mode === 'solo' ? 'solo' : 'equipe'}</ProgramPill>
      </div>
    </div>

    <div style={{ marginBottom: 32 } as any}>
      {[
        { icon: 'ri-calendar-check-line', text: '1 mission par jour basee sur la science' },
        { icon: 'ri-robot-2-line', text: 'Analyse IA Nora personnalisee chaque jour' },
        { icon: 'ri-bar-chart-box-line', text: 'Bilans hebdomadaires et bilan final avant/apres' },
        { icon: 'ri-heart-pulse-line', text: 'Comparaison de vos donnees de sante debut vs fin' },
        ...(mode !== 'solo' ? [{ icon: 'ri-team-line', text: 'Progression visible avec vos amis' }] : []),
      ].map((item, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14,
          animation: `pd-fade-up 400ms ease ${i * 80}ms both`,
        } as any}>
          <div style={{
            width: 36, height: 36, borderRadius: 999,
            background: `${clr}10`, border: `1px solid ${clr}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          } as any}>
            <i className={item.icon} style={{ fontSize: 16, color: clr }} />
          </div>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>{item.text}</span>
        </div>
      ))}
    </div>

    {error && <div style={{ padding: '12px 16px', borderRadius: 999, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', fontSize: 12, color: '#FCA5A5', marginBottom: 16, textAlign: 'center' } as any}>{error}</div>}

    <div data-testid="launch-program-btn" className="pd-btn-primary" onClick={onLaunch}
      style={{
        padding: '18px', borderRadius: 999, textAlign: 'center',
        cursor: starting || hasActiveConflict ? 'not-allowed' : 'pointer',
        background: clr, fontSize: 16, fontWeight: 900, color: '#FFF',
        boxShadow: `0 6px 28px ${clr}35`, transition: 'all 200ms ease',
        opacity: hasActiveConflict ? 0.4 : 1,
      } as any}>
      {starting ? 'Lancement...' : mode !== 'solo' ? 'Creer l\'equipe et commencer' : 'Lancer le programme'}
    </div>
  </div>
);
