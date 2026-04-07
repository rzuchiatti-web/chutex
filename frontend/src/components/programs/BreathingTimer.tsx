import { useI18n } from '../../context/I18nContext';
import React, { useState, useEffect, useRef } from 'react';

interface Props {
  pattern: string; // "4-7-8" or "5-5"
  durationSec: number;
  color: string;
  onComplete: () => void;
  onClose: () => void;
}

export default function BreathingTimer({ pattern, durationSec, color, onComplete, onClose }: Props) {
  const { t } = useI18n();
  const parts = pattern.split('-').map(Number);
  const inhale = parts[0] || 4;
  const hold = parts.length === 3 ? parts[1] : 0;
  const exhale = parts.length === 3 ? parts[2] : parts[1] || 4;
  const cycleLen = inhale + hold + exhale;

  const [active, setActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [phaseTime, setPhaseTime] = useState(0);
  const intervalRef = useRef<any>(null);

  const totalCycles = Math.max(1, Math.round(durationSec / cycleLen));
  const currentCycle = Math.floor(elapsed / cycleLen) + 1;
  const posInCycle = elapsed % cycleLen;
  const phase = posInCycle < inhale ? 'inhale' : posInCycle < inhale + hold ? 'hold' : 'exhale';
  const phaseProgress = phase === 'inhale' ? posInCycle / inhale
    : phase === 'hold' ? (posInCycle - inhale) / hold
    : (posInCycle - inhale - hold) / exhale;

  const circleScale = phase === 'inhale' ? 0.5 + phaseProgress * 0.5
    : phase === 'hold' ? 1
    : 1 - phaseProgress * 0.5;

  useEffect(() => {
    if (!active) return;
    intervalRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next >= totalCycles * cycleLen) {
          clearInterval(intervalRef.current);
          setTimeout(onComplete, 500);
          return prev;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [active]);

  useEffect(() => {
    if (phase === 'inhale') setPhaseTime(inhale - posInCycle);
    else if (phase === 'hold') setPhaseTime(hold - (posInCycle - inhale));
    else setPhaseTime(exhale - (posInCycle - inhale - hold));
  }, [elapsed]);

  const phaseLabel = phase === 'inhale' ? 'Inspirez' : phase === 'hold' ? 'Retenez' : 'Expirez';
  const phaseIcon = phase === 'inhale' ? 'ri-arrow-up-line' : phase === 'hold' ? 'ri-pause-line' : 'ri-arrow-down-line';
  const progressPct = (elapsed / (totalCycles * cycleLen)) * 100;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)' } as any}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bt-pulse { 0%,100% { box-shadow: 0 0 40px ${color}20; } 50% { box-shadow: 0 0 80px ${color}40, 0 0 120px ${color}15; } }
        @keyframes bt-ring { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bt-fade { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />

      {/* Close */}
      <div onClick={onClose} style={{ position: 'absolute', top: 80, right: 24, width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 } as any}>
        <i className="ri-close-line" style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)' }} />
      </div>

      {!active ? (
        <div data-testid="breathing-start" style={{ textAlign: 'center', animation: 'bt-fade 500ms ease' } as any}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', background: `${color}10`, border: `2px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' } as any}>
            <i className="ri-lungs-line" style={{ fontSize: 48, color }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Exercice de respiration</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
            Technique {pattern.replace(/-/g, ' - ')}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginBottom: 32 }}>
            {totalCycles} cycles • {Math.round(durationSec / 60)} min
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' } as any}>
            {[{l: `Inspirez ${inhale}s`, i: 'ri-arrow-up-line', c: '#60A5FA'},
              ...(hold > 0 ? [{l: `Retenez ${hold}s`, i: 'ri-pause-line', c: '#FBBF24'}] : []),
              {l: `Expirez ${exhale}s`, i: 'ri-arrow-down-line', c: '#34D399'}
            ].map((p, idx) => (
              <div key={idx} style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 6 } as any}>
                <i className={p.i} style={{ fontSize: 14, color: p.c }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{p.l}</span>
              </div>
            ))}
          </div>
          <div onClick={() => setActive(true)} style={{ padding: '16px 48px', borderRadius: 18, background: `linear-gradient(135deg, ${color}40, ${color}20)`, border: `1px solid ${color}40`, cursor: 'pointer', fontSize: 16, fontWeight: 900, color: '#FFF', boxShadow: `0 8px 32px ${color}30` } as any}>
            Commencer
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', animation: 'bt-fade 400ms ease' } as any}>
          {/* Animated circle */}
          <div style={{ position: 'relative', width: 220, height: 220, margin: '0 auto 32px' } as any}>
            {/* Outer ring */}
            <svg width="220" height="220" style={{ position: 'absolute', animation: 'bt-ring 20s linear infinite' } as any}>
              <circle cx="110" cy="110" r="105" fill="none" stroke={`${color}10`} strokeWidth="2" />
              <circle cx="110" cy="110" r="105" fill="none" stroke={color} strokeWidth="2"
                strokeDasharray={`${progressPct * 6.6} ${660 - progressPct * 6.6}`}
                strokeLinecap="round" transform="rotate(-90 110 110)" style={{ transition: 'stroke-dasharray 1s linear' }} />
            </svg>
            {/* Breathing circle */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              width: 160, height: 160,
              transform: `translate(-50%, -50%) scale(${circleScale})`,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${color}25 0%, ${color}08 70%, transparent 100%)`,
              border: `2px solid ${color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: 'bt-pulse 3s ease-in-out infinite',
            } as any}>
              <div style={{ textAlign: 'center' } as any}>
                <i className={phaseIcon} style={{ fontSize: 32, color, marginBottom: 4, display: 'block' }} />
                <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{phaseLabel}</div>
                <div style={{ fontSize: 36, fontWeight: 900, color, marginTop: 2 }}>{phaseTime}</div>
              </div>
            </div>
          </div>

          {/* Cycle counter */}
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
            Cycle {Math.min(currentCycle, totalCycles)} / {totalCycles}
          </div>

          {/* Progress bar */}
          <div style={{ width: 200, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', margin: '0 auto', overflow: 'hidden' } as any}>
            <div style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${color}, ${color}80)`, width: `${progressPct}%`, transition: 'width 1s linear' }} />
          </div>
        </div>
      )}
    </div>
  );
}
