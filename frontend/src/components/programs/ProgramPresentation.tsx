import React from 'react';
import { ProgramPill } from './ProgramPill';

const METRIC_ICONS: Record<string, string> = {
  sleep_quality: 'ri-moon-line', sleep_duration_min: 'ri-time-line', deep_sleep_min: 'ri-zzz-line',
  heart_rate: 'ri-heart-pulse-line', hrv: 'ri-pulse-line', stress_level: 'ri-mental-health-line',
  blood_pressure: 'ri-water-flash-line', steps: 'ri-footprint-line', calories: 'ri-fire-line',
  weight: 'ri-scales-3-line', body_fat_pct: 'ri-body-scan-line', muscle_pct: 'ri-boxing-line',
  recovery_score: 'ri-battery-charge-line',
};

const METRIC_LABELS: Record<string, string> = {
  sleep_quality: 'Qualité du sommeil', sleep_duration_min: 'Durée de sommeil', deep_sleep_min: 'Sommeil profond',
  heart_rate: 'Fréquence cardiaque', hrv: 'HRV', stress_level: 'Stress',
  blood_pressure: 'Tension arterielle', steps: 'Pas quotidiens', calories: 'Depense calorique',
  weight: 'Poids', body_fat_pct: 'Masse grasse', muscle_pct: 'Masse musculaire', recovery_score: 'Récupération',
};

interface ProgramPresentationProps {
  program: any;
  clr: string;
  isDark?: boolean;
  hasActiveConflict: boolean;
  hasOnboarding: boolean;
  error: string;
  onStartSolo: () => void;
  onStartTeam: () => void;
  onBack: () => void;
}

export const ProgramPresentation = ({
  program, clr, isDark = true, hasActiveConflict, hasOnboarding, error, onStartSolo, onStartTeam, onBack,
}: ProgramPresentationProps) => {
  const coverImage = program.cover_image || '';
  // Text on hero image is ALWAYS white for readability
  const T = isDark ? '#FFF' : '#1A1A2E';
  const S = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.55)';
  const S2 = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)';
  const S3 = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';
  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const cardBorder = isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)';
  // Light mode uses a slightly gray card for better contrast
  const lightCardBg = isDark ? 'rgba(255,255,255,0.03)' : '#F2F2F4';

  return (
    <div data-testid="program-detail-step-0" style={{ animation: 'pd-fade-up 500ms ease both' } as any}>
      {/* Hero Section with Image */}
      <div style={{ position: 'relative', width: '100%', height: 420, overflow: 'hidden' } as any}>
        {coverImage && (
          <img src={coverImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' } as any} />
        )}
        {!coverImage && (
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse at 50% 30%, ${clr}20 0%, ${isDark ? 'rgba(10,10,15,1)' : 'rgba(255,255,255,1)'} 70%)`,
          } as any} />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: coverImage
            ? (isDark
              ? `linear-gradient(180deg, rgba(10,10,15,0) 0%, rgba(10,10,15,0.15) 30%, rgba(10,10,15,0.6) 65%, rgba(10,10,15,0.95) 85%, rgba(10,10,15,1) 100%)`
              : `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.35) 65%, rgba(0,0,0,0.7) 85%, rgba(0,0,0,0.85) 100%)`)
            : 'transparent',
        } as any} />

        {/* Back button */}
        <div data-testid="program-detail-back-button" onClick={onBack} style={{
          position: 'absolute', top: '70px', left: 20, zIndex: 10,
          width: 42, height: 42, borderRadius: 999, background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        } as any}>
          <i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} />
        </div>

        {/* Hero Content */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 24px 24px', zIndex: 5 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 } as any}>
            <div style={{
              width: 50, height: 50, borderRadius: 16,
              background: `${clr}25`, border: `1.5px solid ${clr}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            } as any}>
              <i className={program.icon} style={{ fontSize: 24, color: clr }} />
            </div>
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', letterSpacing: -0.5, lineHeight: 1.2, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{program.title}</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 } as any}>
            <ProgramPill color={clr} filled>{program.duration_days} jours</ProgramPill>
            {program.effort && <ProgramPill color={clr}>{program.effort}</ProgramPill>}
            {program.difficulty && <ProgramPill color={clr}>{program.difficulty}</ProgramPill>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 20px 120px' } as any}>
        <div style={{ fontSize: 14, color: S, lineHeight: 1.7, margin: '20px 0 24px', animation: 'pd-fade-up 500ms ease 100ms both' } as any}>
          {program.subtitle}
        </div>

        {hasActiveConflict && (
          <div data-testid="program-active-conflict-warning" style={{
            padding: '14px 16px', borderRadius: 16,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12,
          } as any}>
            <i className="ri-error-warning-line" style={{ fontSize: 18, color: '#EF4444', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#FCA5A5', marginBottom: 3 }}>Programme actif en cours</div>
              <div style={{ fontSize: 11, color: S, lineHeight: 1.4 }}>Terminez ou arretez le programme en cours pour lancer celui-ci.</div>
            </div>
          </div>
        )}

        {/* Quick Stats Row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24, animation: 'pd-fade-up 500ms ease 150ms both' } as any}>
          <div style={{ flex: 1, padding: '16px', borderRadius: 18, background: cardBg, border: cardBorder } as any}>
            <div style={{ fontSize: 9, color: S2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Durée</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: T }}>{program.duration_days}<span style={{ fontSize: 13, fontWeight: 600, color: S2, marginLeft: 4 }}>jours</span></div>
          </div>
          <div style={{ flex: 1, padding: '16px', borderRadius: 18, background: cardBg, border: cardBorder } as any}>
            <div style={{ fontSize: 9, color: S2, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Phases</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: T }}>{program.phases?.length || 3}<span style={{ fontSize: 13, fontWeight: 600, color: S2, marginLeft: 4 }}>etapes</span></div>
          </div>
        </div>

        <div style={{ fontSize: 13, color: S, lineHeight: 1.8, marginBottom: 28, animation: 'pd-fade-up 500ms ease 200ms both' } as any}>
          {program.description}
        </div>

        {/* Science box */}
        {program.benefits?.[0] && (
          <div style={{
            padding: '18px 20px', borderRadius: 20,
            background: `${clr}06`, border: `1px solid ${clr}15`,
            marginBottom: 28, animation: 'pd-fade-up 500ms ease 250ms both',
          } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } as any}>
              <div style={{ width: 28, height: 28, borderRadius: 9, background: `${clr}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                <i className="ri-flask-line" style={{ fontSize: 14, color: clr }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, color: clr, textTransform: 'uppercase', letterSpacing: 1 }}>Science en bref</span>
            </div>
            <div style={{ fontSize: 13, color: S, lineHeight: 1.6 }}>{program.benefits[0]}</div>
          </div>
        )}

        {/* Benefits */}
        {(program.benefits || []).length > 1 && (
          <div style={{ marginBottom: 28, animation: 'pd-fade-up 500ms ease 300ms both' } as any}>
            <div style={{ fontSize: 10, fontWeight: 800, color: S3, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>Benefices prouves</div>
            {program.benefits.slice(1).map((b: string, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 } as any}>
                <div style={{
                  width: 24, height: 24, borderRadius: 999, flexShrink: 0, marginTop: 1,
                  background: `${clr}12`, border: `1px solid ${clr}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                } as any}>
                  <i className="ri-check-line" style={{ fontSize: 12, color: clr }} />
                </div>
                <span style={{ fontSize: 13, color: S, lineHeight: 1.5 }}>{b}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tracked Metrics */}
        {(program.tracked_metrics || []).length > 0 && (
          <div style={{ marginBottom: 28, animation: 'pd-fade-up 500ms ease 350ms both' } as any}>
            <div style={{ fontSize: 10, fontWeight: 800, color: S3, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>Suivi par Nora</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 } as any}>
              {program.tracked_metrics.map((m: string, i: number) => (
                <ProgramPill key={i} color={clr} filled>
                  <i className={METRIC_ICONS[m] || 'ri-bar-chart-line'} style={{ fontSize: 13 }} />
                  {METRIC_LABELS[m] || m.replace(/_/g, ' ')}
                </ProgramPill>
              ))}
            </div>
          </div>
        )}

        {/* Phases */}
        {(program.phases || []).length > 0 && (
          <div style={{ marginBottom: 32, animation: 'pd-fade-up 500ms ease 400ms both' } as any}>
            <div style={{ fontSize: 10, fontWeight: 800, color: S3, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>Phases du programme</div>
            {program.phases.map((ph: any, i: number) => (
              <div key={i} className="pd-phase-card" style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '16px',
                borderRadius: 18, background: lightCardBg, border: cardBorder,
                marginBottom: 8, transition: 'all 200ms ease', cursor: 'default',
                animation: `pd-fade-up 400ms ease ${450 + i * 80}ms both`,
              } as any}>
                <div style={{
                  width: 40, height: 40, borderRadius: 13,
                  background: `${ph.color || clr}12`, border: `1.5px solid ${ph.color || clr}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 900, color: ph.color || clr, flexShrink: 0,
                } as any}>{i + 1}</div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T, marginBottom: 3 }}>{ph.name}</div>
                  <div style={{ fontSize: 11, color: S2, lineHeight: 1.4 }}>Jours {ph.days[0]}-{ph.days[1]} · {ph.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Medical Disclaimer */}
        {program.medical_disclaimer && (
          <div style={{
            padding: '14px 16px', borderRadius: 16,
            background: isDark ? 'rgba(245,158,11,0.05)' : 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.12)',
            fontSize: 11, color: S, lineHeight: 1.6, marginBottom: 32,
            display: 'flex', alignItems: 'flex-start', gap: 10,
            animation: 'pd-fade-up 500ms ease 600ms both',
          } as any}>
            <i className="ri-stethoscope-line" style={{ fontSize: 15, color: '#F59E0B', marginTop: 1, flexShrink: 0 }} />
            <span>{program.medical_disclaimer}</span>
          </div>
        )}

        {/* CTA Buttons */}
        <div style={{ animation: 'pd-fade-up 500ms ease 650ms both' } as any}>
          <div data-testid="start-solo-btn" className="pd-btn-primary" onClick={onStartSolo}
            style={{
              padding: '18px', borderRadius: 999, textAlign: 'center',
              cursor: hasActiveConflict ? 'not-allowed' : 'pointer',
              background: clr, fontSize: 15, fontWeight: 900, color: '#FFF',
              marginBottom: 12, opacity: hasActiveConflict ? 0.4 : 1,
              boxShadow: `0 4px 24px ${clr}35`,
              transition: 'all 200ms ease', letterSpacing: 0.3,
            } as any}>
            Commencer seul
          </div>

          <div data-testid="start-team-btn" className="pd-btn-secondary" onClick={onStartTeam}
            style={{
              padding: '16px', borderRadius: 999, textAlign: 'center',
              cursor: hasActiveConflict ? 'not-allowed' : 'pointer',
              background: 'transparent', border: isDark ? '1.5px solid rgba(255,255,255,0.15)' : '1.5px solid rgba(0,0,0,0.12)',
              fontSize: 14, fontWeight: 700, color: T,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: hasActiveConflict ? 0.4 : 1, transition: 'all 200ms ease',
            } as any}>
            <i className="ri-team-line" style={{ fontSize: 17 }} />Le faire avec un ami
          </div>

          {error && <div style={{ padding: '12px 16px', borderRadius: 999, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', fontSize: 12, color: '#FCA5A5', marginTop: 14, textAlign: 'center' } as any}>{error}</div>}
        </div>
      </div>
    </div>
  );
};
