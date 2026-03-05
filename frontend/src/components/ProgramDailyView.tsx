import React, { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import ReactDOM from 'react-dom';
import { apiFetch } from '../services/api';

const MOOD = [
  { val: 1, icon: 'ri-emotion-sad-line', label: 'Difficile', color: '#EF4444' },
  { val: 2, icon: 'ri-emotion-unhappy-line', label: 'Bof', color: '#F59E0B' },
  { val: 3, icon: 'ri-emotion-normal-line', label: 'OK', color: '#FCD34D' },
  { val: 4, icon: 'ri-emotion-line', label: 'Bien', color: '#34D399' },
  { val: 5, icon: 'ri-emotion-happy-line', label: 'Super', color: '#10B981' },
];

interface Props { token: string; onStop: () => void; }

/* ── Full-screen Glass Popup for guided exercises ── */
function ExercisePopup({ task, steps, color, category, onComplete, onClose }: { task: string; steps: any[]; color: string; category?: string; onComplete: (rating: number, notes?: Record<string, string>) => void; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const hasSteps = steps && steps.length > 0;
  const totalSteps = hasSteps ? steps.length : 1;

  const isPhysical = /exercice|tenez|marche|repet|position|etir|respir|yoga|squat|levez|pied|bras|jambe|equilibre/i.test(task);
  const isNutrition = /mang|aliment|repas|sel|sucre|legume|fruit|eau|boire|calorie|portion|cuisine/i.test(task);
  const isMental = /meditat|respir|calm|pleine conscience|visualis|gratitude|journal|ecri|not/i.test(task);

  const evalLabel = isPhysical ? 'Comment etait cet exercice ?' : isNutrition ? 'Avez-vous reussi ?' : isMental ? 'Comment vous sentez-vous ?' : 'Comment ca s\'est passe ?';
  const evalOptions = isPhysical
    ? [{v:1,l:'Tres difficile',i:'ri-close-circle-line',c:'#EF4444'},{v:2,l:'Difficile',i:'ri-arrow-down-circle-line',c:'#F59E0B'},{v:3,l:'Moyen',i:'ri-checkbox-blank-circle-line',c:'#FCD34D'},{v:4,l:'Facile',i:'ri-arrow-up-circle-line',c:'#34D399'},{v:5,l:'Tres facile',i:'ri-checkbox-circle-line',c:'#10B981'}]
    : isNutrition
    ? [{v:1,l:'Pas du tout',i:'ri-close-line',c:'#EF4444'},{v:2,l:'Un peu',i:'ri-subtract-line',c:'#F59E0B'},{v:3,l:'Partiellement',i:'ri-checkbox-blank-circle-line',c:'#FCD34D'},{v:4,l:'Presque',i:'ri-check-line',c:'#34D399'},{v:5,l:'Completement',i:'ri-check-double-line',c:'#10B981'}]
    : [{v:1,l:'1',i:'ri-star-line',c:'#EF4444'},{v:2,l:'2',i:'ri-star-line',c:'#F59E0B'},{v:3,l:'3',i:'ri-star-line',c:'#FCD34D'},{v:4,l:'4',i:'ri-star-line',c:'#34D399'},{v:5,l:'5',i:'ri-star-fill',c:'#10B981'}];

  // Detect if a step needs user input (note, evaluate, record, etc.)
  const needsInput = (step: any) => {
    if (!step?.instruction) return false;
    return /not[eé]|renseign|evalu|ecri|indiqu|enregistr|rempli|combien|quel.*temps|quel.*cot|stabilit/i.test(step.instruction);
  };

  // Detect if a step has choices (button-based answers)
  const stepChoices = step?.choices || null;

  const advanceStep = () => {
    if (currentStep < totalSteps - 1) setCurrentStep(currentStep + 1);
    else setFinished(true);
  };

  const selectChoice = (choice: string) => {
    setNotes(prev => ({ ...prev, [`step_${currentStep}`]: choice }));
    // Auto-advance after selecting
    setTimeout(() => advanceStep(), 300);
  };

  const step = hasSteps ? steps[currentStep] : null;
  const stepNeedsInput = step && needsInput(step);

  const popup = (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
      <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>

        {/* Header: back + close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 } as any}>
          {currentStep > 0 && !finished ? (
            <div onClick={() => setCurrentStep(currentStep - 1)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
              <i className="ri-arrow-left-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} />
            </div>
          ) : <div />}
          <div onClick={onClose} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} />
          </div>
        </div>

        {!finished ? (
          <>
            {/* Progress bar */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 28 } as any}>
              {Array.from({ length: totalSteps }).map((_, si) => (
                <div key={si} style={{ flex: 1, height: 4, borderRadius: 2, background: si < currentStep ? color : si === currentStep ? color : 'rgba(255,255,255,0.06)', transition: 'background 0.3s', boxShadow: si === currentStep ? `0 0 8px ${color}50` : 'none' } as any} />
              ))}
            </div>

            {/* Step content in glass card */}
            <div style={{ borderRadius: 24, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '28px 24px', textAlign: 'center', marginBottom: 20 } as any}>
              {step ? (
                <>
                  <div style={{ width: 64, height: 64, borderRadius: 20, background: `${color}12`, border: `1px solid ${color}25`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 } as any}>
                    <i className={step.icon || 'ri-heart-pulse-line'} style={{ fontSize: 32, color }} />
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#FFF', lineHeight: 1.4, marginBottom: 8 }}>{step.instruction}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Etape {currentStep + 1} sur {totalSteps}</div>

                  {/* Choice buttons for observation steps */}
                  {stepChoices && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16 } as any}>
                      {stepChoices.map((choice: string, ci: number) => {
                        const selected = notes[`step_${currentStep}`] === choice;
                        return (
                          <div key={ci} onClick={() => selectChoice(choice)}
                            style={{ padding: '10px 16px', borderRadius: 14, cursor: 'pointer', background: selected ? `${color}20` : 'rgba(255,255,255,0.06)', border: `1.5px solid ${selected ? color : 'rgba(255,255,255,0.1)'}`, fontSize: 13, fontWeight: selected ? 800 : 600, color: selected ? '#FFF' : 'rgba(255,255,255,0.5)', transition: 'all 200ms' } as any}>
                            {selected && <i className="ri-check-line" style={{ fontSize: 12, marginRight: 6, color }} />}{choice}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ width: 64, height: 64, borderRadius: 20, background: `${color}12`, border: `1px solid ${color}25`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 } as any}>
                    <i className="ri-checkbox-circle-line" style={{ fontSize: 32, color }} />
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#FFF', lineHeight: 1.4 }}>{task}</div>
                </>
              )}
            </div>

            {/* Navigation */}
            <div onClick={advanceStep} style={{ padding: '15px', borderRadius: 16, background: `linear-gradient(135deg, ${color}45, ${color}20)`, border: `1px solid ${color}40`, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', textAlign: 'center', cursor: 'pointer', fontSize: 15, fontWeight: 900, color: '#FFF', boxShadow: `0 4px 20px ${color}25` } as any}>
              {currentStep < totalSteps - 1 ? 'Suivant' : 'Terminer'}
            </div>
          </>
        ) : (
          /* ── Evaluation ── */
          <div style={{ borderRadius: 24, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '28px 24px', textAlign: 'center' } as any}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 } as any}>
              <i className="ri-checkbox-circle-fill" style={{ fontSize: 32, color: '#10B981' }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>Termine</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>{evalLabel}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 } as any}>
              {evalOptions.map(o => (
                <div key={o.v} onClick={() => onComplete(o.v, notes)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '10px 6px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', transition: 'all 200ms', minWidth: 56 } as any}
                onMouseEnter={(e: any) => { e.currentTarget.style.background = `${o.c}15`; e.currentTarget.style.borderColor = `${o.c}30`; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                <i className={o.i} style={{ fontSize: 24, color: o.c }} />
                <span style={{ fontSize: 8, fontWeight: 700, color: o.c }}>{o.l}</span>
              </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render via portal to escape overflow:hidden parents
  if (typeof document !== 'undefined') {
    return ReactDOM.createPortal(popup, document.body);
  }
  return popup;
}

export default function ProgramDailyView({ token, onStop }: Props) {
  const [data, setData] = useState<any>(null);
  const [tasksDone, setTasksDone] = useState<string[]>([]);
  const [taskRatings, setTaskRatings] = useState<Record<string, number>>({});
  const [mood, setMood] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [showStop, setShowStop] = useState(false);
  const [showMission, setShowMission] = useState(false);
  const [openTask, setOpenTask] = useState<number | null>(null);

  const fetchActive = useCallback(async () => {
    const res = await apiFetch('/api/programs/active', {}, token).catch(() => null);
    if (res) {
      setData(res);
      // Load saved progress: checkin > task_progress
      if (res.today_checkin) {
        setCheckedIn(true);
        setTasksDone(res.today_checkin.tasks_done || []);
      } else if (res.task_progress) {
        setTasksDone(res.task_progress.tasks_done || []);
        setTaskRatings(res.task_progress.task_ratings || {});
      }
    }
  }, [token]);

  useEffect(() => { fetchActive(); }, [fetchActive]);

  const completeTask = async (taskIdx: number, rating: number, taskNotes?: Record<string, string>) => {
    const task = tasks[taskIdx];
    if (!tasksDone.includes(task)) setTasksDone(prev => [...prev, task]);
    setTaskRatings(prev => ({ ...prev, [task]: rating }));
    setOpenTask(null);
    // Auto-save to backend with notes
    await apiFetch('/api/programs/save-task', { method: 'POST', body: JSON.stringify({ task, rating, notes: taskNotes || {} }) }, token).catch(() => {});
  };

  const submitCheckin = async () => {
    if (mood === 0 || submitting) return;
    setSubmitting(true);
    await apiFetch('/api/programs/checkin', { method: 'POST', body: JSON.stringify({ mood, tasks_done: tasksDone, task_ratings: taskRatings }) }, token).catch(() => {});
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

        {/* Task rows — click opens full-screen popup */}
        {tasks.map((task: string, i: number) => {
          const done = tasksDone.includes(task);
          const steps = guidedSteps[String(i)] || [];
          const hasSteps = steps.length > 0;
          const rating = taskRatings[task] || 0;
          return (
            <div key={i} data-testid={`task-${i}`} onClick={() => setOpenTask(i)}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 16, marginBottom: 6, cursor: 'pointer', background: done ? `${c}06` : 'rgba(255,255,255,0.015)', border: `1px solid ${done ? c + '20' : 'rgba(255,255,255,0.04)'}`, transition: 'all 250ms' } as any}>
              <div style={{ width: 26, height: 26, borderRadius: 8, border: `2px solid ${done ? c : 'rgba(255,255,255,0.12)'}`, background: done ? `${c}18` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 250ms' } as any}>
                {done ? <i className="ri-check-line" style={{ fontSize: 15, color: c }} /> : <i className={hasSteps ? 'ri-play-mini-fill' : 'ri-arrow-right-s-line'} style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }} />}
              </div>
              <div style={{ flex: 1 } as any}>
                <span style={{ fontSize: 13, fontWeight: done ? 700 : 500, color: done ? '#FFF' : 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{task}</span>
                {hasSteps && !done && <div style={{ fontSize: 9, color: c, fontWeight: 700, marginTop: 3 }}>{steps.length} etapes</div>}
                {done && rating > 0 && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>Evaluation : {rating}/5</div>}
              </div>
              <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.15)' }} />
            </div>
          );
        })}
      </div>

      {/* Exercise popup (portal to body) */}
      {openTask !== null && tasks[openTask] && (
        <ExercisePopup
          task={tasks[openTask]}
          steps={guidedSteps[String(openTask)] || []}
          color={c}
          category={pg?.category}
          onComplete={(r, taskNotes) => completeTask(openTask, r, taskNotes)}
          onClose={() => setOpenTask(null)}
        />
      )}

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
        <div onClick={() => setShowStop(true)} style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 } as any}>
          <i className="ri-stop-circle-line" style={{ fontSize: 14, color: 'rgba(239,68,68,0.4)' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(239,68,68,0.4)' }}>Arreter le programme</span>
        </div>
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
