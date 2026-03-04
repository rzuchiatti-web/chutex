import React, { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { apiFetch } from '../services/api';

const MOOD = [
  { val: 1, icon: 'ri-emotion-sad-line', label: 'Difficile', color: '#EF4444' },
  { val: 2, icon: 'ri-emotion-unhappy-line', label: 'Bof', color: '#F59E0B' },
  { val: 3, icon: 'ri-emotion-normal-line', label: 'OK', color: '#FCD34D' },
  { val: 4, icon: 'ri-emotion-line', label: 'Bien', color: '#34D399' },
  { val: 5, icon: 'ri-emotion-happy-line', label: 'Super', color: '#10B981' },
];

interface Props { token: string; onStop: () => void; }

function GuidedTask({ task, steps, done, color, onDone, locked }: { task: string; steps: any[]; done: boolean; color: string; onDone: () => void; locked: boolean }) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepsDone, setStepsDone] = useState<boolean[]>(steps ? steps.map(() => false) : []);
  const hasSteps = steps && steps.length > 0;

  const advanceStep = () => {
    if (locked) return;
    const next = [...stepsDone]; next[currentStep] = true; setStepsDone(next);
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else { onDone(); setOpen(false); }
  };

  return (
    <div style={{ marginBottom: 6 } as any}>
      <div onClick={() => { if (hasSteps) setOpen(!open); else if (!locked) onDone(); }}
        style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 16, cursor: 'pointer', background: done ? `${color}06` : open ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.015)', border: `1px solid ${done ? color + '20' : open ? color + '15' : 'rgba(255,255,255,0.04)'}`, transition: 'all 250ms' } as any}>
        <div style={{ width: 26, height: 26, borderRadius: 8, border: `2px solid ${done ? color : 'rgba(255,255,255,0.12)'}`, background: done ? `${color}18` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 250ms' } as any}>
          {done ? <i className="ri-check-line" style={{ fontSize: 15, color }} /> : hasSteps ? <i className="ri-play-mini-fill" style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }} /> : null}
        </div>
        <div style={{ flex: 1 } as any}>
          <span style={{ fontSize: 13, fontWeight: done ? 700 : 500, color: done ? '#FFF' : 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{task}</span>
          {hasSteps && !done && <div style={{ fontSize: 9, color: color, fontWeight: 700, marginTop: 3 }}>{steps.length} etapes guidees</div>}
        </div>
        {done && <i className="ri-checkbox-circle-fill" style={{ fontSize: 14, color: `${color}60`, flexShrink: 0 }} />}
        {hasSteps && !done && <i className={open ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }} />}
      </div>

      {/* Guided steps expanded */}
      {open && hasSteps && !done && (
        <div style={{ marginTop: 4, marginLeft: 20, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}10`, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
          {steps.map((step: any, si: number) => {
            const isActive = si === currentStep;
            const isDone = stepsDone[si];
            const isValidate = step.validate;
            return (
              <div key={si} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0', opacity: si > currentStep ? 0.3 : 1, borderTop: si > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none' } as any}>
                <div style={{ width: 22, height: 22, borderRadius: 7, background: isDone ? `${color}20` : isActive ? `${color}10` : 'rgba(255,255,255,0.03)', border: `1.5px solid ${isDone ? color : isActive ? `${color}50` : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  {isDone ? <i className="ri-check-line" style={{ fontSize: 12, color }} /> : <span style={{ fontSize: 8, fontWeight: 800, color: isActive ? color : 'rgba(255,255,255,0.2)' }}>{si + 1}</span>}
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                    {step.icon && <i className={step.icon} style={{ fontSize: 12, color: isActive ? color : 'rgba(255,255,255,0.2)' }} />}
                    <span style={{ fontSize: 12, color: isActive ? 'rgba(255,255,255,0.7)' : isDone ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.3)', lineHeight: 1.5, fontWeight: isActive ? 600 : 400 }}>{step.instruction}</span>
                  </div>
                  {isActive && isValidate && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 } as any}>
                      <div onClick={advanceStep} style={{ padding: '7px 16px', borderRadius: 999, background: `${color}20`, border: `1px solid ${color}35`, cursor: 'pointer', fontSize: 11, fontWeight: 800, color }} as any>Oui, fait</div>
                      <div onClick={advanceStep} style={{ padding: '7px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)' } as any}>Non, passer</div>
                    </div>
                  )}
                  {isActive && !isValidate && !isDone && (
                    <div onClick={advanceStep} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, padding: '5px 12px', borderRadius: 999, background: `${color}10`, border: `1px solid ${color}20`, cursor: 'pointer', fontSize: 10, fontWeight: 700, color } as any}>
                      Suivant <i className="ri-arrow-right-s-line" style={{ fontSize: 12 }} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ProgramDailyView({ token, onStop }: Props) {
  const [data, setData] = useState<any>(null);
  const [tasksDone, setTasksDone] = useState<string[]>([]);
  const [mood, setMood] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [showStop, setShowStop] = useState(false);
  const [showMission, setShowMission] = useState(false);

  const fetchActive = useCallback(async () => {
    const res = await apiFetch('/api/programs/active', {}, token).catch(() => null);
    if (res) { setData(res); if (res.today_checkin) { setCheckedIn(true); setTasksDone(res.today_checkin.tasks_done || []); } }
  }, [token]);

  useEffect(() => { fetchActive(); }, [fetchActive]);

  const submitCheckin = async () => {
    if (mood === 0 || submitting) return;
    setSubmitting(true);
    await apiFetch('/api/programs/checkin', { method: 'POST', body: JSON.stringify({ mood, tasks_done: tasksDone }) }, token).catch(() => {});
    setCheckedIn(true); setSubmitting(false); fetchActive();
  };

  if (!data?.active || Platform.OS !== 'web') return null;

  const pg = data.program;
  const tt = data.today_tasks || {};
  const cd = data.current_day;
  const dur = pg?.duration_days || 21;
  const c = pg?.color || '#A78BFA';
  const pct = Math.round((cd / dur) * 100);
  const phase = data.current_phase;
  const phases = pg?.phases || [];
  const tasks = tt.tasks || [];
  const guidedSteps = tt.guided_steps || {};
  const taskPct = tasks.length > 0 ? Math.round((tasksDone.length / tasks.length) * 100) : 0;
  const g = { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };
  const R = 54, CIRC = 2 * Math.PI * R, strokeDash = CIRC * (pct / 100);

  return (
    <div data-testid="program-daily-view">
      <style dangerouslySetInnerHTML={{ __html: `@keyframes pdv-ring{from{stroke-dashoffset:${CIRC}}to{stroke-dashoffset:${CIRC - strokeDash}}}@keyframes pdv-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}` }} />

      {/* ═══ HERO ═══ */}
      <div style={{ position: 'relative', padding: '24px 20px 20px', borderRadius: 24, overflow: 'hidden', marginBottom: 14, border: `1px solid ${c}25`, ...g } as any}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${c}12 0%, rgba(0,0,0,0.2) 50%, ${c}06 100%)` } as any} />
        <div style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: 999, background: `radial-gradient(circle, ${c}15, transparent 70%)` } as any} />
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 16 } as any}>
          <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 } as any}>
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle cx="60" cy="60" r={R} fill="none" stroke={c} strokeWidth="8" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC - strokeDash} style={{ animation: 'pdv-ring 1.2s ease forwards', filter: `drop-shadow(0 0 6px ${c}50)` }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } as any}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>J{cd}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>sur {dur}</div>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 0 } as any}>
            <div style={{ padding: '3px 10px', borderRadius: 999, background: `${c}15`, border: `1px solid ${c}30`, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8 } as any}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: c } as any} />
              <span style={{ fontSize: 9, fontWeight: 800, color: c, textTransform: 'uppercase', letterSpacing: 0.5 }}>{phase?.name || 'En cours'}</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 900, color: '#FFF', lineHeight: 1.2, marginBottom: 4 }}>{pg.title}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{pct}% complete</div>
          </div>
        </div>
        {phases.length > 1 && (
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 3, marginTop: 16 } as any}>
            {phases.map((ph: any, i: number) => {
              const isCur = phase?.name === ph.name, isPast = cd > ph.days[1];
              return <div key={i} style={{ flex: ph.days[1] - ph.days[0] + 1, height: 4, borderRadius: 2, background: isPast ? `${c}60` : isCur ? c : 'rgba(255,255,255,0.08)', boxShadow: isCur ? `0 0 8px ${c}40` : 'none' } as any} />;
            })}
          </div>
        )}
      </div>

      {/* ═══ PROTOCOLE + ACTIONS ═══ */}
      <div style={{ padding: '20px', borderRadius: 22, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14, animation: 'pdv-fade 400ms ease 100ms both', ...g } as any}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 } as any}>
          <div style={{ flex: 1 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 } as any}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: `${c}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                <i className="ri-microscope-line" style={{ fontSize: 11, color: c }} />
              </div>
              <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5 }}>Protocole du jour</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', lineHeight: 1.25 }}>{tt.focus || 'Mission du jour'}</div>
          </div>
          {tt.mission && (
            <div onClick={() => setShowMission(!showMission)} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: 4 } as any}>
              <i className={showMission ? 'ri-arrow-up-s-line' : 'ri-article-line'} style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} />
            </div>
          )}
        </div>
        {showMission && tt.mission && (
          <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 14 } as any}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>{tt.mission}</div>
          </div>
        )}

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 } as any}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>Actions a realiser</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
              <div style={{ width: `${taskPct}%`, height: 4, borderRadius: 2, background: taskPct === 100 ? '#10B981' : c, transition: 'width 0.3s' } as any} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 800, color: taskPct === 100 ? '#10B981' : 'rgba(255,255,255,0.25)' }}>{tasksDone.length}/{tasks.length}</span>
          </div>
        </div>

        {/* Guided tasks */}
        {tasks.map((task: string, i: number) => (
          <GuidedTask key={i} task={task} steps={guidedSteps[String(i)] || []} done={tasksDone.includes(task)} color={c} locked={checkedIn}
            onDone={() => { if (!checkedIn && !tasksDone.includes(task)) setTasksDone(prev => [...prev, task]); }} />
        ))}
      </div>

      {/* ═══ CONSEIL NORA ═══ */}
      {tt.tip && (
        <div style={{ padding: '16px 18px', borderRadius: 18, background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.12)', marginBottom: 14, animation: 'pdv-fade 400ms ease 300ms both', ...g } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 } as any}>
            <div style={{ width: 28, height: 28, borderRadius: 9, background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(139,92,246,0.15))', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <span style={{ fontSize: 10, fontWeight: 900, color: '#A78BFA' }}>N</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#A78BFA' }}>Conseil de Nora</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{tt.tip}</div>
        </div>
      )}

      {/* ═══ CHECK-IN ═══ */}
      {!checkedIn ? (
        <div style={{ padding: '20px', borderRadius: 22, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 14, animation: 'pdv-fade 400ms ease 400ms both', ...g } as any}>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>Bilan de la journee</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>Comment vous sentez-vous ?</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 16 } as any}>
            {MOOD.map(m => (
              <div key={m.val} data-testid={`mood-${m.val}`} onClick={() => setMood(m.val)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' } as any}>
                <div style={{ width: 46, height: 46, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: mood === m.val ? `${m.color}15` : 'rgba(255,255,255,0.03)', border: `2px solid ${mood === m.val ? m.color : 'rgba(255,255,255,0.06)'}`, transition: 'all 200ms', transform: mood === m.val ? 'scale(1.1)' : 'scale(1)' } as any}>
                  <i className={m.icon} style={{ fontSize: 22, color: mood === m.val ? m.color : 'rgba(255,255,255,0.2)' }} />
                </div>
                <span style={{ fontSize: 8, fontWeight: 700, color: mood === m.val ? m.color : 'rgba(255,255,255,0.15)' }}>{m.label}</span>
              </div>
            ))}
          </div>
          <div data-testid="submit-checkin" onClick={submitCheckin} style={{ padding: '15px', borderRadius: 16, textAlign: 'center', cursor: mood > 0 ? 'pointer' : 'not-allowed', background: mood > 0 ? `linear-gradient(135deg, ${c}40, ${c}20)` : 'rgba(255,255,255,0.02)', border: `1px solid ${mood > 0 ? c + '40' : 'rgba(255,255,255,0.05)'}`, fontSize: 14, fontWeight: 900, color: mood > 0 ? '#FFF' : 'rgba(255,255,255,0.15)', boxShadow: mood > 0 ? `0 4px 20px ${c}20` : 'none' } as any}>
            {submitting ? 'Envoi...' : 'Valider mon check-in'}
          </div>
        </div>
      ) : (
        <div style={{ padding: '16px 18px', borderRadius: 18, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, ...g } as any}>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
            <i className="ri-checkbox-circle-fill" style={{ fontSize: 20, color: '#10B981' }} />
          </div>
          <div><div style={{ fontSize: 13, fontWeight: 800, color: '#10B981' }}>Check-in valide</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Rendez-vous demain pour la suite du protocole</div></div>
        </div>
      )}

      {/* ═══ ARRETER ═══ */}
      {!showStop ? (
        <div onClick={() => setShowStop(true)} style={{ textAlign: 'center', padding: '10px', fontSize: 11, color: 'rgba(255,255,255,0.15)', cursor: 'pointer' } as any}>Arreter le programme</div>
      ) : (
        <div style={{ padding: '16px', borderRadius: 18, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)', ...g } as any}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#EF4444', marginBottom: 4 }}>Arreter ce programme ?</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>Votre progression sera conservee.</div>
          <div style={{ display: 'flex', gap: 8 } as any}>
            <div onClick={() => setShowStop(false)} style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#FFF' } as any}>Annuler</div>
            <div onClick={async () => { await apiFetch('/api/programs/stop', { method: 'POST' }, token).catch(() => {}); onStop(); }} style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#EF4444' } as any}>Confirmer</div>
          </div>
        </div>
      )}
    </div>
  );
}
